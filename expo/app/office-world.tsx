// CyberGuard RPG - Modo Historia
// Navegación estructurada por salas con sistema de misiones y capítulos narrativos

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  User,
  Server,
  Router,
  Monitor,
  Lock,
  Mail,
  Shield,
  Wifi,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Tablet,
  ChevronRight,
  MapPin,
  Target,
  BookOpen,
  Building2,
  Briefcase,
  Wrench,
  Crown,
  DoorOpen,
  Trophy,
  Flag,
  ScrollText,
  Globe,
  Landmark,
  Stethoscope,
  University,
  Circle,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateText } from '@rork-ai/toolkit-sdk';
import {
  analyzePasswordWithAI,
  evaluatePhishingResponse,
  generatePhishingEmails,
  type PhishingEvaluation,
} from '@/services/aiService';
import {
  NPCs,
  OfficeObjects,
  AuditFindings,
  type NPC,
  type OfficeObject,
  type Finding,
} from '@/data/gameData';
import {
  WORLDS,
  type WorldData,
  type Room,
  type RoomId,
  type WorldId,
  type Chapter,
  type GameProgress,
} from '@/data/worldData';



interface PasswordAnalysis {
  score: number;
  strength: 'muy débil' | 'débil' | 'moderada' | 'fuerte' | 'muy fuerte';
  issues: string[];
  suggestions: string[];
  timeToCrack: string;
  aiFeedback: string;
  opinion: string;
  analyzed?: string;
}

interface PhishingEmail {
  id: string;
  sender: string;
  subject: string;
  content: string;
  isPhishing: boolean;
  redFlags: string[];
}

const INITIAL_EMAILS: PhishingEmail[] = [
  {
    id: 'e1',
    sender: 'seguridad@banco-naci0nal.com',
    subject: 'Verificación urgente de su cuenta',
    content:
      'Estimado cliente, hemos detectado actividad sospechosa. Haga clic aquí en las próximas 2 horas para verificar su identidad o su cuenta será bloqueada.',
    isPhishing: true,
    redFlags: ['Dominio con cero en lugar de la O', 'Urgencia artificial', 'Pide hacer clic para "verificar"'],
  },
  {
    id: 'e2',
    sender: 'no-reply@amazon.com',
    subject: 'Tu pedido #A2391 fue enviado',
    content: 'Tu pedido está en camino. Fecha estimada de entrega: mañana. Puedes seguirlo desde la app oficial.',
    isPhishing: false,
    redFlags: [],
  },
  {
    id: 'e3',
    sender: 'premios@loteria-millonaria.net',
    subject: '¡Has ganado $1,000,000 USD!',
    content: 'Felicidades ganador. Envíe sus datos bancarios y una foto de su INE para reclamar su premio antes del viernes.',
    isPhishing: true,
    redFlags: ['Promesa de dinero fácil', 'Solicita datos bancarios e identificación', 'Dominio sospechoso .net'],
  },
  {
    id: 'e4',
    sender: 'recursos.humanos@tecnoglobal.com',
    subject: 'Actualización de políticas internas',
    content: 'Por favor revise y firme el documento en el portal interno (intranet.tecnoglobal.com) antes del viernes.',
    isPhishing: false,
    redFlags: [],
  },
  {
    id: 'e5',
    sender: 'soporte@microsoft-security-alert.com',
    subject: 'Virus detectado en su computadora',
    content: 'Microsoft ha detectado 5 virus en su equipo. Llame inmediatamente al 1-800-555-0199 para soporte premium.',
    isPhishing: true,
    redFlags: ['Dominio no oficial de Microsoft', 'Mensaje alarmista', 'Pide llamar a un número desconocido'],
  },
];

