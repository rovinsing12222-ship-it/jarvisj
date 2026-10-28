import {
  HapticIntensity,
  HapticPatternStyle,
  HapticFeedbackConfig,
  HapticAlertType,
  AlertHapticPatternConfig,
  AlertHapticsMap,
} from '../types';

export const DEFAULT_HAPTIC_CONFIG: HapticFeedbackConfig = {
  enabled: true,
  intensity: 'standard',
  patternStyle: 'balanced',
  customDurationMultiplier: 1.0,
  actionSpecificPatterns: true,
  vibrateOnVoiceWake: true,
  vibrateOnCommandComplete: true,
};

const STORAGE_KEY = 'jarvis_haptic_config';
const ALERT_HAPTICS_STORAGE_KEY = 'jarvis_alert_haptics_custom_v1';

export const INTENSITY_MULTIPLIERS: Record<HapticIntensity, number> = {
  off: 0,
  subtle: 0.5,
  standard: 1.0,
  strong: 1.5,
  maximum: 2.0,
};

export const PATTERN_STYLE_PRESETS: Record<HapticPatternStyle, { name: string; description: string; basePattern: number[] }> = {
  balanced: {
    name: 'Balanced System',
    description: 'Dynamic, naturally calibrated feedback customized per action',
    basePattern: [50, 40, 60],
  },
  crisp: {
    name: 'Crisp Clicks',
    description: 'Snappy, ultra-short mechanical tactile switch micro-pulses',
    basePattern: [25, 25, 25],
  },
  double_tap: {
    name: 'Double-Tap Heartbeat',
    description: 'Dual rhythmic heartbeat thumps [pulse-pause-pulse]',
    basePattern: [45, 60, 75],
  },
  cyber_pulse: {
    name: 'Cyber Pulse',
    description: 'Futuristic multi-frequency staggered tech bursts',
    basePattern: [20, 25, 35, 25, 50, 25, 80],
  },
  long_resonance: {
    name: 'Long Resonance',
    description: 'Deep, sustained heavy buzz for high tactile certainty',
    basePattern: [110, 50, 160],
  },
  arc_reactor: {
    name: 'Arc Reactor',
    description: 'Progressive energy-charge pulse sequence inspired by Iron Man',
    basePattern: [30, 35, 50, 35, 70, 35, 110],
  },
};

export interface HapticAlertPreset {
  id: string;
  name: string;
  category: 'Urgent' | 'Minimal' | 'Phone' | 'Rhythmic' | 'Tech' | 'Emergency' | 'Subtle';
  pattern: number[];
  description: string;
}

export const ALERT_PATTERN_PRESETS: HapticAlertPreset[] = [
  {
    id: 'urgent_siren',
    name: 'Urgent Siren Surge',
    category: 'Urgent',
    pattern: [150, 70, 150, 70, 260, 100, 360],
    description: 'Rising pulse train with strong presence for waking up',
  },
  {
    id: 'snappy_double',
    name: 'Snappy Double Click',
    category: 'Minimal',
    pattern: [45, 50, 60],
    description: 'Crisp, mechanical dual-micro-switch clicks for SMS & messages',
  },
  {
    id: 'incoming_ring',
    name: 'Incoming Ring Cadence',
    category: 'Phone',
    pattern: [250, 150, 250, 150, 420],
    description: 'Classic telecom mechanical vibration cadence for incoming calls',
  },
  {
    id: 'heartbeat_double',
    name: 'Heartbeat Double',
    category: 'Rhythmic',
    pattern: [70, 50, 90],
    description: 'Organic lub-dub tactile rhythm for gentle reminders',
  },
  {
    id: 'cyberpunk_staccato',
    name: 'Cyberpunk Staccato',
    category: 'Tech',
    pattern: [25, 30, 25, 30, 50, 40, 80],
    description: 'Rapid multi-burst futuristic syncopation for tech notices',
  },
  {
    id: 'sos_morse',
    name: 'SOS Morse Pulse',
    category: 'Emergency',
    pattern: [80, 50, 80, 50, 80, 150, 220, 70, 220, 70, 220],
    description: 'Standard SOS tactile telegraph for critical emergency alerts',
  },
  {
    id: 'arc_kinetic',
    name: 'Arc Reactor Kinetic',
    category: 'Tech',
    pattern: [30, 30, 60, 30, 90, 30, 160],
    description: 'Progressive energy buildup inspired by Tony Stark',
  },
  {
    id: 'heavy_tremor',
    name: 'Heavy Tremor',
    category: 'Urgent',
    pattern: [350, 120, 450],
    description: 'Deep sustained resonance for loud environments & heavy sleepers',
  },
  {
    id: 'zen_micro_tick',
    name: 'Zen Micro-Tick',
    category: 'Subtle',
    pattern: [25, 35, 25],
    description: 'Polite, ultra-soft whisper vibration for meetings',
  },
  {
    id: 'triple_strobe',
    name: 'Triple Strobe',
    category: 'Minimal',
    pattern: [60, 40, 60, 40, 60],
    description: 'Three rapid crisp pulses in tight sequence',
  },
];

