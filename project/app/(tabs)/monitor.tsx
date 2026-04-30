import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Plus, X, Bell, BellOff, CalendarDays, Brain } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp, Reminder } from '@/context/AppContext';
import AnatomyViewer from '@/components/AnatomyViewer';
import ReminderCard from '@/components/ReminderCard';
import ModelEvaluation from '@/components/ModelEvaluation';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const today = new Date().getDay();

export default function MonitorScreen() {
  const { reminders, addReminder, toggleReminderTaken, removeReminder, highlightedAreas, profile, remindersLoading } = useApp();
  const [tab, setTab] = useState<'anatomy' | 'reminders' | 'model'>('reminders');
  const [showAdd, setShowAdd] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const [newMed, setNewMed] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newTime, setNewTime] = useState('08:00 AM');

  const takenCount = reminders.filter((r) => r.takenToday).length;
  const totalCount = reminders.length;

  // Compute adherence-based highlighted areas with opacity
  // Areas stay highlighted (red) until medicine course is complete
  // Opacity fades as takenDoses/totalDoses increases
  const adherenceAreas = highlightedAreas.filter(area => {
    // Check if any active reminder is associated with this area
    // For now keep all highlighted areas, but pass adherence to viewer
    return true;
  });

  // Overall adherence across all reminders (0-1)
  const overallAdherence = reminders.length > 0
    ? reminders.reduce((sum, r) => sum + (r.totalDoses > 0 ? r.takenDoses / r.totalDoses : 0), 0) / reminders.length
    : 1;

  function handleAdd() {
    if (!newMed.trim()) return;
    const reminder: Reminder = {
      id: Date.now().toString(),
      medicineName: newMed.trim(),
      dosage: newDose.trim() || '1 tablet',
      frequency: 'Daily',
      timeSlots: [newTime],
      status: 'active',
      takenToday: false,
      totalDoses: 14,
      takenDoses: 0,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 7,
      notificationIds: [],
    };
    addReminder(reminder);
    setNewMed('');
    setNewDose('');
    setNewTime('08:00 AM');
    setShowAdd(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient
        colors={['#0F766E', '#0D9488']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View>
          <Text style={styles.headerTitle}>Health Monitor</Text>
          <Text style={styles.headerSub}>Track your body & medications</Text>
        </View>
        <View style={styles.headerRight}>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ true: '#4ADE80', false: 'rgba(255,255,255,0.3)' }}
            thumbColor="#fff"
          />
          {notifEnabled ? <Bell size={16} color="#fff" /> : <BellOff size={16} color="rgba(255,255,255,0.5)" />}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['reminders', 'anatomy', 'model'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'reminders' ? 'Reminders' : t === 'anatomy' ? 'Body Map' : 'AI Model'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'reminders' ? (
          <View style={styles.section}>
            {/* Progress */}
            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <View>
                  <Text style={styles.progressTitle}>Today's Progress</Text>
                  <Text style={styles.progressSub}>{takenCount} of {totalCount} medications taken</Text>
                </View>
                <Text style={styles.progressPct}>{totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${totalCount > 0 ? (takenCount / totalCount) * 100 : 0}%` },
                  ]}
                />
              </View>
            </View>

            {/* Calendar Strip */}
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <CalendarDays size={16} color={colors.primary} />
                <Text style={styles.calendarTitle}>This Week</Text>
              </View>
              <View style={styles.calendarRow}>
                {DAYS.map((d, i) => (
                  <View
                    key={d}
                    style={[styles.dayPill, i === today && styles.dayPillActive]}
                  >
                    <Text style={[styles.dayText, i === today && styles.dayTextActive]}>{d}</Text>
                    <View style={[styles.dayDot, { backgroundColor: i <= today ? colors.secondary : colors.border }]} />
                  </View>
                ))}
              </View>
            </View>

            {/* Reminders */}
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderTitle}>Medicines</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAdd(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {remindersLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.emptySub}>Loading reminders...</Text>
              </View>
            ) : reminders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No reminders yet</Text>
                <Text style={styles.emptySub}>Tap + Add to set up your medicine reminders</Text>
              </View>
            ) : (
              reminders.map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  onToggleTaken={() => toggleReminderTaken(r.id)}
                  onDelete={() => removeReminder(r.id)}
                />
              ))
            )}
          </View>
        ) : tab === 'anatomy' ? (
          <View style={styles.section}>
            <View style={styles.anatomyCard}>
              <Text style={styles.anatomyTitle}>Body Map</Text>
              <Text style={styles.anatomySub}>
                {highlightedAreas.length > 0
                  ? `Areas highlighted: ${highlightedAreas.join(', ')}`
                  : 'Synced with your recent AI chat results'}
              </Text>
              <AnatomyViewer highlightedAreas={highlightedAreas} gender={profile.gender} adherence={overallAdherence} />
            </View>
          </View>
        ) : (
          <ModelEvaluation />
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Reminder</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Medicine Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Paracetamol"
              placeholderTextColor={colors.textTertiary}
              value={newMed}
              onChangeText={setNewMed}
            />

            <Text style={styles.inputLabel}>Dosage</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 500mg"
              placeholderTextColor={colors.textTertiary}
              value={newDose}
              onChangeText={setNewDose}
            />

            <Text style={styles.inputLabel}>Time</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 08:00 AM"
              placeholderTextColor={colors.textTertiary}
              value={newTime}
              onChangeText={setNewTime}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveText}>Add Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 20 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabBtnActive: { backgroundColor: colors.primaryLight },
  tabText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  section: { padding: spacing.base },

  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  progressTitle: { ...typography.h4, color: colors.text },
  progressSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  progressPct: { fontSize: 28, fontWeight: '800', color: colors.primary },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: 4 },

  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  calendarTitle: { ...typography.h4, color: colors.text },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayPill: { alignItems: 'center', gap: 6, padding: 6, borderRadius: radius.md, minWidth: 36 },
  dayPillActive: { backgroundColor: colors.primaryLight },
  dayText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  dayTextActive: { color: colors.primary },
  dayDot: { width: 6, height: 6, borderRadius: 3 },

  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  reminderTitle: { ...typography.h4, color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...typography.h4, color: colors.textSecondary },
  emptySub: { ...typography.bodySmall, color: colors.textTertiary, marginTop: spacing.sm, textAlign: 'center' },

  anatomyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.md,
  },
  anatomyTitle: { ...typography.h3, color: colors.text },
  anatomySub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.base },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: { ...typography.h3, color: colors.text },
  inputLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
  },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  saveText: { color: '#fff', fontWeight: '700' },
});


