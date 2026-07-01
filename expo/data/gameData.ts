// CyberGuard RPG - Game Data
// Datos de NPCs, objetos, diálogos y desafíos

import { Colors } from '@/constants/theme';
import { 
  User, UserCircle, UserCog, UserCheck, UserX,
  Server, Router, Monitor, Lock, Mail, Shield, 
  FileText, AlertTriangle, Wifi, HardDrive
} from 'lucide-react-native';

// NPCs del juego
export interface NPC {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  position: { x: number; y: number };
  color: string;
  dialogues: Dialogue[];
  vulnerabilities: Vulnerability[];
}

export interface Dialogue {
  id: string;
  text: string;
  options?: DialogueOption[];
  condition?: string;
  reward?: { type: 'xp' | 'info' | 'hint' | 'vulnerability'; value: number | string };
}

export interface DialogueOption {
  text: string;
  nextId: string;
  response?: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  found: boolean;
}

// Objetos interactivos en la oficina
export interface OfficeObject {
  id: string;
  name: string;
  type: 'server' | 'router' | 'computer' | 'printer' | 'terminal' | 'wifi' | 'file';
  position: { x: number; y: number };
  icon: string;
  color: string;
  description: string;
  vulnerabilities: Vulnerability[];
  challenge?: Challenge;
}

export interface Challenge {
  type: 'password' | 'phishing' | 'permissions' | 'network' | 'browser';
  title: string;
  description: string;
}