export const DEFAULT_ALERT_HAPTICS: AlertHapticsMap = {
  alarm: {
    id: 'alarm',
    name: 'Alarms & Timers',
    hindiName: 'अलार्म व वेकअप अलर्ट',
    description: 'Urgent, high-cadence rhythmic pulses to reliably wake up and alert the user',
    pattern: [150, 70, 150, 70, 260, 100, 360],
    presetName: 'Urgent Siren Surge',
    repeatCount: 2,
    intensityMultiplier: 1.2,
    enabled: true,
  },
  message: {
    id: 'message',
    name: 'Messages & SMS',
    hindiName: 'मैसेज व एसएमएस अलर्ट',
    description: 'Crisp, snappy mechanical dual-pulse for incoming texts, WhatsApp, and notices',
    pattern: [45, 50, 60],
    presetName: 'Snappy Double Click',
    repeatCount: 1,
    intensityMultiplier: 1.0,
    enabled: true,
  },
  call: {
    id: 'call',
    name: 'Incoming Phone Calls',
    hindiName: 'इनकमिंग फोन कॉल',
    description: 'Long continuous ringing cadence designed for incoming phone & voice calls',
    pattern: [250, 150, 250, 150, 420],
    presetName: 'Incoming Ring Cadence',
    repeatCount: 3,
    intensityMultiplier: 1.2,
    enabled: true,
  },
  reminder: {
    id: 'reminder',
    name: 'Reminders & Tasks',
    hindiName: 'रिमाइंडर व शेड्यूल टास्क',
    description: 'Pleasant, balanced reminder double-tap that is noticeable without being intrusive',
    pattern: [70, 50, 90],
    presetName: 'Heartbeat Double',
    repeatCount: 1,
    intensityMultiplier: 1.0,
    enabled: true,
  },
  emergency: {
    id: 'emergency',
    name: 'Emergency & Security',
    hindiName: 'इमरजेंसी व सिक्योरिटी अलर्ट',
    description: 'High-alert SOS rhythmic bursts for system warnings, device locks, and critical events',
    pattern: [120, 50, 120, 50, 120, 120, 320, 80, 320],
    presetName: 'SOS Morse Pulse',
    repeatCount: 2,
    intensityMultiplier: 1.4,
    enabled: true,
  },
  voice_wake: {
    id: 'voice_wake',
    name: 'Voice Wake & Commands',
    hindiName: 'वॉयस वेक व असिस्टेंट ट्रिगर',
    description: 'Quick futuristic tactile confirmation when "Jarvis" or trigger word is detected',
    pattern: [35, 30, 50],
    presetName: 'Arc Reactor Kinetic',
    repeatCount: 1,
    intensityMultiplier: 0.9,
    enabled: true,
  },
};

export const ACTION_CATEGORY_PATTERNS: Record<string, number[]> = {
  alarm: [150, 70, 150, 70, 260, 100, 360],
  reminder: [70, 50, 90],
  torch: [40, 30, 40],
  call: [250, 150, 250, 150, 420],
  message: [45, 50, 60],
  whatsapp: [45, 50, 60],
  pc_control: [30, 25, 45],
  speech_wake: [35, 30, 50],
  command_done: [50, 40, 70],
  quick_click: [25],
};

let cachedConfig: HapticFeedbackConfig | null = null;
let cachedAlertConfigs: AlertHapticsMap | null = null;
const listeners = new Set<(config: HapticFeedbackConfig) => void>();
const alertListeners = new Set<(map: AlertHapticsMap) => void>();

/**
 * Get all customized alert haptic configurations
 */
export function getAllAlertHapticConfigs(): AlertHapticsMap {
  if (cachedAlertConfigs) return cachedAlertConfigs;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(ALERT_HAPTICS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cachedAlertConfigs = {
          ...DEFAULT_ALERT_HAPTICS,
          ...parsed,
        };
        return cachedAlertConfigs;
      }
    } catch (e) {
      console.warn('Failed to parse alert haptic configs from storage:', e);
    }
  }

  cachedAlertConfigs = { ...DEFAULT_ALERT_HAPTICS };
  return cachedAlertConfigs;
}

/**
 * Get configuration for a specific alert type
 */
export function getAlertHapticConfig(alertType: HapticAlertType): AlertHapticPatternConfig {
  const all = getAllAlertHapticConfigs();
  return all[alertType] || DEFAULT_ALERT_HAPTICS[alertType] || DEFAULT_ALERT_HAPTICS.alarm;
}

/**
 * Save configuration for a specific alert type
 */
