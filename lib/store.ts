import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { initialTrip } from '@/data/trips';
import { cascadeTrip } from '@/lib/cascade';
import { notifyDisruption } from '@/lib/notifications';
import { buildRecoveryPlan } from '@/lib/recovery';
import { DisruptionKind, SimulationState, Trip } from '@/types';

const initialSimulation: SimulationState = {
  disruption: null,
  disruptionAt: null,
  recoveryPlan: null,
  planApproved: false,
  livePositionMinutes: 0,
};

type TetherStore = {
  trip: Trip;
  simulation: SimulationState;
  delayFlight: () => void;
  cancelFlight: () => void;
  delayBus: () => void;
  resetTrip: () => void;
  approveRecovery: () => void;
  bookTrip: (trip: Trip) => void;
  advanceLivePosition: () => void;
};

function eventTimeFor(trip: Trip, kind: DisruptionKind): string {
  const bus = trip.legs.find((leg) => leg.type === 'bus');
  const changed = trip.legs.find((leg) => leg.type === (kind === 'bus_delayed' ? 'bus' : 'flight'));
  if (kind === 'bus_delayed' && changed) {
    return new Date(new Date(changed.startTime).getTime() - 90 * 60 * 1000).toISOString();
  }
  if (bus) return new Date(new Date(bus.startTime).getTime() - 3 * 60 * 60 * 1000).toISOString();
  return changed?.startTime ?? new Date().toISOString();
}

function applyDisruption(
  set: (update: Partial<TetherStore>) => void,
  get: () => TetherStore,
  kind: Exclude<DisruptionKind, null>,
  delayMinutes: number,
  changedStatus: 'delayed' | 'cancelled',
): void {
  const current = get();
  const changedType = kind === 'bus_delayed' ? 'bus' : 'flight';
  const changed = current.trip.legs.find((leg) => leg.type === changedType);
  if (!changed) return;

  const result = cascadeTrip(current.trip, changed.id, delayMinutes, changedStatus);
  const disruptionAt = eventTimeFor(result.trip, kind);
  const recoveryPlan = buildRecoveryPlan(result.trip, changed.id, disruptionAt);
  set({
    trip: result.trip,
    simulation: {
      disruption: kind,
      disruptionAt,
      recoveryPlan,
      planApproved: false,
      livePositionMinutes: 0,
    },
  });

  void notifyDisruption(kind === 'flight_cancelled'
    ? `${changed.code} was cancelled. A recovery plan is ready.`
    : `${changed.code} has a disruption. Downstream bookings may be at risk.`);
}

export const useTetherStore = create<TetherStore>()(
  persist(
    (set, get) => ({
      trip: initialTrip,
      simulation: initialSimulation,
      delayFlight: () => applyDisruption(set, get, 'flight_delayed', 240, 'delayed'),
      cancelFlight: () => applyDisruption(set, get, 'flight_cancelled', 0, 'cancelled'),
      delayBus: () => applyDisruption(set, get, 'bus_delayed', 90, 'delayed'),
      resetTrip: () => set({ trip: initialTrip, simulation: initialSimulation }),
      approveRecovery: () => {
        const { trip, simulation } = get();
        if (!simulation.recoveryPlan) return;
        const removed = new Set(simulation.recoveryPlan.removedLegs);
        const oldLegs = trip.legs.map((leg) => removed.has(leg.id)
          ? { ...leg, status: 'cancelled' as const, riskReason: 'Cancelled, refund requested' }
          : leg);
        const hotelIndex = oldLegs.findIndex((leg) => leg.type === 'hotel');
        const nextLegs = hotelIndex < 0
          ? [...oldLegs, ...simulation.recoveryPlan.newLegs.map((leg) => ({ ...leg, status: 'recovered' as const }))]
          : [
              ...oldLegs.slice(0, hotelIndex),
              ...simulation.recoveryPlan.newLegs.map((leg) => ({ ...leg, status: 'recovered' as const })),
              ...oldLegs.slice(hotelIndex),
            ];
        set({
          trip: { ...trip, legs: nextLegs },
          simulation: { ...simulation, planApproved: true },
        });
      },
      bookTrip: (trip) => set({ trip, simulation: initialSimulation }),
      advanceLivePosition: () => {
        const { trip, simulation } = get();
        if (!simulation.disruption || simulation.planApproved) return;
        const flight = trip.legs.find((leg) => leg.type === 'flight');
        const max = flight?.delayMinutes ?? 0;
        if (max <= 0) return;
        set({ simulation: { ...simulation, livePositionMinutes: Math.min(max, simulation.livePositionMinutes + 1) } });
      },
    }),
    {
      name: 'tether-trip-state',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
