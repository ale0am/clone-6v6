import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Pressable,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, Eye, Mail, AlertTriangle, Home } from "lucide-react-native";

const { width, height } = Dimensions.get("window");
const GAME_WIDTH = width;
const GAME_HEIGHT = height - 150;
const PLAYER_SIZE = 40;
const MOVE_SPEED = 3;

interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "password" | "phishing" | "wifi" | "terminal";
  title: string;
  icon: React.ReactNode;
  color: string;
}

const GAME_OBJECTS: GameObject[] = [
  {
    id: "1",
    x: GAME_WIDTH * 0.2,
    y: GAME_HEIGHT * 0.3,
    width: 80,
    height: 80,
    type: "password",
    title: "Terminal",
    icon: <Lock size={28} color="#1a1a2e" />,
    color: "#FF6B6B",
  },
  {
    id: "2",
    x: GAME_WIDTH * 0.7,
    y: GAME_HEIGHT * 0.25,
    width: 80,
    height: 80,
    type: "phishing",
    title: "Email",
    icon: <Mail size={28} color="#1a1a2e" />,
    color: "#4ECDC4",
  },
  {
    id: "3",
    x: GAME_WIDTH * 0.5,
    y: GAME_HEIGHT * 0.6,
    width: 80,
    height: 80,
    type: "wifi",
    title: "WiFi",
    icon: <AlertTriangle size={28} color="#1a1a2e" />,
    color: "#FFE66D",
  },
];

