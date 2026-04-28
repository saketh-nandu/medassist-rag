import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { radius, spacing, typography, shadows } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <LinearGradient colors={['#0F766E', '#0D9488', '#14B8A6']} style={styles.header}>
            <View style={styles.logoWrap}>
              <Heart size={36} color="#fff" fill="#fff" />
            </View>
            <Text style={styles.appName}>HosFind</Text>
            <Text style={styles.tagline}>Your AI Health Companion</Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#0F766E', '#0D9488']} style={styles.btnGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign up link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.background },
  flex:     { flex: 1 },
  scroll:   { flexGrow: 1 },

  header: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl + spacing.xl,
    paddingHorizontal: spacing.base,
  },
  logoWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  appName:  { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  tagline:  { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },

  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -spacing.xl,
    padding: spacing.xl,
    flex: 1,
    ...shadows.lg,
  },
  title:    { ...typography.h2, color: colors.text, marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },

  errorBox: {
    backgroundColor: colors.emergencyLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    borderWidth: 1, borderColor: colors.emergency,
  },
  errorText: { color: colors.emergency, fontSize: 13, fontWeight: '500' },

  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base, paddingVertical: 14,
    marginBottom: spacing.base,
    borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },

  btn: { borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.sm, ...shadows.md },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
});
