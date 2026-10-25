import { Animated, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { formatLegTime, formatRupees, labelForType } from '@/lib/format';
import { colors, fonts } from '@/lib/theme';
import { Leg, LegStatus } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';

const nodeColor: Record<LegStatus, string> = {
  ok: colors.ink,
  delayed: colors.brick,
  cancelled: colors.brick,
  at_risk: colors.ochre,
  recovered: colors.green,
};

function TripNode({ leg, isLast }: { leg: Leg; isLast: boolean }) {
  const progress = useRef(new Animated.Value(1)).current;
  const previousStatus = useRef(leg.status);
  const previousColor = nodeColor[previousStatus.current];

  useEffect(() => {
    if (leg.status === 'recovered' && previousStatus.current !== 'recovered') {
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 260, useNativeDriver: false }).start();
    }
    previousStatus.current = leg.status;
  }, [leg.status, progress]);

  const fill = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [previousColor, nodeColor[leg.status]],
  });

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <Animated.View style={[styles.node, { backgroundColor: fill, borderColor: fill }]} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={styles.detail}>
        <View style={styles.topline}>
          <Text style={styles.type}>{labelForType(leg.type)}</Text>
          <StatusBadge status={leg.status} />
        </View>
        <Text style={styles.route}>{leg.from}  /  {leg.to}</Text>
        <Text style={styles.time}>{formatLegTime(leg.startTime, leg.endTime)}</Text>
        <View style={styles.meta}>
          <Text style={styles.code}>{leg.operator}  {leg.code}</Text>
          <Text style={styles.price}>{formatRupees(leg.price)}</Text>
        </View>
        {leg.status === 'cancelled' ? <Text style={styles.cancelled}>Cancelled, refund requested</Text> : null}
        {leg.status === 'at_risk' && leg.riskReason ? <Text style={styles.reason}>{leg.riskReason}</Text> : null}
      </View>
    </View>
  );
}

export function TripChain({ legs }: { legs: Leg[] }) {
  return (
    <View>
      {legs.map((leg, index) => <TripNode key={leg.id} leg={leg} isLast={index === legs.length - 1} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', minHeight: 126 },
  rail: { width: 26, alignItems: 'center' },
  node: { width: 12, height: 12, borderWidth: 1, marginTop: 5 },
  line: { width: 1, flex: 1, backgroundColor: colors.hairline, marginTop: 8 },
  detail: { flex: 1, paddingLeft: 12, paddingBottom: 24 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  type: { color: colors.muted, fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1 },
  route: { color: colors.ink, fontFamily: fonts.sansMedium, fontSize: 17, lineHeight: 22 },
  time: { color: colors.muted, fontFamily: fonts.mono, fontSize: 12, marginTop: 5 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  code: { color: colors.muted, fontFamily: fonts.mono, fontSize: 11 },
  price: { color: colors.ink, fontFamily: fonts.monoMedium, fontSize: 12 },
  reason: { color: colors.ochre, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 8, paddingRight: 16 },
  cancelled: { color: colors.brick, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 8 },
});
