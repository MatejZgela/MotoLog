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
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import {
  scheduleMaintenanceAlert,
  cancelMaintenanceAlert,
  registerForPushNotificationsAsync, // 🔥 ADDED THIS
} from '../lib/notifications';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function EditScheduleScreen() {
  const router = useRouter();
  const { schedId, bikeId } = useLocalSearchParams();

  // 🔥 EXTRACTED alertTime FROM SETTINGS
  const { unit, alertTime } = useSettings();

  const [task, setTask] = useState('Engine Oil');
  const [distance, setDistance] = useState('');
  const [days, setDays] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('id', schedId)
        .single();

      if (error) {
        Alert.alert('Error', 'Could not load schedule data.');
        router.back();
      } else {
        setTask(data.task_category);
        setDistance(data.interval_distance ? data.interval_distance.toString() : '');
        setDays(data.interval_days ? data.interval_days.toString() : '');
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
      const { error } = await supabase
        .from('maintenance_schedules')
        .update({
          task_category: task,
          interval_distance: distance ? parseInt(distance) : null,
          interval_days: days ? parseInt(days) : null,
        })
        .eq('id', schedId);

      if (error) throw error;

      if (schedId) {
        if (days) {
          // 🔥 MAKE SURE WE HAVE PERMISSION BEFORE SCHEDULING
          await registerForPushNotificationsAsync();

          const { data: bike } = await supabase
            .from('motorcycles')
            .select('make, model')
            .eq('id', bikeId)
            .single();

          const bikeName = bike ? `${bike.make} ${bike.model}` : 'your bike';

          // 🔥 PASSED alertTime INTO THE FUNCTION
          await scheduleMaintenanceAlert(
            schedId as string,
            bikeName,
            task,
            parseInt(days),
            alertTime,
          );
        } else {
          await cancelMaintenanceAlert(schedId as string);
        }
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
