// CyberGuard Academy - Result Screen
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Home,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentSession, player } = useGame();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    router.push('/scenarios');
  };

  const handleHome = () => {
    router.push('/');
  };

  const isCorrect = currentSession?.completed && currentSession.score > 0;
  const xpEarned = currentSession ? Math.floor(currentSession.score / 10) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Animated.View 
          style={[
            styles.iconContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {isCorrect ? (
            <View style={[styles.iconBg, { backgroundColor: Colors.accent.greenGlow }]}>
              <CheckCircle2 size={64} color={Colors.accent.green} />
            </View>
          ) : (
            <View style={[styles.iconBg, { backgroundColor: Colors.accent.redGlow }]}>
              <XCircle size={64} color={Colors.accent.red} />
            </View>
          )}
        </Animated.View>

        <Text style={styles.title}>
          {isCorrect ? '¡Excelente trabajo!' : 'Sigue practicando'}
        </Text>
        <Text style={styles.subtitle}>
          {isCorrect 
            ? 'Has demostrado tus habilidades de ciberseguridad' 
            : 'Revisa la explicación y vuelve a intentarlo'}
        </Text>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Target size={24} color={Colors.accent.cyan} />
              <Text style={styles.statValue}>{currentSession?.score || 0}</Text>
              <Text style={styles.statLabel}>Puntuación</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Zap size={24} color={Colors.accent.yellow} />
              <Text style={styles.statValue}>+{xpEarned}</Text>
              <Text style={styles.statLabel}>XP Ganado</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <TrendingUp size={24} color={Colors.accent.purple} />
              <Text style={styles.statValue}>{player.streak}</Text>
              <Text style={styles.statLabel}>Racha</Text>
            </View>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>Explicación</Text>
          <Text style={styles.explanationText}>
            {currentSession?.scenario.content.explanation || 
             'En este escenario aprendiste a identificar y responder a una amenaza de ciberseguridad.'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton,
              isCorrect ? { backgroundColor: Colors.accent.green } : { backgroundColor: Colors.accent.cyan },
              pressed && styles.buttonPressed
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>
              {isCorrect ? 'Siguiente Escenario' : 'Intentar Otro'}
            </Text>
            <ArrowRight size={20} color={Colors.background.primary} />
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed
            ]}
            onPress={handleHome}
          >
            <Home size={18} color={Colors.text.primary} />
            <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statsCard: {
    width: '100%',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.background.tertiary,
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
  explanationCard: {
    width: '100%',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  explanationTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  explanationText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background.primary,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  secondaryButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
// UNIQUE_ID_1776613937
