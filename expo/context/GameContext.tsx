import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase, friendlyAuthError, isSupabaseConfigured } from '@/lib/supabase';
import type { PlayerProfile, Scenario, GameSession, ScenarioResult, SkillCategory } from '@/types/game';

/** Local-only auth fallback used when Supabase env vars are missing. */
const LOCAL_USERS_KEY = '@cyberlearn/local-users';
const LOCAL_SESSION_KEY = '@cyberlearn/local-session';

interface LocalUserRecord {
  id: string;
  email: string;
  password: string;
  profile: PlayerProfile;
}

async function readLocalUsers(): Promise<LocalUserRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
    return raw ? (JSON.parse(raw) as LocalUserRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeLocalUsers(users: LocalUserRecord[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

async function readLocalSession(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LOCAL_SESSION_KEY);
  } catch {
    return null;
  }
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
  avatarColor?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface GameContextType {
  player: PlayerProfile;
  currentSession: GameSession | null;
  isLoading: boolean;
  isRegistered: boolean;
  isAuthenticated: boolean;
  registerUser: (data: RegisterPayload) => Promise<{ needsConfirmation: boolean }>;
  loginUser: (data: LoginPayload) => Promise<void>;
  resetProfile: () => Promise<void>;
  startSession: (scenario: Scenario) => void;
  endSession: (result: ScenarioResult) => void;
  updatePlayerSkills: (skillImprovement: Partial<PlayerProfile['skills']>) => void;
  updateProfile: (patch: Partial<Pick<PlayerProfile, 'name' | 'role' | 'avatarColor'>>) => Promise<void>;
  /** Incrementa el contador de reintentos para una categoría específica. */
  incrementCategoryRetry: (category: SkillCategory) => void;
}

const defaultSkills: PlayerProfile['skills'] = {
  phishing: 0,
  password: 0,
  network: 0,
  malware: 0,
  social: 0,
  ransomware: 0,
  iot: 0,
  cloud: 0,
  crypto: 0,
  forensics: 0,
  osint: 0,
  mobile: 0,
  ddos: 0,
  zeroday: 0,
  supplychain: 0,
  privacy: 0,
  ai_attacks: 0,
};

const defaultCategoryRetries: Record<SkillCategory, number> = {
  phishing: 0, password: 0, network: 0, malware: 0, social: 0,
  ransomware: 0, iot: 0, cloud: 0, crypto: 0, forensics: 0,
  osint: 0, mobile: 0, ddos: 0, zeroday: 0, supplychain: 0,
  privacy: 0, ai_attacks: 0,
};

const defaultPlayer: PlayerProfile = {
  id: '',
  name: '',
  email: '',
  role: '',
  avatarColor: '#00f5d4',
  isRegistered: false,
  level: 1,
  xp: 0,
  totalXP: 0,
  streak: 0,
  completedScenarios: [],
  skills: { ...defaultSkills },
  difficultyPreference: 'adaptive',
  categoryRetries: { ...defaultCategoryRetries } as Record<SkillCategory, number>,
};

/** Merge a partial profile from user_metadata with safe defaults. */
function buildProfile(session: Session | null): PlayerProfile {
  if (!session?.user) return defaultPlayer;
  const u = session.user;
  const meta = (u.user_metadata ?? {}) as Partial<PlayerProfile>;
  return {
    ...defaultPlayer,
    ...meta,
    id: u.id,
    email: u.email ?? meta.email ?? '',
    name: meta.name ?? '',
    role: meta.role ?? '',
    avatarColor: meta.avatarColor ?? '#00f5d4',
    isRegistered: true,
    level: meta.level ?? 1,
    xp: meta.xp ?? 0,
    totalXP: meta.totalXP ?? 0,
    streak: meta.streak ?? 0,
    completedScenarios: meta.completedScenarios ?? [],
    skills: { ...defaultSkills, ...(meta.skills ?? {}) },
    difficultyPreference: meta.difficultyPreference ?? 'adaptive',
    categoryRetries: { ...defaultCategoryRetries, ...((meta.categoryRetries as Record<SkillCategory, number>) ?? {}) } as Record<SkillCategory, number>,
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [player, setPlayer] = useState<PlayerProfile>(defaultPlayer);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (!mounted) return;
          setSession(data.session);
          setPlayer(buildProfile(data.session));
        } else {
          const userId = await readLocalSession();
          if (userId) {
            const users = await readLocalUsers();
            const found = users.find((u) => u.id === userId);
            if (found && mounted) {
              setPlayer({ ...found.profile, isRegistered: true });
            }
          }
        }
      } catch (err) {
        console.log('[GameContext] init error', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    if (!isSupabaseConfigured) return;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setPlayer(buildProfile(newSession));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /** Persist game-state fields to Supabase user_metadata, or locally if offline (debounced). */
  const persistMeta = useCallback((next: PlayerProfile) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        if (isSupabaseConfigured) {
          await supabase.auth.updateUser({
            data: {
              name: next.name,
              role: next.role,
              avatarColor: next.avatarColor,
              level: next.level,
              xp: next.xp,
              totalXP: next.totalXP,
              streak: next.streak,
              completedScenarios: next.completedScenarios,
              skills: next.skills,
              difficultyPreference: next.difficultyPreference,
              categoryRetries: next.categoryRetries,
              registeredAt: next.registeredAt,
            },
          });
        } else if (next.id) {
          const users = await readLocalUsers();
          const idx = users.findIndex((u) => u.id === next.id);
          if (idx >= 0) {
            users[idx] = { ...users[idx], profile: next };
            await writeLocalUsers(users);
          }
        }
      } catch (err) {
        console.log('[GameContext] persist error', err);
      }
    }, 400);
  }, []);

  const registerUser = useCallback(async (data: RegisterPayload) => {
    const email = data.email.trim().toLowerCase();
    if (!isSupabaseConfigured) {
      // Local-only fallback so users can still play without Supabase configured.
      const users = await readLocalUsers();
      if (users.some((u) => u.email === email)) {
        throw new Error('Este correo ya está registrado. Inicia sesión.');
      }
      const id = `local-${Date.now()}`;
      const profile: PlayerProfile = {
        ...defaultPlayer,
        id,
        email,
        name: data.name.trim(),
        role: data.role ?? '',
        avatarColor: data.avatarColor ?? '#00f5d4',
        isRegistered: true,
        registeredAt: new Date().toISOString(),
      };
      users.push({ id, email, password: data.password, profile });
      await writeLocalUsers(users);
      await AsyncStorage.setItem(LOCAL_SESSION_KEY, id);
      setPlayer(profile);
      return { needsConfirmation: false };
    }
    try {
      const { data: signUp, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            name: data.name.trim(),
            role: data.role ?? '',
            avatarColor: data.avatarColor ?? '#00f5d4',
            level: 1,
            xp: 0,
            totalXP: 0,
            streak: 0,
            completedScenarios: [],
            skills: { ...defaultSkills },
            difficultyPreference: 'adaptive',
            registeredAt: new Date().toISOString(),
          },
        },
      });
      if (error) throw error;
      return { needsConfirmation: !signUp.session };
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  }, []);

  const loginUser = useCallback(async (data: LoginPayload) => {
    const email = data.email.trim().toLowerCase();
    if (!isSupabaseConfigured) {
      const users = await readLocalUsers();
      const found = users.find((u) => u.email === email);
      if (!found || found.password !== data.password) {
        throw new Error('Correo o contraseña incorrectos.');
      }
      await AsyncStorage.setItem(LOCAL_SESSION_KEY, found.id);
      setPlayer({ ...found.profile, isRegistered: true });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });
      if (error) throw error;
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  }, []);

  const resetProfile = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      } else {
        await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
      }
    } catch (err) {
      console.log('[GameContext] signOut error', err);
    }
    setPlayer(defaultPlayer);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Pick<PlayerProfile, 'name' | 'role' | 'avatarColor'>>) => {
    setPlayer((prev) => {
      const next = { ...prev, ...patch };
      persistMeta(next);
      return next;
    });
  }, [persistMeta]);

  const startSession = useCallback((scenario: Scenario) => {
    const s: GameSession = {
      id: `session-${Date.now()}`,
      playerId: player.id,
      scenario,
      startTime: new Date(),
      score: 0,
      hintsUsed: 0,
      completed: false,
    };
    setCurrentSession(s);
  }, [player.id]);

  const endSession = useCallback((result: ScenarioResult) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      return { ...prev, endTime: new Date(), score: result.score, completed: true };
    });

    setPlayer((prev) => {
      const newTotal = prev.totalXP + result.xpEarned;
      const updated: PlayerProfile = {
        ...prev,
        xp: prev.xp + result.xpEarned,
        totalXP: newTotal,
        level: Math.floor(newTotal / 100) + 1,
        completedScenarios: result.correct
          ? [...prev.completedScenarios, currentSession?.scenario.id ?? '']
          : prev.completedScenarios,
        streak: result.correct ? prev.streak + 1 : 0,
        skills: {
          ...prev.skills,
          ...Object.entries(result.skillImprovement ?? {}).reduce((acc, [k, v]) => ({
            ...acc,
            [k]: Math.min(100, (prev.skills[k as keyof PlayerProfile['skills']] ?? 0) + (v ?? 0)),
          }), {}),
        },
      };
      persistMeta(updated);
      return updated;
    });
  }, [currentSession?.scenario.id, persistMeta]);

  const updatePlayerSkills = useCallback((skillImprovement: Partial<PlayerProfile['skills']>) => {
    setPlayer((prev) => {
      const updated: PlayerProfile = {
        ...prev,
        skills: {
          ...prev.skills,
          ...Object.entries(skillImprovement).reduce((acc, [k, v]) => ({
            ...acc,
            [k]: Math.min(100, (prev.skills[k as keyof PlayerProfile['skills']] ?? 0) + (v ?? 0)),
          }), {}),
        },
      };
      persistMeta(updated);
      return updated;
    });
  }, [persistMeta]);

  const incrementCategoryRetry = useCallback((category: SkillCategory) => {
    setPlayer((prev) => {
      const updated: PlayerProfile = {
        ...prev,
        categoryRetries: {
          ...prev.categoryRetries,
          [category]: (prev.categoryRetries[category] ?? 0) + 1,
        },
      };
      persistMeta(updated);
      return updated;
    });
  }, [persistMeta]);

  return (
    <GameContext.Provider
      value={{
        player,
        currentSession,
        isLoading,
        isRegistered: isSupabaseConfigured ? !!session : !!player.id,
        isAuthenticated: isSupabaseConfigured ? !!session : !!player.id,
        registerUser,
        loginUser,
        resetProfile,
        startSession,
        endSession,
        updatePlayerSkills,
        updateProfile,
        incrementCategoryRetry,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
