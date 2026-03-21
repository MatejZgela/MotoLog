import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Paste your copied URL and Publishable Key inside these quotes:
const supabaseUrl = 'https://oybgziulwumrjlubdvnd.supabase.co';
const supabasePublishableKey = 'sb_publishable_DHfK8S1hya8rf8s7sGM7bQ_ynv7ODjQ';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
