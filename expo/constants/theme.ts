export const Colors = {
  // Primary dark backgrounds
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a25',
    card: '#1e1e2e',
  },
  
  // Neon accent colors
  accent: {
    cyan: '#00f5d4',
    cyanGlow: 'rgba(0, 245, 212, 0.3)',
    green: '#00ff88',
    greenGlow: 'rgba(0, 255, 136, 0.3)',
    purple: '#b967ff',
    purpleGlow: 'rgba(185, 103, 255, 0.3)',
    red: '#ff3366',
    redGlow: 'rgba(255, 51, 102, 0.3)',
    yellow: '#ffd700',
    yellowGlow: 'rgba(255, 215, 0, 0.3)',
    orange: '#ff8c42',
    orangeGlow: 'rgba(255, 140, 66, 0.3)',
    blue: '#4d9de0',
    blueGlow: 'rgba(77, 157, 224, 0.3)',
    pink: '#ff66b2',
    pinkGlow: 'rgba(255, 102, 178, 0.3)',
    teal: '#00d4c8',
    tealGlow: 'rgba(0, 212, 200, 0.3)',
    indigo: '#7c5ce7',
    indigoGlow: 'rgba(124, 92, 231, 0.3)',
    lime: '#a0e740',
    limeGlow: 'rgba(160, 231, 64, 0.3)',
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    muted: '#6b6b7b',
    accent: '#00f5d4',
  },
  
  // Status colors
  status: {
    success: '#00ff88',
    warning: '#ffd700',
    error: '#ff3366',
    info: '#00f5d4',
  },
  
  // Gradient presets
  gradients: {
    primary: ['#0a0a0f', '#12121a'] as const,
    cyber: ['#00f5d4', '#00ff88'] as const,
    alert: ['#ff3366', '#ff6b6b'] as const,
    purple: ['#b967ff', '#6b5ce7'] as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    hero: 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
