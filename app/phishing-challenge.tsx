import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, AlertTriangle, Check, X, Eye, Sparkles } from "lucide-react-native";
import { generateText } from "@rork-ai/toolkit-sdk";

interface EmailScenario {
  id: string;
  sender: string;
  subject: string;
  content: string;
  isPhishing: boolean;
  redFlags: string[];
  explanation: string;
}

const SCENARIOS: EmailScenario[] = [
  {
    id: "1",
    sender: "seguridad@banco-seguro.com",
    subject: "Actualización urgente de su cuenta",
    content: `Estimado cliente,

Hemos detectado actividad sospechosa en su cuenta. Para proteger sus fondos, debe verificar su identidad inmediatamente.

Haga clic aquí: http://banco-seguro-verificacion.com/verify

Si no verifica en 24 horas, su cuenta será suspendida.

Atentamente,
Departamento de Seguridad`,
    isPhishing: true,
    redFlags: [
      "URL sospechosa (no es el dominio oficial)",
      "Amenaza de urgencia",
      "Remitente ligeramente diferente al oficial",
    ],
    explanation: "Este es phishing. El banco nunca pide verificación por email con amenazas.",
  },
  {
    id: "2",
    sender: "amazon.com",
    subject: "Su pedido #12345 ha sido enviado",
    content: `Hola,

Su pedido ha sido enviado y llegará mañana.

Rastree su paquete: https://www.amazon.com/gp/your-account/order-details

Gracias por su compra,
Equipo Amazon`,
    isPhishing: false,
    redFlags: [],
    explanation: "Este email es legítimo. Tiene el dominio correcto y no pide información personal.",
  },
  {
    id: "3",
    sender: "premio@gana-ahora.net",
    subject: "¡Felicidades! Has ganado $1,000,000",
    content: `¡FELICIDADES GANADOR!

Ha sido seleccionado para recibir $1,000,000 USD. Para reclamar su premio, proporcione:

- Nombre completo
- Número de cuenta bancaria
- Contraseña de banco

Responda URGENTE antes de que expire.

¡Felicitaciones!`,
    isPhishing: true,
    redFlags: [
      "Premio inesperado",
      "Pide información sensible",
      "Dominio sospechoso",
      "Demasiada urgencia",
    ],
    explanation: "Es phishing. Nadie legítimo pide contraseñas bancarias por email.",
  },
];

