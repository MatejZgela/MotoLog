import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('maintenance', {
        name: 'Maintenance Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff6600',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.log(
      "Expo Go limitation hit: Notifications won't fully work until you use a Development Build.",
    );
    return false;
  }

  return true;
}

export async function scheduleMaintenanceAlert(
  scheduleId: string,
  bikeName: string,
  taskCategory: string,
  daysUntilDue: number,
  preferredTime: { hour: number; minute: number } = { hour: 10, minute: 0 }, // <-- New parameter added!
) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log(`Push permissions denied. Skipping lock-screen alerts for ${taskCategory}.`);
      return;
    }

    await cancelMaintenanceAlert(scheduleId);

    if (daysUntilDue <= 0) return;

    // 1. The Primary Alert (using custom time)
    const primaryTrigger = new Date();
    primaryTrigger.setDate(primaryTrigger.getDate() + daysUntilDue);
    primaryTrigger.setHours(preferredTime.hour, preferredTime.minute, 0, 0); // Apply User Setting

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛠️ Service Due!',
        body: `It's time to check the ${taskCategory} on your ${bikeName}.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: primaryTrigger,
      },
      identifier: `primary_${scheduleId}`,
    });

    // 2. The Gentle Nag (7 days later at the exact same custom time)
    const nagTrigger = new Date(primaryTrigger);
    nagTrigger.setDate(nagTrigger.getDate() + 7);
    // No need to set hours here, it inherited them from primaryTrigger!

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Service Overdue',
        body: `Gentle reminder: Your ${bikeName} still needs its ${taskCategory} checked!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nagTrigger,
      },
      identifier: `nag_${scheduleId}`,
    });
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
}

export async function cancelMaintenanceAlert(scheduleId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`primary_${scheduleId}`);
    await Notifications.cancelScheduledNotificationAsync(`nag_${scheduleId}`);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}
