import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const COLORS = {
  alabaster: '#F7F7F5',
  white: '#FFFFFF',
  border: '#E4E4E0',
  black: '#111111',
  muted: '#6B6B67',
  subtle: '#92928C',
  orange: '#EA580C',
  orangeSoft: '#FFF1EB',
  green: '#15803D',
  greenSoft: '#DCFCE7',
  amber: '#B45309',
  amberSoft: '#FEF3C7',
  red: '#B91C1C',
  redSoft: '#FEE2E2',
  blue: '#1D4ED8',
  blueSoft: '#DBEAFE',
  darkPanel: '#181816',
};

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace' });

const CALL_SCRIPT =
  'Hi! Your 6:00 PM flight is delayed by 4 hours based on live aircraft tracking, which means you will miss your 9:30 PM bus. I have found an alternative 7:00 PM flight, calculated your refund from the old ticket, and adjusted your cab pickup. Please open the app to review and tap Approve.';

const TRIP_ITEMS = [
  {
    id: 'flight',
    category: '[Flight]',
    icon: 'send',
    title: 'IndiGo 6E-402',
    route: 'BLR to GOI',
    schedule: '06:00 PM - 07:30 PM',
    fare: '₹4,000',
    rule: '100% Refundable on Operator Delay > 2h',
  },
  {
    id: 'bus',
    category: '[Bus]',
    icon: 'truck',
    title: 'Kadamba Volvo AC',
    route: 'Airport to Panjim ISBT',
    schedule: '09:30 PM - 10:30 PM',
    fare: '₹800',
    rule: '75% Refund if cancelled > 2h early',
  },
  {
    id: 'cab',
    category: '[Cab]',
    icon: 'navigation',
    title: 'Pre-booked Sedan',
    route: 'Panjim ISBT to Resort',
    schedule: '10:40 PM pickup',
    fare: '₹600',
    rule: 'Free Pickup Reschedule',
  },
  {
    id: 'hotel',
    category: '[Hotel]',
    icon: 'home',
    title: 'Taj Cidade de Goa',
    route: 'Goa',
    schedule: '11:00 PM Check-in',
    fare: '₹6,500',
    rule: 'Late Check-in Lock',
  },
];

const STATUS_META = {
  neutral: { label: 'MONITORING', color: COLORS.muted, background: '#F1F1EE' },
  confirmed: { label: 'CONFIRMED', color: COLORS.green, background: COLORS.greenSoft },
  amber: { label: 'CASCADE RISK', color: COLORS.amber, background: COLORS.amberSoft },
  disrupted: { label: 'DISRUPTED', color: COLORS.red, background: COLORS.redSoft },
};

function Icon({ name, size = 18, color = COLORS.black, strokeWidth = 1.8 }) {
  return <Feather name={name} size={size} color={color} strokeWidth={strokeWidth} />;
}

function Badge({ label, tone = 'neutral', compact = false }) {
  const meta = STATUS_META[tone] || STATUS_META.neutral;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: meta.background },
      ]}
    >
      <View style={[styles.badgeDot, { backgroundColor: meta.color }]} />
      <Text style={[styles.badgeText, compact && styles.badgeTextCompact, { color: meta.color }]}>
        {label || meta.label}
      </Text>
    </View>
  );
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function PrimaryButton({ children, onPress, icon = 'arrow-right', dark = false, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        dark && styles.primaryButtonDark,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{children}</Text>
      <Icon name={icon} size={17} color={COLORS.white} />
    </Pressable>
  );
}

function SecondaryButton({ children, onPress, icon = 'chevron-left' }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
    >
      <Icon name={icon} size={16} color={COLORS.black} />
      <Text style={styles.secondaryButtonText}>{children}</Text>
    </Pressable>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
    </View>
  );
}

