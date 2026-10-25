import { LegStatus, LegType } from '@/types';

export function formatRupees(value: number): string {
  return `Rs ${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function formatLegTime(start: string, end: string): string {
  return `${formatShortDate(start)}  ${formatTime(start)} - ${formatTime(end)}`;
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return `${hours}h ${String(remainder).padStart(2, '0')}m`;
}

export function labelForType(type: LegType): string {
  return type === 'cab' ? 'CAB' : type.toUpperCase();
}

export function labelForStatus(status: LegStatus): string {
  switch (status) {
    case 'at_risk':
      return 'AT RISK';
    case 'cancelled':
      return 'CANCELLED';
    case 'delayed':
      return 'DELAYED';
    case 'recovered':
      return 'RECOVERED';
    default:
      return 'ON TIME';
  }
}

export function titleCaseType(type: LegType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
