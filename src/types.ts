export interface Contact {
  id: string;
  name: string;
  phone: string;
  phoneType?: 'mobile' | 'work' | 'home';
  secondaryPhone?: string;
  secondaryPhoneType?: 'mobile' | 'work' | 'home';
  relation?: string; // e.g. 'Dad', 'Mom', 'Doctor', 'Colleague', 'Friend'
  email?: string;
  avatarColor?: string;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  time: string; // e.g. "14:30" or "02:30 PM"
  date: string; // e.g. "2026-09-03"
  category: 'reminder' | 'meeting' | 'alarm' | 'task' | string;
  customCategory?: string;
  completed: boolean;
  notified?: boolean;
  hour?: number;
  minute?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  syncedNative?: boolean;
  snoozeCount?: number;
}

export interface JarvisAction {
  name: string;
  args: Record<string, any>;
  timestamp?: string;
  status?: 'executed' | 'pending' | 'failed';
  details?: string;
}

export interface CommandMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: string;
  action?: JarvisAction;
}

export interface DeviceInfoState {
  batteryLevel: number;
  isCharging: boolean;
  online: boolean;
  torchActive: boolean;
  audioMuted: boolean;
  speechPitch: number;
  speechRate: number;
  speechLang: 'hi-IN' | 'en-IN' | 'en-US';
  os: string;
}

export interface QuickApp {
  id: string;
  name: string;
  category: string;
  iconName: string;
  color: string;
  intentUrl: string;
  fallbackUrl: string;
  description: string;
}

export interface IncomingMessage {
  id: string;
  senderName: string;
  senderPhone: string;
  text: string;
  timestamp: string;
  channel: 'sms' | 'whatsapp';
  read: boolean;
  avatarColor?: string;
  relation?: string;
}

export interface CommandHistoryItem {
  query: string;
  response: string;
  timestamp: string;
  date?: string;
  isoDate?: string;
  actions?: JarvisAction[];
}

export type HapticIntensity = 'off' | 'subtle' | 'standard' | 'strong' | 'maximum';

export type HapticPatternStyle =
  | 'balanced'
  | 'crisp'
  | 'double_tap'
  | 'cyber_pulse'
  | 'long_resonance'
  | 'arc_reactor';

export type HapticAlertType =
  | 'alarm'
  | 'message'
  | 'call'
  | 'reminder'
  | 'emergency'
  | 'voice_wake';

export interface AlertHapticPatternConfig {
  id: HapticAlertType;
  name: string;
  hindiName: string;
  description: string;
  pattern: number[];
  presetName: string;
  repeatCount: number;
  intensityMultiplier: number;
  enabled: boolean;
}

export type AlertHapticsMap = Record<HapticAlertType, AlertHapticPatternConfig>;

export interface HapticFeedbackConfig {
  enabled: boolean;
  intensity: HapticIntensity;
  patternStyle: HapticPatternStyle;
  customDurationMultiplier: number;
  actionSpecificPatterns: boolean;
  vibrateOnVoiceWake: boolean;
  vibrateOnCommandComplete: boolean;
  alertPatterns?: Partial<AlertHapticsMap>;
}

export type UserSentiment = 'stressed' | 'frustrated' | 'tired' | 'excited' | 'grateful' | 'neutral';

export type JarvisMood = 'Happy' | 'Professional' | 'Calm' | 'Supportive' | 'Empathetic';

export interface JarvisMoodConfig {
  mood: JarvisMood;
  emoji: string;
  label: string;
  subtitle: string;
  badgeClass: string;
  glowColor: string;
  glowHex: string;
  borderColor: string;
  ambientBoxShadow: string;
  pulseClass: string;
}

export interface VoiceToneSample {
  avgVolume: number;
  peakVolume: number;
  pitchVariance?: number;
  speechRateEstimate?: number;
  durationMs?: number;
}

export interface PersonalityToneConfig {
  mode: 'supportive' | 'soothing' | 'enthusiastic' | 'appreciative' | 'empathetic' | 'nominal';
  label: string;
  badgeEmoji: string;
  speechPitch: number;
  speechRate: number;
  supportivePrefix?: string;
  supportiveSuffix?: string;
  colorClass: string;
}

export interface SentimentAnalysisResult {
  sentiment: UserSentiment;
  score: number;
  confidence: number;
  traits: string[];
  toneConfig: PersonalityToneConfig;
}

export interface AccentCalibrationProfile {
  calibratedAt: string;
  durationSeconds: number;
  accentName: string;
  dialectRegion: string;
  confidenceScore: number;
  accuracyBoostPercent: number;
  primaryPhoneticTraits: string[];
  phoneticShiftMap: Record<string, string[]>;
  reverseShiftMap: Record<string, string>;
  recommendedLocale: string;
  speechCadenceWpm: number;
  silenceDebounceMs: number;
  audioNoiseFloorDb?: number;
  geminiAccentPrompt: string;
  isActive: boolean;
}

export interface CalibrationPromptItem {
  id: number;
  text: string;
  phoneticFocus: string;
  keywords: string[];
}

export interface PhoneticCorrectionDetail {
  original: string;
  corrected: string;
  matchedRule: string;
}

export interface PhoneticCorrectionResult {
  rawText: string;
  correctedText: string;
  corrections: PhoneticCorrectionDetail[];
  wasModified: boolean;
}

export interface AmbientNoiseState {
  level: number; // 0 - 100
  approxDb: number; // ~30 - 95 dB
  status: 'quiet' | 'normal' | 'loud' | 'too_loud';
  isTooLoud: boolean;
  suggestMute: boolean;
  autoMuted: boolean;
}

export type ThemeId =
  | 'classic_jarvis'
  | 'neon_cyber'
  | 'minimalist_slate'
  | 'emerald_matrix'
  | 'crimson_stark'
  | 'amethyst_void';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryRgb: string;
  secondary: string;
  secondaryRgb: string;
  accent: string;
  accentRgb: string;
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  border: string;
  borderAccent: string;
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  glow: string;
  glowRgb: string;
}

export interface ThemePalette {
  id: ThemeId;
  name: string;
  tagline: string;
  badge: string;
  previewColors: string[];
  colors: ThemeColors;
}

export type SmartMemoryCategory =
  | 'identity'
  | 'preference'
  | 'personal'
  | 'custom_instruction'
  | 'routine'
  | 'hardware'
  | 'contact_rule'
  | 'other';

export interface SmartMemoryItem {
  id: string;
  key: string; // e.g. "name", "favorite_food", "car_number", "birthday", "preference"
  value: string; // e.g. "Rovin Pal", "Paneer Butter Masala", "DL 01 AB 1234"
  category: SmartMemoryCategory;
  rawPrompt?: string;
  confidence?: number;
  source?: 'user_stated' | 'inferred' | 'system_default';
  pinned?: boolean;
  createdAt?: string;
  updatedAt: string;
}

export type MemoryItem = SmartMemoryItem;

export type TargetStatus = 'pending' | 'in_progress' | 'completed';

export interface UserTargetItem {
  id: string;
  title: string;
  status: TargetStatus;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
  category?: 'work' | 'personal' | 'fitness' | 'learning' | 'daily' | 'other';
  progressPercent?: number;
}



