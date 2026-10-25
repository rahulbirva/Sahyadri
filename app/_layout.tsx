import { useFonts } from '@expo-google-fonts/ibm-plex-mono';
import { useFonts as useSansFonts } from '@expo-google-fonts/ibm-plex-sans';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { colors } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [sansLoaded] = useSansFonts({
    IBMPlexSans_400Regular: require('@expo-google-fonts/ibm-plex-sans/400Regular/IBMPlexSans_400Regular.ttf'),
    IBMPlexSans_500Medium: require('@expo-google-fonts/ibm-plex-sans/500Medium/IBMPlexSans_500Medium.ttf'),
    IBMPlexSans_600SemiBold: require('@expo-google-fonts/ibm-plex-sans/600SemiBold/IBMPlexSans_600SemiBold.ttf'),
  });
  const [monoLoaded] = useFonts({
    IBMPlexMono_400Regular: require('@expo-google-fonts/ibm-plex-mono/400Regular/IBMPlexMono_400Regular.ttf'),
    IBMPlexMono_500Medium: require('@expo-google-fonts/ibm-plex-mono/500Medium/IBMPlexMono_500Medium.ttf'),
  });

  const loaded = sansLoaded && monoLoaded;
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
    </>
  );
}
