// ─────────── Worlds Data ───────────
// Each world represents a different client/company for the cybersecurity consultant

import {
  Building2,
  Server,
  Landmark,
  Stethoscope,
  University,
  Briefcase,
  Wrench,
  Crown,
  type LucideIcon,
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export type RoomId = 'lobby' | 'servers' | 'admin' | 'support' | 'ceo';
export type WorldId = 'tecnoglobal' | 'banco' | 'hospital' | 'gobierno';

export interface Room {
  id: RoomId;
  name: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  npcIds: string[];
  objectIds: string[];
  ambient: string;
}

export interface GameProgress {
  visitedRooms: Set<RoomId>;
  spokenNpcs: Set<string>;
  foundIds: Set<string>;
  completedChallenges: Set<string>;
}

export interface Chapter {
  id: string;
  title: string;
  objective: string;
  hint: string;
  isComplete: (state: GameProgress) => boolean;
}

export interface WorldData {
  id: string;
  index: number;
  name: string;
  company: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  description: string;
  unlockXP: number;
  rooms: Room[];
  chapters: Chapter[];
}

// ─────────── TecnoGlobal C.A. (World 1) ───────────

const ROOMS_TECNOGLOBAL: Room[] = [
  {
    id: 'lobby',
    name: 'Lobby de TI',
    subtitle: 'Recepción y oficina de Roberto',
    icon: Building2,
    color: Colors.accent.cyan,
    npcIds: ['roberto'],
    objectIds: ['router_main', 'wifi_ap'],
    ambient: 'Luces azules parpadean en el rack del rincón. Roberto te espera con un café en la mano y aspecto de no haber dormido.',
  },
  {
    id: 'servers',
    name: 'Sala de Servidores',
    subtitle: 'Núcleo de infraestructura',
    icon: Server,
    color: Colors.accent.purple,
    npcIds: [],
    objectIds: ['server_main', 'email_server'],
    ambient: 'Ventiladores zumban como un enjambre. El aire es frío y huele a metal caliente. Una etiqueta amarilla dice "no tocar".',
  },
  {
    id: 'admin',
    name: 'Oficina Administrativa',
    subtitle: 'María González',
    icon: Briefcase,
    color: Colors.accent.purple,
    npcIds: ['maria'],
    objectIds: ['pc_maria', 'printer_shared'],
    ambient: 'Carpetas apiladas, un calendario de gatos en la pared. Una nota adhesiva con algo escrito asoma bajo el teclado.',
  },
  {
    id: 'support',
    name: 'Soporte TI',
    subtitle: 'Carlos y Pedro',
    icon: Wrench,
    color: Colors.accent.yellow,
    npcIds: ['carlos', 'pedro'],
    objectIds: ['terminal_carlos', 'pc_pedro'],
    ambient: 'Cables enredados, monitores encendidos, post-its de todos los colores. Carlos no encuentra su mouse otra vez.',
  },
  {
    id: 'ceo',
    name: 'Oficina Ejecutiva',
    subtitle: 'Carmen Silva — CEO',
    icon: Crown,
    color: Colors.accent.red,
    npcIds: ['carmen'],
    objectIds: [],
    ambient: 'Madera oscura, vista a la ciudad, ningún equipo a la vista. Carmen revisa números en su tablet sin levantar la mirada.',
  },
];

const CHAPTERS_TECNOGLOBAL: Chapter[] = [
  {
    id: 'ch1',
    title: 'Capítulo 1 — Briefing',
    objective: 'Habla con Roberto en el Lobby de TI',
    hint: 'Roberto te dará el contexto del caso. Está en el primer cuarto.',
    isComplete: (s) => s.spokenNpcs.has('roberto'),
  },
  {
    id: 'ch2',
    title: 'Capítulo 2 — Reconocimiento',
    objective: 'Visita las 5 áreas de la oficina',
    hint: 'Recorre cada sala desde el selector superior para entender el terreno.',
    isComplete: (s) => s.visitedRooms.size >= 5,
  },
  {
    id: 'ch3',
    title: 'Capítulo 3 — Entrevistas',
    objective: 'Entrevista a María, Carlos y Pedro',
    hint: 'Cada empleado revela una pista distinta sobre las vulnerabilidades.',
    isComplete: (s) => ['maria', 'carlos', 'pedro'].every((n) => s.spokenNpcs.has(n)),
  },
  {
    id: 'ch4',
    title: 'Capítulo 4 — Hallazgos técnicos',
    objective: 'Inspecciona al menos 5 dispositivos',
    hint: 'Toca servidores, routers y PCs para documentar vulnerabilidades.',
    isComplete: (s) => s.foundIds.size >= 5,
  },
  {
    id: 'ch5',
    title: 'Capítulo 5 — Reto técnico',
    objective: 'Completa un desafío de contraseña y uno de phishing',
    hint: 'Inspecciona la PC de María (contraseña) y el Servidor de Correo (phishing).',
    isComplete: (s) => s.completedChallenges.has('password') && s.completedChallenges.has('phishing'),
  },
  {
    id: 'ch6',
    title: 'Capítulo 6 — Presentación a directiva',
    objective: 'Convence a Carmen, la CEO',
    hint: 'Con los hallazgos en mano, sube a la Oficina Ejecutiva.',
    isComplete: (s) => s.spokenNpcs.has('carmen') && s.foundIds.size >= 6,
  },
];

// ─────────── Banco Nacional (World 2) ───────────

const ROOMS_BANK: Room[] = [
  {
    id: 'lobby',
    name: 'Vestíbulo Central',
    subtitle: 'Recepción del Banco Nacional',
    icon: Landmark,
    color: '#D4A843',
    npcIds: [],
    objectIds: [],
    ambient: 'Columnas de mármol y un guardia silencioso. El aroma a café caro flota en el aire. Una terminal de atención al cliente parpadea con errores.',
  },
  {
    id: 'servers',
    name: 'Data Center Financiero',
    subtitle: 'Centro de procesamiento',
    icon: Server,
    color: Colors.accent.purple,
    npcIds: [],
    objectIds: [],
    ambient: 'Aire helado y filas de racks con luces verdes. Un zumbido constante que impone respeto. Alguien dejó una nota adhesiva con una contraseña.',
  },
  {
    id: 'admin',
    name: 'Tesorería',
    subtitle: 'Operaciones financieras',
    icon: Briefcase,
    color: Colors.accent.purple,
    npcIds: [],
    objectIds: [],
    ambient: 'Pantallas con gráficas bursátiles y una caja fuerte abierta. Los cajeros atienden detrás de cristal blindado mientras suena un teléfono sin parar.',
  },
  {
    id: 'support',
    name: 'Soporte Bancario',
    subtitle: 'TI y atención remota',
    icon: Wrench,
    color: Colors.accent.yellow,
    npcIds: [],
    objectIds: [],
    ambient: 'Cabinas telefónicas con headsets colgados. Un tablero de incidentes muestra 47 tickets abiertos desde hace semanas.',
  },
  {
    id: 'ceo',
    name: 'Dirección General',
    subtitle: 'Presidencia Ejecutiva',
    icon: Crown,
    color: Colors.accent.red,
    npcIds: [],
    objectIds: [],
    ambient: 'Oficina en el último piso con vista a la catedral. Un escritorio de caoba con papeles del regulador financiero esparcidos.',
  },
];

const CHAPTERS_BANK: Chapter[] = [
  {
    id: 'ch1',
    title: 'Capítulo 1 — Llamado urgente',
    objective: 'Preséntate en el Vestíbulo Central',
    hint: 'El director de seguridad te espera en la recepción principal.',
    isComplete: (s) => s.visitedRooms.has('lobby'),
  },
  {
    id: 'ch2',
    title: 'Capítulo 2 — Análisis financiero',
    objective: 'Revisa el Data Center y la Tesorería',
    hint: 'Las áreas críticas de procesamiento y operaciones esconden las vulnerabilidades.',
    isComplete: (s) => s.visitedRooms.has('servers') && s.visitedRooms.has('admin'),
  },
  {
    id: 'ch3',
    title: 'Capítulo 3 — Fraude digital',
    objective: 'Inspecciona las terminales de soporte',
    hint: 'Las cabinas de atención remota pueden estar siendo usadas para ingeniería social.',
    isComplete: (s) => s.foundIds.size >= 3,
  },
  {
    id: 'ch4',
    title: 'Capítulo 4 — Cumplimiento',
    objective: 'Presenta hallazgos a Dirección General',
    hint: 'Con al menos 5 hallazgos, reúnete con la presidencia ejecutiva.',
    isComplete: (s) => s.foundIds.size >= 5 && s.visitedRooms.has('ceo'),
  },
];

// ─────────── Hospital Central (World 3) ───────────

const ROOMS_HOSPITAL: Room[] = [
  {
    id: 'lobby',
    name: 'Recepción Hospitalaria',
    subtitle: 'Admisión y triaje',
    icon: Stethoscope,
    color: '#E74C3C',
    npcIds: [],
    objectIds: [],
    ambient: 'Sillas de plástico azul, una televisión con noticias y una máquina de turnos que imprime números sin cesar. El olor a desinfectante es inconfundible.',
  },
  {
    id: 'servers',
    name: 'Centro de Datos Médico',
    subtitle: 'Infraestructura clínica',
    icon: Server,
    color: Colors.accent.purple,
    npcIds: [],
    objectIds: [],
    ambient: 'Servidores con registros de pacientes. Un monitor muestra alertas de acceso no autorizado. La privacidad de miles de historiales clínicos depende de este cuarto.',
  },
  {
    id: 'admin',
    name: 'Archivo Clínico',
    subtitle: 'Expedientes y recetas',
    icon: Briefcase,
    color: Colors.accent.purple,
    npcIds: [],
    objectIds: [],
    ambient: 'Estanterías metálicas con carpetas de colores. Una computadora antigua que aún usa Windows XP gestiona las recetas electrónicas.',
  },
  {
    id: 'support',
    name: 'Sala de Monitoreo',
    subtitle: 'Dispositivos médicos conectados',
    icon: Wrench,
    color: Colors.accent.yellow,
    npcIds: [],
    objectIds: [],
    ambient: 'Pantallas con signos vitales de pacientes en tiempo real. Bombas de infusión y marcapasos conectados a la red. Un ataque aquí sería catastrófico.',
  },
  {
    id: 'ceo',
    name: 'Dirección Médica',
    subtitle: 'Junta Directiva',
    icon: Crown,
    color: Colors.accent.red,
    npcIds: [],
    objectIds: [],
    ambient: 'Retratos de médicos fundadores en la pared. Una tableta con reportes de cumplimiento HIPAA y una pila de cartas del regulador de salud.',
  },
];

const CHAPTERS_HOSPITAL: Chapter[] = [
  {
    id: 'ch1',
    title: 'Capítulo 1 — Emergencia digital',
    objective: 'Acude a la Recepción Hospitalaria',
    hint: 'El director médico te ha llamado por una filtración de datos de pacientes.',
    isComplete: (s) => s.visitedRooms.has('lobby'),
  },
  {
    id: 'ch2',
    title: 'Capítulo 2 — Privacidad del paciente',
    objective: 'Revisa el Centro de Datos Médico y el Archivo Clínico',
    hint: 'Los historiales clínicos son el activo más valioso y vulnerable del hospital.',
    isComplete: (s) => s.visitedRooms.has('servers') && s.visitedRooms.has('admin'),
  },
  {
    id: 'ch3',
    title: 'Capítulo 3 — Dispositivos conectados',
    objective: 'Audita la Sala de Monitoreo',
    hint: 'Los dispositivos IoT médicos son un vector de ataque crítico y muchas veces olvidado.',
    isComplete: (s) => s.foundIds.size >= 6,
  },
  {
    id: 'ch4',
    title: 'Capítulo 4 — Reporte a la junta',
    objective: 'Convence a la Dirección Médica de invertir en ciberseguridad',
    hint: 'Necesitas al menos 8 hallazgos documentados y haber completado los desafíos técnicos.',
    isComplete: (s) => s.foundIds.size >= 8 && s.visitedRooms.has('ceo'),
  },
];

// ─────────── Gobierno Regional (World 4) ───────────

const ROOMS_GOV: Room[] = [
  {
    id: 'lobby',
    name: 'Vestíbulo Ministerial',
    subtitle: 'Acceso principal',
    icon: University,
    color: '#2C3E50',
    npcIds: [],
    objectIds: [],
    ambient: 'Escudos nacionales en las paredes, un detector de metales y escoltas armados. Una pantalla de turnos muestra trámites ciudadanos mientras periodistas esperan.',
  },
  {
    id: 'servers',
    name: 'Centro de Datos Nacional',
    subtitle: 'Infraestructura crítica',
    icon: Server,
    color: Colors.accent.purple,
    npcIds: [],
    objectIds: [],
    ambient: 'Bóveda reforzada con control biométrico. Servidores que alojan registros civiles, tributarios y migratorios. Un ataque reciente dejó cicatrices digitales.',
  },
  {
    id: 'admin',
    name: 'Secretaría General',
    subtitle: 'Administración pública',
    icon: Briefcase,
    color: Colors.accent.purple,
    npcIds: [],
    objectIds: [],
    ambient: 'Escritorios burocráticos con sellos oficiales y pilas de decretos. Una impresora fiscal imprime sin parar. Correos de "ciudadanos" saturan la bandeja.',
  },
  {
    id: 'support',
    name: 'Centro de Cómputo',
    subtitle: 'Soporte y comunicaciones',
    icon: Wrench,
    color: Colors.accent.yellow,
    npcIds: [],
    objectIds: [],
    ambient: 'Estaciones de trabajo con Linux y monitores duales. Un tablero Kanban muestra incidentes: "DDOS en puerta", "Phishing masivo a funcionarios", "Ransomware en trámites".',
  },
  {
    id: 'ceo',
    name: 'Despacho del Ministro',
    subtitle: 'Alta dirección',
    icon: Crown,
    color: Colors.accent.red,
    npcIds: [],
    objectIds: [],
    ambient: 'Sillones de cuero, una bandera nacional y un teléfono rojo de línea directa. El ministro revisa un informe de inteligencia sobre amenazas cibernéticas al país.',
  },
];

const CHAPTERS_GOV: Chapter[] = [
  {
    id: 'ch1',
    title: 'Capítulo 1 — Seguridad nacional',
    objective: 'Accede al Vestíbulo Ministerial',
    hint: 'Un ciberataque sofisticado ha comprometido sistemas gubernamentales.',
    isComplete: (s) => s.visitedRooms.has('lobby'),
  },
  {
    id: 'ch2',
    title: 'Capítulo 2 — Infraestructura crítica',
    objective: 'Inspecciona el Centro de Datos Nacional',
    hint: 'Los servidores que alojan datos de millones de ciudadanos están bajo amenaza.',
    isComplete: (s) => s.visitedRooms.has('servers') && s.foundIds.size >= 3,
  },
  {
    id: 'ch3',
    title: 'Capítulo 3 — Guerra informática',
    objective: 'Analiza el Centro de Cómputo y neutraliza amenazas',
    hint: 'El tablero de incidentes revela ataques coordinados. Documenta y responde.',
    isComplete: (s) => s.foundIds.size >= 7,
  },
  {
    id: 'ch4',
    title: 'Capítulo 4 — Informe al Ministro',
    objective: 'Presenta el reporte de ciberseguridad nacional',
    hint: 'Con más de 10 hallazgos, tienes evidencia suficiente para el despacho ministerial.',
    isComplete: (s) => s.foundIds.size >= 10 && s.visitedRooms.has('ceo'),
  },
];

// ─────────── Master Worlds array ───────────

export const WORLDS: WorldData[] = [
  {
    id: 'tecnoglobal',
    index: 1,
    name: 'TecnoGlobal C.A.',
    company: 'TecnoGlobal',
    subtitle: 'Startup tecnológica con fugas de datos',
    icon: Building2,
    color: Colors.accent.cyan,
    description: 'Una startup en crecimiento con serios problemas de seguridad. Contraseñas débiles, phishing dirigido a empleados y routers sin configurar.',
    unlockXP: 0,
    rooms: ROOMS_TECNOGLOBAL,
    chapters: CHAPTERS_TECNOGLOBAL,
  },
  {
    id: 'banco',
    index: 2,
    name: 'Banco Nacional',
    company: 'Banco Nacional',
    subtitle: 'Entidad financiera bajo ataque de fraude',
    icon: Landmark,
    color: '#D4A843',
    description: 'Un banco centenario enfrenta una ola de fraudes digitales. Transferencias no autorizadas, credenciales robadas y un sistema de compliance obsoleto.',
    unlockXP: 300,
    rooms: ROOMS_BANK,
    chapters: CHAPTERS_BANK,
  },
  {
    id: 'hospital',
    index: 3,
    name: 'Hospital Central',
    company: 'Hospital Central',
    subtitle: 'Privacidad de pacientes en riesgo',
    icon: Stethoscope,
    color: '#E74C3C',
    description: 'El hospital más grande de la región sufre una filtración masiva de expedientes clínicos. Dispositivos médicos IoT vulnerables y sistemas sin actualizar.',
    unlockXP: 800,
    rooms: ROOMS_HOSPITAL,
    chapters: CHAPTERS_HOSPITAL,
  },
  {
    id: 'gobierno',
    index: 4,
    name: 'Gobierno Regional',
    company: 'Gobierno Regional',
    subtitle: 'Ciberataque a infraestructura nacional',
    icon: University,
    color: '#2C3E50',
    description: 'Una entidad gubernamental sufre ataques de un grupo APT. Ransomware, phishing masivo y DDoS coordinado contra sistemas de trámites ciudadanos.',
    unlockXP: 1500,
    rooms: ROOMS_GOV,
    chapters: CHAPTERS_GOV,
  },
];
