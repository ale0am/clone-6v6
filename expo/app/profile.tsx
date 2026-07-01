// CyberGuard Academy - Profile Screen
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  ArrowLeft, 
  User, 
  Zap, 
  Trophy, 
  Flame,
  Mail,
  Lock,
  Wifi,
  Bug,
  Users,
  CheckCircle2,
  LogOut,
  Skull,
  Cpu,
  Cloud,
  Key,
  Search,
  Globe,
  Smartphone,
  ServerCrash,
  AlertTriangle,
  GitBranch,
  Shield,
  Bot
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { player, resetProfile } = useGame();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas cerrar sesión? Tu progreso queda guardado en la nube.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await resetProfile();
            router.replace('/login');
          },
        },
      ]
    );
  };
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const skillMeta: Record<string, { icon: React.ReactNode; color: string; name: string }> = {
    phishing:      { icon: <Mail size={20} color={Colors.accent.cyan} />,       color: Colors.accent.cyan,    name: 'Phishing' },
    password:      { icon: <Lock size={20} color={Colors.accent.green} />,      color: Colors.accent.green,   name: 'Contraseñas' },
    network:       { icon: <Wifi size={20} color={Colors.accent.purple} />,     color: Colors.accent.purple,  name: 'Redes' },
    malware:       { icon: <Bug size={20} color={Colors.accent.red} />,         color: Colors.accent.red,     name: 'Malware' },
    social:        { icon: <Users size={20} color={Colors.accent.yellow} />,    color: Colors.accent.yellow,  name: 'Ing. Social' },
    ransomware:    { icon: <Skull size={20} color={Colors.accent.orange} />,    color: Colors.accent.orange,  name: 'Ransomware' },
    iot:           { icon: <Cpu size={20} color={Colors.accent.teal} />,        color: Colors.accent.teal,    name: 'IoT' },
    cloud:         { icon: <Cloud size={20} color={Colors.accent.blue} />,      color: Colors.accent.blue,    name: 'Nube' },
    crypto:        { icon: <Key size={20} color={Colors.accent.orange} />,      color: Colors.accent.orange,  name: 'Criptografía' },
    forensics:     { icon: <Search size={20} color={Colors.accent.indigo} />,   color: Colors.accent.indigo,  name: 'Forense' },
    osint:         { icon: <Globe size={20} color={Colors.accent.teal} />,      color: Colors.accent.teal,    name: 'OSINT' },
    mobile:        { icon: <Smartphone size={20} color={Colors.accent.pink} />, color: Colors.accent.pink,    name: 'Móvil' },
    ddos:          { icon: <ServerCrash size={20} color={Colors.accent.red} />, color: Colors.accent.red,     name: 'DDoS' },
    zeroday:       { icon: <AlertTriangle size={20} color={Colors.accent.yellow} />, color: Colors.accent.yellow, name: 'Zero-Day' },
    supplychain:   { icon: <GitBranch size={20} color={Colors.accent.lime} />,  color: Colors.accent.lime,    name: 'Cadena Sum.' },
    privacy:       { icon: <Shield size={20} color={Colors.accent.indigo} />,   color: Colors.accent.indigo,  name: 'Privacidad' },
    ai_attacks:    { icon: <Bot size={20} color={Colors.accent.pink} />,        color: Colors.accent.pink,    name: 'IA Adversaria' },
  };

  const getSkillIcon = (skill: string) => skillMeta[skill]?.icon ?? null;
  const getSkillColor = (skill: string): string => skillMeta[skill]?.color ?? Colors.accent.cyan;
  const getSkillName = (skill: string): string => skillMeta[skill]?.name ?? skill;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <Pressable style={styles.backButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.accent.red} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={40} color={Colors.accent.cyan} />
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{player.level}</Text>
              </View>
            </View>
            <Text style={styles.playerName}>{player.name || 'Agente'}</Text>
            <Text style={styles.playerTitle}>{player.role || 'Agente de Seguridad'}</Text>
            {player.email ? (
              <View style={styles.emailRow}>
                <Mail size={14} color={Colors.text.muted} />
                <Text style={styles.emailText}>{player.email}</Text>
              </View>
            ) : null}
            
            <View style={styles.xpContainer}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Nivel {player.level}</Text>
                <Text style={styles.xpValue}>{player.xp % 100}/100 XP</Text>
              </View>
              <View style={styles.xpBar}>
                <View 
                  style={[
                    styles.xpFill, 
                    { width: `${player.xp % 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Zap size={24} color={Colors.accent.yellow} />
              <Text style={styles.statValue}>{player.totalXP}</Text>
              <Text style={styles.statLabel}>XP Total</Text>
            </View>
            <View style={styles.statCard}>
              <Trophy size={24} color={Colors.accent.cyan} />
              <Text style={styles.statValue}>{player.completedScenarios.length}</Text>
              <Text style={styles.statLabel}>Escenarios</Text>
            </View>
            <View style={styles.statCard}>
              <Flame size={24} color={Colors.accent.red} />
              <Text style={styles.statValue}>{player.streak}</Text>
              <Text style={styles.statLabel}>Racha</Text>
            </View>
          </View>

          <View style={styles.skillsSection}>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            <View style={styles.skillsList}>
              {Object.entries(player.skills).map(([skill, level]) => (
                <View key={skill} style={styles.skillCard}>
                  <View style={styles.skillHeader}>
                    <View style={[
                      styles.skillIcon, 
                      { backgroundColor: `${getSkillColor(skill)}20` }
                    ]}>
                      {getSkillIcon(skill)}
                    </View>
                    <View style={styles.skillInfo}>
                      <Text style={styles.skillName}>{getSkillName(skill)}</Text>
                      <Text style={styles.skillLevelText}>Nivel {Math.floor(level / 20) + 1}</Text>
                    </View>
                    <Text style={[styles.skillPercent, { color: getSkillColor(skill) }]}>
                      {level}%
                    </Text>
                  </View>
                  <View style={styles.skillBarContainer}>
                    <View 
                      style={[
                        styles.skillBar, 
                        { width: `${level}%`, backgroundColor: getSkillColor(skill) }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Logros</Text>
            <View style={styles.achievementsList}>
              <View style={styles.achievementCard}>
                <View style={[styles.achievementIcon, { backgroundColor: Colors.accent.cyanGlow }]}>
                  <Trophy size={20} color={Colors.accent.cyan} />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>Primer Escenario</Text>
                  <Text style={styles.achievementDesc}>Completa tu primer escenario</Text>
                </View>
                {player.completedScenarios.length > 0 ? (
                  <CheckCircle2 size={20} color={Colors.accent.green} />
                ) : (
                  <View style={styles.achievementLocked}>
                    <Text style={styles.achievementLockedText}>Bloqueado</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.achievementCard}>
                <View style={[styles.achievementIcon, { backgroundColor: Colors.accent.yellowGlow }]}>
                  <Flame size={20} color={Colors.accent.yellow} />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>Racha de 5</Text>
                  <Text style={styles.achievementDesc}>5 respuestas correctas seguidas</Text>
                </View>
                {player.streak >= 5 ? (
                  <CheckCircle2 size={20} color={Colors.accent.green} />
                ) : (
                  <View style={styles.achievementLocked}>
                    <Text style={styles.achievementLockedText}>Bloqueado</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  content: {
    gap: Spacing.lg,
  },
  profileCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.accent.cyan,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.background.primary,
  },
  playerName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  playerTitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  emailText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  },
  xpContainer: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  xpLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  xpValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent.cyan,
    fontWeight: Typography.weights.semibold,
  },
  xpBar: {
    height: 8,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.accent.cyan,
    borderRadius: BorderRadius.full,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
  skillsSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  skillsList: {
    gap: Spacing.md,
  },
  skillCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  skillIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  skillName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  skillLevelText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  },
  skillPercent: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  skillBarContainer: {
    height: 6,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  skillBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  achievementsSection: {
    gap: Spacing.md,
  },
  achievementsList: {
    gap: Spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  achievementName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  achievementDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  },
  achievementLocked: {
    backgroundColor: Colors.background.tertiary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  achievementLockedText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  },
});
// UNIQUE_ID_1776613937
