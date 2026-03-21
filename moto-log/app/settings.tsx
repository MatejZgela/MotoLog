import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const { unit, toggleUnit } = useSettings();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This will permanently erase your account, all your motorcycles, and all maintenance logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_user');
              if (error) throw error;

              await supabase.auth.signOut();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
    );
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
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>LOG OUT</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={20} color="#ff4444" style={{ marginRight: 8 }} />
        <Text style={styles.deleteText}>DELETE ACCOUNT</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#fff', fontSize: 16, fontWeight: '500' },
  unitText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  unitActive: { color: '#ff6600' },

  logoutButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

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
