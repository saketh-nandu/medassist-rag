import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  scheduleReminderNotifications,
  cancelReminderNotifications,
  cancelAllNotifications,
  registerNotificationCategories,
  requestNotificationPermission,
} from '@/lib/notifications';
import * as Notifications from 'expo-notifications';

export type SeverityLevel = 'low' | 'medium' | 'high';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  severity?: SeverityLevel;
  conditions?: string[];
  suggestedActions?: string[];
  affectedAreas?: string[];
  isImage?: boolean;
  isEmergency?: boolean;
  confidence?: number;
  sessionId?: string;
}

export interface HealthReport {
  id: string;
  title: string;
  conditions: string[];
  severity: SeverityLevel;
  suggestedActions: string[];
  affectedAreas: string[];
  createdAt: Date;
  sessionId?: string;
}

export interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timeSlots: string[];
  status: 'active' | 'paused';
  takenToday: boolean;
  // Adherence tracking for fading redness
  totalDoses: number;       // total doses prescribed (e.g. 7 days × 2/day = 14)
  takenDoses: number;       // how many doses taken so far
  startDate: string;        // ISO date string
  durationDays: number;     // course duration in days
  notificationIds: string[]; // scheduled notification IDs
}

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
}

interface AppContextType {
  emergencyActive: boolean;
  setEmergencyActive: (v: boolean) => void;
  // Chat
  messages: ChatMessage[];           // current session messages
  messagesLoading: boolean;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;         // clears current session, starts new one
  // Session management
  currentSessionId: string;
  loadSession: (sessionId: string) => Promise<void>; // load a past session into chat
  // Reminders
  reminders: Reminder[];
  remindersLoading: boolean;
  addReminder: (r: Reminder) => void;
  toggleReminderTaken: (id: string) => void;
  removeReminder: (id: string) => void;
  // Reports
  reports: HealthReport[];
  reportsLoading: boolean;
  // Profile
  profile: UserProfile;
  updateProfile: (p: Partial<UserProfile>) => void;
  // UI
  highlightedAreas: string[];
  setHighlightedAreas: (areas: string[]) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  privacyMode: boolean;
  setPrivacyMode: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const defaultProfile: UserProfile = {
  name: 'User', age: 25, gender: 'Male',
  bloodType: 'O+', allergies: [], conditions: [],
};

// ─── ROW CONVERTERS ───────────────────────────────────────────────────────────

function rowToMessage(row: any): ChatMessage {
  return {
    id:               row.id,
    role:             row.role,
    content:          row.content,
    timestamp:        new Date(row.created_at),
    severity:         row.severity,
    conditions:       row.conditions || [],
    suggestedActions: row.suggested_actions || [],
    affectedAreas:    row.affected_areas || [],
    isImage:          row.is_image || false,
    sessionId:        row.session_id || undefined,
  };
}

function messageToRow(m: ChatMessage, userId: string, sessionId: string) {
  return {
    id:                m.id,
    user_id:           userId,
    role:              m.role,
    content:           m.content,
    severity:          m.severity || null,
    conditions:        m.conditions || [],
    suggested_actions: m.suggestedActions || [],
    affected_areas:    m.affectedAreas || [],
    is_image:          m.isImage || false,
    created_at:        m.timestamp.toISOString(),
    session_id:        sessionId,
  };
}

function rowToReport(row: any): HealthReport {
  return {
    id:               String(row.id),
    title:            row.title,
    conditions:       row.conditions || [],
    severity:         row.severity || 'low',
    suggestedActions: row.suggested_actions || [],
    affectedAreas:    row.affected_areas || [],
    createdAt:        new Date(row.created_at),
    sessionId:        row.session_id || undefined,
  };
}

function rowToReminder(row: any): Reminder {
  return {
    id:              row.id,
    medicineName:    row.medicine_name,
    dosage:          row.dosage,
    frequency:       row.frequency,
    timeSlots:       row.time_slots || ['08:00 AM'],
    status:          row.status,
    takenToday:      row.taken_today,
    totalDoses:      row.total_doses   || 14,
    takenDoses:      row.taken_doses   || 0,
    startDate:       row.start_date    || new Date().toISOString().split('T')[0],
    durationDays:    row.duration_days || 7,
    notificationIds: row.notification_ids || [],
  };
}

function reminderToRow(r: Reminder, userId: string) {
  return {
    id:               r.id,
    user_id:          userId,
    medicine_name:    r.medicineName,
    dosage:           r.dosage,
    frequency:        r.frequency,
    time_slots:       r.timeSlots,
    status:           r.status,
    taken_today:      r.takenToday,
    taken_date:       r.takenToday ? new Date().toISOString().split('T')[0] : null,
    total_doses:      r.totalDoses,
    taken_doses:      r.takenDoses,
    start_date:       r.startDate,
    duration_days:    r.durationDays,
    notification_ids: r.notificationIds,
  };
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [emergencyActive,  setEmergencyActive]  = useState(false);
  const [messages,         setMessages]         = useState<ChatMessage[]>([]);
  const [messagesLoading,  setMessagesLoading]  = useState(false);
  const [reminders,        setReminders]        = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [reports,          setReports]          = useState<HealthReport[]>([]);
  const [reportsLoading,   setReportsLoading]   = useState(false);
  const [userId,           setUserId]           = useState<string | null>(null);
  const [profile,          setProfile]          = useState<UserProfile>(defaultProfile);
  const [highlightedAreas, setHighlightedAreas] = useState<string[]>([]);
  const [darkMode,         setDarkMode]         = useState(false);
  const [notifications,    setNotifications]    = useState(true);
  const [privacyMode,      setPrivacyMode]      = useState(false);

  // Each "conversation" gets a unique session ID
  // New session on every app open / after clearMessages
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => generateSessionId());

