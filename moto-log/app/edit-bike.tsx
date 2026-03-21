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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function EditBikeScreen() {
  const router = useRouter();
  const { bikeId } = useLocalSearchParams();
  const { unit } = useSettings();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [nickname, setNickname] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBike = async () => {
      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .eq('id', bikeId)
        .single();

      if (error) {
        Alert.alert('Error', 'Could not load bike data.');
        router.back();
      } else {
        setNickname(data.nickname || '');
        setMake(data.make);
        setModel(data.model);
        setYear(data.year ? data.year.toString() : '');
        setOdometer(data.current_odometer.toString());
      }
      setLoading(false);
    };

    if (bikeId) fetchBike();
  }, [bikeId]);

  const handleUpdate = async () => {
    if (!make || !model || !odometer) {
      Alert.alert('Missing Info', 'Make, model, and odometer are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('motorcycles')
        .update({
          nickname: nickname || null,
          make: make,
          model: model,
          year: year ? parseInt(year) : null,
          current_odometer: parseInt(odometer),
        })
        .eq('id', bikeId);

      if (error) throw error;
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBike = async () => {
    Alert.alert(
      'Delete Motorcycle',
      'Are you sure? This permanently deletes the bike, all its logs, and all attached photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);

              const { data: logs } = await supabase
                .from('maintenance_logs')
                .select('image_before_url, image_after_url, receipt_image_url')
                .eq('motorcycle_id', bikeId);

              let fileNames: string[] = [];
              if (logs) {
                logs.forEach((log) => {
                  if (log.image_before_url) fileNames.push(log.image_before_url.split('/').pop()!);
                  if (log.image_after_url) fileNames.push(log.image_after_url.split('/').pop()!);
                  if (log.receipt_image_url)
                    fileNames.push(log.receipt_image_url.split('/').pop()!);
                });
              }

              if (fileNames.length > 0) {
                await supabase.storage.from('maintenance-photos').remove(fileNames);
              }

              await supabase.from('motorcycles').delete().eq('id', bikeId);
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message);
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#ff6600" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
        enableAutomaticScroll={true}
      >
        <Text style={styles.label}>NICKNAME (Optional)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="pricetag-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.label}>MAKE</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="construct-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={make}
            onChangeText={setMake}
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.label}>MODEL</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="bicycle-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.label}>YEAR</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.label}>CURRENT ODOMETER ({unit})</Text>
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

        <TouchableOpacity style={styles.deleteWrapper} onPress={handleDeleteBike}>
          <Ionicons name="trash-outline" size={18} color="#ff4444" style={{ marginRight: 8 }} />
          <Text style={styles.deleteText}>DELETE MOTORCYCLE</Text>
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
  deleteWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  deleteText: { color: '#ff4444', fontWeight: 'bold' },
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
