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
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function AddBikeScreen() {
  const router = useRouter();
  const { unit } = useSettings();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [nickname, setNickname] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true); // NEW: Loading state for our check

  // NEW: The Paywall Interceptor
  useEffect(() => {
    const checkGarageLimit = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Check if user is Pro
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', user.id)
          .single();

        if (profile?.is_pro) {
          setIsCheckingLimit(false);
          return; // Pro users bypass the lock
        }

        // 2. If Free, count their current bikes
        const { count } = await supabase
          .from('motorcycles')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (count && count >= 1) {
          // 3. Trigger the Paywall Alert
          Alert.alert(
            'Garage Full 🛑',
            'Free accounts are limited to 1 motorcycle.\n\nUpgrade to Moto Log Pro to add unlimited bikes and unlock PDF logbook exports!',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
              {
                text: 'Upgrade to Pro',
                style: 'default',
                onPress: () => {
                  // We will map this to the real paywall screen in Phase 3!
                  Alert.alert('Coming Soon', 'We are building the RevenueCat paywall next!');
                  router.back();
                },
              },
            ],
          );
        } else {
          // Free user, but garage is empty. Let them in!
          setIsCheckingLimit(false);
        }
      } catch (err) {
        console.error('Limit Check Error:', err);
        setIsCheckingLimit(false); // Failsafe: let them in if network blips
      }
    };

    checkGarageLimit();
  }, []);

  const handleSave = async () => {
    if (!make || !model || !odometer) {
      Alert.alert('Missing Info', 'Make, model, and odometer are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Could not find logged-in user.');

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

      if (error) throw error;
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a loading spinner while checking the database so the user doesn't see the form yet
  if (isCheckingLimit) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
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
      </KeyboardAwareScrollView>

      <TouchableOpacity
        style={[styles.floatingButton, isSubmitting && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.floatingButtonText}>SAVE MOTORCYCLE</Text>
        )}
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
});
