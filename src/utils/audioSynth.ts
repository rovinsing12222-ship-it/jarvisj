// Futuristic Web Audio Synthesizer and Text-to-Speech Manager for J.A.R.V.I.S.
import { JARVIS_SONGS, findSong, SongItem } from './songCatalog';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const BACKGROUND_BEEP_STORAGE_KEY = 'jarvis_background_beep_enabled';

/**
 * Checks if background "to-tu" beep and startup chimes are enabled.
 * Defaults to FALSE: completely silent on open and in background per user requirement!
 */
export function isBackgroundBeepEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(BACKGROUND_BEEP_STORAGE_KEY);
    return val === 'true'; // Default is FALSE (OFF / Silent)
  } catch {
    return false;
  }
}

/**
 * Updates the background beep / "to-tu" sound state and broadcasts change event.
 */
export function setBackgroundBeepEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BACKGROUND_BEEP_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent('jarvis:background-beep-updated', { detail: { enabled } })
    );
  } catch {}
}

export function playStartupSound(force = false) {
  if (!force && !isBackgroundBeepEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const freqs = [220, 330, 440, 554, 659, 880];
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.001, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.08 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.45);
  });
}

/**
 * Plays the dual-tone rising frequency beep ("to-tu").
 * By default, this is SILENT when opening Jarvis or in background,
 * unless force is true or user explicitly enabled background beeps in Settings!
 */
export function playBeepSound(force = false) {
  if (!force && !isBackgroundBeepEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}

/**
 * Subtle futuristic 'ping' notification sound effect played immediately when Jarvis
 * identifies a successfully recognized voice command, providing instant acoustic confirmation.
 */
export function playCommandRecognizedPingSound(force = true): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    // Primary crystalline AI chime (1760 Hz - A6) with ascending harmonic sparkle to 2093 Hz (C7)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1760, now);
    osc1.frequency.exponentialRampToValueAtTime(2093, now + 0.04);

    gain1.gain.setValueAtTime(0.065, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Subtle glass harmonic overtone (2637 Hz - E7) for a sleek, futuristic sheen
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2637, now);

    gain2.gain.setValueAtTime(0.025, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.18);

    osc2.start(now);
    osc2.stop(now + 0.14);
  } catch (err) {
    console.debug('[AudioSynth] playCommandRecognizedPingSound notice:', err);
  }
}

export function playActionExecutedSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.06);

    gain.gain.setValueAtTime(0.06, now + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.28);
  });
}

/**
 * Ascending harmonic celebratory fanfare for achieving 100% daily goals
 */
export function playCelebrationFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.25, vol: 0.07 },
      { freq: 659.25, time: 0.08, dur: 0.25, vol: 0.08 },
      { freq: 783.99, time: 0.16, dur: 0.28, vol: 0.09 },
      { freq: 987.77, time: 0.24, dur: 0.30, vol: 0.09 },
      { freq: 1046.50, time: 0.32, dur: 0.42, vol: 0.11 },
      { freq: 1318.51, time: 0.42, dur: 0.55, vol: 0.12 },
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (err) {
    console.debug('[AudioSynth] playCelebrationFanfare notice:', err);
  }
}

export function playAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(987.77, now + i * 0.18);

    gain.gain.setValueAtTime(0.08, now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.15);
  }
}

/**
 * Subtle crystalline notification chime triggered specifically when a new incoming
 * message is received and displayed in the messages inbox.
 */
