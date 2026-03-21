import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function AddScheduleScreen() {
  const router = useRouter();
  const { bikeId } = useLocalSearchParams();
  const { unit } = useSettings(); // Pull in the global unit!

  const [task, setTask] = useState('Engine Oil');
  const [distance, setDistance] = useState('');
  const [days, setDays] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!distance && !days) {
      Alert.alert('Missing Info', 'Please provide either a distance or time interval (or both).');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existingSchedule, error: searchError } = await supabase
        .from('maintenance_schedules')
        .select('id')
        .eq('motorcycle_id', bikeId)
        .eq('task_category', task)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      const payload = {
        motorcycle_id: bikeId,
        task_category: task,
        interval_distance: distance ? parseInt(distance) : null,
        interval_days: days ? parseInt(days) : null,
      };

      if (existingSchedule) {
        const { error: updateError } = await supabase
          .from('maintenance_schedules')
          .update(payload)
          .eq('id', existingSchedule.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('maintenance_schedules')
          .insert([payload]);

        if (insertError) throw insertError;
      }

      Alert.alert('Success', `${task} schedule saved!`);
      router.back();
    } catch (error: any) {
      console.error('Save Error:', error);
      Alert.alert('Failed to save schedule', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>SET INTERVAL</Text>
      <Text style={styles.subText}>Define when this task should be performed next.</Text>

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
          {/* Dynamic Unit Label! */}
          <Text style={styles.label}>EVERY ({unit.toUpperCase()})</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="map-outline" size={18} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
              placeholder="e.g., 3000"
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
              placeholder="e.g., 365"
              placeholderTextColor="#666"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, isSubmitting && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>SAVE SCHEDULE</Text>
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

  // Wrapper for the half inputs to hold the icon
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
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 16,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#ff6600',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 40,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