export function saveAlertHapticConfig(
  alertType: HapticAlertType,
  patch: Partial<AlertHapticPatternConfig>
): AlertHapticPatternConfig {
  const currentMap = getAllAlertHapticConfigs();
  const existing = currentMap[alertType] || DEFAULT_ALERT_HAPTICS[alertType];
  const updated: AlertHapticPatternConfig = {
    ...existing,
    ...patch,
  };

  const newMap: AlertHapticsMap = {
    ...currentMap,
    [alertType]: updated,
  };

  saveAllAlertHapticConfigs(newMap);
  return updated;
}

/**
 * Save full map of alert haptic configurations
 */
export function saveAllAlertHapticConfigs(map: AlertHapticsMap): void {
  cachedAlertConfigs = { ...map };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ALERT_HAPTICS_STORAGE_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent('jarvis:alert-haptics-updated', { detail: map }));
    } catch (e) {
      console.warn('Failed to save alert haptics to storage:', e);
    }
  }

  alertListeners.forEach((fn) => {
    try {
      fn(cachedAlertConfigs!);
    } catch {}
  });
}

/**
 * Reset one or all alert haptic configurations to factory defaults
 */
export function resetAlertHapticConfig(alertType?: HapticAlertType): void {
  if (alertType) {
    const current = getAllAlertHapticConfigs();
    current[alertType] = { ...DEFAULT_ALERT_HAPTICS[alertType] };
    saveAllAlertHapticConfigs(current);
  } else {
    saveAllAlertHapticConfigs({ ...DEFAULT_ALERT_HAPTICS });
  }
}

/**
 * Subscribe to alert haptics updates
 */
export function subscribeAlertHaptics(listener: (map: AlertHapticsMap) => void): () => void {
  alertListeners.add(listener);
  return () => {
    alertListeners.delete(listener);
  };
}

/**
 * Get current Haptic configuration with fallback to defaults
 */
export function getHapticConfig(): HapticFeedbackConfig {
  if (cachedConfig) return cachedConfig;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cachedConfig = {
          ...DEFAULT_HAPTIC_CONFIG,
          ...parsed,
        };
        return cachedConfig;
      }
    } catch (e) {
      console.warn('Failed to parse haptic config from storage:', e);
    }
  }

  cachedConfig = { ...DEFAULT_HAPTIC_CONFIG };
  return cachedConfig;
}

/**
 * Update and persist Haptic configuration
 */
export function saveHapticConfig(config: Partial<HapticFeedbackConfig>): HapticFeedbackConfig {
  const current = getHapticConfig();
  const updated: HapticFeedbackConfig = {
    ...current,
    ...config,
  };
  cachedConfig = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save haptic config to storage:', e);
    }
  }

  listeners.forEach((listener) => {
    try {
      listener(updated);
    } catch (err) {
      console.error('Haptic config listener error:', err);
    }
  });

  return updated;
}

/**
 * Subscribe to haptic config changes
 */
