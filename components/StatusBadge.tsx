import { StyleSheet, Text, View } from 'react-native';

import { labelForStatus } from '@/lib/format';
import { colors, fonts } from '@/lib/theme';
import { LegStatus } from '@/types';

const statusColor: Record<LegStatus, string> = {
  ok: colors.ink,
  delayed: colors.brick,
  cancelled: colors.brick,
  at_risk: colors.ochre,
  recovered: colors.green,
};

export function StatusBadge({ status }: { status: LegStatus }) {
  return (
    <View style={[styles.badge, { borderColor: statusColor[status] }]}>
      <Text style={[styles.text, { color: statusColor[status] }]}>{labelForStatus(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 0.5 },
});
