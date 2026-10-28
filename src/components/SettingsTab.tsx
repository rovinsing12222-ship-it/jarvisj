import React, { useState, useEffect, useRef } from 'react';
import {
  Vibrate,
  Sliders,
  Sparkles,
  CheckCircle2,
  Volume2,
  RotateCcw,
  Zap,
  BellRing,
  Flashlight,
  PhoneCall,
  MessageSquare,
  Monitor,
  Activity,
  Smartphone,
  ShieldCheck,
  Flame,
  Mic,
  MicOff,
  Play,
  Pause,
  AlertCircle,
  Download,
  Gauge,
  Headphones,
  Check,
  HelpCircle,
  RefreshCw,
  Share2,
  Cpu,
  Palette,
  Paintbrush,
  Languages,
  Shield,
  ShieldAlert,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Clock,
  Battery,
  Sun,
  Smile,
  Building2,
  Moon,
  Search,
  Music,
  MoreVertical,
  Copy,
  ExternalLink,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  getSafeTrustedModeConfig,
  saveSafeTrustedModeConfig,
  addCustomSafeCommand,
  deleteSafeCommand,
  toggleSafeCommand,
  resetSafeTrustedModeToDefaults,
  SafeTrustedModeConfig,
  SafeTrustedCommand,
} from '../utils/safeTrustedModeEngine';
import { JarvisResponseLanguage } from './JarvisLanguageDropdown';
import {
  HapticIntensity,
  HapticPatternStyle,
  HapticFeedbackConfig,
  ThemeId,
  ThemePalette,
} from '../types';
import {
  getActiveThemeId,
  getActiveTheme,
  applyTheme,
  resetToDefaultTheme,
  getAllThemePalettes,
} from '../utils/themeEngine';
import {
  getHapticConfig,
  saveHapticConfig,
  testHapticFeedback,
  triggerHaptic,
  isVibrationSupported,
  PATTERN_STYLE_PRESETS,
  INTENSITY_MULTIPLIERS,
  ACTION_CATEGORY_PATTERNS,
  DEFAULT_HAPTIC_CONFIG,
  getAllAlertHapticConfigs,
  saveAlertHapticConfig,
  resetAlertHapticConfig,
  DEFAULT_ALERT_HAPTICS,
  ALERT_PATTERN_PRESETS,
  triggerAlertHaptic,
  testAlertHapticPattern,
} from '../utils/hapticEngine';
import { HapticAlertType, AlertHapticsMap, AlertHapticPatternConfig } from '../types';
import {
  getJarvisSpeakingRate,
  saveJarvisSpeakingRate,
  DEFAULT_SPEAKING_RATE,
  speakJarvis,
  JarvisVoiceModel,
  getActiveVoiceModel,
  setActiveVoiceModel,
  JARVIS_VOICE_MODELS,
  isBackgroundBeepEnabled,
  setBackgroundBeepEnabled,
  playBeepSound,
  playCommandRecognizedPingSound,
} from '../utils/audioSynth';
import {
  getWakeWordConfig,
  saveWakeWordConfig,
  playWakeChime,
  WakeWordConfig,
  WakeWordTrigger,
  getAmbientSensitivityProfile,
  AmbientSensitivityProfile,
} from '../utils/wakeWordEngine';
import {
  getVoiceActivationThresholdConfig,
  saveVoiceActivationThresholdConfig,
  getActivationThresholdProfile,
  VoiceActivationThresholdConfig,
  DEFAULT_ACTIVATION_THRESHOLD_CONFIG,
} from '../utils/voiceActivationThreshold';

