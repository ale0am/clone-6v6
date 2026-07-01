import { View, Text, StyleSheet, Pressable, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { Shield, Lock, Eye, Terminal } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80" }}
      style={styles.container}
      imageStyle={{ opacity: 0.3 }}
    >
      <StatusBar style="light" />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Shield size={64} color="#00FF88" />
          <Text style={styles.title}>CyberGuard</Text>
          <Text style={styles.subtitle}>
            Aprende ciberseguridad jugando
          </Text>
        </View>

        <View style={styles.menu}>
          <MenuButton
            icon={<Terminal size={24} color="#1a1a2e" />}
            title="Modo Aventura"
            description="Explora escenarios y resuelve desafíos"
            onPress={() => router.push("/game")}
            color="#00FF88"
          />
          
          <MenuButton
            icon={<Lock size={24} color="#1a1a2e" />}
            title="Desafío: Contraseñas"
            description="Analiza y mejora contraseñas con IA"
            onPress={() => router.push("/password-challenge")}
            color="#FF6B6B"
          />
          
          <MenuButton
            icon={<Eye size={24} color="#1a1a2e" />}
            title="Desafío: Phishing"
            description="Identifica correos fraudulentos"
            onPress={() => router.push("/phishing-challenge")}
            color="#4ECDC4"
          />
        </View>

        <View style={styles.stats}>
          <Stat label="Nivel" value="1" />
          <Stat label="Puntos" value="0" />
          <Stat label="Escenarios" value="3" />
        </View>
      </View>
    </ImageBackground>
  );
}

function MenuButton({
  icon,
  title,
  description,
  onPress,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.buttonIcon}>{icon}</View>
      <View style={styles.buttonContent}>
        <Text style={styles.buttonTitle}>{title}</Text>
        <Text style={styles.buttonDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 15, 0.85)",
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#8888a0",
    marginTop: 8,
  },
  menu: {
    gap: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    marginLeft: 16,
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a2e",
  },
  buttonDescription: {
    fontSize: 13,
    color: "#1a1a2e",
    opacity: 0.7,
    marginTop: 2,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#00FF88",
  },
  statLabel: {
    fontSize: 12,
    color: "#8888a0",
    marginTop: 4,
  },
});
