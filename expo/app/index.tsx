// CyberGuard Academy - Loading / Splash Screen
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Shield, ShieldCheck } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';

export default function LoadingScreen() {
  const router = useRouter();
  const { isLoading, isRegistered } = useGame();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 3500, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [fadeAnim, scaleAnim, pulseAnim, progressAnim, ringAnim]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (isRegistered) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [isLoading, isRegistered, router]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const ringRotate = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background ambient orbs */}
      <View style={[styles.orb, styles.orbCyan]} />
      <View style={[styles.orb, styles.orbPurple]} />

      <Animated.View style={[styles.center, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          />
          <Animated.View style={[styles.rotatingRing, { transform: [{ rotate: ringRotate }] }]}>
            <View style={[styles.ringDot, styles.ringDotTop]} />
            <View style={[styles.ringDot, styles.ringDotRight]} />
            <View style={[styles.ringDot, styles.ringDotBottom]} />
            <View style={[styles.ringDot, styles.ringDotLeft]} />
          </Animated.View>
          <View style={styles.logoCore}>
            <Shield size={64} color={Colors.accent.cyan} strokeWidth={1.5} />
            <View style={styles.checkBadge}>
              <ShieldCheck size={20} color={Colors.background.primary} />
            </View>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Cargando…</Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  orb: { position: 'absolute', width: 320, height: 320, borderRadius: 9999, opacity: 0.18 },
  orbCyan: { top: -100, left: -100, backgroundColor: Colors.accent.cyan },
  orbPurple: { bottom: -120, right: -120, backgroundColor: Colors.accent.purple },
  center: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  logoWrap: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  pulseRing: {
    position: 'absolute', width: 180, height: 180, borderRadius: 9999,
    borderWidth: 2, borderColor: Colors.accent.cyan,
  },
  rotatingRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 9999,
    borderWidth: 1, borderColor: Colors.accent.cyanGlow,
  },
  ringDot: {
    position: 'absolute', width: 8, height: 8, borderRadius: 9999, backgroundColor: Colors.accent.cyan,
  },
  ringDotTop: { top: -4, left: '50%', marginLeft: -4 },
  ringDotRight: { right: -4, top: '50%', marginTop: -4 },
  ringDotBottom: { bottom: -4, left: '50%', marginLeft: -4 },
  ringDotLeft: { left: -4, top: '50%', marginTop: -4 },
  logoCore: {
    width: 120, height: 120, borderRadius: 9999,
    backgroundColor: Colors.background.card,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.accent.cyan,
  },
  checkBadge: {
    position: 'absolute', bottom: 6, right: 6,
    width: 32, height: 32, borderRadius: 9999,
    backgroundColor: Colors.accent.cyan,
    justifyContent: 'center', alignItems: 'center',
  },
  brand: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text.primary, letterSpacing: 1 },
  tagline: { fontSize: Typography.sizes.md, color: Colors.accent.cyan, marginTop: Spacing.xs, marginBottom: Spacing.xl, letterSpacing: 2 },
  progressTrack: {
    width: 240, height: 4, backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: Spacing.md,
  },
  progressFill: { height: '100%', backgroundColor: Colors.accent.cyan, borderRadius: BorderRadius.full },
  loadingText: { fontSize: Typography.sizes.xs, color: Colors.text.muted, marginTop: Spacing.md, letterSpacing: 0.5 },
  footer: { position: 'absolute', bottom: Spacing.xl },
  footerText: { fontSize: Typography.sizes.xs, color: Colors.text.muted },
});