interface SettingsTabProps {
  onSpeak?: (text: string) => void;
  onLogAction?: (text: string) => void;
  onOpenInstallModal?: (tab?: 'apk_build' | 'friend' | 'playstore' | 'android' | 'ios') => void;
  responseLanguage?: JarvisResponseLanguage;
  onSelectResponseLanguage?: (lang: JarvisResponseLanguage) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onSpeak,
  onLogAction,
  onOpenInstallModal,
  responseLanguage,
  onSelectResponseLanguage,
}) => {
  // Global AI Response Language state
  const [currentResponseLang, setCurrentResponseLang] = useState<JarvisResponseLanguage>(() => {
    try {
      const saved = localStorage.getItem('jarvis_ai_response_lang');
      if (saved === 'english' || saved === 'hindi' || saved === 'hinglish') {
        return saved as JarvisResponseLanguage;
      }
    } catch {}
    return responseLanguage || 'hindi';
  });

  useEffect(() => {
    if (responseLanguage) {
      setCurrentResponseLang(responseLanguage);
    }
  }, [responseLanguage]);

  useEffect(() => {
    const handleGlobalLang = (e: any) => {
      const lang = e.detail?.language;
      if (lang && (lang === 'english' || lang === 'hindi' || lang === 'hinglish')) {
        setCurrentResponseLang(lang);
      }
    };
    window.addEventListener('jarvis:language-changed', handleGlobalLang);
    return () => window.removeEventListener('jarvis:language-changed', handleGlobalLang);
  }, []);

  const handleSwitchLanguage = (lang: JarvisResponseLanguage) => {
    setCurrentResponseLang(lang);
    try {
      localStorage.setItem('jarvis_ai_response_lang', lang);
    } catch {}
    window.dispatchEvent(new CustomEvent('jarvis:language-changed', { detail: { language: lang } }));
    onSelectResponseLanguage?.(lang);
    onLogAction?.(`Language switched to ${lang.toUpperCase()}`);
  };

  // Haptic feedback state
  const [config, setConfig] = useState<HapticFeedbackConfig>(() => getHapticConfig());
  const [isVibrating, setIsVibrating] = useState(false);
  const [activeTestPattern, setActiveTestPattern] = useState<number[]>([]);
  const [lastActionTested, setLastActionTested] = useState<string | null>(null);
  const [hasVibrateSupport] = useState(() => isVibrationSupported());
  const [saveBanner, setSaveBanner] = useState(false);

  // Alert Haptic Patterns Customizer State (Alarms, Messages, Calls)
  const [alertHaptics, setAlertHaptics] = useState<AlertHapticsMap>(() => getAllAlertHapticConfigs());
  const [activeAlertTab, setActiveAlertTab] = useState<HapticAlertType>('alarm');
  const [alertTestingId, setAlertTestingId] = useState<string | null>(null);
  const [alertToast, setAlertToast] = useState<string | null>(null);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number | null>(null);

  // Sync alert haptics when updated elsewhere
  useEffect(() => {
    const handleAlertsUpdate = (e: any) => {
      setAlertHaptics(getAllAlertHapticConfigs());
    };
    window.addEventListener('jarvis:alert-haptics-updated', handleAlertsUpdate);
    return () => {
      window.removeEventListener('jarvis:alert-haptics-updated', handleAlertsUpdate);
    };
  }, []);

  // Voice Speaking Rate & Model state
  const [speakingRate, setSpeakingRate] = useState<number>(() => getJarvisSpeakingRate());
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [activeVoiceModel, setActiveVoiceModelState] = useState<JarvisVoiceModel>(() => getActiveVoiceModel());
  const [voiceModelToast, setVoiceModelToast] = useState<string | null>(null);

  // Sync active voice model if changed globally
  useEffect(() => {
    const handleVoiceModelChange = (e: any) => {
      if (e.detail?.voiceModel) {
        setActiveVoiceModelState(e.detail.voiceModel);
      }
    };
    window.addEventListener('jarvis_voice_model_changed', handleVoiceModelChange);
    return () => {
      window.removeEventListener('jarvis_voice_model_changed', handleVoiceModelChange);
    };
  }, []);

  // UI Theme state
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>(() => getActiveThemeId());
  const [currentTheme, setCurrentTheme] = useState<ThemePalette>(() => getActiveTheme());
  const [themeChangeToast, setThemeChangeToast] = useState<string | null>(null);

  // Microphone Feedback Test state
  const [isRecordingMicTest, setIsRecordingMicTest] = useState(false);
  const [micTestCountdown, setMicTestCountdown] = useState(5);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [micTestStatus, setMicTestStatus] = useState<'idle' | 'recording' | 'ready' | 'error'>('idle');
  const [micTestError, setMicTestError] = useState<string | null>(null);
  const [micQualityScore, setMicQualityScore] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const maxVolumeRecordedRef = useRef<number>(0);

  // Listen to visual haptic events for animation ripple
  useEffect(() => {
    const handleHapticEvent = (e: any) => {
      const pattern = e.detail?.pattern || [50];
      setActiveTestPattern(pattern);
      setIsVibrating(true);
      const totalDuration = pattern.reduce((acc: number, val: number) => acc + val, 0);
      const timer = setTimeout(() => {
        setIsVibrating(false);
      }, Math.max(300, totalDuration + 100));
      return () => clearTimeout(timer);
    };

    window.addEventListener('jarvis-haptic-triggered', handleHapticEvent);
    return () => {
      window.removeEventListener('jarvis-haptic-triggered', handleHapticEvent);
    };
  }, []);

  // Listen for external speaking rate changes
  useEffect(() => {
    const handleRateChange = (e: any) => {
      if (e.detail?.rate) {
        setSpeakingRate(e.detail.rate);
      }
    };
    window.addEventListener('jarvis_speaking_rate_changed', handleRateChange);
    return () => window.removeEventListener('jarvis_speaking_rate_changed', handleRateChange);
  }, []);

  // Listen for theme changes across app
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail?.themeId && e.detail?.palette) {
        setSelectedThemeId(e.detail.themeId);
        setCurrentTheme(e.detail.palette);
      }
    };
    window.addEventListener('jarvis:theme-changed', handleThemeChange);
    return () => window.removeEventListener('jarvis:theme-changed', handleThemeChange);
  }, []);

  // Wake-word settings state
  const [wakeWordConfig, setWakeWordConfig] = useState<WakeWordConfig>(() => getWakeWordConfig());
  const [wakeWordToast, setWakeWordToast] = useState<string | null>(null);

  const handleToggleWakeWord = (enabled: boolean) => {
    const updated = { ...wakeWordConfig, enabled };
    setWakeWordConfig(updated);
    saveWakeWordConfig(updated);
    testHapticFeedback(config.patternStyle, config.intensity);
    setWakeWordToast(
      enabled
        ? 'Wake-word detection enabled: Background listening active'
        : 'Wake-word background listening turned off'
    );
    setTimeout(() => setWakeWordToast(null), 3000);
    if (onLogAction) {
      onLogAction(enabled ? 'Wake-word background detection enabled' : 'Wake-word detection disabled');
    }
  };

  const handleChangeWakeTrigger = (trigger: WakeWordTrigger) => {
    const updated = { ...wakeWordConfig, trigger };
    setWakeWordConfig(updated);
    saveWakeWordConfig(updated);
    testHapticFeedback(config.patternStyle, config.intensity);
    if (updated.playChime) {
      playWakeChime();
    }
    setWakeWordToast(`Trigger word set to "${trigger}"`);
    setTimeout(() => setWakeWordToast(null), 3000);
    if (onLogAction) {
      onLogAction(`Wake-word trigger changed to ${trigger}`);
    }
  };

  const handleChangeWakeSensitivity = (sensitivity: number) => {
    const clamped = Math.max(10, Math.min(100, Math.round(sensitivity)));
    const updated = { ...wakeWordConfig, sensitivity: clamped };
    setWakeWordConfig(updated);
    saveWakeWordConfig(updated);
    triggerHaptic([15]);
    const profile = getAmbientSensitivityProfile(clamped);
    setWakeWordToast(`Wake-word sensitivity: ${clamped}% (${profile.title})`);
    setTimeout(() => setWakeWordToast(null), 2500);
    if (onLogAction) {
      onLogAction(`Wake-word sensitivity adjusted to ${clamped}% (${profile.title})`);
    }
  };

  const [bgBeepEnabled, setBgBeepEnabled] = useState<boolean>(() => isBackgroundBeepEnabled());

  useEffect(() => {
    const handleBgBeepEvent = (e: any) => {
      if (e.detail?.enabled !== undefined) {
        setBgBeepEnabled(Boolean(e.detail.enabled));
      }
    };
    window.addEventListener('jarvis:background-beep-updated', handleBgBeepEvent);
    return () => window.removeEventListener('jarvis:background-beep-updated', handleBgBeepEvent);
  }, []);

  const handleToggleBgBeep = (enabled: boolean) => {
    setBackgroundBeepEnabled(enabled);
    setBgBeepEnabled(enabled);
    if (!enabled) {
      saveWakeWordConfig({ playChime: false });
      setWakeWordConfig((prev) => ({ ...prev, playChime: false }));
    }
    triggerHaptic([30, 40]);
    if (enabled) {
      playBeepSound(true);
    }
  };

  const handleToggleWakeChime = (playChime: boolean) => {
    if (playChime && !bgBeepEnabled) {
      setBackgroundBeepEnabled(true);
      setBgBeepEnabled(true);
    }
    const updated = { ...wakeWordConfig, playChime };
    setWakeWordConfig(updated);
    saveWakeWordConfig(updated);
    if (playChime) {
      playWakeChime(true);
    }
  };

  const handleToggleWakeHaptic = (hapticFeedback: boolean) => {
    const updated = { ...wakeWordConfig, hapticFeedback };
    setWakeWordConfig(updated);
    saveWakeWordConfig(updated);
  };

  // Voice Command Activation Sensitivity Threshold & False-Positive Shield State
  const [activationThreshold, setActivationThreshold] = useState<VoiceActivationThresholdConfig>(() =>
    getVoiceActivationThresholdConfig()
  );
  const [thresholdToast, setThresholdToast] = useState<string | null>(null);

  useEffect(() => {
    const handleThresholdUpdate = (e: any) => {
      const updated = e.detail !== undefined ? e.detail : getVoiceActivationThresholdConfig();
      setActivationThreshold(updated);
    };
    window.addEventListener('jarvis:activation-threshold-updated', handleThresholdUpdate);
    return () => window.removeEventListener('jarvis:activation-threshold-updated', handleThresholdUpdate);
  }, []);

  const handleChangeThresholdSensitivity = (sensitivity: number) => {
    const clamped = Math.max(10, Math.min(100, Math.round(sensitivity)));
    const profile = getActivationThresholdProfile(clamped);
    const updated = saveVoiceActivationThresholdConfig({
      sensitivityPercent: clamped,
      minVolumeGate: profile.defaultVolumeGate,
      silenceDebounceMs: profile.defaultDebounceMs,
    });
    setActivationThreshold(updated);
    triggerHaptic([15]);
    setThresholdToast(`Voice sensitivity: ${clamped}% (${profile.title})`);
    setTimeout(() => setThresholdToast(null), 3000);
    if (onLogAction) {
      onLogAction(`Voice activation sensitivity set to ${clamped}% (${profile.title})`);
    }
  };

  const handleToggleFalsePositiveShield = (prevent: boolean) => {
    const updated = saveVoiceActivationThresholdConfig({ preventFalsePositives: prevent });
    setActivationThreshold(updated);
    triggerHaptic([25]);
    setThresholdToast(prevent ? 'False-Positive Shield: ACTIVE' : 'False-Positive Shield: OFF');
    setTimeout(() => setThresholdToast(null), 3000);
    if (onLogAction) {
      onLogAction(prevent ? 'Voice false-positive shield activated' : 'Voice false-positive shield deactivated');
    }
  };

  const handleChangeVolumeGate = (volumeGate: number) => {
    const clamped = Math.max(0, Math.min(60, Math.round(volumeGate)));
    const updated = saveVoiceActivationThresholdConfig({ minVolumeGate: clamped });
    setActivationThreshold(updated);
    triggerHaptic([10]);
  };

  const handleChangeSilenceDebounce = (ms: number) => {
    const clamped = Math.max(120, Math.min(600, Math.round(ms)));
    const updated = saveVoiceActivationThresholdConfig({ silenceDebounceMs: clamped });
    setActivationThreshold(updated);
    triggerHaptic([10]);
  };

  const handleTestAcousticPing = () => {
    triggerHaptic([35, 45]);
    playCommandRecognizedPingSound();
    setThresholdToast('Tested acoustic ping notification sound');
    setTimeout(() => setThresholdToast(null), 3000);
    if (onSpeak) {
      onSpeak('Voice command recognized. Acoustic confirmation ping active.');
    }
  };

  const handleResetThresholdDefaults = () => {
    const def = saveVoiceActivationThresholdConfig(DEFAULT_ACTIVATION_THRESHOLD_CONFIG);
    setActivationThreshold(def);
    triggerHaptic([20, 20]);
    setThresholdToast('Reset voice activation threshold to defaults');
    setTimeout(() => setThresholdToast(null), 3000);
  };

  // Safe Trusted Mode (सुरक्षित ट्रस्टेड मोड) Settings State
  const [safeTrustedConfig, setSafeTrustedConfig] = useState<SafeTrustedModeConfig>(() =>
    getSafeTrustedModeConfig()
  );
  const [safeCategoryFilter, setSafeCategoryFilter] = useState<string>('all');
  const [safeSearchQuery, setSafeSearchQuery] = useState<string>('');
  const [isAddingSafeCmd, setIsAddingSafeCmd] = useState<boolean>(false);
  const [newCmdPhrase, setNewCmdPhrase] = useState<string>('');
  const [newCmdDesc, setNewCmdDesc] = useState<string>('');
  const [safeModeToast, setSafeModeToast] = useState<string | null>(null);

  useEffect(() => {
    const handleSafeUpdate = (e: any) => {
      if (e.detail) {
        setSafeTrustedConfig(e.detail);
      }
    };
    window.addEventListener('jarvis:safe-trusted-mode-updated', handleSafeUpdate);
    return () => {
      window.removeEventListener('jarvis:safe-trusted-mode-updated', handleSafeUpdate);
    };
  }, []);

  const handleToggleSafeTrustedMaster = (enabled: boolean) => {
    const updated = saveSafeTrustedModeConfig({ enabled });
    setSafeTrustedConfig(updated);
    testHapticFeedback(config.patternStyle, config.intensity);
    setSafeModeToast(
      enabled
        ? 'Safe Trusted Mode Enabled: Always-run commands active on lock screen'
        : 'Safe Trusted Mode Disabled: Full unlock required for all actions'
    );
    setTimeout(() => setSafeModeToast(null), 3000);
    onLogAction?.(enabled ? 'Safe Trusted Mode enabled' : 'Safe Trusted Mode disabled');
  };

  const handleToggleSafeCommand = (id: string) => {
    testHapticFeedback(config.patternStyle, config.intensity);
    toggleSafeCommand(id);
    const updated = getSafeTrustedModeConfig();
    setSafeTrustedConfig(updated);
  };

  const handleDeleteSafeCommand = (id: string, phrase: string) => {
    testHapticFeedback(config.patternStyle, config.intensity);
    deleteSafeCommand(id);
    const updated = getSafeTrustedModeConfig();
    setSafeTrustedConfig(updated);
    setSafeModeToast(`Removed custom command: "${phrase}"`);
    setTimeout(() => setSafeModeToast(null), 2500);
  };

  const handleCreateCustomSafeCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmdPhrase.trim()) return;
    testHapticFeedback(config.patternStyle, config.intensity);
    addCustomSafeCommand(newCmdPhrase.trim(), newCmdDesc.trim());
    const updated = getSafeTrustedModeConfig();
    setSafeTrustedConfig(updated);
    setNewCmdPhrase('');
    setNewCmdDesc('');
    setIsAddingSafeCmd(false);
    setSafeModeToast(`Added always-run command: "${newCmdPhrase.trim()}"`);
    setTimeout(() => setSafeModeToast(null), 3000);
  };

  const handleResetSafeModeDefaults = () => {
    testHapticFeedback(config.patternStyle, config.intensity);
    const def = resetSafeTrustedModeToDefaults();
    setSafeTrustedConfig(def);
    setSafeModeToast('Safe Trusted Mode reset to default verified commands');
    setTimeout(() => setSafeModeToast(null), 3000);
  };

  // Theme selection handler
  const handleSelectTheme = (themeId: ThemeId) => {
    const updated = applyTheme(themeId);
    setSelectedThemeId(themeId);
    setCurrentTheme(updated);
    testHapticFeedback(config.patternStyle, config.intensity);
    setThemeChangeToast(`UI Theme updated to ${updated.name}`);
    setTimeout(() => setThemeChangeToast(null), 3200);
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 2200);

    if (onLogAction) {
      onLogAction(`UI Theme updated to ${updated.name}`);
    }
  };

  // Reset theme back to original Classic Jarvis
  const handleResetTheme = () => {
    const reset = resetToDefaultTheme();
    setSelectedThemeId(reset.id);
    setCurrentTheme(reset);
    testHapticFeedback(config.patternStyle, config.intensity);
    setThemeChangeToast(`UI Theme reset to default (${reset.name})`);
    setTimeout(() => setThemeChangeToast(null), 3200);
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 2200);

    if (onLogAction) {
      onLogAction(`UI Theme reset to default (${reset.name})`);
    }
  };

  // Cleanup mic recording resources on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    };
  }, []);

  // PWA & Add-to-Home Screen Installation state
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeBrowserGuide, setActiveBrowserGuide] = useState<'chrome' | 'samsung' | 'safari'>('chrome');
  const [copiedPwaUrl, setCopiedPwaUrl] = useState(false);
  const [pwaToast, setPwaToast] = useState<string | null>(null);

  const publicAppUrl = 'https://ais-pre-kp4ry4uzvcmzvbtpqlsykt-97908392068.asia-southeast1.run.app';
  const currentAppUrl =
    typeof window !== 'undefined'
      ? window.location.origin.replace('ais-dev-', 'ais-pre-')
      : publicAppUrl;

  const handleCopyAppUrl = () => {
    testHapticFeedback(config.patternStyle, config.intensity);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentAppUrl);
    }
    setCopiedPwaUrl(true);
    setPwaToast('JARVIS App link copied! Open in Google Chrome on Android.');
    setTimeout(() => {
      setCopiedPwaUrl(false);
      setPwaToast(null);
    }, 3500);
  };

  const handleTriggerPwaInstall = async () => {
    testHapticFeedback(config.patternStyle, config.intensity);
    if (isInstallable) {
      const res = await install();
      if (res) {
        setPwaToast('JARVIS PWA installation started on your device!');
        setTimeout(() => setPwaToast(null), 3500);
      }
    } else {
      if (onOpenInstallModal) {
        onOpenInstallModal('playstore');
      }
    }
  };

  // Haptic update
  const updateConfig = (updates: Partial<HapticFeedbackConfig>, notifyText?: string) => {
    const next = saveHapticConfig(updates);
    setConfig(next);
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 2200);
    if (notifyText && onLogAction) {
      onLogAction(notifyText);
    }
  };

  const handleTestCurrent = () => {
    setLastActionTested(null);
    const pattern = testHapticFeedback(config.patternStyle, config.intensity);
    if (onLogAction) {
      onLogAction(
        `Tested Haptic Feedback (${config.patternStyle.toUpperCase()}, ${config.intensity.toUpperCase()})`
      );
    }
  };

  const handleTestActionCategory = (category: string, label: string) => {
    setLastActionTested(label);
    const pattern = testHapticFeedback(config.patternStyle, config.intensity, category);
    if (onLogAction) {
      onLogAction(`Tested Action Haptic for ${label}: [${pattern.join(', ')}]ms`);
    }
  };

  const handleResetDefaults = () => {
    const next = saveHapticConfig(DEFAULT_HAPTIC_CONFIG);
    setConfig(next);
    testHapticFeedback('balanced', 'standard');
    if (onLogAction) {
      onLogAction('Reset Haptic Feedback settings to factory defaults');
    }
    if (onSpeak) {
      onSpeak('Boss, haptic feedback settings have been restored to optimal defaults.');
    }
  };

  const handleUpdateAlertConfig = (
    alertType: HapticAlertType,
    patch: Partial<AlertHapticPatternConfig>,
    message?: string
  ) => {
    const updated = saveAlertHapticConfig(alertType, patch);
    setAlertHaptics((prev) => ({ ...prev, [alertType]: updated }));
    if (message) {
      setAlertToast(message);
      setTimeout(() => setAlertToast(null), 2500);
    }
    if (onLogAction) {
      onLogAction(`Updated ${updated.name} haptic pattern: ${updated.presetName}`);
    }
  };

  const handleTestAlertPattern = (alertType: HapticAlertType) => {
    const cfg = alertHaptics[alertType] || DEFAULT_ALERT_HAPTICS[alertType];
    triggerHaptic([20]);
    setAlertTestingId(alertType);
    const pattern = testAlertHapticPattern(cfg.pattern, cfg.intensityMultiplier, cfg.repeatCount);
    setActiveTestPattern(pattern);
    setIsVibrating(true);
    const totalMs = (cfg.pattern || []).reduce((a, b) => a + b, 0) * (cfg.repeatCount || 1) + 200;
    setTimeout(() => {
      setAlertTestingId(null);
      setIsVibrating(false);
    }, Math.max(300, totalMs));
    if (onLogAction) {
      onLogAction(`Tested ${cfg.name} vibration on physical device`);
    }
  };

  const handleResetAlertToDefault = (alertType: HapticAlertType) => {
    triggerHaptic([30, 40]);
    resetAlertHapticConfig(alertType);
    setAlertHaptics(getAllAlertHapticConfigs());
    const name = alertHaptics[alertType]?.name || alertType;
    setAlertToast(`Reset ${name} to factory pattern`);
    setTimeout(() => setAlertToast(null), 2500);
  };

  // Speaking Rate handler
  const handleRateSliderChange = (newRate: number) => {
    const rounded = Math.round(newRate * 100) / 100;
    setSpeakingRate(rounded);
    saveJarvisSpeakingRate(rounded);
    if (onLogAction) {
      onLogAction(`Jarvis speaking rate updated to ${rounded}x`);
    }
  };

  const handleSelectVoiceModel = (model: JarvisVoiceModel) => {
    triggerHaptic([30, 50]);
    setActiveVoiceModel(model);
    setActiveVoiceModelState(model);
    const meta = JARVIS_VOICE_MODELS[model];
    setVoiceModelToast(`Voice Model switched to ${meta.name}!`);
    setTimeout(() => setVoiceModelToast(null), 3500);

    speakJarvis(meta.sampleGreeting, {
      voiceModel: model,
      rate: speakingRate,
    });
    if (onLogAction) {
      onLogAction(`AI Voice Model set to ${meta.name}`);
    }
  };

  const handleTestVoiceSpeaking = () => {
    setIsTestingVoice(true);
    const meta = JARVIS_VOICE_MODELS[activeVoiceModel];
    speakJarvis(meta.sampleGreeting, {
      voiceModel: activeVoiceModel,
      rate: speakingRate,
      onEnd: () => setIsTestingVoice(false),
    });
  };

  const handleResetRate = () => {
    handleRateSliderChange(DEFAULT_SPEAKING_RATE);
    speakJarvis('Jarvis default speaking pace restore ho gaya hai.', {
      rate: DEFAULT_SPEAKING_RATE,
    });
  };

  // Microphone Feedback Test tool (5 seconds recording & playback)
  const startMicrophoneTest = async () => {
    setMicTestError(null);
    setRecordedAudioUrl(null);
    setMicQualityScore(null);
    setIsPlayingBack(false);
    audioChunksRef.current = [];
    maxVolumeRecordedRef.current = 0;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicTestError('Aapke browser me microphone recording support uplabdh nahi hai.');
      setMicTestStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      // Audio level analyser
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setMicAudioLevel(normalized);
        if (normalized > maxVolumeRecordedRef.current) {
          maxVolumeRecordedRef.current = normalized;
        }
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // MediaRecorder setup
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        setIsRecordingMicTest(false);
        setMicTestStatus('ready');

        // Analyze recorded audio
        const peak = maxVolumeRecordedRef.current;
        if (peak < 5) {
          setMicQualityScore('silent');
        } else if (peak < 18) {
          setMicQualityScore('low');
        } else {
          setMicQualityScore('clean');
        }

        // Auto playback so user verifies immediately
        setTimeout(() => {
          playAudioPlayback(url);
        }, 300);
      };

      recorder.start();
      setIsRecordingMicTest(true);
      setMicTestStatus('recording');
      setMicTestCountdown(5);

      // 5-second countdown
      let count = 5;
      const interval = setInterval(() => {
        count -= 1;
        setMicTestCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      }, 1000);
    } catch (err: any) {
      console.error('Mic test error:', err);
      setIsRecordingMicTest(false);
      setMicTestStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicTestError('Microphone permission block hai. Chrome address bar me Lock icon par click karke Permission "Allow" karein.');
      } else {
        setMicTestError(`Microphone access error: ${err.message || 'Microphone connect nahi ho paaya'}`);
      }
    }
  };

  const playAudioPlayback = (urlToPlay?: string) => {
    const targetUrl = urlToPlay || recordedAudioUrl;
    if (!targetUrl) return;

    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
    }

    const audio = new Audio(targetUrl);
    playbackAudioRef.current = audio;
    setIsPlayingBack(true);

    audio.onended = () => {
      setIsPlayingBack(false);
    };

    audio.onerror = () => {
      setIsPlayingBack(false);
    };

    audio.play().catch((err) => {
      console.warn('Playback error:', err);
      setIsPlayingBack(false);
    });
  };

  const togglePlayback = () => {
    if (isPlayingBack && playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      setIsPlayingBack(false);
    } else if (recordedAudioUrl) {
      playAudioPlayback(recordedAudioUrl);
    }
  };

  const patternStyles: { id: HapticPatternStyle; title: string; desc: string; icon: any }[] = [
    {
      id: 'crisp',
      title: 'Crisp & Soft',
      desc: 'Quick, refined micro-pulses for gentle tactile acknowledgment without distraction.',
      icon: Sparkles,
    },
    {
      id: 'balanced',
      title: 'Balanced (Default)',
      desc: 'Standard rhythmic feedback mirroring native Android hardware feel.',
      icon: Sliders,
    },
    {
      id: 'double_tap',
      title: 'Double Tap & Punchy',
      desc: 'Multi-pulse cadence with firm vibration response for active confirmation.',
      icon: Zap,
    },
    {
      id: 'cyber_pulse',
      title: 'Cyber Pulse & Sharp',
      desc: 'High-frequency double snaps engineered for Iron Man / Jarvis reactor styling.',
      icon: Flame,
    },
  ];

  const intensities: { id: HapticIntensity; label: string; desc: string; multiplier: string }[] = [
    { id: 'off', label: 'Off', desc: 'Silence all vibration motors', multiplier: '0x' },
    { id: 'subtle', label: 'Subtle', desc: '50% vibration duration for battery saving', multiplier: '0.5x' },
    { id: 'standard', label: 'Standard', desc: '100% calibrated Jarvis duration', multiplier: '1.0x' },
    { id: 'strong', label: 'Strong', desc: '150% intense vibration for outdoors / pockets', multiplier: '1.5x' },
  ];

  const actionTestPills = [
    { key: 'torch', label: 'Flashlight', icon: Flashlight },
    { key: 'call', label: 'Voice Call', icon: PhoneCall },
    { key: 'alarm', label: 'Alarm Alert', icon: BellRing },
    { key: 'message', label: 'SMS Inbox', icon: MessageSquare },
    { key: 'system', label: 'System Action', icon: Monitor },
    { key: 'success', label: 'Success Ack', icon: CheckCircle2 },
  ];

  const ratePresets = [
    { rate: 0.8, label: '0.8x (Dheemi / Calm)' },
    { rate: 0.95, label: '0.95x (Natural / Default)' },
    { rate: 1.15, label: '1.15x (Active / Crisp)' },
    { rate: 1.35, label: '1.35x (Tez / Quick)' },
  ];

  return (
    <div className="space-y-6 pb-24 text-slate-200">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-blue-950/40 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sliders className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Jarvis Core Settings
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                v4.8 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure Speaking Rate, Microphone Audio Engine, Haptic Feedback & Android App
            </p>
          </div>
        </div>

        {/* Global Save Indicator */}
        {saveBanner && (
          <div className="animate-fade-in flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Saved to Phone Memory</span>
          </div>
        )}
      </div>

      {/* RESTRICTED MASTER ADMIN DASHBOARD PANEL CARD */}
      <section
        id="settings-admin-dashboard-link-card"
        className="p-5 sm:p-6 rounded-2xl border backdrop-blur-xl space-y-4 transition-all duration-300 shadow-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Master Admin Dashboard Panel (एडमिन कंट्रोल पैनल)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                  🔒 Strictly Admin Only
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Rovin Pal Master Access
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Only for Administrator: Manage system telemetry, inspect full Q&A user logs, direct knowledge vectors injection, full JSON memory backup/restore, and Google Play Store release console.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-settings-open-admin"
            onClick={() => {
              testHapticFeedback(config.patternStyle, config.intensity);
              window.dispatchEvent(new CustomEvent('jarvis:open-admin-dashboard'));
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Open Admin Dashboard (PIN Required)</span>
          </button>
        </div>
      </section>

      {/* SECTION: PWA ADD-TO-HOME SCREEN & STEP-BY-STEP ANDROID BROWSER TUTORIAL */}
      <section
        id="settings-pwa-install-tutorial"
        className="p-5 sm:p-6 rounded-2xl border backdrop-blur-xl space-y-5 transition-all duration-300 shadow-xl bg-slate-900/80 border-cyan-500/40 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header & Live Installation State Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Install as App on Android (होम स्क्रीन पर जोड़ें)</span>
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                    isInstalled
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : isInstallable
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  }`}
                >
                  {isInstalled
                    ? '✅ App Installed (Standalone Mode)'
                    : isInstallable
                    ? '⚡ 1-Tap Install Ready'
                    : '📱 Browser Menu Guide'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Android WebAPK PWA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                JARVIS ko apne Android फ़ोन की Home Screen पर बिना Play Store के असली Native App की तरह जोड़ें। यह फुल स्क्रीन में बिना ब्राउज़र एड्रेस बार के खुलेगा और लॉक स्क्रीन में भी एक्टिव रहेगा!
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {isInstallable && !isInstalled && (
              <button
                type="button"
                id="btn-settings-direct-pwa-install"
                onClick={handleTriggerPwaInstall}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>1-Tap Install App</span>
              </button>
            )}

            <button
              type="button"
              id="btn-settings-copy-app-link"
              onClick={handleCopyAppUrl}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              {copiedPwaUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copiedPwaUrl ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              id="btn-settings-open-apk-builder"
              onClick={() => onOpenInstallModal?.('apk_build')}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Build .apk</span>
            </button>

            <button
              type="button"
              id="btn-settings-share-qr-friend"
              onClick={() => onOpenInstallModal?.('friend')}
              className="px-3 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900/80 text-emerald-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Share QR</span>
            </button>
          </div>
        </div>

        {/* Dynamic Toast feedback */}
        {pwaToast && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pwaToast}</span>
          </div>
        )}

        {/* Interactive Browser Selection Tabs */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>अपने ब्राउज़र के अनुसार स्टेप्स देखें:</span>
            </span>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  testHapticFeedback(config.patternStyle, config.intensity);
                  setActiveBrowserGuide('chrome');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeBrowserGuide === 'chrome'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🤖 Android Chrome (मुख्य)
              </button>

              <button
                type="button"
                onClick={() => {
                  testHapticFeedback(config.patternStyle, config.intensity);
                  setActiveBrowserGuide('samsung');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeBrowserGuide === 'samsung'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌐 Samsung / Brave
              </button>

              <button
                type="button"
                onClick={() => {
                  testHapticFeedback(config.patternStyle, config.intensity);
                  setActiveBrowserGuide('safari');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeBrowserGuide === 'safari'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🍏 iPhone (Safari)
              </button>
            </div>
          </div>

          {/* TAB 1: GOOGLE CHROME (ANDROID) - FULL 4-STEP VISUAL TUTORIAL */}
          {activeBrowserGuide === 'chrome' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Google Chrome Android OS में डायरेक्ट <strong>Native WebAPK</strong> बना देता है, जिससे यह असली ऐप की तरह काम करता है!</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 shrink-0">
                  Zero Warnings
                </span>
              </div>

              {/* 4 Step Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* STEP 1 */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2.5 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                      STEP 01 • BROWSER
                    </span>
                    <Globe className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>1. Chrome में लिंक खोलें</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    अपने Android फ़ोन में Google Chrome ब्राउज़र खोलें और JARVIS App का लिंक पेस्ट करके ओपन करें।
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentAppUrl}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyAppUrl}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      {copiedPwaUrl ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* STEP 2 */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2.5 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                      STEP 02 • BROWSER MENU
                    </span>
                    <div className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-xs font-mono font-bold flex items-center gap-1">
                      <MoreVertical className="w-3.5 h-3.5" />
                      <span>⋮ 3-Dots</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>2. ऊपर 3 डॉट्स (⋮ Menu) दबाएं</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Google Chrome के सबसे ऊपर दाएँ कोने (Top-Right Corner) में मौजूद <strong className="text-amber-300 font-mono">3 डॉट्स (⋮)</strong> आइकन पर टैप करें। इससे ब्राउज़र सेटिंग्स मेन्यू खुल जाएगा।
                  </p>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <span>Top-right ⋮ menu button contains the native install trigger.</span>
                  </div>
                </div>

                {/* STEP 3 */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2.5 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                      STEP 03 • SELECT OPTION
                    </span>
                    <Download className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>3. "Install app" या "Add to Home screen" चुनें</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    मेन्यू लिस्ट में नीचे स्क्रॉल करें और <strong className="text-emerald-300 font-mono">"Install app"</strong> (ऐप इंस्टॉल करें) या <strong className="text-emerald-300 font-mono">"Add to Home screen"</strong> विकल्प पर क्लिक करें।
                  </p>
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Chrome verifies WebAPK manifest & prepares the system package.</span>
                  </div>
                </div>

                {/* STEP 4 */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2.5 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/30 font-bold">
                      STEP 04 • CONFIRM & LAUNCH
                    </span>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>4. "Install" दबाएं & Home Screen से चलाएं</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    आने वाले पॉप-अप में <strong className="text-purple-300 font-mono">"Install"</strong> पर टैप करें। कुछ ही सेकंड में JARVIS का आइकॉन आपकी Home Screen और App Drawer में आ जाएगा!
                  </p>
                  <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>लॉन्च करते ही बिना URL बार के 100% फुल स्क्रीन में चलेगा।</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAMSUNG INTERNET & BRAVE */}
          {activeBrowserGuide === 'samsung' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Samsung Internet & Brave Browser Guide</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-300 pl-4 list-decimal">
                <li className="leading-relaxed">
                  <strong>Samsung Internet:</strong> ब्राउज़र के सबसे नीचे दाएँ कोने में <strong>मेनू बार (☰)</strong> पर टैप करें। इसके बाद <strong>"Add page to" (पेज जोड़ें)</strong> &rarr; <strong>"Home screen"</strong> चुनें और <strong>Add</strong> दबाएं।
                </li>
                <li className="leading-relaxed">
                  <strong>Brave Browser:</strong> ऊपर दाएँ <strong>3 डॉट्स (⋮)</strong> दबाएं &rarr; <strong>"Install app"</strong> या <strong>"Add to Home screen"</strong> पर क्लिक करके कन्फर्म करें।
                </li>
              </ol>
            </div>
          )}

          {/* TAB 3: IPHONE SAFARI */}
          {activeBrowserGuide === 'safari' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>iPhone / iPad (Safari) Installation Guide</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-300 pl-4 list-decimal">
                <li className="leading-relaxed">
                  Safari ब्राउज़र में JARVIS लिंक खोलें।
                </li>
                <li className="leading-relaxed">
                  स्क्रीन के नीचे बीच में मौजूद <strong>Share बटन (⎋ बॉक्स में ऊपर तीर)</strong> पर टैप करें।
                </li>
                <li className="leading-relaxed">
                  नीचे स्क्रॉल करके <strong>"Add to Home Screen" (+ आइकन)</strong> पर टैप करें और ऊपर दाएँ कोने में <strong>"Add"</strong> दबाएं।
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Benefits of Installing PWA Grid */}
        <div className="pt-2 border-t border-slate-800/80">
          <h5 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Home Screen पर Install करने के मुख्य फायदे (Key Benefits):</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-bold text-white block mb-1">⚡ Fullscreen AMOLED UI</span>
              <p className="text-[11px] text-slate-400">बिना किसी ब्राउज़र एड्रेस बार या टैब्स के असली 100% फुल-स्क्रीन अनुभव।</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-bold text-white block mb-1">🔒 Always-Run Lock Screen</span>
              <p className="text-[11px] text-slate-400">फ़ोन लॉक होने पर भी वेक-वर्ड "Jarvis" और Safe Trusted कमांड्स तुरंत फॉलो होंगे।</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-bold text-white block mb-1">🚀 Precached Fast Boot</span>
              <p className="text-[11px] text-slate-400">Service worker से ऑफलाइन लोडिंग और सुपरफास्ट रिस्पॉन्स टाइम।</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-bold text-white block mb-1">📲 App Drawer Presence</span>
              <p className="text-[11px] text-slate-400">प्ले स्टोर ऐप की तरह ऐप ड्रॉवर और होम स्क्रीन विजेट में उपलब्ध।</p>
            </div>
          </div>
        </div>

        {/* Voice Command Shortcut Hint */}
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>बोलें: <strong>"Jarvis ko home screen par kaise lekar jaye"</strong> या <strong>"APK download karo"</strong></span>
          </span>
          <button
            type="button"
            onClick={() => onOpenInstallModal?.('playstore')}
            className="text-[11px] font-bold text-cyan-300 hover:text-white underline cursor-pointer"
          >
            Open Modal Viewer &rarr;
          </button>
        </div>
      </section>

      {/* SECTION: WAKE-WORD (वेक-वर्ड) VOICE ACTIVATION */}
      <section
        id="settings-wake-word-section"
        className="p-5 sm:p-6 rounded-2xl border backdrop-blur-xl space-y-5 transition-all duration-300 shadow-xl bg-slate-900/80 border-cyan-500/40 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Wake-Word Voice Activation (वेक-वर्ड डिटेक्शन)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                    wakeWordConfig.enabled
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {wakeWordConfig.enabled ? `Active: "${wakeWordConfig.trigger}"` : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Background mein microphone active rehta hai. Jab aap "{wakeWordConfig.trigger}" bolte hain, J.A.R.V.I.S. turant activate ho jata hai.
              </p>
            </div>
          </div>

          {/* Master Enable/Disable Switch */}
          <button
            type="button"
            id="toggle-wake-word-enabled"
            onClick={() => handleToggleWakeWord(!wakeWordConfig.enabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              wakeWordConfig.enabled
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {wakeWordConfig.enabled ? (
              <>
                <Check className="w-4 h-4" />
                <span>Wake-Word ON</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-slate-400" />
                <span>Wake-Word OFF</span>
              </>
            )}
          </button>
        </div>

        {wakeWordToast && (
          <div className="animate-fade-in p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{wakeWordToast}</span>
          </div>
        )}

        {/* Trigger Selection */}
        <div className="space-y-3 pt-1 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 block">
            Choose Trigger Word (ट्रिगर वर्ड चुनें):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(['Jarvis', 'Hey Jarvis', 'Assistant'] as WakeWordTrigger[]).map((trig) => {
              const isSelected = wakeWordConfig.trigger === trig;
              return (
                <button
                  key={trig}
                  type="button"
                  id={`btn-select-trigger-${trig.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleChangeWakeTrigger(trig)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-cyan-200 font-mono">"{trig}"</span>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {trig === 'Jarvis'
                      ? 'Movie-accurate Stark AI trigger ("Jarvis" / "जार्विस")'
                      : trig === 'Hey Jarvis'
                      ? 'Conversational wake phrase ("Hey Jarvis" / "हे जार्विस")'
                      : 'Universal assistant prompt ("Assistant" / "असिस्टेंट")'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Background To-Tu Sound & Chime Controller */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              bgBeepEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Background "To-Tu" Beep Sound</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  bgBeepEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {bgBeepEnabled ? 'ON (चालू)' : 'OFF (बंद - 100% शांत)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Jarvis open karne par background me aane wali "to-tu" beep aur startup chime sound ko band/chalu karein.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => playBeepSound(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 cursor-pointer active:scale-95 transition-all"
              title="Test the to-tu beep sound"
            >
              Test To-Tu Sound
            </button>
            <button
              type="button"
              onClick={() => handleToggleBgBeep(!bgBeepEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm ${
                bgBeepEnabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
              }`}
            >
              {bgBeepEnabled ? 'Turn OFF (बंद करें)' : 'Turn ON (चालू करें)'}
            </button>
          </div>
        </div>

        {/* Chime & Response Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Sound Chime Toggle */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Wake Chime Sound</span>
                <span className="text-[10px] text-slate-400">Holographic chirp when wake word matched</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => playWakeChime(true)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                title="Listen to wake chime"
              >
                Play
              </button>
              <button
                type="button"
                onClick={() => handleToggleWakeChime(!wakeWordConfig.playChime)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  wakeWordConfig.playChime ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {wakeWordConfig.playChime ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Haptic Feedback Toggle */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Haptic Pulse on Wake</span>
                <span className="text-[10px] text-slate-400">Tactile phone vibration confirmation</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleWakeHaptic(!wakeWordConfig.hapticFeedback)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                wakeWordConfig.hapticFeedback ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {wakeWordConfig.hapticFeedback ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* WAKE-WORD SENSITIVITY & AMBIENT NOISE TUNING SLIDER */}
        {(() => {
          const sensitivity = typeof wakeWordConfig.sensitivity === 'number' ? wakeWordConfig.sensitivity : 75;
          const ambientProfile = getAmbientSensitivityProfile(sensitivity);

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-cyan-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>Wake-Word Detection Sensitivity</span>
                      <span className="text-[11px] text-cyan-300/80 font-normal hidden sm:inline">
                        (डिटेक्शन संवेदनशीलता)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Adjust trigger responsiveness to eliminate false activations in noisy areas or whisper softly in quiet rooms.
                    </p>
                  </div>
                </div>

                {/* Live Value & Profile Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${ambientProfile.badgeColor}`}>
                    {ambientProfile.badge}
                  </span>
                  <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs font-black text-cyan-300 shadow-inner">
                    {sensitivity}%
                  </div>
                </div>
              </div>

              {/* Slider Track Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>10% Low (High Noise Rejection)</span>
                  <span className="text-cyan-300 font-mono font-bold">{sensitivity}%</span>
                  <span>100% Ultra (Whisper & Far-Field)</span>
                </div>

                <div className="relative py-1">
                  <input
                    type="range"
                    id="slider-wake-word-sensitivity"
                    min="10"
                    max="100"
                    step="5"
                    value={sensitivity}
                    onChange={(e) => handleChangeWakeSensitivity(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    title={`Wake-word detection sensitivity: ${sensitivity}%`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono px-1 mt-1.5 select-none">
                    <span>10% (Loud TV/Traffic)</span>
                    <span>35% (Moderate Noise)</span>
                    <span>70% (Standard Room)</span>
                    <span>85% (Quiet Room)</span>
                    <span>100% (Whisper)</span>
                  </div>
                </div>
              </div>

              {/* Ambient Noise Level Preset Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Quick Ambient Environment Presets (त्वरित परिवेश स्तर चुनें):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    {
                      label: 'Noisy / TV (शोरगुल)',
                      val: 25,
                      sub: 'High Noise Rejection',
                      active: sensitivity <= 35,
                      color: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
                    },
                    {
                      label: 'Office / Living Room',
                      val: 55,
                      sub: 'Moderate Ambient',
                      active: sensitivity > 35 && sensitivity <= 65,
                      color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300',
                    },
                    {
                      label: 'Quiet Room (अनुशंसित)',
                      val: 75,
                      sub: 'Fast Everyday Trigger',
                      active: sensitivity > 65 && sensitivity <= 85,
                      color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300',
                    },
                    {
                      label: 'Whisper / Bed (फुसफुसाहट)',
                      val: 95,
                      sub: 'Ultra Far-Field',
                      active: sensitivity > 85,
                      color: 'border-purple-500/50 bg-purple-950/40 text-purple-300',
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChangeWakeSensitivity(preset.val)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        preset.active
                          ? `${preset.color} font-bold shadow-md`
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-[11px] block">{preset.label}</span>
                      <span className="text-[10px] opacity-80 mt-0.5 font-mono">
                        {preset.val}% • {preset.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Ambient Acoustic Profile Explanation Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-cyan-400 font-mono">[{sensitivity}%]</span>
                    <span>{ambientProfile.title}</span>
                    <span className="text-slate-400 font-normal">({ambientProfile.hindiTitle})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {ambientProfile.rejectionLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {ambientProfile.description}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-cyan-300">Recommended for:</span>
                  <span>{ambientProfile.recommendedFor}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Live Test Trigger Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400">
            Current Sensitivity Level:{' '}
            <strong className="text-cyan-300 font-mono font-bold">
              {wakeWordConfig.sensitivity || 75}%
            </strong>{' '}
            ({getAmbientSensitivityProfile(wakeWordConfig.sensitivity || 75).title})
          </span>
          <button
            type="button"
            id="btn-simulate-wake-word-test"
            onClick={() => {
              if (wakeWordConfig.playChime) playWakeChime();
              testHapticFeedback(config.patternStyle, config.intensity);
              if (onSpeak) {
                onSpeak(
                  `At your service, Sir. Wake-word "${wakeWordConfig.trigger}" is active at ${
                    wakeWordConfig.sensitivity || 75
                  } percent sensitivity for ${
                    getAmbientSensitivityProfile(wakeWordConfig.sensitivity || 75).title
                  }.`
                );
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Test Wake Word Response ({wakeWordConfig.sensitivity || 75}%)</span>
          </button>
        </div>
      </section>

      {/* SECTION: VOICE COMMAND ACTIVATION SENSITIVITY THRESHOLD & FALSE-POSITIVE SHIELD */}
      <section
        id="settings-voice-activation-threshold-section"
        className="p-5 sm:p-6 rounded-2xl border backdrop-blur-xl space-y-5 transition-all duration-300 shadow-xl bg-slate-900/80 border-emerald-500/40 relative overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {thresholdToast && (
          <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{thresholdToast}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ShieldAlert className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Voice Command Activation Sensitivity (वॉइस एक्टिवेशन थ्रेशोल्ड)
                </h3>
                {(() => {
                  const prof = getActivationThresholdProfile(activationThreshold.sensitivityPercent);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${prof.badgeColor}`}>
                      {prof.badge}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Adjust the voice command trigger sensitivity and acoustic noise floor gate to prevent false positives from background television, room chatter, traffic, or coughing.
              </p>
            </div>
          </div>

          {/* Master False Positive Shield Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              id="toggle-false-positive-shield"
              onClick={() => handleToggleFalsePositiveShield(!activationThreshold.preventFalsePositives)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                activationThreshold.preventFalsePositives
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle smart false-positive filter for background television & ambient noise"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {activationThreshold.preventFalsePositives ? 'Noise Shield: ACTIVE' : 'Noise Shield: OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* SENSITIVITY THRESHOLD SLIDER & PRESETS */}
        {(() => {
          const sensitivity = activationThreshold.sensitivityPercent;
          const profile = getActivationThresholdProfile(sensitivity);

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>Command Trigger Sensitivity Threshold</span>
                      <span className="text-[11px] text-emerald-300/80 font-normal hidden sm:inline">
                        (संवेदनशीलता थ्रेशोल्ड)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Lower percentages require clearer, louder speech (eliminating false triggers). Higher percentages catch softer speech.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${profile.badgeColor}`}>
                    {profile.level.toUpperCase()}
                  </span>
                  <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs font-black text-emerald-300 shadow-inner">
                    {sensitivity}%
                  </div>
                </div>
              </div>

              {/* Sensitivity Range Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>10% Strict (Anti-TV / Noise Rejection)</span>
                  <span className="text-emerald-300 font-mono font-bold">{sensitivity}% Sensitivity</span>
                  <span>100% Ultra (Whisper & Far-Field)</span>
                </div>

                <div className="relative py-1">
                  <input
                    type="range"
                    id="slider-voice-activation-threshold"
                    min="10"
                    max="100"
                    step="5"
                    value={sensitivity}
                    onChange={(e) => handleChangeThresholdSensitivity(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    title={`Voice activation threshold: ${sensitivity}%`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono px-1 mt-1.5 select-none">
                    <span>10% (Loud TV / Moving Car)</span>
                    <span>35% (Strict Shield)</span>
                    <span>65% (Balanced Standard)</span>
                    <span>85% (Quiet Room)</span>
                    <span>100% (Whisper Mode)</span>
                  </div>
                </div>
              </div>

              {/* 4 Quick Environment Presets */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Quick Acoustic Environment Presets (त्वरित वातावरण स्तर):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    {
                      label: 'Strict Noise Shield (टीवी शोर)',
                      val: 25,
                      sub: 'Filters 95% False Positives',
                      active: sensitivity <= 35,
                      color: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
                    },
                    {
                      label: 'Balanced Protection (सामान्य)',
                      val: 50,
                      sub: 'Standard Room & Office',
                      active: sensitivity > 35 && sensitivity <= 60,
                      color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300',
                    },
                    {
                      label: 'High Sensitivity (अनुशंसित)',
                      val: 75,
                      sub: 'Quiet Room • Fast Response',
                      active: sensitivity > 60 && sensitivity <= 85,
                      color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300',
                    },
                    {
                      label: 'Ultra Whisper (फुसफुसाहट)',
                      val: 95,
                      sub: 'Night Bed / Low Whispers',
                      active: sensitivity > 85,
                      color: 'border-purple-500/50 bg-purple-950/40 text-purple-300',
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      id={`btn-preset-threshold-${preset.val}`}
                      onClick={() => handleChangeThresholdSensitivity(preset.val)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        preset.active
                          ? `${preset.color} font-bold shadow-md`
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-[11px] block">{preset.label}</span>
                      <span className="text-[10px] opacity-80 mt-0.5 font-mono">
                        {preset.val}% • {preset.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Noise Floor Volume Gate Control */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-white text-[11px]">
                      Acoustic Noise Floor Gate (न्यूनतम आवाज स्तर):
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-300">
                    {activationThreshold.minVolumeGate}%
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-min-volume-gate"
                  min="0"
                  max="50"
                  step="2"
                  value={activationThreshold.minVolumeGate}
                  onChange={(e) => handleChangeVolumeGate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
                  title={`Noise Gate Floor: ${activationThreshold.minVolumeGate}%`}
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono select-none">
                  <span>0% (No Gate)</span>
                  <span>15% (Standard Gate)</span>
                  <span>30% (High TV Gate)</span>
                  <span>50% (Max Barrier)</span>
                </div>
              </div>

              {/* Dynamic Profile Explanation Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-emerald-400 font-mono">[{sensitivity}%]</span>
                    <span>{profile.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {profile.rejectionLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {profile.description}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-emerald-300">Recommended for:</span>
                  <span>{profile.recommendedFor}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Live Audio Acoustic Confirmation Ping Test & Reset Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              Activation Threshold:{' '}
              <strong className="text-emerald-300 font-mono font-bold">
                {activationThreshold.sensitivityPercent}%
              </strong>{' '}
              • Gate:{' '}
              <strong className="text-emerald-300 font-mono font-bold">
                {activationThreshold.minVolumeGate}%
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="btn-test-acoustic-ping"
              onClick={handleTestAcousticPing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              title="Test immediate ping notification sound effect for recognized commands"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Test Command Ping Sound (पुष्टि पिंग)</span>
            </button>
            <button
              type="button"
              id="btn-reset-threshold-defaults"
              onClick={handleResetThresholdDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Reset threshold settings to recommended defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Defaults</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: SAFE TRUSTED MODE (सुरक्षित ट्रस्टेड मोड / ALWAYS-RUN LOCK SCREEN COMMANDS) */}
      <section
        id="settings-safe-trusted-mode-section"
        className="p-5 sm:p-6 rounded-2xl border backdrop-blur-xl space-y-5 transition-all duration-300 shadow-xl bg-slate-900/80 border-emerald-500/40 relative overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Safe Trusted Mode (सुरक्षित ट्रस्टेड मोड)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                    safeTrustedConfig.enabled
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {safeTrustedConfig.enabled
                    ? `Active (${safeTrustedConfig.commands.filter((c) => c.enabled).length} of ${safeTrustedConfig.commands.length} Enabled)`
                    : 'Disabled (Full Unlock Required)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Define pre-authorized voice commands that Jarvis can execute directly when the phone is locked without requiring a full biometric or PIN unlock. Sensitive apps stay protected!
              </p>
            </div>
          </div>

          {/* Master Enable/Disable Switch */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              id="toggle-safe-trusted-mode"
              onClick={() => handleToggleSafeTrustedMaster(!safeTrustedConfig.enabled)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                safeTrustedConfig.enabled
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{safeTrustedConfig.enabled ? 'Safe Mode: ON' : 'Safe Mode: OFF'}</span>
            </button>
          </div>
        </div>

        {/* Toast confirmation */}
        {safeModeToast && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{safeModeToast}</span>
          </div>
        )}

        {/* Security Sandboxing Feature Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Zero-Vulnerability Lock Screen Protection</span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-mono">Protected</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Only verified utility actions selected below (Torch, Clock, Battery, Music, Emergency SOS) run directly on the lock screen. Any requests to open private personal data, WhatsApp chats, photo gallery, or system settings will always demand biometric fingerprint or PIN authorization.
            </p>
          </div>
        </div>

        {/* Sub-toggles: Haptic, Voice announcement, Emergency bypass */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Emergency 112 / SOS</span>
              <span className="text-[10px] text-slate-400">Always allow without unlock</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !safeTrustedConfig.allowEmergencyWithoutUnlock;
                setSafeTrustedConfig(saveSafeTrustedModeConfig({ allowEmergencyWithoutUnlock: next }));
                testHapticFeedback(config.patternStyle, config.intensity);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                safeTrustedConfig.allowEmergencyWithoutUnlock ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {safeTrustedConfig.allowEmergencyWithoutUnlock ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Haptic Feedback</span>
              <span className="text-[10px] text-slate-400">Tactile pulse on safe execution</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !safeTrustedConfig.hapticFeedback;
                setSafeTrustedConfig(saveSafeTrustedModeConfig({ hapticFeedback: next }));
                testHapticFeedback(config.patternStyle, config.intensity);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                safeTrustedConfig.hapticFeedback ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {safeTrustedConfig.hapticFeedback ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Voice Announce</span>
              <span className="text-[10px] text-slate-400">Confirm execution aloud</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !safeTrustedConfig.announceExecution;
                setSafeTrustedConfig(saveSafeTrustedModeConfig({ announceExecution: next }));
                testHapticFeedback(config.patternStyle, config.intensity);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                safeTrustedConfig.announceExecution ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {safeTrustedConfig.announceExecution ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Filter bar and Search for Always-Run commands */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'All Commands' },
              { id: 'hardware', label: '🔦 Hardware' },
              { id: 'utility', label: '⏱️ Utilities' },
              { id: 'entertainment', label: '🎵 Music & Jokes' },
              { id: 'safety', label: '🛡️ Safety SOS' },
              { id: 'custom', label: '⭐ Custom' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSafeCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  safeCategoryFilter === cat.id
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search box & Add Custom button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search commands..."
                value={safeSearchQuery}
                onChange={(e) => setSafeSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <button
              type="button"
              id="btn-add-custom-safe-command-toggle"
              onClick={() => setIsAddingSafeCmd(!isAddingSafeCmd)}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Command</span>
            </button>
          </div>
        </div>

        {/* Add Custom Command Form (Expandable) */}
        {isAddingSafeCmd && (
          <form
            onSubmit={handleCreateCustomSafeCommand}
            className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 space-y-3 animate-fade-in shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                Define New Always-Run Voice Command
              </span>
              <button
                type="button"
                onClick={() => setIsAddingSafeCmd(false)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Spoken Command Trigger Phrase *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 'Mummy ko call lagao', 'Wi-Fi check karo'"
                  value={newCmdPhrase}
                  onChange={(e) => setNewCmdPhrase(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Command Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 'Instant lock screen family call without unlock'"
                  value={newCmdDesc}
                  onChange={(e) => setNewCmdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingSafeCmd(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                Save Always-Run Command
              </button>
            </div>
          </form>
        )}

        {/* Commands Grid / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(safeTrustedConfig?.commands || [])
            .filter((c) => {
              if (safeCategoryFilter !== 'all' && c.category !== safeCategoryFilter) return false;
              if (safeSearchQuery.trim()) {
                const q = safeSearchQuery.toLowerCase();
                return (
                  (typeof c.phrase === 'string' && c.phrase.toLowerCase().includes(q)) ||
                  (typeof c.description === 'string' && c.description.toLowerCase().includes(q)) ||
                  (Array.isArray(c.alternatePhrases) ? c.alternatePhrases : []).some(
                    (alt) => typeof alt === 'string' && alt.toLowerCase().includes(q)
                  )
                );
              }
              return true;
            })
            .map((cmd) => {
              // Icon selector
              const renderIcon = () => {
                switch (cmd.actionType) {
                  case 'torch': return <Flashlight className="w-4 h-4 text-amber-400" />;
                  case 'time': return <Clock className="w-4 h-4 text-cyan-400" />;
                  case 'battery': return <Battery className="w-4 h-4 text-emerald-400" />;
                  case 'music': return <Music className="w-4 h-4 text-fuchsia-400" />;
                  case 'emergency': return <PhoneCall className="w-4 h-4 text-rose-400" />;
                  case 'weather': return <Sun className="w-4 h-4 text-amber-300" />;
                  case 'joke': return <Smile className="w-4 h-4 text-yellow-400" />;
                  case 'gramin': return <Building2 className="w-4 h-4 text-teal-400" />;
                  case 'mute': return <Volume2 className="w-4 h-4 text-purple-400" />;
                  case 'sleep': return <Moon className="w-4 h-4 text-indigo-400" />;
                  default: return <Zap className="w-4 h-4 text-emerald-400" />;
                }
              };

              return (
                <div
                  key={cmd.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    cmd.enabled
                      ? 'bg-slate-950/70 border-slate-700/80 hover:border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0 mt-0.5">
                      {renderIcon()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">{cmd.phrase}</span>
                        {cmd.isCustom && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-semibold">
                            Custom
                          </span>
                        )}
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase">
                          {cmd.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{cmd.description}</p>

                      {Array.isArray(cmd.alternatePhrases) && cmd.alternatePhrases.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500">Triggers:</span>
                          {cmd.alternatePhrases.slice(0, 3).map((alt, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/90 text-cyan-300/80 border border-slate-800"
                            >
                              &ldquo;{alt}&rdquo;
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle and Delete Buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {cmd.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSafeCommand(cmd.id, cmd.phrase)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Delete custom command"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleSafeCommand(cmd.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        cmd.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {cmd.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Section Footer: Test & Reset */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400">
            Safety Level: <span className="text-emerald-300 font-mono font-bold">Biometrically Partitioned Sandbox</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-reset-safe-mode-defaults"
              onClick={handleResetSafeModeDefaults}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              id="btn-simulate-safe-mode-test"
              onClick={() => {
                testHapticFeedback(config.patternStyle, config.intensity);
                if (onSpeak) {
                  onSpeak(
                    `Safe Trusted Mode active with ${
                      safeTrustedConfig.commands.filter((c) => c.enabled).length
                    } pre-authorized commands ready to run directly on lock screen without phone unlock.`
                  );
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Safe Mode Announcement</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: THEME & UI PALETTE SELECTOR */}
      <section
        id="settings-theme-selector"
        className="p-5 sm:p-6 rounded-2xl border backdrop-blur-xl space-y-5 transition-all duration-300 shadow-xl"
        style={{
          backgroundColor: 'var(--theme-bg-surface)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-xl border transition-colors shadow-sm"
              style={{
                backgroundColor: 'rgba(var(--theme-primary-rgb), 0.12)',
                borderColor: 'var(--theme-border-accent)',
                color: 'var(--theme-primary)',
                boxShadow: '0 0 15px rgba(var(--theme-primary-rgb), 0.25)',
              }}
            >
              <Palette className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  UI Theme & Color Palette
                </h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all"
                  style={{
                    backgroundColor: 'rgba(var(--theme-primary-rgb), 0.18)',
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary-hover)',
                    boxShadow: '0 0 10px rgba(var(--theme-primary-rgb), 0.2)',
                  }}
                >
                  Active: {currentTheme.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pick from predefined color palettes (Neon Cyber, Classic Jarvis, Minimalist Slate, etc.). Dynamically updates application CSS variables across the entire UI.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-reset-theme-default"
            onClick={handleResetTheme}
            title="Reset to default Classic Jarvis palette"
            className="self-start sm:self-auto px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Classic</span>
          </button>
        </div>

        {/* Toast Notification for Theme Switch */}
        {themeChangeToast && (
          <div
            className="animate-fade-in flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all shadow-lg"
            style={{
              backgroundColor: 'rgba(var(--theme-primary-rgb), 0.15)',
              borderColor: 'var(--theme-primary)',
              color: 'var(--theme-text-primary)',
              boxShadow: 'var(--theme-glow)',
            }}
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>{themeChangeToast}</span>
          </div>
        )}

        {/* Theme Palette Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {getAllThemePalettes().map((palette) => {
            const isSelected = selectedThemeId === palette.id;
            return (
              <div
                key={palette.id}
                id={`theme-card-${palette.id}`}
                onClick={() => handleSelectTheme(palette.id)}
                className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden select-none active:scale-[0.98] ${
                  isSelected
                    ? 'shadow-lg ring-1 ring-white/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)',
                        borderColor: palette.colors.primary,
                        boxShadow: palette.colors.glow,
                      }
                    : {}
                }
              >
                <div>
                  {/* Header: Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                      style={{
                        backgroundColor: `${palette.colors.primary}18`,
                        borderColor: `${palette.colors.primary}40`,
                        color: palette.colors.primaryHover,
                      }}
                    >
                      {palette.badge}
                    </span>

                    {isSelected ? (
                      <span
                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-sm"
                        style={{
                          backgroundColor: `${palette.colors.primary}25`,
                          borderColor: palette.colors.primary,
                          color: palette.colors.textPrimary,
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">
                        Tap to apply
                      </span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-cyan-200 transition-colors">
                    <span>{palette.name}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {palette.tagline}
                  </p>
                </div>

                {/* Color Swatches preview bar & action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5" title="Palette color swatches">
                    {palette.previewColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm transition-transform group-hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTheme(palette.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: palette.colors.primary,
                            color: palette.id === 'minimalist_slate' ? '#0f172a' : '#ffffff',
                          }
                        : {}
                    }
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live CSS Variable Inspector & Demonstration Box */}
        <div
          className="p-4 rounded-xl border space-y-3 transition-all duration-300"
          style={{
            backgroundColor: 'var(--theme-bg-elevated)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
              <span className="text-xs font-bold text-white">Live CSS Variables Demonstration</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              data-theme="{currentTheme.id}"
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sample Button */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-medium">Primary Accent Button</span>
              <button
                type="button"
                className="w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: selectedThemeId === 'minimalist_slate' ? '#0f172a' : '#ffffff',
                  boxShadow: 'var(--theme-glow)',
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Primary CTA</span>
              </button>
            </div>

            {/* Sample Glowing Card */}
            <div
              className="p-3 rounded-lg border flex flex-col justify-between gap-2 transition-all"
              style={{
                backgroundColor: 'var(--theme-bg-surface)',
                borderColor: 'var(--theme-border-accent)',
                boxShadow: '0 0 16px rgba(var(--theme-primary-rgb), 0.2)',
              }}
            >
              <span className="text-[10px] text-slate-400 font-medium">Glow Border Component</span>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-ping inline-block"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                />
                <span className="text-xs font-bold" style={{ color: 'var(--theme-text-accent)' }}>
                  Active Signal
                </span>
              </div>
            </div>

            {/* CSS Variables Telemetry */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between font-mono text-[10px] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>--theme-primary:</span>
                <span className="font-bold text-white">{currentTheme.colors.primary}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>--theme-secondary:</span>
                <span className="font-bold text-white">{currentTheme.colors.secondary}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>--theme-bg-base:</span>
                <span className="font-bold text-white">{currentTheme.colors.bgBase}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: AI RESPONSE LANGUAGE & DIALECT */}
      <section className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Jarvis AI Response Language
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                  {currentResponseLang}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose the language Jarvis speaks and generates replies in. Synchronized globally across all controls.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            {
              id: 'english' as JarvisResponseLanguage,
              label: 'English',
              badge: 'MCU Butler',
              desc: 'Articulate British AI Butler accent (Paul Bettany cadence)',
              sample: '"Right away, Sir. Opening YouTube on your screen now."',
              flag: '🇬🇧',
            },
            {
              id: 'hindi' as JarvisResponseLanguage,
              label: 'हिन्दी (Hindi)',
              badge: 'शुद्ध हिन्दी',
              desc: 'पूर्णतः शुद्ध, स्पष्ट व औपचारिक हिन्दी उच्चारण एवं उत्तर',
              sample: '"जी सर, मैं तुरंत आपके फोन में यूट्यूब खोल रहा हूँ। आदेश दें।"',
              flag: '🇮🇳',
            },
            {
              id: 'hinglish' as JarvisResponseLanguage,
              label: 'Hinglish',
              badge: 'Bilingual Mix',
              desc: 'Natural conversational Hindi + English blend in Roman script',
              sample: '"Ji Sir, main aapke phone me YouTube open kar raha hu."',
              flag: '🇮🇳',
            },
          ].map((item) => {
            const isSelected = currentResponseLang === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSwitchLanguage(item.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.flag}</span>
                    <span className="font-bold text-xs sm:text-sm text-white">{item.label}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold ${
                      isSelected
                        ? 'bg-cyan-500/30 border-cyan-400/60 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">{item.desc}</p>

                <div className="text-[10px] font-mono text-cyan-400/80 bg-slate-950/70 p-2 rounded-lg border border-slate-800 truncate">
                  {item.sample}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 0.9: AI VOICE MODEL & PERSONALITY (AOEDE CUTE INDIAN GIRL VOICE) */}
      <section
        id="section-voice-model-selector"
        className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-purple-950/20 to-slate-900/90 border border-purple-500/40 backdrop-blur-xl space-y-4 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>AI Voice Model & Personality (आवाज और मॉडल)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/40 animate-pulse">
                  {activeVoiceModel === 'aoede' ? 'AOEDE ACTIVE ✨' : 'CLASSIC ACTIVE'}
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Indian girl jaisi cute voice me tasks aur commands execute karne ke liye <strong>AOEDE</strong> voice model chalu karein.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              id="btn-test-current-voice-model"
              onClick={handleTestVoiceSpeaking}
              disabled={isTestingVoice}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isTestingVoice ? 'बोल रही हूँ...' : 'Sun Kar Dekhein (Listen)'}</span>
            </button>
          </div>
        </div>

        {voiceModelToast && (
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{voiceModelToast}</span>
          </div>
        )}

        {/* Voice Model Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* 1. AOEDE - Cute Indian Girl Voice Model (DEFAULT & ACTIVE) */}
          <div
            onClick={() => handleSelectVoiceModel('aoede')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              activeVoiceModel === 'aoede'
                ? 'bg-purple-950/40 border-purple-400/80 ring-2 ring-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                : 'bg-slate-950/60 border-slate-800 hover:border-purple-500/40 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 font-bold text-xs">
                    👩
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>AOEDE (Cute Indian Girl Voice)</span>
                    </h4>
                    <span className="text-[10px] text-pink-300/80 font-mono">
                      Google Gemini Neural Aoede Engine
                    </span>
                  </div>
                </div>

                {activeVoiceModel === 'aoede' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-slate-950 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Click to Select</span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Sweet, polite aur cute Indian girl voice! Aapke phone tasks, PC automation, calls, YouTube, aur daily baatein pyaar se aur fast karti hai.
              </p>

              <div className="space-y-1.5 text-[11px] font-mono text-purple-200/90 bg-purple-950/30 p-2.5 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span>Pitch (आवाज की मिठास):</span>
                  <strong className="text-pink-300">1.16x Sweet Girl Tone</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Accent & Grammar:</span>
                  <strong className="text-purple-300">Indian Hindi / Hinglish ("कर रही हूँ")</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Task Execution:</span>
                  <strong className="text-emerald-400">Enthusiastic & Cute Replies</strong>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">
                &ldquo;Ji Sir! Main abhi aapka kaam kar rahi hu!&rdquo;
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectVoiceModel('aoede');
                }}
                className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold transition-all"
              >
                {activeVoiceModel === 'aoede' ? 'Selected' : 'Set AOEDE'}
              </button>
            </div>
          </div>

          {/* 2. J.A.R.V.I.S. Classic - British Butler Voice */}
          <div
            onClick={() => handleSelectVoiceModel('jarvis_classic')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              activeVoiceModel === 'jarvis_classic'
                ? 'bg-blue-950/40 border-blue-400/80 ring-2 ring-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                : 'bg-slate-950/60 border-slate-800 hover:border-blue-500/40 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-xs">
                    🎩
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>J.A.R.V.I.S. Classic (British Butler)</span>
                    </h4>
                    <span className="text-[10px] text-blue-300/80 font-mono">
                      Paul Bettany Style • Iron Man AI
                    </span>
                  </div>
                </div>

                {activeVoiceModel === 'jarvis_classic' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-slate-950 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Click to Select</span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Sophisticated, deep British male AI butler from Marvel movies. Unflappable, loyal, and dignified tone.
              </p>

              <div className="space-y-1.5 text-[11px] font-mono text-blue-200/90 bg-blue-950/30 p-2.5 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <span>Pitch:</span>
                  <strong className="text-blue-300">0.94x Deep Butler Tone</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Accent:</span>
                  <strong className="text-blue-300">British English (en-GB)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Persona:</span>
                  <strong className="text-cyan-400">Paul Bettany / Tony Stark Butler</strong>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-blue-500/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">
                &ldquo;At your service, Sir.&rdquo;
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectVoiceModel('jarvis_classic');
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all"
              >
                {activeVoiceModel === 'jarvis_classic' ? 'Selected' : 'Set Classic'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: JARVIS SPEAKING RATE SLIDER */}
      <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Jarvis Speaking Rate (Speed)
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950 text-blue-300 border border-blue-500/30">
                  {speakingRate.toFixed(2)}x
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust how fast or slow Jarvis speaks. Saved to phone storage for all future voice responses.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-reset-speech-rate"
            onClick={handleResetRate}
            title="Reset speaking speed to 0.95x default"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Slider Component */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dheemi (0.6x)</span>
            <span className="text-cyan-400 font-bold text-sm">{speakingRate.toFixed(2)}x Speed</span>
            <span>Tez (1.6x)</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              id="slider-jarvis-speaking-rate"
              min="0.6"
              max="1.6"
              step="0.05"
              value={speakingRate}
              onChange={(e) => handleRateSliderChange(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {ratePresets.map((preset) => (
              <button
                key={preset.rate}
                type="button"
                onClick={() => handleRateSliderChange(preset.rate)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  Math.abs(speakingRate - preset.rate) < 0.04
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Test Voice Rate Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300">
                Test audio sentence at current <strong className="text-white">{speakingRate.toFixed(2)}x</strong> speed:
              </span>
            </div>
            <button
              type="button"
              id="btn-test-voice-speed"
              onClick={handleTestVoiceSpeaking}
              disabled={isTestingVoice}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md flex items-center gap-2 active:scale-95 transition-all self-stretch sm:self-auto justify-center disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isTestingVoice ? 'Bol rahi hu...' : 'Test Voice Speed'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: MICROPHONE FEEDBACK TEST TOOL & TROUBLESHOOTING ("Microphone ko thek karo") */}
      <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Microphone Feedback Test Tool
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                  5-Second Audio Diagnostic
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify if your microphone is capturing clean, undistorted sound for the Jarvis voice engine.
              </p>
            </div>
          </div>
        </div>

        {/* Mic Test Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                Live 5-Second Microphone Recording & Instant Playback
              </h4>
              <p className="text-[11px] text-slate-400">
                Click start, speak into your mic for 5 seconds. Jarvis will immediately play it back so you can check sound quality.
              </p>
            </div>

            <button
              type="button"
              id="btn-start-mic-test"
              onClick={startMicrophoneTest}
              disabled={isRecordingMicTest}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                isRecordingMicTest
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white'
              }`}
            >
              {isRecordingMicTest ? (
                <>
                  <MicOff className="w-4 h-4 animate-spin" />
                  <span>Recording... ({micTestCountdown}s)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start 5-Second Test</span>
                </>
              )}
            </button>
          </div>

          {/* Recording Visualizer & Level Meter */}
          {isRecordingMicTest && (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-300 font-medium flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  Microphone is active — Please speak now: "Hello Jarvis, test 1 2 3"
                </span>
                <span className="text-white font-mono font-bold text-sm bg-rose-900/60 px-2 py-0.5 rounded">
                  00:0{micTestCountdown}
                </span>
              </div>

              {/* Live volume bar */}
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75"
                  style={{ width: `${Math.max(4, micAudioLevel)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Input Level</span>
                <span className="text-rose-400 font-mono font-bold">{micAudioLevel}%</span>
              </div>
            </div>
          )}

          {/* Error display */}
          {micTestError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Microphone Access Error:</p>
                <p className="text-[11px] text-red-300 mt-0.5">{micTestError}</p>
              </div>
            </div>
          )}

          {/* Playback & Diagnostic Result */}
          {recordedAudioUrl && !isRecordingMicTest && (
            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayback}
                    className="p-2.5 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all active:scale-95 shadow-md"
                  >
                    {isPlayingBack ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <div>
                    <h5 className="text-xs font-bold text-white">5-Second Audio Captured</h5>
                    <p className="text-[11px] text-slate-400">
                      {isPlayingBack ? 'Playing back captured sound...' : 'Click play to re-listen'}
                    </p>
                  </div>
                </div>

                {/* Sound Quality Score */}
                <div className="flex items-center gap-2">
                  {micQualityScore === 'clean' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Clean & Clear Sound Detected ✅</span>
                    </div>
                  )}
                  {micQualityScore === 'low' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Audio Low — Speak closer to mic</span>
                    </div>
                  )}
                  {micQualityScore === 'silent' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950 border border-red-500/40 text-red-300 text-xs font-semibold">
                      <MicOff className="w-3.5 h-3.5 text-red-400" />
                      <span>No Sound Captured — Check Mute status</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting Guide ("Microphone ko theek karo") */}
          <div className="border-t border-slate-800 pt-3">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              Microphone Theek Karne Ke Tips (Troubleshooting):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">1. Browser Permission Allow Karein:</span>
                Chrome / Safari ke URL bar me 🔒 Lock icon par click karein aur Microphone ko <strong className="text-emerald-400">"Allow"</strong> karein.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">2. Hardware Mic Hole Clean Karein:</span>
                Phone ya laptop ke physical mic me dhul ya mobile cover mic hole ko cover na kar raha ho.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">3. Echo & Noise Suppression:</span>
                Jarvis voice engine me automatically hardware Echo Cancellation aur Noise Filter active rehta hai.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">4. Unmute & Volume:</span>
                Check karein ki device ka microphone hardware switch se mute to nahi hai ya volume 0 par to nahi.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HAPTIC FEEDBACK INTENSITY & PATTERNS */}
      <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-6">
        {/* Sub-Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Vibrate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Haptic Feedback Intensity & Style
                {!hasVibrateSupport && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                    Visual Simulation
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical vibration response for tactile interaction during voice actions, calls, and switches
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-test-haptic-top"
            onClick={handleTestCurrent}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Vibrate className={`w-3.5 h-3.5 ${isVibrating ? 'animate-bounce' : ''}`} />
            <span>Test Vibration</span>
          </button>
        </div>

        {/* ALERT HAPTIC PATTERN CUSTOMIZER (Alarms, Messages, Calls, Reminders, Emergency) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950 border-2 border-cyan-500/30 space-y-4 shadow-xl">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
                <Sliders className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    Alert Haptic Pattern Customizer
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                    Alarms • Messages • Calls
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  अलार्म, मैसेज व फोन कॉल के लिए अलग-अलग फिजिकल वाइब्रेशन पैटर्न, बीट्स और लूप्स कस्टमाइज़ करें
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-settings-open-full-sequencer"
              onClick={() => {
                triggerHaptic([30]);
                window.dispatchEvent(
                  new CustomEvent('jarvis:open-haptic-customizer', {
                    detail: { alertType: activeAlertTab },
                  })
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/25 active:scale-95 transition-all self-start sm:self-auto shrink-0"
              title="Open full interactive step-by-step millisecond sequencer modal"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-950" />
              <span>Open Sequencer Studio</span>
              <ExternalLink className="w-3 h-3 text-slate-950" />
            </button>
          </div>

          {/* Toast Notice */}
          {alertToast && (
            <div className="px-3.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{alertToast}</span>
            </div>
          )}

          {/* Alert Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(
              [
                { id: 'alarm', name: 'Alarms', hindi: 'अलार्म', icon: BellRing, color: 'text-amber-400', activeBg: 'from-amber-500/20 to-orange-500/20 border-amber-400 text-amber-200' },
                { id: 'message', name: 'Messages & SMS', hindi: 'मैसेज', icon: MessageSquare, color: 'text-cyan-400', activeBg: 'from-cyan-500/20 to-blue-500/20 border-cyan-400 text-cyan-200' },
                { id: 'call', name: 'Phone Calls', hindi: 'कॉल', icon: PhoneCall, color: 'text-emerald-400', activeBg: 'from-emerald-500/20 to-teal-500/20 border-emerald-400 text-emerald-200' },
                { id: 'reminder', name: 'Reminders', hindi: 'रिमाइंडर', icon: Clock, color: 'text-purple-400', activeBg: 'from-purple-500/20 to-indigo-500/20 border-purple-400 text-purple-200' },
                { id: 'emergency', name: 'Emergency', hindi: 'सुरक्षा', icon: ShieldAlert, color: 'text-rose-400', activeBg: 'from-rose-500/20 to-red-500/20 border-rose-400 text-rose-200' },
              ] as const
            ).map((tab) => {
              const isSelected = activeAlertTab === tab.id;
              const Icon = tab.icon;
              const cur = alertHaptics[tab.id] || DEFAULT_ALERT_HAPTICS[tab.id];

              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-settings-alert-${tab.id}`}
                  onClick={() => {
                    triggerHaptic([20]);
                    setActiveAlertTab(tab.id);
                    setSelectedStepIdx(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                    isSelected
                      ? `bg-gradient-to-r ${tab.activeBg} shadow-[0_0_15px_rgba(6,182,212,0.2)]`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  <span>{tab.name}</span>
                  <span className="text-[10px] opacity-75 font-normal">({tab.hindi})</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-950/80 rounded border border-slate-800 text-slate-400">
                    {cur.repeatCount}x
                  </span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE ALERT CARD CUSTOMIZER */}
          {(() => {
            const currentAlert = alertHaptics[activeAlertTab] || DEFAULT_ALERT_HAPTICS[activeAlertTab];
            const isPlaying = alertTestingId === activeAlertTab;
            const singleDurationMs = (currentAlert.pattern || []).reduce((acc, ms) => acc + ms, 0);
            const totalDurationMs = singleDurationMs * (currentAlert.repeatCount || 1) + ((currentAlert.repeatCount || 1) - 1) * 200;

            return (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                {/* Status & Master toggle for this alert */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">
                        {currentAlert.name}
                      </span>
                      <span className="text-[11px] text-amber-300">
                        ({currentAlert.hindiName})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                        {currentAlert.presetName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {currentAlert.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      id={`btn-toggle-alert-${activeAlertTab}`}
                      onClick={() => {
                        triggerHaptic([20]);
                        handleUpdateAlertConfig(
                          activeAlertTab,
                          { enabled: !currentAlert.enabled },
                          `${currentAlert.name} haptics ${!currentAlert.enabled ? 'Enabled' : 'Disabled'}`
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentAlert.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${currentAlert.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span>{currentAlert.enabled ? 'Alert Vibration: ON' : 'Alert Vibration: OFF'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Select Pattern Preset (तुरंत पैटर्न लागू करें):
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Click to apply & feel tactile rhythm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {ALERT_PATTERN_PRESETS.map((preset) => {
                      const isActivePreset = currentAlert.presetName === preset.name;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic([25]);
                            handleUpdateAlertConfig(
                              activeAlertTab,
                              {
                                pattern: [...preset.pattern],
                                presetName: preset.name,
                              },
                              `Applied ${preset.name} to ${currentAlert.name}`
                            );
                            testAlertHapticPattern(preset.pattern, currentAlert.intensityMultiplier, 1);
                          }}
                          className={`p-2 rounded-lg text-left transition-all active:scale-95 cursor-pointer border ${
                            isActivePreset
                              ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">{preset.name}</div>
                          <div className="text-[9px] text-slate-400 truncate">{preset.category} • {preset.pattern.length} steps</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Loops & Strength Multiplier Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                  {/* Loop Repeats */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Repeat Loops (कंपन दोहराव):</span>
                      <span className="text-[11px] font-mono font-bold text-amber-300">{currentAlert.repeatCount}x Cycle</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            triggerHaptic([20]);
                            handleUpdateAlertConfig(activeAlertTab, { repeatCount: cnt });
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                            currentAlert.repeatCount === cnt
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cnt}x
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Number of times the full pattern repeats when an alert sounds
                    </span>
                  </div>

                  {/* Intensity Multiplier */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Tactile Multiplier (तीव्रता):</span>
                      <span className="text-[11px] font-mono font-bold text-cyan-300">{currentAlert.intensityMultiplier}x</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: '0.8x', val: 0.8 },
                        { label: '1.0x', val: 1.0 },
                        { label: '1.2x', val: 1.2 },
                        { label: '1.5x', val: 1.5 },
                        { label: '2.0x', val: 2.0 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            triggerHaptic([20]);
                            handleUpdateAlertConfig(activeAlertTab, { intensityMultiplier: item.val });
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                            currentAlert.intensityMultiplier === item.val
                              ? 'bg-cyan-400 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Modulates duration and tactile amplitude on supported hardware
                    </span>
                  </div>
                </div>

                {/* Interactive Visual Step Sequencer & Fine-Tuner */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-bold text-white">
                        Vibration Pulse Sequence (मिलीसेकंड टाइमलाइन):
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Loop: <strong className="text-cyan-300">{singleDurationMs}ms</strong> • Total: <strong className="text-white">{totalDurationMs}ms</strong>
                    </div>
                  </div>

                  {/* Step pills */}
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-850 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {currentAlert.pattern.map((ms, idx) => {
                      const isPulse = idx % 2 === 0;
                      const isSelectedStep = selectedStepIdx === idx;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            triggerHaptic([15]);
                            setSelectedStepIdx(selectedStepIdx === idx ? null : idx);
                          }}
                          className={`shrink-0 px-2 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isSelectedStep
                              ? 'ring-2 ring-amber-400 bg-amber-400 text-slate-950'
                              : isPulse
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <span>{isPulse ? '⚡' : '⏸'}</span>
                          <span>{ms}ms</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Step Editor Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1">
                      {selectedStepIdx !== null && (
                        <>
                          <span className="text-slate-400 font-mono mr-1">
                            Step #{selectedStepIdx + 1} ({selectedStepIdx % 2 === 0 ? 'Pulse' : 'Pause'}):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic([15]);
                              const newPattern = [...currentAlert.pattern];
                              newPattern[selectedStepIdx] = Math.max(10, newPattern[selectedStepIdx] - 25);
                              handleUpdateAlertConfig(activeAlertTab, { pattern: newPattern, presetName: 'Custom Pattern' });
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono cursor-pointer"
                          >
                            -25ms
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic([15]);
                              const newPattern = [...currentAlert.pattern];
                              newPattern[selectedStepIdx] = Math.min(2000, newPattern[selectedStepIdx] + 25);
                              handleUpdateAlertConfig(activeAlertTab, { pattern: newPattern, presetName: 'Custom Pattern' });
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono cursor-pointer"
                          >
                            +25ms
                          </button>
                          {currentAlert.pattern.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic([20]);
                                const newPattern = currentAlert.pattern.filter((_, i) => i !== selectedStepIdx);
                                handleUpdateAlertConfig(activeAlertTab, { pattern: newPattern, presetName: 'Custom Pattern' });
                                setSelectedStepIdx(null);
                              }}
                              className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 cursor-pointer ml-1"
                              title="Delete step"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                      {selectedStepIdx === null && (
                        <span className="text-slate-500 text-[10px]">
                          Click any step above to fine-tune duration in milliseconds
                        </span>
                      )}
                    </div>

                    {/* Add pulse / pause buttons */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic([20]);
                          const newPattern = [...currentAlert.pattern, 100];
                          handleUpdateAlertConfig(activeAlertTab, { pattern: newPattern, presetName: 'Custom Pattern' });
                          setSelectedStepIdx(newPattern.length - 1);
                        }}
                        className="px-2 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Pulse (+⚡)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic([20]);
                          const newPattern = [...currentAlert.pattern, 60];
                          handleUpdateAlertConfig(activeAlertTab, { pattern: newPattern, presetName: 'Custom Pattern' });
                          setSelectedStepIdx(newPattern.length - 1);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Pause (+⏸)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-test-alert-${activeAlertTab}`}
                      onClick={() => handleTestAlertPattern(activeAlertTab)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                        isPlaying
                          ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isPlaying ? 'Testing On Device...' : `Test ${currentAlert.name} Pattern`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic([20]);
                        window.dispatchEvent(
                          new CustomEvent('jarvis:open-haptic-customizer', {
                            detail: { alertType: activeAlertTab },
                          })
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Full Studio</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResetAlertToDefault(activeAlertTab)}
                    className="px-3 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-950/20 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    <span>Reset This Alert to Default</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Quick Comparison Bar (Alarms vs Messages vs Calls) */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Side-By-Side Tactile Comparison (Alarms vs Messages vs Calls):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-compare-test-alarm"
                onClick={() => handleTestAlertPattern('alarm')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-left transition-all active:scale-95 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Alarm Rhythm</div>
                    <div className="text-[10px] text-slate-400">Urgent wake-up pulses</div>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-amber-400" />
              </button>

              <button
                type="button"
                id="btn-compare-test-message"
                onClick={() => handleTestAlertPattern('message')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all active:scale-95 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Message Click</div>
                    <div className="text-[10px] text-slate-400">Snappy dual-pulse</div>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                type="button"
                id="btn-compare-test-call"
                onClick={() => handleTestAlertPattern('call')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-left transition-all active:scale-95 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Phone Call Ring</div>
                    <div className="text-[10px] text-slate-400">Continuous ringing cadence</div>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>

        {/* MASTER TOGGLE & INTENSITY ROW */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">
                Master Haptic Feedback
              </span>
              <span className="text-[11px] text-slate-400">
                Enable or disable all physical vibrations across the Jarvis system
              </span>
            </div>

            <button
              type="button"
              id="btn-toggle-haptic-master"
              onClick={() =>
                updateConfig(
                  { enabled: !config.enabled },
                  `Haptic feedback ${!config.enabled ? 'Enabled' : 'Disabled'}`
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                config.enabled ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* INTENSITY SELECTOR */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Vibration Strength:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {intensities.map((item) => {
                const isSelected = config.intensity === item.id;
                return (
                  <button
                    key={item.id}
                    id={`btn-intensity-${item.id}`}
                    onClick={() => {
                      updateConfig(
                        {
                          intensity: item.id,
                          enabled: item.id !== 'off',
                        },
                        `Haptic intensity set to ${item.label}`
                      );
                      if (item.id !== 'off') {
                        testHapticFeedback(config.patternStyle, item.id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.multiplier}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PATTERN STYLES GRID */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
            Haptic Pattern Rhythm & Cadence:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {patternStyles.map((style) => {
              const isSelected = config.patternStyle === style.id;
              const Icon = style.icon;
              return (
                <button
                  key={style.id}
                  id={`btn-pattern-${style.id}`}
                  onClick={() => {
                    updateConfig(
                      { patternStyle: style.id },
                      `Haptic pattern rhythm changed to ${style.title}`
                    );
                    testHapticFeedback(style.id, config.intensity);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-950/80 to-slate-900 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{style.title}</span>
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {style.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* INTERACTIVE TELEMETRY & ACTION QUICK-TESTS */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white">
                Live Physical/Visual Haptic Telemetry
              </span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isVibrating
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isVibrating ? 'VIBRATING NOW' : 'MOTOR IDLE'}
            </span>
          </div>

          {/* Waveform representation */}
          <div className="h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between px-3 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-500 font-mono">
                Pattern [ms]:
              </span>
              <div className="flex items-center gap-1">
                {((Array.isArray(activeTestPattern) && activeTestPattern.length > 0
                  ? activeTestPattern
                  : (config?.patternStyle && PATTERN_STYLE_PRESETS[config.patternStyle]?.basePattern)) || [50, 40, 60]
                ).map((ms, idx) => {
                  const isPulse = idx % 2 === 0;
                  return (
                    <span
                      key={idx}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isPulse
                          ? isVibrating
                            ? 'bg-cyan-500 text-slate-950 font-bold scale-105 transition-all'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPulse ? `${ms}ms ⚡` : `${ms}ms ⏸`}
                    </span>
                  );
                })}
              </div>
            </div>

            {lastActionTested && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                Action: {lastActionTested}
              </span>
            )}
          </div>

          {/* Action-Specific Quick Test Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Test Action-Specific Jarvis Signatures:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {actionTestPills.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    id={`btn-test-action-${item.key}`}
                    onClick={() => handleTestActionCategory(item.key, item.label)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions: Reset to Default */}
        <div className="flex items-center justify-between pt-2">
          <button
            id="btn-reset-haptic-defaults"
            onClick={handleResetDefaults}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-slate-800/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Factory Haptic Defaults</span>
          </button>
          <span className="text-[11px] text-slate-500">
            Stored locally in browser & phone memory
          </span>
        </div>
      </section>

      {/* COMPANION HARDWARE INFO CARD */}
      <section className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Android Hardware Integration Note</h4>
            <p className="text-[11px] text-slate-400">
              On Android Chrome and WebViews, the Navigator.vibrate API provides native physical vibration feedback.
              On desktop browsers, visual pulse waveforms provide instantaneous telemetry.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded-lg">
            API: navigator.vibrate()
          </span>
        </div>
      </section>
    </div>
  );
};