export function playIncomingMessageSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Harmonic two-tone ascending chime (D5 -> A5)
    const notes = [
      { freq: 587.33, start: 0, dur: 0.18, vol: 0.12 },
      { freq: 880.0, start: 0.11, dur: 0.28, vol: 0.15 },
      { freq: 1174.66, start: 0.16, dur: 0.35, vol: 0.08 },
    ];

    notes.forEach(({ freq, start, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
  } catch (err) {
    console.warn('Could not play incoming message chime:', err);
  }
}

// Phonetic & Devnagari dictionary to convert common Hinglish words into pure Devnagari Hindi.
// When browser speech synthesis engines (like Google Hindi, Microsoft Swara, or Android TTS)
// receive pure Devnagari text, they speak in authentic, sweet native Indian Hindi pronunciation
// rather than reading Roman letters with a robotic English foreign accent.
const HINGLISH_TO_DEVANAGARI: Record<string, string> = {
  'ram': 'राम',
  'ji': 'जी',
  'namaste': 'नमस्ते',
  'mai': 'मैं',
  'mein': 'मैं',
  'hu': 'हूँ',
  'hoon': 'हूँ',
  'aap': 'आप',
  'aapki': 'आपकी',
  'aapka': 'आपका',
  'aapke': 'आपके',
  'personal': 'पर्सनल',
  'assistant': 'असिस्टेंट',
  'jarvis': 'जार्विस',
  'sab': 'सब',
  'kushal': 'कुशल',
  'mangal': 'मंगल',
  'theek': 'ठीक',
  'thak': 'ठाक',
  'bataiye': 'बताइए',
  'aaj': 'आज',
  'kya': 'क्या',
  'seva': 'सेवा',
  'madad': 'मदद',
  'kar': 'कर',
  'sakti': 'सकती',
  'sakta': 'सकता',
  'karti': 'करती',
  'rahi': 'रही',
  'raha': 'रहा',
  'karta': 'करता',
  'hai': 'है',
  'hain': 'हैं',
  'bilkul': 'बिल्कुल',
  'chinta': 'चिंता',
  'mat': 'मत',
  'kijiye': 'कीजिए',
  'befikr': 'बेफिक्र',
  'rahiye': 'रहिए',
  'is': 'इस',
  'waqt': 'वक़्त',
  'samay': 'समय',
  'ho': 'हो',
  'tarikh': 'तारीख',
  'tariq': 'तारीख',
  'date': 'तारीख',
  'time': 'समय',
  'battery': 'बैटरी',
  'health': 'हेल्थ',
  'swasth': 'स्वस्थ',
  'achhi': 'अच्छी',
  'condition': 'कंडीशन',
  'phone': 'फ़ोन',
  'device': 'डिवाइस',
  'camera': 'कैमरा',
  'open': 'ओपन',
  'kholo': 'खोलो',
  'khol': 'खोल',
  'di': 'दी',
  'torch': 'टॉर्च',
  'on': 'ऑन',
  'off': 'ऑफ़',
  'band': 'बंद',
  'shuru': 'शुरू',
  'alarm': 'अलार्म',
  'set': 'सेट',
  'subah': 'सुबह',
  'shaam': 'शाम',
  'dopahar': 'दोपहर',
  'raat': 'रात',
  'baje': 'बजे',
  'ka': 'का',
  'ke': 'के',
  'ki': 'की',
  'ko': 'को',
  'call': 'कॉल',
  'lagao': 'लगाओ',
  'laga': 'लगा',
  'dad': 'डैड',
  'papa': 'पापा',
  'mummy': 'मम्मी',
  'mom': 'मॉम',
  'bhai': 'भाई',
  'behan': 'बहन',
  'whatsapp': 'व्हाट्सऐप',
  'message': 'मैसेज',
  'bhejo': 'भेजो',
  'bhej': 'भेज',
  'diya': 'दिया',
  'liye': 'लिए',
  'taiyaar': 'तैयार',
  'sun': 'सुन',
  'nahi': 'नहीं',
  'paayi': 'पायी',
  'dobara': 'दोबारा',
  'bol': 'बोल',
  'sakte': 'सकते',
  'shubh': 'शुभ',
  'raatri': 'रात्रि',
  'rest': 'रेस्ट',
  'number': 'नंबर',
  'dikhao': 'दिखाओ',
  'reminder': 'रिमाइंडर',
  'note': 'नोट',
  'le': 'ले',
  'liya': 'लिया',
  'dila': 'दिला',
  'dungi': 'दूँगी',
  'youtube': 'यूट्यूब',
  'play': 'प्ले',
  'chalaye': 'चलाइए',
  'gaana': 'गाना',
  'music': 'म्यूजिक',
  'monday': 'सोमवार',
  'tuesday': 'मंगलवार',
  'wednesday': 'बुधवार',
  'thursday': 'गुरुवार',
  'friday': 'शुक्रवार',
  'saturday': 'शनिवार',
  'sunday': 'रविवार',
  'january': 'जनवरी',
  'february': 'फ़रवरी',
  'march': 'मार्च',
  'april': 'अप्रैल',
  'may': 'मई',
  'june': 'जून',
  'july': 'जुलाई',
  'august': 'अगस्त',
  'september': 'सितंबर',
  'october': 'अक्टूबर',
  'november': 'नवंबर',
  'december': 'दिसंबर',
};

/**
 * Checks whether the text is already mostly Devanagari Hindi
 */
export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Converts Hinglish romanized sentence into clean Devanagari text
 * so native Hindi voice synthesis articulates with 100% natural, sweet, non-robotic Indian girl accent.
 */
export function convertHinglishToDevanagari(text: string): string {
  if (isDevanagari(text)) {
    return text;
  }

  // Tokenize preserving punctuation and spaces
  const wordsAndDelimiters = text.split(/(\s+|[,.!?।:;%()\-]+)/);
  const transformed = wordsAndDelimiters.map((segment) => {
    const trimmed = segment.trim().toLowerCase();
    if (!trimmed) return segment;

    if (HINGLISH_TO_DEVANAGARI[trimmed]) {
      return HINGLISH_TO_DEVANAGARI[trimmed];
    }

    return segment;
  });

  return transformed.join('');
}

export const DEFAULT_SPEAKING_RATE = 0.98;
export const SPEAKING_RATE_STORAGE_KEY = 'jarvis_speaking_rate';

export function getJarvisSpeakingRate(): number {
  if (typeof window === 'undefined') return DEFAULT_SPEAKING_RATE;
  try {
    const saved = localStorage.getItem(SPEAKING_RATE_STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read speaking rate from localStorage', err);
  }
  return DEFAULT_SPEAKING_RATE;
}

export function saveJarvisSpeakingRate(rate: number): void {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.max(0.5, Math.min(2.0, Math.round(rate * 100) / 100));
    localStorage.setItem(SPEAKING_RATE_STORAGE_KEY, clamped.toString());
    window.dispatchEvent(new CustomEvent('jarvis_speaking_rate_changed', { detail: { rate: clamped } }));
  } catch (err) {
    console.warn('Could not save speaking rate to localStorage', err);
  }
}

export type JarvisVoiceModel = 'aoede' | 'jarvis_classic';

export const VOICE_MODEL_STORAGE_KEY = 'jarvis_active_voice_model';

export interface JarvisVoiceModelMeta {
  id: JarvisVoiceModel;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  gender: 'female' | 'male';
  defaultPitch: number;
  defaultRate: number;
  sampleGreeting: string;
}

export const JARVIS_VOICE_MODELS: Record<JarvisVoiceModel, JarvisVoiceModelMeta> = {
  aoede: {
    id: 'aoede',
    name: 'AANYA (22 Yr Cute & Bold Indian Girl)',
    badge: '22 Yr Cute & Bold ✨',
    tagline: 'Google Neural Engine • 22-Yr Cute & Bold Indian Girl AI',
    description: 'Sweet, bold, and expressive 22-year-old Indian girl voice that talks live with you, executes phone tasks, PC beast mode, and chats with charm and boldness.',
    gender: 'female',
    defaultPitch: 1.16,
    defaultRate: 1.02,
    sampleGreeting: 'Namaste Rovin Sir! Main Aanya hu — 22 saal ki cute aur bold Indian AI girl! Mujhse jo chahein baat karein, main live sun rahi hu!',
  },
  jarvis_classic: {
    id: 'jarvis_classic',
    name: 'J.A.R.V.I.S. Classic (British Butler)',
    badge: 'MCU Iron Man',
    tagline: 'Paul Bettany Style • Suave British AI Butler',
    description: 'Sophisticated, unflappable, deep British male AI butler and tactical system from Tony Stark movies.',
    gender: 'male',
    defaultPitch: 0.94,
    defaultRate: 0.98,
    sampleGreeting: 'At your service, Sir. J.A.R.V.I.S. neural telemetry is fully operational and standing by.',
  },
};

export function getActiveVoiceModel(): JarvisVoiceModel {
  if (typeof window === 'undefined') return 'aoede';
  try {
    const saved = localStorage.getItem(VOICE_MODEL_STORAGE_KEY);
    if (saved === 'jarvis_classic' || saved === 'aoede') {
      return saved;
    }
  } catch {}
  return 'aoede'; // AOEDE is the default active voice model!
}

export function setActiveVoiceModel(model: JarvisVoiceModel): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_MODEL_STORAGE_KEY, model);
    window.dispatchEvent(
      new CustomEvent('jarvis_voice_model_changed', { detail: { voiceModel: model } })
    );
  } catch (err) {
    console.warn('Could not save voice model to localStorage', err);
  }
}

