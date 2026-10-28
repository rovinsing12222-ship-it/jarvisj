/**
 * J.A.R.V.I.S. Voice Command Activation Sensitivity Threshold & False-Positive Prevention Engine
 * Allows users to adjust the acoustic and linguistic sensitivity threshold for triggering voice commands,
 * filtering out background ambient chatter, television audio, traffic noise, and accidental vocalizations.
 */

export type VoiceSensitivityLevel = 'strict' | 'balanced' | 'sensitive' | 'ultra';

export interface VoiceActivationThresholdConfig {
  sensitivityPercent: number; // 10 to 100 (%)
  minVolumeGate: number; // 0 to 100 (%) - Noise floor gate: mic volume below this is treated as ambient noise
  silenceDebounceMs: number; // 120ms to 600ms - how long speech must settle before firing
  preventFalsePositives: boolean; // Enables smart acoustic and phrase filtering
  filterBackgroundNoise: boolean; // Rejects low confidence / fragmented noise syllables
  minCharacterLength: number; // Minimum characters required to dispatch (default: 2 or 3)
}

export interface ActivationThresholdProfile {
  level: VoiceSensitivityLevel;
  title: string;
  hindiTitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  rejectionLevel: string;
  recommendedFor: string;
  defaultVolumeGate: number;
  defaultDebounceMs: number;
}

export const ACTIVATION_THRESHOLD_STORAGE_KEY = 'jarvis_voice_activation_threshold_config';

export const DEFAULT_ACTIVATION_THRESHOLD_CONFIG: VoiceActivationThresholdConfig = {
  sensitivityPercent: 65, // Balanced High (65%)
  minVolumeGate: 18, // 18% volume floor threshold
  silenceDebounceMs: 240, // 240ms debounce
  preventFalsePositives: true, // Active
  filterBackgroundNoise: true,
  minCharacterLength: 2,
};

/**
 * Common accidental noise fragments, cough sounds, filler syllables and ambient phonemes
 * that cause false-positive activations in noisy rooms.
 */
const FALSE_POSITIVE_NOISE_SNIPPETS = new Set([
  'um',
  'umm',
  'uh',
  'uhh',
  'ah',
  'ahh',
  'oh',
  'er',
  'hmm',
  'hmmm',
  'shh',
  'shhh',
  'ha',
  'aa',
  'ee',
  'oo',
  'ऊँ',
  'आह',
  'ओह',
  'हूँ',
  'हम्म',
]);

/**
 * Retrieve the active voice command activation threshold config from localStorage
 */
export function getVoiceActivationThresholdConfig(): VoiceActivationThresholdConfig {
  if (typeof window === 'undefined') return DEFAULT_ACTIVATION_THRESHOLD_CONFIG;
  try {
    const raw = localStorage.getItem(ACTIVATION_THRESHOLD_STORAGE_KEY);
    if (!raw) return DEFAULT_ACTIVATION_THRESHOLD_CONFIG;
    const parsed = JSON.parse(raw);
    const sensitivityPercent =
      typeof parsed.sensitivityPercent === 'number' && !isNaN(parsed.sensitivityPercent)
        ? Math.max(10, Math.min(100, Math.round(parsed.sensitivityPercent)))
        : DEFAULT_ACTIVATION_THRESHOLD_CONFIG.sensitivityPercent;

    const minVolumeGate =
      typeof parsed.minVolumeGate === 'number' && !isNaN(parsed.minVolumeGate)
        ? Math.max(0, Math.min(60, Math.round(parsed.minVolumeGate)))
        : DEFAULT_ACTIVATION_THRESHOLD_CONFIG.minVolumeGate;

    const silenceDebounceMs =
      typeof parsed.silenceDebounceMs === 'number' && !isNaN(parsed.silenceDebounceMs)
        ? Math.max(120, Math.min(600, Math.round(parsed.silenceDebounceMs)))
        : DEFAULT_ACTIVATION_THRESHOLD_CONFIG.silenceDebounceMs;

    return {
      ...DEFAULT_ACTIVATION_THRESHOLD_CONFIG,
      ...parsed,
      sensitivityPercent,
      minVolumeGate,
      silenceDebounceMs,
      preventFalsePositives: parsed.preventFalsePositives !== false,
      filterBackgroundNoise: parsed.filterBackgroundNoise !== false,
    };
  } catch (err) {
    console.warn('[VoiceActivationThreshold] Storage read error:', err);
    return DEFAULT_ACTIVATION_THRESHOLD_CONFIG;
  }
}

/**
 * Save updated threshold configuration to localStorage and broadcast event
 */
export function saveVoiceActivationThresholdConfig(
  config: Partial<VoiceActivationThresholdConfig>
): VoiceActivationThresholdConfig {
  const current = getVoiceActivationThresholdConfig();
  const updated: VoiceActivationThresholdConfig = {
    ...current,
    ...config,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ACTIVATION_THRESHOLD_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('jarvis:activation-threshold-updated', { detail: updated })
      );
    } catch (err) {
      console.warn('[VoiceActivationThreshold] Storage write error:', err);
    }
  }

  return updated;
}

/**
 * Computes descriptive profile details based on sensitivity percentage (10% to 100%)
 */