// NPCs de TecnoGlobal C.A.
export const NPCs: NPC[] = [
  {
    id: 'roberto',
    name: 'Roberto Mendoza',
    role: 'Gerente de TI',
    description: 'Contacto principal, estresado por la situación',
    avatar: 'roberto',
    position: { x: 200, y: 150 },
    color: Colors.accent.cyan,
    dialogues: [
      {
        id: 'intro',
        text: '¡Bienvenido! Soy Roberto, el Gerente de TI. Estoy desesperado - tenemos vulnerabilidades por todas partes y la CEO no quiere invertir en seguridad.',
        options: [
          { text: 'Cuéntame más sobre los problemas', nextId: 'problems' },
          { text: '¿Qué sistemas debo revisar?', nextId: 'systems' },
          { text: 'Empezaré la auditoría ahora', nextId: 'goodbye' },
        ],
      },
      {
        id: 'problems',
        text: 'Tenemos contraseñas débiles, correos sospechosos que nadie reporta, y el router aún tiene la contraseña por defecto. Carlos del soporte guarda todo en su escritorio...',
        reward: { type: 'hint', value: 'Revisa el router principal y el escritorio de Carlos' },
        options: [
          { text: '¿Quién más debo entrevistar?', nextId: 'people' },
          { text: 'Voy a investigar', nextId: 'goodbye' },
        ],
      },
      {
        id: 'systems',
        text: 'Necesito que revises: el servidor principal en la sala de servidores, el router del pasillo, las computadoras de los empleados, y nuestro sistema de correo.',
        reward: { type: 'xp', value: 50 },
        options: [
          { text: 'Entendido, revisaré todo', nextId: 'goodbye' },
        ],
      },
      {
        id: 'people',
        text: 'Habla con María de Administración - ella maneja datos sensibles. Carlos del soporte es desordenado pero sabe mucho. Pedro es nuevo y causó un problema sin querer.',
        options: [
          { text: 'Gracias, hablaré con ellos', nextId: 'goodbye' },
        ],
      },
      {
        id: 'goodbye',
        text: '¡Suerte con la auditoría! Confío en que encontrarás todas las vulnerabilidades.',
      },
    ],
    vulnerabilities: [
      {
        id: 'roberto_1',
        title: 'Falta de presupuesto de seguridad',
        description: 'La CEO no prioriza la inversión en seguridad informática',
        severity: 'high',
        found: false,
      },
    ],
  },
  {
    id: 'maria',
    name: 'María González',
    role: 'Administradora',
    description: 'Preocupada por datos sensibles',
    avatar: 'maria',
    position: { x: 350, y: 280 },
    color: Colors.accent.purple,
    dialogues: [
      {
        id: 'intro',
        text: 'Hola, soy María. Estoy muy preocupada - manejo información de clientes y no estoy segura de que esté protegida correctamente.',
        options: [
          { text: '¿Qué tipo de datos manejas?', nextId: 'data' },
          { text: '¿Cómo proteges los archivos?', nextId: 'protection' },
        ],
      },
      {
        id: 'data',
        text: 'Tengo archivos con datos personales, números de tarjetas de crédito y documentos de identidad. Los guardo en una carpeta llamada "IMPORTANTE" en el servidor.',
        reward: { type: 'hint', value: 'Busca la carpeta IMPORTANTE en el servidor' },
        options: [
          { text: '¿Están encriptados?', nextId: 'encryption' },
          { text: '¿Quién tiene acceso?', nextId: 'access' },
        ],
      },
      {
        id: 'protection',
        text: 'Uso contraseñas que son fáciles de recordar... como el nombre de mi gato seguido de 123. Todos los archivos están en el servidor compartido.',
        reward: { type: 'vulnerability', value: 'Contraseña débil en cuenta de administradora' },
        options: [
          { text: 'Eso es un riesgo grave', nextId: 'risk' },
        ],
      },
      {
        id: 'encryption',
        text: '¿Encriptados? No... nunca me enseñaron eso. Pensaba que la contraseña del servidor era suficiente.',
        reward: { type: 'vulnerability', value: 'Datos sensibles sin encriptar' },
        options: [
          { text: 'Te ayudaré a mejorar esto', nextId: 'help' },
        ],
      },
      {
        id: 'access',
        text: 'Todo el departamento tiene acceso al servidor. Incluso el personal nuevo puede ver todo... eso no está bien, ¿verdad?',
        reward: { type: 'vulnerability', value: 'Permisos excesivos en servidor' },
        options: [
          { text: 'Necesitan controles de acceso', nextId: 'controls' },
        ],
      },
      {
        id: 'risk',
        text: 'Oh no... ¿debo cambiar mi contraseña ahora mismo?',
        options: [
          { text: 'Sí, y necesitamos encriptar esos archivos', nextId: 'help' },
        ],
      },
      {
        id: 'controls',
        text: 'Entiendo. Necesitamos dar acceso solo a quienes realmente lo necesitan.',
        options: [
          { text: 'Exacto, eso es el principio del menor privilegio', nextId: 'goodbye' },
        ],
      },
      {
        id: 'help',
        text: 'Gracias por ayudarnos. Me siento más tranquila sabiendo que alguien experto está revisando todo.',
        reward: { type: 'xp', value: 75 },
      },
      {
        id: 'goodbye',
        text: 'Hasta luego. Cuida bien esos datos de los clientes.',
      },
    ],
    vulnerabilities: [
      {
        id: 'maria_1',
        title: 'Contraseña débil - nombre de mascota + 123',
        description: 'María usa "Gatito123" como contraseña',
        severity: 'high',
        found: false,
      },
      {
        id: 'maria_2',
        title: 'Datos sensibles sin encriptar',
        description: 'Archivos con información de clientes almacenados sin cifrado',
        severity: 'critical',
        found: false,
      },
    ],
  },
  {
    id: 'carlos',
    name: 'Carlos Ruiz',
    role: 'Soporte Técnico',
    description: 'Técnico pero desorganizado',
    avatar: 'carlos',
    position: { x: 120, y: 350 },
    color: Colors.accent.yellow,
    dialogues: [
      {
        id: 'intro',
        text: '¿Qué tal? Soy Carlos. Estoy en medio de... bueno, de todo. ¿Necesitas algo? Tengo contraseñas escritas en post-its y... espera, no debería decir eso.',
        options: [
          { text: '¿Contraseñas en post-its?', nextId: 'passwords' },
          { text: 'Muéstrame tu área de trabajo', nextId: 'workspace' },
        ],
      },
      {
        id: 'passwords',
        text: 'Bueno... sí. Tengo que recordar tantas: del router, del servidor, del WiFi... Las escribo en notas adhesivas. Algunas están en mi monitor.',
        reward: { type: 'vulnerability', value: 'Contraseñas expuestas físicamente' },
        options: [
          { text: '¿Y el acceso remoto?', nextId: 'remote' },
          { text: '¿Quién más tiene acceso aquí?', nextId: 'access' },
        ],
      },
      {
        id: 'workspace',
        text: 'Mira, aquí tengo mis herramientas, cables... y sí, esas notas con contraseñas. También dejo mi sesión abierta cuando salgo a almorzar.',
        reward: { type: 'vulnerability', value: 'Sesiones abiertas sin supervisión' },
        options: [
          { text: 'Eso es muy peligroso', nextId: 'danger' },
        ],
      },
      {
        id: 'remote',
        text: 'Ah, sí. Uso TeamViewer con contraseña fija "123456" para acceder desde casa. Es muy conveniente.',
        reward: { type: 'vulnerability', value: 'Acceso remoto con contraseña por defecto' },
        options: [
          { text: 'Eso necesita cambiar inmediatamente', nextId: 'urgent' },
        ],
      },
      {
        id: 'access',
        text: 'Todo el personal de TI tiene llaves. Y a veces dejo la puerta abierta... el baño queda lejos.',
        reward: { type: 'vulnerability', value: 'Acceso físico no controlado' },
        options: [
          { text: 'Necesitan controles de acceso', nextId: 'controls' },
        ],
      },
      {
        id: 'danger',
        text: '¿De verdad? Pensaba que solo los hackers remotos eran el problema...',
        options: [
          { text: 'Las amenazas internas son comunes', nextId: 'awareness' },
        ],
      },
      {
        id: 'urgent',
        text: 'Entendido. Lo cambiaré hoy mismo... bueno, mañana.',
        reward: { type: 'xp', value: 60 },
        options: [
          { text: 'Asegúrate de hacerlo', nextId: 'goodbye' },
        ],
      },
      {
        id: 'controls',
        text: 'Tienes razón. Voy a ser más cuidadoso.',
        options: [
          { text: 'Excelente', nextId: 'goodbye' },
        ],
      },
      {
        id: 'awareness',
        text: 'No lo había pensado así. Gracias por la información.',
        reward: { type: 'xp', value: 40 },
      },
      {
        id: 'goodbye',
        text: 'Nos vemos. Voy a limpiar estos post-its...',
      },
    ],
    vulnerabilities: [
      {
        id: 'carlos_1',
        title: 'Contraseñas escritas en post-its',
        description: 'Contraseñas expuestas físicamente en el área de trabajo',
        severity: 'critical',
        found: false,
      },
      {
        id: 'carlos_2',
        title: 'Sesiones abiertas sin supervisión',
        description: 'Carlos deja sus sesiones iniciadas al alejarse de su puesto',
        severity: 'medium',
        found: false,
      },
      {
        id: 'carlos_3',
        title: 'TeamViewer con contraseña débil',
        description: 'Acceso remoto configurado con "123456"',
        severity: 'critical',
        found: false,
      },
    ],
  },
  {
    id: 'pedro',
    name: 'Pedro Almeida',
    role: 'Desarrollador Junior',
    description: 'Causó brecha sin saberlo',
    avatar: 'pedro',
    position: { x: 450, y: 180 },
    color: Colors.accent.green,
    dialogues: [
      {
        id: 'intro',
        text: 'Hola... soy Pedro. Soy nuevo aquí. Roberto me dijo que hablara contigo. La verdad es que cometí un error la semana pasada...',
        options: [
          { text: 'Cuéntame qué pasó', nextId: 'mistake' },
          { text: '¿Qué tipo de error?', nextId: 'type' },
        ],
      },
      {
        id: 'mistake',
        text: 'Descargué una "herramienta de productividad" de un sitio que me recomendaron. Después mi computadora empezó a funcionar lento...',
        reward: { type: 'vulnerability', value: 'Posible malware en estación de trabajo' },
        options: [
          { text: '¿Reportaste esto?', nextId: 'report' },
          { text: '¿Qué sitio era?', nextId: 'website' },
        ],
      },
      {
        id: 'type',
        text: 'Fue un software de edición de código. Lo busqué en Google y descargué el primero que apareció. No tenía antivirus activo...',
        reward: { type: 'vulnerability', value: 'Descarga de software no verificado' },
        options: [
          { text: '¿Tienes permisos de administrador?', nextId: 'admin' },
        ],
      },
      {
        id: 'report',
        text: 'No... me da vergüenza. Pensé que podía arreglarlo yo mismo. Borré el programa pero sigue raro.',
        reward: { type: 'vulnerability', value: 'Incidente de seguridad no reportado' },
        options: [
          { text: 'Necesitamos escanear tu equipo', nextId: 'scan' },
        ],
      },
      {
        id: 'website',
        text: 'Era algo como "code-editor-cracked.net"... ahora que lo digo suena mal, ¿verdad?',
        reward: { type: 'hint', value: 'La computadora de Pedro tiene malware' },
        options: [
          { text: 'Eso definitivamente es sospechoso', nextId: 'suspicious' },
        ],
      },
      {
        id: 'admin',
        text: 'Sí, Carlos me dio permisos de admin "para que no lo molestara cada vez que necesitaba instalar algo".',
        reward: { type: 'vulnerability', value: 'Privilegios de administrador excesivos' },
        options: [
          { text: 'Eso es un riesgo mayor', nextId: 'risk' },
        ],
      },
      {
        id: 'scan',
        text: 'De acuerdo. Espero no meterme en problemas...',
        options: [
          { text: 'Es mejor reportar a tiempo que ocultar', nextId: 'lesson' },
        ],
      },
      {
        id: 'suspicious',
        text: 'Sí... me dejé llevar por querer ser productivo rápido.',
        options: [
          { text: 'La próxima vez verifica las fuentes', nextId: 'lesson' },
        ],
      },
      {
        id: 'risk',
        text: 'Entiendo ahora. No debería tener tanto poder con tan poca experiencia.',
        options: [
          { text: 'Exactamente', nextId: 'lesson' },
        ],
      },
      {
        id: 'lesson',
        text: 'Gracias por no juzgarme. He aprendido la lección.',
        reward: { type: 'xp', value: 80 },
      },
    ],
    vulnerabilities: [
      {
        id: 'pedro_1',
        title: 'Malware en estación de trabajo',
        description: 'Computadora infectada por software descargado de sitio no confiable',
        severity: 'high',
        found: false,
      },
      {
        id: 'pedro_2',
        title: 'Privilegios de administrador innecesarios',
        description: 'Desarrollador junior tiene permisos de admin en su estación',
        severity: 'medium',
        found: false,
      },
    ],
  },
  {
    id: 'carmen',
    name: 'Carmen Silva',
    role: 'CEO',
    description: 'Escéptica de gastar en seguridad',
    avatar: 'carmen',
    position: { x: 550, y: 100 },
    color: Colors.accent.red,
    dialogues: [
      {
        id: 'intro',
        text: 'Soy Carmen, la CEO. Roberto me obligó a contratar esta auditoría, pero honestamente no veo por qué deberíamos gastar más en "seguridad informática". Nunca hemos tenido problemas.',
        options: [
          { text: '¿Nunca han tenido incidentes?', nextId: 'incidents' },
          { text: 'El costo de un ataque supera la prevención', nextId: 'cost' },
        ],
      },
      {
        id: 'incidents',
        text: 'Bueno... a veces las computadoras están lentas. Y una vez no pudimos acceder a archivos por un día, pero Carlos lo arregló.',
        reward: { type: 'hint', value: 'Posible ataque de ransomware anterior no identificado' },
        options: [
          { text: 'Eso suena como un ataque de ransomware', nextId: 'ransomware' },
          { text: '¿Tienen respaldos?', nextId: 'backups' },
        ],
      },
      {
        id: 'cost',
        text: 'Eso es lo que dicen todos los vendedores. Nuestros datos no son tan valiosos, somos una empresa pequeña.',
        options: [
          { text: 'Los hackers automatizan ataques a todos', nextId: 'automation' },
          { text: 'Tienen datos de clientes, ¿verdad?', nextId: 'customers' },
        ],
      },
      {
        id: 'ransomware',
        text: '¿Ransomware? Carlos dijo que fue un "error del sistema". ¿Crees que pagamos rescate sin saberlo?',
        reward: { type: 'vulnerability', value: 'Falta de reporte de incidentes de seguridad' },
        options: [
          { text: 'Necesitan un sistema de monitoreo', nextId: 'monitoring' },
        ],
      },
      {
        id: 'backups',
        text: 'Respaldos... Carlos tiene un disco duro externo donde guarda cosas. No sé con qué frecuencia.',
        reward: { type: 'vulnerability', value: 'Sistema de respaldos no formalizado' },
        options: [
          { text: 'Los respaldos deben ser automáticos y verificados', nextId: 'backup_policy' },
        ],
      },
      {
        id: 'automation',
        text: '¿Automatizados? Pensaba que los hackers elegían objetivos específicamente.',
        options: [
          { text: 'Los bots escanean constantemente internet', nextId: 'bots' },
        ],
      },
      {
        id: 'customers',
        text: 'Sí, tenemos información de cientos de clientes... oh. Si eso se filtra, tendríamos problemas legales, ¿verdad?',
        reward: { type: 'xp', value: 100 },
        options: [
          { text: 'Exacto, y multas por GDPR/Ley de Protección de Datos', nextId: 'legal' },
        ],
      },
      {
        id: 'monitoring',
        text: 'Entiendo. Necesitamos saber cuando algo malo está pasando.',
        options: [
          { text: 'Sí, la detección temprana es crucial', nextId: 'convinced' },
        ],
      },
      {
        id: 'backup_policy',
        text: 'Voy a hablar con Roberto sobre esto hoy mismo.',
        options: [
          { text: 'Excelente decisión', nextId: 'convinced' },
        ],
      },
      {
        id: 'bots',
        text: 'No tenía idea. Parece que subestimé el riesgo.',
        options: [
          { text: 'Es muy común', nextId: 'convinced' },
        ],
      },
      {
        id: 'legal',
        text: 'Eso cambia todo. Aprueba lo que necesites para protegernos.',
        reward: { type: 'xp', value: 150 },
      },
      {
        id: 'convinced',
        text: 'Has convencido a una escéptica. Haz tu trabajo y dime qué necesitamos.',
        reward: { type: 'xp', value: 100 },
      },
    ],
    vulnerabilities: [
      {
        id: 'carmen_1',
        title: 'Cultura de seguridad deficiente',
        description: 'Falta de conciencia de seguridad en alta dirección',
        severity: 'high',
        found: false,
      },
    ],
  },
];

