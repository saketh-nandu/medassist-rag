import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, User, Heart, ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { radius, spacing, typography, shadows } from '@/constants/theme';

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [age, setAge]           = useState('');
  const [gender, setGender]     = useState('Male');
  const [blood, setBlood]       = useState('O+');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields'); return;
    }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true); setError('');

    const { data, error: signupErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          age: parseInt(age) || 25,
          gender,
          blood_type: blood,
        },
      },
    });

    setLoading(false);
    if (signupErr) { setError(signupErr.message); return; }

    // Auto-confirm in dev — go straight to app
    if (data.session) {
      router.replace('/(tabs)');
    } else {
      // Email confirmation required
      setError('Check your email to confirm your account, then sign in.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <LinearGradient colors={['#0F766E', '#0D9488', '#14B8A6']} style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.logoWrap}>
              <Heart size={32} color="#fff" fill="#fff" />
            </View>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>Join HosFind today</Text>
          </LinearGradient>

          <View style={styles.card}>
            {error ? <View style={[styles.errorBox, error.includes('Check your email') && styles.successBox]}>
              <Text style={[styles.errorText, error.includes('Check your email') && styles.successText]}>{error}</Text>
            </View> : null}

            {/* Name */}
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrap}>
              <User size={18} color={colors.textSecondary} />
              <TextInput style={styles.input} placeholder="Your full name" placeholderTextColor={colors.textTertiary} value={name} onChangeText={setName} />
            </View>

            {/* Email */}
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={colors.textSecondary} />
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textTertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={colors.textSecondary} />
              <TextInput style={styles.input} placeholder="Min 6 characters" placeholderTextColor={colors.textTertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>

            {/* Age */}
            <Text style={styles.label}>Age</Text>
            <View style={styles.inputWrap}>
              <TextInput style={[styles.input, { marginLeft: 0 }]} placeholder="Your age" placeholderTextColor={colors.textTertiary} value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>

            {/* Gender */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map(g => (
                <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Blood Type */}
            <Text style={styles.label}>Blood Type</Text>
            <View style={styles.chipRow}>
              {BLOOD_TYPES.map(bt => (
                <TouchableOpacity key={bt} style={[styles.chip, blood === bt && styles.chipActive]} onPress={() => setBlood(bt)}>
                  <Text style={[styles.chipText, blood === bt && styles.chipTextActive]}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Signup button */}
            <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#0F766E', '#0D9488']} style={styles.btnGrad}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.background },
  flex:  { flex: 1 },
  scroll: { flexGrow: 1 },

  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.base,
  },
  backBtn: {
    position: 'absolute', top: spacing.xl, left: spacing.base,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: { color: '#fff', fontSize: 24, fontWeight: '800' },
  tagline: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },

  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -spacing.xl,
    padding: spacing.xl,
    flex: 1,
    ...shadows.lg,
  },

  errorBox: {
    backgroundColor: colors.emergencyLight, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.base,
    borderWidth: 1, borderColor: colors.emergency,
  },
  successBox: { backgroundColor: colors.secondaryLight, borderColor: colors.secondary },
  errorText:  { color: colors.emergency, fontSize: 13, fontWeight: '500' },
  successText: { color: colors.secondary },

  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: spacing.base, paddingVertical: 14,
    marginBottom: spacing.base, borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.full, backgroundColor: colors.borderLight,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },

  btn:     { borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.sm, ...shadows.md },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, marginBottom: spacing.base },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
});
