import { Leg, RefundLine, Trip } from '@/types';

function hoursUntil(startTime: string, eventAt: string): number {
  return Math.max(0, (new Date(startTime).getTime() - new Date(eventAt).getTime()) / 3600000);
}

function windowRefundPct(leg: Leg, eventAt: string): number {
  const hours = hoursUntil(leg.startTime, eventAt);
  const matchingWindow = [...leg.refundPolicy.windows]
    .sort((a, b) => a.hoursBefore - b.hoursBefore)
    .find((window) => hours <= window.hoursBefore);
  return matchingWindow?.refundPct ?? 0;
}

function legLabel(leg: Leg): string {
  return `${leg.type === 'cab' ? 'Cab' : leg.type.charAt(0).toUpperCase() + leg.type.slice(1)} ${leg.code}`;
}

export function calculateRefunds(trip: Trip, changedLegId: string, eventAt: string): RefundLine[] {
  const changedIndex = trip.legs.findIndex((leg) => leg.id === changedLegId);
  if (changedIndex < 0) return [];

  return trip.legs.slice(changedIndex).filter((leg) => {
    return leg.id === changedLegId || leg.status === 'at_risk';
  }).map((leg) => {
    const isOperatorFault = leg.id === changedLegId;
    const pct = isOperatorFault ? leg.refundPolicy.operatorFaultRefundPct : windowRefundPct(leg, eventAt);
    const hours = Math.round(hoursUntil(leg.startTime, eventAt));
    return {
      legId: leg.id,
      legLabel: legLabel(leg),
      pct,
      amount: Math.round(leg.price * pct / 100),
      reason: isOperatorFault
        ? 'operator fault'
        : `cancellation window, ${hours}h before departure`,
    };
  });
}

export function totalRefund(refunds: RefundLine[]): number {
  return refunds.reduce((total, refund) => total + refund.amount, 0);
}