// Active utterance tracking to prevent echoing, rapid duplicate speech, and cancellation loops
let activeUtteranceState: {
  text: string;
  timestamp: number;
  isCancelled: boolean;
  onEnd?: () => void;
} | null = null;
let lastSpokenTextNormalized = '';
let lastSpokenTimestamp = 0;

let speechVolumeAnimationId: number | null = null;
let speechBoundaryPulse = 0;

export function startSpeechAudioLevelSimulation(): void {
  if (typeof window === 'undefined') return;
  stopSpeechAudioLevelSimulation();

  let phase = 0;
  const updateLevel = () => {
    phase += 0.16;
    // Multi-frequency harmonic envelope simulating human speech formants (F1, F2, F3)
    const baseWave =
      Math.sin(phase * 1.6) * 0.35 +
      Math.cos(phase * 2.7) * 0.25 +
      Math.sin(phase * 0.8) * 0.2;
    // Word stress / boundary syllable pulse
    speechBoundaryPulse = Math.max(0, speechBoundaryPulse - 0.08);
    const combined = Math.min(100, Math.max(22, 45 + baseWave * 36 + speechBoundaryPulse * 45));
    const rounded = Math.round(combined);

    window.dispatchEvent(
      new CustomEvent('jarvis:speech-volume', {
        detail: { volume: rounded, isSpeaking: true },
      })
    );
    window.dispatchEvent(
      new CustomEvent('jarvis:mic-volume', {
        detail: { volume: rounded, source: 'speech' },
      })
    );

    speechVolumeAnimationId = requestAnimationFrame(updateLevel);
  };

  speechVolumeAnimationId = requestAnimationFrame(updateLevel);
}

