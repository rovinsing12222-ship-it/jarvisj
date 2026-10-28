import {
  AccentCalibrationProfile,
  CalibrationPromptItem,
  PhoneticCorrectionDetail,
  PhoneticCorrectionResult,
} from '../types';

export const CALIBRATION_STORAGE_KEY = 'jarvis_voice_calibration_profile';

/**
 * Curated phonetic calibration reading sentences.
 * Spanning 30 seconds total (approx 7.5s each), covering major accent stress points:
 * retroflex consonants, v/w allophones, vowel lengths, diphthongs, and primary assistant commands.
 */
export const CALIBRATION_PROMPTS: CalibrationPromptItem[] = [
  {
    id: 1,
    text: 'Hey Jarvis, turn on the flashlight and check my phone battery percentage.',
    phoneticFocus: 'Aspirated stops, fricative /sh/, rhotic /r/, tech command keywords',
    keywords: ['jarvis', 'flashlight', 'battery', 'phone'],
  },
  {
    id: 2,
    text: "Set a morning alarm for seven thirty and tell me today's live weather report.",
    phoneticFocus: 'Labiodental /v/ vs /w/ shifts, retroflex /t/, dental fricatives',
    keywords: ['alarm', 'weather', 'seven', 'thirty'],
  },
  {
    id: 3,
    text: 'Play my favorite music playlist, lock the phone screen, and open YouTube.',
    phoneticFocus: 'Liquid consonants /l/ and /r/, consonant clusters /pl/, /skr/',
    keywords: ['play', 'music', 'lock', 'youtube'],
  },
  {
    id: 4,
    text: 'Call Dad on his mobile number and send a quick message on WhatsApp.',
    phoneticFocus: 'Bilabial stops /b/, /p/, velar /k/, voiced affricates /dʒ/',
    keywords: ['call', 'dad', 'mobile', 'message', 'whatsapp'],
  },
];

/**
 * Built-in foundational phonetic shift baseline (frequently observed in regional English/Hinglish accents)
 */
export const BASELINE_PHONETIC_SHIFTS: Record<string, string[]> = {
  jarvis: ['jarvees', 'jarves', 'jervis', 'zarvis', 'jarvish', 'jarviz', 'jrvs', 'javis'],
  flashlight: ['flashlite', 'flash light', 'fleshlight', 'flash lite', 'flesh lite'],
  torch: ['toch', 'taurch', 'torach', 'toarch'],
  alarm: ['alaarm', 'elarm', 'alram', 'aalam'],
  weather: ['vedar', 'wether', 'vaither', 'veather', 'wedar', 'vader'],
  battery: ['betri', 'bettry', 'baatri', 'betree', 'batri'],
  phone: ['fone', 'fon', 'faun', 'faon'],
  turn: ['trun', 'tern', 'taan'],
  lock: ['lok', 'laak', 'lawk', 'lauk'],
  unlock: ['unlok', 'anlok', 'un laak', 'anlaak'],
  camera: ['kemra', 'kaimra', 'kemera', 'kamera'],
  youtube: ['utube', 'you tube', 'u tube', 'youtub'],
  whatsapp: ['watsapp', 'watsap', 'wotsapp', 'whatsap', 'vatsap'],
  music: ['myujik', 'muzik', 'gana', 'gaan'],
  call: ['kol', 'kaal', 'kal'],
  message: ['mesij', 'masej', 'meesij', 'msg'],
  settings: ['seting', 'setings', 'seteng'],
  brightness: ['braytnes', 'briteness', 'braytnis'],
  bluetooth: ['blututh', 'blutooth', 'blutooth'],
  schedule: ['skedule', 'shedule', 'shedyul'],
  reminder: ['remindr', 'remander', 'rimayndar'],
};

/**
 * Generate reverse lookup dictionary from a shift map
 */
export function buildReverseShiftMap(shiftMap: Record<string, string[]>): Record<string, string> {
  const reverse: Record<string, string> = {};
  for (const [canonical, variations] of Object.entries(shiftMap)) {
    for (const v of variations) {
      reverse[v.toLowerCase().trim()] = canonical.toLowerCase().trim();
    }
  }
  return reverse;
}

