import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, fonts } from '@/lib/theme';

export function TopBar({ back = false, eyebrow, title }: { back?: boolean; eyebrow?: string; title: string }) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      {back ? (
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
          <Text style={styles.backText}>BACK</Text>
        </Pressable>
      ) : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 28 },
  back: { marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: colors.muted, fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1 },
  eyebrow: { color: colors.muted, fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2, marginBottom: 8 },
  title: { color: colors.ink, fontFamily: fonts.sansBold, fontSize: 30, lineHeight: 34 },
});
