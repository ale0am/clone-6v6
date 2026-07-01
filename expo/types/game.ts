export type SkillCategory =
  | 'phishing' | 'password' | 'network' | 'malware' | 'social'
  | 'ransomware' | 'iot' | 'cloud' | 'crypto' | 'forensics'
  | 'osint' | 'mobile' | 'ddos' | 'zeroday' | 'supplychain'
  | 'privacy' | 'ai_attacks';

export interface PlayerProfile {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatarColor?: string;
  registeredAt?: string;
  isRegistered?: boolean;
  level: number;
  xp: number;
  totalXP: number;
  streak: number;
  lastDailyMissionDate?: string;
  completedScenarios: string[];
  skills: Record<SkillCategory, number>;
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
  /** Cuántas veces ha reintentado cada categoría. A más reintentos, más pistas y escenarios más fáciles. */
  categoryRetries: Record<SkillCategory, number>;
}

export interface Scenario {
  id: string;
  type: SkillCategory;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  timeLimit?: number;
  content: ScenarioContent;
  hints: string[];
}

export interface ScenarioContent {
  scenario: string;
  /** Modo múltiple choice (legacy). Si `mode` es 'open_response', se ignora. */
  options?: Option[];
  correctOptionId?: string;
  explanation: string;
  /** Modo respuesta escrita: el jugador escribe y la IA corrige. */
  mode?: 'multiple_choice' | 'open_response';
  openQuestion?: string;
  rubric?: string[];
}

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface GameSession {
  id: string;
  playerId: string;
  scenario: Scenario;
  startTime: Date;
  endTime?: Date;
  selectedOption?: string;
  score: number;
  hintsUsed: number;
  completed: boolean;
}

export interface ScenarioResult {
  correct: boolean;
  score: number;
  xpEarned: number;
  timeTaken: number;
  skillImprovement: Partial<PlayerProfile['skills']>;
  feedback: string;
}

export type GameScreen = 'home' | 'scenarios' | 'gameplay' | 'result' | 'profile';

export interface AdaptiveDifficultyState {
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  averageResponseTime: number;
  skillLevels: PlayerProfile['skills'];
  recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced';
}