export function getActivationThresholdProfile(sensitivity: number): ActivationThresholdProfile {
  if (sensitivity <= 35) {
    return {
      level: 'strict',
      title: 'Strict Noise Shield (उच्च शोर अवरोधक)',
      hindiTitle: 'अधिकतम शोर सुरक्षा (टीवी व ट्रैफिक वातावरण)',
      badge: 'Strict Shield (95% Filter)',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description:
        'Maximum false-positive rejection. Demands high volume and distinct words. Filters out television chatter, cafe background noise, and nearby conversations.',
      rejectionLevel: 'Ultra High (Filters 95% ambient noise & background TV)',
      recommendedFor: 'Active living room with television, moving car, cafe, crowded environment',
      defaultVolumeGate: 30,
      defaultDebounceMs: 380,
    };
  } else if (sensitivity <= 60) {
    return {
      level: 'balanced',
      title: 'Balanced Protection (संतुलित मानक)',
      hindiTitle: 'संतुलित सुरक्षा (सामान्य कमरा व कार्यस्थल)',
      badge: 'Balanced Threshold',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description:
        'Standard everyday threshold. Safely prevents accidental activations while preserving prompt, natural responsiveness for common commands.',
      rejectionLevel: 'Moderate (Filters casual murmurs and room echo)',
      recommendedFor: 'Open office, family living room, study, kitchen',
      defaultVolumeGate: 20,
      defaultDebounceMs: 260,
    };
  } else if (sensitivity <= 85) {
    return {
      level: 'sensitive',
      title: 'High Sensitivity (उच्च संवेदनशीलता)',
      hindiTitle: 'त्वरित संवेदनशीलता (अनुशंसित - शांत कमरा)',
      badge: 'Fast & Responsive',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description:
        'Quick trigger threshold designed for quiet rooms. Accepts normal speech volume with minimal waiting, executing commands in under 200ms.',
      rejectionLevel: 'Low-Moderate (Filters isolated coughs/clicks)',
      recommendedFor: 'Quiet bedroom, private office, late night reading desk',
      defaultVolumeGate: 12,
      defaultDebounceMs: 200,
    };
  } else {
    return {
      level: 'ultra',
      title: 'Ultra-High Whisper (अति-संवेदनशील फुसफुसाहट)',
      hindiTitle: 'फुसफुसाहट मोड (धीमी आवाज व दूरस्थ माइक)',
      badge: 'Whisper Mode (Low Threshold)',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description:
        'Picks up lowest volume whispers and far-field speech across large rooms. May occasionally trigger on background conversations.',
      rejectionLevel: 'Minimal (Acoustic gate wide open for whisper pickup)',
      recommendedFor: 'Very quiet rooms, whispering without disturbing sleeping family',
      defaultVolumeGate: 5,
      defaultDebounceMs: 140,
    };
  }
}

export interface ThresholdEvaluationResult {
  accepted: boolean;
  reason?: string;
  isFalsePositive: boolean;
  cleanText: string;
}

/**
 * Validates whether a recognized spoken transcript passes the activation sensitivity threshold.
 * Prevents false positives caused by ambient noise, coughs, single-syllable mumblings, and low volume.
 */
export function evaluateVoiceCommandThreshold(
  rawTranscript: string,
  audioLevel?: number,
  customConfig?: VoiceActivationThresholdConfig
): ThresholdEvaluationResult {
  const config = customConfig || getVoiceActivationThresholdConfig();
  const clean = (rawTranscript || '').trim();

  if (!clean) {
    return {
      accepted: false,
      reason: 'Empty speech transcript',
      isFalsePositive: true,
      cleanText: '',
    };
  }

  // Check minimum character length
  const minLen = config.sensitivityPercent <= 35 ? 3 : config.minCharacterLength || 2;
  if (clean.length < minLen) {
    return {
      accepted: false,
      reason: `Transcript too short (${clean.length} chars, min ${minLen})`,
      isFalsePositive: true,
      cleanText: clean,
    };
  }

  // Check volume gate if audio level is provided
  if (typeof audioLevel === 'number' && audioLevel > 0) {
    // If strict sensitivity, strictly enforce noise floor gate
    if (config.minVolumeGate > 0 && audioLevel < config.minVolumeGate) {
      return {
        accepted: false,
        reason: `Audio level (${audioLevel}%) below noise gate threshold (${config.minVolumeGate}%)`,
        isFalsePositive: true,
        cleanText: clean,
      };
    }
  }

  // Filter single-syllable ambient noise snippets if false-positive prevention is active
  if (config.preventFalsePositives) {
    const lower = clean.toLowerCase();
    if (FALSE_POSITIVE_NOISE_SNIPPETS.has(lower)) {
      return {
        accepted: false,
        reason: `Filtered accidental noise syllable: "${clean}"`,
        isFalsePositive: true,
        cleanText: clean,
      };
    }

    // In Strict mode (sensitivity <= 35), filter out single-word transcripts with fewer than 3 letters
    if (config.sensitivityPercent <= 35 && clean.split(/\s+/).length === 1 && clean.length < 4) {
      return {
        accepted: false,
        reason: `Strict mode filtered isolated short word: "${clean}"`,
        isFalsePositive: true,
        cleanText: clean,
      };
    }
  }

  return {
    accepted: true,
    isFalsePositive: false,
    cleanText: clean,
  };
}