export default function GameScreen() {
  const router = useRouter();
  const playerPos = useRef({
    x: GAME_WIDTH / 2 - PLAYER_SIZE / 2,
    y: GAME_HEIGHT / 2 - PLAYER_SIZE / 2,
  }).current;
  const playerAnim = useRef(
    new Animated.ValueXY({
      x: playerPos.x,
      y: playerPos.y,
    })
  ).current;
  const velocity = useRef({ x: 0, y: 0 }).current;
  const animationFrame = useRef<number>();
  const [nearObject, setNearObject] = useState<GameObject | null>(null);
  const [direction, setDirection] = useState({ x: 0, y: 0 });

  const checkCollisions = useCallback(() => {
    const playerCenterX = playerPos.x + PLAYER_SIZE / 2;
    const playerCenterY = playerPos.y + PLAYER_SIZE / 2;

    for (const obj of GAME_OBJECTS) {
      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;
      const distance = Math.sqrt(
        Math.pow(playerCenterX - objCenterX, 2) +
          Math.pow(playerCenterY - objCenterY, 2)
      );

      if (distance < 80) {
        setNearObject(obj);
        return;
      }
    }
    setNearObject(null);
  }, [playerPos.x, playerPos.y]);

  const updatePosition = useCallback(() => {
    if (direction.x !== 0 || direction.y !== 0) {
      playerPos.x += direction.x * MOVE_SPEED;
      playerPos.y += direction.y * MOVE_SPEED;

      // Boundary checks
      playerPos.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, playerPos.x));
      playerPos.y = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, playerPos.y));

      playerAnim.setValue({ x: playerPos.x, y: playerPos.y });
      checkCollisions();
    }
    animationFrame.current = requestAnimationFrame(updatePosition);
  }, [direction, playerPos, playerAnim, checkCollisions]);

  useEffect(() => {
    animationFrame.current = requestAnimationFrame(updatePosition);
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [updatePosition]);

  const handleInteraction = () => {
    if (nearObject) {
      switch (nearObject.type) {
        case "password":
          router.push("/password-challenge");
          break;
        case "phishing":
          router.push("/phishing-challenge");
          break;
        case "wifi":
          // TODO: WiFi challenge
          break;
      }
    }
  };

  const movePlayer = (dx: number, dy: number) => {
    setDirection({ x: dx, y: dy });
  };

  return (
    <View style={styles.container}>
      {/* Game World */}
      <View style={styles.gameWorld}>
        {/* Grid Background */}
        <View style={styles.gridBackground}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={`h-${i}`}
              style={[
                styles.gridLine,
                {
                  width: "100%",
                  height: 1,
                  top: `${i * 10}%`,
                },
              ]}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.gridLine,
                {
                  height: "100%",
                  width: 1,
                  left: `${i * 10}%`,
                },
              ]}
            />
          ))}
        </View>

        {/* Game Objects */}
        {GAME_OBJECTS.map((obj) => (
          <View
            key={obj.id}
            style={[
              styles.gameObject,
              {
                left: obj.x,
                top: obj.y,
                width: obj.width,
                height: obj.height,
                backgroundColor: obj.color,
                shadowColor: obj.color,
                shadowOpacity: nearObject?.id === obj.id ? 0.8 : 0.4,
                transform: nearObject?.id === obj.id ? [{ scale: 1.1 }] : [{ scale: 1 }],
              },
            ]}
          >
            {obj.icon}
            <Text style={styles.objectLabel}>{obj.title}</Text>
          </View>
        ))}

        {/* Player */}
        <Animated.View
          style={[
            styles.player,
            {
              transform: [
                { translateX: playerAnim.x },
                { translateY: playerAnim.y },
              ],
            },
          ]}
        >
          <View style={styles.playerBody}>
            <View style={styles.playerFace}>
              <View style={styles.eyes}>
                <View style={styles.eye} />
                <View style={styles.eye} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Interaction Prompt */}
        {nearObject && (
          <View style={styles.interactionPrompt}>
            <Pressable
              style={styles.interactionButton}
              onPress={handleInteraction}
            >
              <Text style={styles.interactionText}>
                Toca para interactuar con {nearObject.title}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          style={styles.homeButton}
          onPress={() => router.push("/")}
        >
          <Home size={24} color="#ffffff" />
        </Pressable>

        <View style={styles.dpad}>
          <View style={styles.dpadRow}>
            <Pressable
              style={styles.dpadButton}
              onPressIn={() => movePlayer(0, -1)}
              onPressOut={() => movePlayer(0, 0)}
            >
              <Text style={styles.dpadArrow}>▲</Text>
            </Pressable>
          </View>
          <View style={styles.dpadRow}>
            <Pressable
              style={styles.dpadButton}
              onPressIn={() => movePlayer(-1, 0)}
              onPressOut={() => movePlayer(0, 0)}
            >
              <Text style={styles.dpadArrow}>◀</Text>
            </Pressable>
            <View style={styles.dpadCenter} />
            <Pressable
              style={styles.dpadButton}
              onPressIn={() => movePlayer(1, 0)}
              onPressOut={() => movePlayer(0, 0)}
            >
              <Text style={styles.dpadArrow}>▶</Text>
            </Pressable>
          </View>
          <View style={styles.dpadRow}>
            <Pressable
              style={styles.dpadButton}
              onPressIn={() => movePlayer(0, 1)}
              onPressOut={() => movePlayer(0, 0)}
            >
              <Text style={styles.dpadArrow}>▼</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#FF6B6B" }]}
            onPress={handleInteraction}
            disabled={!nearObject}
          >
            <Text style={styles.actionButtonText}>A</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  gameWorld: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#1a1a2e",
    overflow: "hidden",
    position: "relative",
  },
  gridBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "#00FF88",
  },
  player: {
    position: "absolute",
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    zIndex: 100,
  },
  playerBody: {
    width: "100%",
    height: "100%",
    backgroundColor: "#00FF88",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  playerFace: {
    width: 28,
    height: 20,
    justifyContent: "center",
  },
  eyes: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  eye: {
    width: 8,
    height: 8,
    backgroundColor: "#0a0a0f",
    borderRadius: 4,
  },
  gameObject: {
    position: "absolute",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 10,
  },
  objectLabel: {
    position: "absolute",
    bottom: -20,
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  interactionPrompt: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  interactionButton: {
    backgroundColor: "rgba(0, 255, 136, 0.9)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  interactionText: {
    color: "#0a0a0f",
    fontWeight: "800",
    fontSize: 14,
  },
  controls: {
    height: 150,
    backgroundColor: "#0f0f1a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 255, 136, 0.2)",
  },
  homeButton: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  dpad: {
    alignItems: "center",
  },
  dpadRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dpadButton: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  dpadCenter: {
    width: 50,
    height: 50,
    margin: 4,
  },
  dpadArrow: {
    color: "#00FF88",
    fontSize: 20,
    fontWeight: "700",
  },
  actionButtons: {
    alignItems: "center",
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
});
