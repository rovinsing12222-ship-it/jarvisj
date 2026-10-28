/**
 * J.A.R.V.I.S. Safe Trusted Mode Engine (सुरक्षित ट्रस्टेड मोड)
 * Allows users to define specific 'always-run' voice commands that Jarvis can execute
 * directly even when the phone is locked, without requiring a full biometric or PIN unlock.
 */

export type SafeCommandActionType =
  | 'torch'        // Flashlight toggle
  | 'time'         // Current time & date
  | 'battery'      // Battery percentage & health
  | 'music'        // Synthesizer song playback
  | 'emergency'    // Emergency dial (112 / ICE)
  | 'weather'      // Weather forecast
  | 'joke'         // Tell a joke
  | 'gramin'       // Rural / CSC status check
  | 'mute'         // Mute / unmute audio
  | 'sleep'        // Standby / sleep mode
  | 'custom';      // User custom phrase

export interface SafeTrustedCommand {
  id: string;
  phrase: string;
  alternatePhrases: string[];
  description: string;
  category: 'hardware' | 'utility' | 'entertainment' | 'safety' | 'custom';
  actionType: SafeCommandActionType;
  enabled: boolean;
  isCustom?: boolean;
}

export interface SafeTrustedModeConfig {
  enabled: boolean;
  allowEmergencyWithoutUnlock: boolean;
  hapticFeedback: boolean;
  announceExecution: boolean;
  commands: SafeTrustedCommand[];
}

const STORAGE_KEY = 'jarvis_safe_trusted_mode_config';

export const DEFAULT_SAFE_COMMANDS: SafeTrustedCommand[] = [
  {
    id: 'safe-torch',
    phrase: 'Torch / Flashlight on/off',
    alternatePhrases: ['Torch jalao', 'Torch band karo', 'Flashlight on', 'Flashlight off', 'टॉर्च', 'लाइट'],
    description: 'Toggle LED flashlight on or off directly on lock screen without unlocking.',
    category: 'hardware',
    actionType: 'torch',
    enabled: true,
  },
  {
    id: 'safe-time',
    phrase: 'Check Time & Date',
    alternatePhrases: ['Time kya hua hai', 'Samay batao', 'Kitne baje hain', 'Date kya hai', 'समय', 'टाइम'],
    description: 'Speaks current local time and date aloud in selected language.',
    category: 'utility',
    actionType: 'time',
    enabled: true,
  },
  {
    id: 'safe-battery',
    phrase: 'Battery Level & Charge',
    alternatePhrases: ['Battery kitni hai', 'Battery percentage', 'Charge kitna hai', 'बैटरी', 'चार्ज'],
    description: 'Queries battery status and reports charge percentage aloud.',
    category: 'utility',
    actionType: 'battery',
    enabled: true,
  },
  {
    id: 'safe-music',
    phrase: 'Play Ambient & Synth Songs',
    alternatePhrases: ['Gana bajao', 'Gaana sunao', 'Play music', 'Music off karo', 'गाना बजाओ', 'गाना'],
    description: 'Starts or pauses live melodic music synthesizer right on lock screen.',
    category: 'entertainment',
    actionType: 'music',
    enabled: true,
  },
  {
    id: 'safe-emergency',
    phrase: 'Emergency SOS / 112 Dial',
    alternatePhrases: ['Emergency 112', 'Police call', 'SOS call', 'आपातकालीन कॉल', '112'],
    description: 'Instant national emergency SOS dispatch dialer without phone lock restrictions.',
    category: 'safety',
    actionType: 'emergency',
    enabled: true,
  },
  {
    id: 'safe-weather',
    phrase: 'Weather & Temperature',
    alternatePhrases: ['Mausam kaisa hai', 'Weather update', 'Temperature kitna hai', 'मौसम'],
    description: 'Reads current atmospheric condition, temperature and forecast.',
    category: 'utility',
    actionType: 'weather',
    enabled: true,
  },
  {
    id: 'safe-joke',
    phrase: 'Tell a Quick Joke',
    alternatePhrases: ['Joke sunao', 'Chutkula sunao', 'Hanso', 'हंसाओ', 'चुटकुला'],
    description: 'Delivers witty humor and lighthearted punchlines while locked.',
    category: 'entertainment',
    actionType: 'joke',
    enabled: true,
  },
  {
    id: 'safe-gramin',
    phrase: 'CSC & Digital Gramin Seva Status',
    alternatePhrases: ['Digital Gramin Seva status', 'CSC helpline', 'ग्रामीण सेवा', 'सीएससी'],
    description: 'Provides quick rural kiosk helpline contact info and operating status.',
    category: 'utility',
    actionType: 'gramin',
    enabled: true,
  },
  {
    id: 'safe-mute',
    phrase: 'Mute / Unmute Voice Audio',
    alternatePhrases: ['Voice mute karo', 'Awaaz band karo', 'Unmute audio', 'म्यूट करो'],
    description: 'Silences or resumes Jarvis speech audio synthesis immediately.',
    category: 'hardware',
    actionType: 'mute',
    enabled: true,
  },
  {
    id: 'safe-sleep',
    phrase: 'Put Jarvis to Standby / Sleep',
    alternatePhrases: ['Jarvis so jao', 'Go to sleep', 'Standby mode', 'सो जाओ'],
    description: 'Puts active lock screen listener back into quiet standby mode.',
    category: 'hardware',
    actionType: 'sleep',
    enabled: true,
  },
];