export function stopSpeechAudioLevelSimulation(): void {
  if (typeof window === 'undefined') return;
  if (speechVolumeAnimationId !== null) {
    cancelAnimationFrame(speechVolumeAnimationId);
    speechVolumeAnimationId = null;
  }
  speechBoundaryPulse = 0;
  window.dispatchEvent(
    new CustomEvent('jarvis:speech-volume', {
      detail: { volume: 0, isSpeaking: false },
    })
  );
  window.dispatchEvent(
    new CustomEvent('jarvis:mic-volume', {
      detail: { volume: 0, source: 'speech-stop' },
    })
  );
}

export function pulseSpeechBoundary(): void {
  speechBoundaryPulse = 1.0;
}

export function isJarvisSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return Boolean(
    (window.speechSynthesis.speaking && !window.speechSynthesis.paused) ||
    window.speechSynthesis.pending ||
    activeUtteranceState !== null
  );
}

// Text-to-Speech Engine for J.A.R.V.I.S. (Defaults to AOEDE Cute Indian Girl Voice Model)
export function speakJarvis(
  text: string,
  options: {
    lang?: string;
    pitch?: number;
    rate?: number;
    muted?: boolean;
    voiceModel?: JarvisVoiceModel;
    force?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
) {
  if (options.muted) {
    options.onEnd?.();
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser/device.');
    options.onEnd?.();
    return;
  }

  // Strip markdown or code block artifacts for cleaner vocal output
  const cleanText = text
    .replace(/[*#`_~[\]()]/g, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .trim();

  if (!cleanText) {
    options.onEnd?.();
    return;
  }

  // STRICT ANTI-DUPLICATE GUARD: Prevent speaking the exact same sentence twice
  const normalized = cleanText.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
  const now = Date.now();
  if (!options.force) {
    // 1. Check if identical sentence was already spoken or attempted in the last 7 seconds
    if (
      normalized.length >= 3 &&
      normalized === lastSpokenTextNormalized &&
      now - lastSpokenTimestamp < 7000
    ) {
      console.warn('[Jarvis TTS] Suppressed duplicate speech within 7s window:', cleanText);
      options.onEnd?.();
      return;
    }

    // 2. Check if identical sentence is actively playing right now
    if (
      activeUtteranceState &&
      activeUtteranceState.text.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '') === normalized
    ) {
      console.warn('[Jarvis TTS] Suppressed speech: identical text already actively speaking:', cleanText);
      options.onEnd?.();
      return;
    }
  }

  // IMMEDIATELY record last spoken text and timestamp to block racing duplicate calls in the same tick
  lastSpokenTextNormalized = normalized;
  lastSpokenTimestamp = now;

  // Mark previous speech as superseded/cancelled so its onEnd/onerror doesn't restart mic prematurely
  if (activeUtteranceState) {
    activeUtteranceState.isCancelled = true;
    activeUtteranceState = null;
  }

  // Cancel any ongoing speech
  try {
    window.speechSynthesis.cancel();
  } catch {}
  stopSpeechAudioLevelSimulation();

  const activeModel = options.voiceModel || getActiveVoiceModel();
  const voices = window.speechSynthesis.getVoices();
  const targetLang = options.lang || (activeModel === 'aoede' ? 'hi-IN' : 'en-GB');

  let selectedVoice: SpeechSynthesisVoice | undefined;

  if (activeModel === 'aoede') {
    // =========================================================================
    // AOEDE VOICE MODEL: Cute Indian Girl Voice (Google Neural Aoede Profile)
    // Sweet, youthful, expressive female vocal synthesis for Hindi & Indian English
    // =========================================================================

    // 1. Prioritize Indian Hindi Female Voices (Google हिन्दी Female, Kalpana, Swara, Lekha, etc.)
    selectedVoice = voices.find((v) => {
      const nameLower = v.name.toLowerCase();
      const langLower = (v.lang || '').toLowerCase();
      const isHindi = langLower.startsWith('hi');
      const isFemale =
        nameLower.includes('female') ||
        nameLower.includes('kalpana') ||
        nameLower.includes('swara') ||
        nameLower.includes('lekha') ||
        nameLower.includes('neerja') ||
        nameLower.includes('google') ||
        nameLower.includes('natural');
      const isMale = nameLower.includes('male') || nameLower.includes('madhur') || nameLower.includes('hemant');
      return isHindi && isFemale && !isMale;
    });

    // 2. If no explicit Hindi female, any Hindi voice
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const langLower = (v.lang || '').toLowerCase();
        return langLower.startsWith('hi') && !nameLower.includes('male');
      }) || voices.find((v) => (v.lang || '').toLowerCase().startsWith('hi'));
    }

    // 3. Indian English Female Voices (Google English India Female, Microsoft Neerja / Heera / Priya / Veena)
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const langLower = (v.lang || '').toLowerCase();
        const isIndian = langLower.includes('in');
        const isFemale =
          nameLower.includes('female') ||
          nameLower.includes('neerja') ||
          nameLower.includes('heera') ||
          nameLower.includes('priya') ||
          nameLower.includes('veena') ||
          nameLower.includes('swara');
        const isMale = nameLower.includes('male') || nameLower.includes('ravi') || nameLower.includes('prabhat');
        return isIndian && isFemale && !isMale;
      });
    }

    // 4. Any Indian English voice that is not explicitly male
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const langLower = (v.lang || '').toLowerCase();
        return langLower.includes('in') && !nameLower.includes('male');
      });
    }

    // 5. Expressive Natural Female Voices (Aoede, Kore, Jenny, Aria, Zira, Samantha, etc.)
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        return (
          nameLower.includes('aoede') ||
          nameLower.includes('kore') ||
          nameLower.includes('jenny') ||
          nameLower.includes('aria') ||
          nameLower.includes('zira') ||
          nameLower.includes('samantha') ||
          nameLower.includes('victoria') ||
          nameLower.includes('female')
        );
      });
    }

    // 6. Any female voice available
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        return !nameLower.includes('male') && !nameLower.includes('david') && !nameLower.includes('daniel');
      });
    }

    // Fallback to first voice
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }
  } else {
    // =========================================================================
    // J.A.R.V.I.S. CLASSIC: Movie MCU Butler (Paul Bettany British Male Voice)
    // =========================================================================
    if (targetLang.toLowerCase().startsWith('hi')) {
      selectedVoice =
        voices.find((v) => {
          const langLower = (v.lang || '').toLowerCase();
          const nameLower = v.name.toLowerCase();
          return (
            langLower.startsWith('hi') &&
            (nameLower.includes('male') ||
              nameLower.includes('natural') ||
              nameLower.includes('google') ||
              nameLower.includes('india'))
          );
        }) ||
        voices.find((v) => (v.lang || '').toLowerCase().startsWith('hi'));
    }

    // British English Male Voices
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const langLower = (v.lang || '').toLowerCase();
        const isBritish = langLower.includes('gb') || langLower.includes('uk');
        const isMale =
          nameLower.includes('male') ||
          nameLower.includes('daniel') ||
          nameLower.includes('george') ||
          nameLower.includes('oliver') ||
          nameLower.includes('arthur') ||
          nameLower.includes('ryan') ||
          nameLower.includes('brian') ||
          nameLower.includes('charles');
        return isBritish && isMale;
      });
    }

    if (!selectedVoice) {
      selectedVoice = voices.find((v) => {
        const langLower = (v.lang || '').toLowerCase();
        const nameLower = v.name.toLowerCase();
        return (
          (langLower.includes('gb') || langLower.includes('uk')) &&
          !nameLower.includes('female') &&
          !nameLower.includes('zira')
        );
      });
    }

    if (!selectedVoice) {
      selectedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const langLower = (v.lang || '').toLowerCase();
        return (
          langLower.startsWith('en') &&
          (nameLower.includes('male') ||
            nameLower.includes('david') ||
            nameLower.includes('guy') ||
            nameLower.includes('mark') ||
            nameLower.includes('ravi') ||
            nameLower.includes('prabhat') ||
            nameLower.includes('natural')) &&
          !nameLower.includes('female')
        );
      });
    }

    if (!selectedVoice) {
      selectedVoice =
        voices.find((v) => {
          const langLower = (v.lang || '').toLowerCase();
          const nameLower = v.name.toLowerCase();
          return langLower.startsWith('en') && !nameLower.includes('female');
        }) ||
        voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) ||
        voices[0];
    }
  }

  // Convert Hinglish text into Devanagari Hindi if the selected voice is a Hindi voice
  const isSelectedVoiceHindi = !!selectedVoice && (selectedVoice.lang || '').toLowerCase().startsWith('hi');
  const isHindiContext =
    (options.lang && options.lang.startsWith('hi')) ||
    activeModel === 'aoede' ||
    /ram|bataiye|aapki|kya|madad|theek|karo|batao|samay|tarikh|baje|kar\s*rahi|hu|ho\s*gaya/i.test(cleanText);

  let vocalText = cleanText;
  if (isSelectedVoiceHindi && isHindiContext) {
    vocalText = convertHinglishToDevanagari(cleanText);
  }

  const utterance = new SpeechSynthesisUtterance(vocalText);

  // Calibrate Pitch:
  // Aoede: 1.16 (Sweet, youthful, cute Indian girl voice)
  // Jarvis Classic: 0.94 (Deep, suave British AI butler)
  const defaultPitch = activeModel === 'aoede' ? 1.16 : 0.94;
  utterance.pitch = options.pitch ?? defaultPitch;

  // Calibrate Rate:
  const defaultRate = getJarvisSpeakingRate();
  const adjustedRate = activeModel === 'aoede' ? Math.min(1.4, defaultRate * 1.02) : defaultRate;
  utterance.rate = options.rate ?? adjustedRate;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang || (activeModel === 'aoede' ? 'hi-IN' : 'en-GB');
  } else {
    utterance.lang = isSelectedVoiceHindi ? 'hi-IN' : activeModel === 'aoede' ? 'hi-IN' : 'en-GB';
  }


  const currentSpeechState = {
    text: cleanText,
    timestamp: now,
    isCancelled: false,
    onEnd: options.onEnd,
  };
  activeUtteranceState = currentSpeechState;

  let hasEnded = false;
  const finishSpeech = (wasCancelled = false) => {
    if (hasEnded) return;
    hasEnded = true;
    stopSpeechAudioLevelSimulation();
    if (activeUtteranceState === currentSpeechState) {
      activeUtteranceState = null;
    }
    // Only invoke onEnd if the speech completed naturally and was NOT cancelled or superseded!
    // This prevents premature re-activation of the microphone while new speech is talking!
    if (!wasCancelled && !currentSpeechState.isCancelled) {
      options.onEnd?.();
    }
  };

  utterance.onstart = () => {
    startSpeechAudioLevelSimulation();
    options.onStart?.();
  };

  utterance.onboundary = () => {
    pulseSpeechBoundary();
  };

  utterance.onend = () => {
    finishSpeech(currentSpeechState.isCancelled);
  };

  utterance.onerror = (e: any) => {
    const isCancelErr = e?.error === 'canceled' || e?.error === 'interrupted';
    if (isCancelErr) {
      currentSpeechState.isCancelled = true;
    } else {
      console.warn('Speech synthesis error:', e);
    }
    finishSpeech(currentSpeechState.isCancelled);
  };

  // Retain global reference to avoid Chromium mobile garbage collection bug during speech
  (window as any).__jarvis_active_utterance = utterance;

  // Mobile Chrome safe-resume before speaking
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {}

  try {
    window.speechSynthesis.speak(utterance);
  } catch (synthErr) {
    console.warn('[Jarvis TTS] speak call caught error:', synthErr);
    finishSpeech();
  }

  // Safety fallback for mobile browser speech synthesis hang
  const estimatedDuration = Math.max(2500, Math.min(15000, (vocalText.length * 90) / defaultRate));
  setTimeout(() => {
    if (!hasEnded && (!window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
      finishSpeech();
    }
  }, estimatedDuration + 1500);
}

