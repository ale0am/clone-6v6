import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const rawKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (u.protocol === 'https:' || u.protocol === 'http:') && Boolean(u.host);
  } catch {
    return false;
  }
}

export const isSupabaseConfigured: boolean = isValidHttpUrl(rawUrl) && rawKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] Missing or invalid EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Auth will run in offline mode.'
  );
}

// Safe placeholders so createClient never throws on startup.
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

/**
 * Custom fetch with a timeout so the app never hangs forever on a bad
 * Supabase URL and we surface a friendly error instead of "Failed to fetch".
 */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

/** Translate raw network/Supabase errors into user-friendly Spanish messages. */
export function friendlyAuthError(err: unknown): string {
  if (!isSupabaseConfigured) {
    return 'El servicio de cuentas no está configurado. Contacta al administrador.';
  }
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const low = msg.toLowerCase();
  if (low.includes('failed to fetch') || low.includes('network') || low.includes('aborted')) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.';
  }
  if (low.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (low.includes('already registered') || low.includes('already exists')) {
    return 'Este correo ya está registrado. Inicia sesión.';
  }
  if (low.includes('email') && low.includes('confirm')) {
    return 'Debes confirmar tu correo antes de iniciar sesión.';
  }
  return msg || 'Ocurrió un error inesperado.';
}