export const DEFAULT_SAFE_TRUSTED_CONFIG: SafeTrustedModeConfig = {
  enabled: true,
  allowEmergencyWithoutUnlock: true,
  hapticFeedback: true,
  announceExecution: true,
  commands: DEFAULT_SAFE_COMMANDS,
};

export function getSafeTrustedModeConfig(): SafeTrustedModeConfig {
  if (typeof window === 'undefined') return DEFAULT_SAFE_TRUSTED_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAFE_TRUSTED_CONFIG;
    const parsed = JSON.parse(raw);
    const rawCommands = Array.isArray(parsed?.commands) ? parsed.commands : DEFAULT_SAFE_COMMANDS;
    const cleanCommands = rawCommands.map((c: any) => ({
      ...c,
      phrase: typeof c?.phrase === 'string' ? c.phrase : '',
      alternatePhrases: Array.isArray(c?.alternatePhrases)
        ? c.alternatePhrases.filter((a: any) => typeof a === 'string')
        : [],
      description: typeof c?.description === 'string' ? c.description : '',
      category: c?.category || 'utility',
      actionType: c?.actionType || 'custom',
      enabled: c?.enabled !== false,
    }));

    return {
      ...DEFAULT_SAFE_TRUSTED_CONFIG,
      ...parsed,
      commands: cleanCommands.length > 0 ? cleanCommands : DEFAULT_SAFE_COMMANDS,
    };
  } catch {
    return DEFAULT_SAFE_TRUSTED_CONFIG;
  }
}

export function saveSafeTrustedModeConfig(
  config: Partial<SafeTrustedModeConfig>
): SafeTrustedModeConfig {
  const current = getSafeTrustedModeConfig();
  const updated: SafeTrustedModeConfig = { ...current, ...config };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('jarvis:safe-trusted-mode-updated', { detail: updated })
      );
    } catch (e) {
      console.warn('[SafeTrustedMode] Error saving config:', e);
    }
  }
  return updated;
}

export function addCustomSafeCommand(phrase: string, description?: string): SafeTrustedCommand {
  const current = getSafeTrustedModeConfig();
  const clean = phrase.trim();
  const id = `safe-custom-${Date.now()}`;
  const newCmd: SafeTrustedCommand = {
    id,
    phrase: clean,
    alternatePhrases: [clean.toLowerCase()],
    description: description || `User custom always-run command: "${clean}"`,
    category: 'custom',
    actionType: 'custom',
    enabled: true,
    isCustom: true,
  };

  const updatedCommands = [...current.commands, newCmd];
  saveSafeTrustedModeConfig({ commands: updatedCommands });
  return newCmd;
}

