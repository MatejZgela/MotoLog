import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // When this screen opens, Supabase has already securely logged them in via the email link!
  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Too Short', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    // This command securely overwrites their old password with the new one
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Your password has been updated!');
      router.replace('/'); // Send them back to the garage
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Ionicons name="lock-open-outline" size={80} color="#ff6600" style={{ marginBottom: 20 }} />
      <Text style={styles.title}>New Password</Text>
      <Text style={styles.subtitle}>Enter a new, secure password for your account.</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="key-outline" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="New Password"
          placeholderTextColor="#666"
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>UPDATE PASSWORD</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 30,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: '#fff', paddingVertical: 16, fontSize: 16 },
  button: {
    backgroundColor: '#ff6600',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
