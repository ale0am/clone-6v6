// CyberGuard Academy - 2D Game World with Movable Character
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useGame } from '@/context/GameContext';
import { 
  ArrowLeft, 
  Terminal, 
  Mail, 
  Shield,
  Lock,
  Move,
  X,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Key,
  Fingerprint,
  Globe,
  Database,
  Search,
  Cloud,
  Cpu,
  FileSearch,
  Code2,
  Eye,
  Layers,
  HardDrive,
  EyeOff,
  type LucideIcon
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  analyzePasswordWithAI,
  evaluatePhishingResponse,
  generatePhishingEmails,
  generateCyberChallenge,
  evaluateCyberResponse,
  type PhishingEvaluation,
  type PhishingEmail as AIEmail,
  type CyberChallenge,
  type CyberEvaluation,
  type CyberCategory,
} from '@/services/aiService';
import { ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1250;
const GAME_VISIBLE_HEIGHT = Math.min(SCREEN_HEIGHT - 180, 600);
const PLAYER_SIZE = 40;
const OBJECT_SIZE = 50;

interface GameNode {
  x: number;
  y: number;
  type: string;
  icon: LucideIcon;
  color: string;
  name: string;
  category: string;
  description: string;
}

interface Edge {
  from: string;
  to: string;
}

// Graph edges — bidirectional connections forming a rich web of learning paths
const EDGES: Edge[] = [
  // Row 1 connections
  { from: 'passwordTerminal', to: 'encryptionVault' },
  { from: 'encryptionVault', to: 'twoFactorNode' },
  { from: 'twoFactorNode', to: 'devSecOpsNode' },
  // Row 1 → Row 2
  { from: 'passwordTerminal', to: 'phishingEmail' },
  { from: 'encryptionVault', to: 'deepFakesNode' },
  { from: 'twoFactorNode', to: 'osintTerminal' },
  { from: 'devSecOpsNode', to: 'cloudSecurity' },
  // Row 2 connections
  { from: 'phishingEmail', to: 'deepFakesNode' },
  { from: 'deepFakesNode', to: 'osintTerminal' },
  { from: 'osintTerminal', to: 'cloudSecurity' },
  // Row 2 → Row 3
  { from: 'phishingEmail', to: 'browserSecurity' },
  { from: 'deepFakesNode', to: 'socialEng' },
  { from: 'osintTerminal', to: 'iotTerminal' },
  { from: 'cloudSecurity', to: 'forensicsLab' },
  // Row 2 → Row 3 cross
  { from: 'phishingEmail', to: 'socialEng' },
  { from: 'deepFakesNode', to: 'iotTerminal' },
  { from: 'cloudSecurity', to: 'iotTerminal' },
  // Row 3 connections
  { from: 'browserSecurity', to: 'socialEng' },
  { from: 'socialEng', to: 'iotTerminal' },
  { from: 'iotTerminal', to: 'forensicsLab' },
  // Row 3 → Row 4
  { from: 'browserSecurity', to: 'malwareTerminal' },
  { from: 'socialEng', to: 'zeroTrustNode' },
  { from: 'iotTerminal', to: 'securityShield' },
  { from: 'forensicsLab', to: 'backupVault' },
  // Row 3 → Row 4 cross
  { from: 'browserSecurity', to: 'zeroTrustNode' },
  { from: 'socialEng', to: 'securityShield' },
  { from: 'forensicsLab', to: 'securityShield' },
  // Row 4 connections
  { from: 'malwareTerminal', to: 'zeroTrustNode' },
  { from: 'zeroTrustNode', to: 'securityShield' },
  { from: 'securityShield', to: 'backupVault' },
  // Row 4 → Row 5
  { from: 'malwareTerminal', to: 'privacyNode' },
  { from: 'zeroTrustNode', to: 'dataPrivacyNode' },
  { from: 'securityShield', to: 'incidentNode' },
  { from: 'backupVault', to: 'incidentNode' },
  // Row 5 connections
  { from: 'privacyNode', to: 'dataPrivacyNode' },
  { from: 'dataPrivacyNode', to: 'incidentNode' },
  // Extra cross-layer bridges
  { from: 'encryptionVault', to: 'privacyNode' },
  { from: 'malwareTerminal', to: 'forensicsLab' },
  { from: 'cloudSecurity', to: 'securityShield' },
  { from: 'twoFactorNode', to: 'zeroTrustNode' },
  { from: 'passwordTerminal', to: 'devSecOpsNode' },
  { from: 'backupVault', to: 'dataPrivacyNode' },
];

// Game objects — 19 nodes in a 4-column × 5-row learning graph with descriptions
const GAME_OBJECTS: Record<string, GameNode> = {
  // Row 1 — Autenticación & Desarrollo
  passwordTerminal: { x: 110, y: 90, type: 'password', icon: Lock, color: Colors.accent.yellow, name: 'Contraseñas', category: 'Autenticación', description: 'Analiza la fortaleza de contraseñas con IA y aprende a crear claves imposibles de descifrar.' },
  encryptionVault:   { x: 340, y: 90, type: 'encryption', icon: Key, color: Colors.accent.yellow, name: 'Criptografía', category: 'Autenticación', description: 'Descubre cómo funciona el cifrado, TLS, hashing y PKI para proteger datos en tránsito y reposo.' },
  twoFactorNode:     { x: 600, y: 90, type: '2fa', icon: Fingerprint, color: Colors.accent.yellow, name: '2FA / MFA', category: 'Autenticación', description: 'Aprende a implementar y evaluar autenticación multifactor contra ataques de suplantación.' },
  devSecOpsNode:     { x: 880, y: 90, type: 'devsecops', icon: Code2, color: Colors.accent.green, name: 'DevSecOps', category: 'Desarrollo', description: 'Integra seguridad en pipelines CI/CD, detecta secretos en repositorios y dependencias vulnerables.' },
  // Row 2 — Amenazas & IA
  phishingEmail:     { x: 110, y: 280, type: 'phishing', icon: Mail, color: Colors.accent.red, name: 'Phishing', category: 'Amenazas', description: 'Identifica correos fraudulentos con IA. La bandeja cambia cada vez que practicas.' },
  deepFakesNode:     { x: 340, y: 280, type: 'deepfakes', icon: Eye, color: Colors.accent.red, name: 'Deepfakes & IA', category: 'Amenazas', description: 'Detecta voces clonadas, videos manipulados y phishing generado por inteligencia artificial.' },
  osintTerminal:     { x: 600, y: 280, type: 'osint', icon: Search, color: Colors.accent.yellow, name: 'OSINT', category: 'Investigación', description: 'Técnicas de inteligencia de fuentes abiertas: Google dorking, Shodan, WHOIS y footprinting.' },
  cloudSecurity:     { x: 880, y: 280, type: 'cloud', icon: Cloud, color: Colors.accent.cyan, name: 'Cloud Security', category: 'Nube', description: 'Protege buckets S3, configura IAM correctamente y evita fugas en la nube.' },
  // Row 3 — Infraestructura & Dispositivos
  browserSecurity:   { x: 110, y: 470, type: 'browser', icon: Globe, color: Colors.accent.red, name: 'Navegación Segura', category: 'Amenazas', description: 'Reconoce sitios falsos, certificados inválidos y extensiones maliciosas antes de que te atrapen.' },
  socialEng:         { x: 340, y: 470, type: 'social', icon: AlertTriangle, color: Colors.accent.green, name: 'Ing. Social', category: 'Defensa', description: 'Enfréntate a vishing, CEO fraud, tailgating y manipulaciones psicológicas. La IA te pone a prueba.' },
  iotTerminal:       { x: 600, y: 470, type: 'iot', icon: Cpu, color: Colors.accent.purple, name: 'IoT Security', category: 'Dispositivos', description: 'Cámaras IP, impresoras, smart TVs: aprende a asegurar cada dispositivo conectado.' },
  forensicsLab:      { x: 880, y: 470, type: 'forensics', icon: FileSearch, color: Colors.accent.yellow, name: 'Forense Digital', category: 'Investigación', description: 'Analiza logs, memoria y discos para reconstruir la línea de tiempo de un ataque real.' },
  // Row 4 — Defensa & Arquitectura
  malwareTerminal:   { x: 110, y: 660, type: 'malware', icon: Terminal, color: Colors.accent.purple, name: 'Antimalware', category: 'Defensa', description: 'Responde a ransomware, troyanos y adjuntos sospechosos. Cada escenario es distinto.' },
  zeroTrustNode:     { x: 340, y: 660, type: 'zerotrust', icon: Layers, color: Colors.accent.cyan, name: 'Zero Trust', category: 'Arquitectura', description: 'Diseña arquitecturas de confianza cero: microsegmentación, acceso condicional y verificación continua.' },
  securityShield:    { x: 600, y: 660, type: 'network', icon: Shield, color: Colors.accent.cyan, name: 'Redes', category: 'Infraestructura', description: 'Configura firewalls, detecta ARP spoofing, asegura WiFi corporativa y evita ataques MITM.' },
  backupVault:       { x: 880, y: 660, type: 'backup', icon: HardDrive, color: Colors.accent.green, name: 'Backup & DR', category: 'Defensa', description: 'Diseña estrategias de respaldo 3-2-1, backups inmutables y planes de recuperación ante desastres.' },
  // Row 5 — Gobernanza & Respuesta
  privacyNode:       { x: 200, y: 860, type: 'privacy', icon: EyeOff, color: Colors.accent.cyan, name: 'Privacidad', category: 'Cumplimiento', description: 'Domina GDPR, anonimización de datos y gestión de consentimiento para proteger a tus usuarios.' },
  dataPrivacyNode:   { x: 500, y: 860, type: 'dataprivacy', icon: Database, color: Colors.accent.cyan, name: 'Datos Sensibles', category: 'Cumplimiento', description: 'Clasifica, encripta y protege datos personales. Evita filtraciones con controles de acceso.' },
  incidentNode:      { x: 800, y: 860, type: 'incident', icon: Shield, color: Colors.accent.purple, name: 'Resp. Incidentes', category: 'Defensa', description: 'Coordina la respuesta ante una brecha: contención, erradicación, recuperación y lecciones aprendidas.' },
};

interface PasswordAnalysis {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string;
  suggestions: string[];
  opinion?: string;
  timeToCrack?: string;
  analyzed?: string;
  issues?: string[];
}

export default function GameWorldScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { player } = useGame();
  
  // Player starts at passwordTerminal — graph-based navigation
  const startNode = GAME_OBJECTS.passwordTerminal;
  const [currentNode, setCurrentNode] = useState<string | null>('passwordTerminal');
  const [playerPos, setPlayerPos] = useState({ x: startNode.x - PLAYER_SIZE / 2, y: startNode.y - PLAYER_SIZE / 2 });
  const [isMoving, setIsMoving] = useState(false);
  const playerX = useRef(new Animated.Value(startNode.x - PLAYER_SIZE / 2)).current;
  const playerY = useRef(new Animated.Value(startNode.y - PLAYER_SIZE / 2)).current;
  const scrollHRef = useRef<ScrollView>(null);
  const scrollVRef = useRef<ScrollView>(null);
  
  // Active challenge modal
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  
  // Floating tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateY = useRef(new Animated.Value(10)).current;
  
  // Password challenge state
  const [passwordInput, setPasswordInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [passwordAnalysis, setPasswordAnalysis] = useState<PasswordAnalysis | null>(null);
  
  // Phishing challenge state (IA)
  const INITIAL_PHISHING_EMAILS: AIEmail[] = [
    {
      id: 'e1',
      sender: 'banco@seguridad-banca.com',
      subject: 'Verificación urgente de cuenta',
      content: 'Detectamos actividad sospechosa. Verifica tus datos en las próximas 2 horas o tu cuenta será bloqueada.',
      isPhishing: true,
      redFlags: ['Dominio sospechoso', 'Urgencia artificial', 'Pide verificar datos por enlace'],
    },
    {
      id: 'e2',
      sender: 'no-reply@amazon.com',
      subject: 'Tu pedido ha sido enviado',
      content: 'Tu pedido está en camino. Fecha estimada: mañana.',
      isPhishing: false,
      redFlags: [],
    },
    {
      id: 'e3',
      sender: 'premio@loteria-ganaste.net',
      subject: '¡Has ganado $1,000,000!',
      content: 'Felicidades, ganaste. Envíanos tus datos bancarios para reclamar el premio.',
      isPhishing: true,
      redFlags: ['Promesa de dinero fácil', 'Pide datos bancarios', 'Dominio .net sospechoso'],
    },
  ];
  const [phishingEmails, setPhishingEmails] = useState<AIEmail[]>(INITIAL_PHISHING_EMAILS);
  const [phishingUserAnalysis, setPhishingUserAnalysis] = useState<string>('');
  const [phishingEvaluation, setPhishingEvaluation] = useState<PhishingEvaluation | null>(null);
  const [isEvaluatingPhishing, setIsEvaluatingPhishing] = useState<boolean>(false);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState<boolean>(false);

  // Generic AI cyber challenges (malware / network / social)
  const [cyberChallenge, setCyberChallenge] = useState<CyberChallenge | null>(null);
  const [cyberUserAnswer, setCyberUserAnswer] = useState<string>('');
  const [cyberEvaluation, setCyberEvaluation] = useState<CyberEvaluation | null>(null);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState<boolean>(false);
  const [isEvaluatingCyber, setIsEvaluatingCyber] = useState<boolean>(false);

  const challengeCategoryFor = (key: string): CyberCategory | null => {
    if (key === 'malwareTerminal' || key === 'incidentNode') return 'malware';
    if (key === 'socialEng') return 'social';
    if (key === 'securityShield' || key === 'browserSecurity') return 'network';
    if (key === 'osintTerminal') return 'osint';
    if (key === 'cloudSecurity') return 'cloud';
    if (key === 'iotTerminal') return 'iot';
    if (key === 'forensicsLab') return 'forensics';
    if (key === 'devSecOpsNode') return 'devsecops';
    if (key === 'deepFakesNode') return 'deepfakes';
    if (key === 'zeroTrustNode') return 'zerotrust';
    if (key === 'backupVault') return 'backup';
    if (key === 'privacyNode' || key === 'dataPrivacyNode') return 'privacy';
    if (key === 'encryptionVault' || key === 'twoFactorNode') return 'encryption';
    return null;
  };

  const loadCyberChallenge = async (category: CyberCategory) => {
    setIsGeneratingChallenge(true);
    setCyberChallenge(null);
    setCyberEvaluation(null);
    setCyberUserAnswer('');
    try {
      const c = await generateCyberChallenge(category);
      setCyberChallenge(c);
    } catch (err) {
      console.error('loadCyberChallenge:', err);
    } finally {
      setIsGeneratingChallenge(false);
    }
  };

  const submitCyberAnswer = async () => {
    if (!cyberChallenge || !cyberUserAnswer.trim()) return;
    setIsEvaluatingCyber(true);
    try {
      const result = await evaluateCyberResponse(cyberChallenge, cyberUserAnswer);
      setCyberEvaluation(result);
    } catch (err) {
      console.error('submitCyberAnswer:', err);
    } finally {
      setIsEvaluatingCyber(false);
    }
  };

  const resetCyberChallenge = () => {
    setCyberChallenge(null);
    setCyberUserAnswer('');
    setCyberEvaluation(null);
  };

  // Auto-load challenge when opening malware/network/social
  useEffect(() => {
    const cat = activeChallenge ? challengeCategoryFor(activeChallenge) : null;
    if (cat && !cyberChallenge && !isGeneratingChallenge) {
      loadCyberChallenge(cat);
    }
    if (!activeChallenge) {
      resetCyberChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChallenge]);

  // Nearby node = current node (player is always at a node after movement completes)
  const nearbyObject = !isMoving ? currentNode : null;

  // Get nodes connected to the current node
  const connectedNodes = useMemo(() => {
    if (!currentNode) return [];
    return EDGES
      .filter(e => e.from === currentNode || e.to === currentNode)
      .map(e => (e.from === currentNode ? e.to : e.from));
  }, [currentNode]);

  // Scroll to center a node in the visible area
  const scrollToNode = useCallback((node: GameNode) => {
    const visibleW = SCREEN_WIDTH - 16;
    scrollHRef.current?.scrollTo({ x: Math.max(0, node.x - visibleW / 2), animated: true });
    scrollVRef.current?.scrollTo({ y: Math.max(0, node.y - GAME_VISIBLE_HEIGHT / 2), animated: true });
  }, []);

  // Show floating tooltip with animation then auto-dismiss
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTooltip = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltipVisible(true);
    tooltipOpacity.setValue(0);
    tooltipTranslateY.setValue(10);
    Animated.parallel([
      Animated.timing(tooltipOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(tooltipTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    tooltipTimer.current = setTimeout(() => {
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setTooltipVisible(false);
      });
    }, 5000);
  }, [tooltipOpacity, tooltipTranslateY]);

  // Cleanup tooltip timer
  useEffect(() => {
    return () => { if (tooltipTimer.current) clearTimeout(tooltipTimer.current); };
  }, []);

  // Animated movement between connected nodes
  const moveToNode = useCallback((targetKey: string) => {
    if (isMoving || !connectedNodes.includes(targetKey)) return;
    const target = GAME_OBJECTS[targetKey];
    const targetX = target.x - PLAYER_SIZE / 2;
    const targetY = target.y - PLAYER_SIZE / 2;
    setIsMoving(true);
    Animated.parallel([
      Animated.timing(playerX, { toValue: targetX, duration: 350, useNativeDriver: true }),
      Animated.timing(playerY, { toValue: targetY, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      setPlayerPos({ x: targetX, y: targetY });
      setCurrentNode(targetKey);
      setIsMoving(false);
      scrollToNode(target);
      // Show floating tooltip on arrival
      showTooltip();
    });
  }, [isMoving, connectedNodes, playerX, playerY, scrollToNode, showTooltip]);

  // Initial scroll to starting node
  useEffect(() => {
    const timer = setTimeout(() => scrollToNode(startNode), 300);
    return () => clearTimeout(timer);
  }, []);

  // Animate player breathing effect
  const breatheAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Analyze password with AI
  const analyzePassword = async () => {
    if (!passwordInput.trim()) return;

    setIsAnalyzing(true);
    try {
      const ai = await analyzePasswordWithAI(passwordInput);
      const score = ai.score;
      let strength: PasswordAnalysis['strength'] = 'weak';
      if (score >= 85) strength = 'strong';
      else if (score >= 65) strength = 'good';
      else if (score >= 40) strength = 'fair';

      setPasswordAnalysis({
        score,
        strength,
        feedback: ai.aiFeedback,
        suggestions: ai.suggestions.length > 0 ? ai.suggestions : ['Usa al menos 12 caracteres', 'Incluye números y símbolos', 'Evita palabras comunes'],
        opinion: ai.opinion,
        timeToCrack: ai.timeToCrack,
        analyzed: passwordInput,
        issues: ai.issues,
      });
    } catch (error) {
      console.error('Error analyzing password:', error);
      setPasswordAnalysis({
        score: 50,
        strength: 'fair',
        feedback: 'No se pudo analizar completamente. Intenta con una contraseña más larga.',
        suggestions: ['Usa más de 12 caracteres', 'Incluye símbolos', 'Mezcla mayúsculas y minúsculas'],
        analyzed: passwordInput,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const evaluatePhishing = async () => {
    const text = phishingUserAnalysis.trim();
    if (!text) return;
    setIsEvaluatingPhishing(true);
    try {
      const result = await evaluatePhishingResponse(phishingEmails, text);
      setPhishingEvaluation(result);
    } catch (err) {
      console.error('evaluatePhishing error:', err);
    } finally {
      setIsEvaluatingPhishing(false);
    }
  };

  const regeneratePhishingEmails = async () => {
    setIsGeneratingEmails(true);
    setPhishingEvaluation(null);
    setPhishingUserAnalysis('');
    try {
      const fresh = await generatePhishingEmails(4);
      setPhishingEmails(fresh);
    } catch (err) {
      console.error('regeneratePhishingEmails:', err);
      setPhishingEmails(INITIAL_PHISHING_EMAILS);
    } finally {
      setIsGeneratingEmails(false);
    }
  };

  const resetPhishingChallenge = () => {
    setPhishingEmails(INITIAL_PHISHING_EMAILS);
    setPhishingUserAnalysis('');
    setPhishingEvaluation(null);
  };

  const getScoreColor = (s: number): string => {
    if (s >= 80) return Colors.status.success;
    if (s >= 60) return Colors.accent.yellow;
    if (s >= 40) return Colors.accent.red;
    return Colors.status.error;
  };

  const renderChallengeModal = () => {
    if (!activeChallenge) return null;

    const challenge = GAME_OBJECTS[activeChallenge as keyof typeof GAME_OBJECTS];

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!activeChallenge}
        onRequestClose={() => setActiveChallenge(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: challenge.color + '20' }]}>
                <challenge.icon size={32} color={challenge.color} />
              </View>
              <Pressable 
                style={styles.closeButton}
                onPress={() => {
                  setActiveChallenge(null);
                  setPasswordInput('');
                  setPasswordAnalysis(null);
                  resetPhishingChallenge();
                  resetCyberChallenge();
                }}
              >
                <X size={24} color={Colors.text.secondary} />
              </Pressable>
            </View>

            {activeChallenge === 'passwordTerminal' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Laboratorio de Contraseñas</Text>
                <View style={styles.subCategoryChip}>
                  <Text style={styles.subCategoryChipText}>Autenticación</Text>
                </View>
                <Text style={styles.modalDescription}>
                  Ingresa una contraseña y la IA analizará su seguridad, te dará una puntuación y sugerencias para mejorarla.
                </Text>
                
                <View style={styles.passwordInputContainer}>
                  <Lock size={20} color={Colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Escribe una contraseña..."
                    placeholderTextColor={Colors.text.muted}
                    secureTextEntry
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    onSubmitEditing={analyzePassword}
                  />
                </View>
                
                <Pressable 
                  style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
                  onPress={analyzePassword}
                  disabled={isAnalyzing || !passwordInput.trim()}
                >
                  {isAnalyzing ? (
                    <Text style={styles.analyzeButtonText}>Analizando...</Text>
                  ) : (
                    <>
                      <Sparkles size={20} color={Colors.background.primary} />
                      <Text style={styles.analyzeButtonText}>Analizar con IA</Text>
                    </>
                  )}
                </Pressable>

                {passwordAnalysis && (
                  <View style={styles.analysisResult}>
                    {!!passwordAnalysis.analyzed && (
                      <View style={styles.analyzedBox}>
                        <Text style={styles.analyzedLabel}>Contraseña analizada</Text>
                        <Text style={styles.analyzedValue} selectable>{passwordAnalysis.analyzed}</Text>
                      </View>
                    )}
                    <View style={styles.scoreContainer}>
                      <View style={[styles.scoreCircle, { 
                        borderColor: passwordAnalysis.strength === 'strong' ? Colors.status.success : 
                                    passwordAnalysis.strength === 'good' ? Colors.accent.cyan :
                                    passwordAnalysis.strength === 'fair' ? Colors.accent.yellow : Colors.status.error
                      }]}>
                        <Text style={styles.scoreText}>{passwordAnalysis.score}</Text>
                      </View>
                      <View style={styles.strengthBadge}>
                        <Text style={[styles.strengthText, {
                          color: passwordAnalysis.strength === 'strong' ? Colors.status.success : 
                                 passwordAnalysis.strength === 'good' ? Colors.accent.cyan :
                                 passwordAnalysis.strength === 'fair' ? Colors.accent.yellow : Colors.status.error
                        }]}>
                          {passwordAnalysis.strength.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.feedbackText}>{passwordAnalysis.feedback}</Text>

                    {!!passwordAnalysis.timeToCrack && (
                      <Text style={styles.crackTimeText}>Tiempo estimado para descifrar: {passwordAnalysis.timeToCrack}</Text>
                    )}

                    {!!passwordAnalysis.opinion && (
                      <View style={styles.opinionBox}>
                        <Sparkles size={14} color={Colors.accent.cyan} />
                        <Text style={styles.opinionText}>{passwordAnalysis.opinion}</Text>
                      </View>
                    )}
                    
                    <View style={styles.suggestionsContainer}>
                      <Text style={styles.suggestionsTitle}>Sugerencias:</Text>
                      {passwordAnalysis.suggestions.map((suggestion, index) => (
                        <View key={index} style={styles.suggestionItem}>
                          <CheckCircle2 size={16} color={Colors.accent.cyan} />
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            {activeChallenge === 'phishingEmail' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Detector de Phishing con IA</Text>
                <View style={styles.subCategoryChip}>
                  <Text style={styles.subCategoryChipText}>Amenazas</Text>
                </View>
                <Text style={styles.modalDescription}>
                  Lee la bandeja y escribe tu análisis: ¿qué correos son fraude y por qué? La IA evaluará tu razonamiento.
                </Text>

                <Pressable
                  style={[styles.aiSecondaryButton, isGeneratingEmails && { opacity: 0.6 }]}
                  onPress={regeneratePhishingEmails}
                  disabled={isGeneratingEmails || isEvaluatingPhishing}
                >
                  {isGeneratingEmails ? (
                    <ActivityIndicator size="small" color={Colors.accent.cyan} />
                  ) : (
                    <Sparkles size={14} color={Colors.accent.cyan} />
                  )}
                  <Text style={styles.aiSecondaryButtonText}>
                    {isGeneratingEmails ? 'Generando correos...' : 'Generar nuevos correos con IA'}
                  </Text>
                </Pressable>

                <View style={styles.emailList}>
                  {phishingEmails.map((email, idx) => {
                    const detail = phishingEvaluation?.detailedAnalysis.find(
                      (d) => d.emailId === email.id
                    );
                    const isRevealed = !!phishingEvaluation;
                    const borderColor = isRevealed
                      ? email.isPhishing
                        ? Colors.status.error
                        : Colors.status.success
                      : Colors.background.tertiary;
                    return (
                      <View
                        key={email.id}
                        style={[styles.phishingEmailCard, { borderColor }]}
                      >
                        <View style={styles.phishingEmailHead}>
                          <Text style={styles.phishingEmailIndex}>#{idx + 1}</Text>
                          <Mail size={14} color={Colors.text.muted} />
                          <Text style={styles.phishingEmailSender} numberOfLines={1}>
                            {email.sender}
                          </Text>
                        </View>
                        <Text style={styles.phishingEmailSubject}>{email.subject}</Text>
                        <Text style={styles.phishingEmailBody}>{email.content}</Text>

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
                              <View style={{ marginTop: 4 }}>
                                {email.redFlags.map((flag, i) => (
                                  <Text key={i} style={styles.redFlagText}>
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
                                <Text style={styles.detailExplanation}>{detail.explanation}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Tu análisis</Text>
                <TextInput
                  style={styles.analysisInput}
                  placeholder={'Ej: El correo #1 es phishing porque el dominio es sospechoso. El #3 promete dinero fácil...'}
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
                      styles.checkButton,
                      (isEvaluatingPhishing || !phishingUserAnalysis.trim()) && { opacity: 0.6 },
                    ]}
                    onPress={evaluatePhishing}
                    disabled={isEvaluatingPhishing || !phishingUserAnalysis.trim()}
                  >
                    {isEvaluatingPhishing ? (
                      <ActivityIndicator size="small" color={Colors.background.primary} />
                    ) : (
                      <Sparkles size={20} color={Colors.background.primary} />
                    )}
                    <Text style={styles.checkButtonText}>
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
                          const i = phishingEmails.findIndex((e) => e.id === id);
                          return (
                            <Text key={id} style={styles.evalRowItem}>
                              • Correo #{i + 1}
                            </Text>
                          );
                        })}
                      </View>
                    )}

                    {phishingEvaluation.falsePositives.length > 0 && (
                      <View style={styles.evalRow}>
                        <Text style={styles.evalRowTitle}>Falsos positivos:</Text>
                        {phishingEvaluation.falsePositives.map((id) => {
                          const i = phishingEmails.findIndex((e) => e.id === id);
                          return (
                            <Text key={id} style={styles.evalRowItem}>
                              • Correo #{i + 1}
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

                    <Pressable
                      style={[styles.aiSecondaryButton, { marginTop: Spacing.md }]}
                      onPress={resetPhishingChallenge}
                    >
                      <Text style={styles.aiSecondaryButtonText}>Reintentar</Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            )}

            {(activeChallenge !== 'passwordTerminal' && activeChallenge !== 'phishingEmail') && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>
                  {GAME_OBJECTS[activeChallenge]?.name || 'Desafío'}
                </Text>
                {GAME_OBJECTS[activeChallenge]?.category && (
                  <View style={styles.subCategoryChip}>
                    <Text style={styles.subCategoryChipText}>{GAME_OBJECTS[activeChallenge].category}</Text>
                  </View>
                )}
                <Text style={styles.modalDescription}>
                  La IA te plantea una situación real. Escribe qué harías y por qué; te evaluará y te dará su opinión.
                </Text>

                {isGeneratingChallenge && (
                  <View style={styles.loaderBox}>
                    <ActivityIndicator size="small" color={Colors.accent.cyan} />
                    <Text style={styles.loaderText}>Generando situación con IA...</Text>
                  </View>
                )}

                {cyberChallenge && (
                  <>
                    <View style={styles.challengeCard}>
                      <Text style={styles.challengeTitle}>{cyberChallenge.title}</Text>
                      {!!cyberChallenge.context && (
                        <Text style={styles.challengeContext}>{cyberChallenge.context}</Text>
                      )}
                      <View style={styles.challengeDivider} />
                      <Text style={styles.challengeScenario}>{cyberChallenge.scenario}</Text>
                      <View style={styles.questionBox}>
                        <Sparkles size={14} color={Colors.accent.yellow} />
                        <Text style={styles.questionText}>{cyberChallenge.question}</Text>
                      </View>
                    </View>

                    <Pressable
                      style={[styles.aiSecondaryButton, isGeneratingChallenge && { opacity: 0.6 }]}
                      onPress={() => {
                        const cat = challengeCategoryFor(activeChallenge);
                        if (cat) loadCyberChallenge(cat);
                      }}
                      disabled={isGeneratingChallenge || isEvaluatingCyber}
                    >
                      <Sparkles size={14} color={Colors.accent.cyan} />
                      <Text style={styles.aiSecondaryButtonText}>Generar otra situación</Text>
                    </Pressable>

                    <Text style={styles.inputLabel}>Tu respuesta</Text>
                    <TextInput
                      style={styles.analysisInput}
                      placeholder="Explica qué harías paso a paso, qué banderas rojas identificas y por qué..."
                      placeholderTextColor={Colors.text.muted}
                      value={cyberUserAnswer}
                      onChangeText={setCyberUserAnswer}
                      multiline
                      numberOfLines={5}
                      editable={!cyberEvaluation && !isEvaluatingCyber}
                      textAlignVertical="top"
                    />

                    {!cyberEvaluation ? (
                      <Pressable
                        style={[
                          styles.checkButton,
                          (isEvaluatingCyber || !cyberUserAnswer.trim()) && { opacity: 0.6 },
                        ]}
                        onPress={submitCyberAnswer}
                        disabled={isEvaluatingCyber || !cyberUserAnswer.trim()}
                      >
                        {isEvaluatingCyber ? (
                          <ActivityIndicator size="small" color={Colors.background.primary} />
                        ) : (
                          <Sparkles size={20} color={Colors.background.primary} />
                        )}
                        <Text style={styles.checkButtonText}>
                          {isEvaluatingCyber ? 'Evaluando con IA...' : 'Evaluar mi respuesta'}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={styles.evaluationBox}>
                        <View style={styles.scoreHead}>
                          <Text style={[styles.scoreBig, { color: getScoreColor(cyberEvaluation.score) }]}>
                            {cyberEvaluation.score}
                          </Text>
                          <Text style={styles.scoreLabel}>/100</Text>
                          <View style={[styles.verdictPill, { backgroundColor: getScoreColor(cyberEvaluation.score) + '20', marginLeft: Spacing.sm }]}>
                            <Text style={[styles.verdictPillText, { color: getScoreColor(cyberEvaluation.score) }]}>
                              {cyberEvaluation.verdict.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.evalFeedback}>{cyberEvaluation.feedback}</Text>
                        <Text style={styles.evalOpinion}>{cyberEvaluation.opinion}</Text>

                        {cyberEvaluation.strengths.length > 0 && (
                          <View style={styles.evalRow}>
                            <Text style={[styles.evalRowTitle, { color: Colors.status.success }]}>Lo que hiciste bien:</Text>
                            {cyberEvaluation.strengths.map((s, i) => (
                              <Text key={i} style={styles.evalRowItem}>✓ {s}</Text>
                            ))}
                          </View>
                        )}

                        {cyberEvaluation.weaknesses.length > 0 && (
                          <View style={styles.evalRow}>
                            <Text style={[styles.evalRowTitle, { color: Colors.status.error }]}>Lo que te faltó:</Text>
                            {cyberEvaluation.weaknesses.map((s, i) => (
                              <Text key={i} style={styles.evalRowItem}>✕ {s}</Text>
                            ))}
                          </View>
                        )}

                        {cyberEvaluation.suggestions.length > 0 && (
                          <View style={styles.evalRow}>
                            <Text style={styles.evalRowTitle}>Sugerencias:</Text>
                            {cyberEvaluation.suggestions.map((s, i) => (
                              <Text key={i} style={styles.evalRowItem}>• {s}</Text>
                            ))}
                          </View>
                        )}

                        {!!cyberEvaluation.correctApproach && (
                          <View style={styles.correctApproachBox}>
                            <Text style={styles.correctApproachLabel}>Enfoque correcto según la IA</Text>
                            <Text style={styles.correctApproachText}>{cyberEvaluation.correctApproach}</Text>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                          <Pressable
                            style={[styles.aiSecondaryButton, { flex: 1, marginBottom: 0 }]}
                            onPress={() => {
                              setCyberEvaluation(null);
                              setCyberUserAnswer('');
                            }}
                          >
                            <Text style={styles.aiSecondaryButtonText}>Reintentar</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.aiSecondaryButton, { flex: 1, marginBottom: 0 }]}
                            onPress={() => {
                              const cat = challengeCategoryFor(activeChallenge);
                              if (cat) loadCyberChallenge(cat);
                            }}
                          >
                            <Sparkles size={14} color={Colors.accent.cyan} />
                            <Text style={styles.aiSecondaryButtonText}>Nuevo desafío</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </>
                )}

                {!cyberChallenge && !isGeneratingChallenge && (
                  <View style={styles.comingSoonContainer}>
                    <Info size={48} color={Colors.text.muted} />
                    <Text style={styles.comingSoonText}>No se pudo cargar el desafío. Toca para reintentar.</Text>
                    <Pressable
                      style={styles.aiSecondaryButton}
                      onPress={() => {
                        const cat = challengeCategoryFor(activeChallenge);
                        if (cat) loadCyberChallenge(cat);
                      }}
                    >
                      <Sparkles size={14} color={Colors.accent.cyan} />
                      <Text style={styles.aiSecondaryButtonText}>Reintentar</Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Modo Práctica</Text>
          <Text style={styles.headerSubtitle}>Práctica IA · Nivel {player.level}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Sparkles size={16} color={Colors.accent.yellow} />
          <Text style={styles.xpText}>{player.totalXP.toLocaleString()} XP</Text>
        </View>
      </View>

      {/* Game World — ScrollView with graph-based navigation */}
      <View style={styles.gameContainer}>
        <ScrollView
          ref={scrollHRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentH}
        >
          <ScrollView
            ref={scrollVRef}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.scrollContentV}
          >
            <View style={[styles.gameWorld, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
              {/* Grid background */}
              <View style={styles.gridBackground}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <View key={`h-${i}`} style={[styles.gridLine, { 
                    top: (GAME_HEIGHT / 12) * i, 
                    width: GAME_WIDTH,
                    height: 1
                  }]} />
                ))}
                {Array.from({ length: 12 }).map((_, i) => (
                  <View key={`v-${i}`} style={[styles.gridLine, { 
                    left: (GAME_WIDTH / 8) * i, 
                    height: GAME_HEIGHT,
                    width: 1
                  }]} />
                ))}
              </View>

              {/* Edge lines between all connected nodes */}
              <Svg
                style={StyleSheet.absoluteFill}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
              >
                {EDGES.map((edge, idx) => {
                  const from = GAME_OBJECTS[edge.from];
                  const to = GAME_OBJECTS[edge.to];
                  const isActiveEdge = currentNode && (edge.from === currentNode || edge.to === currentNode);
                  return (
                    <Line
                      key={`edge-${idx}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={isActiveEdge ? 'rgba(0,245,212,0.35)' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isActiveEdge ? 2.5 : 1.5}
                      strokeDasharray={isActiveEdge ? undefined : '6,4'}
                    />
                  );
                })}
              </Svg>

              {/* Game objects as tappable nodes */}
              {Object.entries(GAME_OBJECTS).map(([key, obj]) => {
                const isConnected = connectedNodes.includes(key);
                const isCurrent = currentNode === key;
                const isReachable = isConnected && !isMoving;
                return (
                  <Pressable
                    key={key}
                    onPress={() => moveToNode(key)}
                    disabled={!isReachable}
                    style={[
                      styles.gameObject,
                      { 
                        left: obj.x - OBJECT_SIZE / 2, 
                        top: obj.y - OBJECT_SIZE / 2,
                        backgroundColor: isCurrent ? obj.color + '35' : obj.color + '20',
                        borderColor: isCurrent ? obj.color : isConnected ? obj.color + '99' : obj.color + '40',
                        shadowColor: obj.color,
                        shadowOpacity: isCurrent ? 0.8 : isConnected ? 0.5 : 0.2,
                        opacity: isConnected || isCurrent ? 1 : 0.45,
                      },
                      isCurrent && styles.gameObjectCurrent,
                    ]}
                  >
                    <obj.icon size={24} color={isConnected || isCurrent ? obj.color : Colors.text.muted} />
                  </Pressable>
                );
              })}

              {/* Player character */}
              <Animated.View
                style={[
                  styles.player,
                  {
                    left: playerX,
                    top: playerY,
                    transform: [{ scale: breatheAnim }],
                  }
                ]}
              >
                <View style={styles.playerInner}>
                  <Shield size={20} color={Colors.accent.cyan} />
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </ScrollView>

        {/* Floating tooltip — explains the module when player arrives */}
        {nearbyObject && !isMoving && tooltipVisible && (
          <Animated.View 
            style={[
              styles.tooltipCard,
              { 
                opacity: tooltipOpacity,
                transform: [{ translateY: tooltipTranslateY }],
              },
            ]}
          >
            <View style={styles.tooltipHeader}>
              <View style={[styles.tooltipDot, { backgroundColor: GAME_OBJECTS[nearbyObject].color }]} />
              <Text style={styles.tooltipTitle}>{GAME_OBJECTS[nearbyObject].name}</Text>
              <Pressable 
                onPress={() => {
                  Animated.timing(tooltipOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setTooltipVisible(false));
                }}
                hitSlop={12}
              >
                <X size={14} color={Colors.text.muted} />
              </Pressable>
            </View>
            <Text style={styles.tooltipDesc}>{GAME_OBJECTS[nearbyObject].description}</Text>
            <View style={styles.tooltipFooter}>
              <Sparkles size={12} color={Colors.accent.cyan} />
              <Text style={styles.tooltipFooterText}>Toca para comenzar el desafío</Text>
            </View>
          </Animated.View>
        )}

        {/* Interaction prompt — shown when player is at a node */}
        {nearbyObject && !isMoving && (
          <View style={styles.interactionPrompt}>
            <Pressable 
              style={styles.interactionButton}
              onPress={() => setActiveChallenge(nearbyObject)}
            >
              {(() => {
                const obj = GAME_OBJECTS[nearbyObject];
                return <>
                  <obj.icon size={22} color={Colors.text.primary} />
                  <Text style={styles.interactionText}>{obj.name}</Text>
                </>;
              })()}
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom indicator bar */}
      <View style={styles.bottomBar}>
        {nearbyObject ? (
          (() => {
            const obj = GAME_OBJECTS[nearbyObject];
            return (
              <>
                <obj.icon size={18} color={obj.color} />
                <Text style={[styles.bottomBarNodeName, { color: obj.color }]} numberOfLines={1}>{obj.name}</Text>
                <View style={[styles.bottomBarCategory, { backgroundColor: obj.color + '20' }]}>
                  <Text style={[styles.bottomBarCategoryText, { color: obj.color }]}>{obj.category}</Text>
                </View>
              </>
            );
          })()
        ) : (
          <>
            <Move size={18} color={Colors.text.muted} />
            <Text style={styles.bottomBarHint} numberOfLines={1}>Toca un nodo conectado para moverte</Text>
          </>
        )}
      </View>

      {renderChallengeModal()}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  xpText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent.yellow,
  },
  gameContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentH: {
    minWidth: '100%',
  },
  scrollContentV: {
    minHeight: '100%',
  },
  gameWorld: {
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  gridBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: Colors.accent.cyan,
    opacity: 0.2,
  },
  gameObject: {
    position: 'absolute',
    width: OBJECT_SIZE,
    height: OBJECT_SIZE,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  gameObjectCurrent: {
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 3,
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
    zIndex: 100,
  },
  playerInner: {
    width: PLAYER_SIZE - 8,
    height: PLAYER_SIZE - 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interactionPrompt: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.cyan,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.accent.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  interactionText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.card,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  bottomBarNodeName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    maxWidth: 160,
  },
  bottomBarCategory: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  bottomBarCategoryText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  bottomBarHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    flexShrink: 1,
  },
  // Floating tooltip
  tooltipCard: {
    position: 'absolute',
    bottom: 170,
    alignSelf: 'center',
    width: SCREEN_WIDTH - 48,
    maxWidth: 380,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 200,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tooltipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tooltipTitle: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  tooltipDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  tooltipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  tooltipFooterText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.cyan,
    fontWeight: Typography.weights.semibold,
  },
  subCategoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent.cyan + '15',
    marginBottom: Spacing.lg,
  },
  subCategoryChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent.cyan,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.lg,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.cyan,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  analyzeButtonDisabled: {
    backgroundColor: Colors.background.tertiary,
  },
  analyzeButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background.primary,
  },
  analysisResult: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  analyzedBox: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.yellow,
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  strengthBadge: {
    backgroundColor: Colors.background.tertiary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  strengthText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  feedbackText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  crackTimeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent.yellow,
    marginTop: Spacing.xs,
    fontWeight: Typography.weights.semibold,
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
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  opinionText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  suggestionsContainer: {
    gap: Spacing.sm,
  },
  suggestionsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  suggestionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  emailList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.background.tertiary,
  },
  emailItemSelected: {
    borderColor: Colors.accent.cyan,
    backgroundColor: Colors.accent.cyanGlow,
  },
  emailCheckbox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailContent: {
    flex: 1,
  },
  emailSender: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  emailSubject: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.cyan,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  checkButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.background.primary,
  },
  resultContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  resultText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  comingSoonTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  comingSoonText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  aiSecondaryButton: {
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
  aiSecondaryButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent.cyan,
  },
  phishingEmailCard: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.sm,
  },
  phishingEmailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  phishingEmailIndex: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.accent.cyan,
  },
  phishingEmailSender: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    flex: 1,
  },
  phishingEmailSubject: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  phishingEmailBody: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    lineHeight: 16,
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
    marginBottom: 2,
  },
  redFlagText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
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
    marginBottom: Spacing.md,
  },
  evaluationBox: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
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
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  loaderText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  challengeCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent.cyan + '40',
  },
  challengeTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  challengeContext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  challengeDivider: {
    height: 1,
    backgroundColor: Colors.background.tertiary,
    marginVertical: Spacing.sm,
  },
  challengeScenario: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  questionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: Spacing.sm,
    backgroundColor: Colors.accent.yellow + '15',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.yellow,
    marginTop: Spacing.xs,
  },
  questionText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold,
    lineHeight: 18,
  },
  verdictPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  verdictPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  correctApproachBox: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.cyan,
  },
  correctApproachLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.cyan,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  correctApproachText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    lineHeight: 20,
  },
});
// UNIQUE_ID_1776613937