// Active singing session state
let activeSingingTimeouts: NodeJS.Timeout[] = [];
let activeSingingOscillators: OscillatorNode[] = [];
let isSingingActive = false;

export function stopJarvisSong() {
  isSingingActive = false;
  activeSingingTimeouts.forEach((t) => clearTimeout(t));
  activeSingingTimeouts = [];

  activeSingingOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {}
  });
  activeSingingOscillators = [];

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  window.dispatchEvent(
    new CustomEvent('jarvis:singing-state', {
      detail: { isSinging: false, song: null, currentLine: '' },
    })
  );
}

export function playSynthMelodyNote(freq: number, durationSec: number = 0.35, gainLevel: number = 0.08) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainLevel, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);

    activeSingingOscillators.push(osc);
    setTimeout(() => {
      activeSingingOscillators = activeSingingOscillators.filter((o) => o !== osc);
    }, (durationSec + 0.1) * 1000);
  } catch {}
}

export function playChordProgression(chord: number[], durationSec: number = 2.5) {
  chord.forEach((freq, idx) => {
    setTimeout(() => {
      playSynthMelodyNote(freq, durationSec, 0.04);
    }, idx * 60);
  });
}

export interface SingCallbacks {
  onStart?: (song: SongItem) => void;
  onLineChange?: (lineIndex: number, text: string, romanText: string, song: SongItem) => void;
  onEnd?: () => void;
}

