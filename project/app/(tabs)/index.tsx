import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Search, Stethoscope, Camera, MapPin, Bell, ChevronRight, TriangleAlert as AlertTriangle, Clock, ArrowRight, Activity, MessageCircle, Pill } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

const QUICK_ACTIONS = [
  { id: 'symptoms', icon: Stethoscope, label: 'Check\nSymptoms', color: colors.primary, bg: colors.primaryLight },
  { id: 'image', icon: Camera, label: 'Upload\nImage', color: colors.secondary, bg: colors.secondaryLight },
  { id: 'nearby', icon: MapPin, label: 'Find Nearby\nHelp', color: colors.warning, bg: colors.warningLight },
];

const HEALTH_TIPS = [
  { tip: 'Stay hydrated — drink 8 glasses of water today', icon: '💧' },
  { tip: 'Take a 10-minute walk to boost circulation', icon: '🚶' },
  { tip: "Don't skip your morning medications", icon: '💊' },
  { tip: 'Get 7–8 hours of sleep for better immunity', icon: '😴' },
  { tip: 'Eat a fruit or vegetable with every meal', icon: '🥗' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile, reminders, loadSession } = useApp();
  const [query, setQuery] = useState('');
  const tipIndex = new Date().getDate() % HEALTH_TIPS.length;

  // Recent activity loaded directly from DB
  const [recentActivity, setRecentActivity] = useState<{
    id: string; title: string; subtitle: string; time: string;
    color: string; sessionId?: string; type: 'chat' | 'medicine';
  }[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Stats loaded from DB
  const [totalQueries, setTotalQueries] = useState(0);

  // Reload every time this tab comes into focus (catches new chats)
  useFocusEffect(
    useCallback(() => {
      loadActivity();
    }, [reminders])
  );

  async function loadActivity() {
    setActivityLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecentActivity([]);
        return;
      }

      // Load last 30 messages ordered newest first
      const { data: allMsgs, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, severity, conditions, created_at, session_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) console.warn('[loadActivity] query error:', error.message);

      // Total user queries count
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user');
      setTotalQueries(count || 0);

      const items: typeof recentActivity = [];
      const seenSessions = new Set<string>();

      // One entry per session using the user's message as label
      for (const m of (allMsgs || [])) {
        if (m.role !== 'user') continue;
        const sid = m.session_id || m.id;
        if (seenSessions.has(sid)) continue;
        seenSessions.add(sid);

        const created = new Date(m.created_at);
        const ago = Math.round((Date.now() - created.getTime()) / 60000);
        const timeStr = ago < 1 ? 'Just now'
          : ago < 60 ? `${ago}m ago`
          : ago < 1440 ? `${Math.round(ago / 60)}h ago`
          : ago < 2880 ? 'Yesterday'
          : created.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        items.push({
          id: m.id,
          title: 'Chat',
          subtitle: m.content.length > 55 ? m.content.slice(0, 55) + '…' : m.content,
          time: timeStr,
          color: colors.primary,
          sessionId: m.session_id,
          type: 'chat',
        });

        if (items.length >= 8) break;
      }

      // Medicine taken today
      for (const r of reminders.filter(r => r.takenToday).slice(0, 2)) {
        items.push({
          id: r.id,
          title: 'Medicine Taken',
          subtitle: `${r.medicineName} · ${r.dosage}`,
          time: 'Today ' + r.timeSlots[0],
          color: colors.secondary,
          type: 'medicine',
        });
      }

      setRecentActivity(items);
    } catch (e) {
      console.warn('[loadActivity] error:', e);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }

  async function handleActivityPress(item: typeof recentActivity[0]) {
    if (item.type === 'chat') {
      if (item.sessionId) {
        await loadSession(item.sessionId);
      } else {
        // No session_id yet — load all messages for this user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await loadSession(`legacy_session_${user.id}`);
      }
      router.push('/(tabs)/chat');
    } else if (item.type === 'medicine') {
      router.push('/(tabs)/monitor');
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  function handleSearch() {
    if (!query.trim()) return;
    router.push({ pathname: '/(tabs)/chat', params: { initialMessage: query } });
    setQuery('');
  }

  function handleQuickAction(id: string) {
    if (id === 'symptoms' || id === 'image') {
      router.push('/(tabs)/chat');
    } else if (id === 'nearby') {
      router.push('/(tabs)/map');
    }
  }

  const medsTaken = reminders.filter(r => r.takenToday).length;
  const medsTotal = reminders.length;
  const adherencePct = medsTotal > 0 ? Math.round((medsTaken / medsTotal) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#0F766E', '#0D9488', '#14B8A6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingSmall}>{greeting} 👋</Text>
              <Text style={styles.greetingName}>{profile.name.split(' ')[0]}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(tabs)/monitor')}>
              <Bell size={20} color="#fff" />
              {medsTotal > 0 && medsTaken < medsTotal && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>How are you feeling today?</Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Describe your symptoms..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleSearch} style={styles.searchGo}>
                <ArrowRight size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Health Tip */}
          <Card style={styles.tipCard}>
            <View style={styles.tipContent}>
              <Text style={styles.tipEmoji}>{HEALTH_TIPS[tipIndex].icon}</Text>
              <View style={styles.tipTextWrap}>
                <Text style={styles.tipLabel}>Daily Health Tip</Text>
                <Text style={styles.tipText}>{HEALTH_TIPS[tipIndex].tip}</Text>
              </View>
            </View>
          </Card>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map(({ id, icon: Icon, label, color, bg }) => (
              <TouchableOpacity
                key={id}
                style={[styles.quickCard, { backgroundColor: bg }]}
                onPress={() => handleQuickAction(id)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIcon, { backgroundColor: color + '22' }]}>
                  <Icon size={22} color={color} />
                </View>
                <Text style={[styles.quickLabel, { color }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Emergency Banner */}
          <TouchableOpacity
            style={styles.emergencyBanner}
            onPress={() => router.push('/emergency')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#DC2626', '#EF4444']}
              style={styles.emergencyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <AlertTriangle size={20} color="#fff" />
              <View style={styles.emergencyText}>
                <Text style={styles.emergencyTitle}>Emergency Help</Text>
                <Text style={styles.emergencySubtitle}>Call 108 · Find nearest hospital</Text>
              </View>
              <ChevronRight size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Today's Overview — real data */}
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.vitalsRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(tabs)/monitor')} activeOpacity={0.8}>
              <Card style={styles.vitalCard}>
                <View style={styles.vitalInner}>
                  <Pill size={18} color={colors.emergency} />
                  <Text style={styles.vitalValue}>{medsTaken}/{medsTotal || '—'}</Text>
                  <Text style={styles.vitalLabel}>Meds</Text>
                </View>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(tabs)/chat')} activeOpacity={0.8}>
              <Card style={styles.vitalCard}>
                <View style={styles.vitalInner}>
                  <MessageCircle size={18} color={colors.primary} />
                  <Text style={styles.vitalValue}>{totalQueries}</Text>
                  <Text style={styles.vitalLabel}>Queries</Text>
                </View>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(tabs)/monitor')} activeOpacity={0.8}>
              <Card style={styles.vitalCard}>
                <View style={styles.vitalInner}>
                  <Activity size={18} color={colors.secondary} />
                  <Text style={styles.vitalValue}>{adherencePct}%</Text>
                  <Text style={styles.vitalLabel}>Adherence</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Recent Activity — real clickable data */}
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            )}
          </View>

          {activityLoading ? (
            <Card style={styles.emptyCard}>
              <ActivityIndicator color={colors.primary} size="small" />
            </Card>
          ) : recentActivity.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySub}>Start a chat or add medicine reminders</Text>
              <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/(tabs)/chat')}>
                <Text style={styles.startBtnText}>Start a Chat →</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            recentActivity.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleActivityPress(item)}
                activeOpacity={0.75}
              >
                <Card style={styles.activityCard}>
                  <View style={styles.activityInner}>
                    <View style={[styles.activityIcon, { backgroundColor: item.color + '18' }]}>
                      {item.type === 'chat'
                        ? <MessageCircle size={16} color={item.color} />
                        : <Pill size={16} color={item.color} />
                      }
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activitySub}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.activityRight}>
                      <Clock size={11} color={colors.textTertiary} />
                      <Text style={styles.activityTime}>{item.time}</Text>
                      {item.type === 'chat' && <ChevronRight size={14} color={colors.textTertiary} />}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: spacing.xxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },

  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.base,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greetingSmall: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500' },
  greetingName: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 2 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emergency,
    position: 'absolute',
    top: 8,
    right: 8,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: spacing.base },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    gap: spacing.sm,
    ...shadows.md,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  searchGo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { paddingHorizontal: spacing.base, marginTop: -spacing.xl },

  tipCard: {
    marginBottom: spacing.base,
    ...shadows.md,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  tipEmoji: { fontSize: 28 },
  tipTextWrap: { flex: 1 },
  tipLabel: { ...typography.caption, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tipText: { ...typography.bodySmall, color: colors.text, marginTop: 2, lineHeight: 18 },

  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.base,
  },

  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  quickCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },

  emergencyBanner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.base,
    ...shadows.emergency,
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  emergencyText: { flex: 1 },
  emergencyTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emergencySubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

  vitalsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  vitalCard: { flex: 1 },
  vitalInner: { padding: spacing.md, alignItems: 'center', gap: 4 },
  vitalValue: { ...typography.h3, color: colors.text },
  vitalLabel: { ...typography.caption, color: colors.textSecondary },

  activityCard: { marginBottom: spacing.sm },
  activityInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  activityIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  activityInfo: { flex: 1 },
  activityTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  activitySub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  activityRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  activityTime: { ...typography.caption, color: colors.textTertiary },
  activityHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.base,
  },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  emptyCard: { padding: spacing.xl, alignItems: 'center', marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  emptySub: { ...typography.bodySmall, color: colors.textTertiary, marginTop: 4, textAlign: 'center' },
  startBtn: {
    marginTop: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primaryMid,
  },
  startBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});





