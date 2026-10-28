/**
 * J.A.R.V.I.S. Wake-Word Engine & Background Acoustic Listener
 * Listens for "Jarvis", "Hey Jarvis", or "Assistant" in both English and Hindi/Devanagari
 */

import { isBackgroundBeepEnabled } from './audioSynth';

export type WakeWordTrigger = 'Jarvis' | 'Hey Jarvis' | 'Assistant';

export interface WakeWordConfig {
  enabled: boolean;
  trigger: WakeWordTrigger;
  playChime: boolean;
  hapticFeedback: boolean;
  speechLanguage: 'hi-IN' | 'en-IN' | 'en-US';
  autoListenAfterWake: boolean;
  noiseSuppression: boolean;
  voiceIsolation: boolean;
  sensitivity: number; // 10 to 100 (percentage)
}

const STORAGE_KEY = 'jarvis_wake_word_config';

export const DEFAULT_WAKE_WORD_CONFIG: WakeWordConfig = {
  enabled: true,
  trigger: 'Jarvis',
  playChime: false, // Default FALSE: completely turns off background to-tu / chime sound on open
  hapticFeedback: true,
  speechLanguage: 'hi-IN',
  autoListenAfterWake: true,
  noiseSuppression: true,
  voiceIsolation: true,
  sensitivity: 75, // Default: 75% (Balanced High Responsiveness)
};

export function getWakeWordConfig(): WakeWordConfig {
  if (typeof window === 'undefined') return DEFAULT_WAKE_WORD_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WAKE_WORD_CONFIG;
    const parsed = JSON.parse(raw);
    const sensitivity =
      typeof parsed.sensitivity === 'number' && !isNaN(parsed.sensitivity)
        ? Math.max(10, Math.min(100, Math.round(parsed.sensitivity)))
        : DEFAULT_WAKE_WORD_CONFIG.sensitivity;
    return {
      ...DEFAULT_WAKE_WORD_CONFIG,
      ...parsed,
      sensitivity,
      playChime: parsed.playChime === true && isBackgroundBeepEnabled() ? true : false,
    };
  } catch {
    return DEFAULT_WAKE_WORD_CONFIG;
  }
}

export function saveWakeWordConfig(config: Partial<WakeWordConfig>): WakeWordConfig {
  const current = getWakeWordConfig();
  const updated: WakeWordConfig = { ...current, ...config };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('jarvis:wake-word-config-updated', { detail: updated })
      );
    } catch (e) {
      console.warn('[WakeWordEngine] Failed to save config to localStorage:', e);
    }
  }
  return updated;
}

/**
 * Synthesizes a movie-accurate Stark Industries holographic HUD wake chime
 * using Web Audio API harmonics (Dual-tone sine ascending chirp).
 * Only plays if playChime is explicitly true AND background beep is enabled.
 */
export function playWakeChime(force = false): void {
  if (typeof window === 'undefined') return;
  const cfg = getWakeWordConfig();
  if (!force && (!cfg.playChime || !isBackgroundBeepEnabled())) return; // Silent background: no to-tu chime!
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5) -> 880 Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain1.gain.setValueAtTime(0.01, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Tone 2: Harmonious Fifth 1174.66 Hz (D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.01, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.36);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 450);
  } catch (err) {
    console.debug('[WakeWordEngine] AudioContext chime notice:', err);
  }
}

export interface AmbientSensitivityProfile {
  level: 'low' | 'balanced' | 'high' | 'ultra';
  title: string;
  hindiTitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  recommendedFor: string;
  rejectionLevel: string;
}

/**
 * Returns ambient profile configuration based on the wake-word sensitivity percentage (10% to 100%).
 */
export function getAmbientSensitivityProfile(sensitivity: number): AmbientSensitivityProfile {
  if (sensitivity <= 35) {
    return {
      level: 'low',
      title: 'High Noise Rejection',
      hindiTitle: 'उच्च शोर अस्वीकृति (शोरगुल वातावरण)',
      badge: 'Strict Trigger',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Requires clear, direct pronunciation. Effectively ignores television, traffic, and background chatter.',
      recommendedFor: 'Loud environments, active TV, moving vehicles, cafes, crowded rooms',
      rejectionLevel: 'Maximum (Filters out 95% ambient noise)',
    };
  } else if (sensitivity <= 65) {
    return {
      level: 'balanced',
      title: 'Standard / Balanced',
      hindiTitle: 'संतुलित डिटेक्शन (सामान्य कमरा व कार्यालय)',
      badge: 'Balanced',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description: 'Balanced trigger threshold suitable for everyday rooms, offices, and moderate indoor activity.',
      recommendedFor: 'Living room, open office, kitchen, home with family activity',
      rejectionLevel: 'Moderate (Balanced false-positive rejection)',
    };
  } else if (sensitivity <= 85) {
    return {
      level: 'high',
      title: 'High Sensitivity (Recommended)',
      hindiTitle: 'उच्च संवेदनशीलता (अनुशंसित - शांत कमरा)',
      badge: 'Fast & Responsive',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Optimized for quick, effortless voice response. Triggers smoothly from anywhere in a quiet room.',
      recommendedFor: 'Quiet bedroom, private office, late night reading, desk work',
      rejectionLevel: 'Normal (Fastest everyday trigger)',
    };
  } else {
    return {
      level: 'ultra',
      title: 'Ultra-High / Whisper Mode',
      hindiTitle: 'अति-संवेदनशील (फुसफुसाहट व दूरस्थ माइक)',
      badge: 'Whisper & Far-Field',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description: 'Maximum acoustic sensitivity. Catches faint whispers, quiet murmurs, and far-field speech across large rooms.',
      recommendedFor: 'Very quiet rooms, whispering without waking others, far-field microphone',
      rejectionLevel: 'Low (Picks up lowest acoustic whispers)',
    };
  }
}