function StepRail({ activeStep, approved, onSelect }) {
  const steps = [
    { number: 1, label: 'Booking', enabled: true },
    { number: 2, label: 'Telemetry', enabled: true },
    { number: 3, label: 'Recovery', enabled: approved || activeStep >= 3 },
    { number: 4, label: 'Call', enabled: approved || activeStep >= 4 },
    { number: 5, label: 'Approved', enabled: approved },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stepRail}
    >
      {steps.map((step, index) => {
        const selected = activeStep === step.number;
        const done = approved ? step.number < 5 : step.number < activeStep;

        return (
          <React.Fragment key={step.number}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !step.enabled, selected }}
              disabled={!step.enabled}
              onPress={() => onSelect(step.number)}
              style={({ pressed }) => [
                styles.stepRailItem,
                selected && styles.stepRailItemSelected,
                !step.enabled && styles.stepRailItemDisabled,
                pressed && step.enabled && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.stepNumber,
                  selected && styles.stepNumberSelected,
                  done && styles.stepNumberDone,
                ]}
              >
                {done ? (
                  <Icon name="check" size={13} color={COLORS.white} strokeWidth={2.5} />
                ) : (
                  <Text style={[styles.stepNumberText, selected && styles.stepNumberTextSelected]}>
                    {step.number}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, selected && styles.stepLabelSelected]}>{step.label}</Text>
            </Pressable>
            {index < steps.length - 1 ? <View style={styles.stepRailLine} /> : null}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
}

function TripCard({ item, approved, disrupted }) {
  const isRefunded = approved && (item.id === 'flight' || item.id === 'bus');
  const isAdjusted = approved && item.id === 'cab';
  const detailLabel = isRefunded
    ? `REFUND AUTO-FILED (${item.id === 'flight' ? '₹4,000' : '₹600'})`
    : isAdjusted
      ? 'ADJUSTED PICKUP CONFIRMED'
      : item.rule;

  return (
    <Card style={styles.tripCard}>
      <View style={styles.tripCardTopline}>
        <View style={styles.tripCategory}>
          <View style={styles.tripIconBox}>
            <Icon name={item.icon} size={17} color={approved ? COLORS.green : COLORS.black} />
          </View>
          <Text style={styles.tripCategoryText}>{item.category}</Text>
        </View>
        <Text style={styles.monoAmount}>{item.fare}</Text>
      </View>
      <View style={styles.tripCardBody}>
        <View style={styles.tripCardCopy}>
          <Text style={styles.tripTitle}>{item.title}</Text>
          <Text style={styles.tripRoute}>{item.route}</Text>
          <View style={styles.tripMetaRow}>
            <Icon name="clock" size={14} color={COLORS.muted} />
            <Text style={styles.tripMetaText}>
              {approved && item.id === 'flight' ? '07:00 PM - 08:30 PM' : item.schedule}
            </Text>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.ruleRow,
          isRefunded && styles.ruleRowGreen,
          isAdjusted && styles.ruleRowGreen,
          disrupted && item.id === 'flight' && styles.ruleRowRed,
        ]}
      >
        <Icon
          name={isRefunded || isAdjusted ? 'check-circle' : disrupted && item.id === 'flight' ? 'alert-circle' : 'shield'}
          size={14}
          color={isRefunded || isAdjusted ? COLORS.green : disrupted && item.id === 'flight' ? COLORS.red : COLORS.muted}
        />
        <Text
          style={[
            styles.ruleText,
            (isRefunded || isAdjusted) && styles.ruleTextGreen,
            disrupted && item.id === 'flight' && styles.ruleTextRed,
          ]}
        >
          {detailLabel}
        </Text>
      </View>
    </Card>
  );
}

function NodeChain({ disrupted, approved }) {
  const nodes = [
    {
      id: 'flight',
      icon: 'send',
      label: '[Flight]',
      title: approved ? 'IX-814' : 'IndiGo 6E-402',
      status: approved ? 'CONFIRMED' : disrupted ? 'DELAYED +4H • 10:00 PM DEP' : 'ON SCHEDULE',
      tone: approved ? 'confirmed' : disrupted ? 'disrupted' : 'neutral',
      detail: approved ? '07:00 PM departure confirmed' : 'VT-IVR inbound aircraft telemetry',
    },
    {
      id: 'bus',
      icon: 'truck',
      label: '[Bus]',
      title: 'Kadamba Volvo AC',
      status: approved ? 'CONFIRMED' : disrupted ? 'MISSED CONNECTION' : 'BOARDING WINDOW',
      tone: approved ? 'confirmed' : disrupted ? 'disrupted' : 'neutral',
      detail: approved ? 'REFUND AUTO-FILED (₹600)' : '09:30 PM departure from Airport',
    },
    {
      id: 'cab',
      icon: 'navigation',
      label: '[Cab]',
      title: 'Pre-booked Sedan',
      status: approved ? 'CONFIRMED' : disrupted ? 'WINDOW EXPIRED' : 'STANDBY',
      tone: approved ? 'confirmed' : disrupted ? 'amber' : 'neutral',
      detail: approved ? 'Adjusted direct pickup to resort' : '10:40 PM pickup at Panjim ISBT',
    },
    {
      id: 'hotel',
      icon: 'home',
      label: '[Hotel]',
      title: 'Taj Cidade de Goa',
      status: approved ? 'CONFIRMED' : disrupted ? 'LATE ARRIVAL' : 'CHECK-IN HELD',
      tone: approved ? 'confirmed' : disrupted ? 'amber' : 'neutral',
      detail: approved ? 'Late check-in lock released' : '11:00 PM check-in window',
    },
  ];

  return (
    <View style={styles.nodeChain}>
      {nodes.map((node, index) => {
        const meta = STATUS_META[node.tone];
        return (
          <View key={node.id} style={styles.nodeRow}>
            <View style={styles.nodeRailColumn}>
              <View style={[styles.nodeCircle, { borderColor: meta.color, backgroundColor: meta.background }]}>
                <Icon name={node.icon} size={17} color={meta.color} />
              </View>
              {index < nodes.length - 1 ? (
                <View style={[styles.nodeConnector, { backgroundColor: disrupted ? COLORS.border : COLORS.green }]} />
              ) : null}
            </View>
            <Card style={[styles.nodeCard, approved && styles.nodeCardApproved]}>
              <View style={styles.nodeCardHeader}>
                <View>
                  <Text style={styles.nodeLabel}>{node.label}</Text>
                  <Text style={styles.nodeTitle}>{node.title}</Text>
                </View>
                <Badge label={node.status} tone={node.tone} compact />
              </View>
              <Text style={styles.nodeDetail}>{node.detail}</Text>
            </Card>
          </View>
        );
      })}
    </View>
  );
}

