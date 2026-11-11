import * as Sentry from '@sentry/react-native';
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons'; // Added for the gear icon
import { SettingsProvider } from '../context/SettingsContext'; // Added for global state
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { initializeDatabase } from '../lib/database';
import { runMigrations } from '../lib/schemaMigrations';
import { initializeImageStorage } from '../lib/imageStorage';
import { checkAndCreateAutoBackup } from '../lib/backupManager';

Sentry.init({
  dsn: 'https://ee2729a64bdcfcd7abc30c946130e868@o4511089449107456.ingest.de.sentry.io/4511089464639568',
  debug: false,
  tracesSampleRate: 1.0,
});

//TODO: remove this line after real testing starts: Silence the Expo Go notification warning
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
  '[Layout children]: No route named',
]);

function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const initApp = async () => {
      initializeDatabase();
      runMigrations();
      await initializeImageStorage();
      await checkAndCreateAutoBackup();
    };
    initApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1c1c1e' },
            headerTintColor: '#ff6600',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#121212' },
            // This adds the gear icon to every screen!
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 8 }}>
                <Ionicons name="settings-outline" size={24} color="#ff6600" />
              </TouchableOpacity>
            ),
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Moto Log' }} />
          <Stack.Screen name="bike/[id]" options={{ title: 'Bike Profile' }} />
          <Stack.Screen name="add-bike" options={{ title: 'Add Motorcycle' }} />
          <Stack.Screen name="edit-bike" options={{ title: 'Edit Bike' }} />
          <Stack.Screen name="log-service" options={{ title: 'Log Service' }} />
          <Stack.Screen name="edit-log" options={{ title: 'Edit Service Log' }} />
          <Stack.Screen name="add-schedule" options={{ title: 'Add Maintenance Schedule' }} />
          <Stack.Screen name="edit-schedule" options={{ title: 'Edit Schedule' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', headerRight: () => null }} />
        </Stack>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
