import { ThemeId, ThemePalette } from '../types';

export const THEME_STORAGE_KEY = 'jarvis_active_theme_id';
export const DEFAULT_THEME_ID: ThemeId = 'classic_jarvis';

export const THEME_PALETTES: Record<ThemeId, ThemePalette> = {
  classic_jarvis: {
    id: 'classic_jarvis',
    name: 'Classic Jarvis',
    tagline: 'Iconic Tony Stark arc-reactor electric cyan & cobalt blues',
    badge: 'Stark Original',
    previewColors: ['#06b6d4', '#3b82f6', '#0284c7', '#020617', '#0b1120'],
    colors: {
      primary: '#06b6d4',
      primaryHover: '#22d3ee',
      primaryRgb: '6, 182, 212',
      secondary: '#3b82f6',
      secondaryRgb: '59, 130, 246',
      accent: '#0284c7',
      accentRgb: '2, 132, 199',
      bgBase: '#020617',
      bgSurface: '#0b1120',
      bgElevated: '#0f172a',
      border: 'rgba(30, 41, 59, 0.85)',
      borderAccent: 'rgba(6, 182, 212, 0.55)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textAccent: '#38bdf8',
      glow: '0 0 25px rgba(6, 182, 212, 0.35)',
      glowRgb: '6, 182, 212',
    },
  },
  neon_cyber: {
    id: 'neon_cyber',
    name: 'Neon Cyber',
    tagline: 'High-voltage cyberpunk neon magenta, electric violet & hot cyan glow',
    badge: 'Cyberpunk 2077',
    previewColors: ['#f43f5e', '#a855f7', '#06b6d4', '#080312', '#120724'],
    colors: {
      primary: '#f43f5e',
      primaryHover: '#fb7185',
      primaryRgb: '244, 63, 94',
      secondary: '#a855f7',
      secondaryRgb: '168, 85, 247',
      accent: '#06b6d4',
      accentRgb: '6, 182, 212',
      bgBase: '#080312',
      bgSurface: '#120724',
      bgElevated: '#1d0b38',
      border: 'rgba(168, 85, 247, 0.35)',
      borderAccent: 'rgba(244, 63, 94, 0.65)',
      textPrimary: '#fff1f2',
      textSecondary: '#e9d5ff',
      textAccent: '#f43f5e',
      glow: '0 0 28px rgba(244, 63, 94, 0.45)',
      glowRgb: '244, 63, 94',
    },
  },
  minimalist_slate: {
    id: 'minimalist_slate',
    name: 'Minimalist Slate',
    tagline: 'Refined monochrome titanium slate, cool zinc & crisp icy silver',
    badge: 'Clean Titanium',
    previewColors: ['#94a3b8', '#64748b', '#e2e8f0', '#090a0f', '#11131a'],
    colors: {
      primary: '#94a3b8',
      primaryHover: '#cbd5e1',
      primaryRgb: '148, 163, 184',
      secondary: '#64748b',
      secondaryRgb: '100, 116, 139',
      accent: '#e2e8f0',
      accentRgb: '226, 232, 240',
      bgBase: '#090a0f',
      bgSurface: '#11131a',
      bgElevated: '#181b24',
      border: 'rgba(71, 85, 105, 0.5)',
      borderAccent: 'rgba(148, 163, 184, 0.45)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textAccent: '#e2e8f0',
      glow: '0 0 20px rgba(148, 163, 184, 0.25)',
      glowRgb: '148, 163, 184',
    },
  },
  emerald_matrix: {
    id: 'emerald_matrix',
    name: 'Emerald Matrix',
    tagline: 'Bio-digital hacker terminal green, obsidian core & neon mint',
    badge: 'Matrix Terminal',
    previewColors: ['#10b981', '#059669', '#6ee7b7', '#020a06', '#05190f'],
    colors: {
      primary: '#10b981',
      primaryHover: '#34d399',
      primaryRgb: '16, 185, 129',
      secondary: '#059669',
      secondaryRgb: '5, 150, 105',
      accent: '#6ee7b7',
      accentRgb: '110, 231, 183',
      bgBase: '#020a06',
      bgSurface: '#05190f',
      bgElevated: '#0a2416',
      border: 'rgba(16, 185, 129, 0.32)',
      borderAccent: 'rgba(16, 185, 129, 0.6)',
      textPrimary: '#ecfdf5',
      textSecondary: '#a7f3d0',
      textAccent: '#10b981',
      glow: '0 0 26px rgba(16, 185, 129, 0.4)',
      glowRgb: '16, 185, 129',
    },
  },
  crimson_stark: {
    id: 'crimson_stark',
    name: 'Crimson Stark',
    tagline: 'Iron Mark armor deep crimson, titanium gold & warm ember reactor',
    badge: 'Mark Armor',
    previewColors: ['#ef4444', '#f59e0b', '#dc2626', '#0b0404', '#170909'],
    colors: {
      primary: '#ef4444',
      primaryHover: '#f87171',
      primaryRgb: '239, 68, 68',
      secondary: '#f59e0b',
      secondaryRgb: '245, 158, 11',
      accent: '#dc2626',
      accentRgb: '220, 38, 38',
      bgBase: '#0b0404',
      bgSurface: '#170909',
      bgElevated: '#251010',
      border: 'rgba(239, 68, 68, 0.35)',
      borderAccent: 'rgba(245, 158, 11, 0.6)',
      textPrimary: '#fef2f2',
      textSecondary: '#fecaca',
      textAccent: '#f59e0b',
      glow: '0 0 26px rgba(239, 68, 68, 0.4)',
      glowRgb: '239, 68, 68',
    },
  },
  amethyst_void: {
    id: 'amethyst_void',
    name: 'Amethyst Void',
    tagline: 'Deep space cosmic nebula purple, celestial indigo & ultraviolet glow',
    badge: 'Cosmic Void',
    previewColors: ['#8b5cf6', '#6366f1', '#c084fc', '#06030e', '#100a26'],
    colors: {
      primary: '#8b5cf6',
      primaryHover: '#a78bfa',
      primaryRgb: '139, 92, 246',
      secondary: '#6366f1',
      secondaryRgb: '99, 102, 241',
      accent: '#c084fc',
      accentRgb: '192, 132, 252',
      bgBase: '#06030e',
      bgSurface: '#100a26',
      bgElevated: '#1b113f',
      border: 'rgba(139, 92, 246, 0.35)',
      borderAccent: 'rgba(139, 92, 246, 0.65)',
      textPrimary: '#faf5ff',
      textSecondary: '#ddd6fe',
      textAccent: '#a78bfa',
      glow: '0 0 26px rgba(139, 92, 246, 0.42)',
      glowRgb: '139, 92, 246',
    },
  },
};

