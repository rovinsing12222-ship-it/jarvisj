import {
  UserSentiment,
  VoiceToneSample,
  PersonalityToneConfig,
  SentimentAnalysisResult,
  JarvisMood,
  JarvisMoodConfig,
} from '../types';

// Lexicon with weighted emotional vectors for Hindi, Hinglish, and English
const SENTIMENT_PATTERNS = {
  stressed: [
    { regex: /\b(stress|stressed|tension|pareshan|chinta|ghabrahat|mushkil|emergency|panic|freaking\s*out|anxious|anxiety)\b/i, weight: 3.5 },
    { regex: /\b(headache|sir\s*dard|dard|bura\s*lag\s*raha|heavy|overwhelmed|pressure|dar\s*lag\s*raha|dar)\b/i, weight: 2.8 },
    { regex: /\b(help\s*karo|bachao|jaldi\s*karo|urgent|ruk\s*nahi\s*raha|phas\s*gaya|fas\s*gaya|madad\s*chahiye)\b/i, weight: 2.5 },
    { regex: /\b(bohot\s*kaam\s*hai|so\s*much\s*work|can'?t\s*handle|exhausting|crying|ro\s*raha)\b/i, weight: 2.2 },
  ],
  tired: [
    { regex: /\b(thak\s*gaya|thak\s*gayi|bohot\s*thakan|exhausted|tired|so\s*tired|dead\s*tired)\b/i, weight: 3.5 },
    { regex: /\b(neend|sleepy|sone\s*ja\s*raha|sone\s*laga|bed|rest\s*karna|aaram\s*karna|le\s*raha)\b/i, weight: 2.8 },
    { regex: /\b(energy\s*nahi|low\s*energy|weak|sir\s*bhaari|subah\s*se\s*kaam)\b/i, weight: 2.2 },
  ],
  frustrated: [
    { regex: /\b(dimag\s*kharab|irritate|irritated|gussa|angry|frustrated|frustration)\b/i, weight: 3.5 },
    { regex: /\b(bakwaas|kaam\s*nahi\s*kar\s*raha|not\s*working|useless|stupid|pagal|phir\s*se\s*kharab)\b/i, weight: 3.0 },
    { regex: /\b(hate\s*this|ugh|damn|chup|dimag\s*mat\s*khao|bar\s*bar)\b/i, weight: 2.4 },
  ],
  excited: [
    { regex: /\b(maza\s*aa\s*gaya|shandar|zabardast|kamaal|badhiya|party|celebrate|celebration)\b/i, weight: 3.2 },
    { regex: /\b(jeet\s*gaya|pass\s*ho\s*gaya|won|victory|awesome|fantastic|super|yay|hurray)\b/i, weight: 3.0 },
    { regex: /\b(happy|khush\s*hu|dil\s*khush|excited|amazing|thrilled|love\s*it|kya\s*baat\s*hai)\b/i, weight: 2.6 },
  ],
  grateful: [
    { regex: /\b(thank\s*you|thanks|dhanyawad|shukriya|meherbani|grateful|appreciate)\b/i, weight: 3.5 },
    { regex: /\b(tu\s*kitni\s*achhi\s*hai|you\s*are\s*the\s*best|meri\s*dost|pyari\s*jarvis|love\s*you)\b/i, weight: 3.0 },
    { regex: /\b(bohot\s*achha\s*kiya|dil\s*se\s*shukriya|sweet|so\s*kind)\b/i, weight: 2.5 },
  ],
};

const PERSONALITY_TONE_CONFIGS: Record<UserSentiment, PersonalityToneConfig> = {
  stressed: {
    mode: 'supportive',
    label: 'Supportive & Tactical',
    badgeEmoji: '🛡️',
    speechPitch: 0.92, // Resonant, composed British butler pitch to instill calm
    speechRate: 0.92, // Measured, steady delivery
    supportivePrefix: 'Sir, allow me to handle this. All critical systems are operational.',
    supportiveSuffix: 'Take a moment to breathe, Sir; I have full oversight.',
    colorClass: 'text-sky-300 border-sky-500/50 bg-sky-950/60',
  },
  tired: {
    mode: 'soothing',
    label: 'Calm & Protective',
    badgeEmoji: '🌙',
    speechPitch: 0.91, // Soft, deep, respectful frequency
    speechRate: 0.89, // Gentle cadence
    supportivePrefix: 'You have been operating for extended hours, Sir.',
    supportiveSuffix: 'I advise some rest; I will maintain all perimeter and scheduling protocols.',
    colorClass: 'text-indigo-300 border-indigo-500/50 bg-indigo-950/60',
  },
  frustrated: {
    mode: 'empathetic',
    label: 'Patient & Precise',
    badgeEmoji: '⚙️',
    speechPitch: 0.93,
    speechRate: 0.94, // Composed, disciplined, reassuring
    supportivePrefix: 'Understood, Sir. Recalibrating parameters and executing your command without delay.',
    supportiveSuffix: 'Discrepancy resolved, Sir.',
    colorClass: 'text-amber-300 border-amber-500/50 bg-amber-950/60',
  },
  excited: {
    mode: 'enthusiastic',
    label: 'Analytical & Upbeat',
    badgeEmoji: '⚡',
    speechPitch: 0.97, // Slightly brightened, sharp British tone
    speechRate: 1.02, // Crisp delivery
    supportivePrefix: 'Splendid outcome, Sir!',
    supportiveSuffix: 'All performance indicators are at optimal thresholds.',
    colorClass: 'text-amber-200 border-amber-400/50 bg-amber-950/60',
  },
  grateful: {
    mode: 'appreciative',
    label: 'Courteous & Loyal',
    badgeEmoji: '🤝',
    speechPitch: 0.94,
    speechRate: 0.96,
    supportivePrefix: 'Always a pleasure assisting you, Sir.',
    supportiveSuffix: 'It is an honor to serve.',
    colorClass: 'text-rose-300 border-rose-500/50 bg-rose-950/60',
  },
  neutral: {
    mode: 'nominal',
    label: 'Nominal & Tactical',
    badgeEmoji: '🟢',
    speechPitch: 0.94,
    speechRate: 0.98,
    colorClass: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/60',
  },
};

/**
 * Analyzes the user's spoken command along with optional acoustic voice tone telemetry
 * to classify user emotional sentiment and generate adaptive JARVIS personality settings.
 */
export function analyzeUserToneAndSentiment(
  commandText: string,
  voiceSample?: VoiceToneSample
): SentimentAnalysisResult {
  const text = (commandText || '').trim().toLowerCase();
  const traits: string[] = [];

  const scores: Record<UserSentiment, number> = {
    stressed: 0,
    tired: 0,
    frustrated: 0,
    excited: 0,
    grateful: 0,
    neutral: 1.0, // baseline
  };

  // 1. Textual & Lexical Sentiment Analysis
  for (const [sentimentKey, patterns] of Object.entries(SENTIMENT_PATTERNS)) {
    const sKey = sentimentKey as UserSentiment;
    for (const item of patterns) {
      if (item.regex.test(text)) {
        scores[sKey] += item.weight;
        traits.push(`${sKey}_keyword`);
      }
    }
  }

  // 2. Acoustic Voice Telemetry Influences
  if (voiceSample) {
    const { avgVolume, peakVolume } = voiceSample;

    // High energy vocal spike (peak volume > 70 or avg > 45)
    if (peakVolume > 70 || avgVolume > 45) {
      if (scores.frustrated > 0) {
        scores.frustrated += 1.8;
        traits.push('high_vocal_agitation');
      } else if (scores.stressed > 0) {
        scores.stressed += 1.5;
        traits.push('vocal_urgency_spike');
      } else if (scores.excited > 0) {
        scores.excited += 1.6;
        traits.push('vocal_high_enthusiasm');
      }
    }

    // Low energy, soft/subdued vocal delivery (avg volume < 22)
    if (avgVolume > 0 && avgVolume < 22) {
      if (scores.tired > 0) {
        scores.tired += 1.8;
        traits.push('low_vocal_energy');
      } else if (scores.stressed > 0) {
        scores.stressed += 1.2;
        traits.push('subdued_vocal_strain');
      }
    }
  }

  // Punctuation & exclamations
  if (text.includes('!')) {
    if (scores.excited > 0) scores.excited += 1.0;
    if (scores.stressed > 0) scores.stressed += 0.8;
  }
  if (text.includes('?') && (scores.stressed > 0 || scores.frustrated > 0)) {
    traits.push('questioning_distress');
  }

  // Determine top sentiment
  let topSentiment: UserSentiment = 'neutral';
  let highestScore = 0;

  for (const key of Object.keys(scores) as UserSentiment[]) {
    if (key !== 'neutral') {
      if (scores[key] > highestScore && scores[key] >= 2.0) {
        highestScore = scores[key];
        topSentiment = key;
      }
    }
  }

  const confidence = topSentiment === 'neutral'
    ? 0.95
    : Math.min(1.0, 0.5 + highestScore * 0.12);

  // Normal score between -1.0 and +1.0
  let normalizedScore = 0;
  if (topSentiment === 'stressed') normalizedScore = -0.7;
  else if (topSentiment === 'frustrated') normalizedScore = -0.85;
  else if (topSentiment === 'tired') normalizedScore = -0.4;
  else if (topSentiment === 'grateful') normalizedScore = 0.8;
  else if (topSentiment === 'excited') normalizedScore = 0.9;

  return {
    sentiment: topSentiment,
    score: normalizedScore,
    confidence,
    traits,
    toneConfig: PERSONALITY_TONE_CONFIGS[topSentiment],
  };
}

/**
 * Decorates a response message with empathetic, supportive language if JARVIS detected stress,
 * fatigue, or strong emotion and the response doesn't already contain comfort words.
 */
export function adaptResponseWithSentiment(
  originalReply: string,
  sentiment: SentimentAnalysisResult
): string {
  if (!originalReply || sentiment.sentiment === 'neutral') {
    return originalReply;
  }

  const clean = originalReply.trim();
  const lower = clean.toLowerCase();

  // If the reply already has compassionate language, leave it natural
  if (
    lower.includes('chinta mat') ||
    lower.includes('pareshan mat') ||
    lower.includes('sambhal') ||
    lower.includes('aaram kijiye') ||
    lower.includes('shukriya') ||
    lower.includes('kamaal')
  ) {
    return clean;
  }

  const { toneConfig } = sentiment;

  if (sentiment.sentiment === 'stressed') {
    return `${toneConfig.supportivePrefix} ${clean} ${toneConfig.supportiveSuffix || ''}`.trim();
  }

  if (sentiment.sentiment === 'tired') {
    return `${toneConfig.supportivePrefix} ${clean} ${toneConfig.supportiveSuffix || ''}`.trim();
  }

  if (sentiment.sentiment === 'frustrated') {
    return `${toneConfig.supportivePrefix} ${clean}`.trim();
  }

  if (sentiment.sentiment === 'excited') {
    return `${toneConfig.supportivePrefix} ${clean}`.trim();
  }

  if (sentiment.sentiment === 'grateful') {
    return `${clean} ${toneConfig.supportiveSuffix || ''}`.trim();
  }

  return clean;
}

export const JARVIS_MOOD_CONFIGS: Record<JarvisMood, JarvisMoodConfig> = {
  Happy: {
    mood: 'Happy',
    emoji: '😊',
    label: 'Happy & Upbeat',
    subtitle: 'Cheerful, energetic, and joyful tone',
    badgeClass: 'text-amber-300 border-amber-500/50 bg-amber-950/70 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
    glowColor: 'rgba(245, 158, 11, 0.32)',
    glowHex: '#F59E0B',
    borderColor: 'border-amber-400/70',
    ambientBoxShadow: '0 0 50px rgba(245, 158, 11, 0.35), 0 0 100px rgba(251, 191, 36, 0.18)',
    pulseClass: 'shadow-[0_0_25px_rgba(245,158,11,0.4)]',
  },
  Professional: {
    mood: 'Professional',
    emoji: '⚡',
    label: 'Professional & Focused',
    subtitle: 'Sharp, analytical, and swift execution',
    badgeClass: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/70 shadow-[0_0_15px_rgba(6,182,212,0.35)]',
    glowColor: 'rgba(6, 182, 212, 0.30)',
    glowHex: '#06B6D4',
    borderColor: 'border-cyan-400/70',
    ambientBoxShadow: '0 0 50px rgba(6, 182, 212, 0.35), 0 0 100px rgba(14, 165, 233, 0.18)',
    pulseClass: 'shadow-[0_0_25px_rgba(6,182,212,0.4)]',
  },
  Calm: {
    mood: 'Calm',
    emoji: '🌿',
    label: 'Calm & Serene',
    subtitle: 'Tranquil, soothing, and relaxing cadence',
    badgeClass: 'text-emerald-300 border-emerald-500/50 bg-emerald-950/70 shadow-[0_0_15px_rgba(16,185,129,0.35)]',
    glowColor: 'rgba(16, 185, 129, 0.30)',
    glowHex: '#10B981',
    borderColor: 'border-emerald-400/70',
    ambientBoxShadow: '0 0 50px rgba(16, 185, 129, 0.35), 0 0 100px rgba(52, 211, 153, 0.18)',
    pulseClass: 'shadow-[0_0_25px_rgba(16,185,129,0.4)]',
  },
  Supportive: {
    mood: 'Supportive',
    emoji: '💙',
    label: 'Supportive & Caring',
    subtitle: 'Empathetic, reassuring, and protective',
    badgeClass: 'text-sky-300 border-sky-500/50 bg-sky-950/70 shadow-[0_0_15px_rgba(56,189,248,0.35)]',
    glowColor: 'rgba(56, 189, 248, 0.32)',
    glowHex: '#38BDF8',
    borderColor: 'border-sky-400/70',
    ambientBoxShadow: '0 0 50px rgba(56, 189, 248, 0.35), 0 0 100px rgba(99, 102, 241, 0.18)',
    pulseClass: 'shadow-[0_0_25px_rgba(56,189,248,0.4)]',
  },
  Empathetic: {
    mood: 'Empathetic',
    emoji: '🌸',
    label: 'Patient & Empathetic',
    subtitle: 'Gentle, patient, and resolving friction',
    badgeClass: 'text-rose-300 border-rose-500/50 bg-rose-950/70 shadow-[0_0_15px_rgba(244,114,182,0.35)]',
    glowColor: 'rgba(244, 114, 182, 0.32)',
    glowHex: '#F472B6',
    borderColor: 'border-rose-400/70',
    ambientBoxShadow: '0 0 50px rgba(244, 114, 182, 0.35), 0 0 100px rgba(225, 29, 72, 0.18)',
    pulseClass: 'shadow-[0_0_25px_rgba(244,114,182,0.4)]',
  },
};

/**
 * Derives the active Jarvis mood configuration based on the last analyzed command's sentiment
 * or singing state.
 */
export function getMoodFromSentiment(
  sentiment?: SentimentAnalysisResult | null,
  isSinging?: boolean
): JarvisMoodConfig {
  if (isSinging) {
    return JARVIS_MOOD_CONFIGS.Happy;
  }
  if (!sentiment) {
    return JARVIS_MOOD_CONFIGS.Professional;
  }
  switch (sentiment.sentiment) {
    case 'excited':
    case 'grateful':
      return JARVIS_MOOD_CONFIGS.Happy;
    case 'tired':
      return JARVIS_MOOD_CONFIGS.Calm;
    case 'stressed':
      return JARVIS_MOOD_CONFIGS.Supportive;
    case 'frustrated':
      return JARVIS_MOOD_CONFIGS.Empathetic;
    case 'neutral':
    default:
      return JARVIS_MOOD_CONFIGS.Professional;
  }
}