// Objetos interactivos en la oficina
export const OfficeObjects: OfficeObject[] = [
  {
    id: 'server_main',
    name: 'Servidor Principal',
    type: 'server',
    position: { x: 280, y: 80 },
    icon: 'server',
    color: Colors.accent.purple,
    description: 'Servidor central de la empresa. Contiene archivos compartidos y bases de datos.',
    vulnerabilities: [
      {
        id: 'server_1',
        title: 'Servidor sin actualizaciones de seguridad',
        description: 'El sistema operativo no tiene parches de seguridad desde hace 6 meses',
        severity: 'critical',
        found: false,
      },
      {
        id: 'server_2',
        title: 'Datos sensibles sin encriptar',
        description: 'La carpeta IMPORTANTE contiene datos de clientes sin protección',
        severity: 'critical',
        found: false,
      },
    ],
    challenge: {
      type: 'permissions',
      title: 'Configuración de Permisos',
      description: 'Configura los permisos de acceso a los archivos sensibles',
    },
  },
  {
    id: 'router_main',
    name: 'Router Principal',
    type: 'router',
    position: { x: 80, y: 120 },
    icon: 'router',
    color: Colors.accent.cyan,
    description: 'Router de red principal. Controla el acceso a internet.',
    vulnerabilities: [
      {
        id: 'router_1',
        title: 'Contraseña por defecto',
        description: 'El router usa "admin/admin" como credenciales',
        severity: 'critical',
        found: false,
      },
      {
        id: 'router_2',
        title: 'WiFi sin encriptación WPA3',
        description: 'La red WiFi usa WEP, un protocolo obsoleto e inseguro',
        severity: 'high',
        found: false,
      },
    ],
    challenge: {
      type: 'network',
      title: 'Configuración de Red',
      description: 'Configura el router con parámetros seguros',
    },
  },
  {
    id: 'pc_maria',
    name: 'PC de María',
    type: 'computer',
    position: { x: 380, y: 280 },
    icon: 'monitor',
    color: Colors.accent.purple,
    description: 'Computadora de la administradora.',
    vulnerabilities: [
      {
        id: 'pc_maria_1',
        title: 'Contraseña en sticky note',
        description: 'La contraseña está pegada en el monitor',
        severity: 'high',
        found: false,
      },
    ],
    challenge: {
      type: 'password',
      title: 'Análisis de Contraseña',
      description: 'Analiza la seguridad de la contraseña encontrada',
    },
  },
  {
    id: 'pc_pedro',
    name: 'PC de Pedro',
    type: 'computer',
    position: { x: 480, y: 180 },
    icon: 'monitor',
    color: Colors.accent.green,
    description: 'Computadora del desarrollador junior.',
    vulnerabilities: [
      {
        id: 'pc_pedro_1',
        title: 'Software malicioso detectado',
        description: 'Posible troyano instalado en el sistema',
        severity: 'critical',
        found: false,
      },
    ],
  },
  {
    id: 'terminal_carlos',
    name: 'Terminal de Carlos',
    type: 'terminal',
    position: { x: 150, y: 350 },
    icon: 'lock',
    color: Colors.accent.yellow,
    description: 'Terminal de administración del soporte técnico.',
    vulnerabilities: [
      {
        id: 'terminal_1',
        title: 'Sesión sin bloqueo',
        description: 'La terminal está desbloqueada y sin supervisión',
        severity: 'medium',
        found: false,
      },
    ],
  },
  {
    id: 'wifi_ap',
    name: 'Punto de Acceso WiFi',
    type: 'wifi',
    position: { x: 180, y: 200 },
    icon: 'wifi',
    color: Colors.accent.cyan,
    description: 'Access Point WiFi de la oficina.',
    vulnerabilities: [
      {
        id: 'wifi_1',
        title: 'SSID broadcast visible',
        description: 'El nombre de red es visible públicamente',
        severity: 'low',
        found: false,
      },
    ],
  },
  {
    id: 'printer_shared',
    name: 'Impresora Compartida',
    type: 'printer',
    position: { x: 320, y: 220 },
    icon: 'file',
    color: Colors.accent.red,
    description: 'Impresora de red compartida.',
    vulnerabilities: [
      {
        id: 'printer_1',
        title: 'Contraseña por defecto en impresora',
        description: 'Panel de admin accesible con credenciales default',
        severity: 'medium',
        found: false,
      },
    ],
  },
  {
    id: 'email_server',
    name: 'Servidor de Correo',
    type: 'server',
    position: { x: 420, y: 100 },
    icon: 'mail',
    color: Colors.accent.cyan,
    description: 'Servidor de correo electrónico de la empresa.',
    vulnerabilities: [
      {
        id: 'email_1',
        title: 'Sin filtro de phishing',
        description: 'Los correos maliciosos no son filtrados',
        severity: 'high',
        found: false,
      },
    ],
    challenge: {
      type: 'phishing',
      title: 'Análisis de Correos',
      description: 'Identifica correos de phishing en la bandeja',
    },
  },
];

