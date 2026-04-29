import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Use localStorage on web, in-memory on native (AsyncStorage causes issues in web builds)
const storage = Platform.OS === 'web'
  ? {
      getItem: (key: string) => {
        try { return Promise.resolve(localStorage.getItem(key)); } catch { return Promise.resolve(null); }
      },
      setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch {}
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        try { localStorage.removeItem(key); } catch {}
        return Promise.resolve();
      },
    }
  : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
