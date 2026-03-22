import * as Sentry from '@sentry/react-native';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons'; // Added for the gear icon
import { SettingsProvider } from '../context/SettingsContext'; // Added for global state
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';

Sentry.init({
  dsn: 'https://ee2729a64bdcfcd7abc30c946130e868@o4511089449107456.ingest.de.sentry.io/4511089464639568',
  debug: false,
  tracesSampleRate: 1.0,
});

//TODO: remove this line after real testing starts: Silence the Expo Go notification warning
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // 1. Check if they are already logged in when the app opens
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialized(true);
    });

    // 2. Listen for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. The Auth Guard Logic
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'login';

    if (!session && !inAuthGroup) {
      // If they have no session and are trying to access the app, kick them to login
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // If they are logged in and try to go to the login screen, push them to the garage
      router.replace('/');
    }
  }, [session, isInitialized, segments]);

  // Show a dark screen with a spinner while we check their token
  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#121212',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

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
          {/* Hide header on login */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="bike/[id]" options={{ title: 'Bike Profile' }} />
          <Stack.Screen name="add-bike" options={{ title: 'Add Motorcycle' }} />
          <Stack.Screen name="log-service" options={{ title: 'Log Service' }} />

          {/* Added the missing screens we built earlier */}
          <Stack.Screen name="edit-log" options={{ title: 'Edit Log' }} />
          <Stack.Screen name="edit-bike" options={{ title: 'Edit Bike' }} />
          <Stack.Screen name="add-schedule" options={{ title: 'Set Schedule' }} />
          <Stack.Screen name="edit-schedule" options={{ title: 'Edit Schedule' }} />

          {/* The new Settings Screen (We hide the gear icon on this specific screen) */}
          <Stack.Screen name="settings" options={{ title: 'Settings', headerRight: () => null }} />
        </Stack>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
