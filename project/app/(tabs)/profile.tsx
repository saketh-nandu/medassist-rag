import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { User, ChevronRight, Bell, Shield, Globe, Heart, FileText, CreditCard as Edit3, X, Check, LogOut, Info, Moon, Plus, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';


const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS     = ['Male', 'Female', 'Other'];
const ALL_CONDITIONS = ['Hypertension', 'Diabetes Type 2', 'Asthma', 'Thyroid', 'Heart Disease', 'Arthritis', 'COPD', 'Depression', 'Anxiety', 'Obesity'];

export default function ProfileScreen() {
  const { profile, updateProfile, darkMode, toggleDarkMode, notifications, setNotifications, privacyMode, setPrivacyMode, reminders, messages, reports, reportsLoading, loadSession } = useApp();
  const router = useRouter();
  const [language, setLanguage] = useState('English');
  const availableLanguages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'];

  const [editOpen,     setEditOpen]     = useState(false);
  const [langOpen,     setLangOpen]     = useState(false);
  const [aboutOpen,    setAboutOpen]    = useState(false);
  const [allergyOpen,  setAllergyOpen]  = useState(false);
  const [condOpen,     setCondOpen]     = useState(false);

  // Edit profile fields
  const [editName,   setEditName]   = useState(profile.name);
  const [editAge,    setEditAge]    = useState(String(profile.age));
  const [editGender, setEditGender] = useState(profile.gender);
  const [editBlood,  setEditBlood]  = useState(profile.bloodType);

  // Allergy editing
  const [newAllergy, setNewAllergy] = useState('');

  // Sync edit fields when profile changes
  React.useEffect(() => {
    setEditName(profile.name);
    setEditAge(String(profile.age));
    setEditGender(profile.gender);
    setEditBlood(profile.bloodType);
  }, [profile]);

  function saveProfile() {
    updateProfile({ name: editName, age: parseInt(editAge) || profile.age, gender: editGender, bloodType: editBlood });
    setEditOpen(false);
  }

  function addAllergy() {
    const a = newAllergy.trim();
    if (!a || profile.allergies.includes(a)) return;
    updateProfile({ allergies: [...profile.allergies, a] });
    setNewAllergy('');
  }

  function removeAllergy(a: string) {
    updateProfile({ allergies: profile.allergies.filter(x => x !== a) });
  }

  function toggleCondition(c: string) {
    const current = profile.conditions || [];
    const updated  = current.includes(c) ? current.filter(x => x !== c) : [...current, c];
    updateProfile({ conditions: updated });
  }

  // Real stats from context
  const reportCount   = reports.length;
  const reminderCount = reminders.filter(r => r.status === 'active').length;
  const checkinCount  = messages.filter(m => m.role === 'user').length;

  const initials = profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const displayValue = (val: string) => privacyMode ? '••••' : val;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#0F766E', '#0D9488', '#14B8A6']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => setEditOpen(true)}>
              <Edit3 size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{displayValue(profile.name)}</Text>
          <Text style={styles.profileMeta}>{profile.age} yrs  {profile.gender}  {profile.bloodType}</Text>
        </LinearGradient>

        <View style={styles.body}>

          {/* Stats — real counts */}
          <View style={styles.statsRow}>
            {[
              { label: 'Reports',   value: String(reportCount)   },
              { label: 'Reminders', value: String(reminderCount) },
              { label: 'Check-ins', value: String(checkinCount)  },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statItem}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Medical Profile */}
          <Text style={styles.sectionTitle}>Medical Profile</Text>
          <Card style={styles.medCard}>
            {/* Blood Type */}
            <TouchableOpacity style={styles.medRow} onPress={() => setEditOpen(true)}>
              <Heart size={16} color={colors.emergency} />
              <Text style={styles.medKey}>Blood Type</Text>
              <Text style={styles.medValue}>{profile.bloodType}</Text>
              <ChevronRight size={14} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.divider} />

            {/* Allergies — editable */}
            <TouchableOpacity style={styles.medRow} onPress={() => setAllergyOpen(true)}>
              <Shield size={16} color={colors.warning} />
              <Text style={styles.medKey}>Allergies</Text>
              <Text style={styles.medValue} numberOfLines={1}>
                {profile.allergies.length > 0 ? displayValue(profile.allergies.join(', ')) : 'None'}
              </Text>
              <ChevronRight size={14} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.divider} />

            {/* Conditions — editable */}
            <TouchableOpacity style={styles.medConditions} onPress={() => setCondOpen(true)}>
              <View style={styles.medRow}>
                <FileText size={16} color={colors.primary} />
                <Text style={styles.medKey}>Conditions</Text>
                <ChevronRight size={14} color={colors.textTertiary} />
              </View>
              <View style={styles.conditionTags}>
                {(profile.conditions || []).length === 0 ? (
                  <Text style={styles.noneText}>Tap to add conditions</Text>
                ) : (
                  (profile.conditions || []).map(c => (
                    <View key={c} style={styles.condTagActive}>
                      <Text style={styles.condTagTextActive}>{c}</Text>
                    </View>
                  ))
                )}
              </View>
            </TouchableOpacity>
          </Card>

          {/* Settings */}
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card style={styles.settingsCard}>
            <SettingRow
              icon={<Bell size={18} color={colors.primary} />}
              label="Notifications"
              right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: colors.primary }} thumbColor="#fff" />}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Moon size={18} color={colors.text} />}
              label="Dark Mode"
              right={<Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ true: colors.primary }} thumbColor="#fff" />}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Shield size={18} color={colors.secondary} />}
              label="Privacy Mode"
              sublabel="Hides personal info on screen"
              right={<Switch value={privacyMode} onValueChange={setPrivacyMode} trackColor={{ true: colors.primary }} thumbColor="#fff" />}
            />
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => setLangOpen(true)}>
              <SettingRow
                icon={<Globe size={18} color={colors.warning} />}
                label="Language"
                right={
                  <View style={styles.langRow}>
                    <Text style={styles.langText}>{language}</Text>                    <ChevronRight size={16} color={colors.textTertiary} />
                  </View>
                }
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => setAboutOpen(true)}>
              <SettingRow
                icon={<Info size={18} color={colors.textSecondary} />}
                label="About MedAssist RAG"
                right={<ChevronRight size={16} color={colors.textTertiary} />}
              />
            </TouchableOpacity>
          </Card>

          {/* Saved Reports — from DB */}
          <Text style={styles.sectionTitle}>Saved Reports</Text>
          {reportsLoading ? (
            <Card style={styles.emptyCard}>
              <ActivityIndicator color={colors.primary} />
            </Card>
          ) : reports.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No reports yet. Start a chat to generate health reports.</Text>
            </Card>
          ) : (
            reports.slice(0, 20).map((r, i) => (
              <TouchableOpacity
                key={r.id}
                onPress={async () => {
                  if (r.sessionId) {
                    await loadSession(r.sessionId);
                  } else {
                    // No sessionId yet — load all messages for this user (legacy)
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) await loadSession(`legacy_session_${user.id}`);
                  }
                  router.push('/(tabs)/chat');
                }}
                activeOpacity={0.7}
              >
                <Card style={[styles.reportCard, r.sessionId && styles.reportCardTappable]}>
                  <View style={styles.reportInner}>
                    <FileText size={18} color={colors.primary} />
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportTitle}>{r.title}</Text>
                      <Text style={styles.reportDate}>{r.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={[styles.severityPill, { backgroundColor: r.severity === 'low' ? colors.secondaryLight : r.severity === 'high' ? colors.emergencyLight : colors.warningLight }]}>
                      <Text style={[styles.severityPillText, { color: r.severity === 'low' ? colors.secondary : r.severity === 'high' ? colors.emergency : colors.warning }]}>
                        {r.severity === 'high' ? 'High' : r.severity === 'medium' ? 'Medium' : 'Low'}
                      </Text>
                    </View>
                    {r.sessionId && <ChevronRight size={14} color={colors.textTertiary} />}
                  </View>
                  {r.conditions.length > 0 && (
                    <View style={styles.reportConditions}>
                      {r.conditions.slice(0, 3).map(c => (
                        <View key={c} style={styles.reportCondChip}>
                          <Text style={styles.reportCondText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))
          )}

          {/* Sign Out */}
          <TouchableOpacity style={styles.logoutBtn} onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}>
            <LogOut size={18} color={colors.emergency} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>MedAssist RAG v1.0.0  AI-Powered Healthcare</Text>
          <View style={{ height: spacing.xxl }} />
        </View>
      </ScrollView>

      {/*  EDIT PROFILE MODAL  */}
      <Modal visible={editOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}><X size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={colors.textTertiary} />
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput style={styles.input} value={editAge} onChangeText={setEditAge} placeholder="Age" placeholderTextColor={colors.textTertiary} keyboardType="numeric" />
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map(g => (
                <TouchableOpacity key={g} style={[styles.chip, editGender === g && styles.chipActive]} onPress={() => setEditGender(g)}>
                  <Text style={[styles.chipText, editGender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Blood Type</Text>
            <View style={styles.chipRow}>
              {BLOOD_TYPES.map(bt => (
                <TouchableOpacity key={bt} style={[styles.chip, editBlood === bt && styles.chipActive]} onPress={() => setEditBlood(bt)}>
                  <Text style={[styles.chipText, editBlood === bt && styles.chipTextActive]}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Check size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/*  ALLERGIES MODAL  */}
      <Modal visible={allergyOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Allergies</Text>
              <TouchableOpacity onPress={() => setAllergyOpen(false)}><X size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={newAllergy}
                onChangeText={setNewAllergy}
                placeholder="e.g. Penicillin, Peanuts"
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={addAllergy}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addAllergy}>
                <Plus size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagList}>
              {profile.allergies.length === 0 ? (
                <Text style={styles.noneText}>No allergies added</Text>
              ) : (
                profile.allergies.map(a => (
                  <View key={a} style={styles.tagItem}>
                    <Text style={styles.tagText}>{a}</Text>
                    <TouchableOpacity onPress={() => removeAllergy(a)}>
                      <X size={14} color={colors.emergency} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/*  CONDITIONS MODAL  */}
      <Modal visible={condOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Medical Conditions</Text>
              <TouchableOpacity onPress={() => setCondOpen(false)}><X size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={styles.sheetSubtitle}>Tap to toggle your conditions</Text>
            <View style={styles.chipRow}>
              {ALL_CONDITIONS.map(c => {
                const active = (profile.conditions || []).includes(c);
                return (
                  <TouchableOpacity key={c} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleCondition(c)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setCondOpen(false)}>
              <Check size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/*  LANGUAGE MODAL  */}
      <Modal visible={langOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Language</Text>
              <TouchableOpacity onPress={() => setLangOpen(false)}><X size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            {availableLanguages.map(l => (
              <TouchableOpacity key={l} style={styles.langOption} onPress={() => { setLanguage(l); setLangOpen(false); }}>
                <Text style={[styles.langOptionText, language === l && styles.langOptionActive]}>{l}</Text>
                {language === l && <Check size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/*  ABOUT MODAL  */}
      <Modal visible={aboutOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>About MedAssist RAG</Text>
              <TouchableOpacity onPress={() => setAboutOpen(false)}><X size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <View style={styles.aboutContent}>
              <View style={styles.aboutLogo}>
                <Heart size={32} color={colors.primary} fill={colors.primary} />
              </View>
              <Text style={styles.aboutName}>MedAssist RAG</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              <Text style={styles.aboutDesc}>MedAssist RAG is an AI-powered healthcare companion that helps you understand your symptoms, find nearby hospitals, manage medications, and monitor your health — all in one place.</Text>
              {[
                { label: 'AI Engine',    value: 'RAG + Medical Knowledge Base' },
                { label: 'Map Data',     value: 'OpenStreetMap (free)' },
                { label: 'Routing',      value: 'OSRM (free)' },
                { label: 'Backend',      value: 'Supabase' },
                { label: 'Built with',   value: 'React Native + Expo' },
              ].map(({ label, value }) => (
                <View key={label} style={styles.aboutRow}>
                  <Text style={styles.aboutLabel}>{label}</Text>
                  <Text style={styles.aboutValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function SettingRow({ icon, label, sublabel, right }: { icon: React.ReactNode; label: string; sublabel?: string; right: React.ReactNode }) {
  return (
    <View style={settingStyles.row}>
      <View style={settingStyles.left}>
        {icon}
        <View>
          <Text style={settingStyles.label}>{label}</Text>
          {sublabel ? <Text style={settingStyles.sublabel}>{sublabel}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.base },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  label: { ...typography.body, color: colors.text },
  sublabel: { ...typography.caption, color: colors.textTertiary, marginTop: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.base },
  avatarWrap: { position: 'relative', marginBottom: spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  profileName: { color: '#fff', fontSize: 22, fontWeight: '700' },
  profileMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  body: { paddingHorizontal: spacing.base, marginTop: -spacing.xl },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.base, ...shadows.md },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.base },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md, marginTop: spacing.base },
  medCard: { padding: 0, overflow: 'hidden', marginBottom: spacing.base },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  medConditions: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.md },
  medKey: { ...typography.body, color: colors.textSecondary, flex: 1 },
  medValue: { ...typography.body, color: colors.text, fontWeight: '600', maxWidth: 160 },
  conditionTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  condTagActive: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  condTagTextActive: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  noneText: { ...typography.bodySmall, color: colors.textTertiary, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.base },
  settingsCard: { padding: 0, marginBottom: spacing.base },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langText: { ...typography.bodySmall, color: colors.textSecondary },
  emptyCard: { padding: spacing.base, marginBottom: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center' },
  reportCard: { marginBottom: spacing.sm },
  reportCardTappable: { borderWidth: 1, borderColor: colors.primaryMid },
  reportInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md },
  reportInfo: { flex: 1 },
  reportTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  reportDate: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  reportConditions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  reportCondChip: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  reportCondText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  severityPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  severityPillText: { ...typography.caption, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, marginTop: spacing.base, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.emergencyLight, backgroundColor: colors.emergencyLight },
  logoutText: { ...typography.body, color: colors.emergency, fontWeight: '600' },
  version: { textAlign: 'center', ...typography.caption, color: colors.textTertiary, marginTop: spacing.md },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '85%', ...shadows.lg },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.h3, color: colors.text },
  sheetSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.base },
  inputLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: spacing.base, borderWidth: 1, borderColor: colors.border },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.borderLight, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.sm, ...shadows.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  addBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.warningLight, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.warning },
  tagText: { fontSize: 13, fontWeight: '600', color: colors.warning },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  langOptionText: { ...typography.body, color: colors.text },
  langOptionActive: { color: colors.primary, fontWeight: '700' },
  aboutContent: { alignItems: 'center', paddingVertical: spacing.base },
  aboutLogo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  aboutName: { fontSize: 22, fontWeight: '800', color: colors.text },
  aboutVersion: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.base },
  aboutDesc: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.base },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  aboutLabel: { ...typography.bodySmall, color: colors.textSecondary },
  aboutValue: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  severityPillText: { ...typography.caption, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, marginTop: spacing.base, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.emergencyLight, backgroundColor: colors.emergencyLight },
  logoutText: { ...typography.body, color: colors.emergency, fontWeight: '600' },
  version: { textAlign: 'center', ...typography.caption, color: colors.textTertiary, marginTop: spacing.md },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.h3, color: colors.text },
  sheetSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.base },
  inputLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: spacing.base, borderWidth: 1, borderColor: colors.border },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.borderLight, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  addBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.warningLight, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.warning },
  tagText: { fontSize: 13, fontWeight: '600', color: colors.warning },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  langOptionText: { ...typography.body, color: colors.text },
  langOptionActive: { color: colors.primary, fontWeight: '700' },
  aboutContent: { alignItems: 'center', paddingVertical: spacing.base },
  aboutLogo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  aboutName: { fontSize: 22, fontWeight: '800', color: colors.text },
  aboutVersion: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.base },
  aboutDesc: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.base },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  aboutLabel: { ...typography.bodySmall, color: colors.textSecondary },
  aboutValue: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
});