export default function OfficeWorldScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // World state
  const [currentWorldId, setCurrentWorldId] = useState<WorldId>('tecnoglobal');
  const [unlockedWorlds, setUnlockedWorlds] = useState<Set<string>>(new Set(['tecnoglobal']));
  const [showWorlds, setShowWorlds] = useState<boolean>(false);

  const currentWorld = useMemo<WorldData>(
    () => WORLDS.find((w) => w.id === currentWorldId) ?? WORLDS[0],
    [currentWorldId]
  );

  // Estado de juego
  const [currentRoom, setCurrentRoom] = useState<RoomId>('lobby');
  const [visitedRooms, setVisitedRooms] = useState<Set<RoomId>>(new Set(['lobby']));
  const [spokenNpcs, setSpokenNpcs] = useState<Set<string>>(new Set());
  const [findings, setFindings] = useState<Finding[]>(AuditFindings);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [playerXP, setPlayerXP] = useState<number>(0);
  const [playerLevel, setPlayerLevel] = useState<number>(1);

  // Modales
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [activeObject, setActiveObject] = useState<OfficeObject | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [currentDialogue, setCurrentDialogue] = useState<string>('intro');
  const [showTablet, setShowTablet] = useState<boolean>(false);
  const [showChapters, setShowChapters] = useState<boolean>(false);
  const [showRoomIntro, setShowRoomIntro] = useState<boolean>(true);

  // Desafíos
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordAnalysis, setPasswordAnalysis] = useState<PasswordAnalysis | null>(null);
  const [isAnalyzingPassword, setIsAnalyzingPassword] = useState<boolean>(false);
  const [phishingEmails, setPhishingEmails] = useState<PhishingEmail[]>(INITIAL_EMAILS);
  const [phishingUserAnalysis, setPhishingUserAnalysis] = useState<string>('');
  const [phishingEvaluation, setPhishingEvaluation] = useState<PhishingEvaluation | null>(null);
  const [isEvaluatingPhishing, setIsEvaluatingPhishing] = useState<boolean>(false);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState<boolean>(false);

  // Animación de entrada de sala
  const roomFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    roomFade.setValue(0);
    Animated.timing(roomFade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentRoom, roomFade]);

  const foundIds = useMemo(() => new Set(findings.filter((f) => f.found).map((f) => f.id)), [findings]);

  const progress: GameProgress = useMemo(
    () => ({ visitedRooms, spokenNpcs, foundIds, completedChallenges }),
    [visitedRooms, spokenNpcs, foundIds, completedChallenges]
  );

  const activeChapter = useMemo(() => {
    return currentWorld.chapters.find((c: Chapter) => !c.isComplete(progress)) ?? currentWorld.chapters[currentWorld.chapters.length - 1];
  }, [progress]);

  const completedChapterCount = useMemo(
    () => currentWorld.chapters.filter((c: Chapter) => c.isComplete(progress)).length,
    [progress]
  );

  const room = useMemo<Room>(() => currentWorld.rooms.find((r: Room) => r.id === currentRoom) ?? currentWorld.rooms[0], [currentWorld, currentRoom]);
  const roomNpcs = useMemo(() => NPCs.filter((n) => room.npcIds.includes(n.id)), [room]);
  const roomObjects = useMemo(
    () => OfficeObjects.filter((o) => room.objectIds.includes(o.id)),
    [room]
  );

  const goToRoom = useCallback((id: RoomId) => {
    setCurrentRoom(id);
    setVisitedRooms((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setShowRoomIntro(true);
  }, []);

  // ─── World switching ───
  const switchWorld = useCallback((worldId: WorldId) => {
    const target = WORLDS.find((w) => w.id === worldId);
    if (target) {
      setCurrentWorldId(worldId);
      setCurrentRoom('lobby');
      setVisitedRooms(new Set(['lobby']));
      setSpokenNpcs(new Set());
      setCompletedChallenges(new Set());
      setActiveNPC(null);
      setActiveObject(null);
      setActiveChallenge(null);
      setShowRoomIntro(true);
      setFindings(AuditFindings);
    }
  }, []);

  // Unlock worlds based on total XP
  const checkWorldUnlocks = useCallback((xp: number) => {
    setUnlockedWorlds((prev) => {
      const next = new Set(prev);
      WORLDS.forEach((w) => {
        if (xp >= w.unlockXP && !next.has(w.id)) {
          next.add(w.id);
        }
      });
      if (next.size !== prev.size) return next;
      return prev;
    });
  }, []);

  const addXP = useCallback(
    (amount: number) => {
      setPlayerXP((prev) => {
        const newXP = prev + amount;
        const totalAccumulated = (playerLevel - 1) * 200 + newXP;
        checkWorldUnlocks(totalAccumulated);
        if (newXP >= playerLevel * 200) {
          setPlayerLevel((l) => l + 1);
          return newXP - playerLevel * 200;
        }
        return newXP;
      });
    },
    [playerLevel, checkWorldUnlocks]
  );

  const markObjectInspected = useCallback(
    (obj: OfficeObject) => {
      // Marcar hallazgos relacionados como encontrados
      const relevantFindings = AuditFindings.filter((f) => {
        if (obj.type === 'router' && f.category === 'network' && f.id === 'finding_1') return true;
        if (obj.type === 'router' && f.id === 'finding_7') return true;
        if (obj.id === 'terminal_carlos' && f.id === 'finding_2') return true;
        if (obj.id === 'pc_pedro' && f.id === 'finding_3') return true;
        if (obj.id === 'server_main' && (f.id === 'finding_4' || f.id === 'finding_5')) return true;
        if (obj.id === 'email_server' && f.id === 'finding_8') return true;
        if (obj.id === 'pc_maria' && f.id === 'finding_2') return true;
        return false;
      });

      if (relevantFindings.length > 0) {
        setFindings((prev) =>
          prev.map((f) => {
            const match = relevantFindings.find((rf) => rf.id === f.id);
            if (match && !f.found) {
              addXP(f.xpReward);
              return { ...f, found: true };
            }
            return f;
          })
        );
      }
    },
    [addXP]
  );

  // ───────────────────────────── Password challenge ─────────────────────────────
  const getFallbackPasswordAnalysis = (pwd: string): PasswordAnalysis => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    if (pwd.length < 8) {
      issues.push('Muy corta (menos de 8 caracteres)');
      suggestions.push('Usa al menos 12 caracteres');
    } else if (pwd.length < 12) {
      issues.push('Podría ser más larga');
      suggestions.push('Usa 12+ caracteres');
      score += 20;
    } else score += 30;
    if (!/[A-Z]/.test(pwd)) {
      issues.push('Sin mayúsculas');
      suggestions.push('Agrega mayúsculas');
    } else score += 15;
    if (!/[a-z]/.test(pwd)) {
      issues.push('Sin minúsculas');
      suggestions.push('Agrega minúsculas');
    } else score += 15;
    if (!/[0-9]/.test(pwd)) {
      issues.push('Sin números');
      suggestions.push('Incluye números');
    } else score += 20;
    if (!/[^A-Za-z0-9]/.test(pwd)) {
      issues.push('Sin símbolos');
      suggestions.push('Agrega símbolos como !@#$%');
    } else score += 20;
    let strength: PasswordAnalysis['strength'] = 'muy débil';
    if (score >= 90) strength = 'muy fuerte';
    else if (score >= 75) strength = 'fuerte';
    else if (score >= 50) strength = 'moderada';
    else if (score >= 30) strength = 'débil';
    let timeToCrack = 'instantáneo';
    if (score >= 90) timeToCrack = 'siglos';
    else if (score >= 75) timeToCrack = 'años';
    else if (score >= 50) timeToCrack = 'días';
    else if (score >= 30) timeToCrack = 'minutos';
    return {
      score,
      strength,
      issues: issues.slice(0, 3),
      suggestions: suggestions.slice(0, 3),
      timeToCrack,
      aiFeedback:
        score > 70 ? '¡Buen trabajo! Buena entropía.' : 'Necesita mejoras para ser segura.',
      opinion:
        score > 70
          ? 'En mi opinión es una contraseña sólida; hazla única por sitio y activa 2FA.'
          : 'En mi opinión es predecible y un atacante la rompería rápido. Aplica las sugerencias.',
    };
  };

  const analyzePassword = async () => {
    if (!passwordInput.trim()) return;
    setIsAnalyzingPassword(true);
    const pwd = passwordInput;
    try {
      const result = await analyzePasswordWithAI(pwd);
      setPasswordAnalysis({ ...result, analyzed: pwd });
    } catch (err) {
      console.error('analyzePassword fallback:', err);
      setPasswordAnalysis({ ...getFallbackPasswordAnalysis(pwd), analyzed: pwd });
    } finally {
      setIsAnalyzingPassword(false);
    }
  };

  const evaluatePhishing = async () => {
    const text = phishingUserAnalysis.trim();
    if (!text) return;
    setIsEvaluatingPhishing(true);
    try {
      const result = await evaluatePhishingResponse(phishingEmails, text);
      setPhishingEvaluation(result);
      if (result.score >= 70) {
        addXP(100);
        setCompletedChallenges((prev) => {
          if (prev.has('phishing')) return prev;
          const next = new Set(prev);
          next.add('phishing');
          return next;
        });
      }
    } catch (err) {
      console.error('evaluatePhishing fallback:', err);
    } finally {
      setIsEvaluatingPhishing(false);
    }
  };

  const regeneratePhishingEmails = async () => {
    setIsGeneratingEmails(true);
    setPhishingEvaluation(null);
    setPhishingUserAnalysis('');
    try {
      const fresh = await generatePhishingEmails(5);
      setPhishingEmails(fresh);
    } catch (err) {
      console.error('regeneratePhishingEmails:', err);
      setPhishingEmails(INITIAL_EMAILS);
    } finally {
      setIsGeneratingEmails(false);
    }
  };

  const resetPhishingChallenge = () => {
    setPhishingEmails(INITIAL_EMAILS);
    setPhishingUserAnalysis('');
    setPhishingEvaluation(null);
  };

  // ───────────────────────────── Helpers ─────────────────────────────
  const getScoreColor = (score: number): string => {
    if (score >= 80) return Colors.status.success;
    if (score >= 60) return Colors.accent.yellow;
    if (score >= 40) return Colors.accent.red;
    return Colors.status.error;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return Colors.status.error;
      case 'high':
        return Colors.accent.red;
      case 'medium':
        return Colors.accent.yellow;
      default:
        return Colors.accent.cyan;
    }
  };

  const renderObjectIcon = (type: OfficeObject['type'], color: string, size: number = 24) => {
    switch (type) {
      case 'server':
        return <Server size={size} color={color} />;
      case 'router':
        return <Router size={size} color={color} />;
      case 'computer':
        return <Monitor size={size} color={color} />;
      case 'terminal':
        return <Lock size={size} color={color} />;
      case 'wifi':
        return <Wifi size={size} color={color} />;
      case 'printer':
        return <FileText size={size} color={color} />;
      default:
        return <Mail size={size} color={color} />;
    }
  };

  // ───────────────────────────── Render ─────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{currentWorld.name}</Text>
          <Text style={styles.headerSubtitle}>Auditoría — Mundo {currentWorld.index}/4</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => setShowWorlds(true)}>
          <Globe size={20} color={Colors.accent.cyan} />
        </Pressable>
      </View>

      {/* Mission card */}
      <Pressable style={[styles.missionCard, { borderColor: currentWorld.color + '40' }]} onPress={() => setShowChapters(true)}>
        <View style={styles.missionLeft}>
          <View style={[styles.missionIcon, { backgroundColor: currentWorld.color + '20' }]}>
            <Flag size={18} color={currentWorld.color} />
          </View>
        </View>
        <View style={styles.missionBody}>
          <Text style={[styles.missionLabel, { color: currentWorld.color }]}>{activeChapter.title}</Text>
          <Text style={styles.missionObjective} numberOfLines={2}>
            {activeChapter.objective}
          </Text>
        </View>
        <ChevronRight size={18} color={Colors.text.muted} />
      </Pressable>

      {/* Room selector */}
      <View style={styles.roomTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomTabs}
        >
          {currentWorld.rooms.map((r) => {
            const Icon = r.icon;
            const isActive = r.id === currentRoom;
            const isVisited = visitedRooms.has(r.id);
            return (
              <Pressable
                key={r.id}
                onPress={() => goToRoom(r.id)}
                style={[
                  styles.roomTab,
                  isActive && { backgroundColor: r.color + '25', borderColor: r.color },
                ]}
              >
                <Icon size={16} color={isActive ? r.color : Colors.text.secondary} />
                <Text
                  style={[
                    styles.roomTabText,
                    isActive && { color: r.color, fontWeight: Typography.weights.bold },
                  ]}
                >
                  {r.name}
                </Text>
                {isVisited && !isActive && <View style={styles.roomTabDot} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Room content */}
      <Animated.View style={[styles.roomContent, { opacity: roomFade }]}>
        <ScrollView contentContainerStyle={styles.roomScroll} showsVerticalScrollIndicator={false}>
          {/* Room header */}
          <View style={[styles.roomHeader, { borderColor: room.color + '40' }]}>
            <View style={[styles.roomHeaderIcon, { backgroundColor: room.color + '20' }]}>
              <room.icon size={28} color={room.color} />
            </View>
            <View style={styles.roomHeaderText}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomSubtitle}>{room.subtitle}</Text>
            </View>
          </View>

          {/* Ambient narration */}
          {showRoomIntro && (
            <View style={styles.ambientBox}>
              <BookOpen size={14} color={Colors.text.muted} />
              <Text style={styles.ambientText}>{room.ambient}</Text>
            </View>
          )}

          {/* NPCs section */}
          {roomNpcs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={14} color={Colors.text.secondary} />
                <Text style={styles.sectionLabel}>Personas en la sala</Text>
              </View>
              {roomNpcs.map((npc) => {
                const talked = spokenNpcs.has(npc.id);
                return (
                  <Pressable
                    key={npc.id}
                    style={[styles.entityCard, { borderLeftColor: npc.color }]}
                    onPress={() => {
                      setActiveNPC(npc);
                      setCurrentDialogue('intro');
                    }}
                  >
                    <View style={[styles.entityAvatar, { backgroundColor: npc.color + '25' }]}>
                      <User size={22} color={npc.color} />
                    </View>
                    <View style={styles.entityBody}>
                      <View style={styles.entityTitleRow}>
                        <Text style={styles.entityTitle}>{npc.name}</Text>
                        {talked && (
                          <View style={styles.checkPill}>
                            <CheckCircle2 size={11} color={Colors.status.success} />
                            <Text style={styles.checkPillText}>Hablaste</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.entityRole}>{npc.role}</Text>
                      <Text style={styles.entityDesc} numberOfLines={2}>
                        {npc.description}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={Colors.text.muted} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Objects section */}
          {roomObjects.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={14} color={Colors.text.secondary} />
                <Text style={styles.sectionLabel}>Dispositivos y objetos</Text>
              </View>
              {roomObjects.map((obj) => {
                const inspected = obj.vulnerabilities.some((v) =>
                  findings.find((f) => f.id === v.id && f.found)
                );
                return (
                  <Pressable
                    key={obj.id}
                    style={[styles.entityCard, { borderLeftColor: obj.color }]}
                    onPress={() => {
                      setActiveObject(obj);
                      markObjectInspected(obj);
                    }}
                  >
                    <View style={[styles.entityAvatar, { backgroundColor: obj.color + '20' }]}>
                      {renderObjectIcon(obj.type, obj.color, 22)}
                    </View>
                    <View style={styles.entityBody}>
                      <View style={styles.entityTitleRow}>
                        <Text style={styles.entityTitle}>{obj.name}</Text>
                        {inspected && (
                          <View style={styles.checkPill}>
                            <CheckCircle2 size={11} color={Colors.status.success} />
                            <Text style={styles.checkPillText}>Inspeccionado</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.entityDesc} numberOfLines={2}>
                        {obj.description}
                      </Text>
                      {obj.challenge && (
                        <View style={styles.challengePill}>
                          <Sparkles size={10} color={Colors.accent.yellow} />
                          <Text style={styles.challengePillText}>
                            Mini-reto: {obj.challenge.title}
                          </Text>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={18} color={Colors.text.muted} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {roomNpcs.length === 0 && roomObjects.length === 0 && (
            <View style={styles.emptyRoom}>
              <DoorOpen size={32} color={Colors.text.muted} />
              <Text style={styles.emptyRoomText}>La sala está vacía por ahora.</Text>
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </Animated.View>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Pressable style={styles.bottomButton} onPress={() => setShowTablet(true)}>
          <Tablet size={20} color={Colors.accent.cyan} />
          <Text style={styles.bottomButtonText}>Tablet</Text>
          {foundIds.size > 0 && (
            <View style={styles.bottomBadge}>
              <Text style={styles.bottomBadgeText}>{foundIds.size}</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.xpWrap}>
          <View style={styles.xpRow}>
            <Trophy size={12} color={Colors.accent.yellow} />
            <Text style={styles.xpText}>
              Nv. {playerLevel} · {playerXP}/{playerLevel * 200} XP
            </Text>
          </View>
          <View style={styles.xpBar}>
            <View
              style={[styles.xpFill, { width: `${(playerXP / (playerLevel * 200)) * 100}%` }]}
            />
          </View>
        </View>
      </View>

      {/* ─────────── Modal: NPC dialogue ─────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={!!activeNPC}
        onRequestClose={() => {
          setActiveNPC(null);
          setCurrentDialogue('intro');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            {activeNPC && (
              <>
                <View style={styles.sheetHeader}>
                  <View style={[styles.npcAvatarLg, { backgroundColor: activeNPC.color + '30' }]}>
                    <User size={28} color={activeNPC.color} />
                  </View>
                  <View style={styles.sheetHeaderText}>
                    <Text style={styles.sheetTitle}>{activeNPC.name}</Text>
                    <Text style={styles.sheetSubtitle}>{activeNPC.role}</Text>
                  </View>
                  <Pressable
                    style={styles.closeButton}
                    onPress={() => {
                      setSpokenNpcs((prev) => {
                        const next = new Set(prev);
                        next.add(activeNPC.id);
                        return next;
                      });
                      setActiveNPC(null);
                      setCurrentDialogue('intro');
                    }}
                  >
                    <X size={18} color={Colors.text.secondary} />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.sheetBody}
                  contentContainerStyle={{ paddingBottom: Spacing.xl }}
                >
                  {(() => {
                    const dlg = activeNPC.dialogues.find((d) => d.id === currentDialogue);
                    if (!dlg) return null;
                    return (
                      <>
                        <View style={styles.bubble}>
                          <Text style={styles.bubbleText}>{dlg.text}</Text>
                        </View>
                        {dlg.reward && (
                          <View style={styles.rewardChip}>
                            <Sparkles size={12} color={Colors.accent.yellow} />
                            <Text style={styles.rewardText}>
                              {dlg.reward.type === 'xp'
                                ? `+${dlg.reward.value} XP`
                                : dlg.reward.type === 'hint'
                                ? `Pista: ${dlg.reward.value}`
                                : `Info: ${dlg.reward.value}`}
                            </Text>
                          </View>
                        )}
                        {dlg.options && dlg.options.length > 0 ? (
                          <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
                            {dlg.options.map((opt, i) => (
                              <Pressable
                                key={i}
                                style={styles.dialogOption}
                                onPress={() => {
                                  if (dlg.reward?.type === 'xp') {
                                    addXP(Number(dlg.reward.value));
                                  }
                                  setCurrentDialogue(opt.nextId);
                                }}
                              >
                                <Text style={styles.dialogOptionText}>{opt.text}</Text>
                                <ChevronRight size={16} color={Colors.accent.cyan} />
                              </Pressable>
                            ))}
                          </View>
                        ) : (
                          <Pressable
                            style={styles.primaryButton}
                            onPress={() => {
                              if (dlg.reward?.type === 'xp') addXP(Number(dlg.reward.value));
                              setSpokenNpcs((prev) => {
                                const next = new Set(prev);
                                next.add(activeNPC.id);
                                return next;
                              });
                              setActiveNPC(null);
                              setCurrentDialogue('intro');
                            }}
                          >
                            <Text style={styles.primaryButtonText}>Terminar conversación</Text>
                          </Pressable>
                        )}
                      </>
                    );
                  })()}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─────────── Modal: Object inspection ─────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={!!activeObject && !activeChallenge}
        onRequestClose={() => setActiveObject(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            {activeObject && (
              <>
                <View style={styles.sheetHeader}>
                  <View style={[styles.npcAvatarLg, { backgroundColor: activeObject.color + '25' }]}>
                    {renderObjectIcon(activeObject.type, activeObject.color, 26)}
                  </View>
                  <View style={styles.sheetHeaderText}>
                    <Text style={styles.sheetTitle}>{activeObject.name}</Text>
                    <Text style={styles.sheetSubtitle}>Inspección de dispositivo</Text>
                  </View>
                  <Pressable style={styles.closeButton} onPress={() => setActiveObject(null)}>
                    <X size={18} color={Colors.text.secondary} />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.sheetBody}
                  contentContainerStyle={{ paddingBottom: Spacing.xl }}
                >
                  <View style={styles.bubble}>
                    <Text style={styles.bubbleText}>{activeObject.description}</Text>
                  </View>

                  {activeObject.vulnerabilities.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Vulnerabilidades detectadas</Text>
                      {activeObject.vulnerabilities.map((v) => (
                        <View
                          key={v.id}
                          style={[
                            styles.vulnRow,
                            { borderLeftColor: getSeverityColor(v.severity) },
                          ]}
                        >
                          <AlertTriangle size={14} color={getSeverityColor(v.severity)} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vulnTitle}>{v.title}</Text>
                            <Text style={styles.vulnDesc}>{v.description}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {activeObject.challenge && (
                    <Pressable
                      style={styles.challengeCta}
                      onPress={() => {
                        if (activeObject.challenge?.type === 'password') {
                          setActiveChallenge('password');
                        } else if (activeObject.challenge?.type === 'phishing') {
                          setActiveChallenge('phishing');
                        }
                      }}
                    >
                      <Sparkles size={16} color={Colors.background.primary} />
                      <Text style={styles.challengeCtaText}>
                        Resolver: {activeObject.challenge.title}
                      </Text>
                    </Pressable>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─────────── Modal: Challenges ─────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={!!activeChallenge}
        onRequestClose={() => {
          setActiveChallenge(null);
          setPasswordInput('');
          setPasswordAnalysis(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>
                  {activeChallenge === 'password' ? 'Laboratorio de Contraseñas' : 'Detector de Phishing'}
                </Text>
                <Text style={styles.sheetSubtitle}>Mini-reto con IA</Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={() => {
                  setActiveChallenge(null);
                  setPasswordInput('');
                  setPasswordAnalysis(null);
                }}
              >
                <X size={18} color={Colors.text.secondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetBody}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            >
              {activeChallenge === 'password' && (
                <>
                  <Text style={styles.challengeDesc}>
                    Ingresa una contraseña y la IA evaluará su fortaleza con sugerencias personalizadas.
                  </Text>

                  <View style={styles.pwdInput}>
                    <Lock size={18} color={Colors.text.muted} />
                    <TextInput
                      style={styles.pwdInputField}
                      placeholder="Escribe una contraseña…"
                      placeholderTextColor={Colors.text.muted}
                      secureTextEntry
                      value={passwordInput}
                      onChangeText={setPasswordInput}
                      onSubmitEditing={analyzePassword}
                    />
                  </View>

                  <Pressable
                    style={[
                      styles.primaryButton,
                      (!passwordInput.trim() || isAnalyzingPassword) && styles.primaryButtonDisabled,
                    ]}
                    onPress={analyzePassword}
                    disabled={!passwordInput.trim() || isAnalyzingPassword}
                  >
                    {isAnalyzingPassword ? (
                      <ActivityIndicator color={Colors.background.primary} />
                    ) : (
                      <>
                        <Sparkles size={18} color={Colors.background.primary} />
                        <Text style={styles.primaryButtonText}>Analizar con IA</Text>
                      </>
                    )}
                  </Pressable>

                  {passwordAnalysis && (
                    <View style={styles.analysisCard}>
                      {!!passwordAnalysis.analyzed && (
                        <View style={styles.analyzedBox}>
                          <Text style={styles.analyzedLabel}>Contraseña analizada</Text>
                          <Text style={styles.analyzedValue} selectable>{passwordAnalysis.analyzed}</Text>
                        </View>
                      )}
                      <View style={styles.scoreRow}>
                        <View
                          style={[
                            styles.scoreCircle,
                            { borderColor: getScoreColor(passwordAnalysis.score) },
                          ]}
                        >
                          <Text
                            style={[
                              styles.scoreVal,
                              { color: getScoreColor(passwordAnalysis.score) },
                            ]}
                          >
                            {passwordAnalysis.score}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.strengthLabel,
                              { color: getScoreColor(passwordAnalysis.score) },
                            ]}
                          >
                            {passwordAnalysis.strength.toUpperCase()}
                          </Text>
                          <Text style={styles.crackTime}>
                            Tiempo para descifrar: {passwordAnalysis.timeToCrack}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.aiFeedback}>{passwordAnalysis.aiFeedback}</Text>

                      {!!passwordAnalysis.opinion && (
                        <View style={styles.opinionBox}>
                          <Sparkles size={14} color={Colors.accent.cyan} />
                          <Text style={styles.opinionText}>{passwordAnalysis.opinion}</Text>
                        </View>
                      )}

                      {passwordAnalysis.issues.length > 0 && (
                        <>
                          <Text style={styles.sectionTitle}>Problemas</Text>
                          {passwordAnalysis.issues.map((it, i) => (
                            <View key={i} style={styles.bulletRow}>
                              <AlertTriangle size={12} color={Colors.status.error} />
                              <Text style={styles.bulletText}>{it}</Text>
                            </View>
                          ))}
                        </>
                      )}
                      <Text style={styles.sectionTitle}>Sugerencias</Text>
                      {passwordAnalysis.suggestions.map((s, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <CheckCircle2 size={12} color={Colors.status.success} />
                          <Text style={styles.bulletText}>{s}</Text>
                        </View>
                      ))}

                      {passwordAnalysis.score >= 60 && (
                        <Pressable
                          style={styles.primaryButton}
                          onPress={() => {
                            setCompletedChallenges((prev) => {
                              const next = new Set(prev);
                              next.add('password');
                              return next;
                            });
                            addXP(80);
                            setActiveChallenge(null);
                            setPasswordInput('');
                            setPasswordAnalysis(null);
                          }}
                        >
                          <CheckCircle2 size={16} color={Colors.background.primary} />
                          <Text style={styles.primaryButtonText}>Completar reto (+80 XP)</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </>
              )}

              {activeChallenge === 'phishing' && (
                <>
                  <Text style={styles.challengeDesc}>
                    Lee la bandeja y escribe tu análisis: ¿qué correos crees que son fraude (phishing) y por qué? La IA evaluará tu razonamiento.
                  </Text>

                  <Pressable
                    style={[styles.secondaryButton, isGeneratingEmails && { opacity: 0.6 }]}
                    onPress={regeneratePhishingEmails}
                    disabled={isGeneratingEmails || isEvaluatingPhishing}
                  >
                    {isGeneratingEmails ? (
                      <ActivityIndicator size="small" color={Colors.accent.cyan} />
                    ) : (
                      <Sparkles size={14} color={Colors.accent.cyan} />
                    )}
                    <Text style={styles.secondaryButtonText}>
                      {isGeneratingEmails ? 'Generando correos...' : 'Generar nuevos correos con IA'}
                    </Text>
                  </Pressable>

                  {phishingEmails.map((email, idx) => {
                    const detail = phishingEvaluation?.detailedAnalysis.find(
                      (d) => d.emailId === email.id
                    );
                    const isRevealed = !!phishingEvaluation;
                    const borderColor = isRevealed
                      ? email.isPhishing
                        ? Colors.status.error
                        : Colors.status.success
                      : undefined;
                    return (
                      <View
                        key={email.id}
                        style={[
                          styles.emailCard,
                          borderColor ? { borderColor } : null,
                        ]}
                      >
                        <View style={styles.emailHead}>
                          <Text style={styles.emailIndex}>#{idx + 1}</Text>
                          <Mail size={14} color={Colors.text.muted} />
                          <Text style={styles.emailSender} numberOfLines={1}>
                            {email.sender}
                          </Text>
                        </View>
                        <Text style={styles.emailSubject}>{email.subject}</Text>
                        <Text style={styles.emailContent}>{email.content}</Text>

                        {isRevealed && (
                          <View
                            style={[
                              styles.verdictBox,
                              {
                                backgroundColor: email.isPhishing
                                  ? Colors.status.error + '15'
                                  : Colors.status.success + '15',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.verdictLabel,
                                {
                                  color: email.isPhishing
                                    ? Colors.status.error
                                    : Colors.status.success,
                                },
                              ]}
                            >
                              {email.isPhishing ? 'ES PHISHING' : 'ES LEGÍTIMO'}
                            </Text>
                            {email.redFlags.length > 0 && (
                              <View style={styles.redFlags}>
                                {email.redFlags.map((flag, i) => (
                                  <Text key={i} style={styles.redFlag}>
                                    • {flag}
                                  </Text>
                                ))}
                              </View>
                            )}
                            {detail && (
                              <View style={styles.detailBox}>
                                <Text
                                  style={[
                                    styles.detailVerdict,
                                    {
                                      color:
                                        detail.verdict === 'correcto'
                                          ? Colors.status.success
                                          : detail.verdict === 'parcial'
                                          ? Colors.accent.yellow
                                          : Colors.status.error,
                                    },
                                  ]}
                                >
                                  Tu análisis: {detail.verdict.toUpperCase()}
                                </Text>
                                <Text style={styles.detailExplanation}>
                                  {detail.explanation}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}

                  <Text style={styles.inputLabel}>Tu análisis</Text>
                  <TextInput
                    style={styles.analysisInput}
                    placeholder={'Ej: El correo #1 es phishing porque el dominio tiene un cero. El #3 también porque promete dinero...'}
                    placeholderTextColor={Colors.text.muted}
                    value={phishingUserAnalysis}
                    onChangeText={setPhishingUserAnalysis}
                    multiline
                    numberOfLines={5}
                    editable={!phishingEvaluation && !isEvaluatingPhishing}
                    textAlignVertical="top"
                  />

                  {!phishingEvaluation ? (
                    <Pressable
                      style={[
                        styles.primaryButton,
                        (isEvaluatingPhishing || !phishingUserAnalysis.trim()) && { opacity: 0.6 },
                      ]}
                      onPress={evaluatePhishing}
                      disabled={isEvaluatingPhishing || !phishingUserAnalysis.trim()}
                    >
                      {isEvaluatingPhishing ? (
                        <ActivityIndicator size="small" color={Colors.background.primary} />
                      ) : (
                        <Sparkles size={16} color={Colors.background.primary} />
                      )}
                      <Text style={styles.primaryButtonText}>
                        {isEvaluatingPhishing ? 'Evaluando con IA...' : 'Evaluar mi análisis'}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.evaluationBox}>
                      <View style={styles.scoreHead}>
                        <Text
                          style={[
                            styles.scoreBig,
                            { color: getScoreColor(phishingEvaluation.score) },
                          ]}
                        >
                          {phishingEvaluation.score}
                        </Text>
                        <Text style={styles.scoreLabel}>/100</Text>
                      </View>

                      <Text style={styles.evalFeedback}>{phishingEvaluation.feedback}</Text>
                      <Text style={styles.evalOpinion}>{phishingEvaluation.opinion}</Text>

                      {phishingEvaluation.missed.length > 0 && (
                        <View style={styles.evalRow}>
                          <Text style={styles.evalRowTitle}>Se te pasaron:</Text>
                          {phishingEvaluation.missed.map((id) => {
                            const idx = phishingEmails.findIndex((e) => e.id === id);
                            return (
                              <Text key={id} style={styles.evalRowItem}>
                                • Correo #{idx + 1}
                              </Text>
                            );
                          })}
                        </View>
                      )}

                      {phishingEvaluation.falsePositives.length > 0 && (
                        <View style={styles.evalRow}>
                          <Text style={styles.evalRowTitle}>Falsos positivos:</Text>
                          {phishingEvaluation.falsePositives.map((id) => {
                            const idx = phishingEmails.findIndex((e) => e.id === id);
                            return (
                              <Text key={id} style={styles.evalRowItem}>
                                • Correo #{idx + 1}
                              </Text>
                            );
                          })}
                        </View>
                      )}

                      {phishingEvaluation.suggestions.length > 0 && (
                        <View style={styles.evalRow}>
                          <Text style={styles.evalRowTitle}>Sugerencias:</Text>
                          {phishingEvaluation.suggestions.map((s, i) => (
                            <Text key={i} style={styles.evalRowItem}>
                              • {s}
                            </Text>
                          ))}
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                        <Pressable
                          style={[styles.secondaryButton, { flex: 1 }]}
                          onPress={resetPhishingChallenge}
                        >
                          <Text style={styles.secondaryButtonText}>Reintentar</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.primaryButton, { flex: 1 }]}
                          onPress={() => {
                            setActiveChallenge(null);
                            resetPhishingChallenge();
                          }}
                        >
                          <CheckCircle2 size={16} color={Colors.background.primary} />
                          <Text style={styles.primaryButtonText}>Cerrar</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─────────── Modal: Tablet ─────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={showTablet}
        onRequestClose={() => setShowTablet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={[styles.npcAvatarLg, { backgroundColor: Colors.accent.cyan + '25' }]}>
                <Tablet size={26} color={Colors.accent.cyan} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>Tablet de Auditoría</Text>
                <Text style={styles.sheetSubtitle}>
                  {foundIds.size} / {findings.length} hallazgos
                </Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setShowTablet(false)}>
                <X size={18} color={Colors.text.secondary} />
              </Pressable>
            </View>

            <View style={styles.tabletStats}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{foundIds.size}</Text>
                <Text style={styles.statLbl}>Hallazgos</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>
                  {findings.filter((f) => f.severity === 'critical' && f.found).length}
                </Text>
                <Text style={styles.statLbl}>Críticos</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{playerXP}</Text>
                <Text style={styles.statLbl}>XP</Text>
              </View>
            </View>

            <ScrollView
              style={styles.sheetBody}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            >
              {findings.filter((f) => f.found).length === 0 ? (
                <View style={styles.emptyRoom}>
                  <MapPin size={28} color={Colors.text.muted} />
                  <Text style={styles.emptyRoomText}>
                    Aún no has documentado vulnerabilidades. Explora las salas y habla con los empleados.
                  </Text>
                </View>
              ) : (
                findings
                  .filter((f) => f.found)
                  .map((f) => (
                    <View
                      key={f.id}
                      style={[styles.findingCard, { borderLeftColor: getSeverityColor(f.severity) }]}
                    >
                      <View style={styles.findingHead}>
                        <Text style={styles.findingTitle}>{f.title}</Text>
                        <View
                          style={[
                            styles.severityBadge,
                            { backgroundColor: getSeverityColor(f.severity) + '25' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.severityText,
                              { color: getSeverityColor(f.severity) },
                            ]}
                          >
                            {f.severity.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.findingDesc}>{f.description}</Text>
                      <View style={styles.solutionBox}>
                        <Text style={styles.solutionLabel}>Solución</Text>
                        <Text style={styles.solutionText}>{f.solution}</Text>
                      </View>
                    </View>
                  ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────── Modal: Chapters ─────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={showChapters}
        onRequestClose={() => setShowChapters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={[styles.npcAvatarLg, { backgroundColor: Colors.accent.cyan + '25' }]}>
                <ScrollText size={26} color={Colors.accent.cyan} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>Capítulos</Text>
                <Text style={styles.sheetSubtitle}>
                  {completedChapterCount}/{currentWorld.chapters.length} completados
                </Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setShowChapters(false)}>
                <X size={18} color={Colors.text.secondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetBody}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            >
              {currentWorld.chapters.map((ch, i) => {
                const done = ch.isComplete(progress);
                const isActive = !done && ch.id === activeChapter.id;
                return (
                  <View
                    key={ch.id}
                    style={[
                      styles.chapterCard,
                      isActive && { borderColor: Colors.accent.cyan },
                      done && { opacity: 0.6 },
                    ]}
                  >
                    <View style={styles.chapterHead}>
                      <View
                        style={[
                          styles.chapterNum,
                          done && { backgroundColor: Colors.status.success + '30' },
                          isActive && { backgroundColor: Colors.accent.cyan + '30' },
                        ]}
                      >
                        {done ? (
                          <CheckCircle2 size={16} color={Colors.status.success} />
                        ) : (
                          <Text style={styles.chapterNumText}>{i + 1}</Text>
                        )}
                      </View>
                      <Text style={styles.chapterTitle}>{ch.title}</Text>
                    </View>
                    <Text style={styles.chapterObj}>{ch.objective}</Text>
                    {isActive && (
                      <View style={styles.chapterHint}>
                        <Sparkles size={11} color={Colors.accent.yellow} />
                        <Text style={styles.chapterHintText}>{ch.hint}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────── Modal: Worlds ─────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={showWorlds}
        onRequestClose={() => setShowWorlds(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={[styles.npcAvatarLg, { backgroundColor: Colors.accent.cyan + '25' }]}>
                <Globe size={26} color={Colors.accent.cyan} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>Mundos Disponibles</Text>
                <Text style={styles.sheetSubtitle}>
                  {unlockedWorlds.size}/{WORLDS.length} desbloqueados
                </Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setShowWorlds(false)}>
                <X size={18} color={Colors.text.secondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetBody}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            >
              {WORLDS.map((w) => {
                const unlocked = unlockedWorlds.has(w.id);
                const isCurrent = w.id === currentWorldId;
                const WorldIcon = w.icon;
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => {
                      if (unlocked) {
                        switchWorld(w.id as WorldId);
                        setShowWorlds(false);
                      }
                    }}
                    style={[
                      styles.worldCard,
                      isCurrent && { borderColor: w.color },
                      !unlocked && styles.worldCardLocked,
                    ]}
                  >
                    <View style={[styles.worldIconBox, { backgroundColor: unlocked ? w.color + '20' : Colors.background.tertiary }]}>
                      <WorldIcon size={28} color={unlocked ? w.color : Colors.text.muted} />
                    </View>
                    <View style={styles.worldInfo}>
                      <View style={styles.worldRow}>
                        <Text style={[styles.worldName, !unlocked && { color: Colors.text.muted }]}>
                          {w.name}
                        </Text>
                        {isCurrent && (
                          <View style={[styles.worldBadge, { backgroundColor: w.color + '30' }]}>
                            <MapPin size={10} color={w.color} />
                            <Text style={[styles.worldBadgeText, { color: w.color }]}>Activo</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.worldSubtitle}>{w.subtitle}</Text>
                      <Text style={styles.worldDesc} numberOfLines={2}>
                        {w.description}
                      </Text>
                      {unlocked ? (
                        <View style={styles.worldMeta}>
                          <Trophy size={12} color={w.color} />
                          <Text style={[styles.worldMetaText, { color: w.color }]}>
                            {w.chapters.length} capítulos
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.worldLockRow}>
                          <Lock size={12} color={Colors.text.muted} />
                          <Text style={styles.worldLockText}>{w.unlockXP} XP requeridos</Text>
                        </View>
                      )}
                    </View>
                    {isCurrent ? (
                      <CheckCircle2 size={20} color={w.color} />
                    ) : unlocked ? (
                      <ChevronRight size={20} color={Colors.text.muted} />
                    ) : (
                      <Circle size={20} color={Colors.background.tertiary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: { fontSize: Typography.sizes.xs, color: Colors.text.secondary },

  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent.cyan + '40',
    gap: Spacing.md,
  },
  missionLeft: { justifyContent: 'center' },
  missionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.cyan + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionBody: { flex: 1 },
  missionLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.cyan,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  missionObjective: { fontSize: Typography.sizes.sm, color: Colors.text.primary, lineHeight: 18 },

  roomTabsWrapper: { paddingBottom: Spacing.sm },
  roomTabs: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  roomTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  roomTabText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary },
  roomTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.status.success,
  },

  roomContent: { flex: 1 },
  roomScroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  roomHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomHeaderText: { flex: 1 },
  roomName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  roomSubtitle: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, marginTop: 2 },

  ambientBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.text.muted,
    marginBottom: Spacing.md,
  },
  ambientText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: Typography.weights.bold,
  },

  entityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 3,
    marginBottom: Spacing.sm,
  },
  entityAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entityBody: { flex: 1 },
  entityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  entityTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    flex: 1,
  },
  entityRole: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, marginBottom: 4 },
  entityDesc: { fontSize: Typography.sizes.xs, color: Colors.text.muted, lineHeight: 16 },

  checkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.status.success + '20',
  },
  checkPillText: { fontSize: 10, color: Colors.status.success, fontWeight: Typography.weights.bold },

  challengePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent.yellow + '20',
    marginTop: 6,
  },
  challengePillText: { fontSize: 10, color: Colors.accent.yellow, fontWeight: Typography.weights.bold },

  emptyRoom: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyRoomText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
    backgroundColor: Colors.background.primary,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  bottomButtonText: { fontSize: Typography.sizes.sm, color: Colors.text.primary },
  bottomBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent.red,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bottomBadgeText: { fontSize: 10, color: Colors.text.primary, fontWeight: Typography.weights.bold },
  xpWrap: { flex: 1 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  xpText: { fontSize: Typography.sizes.xs, color: Colors.text.secondary },
  xpBar: {
    height: 4,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: Colors.accent.yellow },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    minHeight: 320,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.tertiary,
  },
  sheetHeaderText: { flex: 1 },
  sheetTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  sheetSubtitle: { fontSize: Typography.sizes.sm, color: Colors.text.secondary },
  sheetBody: { padding: Spacing.lg },

  npcAvatarLg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bubble: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  bubbleText: { fontSize: Typography.sizes.md, color: Colors.text.primary, lineHeight: 22 },

  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.accent.yellow + '20',
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  rewardText: { fontSize: Typography.sizes.xs, color: Colors.accent.yellow, fontWeight: Typography.weights.bold },

  dialogOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.accent.cyan + '15',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent.cyan + '40',
  },
  dialogOptionText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.accent.cyan },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.accent.cyan,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  primaryButtonDisabled: { backgroundColor: Colors.background.tertiary },
  primaryButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background.primary,
  },

  vulnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    marginBottom: Spacing.sm,
  },
  vulnTitle: { fontSize: Typography.sizes.sm, color: Colors.text.primary, fontWeight: Typography.weights.bold },
  vulnDesc: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, marginTop: 2 },

  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  challengeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.accent.yellow,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  challengeCtaText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background.primary,
  },

  challengeDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  pwdInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  pwdInputField: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },

  analysisCard: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  analyzedBox: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.yellow,
    marginBottom: Spacing.md,
  },
  analyzedLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  analyzedValue: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreVal: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  strengthLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  crackTime: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, marginTop: 2 },
  aiFeedback: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  opinionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.accent.cyan + '15',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.cyan,
    marginBottom: Spacing.sm,
  },
  opinionText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  bulletText: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, flex: 1 },

  emailCard: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.background.tertiary,
    marginBottom: Spacing.sm,
  },
  emailCardSelected: { borderColor: Colors.accent.cyan, backgroundColor: Colors.accent.cyan + '15' },
  emailHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  emailSender: { fontSize: Typography.sizes.xs, color: Colors.text.secondary },
  emailSubject: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  emailContent: { fontSize: Typography.sizes.xs, color: Colors.text.muted },
  redFlags: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.status.error + '15',
    borderRadius: BorderRadius.sm,
  },
  redFlagTitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.status.error,
    fontWeight: Typography.weights.bold,
    marginBottom: 4,
  },
  redFlag: { fontSize: Typography.sizes.xs, color: Colors.text.secondary },

  tabletStats: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.tertiary,
  },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statNum: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.accent.cyan,
  },
  statLbl: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, marginTop: 2 },

  findingCard: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    marginBottom: Spacing.sm,
  },
  findingHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  findingTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  severityText: { fontSize: 10, fontWeight: Typography.weights.bold },
  findingDesc: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, marginBottom: 8 },
  solutionBox: {
    padding: Spacing.sm,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
  },
  solutionLabel: {
    fontSize: 10,
    color: Colors.accent.cyan,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  solutionText: { fontSize: Typography.sizes.xs, color: Colors.text.primary, lineHeight: 16 },

  chapterCard: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
    marginBottom: Spacing.sm,
  },
  chapterHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  chapterNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  chapterTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    flex: 1,
  },
  chapterObj: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, lineHeight: 18 },
  chapterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.accent.yellow + '15',
    borderRadius: BorderRadius.sm,
  },
  chapterHintText: { flex: 1, fontSize: Typography.sizes.xs, color: Colors.accent.yellow, lineHeight: 16 },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent.cyan + '60',
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent.cyan,
  },
  emailIndex: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.accent.cyan,
    marginRight: 2,
  },
  verdictBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  verdictLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  detailVerdict: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  detailExplanation: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  analysisInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
    padding: Spacing.md,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    minHeight: 100,
  },
  evaluationBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
  },
  scoreHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  scoreBig: {
    fontSize: 42,
    fontWeight: Typography.weights.bold,
  },
  scoreLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.muted,
  },
  evalFeedback: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  evalOpinion: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent.cyan,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  evalRow: {
    marginBottom: Spacing.sm,
  },
  evalRowTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  evalRowItem: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
  },

  // World cards
  worldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
    marginBottom: Spacing.sm,
  },
  worldCardLocked: { opacity: 0.55 },
  worldIconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  worldInfo: { flex: 1 },
  worldRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  worldName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    flex: 1,
  },
  worldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  worldBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.accent.cyan,
  },
  worldSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  worldDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    lineHeight: 16,
    marginBottom: 6,
  },
  worldMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  worldMetaText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  worldLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  worldLockText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  },
});