  function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // ── Auth + initial load ───────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user) bootstrap(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const user = session?.user;
      if (user) {
        bootstrap(user);
      } else {
        setUserId(null);
        setMessages([]);
        setReminders([]);
        setReports([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function bootstrap(user: any) {
    setUserId(user.id);
    loadProfileFromMeta(user.user_metadata);
    loadMessages(user.id);
    loadReminders(user.id);
    loadReports(user.id);
    // Setup notifications: request permission first, then register categories
    requestNotificationPermission().then(granted => {
      if (granted) registerNotificationCategories();
    });
  }

  function loadProfileFromMeta(meta: any) {
    if (!meta) return;
    setProfile({
      name:       meta.full_name  || defaultProfile.name,
      age:        meta.age        || defaultProfile.age,
      gender:     meta.gender     || defaultProfile.gender,
      bloodType:  meta.blood_type || defaultProfile.bloodType,
      allergies:  meta.allergies  || [],
      conditions: meta.conditions || [],
    });
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  // On boot: start fresh (empty chat). History lives in reports.
  async function loadMessages(uid: string) {
    // Don't load old messages on boot — always start fresh
    // Past sessions are accessible via reports → loadSession()
    setMessages([]);
    setMessagesLoading(false);
  }

  // Load a specific past session's messages into the chat view
  const loadSession = useCallback(async (sessionId: string) => {
    setMessagesLoading(true);
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      // If it's a legacy session, fall back to loading by user_id
      if (sessionId.startsWith('legacy_session_')) {
        const uid = sessionId.replace('legacy_session_', '');
        query = query.eq('user_id', uid).limit(200);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const loaded = (data || []).map(rowToMessage);
      if (loaded.length === 0) {
        // session_id column may not exist yet — show a helpful message
        console.warn('[loadSession] No messages found for session:', sessionId);
      }
      setMessages(loaded);
      setCurrentSessionId(sessionId);
    } catch (err: any) {
      console.warn('Could not load session:', err?.message || err);
      // If column doesn't exist, try loading all messages for this user
      if (userId) {
        try {
          const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(200);
          setMessages((data || []).map(rowToMessage));
        } catch (_) {}
      }
    } finally {
      setMessagesLoading(false);
    }
  }, [userId]);

  const addMessage = useCallback(async (msg: ChatMessage) => {
    const msgWithSession = { ...msg, sessionId: currentSessionId };
    // Optimistic update
    setMessages(prev => [...prev, msgWithSession]);

    if (!userId) return;

    // Save to DB with session_id
    const { error } = await supabase
      .from('chat_messages')
      .insert(messageToRow(msgWithSession, userId, currentSessionId));

    if (error) {
      console.warn('Failed to save message:', error.message);
    }

    // Auto-generate report for assistant messages with conditions
    if (
      msg.role === 'assistant' &&
      msg.conditions && msg.conditions.length > 0 &&
      msg.severity && msg.severity !== 'low'
    ) {
      const report = {
        user_id:           userId,
        title:             msg.conditions[0] + ' Analysis',
        conditions:        msg.conditions,
        severity:          msg.severity,
        suggested_actions: msg.suggestedActions || [],
        affected_areas:    msg.affectedAreas || [],
        chat_message_id:   msg.id,
        session_id:        currentSessionId,
      };
      const { data: rData } = await supabase
        .from('health_reports')
        .insert(report)
        .select()
        .single();

      if (rData) {
        setReports(prev => [rowToReport(rData), ...prev]);
      }
    }
  }, [userId, currentSessionId]);

  // Clear current session and start a brand new one
  const clearMessages = useCallback(async () => {
    setMessages([]);
    setCurrentSessionId(generateSessionId());
  }, []);

  // ── Reports ───────────────────────────────────────────────────────────────

  async function loadReports(uid: string) {
    setReportsLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setReports((data || []).map(rowToReport));
    } catch (err) {
      console.warn('Could not load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }

  // ── Reminders ─────────────────────────────────────────────────────────────

  async function loadReminders(uid: string) {
    setRemindersLoading(true);
    try {
      await Promise.resolve(supabase.rpc('reset_taken_today')).catch(() => {});
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setReminders((data || []).map(rowToReminder));
    } catch (err) {
      console.warn('Could not load reminders:', err);
    } finally {
      setRemindersLoading(false);
    }
  }

  const addReminder = useCallback(async (r: Reminder) => {
    // Schedule notifications first
    const notifIds = await scheduleReminderNotifications(r);
    const withNotifs = { ...r, notificationIds: notifIds };

    setReminders(prev => [...prev, withNotifs]);
    if (!userId) return;

    const { error } = await supabase.from('reminders').insert(reminderToRow(withNotifs, userId));
    if (error) {
      console.warn('Failed to save reminder:', error.message);
      setReminders(prev => prev.filter(x => x.id !== r.id));
      await cancelReminderNotifications(notifIds);
    }
  }, [userId]);

  const toggleReminderTaken = useCallback(async (id: string) => {
    let newTaken = false;
    let newTakenDoses = 0;

    setReminders(prev => prev.map(r => {
      if (r.id === id) {
        newTaken = !r.takenToday;
        newTakenDoses = newTaken ? r.takenDoses + 1 : Math.max(0, r.takenDoses - 1);
        return { ...r, takenToday: newTaken, takenDoses: newTakenDoses };
      }
      return r;
    }));

    if (!userId) return;
    const { error } = await supabase
      .from('reminders')
      .update({
        taken_today: newTaken,
        taken_date:  newTaken ? new Date().toISOString().split('T')[0] : null,
        taken_doses: newTakenDoses,
      })
      .eq('id', id).eq('user_id', userId);

    if (error) {
      console.warn('Failed to update reminder:', error.message);
      setReminders(prev => prev.map(r => r.id === id ? { ...r, takenToday: !newTaken, takenDoses: newTaken ? newTakenDoses - 1 : newTakenDoses + 1 } : r));
    }
  }, [userId]);

  const removeReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    setReminders(prev => prev.filter(r => r.id !== id));
    // Cancel its notifications
    if (reminder?.notificationIds?.length) {
      await cancelReminderNotifications(reminder.notificationIds);
    }
    if (!userId) return;
    const { error } = await supabase.from('reminders').delete().eq('id', id).eq('user_id', userId);
    if (error) { console.warn('Failed to delete reminder:', error.message); loadReminders(userId); }
  }, [userId, reminders]);

  // ── Profile ───────────────────────────────────────────────────────────────

  const updateProfile = useCallback(async (p: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...p }));
    const meta: Record<string, any> = {};
    if (p.name       !== undefined) meta.full_name  = p.name;
    if (p.age        !== undefined) meta.age        = p.age;
    if (p.gender     !== undefined) meta.gender     = p.gender;
    if (p.bloodType  !== undefined) meta.blood_type = p.bloodType;
    if (p.allergies  !== undefined) meta.allergies  = p.allergies;
    if (p.conditions !== undefined) meta.conditions = p.conditions;
    if (Object.keys(meta).length > 0) await supabase.auth.updateUser({ data: meta });
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode(v => !v), []);

  return (
    <AppContext.Provider value={{
      emergencyActive, setEmergencyActive,
      messages, messagesLoading, addMessage, clearMessages,
      currentSessionId, loadSession,
      reminders, remindersLoading, addReminder, toggleReminderTaken, removeReminder,
      reports, reportsLoading,
      profile, updateProfile,
      highlightedAreas, setHighlightedAreas,
      darkMode, toggleDarkMode,
      notifications, setNotifications,
      privacyMode, setPrivacyMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