// Niveles de habilidades
export const SkillLevels = [
  {
    id: 'password_level',
    number: 1,
    title: 'Contraseñas Seguras',
    description: 'Comprender criterios de contraseñas fuertes',
    objective: 'Crear 3 contraseñas que resistan diferentes ataques',
    completed: false,
  },
  {
    id: 'phishing_level',
    number: 2,
    title: 'Detectando Phishing',
    description: 'Identificar emails fraudulentos',
    objective: 'Clasificar 8/10 correos correctamente',
    completed: false,
  },
  {
    id: 'browser_level',
    number: 3,
    title: 'Navegación Segura',
    description: 'Reconocer sitios web falsos',
    objective: 'Identificar 7/10 sitios correctamente',
    completed: false,
  },
  {
    id: 'permissions_level',
    number: 4,
    title: 'Gestión de Permisos',
    description: 'Configurar permisos de archivos apropiadamente',
    objective: 'Configurar 5 escenarios sin errores',
    completed: false,
  },
  {
    id: 'network_level',
    number: 5,
    title: 'Configuración de Red',
    description: 'Configurar router y switch básicamente',
    objective: 'Configurar 3 dispositivos de forma segura',
    completed: false,
  },
];

// Hallazgos de auditoría
export interface Finding {
  id: string;
  title: string;
  category: 'password' | 'phishing' | 'malware' | 'network' | 'physical' | 'policy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution: string;
  found: boolean;
  xpReward: number;
}