function TelemetryCard({ disrupted }) {
  return (
    <Card style={styles.telemetryCard}>
      <View style={styles.telemetryHeader}>
        <View style={styles.telemetryTitleRow}>
          <View style={styles.liveIndicator} />
          <Text style={styles.telemetryKicker}>LIVE TELEMETRY</Text>
        </View>
        <Text style={styles.telemetryTime}>{disrupted ? 'LAST UPDATE 06:08 PM' : 'UPDATED 06:02 PM'}</Text>
      </View>
      <View style={styles.telemetryMain}>
        <View style={styles.aircraftMark}>
          <Icon name="send" size={25} color={COLORS.black} />
        </View>
        <View style={styles.telemetryMainCopy}>
          <Text style={styles.telemetryLabel}>INCOMING AIRCRAFT</Text>
          <Text style={styles.telemetryAircraft}>VT-IVR</Text>
          <Text style={styles.telemetryRoute}>Bengaluru to Goa</Text>
        </View>
        <Badge label={disrupted ? 'DELAY DETECTED' : 'TRACKING'} tone={disrupted ? 'disrupted' : 'confirmed'} compact />
      </View>
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryMetric}>
          <Text style={styles.telemetryMetricLabel}>ALTITUDE</Text>
          <Text style={styles.telemetryMetricValue}>29,000 FT</Text>
        </View>
        <View style={styles.telemetryMetric}>
          <Text style={styles.telemetryMetricLabel}>GROUND SPEED</Text>
          <Text style={styles.telemetryMetricValue}>426 KTS</Text>
        </View>
        <View style={styles.telemetryMetric}>
          <Text style={styles.telemetryMetricLabel}>ETA GOI</Text>
          <Text style={[styles.telemetryMetricValue, disrupted && styles.telemetryMetricValueRed]}>
            {disrupted ? '09:58 PM' : '07:27 PM'}
          </Text>
        </View>
      </View>
      <View style={styles.coordinatesRow}>
        <Icon name="map-pin" size={14} color={COLORS.muted} />
        <Text style={styles.coordinatesText}>15.3800° N, 73.8311° E</Text>
        <Text style={styles.coordinatesText}>ADS-B / GPS</Text>
      </View>
    </Card>
  );
}

function MoneyRow({ label, detail, amount, positive = false, total = false }) {
  return (
    <View style={[styles.moneyRow, total && styles.moneyRowTotal]}>
      <View style={styles.moneyRowCopy}>
        <Text style={[styles.moneyRowLabel, total && styles.moneyRowLabelTotal]}>{label}</Text>
        <Text style={[styles.moneyRowDetail, total && styles.moneyRowDetailTotal]}>{detail}</Text>
      </View>
      <Text
        style={[
          styles.moneyRowAmount,
          positive && styles.moneyRowAmountPositive,
          total && styles.moneyRowAmountTotal,
        ]}
      >
        {amount}
      </Text>
    </View>
  );
}

function RefundBreakdown() {
  return (
    <Card style={styles.refundCard}>
      <View style={styles.cardTitleRow}>
        <View style={styles.cardTitleIcon}>
          <Icon name="credit-card" size={17} color={COLORS.green} />
        </View>
        <View>
          <Text style={styles.cardKicker}>SETTLEMENT LEDGER</Text>
          <Text style={styles.cardTitle}>Refund Settlement Breakdown</Text>
        </View>
      </View>
      <View style={styles.ledgerDivider} />
      <MoneyRow
        label="Original Flight Ticket"
        detail="₹4,000 • 100% Operator Delay Refund"
        amount="+₹4,000"
        positive
      />
      <MoneyRow
        label="Original Bus Ticket"
        detail="₹800 • Cancelled 3.5 hrs early (75% Refund)"
        amount="+₹600"
        positive
      />
      <MoneyRow
        label="Total Auto-Unlocked Refund Credit"
        detail="Credit available for recovery plan"
        amount="₹4,600"
        positive
        total
      />
      <MoneyRow
        label="New 07:00 PM Flight + Adjusted Cab Cost"
        detail="IX-814 plus direct resort transfer"
        amount="₹5,100"
      />
      <View style={styles.netPayableBox}>
        <View>
          <Text style={styles.netPayableKicker}>FINAL NET PAYABLE BY USER</Text>
          <Text style={styles.netPayableFormula}>₹5,100 - ₹4,600</Text>
        </View>
        <Text style={styles.netPayableAmount}>₹500</Text>
      </View>
    </Card>
  );
}

function RecoveryOption() {
  return (
    <Card style={styles.recoveryCard}>
      <View style={styles.recoveryHeader}>
        <Badge label="STAGED RECOVERY" tone="confirmed" />
        <Text style={styles.recoveryHeaderText}>OPTION 01</Text>
      </View>
      <View style={styles.recoveryRoute}>
        <View style={styles.recoveryRouteStop}>
          <Text style={styles.recoveryTime}>07:00 PM</Text>
          <Text style={styles.recoveryLocation}>BLR</Text>
          <Text style={styles.recoverySmall}>IX-814</Text>
        </View>
        <View style={styles.recoveryRouteLine}>
          <View style={styles.recoveryRouteDot} />
          <View style={styles.recoveryRouteDash} />
          <Icon name="arrow-right" size={16} color={COLORS.orange} />
        </View>
        <View style={styles.recoveryRouteStopRight}>
          <Text style={styles.recoveryTime}>08:30 PM</Text>
          <Text style={styles.recoveryLocation}>GOI</Text>
          <Text style={styles.recoverySmall}>Adjusted direct cab</Text>
        </View>
      </View>
      <View style={styles.recoveryFooter}>
        <View style={styles.recoveryFooterItem}>
          <Icon name="refresh-cw" size={15} color={COLORS.green} />
          <Text style={styles.recoveryFooterText}>Original tickets queued for refund</Text>
        </View>
        <View style={styles.recoveryFooterItem}>
          <Icon name="navigation" size={15} color={COLORS.green} />
          <Text style={styles.recoveryFooterText}>Pickup moved to Goa arrival</Text>
        </View>
      </View>
    </Card>
  );
}