export function singJarvisSong(
  songQuery?: string,
  callbacks?: SingCallbacks
): SongItem {
  // Cancel previous speech or song
  stopJarvisSpeech();
  stopJarvisSong();

  const song = findSong(songQuery);
  isSingingActive = true;

  window.dispatchEvent(
    new CustomEvent('jarvis:singing-state', {
      detail: { isSinging: true, song, currentLine: song.spokenIntro },
    })
  );

  callbacks?.onStart?.(song);

  // Play startup melody chord
  if (song.backgroundChords && song.backgroundChords[0]) {
    playChordProgression(song.backgroundChords[0], 3.0);
  }

  // Step 1: Speak Intro in sweet conversational voice
  speakJarvis(song.spokenIntro, {
    pitch: 1.12,
    rate: 0.95,
    onEnd: () => {
      if (!isSingingActive) return;

      // Step 2: Sing through each lyric line with synth melody notes & vocal melody
      let accumulatedDelay = 350;

      song.lines.forEach((line, lineIdx) => {
        const timeout = setTimeout(() => {
          if (!isSingingActive) return;

          // Dispatch singing line event for UI & Digital Art Animation
          callbacks?.onLineChange?.(lineIdx, line.text, line.romanText, song);
          window.dispatchEvent(
            new CustomEvent('jarvis:singing-state', {
              detail: { isSinging: true, song, currentLine: line.text, lineIndex: lineIdx },
            })
          );

          // Play accompanying musical synth notes
          if (line.notes && line.notes.length > 0) {
            line.notes.forEach((freq, noteIdx) => {
              const noteTimer = setTimeout(() => {
                if (!isSingingActive) return;
                playSynthMelodyNote(freq, 0.45, 0.09);
                window.dispatchEvent(
                  new CustomEvent('jarvis:singing-note', {
                    detail: { freq, noteIndex: noteIdx },
                  })
                );
              }, noteIdx * 280);
              activeSingingTimeouts.push(noteTimer);
            });
          }

          // Background chord progression
          if (song.backgroundChords && song.backgroundChords[lineIdx % song.backgroundChords.length]) {
            playChordProgression(song.backgroundChords[lineIdx % song.backgroundChords.length], 2.8);
          }

          // Speak lyrics with melodic inflection (higher pitch, slower lyrical tempo)
          speakJarvis(line.text, {
            pitch: 1.22,
            rate: 0.86,
            onEnd: () => {
              // Check if last line finished
              if (lineIdx === song.lines.length - 1) {
                const outroTimer = setTimeout(() => {
                  stopJarvisSong();
                  callbacks?.onEnd?.();
                }, 1200);
                activeSingingTimeouts.push(outroTimer);
              }
            },
          });
        }, accumulatedDelay);

        activeSingingTimeouts.push(timeout);
        accumulatedDelay += line.delayMs;
      });
    },
  });

  return song;
}

