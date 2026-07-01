// CyberGuard Academy - Scenarios Screen (v2)
// XP-locked categories, daily flash missions, breaking news alerts
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Animated,
  Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft, Mail, Lock, Wifi, Bug, Users, AlertTriangle,
  Cpu, Cloud, Key, Search, Globe, Smartphone, Activity,
  Zap, Link, EyeOff, Bot, ChevronRight, Sparkles,
  Flame, Radio, Siren, Shield, Star, TrendingUp, Clock,
  RotateCcw, MessageSquare,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SkillCategory } from '@/types/game';
import type { Scenario } from '@/types/game';
import {
  generateAdaptiveScenario,
  generateDailyMission,
  generateBreakingNews,
  evaluateNewsResponse,
} from '@/services/aiService';
import type { DailyMission, BreakingNews, NewsResponseEvaluation } from '@/services/aiService';

// ── Category definition ───────────────────────────────────────────────────

interface CategoryDef {
  id: SkillCategory;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  xpRequired: number; // totalXP needed to unlock
}

const allCategories: CategoryDef[] = [
  // Tier 0 — Fundamentos (always unlocked)
  { id: 'phishing',     name: 'Phishing',         description: 'Detecta emails y sitios fraudulentos',           icon: <Mail size={22} color={Colors.accent.cyan} />,         color: Colors.accent.cyan,    bgColor: Colors.accent.cyanGlow,    xpRequired: 0 },
  { id: 'password',     name: 'Contraseñas',       description: 'Seguridad de credenciales y 2FA',                icon: <Lock size={22} color={Colors.accent.green} />,        color: Colors.accent.green,   bgColor: Colors.accent.greenGlow,   xpRequired: 0 },
  { id: 'social',       name: 'Ingeniería Social', description: 'Manipulación psicológica y pretexting',          icon: <Users size={22} color={Colors.accent.yellow} />,      color: Colors.accent.yellow,  bgColor: 'rgba(255,215,0,0.25)',  xpRequired: 0 },
  // Tier 1 — Intermedio (200 XP)
  { id: 'network',      name: 'Redes',             description: 'WiFi, VPN, firewalls e intrusiones',            icon: <Wifi size={22} color={Colors.accent.purple} />,      color: Colors.accent.purple,  bgColor: Colors.accent.purpleGlow,  xpRequired: 200 },
  { id: 'malware',      name: 'Malware',           description: 'Identifica software malicioso y virus',          icon: <Bug size={22} color={Colors.accent.red} />,          color: Colors.accent.red,     bgColor: Colors.accent.redGlow,     xpRequired: 200 },
  // Tier 2 — Avanzado (500 XP)
  { id: 'ransomware',   name: 'Ransomware',        description: 'Ataques de rescate y planes de recuperación',   icon: <AlertTriangle size={22} color="#ff6b35" />,          color: '#ff6b35',             bgColor: 'rgba(255,107,53,0.25)', xpRequired: 500 },
  { id: 'iot',          name: 'IoT / Dispositivos',description: 'Cámaras, sensores y smart devices',             icon: <Cpu size={22} color="#00d4ff" />,                    color: '#00d4ff',             bgColor: 'rgba(0,212,255,0.25)',  xpRequired: 500 },
  { id: 'mobile',       name: 'Seguridad Móvil',   description: 'Apps maliciosas y permisos en dispositivos',    icon: <Smartphone size={22} color="#ff8c42" />,             color: '#ff8c42',             bgColor: 'rgba(255,140,66,0.25)', xpRequired: 500 },
  // Tier 3 — Experto (800 XP)
  { id: 'cloud',        name: 'Seguridad Cloud',   description: 'Buckets, IAM y configuraciones cloud',          icon: <Cloud size={22} color="#7ec8e3" />,                  color: '#7ec8e3',             bgColor: 'rgba(126,200,227,0.25)',xpRequired: 800 },
  { id: 'crypto',       name: 'Criptografía',      description: 'TLS, PKI, firma digital y hashing',            icon: <Key size={22} color="#ffd700" />,                    color: '#ffd700',             bgColor: 'rgba(255,215,0,0.25)',  xpRequired: 800 },
  { id: 'forensics',    name: 'Forense Digital',   description: 'Análisis forense y respuesta a incidentes',     icon: <Search size={22} color="#c084fc" />,                 color: '#c084fc',             bgColor: 'rgba(192,132,252,0.25)',xpRequired: 800 },
  { id: 'ddos',         name: 'DDoS / Disponibilidad',description: 'Mitigación de ataques de denegación',         icon: <Activity size={22} color="#fb7185" />,               color: '#fb7185',             bgColor: 'rgba(251,113,133,0.25)',xpRequired: 800 },
  // Tier 4 — Élite (1200 XP)
  { id: 'osint',        name: 'OSINT',             description: 'Inteligencia de fuentes abiertas',              icon: <Globe size={22} color="#34d399" />,                  color: '#34d399',             bgColor: 'rgba(52,211,153,0.25)',xpRequired: 1200 },
  { id: 'zeroday',      name: 'Zero-Day',          description: 'Vulnerabilidades sin parche y divulgación',     icon: <Zap size={22} color="#fbbf24" />,                    color: '#fbbf24',             bgColor: 'rgba(251,191,36,0.25)',xpRequired: 1200 },
  { id: 'supplychain',  name: 'Cadena de Suministro',description: 'Ataques a dependencias y build pipelines',    icon: <Link size={22} color="#f472b6" />,                   color: '#f472b6',             bgColor: 'rgba(244,114,182,0.25)',xpRequired: 1200 },
  { id: 'privacy',      name: 'Privacidad de Datos',description: 'GDPR, anonimización y cumplimiento legal',     icon: <EyeOff size={22} color="#a78bfa" />,                 color: '#a78bfa',             bgColor: 'rgba(167,139,250,0.25)',xpRequired: 1200 },
  { id: 'ai_attacks',   name: 'Ataques con IA',    description: 'Deepfakes, prompt injection y envenenamiento',   icon: <Bot size={22} color="#38bdf8" />,                    color: '#38bdf8',             bgColor: 'rgba(56,189,248,0.25)',xpRequired: 1200 },
];

