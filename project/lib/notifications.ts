/**
 * notifications.ts
 * Real push notifications for medicine reminders.
 * Uses expo-notifications — works on iOS, Android, and web.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '@/context/AppContext';

// ─── SETUP ────────────────────────────────────────────────────────────────────

// Only set notification handler on native — web doesn't support it
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });
}

// ─── PERMISSIONS ──────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (!('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
    },
  });
  return status === 'granted';
}

// ─── CATEGORIES (action buttons) ─────────────────────────────────────────────

export async function registerNotificationCategories(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setNotificationCategoryAsync('MEDICINE_REMINDER', [
      {
        identifier: 'TAKEN',
        buttonTitle: '✅ Taken',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'SNOOZE',
        buttonTitle: '⏰ Snooze 30 min',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch (e) {
    console.warn('[Notifications] Could not register categories:', e);
  }
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────

function parseTime(timeStr: string): { hour: number; minute: number } {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hour: 8, minute: 0 };
  let hour   = parseInt(match[1]);
  const min  = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return { hour, minute: min };
}

export async function scheduleReminderNotifications(reminder: Reminder): Promise<string[]> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    console.warn('[Notifications] Permission not granted');
    return [];
  }

  // Register categories right before scheduling (ensures they exist)
  await registerNotificationCategories();

  const ids: string[] = [];

  for (const slot of reminder.timeSlots) {
    const { hour, minute } = parseTime(slot);

    if (Platform.OS === 'web') {
      scheduleWebNotification(reminder, slot, hour, minute);
      ids.push(`web-${reminder.id}-${slot}`);
      continue;
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title:              '💊 Medicine Reminder',
          body:               `Time to take ${reminder.medicineName} — ${reminder.dosage}`,
          subtitle:           slot,
          data:               { reminderId: reminder.id, medicineName: reminder.medicineName, slot },
          sound:              true,
          categoryIdentifier: 'MEDICINE_REMINDER',
        },
        trigger: {
          type:    Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      ids.push(id);
      console.log(`[Notifications] Scheduled "${reminder.medicineName}" at ${slot} → id: ${id}`);
    } catch (e) {
      console.warn('[Notifications] Failed to schedule:', e);
    }
  }

  return ids;
}

export async function cancelReminderNotifications(notificationIds: string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.all(
    notificationIds
      .filter(id => !id.startsWith('web-'))
      .map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  );
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── WEB FALLBACK ─────────────────────────────────────────────────────────────

function scheduleWebNotification(
  reminder: Reminder,
  slot: string,
  hour: number,
  minute: number
) {
  const now  = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();

  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(`💊 ${reminder.medicineName}`, {
        body: `Time to take ${reminder.dosage} — ${slot}`,
        icon: '/assets/images/icon.png',
        tag:  `reminder-${reminder.id}`,
        requireInteraction: true,
      });
      n.onclick = () => { window.focus(); n.close(); };
    }
    scheduleWebNotification(reminder, slot, hour, minute);
  }, delay);
}

// ─── IMMEDIATE TEST ───────────────────────────────────────────────────────────

export async function sendTestNotification(medicineName: string, dosage: string): Promise<void> {
  if (Platform.OS === 'web') {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`💊 ${medicineName}`, { body: `Time to take ${dosage}` });
    } else {
      await requestNotificationPermission();
    }
    return;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title:              '💊 Medicine Reminder',
      body:               `Time to take ${medicineName} — ${dosage}`,
      sound:              true,
      categoryIdentifier: 'MEDICINE_REMINDER',
      data:               { medicineName, dosage },
    },
    trigger: null, // fire immediately
  });
}

// ─── DEBUG: list all scheduled notifications ─────────────────────────────────

export async function listScheduledNotifications() {
  if (Platform.OS === 'web') return [];
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`[Notifications] ${scheduled.length} scheduled:`,
    scheduled.map(n => `${n.content.body} @ ${JSON.stringify(n.trigger)}`));
  return scheduled;
}
