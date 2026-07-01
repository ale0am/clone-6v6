// CyberGuard Academy - Not Found Screen
import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { AlertTriangle, Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <AlertTriangle size={64} color={Colors.accent.yellow} />
        <Text style={styles.title}>Página no encontrada</Text>
        <Text style={styles.description}>
          La página que buscas no existe o ha sido movida.
        </Text>
        <Link href="/" asChild>
          <Pressable style={styles.button}>
            <Home size={20} color={Colors.background.primary} />
            <Text style={styles.buttonText}>Volver al inicio</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
  },
  description: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.cyan,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.background.primary,
  },
});
// UNIQUE_ID_1776613937
