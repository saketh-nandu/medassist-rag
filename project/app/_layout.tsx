import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    const inAuth = segments[0] === 'login' || segments[0] === 'signup';
    if (!session && !inAuth) router.replace('/login');
    else if (session && inAuth) router.replace('/(tabs)');
  }, [session, segments]);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }
  return <>{children}</>;
}

// Handles notification action responses (Taken / Snooze)
function NotificationHandler() {
  const { toggleReminderTaken, reminders } = useApp();

  useEffect(() => {
    // Foreground: notification received while app is open
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notification] Received in foreground:', notification.request.content.title);
    });

    // Background/killed: user tapped a notification or action button
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const action     = response.actionIdentifier;
      const data       = response.notification.request.content.data as any;
      const reminderId = data?.reminderId;

      if (!reminderId) return;

      if (action === 'TAKEN' || action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        const r = reminders.find(x => x.id === reminderId);
        if (r && !r.takenToday) toggleReminderTaken(reminderId);
      }

      if (action === 'SNOOZE') {
        Notifications.scheduleNotificationAsync({
          content: {
            title:              '💊 Medicine Reminder (Snoozed)',
            body:               `Don't forget: ${data?.medicineName}`,
            sound:              true,
            categoryIdentifier: 'MEDICINE_REMINDER',
            data,
          },
          trigger: {
            type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 30 * 60,
          },
        });
      }
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [reminders, toggleReminderTaken]);

  return null;
}

function ThemedApp() {
  const { darkMode, toggleDarkMode, colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NotificationHandler />
      <AuthGate>
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" options={{
            contentStyle: { backgroundColor: colors.background },
          }} />
          <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthGate>
      <StatusBar style={darkMode ? 'light' : 'dark'} backgroundColor={colors.background} />
    </View>
  );
}

function AppWithTheme() {
  const { darkMode, toggleDarkMode } = useApp();
  return (
    <ThemeProvider darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <AppProvider>
      <AppWithTheme />
    </AppProvider>
  );
}
