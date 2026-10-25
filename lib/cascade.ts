import { Leg, LegStatus, Trip } from '@/types';

export type CascadeChange = {
  legId: string;
  reason: string;
};

export type CascadeResult = {
  trip: Trip;
  changes: CascadeChange[];
};

function addMinutes(value: string, minutes: number): string {
  return new Date(new Date(value).getTime() + minutes * 60 * 1000).toISOString();
}

function bufferFor(previous: Leg, next: Leg): number {
  if (previous.type === 'flight' && next.type === 'bus') return 90;
  if (previous.type === 'bus' && next.type === 'cab') return 20;
  if (previous.type === 'cab' && next.type === 'hotel') return 0;
  return 0;
}

function statusForChangedLeg(status: LegStatus): LegStatus {
  return status === 'cancelled' ? 'cancelled' : 'delayed';
}

export function cascadeTrip(
  trip: Trip,
  changedLegId: string,
  delayMinutes: number,
  changedStatus: LegStatus = 'delayed',
): CascadeResult {
  const changedIndex = trip.legs.findIndex((leg) => leg.id === changedLegId);
  if (changedIndex < 0) return { trip, changes: [] };

  const legs = trip.legs.map((leg) => ({ ...leg }));
  const changed = legs[changedIndex];
  changed.status = statusForChangedLeg(changedStatus);
  changed.delayMinutes = delayMinutes;
  if (changedStatus === 'delayed' && delayMinutes > 0) {
    changed.endTime = addMinutes(changed.endTime, delayMinutes);
  }

  const changes: CascadeChange[] = [];
  let previous = changed;
  let disruptedArrival = changedStatus === 'cancelled'
    ? changed.startTime
    : changed.endTime;
  let blocked = changedStatus === 'cancelled';

  for (let index = changedIndex + 1; index < legs.length; index += 1) {
    const leg = legs[index];
    const buffer = bufferFor(previous, leg);
    const threshold = new Date(new Date(disruptedArrival).getTime() + buffer * 60 * 1000);
    const missesConnection = new Date(leg.startTime) < threshold;

    if (blocked || missesConnection) {
      leg.status = 'at_risk';
      leg.riskReason = blocked
        ? `${previous.type} is already unavailable, so this leg cannot be reached.`
        : `Arrival ${formatClock(disruptedArrival)} + ${buffer}m buffer is after ${formatClock(leg.startTime)} departure.`;
      changes.push({ legId: leg.id, reason: leg.riskReason });
      blocked = true;
    }

    previous = leg;
    disruptedArrival = leg.endTime;
  }

  return { trip: { ...trip, legs }, changes };
}

function formatClock(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function minimumBufferMinutes(previous: Leg, next: Leg): number {
  return bufferFor(previous, next);
}