function BookingStep({ approved, disrupted, onContinue }) {
  return (
    <View>
      <SectionHeading
        eyebrow="STEP 01 / 05"
        title="Unified trip context"
        description="One itinerary, four linked reservations, and a single recovery ledger."
      />
      <Card style={styles.tripSummaryCard}>
        <View>
          <Text style={styles.tripSummaryKicker}>TRIP REFERENCE</Text>
          <Text style={styles.tripSummaryTitle}>#BLR-GOI-884</Text>
        </View>
        <View style={styles.tripSummaryRight}>
          <Text style={styles.tripSummaryKicker}>STATUS</Text>
          <Badge label={approved ? 'CONFIRMED' : disrupted ? 'CASCADE RISK' : 'BOOKED'} tone={approved ? 'confirmed' : disrupted ? 'amber' : 'neutral'} compact />
        </View>
      </Card>
      <View style={styles.tripList}>
        {TRIP_ITEMS.map((item) => (
          <TripCard key={item.id} item={item} approved={approved} disrupted={disrupted} />
        ))}
      </View>
      <View style={styles.actionBlock}>
        <PrimaryButton onPress={onContinue} icon="radio">
          Open live telemetry
        </PrimaryButton>
        <Text style={styles.actionHint}>Last PNR sync: today, 06:02 PM</Text>
      </View>
    </View>
  );
}

function TelemetryStep({ disrupted, onTriggerDelay, onContinue, onBack }) {
  return (
    <View>
      <SectionHeading
        eyebrow="STEP 02 / 05"
        title="Live telemetry"
        description="Track the operating signal first, then map its effect across every downstream booking."
      />
      <TelemetryCard disrupted={disrupted} />
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.cardKicker}>VISUAL NODE DASHBOARD</Text>
          <Text style={styles.cardTitle}>Cascade impact</Text>
        </View>
        <Badge label={disrupted ? 'IMPACT MAPPED' : 'NO IMPACT'} tone={disrupted ? 'amber' : 'confirmed'} compact />
      </View>
      <NodeChain disrupted={disrupted} approved={false} />
      {!disrupted ? (
        <Card style={styles.triggerCard}>
          <View style={styles.triggerIcon}>
            <Icon name="clock" size={18} color={COLORS.orange} />
          </View>
          <View style={styles.triggerCopy}>
            <Text style={styles.triggerTitle}>Simulate operator disruption</Text>
            <Text style={styles.triggerDescription}>Trigger a 4-Hour Flight Delay to calculate the exact downstream recovery.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onTriggerDelay}
            style={({ pressed }) => [styles.triggerButton, pressed && styles.pressed]}
          >
            <Text style={styles.triggerButtonText}>Trigger Delay</Text>
            <Icon name="arrow-up-right" size={15} color={COLORS.orange} />
          </Pressable>
        </Card>
      ) : (
        <Card style={styles.impactBanner}>
          <View style={styles.impactBannerIcon}>
            <Icon name="alert-triangle" size={18} color={COLORS.red} />
          </View>
          <View style={styles.impactBannerCopy}>
            <Text style={styles.impactBannerTitle}>Cascade impact identified</Text>
            <Text style={styles.impactBannerText}>The 09:30 PM bus connection is no longer viable. Refund rules are now eligible for settlement.</Text>
          </View>
        </Card>
      )}
      <View style={styles.actionBlock}>
        {disrupted ? (
          <PrimaryButton onPress={onContinue} icon="arrow-right">
            View recovery and refunds
          </PrimaryButton>
        ) : null}
        <SecondaryButton onPress={onBack}>Back to booking context</SecondaryButton>
      </View>
    </View>
  );
}

function RecoveryStep({ onCall, onBack }) {
  return (
    <View>
      <SectionHeading
        eyebrow="STEP 03 / 05"
        title="Alternative route and refund math"
        description="A staged option is ready with operator credits applied before payment is requested."
      />
      <RecoveryOption />
      <RefundBreakdown />
      <Card style={styles.policyNote}>
        <Icon name="shield" size={16} color={COLORS.muted} />
        <Text style={styles.policyNoteText}>Settlement uses the fare rules captured at booking time. No estimated credit is shown.</Text>
      </Card>
      <View style={styles.actionBlock}>
        <PrimaryButton onPress={onCall} icon="phone-call">
          Start proactive phone call
        </PrimaryButton>
        <SecondaryButton onPress={onBack}>Back to live telemetry</SecondaryButton>
      </View>
    </View>
  );
}

function CallStep({ onCall, onApprove, onBack }) {
  return (
    <View>
      <SectionHeading
        eyebrow="STEP 04 / 05"
        title="Proactive phone briefing"
        description="A full-screen call is ready with the disruption, refund settlement, and next action."
      />
      <Card style={styles.callReadyCard}>
        <View style={styles.callReadyIcon}>
          <Icon name="phone-call" size={21} color={COLORS.orange} />
        </View>
        <View style={styles.callReadyCopy}>
          <Text style={styles.callReadyKicker}>OUTBOUND CALL READY</Text>
          <Text style={styles.callReadyTitle}>Trip Guard desk</Text>
          <Text style={styles.callReadyText}>The briefing will use on-device speech synthesis. Answer the call to hear the full recovery summary.</Text>
        </View>
      </Card>
      <Card style={styles.callTranscriptCard}>
        <View style={styles.cardTitleRow}>
          <Icon name="file-text" size={17} color={COLORS.black} />
          <Text style={styles.cardTitle}>Briefing preview</Text>
        </View>
        <Text style={styles.callTranscriptText}>{CALL_SCRIPT}</Text>
      </Card>
      <View style={styles.actionBlock}>
        <PrimaryButton onPress={onCall} icon="phone">
          Open full-screen call
        </PrimaryButton>
        <Pressable
          accessibilityRole="button"
          onPress={onApprove}
          style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
        >
          <Text style={styles.textActionText}>Approve plan without calling</Text>
        </Pressable>
        <SecondaryButton onPress={onBack}>Back to recovery math</SecondaryButton>
      </View>
    </View>
  );
}

