import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import {
  checkAndScheduleAllMaintenanceAlerts,
  registerForPushNotificationsAsync,
} from '../lib/notifications';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  getLogById,
  updateLog,
  getBikeById,
  updateBike,
  getAllSchedules,
  getLastServiceLogForTask,
} from '../lib/database';
import { saveImage, getAbsoluteImagePath } from '../lib/imageStorage';
import 'react-native-get-random-values';

export default function EditLogScreen() {
  const router = useRouter();
  const { logId, bikeId } = useLocalSearchParams();
  const { unit, alertTime } = useSettings();

  const [task, setTask] = useState('Engine Oil');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLog = async () => {
      const log = await getLogById(logId as string);

      if (!log) {
        Alert.alert('Error', 'Could not load log data.');
        router.back();
      } else {
        setTask(log.task_category);
        setOdometer(log.odometer_at_service.toString());
        setCost(log.cost ? log.cost.toString() : '');
        setNotes(log.notes || '');
        if (log.service_date) setDate(new Date(log.service_date));

        if (log.image_before_url) setBeforeImage(getAbsoluteImagePath(log.image_before_url));
        if (log.image_after_url) setAfterImage(getAbsoluteImagePath(log.image_after_url));
        if (log.receipt_image_url) setReceiptImage(getAbsoluteImagePath(log.receipt_image_url));
      }
      setIsLoading(false);
    };

    if (logId) fetchLog();
  }, [logId]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleImagePick = (type: 'before' | 'after' | 'receipt') => {
    Alert.alert('Edit Evidence', 'Choose a photo source', [
      { text: 'Take Photo', onPress: () => openCamera(type) },
      { text: 'Choose from Gallery', onPress: () => openGallery(type) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async (type: 'before' | 'after' | 'receipt') => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'receipt' ? [3, 4] : [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      if (type === 'before') setBeforeImage(result.assets[0].uri);
      if (type === 'after') setAfterImage(result.assets[0].uri);
      if (type === 'receipt') setReceiptImage(result.assets[0].uri);
    }
  };

  const openGallery = async (type: 'before' | 'after' | 'receipt') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'receipt' ? [3, 4] : [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      if (type === 'before') setBeforeImage(result.assets[0].uri);
      if (type === 'after') setAfterImage(result.assets[0].uri);
      if (type === 'receipt') setReceiptImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!task || !odometer) {
      Alert.alert('Missing Info', 'Please enter a task and odometer reading.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadImage = async (uri: string, type: 'before' | 'after' | 'receipt') => {
        if (!uri.startsWith('file')) return uri.split('/').pop();

        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        return await saveImage(manipResult.uri, type, bikeId as string, logId as string);
      };

      let finalBeforeUrl = beforeImage ? await uploadImage(beforeImage, 'before') : null;
      let finalAfterUrl = afterImage ? await uploadImage(afterImage, 'after') : null;
      let finalReceiptUrl = receiptImage ? await uploadImage(receiptImage, 'receipt') : null;

      await updateLog(logId as string, {
        task_category: task,
        odometer_at_service: parseInt(odometer),
        cost: cost ? parseFloat(cost) : null,
        notes: notes || null,
        service_date: date.toISOString().split('T')[0],
        image_before_url: finalBeforeUrl,
        image_after_url: finalAfterUrl,
        receipt_image_url: finalReceiptUrl,
      });

      const bike = await getBikeById(bikeId as string);

      if (bike && parseInt(odometer) > bike.current_odometer) {
        await updateBike(bikeId as string, { current_odometer: parseInt(odometer) });
      }

      // Check ALL schedules for both time and distance-based notifications
      await registerForPushNotificationsAsync();
      const bikeName = bike ? `${bike.make} ${bike.model}` : 'your bike';
      await checkAndScheduleAllMaintenanceAlerts(
        bikeId as string,
        bikeName,
        parseInt(odometer),
        getAllSchedules,
        getLastServiceLogForTask,
        alertTime,
      );

      router.back();
    } catch (error: any) {
      console.error('Update Error:', error);
      Alert.alert('Update Failed', error.message);
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
        extraScrollHeight={120}
      >
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

        <Text style={styles.label}>DATE OF SERVICE</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#888" style={styles.icon} />
          <Text style={{ color: '#fff', fontSize: 16, flex: 1, paddingVertical: 16 }}>
            {date.toISOString().split('T')[0]}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            themeVariant="dark"
          />
        )}

        <View style={styles.row}>
          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>ODOMETER ({unit})</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="speedometer-outline" size={20} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={odometer}
                onChangeText={setOdometer}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>TOTAL COST ($)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
                placeholder="e.g., 85.50"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        </View>

        <Text style={styles.label}>MECHANIC NOTES</Text>
        <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color="#888"
            style={[styles.icon, { marginTop: 16 }]}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline={true}
            numberOfLines={4}
            placeholder="e.g., Used Motul 10w40 and K&N filter. Stripped one fairing bolt."
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.label}>EVIDENCE & RECEIPTS</Text>
        <View style={styles.photoContainer}>
          <TouchableOpacity style={styles.photoBox} onPress={() => handleImagePick('before')}>
            {beforeImage ? (
              <Image source={{ uri: beforeImage }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.photoText}>+ BEFORE</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoBox} onPress={() => handleImagePick('after')}>
            {afterImage ? (
              <Image source={{ uri: afterImage }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.photoText}>+ AFTER</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.receiptBox} onPress={() => handleImagePick('receipt')}>
          {receiptImage ? (
            <Image source={{ uri: receiptImage }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.photoText}>+ ATTACH BILL / RECEIPT</Text>
          )}
        </TouchableOpacity>
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
  label: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },
  inputContainer: {
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
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInputContainer: { width: '48%' },

  pickerContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },

  photoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  photoBox: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  receiptBox: {
    width: '100%',
    height: 100,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 12,
  },

  photoText: { color: '#888', fontWeight: 'bold' },
  imagePreview: { width: '100%', height: '100%' },

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
