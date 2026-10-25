import * as Notifications from 'expo-notifications';

export async function notifyDisruption(body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tether found a disruption',
        body,
      },
      trigger: null,
    });
  } catch {
    // Foreground notifications are best effort in Expo Go.
  }
}
