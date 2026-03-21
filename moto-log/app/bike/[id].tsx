import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

// --- NEW SUB-COMPONENT: The Expandable Log Card ---
const LogCardItem = ({ item, unit, onEdit, onDelete, onImageTap }: any) => {
  const [expanded, setExpanded] = useState(false);

  // Force this to be a strict true/false boolean using !!
  const hasExtraDetails = !!(
    item.cost ||
    item.notes ||
    item.image_before_url ||
    item.image_after_url ||
    item.receipt_image_url
  );

  return (
    <View style={{ marginBottom: 12 }}>
      <Swipeable
        renderLeftActions={() => (
          <TouchableOpacity style={styles.editSwipeBtn} onPress={onEdit}>
            <Ionicons name="create-outline" size={24} color="#fff" />
            <Text style={styles.swipeText}>Edit</Text>
          </TouchableOpacity>
        )}
        renderRightActions={() => (
          <TouchableOpacity style={styles.deleteSwipeBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.swipeText}>Delete</Text>
          </TouchableOpacity>
        )}
      >
        <TouchableOpacity
          style={styles.logCard}
          activeOpacity={hasExtraDetails ? 0.7 : 1}
          onPress={() => hasExtraDetails && setExpanded(!expanded)}
          delayPressIn={100}
        >
          <View
            style={[
              styles.logHeader,
              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
            ]}
          >
            <View>
              <Text style={styles.logTask}>{item.task_category}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color="#888"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.logDetails}>{item.service_date}</Text>
                <Text style={styles.logDetails}> | </Text>
                <Ionicons
                  name="speedometer-outline"
                  size={14}
                  color="#888"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.logDetails}>
                  ODO: {item.odometer_at_service} {unit}
                </Text>
              </View>
            </View>

            {/* Strict Ternary */}
            {hasExtraDetails ? (
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
            ) : null}
          </View>

          {/* Strict Ternary */}
          {expanded ? (
            <View>
              {item.cost || item.notes ? (
                <View style={styles.notesContainer}>
                  {item.cost ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons
                        name="cash-outline"
                        size={16}
                        color="#4CAF50"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.costText}>Total Cost: ${item.cost}</Text>
                    </View>
                  ) : null}
                  {item.notes ? (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 2 }}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color="#888"
                        style={{ marginRight: 6, marginTop: 2 }}
                      />
                      <Text style={styles.notesText}>"{item.notes}"</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {item.image_before_url || item.image_after_url || item.receipt_image_url ? (
                <View style={styles.logPhotosContainer}>
                  {item.image_before_url ? (
                    <TouchableOpacity
                      style={styles.photoWrapper}
                      onPress={() => onImageTap(item.image_before_url)}
                    >
                      <Text style={styles.photoLabel}>BEFORE</Text>
                      <Image source={{ uri: item.image_before_url }} style={styles.logImage} />
                    </TouchableOpacity>
                  ) : null}
                  {item.image_after_url ? (
                    <TouchableOpacity
                      style={styles.photoWrapper}
                      onPress={() => onImageTap(item.image_after_url)}
                    >
                      <Text style={styles.photoLabel}>AFTER</Text>
                      <Image source={{ uri: item.image_after_url }} style={styles.logImage} />
                    </TouchableOpacity>
                  ) : null}
                  {item.receipt_image_url ? (
                    <TouchableOpacity
                      style={styles.photoWrapper}
                      onPress={() => onImageTap(item.receipt_image_url)}
                    >
                      <Text style={styles.photoLabel}>RECEIPT</Text>
                      <Image source={{ uri: item.receipt_image_url }} style={styles.logImage} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
};

// --- NEW SUB-COMPONENT: The Swipeable Schedule Card ---
const ScheduleCardItem = ({ sched, unit, status, onEdit, onDelete }: any) => {
  const isOverdue = status.color === '#ff4444';
  const badgeColor = isOverdue ? 'rgba(255, 68, 68, 0.15)' : 'rgba(76, 175, 80, 0.15)';
  const iconName = isOverdue ? 'warning-outline' : 'checkmark-circle-outline';

  return (
    <View style={{ marginBottom: 12 }}>
      <Swipeable
        renderLeftActions={() => (
          <TouchableOpacity style={styles.editSwipeBtn} onPress={onEdit}>
            <Ionicons name="create-outline" size={24} color="#fff" />
            <Text style={styles.swipeText}>Edit</Text>
          </TouchableOpacity>
        )}
        renderRightActions={() => (
          <TouchableOpacity style={styles.deleteSwipeBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.swipeText}>Delete</Text>
          </TouchableOpacity>
        )}
      >
        <View style={styles.scheduleCard}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            {/* Text stays perfectly flush left with the Logs! */}
            <View style={{ flex: 1 }}>
              <Text style={styles.logTask}>{sched.task_category}</Text>
              <Text style={styles.logDetails}>
                Every {sched.interval_distance ? `${sched.interval_distance} ${unit}` : ''}
                {sched.interval_distance && sched.interval_days ? ' / ' : ''}
                {sched.interval_days ? `${sched.interval_days} days` : ''}
              </Text>
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>

            {/* Dynamic Status Badge moved to the Right */}
            <View style={[styles.scheduleBadge, { backgroundColor: badgeColor }]}>
              <Ionicons name={iconName} size={24} color={status.color} />
            </View>
          </View>
        </View>
      </Swipeable>
    </View>
  );
};

export default function BikeProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { unit } = useSettings();

  const [bike, setBike] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // --- NEW: PAGINATION STATE ---
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const LOGS_PER_PAGE = 8; // Load 8 at a time

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [id]),
  );

  const fetchInitialData = async () => {
    setLoading(true);

    const { data: bikeData } = await supabase.from('motorcycles').select('*').eq('id', id).single();
    if (bikeData) setBike(bikeData);

    const { data: schedData } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('motorcycle_id', id);
    if (schedData) setSchedules(schedData);

    // Fetch ONLY the first batch of logs
    const { data: logsData } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('motorcycle_id', id)
      .order('service_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, LOGS_PER_PAGE - 1);

    if (logsData) {
      setLogs(logsData);
      if (logsData.length < LOGS_PER_PAGE) setHasMoreLogs(false);
    }

    setLoading(false);
  };

  // --- NEW: THE INFINITE SCROLL FUNCTION ---
  const fetchMoreLogs = async () => {
    if (!hasMoreLogs || isLoadingMore || logs.length === 0) return;
    setIsLoadingMore(true);

    const currentLength = logs.length;

    const { data: nextBatch } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('motorcycle_id', id)
      .order('service_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(currentLength, currentLength + LOGS_PER_PAGE - 1);

    if (nextBatch && nextBatch.length > 0) {
      setLogs((prev) => [...prev, ...nextBatch]);
      if (nextBatch.length < LOGS_PER_PAGE) setHasMoreLogs(false);
    } else {
      setHasMoreLogs(false);
    }

    setIsLoadingMore(false);
  };

  const handleDeleteBike = () => {
    Alert.alert('Delete Motorcycle', 'Are you sure? This deletes all logs and schedules.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('motorcycles').delete().eq('id', id);
          router.replace('/');
        },
      },
    ]);
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert('Delete Log', 'Remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('maintenance_logs').delete().eq('id', logId);
          fetchInitialData(); // Reset and reload after delete
        },
      },
    ]);
  };

  const handleDeleteSchedule = (schedId: string) => {
    Alert.alert('Remove Schedule', 'Stop tracking this interval?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('maintenance_schedules').delete().eq('id', schedId);
          fetchInitialData();
        },
      },
    ]);
  };

  const getScheduleStatus = (schedule: any) => {
    const relatedLogs = logs.filter((l) => l.task_category === schedule.task_category);

    if (relatedLogs.length === 0) {
      return { text: 'No logs found. Do this ASAP.', color: '#ff4444' };
    }

    let statusText = [];
    let isOverdue = false;

    if (schedule.interval_distance) {
      const highestOdoLog = [...relatedLogs].sort(
        (a, b) => b.odometer_at_service - a.odometer_at_service,
      )[0];
      const safeCurrentOdometer = Math.max(
        bike.current_odometer,
        highestOdoLog.odometer_at_service,
      );
      const milesSince = safeCurrentOdometer - highestOdoLog.odometer_at_service;
      const milesLeft = schedule.interval_distance - milesSince;

      if (milesLeft <= 0) isOverdue = true;
      statusText.push(
        milesLeft <= 0 ? `${Math.abs(milesLeft)} ${unit} OVERDUE` : `Due in ${milesLeft} ${unit}`,
      );
    }

    if (schedule.interval_days) {
      const mostRecentDateLog = relatedLogs[0];
      const lastDate = new Date(mostRecentDateLog.service_date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const daysLeft = schedule.interval_days - diffDays;

      if (daysLeft <= 0) isOverdue = true;
      statusText.push(
        daysLeft <= 0 ? `${Math.abs(daysLeft)} days OVERDUE` : `Due in ${daysLeft} days`,
      );
    }

    return { text: statusText.join(' OR '), color: isOverdue ? '#ff4444' : '#4CAF50' };
  };

  if (loading)
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  if (!bike)
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Bike not found.</Text>
      </View>
    );

  // --- THE NEW HEADER COMPONENT ---
  const ListHeader = () => (
    <View>
      <View style={styles.headerCard}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View>
            {bike.nickname && <Text style={styles.bikeNickname}>"{bike.nickname}"</Text>}
            <Text style={styles.bikeTitle}>
              {bike.make} {bike.model}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons
                name="speedometer-outline"
                size={14}
                color="#888"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.bikeDetails}>
                ODO: {bike.current_odometer} {unit}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* NEW: Contextual Add Schedule Button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>TRACKED INTERVALS</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/add-schedule', params: { bikeId: id } })}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
        >
          <Text style={{ color: '#ff6600', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>
            + ADD
          </Text>
        </TouchableOpacity>
      </View>

      {schedules.length > 0 ? (
        <View style={{ marginBottom: 24 }}>
          {schedules.map((sched) => {
            const status = getScheduleStatus(sched);
            return (
              <ScheduleCardItem
                key={sched.id}
                sched={sched}
                unit={unit}
                status={status}
                onEdit={() =>
                  router.push({
                    pathname: '/edit-schedule',
                    params: { schedId: sched.id, bikeId: id },
                  })
                }
                onDelete={() => handleDeleteSchedule(sched.id)}
              />
            );
          })}
        </View>
      ) : (
        <View
          style={{
            marginBottom: 32,
            padding: 16,
            backgroundColor: '#1c1c1e',
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#666', fontStyle: 'italic' }}>
            No intervals tracked. Add one to start.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>SERVICE HISTORY</Text>
    </View>
  );

  // --- THE NEW FOOTER COMPONENT ---
  const ListFooter = () => (
    <View style={{ paddingBottom: 120 }}>
      {isLoadingMore && (
        <ActivityIndicator size="small" color="#ff6600" style={{ marginVertical: 20 }} />
      )}
      {!hasMoreLogs && logs.length > 0 && (
        <Text
          style={{ textAlign: 'center', color: '#666', marginVertical: 20, fontStyle: 'italic' }}
        >
          End of service history.
        </Text>
      )}
      <TouchableOpacity style={styles.deleteBikeWrapper} onPress={handleDeleteBike}>
        <Ionicons name="trash-outline" size={18} color="#ff4444" style={{ marginRight: 8 }} />
        <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>DELETE MOTORCYCLE</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {/* NEW: Contextual Edit Bike Button AND the global Settings button */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* The Edit Bike Pencil */}
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/edit-bike', params: { bikeId: id } })}
                style={{ padding: 8, marginRight: 4 }}
              >
                <Ionicons name="create-outline" size={24} color="#ff6600" />
              </TouchableOpacity>

              {/* The Restored Global Settings Gear */}
              <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 8 }}>
                <Ionicons name="settings-outline" size={24} color="#ff6600" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.container}>
        {/* --- THE HIGH PERFORMANCE FLATLIST --- */}
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons
                name="clipboard-outline"
                size={48}
                color="#333"
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.subText}>No service history yet.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <LogCardItem
              item={item}
              unit={unit}
              onEdit={() =>
                router.push({ pathname: '/edit-log', params: { logId: item.id, bikeId: id } })
              }
              onDelete={() => handleDeleteLog(item.id)}
              onImageTap={setFullScreenImage}
            />
          )}
          onEndReached={fetchMoreLogs} // Triggers when you scroll near the bottom
          onEndReachedThreshold={0.5} // Trigger it when you are halfway through the last items
        />

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push({ pathname: '/log-service', params: { bikeId: id } })}
        >
          <Ionicons name="build-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.floatingButtonText}>LOG SERVICE</Text>
        </TouchableOpacity>

        <Modal
          visible={!!fullScreenImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullScreenImage(null)}
        >
          <View style={styles.modalBackground}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenImage(null)}>
              <Ionicons
                name="close-circle-outline"
                size={20}
                color="#ff6600"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
            {fullScreenImage && (
              <Image
                source={{ uri: fullScreenImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20 },
  centerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: '#ff4444', fontSize: 18 },

  headerCard: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    marginTop: 20,
  },
  bikeNickname: {
    color: '#ff6600',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  bikeTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  bikeDetails: { color: '#888888', fontSize: 16 },

  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  emptyState: { alignItems: 'center', marginTop: 40 },
  subText: { color: '#888888', fontSize: 16 },

  statusText: { fontSize: 14, fontWeight: 'bold', marginTop: 8 },

  logHeader: { marginBottom: 0 }, // Changed so it collapses nicely
  logTask: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  logDetails: { color: '#888888', fontSize: 14 },

  swipeText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginTop: 4 },

  logPhotosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: '4%', marginTop: 8 },
  photoWrapper: { width: '30%', marginBottom: 8 },
  photoLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  logImage: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#2c2c2e' },

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

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.2)',
    borderRadius: 8,
  },
  closeButtonText: { color: '#ff6600', fontSize: 16, fontWeight: 'bold' },
  fullScreenImage: { width: '100%', height: '80%' },

  notesContainer: {
    backgroundColor: '#2c2c2e',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  costText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
  notesText: { color: '#cccccc', fontStyle: 'italic', fontSize: 14, flexShrink: 1 },

  deleteBikeWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  logCard: { backgroundColor: '#1c1c1e', padding: 16, borderRadius: 8 },

  scheduleCard: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 8,
    // No borders! Pure, clean box model.
  },
  scheduleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16 /* <-- Swapped from marginRight */,
  },

  deleteSwipeBtn: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginLeft: 8,
    alignSelf: 'stretch' /* <-- Replaces height: '100%' */,
  },

  editSwipeBtn: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginRight: 8,
    alignSelf: 'stretch' /* <-- Replaces height: '100%' */,
  },
});
