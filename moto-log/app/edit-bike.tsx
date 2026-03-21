import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function EditBikeScreen() {
  const router = useRouter();
  const { bikeId } = useLocalSearchParams();
  const { unit } = useSettings(); // Pull in the global unit!

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);

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

    const { error } = await supabase
      .from('motorcycles')
      .update({
        nickname: nickname || null,
        make: make,
        model: model,
        year: parseInt(year),
        current_odometer: parseInt(odometer),
      })
      .eq('id', bikeId);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.back();
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#ff6600" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
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

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>SAVE CHANGES</Text>
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
