import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // <-- Import the icons!

export default function GarageScreen() {
  const router = useRouter();
  const { unit } = useSettings();

  const [bikes, setBikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBikes();
    }, []),
  );

  const fetchBikes = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bikes:', error);
    } else {
      setBikes(data || []);
    }

    setLoading(false);
  };

  const renderBikeCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.bikeCard} onPress={() => router.push(`/bike/${item.id}`)}>
      {item.nickname && <Text style={styles.bikeNickname}>"{item.nickname}"</Text>}
      <Text style={styles.bikeTitle}>
        {item.make} {item.model}
      </Text>

      {/* Updated row with the speedometer icon */}
      <View style={styles.detailsRow}>
        <Text style={styles.bikeDetails}>Year: {item.year} | </Text>
        <Ionicons name="speedometer-outline" size={14} color="#888" style={{ marginRight: 4 }} />
        <Text style={styles.bikeDetails}>
          ODO: {item.current_odometer} {unit}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ff6600" style={{ marginTop: 40 }} />
      ) : bikes.length === 0 ? (
        <View style={styles.emptyState}>
          {/* The new massive ghosted background icon */}
          <MaterialCommunityIcons
            name="motorbike"
            size={80}
            color="#333"
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.headerText}>YOUR GARAGE IS EMPTY</Text>
          <Text style={styles.subText}>Time to bring in your first machine.</Text>
        </View>
      ) : (
        <FlatList
          data={bikes}
          keyExtractor={(item) => item.id}
          renderItem={renderBikeCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.floatingButton} onPress={() => router.push('/add-bike')}>
        <Text style={styles.buttonText}>+ ADD MOTORCYCLE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  headerText: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subText: { color: '#888888', fontSize: 16 },

  bikeCard: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6600',
  },
  bikeTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },

  // Align the details text and the speedometer icon horizontally
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  bikeDetails: { color: '#888888', fontSize: 14 },

  floatingButton: {
    backgroundColor: '#ff6600',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  bikeNickname: {
    color: '#ff6600',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    fontStyle: 'italic',
  },
});
