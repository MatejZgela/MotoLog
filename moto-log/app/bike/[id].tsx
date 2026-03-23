import { useState, useCallback, useEffect } from 'react';
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
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../lib/supabase';

// --- SUB-COMPONENT: The Expandable Log Card ---
const LogCardItem = ({ item, unit, onEdit, onDelete, onImageTap }: any) => {
  const [expanded, setExpanded] = useState(false);

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

            {hasExtraDetails ? (
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
            ) : null}
          </View>

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

// --- SUB-COMPONENT: The Swipeable Schedule Card ---
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
            <View style={{ flex: 1 }}>
              <Text style={styles.logTask}>{sched.task_category}</Text>
              <Text style={styles.logDetails}>
                Every {sched.interval_distance ? `${sched.interval_distance} ${unit}` : ''}
                {sched.interval_distance && sched.interval_days ? ' / ' : ''}
                {sched.interval_days ? `${sched.interval_days} days` : ''}
              </Text>
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>

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

  // --- NEW: Paywall State ---
  const [isPro, setIsPro] = useState(false);

  // --- SEARCH & SORT STATE ---
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const LOGS_PER_PAGE = 8;

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial Fetch: Bike, Schedules, AND Profile Status
  useFocusEffect(
    useCallback(() => {
      const fetchInitialData = async () => {
        setLoading(true);

        // 1. Get user profile status
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_pro')
            .eq('id', user.id)
            .single();
          if (profile) setIsPro(profile.is_pro);
        }

        // 2. Get Bike
        const { data: bikeData } = await supabase
          .from('motorcycles')
          .select('*')
          .eq('id', id)
          .single();
        if (bikeData) setBike(bikeData);

        // 3. Get Schedules
        const { data: schedData } = await supabase
          .from('maintenance_schedules')
          .select('*')
          .eq('motorcycle_id', id);
        if (schedData) setSchedules(schedData);

        setLoading(false);
      };

      fetchInitialData();
    }, [id]),
  );

  useEffect(() => {
    if (bike) fetchLogs(true);
  }, [debouncedQuery, sortOrder, bike]);

  const fetchLogs = async (isReset = false) => {
    if (!isReset && (!hasMoreLogs || isLoadingMore)) return;

    setIsLoadingMore(true);
    const currentLength = isReset ? 0 : logs.length;

    let query = supabase
      .from('maintenance_logs')
      .select('*')
      .eq('motorcycle_id', id)
      .order('service_date', { ascending: sortOrder === 'asc' })
      .order('created_at', { ascending: sortOrder === 'asc' });

    if (debouncedQuery) {
      query = query.or(`task_category.ilike.%${debouncedQuery}%,notes.ilike.%${debouncedQuery}%`);
    }

    const { data: nextBatch } = await query.range(currentLength, currentLength + LOGS_PER_PAGE - 1);

    if (nextBatch && nextBatch.length > 0) {
      setLogs(isReset ? nextBatch : (prev) => [...prev, ...nextBatch]);
      setHasMoreLogs(nextBatch.length === LOGS_PER_PAGE);
    } else {
      if (isReset) setLogs([]);
      setHasMoreLogs(false);
    }

    setIsLoadingMore(false);
  };

  const generatePDF = async () => {
    // --- NEW: Paywall Interceptor ---
    if (!isPro) {
      Alert.alert(
        'Moto Log Pro Required 🛑',
        'Exporting your service history to PDF is a premium feature.\n\nUpgrade to Pro to generate professional, shareable reports for buyers or your own records!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade to Pro',
            onPress: () => Alert.alert('Coming Soon', 'RevenueCat paywall coming next!'),
          },
        ],
      );
      return;
    }

    try {
      setIsLoadingMore(true);

      const { data: allLogs, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('motorcycle_id', id)
        .order('service_date', { ascending: false });

      if (error) throw error;

      if (!allLogs || allLogs.length === 0) {
        Alert.alert('No Data', 'There are no logs to export.');
        setIsLoadingMore(false);
        return;
      }

      const tableRows = allLogs
        .map(
          (log) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${log.service_date}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>${log.task_category}</strong></td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${log.odometer_at_service} ${unit}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${log.cost ? '$' + log.cost : '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; color: #555;">${log.notes || '-'}</td>
        </tr>
      `,
        )
        .join('');

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              h1 { color: #ff6600; margin-bottom: 4px; text-transform: uppercase; }
              h3 { color: #888; margin-top: 0; font-weight: normal; }
              table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 14px; }
              th { text-align: left; padding: 12px; background-color: #f8f8f8; color: #333; border-bottom: 2px solid #ddd; }
            </style>
          </head>
          <body>
            <h1>Service History Report</h1>
            <h3>${bike.year || ''} ${bike.make} ${bike.model} ${bike.nickname ? `("${bike.nickname}")` : ''}</h3>
            <p><strong>Current Odometer:</strong> ${bike.current_odometer} ${unit}</p>
            <p><strong>Generated On:</strong> ${new Date().toLocaleDateString()}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Task</th>
                  <th>Odometer</th>
                  <th>Cost</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const cleanMake = bike.make.replace(/[^a-zA-Z0-9]/g, '');
      const cleanModel = bike.model.replace(/[^a-zA-Z0-9]/g, '');
      const fileName = `${cleanMake}_${cleanModel}_Service_History.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      if (Platform.OS === 'android') {
        Alert.alert(
          'Export Report',
          'Would you like to share this file or save it directly to your phone?',
          [
            {
              text: 'Share',
              onPress: async () => {
                await Sharing.shareAsync(newUri, {
                  UTI: 'public.pdf',
                  mimeType: 'application/pdf',
                  dialogTitle: 'Share Report',
                });
              },
            },
            {
              text: 'Save to Device',
              onPress: async () => {
                try {
                  const permissions =
                    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                  if (permissions.granted) {
                    const base64Data = await FileSystem.readAsStringAsync(newUri, {
                      encoding: FileSystem.EncodingType.Base64,
                    });
                    const savedUri = await FileSystem.StorageAccessFramework.createFileAsync(
                      permissions.directoryUri,
                      fileName,
                      'application/pdf',
                    );
                    await FileSystem.writeAsStringAsync(savedUri, base64Data, {
                      encoding: FileSystem.EncodingType.Base64,
                    });
                    Alert.alert('Success', `Report saved as ${fileName}`);
                  }
                } catch (err) {
                  console.error('Save error:', err);
                  Alert.alert('Error', 'Could not save file to device.');
                }
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(newUri, { UTI: 'public.pdf', mimeType: 'application/pdf' });
        }
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Export Failed', 'Could not generate the PDF report.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleDeleteLog = (log: any) => {
    // 1. Calculate what the highest odometer would be WITHOUT this log
    const remainingLogs = logs.filter((l) => l.id !== log.id);
    const nextHighestOdo =
      remainingLogs.length > 0
        ? Math.max(...remainingLogs.map((l) => l.odometer_at_service))
        : null;

    // 2. Check if the log being deleted is the one currently holding the "High Score"
    const isTopOdometer = log.odometer_at_service === bike.current_odometer;

    // 3. The Deletion Engine
    const performDelete = async (rollbackOdometerTo: number | null) => {
      // A. Delete Photos from Storage
      const urls = [log.image_before_url, log.image_after_url, log.receipt_image_url].filter(
        Boolean,
      );
      if (urls.length > 0) {
        const fileNames = urls.map((url) => url.split('/').pop());
        await supabase.storage.from('maintenance-photos').remove(fileNames);
      }

      // B. Delete the Log from Database
      await supabase.from('maintenance_logs').delete().eq('id', log.id);

      // C. Rollback the Bike's Odometer (If the user requested it)
      if (rollbackOdometerTo !== null) {
        await supabase
          .from('motorcycles')
          .update({ current_odometer: rollbackOdometerTo })
          .eq('id', bike.id);

        // Update local state instantly so the UI doesn't lag
        setBike({ ...bike, current_odometer: rollbackOdometerTo });
      }

      // Refresh the list
      fetchLogs(true);
    };

    // 4. The Logic Tree
    if (isTopOdometer && nextHighestOdo !== null && nextHighestOdo < bike.current_odometer) {
      // SCENARIO A: They are deleting the highest log. Give them the choice with a warning!
      Alert.alert(
        'Odometer Rollback',
        `This log set your bike to ${log.odometer_at_service} ${unit}.\n\nDo you want to roll back to your last logged service (${nextHighestOdo} ${unit})?\n\n(Note: If you recently updated your odometer manually, choose "Keep" and edit your bike profile).`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Keep Current',
            onPress: () => performDelete(null),
          },
          {
            text: `Rollback to ${nextHighestOdo} ${unit}`,
            style: 'destructive',
            onPress: () => performDelete(nextHighestOdo),
          },
        ],
      );
    }
  };

  const handleDeleteSchedule = (schedId: string) => {
    Alert.alert('Remove Schedule', 'Stop tracking this interval?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('maintenance_schedules').delete().eq('id', schedId);
          const { data: schedData } = await supabase
            .from('maintenance_schedules')
            .select('*')
            .eq('motorcycle_id', id);
          setSchedules(schedData || []);
        },
      },
    ]);
  };

  const getScheduleStatus = (schedule: any) => {
    const relatedLogs = logs.filter((l) => l.task_category === schedule.task_category);

    if (relatedLogs.length === 0) {
      return { text: 'No logs found. Do this ASAP.', color: '#ff4444' };
    }

    let milesLeft: number | null = null;
    let daysLeft: number | null = null;

    // 1. Calculate Distance
    if (schedule.interval_distance) {
      const highestOdoLog = [...relatedLogs].sort(
        (a, b) => b.odometer_at_service - a.odometer_at_service,
      )[0];
      const safeCurrentOdometer = Math.max(
        bike.current_odometer,
        highestOdoLog.odometer_at_service,
      );
      const milesSince = safeCurrentOdometer - highestOdoLog.odometer_at_service;
      milesLeft = schedule.interval_distance - milesSince;
    }

    // 2. Calculate Time
    if (schedule.interval_days) {
      // 🔥 BUG FIX: Explicitly sort by date descending to ensure we ALWAYS get the newest log,
      // even if the user changed the global sort order to "OLDEST" on the UI!
      const sortedByDate = [...relatedLogs].sort(
        (a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime(),
      );
      const mostRecentDateLog = sortedByDate[0];

      const lastDate = new Date(mostRecentDateLog.service_date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysLeft = schedule.interval_days - diffDays;
    }

    // 3. The "Whichever Comes First" Logic
    const distOverdue = milesLeft !== null && milesLeft <= 0;
    const timeOverdue = daysLeft !== null && daysLeft <= 0;
    const isOverdue = distOverdue || timeOverdue;

    // OVERDUE STATES
    if (isOverdue) {
      if (distOverdue && timeOverdue) {
        // State 3: Both are overdue
        return {
          text: `OVERDUE by ${Math.abs(milesLeft!)} ${unit} & ${Math.abs(daysLeft!)} days`,
          color: '#ff4444',
        };
      } else if (distOverdue) {
        // State 1: Only distance is overdue
        return { text: `OVERDUE by ${Math.abs(milesLeft!)} ${unit}`, color: '#ff4444' };
      } else {
        // State 2: Only time is overdue
        return { text: `OVERDUE by ${Math.abs(daysLeft!)} days`, color: '#ff4444' };
      }
    }
    // HEALTHY STATES
    else {
      if (milesLeft !== null && daysLeft !== null) {
        return { text: `Due in ${milesLeft} ${unit} or ${daysLeft} days`, color: '#4CAF50' };
      } else if (milesLeft !== null) {
        return { text: `Due in ${milesLeft} ${unit}`, color: '#4CAF50' };
      } else {
        return { text: `Due in ${daysLeft} days`, color: '#4CAF50' };
      }
    }
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
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/edit-bike', params: { bikeId: id } })}
                style={{ padding: 8, marginRight: 4 }}
              >
                <Ionicons name="create-outline" size={24} color="#ff6600" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 8 }}>
                <Ionicons name="settings-outline" size={24} color="#ff6600" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.container}>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={ListFooter}
          ListHeaderComponent={
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
                  <Text
                    style={{ color: '#ff6600', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}
                  >
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

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>SERVICE HISTORY</Text>

                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <TouchableOpacity onPress={generatePDF}>
                    <Ionicons name="document-text" size={20} color="#ff6600" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
                    <Ionicons
                      name="search"
                      size={20}
                      color={showSearch || searchQuery ? '#ff6600' : '#888'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <Ionicons
                      name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color="#ff6600"
                    />
                    <Text
                      style={{ color: '#ff6600', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}
                    >
                      {sortOrder === 'desc' ? 'NEWEST' : 'OLDEST'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showSearch && (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by task or notes..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#888" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons
                name="clipboard-outline"
                size={48}
                color="#333"
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.subText}>
                {searchQuery ? 'No matching logs found.' : 'No service history yet.'}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <LogCardItem
              item={item}
              unit={unit}
              onEdit={() =>
                router.push({ pathname: '/edit-log', params: { logId: item.id, bikeId: id } })
              }
              onDelete={() => handleDeleteLog(item)}
              onImageTap={setFullScreenImage}
            />
          )}
          onEndReached={() => fetchLogs(false)}
          onEndReachedThreshold={0.5}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  statusText: { fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  logHeader: { marginBottom: 0 },
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
  logCard: { backgroundColor: '#1c1c1e', padding: 16, borderRadius: 8 },
  scheduleCard: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 8,
  },
  scheduleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  deleteSwipeBtn: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginLeft: 8,
    alignSelf: 'stretch',
  },
  editSwipeBtn: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginRight: 8,
    alignSelf: 'stretch',
  },
});