export const AuditFindings: Finding[] = [
  {
    id: 'finding_1',
    title: 'Router con credenciales por defecto',
    category: 'network',
    severity: 'critical',
    description: 'El router principal usa admin/admin',
    solution: 'Cambiar contraseña por una fuerte y única',
    found: false,
    xpReward: 100,
  },
  {
    id: 'finding_2',
    title: 'Contraseñas en post-its',
    category: 'physical',
    severity: 'critical',
    description: 'Contraseñas expuestas físicamente',
    solution: 'Usar gestor de contraseñas y eliminar notas',
    found: false,
    xpReward: 75,
  },
  {
    id: 'finding_3',
    title: 'Malware en estación de trabajo',
    category: 'malware',
    severity: 'critical',
    description: 'Computadora de Pedro infectada',
    solution: 'Escanear y limpiar el sistema, reinstalar si es necesario',
    found: false,
    xpReward: 150,
  },
  {
    id: 'finding_4',
    title: 'Datos sin encriptar',
    category: 'policy',
    severity: 'critical',
    description: 'Información de clientes almacenada sin cifrado',
    solution: 'Implementar encriptación AES-256',
    found: false,
    xpReward: 125,
  },
  {
    id: 'finding_5',
    title: 'Privilegios excesivos',
    category: 'policy',
    severity: 'medium',
    description: 'Personal junior con permisos de admin',
    solution: 'Aplicar principio de menor privilegio',
    found: false,
    xpReward: 75,
  },
  {
    id: 'finding_6',
    title: 'Falta de respaldos automatizados',
    category: 'policy',
    severity: 'high',
    description: 'No hay sistema formal de backups',
    solution: 'Implementar respaldos automatizados 3-2-1',
    found: false,
    xpReward: 100,
  },
  {
    id: 'finding_7',
    title: 'WiFi con WEP',
    category: 'network',
    severity: 'high',
    description: 'Red inalámbrica usa protocolo obsoleto',
    solution: 'Migrar a WPA3 con contraseña fuerte',
    found: false,
    xpReward: 90,
  },
  {
    id: 'finding_8',
    title: 'Sin filtro de phishing',
    category: 'phishing',
    severity: 'high',
    description: 'Correos maliciosos llegan a usuarios',
    solution: 'Implementar gateway de seguridad de correo',
    found: false,
    xpReward: 85,
  },
];
