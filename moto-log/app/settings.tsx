import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { clearAllData } from '../lib/database';
import { deleteAllImages } from '../lib/imageStorage';
import { createBackup, shareBackup, importBackup } from '../lib/backupManager';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsScreen() {
  const router = useRouter();
  const { unit, toggleUnit, alertTime, setAlertTime } = useSettings();
  const [showPicker, setShowPicker] = useState(false);

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all motorcycles, logs, schedules, and photos from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await deleteAllImages();
              Alert.alert('Success', 'All data has been cleared.');
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
    );
  };

  const handleExportData = async () => {
    try {
      Alert.alert('Export Data', 'Choose export format:', [
        {
          text: 'JSON Only (Faster)',
          onPress: async () => {
            const jsonBackup = await createBackup(false);
            await shareBackup(jsonBackup);
          },
        },
        {
          text: 'Full Backup with Photos',
          onPress: async () => {
            const fullBackup = await createBackup(true);
            await shareBackup(fullBackup);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (error: any) {
      Alert.alert('Export Failed', error.message);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      Alert.alert('Import Data', 'How do you want to import this backup?', [
        {
          text: 'Merge with Existing',
          onPress: async () => {
            await importBackup(result.assets[0].uri, 'merge');
            Alert.alert('Success', 'Data imported successfully!');
            router.replace('/');
          },
        },
        {
          text: 'Replace All Data',
          style: 'destructive',
          onPress: async () => {
            await importBackup(result.assets[0].uri, 'replace');
            Alert.alert('Success', 'Data restored successfully!');
            router.replace('/');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (error: any) {
      Alert.alert('Import Failed', error.message);
    }
  };

  // Helper to format the time nicely (e.g., "10:00 AM")
  const formattedTime = new Date();
  formattedTime.setHours(alertTime.hour, alertTime.minute);
  const displayTime = formattedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setAlertTime({
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PREFERENCES</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="speedometer-outline" size={20} color="#888" />
            <Text style={styles.label}>Distance Units</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.unitText, unit === 'mi' && styles.unitActive]}>Miles</Text>
            <Switch
              value={unit === 'km'}
              onValueChange={toggleUnit}
              trackColor={{ false: '#333', true: '#ff6600' }}
              thumbColor={'#fff'}
            />
            <Text style={[styles.unitText, unit === 'km' && styles.unitActive]}>Km</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="time-outline" size={20} color="#888" />
            <Text style={styles.label}>Daily Alert Time</Text>
          </View>
          <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.timeButtonText}>{displayTime}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={formattedTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>

      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleExportData}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="cloud-upload-outline" size={20} color="#888" />
                <Text style={styles.label}>Export Backup</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.row} onPress={handleImportData}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="cloud-download-outline" size={20} color="#888" />
                <Text style={styles.label}>Import Backup</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>


      <TouchableOpacity style={styles.deleteButton} onPress={handleClearAllData}>
        <Ionicons name="trash-outline" size={20} color="#ff4444" style={{ marginRight: 8 }} />
        <Text style={styles.deleteText}>CLEAR ALL DATA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 24,
    letterSpacing: 1,
  },
  card: { backgroundColor: '#1c1c1e', padding: 16, borderRadius: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 8 },
  label: { color: '#fff', fontSize: 16, fontWeight: '500' },
  unitText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  unitActive: { color: '#ff6600' },

  timeButton: {
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  timeButtonText: { color: '#ff6600', fontWeight: 'bold', fontSize: 14 },

  deleteButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 40,
  },
  deleteText: { color: '#ff4444', fontSize: 16, fontWeight: 'bold' },
});