export default function PhishingChallengeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentScenario = SCENARIOS[currentIndex];

  const handleAnswer = (answer: boolean) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    if (answer === currentScenario.isPhishing) {
      setScore(score + 1);
    }
  };

  const getAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `Analiza este email para un juego educativo de ciberseguridad sobre phishing:

De: ${currentScenario.sender}
Asunto: ${currentScenario.subject}
Contenido: ${currentScenario.content}

Es phishing: ${currentScenario.isPhishing ? "Sí" : "No"}

Explica en 2-3 oraciones por qué este email es ${currentScenario.isPhishing ? "phishing" : "legítimo"} y qué elementos deberían alertar al usuario. Sé conciso y educativo.`;

      const response = await generateText({
        messages: [{ role: "user", content: prompt }],
      });

      setAiAnalysis(response);
    } catch (error) {
      console.error("Error getting AI analysis:", error);
      setAiAnalysis(currentScenario.explanation);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const nextScenario = () => {
    if (currentIndex < SCENARIOS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAiAnalysis(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Mail size={32} color="#4ECDC4" />
          <Text style={styles.headerTitle}>Detector de Phishing</Text>
          <Text style={styles.headerSubtitle}>
            Escenario {currentIndex + 1} de {SCENARIOS.length} | Puntos: {score}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Email Card */}
        <View style={styles.emailCard}>
          <View style={styles.emailHeader}>
            <View style={styles.emailField}>
              <Text style={styles.emailLabel}>De:</Text>
              <Text style={styles.emailValue}>{currentScenario.sender}</Text>
            </View>
            <View style={styles.emailField}>
              <Text style={styles.emailLabel}>Asunto:</Text>
              <Text style={styles.emailValue}>{currentScenario.subject}</Text>
            </View>
          </View>
          <View style={styles.emailBody}>
            <Text style={styles.emailContent}>{currentScenario.content}</Text>
          </View>
        </View>

        {/* Answer Buttons */}
        {!showResult ? (
          <View style={styles.answerSection}>
            <Text style={styles.question}>¿Este email es phishing?</Text>
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.answerButton, styles.phishingButton]}
                onPress={() => handleAnswer(true)}
              >
                <AlertTriangle size={24} color="#ffffff" />
                <Text style={styles.answerButtonText}>Sí, es phishing</Text>
              </Pressable>
              <Pressable
                style={[styles.answerButton, styles.legitButton]}
                onPress={() => handleAnswer(false)}
              >
                <Check size={24} color="#ffffff" />
                <Text style={styles.answerButtonText}>No, es legítimo</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.resultSection}>
            <View
              style={[
                styles.resultBanner,
                selectedAnswer === currentScenario.isPhishing
                  ? styles.correctBanner
                  : styles.wrongBanner,
              ]}
            >
              {selectedAnswer === currentScenario.isPhishing ? (
                <>
                  <Check size={32} color="#00FF88" />
                  <Text style={styles.resultText}>¡Correcto!</Text>
                </>
              ) : (
                <>
                  <X size={32} color="#FF6B6B" />
                  <Text style={styles.resultText}>Incorrecto</Text>
                </>
              )}
            </View>

            {/* Red Flags */}
            {currentScenario.redFlags.length > 0 && (
              <View style={styles.flagsSection}>
                <View style={styles.sectionHeader}>
                  <Eye size={20} color="#FFE66D" />
                  <Text style={styles.sectionTitle}>Señales de Alerta</Text>
                </View>
                {currentScenario.redFlags.map((flag, index) => (
                  <View key={index} style={styles.flagItem}>
                    <AlertTriangle size={16} color="#FFE66D" />
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* AI Analysis */}
            <Pressable
              style={styles.aiButton}
              onPress={getAIAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#0a0a0f" />
              ) : (
                <>
                  <Sparkles size={20} color="#0a0a0f" />
                  <Text style={styles.aiButtonText}>
                    {aiAnalysis ? "Análisis de IA" : "Obtener análisis de IA"}
                  </Text>
                </>
              )}
            </Pressable>

            {aiAnalysis && (
              <View style={styles.aiAnalysis}>
                <Text style={styles.aiText}>{aiAnalysis}</Text>
              </View>
            )}

            {/* Next Button */}
            {currentIndex < SCENARIOS.length - 1 ? (
              <Pressable style={styles.nextButton} onPress={nextScenario}>
                <Text style={styles.nextButtonText}>Siguiente Escenario</Text>
              </Pressable>
            ) : (
              <View style={styles.finalScore}>
                <Text style={styles.finalScoreText}>
                  Puntuación Final: {score}/{SCENARIOS.length}
                </Text>
                <Pressable
                  style={styles.restartButton}
                  onPress={() => {
                    setCurrentIndex(0);
                    setScore(0);
                    setSelectedAnswer(null);
                    setShowResult(false);
                    setAiAnalysis(null);
                  }}
                >
                  <Text style={styles.restartButtonText}>Reintentar</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#0f0f1a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(78, 205, 196, 0.3)",
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8888a0",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  emailHeader: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  emailField: {
    flexDirection: "row",
    marginBottom: 8,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    width: 60,
  },
  emailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  emailBody: {
    padding: 16,
  },
  emailContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontFamily: "monospace",
  },
  answerSection: {
    alignItems: "center",
  },
  question: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  answerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  phishingButton: {
    backgroundColor: "#FF6B6B",
  },
  legitButton: {
    backgroundColor: "#00FF88",
  },
  answerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  resultSection: {
    gap: 16,
  },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
    borderRadius: 12,
  },
  correctBanner: {
    backgroundColor: "rgba(0, 255, 136, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.5)",
  },
  wrongBanner: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.5)",
  },
  resultText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  flagsSection: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  flagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  flagText: {
    color: "#FFE66D",
    fontSize: 14,
    flex: 1,
  },
  aiButton: {
    flexDirection: "row",
    backgroundColor: "#00FF88",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  aiButtonText: {
    color: "#0a0a0f",
    fontSize: 16,
    fontWeight: "800",
  },
  aiAnalysis: {
    backgroundColor: "rgba(0, 255, 136, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.3)",
    borderRadius: 12,
    padding: 16,
  },
  aiText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
  },
  nextButton: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#0a0a0f",
    fontSize: 16,
    fontWeight: "800",
  },
  finalScore: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  finalScoreText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00FF88",
  },
  restartButton: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  restartButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
