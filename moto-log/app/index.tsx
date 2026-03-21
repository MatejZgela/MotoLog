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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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

    // 1. Fetch all bikes for the user
    const { data: bikesData, error: bikesError } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (bikesError || !bikesData || bikesData.length === 0) {
      setBikes([]);
      setLoading(false);
      return;
    }

    const bikeIds = bikesData.map((b) => b.id);

    // 2. Fetch all schedules and logs for these bikes
    const { data: schedules } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .in('motorcycle_id', bikeIds);
    const { data: logs } = await supabase
      .from('maintenance_logs')
      .select('*')
      .in('motorcycle_id', bikeIds);

    // 3. The Math Engine: Check if any bike is overdue
    const bikesWithAlerts = bikesData.map((bike) => {
      const bikeSchedules = schedules?.filter((s) => s.motorcycle_id === bike.id) || [];
      const bikeLogs = logs?.filter((l) => l.motorcycle_id === bike.id) || [];
      let isOverdue = false;

      bikeSchedules.forEach((schedule) => {
        if (isOverdue) return; // Skip if we already know it's overdue

        const relatedLogs = bikeLogs.filter((l) => l.task_category === schedule.task_category);

        if (relatedLogs.length === 0) {
          isOverdue = true; // No logs at all? Overdue!
          return;
        }

        if (schedule.interval_distance) {
          const highestOdoLog = [...relatedLogs].sort(
            (a, b) => b.odometer_at_service - a.odometer_at_service,
          )[0];
          const safeCurrentOdo = Math.max(bike.current_odometer, highestOdoLog.odometer_at_service);
          if (
            schedule.interval_distance - (safeCurrentOdo - highestOdoLog.odometer_at_service) <=
            0
          ) {
            isOverdue = true;
          }
        }

        if (schedule.interval_days) {
          const mostRecentLog = [...relatedLogs].sort(
            (a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime(),
          )[0];
          const diffDays = Math.ceil(
            Math.abs(new Date().getTime() - new Date(mostRecentLog.service_date).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (schedule.interval_days - diffDays <= 0) {
            isOverdue = true;
          }
        }
      });

      return { ...bike, hasAlert: isOverdue };
    });

    setBikes(bikesWithAlerts);
    setLoading(false);
  };

  const renderBikeCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.bikeCard} onPress={() => router.push(`/bike/${item.id}`)}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <View style={{ flex: 1 }}>
          {item.nickname && <Text style={styles.bikeNickname}>"{item.nickname}"</Text>}
          <Text style={styles.bikeTitle}>
            {item.make} {item.model}
          </Text>
        </View>

        {/* THE NEW ALERT BADGE */}
        {item.hasAlert && (
          <View style={styles.alertBadge}>
            <Ionicons name="warning" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.alertText}>SERVICE DUE</Text>
          </View>
        )}
      </View>

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

  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  bikeDetails: { color: '#888888', fontSize: 14 },

  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  alertText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

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
