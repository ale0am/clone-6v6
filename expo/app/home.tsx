// CyberGuard Academy - Main Menu
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield,
  User,
  Trophy,
  Lock,
  Eye,
  Network,
  Bug,
  UserCog,
  ChevronRight,
  Sparkles,
  Building2,
  BrainCircuit,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { player } = useGame();

  const quickActions = [
    {
      icon: Building2,
      title: 'Modo Historia',
      description: 'Audita empresas y oficinas reales como consultor de ciberseguridad',
      color: Colors.accent.cyan,
      route: '/office-world',
      featured: true,
    },
    {
      icon: Lock,
      title: 'Práctica IA',
      description: 'Entrena contraseñas, redes y más con análisis de IA',
      color: Colors.accent.yellow,
      route: '/game-world',
    },
    {
      icon: Eye,
      title: 'Escenarios',
      description: 'Situaciones simuladas por IA para poner a prueba tu criterio',
      color: Colors.accent.red,
      route: '/scenarios',
    },
  ];

  const firstName = player.name ? player.name.split(' ')[0] : 'Agente';

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80' }}
      style={styles.container}
      imageStyle={{ opacity: 0.15 }}
    >
      <StatusBar style="light" />

      <View style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { borderColor: player.avatarColor ?? Colors.accent.cyan, backgroundColor: (player.avatarColor ?? Colors.accent.cyan) + '20' }]}>
              <Shield size={36} color={player.avatarColor ?? Colors.accent.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Bienvenido,</Text>
              <Text style={styles.title} numberOfLines={1}>{firstName}</Text>
              {player.role ? <Text style={styles.subtitle} numberOfLines={1}>{player.role}</Text> : null}
            </View>
          </View>

          <Pressable
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <User size={24} color={Colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{player.level}</Text>
                <Text style={styles.statLabel}>Nivel</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{player.totalXP}</Text>
                <Text style={styles.statLabel}>XP Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{player.streak}</Text>
                <Text style={styles.statLabel}>Racha</Text>
              </View>
            </View>

            <View style={styles.xpContainer}>
              <View style={styles.xpBar}>
                <View
                  style={[
                    styles.xpFill,
                    { width: `${(player.xp / (player.level * 100)) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.xpText}>{player.xp}/{player.level * 100} XP</Text>
            </View>
          </View>

          <View style={styles.knowledgeHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Conocimientos Evaluados</Text>
              <Text style={styles.sectionHint}>Toca uno para ver el análisis de la IA</Text>
            </View>
            <Pressable
              style={styles.knowledgeAllBtn}
              onPress={() => router.push('/knowledge' as never)}
            >
              <Text style={styles.knowledgeAllText}>Ver todo</Text>
              <ChevronRight size={14} color={Colors.accent.cyan} />
            </Pressable>
          </View>
          <View style={styles.skillsContainer}>
            {KNOWLEDGE_ITEMS.map((item) => {
              const value = player.skills[item.key];
              const locked = player.level < item.unlockLevel;
              return (
                <KnowledgeRow
                  key={item.key}
                  item={item}
                  value={value}
                  locked={locked}
                  onPress={() =>
                    !locked && router.push(`/knowledge?skill=${item.key}` as never)
                  }
                />
              );
            })}
          </View>

          <Text style={styles.sectionTitleStandalone}>Comenzar</Text>
          <View style={styles.actionsContainer}>
            {quickActions.map((action) => (
              <Pressable
                key={action.title}
                style={({ pressed }) => [
                  styles.actionCard,
                  action.featured && styles.featuredCard,
                  pressed && styles.actionCardPressed,
                ]}
                onPress={() => router.push(action.route as never)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <ChevronRight size={20} color={Colors.text.muted} />

                {action.featured && (
                  <View style={styles.featuredBadge}>
                    <Sparkles size={12} color={Colors.background.primary} />
                    <Text style={styles.featuredText}>Nuevo</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Trophy size={24} color={Colors.accent.yellow} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Objetivo del Juego</Text>
              <Text style={styles.infoText}>
                Eres un consultor de ciberseguridad contratado para auditar TecnoGlobal C.A.
                Explora la oficina, habla con los empleados, identifica vulnerabilidades y
                documenta tus hallazgos en tu tablet de auditoría.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

type SkillKey = 'password' | 'phishing' | 'network' | 'malware' | 'social';

interface KnowledgeItem {
  key: SkillKey;
  label: string;
  color: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  unlockLevel: number;
}

const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  { key: 'password', label: 'Contraseñas Seguras', color: Colors.accent.yellow, icon: Lock, unlockLevel: 1 },
  { key: 'phishing', label: 'Detección de Phishing', color: Colors.accent.red, icon: Eye, unlockLevel: 1 },
  { key: 'network', label: 'Seguridad de Red', color: Colors.accent.cyan, icon: Network, unlockLevel: 3 },
  { key: 'malware', label: 'Defensa Antimalware', color: Colors.accent.purple, icon: Bug, unlockLevel: 5 },
  { key: 'social', label: 'Ingeniería Social', color: Colors.accent.green, icon: UserCog, unlockLevel: 7 },
];

function KnowledgeRow({
  item,
  value,
  locked,
  onPress,
}: {
  item: KnowledgeItem;
  value: number;
  locked: boolean;
  onPress: () => void;
}) {
  const Icon = item.icon;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.skillBar,
        locked && styles.skillBarLocked,
        pressed && !locked && { opacity: 0.7 },
      ]}
      onPress={onPress}
      disabled={locked}
    >
      <View style={[styles.skillIconBubble, { backgroundColor: item.color + '20' }]}>
        {locked ? (
          <Lock size={14} color={Colors.text.muted} />
        ) : (
          <Icon size={14} color={item.color} />
        )}
      </View>
      <View style={{ flex: 1, gap: Spacing.xs }}>
        <View style={styles.skillHeader}>
          <Text style={[styles.skillLabel, locked && { color: Colors.text.muted }]} numberOfLines={1}>
            {item.label}
          </Text>
          {locked ? (
            <Text style={styles.skillLockedLabel}>Nivel {item.unlockLevel}</Text>
          ) : (
            <Text style={[styles.skillValue, { color: item.color }]}>{value}%</Text>
          )}
        </View>
        <View style={styles.skillTrack}>
          <View
            style={[
              styles.skillFill,
              { width: `${locked ? 0 : value}%`, backgroundColor: item.color },
            ]}
          />
        </View>
      </View>
      {!locked && <BrainCircuit size={16} color={Colors.text.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  logo: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  greeting: { fontSize: Typography.sizes.sm, color: Colors.text.secondary },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  subtitle: { fontSize: Typography.sizes.xs, color: Colors.accent.cyan },
  profileButton: {
    width: 48, height: 48, borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.card, justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingBottom: Spacing.xxl },
  statsCard: {
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: Spacing.md },
  stat: { alignItems: 'center' },
  statValue: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.accent.cyan },
  statLabel: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, marginTop: Spacing.xs },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.background.tertiary },
  xpContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  xpBar: { flex: 1, height: 6, backgroundColor: Colors.background.tertiary, borderRadius: BorderRadius.full, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: Colors.accent.yellow, borderRadius: BorderRadius.full },
  xpText: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, minWidth: 70, textAlign: 'right' },
  sectionTitle: {
    fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  sectionTitleStandalone: {
    fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold,
    color: Colors.text.primary, marginBottom: Spacing.md, marginTop: Spacing.lg,
  },
  knowledgeHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: Spacing.lg, marginBottom: Spacing.md },
  sectionHint: { fontSize: Typography.sizes.xs, color: Colors.text.muted, marginTop: 2 },
  knowledgeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.accent.cyan + '15' },
  knowledgeAllText: { fontSize: Typography.sizes.xs, color: Colors.accent.cyan, fontWeight: Typography.weights.bold },
  skillsContainer: { backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  skillBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  skillBarLocked: { opacity: 0.55 },
  skillIconBubble: { width: 28, height: 28, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillLabel: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, flex: 1, marginRight: Spacing.sm },
  skillValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  skillLockedLabel: { fontSize: Typography.sizes.xs, color: Colors.text.muted, fontStyle: 'italic' },
  skillTrack: { height: 6, backgroundColor: Colors.background.tertiary, borderRadius: BorderRadius.full, overflow: 'hidden' },
  skillFill: { height: '100%', borderRadius: BorderRadius.full },
  actionsContainer: { gap: Spacing.md },
  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.background.tertiary,
  },
  featuredCard: { borderColor: Colors.accent.cyan, borderWidth: 2, backgroundColor: Colors.accent.cyan + '10' },
  actionCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  actionIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  actionContent: { flex: 1, marginLeft: Spacing.md, marginRight: Spacing.sm },
  actionTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.text.primary, marginBottom: 2 },
  actionDescription: { fontSize: Typography.sizes.sm, color: Colors.text.secondary },
  featuredBadge: {
    position: 'absolute', top: -8, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent.cyan, paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: BorderRadius.sm,
  },
  featuredText: { fontSize: 10, fontWeight: Typography.weights.bold, color: Colors.background.primary },
  infoCard: {
    flexDirection: 'row', backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.lg, gap: Spacing.md,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.text.primary, marginBottom: Spacing.xs },
  infoText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, lineHeight: 20 },
});