const tiers = [
  { name: 'Fundamentos', xpRequired: 0,    subtitle: 'Conceptos básicos de ciberseguridad' },
  { name: 'Intermedio',  xpRequired: 200,  subtitle: 'Técnicas más avanzadas de defensa' },
  { name: 'Avanzado',    xpRequired: 500,  subtitle: 'Escenarios complejos del mundo real' },
  { name: 'Experto',     xpRequired: 800,  subtitle: 'Dominio de vectores especializados' },
  { name: 'Élite',       xpRequired: 1200, subtitle: 'La cima del conocimiento en ciberseguridad' },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function ScenariosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { player, startSession } = useGame();

  const [difficulty, setDifficulty] = useState(player.difficultyPreference);
  const [isGenerating, setIsGenerating] = useState(false);

  // Daily mission state
  const [dailyMission, setDailyMission] = useState<DailyMission | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyCompleted, setDailyCompleted] = useState(false);

  // Breaking news state
  const [breakingNews, setBreakingNews] = useState<BreakingNews | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsUserResponse, setNewsUserResponse] = useState('');
  const [newsEvaluation, setNewsEvaluation] = useState<NewsResponseEvaluation | null>(null);
  const [newsSubmitting, setNewsSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    // Load daily mission on mount
    loadDailyMission();
  }, []);

  const loadDailyMission = useCallback(async () => {
    setDailyLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (player.lastDailyMissionDate === today) {
        setDailyCompleted(true);
      }
      const mission = await generateDailyMission(player);
      setDailyMission(mission);
    } catch (err) {
      console.warn('[Scenarios] daily mission error:', err);
    } finally {
      setDailyLoading(false);
    }
  }, [player]);

  const handleStartScenario = async (cat: CategoryDef) => {
    setIsGenerating(true);
    try {
      const scenario = await generateAdaptiveScenario(cat.id, player);
      startSession(scenario);
      router.push('/gameplay');
    } catch {
      // Direct fallback — simple open-response scenario
      const fallback: Scenario = {
        id: `fb-${cat.id}-${Date.now()}`,
        type: cat.id,
        title: `Desafío de ${cat.name}`,
        description: cat.description,
        difficulty: difficulty === 'adaptive' ? 'beginner' : difficulty,
        xpReward: 30,
        content: {
          mode: 'open_response',
          scenario: `Una situación de ${cat.name} requiere tu análisis inmediato.`,
          openQuestion: `¿Qué harías ante esta situación de ${cat.name}? Describe paso a paso tu análisis y las acciones que tomarías.`,
          rubric: ['Identifica el riesgo principal', 'Propone acciones concretas', 'Justifica tu respuesta', 'Considera el impacto'],
          explanation: 'Revisa los detalles y aplica las mejores prácticas de ciberseguridad.',
        },
        hints: ['Analiza el contexto', 'Considera el principio de menor privilegio'],
      };
      startSession(fallback);
      router.push('/gameplay');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartDaily = async () => {
    if (!dailyMission) return;
    setIsGenerating(true);
    try {
      const scenario: Scenario = {
        id: `daily-${Date.now()}`,
        type: 'phishing',
        title: dailyMission.title,
        description: dailyMission.headline,
        difficulty: dailyMission.difficulty,
        xpReward: dailyMission.xpReward,
        content: {
          scenario: dailyMission.scenario,
          options: dailyMission.options,
          correctOptionId: dailyMission.correctOptionId,
          explanation: dailyMission.explanation,
        },
        hints: ['Piensa en el impacto real de este ataque', '¿Qué haría un equipo de seguridad profesional?'],
      };
      startSession(scenario);
      router.push('/gameplay');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBreakingNews = async () => {
    setNewsLoading(true);
    setNewsEvaluation(null);
    setNewsUserResponse('');
    try {
      const news = await generateBreakingNews();
      setBreakingNews(news);
      setShowNewsModal(true);
    } catch (err) {
      console.warn('[Scenarios] breaking news error:', err);
      // Fallback news (handled by AI service)
      const news = await generateBreakingNews();
      setBreakingNews(news);
      setShowNewsModal(true);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleSubmitNewsResponse = async () => {
    if (!breakingNews || !newsUserResponse.trim()) return;
    setNewsSubmitting(true);
    try {
      const eval_ = await evaluateNewsResponse(breakingNews, newsUserResponse);
      setNewsEvaluation(eval_);
    } catch {
      setNewsEvaluation({
        score: 50,
        verdict: 'regular',
        feedback: 'No pudimos evaluar tu respuesta con IA en este momento.',
        opinion: 'En mi opinión, intenta de nuevo más tarde.',
        whatYouDidRight: [],
        whatYouMissed: [],
        recommendedProtocol: breakingNews.recommendedActions.join('. '),
      });
    } finally {
      setNewsSubmitting(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const isUnlocked = (xpRequired: number) => player.totalXP >= xpRequired;
  const getUnlockProgress = (xpRequired: number): number => {
    if (xpRequired === 0) return 1;
    return Math.min(1, player.totalXP / xpRequired);
  };

  const groupedCategories = tiers.map((tier) => ({
    ...tier,
    categories: allCategories.filter((c) => c.xpRequired === tier.xpRequired),
  }));

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Escenarios IA</Text>
        <View style={styles.xpBadge}>
          <TrendingUp size={16} color={Colors.accent.yellow} />
          <Text style={styles.xpText}>{player.totalXP} XP</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Banner */}
        <Animated.View
          style={[styles.aiBanner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.aiIconContainer}>
            <Sparkles size={24} color={Colors.accent.cyan} />
          </View>
          <View style={styles.aiTextContainer}>
            <Text style={styles.aiTitle}>IA Generativa · Respuesta Escrita</Text>
            <Text style={styles.aiDescription}>
              Escribe tu análisis y la IA te corregirá al instante. Cada reintento te da más pistas para aprender.
            </Text>
          </View>
        </Animated.View>

        {/* Daily Flash Mission */}
        <Animated.View style={{ opacity: fadeAnim, marginBottom: Spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Flame size={18} color="#ff6b35" />
            <Text style={styles.sectionHeaderText}>Misión Flash Diaria</Text>
            {dailyMission && (
              <View style={styles.xpTag}>
                <Zap size={12} color={Colors.accent.yellow} />
                <Text style={styles.xpTagText}>+{dailyMission.xpReward} XP</Text>
              </View>
            )}
          </View>

          {dailyLoading ? (
            <View style={styles.dailyCard}>
              <ActivityIndicator size="small" color={Colors.accent.cyan} />
              <Text style={styles.dailyLoadingText}>Generando misión del día...</Text>
            </View>
          ) : dailyCompleted ? (
            <View style={[styles.dailyCard, styles.dailyCardCompleted]}>
              <Shield size={28} color={Colors.accent.green} />
              <View style={styles.dailyTextWrap}>
                <Text style={styles.dailyCompletedTitle}>Misión completada</Text>
                <Text style={styles.dailyCompletedSub}>Vuelve mañana para un nuevo desafío</Text>
              </View>
            </View>
          ) : dailyMission ? (
            <Pressable
              style={({ pressed }) => [styles.dailyCard, pressed && styles.cardPressed]}
              onPress={handleStartDaily}
              disabled={isGenerating}
            >
              <View style={styles.dailyAlertIcon}>
                <Siren size={22} color="#fff" />
              </View>
              <View style={styles.dailyTextWrap}>
                <Text style={styles.dailyHeadline} numberOfLines={2}>
                  {dailyMission.headline}
                </Text>
                <Text style={styles.dailySub}>{dailyMission.title}</Text>
                <View style={styles.dailyMeta}>
                  <Clock size={12} color={Colors.text.muted} />
                  <Text style={styles.dailyMetaText}>Hoy</Text>
                  <View style={[styles.diffBadge, dailyMission.difficulty === 'beginner' ? styles.diffBeginner : dailyMission.difficulty === 'advanced' ? styles.diffAdvanced : styles.diffIntermediate]}>
                    <Text style={styles.diffBadgeText}>
                      {dailyMission.difficulty === 'beginner' ? 'Básico' : dailyMission.difficulty === 'advanced' ? 'Avanzado' : 'Intermedio'}
                    </Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.text.muted} />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Breaking News Alert */}
        <Animated.View style={{ opacity: fadeAnim, marginBottom: Spacing.lg }}>
          <Pressable
            style={({ pressed }) => [styles.breakingNewsCard, pressed && styles.cardPressed]}
            onPress={handleGenerateBreakingNews}
            disabled={newsLoading}
          >
            <View style={styles.breakingPulse}>
              <View style={styles.breakingPulseDot} />
            </View>
            <View style={styles.breakingTextWrap}>
              <Text style={styles.breakingLabel}>ÚLTIMA HORA</Text>
              <Text style={styles.breakingDesc}>
                {newsLoading
                  ? 'La IA está generando una alerta de ataque realista...'
                  : 'La IA genera una noticia de ciberataque. Tú decides cómo responder.'}
              </Text>
            </View>
            {newsLoading ? (
              <ActivityIndicator size="small" color={Colors.accent.red} />
            ) : (
              <Radio size={20} color={Colors.accent.red} />
            )}
          </Pressable>
        </Animated.View>

        {/* Difficulty Selector */}
        <View style={styles.difficultySection}>
          <Text style={styles.sectionTitle}>Dificultad</Text>
          <View style={styles.difficultyButtons}>
            {(['beginner', 'intermediate', 'advanced', 'adaptive'] as const).map((diff) => (
              <Pressable
                key={diff}
                style={[
                  styles.difficultyButton,
                  difficulty === diff && styles.difficultyButtonActive,
                ]}
                onPress={() => setDifficulty(diff)}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    difficulty === diff && styles.difficultyButtonTextActive,
                  ]}
                >
                  {diff === 'beginner'
                    ? 'Principiante'
                    : diff === 'intermediate'
                    ? 'Intermedio'
                    : diff === 'advanced'
                    ? 'Avanzado'
                    : 'IA Adaptativa'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Categories by Tier */}
        {groupedCategories.map((group) => {
          const unlocked = isUnlocked(group.xpRequired);
          const progress = getUnlockProgress(group.xpRequired);

          return (
            <View key={group.name} style={styles.tierSection}>
              <View style={styles.tierHeader}>
                <View style={styles.tierTitleRow}>
                  {unlocked ? (
                    <Star size={16} color={Colors.accent.yellow} fill={Colors.accent.yellow} />
                  ) : (
                    <Lock size={16} color={Colors.text.muted} />
                  )}
                  <Text style={[styles.tierName, !unlocked && styles.tierNameLocked]}>
                    {group.name}
                  </Text>
                </View>
                {group.xpRequired > 0 && !unlocked && (
                  <Text style={styles.tierXpRequired}>
                    {player.totalXP}/{group.xpRequired} XP
                  </Text>
                )}
              </View>

              {/* XP Progress bar for locked tiers */}
              {group.xpRequired > 0 && !unlocked && (
                <View style={styles.progressBarBg}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.round(progress * 100)}%` as unknown as number },
                    ]}
                  />
                </View>
              )}

              <Text style={styles.tierSubtitle}>{group.subtitle}</Text>

              <View style={styles.categoriesGrid}>
                {group.categories.map((cat) => {
                  const catUnlocked = isUnlocked(cat.xpRequired);
                  return (
                    <Pressable
                      key={cat.id}
                      style={({ pressed }) => [
                        styles.categoryCard,
                        { borderLeftColor: cat.color },
                        !catUnlocked && styles.categoryCardLocked,
                        pressed && catUnlocked && styles.cardPressed,
                      ]}
                      onPress={() => catUnlocked && handleStartScenario(cat)}
                      disabled={!catUnlocked || isGenerating}
                    >
                      <View style={[styles.iconBg, { backgroundColor: cat.bgColor }]}>
                        {catUnlocked ? (
                          cat.icon
                        ) : (
                          <Lock size={22} color={Colors.text.muted} />
                        )}
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text
                          style={[styles.categoryName, !catUnlocked && styles.categoryNameLocked]}
                        >
                          {cat.name}
                        </Text>
                        <Text style={styles.categoryDescription}>
                          {catUnlocked ? cat.description : `${cat.xpRequired} XP para desbloquear`}
                        </Text>
                      </View>
                      {catUnlocked && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginRight: Spacing.sm }}>
                          {(player.categoryRetries?.[cat.id] ?? 0) > 0 && (
                            <View style={styles.retryBadge}>
                              <RotateCcw size={10} color={cat.color} />
                              <Text style={[styles.retryBadgeText, { color: cat.color }]}>
                                {player.categoryRetries[cat.id]}
                              </Text>
                            </View>
                          )}
                          <View style={[styles.skillBadge, { backgroundColor: cat.bgColor }]}>
                            <Text style={[styles.skillValue, { color: cat.color }]}>
                              {player.skills[cat.id] ?? 0}%
                            </Text>
                          </View>
                        </View>
                      )}
                      {catUnlocked ? (
                        <ChevronRight size={20} color={Colors.text.muted} />
                      ) : (
                        <Lock size={16} color={Colors.text.muted} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Loading overlay */}
      {isGenerating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Sparkles size={32} color={Colors.accent.cyan} />
            <Text style={styles.loadingText}>Generando escenario...</Text>
            <Text style={styles.loadingSubtext}>
              La IA está creando un desafío personalizado para ti
            </Text>
          </View>
        </View>
      )}

      {/* Breaking News Modal */}
      <Modal visible={showNewsModal} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalAlertBadge}>
                <Siren size={18} color="#fff" />
                <Text style={styles.modalAlertText}>ALERTA DE SEGURIDAD</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowNewsModal(false);
                  setNewsEvaluation(null);
                  setNewsUserResponse('');
                }}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </Pressable>
            </View>

            {breakingNews && (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Severity badge */}
                <View
                  style={[
                    styles.severityBadge,
                    breakingNews.severity === 'crítica'
                      ? styles.severityCritica
                      : breakingNews.severity === 'alta'
                      ? styles.severityAlta
                      : styles.severityMedia,
                  ]}
                >
                  <Text style={styles.severityText}>
                    {breakingNews.severity.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.newsHeadline}>{breakingNews.headline}</Text>
                {breakingNews.subhead ? (
                  <Text style={styles.newsSubhead}>{breakingNews.subhead}</Text>
                ) : null}

                <Text style={styles.newsBody}>{breakingNews.body}</Text>

                {/* Affected systems */}
                {breakingNews.affectedSystems.length > 0 && (
                  <View style={styles.newsSection}>
                    <Text style={styles.newsSectionTitle}>Sistemas Afectados</Text>
                    {breakingNews.affectedSystems.map((s, i) => (
                      <View key={i} style={styles.newsBullet}>
                        <AlertTriangle size={14} color={Colors.accent.red} />
                        <Text style={styles.newsBulletText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* IoCs */}
                {breakingNews.indicatorsOfCompromise.length > 0 && (
                  <View style={styles.newsSection}>
                    <Text style={styles.newsSectionTitle}>Indicadores de Compromiso (IoCs)</Text>
                    {breakingNews.indicatorsOfCompromise.map((ioc, i) => (
                      <View key={i} style={styles.newsBullet}>
                        <Bug size={14} color={Colors.accent.yellow} />
                        <Text style={styles.newsBulletText}>{ioc}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recommended actions */}
                {breakingNews.recommendedActions.length > 0 && (
                  <View style={styles.newsSection}>
                    <Text style={styles.newsSectionTitle}>Acciones Recomendadas</Text>
                    {breakingNews.recommendedActions.map((act, i) => (
                      <View key={i} style={styles.newsBullet}>
                        <Shield size={14} color={Colors.accent.green} />
                        <Text style={styles.newsBulletText}>{act}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.newsSource}>
                  Fuente: {breakingNews.source} · {new Date(breakingNews.publishedAt).toLocaleTimeString()}
                </Text>

                {/* Response section */}
                {!newsEvaluation ? (
                  <View style={styles.responseSection}>
                    <Text style={styles.responseTitle}>
                      ¿Cómo responderías a esta alerta?
                    </Text>
                    <Text style={styles.responseHint}>
                      Escribe los pasos que tomarías como analista de seguridad ante esta noticia.
                    </Text>
                    <TextInput
                      style={styles.responseInput}
                      placeholder="Describe tu plan de respuesta paso a paso..."
                      placeholderTextColor={Colors.text.muted}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                      value={newsUserResponse}
                      onChangeText={setNewsUserResponse}
                    />
                    <Pressable
                      style={[
                        styles.responseSubmit,
                        (!newsUserResponse.trim() || newsSubmitting) && styles.responseSubmitDisabled,
                      ]}
                      onPress={handleSubmitNewsResponse}
                      disabled={!newsUserResponse.trim() || newsSubmitting}
                    >
                      {newsSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.responseSubmitText}>Enviar Respuesta</Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.evaluationSection}>
                    <View
                      style={[
                        styles.evalScoreBadge,
                        newsEvaluation.verdict === 'excelente'
                          ? styles.evalExcellent
                          : newsEvaluation.verdict === 'bueno'
                          ? styles.evalGood
                          : newsEvaluation.verdict === 'regular'
                          ? styles.evalRegular
                          : styles.evalIncorrect,
                      ]}
                    >
                      <Text style={styles.evalScoreText}>{newsEvaluation.score}/100</Text>
                      <Text style={styles.evalVerdictText}>{newsEvaluation.verdict.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.evalFeedback}>{newsEvaluation.feedback}</Text>
                    <Text style={styles.evalOpinion}>{newsEvaluation.opinion}</Text>

                    {newsEvaluation.whatYouDidRight.length > 0 && (
                      <View style={styles.newsSection}>
                        <Text style={styles.evalListTitle}>✅ Lo que hiciste bien</Text>
                        {newsEvaluation.whatYouDidRight.map((item, i) => (
                          <Text key={i} style={styles.evalListItem}>• {item}</Text>
                        ))}
                      </View>
                    )}
                    {newsEvaluation.whatYouMissed.length > 0 && (
                      <View style={styles.newsSection}>
                        <Text style={styles.evalListTitle}>❌ Lo que te faltó</Text>
                        {newsEvaluation.whatYouMissed.map((item, i) => (
                          <Text key={i} style={styles.evalListItem}>• {item}</Text>
                        ))}
                      </View>
                    )}
                    <View style={styles.newsSection}>
                      <Text style={styles.evalListTitle}>📋 Protocolo recomendado</Text>
                      <Text style={styles.evalListItem}>{newsEvaluation.recommendedProtocol}</Text>
                    </View>

                    <Pressable
                      style={styles.responseSubmit}
                      onPress={() => {
                        setNewsEvaluation(null);
                        setNewsUserResponse('');
                      }}
                    >
                      <Text style={styles.responseSubmitText}>Intentar de nuevo</Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.card, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  xpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.background.card, paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full,
  },
  xpText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.accent.yellow },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // AI Banner
  aiBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.accent.cyan,
  },
  aiIconContainer: {
    width: 48, height: 48, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accent.cyanGlow, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  aiTextContainer: { flex: 1 },
  aiTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.accent.cyan },
  aiDescription: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginTop: Spacing.xs },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionHeaderText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.text.primary, flex: 1 },
  xpTag: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,215,0,0.15)', paddingVertical: 2, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full },
  xpTagText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.accent.yellow },

  // Daily mission card
  dailyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#ff6b35',
  },
  dailyCardCompleted: { borderColor: Colors.accent.green, gap: Spacing.md },
  dailyAlertIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: '#ff6b35', justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  dailyTextWrap: { flex: 1 },
  dailyHeadline: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  dailySub: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, marginTop: 2 },
  dailyMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  dailyMetaText: { fontSize: Typography.sizes.xs, color: Colors.text.muted },
  dailyLoadingText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginLeft: Spacing.md },
  dailyCompletedTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.accent.green },
  dailyCompletedSub: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginTop: 2 },
  diffBadge: { paddingVertical: 1, paddingHorizontal: Spacing.xs, borderRadius: BorderRadius.sm },
  diffBeginner: { backgroundColor: 'rgba(0,255,136,0.2)' },
  diffIntermediate: { backgroundColor: 'rgba(255,215,0,0.2)' },
  diffAdvanced: { backgroundColor: 'rgba(255,51,102,0.2)' },
  diffBadgeText: { fontSize: 10, fontWeight: Typography.weights.bold, color: Colors.text.primary },

  // Breaking news
  breakingNewsCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a0a0a',
    borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.accent.red,
  },
  breakingPulse: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,51,102,0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  breakingPulseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.accent.red },
  breakingTextWrap: { flex: 1 },
  breakingLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.accent.red, letterSpacing: 2 },
  breakingDesc: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginTop: 2 },

  // Card pressed
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },

  // Difficulty
  difficultySection: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.text.primary, marginBottom: Spacing.md },
  difficultyButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  difficultyButton: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full, backgroundColor: Colors.background.card,
    borderWidth: 1, borderColor: Colors.background.tertiary,
  },
  difficultyButtonActive: { backgroundColor: Colors.accent.cyan, borderColor: Colors.accent.cyan },
  difficultyButtonText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary },
  difficultyButtonTextActive: { color: Colors.background.primary, fontWeight: Typography.weights.semibold },

  // Tiers
  tierSection: { marginBottom: Spacing.xl },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  tierTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tierName: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  tierNameLocked: { color: Colors.text.muted },
  tierXpRequired: { fontSize: Typography.sizes.xs, color: Colors.text.muted, fontWeight: Typography.weights.semibold },
  tierSubtitle: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginBottom: Spacing.md },
  progressBarBg: {
    height: 4, backgroundColor: Colors.background.tertiary,
    borderRadius: 2, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  progressBarFill: {
    height: 4, backgroundColor: Colors.accent.cyan, borderRadius: 2,
  },

  // Categories
  categoriesGrid: { gap: Spacing.sm },
  categoryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg, padding: Spacing.md, borderLeftWidth: 4,
  },
  categoryCardLocked: { opacity: 0.5, borderLeftColor: Colors.background.tertiary },
  iconBg: {
    width: 42, height: 42, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  categoryInfo: { flex: 1, marginLeft: Spacing.md },
  categoryName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.text.primary },
  categoryNameLocked: { color: Colors.text.muted },
  categoryDescription: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginTop: 2 },
  skillBadge: {
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md, marginRight: Spacing.sm,
  },
  skillValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  retryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 1,
    paddingHorizontal: Spacing.xs, borderRadius: BorderRadius.full,
  },
  retryBadgeText: { fontSize: 10, fontWeight: Typography.weights.bold },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,15,0.92)', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  loadingCard: {
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.accent.cyan,
  },
  loadingText: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text.primary, marginTop: Spacing.md },
  loadingSubtext: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginTop: Spacing.xs, textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.background.tertiary,
  },
  modalAlertBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accent.red, paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm,
  },
  modalAlertText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: '#fff', letterSpacing: 1 },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background.card,
    justifyContent: 'center', alignItems: 'center',
  },
  modalCloseBtnText: { fontSize: Typography.sizes.lg, color: Colors.text.secondary },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // News content
  severityBadge: {
    alignSelf: 'flex-start', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm, marginBottom: Spacing.md,
  },
  severityCritica: { backgroundColor: 'rgba(255,51,102,0.2)' },
  severityAlta: { backgroundColor: 'rgba(255,107,53,0.2)' },
  severityMedia: { backgroundColor: 'rgba(255,215,0,0.2)' },
  severityText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.accent.red, letterSpacing: 2 },
  newsHeadline: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text.primary, marginBottom: Spacing.sm },
  newsSubhead: { fontSize: Typography.sizes.md, color: Colors.text.secondary, marginBottom: Spacing.md },
  newsBody: { fontSize: Typography.sizes.md, color: Colors.text.primary, lineHeight: 24, marginBottom: Spacing.lg },
  newsSection: { marginBottom: Spacing.lg },
  newsSectionTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text.primary, marginBottom: Spacing.sm },
  newsBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs },
  newsBulletText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, flex: 1 },
  newsSource: { fontSize: Typography.sizes.xs, color: Colors.text.muted, marginBottom: Spacing.lg },

  // Response
  responseSection: {
    borderTopWidth: 1, borderTopColor: Colors.background.tertiary,
    paddingTop: Spacing.lg,
  },
  responseTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.text.primary, marginBottom: Spacing.sm },
  responseHint: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginBottom: Spacing.md },
  responseInput: {
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: Typography.sizes.sm, color: Colors.text.primary,
    borderWidth: 1, borderColor: Colors.background.tertiary, minHeight: 120,
  },
  responseSubmit: {
    backgroundColor: Colors.accent.cyan, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
  },
  responseSubmitDisabled: { opacity: 0.5 },
  responseSubmitText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.background.primary },

  // Evaluation
  evaluationSection: {
    borderTopWidth: 1, borderTopColor: Colors.background.tertiary,
    paddingTop: Spacing.lg,
  },
  evalScoreBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md,
  },
  evalExcellent: { backgroundColor: 'rgba(0,255,136,0.15)' },
  evalGood: { backgroundColor: 'rgba(0,245,212,0.15)' },
  evalRegular: { backgroundColor: 'rgba(255,215,0,0.15)' },
  evalIncorrect: { backgroundColor: 'rgba(255,51,102,0.15)' },
  evalScoreText: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  evalVerdictText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text.secondary },
  evalFeedback: { fontSize: Typography.sizes.md, color: Colors.text.primary, marginBottom: Spacing.sm },
  evalOpinion: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginBottom: Spacing.md, fontStyle: 'italic' },
  evalListTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text.primary, marginBottom: Spacing.xs },
  evalListItem: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginBottom: Spacing.xs, lineHeight: 20 },
});
