import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Animated, SafeAreaView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Stethoscope, Camera, MapPin, Bell, ChevronRight, TriangleAlert as AlertTriangle, Clock, ArrowRight, Activity, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/context/AppContext';
import Card from '@/components/Card';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

const QUICK_ACTIONS = [
  { id: 'symptoms', icon: Stethoscope, label: 'Check\nSymptoms', color: colors.primary, bg: colors.primaryLight },
  { id: 'image', icon: Camera, label: 'Upload\nImage', color: colors.secondary, bg: colors.secondaryLight },
  { id: 'nearby', icon: MapPin, label: 'Find Nearby\nHelp', color: colors.warning, bg: colors.warningLight },
];

const RECENT_ACTIVITY = [
  { id: '1', title: 'Symptom Check', subtitle: 'Headache · Low Risk', time: '2h ago', color: colors.secondary },
  { id: '2', title: 'Nearby Search', subtitle: 'Apollo Hospital · 1.2 km', time: 'Yesterday', color: colors.primary },
  { id: '3', title: 'Medicine Reminder', subtitle: 'Vitamin D3 taken', time: 'Today 8:00 AM', color: colors.secondary },
];

const HEALTH_TIPS = [
  { tip: 'Stay hydrated — drink 8 glasses of water today', icon: '💧' },
  { tip: 'Take a 10-minute walk to boost circulation', icon: '🚶' },
  { tip: "Don't skip your morning medications", icon: '💊' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile, emergencyActive, setEmergencyActive, messages, reminders } = useApp();
  const [query, setQuery] = useState('');
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const tipIndex = new Date().getDate() % HEALTH_TIPS.length;

  // Build recent activity from real messages + reminders
  const recentActivity = React.useMemo(() => {
    const items: { id: string; title: string; subtitle: string; time: string; color: string }[] = [];

    // Last 2 AI responses with conditions
    const aiMsgs = [...messages].reverse().filter(m => m.role === 'assistant' && m.conditions && m.conditions!.length > 0).slice(0, 2);
    aiMsgs.forEach(m => {
      const ago = Math.round((Date.now() - m.timestamp.getTime()) / 60000);
      const timeStr = ago < 60 ? `${ago}m ago` : ago < 1440 ? `${Math.round(ago / 60)}h ago` : 'Yesterday';
      items.push({ id: m.id, title: 'Symptom Check', subtitle: (m.conditions![0] || 'Analysis') + ' · ' + (m.severity === 'high' ? 'High Risk' : m.severity === 'medium' ? 'Medium Risk' : 'Low Risk'), time: timeStr, color: m.severity === 'high' ? colors.emergency : m.severity === 'medium' ? colors.warning : colors.secondary });
    });

    // Taken reminders today
    reminders.filter(r => r.takenToday).slice(0, 2).forEach(r => {
      items.push({ id: r.id, title: 'Medicine Taken', subtitle: `${r.medicineName} · ${r.dosage}`, time: 'Today ' + r.timeSlots[0], color: colors.secondary });
    });

    return items.length > 0 ? items : RECENT_ACTIVITY;
  }, [messages, reminders]);

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
              <View style={styles.notifDot} />
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

          {/* Vitals Overview */}
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.vitalsRow}>
            <Card style={styles.vitalCard}>
              <View style={styles.vitalInner}>
                <Heart size={18} color={colors.emergency} />
                <Text style={styles.vitalValue}>{reminders.filter(r => r.takenToday).length}/{reminders.length || '—'}</Text>
                <Text style={styles.vitalLabel}>Meds</Text>
              </View>
            </Card>
            <Card style={styles.vitalCard}>
              <View style={styles.vitalInner}>
                <Activity size={18} color={colors.primary} />
                <Text style={styles.vitalValue}>{messages.filter(m => m.role === 'user').length}</Text>
                <Text style={styles.vitalLabel}>Queries</Text>
              </View>
            </Card>
            <Card style={styles.vitalCard}>
              <View style={styles.vitalInner}>
                <Stethoscope size={18} color={colors.secondary} />
                <Text style={styles.vitalValue}>{reminders.length > 0 ? Math.round((reminders.filter(r => r.takenToday).length / reminders.length) * 100) : 100}%</Text>
                <Text style={styles.vitalLabel}>Adherence</Text>
              </View>
            </Card>
          </View>

          {/* Recent Activity */}
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((item) => (
            <Card key={item.id} style={styles.activityCard} onPress={() => {}}>
              <View style={styles.activityInner}>
                <View style={[styles.activityDot, { backgroundColor: item.color }]} />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySub}>{item.subtitle}</Text>
                </View>
                <View style={styles.activityRight}>
                  <Clock size={11} color={colors.textTertiary} />
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>
            </Card>
          ))}

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
  activityDot: { width: 10, height: 10, borderRadius: 5 },
  activityInfo: { flex: 1 },
  activityTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  activitySub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  activityRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  activityTime: { ...typography.caption, color: colors.textTertiary },
});





