// CyberGuard Academy - Knowledge / Skill Analysis
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Lock,
  Eye,
  Network,
  Bug,
  UserCog,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Target,
  RefreshCw,
} from 'lucide-react-native';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import type { PlayerProfile } from '@/types/game';

type SkillKey = keyof PlayerProfile['skills'];

interface SkillMeta {
  key: SkillKey;
  label: string;
  short: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  unlockLevel: number;
  topic: string;
}

const SKILLS: SkillMeta[] = [
  {
    key: 'password',
    label: 'Contraseñas Seguras',
    short: 'Crear y proteger credenciales',
    icon: Lock,
    color: Colors.accent.yellow,
    unlockLevel: 1,
    topic: 'creación, gestión y protección de contraseñas seguras',
  },
  {
    key: 'phishing',
    label: 'Detección de Phishing',
    short: 'Identificar correos fraudulentos',
    icon: Eye,
    color: Colors.accent.red,
    unlockLevel: 1,
    topic: 'identificación de correos, mensajes y sitios fraudulentos',
  },
  {
    key: 'network',
    label: 'Seguridad de Red',
    short: 'Configurar routers y proteger Wi-Fi',
    icon: Network,
    color: Colors.accent.cyan,
    unlockLevel: 3,
    topic: 'configuración segura de redes, routers, Wi-Fi y firewalls',
  },
  {
    key: 'malware',
    label: 'Defensa Antimalware',
    short: 'Reconocer software malicioso',
    icon: Bug,
    color: Colors.accent.purple,
    unlockLevel: 5,
    topic: 'identificación de virus, ransomware y otros tipos de malware',
  },
  {
    key: 'social',
    label: 'Ingeniería Social',
    short: 'Resistir manipulación humana',
    icon: UserCog,
    color: Colors.accent.green,
    unlockLevel: 7,
    topic: 'ingeniería social, manipulación psicológica y pretexting',
  },
];

const analysisSchema = z.object({
  level: z.string(),
  summary: z.string(),
  importance: z.string(),
  helps: z.array(z.string()),
  nextSteps: z.array(z.string()),
  funFact: z.string(),
});

type Analysis = z.infer<typeof analysisSchema>;

export default function KnowledgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ skill?: string }>();
  const { player } = useGame();

  const skillKey = (params.skill ?? '') as SkillKey | '';
  const skill = useMemo(() => SKILLS.find((s) => s.key === skillKey), [skillKey]);

  if (!skill) {
    return <SkillListView player={player} router={router} insets={insets} />;
  }

  return <SkillDetailView skill={skill} player={player} router={router} insets={insets} />;
}

