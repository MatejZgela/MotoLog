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

    // If overdue, schedule for tomorrow instead of skipping
    if (daysUntilDue <= 0) {
      daysUntilDue = 1;
    }

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

export async function checkAndScheduleAllMaintenanceAlerts(
  bikeId: string,
  bikeName: string,
  currentOdometer: number,
  getAllSchedulesFunc: (bikeId: string) => any[],
  getLastServiceLogForTaskFunc: (bikeId: string, task: string) => any | null,
  preferredTime: { hour: number; minute: number },
) {
  try {
    const schedules = getAllSchedulesFunc(bikeId);

    for (const schedule of schedules) {
      const lastService = getLastServiceLogForTaskFunc(bikeId, schedule.task_category);

      if (!lastService) {
        // No service history - skip for now (will be scheduled when first service is logged)
        continue;
      }

      let shouldSchedule = false;
      let daysUntilDue = Infinity;

      // Check distance-based interval
      if (schedule.interval_distance) {
        const milesSinceService = currentOdometer - lastService.odometer_at_service;
        const milesLeft = schedule.interval_distance - milesSinceService;

        if (milesLeft <= 0) {
          // Distance threshold reached or exceeded - schedule ASAP
          shouldSchedule = true;
          daysUntilDue = 1; // Tomorrow
        }
      }

      // Check time-based interval (whichever comes first)
      if (schedule.interval_days) {
        const lastServiceDate = new Date(lastService.service_date);
        const nextDueDate = new Date(lastServiceDate);
        nextDueDate.setDate(nextDueDate.getDate() + schedule.interval_days);

        const today = new Date();
        const diffTime = nextDueDate.getTime() - today.getTime();
        const calculatedDaysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Use whichever comes first (time or distance)
        if (calculatedDaysUntilDue < daysUntilDue) {
          daysUntilDue = calculatedDaysUntilDue;
          shouldSchedule = true;
        }
      }

      if (shouldSchedule && daysUntilDue !== Infinity) {
        await scheduleMaintenanceAlert(
          schedule.id,
          bikeName,
          schedule.task_category,
          daysUntilDue,
          preferredTime,
        );
      }
    }
  } catch (error) {
    console.error('Failed to check and schedule maintenance alerts:', error);
  }
}