export interface WakeWordMatchResult {
  matched: boolean;
  triggerFound?: string;
  remainingCommand?: string;
  sensitivity?: number;
}

/**
 * Checks a spoken transcript against the active wake-word configuration.
 * Adapts scanning depth, regex strictness, and phonetic variations based on ambient sensitivity (10% to 100%).
 */
export function checkWakeWord(
  transcript: string,
  config: WakeWordConfig = getWakeWordConfig()
): WakeWordMatchResult {
  if (!config.enabled || !transcript) {
    return { matched: false };
  }

  const raw = transcript.trim();
  const lower = raw.toLowerCase();
  const sensitivity = typeof config.sensitivity === 'number' ? config.sensitivity : 75;

  // Pattern sets based on selected trigger
  let patterns: RegExp[] = [];

  if (config.trigger === 'Hey Jarvis') {
    patterns = [
      /^(hey|hi|hello|ok|oye|are|हे|हाय|हेलो|ओए)\s*(jarvis|jarvees|jarvisji|जार्विस|जारविस|जार्विश|mayra|मैरा|myra|aanya|आन्या|anya|aoede)\b/i,
      /^(hey\s*jarvis|हे\s*जार्विस|hey\s*aanya|हे\s*आन्या)/i,
    ];
    // If sensitivity is high or ultra, allow loose phonetic variations
    if (sensitivity >= 70) {
      patterns.push(/^(hey|hi|hello|हे)?\s*(zarvis|zervis|jaavis|jarv|jrvs|anya|aanya)\b/i);
    }
  } else if (config.trigger === 'Assistant') {
    patterns = [
      /^(assistant|my\s*assistant|voice\s*assistant|असिस्टेंट|सहायक|aanya|आन्या)\b/i,
      /^(hey|hi|hello|हे)\s*(assistant|असिस्टेंट|aanya|आन्या)\b/i,
    ];
    if (sensitivity >= 70) {
      patterns.push(/^(suno|listen)?\s*(assistant|asistant|assistnt|aanya)\b/i);
    }
  } else {
    // Default 'Jarvis' & 'Aanya': matches "Jarvis", "Aanya", "Hey Aanya", "Hey Jarvis", "Aanya suno", etc.
    patterns = [
      /^(wake\s*up|jaag\s*jao|jaago|utho|suno|सुनो|जागो|जाग\s*जाओ|उठो)?\s*(hey|hi|hello|ok|oye|are|हे|हाय|हेलो|ओए)?\s*(jarvis|jarvees|jarvisji|जार्विस|जारविस|जार्विश|mayra|मैरा|myra|aanya|आन्या|anya|aoede)\s*(suno|jaag\s*jao|jaago|utho|wake\s*up|सुनो|जागो|जाग\s*जाओ|उठो)?\b/i,
    ];
    if (sensitivity >= 70) {
      // Relaxed phonetic variants for quiet environments and whisper mode
      patterns.push(/^(hey|hi|ok)?\s*(zarvis|zervis|jaavis|jarv|jrvs|charvis|anya|aanya)\b/i);
    }
  }

  // 1. Check patterns
  for (const regex of patterns) {
    const match = lower.match(regex);
    if (match) {
      const matchLength = match[0].length;
      let remainder = raw.slice(matchLength).replace(/^[\s,.:;!?-]+/, '').trim();
      // Strip common wake-up filler words from remainder if present
      remainder = remainder.replace(/^(jaag\s*jao|jaago|utho|wake\s*up|suno|सुनो|जागो|जाग\s*जाओ|उठो)\b[\s,.:;!?-]*/i, '').trim();
      return {
        matched: true,
        triggerFound: match[0].trim(),
        remainingCommand: remainder,
        sensitivity,
      };
    }
  }

  // If sensitivity is very low (<= 35, high noise rejection), strictly require leading pattern match
  // to avoid false triggers from background ambient speech or television.
  if (sensitivity <= 35) {
    return { matched: false };
  }

  // 2. Scan initial words for wake-word occurrence.
  // Search depth depends on sensitivity:
  // 36-50: up to 2 words
  // 51-70: up to 4 words
  // 71-85: up to 6 words
  // > 85 (Whisper/Ultra): up to 10 words
  const maxScanWords = sensitivity > 85 ? 10 : sensitivity > 70 ? 6 : sensitivity > 50 ? 4 : 2;

  const words = lower.split(/\s+/);
  const targetWords =
    config.trigger === 'Assistant'
      ? ['assistant', 'असिस्टेंट', 'सहायक']
      : ['jarvis', 'jarvees', 'जार्विस', 'जारविस', 'जार्विश', 'mayra', 'मैरा', 'myra'];

  if (sensitivity >= 70 && config.trigger !== 'Assistant') {
    targetWords.push('zarvis', 'zervis', 'jaavis', 'jarv', 'jrvs');
  }

  for (let i = 0; i < Math.min(maxScanWords, words.length); i++) {
    const w = words[i].replace(/[^a-z\u0900-\u097F]/g, '');
    if (targetWords.includes(w)) {
      // Found wake word at position i
      const rawWords = raw.split(/\s+/);
      let remainder = rawWords.slice(i + 1).join(' ').trim();
      remainder = remainder.replace(/^(jaag\s*jao|jaago|utho|wake\s*up|suno|सुनो|जागो|जाग\s*जाओ|उठो)\b[\s,.:;!?-]*/i, '').trim();
      return {
        matched: true,
        triggerFound: rawWords.slice(0, i + 1).join(' '),
        remainingCommand: remainder,
        sensitivity,
      };
    }
  }

  return { matched: false };
}
