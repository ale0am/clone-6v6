// CyberGuard Academy - Gameplay Screen (v3)
// Written answers with AI evaluation + increasing difficulty on retry
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Clock,
  Lightbulb,
  AlertCircle,
  Shield,
  Zap,
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MessageSquare,
  TrendingUp,
  Star,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { evaluateOpenResponse } from '@/services/aiService';
import type { OpenResponseEvaluation } from '@/services/aiService';
import type { ScenarioResult } from '@/types/game';

export default function GameplayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentSession, endSession, incrementCategoryRetry } = useGame();

  // Written response state
  const [writtenResponse, setWrittenResponse] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<OpenResponseEvaluation | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);

  // Timer & hints
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const evalSlideAnim = useRef(new Animated.Value(100)).current;

  const scenario = currentSession?.scenario;

  useEffect(() => {
    if (!scenario) {
      router.replace('/scenarios');
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    const timer = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [scenario, router]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSubmitResponse = async () => {
    if (!scenario || !writtenResponse.trim() || isEvaluating) return;

    setIsEvaluating(true);

    // Incrementar el contador de reintentos para esta categoría
    incrementCategoryRetry(scenario.type);

    try {
      const question = scenario.content.openQuestion ?? scenario.content.scenario;
      const rubric = scenario.content.rubric ?? ['Identifica el riesgo', 'Propone acciones', 'Justifica la respuesta'];
      const explanationHint = scenario.content.explanation ?? '';

      const evalResult = await evaluateOpenResponse(
        scenario.content.scenario,
        question,
        rubric,
        explanationHint,
        writtenResponse
      );

      setEvaluation(evalResult);
      setShowEvaluation(true);

      // Animación de entrada para la evaluación
      evalSlideAnim.setValue(100);
      Animated.timing(evalSlideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Guardar resultado en la sesión
      const xpEarned = Math.round(scenario.xpReward * (evalResult.score / 100));
      const scenarioResult: ScenarioResult = {
        correct: evalResult.score >= 60,
        score: evalResult.score,
        xpEarned,
        timeTaken: timeElapsed,
        skillImprovement: { [scenario.type]: Math.round(evalResult.score / 20) },
        feedback: evalResult.feedback,
      };

      endSession(scenarioResult);
    } catch {
      // Fallback local si falla la IA
      const localScore = Math.min(80, writtenResponse.length > 100 ? 70 : writtenResponse.length > 30 ? 45 : 20);
      setEvaluation({
        score: localScore,
        verdict: localScore >= 70 ? 'bueno' : localScore >= 40 ? 'regular' : 'incorrecto',
        feedback: 'Evaluación local. La IA no respondió a tiempo.',
        opinion: 'En mi opinión, intenta de nuevo para recibir feedback detallado.',
        strengths: [],
        weaknesses: ['La IA no pudo evaluar en este momento'],
        suggestions: ['Intenta de nuevo', 'Describe más pasos concretos', 'Justifica cada decisión'],
        correctApproach: scenario.content.explanation ?? 'Revisa la explicación del escenario.',
      });
      setShowEvaluation(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetry = () => {
    setWrittenResponse('');
    setEvaluation(null);
    setShowEvaluation(false);
    setHintsRevealed(0);
    setTimeElapsed(0);
  };

  const handleRevealHint = () => {
    if (hintsRevealed < (scenario?.hints.length || 0)) {
      setHintsRevealed((prev) => prev + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!scenario) return null;

  const isOpenResponse = scenario.content.mode === 'open_response' || !scenario.content.options;
  const hasMultipleChoice = scenario.content.options && scenario.content.options.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.scenarioType}>{scenario.type.toUpperCase()}</Text>
          <View style={styles.timerBadge}>
            <Clock size={14} color={Colors.text.secondary} />
            <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
          </View>
        </View>
        <View style={styles.xpBadge}>
          <Zap size={14} color={Colors.accent.yellow} />
          <Text style={styles.xpText}>+{scenario.xpReward} XP</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Scenario Card */}
          <Animated.View style={[styles.scenarioCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.scenarioHeader}>
              <Shield size={32} color={Colors.accent.cyan} />
              <Text style={styles.scenarioTitle}>{scenario.title}</Text>
            </View>
            <Text style={styles.scenarioText}>{scenario.content.scenario}</Text>
            <View style={styles.metaRow}>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>
                  {scenario.difficulty === 'beginner' ? 'Principiante' :
                   scenario.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                </Text>
              </View>
              {!showEvaluation && (
                <View style={styles.modeBadge}>
                  <MessageSquare size={12} color={Colors.accent.purple} />
                  <Text style={styles.modeBadgeText}>Respuesta escrita</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Hints section */}
          {!showEvaluation && (
            <View style={styles.hintsSection}>
              <Pressable
                style={styles.hintsButton}
                onPress={handleRevealHint}
                disabled={hintsRevealed >= (scenario.hints?.length || 0)}
              >
                <Lightbulb size={18} color={Colors.accent.yellow} />
                <Text style={styles.hintsButtonText}>
                  {hintsRevealed >= (scenario.hints?.length || 0)
                    ? 'Sin pistas disponibles'
                    : `Mostrar pista (${hintsRevealed}/${scenario.hints?.length || 0})`}
                </Text>
              </Pressable>
              {(scenario.hints ?? []).slice(0, hintsRevealed).map((hint, index) => (
                <View key={index} style={styles.hintBox}>
                  <AlertCircle size={16} color={Colors.accent.yellow} />
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Written Response Section */}
          {!showEvaluation ? (
            <View style={styles.responseSection}>
              {isOpenResponse && (
                <>
                  <View style={styles.questionCard}>
                    <Sparkles size={18} color={Colors.accent.cyan} />
                    <Text style={styles.questionText}>
                      {scenario.content.openQuestion ?? '¿Qué harías en esta situación? Explica paso a paso tu análisis.'}
                    </Text>
                  </View>
                  <Text style={styles.responseHint}>
                    Escribe tu análisis completo. Describe los riesgos que identificas, los pasos que tomarías y por qué.
                  </Text>
                </>
              )}

              <TextInput
                style={styles.responseInput}
                placeholder={
                  isOpenResponse
                    ? 'Escribe tu análisis paso a paso...'
                    : 'Describe tu razonamiento...'
                }
                placeholderTextColor={Colors.text.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={writtenResponse}
                onChangeText={setWrittenResponse}
                editable={!isEvaluating}
              />

              {/* Quick rubric hint */}
              {isOpenResponse && scenario.content.rubric && (
                <View style={styles.rubricHints}>
                  <Text style={styles.rubricTitle}>Criterios de evaluación:</Text>
                  {scenario.content.rubric.map((r, i) => (
                    <View key={i} style={styles.rubricItem}>
                      <Star size={12} color={Colors.accent.yellow} />
                      <Text style={styles.rubricText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  (!writtenResponse.trim() || isEvaluating) && styles.submitButtonDisabled,
                  pressed && writtenResponse.trim() && !isEvaluating && styles.buttonPressed,
                ]}
                onPress={handleSubmitResponse}
                disabled={!writtenResponse.trim() || isEvaluating}
              >
                {isEvaluating ? (
                  <View style={styles.evaluatingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitButtonText}>Evaluando con IA...</Text>
                  </View>
                ) : (
                  <View style={styles.evaluatingRow}>
                    <Send size={18} color={Colors.background.primary} />
                    <Text style={styles.submitButtonText}>Enviar Respuesta</Text>
                  </View>
                )}
              </Pressable>
            </View>
          ) : (
            /* Evaluation Results */
            <Animated.View style={[styles.evaluationSection, { transform: [{ translateY: evalSlideAnim }] }]}>
              {/* Score badge */}
              <View
                style={[
                  styles.evalScoreBadge,
                  evaluation!.verdict === 'excelente' ? styles.evalExcellent :
                  evaluation!.verdict === 'bueno' ? styles.evalGood :
                  evaluation!.verdict === 'regular' ? styles.evalRegular :
                  styles.evalIncorrect,
                ]}
              >
                <View style={styles.evalScoreCircle}>
                  <Text style={styles.evalScoreNumber}>{evaluation!.score}</Text>
                  <Text style={styles.evalScoreLabel}>/100</Text>
                </View>
                <View style={styles.evalVerdictWrap}>
                  <Text style={styles.evalVerdictTitle}>
                    {evaluation!.verdict === 'excelente' ? '¡Excelente!' :
                     evaluation!.verdict === 'bueno' ? 'Buen trabajo' :
                     evaluation!.verdict === 'regular' ? 'Regular' : 'Necesita mejorar'}
                  </Text>
                  <Text style={styles.evalXpEarned}>
                    +{Math.round(scenario.xpReward * (evaluation!.score / 100))} XP ganados
                  </Text>
                </View>
              </View>

              {/* Feedback */}
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackText}>{evaluation!.feedback}</Text>
                {evaluation!.opinion ? (
                  <Text style={styles.opinionText}>{evaluation!.opinion}</Text>
                ) : null}
              </View>

              {/* Strengths */}
              {evaluation!.strengths.length > 0 && (
                <View style={styles.evalListCard}>
                  <Text style={styles.evalListTitle}>
                    <CheckCircle2 size={16} color={Colors.accent.green} /> Lo que hiciste bien
                  </Text>
                  {evaluation!.strengths.map((s, i) => (
                    <View key={i} style={styles.evalListItem}>
                      <View style={styles.evalListDot} />
                      <Text style={styles.evalListText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Weaknesses */}
              {evaluation!.weaknesses.length > 0 && (
                <View style={styles.evalListCard}>
                  <Text style={[styles.evalListTitle, { color: Colors.accent.red }]}>
                    <XCircle size={16} color={Colors.accent.red} /> Áreas de mejora
                  </Text>
                  {evaluation!.weaknesses.map((w, i) => (
                    <View key={i} style={styles.evalListItem}>
                      <View style={[styles.evalListDot, { backgroundColor: Colors.accent.red }]} />
                      <Text style={styles.evalListText}>{w}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Suggestions */}
              {evaluation!.suggestions.length > 0 && (
                <View style={styles.evalListCard}>
                  <Text style={[styles.evalListTitle, { color: Colors.accent.yellow }]}>
                    <TrendingUp size={16} color={Colors.accent.yellow} /> Sugerencias
                  </Text>
                  {evaluation!.suggestions.map((sg, i) => (
                    <View key={i} style={styles.evalListItem}>
                      <View style={[styles.evalListDot, { backgroundColor: Colors.accent.yellow }]} />
                      <Text style={styles.evalListText}>{sg}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Specific hints for retry */}
              {evaluation!.retryHints && evaluation!.retryHints.length > 0 && (
                <View style={styles.retryHintsCard}>
                  <Text style={styles.retryHintsTitle}>
                    <Lightbulb size={16} color={Colors.accent.yellow} /> Pistas para tu próximo intento
                  </Text>
                  {evaluation!.retryHints.map((h, i) => (
                    <View key={i} style={styles.retryHintItem}>
                      <Text style={styles.retryHintNumber}>{i + 1}.</Text>
                      <Text style={styles.retryHintText}>{h}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Correct approach */}
              {evaluation!.correctApproach ? (
                <View style={styles.correctApproachCard}>
                  <Text style={styles.approachTitle}>Enfoque correcto</Text>
                  <Text style={styles.approachText}>{evaluation!.correctApproach}</Text>
                </View>
              ) : null}

              {/* Action buttons */}
              <View style={styles.actionButtons}>
                <Pressable
                  style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
                  onPress={handleRetry}
                >
                  <RotateCcw size={18} color={Colors.accent.cyan} />
                  <Text style={styles.retryButtonText}>Reintentar (más difícil)</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.exitButton, pressed && styles.buttonPressed]}
                  onPress={() => router.push('/scenarios')}
                >
                  <Text style={styles.exitButtonText}>Volver a Escenarios</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
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
  headerCenter: { alignItems: 'center' },
  scenarioType: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold,
    color: Colors.accent.cyan, letterSpacing: 2,
  },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs,
  },
  timerText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary },
  xpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.background.card, paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full,
  },
  xpText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.accent.yellow },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  content: { gap: Spacing.lg },

  // Scenario card
  scenarioCard: {
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.accent.cyan,
  },
  scenarioHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md,
  },
  scenarioTitle: {
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold,
    color: Colors.text.primary, flex: 1,
  },
  scenarioText: {
    fontSize: Typography.sizes.md, color: Colors.text.secondary, lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md,
  },
  difficultyBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.accent.cyanGlow,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full,
  },
  difficultyText: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: Colors.accent.cyan,
  },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(168,85,247,0.15)', paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full,
  },
  modeBadgeText: { fontSize: Typography.sizes.xs, color: Colors.accent.purple },

  // Hints
  hintsSection: { gap: Spacing.sm },
  hintsButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start',
    backgroundColor: Colors.background.card, paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md,
  },
  hintsButtonText: { fontSize: Typography.sizes.sm, color: Colors.accent.yellow },
  hintBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(255,215,0,0.1)', padding: Spacing.md,
    borderRadius: BorderRadius.md, borderLeftWidth: 3, borderLeftColor: Colors.accent.yellow,
  },
  hintText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, flex: 1 },

  // Response section
  responseSection: { gap: Spacing.md },
  questionCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.accent.cyan,
  },
  questionText: {
    fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold,
    color: Colors.text.primary, flex: 1, lineHeight: 22,
  },
  responseHint: {
    fontSize: Typography.sizes.sm, color: Colors.text.muted, lineHeight: 18,
  },
  responseInput: {
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, fontSize: Typography.sizes.md, color: Colors.text.primary,
    borderWidth: 1, borderColor: Colors.background.tertiary,
    minHeight: 160, maxHeight: 300,
  },
  rubricHints: {
    backgroundColor: 'rgba(255,215,0,0.05)', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  rubricTitle: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold,
    color: Colors.accent.yellow, marginBottom: Spacing.sm,
  },
  rubricItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  rubricText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, flex: 1 },

  // Submit button
  submitButton: {
    backgroundColor: Colors.accent.cyan, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: Spacing.sm,
  },
  submitButtonDisabled: { opacity: 0.5 },
  evaluatingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  submitButtonText: {
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold,
    color: Colors.background.primary,
  },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },

  // Evaluation section
  evaluationSection: { gap: Spacing.lg },
  evalScoreBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  evalExcellent: { backgroundColor: 'rgba(0,255,136,0.12)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.25)' },
  evalGood: { backgroundColor: 'rgba(0,212,228,0.12)', borderWidth: 1, borderColor: 'rgba(0,212,228,0.25)' },
  evalRegular: { backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  evalIncorrect: { backgroundColor: 'rgba(255,51,102,0.12)', borderWidth: 1, borderColor: 'rgba(255,51,102,0.25)' },
  evalScoreCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  evalScoreNumber: { fontSize: 28, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  evalScoreLabel: { fontSize: Typography.sizes.xs, color: Colors.text.muted },
  evalVerdictWrap: { flex: 1, gap: 4 },
  evalVerdictTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  evalXpEarned: { fontSize: Typography.sizes.sm, color: Colors.accent.yellow, fontWeight: Typography.weights.semibold },

  // Feedback
  feedbackCard: {
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.background.tertiary,
  },
  feedbackText: {
    fontSize: Typography.sizes.md, color: Colors.text.primary, lineHeight: 22,
  },
  opinionText: {
    fontSize: Typography.sizes.sm, color: Colors.text.secondary,
    marginTop: Spacing.sm, fontStyle: 'italic',
  },

  // Eval lists
  evalListCard: {
    backgroundColor: Colors.background.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, gap: Spacing.sm,
  },
  evalListTitle: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold,
    color: Colors.accent.green, marginBottom: Spacing.xs,
  },
  evalListItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  evalListDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent.green,
    marginTop: 7,
  },
  evalListText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, flex: 1, lineHeight: 20 },

  // Correct approach
  correctApproachCard: {
    backgroundColor: 'rgba(0,245,212,0.08)', borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(0,245,212,0.2)',
  },
  approachTitle: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold,
    color: Colors.accent.cyan, marginBottom: Spacing.sm,
  },
  approachText: {
    fontSize: Typography.sizes.sm, color: Colors.text.secondary, lineHeight: 20,
  },

  // Action buttons
  actionButtons: { gap: Spacing.md, marginTop: Spacing.sm },
  retryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(0,245,212,0.1)', paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.accent.cyan,
  },
  retryButtonText: {
    fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.accent.cyan,
  },
  exitButton: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.card,
  },
  exitButtonText: {
    fontSize: Typography.sizes.md, color: Colors.text.secondary,
  },

  // Retry hints card
  retryHintsCard: {
    backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
  },
  retryHintsTitle: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold,
    color: Colors.accent.yellow, marginBottom: Spacing.md,
  },
  retryHintItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  retryHintNumber: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold,
    color: Colors.accent.yellow, width: 18,
  },
  retryHintText: {
    fontSize: Typography.sizes.sm, color: Colors.text.secondary, flex: 1, lineHeight: 20,
  },

  // Retry badge in scenario card
  retryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,255,136,0.12)', paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full,
  },
  retryBadgeText: { fontSize: Typography.sizes.xs, color: Colors.accent.green },
});