function ApprovedStep() {
  return (
    <View>
      <SectionHeading
        eyebrow="STEP 05 / 05"
        title="Schedule recovery confirmed"
        description="The replacement route is approved, downstream bookings are synchronized, and the refund file is open."
      />
      <Card style={styles.successCard}>
        <View style={styles.successIcon}>
          <Icon name="check" size={25} color={COLORS.white} strokeWidth={2.8} />
        </View>
        <View style={styles.successCopy}>
          <Text style={styles.successKicker}>PLAN APPROVED</Text>
          <Text style={styles.successTitle}>You are cleared to continue</Text>
          <Text style={styles.successText}>PNR Sync complete. All four itinerary nodes now carry a confirmed recovery state.</Text>
        </View>
      </Card>
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.cardKicker}>CONFIRMED ITINERARY</Text>
          <Text style={styles.cardTitle}>All nodes synchronized</Text>
        </View>
        <Badge label="CONFIRMED" tone="confirmed" compact />
      </View>
      <NodeChain disrupted={false} approved />
      <Card style={styles.refundConfirmedCard}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardTitleIcon}>
            <Icon name="check-circle" size={17} color={COLORS.green} />
          </View>
          <View>
            <Text style={styles.cardKicker}>REFUND SETTLEMENT</Text>
            <Text style={styles.cardTitle}>REFUND AUTO-FILED (₹4,600)</Text>
          </View>
        </View>
        <View style={styles.refundConfirmedRows}>
          <View style={styles.refundConfirmedRow}>
            <Text style={styles.refundConfirmedLabel}>Flight ticket credit</Text>
            <Text style={styles.refundConfirmedAmount}>₹4,000</Text>
          </View>
          <View style={styles.refundConfirmedRow}>
            <Text style={styles.refundConfirmedLabel}>Bus ticket credit</Text>
            <Text style={styles.refundConfirmedAmount}>₹600</Text>
          </View>
        </View>
        <View style={styles.approvedNetRow}>
          <View>
            <Text style={styles.approvedNetKicker}>NET PAYMENT CAPTURED</Text>
            <Text style={styles.approvedNetLabel}>New flight plus adjusted cab</Text>
          </View>
          <Text style={styles.approvedNetAmount}>₹500</Text>
        </View>
      </Card>
      <View style={styles.finalStamp}>
        <Icon name="lock" size={14} color={COLORS.green} />
        <Text style={styles.finalStampText}>Recovery ledger locked to trip #BLR-GOI-884</Text>
      </View>
    </View>
  );
}

function PhoneCallModal({ visible, answered, onAnswer, onDecline, onApprove, onReview }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <View style={styles.callScreen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkPanel} />
        <View style={styles.callScreenTop}>
          <Text style={styles.callScreenStatus}>{answered ? 'ACTIVE CALL' : 'INCOMING CALL'}</Text>
          <Text style={styles.callScreenTime}>TRIP GUARD DESK</Text>
        </View>
        <View style={styles.callScreenCenter}>
          <View style={styles.callAvatar}>
            <Icon name="phone-call" size={31} color={COLORS.white} />
          </View>
          <Text style={styles.callCaller}>Trip Guard</Text>
          <Text style={styles.callCallerSub}>Schedule Recovery Desk</Text>
          <View style={styles.callReasonRow}>
            <View style={styles.callReasonDot} />
            <Text style={styles.callReasonText}>Travel disruption briefing</Text>
          </View>
        </View>
        {answered ? (
          <View style={styles.callAnswerPanel}>
            <View style={styles.callSpeechHeader}>
              <Icon name="volume-2" size={17} color={COLORS.greenSoft} />
              <Text style={styles.callSpeechHeaderText}>ON-DEVICE BRIEFING</Text>
            </View>
            <Text style={styles.callScriptText}>{CALL_SCRIPT}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onApprove}
              style={({ pressed }) => [styles.callApproveButton, pressed && styles.callButtonPressed]}
            >
              <Text style={styles.callApproveButtonText}>Approve Plan • Pay ₹500 Net</Text>
              <Icon name="check" size={18} color={COLORS.black} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onReview}
              style={({ pressed }) => [styles.callReviewButton, pressed && styles.callButtonPressed]}
            >
              <Text style={styles.callReviewButtonText}>Open the recovery plan in app</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.callActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onDecline}
              style={({ pressed }) => [styles.callAction, styles.callDeclineAction, pressed && styles.callButtonPressed]}
            >
              <View style={styles.callActionCircle}>
                <Icon name="x" size={24} color={COLORS.white} strokeWidth={2.2} />
              </View>
              <Text style={styles.callActionLabel}>Decline</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onAnswer}
              style={({ pressed }) => [styles.callAction, styles.callAnswerAction, pressed && styles.callButtonPressed]}
            >
              <View style={[styles.callActionCircle, styles.callActionCircleAnswer]}>
                <Icon name="phone" size={24} color={COLORS.white} strokeWidth={2.2} />
              </View>
              <Text style={styles.callActionLabel}>Answer</Text>
            </Pressable>
          </View>
        )}
        {!answered ? <Text style={styles.callSwipeHint}>Answer to hear the settlement briefing</Text> : null}
      </View>
    </Modal>
  );
}

