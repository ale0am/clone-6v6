// CyberGuard Academy - Login Screen
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginUser } = useGame();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const isValid = /\S+@\S+\.\S+/.test(email.trim()) && password.length >= 6;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await loginUser({ email: email.trim(), password });
      router.replace('/home');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Credenciales inválidas.';
      console.log('[Login] error', err);
      Alert.alert('No se pudo iniciar sesión', msg);
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={[styles.orb, styles.orbCyan]} />
      <View style={[styles.orb, styles.orbPurple]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.header}>
              <View style={styles.avatarPreview}>
                <Shield size={44} color={Colors.accent.cyan} strokeWidth={1.8} />
              </View>
              <Text style={styles.title}>Bienvenido de vuelta</Text>
              <Text style={styles.subtitle}>
                Inicia sesión para retomar tu entrenamiento y tu progreso guardado.
              </Text>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Mail size={18} color={Colors.text.secondary} />
                <Text style={styles.fieldLabel}>Correo electrónico</Text>
              </View>
              <View style={styles.fieldInputWrap}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@correo.com"
                  placeholderTextColor={Colors.text.muted}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Lock size={18} color={Colors.text.secondary} />
                <Text style={styles.fieldLabel}>Contraseña</Text>
              </View>
              <View style={styles.fieldInputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.muted}
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!isValid || submitting}
              style={({ pressed }) => [
                styles.cta,
                !isValid && styles.ctaDisabled,
                pressed && isValid && styles.ctaPressed,
              ]}
            >
              <Text style={styles.ctaText}>{submitting ? 'Entrando…' : 'Iniciar sesión'}</Text>
              <ArrowRight size={20} color={Colors.background.primary} />
            </Pressable>

            <Pressable style={styles.linkBtn} onPress={() => router.replace('/register')}>
              <Text style={styles.linkText}>
                ¿Eres nuevo? <Text style={styles.linkAccent}>Crea tu cuenta</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary, overflow: 'hidden' },
  orb: { position: 'absolute', width: 280, height: 280, borderRadius: 9999, opacity: 0.15 },
  orbCyan: { top: -80, right: -80, backgroundColor: Colors.accent.cyan },
  orbPurple: { bottom: -100, left: -100, backgroundColor: Colors.accent.purple },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarPreview: {
    width: 96, height: 96, borderRadius: 9999, borderWidth: 2,
    borderColor: Colors.accent.cyan, backgroundColor: Colors.accent.cyan + '22',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  subtitle: {
    fontSize: Typography.sizes.sm, color: Colors.text.secondary,
    textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20, paddingHorizontal: Spacing.md,
  },
  field: { marginBottom: Spacing.md },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  fieldLabel: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, fontWeight: Typography.weights.medium },
  fieldInputWrap: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.background.tertiary,
  },
  input: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md, color: Colors.text.primary,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accent.cyan, paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md, marginTop: Spacing.xl,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.background.primary },
  linkBtn: { alignItems: 'center', marginTop: Spacing.md, padding: Spacing.sm },
  linkText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary },
  linkAccent: { color: Colors.accent.cyan, fontWeight: Typography.weights.bold },
});
