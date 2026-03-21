import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Tell the app how to handle notifications if the user has the app open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

//TODO: this functions has been wrapped because expo go was going crazy because we wanted to send notification, remove after real testing starts

export async function registerForPushNotificationsAsync() {
  try {
    // This is the native code Expo Go hates. We wrap it in a try/catch.
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
    // Catch the Expo Go limitation gracefully
    console.log(
      "Expo Go limitation hit: Notifications won't fully work until you use a Development Build.",
    );
    return false;
  }

  return true;
}

/**
 * Schedules a primary alert and a "Gentle Nag" 7 days later.
 */
export async function scheduleMaintenanceAlert(
  scheduleId: string,
  bikeName: string,
  taskCategory: string,
  daysUntilDue: number,
) {
  try {
    // 1. Check if we actually have permission before asking the OS to do work
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log(`Push permissions denied. Skipping lock-screen alerts for ${taskCategory}.`);
      return;
    }

    // 2. Cancel old ones so we don't spam them
    await cancelMaintenanceAlert(scheduleId);

    if (daysUntilDue <= 0) return; // Don't schedule in the past!

    // 3. The Primary Alert
    const primaryTrigger = new Date();
    primaryTrigger.setDate(primaryTrigger.getDate() + daysUntilDue);
    primaryTrigger.setHours(10, 0, 0, 0); // Fire at 10:00 AM

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛠️ Service Due!',
        body: `It's time to check the ${taskCategory} on your ${bikeName}.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE, // <-- TS Fix!
        date: primaryTrigger,
      },
      identifier: `primary_${scheduleId}`,
    });

    // 4. The Gentle Nag (7 days later)
    const nagTrigger = new Date(primaryTrigger);
    nagTrigger.setDate(nagTrigger.getDate() + 7);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Service Overdue',
        body: `Gentle reminder: Your ${bikeName} still needs its ${taskCategory} checked!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE, // <-- TS Fix!
        date: nagTrigger,
      },
      identifier: `nag_${scheduleId}`,
    });

    console.log(`Scheduled alerts for ${taskCategory} in ${daysUntilDue} days.`);
  } catch (error) {
    // If anything fails at the OS level, catch it so the app doesn't crash
    console.error('Failed to schedule notification:', error);
  }
}

/**
 * Cancels both the primary and nag alerts for a specific schedule.
 */
export async function cancelMaintenanceAlert(scheduleId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`primary_${scheduleId}`);
    await Notifications.cancelScheduledNotificationAsync(`nag_${scheduleId}`);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}
