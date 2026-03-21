import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function AddBikeScreen() {
  const router = useRouter();
  const { unit } = useSettings(); // Pull in the global unit!

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSave = async () => {
    if (!make || !model || !odometer) {
      Alert.alert('Missing Info', 'Make, model, and odometer are required.');
      return;
    }

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
  };

  return (
    <View style={styles.container}>
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

      {/* Dynamic Unit Label! */}
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

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>SAVE MOTORCYCLE</Text>
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
  button: {
    backgroundColor: '#ff6600',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 40,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
