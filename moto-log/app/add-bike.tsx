import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function AddBikeScreen() {
  const router = useRouter();
  const { unit } = useSettings();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!make || !model || !odometer) {
      Alert.alert('Missing Info', 'Make, model, and odometer are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Error', 'Could not find a logged-in user.');
        return;
      }

      const { error } = await supabase.from('motorcycles').insert([
        {
          user_id: user.id,
          nickname: nickname || null,
          make: make,
          model: model,
          year: parseInt(year),
          current_odometer: parseInt(odometer),
        },
      ]);

      if (error) {
        console.error('Supabase Error:', error);
        Alert.alert('Error', error.message);
      } else {
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>NICKNAME (Optional)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="pricetag-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g., The Beast"
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.label}>MAKE (e.g., Yamaha)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="construct-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={make}
            onChangeText={setMake}
            placeholder="Enter make..."
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.label}>MODEL (e.g., R6)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="bicycle-outline" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Enter model..."
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
            placeholder="YYYY"
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
            placeholder="e.g., 12500"
            placeholderTextColor="#666"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.floatingButton, isSubmitting && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.floatingButtonText}>SAVE MOTORCYCLE</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
