import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSentState, setEmailSentState] = useState<'none' | 'signup' | 'reset'>('none');

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Hold on', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
      setLoading(false);
    } else {
      router.replace('/');
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Hold on', 'Please enter an email and password to register.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else if (data.session) {
      router.replace('/');
    } else {
      // Show the success UI instead of just an alert
      setEmailSentState('signup');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEmailSentState('reset');
    }
    setLoading(false);
  };

  // --- NEW: The Success UI State ---
  if (emailSentState !== 'none') {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="mail-open-outline" size={80} color="#ff6600" />
        <Text style={styles.successTitle}>Check your inbox</Text>
        <Text style={styles.successSub}>
          {emailSentState === 'signup'
            ? `We've sent a confirmation link to ${email}. Please click it to activate your Moto Log account.`
            : `We've sent a password reset link to ${email}.`}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setEmailSentState('none')}>
          <Text style={styles.primaryButtonText}>BACK TO LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <View style={styles.header}>
          <Text style={styles.title}>MOTO LOG</Text>
          <Text style={styles.subtitle}>Your digital service manual.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="rider@example.com"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>

          {/* NEW: Forgot Password Link */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordWrapper}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#ff6600" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
                <Text style={styles.primaryButtonText}>SIGN IN</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleSignUp}>
                <Text style={styles.secondaryButtonText}>CREATE ACCOUNT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { alignItems: 'center', marginBottom: 60, marginTop: 40 },
  title: { color: '#ff6600', fontSize: 42, fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: '#888', fontSize: 16, marginTop: 8 },

  form: { backgroundColor: '#1c1c1e', padding: 24, borderRadius: 12 },
  label: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
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

  forgotPasswordWrapper: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#ff6600',
    fontSize: 14,
    fontWeight: '600',
  },

  buttonContainer: { marginTop: 30, gap: 16 },
  primaryButton: { backgroundColor: '#ff6600', padding: 16, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6600',
  },
  secondaryButtonText: { color: '#ff6600', fontSize: 16, fontWeight: 'bold' },

  // Success UI Styles
  successContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  successSub: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
});