export function subscribeHapticConfig(listener: (config: HapticFeedbackConfig) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Check if the current browser/device environment supports the Vibration API
 */
export function isVibrationSupported(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Transform a raw pattern into a user-configured pattern based on intensity, style, and duration multiplier
 */
export function resolveHapticPattern(
  rawPattern: number | number[] = [100, 50, 150],
  actionCategory?: string,
  overrideConfig?: Partial<HapticFeedbackConfig>
): number[] {
  const config = { ...getHapticConfig(), ...overrideConfig };

  if (!config.enabled || config.intensity === 'off') {
    return [];
  }

  const intensityMult = INTENSITY_MULTIPLIERS[config.intensity] ?? 1.0;
  const customMult = Math.max(0.2, Math.min(2.5, config.customDurationMultiplier ?? 1.0));
  let totalMultiplier = intensityMult * customMult;

  if (totalMultiplier <= 0) {
    return [];
  }

  let baseList: number[] = [];
  let alertRepeat = 1;

  // Check if actionCategory matches one of our customizable alert types
  const alertMap = getAllAlertHapticConfigs();
  const alertType = actionCategory as HapticAlertType;

  if (config.actionSpecificPatterns && alertType && alertMap[alertType]) {
    const alertCfg = alertMap[alertType];
    if (!alertCfg.enabled) {
      return [];
    }
    baseList = [...alertCfg.pattern];
    totalMultiplier *= (alertCfg.intensityMultiplier ?? 1.0);
    alertRepeat = Math.max(1, Math.min(5, alertCfg.repeatCount ?? 1));
  } else if (config.actionSpecificPatterns && actionCategory && ACTION_CATEGORY_PATTERNS[actionCategory]) {
    baseList = [...ACTION_CATEGORY_PATTERNS[actionCategory]];
  } else if (config.patternStyle !== 'balanced' && PATTERN_STYLE_PRESETS[config.patternStyle]) {
    baseList = [...PATTERN_STYLE_PRESETS[config.patternStyle].basePattern];
  } else {
    baseList = Array.isArray(rawPattern) ? [...rawPattern] : [rawPattern];
  }

  // Modulate duration pulses and pauses
  const resolvedBase: number[] = baseList.map((duration, index) => {
    const isVibrationPulse = index % 2 === 0;
    if (isVibrationPulse) {
      return Math.max(8, Math.round(duration * totalMultiplier));
    } else {
      const pauseMult = Math.max(0.6, Math.min(1.4, totalMultiplier));
      return Math.max(15, Math.round(duration * pauseMult));
    }
  });

  // If repeated loops configured (e.g., Alarms or incoming Calls)
  if (alertRepeat > 1 && resolvedBase.length > 0) {
    const fullSequence: number[] = [];
    for (let i = 0; i < alertRepeat; i++) {
      fullSequence.push(...resolvedBase);
      if (i < alertRepeat - 1) {
        fullSequence.push(200); // 200ms gap between repeated pattern loops
      }
    }
    return fullSequence;
  }

  return resolvedBase;
}

/**
 * Central trigger for all Jarvis haptic feedback.
 * Respects user intensity, pattern style, duration multiplier, alert-specific customizations, and master toggle.
 */
export function triggerHaptic(
  pattern: number | number[] = [100, 50, 150],
  actionCategory?: string
): number[] {
  const resolvedPattern = resolveHapticPattern(pattern, actionCategory);

  if (resolvedPattern.length === 0) {
    return [];
  }

  // Dispatch browser vibration if available
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(resolvedPattern);
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }

  // Dispatch custom event for visual vibration animations and telemetry
  if (typeof window !== 'undefined') {
    try {
      const event = new CustomEvent('jarvis-haptic-triggered', {
        detail: {
          pattern: resolvedPattern,
          actionCategory: actionCategory || 'general',
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(event);
    } catch {
      // ignore
    }
  }

  return resolvedPattern;
}

/**
 * Specifically trigger haptic feedback for a designated alert type (e.g. 'alarm', 'message', 'call')
 */
export function triggerAlertHaptic(alertType: HapticAlertType): number[] {
  const alertConfig = getAlertHapticConfig(alertType);
  if (!alertConfig.enabled) return [];
  return triggerHaptic(alertConfig.pattern, alertType);
}

/**
 * Test a specific pattern style and intensity immediately (e.g. for the Settings Tab preview)
 */
export function testHapticFeedback(
  patternStyle?: HapticPatternStyle,
  intensity?: HapticIntensity,
  actionCategory?: string
): number[] {
  const config = getHapticConfig();
  const testConfig: Partial<HapticFeedbackConfig> = {
    enabled: true,
    patternStyle: patternStyle || config.patternStyle,
    intensity: intensity || (config.intensity === 'off' ? 'standard' : config.intensity),
  };

  const pattern = resolveHapticPattern(
    PATTERN_STYLE_PRESETS[testConfig.patternStyle || 'balanced']?.basePattern || [50, 40, 60],
    actionCategory,
    testConfig
  );

  if (pattern.length > 0) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Vibration API error:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('jarvis-haptic-triggered', {
            detail: {
              pattern,
              actionCategory: actionCategory || 'preview_test',
              isTest: true,
              timestamp: Date.now(),
            },
          })
        );
      } catch {
        // ignore
      }
    }
  }

  return pattern;
}

/**
 * Test an alert pattern sequence directly with repeats and custom multiplier
 */
export function testAlertHapticPattern(
  rawPattern: number[],
  intensityMultiplier: number = 1.0,
  repeatCount: number = 1
): number[] {
  const config = getHapticConfig();
  const masterMult = config.enabled && config.intensity !== 'off'
    ? INTENSITY_MULTIPLIERS[config.intensity]
    : 1.0;

  const totalMult = masterMult * intensityMultiplier;

  const baseResolved = rawPattern.map((dur, idx) => {
    const isPulse = idx % 2 === 0;
    return isPulse ? Math.max(8, Math.round(dur * totalMult)) : Math.max(15, Math.round(dur));
  });

  const fullSequence: number[] = [];
  const loops = Math.max(1, Math.min(5, repeatCount));
  for (let i = 0; i < loops; i++) {
    fullSequence.push(...baseResolved);
    if (i < loops - 1) {
      fullSequence.push(200);
    }
  }

  if (fullSequence.length > 0) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(fullSequence);
      } catch (e) {
        console.warn('Vibration API error:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('jarvis-haptic-triggered', {
            detail: {
              pattern: fullSequence,
              actionCategory: 'alert_customizer_test',
              isTest: true,
              timestamp: Date.now(),
            },
          })
        );
      } catch {
        // ignore
      }
    }
  }

  return fullSequence;
}
