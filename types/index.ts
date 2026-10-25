export type LegType = 'flight' | 'bus' | 'cab' | 'hotel';
export type LegStatus = 'ok' | 'delayed' | 'cancelled' | 'at_risk' | 'recovered';

export type RefundWindow = {
  hoursBefore: number;
  refundPct: number;
};

export type RefundPolicy = {
  operatorFaultRefundPct: number;
  windows: RefundWindow[];
};

export type Leg = {
  id: string;
  type: LegType;
  from: string;
  to: string;
  startTime: string;
  endTime: string;
  price: number;
  status: LegStatus;
  delayMinutes: number;
  refundPolicy: RefundPolicy;
  operator: string;
  code: string;
  riskReason?: string;
  recoverySourceId?: string;
};

export type Trip = {
  id: string;
  title: string;
  legs: Leg[];
};

export type RefundLine = {
  legId: string;
  legLabel: string;
  pct: number;
  amount: number;
  reason: string;
};

export type RecoveryPlan = {
  removedLegs: string[];
  newLegs: Leg[];
  refunds: RefundLine[];
  newCost: number;
  netPayable: number;
};

export type InventoryItem = {
  id: string;
  type: LegType;
  from: string;
  to: string;
  startTime: string;
  endTime: string;
  price: number;
  operator: string;
  code: string;
  refundPolicy: RefundPolicy;
  terms: string;
};

export type DisruptionKind = 'flight_delayed' | 'flight_cancelled' | 'bus_delayed' | null;

export type SimulationState = {
  disruption: DisruptionKind;
  disruptionAt: string | null;
  recoveryPlan: RecoveryPlan | null;
  planApproved: boolean;
  livePositionMinutes: number;
};