/**
 * Get active calibration profile from localStorage
 */
export function getCalibrationProfile(): AccentCalibrationProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.accentName) {
      return parsed as AccentCalibrationProfile;
    }
  } catch (err) {
    console.warn('[VoiceCalibration] Failed to parse stored profile:', err);
  }
  return null;
}

/**
 * Save calibration profile to localStorage and dispatch event
 */
export function saveCalibrationProfile(profile: AccentCalibrationProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('jarvis:calibration-updated', { detail: profile }));
  } catch (err) {
    console.error('[VoiceCalibration] Failed to persist profile:', err);
  }
}

/**
 * Clear calibration profile and reset to default engine baseline
 */
export function clearCalibrationProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CALIBRATION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('jarvis:calibration-updated', { detail: null }));
  } catch (err) {
    console.error('[VoiceCalibration] Failed to clear profile:', err);
  }
}

/**
 * Apply real-time phonetic accent correction to a recognized speech string.
 * Uses both calibrated user-specific shifts and foundational baseline mappings.
 */
export function applyPhoneticCorrection(
  rawText: string,
  customProfile?: AccentCalibrationProfile | null
): PhoneticCorrectionResult {
  if (!rawText || !rawText.trim()) {
    return {
      rawText: rawText || '',
      correctedText: rawText || '',
      corrections: [],
      wasModified: false,
    };
  }

  const profile = customProfile !== undefined ? customProfile : getCalibrationProfile();
  const isActive = profile?.isActive ?? true;

  // Build combined lookup map
  const activeReverseMap: Record<string, string> = {
    ...buildReverseShiftMap(BASELINE_PHONETIC_SHIFTS),
    ...(isActive && profile?.reverseShiftMap ? profile.reverseShiftMap : {}),
  };

  let workingText = rawText;
  const appliedCorrections: PhoneticCorrectionDetail[] = [];

  // 1. Multi-word phrase replacements first (e.g., "flash light" -> "flashlight")
  const multiWordEntries = Object.entries(activeReverseMap)
    .filter(([variant]) => variant.includes(' '))
    .sort((a, b) => b[0].length - a[0].length);

  for (const [variant, canonical] of multiWordEntries) {
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(workingText)) {
      workingText = workingText.replace(regex, canonical);
      appliedCorrections.push({
        original: variant,
        corrected: canonical,
        matchedRule: `Phrase: "${variant}" ➔ "${canonical}"`,
      });
    }
  }

  // 2. Word-by-word token inspection
  const words = workingText.split(/\s+/);
  const correctedWords: string[] = [];

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const canonical = activeReverseMap[cleanWord];

    if (canonical && cleanWord !== canonical) {
      // Preserve original punctuation if any
      const punctuationMatch = word.match(/[^a-zA-Z0-9]+$/);
      const trailingPunc = punctuationMatch ? punctuationMatch[0] : '';
      correctedWords.push(canonical + trailingPunc);

      if (!appliedCorrections.some((c) => c.original.toLowerCase() === cleanWord)) {
        appliedCorrections.push({
          original: cleanWord,
          corrected: canonical,
          matchedRule: `Phoneme: "${cleanWord}" ➔ "${canonical}"`,
        });
      }
    } else {
      correctedWords.push(word);
    }
  }

  const finalCorrectedText = correctedWords.join(' ');
  const wasModified = appliedCorrections.length > 0;

  if (wasModified) {
    console.log(
      `[Voice Calibration] Accent correction applied: "${rawText}" ➔ "${finalCorrectedText}"`,
      appliedCorrections
    );
  }

  return {
    rawText,
    correctedText: finalCorrectedText,
    corrections: appliedCorrections,
    wasModified,
  };
}

/**
 * Send session recording data to server for Gemini accent analysis
 */
export async function submitVoiceCalibration(payload: {
  prompts: string[];
  transcripts: string[];
  totalDurationMs: number;
  detectedCadenceWpm: number;
  clientLocale: string;
}): Promise<AccentCalibrationProfile> {
  const response = await fetch('/api/voice/calibrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Voice calibration request failed (${response.status})`);
  }

  const profile: AccentCalibrationProfile = await response.json();
  return profile;
}