export default function App() {
  const [activeStep, setActiveStep] = useState(1);
  const [disrupted, setDisrupted] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [callAnswered, setCallAnswered] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (showCall && !callAnswered) {
      Vibration.vibrate([0, 550, 500], true);
    } else {
      Vibration.cancel();
    }

    return () => Vibration.cancel();
  }, [showCall, callAnswered]);

  const goToStep = (step) => {
    if (approved && step <= 5) {
      setActiveStep(step);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (step === 1 || step === 2 || (step === 3 && disrupted) || (step === 4 && disrupted)) {
      setActiveStep(step);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const triggerDelay = () => {
    setDisrupted(true);
    setActiveStep(2);
  };

  const openCall = () => {
    setActiveStep(4);
    setCallAnswered(false);
    setShowCall(true);
  };

  const closeCall = () => {
    Speech.stop();
    Vibration.cancel();
    setShowCall(false);
    setCallAnswered(false);
  };

  const answerCall = () => {
    Vibration.cancel();
    setCallAnswered(true);
    Speech.stop();
    Speech.speak(CALL_SCRIPT, {
      language: 'en-IN',
      pitch: 1,
      rate: 0.88,
    });
  };

  const approvePlan = () => {
    Speech.stop();
    Vibration.cancel();
    setShowCall(false);
    setCallAnswered(false);
    setApproved(true);
    setDisrupted(true);
    setActiveStep(5);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderStep = () => {
    if (approved && activeStep === 5) {
      return <ApprovedStep />;
    }

    if (activeStep === 1) {
      return <BookingStep approved={approved} disrupted={disrupted} onContinue={() => goToStep(2)} />;
    }

    if (activeStep === 2) {
      return (
        <TelemetryStep
          disrupted={disrupted}
          onTriggerDelay={triggerDelay}
          onContinue={() => goToStep(3)}
          onBack={() => goToStep(1)}
        />
      );
    }

    if (activeStep === 3) {
      return <RecoveryStep onCall={openCall} onBack={() => goToStep(2)} />;
    }

    return <CallStep onCall={openCall} onApprove={approvePlan} onBack={() => goToStep(3)} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.alabaster} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.appHeader}>
            <View style={styles.brandLockup}>
              <View style={styles.brandMark}>
                <Icon name="shield" size={17} color={COLORS.white} strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.brandName}>TRIP GUARD</Text>
                <Text style={styles.brandSubtitle}>TRAVEL OPERATIONS</Text>
              </View>
            </View>
            <View style={styles.headerTripRef}>
              <Text style={styles.headerTripLabel}>ACTIVE TRIP</Text>
              <Text style={styles.headerTripValue}>#BLR-GOI-884</Text>
            </View>
          </View>

          <View style={styles.heroBlock}>
            <View style={styles.heroEyebrowRow}>
              <View style={styles.heroRule} />
              <Text style={styles.heroEyebrow}>AUTONOMOUS SCHEDULE RECOVERY</Text>
            </View>
            <Text style={styles.heroTitle}>{approved ? 'Your route is back on plan.' : 'Every booking, one recovery plan.'}</Text>
            <Text style={styles.heroDescription}>
              {approved
                ? 'The replacement flight, adjusted cab, and refund settlement are confirmed.'
                : 'Live operating signals are matched to your downstream reservations before a disruption becomes a missed trip.'}
            </Text>
          </View>

          <StepRail activeStep={activeStep} approved={approved} onSelect={goToStep} />
          {renderStep()}
        </View>
      </ScrollView>
      <PhoneCallModal
        visible={showCall}
        answered={callAnswered}
        onAnswer={answerCall}
        onDecline={closeCall}
        onApprove={approvePlan}
        onReview={closeCall}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.alabaster,
  },
  scrollContent: {
    paddingBottom: 42,
  },
  container: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  appHeader: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
  },
  brandName: {
    color: COLORS.black,
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  brandSubtitle: {
    color: COLORS.subtle,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  headerTripRef: {
    alignItems: 'flex-end',
  },
  headerTripLabel: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerTripValue: {
    marginTop: 4,
    color: COLORS.black,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
  },
  heroBlock: {
    paddingTop: 30,
    paddingBottom: 24,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroRule: {
    width: 24,
    height: 2,
    backgroundColor: COLORS.orange,
  },
  heroEyebrow: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  heroTitle: {
    maxWidth: 620,
    marginTop: 12,
    color: COLORS.black,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  heroDescription: {
    maxWidth: 600,
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  stepRail: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  stepRailItem: {
    minWidth: 74,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 3,
  },
  stepRailItemSelected: {
    minWidth: 88,
  },
  stepRailItemDisabled: {
    opacity: 0.42,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  stepNumberSelected: {
    borderColor: COLORS.black,
    backgroundColor: COLORS.black,
  },
  stepNumberDone: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.green,
  },
  stepNumberText: {
    color: COLORS.muted,
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
  },
  stepNumberTextSelected: {
    color: COLORS.white,
  },
  stepLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  stepLabelSelected: {
    color: COLORS.black,
  },
  stepRailLine: {
    width: 22,
    height: 1,
    marginHorizontal: 2,
    backgroundColor: COLORS.border,
  },
  sectionHeading: {
    marginBottom: 20,
  },
  eyebrow: {
    color: COLORS.orange,
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  sectionTitle: {
    marginTop: 8,
    color: COLORS.black,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  sectionDescription: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 5,
  },
  badgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.55,
  },
  badgeTextCompact: {
    fontSize: 9,
    letterSpacing: 0.35,
  },
  tripSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  tripSummaryKicker: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tripSummaryTitle: {
    marginTop: 7,
    color: COLORS.black,
    fontFamily: MONO,
    fontSize: 17,
    fontWeight: '800',
  },
  tripSummaryRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tripList: {
    gap: 10,
  },
  tripCard: {
    padding: 15,
  },
  tripCardTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripIconBox: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: COLORS.alabaster,
  },
  tripCategoryText: {
    color: COLORS.muted,
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  monoAmount: {
    color: COLORS.black,
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: '800',
  },
  tripCardBody: {
    marginTop: 13,
    flexDirection: 'row',
  },
  tripCardCopy: {
    flex: 1,
  },
  tripTitle: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '700',
  },
  tripRoute: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  tripMetaText: {
    color: COLORS.black,
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '600',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ruleRowGreen: {
    borderTopColor: '#BBE8C9',
  },
  ruleRowRed: {
    borderTopColor: '#FECACA',
  },
  ruleText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  ruleTextGreen: {
    color: COLORS.green,
    fontWeight: '700',
  },
  ruleTextRed: {
    color: COLORS.red,
    fontWeight: '700',
  },
  actionBlock: {
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: COLORS.orange,
  },
  primaryButtonDark: {
    backgroundColor: COLORS.black,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  secondaryButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '700',
  },
  actionHint: {
    color: COLORS.subtle,
    textAlign: 'center',
    fontFamily: MONO,
    fontSize: 10,
  },
  pressed: {
    opacity: 0.72,
  },
  telemetryCard: {
    padding: 16,
    marginBottom: 26,
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#86EFAC',
  },
  telemetryKicker: {
    color: '#86EFAC',
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  telemetryTime: {
    color: '#A1A19C',
    fontFamily: MONO,
    fontSize: 9,
  },
  telemetryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },
  aircraftMark: {
    width: 49,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#2A2A26',
  },
  telemetryMainCopy: {
    flex: 1,
    marginLeft: 12,
  },
  telemetryLabel: {
    color: '#A1A19C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  telemetryAircraft: {
    marginTop: 2,
    color: COLORS.white,
    fontFamily: MONO,
    fontSize: 20,
    fontWeight: '800',
  },
  telemetryRoute: {
    marginTop: 2,
    color: '#D4D4CF',
    fontSize: 12,
  },
  telemetryGrid: {
    flexDirection: 'row',
    marginTop: 22,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#343430',
  },
  telemetryMetric: {
    flex: 1,
  },
  telemetryMetricLabel: {
    color: '#A1A19C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.65,
  },
  telemetryMetricValue: {
    marginTop: 6,
    color: COLORS.white,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
  },
  telemetryMetricValueRed: {
    color: '#FCA5A5',
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 17,
  },
  coordinatesText: {
    color: '#A1A19C',
    fontFamily: MONO,
    fontSize: 9,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitleIcon: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: COLORS.greenSoft,
  },
  cardKicker: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.95,
  },
  cardTitle: {
    marginTop: 4,
    color: COLORS.black,
    fontSize: 17,
    fontWeight: '800',
  },
  nodeChain: {
    gap: 0,
  },
  nodeRow: {
    flexDirection: 'row',
    minHeight: 92,
  },
  nodeRailColumn: {
    width: 40,
    alignItems: 'center',
  },
  nodeCircle: {
    zIndex: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 16,
  },
  nodeConnector: {
    position: 'absolute',
    top: 31,
    bottom: -1,
    width: 1,
  },
  nodeCard: {
    flex: 1,
    minHeight: 78,
    marginLeft: 10,
    marginBottom: 14,
    padding: 13,
  },
  nodeCardApproved: {
    borderColor: '#BBE8C9',
  },
  nodeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nodeLabel: {
    color: COLORS.subtle,
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nodeTitle: {
    marginTop: 3,
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '800',
  },
  nodeDetail: {
    marginTop: 9,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    padding: 13,
    backgroundColor: COLORS.orangeSoft,
    borderColor: '#FED7AA',
  },
  triggerIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  triggerCopy: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },
  triggerTitle: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '800',
  },
  triggerDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  triggerButtonText: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: '800',
  },
  impactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.redSoft,
    borderColor: '#FECACA',
  },
  impactBannerIcon: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  impactBannerCopy: {
    flex: 1,
    marginLeft: 11,
  },
  impactBannerTitle: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '800',
  },
  impactBannerText: {
    marginTop: 4,
    color: '#7F1D1D',
    fontSize: 11,
    lineHeight: 16,
  },
  recoveryCard: {
    padding: 16,
    borderColor: '#BBE8C9',
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recoveryHeaderText: {
    color: COLORS.subtle,
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  recoveryRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
  },
  recoveryRouteStop: {
    width: 82,
  },
  recoveryRouteStopRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  recoveryTime: {
    color: COLORS.black,
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: '800',
  },
  recoveryLocation: {
    marginTop: 4,
    color: COLORS.orange,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '800',
  },
  recoverySmall: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
  },
  recoveryRouteLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  recoveryRouteDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
  },
  recoveryRouteDash: {
    flex: 1,
    height: 1,
    marginHorizontal: 5,
    backgroundColor: COLORS.border,
  },
  recoveryFooter: {
    gap: 9,
    marginTop: 23,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  recoveryFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  recoveryFooterText: {
    color: COLORS.muted,
    fontSize: 11,
  },
  refundCard: {
    marginTop: 14,
    padding: 16,
  },
  ledgerDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: COLORS.border,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  moneyRowCopy: {
    flex: 1,
  },
  moneyRowLabel: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '700',
  },
  moneyRowDetail: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  moneyRowAmount: {
    color: COLORS.black,
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '800',
  },
  moneyRowAmountPositive: {
    color: COLORS.green,
  },
  moneyRowTotal: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    backgroundColor: '#F4FCF6',
    borderBottomColor: '#BBE8C9',
  },
  moneyRowLabelTotal: {
    color: COLORS.green,
    fontWeight: '800',
  },
  moneyRowDetailTotal: {
    color: '#166534',
  },
  moneyRowAmountTotal: {
    fontSize: 16,
  },
  netPayableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    padding: 14,
    borderRadius: 9,
    backgroundColor: COLORS.black,
  },
  netPayableKicker: {
    color: '#A1A19C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  netPayableFormula: {
    marginTop: 5,
    color: '#D4D4CF',
    fontFamily: MONO,
    fontSize: 10,
  },
  netPayableAmount: {
    color: COLORS.white,
    fontFamily: MONO,
    fontSize: 25,
    fontWeight: '800',
  },
  policyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
    padding: 13,
    backgroundColor: '#FAFAF8',
  },
  policyNoteText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  callReadyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderColor: '#FED7AA',
    backgroundColor: COLORS.orangeSoft,
  },
  callReadyIcon: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  callReadyCopy: {
    flex: 1,
    marginLeft: 12,
  },
  callReadyKicker: {
    color: COLORS.orange,
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  callReadyTitle: {
    marginTop: 4,
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '800',
  },
  callReadyText: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  callTranscriptCard: {
    marginTop: 12,
    padding: 16,
  },
  callTranscriptText: {
    marginTop: 15,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  textAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  textActionText: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderColor: '#BBE8C9',
    backgroundColor: '#F4FCF6',
  },
  successIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: COLORS.green,
  },
  successCopy: {
    flex: 1,
    marginLeft: 12,
  },
  successKicker: {
    color: COLORS.green,
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  successTitle: {
    marginTop: 4,
    color: COLORS.black,
    fontSize: 17,
    fontWeight: '800',
  },
  successText: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  refundConfirmedCard: {
    marginTop: 4,
    padding: 16,
    borderColor: '#BBE8C9',
  },
  refundConfirmedRows: {
    gap: 10,
    marginTop: 18,
  },
  refundConfirmedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refundConfirmedLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  refundConfirmedAmount: {
    color: COLORS.green,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '800',
  },
  approvedNetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#BBE8C9',
  },
  approvedNetKicker: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  approvedNetLabel: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
  },
  approvedNetAmount: {
    color: COLORS.black,
    fontFamily: MONO,
    fontSize: 22,
    fontWeight: '800',
  },
  finalStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
  },
  finalStampText: {
    color: COLORS.green,
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  callScreen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: Platform.select({ ios: 24, android: 32 }),
    paddingBottom: Platform.select({ ios: 30, android: 24 }),
    backgroundColor: COLORS.darkPanel,
  },
  callScreenTop: {
    alignItems: 'center',
  },
  callScreenStatus: {
    color: COLORS.white,
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  callScreenTime: {
    marginTop: 8,
    color: '#9C9C96',
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  callScreenCenter: {
    alignItems: 'center',
    marginTop: 20,
  },
  callAvatar: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 43,
    backgroundColor: COLORS.orange,
  },
  callCaller: {
    marginTop: 18,
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  callCallerSub: {
    marginTop: 6,
    color: '#B7B7B1',
    fontSize: 13,
  },
  callReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 22,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#282824',
  },
  callReasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#86EFAC',
  },
  callReasonText: {
    color: '#D4D4CF',
    fontSize: 11,
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  callAction: {
    alignItems: 'center',
    gap: 9,
  },
  callDeclineAction: {},
  callAnswerAction: {},
  callActionCircle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: '#B91C1C',
  },
  callActionCircleAnswer: {
    backgroundColor: COLORS.green,
  },
  callActionLabel: {
    color: '#D4D4CF',
    fontSize: 12,
    fontWeight: '700',
  },
  callSwipeHint: {
    alignSelf: 'center',
    marginTop: 18,
    color: '#8E8E88',
    fontSize: 11,
  },
  callAnswerPanel: {
    marginTop: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A35',
    borderRadius: 12,
    backgroundColor: '#22221F',
  },
  callSpeechHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  callSpeechHeaderText: {
    color: '#BBF7D0',
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  callScriptText: {
    marginTop: 12,
    color: '#E4E4E0',
    fontSize: 12,
    lineHeight: 19,
  },
  callApproveButton: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 17,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  callApproveButtonText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '800',
  },
  callReviewButton: {
    minHeight: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  callReviewButtonText: {
    color: '#D4D4CF',
    fontSize: 12,
    fontWeight: '700',
  },
  callButtonPressed: {
    opacity: 0.72,
  },
});