export function stopJarvisSpeech() {
  if (activeUtteranceState) {
    activeUtteranceState.isCancelled = true;
    activeUtteranceState = null;
  }
  stopJarvisSong();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Android Phone Screen Lock Mechanical Click & Descending Tone
 */
export function playPhoneLockSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Mechanical click
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * Android Phone Screen Biometric Unlock Ascending Sci-Fi Chime
 */
export function playPhoneUnlockSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [440, 659.25, 880]; // A4 -> E5 -> A5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0.001, now + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.1, now + idx * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.28);
  });
}

/**
 * Google Gemini / Android Power Button Long-Press Assistant Invocation Chime
 */
export function playAssistantInvokeSound(force = false) {
  if (!force && !isBackgroundBeepEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // 3-tone cheerful Google Gemini / Assistant chime
  const notes = [587.33, 739.99, 880, 1174.66]; // D5 -> F#5 -> A5 -> D6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.07);

    gain.gain.setValueAtTime(0.001, now + idx * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 0.38);
  });
}

/**
 * Background Audio Keep-Alive Daemon for Lock Screen & Background Processing.
 * Plays an inaudible audio buffer loop to prevent mobile operating systems
 * from putting the JavaScript event loop and SpeechRecognition to sleep.
 */
let silentLoopNode: AudioBufferSourceNode | null = null;

export function startBackgroundAudioKeepAlive(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (silentLoopNode) {
      try {
        silentLoopNode.stop();
        silentLoopNode.disconnect();
      } catch {}
      silentLoopNode = null;
    }
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.00001; // inaudible
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    silentLoopNode = source;
  } catch (e) {
    console.debug('[AudioKeepAlive] Notice:', e);
  }
}

export function stopBackgroundAudioKeepAlive(): void {
  if (silentLoopNode) {
    try {
      silentLoopNode.stop();
      silentLoopNode.disconnect();
    } catch {}
    silentLoopNode = null;
  }
}