/**
 * Retrieve current active theme ID from localStorage or return default
 */
export const getActiveThemeId = (): ThemeId => {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (saved && THEME_PALETTES[saved]) {
      return saved;
    }
  } catch (err) {
    console.warn('Failed to read theme from localStorage', err);
  }
  return DEFAULT_THEME_ID;
};

/**
 * Get active theme palette object
 */
export const getActiveTheme = (): ThemePalette => {
  const id = getActiveThemeId();
  return THEME_PALETTES[id] || THEME_PALETTES[DEFAULT_THEME_ID];
};

/**
 * Apply theme to document root CSS variables and persist choice
 */
export const applyTheme = (themeId: ThemeId): ThemePalette => {
  const palette = THEME_PALETTES[themeId] || THEME_PALETTES[DEFAULT_THEME_ID];

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const { colors } = palette;

    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-primary-hover', colors.primaryHover);
    root.style.setProperty('--theme-primary-rgb', colors.primaryRgb);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-secondary-rgb', colors.secondaryRgb);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-accent-rgb', colors.accentRgb);
    root.style.setProperty('--theme-bg-base', colors.bgBase);
    root.style.setProperty('--theme-bg-surface', colors.bgSurface);
    root.style.setProperty('--theme-bg-elevated', colors.bgElevated);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-border-accent', colors.borderAccent);
    root.style.setProperty('--theme-text-primary', colors.textPrimary);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-text-accent', colors.textAccent);
    root.style.setProperty('--theme-glow', colors.glow);
    root.style.setProperty('--theme-glow-rgb', colors.glowRgb);

    root.setAttribute('data-theme', palette.id);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, palette.id);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e);
    }

    // Broadcast theme change event across application
    window.dispatchEvent(
      new CustomEvent('jarvis:theme-changed', {
        detail: {
          themeId: palette.id,
          palette,
        },
      })
    );
  }

  return palette;
};

/**
 * Reset theme back to original Classic Jarvis
 */
export const resetToDefaultTheme = (): ThemePalette => {
  return applyTheme(DEFAULT_THEME_ID);
};

/**
 * Get all available theme palettes in consistent display order
 */
export const getAllThemePalettes = (): ThemePalette[] => {
  return Object.values(THEME_PALETTES);
};