function SkillListView({
  player,
  router,
  insets,
}: {
  player: PlayerProfile;
  router: ReturnType<typeof useRouter>;
  insets: { top: number };
}) {
  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Conocimientos Evaluados</Text>
          <Text style={styles.headerSubtitle}>
            Tu progreso evaluado por la IA en cada área
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {SKILLS.map((s) => {
          const value = player.skills[s.key];
          const locked = player.level < s.unlockLevel;
          const Icon = s.icon;
          return (
            <Pressable
              key={s.key}
              style={({ pressed }) => [
                styles.skillCard,
                locked && styles.skillCardLocked,
                pressed && !locked && styles.skillCardPressed,
              ]}
              disabled={locked}
              onPress={() => router.push(`/knowledge?skill=${s.key}` as never)}
            >
              <View style={[styles.skillIcon, { backgroundColor: s.color + '20' }]}>
                {locked ? (
                  <Lock size={22} color={Colors.text.muted} />
                ) : (
                  <Icon size={22} color={s.color} />
                )}
              </View>

              <View style={styles.skillBody}>
                <View style={styles.skillTopRow}>
                  <Text style={[styles.skillLabel, locked && styles.lockedText]} numberOfLines={1}>
                    {s.label}
                  </Text>
                  {!locked && (
                    <Text style={[styles.skillValue, { color: s.color }]}>{value}%</Text>
                  )}
                </View>

                {locked ? (
                  <Text style={styles.lockedHint}>
                    Se desbloquea en nivel {s.unlockLevel}
                  </Text>
                ) : (
                  <>
                    <Text style={styles.skillShort} numberOfLines={1}>{s.short}</Text>
                    <View style={styles.skillTrack}>
                      <View
                        style={[styles.skillFill, { width: `${value}%`, backgroundColor: s.color }]}
                      />
                    </View>
                  </>
                )}
              </View>
            </Pressable>
          );
        })}

        <View style={styles.infoCard}>
          <Sparkles size={20} color={Colors.accent.cyan} />
          <Text style={styles.infoText}>
            Toca cualquier conocimiento desbloqueado para que la IA analice tu progreso, te
            explique por qué importa y qué hacer después.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SkillDetailView({
  skill,
  player,
  router,
  insets,
}: {
  skill: SkillMeta;
  player: PlayerProfile;
  router: ReturnType<typeof useRouter>;
  insets: { top: number };
}) {
  const value = player.skills[skill.key];
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const Icon = skill.icon;

  const fetchAnalysis = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `Eres un mentor de ciberseguridad. Analiza el progreso de un estudiante en el tema: ${skill.topic}.

Datos del estudiante:
- Nombre: ${player.name || 'Estudiante'}
- Nivel general: ${player.level}
- Habilidad actual en este tema: ${value}%
- Escenarios completados: ${player.completedScenarios.length}

Devuelve un análisis educativo en español que incluya:
- "level": etiqueta del nivel (Principiante / Intermedio / Avanzado) según el ${value}%.
- "summary": cómo va el estudiante y qué ya domina.
- "importance": por qué este conocimiento es crucial en la vida real (trabajo, finanzas, privacidad).
- "helps": 3-4 situaciones concretas donde aplica.
- "nextSteps": 3-4 acciones específicas para mejorar.
- "funFact": un dato real interesante sobre el tema.

Tono motivador, claro y práctico.`;

      let response: Partial<Analysis> | null = null;
      try {
        response = await generateObject({
          messages: [{ role: 'user', content: prompt }],
          schema: analysisSchema,
        }) as Partial<Analysis>;
      } catch (innerErr) {
        console.log('generateObject failed, using fallback', innerErr);
      }

      const fallback = buildFallbackAnalysis(skill, value);
      const r = response ?? {};
      const safe: Analysis = {
        level: r.level || fallback.level,
        summary: r.summary || fallback.summary,
        importance: r.importance || fallback.importance,
        helps: Array.isArray(r.helps) && r.helps.length > 0 ? r.helps : fallback.helps,
        nextSteps: Array.isArray(r.nextSteps) && r.nextSteps.length > 0 ? r.nextSteps : fallback.nextSteps,
        funFact: r.funFact || fallback.funFact,
      };

      setAnalysis(safe);
    } catch (e) {
      console.log('knowledge analysis fatal', e);
      setAnalysis(buildFallbackAnalysis(skill, value));
    } finally {
      setLoading(false);
    }
  }, [skill, player, value]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{skill.label}</Text>
          <Text style={styles.headerSubtitle}>Análisis IA personalizado</Text>
        </View>
        <Pressable style={styles.backBtn} onPress={fetchAnalysis} disabled={loading}>
          <RefreshCw size={20} color={loading ? Colors.text.muted : Colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { borderColor: skill.color }]}>
          <View style={[styles.heroIcon, { backgroundColor: skill.color + '25' }]}>
            <Icon size={32} color={skill.color} />
          </View>
          <Text style={styles.heroTitle}>{skill.label}</Text>
          <Text style={[styles.heroValue, { color: skill.color }]}>{value}%</Text>
          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${value}%`, backgroundColor: skill.color }]} />
          </View>
          {analysis?.level ? (
            <View style={[styles.levelChip, { backgroundColor: skill.color + '20', borderColor: skill.color }]}>
              <Text style={[styles.levelChipText, { color: skill.color }]}>{analysis.level}</Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={skill.color} />
            <Text style={styles.loadingText}>La IA está evaluando tu progreso…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={[styles.retryBtn, { backgroundColor: skill.color }]} onPress={fetchAnalysis}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : analysis ? (
          <>
            <Section
              icon={<TrendingUp size={18} color={skill.color} />}
              title="Tu progreso"
              color={skill.color}
            >
              <Text style={styles.bodyText}>{analysis.summary}</Text>
            </Section>

            <Section
              icon={<Sparkles size={18} color={skill.color} />}
              title="Por qué importa"
              color={skill.color}
            >
              <Text style={styles.bodyText}>{analysis.importance}</Text>
            </Section>

            <Section
              icon={<Target size={18} color={skill.color} />}
              title="En qué te ayuda"
              color={skill.color}
            >
              {analysis.helps.map((h, i) => (
                <View key={`help-${i}`} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: skill.color }]} />
                  <Text style={styles.bulletText}>{h}</Text>
                </View>
              ))}
            </Section>

            <Section
              icon={<Lightbulb size={18} color={skill.color} />}
              title="Próximos pasos"
              color={skill.color}
            >
              {analysis.nextSteps.map((h, i) => (
                <View key={`step-${i}`} style={styles.bulletRow}>
                  <Text style={[styles.bulletNum, { color: skill.color }]}>{i + 1}.</Text>
                  <Text style={styles.bulletText}>{h}</Text>
                </View>
              ))}
            </Section>

            <View style={[styles.factCard, { borderColor: skill.color + '60' }]}>
              <Text style={[styles.factLabel, { color: skill.color }]}>¿Sabías que…?</Text>
              <Text style={styles.factText}>{analysis.funFact}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function levelFromValue(v: number): string {
  if (v < 30) return 'Principiante';
  if (v < 70) return 'Intermedio';
  return 'Avanzado';
}

function buildFallbackAnalysis(skill: SkillMeta, value: number): Analysis {
  const byKey: Record<SkillKey, { helps: string[]; nextSteps: string[]; funFact: string; importance: string }> = {
    password: {
      importance: 'Las contraseñas son la primera línea de defensa de tus cuentas personales, bancarias y laborales.',
      helps: [
        'Proteger tu correo y redes sociales de accesos no autorizados.',
        'Evitar que un atacante reutilice una contraseña filtrada en otros servicios.',
        'Cumplir con políticas de seguridad en tu trabajo o estudios.',
      ],
      nextSteps: [
        'Usa un gestor de contraseñas como 1Password o Bitwarden.',
        'Activa la autenticación en dos pasos (2FA) en tus cuentas importantes.',
        'Revisa si tus correos aparecen en filtraciones en haveibeenpwned.com.',
      ],
      funFact: 'El 81% de las brechas de datos se relacionan con contraseñas débiles o reutilizadas según Verizon DBIR.',
    },
    phishing: {
      importance: 'El phishing es el vector de ataque más común y suele ser el inicio de robos de identidad y ransomware.',
      helps: [
        'Detectar correos falsos que suplantan a tu banco o redes sociales.',
        'Evitar caer en estafas por WhatsApp o SMS (smishing).',
        'Reportar correctamente intentos de fraude en tu organización.',
      ],
      nextSteps: [
        'Verifica siempre el dominio del remitente antes de hacer clic.',
        'Pasa el cursor sobre los enlaces para ver la URL real.',
        'Si dudas, contacta a la entidad por un canal oficial diferente.',
      ],
      funFact: 'Más del 90% de los ciberataques comienzan con un correo de phishing.',
    },
    network: {
      importance: 'Una red mal configurada expone todos los dispositivos conectados a ella, en casa y en la oficina.',
      helps: [
        'Configurar tu router con WPA3 o WPA2 y una contraseña fuerte.',
        'Separar la red de invitados de tus dispositivos sensibles.',
        'Detectar dispositivos extraños conectados a tu red.',
      ],
      nextSteps: [
        'Cambia las credenciales por defecto del administrador del router.',
        'Mantén el firmware del router actualizado.',
        'Desactiva WPS y servicios remotos que no uses.',
      ],
      funFact: 'Muchos routers domésticos siguen usando admin/admin años después de su instalación.',
    },
    malware: {
      importance: 'El malware puede cifrar tus archivos, robar credenciales o convertir tu equipo en parte de una botnet.',
      helps: [
        'Identificar archivos sospechosos antes de abrirlos.',
        'Reconocer síntomas de infección como lentitud o ventanas emergentes.',
        'Saber qué hacer ante un ataque de ransomware.',
      ],
      nextSteps: [
        'Mantén el sistema operativo y el antivirus actualizados.',
        'Haz copias de seguridad periódicas en disco externo o nube.',
        'Evita ejecutar archivos .exe o macros de origen desconocido.',
      ],
      funFact: 'Un ataque de ransomware ocurre en el mundo aproximadamente cada 11 segundos.',
    },
    social: {
      importance: 'La ingeniería social explota la confianza humana y suele ser más efectiva que cualquier exploit técnico.',
      helps: [
        'Detectar llamadas falsas de soporte técnico o de tu banco.',
        'Resistir la presión emocional o la urgencia falsa en mensajes.',
        'Proteger información sensible en redes sociales.',
      ],
      nextSteps: [
        'Verifica la identidad por un canal alternativo antes de actuar.',
        'Limita la información personal pública en tus redes.',
        'Acuerda una palabra clave familiar para emergencias.',
      ],
      funFact: 'Kevin Mitnick, uno de los hackers más famosos, obtenía la mayoría de su acceso solo con llamadas telefónicas.',
    },
    ransomware: {
      importance: 'El ransomware puede paralizar empresas enteras y causar pérdidas millonarias en horas.',
      helps: ['Saber qué hacer al ver un mensaje de rescate.', 'Proteger tus backups para que no sean cifrados también.', 'Detectar las señales tempranas de un ataque.'],
      nextSteps: ['Desconecta el equipo de la red inmediatamente, no lo apagues.', 'Restaura desde backups offline verificados.', 'Reporta al equipo de seguridad sin pagar el rescate.'],
      funFact: 'El rescate promedio por ransomware en 2025 superó los $500,000 USD.',
    },
    iot: {
      importance: 'Los dispositivos IoT son la puerta trasera más común a redes domésticas y corporativas.',
      helps: ['Identificar dispositivos con credenciales de fábrica.', 'Segmentar la red para aislar dispositivos vulnerables.', 'Mantener el firmware actualizado.'],
      nextSteps: ['Cambia las contraseñas por defecto de todos tus dispositivos.', 'Crea una VLAN o red separada para IoT.', 'Desactiva funciones que no uses (UPnP, acceso remoto).'],
      funFact: 'Se estima que hay más de 15 mil millones de dispositivos IoT conectados en el mundo.',
    },
    cloud: {
      importance: 'Una mala configuración cloud puede exponer datos de millones de usuarios a internet abierto.',
      helps: ['Revisar permisos de buckets y bases de datos.', 'Implementar el principio de menor privilegio en IAM.', 'Detectar secretos y tokens expuestos en repositorios.'],
      nextSteps: ['Audita los permisos públicos de tus recursos cloud.', 'Usa herramientas como ScoutSuite o Prowler.', 'Activa el cifrado por defecto en todos los servicios.'],
      funFact: 'El 70% de las brechas de datos en la nube son por configuraciones incorrectas, no por vulnerabilidades.',
    },
    crypto: {
      importance: 'La criptografía mal aplicada da una falsa sensación de seguridad que puede ser devastadora.',
      helps: ['Distinguir entre hashing, cifrado simétrico y asimétrico.', 'Identificar certificados TLS inválidos o expirados.', 'Entender cómo funciona la firma digital.'],
      nextSteps: ['Usa TLS 1.3 con certificados de una CA confiable.', 'Nunca crees tu propio algoritmo criptográfico.', 'Almacena contraseñas solo con bcrypt, argon2 o scrypt.'],
      funFact: 'SHA-256 genera un hash de 256 bits: hay más combinaciones posibles que átomos en el universo observable.',
    },
    forensics: {
      importance: 'El análisis forense determina qué pasó, cómo pasó y quién fue responsable tras un incidente.',
      helps: ['Preservar la evidencia sin contaminarla.', 'Reconstruir la línea de tiempo del ataque.', 'Mantener la cadena de custodia para fines legales.'],
      nextSteps: ['Crea imágenes forenses del disco antes de analizar.', 'Documenta cada paso con timestamp y justificación.', 'Centraliza los logs en un SIEM externo al equipo.'],
      funFact: 'La regla de Locard dice que todo contacto deja un rastro, también en el mundo digital.',
    },
    osint: {
      importance: 'La inteligencia de fuentes abiertas permite anticipar ataques antes de que ocurran.',
      helps: ['Descubrir qué información de tu empresa está expuesta.', 'Monitorear foros y la dark web por menciones.', 'Construir un perfil de amenaza para tu organización.'],
      nextSteps: ['Busca tu dominio en Shodan, Censys y Google dorks.', 'Configura alertas para tu marca en redes sociales.', 'Elimina metadatos de documentos públicos.'],
      funFact: 'El 90% de la inteligencia que usan las agencias gubernamentales proviene de fuentes abiertas.',
    },
    mobile: {
      importance: 'Los dispositivos móviles almacenan más datos sensibles que nunca y son blanco frecuente.',
      helps: ['Detectar aplicaciones falsas en tiendas oficiales.', 'Revisar los permisos que pide cada app.', 'Proteger el dispositivo con bloqueo biométrico.'],
      nextSteps: ['Revisa los permisos de todas tus apps instaladas.', 'No instales apps fuera de la tienda oficial.', 'Mantén el sistema operativo siempre actualizado.'],
      funFact: 'Cada mes se detectan más de 10,000 apps maliciosas en Google Play Store.',
    },
    ddos: {
      importance: 'Un ataque DDoS puede tumbar servicios críticos y causar pérdidas de miles de dólares por minuto.',
      helps: ['Distinguir un pico de tráfico legítimo de un ataque.', 'Configurar protección anti-DDoS proactiva.', 'Diseñar arquitecturas resilientes y escalables.'],
      nextSteps: ['Usa un CDN con protección DDoS (Cloudflare, AWS Shield).', 'Configura rate limiting en tus endpoints.', 'Prepara un plan de comunicación para clientes durante caídas.'],
      funFact: 'El mayor ataque DDoS registrado superó los 3.47 Tbps en 2025.',
    },
    zeroday: {
      importance: 'Una vulnerabilidad zero-day puede ser explotada antes de que exista un parche, sin defensa posible.',
      helps: ['Aplicar mitigaciones temporales mientras llega el parche.', 'Priorizar la actualización de sistemas críticos.', 'Participar en programas de divulgación responsable.'],
      nextSteps: ['Suscríbete a los boletines de CISA y NIST NVD.', 'Aplica el principio de defensa en profundidad.', 'Ten un plan de respuesta para zero-days críticos.'],
      funFact: 'Un zero-day de iOS puede valer hasta $2 millones en el mercado negro de exploits.',
    },
    supplychain: {
      importance: 'Un ataque a la cadena de suministro compromete a todas las organizaciones que confían en el proveedor afectado.',
      helps: ['Verificar la integridad de las dependencias de software.', 'Fijar versiones por hash, no por número de versión.', 'Auditar el código de terceros antes de integrarlo.'],
      nextSteps: ['Usa lockfiles con hashes verificables.', 'Revisa el SBOM (Software Bill of Materials) de tus proyectos.', 'Rota secretos automáticamente tras cualquier incidente.'],
      funFact: 'El ataque a SolarWinds en 2020 comprometió a más de 18,000 organizaciones incluyendo agencias del gobierno de EE.UU.',
    },
    privacy: {
      importance: 'Proteger los datos personales no es solo ético, es una obligación legal con multas millonarias.',
      helps: ['Clasificar datos según su sensibilidad.', 'Implementar el derecho al olvido y la portabilidad.', 'Cumplir con GDPR, CCPA y leyes locales de protección de datos.'],
      nextSteps: ['Haz un inventario de todos los datos personales que manejas.', 'Anonimiza o seudonimiza los datos siempre que sea posible.', 'Documenta tus procesos de tratamiento de datos.'],
      funFact: 'Las multas por GDPR pueden alcanzar el 4% de la facturación anual global de una empresa.',
    },
    ai_attacks: {
      importance: 'Los ataques con IA permiten crear deepfakes indistinguibles y automatizar campañas de phishing hiperpersonalizadas.',
      helps: ['Detectar señales sutiles de deepfakes en video y audio.', 'Proteger modelos de IA contra envenenamiento de datos.', 'Verificar siempre por un segundo canal ante solicitudes sospechosas.'],
      nextSteps: ['Implementa verificación multifactor para transacciones sensibles.', 'Nunca confíes solo en una videollamada para autorizar transferencias.', 'Usa marcas de agua y firma digital en contenido corporativo.'],
      funFact: 'En 2025, un deepfake de voz del CEO de una empresa europea permitió a atacantes robar €25 millones en una sola llamada.',
    },
  };
  const data = byKey[skill.key];
  return {
    level: levelFromValue(value),
    summary: value === 0
      ? `Aún no has practicado ${skill.label.toLowerCase()}. Es un buen momento para empezar.`
      : `Llevas ${value}% en ${skill.label.toLowerCase()}. Sigue practicando para consolidar lo aprendido.`,
    importance: data.importance,
    helps: data.helps,
    nextSteps: data.nextSteps,
    funFact: data.funFact,
  };
}

function Section({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: color + '20' }]}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary, paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  headerSubtitle: { fontSize: Typography.sizes.xs, color: Colors.text.secondary, marginTop: 2 },

  listContent: { paddingBottom: Spacing.xxl, gap: Spacing.md },
  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  skillCardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  skillCardLocked: { opacity: 0.55 },
  skillIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  skillBody: { flex: 1, gap: Spacing.xs },
  skillTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.text.primary, flex: 1, marginRight: Spacing.sm },
  skillValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  skillShort: { fontSize: Typography.sizes.xs, color: Colors.text.secondary },
  skillTrack: {
    height: 6, backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 4,
  },
  skillFill: { height: '100%', borderRadius: BorderRadius.full },
  lockedText: { color: Colors.text.muted },
  lockedHint: { fontSize: Typography.sizes.xs, color: Colors.text.muted, fontStyle: 'italic' },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent.cyan + '30',
  },
  infoText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.text.secondary, lineHeight: 20 },

  detailContent: { paddingBottom: Spacing.xxl, gap: Spacing.lg },
  heroCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    gap: Spacing.sm,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: Typography.sizes.md, color: Colors.text.secondary, marginTop: Spacing.xs },
  heroValue: { fontSize: Typography.sizes.hero, fontWeight: Typography.weights.bold, lineHeight: 56 },
  heroTrack: {
    width: '100%', height: 8, backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  heroFill: { height: '100%', borderRadius: BorderRadius.full },
  levelChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  levelChipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 0.5 },

  loadingBox: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  loadingText: { color: Colors.text.secondary, fontSize: Typography.sizes.sm },
  errorBox: {
    backgroundColor: Colors.background.card, padding: Spacing.lg,
    borderRadius: BorderRadius.lg, alignItems: 'center', gap: Spacing.md,
  },
  errorText: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, textAlign: 'center' },
  retryBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  retryText: { color: Colors.background.primary, fontWeight: Typography.weights.bold },

  section: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIcon: {
    width: 32, height: 32, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  sectionBody: { gap: Spacing.sm },
  bodyText: { fontSize: Typography.sizes.sm, color: Colors.text.secondary, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletNum: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, minWidth: 20 },
  bulletText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.text.secondary, lineHeight: 22 },

  factCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  factLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 1, textTransform: 'uppercase' as const },
  factText: { fontSize: Typography.sizes.sm, color: Colors.text.primary, lineHeight: 22, fontStyle: 'italic' },
});
