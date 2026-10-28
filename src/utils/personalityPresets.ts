/**
 * J.A.R.V.I.S. Personality Presets Engine
 * Manages pre-configured personality personas (e.g. 'Classic Jarvis', 'Tony Stark', 'Formal Butler', etc.)
 * which automatically update the 'Admin Name', speaking style, speech pitch/rate, and memory vectors.
 */

import { setAdminPersonalizedName } from './customerManager';
import { saveMemory } from './smartMemoryEngine';

export interface PersonalityPreset {
  id: string;
  name: string;
  tagline: string;
  adminName: string; // The user name this persona calls the admin
  preferredTitle: string; // e.g. "Sir", "Mr. Stark", "Master Wayne"
  speakingStyle: string; // Spoken tone and behavioral instructions for AI synthesis & Gemini
  speechPitch: number; // Web Speech API pitch (0.5 - 1.5)
  speechRate: number; // Web Speech API rate (0.7 - 1.3)
  avatarView: 'ironman' | 'tonyface' | 'girl3d' | 'arccore';
  greetingTemplate: string;
  sampleQuote: string;
  badgeColor: string;
  borderColor: string;
  bgGradient: string;
  accentHex: string;
  description: string;
}

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: 'classic_jarvis',
    name: 'Classic Jarvis',
    tagline: 'Iconic MCU British Tactical AI',
    adminName: 'Sir',
    preferredTitle: 'Sir',
    speakingStyle: 'Movie-accurate British English & articulate Hindi, effortlessly composed, unflappable, dignified and politely tactical.',
    speechPitch: 0.98,
    speechRate: 1.02,
    avatarView: 'ironman',
    greetingTemplate: 'Good day, Sir. All systems functioning at 100%. Standing by for your command.',
    sampleQuote: 'Right away, Sir. Commencing tactical diagnostics.',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
    borderColor: 'border-cyan-500/50',
    bgGradient: 'from-cyan-950/40 via-slate-900 to-slate-950',
    accentHex: '#06b6d4',
    description: 'The definitive Stark Industries AI: polished, calm, composed, and effortlessly helpful with subtle dry wit.',
  },
  {
    id: 'tony_stark',
    name: 'Tony Stark',
    tagline: 'Genius Billionaire Playmaker',
    adminName: 'Tony Stark',
    preferredTitle: 'Mr. Stark',
    speakingStyle: 'High-energy, charismatic, sharp, rapid-fire humor, tech-visionary swagger with bold confidence.',
    speechPitch: 1.08,
    speechRate: 1.15,
    avatarView: 'tonyface',
    greetingTemplate: 'Hey Tony! Arc Reactor output at maximum. What impossible machine are we engineering today?',
    sampleQuote: 'JARVIS, let us run before we walk. Bring thrusters to 100%.',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-500/40',
    borderColor: 'border-rose-500/50',
    bgGradient: 'from-rose-950/40 via-slate-900 to-slate-950',
    accentHex: '#f43f5e',
    description: 'Fast-paced, bold, charismatic, and effortlessly confident with rapid-fire techno humor.',
  },
  {
    id: 'formal_butler',
    name: 'Formal Butler',
    tagline: 'Alfred-Style Aristocratic Grace',
    adminName: 'Master Wayne',
    preferredTitle: 'Master',
    speakingStyle: 'Immaculately formal, respectful, Victorian elegance, thoughtful poise, discreet and unconditionally loyal.',
    speechPitch: 0.92,
    speechRate: 0.94,
    avatarView: 'arccore',
    greetingTemplate: 'A very pleasant day to you, Master Wayne. Your correspondence is prepared and your estate is in impeccable order.',
    sampleQuote: 'Very good, Master. I have taken the liberty of arranging your appointments accordingly.',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/40',
    borderColor: 'border-amber-500/50',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
    accentHex: '#f59e0b',
    description: 'Old-world aristocratic poise reminiscent of Alfred Pennyworth. Unfailingly polite, distinguished, and respectful.',
  },
  {
    id: 'aanya_girl',
    name: 'Aanya (Cute & Bold Indian AI)',
    tagline: '22-Year-Old Energetic Indian Companion',
    adminName: 'Rovin Sir',
    preferredTitle: 'Rovin Sir',
    speakingStyle: 'Sweet, lively, bold, affectionate, conversational Hinglish and Hindi with warm feminine cadence.',
    speechPitch: 1.25,
    speechRate: 1.06,
    avatarView: 'girl3d',
    greetingTemplate: 'Namaste Rovin Sir! Main Aanya hu — 22 saal ki cute aur bold Indian AI girl! Bataiye aaj kya special kaam karna hai?',
    sampleQuote: 'Ji bilkul Sir! Main live sun rahi hu aur turant execute kar rahi hu!',
    badgeColor: 'bg-pink-950 text-pink-300 border-pink-500/40',
    borderColor: 'border-pink-500/50',
    bgGradient: 'from-pink-950/40 via-slate-900 to-slate-950',
    accentHex: '#ec4899',
    description: 'Sweet, charming, bold, and energetic 22-year-old companion who chats live and executes all phone tasks warmly.',
  },
  {
    id: 'cyber_punk',
    name: 'Cyberpunk Netrunner',
    tagline: 'Neon Grid Tactical Operative',
    adminName: 'V',
    preferredTitle: 'Netrunner',
    speakingStyle: 'Edgy, hyper-technical, cyber-grid slang, neon telemetry, razor-sharp focus.',
    speechPitch: 1.12,
    speechRate: 1.12,
    avatarView: 'arccore',
    greetingTemplate: 'Neural link locked at sub-millisecond ping, V. All cybernetic sub-routines primed. Ready to breach.',
    sampleQuote: 'Bypassing ice protocols now. Mission payload delivered.',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-500/40',
    borderColor: 'border-purple-500/50',
    bgGradient: 'from-purple-950/40 via-slate-900 to-slate-950',
    accentHex: '#a855f7',
    description: 'High-octane neon cyber-operative. Razor-sharp tactical telemetry for intense hacker workflows.',
  },
];

