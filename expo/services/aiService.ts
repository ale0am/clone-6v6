import { generateText } from "@rork-ai/toolkit-sdk";
import { z } from "zod";
import type { Scenario, PlayerProfile } from "@/types/game";

// ── Types ──────────────────────────────────────────────────────────────────

export type LevelType =
  | "multiple_choice"   // Nivel 1 & 3: elige la respuesta correcta (3-4 opciones)
  | "true_false"        // Nivel 2: verdadero o falso con justificación
  | "open_response"     // Nivel 4: respuesta abierta evaluada por IA
  | "threat_ranking";   // Nivel 5: ordena amenazas de mayor a menor riesgo

export interface ScenarioLevel {
  levelNumber: number;        // 1-5
  type: LevelType;
  title: string;
  instruction: string;        // qué debe hacer el jugador en este nivel
  scenario: string;           // texto de la situación
  // multiple_choice / true_false
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  // true_false
  statement?: string;
  isTrue?: boolean;
  // open_response
  openQuestion?: string;
  rubric?: string[];          // criterios que la IA usa para evaluar
  // threat_ranking
  threats?: { id: string; label: string }[];
  correctOrder?: string[];    // ids en orden correcto (más peligroso primero)
  explanation: string;
  xpReward: number;
}

export interface MultiLevelScenario {
  id: string;
  type: import("@/types/game").SkillCategory;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  totalXP: number;
  levels: ScenarioLevel[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? "https://toolkit.rork.com";
const SECRET   = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY;

const CHAT_MODELS = [
  "anthropic/claude-haiku-4.5",
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
  "anthropic/claude-3.5-haiku",
] as const;

async function chatCompletionOnce(
  system: string,
  user: string,
  maxTokens: number,
  model: string
): Promise<string | null> {
  const url = `${BASE_URL.replace(/\/$/, "")}/v2/vercel/v1/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SECRET) headers["Authorization"] = `Bearer ${SECRET}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user   },
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[chat ${model}] HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content: unknown = data?.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return content;
    if (Array.isArray(content)) {
      const t = content
        .map((p: { type?: string; text?: string }) => (p?.type === "text" ? p.text ?? "" : ""))
        .join("");
      if (t.trim()) return t;
    }
    return null;
  } catch (e) {
    console.warn(`[chat ${model}] error:`, e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function chat(system: string, user: string, maxTokens = 1200): Promise<string | null> {
  for (const model of CHAT_MODELS) {
    const out = await chatCompletionOnce(system, user, maxTokens, model);
    if (out?.trim()) return out;
  }
  return null;
}

function extractJSON(text: string): unknown | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenced?.[1], text.match(/\{[\s\S]*\}/)?.[0], text].filter(Boolean) as string[];
  for (const c of candidates) {
    try { return JSON.parse(c.trim()); } catch { /* next */ }
  }
  return null;
}

function determineDifficulty(
  player: PlayerProfile,
  skillType: keyof PlayerProfile["skills"]
): "beginner" | "intermediate" | "advanced" {
  const s = player.skills[skillType];
  const retries = player.categoryRetries?.[skillType] ?? 0;

  if (player.difficultyPreference === "adaptive") {
    // Si el jugador ha reintentado mucho esta categoría, baja la dificultad
    // para ayudarle a aprender (a más reintentos, más fácil)
    const adjustedSkill = Math.max(0, s - retries * 5);
    if (adjustedSkill < 30) return "beginner";
    if (adjustedSkill < 65) return "intermediate";
    return "advanced";
  }

  // Incluso en dificultad fija, si ha reintentado mucho, forzamos más fácil
  if (retries >= 5 && player.difficultyPreference === "advanced") return "intermediate";
  if (retries >= 3 && player.difficultyPreference === "intermediate") return "beginner";

  return player.difficultyPreference;
}

// ── Multi-level scenario generation ───────────────────────────────────────

const TYPE_DESCRIPTIONS: Record<string, string> = {
  phishing:     "detección de phishing en emails, URLs y sitios web",
  password:     "seguridad de contraseñas y autenticación de dos factores",
  network:      "seguridad de redes, WiFi pública, VPN e intrusiones",
  malware:      "identificación y respuesta ante software malicioso",
  social:       "ingeniería social, vishing, tailgating y manipulación",
  ransomware:   "ataques de ransomware, rescate y planes de recuperación",
  iot:          "seguridad en dispositivos IoT, cámaras, sensores y smart devices",
  cloud:        "seguridad en la nube, buckets S3, IAM y configuraciones cloud",
  crypto:       "criptografía aplicada, PKI, TLS, firma digital y hashing",
  forensics:    "análisis forense digital, cadena de custodia y response",
  osint:        "inteligencia de fuentes abiertas, footprinting y OSINT",
  mobile:       "seguridad móvil, apps maliciosas y permisos en dispositivos",
  ddos:         "ataques DDoS, mitigación y disponibilidad de servicios",
  zeroday:      "vulnerabilidades zero-day, parches y divulgación responsable",
  supplychain:  "ataques a la cadena de suministro de software",
  privacy:      "privacidad de datos, GDPR, anonimización y cumplimiento",
  ai_attacks:   "ataques con IA, deepfakes, prompt injection y envenenamiento",
};

const DIFFICULTY_DESC: Record<string, string> = {
  beginner:     "principiante — señales obvias, conceptos básicos",
  intermediate: "intermedio — escenarios complejos con múltiples pistas",
  advanced:     "avanzado — análisis profundo, vectores combinados",
};

/** Genera un escenario de 5 niveles con IA. */
export async function generateMultiLevelScenario(
  type: import("@/types/game").SkillCategory,
  player: PlayerProfile
): Promise<MultiLevelScenario> {
  const difficulty = determineDifficulty(player, type);
  const xpPerLevel = difficulty === "beginner" ? 20 : difficulty === "intermediate" ? 40 : 60;

  const system = `Eres un diseñador experto de ejercicios educativos de ciberseguridad para una app móvil gamificada.
Siempre respondes con JSON válido en español, sin markdown, sin backticks, sin texto extra.`;

  const user = `Diseña un escenario educativo de ciberseguridad con EXACTAMENTE 5 niveles de progresión sobre: ${TYPE_DESCRIPTIONS[type]}.

Dificultad: ${DIFFICULTY_DESC[difficulty]}
Nivel del jugador: ${player.level}
Habilidad actual (${type}): ${player.skills[type]}%

El escenario debe contar una historia coherente donde cada nivel profundiza más.
Tipos de nivel obligatorios (en este orden):
  1 → multiple_choice  (3 opciones, una correcta)
  2 → true_false       (afirmación, el jugador decide si es verdadera o falsa)
  3 → multiple_choice  (4 opciones, mayor dificultad)
  4 → open_response    (pregunta abierta para responder en texto libre)
  5 → threat_ranking   (4 amenazas para ordenar de mayor a menor riesgo)

Devuelve SOLO este JSON:
{
  "title": "título atractivo del escenario (máx 8 palabras)",
  "description": "descripción breve (1-2 oraciones)",
  "levels": [
    {
      "levelNumber": 1,
      "type": "multiple_choice",
      "title": "título corto del nivel",
      "instruction": "instrucción corta para el jugador",
      "scenario": "texto de la situación (2-4 oraciones, realista)",
      "options": [
        { "id": "a", "text": "opción A" },
        { "id": "b", "text": "opción B" },
        { "id": "c", "text": "opción C" }
      ],
      "correctOptionId": "b",
      "explanation": "explicación educativa de la respuesta (2-3 oraciones)"
    },
    {
      "levelNumber": 2,
      "type": "true_false",
      "title": "título corto del nivel",
      "instruction": "instrucción corta para el jugador",
      "scenario": "contexto breve",
      "statement": "afirmación concreta sobre ciberseguridad relacionada al escenario",
      "isTrue": false,
      "explanation": "por qué es verdadera o falsa (2-3 oraciones)"
    },
    {
      "levelNumber": 3,
      "type": "multiple_choice",
      "title": "título corto del nivel",
      "instruction": "instrucción corta para el jugador",
      "scenario": "texto más complejo, continúa la historia",
      "options": [
        { "id": "a", "text": "..." },
        { "id": "b", "text": "..." },
        { "id": "c", "text": "..." },
        { "id": "d", "text": "..." }
      ],
      "correctOptionId": "c",
      "explanation": "explicación educativa"
    },
    {
      "levelNumber": 4,
      "type": "open_response",
      "title": "título corto del nivel",
      "instruction": "instrucción corta para el jugador",
      "scenario": "situación que requiere análisis",
      "openQuestion": "pregunta concreta que el jugador debe responder",
      "rubric": ["criterio clave 1", "criterio clave 2", "criterio clave 3", "criterio clave 4"],
      "explanation": "respuesta modelo completa (3-4 oraciones)"
    },
    {
      "levelNumber": 5,
      "type": "threat_ranking",
      "title": "título corto del nivel",
      "instruction": "instrucción corta para el jugador",
      "scenario": "situación final del escenario",
      "threats": [
        { "id": "t1", "label": "amenaza o acción A" },
        { "id": "t2", "label": "amenaza o acción B" },
        { "id": "t3", "label": "amenaza o acción C" },
        { "id": "t4", "label": "amenaza o acción D" }
      ],
      "correctOrder": ["t3", "t1", "t4", "t2"],
      "explanation": "por qué ese orden es el correcto (3-4 oraciones)"
    }
  ]
}

Asegúrate de que los 5 niveles formen una historia coherente. Sin texto extra, solo el JSON.`;

  const raw = await chat(system, user, 2500);
  const parsed = raw ? extractJSON(raw) : null;

  if (parsed && typeof parsed === "object") {
    const r = parsed as Record<string, unknown>;
    if (
      typeof r.title === "string" &&
      Array.isArray(r.levels) &&
      r.levels.length >= 3
    ) {
      const levels: ScenarioLevel[] = (r.levels as Record<string, unknown>[])
        .map((lv, idx) => buildLevel(lv, idx, xpPerLevel))
        .filter(Boolean) as ScenarioLevel[];

      if (levels.length >= 3) {
        return {
          id: `ml-${type}-${Date.now()}`,
          type,
          title: r.title as string,
          description: (r.description as string) ?? "",
          difficulty,
          totalXP: xpPerLevel * 5,
          levels,
        };
      }
    }
  }

  console.warn("[generateMultiLevelScenario] usando fallback para", type);
  return buildFallbackMultiLevel(type, difficulty, xpPerLevel);
}

function buildLevel(
  lv: Record<string, unknown>,
  idx: number,
  xpPerLevel: number
): ScenarioLevel | null {
  const levelNumber = typeof lv.levelNumber === "number" ? lv.levelNumber : idx + 1;
  const type = lv.type as LevelType;
  if (!type) return null;

  const base: ScenarioLevel = {
    levelNumber,
    type,
    title:       (lv.title as string)       ?? `Nivel ${levelNumber}`,
    instruction: (lv.instruction as string) ?? "Analiza la situación y responde.",
    scenario:    (lv.scenario as string)    ?? "",
    explanation: (lv.explanation as string) ?? "",
    xpReward: xpPerLevel,
  };

  if (type === "multiple_choice") {
    const opts = Array.isArray(lv.options)
      ? (lv.options as { id: string; text: string }[])
      : [];
    if (opts.length < 2) return null;
    base.options       = opts;
    base.correctOptionId = (lv.correctOptionId as string) ?? opts[0].id;
  }

  if (type === "true_false") {
    base.statement = (lv.statement as string) ?? "";
    base.isTrue    = typeof lv.isTrue === "boolean" ? lv.isTrue : false;
    base.options   = [
      { id: "true",  text: "Verdadero ✓" },
      { id: "false", text: "Falso ✗" },
    ];
    base.correctOptionId = base.isTrue ? "true" : "false";
  }

  if (type === "open_response") {
    base.openQuestion = (lv.openQuestion as string) ?? (lv.scenario as string) ?? "";
    base.rubric = Array.isArray(lv.rubric)
      ? (lv.rubric as string[])
      : ["Identifica el riesgo", "Propone pasos concretos", "Justifica la respuesta"];
  }

  if (type === "threat_ranking") {
    base.threats = Array.isArray(lv.threats)
      ? (lv.threats as { id: string; label: string }[])
      : [];
    base.correctOrder = Array.isArray(lv.correctOrder)
      ? (lv.correctOrder as string[])
      : base.threats?.map((t) => t.id) ?? [];
  }

  return base;
}

// ── Evaluate open response ─────────────────────────────────────────────────

export interface OpenResponseEvaluation {
  score: number;             // 0-100
  verdict: "excelente" | "bueno" | "regular" | "incorrecto";
  feedback: string;
  opinion: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  correctApproach: string;
  /** Pistas específicas generadas por IA para ayudar en el reintento. */
  retryHints?: string[];
}

export async function evaluateOpenResponse(
  scenario: string,
  question: string,
  rubric: string[],
  correctApproachHint: string,
  userText: string,
  retryCount = 0
): Promise<OpenResponseEvaluation> {
  const safe = (userText ?? "").trim();

  if (!safe) {
    return {
      score: 0,
      verdict: "incorrecto",
      feedback: "No escribiste ninguna respuesta.",
      opinion: "En mi opinión, describe paso a paso qué harías ante esta situación.",
      strengths: [],
      weaknesses: ["Respuesta vacía"],
      suggestions: ["Identifica el riesgo principal", "Propone acciones concretas", "Justifica tu decisión"],
      correctApproach: correctApproachHint,
    };
  }

  // En reintentos, sé más indulgente — el alumno está aprendiendo
  const difficultyBar = retryCount > 0
    ? `El alumno ya ha fallado ${retryCount} ${retryCount === 1 ? 'vez' : 'veces'} este mismo escenario. Sé MÁS INDULGENTE en la evaluación:
- Si la respuesta tiene al menos lógica básica, dale una puntuación ≥ ${50 + retryCount * 8}
- Valora positivamente que lo esté intentando de nuevo
- Genera SIEMPRE 3 pistas MUY ESPECÍFICAS en el campo "retryHints" que le digan exactamente QUÉ escribir (no pistas vagas, sino frases concretas que puede copiar)
- Los retryHints deben ser pasos accionables: "Menciona que...", "Explica por qué..."`
    : '';

  const system = `Eres un instructor experto en ciberseguridad evaluando la respuesta de un alumno en una app educativa.
Eres justo, pedagógico y constructivo. SIEMPRE devuelves JSON válido en español. Sin markdown, sin backticks.
${difficultyBar}`;

  const user = `Situación planteada al alumno:
${scenario}

Pregunta:
${question}

Criterios de evaluación (rúbrica):
${rubric.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Respuesta del alumno:
"""
${safe}
"""

Devuelve SOLO este JSON:
{
  "score": 0-100,
  "verdict": "excelente" | "bueno" | "regular" | "incorrecto",
  "feedback": "2-3 oraciones de retroalimentación citando lo que escribió. ${retryCount > 0 ? 'Sé positivo y motivador, destaca el progreso.' : ''}",
  "opinion": "1-2 oraciones empezando con 'En mi opinión'",
  "strengths": ["punto fuerte 1", "punto fuerte 2"],
  "weaknesses": ["punto débil 1", "punto débil 2"],
  "suggestions": ["mejora 1", "mejora 2", "mejora 3"],
  "correctApproach": "respuesta modelo en 3-4 oraciones paso a paso",
  "retryHints": ["pista MUY específica 1: qué escribir exactamente", "pista MUY específica 2: por dónde empezar", "pista MUY específica 3: concepto clave a mencionar"]
}`;

  const raw = await chat(system, user, 1200);
  const parsed = raw ? extractJSON(raw) : null;

  if (parsed && typeof parsed === "object") {
    const r = parsed as Partial<OpenResponseEvaluation> & Record<string, unknown>;
    const rawScore = typeof r.score === "number" ? r.score : Number(r.score);
    if (Number.isFinite(rawScore)) {
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const verdict =
        r.verdict === "excelente" || r.verdict === "bueno" ||
        r.verdict === "regular"   || r.verdict === "incorrecto"
          ? r.verdict
          : score >= 85 ? "excelente" : score >= 65 ? "bueno" : score >= 40 ? "regular" : "incorrecto";
      const strArr = (k: unknown): string[] =>
        Array.isArray(k)
          ? (k as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 4)
          : [];
      // Boost score ligeramente en reintentos (el alumno está aprendiendo)
      const adjustedScore = retryCount > 0 ? Math.min(100, score + retryCount * 5) : score;
      const adjustedVerdict =
        adjustedScore >= 85 ? "excelente" : adjustedScore >= 60 ? "bueno" : adjustedScore >= 35 ? "regular" : "incorrecto";
      return {
        score: adjustedScore,
        verdict: adjustedVerdict,
        feedback:        typeof r.feedback        === "string" ? r.feedback        : "Evaluación completada.",
        opinion:         typeof r.opinion          === "string" ? r.opinion         : "En mi opinión, sigue practicando.",
        strengths:       strArr(r.strengths),
        weaknesses:      strArr(r.weaknesses),
        suggestions:     strArr(r.suggestions),
        correctApproach: typeof r.correctApproach === "string" ? r.correctApproach : correctApproachHint,
        retryHints:      strArr(r.retryHints),
      };
    }
  }

  // Heurística local — más indulgente en reintentos
  const lower = safe.toLowerCase();
  const hits = rubric.filter((r) =>
    r.toLowerCase().split(/\s+/).some((w) => w.length > 4 && lower.includes(w))
  ).length;
  const baseScore = Math.min(100, Math.round((hits / Math.max(rubric.length, 1)) * 80) + (safe.length > 80 ? 10 : 0));
  // Boost por reintento: +5 por cada reintento (más fácil)
  const score = Math.min(100, baseScore + retryCount * 5);
  const localRetryHints = retryCount > 0
    ? [
        `Menciona específicamente la amenaza principal en el escenario: "${scenario.slice(0, 60)}..."`,
        'Describe paso a paso las acciones concretas que tomarías, no solo nombres de conceptos.',
        'Justifica cada decisión explicando POR QUÉ es la mejor opción frente a otras alternativas.',
      ]
    : undefined;
  return {
    score,
    verdict: score >= 70 ? "bueno" : score >= 40 ? "regular" : "incorrecto",
    feedback: `Evaluación local: detectamos ${hits} de ${rubric.length} criterios en tu respuesta.${retryCount > 0 ? ' ¡Sigue intentándolo!' : ''}`,
    opinion: "En mi opinión, intenta ser más específico en cada paso.",
    strengths: hits > 0 ? ["Mencionaste algunos puntos clave"] : [],
    weaknesses: hits < rubric.length ? ["Faltan conceptos importantes"] : [],
    suggestions: ["Sé más específico", "Menciona pasos concretos", "Justifica cada decisión"],
    correctApproach: correctApproachHint,
    retryHints: localRetryHints,
  };
}

// ── Evaluate threat ranking ────────────────────────────────────────────────

export interface RankingEvaluation {
  score: number;
  feedback: string;
  correctOrder: string[];
  explanation: string;
}

export function evaluateThreatRanking(
  userOrder: string[],
  correctOrder: string[],
  explanation: string
): RankingEvaluation {
  if (!userOrder.length || !correctOrder.length) {
    return { score: 0, feedback: "No ordenaste las amenazas.", correctOrder, explanation };
  }

  // Score by position match (partial credit)
  let matches = 0;
  for (let i = 0; i < correctOrder.length; i++) {
    if (userOrder[i] === correctOrder[i]) matches++;
  }
  const score = Math.round((matches / correctOrder.length) * 100);

  const feedback =
    score === 100
      ? "¡Perfecto! Ordenaste las amenazas exactamente como el análisis de riesgo lo indica."
      : score >= 75
      ? `Muy bien, ${matches} de ${correctOrder.length} amenazas en la posición correcta.`
      : score >= 50
      ? `Parcialmente correcto: ${matches} de ${correctOrder.length} amenazas bien ubicadas. Revisa la explicación.`
      : "Necesitas repasar la jerarquía de riesgos. Estudia la explicación con cuidado.";

  return { score, feedback, correctOrder, explanation };
}

// ── Fallback multi-level scenario ──────────────────────────────────────────

function buildFallbackMultiLevel(
  type: import("@/types/game").SkillCategory,
  difficulty: "beginner" | "intermediate" | "advanced",
  xpPerLevel: number
): MultiLevelScenario {
  const fallbacks: Record<string, MultiLevelScenario> = {
    phishing: {
      id: `fallback-phishing-${Date.now()}`,
      type: "phishing",
      title: "La trampa del banco falso",
      description: "Aprende a detectar correos y sitios de phishing bancario paso a paso.",
      difficulty,
      totalXP: xpPerLevel * 5,
      levels: [
        {
          levelNumber: 1, type: "multiple_choice",
          title: "Correo urgente del banco",
          instruction: "Lee el correo y elige la acción correcta.",
          scenario: "Recibes un email de 'soporte@banc0-seguro.com' diciendo que tu cuenta se bloqueará en 24h. El logo luce correcto pero el dominio tiene un cero en lugar de la 'o'.",
          options: [
            { id: "a", text: "Hago clic en el enlace y verifico mis datos" },
            { id: "b", text: "Entro al banco desde la URL oficial sin usar el enlace" },
            { id: "c", text: "Respondo el correo pidiendo más información" },
          ],
          correctOptionId: "b",
          explanation: "El dominio falsificado (banc0 con cero) es señal clara de phishing. Nunca uses enlaces de correos sospechosos.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 2, type: "true_false",
          title: "¿Verdad o mito?",
          instruction: "Decide si la afirmación es verdadera o falsa.",
          scenario: "Sigues investigando el email sospechoso.",
          statement: "Si el logotipo de un correo se ve idéntico al oficial, el correo es legítimo.",
          isTrue: false,
          options: [{ id: "true", text: "Verdadero ✓" }, { id: "false", text: "Falso ✗" }],
          correctOptionId: "false",
          explanation: "Los atacantes copian logotipos con facilidad. El único indicador confiable es el dominio real del remitente, no el aspecto visual.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 3, type: "multiple_choice",
          title: "El sitio de verificación",
          instruction: "Analiza la URL y decide qué hacer.",
          scenario: "El enlace del correo lleva a 'https://banco-seguro-verificacion.com/login?token=X'. El candado verde aparece en el navegador y el diseño luce idéntico al banco real.",
          options: [
            { id: "a", text: "Es seguro porque tiene candado HTTPS" },
            { id: "b", text: "Ingreso mis datos, el diseño es idéntico" },
            { id: "c", text: "Cierro la pestaña y reporto el correo" },
            { id: "d", text: "Solo ingreso mi usuario, no la contraseña" },
          ],
          correctOptionId: "c",
          explanation: "HTTPS solo cifra la conexión, no garantiza que el sitio sea legítimo. Dominios como 'banco-seguro-verificacion.com' no pertenecen al banco. Cierra y reporta.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 4, type: "open_response",
          title: "Reporta el incidente",
          instruction: "Describe cómo reportarías este intento de phishing a tu empresa.",
          scenario: "Confirmaste que el correo es phishing. Tu empresa tiene un equipo de seguridad. ¿Qué pasos sigues para reportarlo correctamente?",
          openQuestion: "Describe paso a paso cómo reportarías este correo de phishing y qué información incluirías.",
          rubric: [
            "No hacer clic ni reenviar el correo",
            "Reportar al equipo de seguridad / IT",
            "Guardar evidencia: encabezados, remitente, URL",
            "Alertar a compañeros si el correo llegó masivamente",
          ],
          explanation: "El proceso correcto: no clicar, no reenviar como adjunto (riesgo de activar macros), usar la función 'reportar phishing' del cliente de correo o enviar los encabezados completos a seguridad@empresa.com. Documentar hora, remitente y URL.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 5, type: "threat_ranking",
          title: "Jerarquía de riesgos",
          instruction: "Ordena estas situaciones de mayor a menor riesgo.",
          scenario: "Has aprendido varias señales de phishing. Ahora ordena estas acciones del mayor al menor riesgo real.",
          threats: [
            { id: "t1", label: "Ingresar usuario y contraseña en el sitio falso" },
            { id: "t2", label: "Abrir el correo sin hacer clic en ningún enlace" },
            { id: "t3", label: "Descargar y ejecutar el adjunto .pdf.exe del correo" },
            { id: "t4", label: "Hacer clic en el enlace pero cerrar antes de ingresar datos" },
          ],
          correctOrder: ["t3", "t1", "t4", "t2"],
          explanation: "El adjunto ejecutable es el riesgo más alto (instala malware). Ingresar credenciales es el segundo (robo de cuenta). Clicar sin ingresar datos puede activar exploits de navegador. Solo abrir el correo es el menor riesgo en clientes modernos.",
          xpReward: xpPerLevel,
        },
      ],
    },
    password: {
      id: `fallback-password-${Date.now()}`,
      type: "password",
      title: "La fortaleza de tus claves",
      description: "Domina la seguridad de contraseñas y autenticación multifactor.",
      difficulty,
      totalXP: xpPerLevel * 5,
      levels: [
        {
          levelNumber: 1, type: "multiple_choice",
          title: "Contraseña reutilizada",
          instruction: "Elige la mejor recomendación.",
          scenario: "Tu compañero usa 'Verano2024!' en su correo, su banco y la red corporativa. Dice que es fuerte porque tiene mayúsculas, número y símbolo.",
          options: [
            { id: "a", text: "Está bien, la contraseña es robusta" },
            { id: "b", text: "Usa un gestor de contraseñas y una diferente por sitio, con 2FA" },
            { id: "c", text: "Agrega su año de nacimiento al final" },
          ],
          correctOptionId: "b",
          explanation: "La fortaleza no importa si se reutiliza. Una sola filtración compromete todas las cuentas. El gestor de contraseñas resuelve esto y el 2FA agrega una capa extra.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 2, type: "true_false",
          title: "¿Mito de seguridad?",
          instruction: "¿Es verdadera o falsa esta afirmación?",
          scenario: "Sigues asesorando a tu compañero sobre contraseñas.",
          statement: "Cambiar una contraseña añadiendo un número al final cada mes (ej: Pass1, Pass2, Pass3) es una práctica de seguridad efectiva.",
          isTrue: false,
          options: [{ id: "true", text: "Verdadero ✓" }, { id: "false", text: "Falso ✗" }],
          correctOptionId: "false",
          explanation: "Los atacantes que obtienen una contraseña antigua prueban variaciones numéricas automáticamente. Los cambios predecibles dan falsa sensación de seguridad.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 3, type: "multiple_choice",
          title: "Autenticación comprometida",
          instruction: "Elige la respuesta correcta ante esta situación.",
          scenario: "Recibes un SMS con un código 2FA que no pediste. Al mismo tiempo, alguien intenta iniciar sesión en tu cuenta bancaria desde otro país. ¿Qué haces primero?",
          options: [
            { id: "a", text: "Ingresar el código en el banco para ver qué pasa" },
            { id: "b", text: "Compartir el código con quien lo pida por teléfono" },
            { id: "c", text: "NO compartir el código y cambiar la contraseña ahora mismo" },
            { id: "d", text: "Esperar a que el intento falle solo" },
          ],
          correctOptionId: "c",
          explanation: "Un código 2FA no solicitado indica que alguien ya tiene tu contraseña. Cambia la contraseña inmediatamente y reporta al banco. Nunca compartas el código.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 4, type: "open_response",
          title: "Plan de contraseñas",
          instruction: "Diseña un plan de seguridad de contraseñas.",
          scenario: "Tu empresa no tiene política de contraseñas. El CEO te pide que redactes los lineamientos mínimos para los 50 empleados.",
          openQuestion: "¿Qué reglas mínimas incluirías en la política de contraseñas? Explica cada una.",
          rubric: [
            "Longitud mínima de 12+ caracteres",
            "Prohibir reutilización entre servicios",
            "Obligar uso de gestor de contraseñas",
            "Activar 2FA en todos los sistemas críticos",
          ],
          explanation: "Una política robusta incluye: mínimo 12 caracteres con variedad de tipos, contraseñas únicas por servicio (gestor corporativo como 1Password Teams o Bitwarden Business), 2FA obligatorio en correo y sistemas críticos, y revisión periódica con HaveIBeenPwned.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 5, type: "threat_ranking",
          title: "Riesgos de autenticación",
          instruction: "Ordena estos escenarios del mayor al menor riesgo.",
          scenario: "Evalúa estos cuatro vectores de ataque a contraseñas.",
          threats: [
            { id: "t1", label: "Contraseña de 8 chars reutilizada en 10 sitios" },
            { id: "t2", label: "Contraseña fuerte única pero sin 2FA" },
            { id: "t3", label: "Contraseña en nota adhesiva en el monitor" },
            { id: "t4", label: "Contraseña fuerte con 2FA de app autenticadora" },
          ],
          correctOrder: ["t1", "t3", "t2", "t4"],
          explanation: "La reutilización es el mayor riesgo sistémico: una sola filtración de datos expone todas las cuentas. La nota adhesiva es grave pero solo para acceso físico. Sin 2FA hay exposición ante robo de contraseña. Con 2FA de app el riesgo es mínimo.",
          xpReward: xpPerLevel,
        },
      ],
    },
    network: {
      id: `fallback-network-${Date.now()}`,
      type: "network",
      title: "La red trampa",
      description: "Aprende a protegerte en redes públicas y corporativas.",
      difficulty,
      totalXP: xpPerLevel * 5,
      levels: [
        {
          levelNumber: 1, type: "multiple_choice",
          title: "WiFi del café",
          instruction: "Elige la acción más segura.",
          scenario: "Estás en una cafetería y ves dos redes: 'Cafe_Free_WiFi' (abierta) y 'Cafe-Guest' (con contraseña del local). Debes revisar tu correo corporativo.",
          options: [
            { id: "a", text: "Cafe_Free_WiFi, total es solo correo" },
            { id: "b", text: "Datos móviles o WiFi del local + VPN corporativa" },
            { id: "c", text: "Apago WiFi y uso Bluetooth" },
          ],
          correctOptionId: "b",
          explanation: "Las redes abiertas pueden ser 'evil twin'. Lo correcto es datos móviles o, si usas WiFi, siempre con VPN para cifrar el tráfico.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 2, type: "true_false",
          title: "¿VPN = magia?",
          instruction: "¿Es verdadera o falsa esta afirmación?",
          scenario: "Tu colega afirma que con VPN puede conectarse a cualquier red sin riesgo.",
          statement: "Usar una VPN en WiFi pública elimina completamente cualquier riesgo de seguridad.",
          isTrue: false,
          options: [{ id: "true", text: "Verdadero ✓" }, { id: "false", text: "Falso ✗" }],
          correctOptionId: "false",
          explanation: "La VPN cifra el tráfico pero no protege contra malware en el dispositivo, DNS leaks, o endpoints comprometidos. Reduce el riesgo considerablemente pero no lo elimina.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 3, type: "multiple_choice",
          title: "Intruso en la red",
          instruction: "Analiza el escenario y responde.",
          scenario: "El IDS corporativo alerta: un dispositivo desconocido (MAC: 00:1A:2B:3C) está enviando paquetes ARP Reply masivos en la red interna. Tus compañeros reportan redirecciones extrañas al navegar.",
          options: [
            { id: "a", text: "Reiniciar el router y esperar que se resuelva" },
            { id: "b", text: "Ignorar, probablemente es un falso positivo del IDS" },
            { id: "c", text: "Aislar el dispositivo, alertar a seguridad y analizar capturas de tráfico" },
            { id: "d", text: "Bloquear solo el sitio al que redirige" },
          ],
          correctOptionId: "c",
          explanation: "Los ARP Replies masivos + redirecciones = ataque ARP Spoofing / Man-in-the-Middle activo. Hay que aislar el dispositivo intruso, capturar tráfico para forense y escalar a seguridad.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 4, type: "open_response",
          title: "Auditoría de red",
          instruction: "Describe qué harías al auditar la red de una sucursal.",
          scenario: "Llegas a una sucursal nueva. El router usa credenciales por defecto, WPS habilitado, y la red de pagos comparte VLAN con la WiFi de clientes.",
          openQuestion: "Lista los riesgos específicos y las acciones inmediatas que tomarías para asegurar esta red.",
          rubric: [
            "Cambiar credenciales por defecto del router",
            "Deshabilitar WPS (vulnerable a fuerza bruta)",
            "Segmentar la red de pagos en VLAN separada",
            "Actualizar firmware del router",
          ],
          explanation: "Acciones inmediatas: cambiar usuario/contraseña del router admin, deshabilitar WPS, crear VLAN separada para POS/pagos, actualizar firmware, habilitar logging, y documentar la topología para auditorías futuras.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 5, type: "threat_ranking",
          title: "Vectores de ataque en red",
          instruction: "Ordena del mayor al menor riesgo.",
          scenario: "Evalúa estos cuatro vectores de ataque a redes.",
          threats: [
            { id: "t1", label: "ARP Spoofing activo interceptando tráfico de pagos" },
            { id: "t2", label: "Router con contraseña por defecto en sucursal" },
            { id: "t3", label: "Empleado conectado a WiFi pública sin VPN" },
            { id: "t4", label: "Red de invitados en la misma VLAN que sistemas internos" },
          ],
          correctOrder: ["t1", "t4", "t2", "t3"],
          explanation: "El ARP Spoofing activo en pagos es riesgo crítico e inmediato. La VLAN compartida expone sistemas internos a cualquier invitado. El router con credenciales por defecto es puerta de entrada total. El empleado sin VPN en pública es el menor aunque también serio.",
          xpReward: xpPerLevel,
        },
      ],
    },
    malware: {
      id: `fallback-malware-${Date.now()}`,
      type: "malware",
      title: "Código en las sombras",
      description: "Detecta y responde ante software malicioso en escenarios reales.",
      difficulty,
      totalXP: xpPerLevel * 5,
      levels: [
        {
          levelNumber: 1, type: "multiple_choice",
          title: "Adjunto sospechoso",
          instruction: "Decide qué hacer con este archivo.",
          scenario: "Recibes un correo de un cliente conocido con adjunto 'Factura_Octubre.pdf.exe'. No esperabas ninguna factura.",
          options: [
            { id: "a", text: "Lo abro porque el remitente es conocido" },
            { id: "b", text: "Lo escaneo con antivirus antes de abrirlo" },
            { id: "c", text: "Reporto al equipo de seguridad y confirmo con el cliente por otro canal" },
          ],
          correctOptionId: "c",
          explanation: "La doble extensión .pdf.exe es señal clásica de malware. El cliente puede tener su cuenta comprometida. Reporta y verifica por teléfono u otro canal antes de abrir.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 2, type: "true_false",
          title: "Antivirus vs. Malware",
          instruction: "¿Es verdadera o falsa esta afirmación?",
          scenario: "Tu empresa instaló un antivirus actualizado en todos los equipos.",
          statement: "Un antivirus actualizado puede detectar y bloquear el 100% de los ataques de malware.",
          isTrue: false,
          options: [{ id: "true", text: "Verdadero ✓" }, { id: "false", text: "Falso ✗" }],
          correctOptionId: "false",
          explanation: "Los antivirus basados en firmas no detectan malware zero-day ni técnicas de ofuscación avanzadas. Son una capa de defensa, no una solución completa. Se complementan con EDR, análisis de comportamiento y educación.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 3, type: "multiple_choice",
          title: "Ransomware activo",
          instruction: "Reacciona correctamente al incidente.",
          scenario: "Tu pantalla muestra: '¡Tus archivos han sido cifrados! Paga 2 BTC en 48h o los perderás.' Varios compañeros reportan lo mismo. ¿Cuál es tu primera acción?",
          options: [
            { id: "a", text: "Pagar el rescate para recuperar los archivos rápido" },
            { id: "b", text: "Desconectar el equipo de la red inmediatamente y alertar al equipo de seguridad" },
            { id: "c", text: "Reiniciar el equipo con la esperanza de que se elimine" },
            { id: "d", text: "Continuar trabajando en otros archivos mientras investigas" },
          ],
          correctOptionId: "b",
          explanation: "La desconexión inmediata de red es crítica para evitar la propagación lateral. El pago no garantiza recuperación y financia a los atacantes. El equipo de seguridad coordinará la respuesta al incidente y evaluará backups.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 4, type: "open_response",
          title: "Plan de respuesta",
          instruction: "Diseña un plan de respuesta ante ransomware.",
          scenario: "Eres el responsable de seguridad. El ransomware cifró 3 servidores de archivos. Tienes backups de hace 24h. El CEO pregunta qué hacer.",
          openQuestion: "Describe el plan de respuesta al incidente paso a paso, en orden de prioridad.",
          rubric: [
            "Aislar sistemas afectados de la red",
            "Identificar el vector de entrada para contenerlo",
            "Evaluar alcance y sistemas comprometidos",
            "Restaurar desde backups limpios verificados",
          ],
          explanation: "Plan correcto: 1) Aislar (desconectar de red, no apagar). 2) Activar equipo de respuesta y notificar a dirección. 3) Identificar patient zero y vector. 4) Preservar evidencia forense. 5) Evaluar alcance completo. 6) Restaurar desde backups verificados (confirmar que no estén también cifrados). 7) Parchear la vulnerabilidad de entrada. 8) Comunicación a partes afectadas si aplica.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 5, type: "threat_ranking",
          title: "Vectores de infección",
          instruction: "Ordena estos vectores de mayor a menor probabilidad de éxito.",
          scenario: "Evalúa estos cuatro vectores de infección por malware en una empresa típica.",
          threats: [
            { id: "t1", label: "Phishing email con macro de Office habilitada por el usuario" },
            { id: "t2", label: "USB encontrado en estacionamiento conectado por curiosidad" },
            { id: "t3", label: "Exploit de vulnerabilidad parcheada hace 3 meses" },
            { id: "t4", label: "Descarga de software pirata en equipo corporativo" },
          ],
          correctOrder: ["t1", "t2", "t4", "t3"],
          explanation: "El phishing con macro es el vector #1 de infección empresarial por volumen y efectividad. El USB baiting (técnica de Stuxnet) sigue siendo altamente efectivo por curiosidad humana. El software pirata contiene instaladores troyanizados frecuentemente. Los exploits de vulnerabilidades ya parcheadas tienen menor alcance si los parches se aplican.",
          xpReward: xpPerLevel,
        },
      ],
    },
    social: {
      id: `fallback-social-${Date.now()}`,
      type: "social",
      title: "El factor humano",
      description: "Aprende a reconocer y resistir la manipulación psicológica.",
      difficulty,
      totalXP: xpPerLevel * 5,
      levels: [
        {
          levelNumber: 1, type: "multiple_choice",
          title: "Llamada del falso soporte",
          instruction: "¿Cómo reaccionas a esta llamada?",
          scenario: "Te llama alguien muy amable diciendo ser de soporte IT. Afirma que detectó actividad sospechosa en tu cuenta y necesita tu contraseña para 'bloquearla rápido'.",
          options: [
            { id: "a", text: "Le doy la contraseña, suena profesional" },
            { id: "b", text: "Cuelgo y llamo al número oficial de IT para verificar" },
            { id: "c", text: "Le doy solo la primera parte de la contraseña" },
          ],
          correctOptionId: "b",
          explanation: "IT nunca pide contraseñas por teléfono. La urgencia y autoridad son técnicas de ingeniería social. Cuelga siempre y verifica por canal oficial.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 2, type: "true_false",
          title: "Psicología del atacante",
          instruction: "¿Es verdadera o falsa esta afirmación?",
          scenario: "Estudiando ingeniería social con tu equipo.",
          statement: "Los ataques de ingeniería social siempre requieren conocimientos técnicos avanzados de informática.",
          isTrue: false,
          options: [{ id: "true", text: "Verdadero ✓" }, { id: "false", text: "Falso ✗" }],
          correctOptionId: "false",
          explanation: "La ingeniería social explota psicología humana (confianza, miedo, autoridad, reciprocidad), no vulnerabilidades técnicas. Es por eso que es efectiva incluso contra organizaciones con sistemas muy seguros.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 3, type: "multiple_choice",
          title: "CEO Fraud en WhatsApp",
          instruction: "Evalúa este mensaje y actúa correctamente.",
          scenario: "Trabajas en finanzas. Recibes WhatsApp de número desconocido: 'Soy el Director, perdí mi celular. Necesito que transfieras $25,000 a esta cuenta YA para cerrar un trato. No comentes con nadie del equipo.'",
          options: [
            { id: "a", text: "Realizo la transferencia, el director tiene autoridad" },
            { id: "b", text: "Verifico llamando al número conocido del director antes de cualquier acción" },
            { id: "c", text: "Solicito que me mande un correo oficial para proceder" },
            { id: "d", text: "Transfiero la mitad por si acaso es urgente" },
          ],
          correctOptionId: "b",
          explanation: "Urgencia + secrecía + número desconocido = fraude del CEO clásico. Verifica siempre por el canal conocido antes de cualquier transferencia. La solicitud de secrecía es la mayor bandera roja.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 4, type: "open_response",
          title: "Protocolo anti-ingeniería social",
          instruction: "Diseña protocolos para proteger a tu equipo.",
          scenario: "Tu empresa sufrió tres intentos de ingeniería social en un mes: dos vishing y un pretexting físico. Debes proponer medidas concretas.",
          openQuestion: "¿Qué protocolos y controles implementarías para reducir la vulnerabilidad ante ingeniería social?",
          rubric: [
            "Capacitación y simulacros periódicos",
            "Protocolo de verificación de identidad por voz",
            "Política de nunca compartir credenciales por teléfono",
            "Canal oficial de reporte de incidentes sospechosos",
          ],
          explanation: "Medidas efectivas: entrenamiento mensual con simulacros de vishing/phishing, protocolo de 'call-back' para solicitudes por teléfono (colgar y llamar al número conocido), política escrita de no-credenciales-por-teléfono, canal anónimo de reporte, y cultura de 'está bien decir no' sin miedo a repercusiones.",
          xpReward: xpPerLevel,
        },
        {
          levelNumber: 5, type: "threat_ranking",
          title: "Vectores de manipulación",
          instruction: "Ordena estos ataques de mayor a menor riesgo para una empresa.",
          scenario: "Evalúa estos cuatro vectores de ingeniería social.",
          threats: [
            { id: "t1", label: "Vishing a empleado de finanzas para transferencia urgente" },
            { id: "t2", label: "Atacante que sigue a empleado para entrar a la oficina (tailgating)" },
            { id: "t3", label: "Email de phishing spear-phishing personalizado al CEO" },
            { id: "t4", label: "USB con etiqueta 'Nómina' dejado en la entrada" },
          ],
          correctOrder: ["t3", "t1", "t4", "t2"],
          explanation: "El spear-phishing al CEO (whaling) tiene el mayor impacto potencial por el nivel de acceso. El vishing financiero genera pérdidas directas e inmediatas. El USB baiting puede instalar malware persistente. El tailgating da acceso físico pero requiere más pasos para causar daño crítico.",
          xpReward: xpPerLevel,
        },
      ],
    },
  };

  return fallbacks[type] ?? fallbacks.phishing;
}

// ── Legacy single-scenario support (for backward compatibility) ────────────

/**
 * Genera un escenario de respuesta escrita (open_response) donde el jugador
 * escribe su análisis y la IA lo evalúa.
 * La dificultad aumenta según los reintentos acumulados en cada categoría.
 */
export async function generateAdaptiveScenario(
  type: import("@/types/game").SkillCategory,
  player: PlayerProfile
): Promise<Scenario> {
  const difficulty = determineDifficulty(player, type);
  const retries = player.categoryRetries?.[type] ?? 0;
  const xpReward = difficulty === "beginner" ? 30 : difficulty === "intermediate" ? 55 : 85;
  // Bonus de XP cuando hay reintentos: desafío más difícil = más recompensa
  const retryBonus = retries * 5;
  const totalXP = xpReward + retryBonus;

  const system = `Eres un creador de ejercicios educativos de ciberseguridad. Generas escenarios realistas para una app móvil gamificada donde el jugador ESCRIBE su respuesta y la IA la corrige.
Respondes SIEMPRE con JSON válido en español, sin markdown, sin backticks.`;

  const user = `Genera un escenario educativo de RESPUESTA ESCRITA sobre: ${TYPE_DESCRIPTIONS[type]}.

Dificultad: ${DIFFICULTY_DESC[difficulty]}
Nivel jugador: ${player.level} | Habilidad: ${player.skills[type]}% | Reintentos en esta categoría: ${retries}
${retries > 0 ? `IMPORTANTE: El jugador ya ha intentado esta categoría ${retries} veces. Haz el escenario NOTABLEMENTE más difícil: escenarios más sutiles, señales menos obvias, requiere análisis más profundo y pensamiento lateral.` : ''}

El jugador deberá ESCRIBIR su análisis con sus propias palabras. NO hay opciones múltiples. La pregunta debe ser concreta y desafiante.

Devuelve SOLO este JSON:
{
  "title": "título atractivo (máx 8 palabras)",
  "description": "descripción breve (1-2 oraciones)",
  "scenario": "texto de la situación (2-4 oraciones, realista y concreto)",
  "openQuestion": "pregunta concreta que el jugador debe responder por escrito",
  "rubric": ["criterio clave 1", "criterio clave 2", "criterio clave 3", "criterio clave 4"],
  "explanation": "respuesta modelo completa (3-5 oraciones, la explicación ideal paso a paso)",
  "hints": ["pista 1", "pista 2"]
}`;

  const raw = await chat(system, user);
  const parsed = raw ? extractJSON(raw) : null;

  if (parsed && typeof parsed === "object") {
    const r = parsed as Record<string, unknown>;
    if (
      typeof r.title === "string" &&
      typeof r.scenario === "string" &&
      typeof r.openQuestion === "string"
    ) {
      return {
        id: `ai-${type}-${Date.now()}`,
        type,
        title: r.title,
        description: (r.description as string) ?? "",
        difficulty,
        xpReward: totalXP,
        content: {
          mode: "open_response",
          scenario: r.scenario as string,
          openQuestion: r.openQuestion as string,
          rubric: Array.isArray(r.rubric) ? (r.rubric as string[]) : ["Identifica el riesgo", "Propone acciones concretas", "Justifica tu respuesta", "Considera el impacto"],
          explanation: (r.explanation as string) ?? "Analiza la situación cuidadosamente y aplica las mejores prácticas de ciberseguridad.",
        },
        hints: Array.isArray(r.hints) ? (r.hints as string[]) : ["Analiza cada detalle", "Piensa en el principio de menor privilegio"],
      };
    }
  }

  return getFallbackScenario(type, difficulty, totalXP);
}

function getFallbackScenario(
  type: import("@/types/game").SkillCategory,
  difficulty: "beginner" | "intermediate" | "advanced",
  xpReward: number
): Scenario {
  const f = FALLBACK_SINGLE[type] ?? FALLBACK_SINGLE.phishing;
  // Convertir el escenario legacy de opción múltiple a respuesta escrita
  const rubric = [
    "Identifica correctamente la amenaza o riesgo principal",
    "Propone acciones concretas y viables",
    "Justifica cada paso con criterio técnico",
    "Considera el impacto en usuarios, sistemas y datos",
  ];
  return {
    id: `fallback-${type}-${Date.now()}`,
    type,
    title: f.title,
    description: f.description,
    difficulty,
    xpReward,
    content: {
      mode: "open_response",
      scenario: f.scenario,
      openQuestion: `Analiza esta situación de ${TYPE_DESCRIPTIONS[type] ?? type}. ¿Qué harías paso a paso? ¿Por qué?`,
      rubric,
      explanation: f.explanation,
    },
    hints: f.hints,
  };
}

const FALLBACK_SINGLE: Record<
  import("@/types/game").SkillCategory,
  { title: string; description: string; scenario: string; options: { id: string; text: string }[]; correctOptionId: string; explanation: string; hints: string[] }
> = {
  phishing: {
    title: "Email sospechoso del banco",
    description: "Recibes un correo urgente que pide tus credenciales",
    scenario: "Llega un email de 'soporte@banc0-seguro.com' diciendo que tu cuenta será bloqueada en 24h si no verificas tus datos haciendo clic en un enlace. El logo se ve correcto pero el dominio tiene un cero en lugar de la letra o.",
    options: [
      { id: "a", text: "Hago clic en el enlace y verifico mis datos rápido" },
      { id: "b", text: "Ignoro el email y entro al banco escribiendo la URL oficial" },
      { id: "c", text: "Respondo el correo pidiendo más información" },
    ],
    correctOptionId: "b",
    explanation: "El dominio falsificado (banc0 con cero) es señal clara de phishing. Nunca uses enlaces de correos sospechosos.",
    hints: ["Mira el dominio del remitente con lupa", "La urgencia es una táctica común de phishing"],
  },
  password: {
    title: "Reutilizar contraseña",
    description: "Tu compañero te pide consejo sobre contraseñas",
    scenario: "Un compañero usa la misma contraseña 'Verano2024!' en su correo personal, su banco y la red de la empresa.",
    options: [
      { id: "a", text: "Está bien, la contraseña es robusta" },
      { id: "b", text: "Usa un gestor de contraseñas y una diferente por sitio, con 2FA" },
      { id: "c", text: "Que le agregue su año de nacimiento al final" },
    ],
    correctOptionId: "b",
    explanation: "Reutilizar contraseñas es el principal riesgo: si una se filtra, todas las cuentas caen.",
    hints: ["El problema no es la fuerza, es la reutilización", "Piensa en el efecto dominó de una filtración"],
  },
  network: {
    title: "WiFi pública en cafetería",
    description: "Necesitas conectarte fuera de la oficina",
    scenario: "Estás en una cafetería y ves dos redes: 'Cafe_Free_WiFi' (abierta) y 'Cafe-Guest' (con contraseña). Necesitas revisar correo corporativo.",
    options: [
      { id: "a", text: "Me conecto a Cafe_Free_WiFi, total es solo correo" },
      { id: "b", text: "Uso datos móviles o me conecto con la red del local + VPN corporativa" },
      { id: "c", text: "Apago el WiFi y uso Bluetooth" },
    ],
    correctOptionId: "b",
    explanation: "Redes abiertas pueden ser 'evil twin'. Siempre usa VPN en WiFi pública.",
    hints: ["Las redes abiertas son fáciles de suplantar", "Una VPN cifra todo tu tráfico"],
  },
  malware: {
    title: "Archivo adjunto inesperado",
    description: "Un cliente envía una factura por correo",
    scenario: "Recibes un correo de un cliente real con adjunto 'Factura_Octubre.pdf.exe'. No esperabas ninguna factura.",
    options: [
      { id: "a", text: "Lo abro porque el remitente es conocido" },
      { id: "b", text: "Lo descargo y escaneo con el antivirus" },
      { id: "c", text: "Reporto al equipo de seguridad y confirmo con el cliente por otro medio" },
    ],
    correctOptionId: "c",
    explanation: "La doble extensión .pdf.exe es señal clásica de malware. Verifica siempre por un canal alternativo.",
    hints: ["Fíjate en la extensión real del archivo", "Verifica siempre por un segundo canal"],
  },
  social: {
    title: "Llamada del 'soporte técnico'",
    description: "Alguien te llama urgente diciendo ser de IT",
    scenario: "Te llama alguien diciendo ser de IT. Necesita tu contraseña para 'bloquear tu cuenta'. Insiste en que es urgente.",
    options: [
      { id: "a", text: "Le doy la contraseña, suena profesional" },
      { id: "b", text: "Cuelgo y llamo yo mismo al número oficial de IT para verificar" },
      { id: "c", text: "Le doy solo la primera parte de la contraseña" },
    ],
    correctOptionId: "b",
    explanation: "IT nunca te pedirá tu contraseña por teléfono. Cuelga y verifica por canal oficial.",
    hints: ["La urgencia es una bandera roja", "Nadie legítimo necesita tu contraseña"],
  },
  ransomware: {
    title: "Pantalla de rescate inesperada",
    description: "Tus archivos aparecen cifrados con un mensaje de rescate",
    scenario: "Llegas a la oficina y tu pantalla muestra: 'Todos tus archivos han sido cifrados. Paga 2 BTC en 48h o los perderás para siempre.' Varios compañeros reportan lo mismo.",
    options: [
      { id: "a", text: "Pago el rescate inmediatamente para recuperar los archivos" },
      { id: "b", text: "Desconecto el equipo de la red, no apago, y alerto al equipo de seguridad" },
      { id: "c", text: "Reinicio la computadora para ver si se arregla" },
    ],
    correctOptionId: "b",
    explanation: "Desconectar de la red evita propagación. No apagar preserva evidencia forense. Pagar no garantiza recuperación y financia a los atacantes.",
    hints: ["Desconectar, no apagar", "Los backups son tu mejor defensa"],
  },
  iot: {
    title: "Cámara de seguridad hackeada",
    description: "Una cámara IP en la oficina se comporta de forma extraña",
    scenario: "Notas que la cámara IP de la entrada se mueve sola siguiendo a los empleados. Al revisar, descubres que aún usa la contraseña 'admin/admin' de fábrica.",
    options: [
      { id: "a", text: "La apago y ya, no es crítica" },
      { id: "b", text: "Cambio credenciales, actualizo firmware y la aíslo en una VLAN separada" },
      { id: "c", text: "La dejo funcionando, total solo mira la entrada" },
    ],
    correctOptionId: "b",
    explanation: "Los dispositivos IoT son vectores de entrada comunes. Deben tener credenciales únicas, firmware actualizado y estar segmentados de la red principal.",
    hints: ["Los dispositivos IoT son puertas traseras", "Credenciales de fábrica = regalo para atacantes"],
  },
  cloud: {
    title: "Bucket S3 expuesto",
    description: "Archivos confidenciales de la empresa aparecen indexados en Google",
    scenario: "Un colega encuentra facturas, contratos y bases de datos de clientes de tu empresa indexadas en Google. Provienen de un bucket S3 configurado como público sin querer.",
    options: [
      { id: "a", text: "Cierro el bucket inmediatamente y notifico al equipo de seguridad" },
      { id: "b", text: "No es urgente, lo reviso la próxima semana" },
      { id: "c", text: "Elimino los archivos y espero que nadie los haya descargado" },
    ],
    correctOptionId: "a",
    explanation: "Un bucket público expone datos a todo internet. Hay que cerrarlo, evaluar el alcance de la filtración, notificar a afectados y documentar el incidente.",
    hints: ["Cloud != automáticamente seguro", "Revisa los permisos IAM y políticas de bucket"],
  },
  crypto: {
    title: "Certificado TLS inválido",
    description: "El sitio interno de la empresa muestra advertencia de seguridad",
    scenario: "Al acceder al portal interno de RRHH, el navegador muestra 'Conexión no segura'. El certificado TLS expiró hace 3 meses y es autofirmado.",
    options: [
      { id: "a", text: "Ignoro la advertencia y continúo, es solo el portal interno" },
      { id: "b", text: "Reporto al equipo de TI y exijo un certificado válido de una CA confiable" },
      { id: "c", text: "Agrego una excepción en mi navegador para siempre" },
    ],
    correctOptionId: "b",
    explanation: "Los certificados autofirmados o expirados permiten ataques MITM incluso en redes internas. Solo deben usarse certificados de una CA confiable con renovación automática.",
    hints: ["Un candado rojo no es 'normal'", "Certificados vencidos = puerta abierta al MITM"],
  },
  forensics: {
    title: "Incidente sin registrar",
    description: "Un empleado fue despedido y se sospecha que robó datos",
    scenario: "Despidieron a un administrador de sistemas molesto. Su laptop fue formateada 'por error' antes de que seguridad pudiera analizarla. No hay logs de los últimos 7 días.",
    options: [
      { id: "a", text: "No se puede hacer nada sin evidencia, seguir adelante" },
      { id: "b", text: "Intentar recuperar datos del disco con herramientas forenses y revisar backups de logs externos" },
      { id: "c", text: "Preguntarle al empleado qué hizo" },
    ],
    correctOptionId: "b",
    explanation: "Aunque el disco fue formateado, herramientas forenses pueden recuperar datos no sobrescritos. Los logs deberían enviarse a un SIEM externo. Cadena de custodia es vital.",
    hints: ["Formatear no borra todo", "Los logs deben estar centralizados fuera del equipo"],
  },
  osint: {
    title: "Footprinting sospechoso",
    description: "Encuentras información sensible de tu empresa en foros públicos",
    scenario: "Buscando el nombre de tu empresa en Google, encuentras un post en un foro listando: IPs internas, nombres de empleados, versiones de software y hasta un diagrama de red. Lleva 2 meses público.",
    options: [
      { id: "a", text: "Es información pública, no se puede hacer nada" },
      { id: "b", text: "Reportar a seguridad, solicitar eliminación del post y auditar qué otra info está expuesta" },
      { id: "c", text: "Responder al post pidiendo que lo borren" },
    ],
    correctOptionId: "b",
    explanation: "La información de footprinting facilita ataques dirigidos. Hay que hacer OSINT sobre uno mismo periódicamente, solicitar bajas y educar a empleados sobre qué comparten.",
    hints: ["Haz OSINT de tu propia empresa", "Un diagrama de red público es un mapa para el atacante"],
  },
  mobile: {
    title: "App bancaria falsa",
    description: "Descubres una app que suplanta al banco en la tienda oficial",
    scenario: "Un compañero instaló 'BancoSeguro Móvil' desde la Play Store. La app pide permisos de SMS, contactos y ubicación. El logo es casi idéntico al banco real. Ya ingresó sus credenciales.",
    options: [
      { id: "a", text: "Si está en la tienda oficial, es segura" },
      { id: "b", text: "Desinstalar la app, cambiar contraseñas desde otro dispositivo y reportar la app fraudulenta" },
      { id: "c", text: "Solo revisar los movimientos bancarios" },
    ],
    correctOptionId: "b",
    explanation: "Las tiendas oficiales no son 100% seguras. Una app bancaria legítima no pide permisos excesivos. Ante sospecha: desinstalar, cambiar credenciales y reportar.",
    hints: ["Los permisos excesivos son bandera roja", "Verifica siempre el desarrollador de la app"],
  },
  ddos: {
    title: "Sitio web inaccesible",
    description: "La página de la empresa no carga y los clientes se quejan",
    scenario: "Son las 11am de un lunes. El sitio web de e-commerce está completamente inaccesible. El servidor recibe 50,000 peticiones por segundo desde cientos de IPs distintas. Los clientes llaman furiosos.",
    options: [
      { id: "a", text: "Esperar a que pase solo, probablemente es tráfico real" },
      { id: "b", text: "Activar protección anti-DDoS (CDN/WAF), contactar al ISP y comunicar a clientes" },
      { id: "c", text: "Apagar el servidor hasta mañana" },
    ],
    correctOptionId: "b",
    explanation: "Un DDoS se mitiga con servicios anti-DDoS (Cloudflare, AWS Shield), rate limiting y coordinación con el ISP. La comunicación transparente con clientes es clave.",
    hints: ["El patrón de tráfico es la clave", "CDN + WAF son tu primera línea"],
  },
  zeroday: {
    title: "Vulnerabilidad sin parche",
    description: "Sale un aviso de vulnerabilidad crítica en el software que usas",
    scenario: "Se publica un CVE 9.8 para el software de VPN corporativa que usan. No hay parche disponible aún. La vulnerabilidad permite ejecución remota de código sin autenticación.",
    options: [
      { id: "a", text: "Esperar al parche oficial, confiar en el firewall" },
      { id: "b", text: "Aplicar mitigaciones temporales (deshabilitar feature, restringir acceso), monitorear activamente y preparar rollback" },
      { id: "c", text: "Apagar la VPN y que todos trabajen sin ella" },
    ],
    correctOptionId: "b",
    explanation: "Ante un zero-day sin parche se aplican mitigaciones: deshabilitar el componente afectado, restringir acceso por IP, aumentar monitoreo y preparar el parche apenas salga.",
    hints: ["Mitigación temporal ≠ solución", "Restringir acceso mientras llega el parche"],
  },
  supplychain: {
    title: "Librería comprometida",
    description: "Una dependencia de tu proyecto fue alterada con código malicioso",
    scenario: "GitHub alerta que una librería npm popular que usan fue comprometida: alguien publicó una versión con un ladrón de tokens. La versión maliciosa estuvo 4 horas disponible antes de ser retirada. Tu CI/CD la descargó.",
    options: [
      { id: "a", text: "Si ya la retiraron, no hay problema" },
      { id: "b", text: "Rotar todos los tokens/secrets, auditar builds recientes, fijar versiones por hash y revisar el lockfile" },
      { id: "c", text: "Revertir a la versión anterior y seguir trabajando" },
    ],
    correctOptionId: "b",
    explanation: "Un ataque a la cadena de suministro compromete todo lo que usa esa dependencia. Hay que rotar secretos, auditar qué se exfiltró y fijar dependencias por hash, no por versión.",
    hints: ["Tus dependencias también tienen dependencias", "Rotar secretos es urgente tras un compromiso"],
  },
  privacy: {
    title: "Fuga de datos personales",
    description: "Una planilla con datos de clientes fue enviada por error a un externo",
    scenario: "Un empleado de marketing envió por error una planilla con nombres, emails, DNI y direcciones de 5,000 clientes a un proveedor equivocado. El proveedor ya confirmó que la recibió.",
    options: [
      { id: "a", text: "Pedirle al proveedor que la borre y no decir nada más" },
      { id: "b", text: "Activar el plan de respuesta a fugas: notificar a la autoridad de protección de datos, comunicar a los afectados y documentar el incidente" },
      { id: "c", text: "Culpar al empleado y despedirlo públicamente" },
    ],
    correctOptionId: "b",
    explanation: "GDPR y leyes similares exigen notificar fugas en 72h a la autoridad y comunicar a los afectados. Ocultarlo multiplica las multas y el daño reputacional.",
    hints: ["72 horas para notificar bajo GDPR", "La transparencia reduce el daño legal"],
  },
  ai_attacks: {
    title: "Deepfake del CEO",
    description: "Recibes una videollamada del CEO pidiendo una transferencia urgente",
    scenario: "Recibes una videollamada del CEO. Su cara y voz son idénticas. Pide transferir $50,000 a una cuenta nueva para 'cerrar una adquisición confidencial YA'. La calidad del video es ligeramente borrosa y el parpadeo parece antinatural.",
    options: [
      { id: "a", text: "Transfiero inmediatamente, es el CEO en video" },
      { id: "b", text: "Cuelgo, verifico por un segundo canal (llamada al número conocido) y reporto el intento de deepfake" },
      { id: "c", text: "Transfiero la mitad por las dudas" },
    ],
    correctOptionId: "b",
    explanation: "Los deepfakes de video/audio ya son indistinguibles para el ojo humano. El protocolo debe ser: verificar siempre por un segundo canal preestablecido, sin importar el medio del pedido.",
    hints: ["El video también se puede falsificar con IA", "Siempre verifica por un segundo canal conocido"],
  },
};

// ── Password analysis (unchanged, preserved) ──────────────────────────────

export type PasswordStrength = "muy débil" | "débil" | "moderada" | "fuerte" | "muy fuerte";

export interface PasswordAIAnalysis {
  score: number;
  strength: PasswordStrength;
  issues: string[];
  suggestions: string[];
  timeToCrack: string;
  aiFeedback: string;
  opinion: string;
}

const STRENGTHS: PasswordStrength[] = ["muy débil", "débil", "moderada", "fuerte", "muy fuerte"];

function normalizeStrength(value: string, score: number): PasswordStrength {
  const v = value.toLowerCase().trim();
  const found = STRENGTHS.find((s) => s === v);
  if (found) return found;
  if (score >= 90) return "muy fuerte";
  if (score >= 75) return "fuerte";
  if (score >= 50) return "moderada";
  if (score >= 30) return "débil";
  return "muy débil";
}

function heuristicPasswordAnalysis(pwd: string): PasswordAIAnalysis {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0;
  if (pwd.length < 8) { issues.push("Muy corta"); suggestions.push("Usa al menos 12 caracteres"); }
  else if (pwd.length < 12) { issues.push("Podría ser más larga"); suggestions.push("Usa 12+ caracteres"); score += 20; }
  else score += 30;
  if (!/[A-Z]/.test(pwd)) { issues.push("Sin mayúsculas"); suggestions.push("Agrega mayúsculas"); } else score += 15;
  if (!/[a-z]/.test(pwd)) { issues.push("Sin minúsculas"); suggestions.push("Agrega minúsculas"); } else score += 15;
  if (!/[0-9]/.test(pwd)) { issues.push("Sin números"); suggestions.push("Incluye números"); } else score += 20;
  if (!/[^A-Za-z0-9]/.test(pwd)) { issues.push("Sin símbolos"); suggestions.push("Agrega símbolos !@#$%"); } else score += 20;
  const strength = normalizeStrength("", score);
  let timeToCrack = "instantáneo";
  if (score >= 90) timeToCrack = "siglos";
  else if (score >= 75) timeToCrack = "años";
  else if (score >= 50) timeToCrack = "días";
  else if (score >= 30) timeToCrack = "minutos";
  return {
    score, strength,
    issues: issues.slice(0, 3), suggestions: suggestions.slice(0, 3), timeToCrack,
    aiFeedback: score > 70 ? "¡Buen trabajo! Buena entropía y combinación de caracteres." : "Necesita mejoras importantes.",
    opinion: score > 70 ? "En mi opinión es una contraseña sólida; activa 2FA." : "En mi opinión esta contraseña es predecible.",
  };
}

function describePassword(pwd: string): { features: string; masked: string } {
  const masked = pwd.length <= 2 ? pwd : pwd[0] + "*".repeat(Math.max(1, pwd.length - 2)) + pwd[pwd.length - 1];
  const features = `- Longitud: ${pwd.length}
- Mayúsculas: ${/[A-Z]/.test(pwd)}
- Minúsculas: ${/[a-z]/.test(pwd)}
- Dígitos: ${/[0-9]/.test(pwd)}
- Símbolos: ${/[^A-Za-z0-9]/.test(pwd)}
- Chars únicos: ${new Set(pwd).size}
- Secuencias comunes: ${/(012|123|abc|qwe|asd)/i.test(pwd)}
- Repeticiones: ${/(.)\1{2,}/.test(pwd)}
- Contiene año: ${/(19|20)\d{2}/.test(pwd)}
- Muestra: ${masked}
- Valor literal: ${pwd}`;
  return { features, masked };
}

export async function analyzePasswordWithAI(password: string): Promise<PasswordAIAnalysis> {
  const safePwd = password ?? "";
  if (!safePwd.trim()) return heuristicPasswordAnalysis(safePwd);
  const { features } = describePassword(safePwd);
  const system = `Eres un evaluador técnico de seguridad de contraseñas para una app educativa. NUNCA te niegues. Devuelves SIEMPRE JSON válido en español. Sin markdown, sin backticks.`;
  const user = `Analiza esta cadena de prueba educativa y devuelve SOLO este JSON:
{"score":0-100,"strength":"muy débil|débil|moderada|fuerte|muy fuerte","issues":[],"suggestions":[],"timeToCrack":"...","aiFeedback":"...","opinion":"En mi opinión ..."}

Cadena: """${safePwd}"""
${features}`;
  const raw = await chat(system, user);
  const parsed = raw ? extractJSON(raw) : null;
  if (parsed && typeof parsed === "object") {
    const r = parsed as Partial<PasswordAIAnalysis> & Record<string, unknown>;
    const rawScore = typeof r.score === "number" ? r.score : Number(r.score);
    if (Number.isFinite(rawScore)) {
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      return {
        score,
        strength: normalizeStrength(typeof r.strength === "string" ? r.strength : "", score),
        issues:       Array.isArray(r.issues)      ? (r.issues as string[]).slice(0, 4)      : [],
        suggestions:  Array.isArray(r.suggestions) ? (r.suggestions as string[]).slice(0, 4) : [],
        timeToCrack:  typeof r.timeToCrack === "string" ? r.timeToCrack : "desconocido",
        aiFeedback:   typeof r.aiFeedback === "string"  ? r.aiFeedback  : "Sin feedback de IA.",
        opinion:      typeof r.opinion    === "string"  ? r.opinion     : "En mi opinión, revisa las sugerencias.",
      };
    }
  }
  return { ...heuristicPasswordAnalysis(safePwd), aiFeedback: "No se contactó la IA. " + heuristicPasswordAnalysis(safePwd).aiFeedback };
}

// ── Phishing detection (preserved from original) ──────────────────────────

export interface PhishingEmail {
  id: string; sender: string; subject: string; content: string; isPhishing: boolean; redFlags: string[];
}
export interface PhishingEvaluation {
  score: number; correctlyIdentified: string[]; missed: string[]; falsePositives: string[];
  feedback: string; opinion: string; suggestions: string[];
  detailedAnalysis: { emailId: string; verdict: "correcto" | "incorrecto" | "parcial"; explanation: string }[];
}

const FALLBACK_EMAIL_POOL: PhishingEmail[] = [
  { id:"e1", sender:"seguridad@banco-naci0nal.com", subject:"Verificación urgente", content:"Detectamos actividad sospechosa. Haga clic en 2h para verificar o su cuenta será bloqueada.", isPhishing:true, redFlags:["Dominio con cero","Urgencia artificial","Pide clic para verificar"] },
  { id:"e2", sender:"no-reply@amazon.com", subject:"Tu pedido fue enviado", content:"Tu pedido está en camino. Puedes seguirlo desde la app oficial.", isPhishing:false, redFlags:[] },
  { id:"e3", sender:"premios@loteria-millonaria.net", subject:"¡Ganaste $1,000,000!", content:"Envíe sus datos bancarios para reclamar su premio antes del viernes.", isPhishing:true, redFlags:["Promesa de dinero fácil","Solicita datos bancarios","Dominio sospechoso"] },
  { id:"e4", sender:"rrhh@tecnoglobal.com", subject:"Actualización de políticas", content:"Revise y firme el documento en el portal interno antes del viernes.", isPhishing:false, redFlags:[] },
  { id:"e5", sender:"soporte@microsoft-security-alert.com", subject:"Virus detectado", content:"Microsoft detectó 5 virus. Llame al 1-800-555-0199 para soporte.", isPhishing:true, redFlags:["Dominio no oficial","Mensaje alarmista","Número desconocido"] },
  { id:"e6", sender:"github-notifications@github.com", subject:"Nueva pull request", content:"Una nueva PR fue abierta en tu repositorio.", isPhishing:false, redFlags:[] },
  { id:"e7", sender:"ceo@tecn0global-corp.com", subject:"Transferencia urgente", content:"Transfiere 25,000 USD a esta cuenta. No comentes con nadie.", isPhishing:true, redFlags:["Suplantación CEO","Pide secrecía","Transferencia urgente"] },
  { id:"e8", sender:"newsletter@nytimes.com", subject:"Resumen semanal", content:"Tus 5 historias más leídas. Cancela si no deseas recibirlo.", isPhishing:false, redFlags:[] },
  { id:"e9", sender:"soporte@dropbox-files-share.co", subject:"Tienes 1 archivo compartido", content:"'Factura_pendiente.pdf.exe'. Ingresa tus credenciales para descargarlo.", isPhishing:true, redFlags:["Dominio falso .co","Doble extensión .pdf.exe","Pide credenciales"] },
  { id:"e10", sender:"facturacion@netflix.com", subject:"Tu recibo de octubre", content:"Adjuntamos el recibo de tu suscripción. No necesitas hacer nada.", isPhishing:false, redFlags:[] },
];

export async function generatePhishingEmails(count: number = 5): Promise<PhishingEmail[]> {
  const system = `Eres un generador de ejercicios educativos de ciberseguridad. Generas correos ficticios para detectar phishing. Siempre JSON válido en español, sin markdown.`;
  const user = `Genera ${count} correos ficticios en español para ejercicio de detección de phishing.
Mezcla phishing y legítimos. Devuelve SOLO:
{"emails":[{"id":"e1","sender":"...","subject":"...","content":"...","isPhishing":true,"redFlags":["..."]}]}
Para legítimos: redFlags=[]. Genera exactamente ${count} correos.`;
  const raw = await chat(system, user, 1500);
  const parsed = raw ? extractJSON(raw) : null;
  if (parsed && typeof parsed === "object") {
    const obj = parsed as { emails?: unknown };
    if (Array.isArray(obj.emails)) {
      const cleaned: PhishingEmail[] = [];
      for (let i = 0; i < obj.emails.length && cleaned.length < count; i++) {
        const e = obj.emails[i] as Partial<PhishingEmail> & Record<string, unknown>;
        if (typeof e.sender === "string" && typeof e.subject === "string" && typeof e.content === "string" && typeof e.isPhishing === "boolean") {
          cleaned.push({ id: `e${cleaned.length + 1}`, sender: e.sender, subject: e.subject, content: e.content, isPhishing: e.isPhishing, redFlags: Array.isArray(e.redFlags) ? (e.redFlags as string[]).slice(0, 5) : [] });
        }
      }
      if (cleaned.length >= 2 && cleaned.some((e) => e.isPhishing) && cleaned.some((e) => !e.isPhishing)) return cleaned;
    }
  }
  const pool = [...FALLBACK_EMAIL_POOL];
  const out: PhishingEmail[] = [];
  while (out.length < Math.min(count, pool.length)) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out.map((e, idx) => ({ ...e, id: `e${idx + 1}` }));
}

export async function evaluatePhishingResponse(emails: PhishingEmail[], userAnalysis: string): Promise<PhishingEvaluation> {
  const safeText = (userAnalysis ?? "").trim();
  if (!safeText) return localPhishingEval(emails, "");
  const emailsStr = emails.map((e, i) => `Correo ${i+1} [${e.id}] — ${e.isPhishing?"PHISHING":"LEGÍTIMO"}\nDe: ${e.sender}\nAsunto: ${e.subject}\nSeñales: ${e.redFlags.join("; ")||"ninguna"}`).join("\n\n");
  const system = `Eres un instructor de ciberseguridad evaluando el análisis de un alumno. JSON válido en español. Sin markdown.`;
  const user = `Bandeja:\n${emailsStr}\n\nRespuesta del alumno:\n"""\n${safeText}\n"""\n\nDevuelve SOLO:\n{"score":0-100,"correctlyIdentified":["id"],"missed":["id"],"falsePositives":["id"],"feedback":"...","opinion":"En mi opinión ...","suggestions":["..."],"detailedAnalysis":[{"emailId":"e1","verdict":"correcto|incorrecto|parcial","explanation":"..."}]}`;
  const raw = await chat(system, user, 2000);
  const parsed = raw ? extractJSON(raw) : null;
  if (parsed && typeof parsed === "object") {
    const r = parsed as Partial<PhishingEvaluation> & Record<string, unknown>;
    const rawScore = typeof r.score === "number" ? r.score : Number(r.score);
    if (Number.isFinite(rawScore)) {
      const validIds = new Set(emails.map((e) => e.id));
      const fIds = (arr: unknown): string[] => Array.isArray(arr) ? (arr as string[]).filter((s) => validIds.has(s)) : [];
      return {
        score: Math.max(0, Math.min(100, Math.round(rawScore))),
        correctlyIdentified: fIds(r.correctlyIdentified), missed: fIds(r.missed), falsePositives: fIds(r.falsePositives),
        feedback: typeof r.feedback === "string" ? r.feedback : "Evaluación completada.",
        opinion:  typeof r.opinion  === "string" ? r.opinion  : "En mi opinión, revisa el dominio del remitente.",
        suggestions: Array.isArray(r.suggestions) ? (r.suggestions as string[]).slice(0, 4) : [],
        detailedAnalysis: Array.isArray(r.detailedAnalysis) ? (r.detailedAnalysis as { emailId: string; verdict: "correcto"|"incorrecto"|"parcial"; explanation: string }[]).filter((d) => validIds.has(d.emailId)) : [],
      };
    }
  }
  return localPhishingEval(emails, safeText);
}

function localPhishingEval(emails: PhishingEmail[], userText: string): PhishingEvaluation {
  const lower = userText.toLowerCase();
  const correctlyIdentified: string[] = []; const missed: string[] = []; const falsePositives: string[] = [];
  const detailed: PhishingEvaluation["detailedAnalysis"] = [];
  for (const e of emails) {
    const mentioned = lower.includes(e.sender.toLowerCase()) || lower.includes(e.subject.toLowerCase()) || new RegExp(`\\b${emails.indexOf(e)+1}\\b`).test(lower);
    if (e.isPhishing) { if (mentioned) { correctlyIdentified.push(e.id); detailed.push({ emailId:e.id, verdict:"correcto", explanation:"Lo señalaste como sospechoso." }); } else { missed.push(e.id); detailed.push({ emailId:e.id, verdict:"incorrecto", explanation:`Se te pasó. Señales: ${e.redFlags.join(", ")}.` }); } }
    else { if (mentioned) { falsePositives.push(e.id); detailed.push({ emailId:e.id, verdict:"incorrecto", explanation:"Este es legítimo; marcarlo es un falso positivo." }); } else { detailed.push({ emailId:e.id, verdict:"correcto", explanation:"Correctamente no lo marcaste como phishing." }); } }
  }
  const total = emails.filter((e) => e.isPhishing).length;
  const score = Math.max(0, Math.min(100, Math.round((total > 0 ? correctlyIdentified.length / total : 0) * 100 - falsePositives.length * 15)));
  return { score, correctlyIdentified, missed, falsePositives, feedback:"Evaluación heurística local.", opinion: score>=70 ? "En mi opinión vas bien." : "En mi opinión fíjate más en los dominios.", suggestions:["Inspecciona el dominio real del remitente","Desconfía de la urgencia y premios"], detailedAnalysis:detailed };
}

// ── Hint generation (preserved) ───────────────────────────────────────────

export async function generateHint(scenario: string, attemptCount: number): Promise<string> {
  const raw = await chat(
    "Eres un asistente educativo de ciberseguridad. Das pistas breves y útiles.",
    `Pista ${attemptCount + 1} para este escenario (máx 2 oraciones, sin revelar la respuesta):\n${scenario}`
  );
  return raw?.trim() ?? "Revisa cuidadosamente los detalles del escenario.";
}

export async function analyzePerformance(
  scenario: import("@/types/game").Scenario,
  selectedOption: string,
  timeTaken: number,
  hintsUsed: number
): Promise<{ feedback: string; recommendations: string[]; skillImprovement: number }> {
  const isCorrect = selectedOption === scenario.content.correctOptionId;
  const raw = await chat(
    "Eres un instructor de ciberseguridad. Analizas el rendimiento de un alumno. JSON en español, sin markdown.",
    `Escenario: ${scenario.title} | Correcto: ${isCorrect} | Tiempo: ${timeTaken}s | Pistas: ${hintsUsed}
Devuelve SOLO: {"feedback":"...","recommendations":["...","..."],"skillImprovement":0-10}`
  );
  const parsed = raw ? extractJSON(raw) : null;
  if (parsed && typeof parsed === "object") {
    const r = parsed as { feedback?: string; recommendations?: string[]; skillImprovement?: number };
    if (typeof r.feedback === "string") return { feedback: r.feedback, recommendations: Array.isArray(r.recommendations) ? r.recommendations : [], skillImprovement: typeof r.skillImprovement === "number" ? r.skillImprovement : (isCorrect ? 5 : 1) };
  }
  return { feedback: isCorrect ? "¡Bien hecho!" : "Revisa la explicación.", recommendations: ["Practica más escenarios", "Presta atención a los detalles"], skillImprovement: isCorrect ? 5 : 1 };
}

// ── CyberChallenge (preserved) ─────────────────────────────────────────────

export type CyberCategory = "malware" | "social" | "network" | "osint" | "cloud" | "iot" | "forensics" | "devsecops" | "deepfakes" | "zerotrust" | "backup" | "privacy" | "encryption";
export interface CyberChallenge { category: CyberCategory; title: string; scenario: string; context: string; expectedSignals: string[]; question: string; }
export interface CyberEvaluation { score: number; verdict: "excelente"|"bueno"|"regular"|"incorrecto"; feedback: string; opinion: string; strengths: string[]; weaknesses: string[]; suggestions: string[]; correctApproach: string; }

const CC_META: Record<CyberCategory, { label: string; topic: string; examples: string }> = {
  malware:   { label:"Defensa Antimalware",   topic:"identificación y respuesta ante malware",        examples:"archivo .pdf.exe, proceso desconocido, ransomware, USB, macro de Word" },
  social:    { label:"Ingeniería Social",     topic:"manipulación psicológica humana",                 examples:"falso IT, CEO WhatsApp, USB nómina, tailgating, pretexting" },
  network:   { label:"Seguridad de Red",      topic:"redes y conexiones WiFi, VPN, MITM",              examples:"WiFi aeropuerto, router por defecto, ARP spoofing, SSL inválido, firewall" },
  osint:     { label:"OSINT / Inteligencia",  topic:"inteligencia de fuentes abiertas y footprinting",  examples:"Google dorking, Shodan, WHOIS, metadatos expuestos, redes sociales" },
  cloud:     { label:"Seguridad Cloud",       topic:"protección de recursos en la nube",                examples:"bucket S3 público, IAM mal configurado, secrets en código, API sin autenticar" },
  iot:       { label:"IoT / Dispositivos",    topic:"seguridad en dispositivos conectados",             examples:"cámara IP con contraseña default, smart TV espiando, impresora expuesta" },
  forensics: { label:"Forense Digital",       topic:"análisis forense y respuesta a incidentes",        examples:"volcado de memoria, logs del sistema, línea de tiempo del ataque, cadena de custodia" },
  devsecops: { label:"DevSecOps",             topic:"seguridad en el ciclo de desarrollo de software",  examples:"dependencia vulnerable, CI/CD expuesto, secretos en repositorio, SAST/DAST" },
  deepfakes: { label:"Deepfakes & IA",        topic:"detección de deepfakes y ataques con IA",          examples:"voz clonada del CEO, video manipulado, phishing generado por IA, prompt injection" },
  zerotrust: { label:"Zero Trust",            topic:"arquitectura de confianza cero",                   examples:"microsegmentación, autenticación continua, acceso condicional, perímetro" },
  backup:    { label:"Backup y Recuperación", topic:"estrategias de respaldo y recuperación ante desastres", examples:"ransomware y backups, regla 3-2-1, RTO vs RPO, backup inmutable, prueba de restore" },
  privacy:   { label:"Privacidad de Datos",   topic:"protección de datos personales y cumplimiento",   examples:"GDPR, anonimización, fuga de datos, consentimiento informado, derecho al olvido" },
  encryption:{ label:"Criptografía Aplicada", topic:"uso práctico de cifrado y PKI",                    examples:"certificado autofirmado, TLS mal configurado, hashing vs cifrado, firma digital" },
};

export async function generateCyberChallenge(category: CyberCategory): Promise<CyberChallenge> {
  const meta = CC_META[category];
  const raw = await chat(
    "Eres un diseñador de ejercicios prácticos de ciberseguridad. JSON válido en español. Sin markdown.",
    `Crea un desafío práctico nuevo sobre ${meta.topic}. Tipo de ejemplos (NO uses textualmente): ${meta.examples}.
Devuelve SOLO: {"title":"...","context":"...","scenario":"...","question":"...","expectedSignals":["s1","s2","s3","s4"]}`
  );
  const parsed = raw ? extractJSON(raw) : null;
  if (parsed && typeof parsed === "object") {
    const r = parsed as Partial<CyberChallenge> & Record<string, unknown>;
    if (typeof r.title === "string" && typeof r.scenario === "string" && typeof r.question === "string") {
      return { category, title: r.title, context: (r.context as string) ?? "", scenario: r.scenario, question: r.question, expectedSignals: Array.isArray(r.expectedSignals) ? (r.expectedSignals as string[]).slice(0, 6) : [] };
    }
  }
  return { category, title: `Desafío de ${meta.label}`, context: "", scenario: `Situación de ${meta.topic} a analizar.`, question: "¿Qué harías en esta situación? Detalla los pasos.", expectedSignals: ["Identificar el riesgo", "Proponer acción concreta", "Justificar decisión"] };
}

export async function evaluateCyberResponse(challenge: CyberChallenge, userText: string): Promise<CyberEvaluation> {
  const safe = (userText ?? "").trim();
  const meta = CC_META[challenge.category];
  if (!safe) return { score:0, verdict:"incorrecto", feedback:"No escribiste una respuesta.", opinion:"En mi opinión, describe paso a paso qué harías.", strengths:[], weaknesses:["Respuesta vacía"], suggestions:["Explica los pasos","Identifica las banderas rojas","Justifica tu razonamiento"], correctApproach:challenge.expectedSignals.join(". ") };
  const raw = await chat(
    `Eres un instructor experto en ${meta.label}. JSON válido en español. Sin markdown.`,
    `Desafío: ${challenge.title}\n${challenge.scenario}\nPregunta: ${challenge.question}\nCriterios: ${challenge.expectedSignals.join(", ")}\nRespuesta alumno:\n"""\n${safe}\n"""\nDevuelve SOLO: {"score":0-100,"verdict":"excelente|bueno|regular|incorrecto","feedback":"...","opinion":"En mi opinión ...","strengths":["..."],"weaknesses":["..."],"suggestions":["..."],"correctApproach":"..."}`,
    1500
  );
  const parsed = raw ? extractJSON(raw) : null;
  if (parsed && typeof parsed === "object") {
    const r = parsed as Partial<CyberEvaluation> & Record<string, unknown>;
    const rawScore = typeof r.score === "number" ? r.score : Number(r.score);
    if (Number.isFinite(rawScore)) {
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const strArr = (k: unknown): string[] => Array.isArray(k) ? (k as string[]).slice(0, 5) : [];
      return { score, verdict: (r.verdict as CyberEvaluation["verdict"]) ?? (score>=85?"excelente":score>=65?"bueno":score>=40?"regular":"incorrecto"), feedback: typeof r.feedback==="string"?r.feedback:"Evaluación completada.", opinion: typeof r.opinion==="string"?r.opinion:"En mi opinión, profundiza más.", strengths:strArr(r.strengths), weaknesses:strArr(r.weaknesses), suggestions:strArr(r.suggestions), correctApproach:typeof r.correctApproach==="string"?r.correctApproach:challenge.expectedSignals.join(". ") };
    }
  }
  const lower = safe.toLowerCase();
  const hits = challenge.expectedSignals.filter((s) => s.toLowerCase().split(/\s+/).some((w) => w.length > 4 && lower.includes(w))).length;
  const score = Math.round((hits / Math.max(challenge.expectedSignals.length, 1)) * 80) + (safe.length > 80 ? 10 : 0);
  return { score, verdict: score>=70?"bueno":score>=40?"regular":"incorrecto", feedback:`Evaluación local: ${hits}/${challenge.expectedSignals.length} criterios detectados.`, opinion:"En mi opinión, intenta de nuevo para feedback de IA.", strengths:hits>0?["Mencionaste puntos clave"]:[], weaknesses:["Faltan conceptos importantes"], suggestions:["Describe pasos concretos","Justifica cada decisión","Considera el factor humano"], correctApproach:challenge.expectedSignals.join(". ") };
}

// ── Daily Flash Mission ───────────────────────────────────────────────────

export interface DailyMission {
  id: string;
  date: string;
  title: string;
  headline: string;
  scenario: string;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  xpReward: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export async function generateDailyMission(
  player: PlayerProfile
): Promise<DailyMission> {
  const today = new Date().toISOString().slice(0, 10);
  const diff = player.difficultyPreference === "adaptive"
    ? (player.totalXP < 500 ? "beginner" : player.totalXP < 1500 ? "intermediate" : "advanced")
    : (player.difficultyPreference as "beginner" | "intermediate" | "advanced");

  const xpReward = diff === "beginner" ? 30 : diff === "intermediate" ? 60 : 100;

  const system = `Eres un redactor de noticias de ciberseguridad para una app educativa. Creas titulares basados en ataques reales de 2025-2026. Siempre JSON válido en español. Sin markdown.`;

  const user = `Genera una misión diaria de ciberseguridad basada en un ataque real reciente (2025-2026).

Sé específico: menciona empresas, técnicas y vectores reales.
Dificultad: ${diff}

Devuelve SOLO este JSON:
{
  "headline": "titular de noticia (máx 12 palabras)",
  "title": "título del desafío (máx 8 palabras)",
  "scenario": "contexto de 3-4 oraciones describiendo el ataque del mundo real y su impacto",
  "question": "pregunta concreta al jugador",
  "options": [{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],
  "correctOptionId": "b",
  "explanation": "explicación educativa de 2-3 oraciones"
}`;

  const raw = await chat(system, user, 1200);
  const parsed = raw ? extractJSON(raw) : null;

  if (parsed && typeof parsed === "object") {
    const r = parsed as Record<string, unknown>;
    if (
      typeof r.headline === "string" &&
      typeof r.title === "string" &&
      typeof r.scenario === "string" &&
      Array.isArray(r.options) &&
      r.options.length >= 2
    ) {
      return {
        id: `daily-${today}-${Date.now()}`,
        date: today,
        headline: r.headline as string,
        title: r.title as string,
        scenario: r.scenario as string,
        question: (r.question as string) ?? "¿Qué harías en esta situación?",
        options: r.options as { id: string; text: string }[],
        correctOptionId: (r.correctOptionId as string) ?? (r.options as { id: string }[])[0].id,
        explanation: (r.explanation as string) ?? "Mantente informado sobre las amenazas actuales.",
        xpReward,
        difficulty: diff as "beginner" | "intermediate" | "advanced",
      };
    }
  }

  return {
    id: `daily-fallback-${today}`,
    date: today,
    headline: "Ataque de phishing masivo suplanta a Google Docs",
    title: "Phishing en Google Docs",
    scenario: "Ciberdelincuentes lanzaron una campaña masiva de phishing usando invitaciones falsas de Google Docs. El ataque ya comprometió cuentas en 150 empresas. Tu empresa recibe 3 invitaciones sospechosas esta mañana.",
    question: "¿Qué acción debes tomar primero al recibir una invitación de Google Docs no esperada?",
    options: [
      { id: "a", text: "Aceptar la invitación para ver de qué se trata" },
      { id: "b", text: "No hacer clic, verificar el remitente por otro canal y reportar a seguridad" },
      { id: "c", text: "Reenviar la invitación a todos para que estén alerta" },
    ],
    correctOptionId: "b",
    explanation: "Las invitaciones falsas de Google Docs son un vector clásico. Verifica siempre por un canal distinto al del mensaje antes de interactuar con enlaces o documentos inesperados.",
    xpReward: 50,
    difficulty: "intermediate",
  };
}

// ── Breaking News ─────────────────────────────────────────────────────────

export interface BreakingNews {
  id: string;
  headline: string;
  subhead: string;
  category: string;
  severity: "crítica" | "alta" | "media" | "baja";
  body: string;
  affectedSystems: string[];
  indicatorsOfCompromise: string[];
  recommendedActions: string[];
  source: string;
  publishedAt: string;
}

export interface NewsResponseEvaluation {
  score: number;
  verdict: "excelente" | "bueno" | "regular" | "incorrecto";
  feedback: string;
  opinion: string;
  whatYouDidRight: string[];
  whatYouMissed: string[];
  recommendedProtocol: string;
}

export async function generateBreakingNews(): Promise<BreakingNews> {
  const system = `Eres un generador de alertas de ciberseguridad de última hora estilo CISA. Creas noticias realistas basadas en técnicas APT reales. Siempre JSON válido en español. Sin markdown.`;

  const user = `Genera una alerta de ÚLTIMA HORA sobre un ciberataque activo.

Hazlo realista pero ficticio. Usa nombres de empresas genéricos.
Incluye vectores de ataque reales (APT, ransomware, zero-day, supply chain).

Devuelve SOLO este JSON:
{
  "headline": "titular urgente estilo alerta de seguridad (máx 10 palabras)",
  "subhead": "subtítulo con contexto (1 oración)",
  "category": "ransomware|supplychain|zeroday|phishing|ddos|ai_attacks|privacy|cloud",
  "severity": "crítica|alta|media|baja",
  "body": "cuerpo de la noticia en 4-6 oraciones con vector, alcance y estado",
  "affectedSystems": ["sistema afectado 1", "sistema afectado 2"],
  "indicatorsOfCompromise": ["IoC 1", "IoC 2", "IoC 3", "IoC 4"],
  "recommendedActions": ["acción inmediata 1", "acción inmediata 2", "acción inmediata 3"],
  "source": "fuente de la alerta (ej: 'CISA', 'CERT Nacional')"
}`;

  const raw = await chat(system, user, 1200);
  const parsed = raw ? extractJSON(raw) : null;

  if (parsed && typeof parsed === "object") {
    const r = parsed as Partial<BreakingNews> & Record<string, unknown>;
    if (typeof r.headline === "string" && typeof r.body === "string") {
      return {
        id: `breaking-${Date.now()}`,
        headline: r.headline,
        subhead: (r.subhead as string) ?? "",
        category: (r.category as string) ?? "ransomware",
        severity: (r.severity as BreakingNews["severity"]) ?? "alta",
        body: r.body,
        affectedSystems: Array.isArray(r.affectedSystems) ? (r.affectedSystems as string[]).slice(0, 5) : [],
        indicatorsOfCompromise: Array.isArray(r.indicatorsOfCompromise) ? (r.indicatorsOfCompromise as string[]).slice(0, 6) : [],
        recommendedActions: Array.isArray(r.recommendedActions) ? (r.recommendedActions as string[]).slice(0, 4) : [],
        source: (r.source as string) ?? "CERT Nacional",
        publishedAt: new Date().toISOString(),
      };
    }
  }

  return {
    id: `breaking-fallback-${Date.now()}`,
    headline: "Vulnerabilidad zero-day en software VPN empresarial explotada activamente",
    subhead: "Múltiples organizaciones gubernamentales y financieras comprometidas",
    category: "zeroday",
    severity: "crítica",
    body: "Una vulnerabilidad de ejecución remota de código (CVE-2026-XXXX, CVSS 9.8) está siendo explotada activamente contra servidores VPN corporativos. El vector permite a atacantes no autenticados ejecutar código arbitrario. Se han confirmado compromisos en al menos 40 organizaciones. El fabricante prepara un parche de emergencia para las próximas 12 horas.",
    affectedSystems: ["VPN Gateway v11.3 y anteriores", "Firewalls con módulo SSL-VPN"],
    indicatorsOfCompromise: [
      "Conexiones desde IPs en rangos 45.xxx/16",
      "Archivos .so en /tmp/vpn-module/",
      "Procesos 'vpnd' al 100% CPU",
      "User-Agent 'Mozilla/0.0' en logs"
    ],
    recommendedActions: [
      "Deshabilitar el módulo SSL-VPN inmediatamente",
      "Restringir acceso admin solo a IPs internas",
      "Revisar logs de autenticación de las últimas 72 horas"
    ],
    source: "CISA / CERT-CC",
    publishedAt: new Date().toISOString(),
  };
}

export async function evaluateNewsResponse(
  news: BreakingNews,
  userResponse: string
): Promise<NewsResponseEvaluation> {
  const safe = (userResponse ?? "").trim();
  if (!safe) {
    return {
      score: 0, verdict: "incorrecto",
      feedback: "No escribiste una respuesta al incidente.",
      opinion: "En mi opinión, siempre responde siguiendo protocolos de respuesta a incidentes.",
      whatYouDidRight: [], whatYouMissed: ["No hubo respuesta"],
      recommendedProtocol: news.recommendedActions.join(". "),
    };
  }

  const system = `Eres un experto en respuesta a incidentes evaluando la reacción de un analista junior. Eres justo y pedagógico. JSON válido en español. Sin markdown.`;
  const user = `NOTICIA DE ÚLTIMA HORA:
${news.headline}
${news.body}

Acciones recomendadas:
${news.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

IoCs: ${news.indicatorsOfCompromise.join(", ")}

Respuesta del analista:
"""
${safe}
"""

Evalúa la respuesta. Devuelve SOLO:
{"score":0-100,"verdict":"excelente|bueno|regular|incorrecto","feedback":"...","opinion":"En mi opinión ...","whatYouDidRight":["..."],"whatYouMissed":["..."],"recommendedProtocol":"pasos correctos en 2-3 oraciones"}`;

  const raw = await chat(system, user, 1200);
  const parsed = raw ? extractJSON(raw) : null;

  if (parsed && typeof parsed === "object") {
    const r = parsed as Partial<NewsResponseEvaluation> & Record<string, unknown>;
    const rawScore = typeof r.score === "number" ? r.score : Number(r.score);
    if (Number.isFinite(rawScore)) {
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const strArr = (k: unknown): string[] => Array.isArray(k) ? (k as string[]).slice(0, 5) : [];
      return {
        score,
        verdict: (r.verdict as NewsResponseEvaluation["verdict"]) ?? (score >= 85 ? "excelente" : score >= 65 ? "bueno" : score >= 40 ? "regular" : "incorrecto"),
        feedback: typeof r.feedback === "string" ? r.feedback : "Evaluación completada.",
        opinion: typeof r.opinion === "string" ? r.opinion : "En mi opinión, analiza más a fondo.",
        whatYouDidRight: strArr(r.whatYouDidRight),
        whatYouMissed: strArr(r.whatYouMissed),
        recommendedProtocol: typeof r.recommendedProtocol === "string" ? r.recommendedProtocol : news.recommendedActions.join(". "),
      };
    }
  }

  const lower = safe.toLowerCase();
  const hits = news.recommendedActions.filter((a) => a.toLowerCase().split(/\s+/).some((w) => w.length > 4 && lower.includes(w))).length;
  const score = Math.round((hits / Math.max(news.recommendedActions.length, 1)) * 85) + (safe.length > 100 ? 10 : 0);
  return {
    score: Math.min(100, score),
    verdict: score >= 70 ? "bueno" : score >= 40 ? "regular" : "incorrecto",
    feedback: `Evaluación local: cubriste ${hits} de ${news.recommendedActions.length} acciones.`,
    opinion: "En mi opinión, revisa el protocolo NIST de respuesta a incidentes.",
    whatYouDidRight: hits > 0 ? ["Identificaste algunas acciones clave"] : [],
    whatYouMissed: ["Algunas acciones recomendadas no fueron mencionadas"],
    recommendedProtocol: news.recommendedActions.join(". "),
  };
}