export function deleteSafeCommand(id: string): void {
  const current = getSafeTrustedModeConfig();
  const updatedCommands = current.commands.filter((c) => c.id !== id);
  saveSafeTrustedModeConfig({ commands: updatedCommands });
}

export function toggleSafeCommand(id: string, enabled?: boolean): void {
  const current = getSafeTrustedModeConfig();
  const updatedCommands = current.commands.map((c) => {
    if (c.id === id) {
      return { ...c, enabled: typeof enabled === 'boolean' ? enabled : !c.enabled };
    }
    return c;
  });
  saveSafeTrustedModeConfig({ commands: updatedCommands });
}

export function resetSafeTrustedModeToDefaults(): SafeTrustedModeConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent('jarvis:safe-trusted-mode-updated', { detail: DEFAULT_SAFE_TRUSTED_CONFIG })
      );
    } catch {}
  }
  return DEFAULT_SAFE_TRUSTED_CONFIG;
}

/**
 * Checks whether an incoming spoken transcript matches an active 'always-run' safe command.
 */
export function matchSafeTrustedCommand(
  transcript: string,
  config: SafeTrustedModeConfig = getSafeTrustedModeConfig()
): SafeTrustedCommand | null {
  if (!config.enabled || !transcript) return null;

  const raw = transcript.trim();
  const lower = raw.toLowerCase();

  // Strip leading wake words ("jarvis", "hey jarvis", etc.) to match inner command
  const stripped = lower
    .replace(/^(hey|hi|hello|ok|oye|are|हे|हाय|हेलो|ओए)?\s*(jarvis|jarvees|jarvisji|जार्विस|जारविस|जार्विश|mayra|मैरा|myra)\b[\s,.:;!?-]*/i, '')
    .trim();

  for (const cmd of config.commands) {
    if (!cmd.enabled) continue;

    // Direct phrase matching
    if (lower.includes(cmd.phrase.toLowerCase()) || stripped.includes(cmd.phrase.toLowerCase())) {
      return cmd;
    }

    // Alternate phrases matching
    const alternates = Array.isArray(cmd.alternatePhrases) ? cmd.alternatePhrases : [];
    for (const alt of alternates) {
      if (typeof alt !== 'string') continue;
      const altLower = alt.toLowerCase();
      if (lower.includes(altLower) || stripped.includes(altLower)) {
        return cmd;
      }
    }

    // Keyword heuristics by actionType
    if (cmd.actionType === 'torch' && (lower.includes('torch') || lower.includes('flashlight') || lower.includes('टॉर्च'))) {
      return cmd;
    }
    if (cmd.actionType === 'time' && (lower.includes('time') || lower.includes('samay') || lower.includes('समय') || lower.includes('kitne baje'))) {
      return cmd;
    }
    if (cmd.actionType === 'battery' && (lower.includes('battery') || lower.includes('बैटरी') || lower.includes('charge'))) {
      return cmd;
    }
    if (cmd.actionType === 'music' && (lower.includes('gana') || lower.includes('gaana') || lower.includes('गाना') || lower.includes('song'))) {
      return cmd;
    }
    if (cmd.actionType === 'emergency' && (lower.includes('emergency') || lower.includes('112') || lower.includes('police') || lower.includes('sos'))) {
      return cmd;
    }
    if (cmd.actionType === 'weather' && (lower.includes('weather') || lower.includes('mausam') || lower.includes('मौसम') || lower.includes('barish'))) {
      return cmd;
    }
    if (cmd.actionType === 'joke' && (lower.includes('joke') || lower.includes('chutkula') || lower.includes('चुटकुला') || lower.includes('हंसाओ'))) {
      return cmd;
    }
    if (cmd.actionType === 'gramin' && (lower.includes('gramin') || lower.includes('ग्रामीण') || lower.includes('csc'))) {
      return cmd;
    }
    if (cmd.actionType === 'mute' && (lower.includes('mute') || lower.includes('म्यूट') || lower.includes('awaaz band'))) {
      return cmd;
    }
    if (cmd.actionType === 'sleep' && (lower.includes('so jao') || lower.includes('सो जाओ') || lower.includes('standby') || lower.includes('sleep'))) {
      return cmd;
    }
  }

  return null;
}