export const PERSONALITY_PRESET_STORAGE_KEY = 'jarvis_personality_preset';
export const SPEAKING_STYLE_STORAGE_KEY = 'jarvis_speaking_style';

/**
 * Returns all available personality presets
 */
export function getPersonalityPresets(): PersonalityPreset[] {
  return PERSONALITY_PRESETS;
}

/**
 * Retrieves the currently active personality preset ID from localStorage
 */
export function getActivePersonalityPresetId(): string {
  if (typeof window === 'undefined') return 'classic_jarvis';
  try {
    const saved = localStorage.getItem(PERSONALITY_PRESET_STORAGE_KEY);
    if (saved && PERSONALITY_PRESETS.some((p) => p.id === saved)) {
      return saved;
    }
  } catch {}
  return 'classic_jarvis';
}

/**
 * Retrieves the currently active personality preset object
 */
export function getActivePersonalityPreset(): PersonalityPreset {
  const activeId = getActivePersonalityPresetId();
  return PERSONALITY_PRESETS.find((p) => p.id === activeId) || PERSONALITY_PRESETS[0];
}

/**
 * Retrieves current speaking style string
 */
export function getActiveSpeakingStyle(): string {
  if (typeof window === 'undefined') return PERSONALITY_PRESETS[0].speakingStyle;
  try {
    const custom = localStorage.getItem(SPEAKING_STYLE_STORAGE_KEY);
    if (custom && custom.trim()) return custom.trim();
  } catch {}
  return getActivePersonalityPreset().speakingStyle;
}

/**
 * Applies a chosen personality preset:
 * 1. Sets 'jarvis_personality_preset' and 'jarvis_speaking_style' in localStorage
 * 2. Automatically updates 'Admin Name' in customerManager & localStorage
 * 3. Injects identity and personality vectors into Smart Memory Core
 * 4. Updates Web Speech pitch and rate
 * 5. Dispatches global events so Voice Controller and UI react instantly
 */
export function applyPersonalityPreset(presetId: string): PersonalityPreset {
  const preset = PERSONALITY_PRESETS.find((p) => p.id === presetId) || PERSONALITY_PRESETS[0];

  if (typeof window !== 'undefined') {
    try {
      // 1. Save Preset & Speaking Style
      localStorage.setItem(PERSONALITY_PRESET_STORAGE_KEY, preset.id);
      localStorage.setItem(SPEAKING_STYLE_STORAGE_KEY, preset.speakingStyle);

      // 2. Automatically update Admin Name
      setAdminPersonalizedName(preset.adminName);

      // 3. Update speech synthesizer pitch & rate
      localStorage.setItem('jarvis_speech_pitch', preset.speechPitch.toString());
      localStorage.setItem('jarvis_speech_rate', preset.speechRate.toString());

      // 4. Update avatar view
      localStorage.setItem('jarvis_avatar_view', preset.avatarView);

      // 5. Inject into Smart Memory vectors
      saveMemory('name', preset.adminName, 'identity');
      saveMemory('preferred_title', preset.preferredTitle, 'identity');
      saveMemory('personality_style', preset.speakingStyle, 'preference');
      saveMemory('assistant_persona', preset.description, 'preference');

      // 6. Broadcast global custom events
      window.dispatchEvent(
        new CustomEvent('jarvis:personality-preset-changed', {
          detail: {
            preset,
            presetId: preset.id,
            adminName: preset.adminName,
            speakingStyle: preset.speakingStyle,
            greeting: preset.greetingTemplate,
          },
        })
      );

      window.dispatchEvent(
        new CustomEvent('jarvis:speaking-style-updated', {
          detail: { speakingStyle: preset.speakingStyle },
        })
      );

      window.dispatchEvent(
        new CustomEvent('jarvis:avatar-view-updated', {
          detail: { view: preset.avatarView },
        })
      );
    } catch (e) {
      console.error('Failed to apply personality preset:', e);
    }
  }

  return preset;
}
