import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { scheduleMaintenanceAlert } from '../lib/notifications';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function LogServiceScreen() {
  const router = useRouter();
  const { bikeId } = useLocalSearchParams();
  const { unit } = useSettings();

  const [task, setTask] = useState('Engine Oil');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleImagePick = (type: 'before' | 'after' | 'receipt') => {
    Alert.alert('Add Evidence', 'Choose a photo source', [
      { text: 'Take Photo', onPress: () => openCamera(type) },
      { text: 'Choose from Gallery', onPress: () => openGallery(type) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async (type: 'before' | 'after' | 'receipt') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'We need camera access.');
      return;
    }

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
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'We need gallery access to select photos.');
      return;
    }

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

  const handleSave = async () => {
    if (!task || !odometer) {
      Alert.alert('Missing Info', 'Please enter a task and odometer reading.');
      return;
    }

    setIsSubmitting(true);

    try {
      let beforeUrl = null;
      let afterUrl = null;
      let receiptUrl = null;

      const uploadImage = async (uri: string, prefix: string) => {
        if (uri.startsWith('http')) return uri;

        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );

        const response = await fetch(manipResult.uri);
        const arrayBuffer = await response.arrayBuffer();
        const fileName = `${bikeId}_${prefix}_${Date.now()}.jpg`;

        const { error } = await supabase.storage
          .from('maintenance-photos')
          .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });

        if (error) throw error;

        const { data: publicData } = supabase.storage
          .from('maintenance-photos')
          .getPublicUrl(fileName);

        return publicData.publicUrl;
      };

      if (beforeImage) beforeUrl = await uploadImage(beforeImage, 'before');
      if (afterImage) afterUrl = await uploadImage(afterImage, 'after');
      if (receiptImage) receiptUrl = await uploadImage(receiptImage, 'receipt');

      const { error: dbError } = await supabase.from('maintenance_logs').insert([
        {
          motorcycle_id: bikeId,
          task_category: task,
          odometer_at_service: parseInt(odometer),
          cost: cost ? parseFloat(cost) : null,
          notes: notes || null,
          service_date: date.toISOString().split('T')[0],
          image_before_url: beforeUrl,
          image_after_url: afterUrl,
          receipt_image_url: receiptUrl,
        },
      ]);

      if (dbError) throw dbError;

      const { data: bikeData } = await supabase
        .from('motorcycles')
        .select('make, model, current_odometer')
        .eq('id', bikeId)
        .single();

      if (bikeData && parseInt(odometer) > bikeData.current_odometer) {
        await supabase
          .from('motorcycles')
          .update({ current_odometer: parseInt(odometer) })
          .eq('id', bikeId);
      }

      const { data: schedule } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('motorcycle_id', bikeId)
        .eq('task_category', task)
        .single();

      if (schedule && schedule.interval_days) {
        const nextDueDate = new Date(date);
        nextDueDate.setDate(nextDueDate.getDate() + schedule.interval_days);

        const today = new Date();
        const diffTime = nextDueDate.getTime() - today.getTime();
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const bikeName = bikeData ? `${bikeData.make} ${bikeData.model}` : 'your bike';
        await scheduleMaintenanceAlert(schedule.id, bikeName, task, daysUntilDue);
      }

      Alert.alert('Success!', 'Maintenance logged perfectly.');
      router.back();
    } catch (error: any) {
      console.error('Upload Error:', error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                placeholder="e.g., 15000"
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
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.floatingButtonText}>SAVE LOG</Text>
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
