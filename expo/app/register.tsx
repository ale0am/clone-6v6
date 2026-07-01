// CyberGuard Academy - User Registration (Supabase)
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
import { Shield, User, Mail, Briefcase, ArrowRight, Check, Lock } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';

const AVATAR_COLORS: { value: string; label: string }[] = [
  { value: '#00f5d4', label: 'Cyan' },
  { value: '#00ff88', label: 'Verde' },
  { value: '#b967ff', label: 'Púrpura' },
  { value: '#ff3366', label: 'Rojo' },
  { value: '#ffd700', label: 'Oro' },
  { value: '#3b82f6', label: 'Azul' },
];

const ROLES: string[] = [
  'Estudiante',
  'Profesional TI',
  'Analista de Seguridad',
  'Desarrollador',
  'Curioso',
];

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registerUser } = useGame();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>(ROLES[0]);
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0].value);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const isValid = name.trim().length >= 2 && emailValid && password.length >= 6;

  const handleSubmit = async () => {
    if (!isValid || submitting) {
      if (name.trim().length < 2) return Alert.alert('Nombre', 'Mínimo 2 caracteres.');
      if (!emailValid) return Alert.alert('Correo', 'Ingresa un correo válido.');
      if (password.length < 6) return Alert.alert('Contraseña', 'Mínimo 6 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      const { needsConfirmation } = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        avatarColor,
      });
      if (needsConfirmation) {
        Alert.alert(
          'Verifica tu correo',
          'Te enviamos un enlace de confirmación. Después podrás iniciar sesión.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else {
        router.replace('/home');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo crear la cuenta.';
      console.log('[Register] error', err);
      Alert.alert('Error al registrar', msg);
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
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.header}>
              <View style={[styles.avatarPreview, { borderColor: avatarColor, backgroundColor: avatarColor + '22' }]}>
                <Shield size={44} color={avatarColor} strokeWidth={1.8} />
              </View>
              <Text style={styles.title}>Crea tu cuenta</Text>
              <Text style={styles.subtitle}>
                Tu progreso, nivel y conocimientos se guardan en la nube y te siguen en cualquier dispositivo.
              </Text>
            </View>

            <Field icon={<User size={18} color={Colors.text.secondary} />} label="Nombre completo *">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej. Andrés Pérez"
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                maxLength={40}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </Field>

            <Field icon={<Mail size={18} color={Colors.text.secondary} />} label="Correo electrónico *">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={60}
              />
            </Field>

            <Field icon={<Lock size={18} color={Colors.text.secondary} />} label="Contraseña * (mín. 6 caracteres)">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={60}
              />
            </Field>

            <Text style={styles.sectionLabel}>
              <Briefcase size={14} color={Colors.text.secondary} />  Rol
            </Text>
            <View style={styles.chipRow}>
              {ROLES.map((r) => {
                const selected = role === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Color de avatar</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((c) => {
                const selected = avatarColor === c.value;
                return (
                  <Pressable
                    key={c.value}
                    onPress={() => setAvatarColor(c.value)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c.value + '30', borderColor: c.value },
                      selected && { borderWidth: 3 },
                    ]}
                  >
                    {selected ? <Check size={18} color={c.value} /> : <View style={[styles.colorDot, { backgroundColor: c.value }]} />}
                  </Pressable>
                );
              })}
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
              <Text style={styles.ctaText}>{submitting ? 'Creando cuenta…' : 'Crear cuenta'}</Text>
              <ArrowRight size={20} color={Colors.background.primary} />
            </Pressable>

            <Pressable style={styles.linkBtn} onPress={() => router.replace('/login')}>
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia sesión</Text>
              </Text>
            </Pressable>

            <Text style={styles.privacyText}>
              Tus datos se guardan de forma segura en Supabase. Tu progreso sincroniza entre dispositivos.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        {icon}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.fieldInputWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary, overflow: 'hidden' },
  orb: { position: 'absolute', width: 280, height: 280, borderRadius: 9999, opacity: 0.15 },
  orbCyan: { top: -80, right: -80, backgroundColor: Colors.accent.cyan },
  orbPurple: { bottom: -100, left: -100, backgroundColor: Colors.accent.purple },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarPreview: {
    width: 96, height: 96, borderRadius: 9999,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
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
  sectionLabel: {
    fontSize: Typography.sizes.sm, color: Colors.text.secondary,
    marginTop: Spacing.md, marginBottom: Spacing.sm, fontWeight: Typography.weights.medium,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.background.card,
    borderWidth: 1, borderColor: Colors.background.tertiary,
  },
  chipSelected: { backgroundColor: Colors.accent.cyan + '20', borderColor: Colors.accent.cyan },
  chipText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary },
  chipTextSelected: { color: Colors.accent.cyan, fontWeight: Typography.weights.semibold },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  colorSwatch: {
    width: 52, height: 52, borderRadius: 9999, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  colorDot: { width: 22, height: 22, borderRadius: 9999 },
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
  privacyText: {
    fontSize: Typography.sizes.xs, color: Colors.text.muted,
    textAlign: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.lg,
  },
});
