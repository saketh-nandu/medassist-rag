import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Animated, Linking, ScrollView,
} from 'react-native';
import { TriangleAlert as AlertTriangle, Phone, Navigation, X, MapPin, ChevronRight, Clock, Star, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

const NEARBY_HOSPITALS = [
  {
    id: '1',
    name: 'Apollo Hospitals',
    distance: '1.2 km',
    phone: '+91-40-23607777',
    rating: 4.8,
    eta: '5 min',
    emergency: true,
  },
  {
    id: '2',
    name: 'KIMS Hospital',
    distance: '2.4 km',
    phone: '+91-40-44885000',
    rating: 4.6,
    eta: '9 min',
    emergency: true,
  },
  {
    id: '3',
    name: 'Yashoda Hospitals',
    distance: '3.1 km',
    phone: '+91-40-45674567',
    rating: 4.7,
    eta: '12 min',
    emergency: true,
  },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const { setEmergencyActive } = useApp();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  function dismiss() {
    setEmergencyActive(false);
    router.back();
  }

  function callAmbulance() {
    Linking.openURL('tel:108');
  }

  function callHospital(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  function getDirections(name: string) {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(name + ' hospital Hyderabad')}`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>
        <LinearGradient
          colors={['#7F1D1D', '#991B1B', '#DC2626']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
            <X size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* Warning Icon */}
          <Animated.View style={[styles.warningIconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <AlertTriangle size={48} color="#fff" />
          </Animated.View>

          <Text style={styles.warningTitle}>Possible Medical Emergency Detected</Text>
          <Text style={styles.warningSubtitle}>
            Your symptoms may require immediate medical attention. Please stay calm and contact emergency services now.
          </Text>

          {/* Call 108 Button */}
          <TouchableOpacity style={styles.ambulanceBtn} onPress={callAmbulance} activeOpacity={0.85}>
            <View style={styles.ambulanceBtnInner}>
              <Phone size={24} color={colors.emergency} />
              <View>
                <Text style={styles.ambulanceBtnTitle}>Call 108 Ambulance</Text>
                <Text style={styles.ambulanceBtnSub}>National Emergency • Free service</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Quick Tips */}
          <View style={styles.tipsRow}>
            {[
              { icon: '🛑', tip: 'Stop all activity' },
              { icon: '🧘', tip: 'Stay calm' },
              { icon: '🤝', tip: 'Get someone nearby' },
            ].map(({ icon, tip }) => (
              <View key={tip} style={styles.tipChip}>
                <Text style={styles.tipEmoji}>{icon}</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Nearest Hospitals */}
        <ScrollView style={styles.hospitals} showsVerticalScrollIndicator={false}>
          <View style={styles.hospitalsHeader}>
            <Heart size={16} color={colors.emergency} />
            <Text style={styles.hospitalsTitle}>Nearest Emergency Hospitals</Text>
          </View>

          {NEARBY_HOSPITALS.map((h, index) => (
            <View key={h.id} style={[styles.hospitalCard, index === 0 && styles.hospitalCardFirst]}>
              {index === 0 && (
                <View style={styles.nearestBadge}>
                  <Text style={styles.nearestBadgeText}>Nearest</Text>
                </View>
              )}
              <View style={styles.hospitalInfo}>
                <Text style={styles.hospitalName}>{h.name}</Text>
                <View style={styles.hospitalMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{h.distance}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={styles.metaText}>~{h.eta}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.metaText}>{h.rating}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.hospitalActions}>
                <TouchableOpacity
                  style={styles.callSmBtn}
                  onPress={() => callHospital(h.phone)}
                >
                  <Phone size={14} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navSmBtn}
                  onPress={() => getDirections(h.name)}
                >
                  <Navigation size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.findMoreBtn}
            onPress={() => { dismiss(); }}
          >
            <Text style={styles.findMoreText}>View All Nearby Hospitals</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* Sticky Call Button */}
        <TouchableOpacity style={styles.stickyCall} onPress={callAmbulance} activeOpacity={0.85}>
          <LinearGradient
            colors={['#DC2626', '#EF4444']}
            style={styles.stickyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Phone size={20} color="#fff" />
            <Text style={styles.stickyCallText}>Call 108 Ambulance</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#7F1D1D' },
  container: { flex: 1 },

  gradient: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },

  warningIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  warningSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },

  ambulanceBtn: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  ambulanceBtnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ambulanceBtnTitle: { fontSize: 17, fontWeight: '800', color: colors.emergency },
  ambulanceBtnSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  tipsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  tipChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  tipEmoji: { fontSize: 20 },
  tipText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  hospitals: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  hospitalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  hospitalsTitle: { ...typography.h4, color: colors.text },

  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.md,
    position: 'relative',
  },
  hospitalCardFirst: {
    borderWidth: 1.5,
    borderColor: colors.emergency,
  },
  nearestBadge: {
    position: 'absolute',
    top: -8,
    left: spacing.base,
    backgroundColor: colors.emergency,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  nearestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  hospitalInfo: { flex: 1 },
  hospitalName: { ...typography.h4, color: colors.text },
  hospitalMeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  hospitalActions: { flexDirection: 'row', gap: spacing.sm },

  callSmBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  navSmBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  findMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  findMoreText: { ...typography.body, color: colors.primary, fontWeight: '600' },

  stickyCall: {
    margin: spacing.base,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.emergency,
  },
  stickyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.base,
  },
  stickyCallText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
