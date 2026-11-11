import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import {
  scheduleMaintenanceAlert,
  cancelMaintenanceAlert,
  registerForPushNotificationsAsync,
} from '../lib/notifications';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  getScheduleById,
  updateSchedule,
  getBikeById,
  getLastServiceLogForTask,
} from '../lib/database';

export default function EditScheduleScreen() {
  const router = useRouter();
  const { schedId, bikeId } = useLocalSearchParams();

  const { unit, alertTime } = useSettings();

  const [task, setTask] = useState('Engine Oil');
  const [distance, setDistance] = useState('');
  const [days, setDays] = useState('');
  const [originalDays, setOriginalDays] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      const data = await getScheduleById(schedId as string);

      if (!data) {
        Alert.alert('Error', 'Could not load schedule data.');
        router.back();
      } else {
        setTask(data.task_category);
        setDistance(data.interval_distance ? data.interval_distance.toString() : '');
        const daysValue = data.interval_days ? data.interval_days.toString() : '';
        setDays(daysValue);
        setOriginalDays(daysValue);
      }
      setIsLoading(false);
    };

    if (schedId) fetchSchedule();
  }, [schedId]);

  const handleUpdate = async () => {
    if (!distance && !days) {
      Alert.alert('Missing Info', 'Please provide either a distance or time interval.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateSchedule(schedId as string, {
        task_category: task,
        interval_distance: distance ? parseInt(distance) : null,
        interval_days: days ? parseInt(days) : null,
      });

      if (schedId) {
        // Only reschedule if the interval_days value changed
        const daysChanged = days !== originalDays;

        if (days && daysChanged) {
          await registerForPushNotificationsAsync();

          const bike = await getBikeById(bikeId as string);
          const bikeName = bike ? `${bike.make} ${bike.model}` : 'your bike';

          // Check if there's a service history for this task
          const lastService = await getLastServiceLogForTask(bikeId as string, task);

          let daysUntilDue;
          if (lastService) {
            // Calculate from last service date
            const lastServiceDate = new Date(lastService.service_date);
            const nextDueDate = new Date(lastServiceDate);
            nextDueDate.setDate(nextDueDate.getDate() + parseInt(days));

            const today = new Date();
            const diffTime = nextDueDate.getTime() - today.getTime();
            daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
            // No service history - schedule from today as upcoming reminder
            daysUntilDue = parseInt(days);
          }

          await scheduleMaintenanceAlert(
            schedId as string,
            bikeName,
            task,
            daysUntilDue,
            alertTime,
          );
        } else if (!days) {
          await cancelMaintenanceAlert(schedId as string);
        }
        // If days didn't change, don't reschedule (keep existing notification)
      }

      router.back();
    } catch (error: any) {
      console.error('Update Error:', error);
      Alert.alert('Failed to update schedule', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#ff6600" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={0}
      >
        <Text style={styles.headerText}>UPDATE INTERVAL</Text>
        <Text style={styles.subText}>Adjust when this task should be performed next.</Text>

        <Text style={styles.label}>MAINTENANCE CATEGORY</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={task}
            onValueChange={(itemValue) => setTask(itemValue)}
            mode="dialog"
            style={{ color: '#ffffff', backgroundColor: '#1c1c1e' }}
            dropdownIconColor="#ff6600"
          >
            <Picker.Item label="Engine Oil & Filter" value="Engine Oil" />
            <Picker.Item label="Chain & Sprockets" value="Chain & Sprockets" />
            <Picker.Item label="Brake Pads & Rotors" value="Brakes" />
            <Picker.Item label="Brake Fluid Flush" value="Brake Fluid" />
            <Picker.Item label="Tires" value="Tires" />
            <Picker.Item label="Air Filter" value="Air Filter" />
            <Picker.Item label="Valve Clearance" value="Valve Clearance" />
            <Picker.Item label="Spark Plugs" value="Spark Plugs" />
            <Picker.Item label="Coolant Flush" value="Coolant" />
            <Picker.Item label="Suspension/Forks" value="Suspension" />
            <Picker.Item label="Other / Custom" value="Other" />
          </Picker>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>EVERY ({unit.toUpperCase()})</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="map-outline" size={18} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={distance}
                onChangeText={setDistance}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>OR EVERY (DAYS)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={18} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={days}
                onChangeText={setDays}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <TouchableOpacity
        style={[styles.floatingButton, isSubmitting && { opacity: 0.7 }]}
        onPress={handleUpdate}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.floatingButtonText}>SAVE CHANGES</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  headerText: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subText: { color: '#888888', fontSize: 14, marginBottom: 24 },
  label: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },

  pickerContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  halfInputContainer: { width: '48%' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: '#fff', paddingVertical: 16, fontSize: 16 },

  floatingButton: {
    backgroundColor: '#ff6600',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  floatingButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
