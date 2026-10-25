import { inventory, legFromInventory } from '@/data/trips';
import { calculateRefunds, totalRefund } from '@/lib/refunds';
import { Leg, RecoveryPlan, Trip } from '@/types';

function sumPrice(legs: Leg[]): number {
  return legs.reduce((total, leg) => total + leg.price, 0);
}

function recoveryLeg(itemId: string, suffix: string): Leg {
  return legFromInventory(inventory.find((item) => item.id === itemId)!, `recovery-${suffix}-${itemId}`);
}

function findDirectFlight(hotel: Leg): Leg | null {
  const item = inventory.find((candidate) => {
    return candidate.type === 'flight'
      && candidate.to === 'Pune Airport'
      && new Date(candidate.endTime) < new Date(hotel.startTime);
  });
  return item ? recoveryLeg(item.id, 'flight') : null;
}

function findReplacementCab(flight: Leg, hotel: Leg): Leg | null {
  const item = inventory.find((candidate) => {
    return candidate.type === 'cab'
      && candidate.from === flight.to
      && new Date(candidate.endTime) <= new Date(hotel.startTime);
  });
  return item ? recoveryLeg(item.id, 'cab') : null;
}

function findReplacementBus(hotel: Leg): Leg | null {
  const item = inventory.find((candidate) => {
    return candidate.type === 'bus'
      && candidate.to === 'Pune Station'
      && new Date(candidate.endTime) < new Date(hotel.startTime);
  });
  return item ? recoveryLeg(item.id, 'bus') : null;
}

export function buildRecoveryPlan(trip: Trip, changedLegId: string, eventAt: string): RecoveryPlan | null {
  const changedIndex = trip.legs.findIndex((leg) => leg.id === changedLegId);
  const hotel = trip.legs.find((leg) => leg.type === 'hotel');
  const changed = trip.legs[changedIndex];
  if (changedIndex < 0 || !hotel) return null;

  const removedLegs = trip.legs
    .slice(changedIndex)
    .filter((leg) => leg.type !== 'hotel' && (leg.id === changedLegId || leg.status === 'at_risk'));
  const refunds = calculateRefunds(trip, changedLegId, eventAt);
  const newLegs: Leg[] = [];

  if (changed.type === 'flight') {
    const flight = findDirectFlight(hotel);
    const cab = flight ? findReplacementCab(flight, hotel) : null;
    if (flight) newLegs.push(flight);
    if (cab) newLegs.push(cab);
  } else if (changed.type === 'bus') {
    const bus = findReplacementBus(hotel);
    if (bus) newLegs.push(bus);
    if (bus) {
      const cab = trip.legs.find((leg) => leg.type === 'cab');
      if (cab) newLegs.push({ ...cab, id: `recovery-cab-${cab.id}`, status: 'recovered' });
    }
  }

  if (!newLegs.length) return null;
  return {
    removedLegs: removedLegs.map((leg) => leg.id),
    newLegs,
    refunds,
    newCost: sumPrice(newLegs),
    netPayable: Math.max(0, sumPrice(newLegs) - totalRefund(refunds)),
  };
}
