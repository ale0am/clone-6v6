import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Lock, Shield, AlertCircle, Check, X, Sparkles } from "lucide-react-native";
import { generateText } from "@rork-ai/toolkit-sdk";

interface PasswordAnalysis {
  score: number;
  strength: "muy débil" | "débil" | "moderada" | "fuerte" | "muy fuerte";
  issues: string[];
  suggestions: string[];
  timeToCrack: string;
}

export default function PasswordChallengeScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const analyzePassword = async () => {
    if (!password.trim()) return;

    setIsAnalyzing(true);
    try {
      const prompt = `Analiza esta contraseña de forma educativa para un juego de ciberseguridad: "${password}"
      
      Proporciona un análisis en formato JSON con:
      - score: número del 0 al 100
      - strength: "muy débil", "débil", "moderada", "fuerte" o "muy fuerte"
      - issues: array de problemas encontrados (máximo 3)
      - suggestions: array de sugerencias específicas para mejorarla (máximo 3)
      - timeToCrack: tiempo estimado para descifrarla (ej: "instantáneo", "minutos", "días", "años", "siglos")
      
      Responde SOLO con el JSON, sin texto adicional.`;

      const response = await generateText({
        messages: [{ role: "user", content: prompt }],
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
      }
    } catch (error) {
      console.error("Error analyzing password:", error);
      setAnalysis(fallbackAnalysis(password));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fallbackAnalysis = (pwd: string): PasswordAnalysis => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    if (pwd.length < 8) {
      issues.push("Muy corta (menos de 8 caracteres)");
      suggestions.push("Usa al menos 12 caracteres");
    } else if (pwd.length < 12) {
      issues.push("Podría ser más larga");
      suggestions.push("Usa 12+ caracteres para mayor seguridad");
      score += 20;
    } else {
      score += 30;
    }

    if (!/[A-Z]/.test(pwd)) {
      issues.push("Sin mayúsculas");
      suggestions.push("Agrega letras mayúsculas");
    } else {
      score += 15;
    }

    if (!/[a-z]/.test(pwd)) {
      issues.push("Sin minúsculas");
      suggestions.push("Agrega letras minúsculas");
    } else {
      score += 15;
    }

    if (!/[0-9]/.test(pwd)) {
      issues.push("Sin números");
      suggestions.push("Incluye números");
    } else {
      score += 20;
    }

    if (!/[^A-Za-z0-9]/.test(pwd)) {
      issues.push("Sin símbolos especiales");
      suggestions.push("Agrega símbolos como !@#$%");
    } else {
      score += 20;
    }

    let strength: PasswordAnalysis["strength"] = "muy débil";
    if (score >= 90) strength = "muy fuerte";
    else if (score >= 70) strength = "fuerte";
    else if (score >= 50) strength = "moderada";
    else if (score >= 30) strength = "débil";

    let timeToCrack = "instantáneo";
    if (score >= 90) timeToCrack = "siglos";
    else if (score >= 70) timeToCrack = "años";
    else if (score >= 50) timeToCrack = "días";
    else if (score >= 30) timeToCrack = "minutos";

    return {
      score,
      strength,
      issues: issues.slice(0, 3),
      suggestions: suggestions.slice(0, 3),
      timeToCrack,
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#00FF88";
    if (score >= 60) return "#FFE66D";
    if (score >= 40) return "#FF9F43";
    return "#FF6B6B";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Lock size={32} color="#FF6B6B" />
          <Text style={styles.headerTitle}>Laboratorio de Contraseñas</Text>
          <Text style={styles.headerSubtitle}>
            Ingresa una contraseña y la IA la analizará
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ingresa una contraseña..."
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.toggleButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.toggleText}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.analyzeButton,
              (!password.trim() || isAnalyzing) && styles.analyzeButtonDisabled,
            ]}
            onPress={analyzePassword}
            disabled={!password.trim() || isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#0a0a0f" />
            ) : (
              <>
                <Sparkles size={20} color="#0a0a0f" />
                <Text style={styles.analyzeButtonText}>Analizar con IA</Text>
              </>
            )}
          </Pressable>
        </View>

        {analysis && (
          <View style={styles.results}>
            <View style={styles.scoreCard}>
              <View
                style={[
                  styles.scoreCircle,
                  { borderColor: getScoreColor(analysis.score) },
                ]}
              >
                <Text
                  style={[
                    styles.scoreValue,
                    { color: getScoreColor(analysis.score) },
                  ]}
                >
                  {analysis.score}
                </Text>
                <Text style={styles.scoreLabel}>Puntuación</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.strengthLabel}>Fuerza</Text>
                <Text
                  style={[
                    styles.strengthValue,
                    { color: getScoreColor(analysis.score) },
                  ]}
                >
                  {analysis.strength.toUpperCase()}
                </Text>
                <Text style={styles.crackTime}>
                  Tiempo para descifrar: {analysis.timeToCrack}
                </Text>
              </View>
            </View>

            {analysis.issues.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AlertCircle size={20} color="#FF6B6B" />
                  <Text style={styles.sectionTitle}>Problemas Detectados</Text>
                </View>
                {analysis.issues.map((issue, index) => (
                  <View key={index} style={styles.issueItem}>
                    <X size={16} color="#FF6B6B" />
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={20} color="#00FF88" />
                <Text style={styles.sectionTitle}>Sugerencias de Mejora</Text>
              </View>
              {analysis.suggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Check size={16} color="#00FF88" />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.section, styles.tipsSection]}>
              <Text style={styles.tipsTitle}>Consejos Pro</Text>
              <Text style={styles.tipText}>
                Usa frases largas en lugar de palabras simples. Combina caracteres aleatorios. Evita información personal. Usa un administrador de contraseñas.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomColor: "rgba(255, 107, 107, 0.3)",
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
  inputSection: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: "#ffffff",
    fontSize: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  toggleText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
  },
  analyzeButton: {
    flexDirection: "row",
    backgroundColor: "#00FF88",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: "#0a0a0f",
    fontSize: 16,
    fontWeight: "800",
  },
  results: {
    gap: 16,
  },
  scoreCard: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "900",
  },
  scoreLabel: {
    fontSize: 10,
    color: "#8888a0",
    marginTop: 2,
  },
  scoreInfo: {
    marginLeft: 20,
    flex: 1,
  },
  strengthLabel: {
    fontSize: 12,
    color: "#8888a0",
  },
  strengthValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  crackTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  section: {
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
  issueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  issueText: {
    color: "#FF6B6B",
    fontSize: 14,
    flex: 1,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  suggestionText: {
    color: "#00FF88",
    fontSize: 14,
    flex: 1,
  },
  tipsSection: {
    backgroundColor: "rgba(0, 255, 136, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.3)",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00FF88",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: "#aaaaaa",
    lineHeight: 20,
  },
});
