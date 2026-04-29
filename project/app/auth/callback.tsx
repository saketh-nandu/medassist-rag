import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your account...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  async function handleAuthCallback() {
    try {
      // Extract token from URL parameters
      const { access_token, refresh_token, type } = params;

      if (type === 'signup' && access_token && refresh_token) {
        // Set the session with the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('Failed to confirm your account. Please try again.');
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Account confirmed successfully! Redirecting...');
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('No session found. Please try logging in.');
        }
      } else {
        // No valid tokens found
        setStatus('error');
        setMessage('Invalid confirmation link. Please try again.');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F766E', '#0D9488', '#14B8A6']} style={styles.header}>
        <View style={styles.logoWrap}>
          <Heart size={36} color="#fff" fill="#fff" />
        </View>
        <Text style={styles.appName}>MedAssist RAG</Text>
        <Text style={styles.tagline}>Confirming your account</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          {status === 'loading' && (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.statusText}>{message}</Text>
            </>
          )}
          
          {status === 'success' && (
            <>
              <View style={styles.successIcon}>
                <CheckCircle size={48} color={colors.secondary} />
              </View>
              <Text style={styles.successText}>{message}</Text>
              <Text style={styles.subText}>Welcome to MedAssist RAG!</Text>
            </>
          )}
          
          {status === 'error' && (
            <>
              <View style={styles.errorIcon}>
                <XCircle size={48} color={colors.emergency} />
              </View>
              <Text style={styles.errorText}>{message}</Text>
              <Text style={styles.subText}>You can close this page and try logging in.</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.base,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -spacing.xl,
    padding: spacing.xl,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  statusText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    ...typography.h3,
    color: colors.secondary,
    textAlign: 'center',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.emergencyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.h3,
    color: colors.emergency,
    textAlign: 'center',
  },
  subText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});