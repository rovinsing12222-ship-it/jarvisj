import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  Mic,
  Clock,
  Smartphone,
  Users,
  Radio,
  Sliders,
  Battery,
  Wifi,
  Volume2,
  VolumeX,
  Flashlight,
  Vibrate,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Square,
  Youtube,
  Camera,
  MapPin,
  Music,
  Plus,
  Sun,
  Monitor,
  Terminal,
  Lock,
  Unlock,
  Power,
  QrCode,
  Share2,
  Landmark,
  Shield,
} from 'lucide-react';
import {
  Contact,
  ScheduleItem,
  JarvisAction,
  IncomingMessage,
  SentimentAnalysisResult,
  VoiceToneSample,
  AmbientNoiseState,
  JarvisMood,
  JarvisMoodConfig,
  CommandHistoryItem,
  SmartMemoryItem,
} from './types';
import {
  getStoredMemories,
  saveMemory,
  deleteMemory,
  clearAllMemories,
  saveQaMemory,
  getStoredQaMemories,
  getStoredTargets,
  saveTarget,
  completeTarget,
  updateTargetStatus,
  deleteTarget,
  setUnlimitedMemoryActive,
} from './utils/smartMemoryEngine';
import { recordCommandAudit, diagnoseErrorPattern } from './utils/commandAuditLogger';
import { JarvisMoodIndicator } from './components/JarvisMoodIndicator';
import { AmbientNoiseAlert } from './components/AmbientNoiseAlert';
import { ArcReactorCore } from './components/ArcReactorCore';
import { GirlAssistant3D } from './components/GirlAssistant3D';
import { TonyJarvisFace } from './components/TonyJarvisFace';
import { IronManSuitFace } from './components/IronManSuitFace';
import { VoiceController } from './components/VoiceController';
import { AudioWaveformVisualizer } from './components/AudioWaveformVisualizer';
import { JarvisDualCoreHub } from './components/JarvisDualCoreHub';
import { PcControlWorkspace } from './components/PcControlWorkspace';
import { ContactManager } from './components/ContactManager';
import { ScheduleAlarmManager } from './components/ScheduleAlarmManager';
import { AlarmRingingOverlay } from './components/AlarmRingingOverlay';
import { CameraModal } from './components/CameraModal';
import { MemoryCoreModal, DEFAULT_MEMORIES } from './components/MemoryCoreModal';
import { MemoryItem } from './types/memory';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { getJarvisGreetingName } from './utils/customerManager';
import {
  getActivePersonalityPresetId,
  getActiveSpeakingStyle,
  getActivePersonalityPreset,
} from './utils/personalityPresets';
import { HapticAlertCustomizerModal } from './components/HapticAlertCustomizerModal';
import { HapticAlertType } from './types';
import { InstallModal } from './components/InstallModal';
import { ShareQrCard } from './components/ShareQrCard';
import { WeatherWidget, WeatherData } from './components/WeatherWidget';
import { MorningBriefingCard, buildMorningBriefingText } from './components/MorningBriefingCard';
import { NewsModuleCard } from './components/NewsModuleCard';
import { SuggestedCommands } from './components/SuggestedCommands';
import { DailyGoalsCard } from './components/DailyGoalsCard';
import { ActiveCallModal } from './components/ActiveCallModal';
import { MessagesInboxModal } from './components/MessagesInboxModal';
import { VoiceCommandCheatSheet } from './components/VoiceCommandCheatSheet';
import { PhoneLockScreen } from './components/PhoneLockScreen';
import { PhoneShutdownScreen } from './components/PhoneShutdownScreen';
import { PowerLockButton } from './components/PowerLockButton';
import { YouTubePlayerModal } from './components/YouTubePlayerModal';
import { SettingsTab } from './components/SettingsTab';
import { RpJansabhaPortal } from './components/RpJansabhaPortal';
import { GovSchemesModal } from './components/GovSchemesModal';
import { JarvisLanguageDropdown, JarvisResponseLanguage } from './components/JarvisLanguageDropdown';
import { Brain, Download, ShieldCheck } from 'lucide-react';
import {
  applyTheme,
  getActiveTheme,
  getActiveThemeId,
} from './utils/themeEngine';
import { requestScreenWakeLock, releaseScreenWakeLock } from './utils/wakeLock';
import {
  launchPhoneCall,
  launchWhatsApp,
  launchSms,
  launchAndroidApp,
  toggleDeviceTorch,
  triggerHaptic,
  triggerAlertHaptic,
  setNativeAndroidAlarm,
  addNativeCalendarEvent,
  sendLocalNotification,
  requestNotificationPermission,
  openAndroidSettings,
  getDeviceBatteryStatus,
  LinkActionEvent,
} from './utils/deviceHardware';
import {
  purgeErroneousLocationCache,
  getHighAccuracyLiveLocation,
  openGoogleMapsLiveLocation,
  getCachedUserLocation,
} from './utils/geolocationService';
import {
  playStartupSound,
  playBeepSound,
  playCommandRecognizedPingSound,
  playActionExecutedSound,
  playAlertSound,
  playIncomingMessageSound,
  playPhoneLockSound,
  playPhoneUnlockSound,
  playAssistantInvokeSound,
  speakJarvis,
  stopJarvisSpeech,
  singJarvisSong,
  stopJarvisSong,
  getActiveVoiceModel,
  setActiveVoiceModel,
  JarvisVoiceModel,
  isBackgroundBeepEnabled,
  setBackgroundBeepEnabled,
  isJarvisSpeaking,
} from './utils/audioSynth';
import { saveWakeWordConfig } from './utils/wakeWordEngine';
import { JARVIS_SONGS, SongItem } from './utils/songCatalog';
import { resolveInstantLocalCommand, extractSpokenPhoneNumber } from './utils/instantCommands';
import { resolveGeneralKnowledgeAnswer, storeGeminiAnswer } from './utils/hindiKnowledgeHub';
import {
  analyzeUserToneAndSentiment,
  adaptResponseWithSentiment,
  JARVIS_MOOD_CONFIGS,
  getMoodFromSentiment,
} from './utils/sentimentAnalysis';
import { getCalibrationProfile } from './utils/voiceCalibration';
import { initBackgroundSyncService } from './utils/govSchemesEngine';

// Initial preloaded Contacts tailored for voice control
const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'contact-dad',
    name: 'Dad',
    phone: '+91 98765 43210',
    phoneType: 'mobile',
    secondaryPhone: '+91 11 2345 6789',
    secondaryPhoneType: 'work',
    relation: 'father',
    avatarColor: '#0ea5e9',
    notes: 'Home & Office contacts.',
  },
  {
    id: 'contact-mom',
    name: 'Mom',
    phone: '+91 98765 43211',
    phoneType: 'mobile',
    relation: 'mother',
    avatarColor: '#ec4899',
    notes: 'Personal mobile.',
  },
  {
    id: 'contact-doctor',
    name: 'Dr. Sharma',
    phone: '+91 98111 22334',
    phoneType: 'work',
    relation: 'doctor',
    avatarColor: '#10b981',
    notes: 'Family Physician. Clinic hours: 10 AM - 2 PM.',
  },
  {
    id: 'contact-john',
    name: 'John Stark',
    phone: '+1 415 555 0199',
    phoneType: 'work',
    relation: 'colleague',
    avatarColor: '#6366f1',
    notes: 'Lead engineer. Available on WhatsApp.',
  },
  {
    id: 'contact-rahul',
    name: 'Rahul Kumar',
    phone: '+91 99887 76655',
    phoneType: 'mobile',
    relation: 'brother',
    avatarColor: '#f59e0b',
    notes: 'Brother. Fast WhatsApp response.',
  },
];

// Initial schedule with reminder, alarm, work, health, and personal items
const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sched-1',
    title: 'Quarterly Client Deliverables & Code Review',
    time: '11:00',
    date: new Date().toISOString().split('T')[0],
    hour: 11,
    minute: 0,
    category: 'Work',
    location: 'Cyber City Tech Tower B, DLF Phase 2, Gurugram',
    latitude: 28.4952,
    longitude: 77.0892,
    completed: false,
    syncedNative: true,
  },
  {
    id: 'sched-2',
    title: 'Daily 5km Jogging & Electrolyte Hydration',
    time: '06:30',
    date: new Date().toISOString().split('T')[0],
    hour: 6,
    minute: 30,
    category: 'Health',
    completed: false,
    syncedNative: true,
  },
  {
    id: 'sched-3',
    title: 'Team Architecture Strategy Review',
    time: '14:00',
    date: new Date().toISOString().split('T')[0],
    hour: 14,
    minute: 0,
    category: 'meeting',
    location: 'Google Meet',
    completed: false,
    syncedNative: true,
  },
  {
    id: 'sched-4',
    title: 'Family Dinner & Grocery Shopping',
    time: '20:00',
    date: new Date().toISOString().split('T')[0],
    hour: 20,
    minute: 0,
    category: 'Personal',
    completed: false,
    syncedNative: true,
  },
  {
    id: 'sched-5',
    title: 'Evening Health Vitamin & Meds Reminder',
    time: '21:30',
    date: new Date().toISOString().split('T')[0],
    hour: 21,
    minute: 30,
    category: 'Health',
    completed: false,
    syncedNative: true,
  },
];

const INITIAL_INCOMING_MESSAGES: IncomingMessage[] = [
  {
    id: 'msg-1',
    senderName: 'Dad',
    senderPhone: '+91 98765 43210',
    relation: 'Father',
    text: 'Beta, ghar aate waqt zaroori samaan lete aana.',
    timestamp: '11:45 AM',
    channel: 'whatsapp',
    read: false,
    avatarColor: '#0ea5e9',
  },
  {
    id: 'msg-2',
    senderName: 'Dr. Sharma',
    senderPhone: '+91 98765 43212',
    relation: 'Doctor',
    text: 'Kal subah 10:00 baje clinic par checkup ke liye schedule confirmed hai.',
    timestamp: '10:15 AM',
    channel: 'sms',
    read: false,
    avatarColor: '#10b981',
  },
  {
    id: 'msg-3',
    senderName: 'Mom',
    senderPhone: '+91 98765 43211',
    relation: 'Mother',
    text: 'Dopahar ka khana time par kha lena beta.',
    timestamp: '09:20 AM',
    channel: 'whatsapp',
    read: true,
    avatarColor: '#ec4899',
  },
];

export default function App() {
  // Navigation: 'assistant' | 'jarvis_hub' | 'pc_control' | 'contacts' | 'schedule' | 'settings' | 'rp_jansabha'
  const [activeTab, setActiveTab] = useState<'assistant' | 'jarvis_hub' | 'pc_control' | 'contacts' | 'schedule' | 'settings' | 'rp_jansabha'>('assistant');
  const [jansabhaInitialTab, setJansabhaInitialTab] = useState<'all' | 'farmer' | 'support' | 'scheme' | 'gov' | 'bank' | 'csc'>('all');

  // Active UI Theme Palette State
  const [currentTheme, setCurrentTheme] = useState(() => getActiveTheme());

  // Initialize and subscribe to global theme changes across UI
  useEffect(() => {
    const initialTheme = applyTheme(getActiveThemeId());
    setCurrentTheme(initialTheme);

    const handleThemeChange = (e: any) => {
      if (e.detail?.palette) {
        setCurrentTheme(e.detail.palette);
      }
    };
    window.addEventListener('jarvis:theme-changed', handleThemeChange);
    return () => window.removeEventListener('jarvis:theme-changed', handleThemeChange);
  }, []);

  // PC Control Voice Command Trigger Bus
  const [pcVoiceTrigger, setPcVoiceTrigger] = useState<{ action: string; payload?: any; timestamp: number } | null>(null);

  // Contacts State
  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_contacts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CONTACTS;
  });

  // Incoming Messages State (Voice Message Reader)
  const [incomingMessages, setIncomingMessages] = useState<IncomingMessage[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_incoming_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_INCOMING_MESSAGES;
  });

  // Track incoming messages and trigger notification chime only for new dynamic incoming messages (never on startup/open)
  const prevMessagesCountRef = useRef(incomingMessages.length);
  const isInitialMountMessagesRef = useRef(true);
  useEffect(() => {
    if (isInitialMountMessagesRef.current) {
      isInitialMountMessagesRef.current = false;
      prevMessagesCountRef.current = incomingMessages.length;
      return;
    }
    if (incomingMessages.length > prevMessagesCountRef.current) {
      const latestMsg = incomingMessages[0];
      if (latestMsg && !latestMsg.read && !latestMsg.senderName.includes('You (Sent)')) {
        playIncomingMessageSound();
        triggerHaptic([30, 40]);
      }
    }
    prevMessagesCountRef.current = incomingMessages.length;
  }, [incomingMessages]);

  // Active Phone Call Modal State
  const [activeCall, setActiveCall] = useState<{ contact: Contact; phoneNumber: string } | null>(null);

  // Messages Inbox Modal State
  const [isMessagesInboxOpen, setIsMessagesInboxOpen] = useState(false);

  // Schedule & Alarms State
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_schedule');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SCHEDULE;
  });

  // Active Ringing Alarm Overlay
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<ScheduleItem | null>(null);

  // Selected contact for detail modal
  const [dossierContact, setDossierContact] = useState<Contact | null>(null);

  // JARVIS State
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [ambientNoise, setAmbientNoise] = useState<AmbientNoiseState>({
    level: 15,
    approxDb: 38,
    status: 'quiet',
    isTooLoud: false,
    suggestMute: false,
    autoMuted: false,
  });
  const [showAmbientAlert, setShowAmbientAlert] = useState(false);
  const [autoMuteAlways, setAutoMuteAlways] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jarvis_auto_mute_always') === 'true';
    } catch {
      return false;
    }
  });
  const [aiResponseLanguage, setAiResponseLanguage] = useState<JarvisResponseLanguage>(() => {
    try {
      const saved = localStorage.getItem('jarvis_ai_response_lang');
      if (saved === 'english' || saved === 'hindi' || saved === 'hinglish') {
        return saved as JarvisResponseLanguage;
      }
    } catch {}
    return 'hindi';
  });
  const aiResponseLanguageRef = useRef<JarvisResponseLanguage>(aiResponseLanguage);
  aiResponseLanguageRef.current = aiResponseLanguage;

  // Anti-duplicate execution guard to prevent speaking the same response twice
  const lastExecutedCommandRef = useRef<{ text: string; timestamp: number }>({ text: '', timestamp: 0 });

  const [speechLang, setSpeechLang] = useState<'hi-IN' | 'en-IN' | 'en-US'>(() => {
    try {
      const saved = localStorage.getItem('jarvis_ai_response_lang');
      if (saved === 'english') return 'en-US';
      if (saved === 'hindi') return 'hi-IN';
      if (saved === 'hinglish') return 'hi-IN';
    } catch {}
    return 'hi-IN';
  });
  const [hasGreetedOnStart, setHasGreetedOnStart] = useState(false);
  // Default to true so Jarvis is Always-Online by default
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('jarvis_handsfree_always_on');
        if (stored !== null) return stored === 'true';
      }
    } catch {}
    return true; // Default Online
  });
  const [activeSubjectAction, setActiveSubjectAction] = useState<LinkActionEvent | null>(null);
  const [avatarView, setAvatarView] = useState<'girl3d' | 'ironman' | 'tonyface' | 'arccore'>(() => {
    try {
      const saved = localStorage.getItem('jarvis_avatar_view');
      if (saved === 'ironman' || saved === 'tonyface' || saved === 'girl3d') {
        return saved;
      }
    } catch {}
    return 'girl3d'; // Default to 22-Year-Old Cute & Bold Indian Girl AI Assistant!
  });
  const [activeSentiment, setActiveSentiment] = useState<SentimentAnalysisResult | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState(() => {
    const greetingName = getJarvisGreetingName();
    return `Namaste ${greetingName}! Main Aanya hu — 22 saal ki cute aur bold Indian AI girl! Mujhse jo bhi bolenge main live sun rahi hu aur turant reply karungi!`;
  });
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    try {
      const saved = localStorage.getItem('jarvis_command_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize legacy items to have date
          return parsed.map((item: any) => ({
            ...item,
            date: item.date || today,
          }));
        }
      }
    } catch {
      // ignore
    }
    return [
      {
        query: 'Ram Ram Boss, aaj ka mausam kaisa hai?',
        response: 'Ram Ram Boss! Is samay New Delhi me temperature 28°C hai aur mausam clear sky hai.',
        timestamp: '08:15 AM',
        date: today,
      },
      {
        query: 'Subah 6:30 baje ka alarm set karo',
        response: 'Haanji Boss, subah 06:30 AM ka alarm safalta-purvak schedule kar diya gaya hai.',
        timestamp: '08:22 AM',
        date: today,
      },
      {
        query: 'Dad ko call lagao mobile par',
        response: 'Dad (+91 98765 43210) ko mobile call dial ki ja rahi hai, Boss.',
        timestamp: '09:05 AM',
        date: today,
      },
      {
        query: 'World aur Bharat news summarize karo',
        response: 'Ram Ram Boss! Top headlines me ISRO space station roadmap aur global clean energy transit shamil hain.',
        timestamp: '09:40 AM',
        date: yesterday,
      },
      {
        query: 'Torch on kar do',
        response: 'Ji Boss, device torch on kar di gayi hai.',
        timestamp: '10:12 AM',
        date: yesterday,
      },
    ];
  });

  // Hardware toggles
  const [torchActive, setTorchActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isGovSchemesModalOpen, setIsGovSchemesModalOpen] = useState(false);
  const [govSchemesInitialQuery, setGovSchemesInitialQuery] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isHapticCustomizerOpen, setIsHapticCustomizerOpen] = useState(false);
  const [hapticCustomizerAlert, setHapticCustomizerAlert] = useState<HapticAlertType>('alarm');
  const [memoryModalTab, setMemoryModalTab] = useState<'memories' | 'qa_memory' | 'targets' | 'kotlin' | 'analytics'>('memories');
  const [memories, setMemories] = useState<SmartMemoryItem[]>(() => getStoredMemories());

  useEffect(() => {
    // Initialize 24-Hour Government Background Syncing Service (polls mock government API every 24h)
    const cleanupGovSync = initBackgroundSyncService();

    const handleMemoriesUpdate = () => {
      setMemories(getStoredMemories());
    };
    const handleOpenAdmin = () => setIsAdminModalOpen(true);
    const handleOpenHaptics = (e: any) => {
      const alertType = e.detail?.alertType || 'alarm';
      setHapticCustomizerAlert(alertType);
      setIsHapticCustomizerOpen(true);
    };
    const handleUserUpdate = () => {
      const activeName = getJarvisGreetingName();
      setLastSpokenText(
        `Namaste ${activeName}! Main Aanya hu — aapki personal AI assistant! Mujhse jo bhi bolenge main live sun rahi hu aur turant reply karungi!`
      );
    };
    const handlePresetChange = (e: any) => {
      if (e?.detail?.greeting) {
        setLastSpokenText(e.detail.greeting);
      }
    };
    window.addEventListener('jarvis:device-user-updated', handleUserUpdate);
    window.addEventListener('jarvis:admin-name-updated', handleUserUpdate);
    window.addEventListener('jarvis:personality-preset-changed', handlePresetChange);
    window.addEventListener('jarvis:memories-updated', handleMemoriesUpdate);
    window.addEventListener('jarvis_memory_updated', handleMemoriesUpdate);
    window.addEventListener('jarvis:open-memory-modal', () => setIsMemoryModalOpen(true));
    window.addEventListener('jarvis:open-admin-dashboard', handleOpenAdmin);
    window.addEventListener('jarvis:open-haptic-customizer', handleOpenHaptics);
    return () => {
      cleanupGovSync();
      window.removeEventListener('jarvis:device-user-updated', handleUserUpdate);
      window.removeEventListener('jarvis:admin-name-updated', handleUserUpdate);
      window.removeEventListener('jarvis:personality-preset-changed', handlePresetChange);
      window.removeEventListener('jarvis:memories-updated', handleMemoriesUpdate);
      window.removeEventListener('jarvis_memory_updated', handleMemoriesUpdate);
      window.removeEventListener('jarvis:open-memory-modal', () => setIsMemoryModalOpen(true));
      window.removeEventListener('jarvis:open-admin-dashboard', handleOpenAdmin);
      window.removeEventListener('jarvis:open-haptic-customizer', handleOpenHaptics);
    };
  }, []);

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [installModalTab, setInstallModalTab] = useState<'apk_build' | 'friend' | 'playstore' | 'android' | 'ios'>('apk_build');
  const [batteryLevel, setBatteryLevel] = useState('94%');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Memoized weather state updater with deduplication to prevent re-render thrashing
  const handleWeatherUpdate = React.useCallback((data: WeatherData) => {
    setWeatherData((prev) => {
      if (
        prev &&
        prev.city === data.city &&
        prev.tempC === data.tempC &&
        prev.condition === data.condition &&
        prev.humidity === data.humidity
      ) {
        return prev;
      }
      return data;
    });
  }, []);

  const handleSelectResponseLanguage = (newLang: JarvisResponseLanguage) => {
    setAiResponseLanguage(newLang);
    aiResponseLanguageRef.current = newLang;
    try {
      localStorage.setItem('jarvis_ai_response_lang', newLang);
    } catch {}

    const targetSpeechLang = newLang === 'english' ? 'en-US' : 'hi-IN';
    setSpeechLang(targetSpeechLang);
    try {
      localStorage.setItem('jarvis_speech_lang', targetSpeechLang);
    } catch {}

    triggerHaptic([30, 40]);

    // Broadcast globally to all components and windows
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('jarvis:language-changed', {
          detail: { language: newLang, speechLang: targetSpeechLang },
        })
      );
      window.dispatchEvent(
        new CustomEvent('jarvis:response-language-updated', {
          detail: { language: newLang, speechLang: targetSpeechLang },
        })
      );
    }

    // Add HUD visual record
    setCommandHistory((prev) => [
      {
        id: `cmd-${Date.now()}`,
        query: `Switch AI Language: ${newLang.toUpperCase()}`,
        response:
          newLang === 'english'
            ? 'AI Response Language set to English (British MCU Butler)'
            : newLang === 'hindi'
            ? 'AI Response Language set to शुद्ध हिन्दी (Pure Hindi)'
            : 'AI Response Language set to Hinglish (Natural Bilingual Mix)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        success: true,
      },
      ...prev.slice(0, 19),
    ]);

    if (newLang === 'english') {
      if (!isMuted) {
        setStatus('speaking');
        setLastSpokenText('Response language set to English, Sir. At your service.');
        speakJarvis('Response language set to English, Sir. All systems nominal.', {
          lang: 'en-GB',
          muted: false,
          onEnd: () => setStatus('idle'),
        });
      }
    } else if (newLang === 'hindi') {
      if (!isMuted) {
        setStatus('speaking');
        setLastSpokenText('उत्तर की भाषा शुद्ध हिन्दी में सेट कर दी गई है, सर। आदेश दें।');
        speakJarvis('उत्तर की भाषा शुद्ध हिन्दी में सेट कर दी गई है, सर। आदेश दें।', {
          lang: 'hi-IN',
          muted: false,
          onEnd: () => setStatus('idle'),
        });
      }
    } else {
      if (!isMuted) {
        setStatus('speaking');
        setLastSpokenText('Jarvis response language Hinglish me set kar di gayi hai, Sir.');
        speakJarvis('Jarvis response language Hinglish me switch kar di gayi hai, Sir.', {
          lang: 'hi-IN',
          muted: false,
          onEnd: () => setStatus('idle'),
        });
      }
    }
  };

  // Global listener for language change events dispatched anywhere across app
  useEffect(() => {
    const handleGlobalLangEvent = (e: any) => {
      const lang = e.detail?.language;
      if (lang && (lang === 'english' || lang === 'hindi' || lang === 'hinglish')) {
        if (lang !== aiResponseLanguageRef.current) {
          handleSelectResponseLanguage(lang);
        }
      }
    };
    window.addEventListener('jarvis:language-changed', handleGlobalLangEvent);
    return () => window.removeEventListener('jarvis:language-changed', handleGlobalLangEvent);
  }, []);

  const [currentClock, setCurrentClock] = useState(() => {
    const d = new Date();
    return {
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString('hi-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Singing Engine & Digital Art Animation State
  const [isSinging, setIsSinging] = useState<boolean>(false);
  const [activeSong, setActiveSong] = useState<SongItem | null>(null);
  const [singingLyricLine, setSingingLyricLine] = useState<string>('');

  // Jarvis Mood State & Dynamic derivation from last processed command's sentiment
  const [manualMood, setManualMood] = useState<JarvisMood | null>(null);

  const currentMood: JarvisMoodConfig = useMemo(() => {
    if (manualMood) {
      return JARVIS_MOOD_CONFIGS[manualMood];
    }
    return getMoodFromSentiment(activeSentiment, isSinging);
  }, [manualMood, activeSentiment, isSinging]);

  // Interactive Voice Command Cheat Sheet Overlay State
  const [isVoiceCheatSheetOpen, setIsVoiceCheatSheetOpen] = useState<boolean>(false);
  const [liveSpeechTranscript, setLiveSpeechTranscript] = useState<string>('');
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);
  const [simulatedVoiceDemo, setSimulatedVoiceDemo] = useState<{ phrase: string } | null>(null);

  // Phone Lock Screen, Shut Down & Physical Power/Lock Button State
  const [isPhoneLocked, setIsPhoneLocked] = useState<boolean>(false);
  const [isPhoneShutDown, setIsPhoneShutDown] = useState<boolean>(false);
  const [isPowerGuideOpen, setIsPowerGuideOpen] = useState<boolean>(false);

  // Universal In-App YouTube Live Stream & Music Player State
  const [isYouTubeOpen, setIsYouTubeOpen] = useState<boolean>(false);
  const [youTubeQuery, setYouTubeQuery] = useState<string>('Top Trending Bollywood Hit Songs 2024');
  const [youTubeMaximizeSignal, setYouTubeMaximizeSignal] = useState<number>(0);

  const handleStartSinging = (songQuery?: string) => {
    triggerHaptic([60, 40]);
    setIsListening(false);
    setStatus('speaking');
    setIsSinging(true);

    const chosenSong = singJarvisSong(songQuery, {
      onStart: (song) => {
        setActiveSong(song);
        setIsSinging(true);
        setStatus('speaking');
        setSingingLyricLine(song.spokenIntro);
      },
      onLineChange: (lineIdx, text, romanText, song) => {
        setSingingLyricLine(text);
      },
      onEnd: () => {
        setIsSinging(false);
        setActiveSong(null);
        setSingingLyricLine('');
        if (handsFreeMode) {
          setTimeout(() => {
            setIsListening(true);
            setStatus('listening');
          }, 600);
        } else {
          setStatus('idle');
        }
      },
    });

    setActiveSong(chosenSong);
    setLastSpokenText(`🎵 Singing "${chosenSong.title}" (${chosenSong.artistOrFilm})`);
  };

  const handleStopSinging = () => {
    triggerHaptic([40]);
    stopJarvisSong();
    setIsSinging(false);
    setActiveSong(null);
    setSingingLyricLine('');
    setStatus('idle');
  };

  const handleNextSong = () => {
    triggerHaptic([50, 40]);
    const currentIdx = activeSong ? JARVIS_SONGS.findIndex((s) => s.id === activeSong.id) : -1;
    const nextIdx = (currentIdx + 1) % JARVIS_SONGS.length;
    handleStartSinging(JARVIS_SONGS[nextIdx].id);
  };

  useEffect(() => {
    const handleSingingStateEvent = (e: any) => {
      if (e.detail) {
        setIsSinging(Boolean(e.detail.isSinging));
        if (e.detail.song) setActiveSong(e.detail.song);
        if (e.detail.currentLine) setSingingLyricLine(e.detail.currentLine);
      }
    };
    window.addEventListener('jarvis:singing-state', handleSingingStateEvent);
    return () => {
      window.removeEventListener('jarvis:singing-state', handleSingingStateEvent);
    };
  }, []);

  // Listen for speech recognition transcript, volume, cheat sheet overlay & simulation triggers
  const handleSimulateVoiceCommandRef = useRef<(phrase: string) => void>(() => {});

  useEffect(() => {
    const handleLiveSpeech = (e: any) => {
      if (e.detail?.transcript !== undefined) {
        setLiveSpeechTranscript(e.detail.transcript);
      }
    };
    const handleMicVolume = (e: any) => {
      const vol = e.detail?.volume ?? e.detail?.audioLevel ?? 0;
      if (typeof vol === 'number') {
        setLiveAudioLevel(vol);
      }
    };
    const handleOpenCheatSheet = () => {
      setIsVoiceCheatSheetOpen(true);
    };
    const handleSimulateVoiceEvent = (e: any) => {
      if (e.detail?.phrase) {
        handleSimulateVoiceCommandRef.current(e.detail.phrase);
      }
    };

    window.addEventListener('jarvis:live-speech', handleLiveSpeech);
    window.addEventListener('jarvis:mic-volume', handleMicVolume);
    window.addEventListener('jarvis:speech-volume', handleMicVolume);
    window.addEventListener('jarvis:open-voice-cheat-sheet', handleOpenCheatSheet);
    window.addEventListener('jarvis:simulate-voice-command', handleSimulateVoiceEvent);
    return () => {
      window.removeEventListener('jarvis:live-speech', handleLiveSpeech);
      window.removeEventListener('jarvis:mic-volume', handleMicVolume);
      window.removeEventListener('jarvis:speech-volume', handleMicVolume);
      window.removeEventListener('jarvis:open-voice-cheat-sheet', handleOpenCheatSheet);
      window.removeEventListener('jarvis:simulate-voice-command', handleSimulateVoiceEvent);
    };
  }, []);

  // Guard against repetitive alarm speech
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  // Update clock every 10 seconds
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const d = new Date();
      setCurrentClock({
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        date: d.toLocaleDateString('hi-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
      });
    }, 10000);

    // Fetch live battery
    getDeviceBatteryStatus().then((b) => {
      setBatteryLevel((prev) => (prev !== b.formatted ? b.formatted : prev));
    });

    return () => clearInterval(clockTimer);
  }, []);

  // Save contacts & schedule safely with try-catch
  useEffect(() => {
    try {
      localStorage.setItem('jarvis_contacts', JSON.stringify(contacts));
    } catch {}
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_schedule', JSON.stringify(schedule));
    } catch {}
  }, [schedule]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_command_history', JSON.stringify(commandHistory));
    } catch {}
  }, [commandHistory]);

  // Ambient Noise Detection & Auto-Mute Suggestion Handler
  const handleEnableMutedFromSuggestion = useCallback(() => {
    setIsMuted(true);
    stopJarvisSpeech();
    triggerHaptic([40, 60]);
    setShowAmbientAlert(false);
    const feedbackMsg =
      "Jarvis Muted mode activated for high ambient noise. Speech recognition will now operate with pristine clarity without speaker feedback.";
    setLastSpokenText(feedbackMsg);
    const now = new Date();
    setCommandHistory((prev) => [
      {
        query: 'Auto-Mute Noise Suggestion',
        response: 'Enabled Muted Mode for loud room. Jarvis will respond via text for 100% microphone clarity.',
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toISOString().slice(0, 10),
        isoDate: now.toISOString(),
      },
      ...prev.slice(0, 99),
    ]);
  }, []);

  // Listen for ambient noise broadcast from AudioWaveformVisualizer
  useEffect(() => {
    const handleAmbientNoiseEvent = (e: any) => {
      const detail: AmbientNoiseState = e.detail;
      if (!detail) return;
      setAmbientNoise(detail);

      if (detail.isTooLoud && !isMuted) {
        setShowAmbientAlert(true);
        if (autoMuteAlways) {
          setIsMuted(true);
          stopJarvisSpeech();
          triggerHaptic([50, 50]);
          const nowAlert = new Date();
          setCommandHistory((prev) => [
            {
              query: 'Auto-Mute Active (Noise Floor Threshold Exceeded)',
              response: `High noise (~${detail.approxDb} dB) detected. Automatically enabled Muted Mode for speech clarity.`,
              timestamp: nowAlert.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: nowAlert.toISOString().slice(0, 10),
              isoDate: nowAlert.toISOString(),
            },
            ...prev.slice(0, 99),
          ]);
        }
      }
    };

    window.addEventListener('jarvis:ambient-noise', handleAmbientNoiseEvent);
    return () => window.removeEventListener('jarvis:ambient-noise', handleAmbientNoiseEvent);
  }, [isMuted, autoMuteAlways]);

  // Request notifications on boot
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = Notification.permission;
        setNotificationPermission((prev) => (prev !== perm ? perm : prev));
      } catch {}
    }
  }, []);

  // Stable references for background checks
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;
  const weatherDataRef = useRef(weatherData);
  weatherDataRef.current = weatherData;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const speechLangRef = useRef(speechLang);
  speechLangRef.current = speechLang;

  // Morning Briefing is preserved for manual trigger (button or voice command "Morning briefing sunao")
  // Opening the app remains completely silent in the background with zero unsolicited audio.

  // Periodic Reminder & Alarm Checker (runs safely without audio loops)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentDate = now.toISOString().split('T')[0];

      scheduleRef.current.forEach((item) => {
        if (!item || !item.time || typeof item.time !== 'string' || item.completed || item.notified) return;
        if (triggeredAlarmsRef.current.has(item.id)) return;

        const timeParts = item.time.split(':');
        if (timeParts.length < 2) return;
        const itemH = parseInt(timeParts[0], 10);
        const itemM = parseInt(timeParts[1], 10);
        if (isNaN(itemH) || isNaN(itemM)) return;
        const itemDate = item.date || currentDate;

        if (itemDate === currentDate && itemH === currentHours && itemM === currentMinutes) {
          triggeredAlarmsRef.current.add(item.id);

          playAlertSound();
          triggerHaptic([200, 100, 200, 100, 400]);

          const alertTitle =
            item.category === 'alarm' ? `ALARM: ${item.title}` : `REMINDER: ${item.title}`;
          const alertBody = item.location ? `Location: ${item.location}` : `Scheduled for ${item.time}`;

          sendLocalNotification(alertTitle, { body: alertBody });

          if (!isMutedRef.current) {
            speakJarvis(`Aapka dhyan chahti hu. Scheduled ${item.category}: ${item.title} ka waqt ho gaya hai.`, {
              muted: isMutedRef.current,
              lang: speechLangRef.current,
            });
          }

          setActiveRingingAlarm(item);

          setSchedule((prev) =>
            prev.map((s) => (s.id === item.id ? { ...s, notified: true } : s))
          );
        }
      });
    }, 20000);

    return () => clearInterval(checkInterval);
  }, []);

  // Helper to match contact by query/name/relationship/line type
  const resolveContact = (nameQuery: string, relationQuery?: string, requestedType?: string) => {
    const q = nameQuery.toLowerCase().trim();
    const rel = (relationQuery || '').toLowerCase().trim();

    const found = contacts.find((c) => {
      const cName = c.name.toLowerCase();
      const cRel = (c.relation || '').toLowerCase();

      if (cName === q) return true;
      if (q.includes(cName) || cName.includes(q)) return true;
      if (rel && cRel.includes(rel)) return true;

      if (q.includes('dad') || q.includes('papa') || q.includes('father')) {
        return cRel.includes('dad') || cRel.includes('father') || cName.includes('dad');
      }
      if (q.includes('mom') || q.includes('mummy') || q.includes('mother') || q.includes('maa')) {
        return cRel.includes('mom') || cRel.includes('mother') || cName.includes('mom');
      }
      if (q.includes('doctor') || q.includes('doc')) {
        return cRel.includes('doctor') || cName.includes('dr');
      }
      if (q.includes('brother') || q.includes('bhai')) {
        return cRel.includes('brother');
      }

      return false;
    });

    if (!found) {
      // Also match by phone digits if user mentions phone number
      const cleanDigits = q.replace(/[^0-9]/g, '');
      if (cleanDigits.length >= 7) {
        const byPhone = contacts.find((c) => {
          const p = c.phone.replace(/[^0-9]/g, '');
          const s = (c.secondaryPhone || '').replace(/[^0-9]/g, '');
          return (
            p.endsWith(cleanDigits) ||
            cleanDigits.endsWith(p) ||
            (s && (s.endsWith(cleanDigits) || cleanDigits.endsWith(s)))
          );
        });
        if (byPhone) {
          return { contact: byPhone, targetPhone: byPhone.phone, targetType: byPhone.phoneType || 'mobile' };
        }
      }
      return null;
    }

    let targetPhone = found.phone;
    let targetType = found.phoneType || 'mobile';

    if (requestedType === 'work') {
      if (found.secondaryPhone && found.secondaryPhoneType === 'work') {
        targetPhone = found.secondaryPhone;
        targetType = 'work';
      } else if (found.phoneType === 'work') {
        targetPhone = found.phone;
        targetType = 'work';
      }
    } else if (requestedType === 'home') {
      if (found.secondaryPhone && found.secondaryPhoneType === 'home') {
        targetPhone = found.secondaryPhone;
        targetType = 'home';
      }
    }

    return { contact: found, targetPhone, targetType };
  };

  // Main JARVIS voice/text command dispatcher with real-time sentiment analysis
  const handleExecuteJarvisCommand = async (commandText: string, voiceSample?: VoiceToneSample) => {
    if (!commandText.trim()) return;

    // Normalize command by stripping common wake words, punctuation, and extra spaces to prevent double execution
    const normalized = commandText
      .toLowerCase()
      .replace(/^(hey\s*jarvis|jarvis|hi\s*jarvis|ok\s*jarvis|oye\s*jarvis|suno\s*jarvis|जार्विस|हे\s*जार्विस|मैरा|myra)\b/i, '')
      .replace(/[^a-z0-9\u0900-\u097F]/gi, '')
      .trim();

    const now = Date.now();
    if (
      normalized.length >= 2 &&
      normalized === lastExecutedCommandRef.current.text &&
      now - lastExecutedCommandRef.current.timestamp < 7000
    ) {
      console.warn('[Jarvis Engine] Suppressed duplicate command execution within 7s:', commandText);
      return;
    }

    // Suppress commands triggered by speaker feedback while Jarvis is actively speaking
    if (isJarvisSpeaking() || status === 'speaking') {
      console.warn('[Jarvis Engine] Suppressed command execution during active Jarvis speech:', commandText);
      return;
    }
    lastExecutedCommandRef.current = { text: normalized, timestamp: now };

    // Detect tone of voice and sentiment from vocal tone telemetry and lexical cues
    const detectedSentiment = analyzeUserToneAndSentiment(commandText, voiceSample);
    setActiveSentiment(detectedSentiment);
    setManualMood(null); // Update Jarvis Mood dynamically based on this latest command

    // Halt any listening and speech immediately to prevent acoustic loop
    setIsListening(false);
    stopJarvisSpeech();
    setStatus('processing');
    // Subtle 'ping' notification sound effect for immediate acoustic confirmation of recognized command
    playCommandRecognizedPingSound();

    const commandExecutionStartTime = performance.now();

    try {
      let data: { reply?: string; actions?: JarvisAction[]; sentiment?: any } = {};

      const lowerCmd = commandText.toLowerCase();
      const activeCalib = getCalibrationProfile();

      // Check for explicit Hindi language switch
      if (
        lowerCmd.includes('hindi ma bat') ||
        lowerCmd.includes('hindi me bat') ||
        lowerCmd.includes('hindi me baat') ||
        lowerCmd.includes('hindi me bolo') ||
        lowerCmd.includes('hindi bolo') ||
        lowerCmd.includes('hindi mein bolo') ||
        lowerCmd.includes('हिंदी में बात') ||
        lowerCmd.includes('हिंदी बोलो')
      ) {
        handleSelectResponseLanguage('hindi');
        data = {
          reply: 'जी सर, अब से मैं आपसे हमेशा स्पष्ट और शुद्ध हिन्दी में ही बात करूँगा। आप जो भी आज्ञा दें, मैं तुरंत पालन करूँगा।',
          actions: [],
        };
      } else if (
        lowerCmd.includes('calibrate voice') ||
        lowerCmd.includes('voice calibration') ||
        lowerCmd.includes('accent calibration') ||
        lowerCmd.includes('calibrate accent') ||
        lowerCmd.includes('aawaz calibrate') ||
        lowerCmd.includes('voice calibrate')
      ) {
        window.dispatchEvent(new CustomEvent('jarvis:open-voice-calibration'));
        data = {
          reply:
            'Ji! Maine aapke liye 30-Second Voice Calibration open kar di hai. Screen par diye gaye 4 sentences ko bolkar aap JARVIS ko apna regional accent aur pronunciation sikha sakte hain.',
          actions: [],
        };
      } else {
        // 1. Ultra-Fast Instant On-Device Intent Resolver (<1ms, 0 delay for YouTube, Plan, Call, Torch, Alarm, Smart Memory)
        const instantMatch = resolveInstantLocalCommand(commandText, {
          contacts,
          schedule,
          weatherData,
          batteryLevel,
          torchActive,
          incomingMessages,
          responseLanguage: aiResponseLanguageRef.current,
          memories,
        });

        // Live client device timezone & real-time clock telemetry
        const clientDeviceTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' : 'Asia/Kolkata';
        const clientNowObj = new Date();
        const clientTimeFormatted = clientNowObj.toLocaleTimeString('en-IN', {
          timeZone: clientDeviceTz,
          hour12: true,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        });
        const clientDateFormatted = clientNowObj.toLocaleDateString('en-IN', {
          timeZone: clientDeviceTz,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const activeClientLoc = getCachedUserLocation();

        if (instantMatch) {
          const adaptedInstantReply = adaptResponseWithSentiment(instantMatch.reply, detectedSentiment);
          data = { reply: adaptedInstantReply, actions: instantMatch.actions };
          // Fire-and-forget background logging without blocking the user
          fetch('/api/jarvis/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: commandText,
              contacts,
              currentSchedule: schedule,
              deviceInfo: {
                os: 'Android 15',
                battery: batteryLevel,
                status: 'Nominal',
                torch: torchActive ? 'ON' : 'OFF',
                timeZone: clientDeviceTz,
              },
              userSentiment: {
                sentiment: detectedSentiment.sentiment,
                score: detectedSentiment.score,
                confidence: detectedSentiment.confidence,
                traits: detectedSentiment.traits,
                mode: detectedSentiment.toneConfig.mode,
              },
              voiceToneSample: voiceSample,
              accentProfile: activeCalib?.isActive ? activeCalib : undefined,
              responseLanguage: aiResponseLanguageRef.current,
              memories,
              targets: getStoredTargets(),
              qaMemories: getStoredQaMemories().slice(0, 8),
              clientTime: clientTimeFormatted,
              clientDate: clientDateFormatted,
              clientTimeZone: clientDeviceTz,
              clientLocation: activeClientLoc,
              personalityPreset: getActivePersonalityPresetId(),
              speakingStyle: getActiveSpeakingStyle(),
            }),
          }).catch(() => {});
        } else {
          try {
            // Show responsive feedback that Google Gemini is formulating the answer
            setLastSpokenText(`✨ Google Gemini AI answer khoj raha hai: "${commandText}"...`);
            const abortController = new AbortController();
            const fetchTimeout = setTimeout(() => abortController.abort(), 25000);
            const res = await fetch('/api/jarvis/command', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: abortController.signal,
              body: JSON.stringify({
                prompt: commandText,
                contacts,
                currentSchedule: schedule,
                deviceInfo: {
                  os: 'Android 15',
                  battery: batteryLevel,
                  status: 'Nominal',
                  torch: torchActive ? 'ON' : 'OFF',
                  timeZone: clientDeviceTz,
                },
                weatherInfo: weatherData
                  ? `${weatherData.city}: ${weatherData.tempC}°C, ${weatherData.condition}, humidity ${weatherData.humidity}%, wind ${weatherData.windSpeedKmH} km/h`
                  : undefined,
                userSentiment: {
                  sentiment: detectedSentiment.sentiment,
                  score: detectedSentiment.score,
                  confidence: detectedSentiment.confidence,
                  traits: detectedSentiment.traits,
                  mode: detectedSentiment.toneConfig.mode,
                },
                voiceToneSample: voiceSample,
                accentProfile: activeCalib?.isActive ? activeCalib : undefined,
                responseLanguage: aiResponseLanguageRef.current,
                memories,
                targets: getStoredTargets(),
                qaMemories: getStoredQaMemories().slice(0, 8),
                clientTime: clientTimeFormatted,
                clientDate: clientDateFormatted,
                clientTimeZone: clientDeviceTz,
                clientLocation: activeClientLoc,
                personalityPreset: getActivePersonalityPresetId(),
                speakingStyle: getActiveSpeakingStyle(),
              }),
            });
            clearTimeout(fetchTimeout);

            if (res.ok) {
              data = await res.json();
              if (data.sentiment) {
                // Merge server-side nuanced sentiment attributes
                setActiveSentiment((prev) =>
                  prev ? { ...prev, ...data.sentiment, toneConfig: prev.toneConfig } : prev
                );
              }
            } else {
              try {
                data = await res.json();
              } catch {
                data = {};
              }
            }
          } catch (networkErr) {
            console.warn('Network call failed or timed out, resolving locally on device:', networkErr);
          }
        }
      }

      // Safe local fallback if server was unavailable
      if (!data || !data.reply) {
        const lower = commandText.toLowerCase();
        const fallbackActions: JarvisAction[] = [];
        let fallbackReply = 'Ji, mai aapka command execute kar rahi hu.';

        // Check for immediate general knowledge answer first
        const encycloMatch = resolveGeneralKnowledgeAnswer(lower);
        if (encycloMatch) {
          fallbackReply = encycloMatch;
        } else if (
          lower.includes('play store') ||
          lower.includes('playstore') ||
          lower.includes('install kaise kare') ||
          lower.includes('download kaise kare')
        ) {
          fallbackActions.push({
            name: 'openInstallApp',
            args: { tab: 'playstore' },
          });
          fallbackReply =
            'JARVIS ko Play Store jaisa phone me install karne ke liye maine Play Store & WebAPK guide open kar di hai!';
        } else if (
          lower.includes('number bhejo') ||
          lower.includes('number send') ||
          lower.includes('wahi number') ||
          lower.includes('vahi number')
        ) {
          const match = resolveContact(commandText);
          if (match) {
            fallbackActions.push({
              name: 'sendTextMessage',
              args: {
                platform: 'whatsapp',
                recipientName: match.contact.name,
                messageText: `Saved Contact: ${match.contact.name} - ${match.targetPhone}`,
              },
            });
            fallbackReply = `Ji! Saved contact "${match.contact.name}" ka number (${match.targetPhone}) share karne ke liye open kar diya hai.`;
          } else {
            fallbackActions.push({ name: 'openContactsView', args: {} });
            fallbackReply =
              'Suraksha Niyam: Mai sirf aapke saved contacts ke verified numbers hi bhej sakti hu. Anjaan number bhejne ki anumati nahi hai.';
          }
        } else if (lower.includes('call') || lower.includes('phone') || lower.includes('lagao')) {
          const spokenPhone = extractSpokenPhoneNumber(commandText);
          const name =
            commandText
              .replace(/(call|phone|karo|ko|lagao|please|mobile|work|home|par|pe|milao)/gi, '')
              .trim() || 'Dad';
          const match = resolveContact(name);
          if (spokenPhone) {
            fallbackActions.push({
              name: 'makePhoneCall',
              args: {
                recipientName: match ? match.contact.name : `Number ${spokenPhone}`,
                phoneNumber: spokenPhone,
                autoDial: true,
              },
            });
            fallbackReply = match
              ? `Ji bilkul, saved contact ${match.contact.name} (${spokenPhone}) ko call connect kar rahi hu.`
              : `Ji bilkul, aapke bole gaye number ${spokenPhone} par call connect kar rahi hu.`;
          } else if (match) {
            fallbackActions.push({
              name: 'makePhoneCall',
              args: {
                recipientName: match.contact.name,
                phoneType: match.targetType || 'mobile',
                autoDial: true,
                phoneNumber: match.targetPhone,
              },
            });
            fallbackReply = `Ji bilkul, mai saved contact ${match.contact.name} (${match.targetPhone}) ko call connect kar rahi hu.`;
          } else {
            fallbackActions.push({
              name: 'openContactsView',
              args: { unsavedQuery: name },
            });
            fallbackReply = `Kripya call lagane ke liye koi phone number bolein (jaise '9876543210 par call lagao') ya saved contact ka naam bolein.`;
          }
        } else if (
          lower.includes('iron man') ||
          lower.includes('ironman') ||
          lower.includes('आयरन मैन') ||
          lower.includes('suit face') ||
          lower.includes('suit mode') ||
          lower.includes('mark helmet') ||
          lower.includes('mark suit')
        ) {
          setAvatarView('ironman');
          try {
            localStorage.setItem('jarvis_avatar_view', 'ironman');
          } catch {}
          fallbackReply = 'Iron Man Mark suit interface active kar diya hai, Sir! HUD telemetry aur speaking audio grille fully functional hai.';
        } else if (
          lower.includes('jansabha') ||
          lower.includes('rp jansabha') ||
          lower.includes('digital seva') ||
          lower.includes('digital gramin') ||
          lower.includes('gramin seva') ||
          lower.includes('csc') ||
          lower.includes('aadhaar portal') ||
          lower.includes('pan card portal') ||
          lower.includes('pf portal') ||
          lower.includes('ayushman portal') ||
          lower.includes('sarkari portal') ||
          lower.includes('digital services')
        ) {
          setActiveTab('rp_jansabha');
          fallbackReply = 'RP Jansabha Digital Services Portal open kar diya hai, Sir! Yahan CSC Digital Seva, Digital Gramin Seva, Aadhaar, PAN card, SBI banking aur sarkari schemes direct access kar sakte hain.';
        } else if (lower.includes('torch') || lower.includes('flashlight')) {
          const isOff = lower.includes('off') || lower.includes('band');
          fallbackActions.push({
            name: 'managePhoneSettings',
            args: { setting: 'torch', action: isOff ? 'off' : 'on' },
          });
          fallbackReply = isOff ? 'Ji, torch band kar di hai maine.' : 'Ji, torch on kar di hai maine.';
        } else if (
          !lower.includes('youtube') &&
          !lower.includes('calculator') &&
          !lower.includes('camera') &&
          !lower.includes('instagram') &&
          !lower.includes('facebook') &&
          !lower.includes('spotify') &&
          !lower.includes('chrome') &&
          !lower.includes('browser') &&
          (lower.includes('phone unlock') ||
            lower.includes('unlock phone') ||
            lower.includes('phone ko unlock') ||
            lower.includes('screen unlock') ||
            lower.includes('unlock screen') ||
            lower.includes('phone open') ||
            lower.includes('open phone') ||
            lower.includes('lock open') ||
            lower.includes('phone kholo') ||
            lower.includes('screen kholo') ||
            lower.includes('lock kholo') ||
            lower.includes('lock khol do') ||
            lower.includes('unlock') ||
            lower.includes('अनलॉक') ||
            lower === 'open karo' ||
            lower === 'open kar do' ||
            lower === 'open' ||
            lower === 'kholo')
        ) {
          fallbackActions.push({
            name: 'unlockPhone',
            args: {},
          });
          fallbackReply = 'Biometric voice authorization confirmed. Phone unlocked successfully. Welcome back Rovin sir!';
        } else if (
          !lower.includes('pc lock') &&
          !lower.includes('lock pc') &&
          (lower.includes('phone lock') ||
            lower.includes('lock phone') ||
            lower.includes('phone ko lock') ||
            lower.includes('phone lock karo') ||
            lower.includes('phone lock kar do') ||
            lower.includes('phone lock kardo') ||
            lower.includes('phone lock kar de') ||
            lower.includes('phone lock karna') ||
            lower.includes('phone lock kar re') ||
            lower.includes('lock phone kar re') ||
            lower.includes('lock karo') ||
            lower.includes('lock kar do') ||
            lower.includes('lock kardo') ||
            lower.includes('lock karna') ||
            lower.includes('screen lock') ||
            lower.includes('lock screen') ||
            lower.includes('screen ko lock') ||
            lower.includes('mobile lock') ||
            lower.includes('mobile ko lock') ||
            lower.includes('phone band karo') ||
            lower.includes('phone ko band karo') ||
            lower.includes('screen band karo') ||
            lower.includes('स्क्रीन लॉक') ||
            lower.includes('फोन लॉक') ||
            lower.includes('फोन बंद करो') ||
            lower.includes('लॉक करो') ||
            lower.includes('लॉक करना') ||
            lower.includes('लॉक कर दो') ||
            lower === 'lock' ||
            lower === 'लॉक' ||
            lower === 'lok' ||
            lower === 'phone lok' ||
            lower === 'lok phone')
        ) {
          fallbackActions.push({
            name: 'lockPhone',
            args: {},
          });
          fallbackReply = 'Ji bilkul! Phone ko secure lock mode me switch kar diya hai.';
        } else if (
          lower.includes('power button') ||
          lower.includes('lock button') ||
          lower.includes('पावर बटन') ||
          lower.includes('लॉक बटन') ||
          lower.includes('lock wala button') ||
          lower.includes('gemini button') ||
          lower.includes('gimme')
        ) {
          fallbackActions.push({
            name: 'openPowerButtonGuide',
            args: {},
          });
          fallbackReply = 'Maine screen par Power & Lock button gesture guide aur interactive hardware button widget open kar diya hai!';
        } else if (
          lower.includes('aaj ke plan') ||
          lower.includes('aaj ka plan') ||
          lower.includes('plan batao') ||
          lower.includes('आज के प्लान') ||
          lower.includes('आज का प्लान') ||
          lower.includes('दिनचर्या') ||
          (
            (lower.includes('show') ||
              lower.includes('dikhao') ||
              lower.includes('check') ||
              lower.includes('view') ||
              lower.includes('batao') ||
              lower.includes('kya') ||
              lower.includes("today's schedule")) &&
            (lower.includes('schedule') || lower.includes('calendar') || lower.includes('agenda') || lower.includes('plan') || lower.includes('प्लान'))
          )
        ) {
          const todayEvents = schedule.filter((item) => !item.completed);
          if (todayEvents.length > 0) {
            const summaryList = todayEvents.slice(0, 3).map((e) => `${e.title} at ${e.time}`).join(', ');
            fallbackReply = `Ram Ram ji! Aaj aapke schedule me ${todayEvents.length} items hain: ${summaryList}.`;
          } else {
            fallbackReply = 'Ram Ram ji! Aaj aapka schedule bilkul clear hai, koi pending events nahi hain.';
          }
          fallbackActions.push({
            name: 'openScheduleView',
            args: {},
          });
        } else if (lower.includes('alarm') || lower.includes('wake')) {
          const timeMatch = commandText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
          let hour = 8;
          let min = 0;
          let timeStr = '08:00 AM';
          if (timeMatch) {
            hour = parseInt(timeMatch[1], 10);
            min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
            const meridian = timeMatch[3] ? timeMatch[3].toUpperCase() : '';
            if (meridian === 'PM' && hour < 12) hour += 12;
            if (meridian === 'AM' && hour === 12) hour = 0;
            timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
          }
          fallbackActions.push({
            name: 'manageSchedule',
            args: {
              action: 'set_alarm',
              title: 'Wakeup Alarm',
              time: timeStr,
              hour,
              minute: min,
              category: 'alarm',
              integrateNative: true,
            },
          });
          fallbackReply = `Maine ${timeStr} ka alarm set kar diya hai. Aap bilkul chinta mat kijiye!`;
        } else if (lower.includes('remind') || lower.includes('reminder') || lower.includes('yaad')) {
          fallbackActions.push({
            name: 'manageSchedule',
            args: {
              action: 'create_reminder',
              title: 'Task Reminder',
              time: '17:00',
              category: 'reminder',
              integrateNative: true,
            },
          });
          fallbackReply = 'Maine aapka reminder note kar liya hai, waqt par yaad dila dungi!';
        } else if (lower.includes('whatsapp')) {
          fallbackActions.push({
            name: 'sendTextMessage',
            args: { platform: 'whatsapp', recipientName: 'Contact', messageText: commandText },
          });
          fallbackReply = 'Ji bilkul, mai WhatsApp open kar rahi hu.';
        } else if (
          lower.includes('photo bol') ||
          lower.includes('photo bolta') ||
          lower.includes('photo bolata') ||
          lower.includes('microphone photo') ||
          lower.includes('mic photo') ||
          lower.includes('photo problem')
        ) {
          fallbackReply = 'Ji Rovin Sir! Microphone chalu karne par photo aane ka issue permanently solve kar diya gaya hai. Ab bina explicit "Camera open karo" ya "Photo khicho" bole camera sensor kabhi trigger nahi hoga.';
        } else if (
          (lower.includes('camera') && (lower.includes('open') || lower.includes('kholo') || lower.includes('chalu') || lower.includes('start'))) ||
          (lower.includes('photo') && (lower.includes('khicho') || lower.includes('click') || lower.includes('capture') || lower.includes('lo'))) ||
          (lower.includes('selfie') && (lower.includes('lo') || lower.includes('khicho') || lower.includes('click'))) ||
          lower === 'open camera' ||
          lower === 'camera open' ||
          lower === 'take photo' ||
          lower === 'click photo'
        ) {
          fallbackActions.push({
            name: 'openApp',
            args: { appName: 'camera' },
          });
          fallbackReply = 'Ji bilkul, mai camera open kar rahi hu!';
        } else if (
          (lower.includes('time') || lower.includes('samay') || lower.includes('baje') || lower.includes('waqt')) &&
          (lower.includes('location') || lower.includes('kahan') || lower.includes('jagah') || lower.includes('maps'))
        ) {
          purgeErroneousLocationCache();
          const userTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' : 'Asia/Kolkata';
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-IN', { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: true });
          const dateStr = now.toLocaleDateString('hi-IN', { timeZone: userTz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const cached = getCachedUserLocation();
          const detectedCity = cached?.city || weatherData?.city || 'India';
          const coordsQuery = cached ? `${cached.latitude},${cached.longitude}` : 'current_live_gps';

          fallbackActions.push({
            name: 'openLiveLocation',
            args: { refreshGps: true },
          });
          fallbackActions.push({
            name: 'openApp',
            args: { appName: 'maps', query: coordsQuery },
          });
          fallbackReply = `Ji Rovin Sir! Live running real time is samay ${timeStr} (IST - Indian Standard Time) ho raha hai, date ${dateStr} hai, aur aapki live real location ${detectedCity} hai! Maine Google Maps par aapki exact live GPS location open kar di hai!`;
        } else if (
          lower.includes('time') ||
          lower.includes('date') ||
          lower.includes('battery') ||
          lower.includes('samay') ||
          lower.includes('tarikh') ||
          lower.includes('tariq') ||
          lower.includes('timezone') ||
          lower.includes('time zone') ||
          lower.includes('running time') ||
          lower.includes('real time') ||
          lower.includes('reyal time') ||
          lower.includes('baje')
        ) {
          const userTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' : 'Asia/Kolkata';
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-IN', { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: true });
          const dateStr = now.toLocaleDateString('hi-IN', { timeZone: userTz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const batt = batteryLevel || '94%';

          const wantsBattery = lower.includes('battery') || lower.includes('charge');
          const wantsTimezone = lower.includes('timezone') || lower.includes('time zone') || lower.includes('wrong');
          const wantsTime = lower.includes('time') || lower.includes('samay') || lower.includes('baje') || wantsTimezone;
          const wantsDate = lower.includes('date') || lower.includes('tarikh') || lower.includes('tariq');

          if (wantsBattery && !wantsTime && !wantsDate) {
            fallbackReply = `Ji Rovin Sir! Aapke device ki battery abhi ${batt} hai aur health bilkul theek hai.`;
          } else if (wantsTimezone) {
            fallbackReply = `Ji Rovin Sir! Maine time zone ko live synchronize kar diya hai. Current active timezone Asia/Kolkata (Indian Standard Time - IST) hai aur bilkul sahi live real time ${timeStr} hai!`;
          } else if (wantsTime && !wantsBattery && !wantsDate) {
            fallbackReply = `Ji Rovin Sir! Is samay Bharat (IST - Indian Standard Time) me live real time ho raha hai ${timeStr}.`;
          } else if (wantsDate && !wantsBattery && !wantsTime) {
            fallbackReply = `Ji Rovin Sir! Aaj ki tarikh hai ${dateStr}.`;
          } else {
            fallbackReply = `Ji Rovin Sir! Is samay live real time ${timeStr} (IST) hai, date ${dateStr} hai, aur battery ${batt} bilkul perfect hai!`;
          }
        } else if (
          lower.includes('live location') ||
          lower.includes('current location') ||
          lower.includes('real location') ||
          lower.includes('reyal location') ||
          lower.includes('hasanpur') ||
          lower.includes('हसनपुर') ||
          lower.includes('kahan hu') ||
          lower.includes('kahan par hu') ||
          lower.includes('meri location') ||
          (lower.includes('location') && (lower.includes('bata') || lower.includes('dikhao') || lower.includes('maps') || lower.includes('kholo'))) ||
          (lower.includes('maps') && (lower.includes('live') || lower.includes('current') || lower.includes('kahan')))
        ) {
          purgeErroneousLocationCache();
          const cached = getCachedUserLocation();
          const detectedCity = cached?.city || weatherData?.city || 'India';
          const coordsQuery = cached ? `${cached.latitude},${cached.longitude}` : 'current_live_gps';

          fallbackActions.push({
            name: 'openLiveLocation',
            args: { refreshGps: true },
          });
          fallbackActions.push({
            name: 'openApp',
            args: { appName: 'maps', query: coordsQuery },
          });
          fallbackReply =
            `Ji Rovin Sir! Maine aapke device ki real-time high-accuracy GPS live location detect kar li hai. Aapki exact current live location ${detectedCity} Google Maps par plot karke open kar di hai!`;
        } else if (
          (lower.includes('memory') || lower.includes('yaad') || lower.includes('remember') || lower.includes('save') || lower.includes('add')) &&
          (lower.includes('rovin') || lower.includes('pal') || lower.includes('name') || lower.includes('naam') || lower.includes('add') || lower.includes('daal') || lower.includes('likh'))
        ) {
          const isRovin = lower.includes('rovin') || lower.includes('pal');
          const nameVal = isRovin ? 'Rovin Pal' : 'Rovin Pal';
          fallbackActions.push({
            name: 'saveMemoryItem',
            args: {
              key: 'User Identity / Name',
              value: nameVal,
              category: 'personal',
            },
          });
          fallbackReply = `Ram Ram ji Rovin Pal ji! Maine aapka naam "${nameVal}" memory core me permanently add aur save kar diya hai.`;
        } else if (
          lower.includes('bolna par bat kar') ||
          lower.includes('bolna par baat kar') ||
          lower.includes('bat kar bolo bos') ||
          lower.includes('baat kar bolo boss') ||
          lower.includes('bolo boss') ||
          lower.includes('bolo bos') ||
          lower.includes('baat karo boss') ||
          lower.includes('bat karo boss') ||
          lower.includes('mujhse baat karo') ||
          lower.includes('mujhse bat karo') ||
          lower.includes('mujhse bat kar') ||
          lower.includes('mujhse baat kar') ||
          lower.includes('boss bolo') ||
          lower.includes('mujhe boss bolo') ||
          lower.includes('call me boss') ||
          lower === 'bolo' ||
          lower === 'baat karo' ||
          lower === 'bat karo' ||
          lower === 'baat kar' ||
          lower === 'bat kar'
        ) {
          fallbackReply = 'Haanji Boss! Bilkul, mai aapse baat kar rahi hu. Boliye Boss, kya hukum hai? Mai aapki har baat sun rahi hu aur har command follow karungi. Kahiye Boss, kya seva karni hai?';
        } else if (
          (lower.includes('bat') || lower.includes('baat') || lower.includes('bol') || lower.includes('talk') || lower.includes('speak') || lower.includes('mic') || lower.includes('voice') || lower.includes('aawaz') || lower.includes('awaz')) &&
          (lower.includes('problem') || lower.includes('dikkat') || lower.includes('issue') || lower.includes('nahi ho') || lower.includes('kaam nahi') || lower.includes('help') || lower.includes('madad'))
        ) {
          fallbackActions.push({
            name: 'openVoiceHelp',
            args: {},
          });
          fallbackReply = 'Ram Ram ji Rovin Pal ji! Agar mujhse baat karne me dikkat aa rahi hai toh: 1) Browser ke URL bar me Lock icon se Microphone "Allow" karein, 2) Ya preview window ki jagah "Open in New Tab" karein, 3) Ya seedhe neeche diye gaye text box me likhkar Send karein. Maine screen par Voice Help guide open kar di hai!';
        } else if (
          lower.includes('cheat sheet') ||
          lower.includes('cheatsheet') ||
          lower.includes('cheat') ||
          lower.includes('voice command') ||
          lower.includes('voice commands') ||
          lower.includes('commands dikhao') ||
          lower.includes('command dikhao') ||
          lower.includes('command list') ||
          lower.includes('commands list') ||
          lower.includes('kya bol sakte') ||
          lower.includes('available commands')
        ) {
          fallbackActions.push({
            name: 'openVoiceCheatSheet',
            args: {},
          });
          fallbackReply = 'Ram Ram ji! Maine screen par interactive Voice Command Cheat Sheet overlay open kar di hai. Yahan se aap sabhi voice commands dekh aur execute kar sakte hain.';
        } else if (
          lower.includes('memory') ||
          lower.includes('brain') ||
          lower.includes('vector') ||
          lower.includes('kotlin') ||
          lower.includes('yaadash') ||
          lower.includes('yaaddasht')
        ) {
          fallbackActions.push({
            name: 'openMemoryCore',
            args: {},
          });
          fallbackReply = 'Ram Ram ji! Mai JARVIS Interactive Memory Core aur Android Kotlin Integration open kar rahi hu.';
        } else if (
          (lower.includes('export') ||
            lower.includes('download') ||
            lower.includes('save') ||
            lower.includes('backup')) &&
          (lower.includes('history') ||
            lower.includes('interaction') ||
            lower.includes('command') ||
            lower.includes('log') ||
            lower.includes('json'))
        ) {
          fallbackActions.push({
            name: 'exportInteractionHistory',
            args: {},
          });
          fallbackReply = 'Ji Sir, aapki command history JSON format me download kar di gayi hai.';
        } else if (
          lower.includes('install') ||
          lower.includes('download') ||
          lower.includes('home screen') ||
          lower.includes('homescreen') ||
          lower.includes('app bana') ||
          lower.includes('friend') ||
          lower.includes('dost') ||
          lower.includes('share') ||
          lower.includes('kasa download') ||
          lower.includes('kaise download')
        ) {
          fallbackActions.push({
            name: 'openInstallApp',
            args: {},
          });
          fallbackReply = 'Ram Ram ji! Mai JARVIS Install aur Friend Download option open kar rahi hu. Yahan se aap apne phone ki Home Screen par app install kar sakte hain aur WhatsApp se apne dost ko bhej sakte hain!';
        } else if (
          lower.includes('weather') ||
          lower.includes('mausam') ||
          lower.includes('temperature') ||
          lower.includes('taapman') ||
          lower.includes('barish') ||
          lower.includes('rain') ||
          lower.includes('climate')
        ) {
          if (weatherData) {
            fallbackReply = `Ram Ram ji! Is samay ${weatherData.city} me temperature ${weatherData.tempC}°C hai, mausam ${weatherData.condition} hai, aur humidity ${weatherData.humidity}% hai.`;
          } else {
            fallbackReply = 'Ram Ram ji! Mai aapke local area ka real-time weather check kar rahi hu. Kripya assistant tab ke Weather Widget par live temperature dekhein.';
          }
        } else if (
          lower.includes('morning briefing') ||
          lower.includes('morning brief') ||
          lower.includes('briefing') ||
          lower.includes('subah ki briefing') ||
          lower.includes('daily brief')
        ) {
          const { speechText } = buildMorningBriefingText(schedule, weatherData);
          fallbackReply = speechText;
        } else if (
          lower.includes('news') ||
          lower.includes('samachar') ||
          lower.includes('khabar') ||
          lower.includes('headlines')
        ) {
          try {
            const nRes = await fetch('/api/news/summary');
            if (nRes.ok) {
              const nData = await nRes.json();
              if (nData.summary) {
                fallbackReply = nData.summary;
              }
            }
          } catch {
            fallbackReply = 'Ram Ram ji! World aur Bharat News module assistant me live updated hai. ISRO space roadmap aur international clean energy initiatives aaj ki top headlines hain.';
          }
        } else if (
          lower.includes('ram ram') ||
          lower.includes('radhe') ||
          lower.includes('start') ||
          lower.includes('shuru') ||
          lower.includes('hi') ||
          lower.includes('hello') ||
          lower.includes('kaise ho') ||
          lower.includes('namaste')
        ) {
          fallbackReply = 'Ram Ram ji! Mai aapki personal AI assistant Jarvis hu. Sab theek thak? Bataiye mai aapki kya madad ya seva karu?';
        } else if (
          lower.includes('youtube') ||
          lower.includes('यूट्यूब') ||
          lower.includes('यूटयूब') ||
          lower.includes('yt') ||
          lower.includes('open') ||
          lower.includes('kholo') ||
          lower.includes('खोलो') ||
          lower.includes('chalao') ||
          lower.includes('चलाओ') ||
          lower.includes('ओपन')
        ) {
          const isYouTube =
            lower.includes('youtube') ||
            lower.includes('यूट्यूब') ||
            lower.includes('यूटयूब') ||
            lower.includes('yt') ||
            (!lower.includes('camera') && !lower.includes('whatsapp') && !lower.includes('setting') && !lower.includes('music'));
          const app = isYouTube
            ? 'youtube'
            : lower.includes('camera') || lower.includes('कैमरा')
            ? 'camera'
            : lower.includes('whatsapp') || lower.includes('व्हाट्सएप')
            ? 'whatsapp'
            : 'youtube';
          fallbackActions.push({
            name: 'openApp',
            args: { appName: app },
          });
          fallbackReply = isYouTube
            ? 'Ji bilkul, mai aapke phone me YouTube open kar rahi hu.'
            : `Ji, mai aapke phone me ${app} open kar rahi hu.`;
        }

        data = { reply: fallbackReply, actions: fallbackActions };
      }

      const spokenReply = adaptResponseWithSentiment(
        data.reply || 'Ji, mai aapka command execute kar rahi hu.',
        detectedSentiment
      );
      const actions: JarvisAction[] = data.actions || [];
      let hasSingingAction = false;

      setLastSpokenText(spokenReply);

      // Execute returned actions on device
      if (actions.length > 0) {
        for (const act of actions) {
          try {
            switch (act.name) {
              case 'makePhoneCall': {
                const { recipientName, phoneType, relationship, phoneNumber } = act.args;
                let match = resolveContact(recipientName, relationship, phoneType);

                // If not matched by name, check if phoneNumber matches any saved contact
                let targetContact = match?.contact;
                let targetPhone = match?.targetPhone || phoneNumber;

                if (!targetContact && (phoneNumber || recipientName)) {
                  const queryCandidate = String(phoneNumber || recipientName).replace(/[^0-9]/g, '');
                  if (queryCandidate.length >= 7) {
                    targetContact = contacts.find((c) => {
                      const p = c.phone.replace(/[^0-9]/g, '');
                      const s = (c.secondaryPhone || '').replace(/[^0-9]/g, '');
                      return (
                        p.endsWith(queryCandidate) ||
                        queryCandidate.endsWith(p) ||
                        (s && (s.endsWith(queryCandidate) || queryCandidate.endsWith(s)))
                      );
                    });
                    if (targetContact) {
                      targetPhone = targetContact.phone;
                    }
                  }
                }

                // Determine the exact number to dial: explicit spoken phoneNumber, or targetPhone from contact resolution
                const finalNumberToCall = phoneNumber || targetPhone || (targetContact ? targetContact.phone : null);

                if (!finalNumberToCall) {
                  triggerHaptic([100, 80, 100]);
                  speakJarvis(
                    `Kripya call lagane ke liye koi phone number bolein (jaise "9876543210 par call lagao") ya saved contact ka naam bolein.`,
                    { lang: speechLang, muted: isMuted }
                  );
                  setActiveTab('contacts');
                  break;
                }

                launchPhoneCall(finalNumberToCall, targetContact?.name || recipientName || finalNumberToCall);
                triggerHaptic([80, 50, 80]);
                playActionExecutedSound();
                setActiveCall({
                  contact: targetContact || {
                    id: 'spoken-number',
                    name: recipientName || finalNumberToCall,
                    phone: finalNumberToCall,
                    relation: 'Direct Spoken Number',
                    avatarColor: 'bg-emerald-600',
                  },
                  phoneNumber: finalNumberToCall,
                });
                break;
              }

              case 'setVoiceModel': {
                if (act.args?.model) {
                  setActiveVoiceModel(act.args.model as JarvisVoiceModel);
                  if (act.args.model === 'aoede') {
                    setAvatarView('girl3d');
                  }
                  triggerHaptic([40, 40]);
                }
                break;
              }

              case 'openInstallApp': {
                if (act.args?.tab) {
                  setInstallModalTab(act.args.tab);
                } else {
                  setInstallModalTab('playstore');
                }
                setIsInstallModalOpen(true);
                triggerHaptic([50, 40]);
                break;
              }

              case 'openSettingsTab': {
                setActiveTab('settings');
                triggerHaptic([40, 40]);
                break;
              }

              case 'openHapticCustomizer': {
                const alertType = act.args?.alertType || 'alarm';
                setHapticCustomizerAlert(alertType);
                setIsHapticCustomizerOpen(true);
                triggerHaptic([40, 40]);
                break;
              }

              case 'toggleDarkMode':
              case 'changeTheme':
              case 'setTheme': {
                const requestedTheme = act.args?.themeId as any;
                const nextTheme = requestedTheme
                  ? applyTheme(requestedTheme)
                  : applyTheme(
                      currentTheme.id === 'classic_jarvis'
                        ? 'neon_cyber'
                        : currentTheme.id === 'neon_cyber'
                        ? 'minimalist_slate'
                        : 'classic_jarvis'
                    );
                setCurrentTheme(nextTheme);
                triggerHaptic([40, 60]);
                break;
              }

              case 'searchContacts': {
                const { query, relationship } = act.args;
                const match = resolveContact(query, relationship);
                if (match) {
                  setDossierContact(match.contact);
                  setActiveTab('contacts');
                  triggerHaptic([50]);
                }
                break;
              }

              case 'openContactsView': {
                setActiveTab('contacts');
                triggerHaptic([40]);
                break;
              }

              case 'openMessagesInbox':
              case 'readMessages': {
                setIsMessagesInboxOpen(true);
                triggerHaptic([40, 50]);
                break;
              }

              case 'manageSchedule': {
                const { action, title, time, date, hour, minute, category, integrateNative } = act.args;

                if (action === 'set_alarm') {
                  const newAlarm: ScheduleItem = {
                    id: `alarm-${Date.now()}`,
                    title: title || 'Alarm',
                    time: time || '07:00',
                    date: date || new Date().toISOString().split('T')[0],
                    hour: hour ?? 7,
                    minute: minute ?? 0,
                    category: 'alarm',
                    completed: false,
                    syncedNative: !!integrateNative,
                  };
                  setSchedule((prev) => [newAlarm, ...prev]);
                  if (integrateNative) {
                    setNativeAndroidAlarm(hour ?? 7, minute ?? 0, title || 'JARVIS Alarm');
                  }
                  triggerHaptic([60, 40, 60]);
                } else if (action === 'create_reminder' || action === 'schedule_event') {
                  const newItem: ScheduleItem = {
                    id: `sched-${Date.now()}`,
                    title: title || 'Scheduled Task',
                    time: time || '12:00',
                    date: date || new Date().toISOString().split('T')[0],
                    hour: hour ?? 12,
                    minute: minute ?? 0,
                    category: category || (action === 'schedule_event' ? 'meeting' : 'reminder'),
                    completed: false,
                    syncedNative: !!integrateNative,
                  };
                  setSchedule((prev) => [newItem, ...prev]);
                  if (integrateNative && action === 'schedule_event') {
                    const eventDate = date ? new Date(date) : new Date();
                    if (hour !== undefined && minute !== undefined) {
                      eventDate.setHours(hour, minute, 0, 0);
                    }
                    addNativeCalendarEvent({
                      title: title || 'Scheduled Meeting',
                      startDate: eventDate,
                    });
                  }
                  triggerHaptic([60]);
                }
                break;
              }

              case 'managePhoneSettings': {
                const { setting, action } = act.args;
                if (setting === 'torch') {
                  const turnOn = action === 'on';
                  setTorchActive(turnOn);
                  toggleDeviceTorch(turnOn);
                  triggerHaptic([70]);
                } else if (setting === 'vibrate') {
                  triggerHaptic([200, 100, 200]);
                }
                break;
              }

              case 'sendTextMessage': {
                const { platform, recipientName, messageText } = act.args;
                const match = resolveContact(recipientName);
                const phone = match ? match.targetPhone : recipientName;
                if (platform === 'whatsapp') {
                  launchWhatsApp(phone, messageText);
                } else {
                  launchSms(phone, messageText);
                }
                break;
              }

              case 'openJarvisDualHub':
              case 'starkSuitDiagnostics':
              case 'executiveDraftEmail':
              case 'manageProjectMilestones': {
                setActiveTab('jarvis_hub');
                triggerHaptic([50, 40]);
                break;
              }

              case 'pcControlAction': {
                const actionType = act.args?.actionType || 'pc_open_app';
                setActiveTab('pc_control');
                setPcVoiceTrigger({
                  action: actionType,
                  payload: act.args,
                  timestamp: Date.now(),
                });
                triggerHaptic([60, 40]);
                break;
              }

              case 'playYouTube': {
                const q = act.args?.query || 'Top Trending Bollywood Hit Songs 2024';
                setYouTubeQuery(q);
                setIsYouTubeOpen(true);
                stopJarvisSong();
                setIsSinging(false);
                triggerHaptic([60, 40]);
                playActionExecutedSound();
                launchAndroidApp('youtube', q);
                break;
              }

              case 'maximizePlayer': {
                setYouTubeMaximizeSignal((s) => s + 1);
                setIsYouTubeOpen(true);
                setIsPhoneLocked(false);
                triggerHaptic([60, 40]);
                playActionExecutedSound();
                break;
              }

              case 'stopMusic': {
                setIsYouTubeOpen(false);
                stopJarvisSong();
                setIsSinging(false);
                setActiveSong(null);
                setSingingLyricLine('');
                triggerHaptic([50]);
                break;
              }

              case 'stopListening': {
                setIsListening(false);
                setStatus('idle');
                stopJarvisSpeech();
                stopJarvisSong();
                setIsYouTubeOpen(false);
                triggerHaptic([40, 40]);
                break;
              }

              case 'openGovSchemes':
              case 'openGovSchemesModal': {
                const { query } = act.args || {};
                setGovSchemesInitialQuery(query || '');
                setIsGovSchemesModalOpen(true);
                triggerHaptic([40, 60]);
                break;
              }

              case 'openCscService':
              case 'openPortalService': {
                const { serviceId, url, title } = act.args || {};
                if (
                  serviceId === 'digital-farmer-id' ||
                  serviceId === 'farmer-id' ||
                  serviceId === 'kisan-id' ||
                  serviceId === 'farmer'
                ) {
                  setJansabhaInitialTab('farmer');
                } else if (serviceId === 'csc-sewa' || serviceId === 'csc') {
                  setJansabhaInitialTab('csc');
                } else if (serviceId === 'support' || serviceId === 'customer-service') {
                  setJansabhaInitialTab('support');
                }
                setActiveTab('rp_jansabha');
                triggerHaptic([40, 60]);
                if (url) {
                  setTimeout(() => {
                    try {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } catch (e) {
                      console.warn('Could not launch portal URL automatically', e);
                    }
                  }, 600);
                }
                break;
              }

              case 'openLiveLocation': {
                triggerHaptic([60, 40]);
                playActionExecutedSound();
                purgeErroneousLocationCache();
                getHighAccuracyLiveLocation(6000)
                  .then((liveLoc) => {
                    if (liveLoc && liveLoc.city) {
                      setWeatherData((prev) => (prev ? { ...prev, city: liveLoc.city } : null));
                    }
                    openGoogleMapsLiveLocation({ lat: liveLoc.latitude, lon: liveLoc.longitude });
                  })
                  .catch(() => {
                    openGoogleMapsLiveLocation(null);
                  });
                break;
              }

              case 'openApp': {
                const { appName, query } = act.args;
                setPcVoiceTrigger({
                  action: 'pc_open_app',
                  payload: { appName, query },
                  timestamp: Date.now(),
                });
                if ((appName || '').toLowerCase() === 'camera') {
                  triggerHaptic([60, 40]);
                  setIsCameraOpen(true);
                } else if ((appName || '').toLowerCase() === 'settings') {
                  triggerHaptic([50]);
                  setActiveTab('settings');
                } else if ((appName || '').toLowerCase() === 'playstore' || (appName || '').toLowerCase() === 'install') {
                  triggerHaptic([50]);
                  setInstallModalTab('playstore');
                  setIsInstallModalOpen(true);
                } else if ((appName || '').toLowerCase() === 'maps') {
                  triggerHaptic([60, 40]);
                  playActionExecutedSound();
                  purgeErroneousLocationCache();
                  const qLower = (query || '').toLowerCase();
                  const isLiveGps =
                    !query ||
                    query === 'current_live_gps' ||
                    qLower.includes('live') ||
                    qLower.includes('current') ||
                    qLower.includes('hasanpur') ||
                    qLower.includes('meri');

                  if (isLiveGps) {
                    getHighAccuracyLiveLocation(4000)
                      .then((liveLoc) => {
                        if (liveLoc && liveLoc.city) {
                          setWeatherData((prev) => (prev ? { ...prev, city: liveLoc.city } : null));
                        }
                        openGoogleMapsLiveLocation({ lat: liveLoc.latitude, lon: liveLoc.longitude });
                      })
                      .catch(() => {
                        openGoogleMapsLiveLocation(null);
                      });
                  } else {
                    launchAndroidApp('maps', query);
                  }
                } else if ((appName || '').toLowerCase() === 'youtube') {
                  const q = query || 'Top Trending Bollywood Hit Songs 2024';
                  setYouTubeQuery(q);
                  setIsYouTubeOpen(true);
                  stopJarvisSong();
                  setIsSinging(false);
                  triggerHaptic([60, 40]);
                  playActionExecutedSound();
                  launchAndroidApp('youtube', q);
                } else {
                  launchAndroidApp(appName, query);
                }
                break;
              }

              case 'singSong': {
                hasSingingAction = true;
                const { songName } = act.args || {};
                handleStartSinging(songName);
                break;
              }

              case 'openVoiceHelp': {
                triggerHaptic([40, 50]);
                window.dispatchEvent(new CustomEvent('jarvis:open-voice-help'));
                break;
              }

              case 'openVoiceCheatSheet': {
                triggerHaptic([40, 50]);
                setIsVoiceCheatSheetOpen(true);
                break;
              }

              case 'lockPhone': {
                triggerHaptic([60, 40]);
                playPhoneLockSound();
                setIsPhoneLocked(true);
                break;
              }

              case 'unlockPhone': {
                triggerHaptic([40, 80]);
                playPhoneUnlockSound();
                setIsPhoneLocked(false);
                break;
              }

              case 'shutdownPhone': {
                triggerHaptic([80, 50, 80]);
                setIsPhoneShutDown(true);
                setIsPhoneLocked(false);
                setIsListening(false);
                setStatus('idle');
                releaseScreenWakeLock();
                break;
              }

              case 'activateAlwaysOnMode': {
                triggerHaptic([50, 50]);
                setIsPhoneShutDown(false);
                setHandsFreeMode(true);
                setHasGreetedOnStart(true);
                setIsListening(true);
                setStatus('listening');
                requestScreenWakeLock();
                try {
                  localStorage.setItem('jarvis_handsfree_always_on', 'true');
                } catch {}
                break;
              }

              case 'deactivateAlwaysOnMode': {
                triggerHaptic([30, 30]);
                setHandsFreeMode(false);
                setIsListening(false);
                setStatus('idle');
                releaseScreenWakeLock();
                try {
                  localStorage.setItem('jarvis_handsfree_always_on', 'false');
                } catch {}
                break;
              }

              case 'toggleBackgroundBeep': {
                const isEnabled = Boolean(act.args?.enabled);
                setBackgroundBeepEnabled(isEnabled);
                saveWakeWordConfig({ playChime: isEnabled });
                triggerHaptic([30, 40]);
                break;
              }

              case 'openAdminDashboard': {
                triggerHaptic([40, 60]);
                setIsAdminModalOpen(true);
                break;
              }

              case 'openHapticStudio': {
                const targetAlert = (act.args?.alertType as HapticAlertType) || 'alarm';
                setHapticCustomizerAlert(targetAlert);
                setIsHapticCustomizerOpen(true);
                triggerHaptic([30, 40]);
                break;
              }

              case 'openMemoryModal':
              case 'openMemoryCore': {
                const targetTab = act.args?.tab as any;
                setMemoryModalTab(
                  targetTab === 'qa_memory' || targetTab === 'targets' || targetTab === 'kotlin' || targetTab === 'analytics'
                    ? targetTab
                    : 'memories'
                );
                triggerHaptic([40, 50]);
                setIsMemoryModalOpen(true);
                break;
              }

              case 'enableUnlimitedMemory': {
                setUnlimitedMemoryActive(true);
                triggerHaptic([40, 40]);
                break;
              }

              case 'addTarget': {
                const targetTitle = act.args?.title || act.args?.task || act.args?.name;
                if (targetTitle) {
                  saveTarget(targetTitle, {
                    dueDate: act.args?.dueDate,
                    notes: act.args?.notes,
                    category: act.args?.category,
                  });
                }
                triggerHaptic([40, 50]);
                break;
              }

              case 'completeTarget': {
                const targetTitle = act.args?.title || act.args?.id;
                completeTarget(targetTitle);
                triggerHaptic([40, 60]);
                break;
              }

              case 'updateTargetStatus': {
                if (act.args?.id && act.args?.status) {
                  updateTargetStatus(act.args.id, act.args.status, act.args.progressPercent);
                }
                triggerHaptic([30, 40]);
                break;
              }

              case 'deleteTarget': {
                if (act.args?.id || act.args?.title) {
                  deleteTarget(act.args.id || act.args.title);
                }
                triggerHaptic([30]);
                break;
              }

              case 'syncMemory':
              case 'saveMemoryItem': {
                const key = act.args?.key || act.args?.memory?.key;
                const value = act.args?.value || act.args?.memory?.value;
                const category = act.args?.category || act.args?.memory?.category;
                if (key && value) {
                  saveMemory(key, value, category);
                  setMemories(getStoredMemories());
                  triggerHaptic([30, 40]);
                }
                break;
              }

              case 'deleteMemory':
              case 'deleteMemoryItem': {
                if (act.args?.clearAll || act.args?.key === 'all') {
                  clearAllMemories();
                  setMemories([]);
                } else if (act.args?.key) {
                  deleteMemory(act.args.key);
                  setMemories(getStoredMemories());
                }
                triggerHaptic([30, 30]);
                break;
              }

              case 'clearMemory': {
                clearAllMemories();
                setMemories([]);
                triggerHaptic([40, 30]);
                break;
              }

              case 'openPowerButtonGuide': {
                triggerHaptic([40, 50]);
                setIsPowerGuideOpen(true);
                break;
              }

              case 'openScheduleView': {
                triggerHaptic([40]);
                setActiveTab('schedule');
                break;
              }

              case 'exportInteractionHistory': {
                triggerHaptic([30, 40]);
                const exportPayload = {
                  system: 'J.A.R.V.I.S. AI Command Core',
                  exportedAt: new Date().toISOString(),
                  totalRecords: commandHistory.length,
                  interactions: commandHistory.map((item, index) => ({
                    index: index + 1,
                    query: item.query,
                    response: item.response,
                    timestamp: item.timestamp,
                    actions: item.actions || [],
                  })),
                };
                const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify(exportPayload, null, 2)
                )}`;
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute('href', jsonString);
                const dateStamp = new Date().toISOString().slice(0, 10);
                downloadAnchor.setAttribute(
                  'download',
                  `jarvis-command-history-${dateStamp}.json`
                );
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
                break;
              }
            }
          } catch (execErr) {
            console.warn(`Error executing tool action ${act.name}:`, execErr);
          }
        }
      }

      // Add to command history with explicit date and timestamp
      const nowCmd = new Date();
      setCommandHistory((prev) => [
        {
          query: commandText,
          response: spokenReply,
          timestamp: nowCmd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: nowCmd.toISOString().slice(0, 10),
          isoDate: nowCmd.toISOString(),
          actions,
        },
        ...prev.slice(0, 99),
      ]);

      // Persist Question & Answer into JARVIS Long-Term Conversation Memory & 10-Item Fast Cache
      saveQaMemory(commandText, spokenReply);
      storeGeminiAnswer(commandText, spokenReply);

      // Record successful AI command into the Master Audit Log
      const durationMs = Math.round(performance.now() - commandExecutionStartTime);
      recordCommandAudit({
        commandText,
        status: 'success',
        executionTimeMs: durationMs,
        actionsExecuted: (actions || []).map((a: any) => `${a.name}${a.args?.appName ? ` (${a.args.appName})` : ''}`),
        responsePreview: spokenReply,
        sentiment: detectedSentiment.sentiment,
        triggeredBy: voiceSample ? 'User (Voice)' : 'User (Text / UI)',
        modelUsed: 'Gemini 3.8 Flash / Hybrid Core',
      });

      // Speak response if not muted
      const resumeHandsFreeListening = () => {
        if (handsFreeMode) {
          setTimeout(() => {
            // Ensure speech synthesis and audio buffers are completely idle before re-enabling microphone
            if (isJarvisSpeaking() || (typeof window !== 'undefined' && window.speechSynthesis?.speaking)) {
              setTimeout(resumeHandsFreeListening, 450);
              return;
            }
            setIsListening(true);
            setStatus('listening');
          }, 850);
        } else {
          setStatus('idle');
        }
      };

      if (!isMuted) {
        if (!hasSingingAction) {
          setStatus('speaking');
          speakJarvis(spokenReply, {
            lang: speechLang,
            pitch: detectedSentiment.toneConfig.speechPitch,
            rate: detectedSentiment.toneConfig.speechRate,
            muted: isMuted,
            onEnd: resumeHandsFreeListening,
          });
        }
      } else {
        resumeHandsFreeListening();
      }
    } catch (err: any) {
      console.error('Command execution error:', err);
      setStatus('idle');

      // Record failed AI command with root cause pattern into Master Audit Log
      const durationMs = Math.round(performance.now() - commandExecutionStartTime);
      const diagnosis = diagnoseErrorPattern(err?.message, commandText);
      recordCommandAudit({
        commandText,
        status: 'failed',
        errorMessage: err?.message || 'Command execution exception occurred',
        errorPattern: diagnosis.pattern,
        errorCategory: diagnosis.category,
        remediation: diagnosis.remediation,
        executionTimeMs: durationMs,
        triggeredBy: voiceSample ? 'User (Voice)' : 'User (Text / UI)',
        modelUsed: 'Gemini 3.8 Flash / Error Resolver',
      });

      const errReply = 'Ji, mai sun nahi paayi. Kya aap ek baar dobara bol sakte hain?';
      setLastSpokenText(errReply);
      if (!isMuted) {
        speakJarvis(errReply, {
          lang: speechLang,
          muted: isMuted,
          onEnd: () => {
            if (handsFreeMode) {
              setTimeout(() => {
                if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
                  return;
                }
                setIsListening(true);
                setStatus('listening');
              }, 650);
            } else {
              setStatus('idle');
            }
          },
        });
      }
    }
  };

  const handleSpeakWeatherReport = (speechText: string) => {
    triggerHaptic([30, 30]);
    setLastSpokenText(speechText);
    if (!isMuted) {
      setStatus('speaking');
      speakJarvis(speechText, {
        lang: speechLang,
        muted: isMuted,
        onEnd: () => {
          if (handsFreeMode) {
            setTimeout(() => {
              setIsListening(true);
              setStatus('listening');
            }, 550);
          } else {
            setStatus('idle');
          }
        },
      });
    }
  };

  const handlePlayMorningBriefing = (customText?: string) => {
    triggerHaptic([40, 40]);
    const { speechText } = buildMorningBriefingText(schedule, weatherData);
    const textToSpeak = customText || speechText;
    setLastSpokenText(textToSpeak);
    if (!isMuted) {
      setStatus('speaking');
      speakJarvis(textToSpeak, {
        lang: speechLang,
        muted: isMuted,
        onEnd: () => {
          if (handsFreeMode) {
            setTimeout(() => {
              setIsListening(true);
              setStatus('listening');
            }, 550);
          } else {
            setStatus('idle');
          }
        },
      });
    }
  };

  const handleSpeakNewsSummary = (summaryText: string) => {
    triggerHaptic([30, 30]);
    setLastSpokenText(summaryText);
    if (!isMuted) {
      setStatus('speaking');
      speakJarvis(summaryText, {
        lang: speechLang,
        muted: isMuted,
        onEnd: () => {
          if (handsFreeMode) {
            setTimeout(() => {
              setIsListening(true);
              setStatus('listening');
            }, 550);
          } else {
            setStatus('idle');
          }
        },
      });
    }
  };

  const handleMarkMessageAsRead = (id: string) => {
    setIncomingMessages((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, read: true } : m));
      try {
        localStorage.setItem('jarvis_incoming_messages', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleMarkAllMessagesAsRead = () => {
    setIncomingMessages((prev) => {
      const updated = prev.map((m) => ({ ...m, read: true }));
      try {
        localStorage.setItem('jarvis_incoming_messages', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleSendMessage = (recipientPhone: string, text: string, channel: 'sms' | 'whatsapp') => {
    const contact = contacts.find((c) => c.phone === recipientPhone);
    const newMessage: IncomingMessage = {
      id: `out-${Date.now()}`,
      senderName: 'You (Sent)',
      senderPhone: recipientPhone,
      relation: contact?.name ? `To: ${contact.name}` : undefined,
      text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      channel,
      read: true,
      avatarColor: '#6366f1',
    };
    setIncomingMessages((prev) => {
      const updated = [newMessage, ...prev];
      try {
        localStorage.setItem('jarvis_incoming_messages', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleSimulateIncomingMessage = useCallback(() => {
    const sampleSenders = [
      { name: 'Papa', phone: '+91 98765 43210', relation: 'Father', text: 'Beta ghar aate waqt fresh fruits lete aana.', avatarColor: '#10b981' },
      { name: 'Sharma Ji', phone: '+91 98123 45678', relation: 'Friend', text: 'Bhai kal sham ko chai pe milte hain! Ready rehna.', avatarColor: '#06b6d4' },
      { name: 'Anjali', phone: '+91 94567 89012', relation: 'Colleague', text: 'Project notes share kar diye hain. Check kar lena.', avatarColor: '#ec4899' },
    ];
    const picked = sampleSenders[Math.floor(Math.random() * sampleSenders.length)];
    const newMsg: IncomingMessage = {
      id: `in-${Date.now()}`,
      senderName: picked.name,
      senderPhone: picked.phone,
      relation: picked.relation,
      text: picked.text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      channel: Math.random() > 0.5 ? 'whatsapp' : 'sms',
      read: false,
      avatarColor: picked.avatarColor,
    };
    setIncomingMessages((prev) => {
      const updated = [newMsg, ...prev];
      try {
        localStorage.setItem('jarvis_incoming_messages', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    // Fire user-customized tactile pattern for incoming message alert
    triggerAlertHaptic('message');
  }, []);

  const handleStartJarvisGreeting = () => {
    triggerHaptic([40, 40]);
    const greeting = 'Ram Ram ji! Mai aapki personal AI assistant Jarvis hu. Bataiye aaj mai aapki kya seva ya madad kar sakti hu?';
    setLastSpokenText(greeting);
    setHasGreetedOnStart(true);
    if (!isMuted) {
      setStatus('speaking');
      speakJarvis(greeting, {
        lang: speechLang,
        muted: isMuted,
        onEnd: () => {
          if (handsFreeMode) {
            setTimeout(() => {
              setIsListening(true);
              setStatus('listening');
            }, 550);
          } else {
            setStatus('idle');
          }
        },
      });
    }
  };

  // Universal Link Action & Subject Runner Listener
  useEffect(() => {
    const handleLinkAction = (e: any) => {
      if (e.detail) {
        setActiveSubjectAction(e.detail);
        setTimeout(() => {
          setActiveSubjectAction((cur) => (cur === e.detail ? null : cur));
        }, 14000);
      }
    };
    window.addEventListener('jarvis:open-link', handleLinkAction);
    return () => window.removeEventListener('jarvis:open-link', handleLinkAction);
  }, []);

  // Screen Wake Lock & Continuous Background Mode: Keeps screen alive without sleeping like on PC
  useEffect(() => {
    if (handsFreeMode && !isPhoneShutDown) {
      requestScreenWakeLock();
    } else {
      releaseScreenWakeLock();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && handsFreeMode && !isPhoneShutDown) {
        requestScreenWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      releaseScreenWakeLock();
    };
  }, [handsFreeMode, isPhoneShutDown]);

  // Persist hands-free mode preference safely
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('jarvis_handsfree_always_on', String(handsFreeMode));
      }
    } catch {}
  }, [handsFreeMode]);

  // Stable callback handlers for voice controller & lock screen
  const handleStartVoiceListening = useCallback(async () => {
    setHasGreetedOnStart(true);
    stopJarvisSpeech();
    setIsListening(true);
    setStatus('listening');
  }, []);

  const handleStopVoiceListening = useCallback(() => {
    setIsListening(false);
    setStatus('idle');
  }, []);

  // Simulate voice command demonstration ("Try it" button from Cheat Sheet)
  const handleSimulateVoiceCommand = useCallback(
    (commandPhrase: string) => {
      if (!commandPhrase || !commandPhrase.trim()) return;
      const cleanPhrase = commandPhrase.trim();

      // 1. Close full modal overlay so the user can watch the voice visualizer, phone action, and Jarvis speak
      setIsVoiceCheatSheetOpen(false);

      // 2. Play trigger chime and initialize voice listening state
      playBeepSound();
      triggerHaptic([30, 40]);
      setIsListening(true);
      setStatus('listening');
      setLiveSpeechTranscript('');
      setLiveAudioLevel(55);
      setSimulatedVoiceDemo({ phrase: cleanPhrase });

      // 3. Incrementally animate words appearing in voice transcript as if spoken
      const words = cleanPhrase.split(' ');
      let currentIdx = 0;
      let accumulated = '';
      const wordDelay = Math.max(100, Math.min(220, Math.floor(650 / Math.max(1, words.length))));

      const timer = setInterval(() => {
        if (currentIdx < words.length) {
          accumulated += (currentIdx > 0 ? ' ' : '') + words[currentIdx];
          setLiveSpeechTranscript(accumulated);
          setLiveAudioLevel(Math.floor(70 + Math.random() * 25));
          currentIdx++;
        } else {
          clearInterval(timer);
          setLiveSpeechTranscript(cleanPhrase);
          setLiveAudioLevel(30);

          // 4. Brief pause after simulated speech finishes before executing the command
          setTimeout(() => {
            setIsListening(false);
            setSimulatedVoiceDemo(null);
            setStatus('processing');
            handleExecuteJarvisCommand(cleanPhrase, {
              avgVolume: 85,
              peakVolume: 96,
              durationMs: 1200,
            });
          }, 350);
        }
      }, wordDelay);
    },
    [handleExecuteJarvisCommand]
  );
  handleSimulateVoiceCommandRef.current = handleSimulateVoiceCommand;

  // Activate Always-Online Hands-Free Jarvis
  const handleActivateAlwaysOnlineJarvis = async () => {
    setHandsFreeMode(true);
    setHasGreetedOnStart(true);
    triggerHaptic([40, 60]);
    playBeepSound();

    const greeting =
      'Ram Ram ji! Mai aapki AI assistant Jarvis hu. Mai ab voice se connect ho chuki hu, aap bina click kare mujhse seedhe bol kar koi bhi subject ya app run karwa sakte hain!';
    setLastSpokenText(greeting);
    setStatus('speaking');

    if (!isMuted) {
      speakJarvis(greeting, {
        lang: speechLang,
        muted: isMuted,
        onStart: () => setStatus('speaking'),
        onEnd: () => {
          setTimeout(async () => {
            await handleStartVoiceListening();
          }, 350);
        },
      });
    } else {
      await handleStartVoiceListening();
    }
  };

  const handleToggleListening = async () => {
    setHasGreetedOnStart(true);
    if (isListening) {
      handleStopVoiceListening();
    } else {
      await handleStartVoiceListening();
    }
  };

  const handleToggleTorch = () => {
    const next = !torchActive;
    setTorchActive(next);
    toggleDeviceTorch(next);
    triggerHaptic([50]);
  };

  const handleStopSpeaking = () => {
    stopJarvisSpeech();
    setStatus('idle');
  };

  const handleRepeatSpeech = () => {
    if (!lastSpokenText || isMuted) return;
    setStatus('speaking');
    speakJarvis(lastSpokenText, {
      lang: speechLang,
      pitch: activeSentiment?.toneConfig.speechPitch,
      rate: activeSentiment?.toneConfig.speechRate,
      muted: isMuted,
      force: true,
      onEnd: () => setStatus('idle'),
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col antialiased font-sans transition-colors duration-300"
      style={{
        backgroundColor: 'var(--theme-bg-base)',
        color: 'var(--theme-text-primary)',
      }}
    >
      {/* Active Alarm Modal Overlay */}
      <AlarmRingingOverlay
        activeAlarm={activeRingingAlarm}
        onDismiss={() => {
          setActiveRingingAlarm(null);
          stopJarvisSpeech();
        }}
        onSnooze={(minutes) => {
          if (activeRingingAlarm && typeof activeRingingAlarm.time === 'string') {
            const timeParts = activeRingingAlarm.time.split(':');
            const h = parseInt(timeParts[0] || '8', 10);
            const m = parseInt(timeParts[1] || '0', 10);
            const safeH = isNaN(h) ? 8 : h;
            const safeM = isNaN(m) ? 0 : m;
            let newMin = safeM + minutes;
            let newHour = safeH;
            if (newMin >= 60) {
              newHour = (newHour + Math.floor(newMin / 60)) % 24;
              newMin = newMin % 60;
            }
            const newTimeStr = `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
            setSchedule((prev) =>
              prev.map((s) => (s.id === activeRingingAlarm.id ? { ...s, time: newTimeStr, notified: false } : s))
            );
          }
          setActiveRingingAlarm(null);
          stopJarvisSpeech();
        }}
      />

      {/* TOP APP BAR - Dynamic Theme Styled */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-3 sm:px-6 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--theme-bg-surface)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & Status */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all shadow-md"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: currentTheme.id === 'minimalist_slate' ? '#0f172a' : '#ffffff',
                boxShadow: 'var(--theme-glow)',
              }}
            >
              J
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white tracking-wide">JARVIS</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase tracking-wider bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  ONLINE
                </span>
                <span
                  className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border transition-all"
                  style={{
                    backgroundColor: 'rgba(var(--theme-primary-rgb), 0.15)',
                    borderColor: 'var(--theme-border-accent)',
                    color: 'var(--theme-primary-hover)',
                  }}
                >
                  {currentTheme.name}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Android AI Assistant • {handsFreeMode ? 'Voice Online (Always-On)' : 'Touch Mode'}
              </span>
            </div>
          </div>

          {/* Quick Controls Bar */}
          <div className="flex items-center gap-2">
            {/* Camera Button */}
            <button
              id="btn-quick-camera"
              onClick={() => {
                triggerHaptic([40]);
                setIsCameraOpen(true);
              }}
              title="Open Camera"
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sky-400 hover:text-sky-300 hover:bg-slate-700 transition-all"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Flashlight Button */}
            <button
              id="btn-quick-torch"
              onClick={handleToggleTorch}
              title={torchActive ? 'Turn Torch Off' : 'Turn Torch On'}
              className={`p-2 rounded-xl transition-all ${
                torchActive
                  ? 'bg-amber-500/20 border border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Flashlight className="w-4 h-4" />
            </button>

            {/* Quick Phone Lock Button */}
            <button
              id="btn-quick-lock-phone"
              onClick={() => {
                triggerHaptic([60, 40]);
                playPhoneLockSound();
                setIsPhoneLocked(true);
              }}
              title="Lock Phone Screen (फोन लॉक करें - बोलें 'Phone lock karo')"
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-rose-400 hover:text-rose-300 hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Voice Mute / Unmute Button with ambient noise indicator */}
            <div className="relative">
              <button
                id="btn-voice-mute"
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  if (next) stopJarvisSpeech();
                  triggerHaptic([30]);
                }}
                title={
                  isMuted
                    ? 'Voice Muted (Click to Unmute)'
                    : ambientNoise.isTooLoud
                    ? `⚠️ High Ambient Noise (~${ambientNoise.approxDb} dB) - Click to Mute for Clarity`
                    : 'Voice Audio Active (Click to Mute)'
                }
                className={`p-2 rounded-xl transition-all relative ${
                  isMuted
                    ? 'bg-rose-500/20 border border-rose-500 text-rose-300'
                    : ambientNoise.isTooLoud
                    ? 'bg-amber-500/25 border border-amber-400/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse'
                    : 'bg-slate-800/80 border border-slate-700 text-cyan-400 hover:text-cyan-300'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {ambientNoise.isTooLoud && !isMuted && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            </div>

            {/* Jarvis AI Response Language Dropdown Menu (English, Hindi, Hinglish) */}
            <JarvisLanguageDropdown
              currentLanguage={aiResponseLanguage}
              onSelectLanguage={handleSelectResponseLanguage}
            />

            {/* Interactive Memory Core Button */}
            <button
              id="btn-memory-core"
              onClick={() => {
                triggerHaptic([40]);
                setIsMemoryModalOpen(true);
              }}
              title="Open JARVIS Interactive Memory Core & Kotlin Bridge"
              className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-900/60 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="text-xs font-semibold hidden sm:inline">Memory</span>
            </button>

            {/* Master Admin Dashboard Button (Only for Admin - Rovin Pal) */}
            <button
              id="btn-admin-dashboard-header"
              onClick={() => {
                triggerHaptic([40]);
                setIsAdminModalOpen(true);
              }}
              title="Open Admin Dashboard Panel (Restricted: Only for Admin - Rovin Pal)"
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-300 hover:text-white hover:bg-amber-900/60 transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold hidden sm:inline">Admin</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                Only Admin
              </span>
            </button>

            {/* Quick QR Code & Link Share Button */}
            <button
              id="btn-quick-qr-link"
              onClick={() => {
                triggerHaptic([30]);
                setInstallModalTab('friend');
                setIsInstallModalOpen(true);
              }}
              title="Generate QR Code & Copy Share Link"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:text-white hover:border-emerald-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold hidden sm:inline">QR & Link</span>
            </button>

            {/* Voice Command Cheat Sheet Overlay Button */}
            <button
              id="btn-voice-commands-sheet"
              onClick={() => {
                triggerHaptic([30]);
                setIsVoiceCheatSheetOpen(true);
              }}
              title="Open Voice Command Cheat Sheet & Search Catalog"
              className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 hover:text-white hover:border-rose-400 transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(244,63,94,0.2)] cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-bold hidden sm:inline">Commands</span>
            </button>

            {/* Install / Download App on Home Screen & Share Button */}
            <button
              id="btn-install-app"
              onClick={() => {
                triggerHaptic([40]);
                setIsInstallModalOpen(true);
              }}
              title="Install JARVIS APK / App on Phone & Share"
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-400/50 text-cyan-300 hover:text-white hover:border-cyan-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              <span className="text-xs font-bold">APK / Install</span>
            </button>

            {/* Live Time, Date & Battery status */}
            <div className="flex items-center gap-2">
              <div
                onClick={() => {
                  triggerHaptic([30]);
                  handleExecuteJarvisCommand('time date battery health batao');
                }}
                title="Tap for Voice Time, Date & Battery"
                className="cursor-pointer flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 transition-all active:scale-95"
              >
                <div className="flex items-center gap-1 font-mono text-cyan-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentClock.time}</span>
                </div>
                <span className="text-slate-500 hidden md:inline">•</span>
                <span className="text-[11px] text-slate-400 hidden md:inline">{currentClock.date}</span>
                <span className="text-slate-500">•</span>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Battery className="w-3.5 h-3.5" />
                  <span className="text-slate-200">{batteryLevel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS - 5-Tab Segmented Switcher */}
      <nav
        className="border-b px-2 sm:px-4 py-2 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--theme-bg-surface)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          <button
            id="tab-btn-assistant"
            onClick={() => setActiveTab('assistant')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'assistant'
                ? 'border shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            style={
              activeTab === 'assistant'
                ? {
                    backgroundColor: 'rgba(var(--theme-primary-rgb), 0.15)',
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-text-accent)',
                    boxShadow: '0 0 12px rgba(var(--theme-primary-rgb), 0.25)',
                  }
                : {}
            }
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Voice Assistant</span>
          </button>

          <button
            id="tab-btn-jarvis-hub"
            onClick={() => {
              triggerHaptic([30]);
              setActiveTab('jarvis_hub');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'jarvis_hub'
                ? 'border shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            style={
              activeTab === 'jarvis_hub'
                ? {
                    backgroundColor: 'rgba(var(--theme-primary-rgb), 0.2)',
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-text-accent)',
                    boxShadow: '0 0 12px rgba(var(--theme-primary-rgb), 0.3)',
                  }
                : {}
            }
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>J.A.R.V.I.S. Core (MCU & Exec)</span>
          </button>

          <button
            id="tab-btn-pc-control"
            onClick={() => setActiveTab('pc_control')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pc_control'
                ? 'border shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            style={
              activeTab === 'pc_control'
                ? {
                    backgroundColor: 'rgba(var(--theme-primary-rgb), 0.15)',
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-text-accent)',
                    boxShadow: '0 0 12px rgba(var(--theme-primary-rgb), 0.25)',
                  }
                : {}
            }
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>🖥️ PC Control (Beast)</span>
          </button>

          <button
            id="tab-btn-contacts"
            onClick={() => setActiveTab('contacts')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'contacts'
                ? 'border shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            style={
              activeTab === 'contacts'
                ? {
                    backgroundColor: 'rgba(var(--theme-primary-rgb), 0.15)',
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-text-accent)',
                    boxShadow: '0 0 12px rgba(var(--theme-primary-rgb), 0.25)',
                  }
                : {}
            }
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts ({contacts.length})</span>
          </button>

          <button
            id="tab-btn-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'border shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            style={
              activeTab === 'schedule'
                ? {
                    backgroundColor: 'rgba(var(--theme-primary-rgb), 0.15)',
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-text-accent)',
                    boxShadow: '0 0 12px rgba(var(--theme-primary-rgb), 0.25)',
                  }
                : {}
            }
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Alarms ({schedule.filter((s) => !s.completed).length})</span>
          </button>

          <button
            id="tab-btn-rp-jansabha"
            onClick={() => {
              triggerHaptic([30]);
              setActiveTab('rp_jansabha');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rp_jansabha'
                ? 'border shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            style={
              activeTab === 'rp_jansabha'
                ? {
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderColor: '#f59e0b',
                    color: '#fef08a',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
                  }
                : {}
            }
          >
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>🏛️ RP Jansabha (Kisan & Govt)</span>
          </button>

          <button
            id="tab-btn-settings"
            onClick={() => {
              triggerHaptic([30]);
              setActiveTab('settings');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            style={
              activeTab === 'settings'
                ? {
                    backgroundColor: 'rgba(var(--theme-primary-rgb), 0.15)',
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-text-accent)',
                    boxShadow: '0 0 12px rgba(var(--theme-primary-rgb), 0.25)',
                  }
                : {}
            }
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* POPUP CONTACT DOSSIER (When user says "Dr. Sharma ka number" or "Dad ko call lagao") */}
        {dossierContact && (
          <div className="w-full bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow flex-shrink-0"
                style={{ backgroundColor: dossierContact.avatarColor || '#0891b2' }}
              >
                {dossierContact.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{dossierContact.name}</h4>
                  {dossierContact.relation && (
                    <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {dossierContact.relation}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {dossierContact.phone} ({dossierContact.phoneType || 'mobile'})
                  {dossierContact.secondaryPhone && ` • ${dossierContact.secondaryPhone} (work)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerHaptic([50]);
                  launchPhoneCall(dossierContact.phone);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Mobile</span>
              </button>

              <button
                onClick={() => launchWhatsApp(dossierContact.phone, `Hello ${dossierContact.name}`)}
                className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 active:scale-95"
                title="Send WhatsApp Message"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDossierContact(null)}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: MAIN ASSISTANT (Professional, Clean AI View) */}
        {activeTab === 'assistant' && (
          <div className="flex flex-col gap-6">
            {/* Card 1: Sleek AI Avatar Visualizer & Hands-Free Interaction Hub */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-3xl p-4 sm:p-7 backdrop-blur-xl shadow-xl relative overflow-hidden">
              
              {/* Visualizer Mode Switcher (Pink Rose Girl Avatar vs Arc Core) & Hands-Free Pill */}
              <div className="w-full flex items-center justify-between mb-2 px-1 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-850 rounded-2xl flex-wrap">
                  <button
                    id="btn-switch-girl-avatar"
                    type="button"
                    onClick={() => {
                      setAvatarView('girl3d');
                      setActiveVoiceModel('aoede');
                      try {
                        localStorage.setItem('jarvis_avatar_view', 'girl3d');
                      } catch {}
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      avatarView === 'girl3d'
                        ? 'bg-pink-500/25 text-pink-200 border border-pink-400/80 shadow-[0_0_15px_rgba(244,114,182,0.4)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>👩 Jarvis Girl AI (Live Voice Avatar)</span>
                  </button>
                  <button
                    id="btn-switch-ironman-avatar"
                    type="button"
                    onClick={() => {
                      setAvatarView('ironman');
                      try {
                        localStorage.setItem('jarvis_avatar_view', 'ironman');
                      } catch {}
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      avatarView === 'ironman'
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🤖 Iron Man Suit (Face)</span>
                  </button>
                  <button
                    id="btn-switch-tony-avatar"
                    type="button"
                    onClick={() => {
                      setAvatarView('tonyface');
                      try {
                        localStorage.setItem('jarvis_avatar_view', 'tonyface');
                      } catch {}
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      avatarView === 'tonyface'
                        ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>⚡ Tony Jarvis</span>
                  </button>
                  <button
                    id="btn-switch-pc-control"
                    type="button"
                    onClick={() => setActiveTab('pc_control')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/30 active:scale-95 cursor-pointer"
                    title="Open Full PC Control Workspace (Mouse, Keyboard & Python Daemon)"
                  >
                    <Monitor className="w-3 h-3 text-cyan-400" />
                    <span>🖥️ PC Beast Mode</span>
                  </button>
                </div>

                {/* Hands-Free & Voice Connection status toggle */}
                <div className="flex items-center gap-2">
                  <button
                    id="btn-app-toggle-voice-connect"
                    type="button"
                    onClick={handleToggleListening}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                      isListening
                        ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse'
                        : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 hover:border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    }`}
                    title={isListening ? 'Voice connect hai (Click to Stop)' : 'Awaaz connect karein (Click to Start Listening)'}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isListening ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                      }`}
                    />
                    <span>{isListening ? '🟢 Voice Connected' : '⚡ Connect Voice'}</span>
                  </button>

                  <button
                    id="btn-app-toggle-handsfree"
                    type="button"
                    onClick={() => {
                      const next = !handsFreeMode;
                      setHandsFreeMode(next);
                      if (next && !isListening) {
                        handleActivateAlwaysOnlineJarvis();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                      handsFreeMode
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-slate-900/80 border-slate-750 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Continuous Voice: ON me bina touch kare bolte rahein (Always-On like PC)"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        handsFreeMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    />
                    <span>{handsFreeMode ? '🎙️ Always-On: ONLINE' : '👆 Offline / Touch Mode'}</span>
                  </button>
                </div>
              </div>

              {/* Jarvis Mood Indicator */}
              <div className="w-full flex justify-center mb-3">
                <JarvisMoodIndicator
                  currentMood={currentMood}
                  activeSentiment={activeSentiment}
                  onSelectMood={(m) => setManualMood(m)}
                />
              </div>

              {/* Main Avatar / Core Render with Smooth Fade, Scale & Dynamic Mood Glow */}
              <div className="w-full flex flex-col items-center justify-center relative min-h-[360px]">
                {/* Dynamic Ambient Color Mood Glow Aura around the avatar */}
                <div
                  className="absolute -inset-3 sm:-inset-6 rounded-3xl pointer-events-none transition-all duration-100 ease-out blur-3xl z-0"
                  style={{
                    transform: status === 'speaking' ? `scale(${1 + (liveAudioLevel / 100) * 0.12})` : undefined,
                    opacity: status === 'speaking' ? 0.65 + (liveAudioLevel / 100) * 0.35 : 0.75,
                    background: `radial-gradient(ellipse at 50% 50%, ${currentMood.glowColor} 0%, rgba(15, 23, 42, 0) 72%)`,
                    boxShadow: currentMood.ambientBoxShadow,
                  }}
                />

                <AnimatePresence mode="wait" initial={false}>
                  {avatarView === 'ironman' ? (
                    <motion.div
                      key="avatar-ironman"
                      initial={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full flex flex-col items-center relative z-10"
                    >
                      <IronManSuitFace
                        status={status}
                        isListening={isListening}
                        handsFreeMode={handsFreeMode}
                        onToggleListen={handleToggleListening}
                        onToggleHandsFree={() => setHandsFreeMode(!handsFreeMode)}
                        moodConfig={currentMood}
                        onExecuteCommand={handleExecuteJarvisCommand}
                        lastSpokenText={lastSpokenText}
                        liveSpeechTranscript={liveSpeechTranscript}
                      />
                    </motion.div>
                  ) : avatarView === 'tonyface' ? (
                    <motion.div
                      key="avatar-tonyface"
                      initial={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full flex flex-col items-center relative z-10"
                    >
                      <TonyJarvisFace
                        status={status}
                        isListening={isListening}
                        handsFreeMode={handsFreeMode}
                        onToggleListen={handleToggleListening}
                        onToggleHandsFree={() => setHandsFreeMode(!handsFreeMode)}
                        moodConfig={currentMood}
                        onExecuteCommand={handleExecuteJarvisCommand}
                        lastSpokenText={lastSpokenText}
                        liveSpeechTranscript={liveSpeechTranscript}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="avatar-girl3d"
                      initial={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full flex flex-col items-center relative z-10"
                    >
                      <GirlAssistant3D
                        status={status}
                        isListening={isListening}
                        handsFreeMode={handsFreeMode}
                        onToggleListen={handleToggleListening}
                        onToggleHandsFree={() => setHandsFreeMode(!handsFreeMode)}
                        initialViewMode="illustration"
                        isSinging={isSinging}
                        activeSongTitle={activeSong?.title}
                        activeSongArtist={activeSong?.artistOrFilm}
                        currentLyricLine={singingLyricLine}
                        onSingSong={(songId) => handleStartSinging(songId)}
                        onStopSong={handleStopSinging}
                        onNextSong={handleNextSong}
                        moodConfig={currentMood}
                        onExecuteCommand={handleExecuteJarvisCommand}
                        lastSpokenText={lastSpokenText}
                        liveSpeechTranscript={liveSpeechTranscript}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Real-Time Dynamic Audio Waveform Visualizer below Avatar Face */}
              <div className="w-full max-w-2xl mt-3">
                <AudioWaveformVisualizer
                  isListening={isListening}
                  transcript={liveSpeechTranscript}
                  audioLevel={liveAudioLevel}
                  defaultMode="bars"
                  height={90}
                  isMuted={isMuted}
                  onEnableMuted={handleEnableMutedFromSuggestion}
                  onAmbientNoiseChange={(noise) => {
                    setAmbientNoise(noise);
                    if (noise.isTooLoud && !isMuted) {
                      setShowAmbientAlert(true);
                      if (autoMuteAlways) {
                        setIsMuted(true);
                        stopJarvisSpeech();
                      }
                    }
                  }}
                />
              </div>

              {/* JARVIS Spoken Response Box */}
              <div className="w-full max-w-2xl mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-cyan-400 tracking-wide uppercase">
                    Jarvis Response
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      id="btn-trigger-morning-briefing"
                      onClick={() => handlePlayMorningBriefing()}
                      title="Play Morning Briefing"
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>Morning Briefing</span>
                    </button>
                    <button
                      id="btn-start-jarvis-greeting"
                      onClick={handleStartJarvisGreeting}
                      title="Start Jarvis / Greet"
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Start / Ram Ram ji</span>
                    </button>
                    {status === 'speaking' && (
                      <button
                        onClick={handleStopSpeaking}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-medium flex items-center gap-1"
                      >
                        <Square className="w-2.5 h-2.5 fill-rose-300" />
                        <span>Stop Voice</span>
                      </button>
                    )}
                    <button
                      onClick={handleRepeatSpeech}
                      disabled={isMuted}
                      title={isMuted ? 'Voice is muted' : 'Listen again'}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 disabled:opacity-30"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeSentiment && activeSentiment.sentiment !== 'neutral' && (
                  <div className="mt-2 mb-1 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-700/80 text-cyan-200 backdrop-blur-md shadow-sm">
                      <span className="text-sm">{activeSentiment.toneConfig.badgeEmoji}</span>
                      <span className="font-semibold text-white">{activeSentiment.toneConfig.label}</span>
                      <span className="text-slate-400 font-mono text-[10px] uppercase">
                        • {activeSentiment.sentiment} ({activeSentiment.toneConfig.mode})
                      </span>
                    </span>
                  </div>
                )}

                <p className="text-sm sm:text-base font-normal text-slate-100 leading-relaxed min-h-[44px] flex items-center justify-center px-2">
                  "{lastSpokenText}"
                </p>
              </div>

              {/* Auto-Mute Ambient Noise Suggestion Alert */}
              {showAmbientAlert && !isMuted && ambientNoise.isTooLoud && (
                <div className="w-full mt-3">
                  <AmbientNoiseAlert
                    ambientNoise={ambientNoise}
                    isMuted={isMuted}
                    onEnableMuted={handleEnableMutedFromSuggestion}
                    onDismiss={() => setShowAmbientAlert(false)}
                    onToggleAutoMutePreference={(enabled) => setAutoMuteAlways(enabled)}
                    autoMuteEnabled={autoMuteAlways}
                  />
                </div>
              )}

              {/* Voice & Text Input Bar */}
              <div className="w-full mt-4">
                <VoiceController
                  isListening={isListening}
                  onStartListening={handleStartVoiceListening}
                  onStopListening={handleStopVoiceListening}
                  onSendCommand={handleExecuteJarvisCommand}
                  isProcessing={status === 'processing'}
                  isSpeaking={status === 'speaking'}
                  speechLang={speechLang}
                  onChangeLang={setSpeechLang}
                  responseLanguage={aiResponseLanguage}
                  onSelectResponseLanguage={handleSelectResponseLanguage}
                  handsFreeMode={handsFreeMode}
                  onToggleHandsFree={() => setHandsFreeMode(!handsFreeMode)}
                  activeSentiment={activeSentiment}
                  isMuted={isMuted}
                  onEnableMuted={handleEnableMutedFromSuggestion}
                  onAmbientNoiseChange={(noise) => {
                    setAmbientNoise(noise);
                    if (noise.isTooLoud && !isMuted) {
                      setShowAmbientAlert(true);
                      if (autoMuteAlways) {
                        setIsMuted(true);
                        stopJarvisSpeech();
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Card 2: Morning Briefing Card (Spoken automatically on morning launch + on-demand) */}
            <MorningBriefingCard
              schedule={schedule}
              weather={weatherData}
              isSpeaking={status === 'speaking'}
              onPlayBriefing={handlePlayMorningBriefing}
              onStopSpeaking={handleStopSpeaking}
            />

            {/* Card 3: Professional Weather Widget (Geolocation API) */}
            <WeatherWidget
              onSpeakWeather={handleSpeakWeatherReport}
              onWeatherUpdate={handleWeatherUpdate}
            />

            {/* Card 4: World & Bharat News Module (Scrollable feeds + Jarvis summarizer) */}
            <NewsModuleCard
              isSpeaking={status === 'speaking'}
              onSpeakNews={handleSpeakNewsSummary}
              onStopSpeaking={handleStopSpeaking}
            />

            {/* Instant Link & QR Code Quick Card */}
            <ShareQrCard
              onOpenInstallModal={(tab) => {
                if (tab) setInstallModalTab(tab);
                setIsInstallModalOpen(true);
              }}
              onToast={(msg) => {
                setCommandHistory((prev) => [
                  {
                    id: `cmd-${Date.now()}`,
                    query: 'Share Link & QR Code',
                    response: msg,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    success: true,
                  },
                  ...prev.slice(0, 19),
                ]);
              }}
            />

            {/* Quick Actions Row: Instant One-Tap Tools */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Call Dad */}
              <button
                id="quick-action-call-dad"
                onClick={() => {
                  triggerHaptic([50]);
                  const dad = contacts.find((c) => c.name.toLowerCase().includes('dad') || c.relation?.toLowerCase().includes('dad')) || {
                    id: 'dad',
                    name: 'Dad',
                    phone: '+91 98765 43210',
                    avatarColor: '#0ea5e9',
                    relation: 'Father',
                  };
                  launchPhoneCall(dad.phone, dad.name);
                  setActiveCall({ contact: dad, phoneNumber: dad.phone });
                }}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/80 flex items-center gap-3 transition-all active:scale-95 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Call Dad</span>
                  <span className="text-[11px] text-slate-400">1-Tap Dial</span>
                </div>
              </button>

              {/* Messages Inbox */}
              <button
                id="quick-action-messages"
                onClick={() => {
                  triggerHaptic([40, 50]);
                  setIsMessagesInboxOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/80 flex items-center gap-3 transition-all active:scale-95 text-left relative cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white block">Messages</span>
                    {incomingMessages.some((m) => !m.read) && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {incomingMessages.filter((m) => !m.read).length} Unread
                  </span>
                </div>
              </button>

              {/* Torch Toggle */}
              <button
                id="quick-action-flashlight"
                onClick={handleToggleTorch}
                className={`p-3.5 rounded-2xl border transition-all active:scale-95 text-left flex items-center gap-3 cursor-pointer ${
                  torchActive
                    ? 'bg-amber-500/15 border-amber-400/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/80'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    torchActive
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Flashlight className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Flashlight</span>
                  <span className="text-[11px] text-slate-400">{torchActive ? 'ON' : 'OFF'}</span>
                </div>
              </button>

              {/* Quick Alarm */}
              <button
                id="quick-action-alarms"
                onClick={() => {
                  triggerHaptic([40]);
                  setActiveTab('schedule');
                }}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/80 flex items-center gap-3 transition-all active:scale-95 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Alarms</span>
                  <span className="text-[11px] text-slate-400">Manage Times</span>
                </div>
              </button>

              {/* WhatsApp Quick */}
              <button
                id="quick-action-whatsapp"
                onClick={() => {
                  triggerHaptic([40]);
                  launchWhatsApp('', 'Hi, message via Jarvis');
                }}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/80 flex items-center gap-3 transition-all active:scale-95 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">WhatsApp</span>
                  <span className="text-[11px] text-slate-400">Open Chat</span>
                </div>
              </button>
            </div>

            {/* Quick Android App Shortcuts Bar */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">Quick Android Apps</span>
                <span className="text-[11px] text-slate-500">Tap to launch</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { name: 'YouTube', icon: Youtube, color: 'text-red-400 bg-red-950/40 border-red-500/20', app: 'youtube' },
                  { name: 'Camera', icon: Camera, color: 'text-sky-400 bg-sky-950/40 border-sky-500/20', app: 'camera' },
                  { name: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20', app: 'whatsapp' },
                  { name: 'Spotify', icon: Music, color: 'text-green-400 bg-green-950/40 border-green-500/20', app: 'spotify' },
                  { name: 'Maps', icon: MapPin, color: 'text-amber-400 bg-amber-950/40 border-amber-500/20', app: 'maps' },
                  { name: 'Settings', icon: Sliders, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20', app: 'settings' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        triggerHaptic([30]);
                        if (item.app === 'camera') {
                          setIsCameraOpen(true);
                        } else {
                          launchAndroidApp(item.app);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all ${item.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-medium text-slate-200">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Goals Card (Short-term task planner with local storage persistence) */}
            <DailyGoalsCard />

            {/* Suggested Commands Section (Contextual 3-action buttons based on time of day) */}
            <SuggestedCommands
              onExecuteCommand={(prompt) => handleExecuteJarvisCommand(prompt)}
            />
          </div>
        )}

        {/* TAB: J.A.R.V.I.S. DUAL CORE HUB (MCU STARK & REAL-WORLD EXEC) */}
        {activeTab === 'jarvis_hub' && (
          <JarvisDualCoreHub
            onSpeak={(text) => speakJarvis(text, { lang: speechLang, muted: isMuted })}
            onSendCommand={(cmd) => handleExecuteJarvisCommand(cmd)}
            isListening={isListening}
          />
        )}

        {/* TAB 2: PC CONTROL & BEAST WORKSPACE */}
        {activeTab === 'pc_control' && (
          <PcControlWorkspace
            onSpeak={(text) => speakJarvis(text, { lang: speechLang, muted: isMuted })}
            isHandsFree={handsFreeMode}
            voiceActionTrigger={pcVoiceTrigger}
          />
        )}

        {/* TAB 3: CONTACTS & SPEED DIALER */}
        {activeTab === 'contacts' && (
          <ContactManager
            contacts={contacts}
            onAddContact={(newContact) => {
              const contact: Contact = { ...newContact, id: `contact-${Date.now()}` };
              setContacts((prev) => [contact, ...prev]);
            }}
            onUpdateContact={(updated) => {
              setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            }}
            onDeleteContact={(id) => {
              setContacts((prev) => prev.filter((c) => c.id !== id));
            }}
            onReplaceContacts={(newContacts) => {
              setContacts(newContacts);
            }}
            selectedContactForDetails={dossierContact}
            onCloseDetails={() => setDossierContact(null)}
            onExecuteJarvisCommand={handleExecuteJarvisCommand}
            onInitiateCall={(contact, phone) => setActiveCall({ contact, phoneNumber: phone })}
          />
        )}

        {/* TAB 3: SCHEDULE & ALARM MANAGER */}
        {activeTab === 'schedule' && (
          <ScheduleAlarmManager
            schedule={schedule}
            onAddScheduleItem={(item) => {
              const fullItem: ScheduleItem = { ...item, id: `sched-${Date.now()}` };
              setSchedule((prev) => [fullItem, ...prev]);
            }}
            onToggleComplete={(id) => {
              setSchedule((prev) =>
                prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
              );
            }}
            onDeleteItem={(id) => {
              setSchedule((prev) => prev.filter((s) => s.id !== id));
            }}
            onUpdateItemLocation={(id, loc) => {
              setSchedule((prev) =>
                prev.map((s) => (s.id === id ? { ...s, location: loc } : s))
              );
            }}
            onSnoozeItem={(id, minutes) => {
              setSchedule((prev) =>
                prev.map((s) => {
                  if (s.id !== id || typeof s.time !== 'string') return s;
                  const timeParts = s.time.split(':');
                  const h = parseInt(timeParts[0] || '8', 10);
                  const m = parseInt(timeParts[1] || '0', 10);
                  const safeH = isNaN(h) ? 8 : h;
                  const safeM = isNaN(m) ? 0 : m;
                  let newMin = safeM + minutes;
                  let newHour = safeH;
                  if (newMin >= 60) {
                    newHour = (newHour + Math.floor(newMin / 60)) % 24;
                    newMin = newMin % 60;
                  }
                  const newTimeStr = `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
                  return { ...s, time: newTimeStr, hour: newHour, minute: newMin, notified: false };
                })
              );
            }}
            onNotifyDueItem={(item) => {
              sendLocalNotification(`JARVIS: ${item.title}`, {
                body: `Scheduled for ${item.time}`,
              });
            }}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={async () => {
              const res = await requestNotificationPermission();
              setNotificationPermission(res);
            }}
          />
        )}

        {/* 5. Jarvis Settings & Hardware Diagnostics Tab */}
        {activeTab === 'settings' && (
          <SettingsTab
            onSpeak={(text) => speakJarvis(text, { lang: speechLang, muted: isMuted })}
            onLogAction={(text) => {
              setCommandHistory((prev) => [
                {
                  id: `cmd-${Date.now()}`,
                  query: text,
                  response: 'Jarvis Setting Updated',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  success: true,
                },
                ...prev.slice(0, 19),
              ]);
            }}
            onOpenInstallModal={(tab) => {
              if (tab) setInstallModalTab(tab);
              setIsInstallModalOpen(true);
            }}
            onOpenMemoryCore={() => setIsMemoryModalOpen(true)}
          />
        )}

        {/* 6. RP Jansabha Digital Services Portal */}
        {activeTab === 'rp_jansabha' && (
          <RpJansabhaPortal
            initialTab={jansabhaInitialTab}
            onSpeakJarvisGuide={(text) => {
              speakJarvis(text, { lang: speechLang, muted: isMuted });
            }}
          />
        )}
      </main>

      {/* Live Phone Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(dataUrl) => {
          console.log('Captured photo successfully');
        }}
      />

      {/* Interactive Memory Core Modal */}
      <MemoryCoreModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        initialTab={memoryModalTab}
        onMemoryUpdate={(memories) => {
          console.log('Memory core updated with', memories.length, 'vectors');
        }}
      />

      {/* Government Schemes Intelligence & Auto-Update Modal */}
      <GovSchemesModal
        isOpen={isGovSchemesModalOpen}
        onClose={() => setIsGovSchemesModalOpen(false)}
        initialQuery={govSchemesInitialQuery}
        onSpeakScheme={(text) => {
          speakJarvis(text, { lang: speechLang, muted: isMuted });
        }}
      />

      {/* Restricted Master Admin Dashboard Modal (Only for Admin - Rovin Pal) */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onMemoryUpdate={(updated) => {
          setMemories(updated);
        }}
        onOpenPlayStoreGuide={() => {
          setInstallModalTab('playstore');
          setIsInstallModalOpen(true);
        }}
      />

      {/* Admin Tool / Setting: Haptic Alert Pattern Studio (Alarms, Messages, Calls) */}
      <HapticAlertCustomizerModal
        isOpen={isHapticCustomizerOpen}
        onClose={() => setIsHapticCustomizerOpen(false)}
        initialAlert={hapticCustomizerAlert}
        onSpeak={(text) => {
          speakJarvis(text, { lang: speechLang, muted: isMuted });
        }}
      />

      {/* PWA Home Screen Install & Friend Download Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        initialTab={installModalTab}
      />

      {/* Active Phone Call In-Call Management Modal */}
      {activeCall && (
        <ActiveCallModal
          contact={activeCall.contact}
          phoneNumber={activeCall.phoneNumber}
          onEndCall={() => {
            setActiveCall(null);
            playBeepSound();
            speakJarvis('Call disconnect ho chuki hai.', { lang: speechLang, muted: isMuted });
          }}
        />
      )}

      {/* Incoming Messages Voice Reader & Inbox Modal */}
      {isMessagesInboxOpen && (
        <MessagesInboxModal
          messages={incomingMessages}
          contacts={contacts}
          onClose={() => setIsMessagesInboxOpen(false)}
          onMarkAsRead={handleMarkMessageAsRead}
          onMarkAllAsRead={handleMarkAllMessagesAsRead}
          onSendMessage={handleSendMessage}
          speechLang={speechLang}
          onSimulateIncomingMessage={handleSimulateIncomingMessage}
        />
      )}

      {/* Interactive Voice Command Cheat Sheet Overlay */}
      <VoiceCommandCheatSheet
        isListening={isListening}
        liveTranscript={liveSpeechTranscript}
        speechLang={speechLang}
        audioLevel={liveAudioLevel}
        onExecuteCommand={(cmd) => {
          handleExecuteJarvisCommand(cmd);
        }}
        onTryItCommand={(cmd) => {
          handleSimulateVoiceCommand(cmd.phrase);
        }}
        onStopListening={handleStopVoiceListening}
        onStartListening={handleStartVoiceListening}
        isOpen={isVoiceCheatSheetOpen}
        onClose={() => setIsVoiceCheatSheetOpen(false)}
      />

      {/* Live Spoken Command Simulation Banner ('Try it' Demo Mode) */}
      {simulatedVoiceDemo && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-950/95 border border-emerald-500/80 text-emerald-200 backdrop-blur-xl shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-2.5 text-xs font-bold animate-bounce pointer-events-none">
          <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Simulating Voice Command: &ldquo;{simulatedVoiceDemo.phrase}&rdquo;</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono">
            VOICE INPUT MODE
          </span>
        </div>
      )}

      {/* Simulated Android Physical Power / Lock Button */}
      <PowerLockButton
        isPhoneLocked={isPhoneLocked}
        onToggleLock={() => {
          setIsPhoneLocked((prev) => !prev);
        }}
        onTriggerAssistant={() => {
          setIsPhoneLocked(false);
          handleStartVoiceListening();
        }}
        isGuideOpen={isPowerGuideOpen}
        onOpenGuide={() => setIsPowerGuideOpen(true)}
        onCloseGuide={() => setIsPowerGuideOpen(false)}
      />

      {/* AMOLED Phone Lock Screen with Biometric Sensor, PIN Pad & Voice Unlock */}
      <PhoneLockScreen
        isLocked={isPhoneLocked}
        onUnlock={() => {
          setIsPhoneLocked(false);
        }}
        batteryLevel={batteryLevel}
        isListening={isListening}
        onStartListening={handleStartVoiceListening}
        onStopListening={handleStopVoiceListening}
        liveTranscript={liveSpeechTranscript}
        onExecuteCommand={handleExecuteJarvisCommand}
        speechLang={speechLang}
        isMuted={isMuted}
        torchActive={torchActive}
        onToggleTorch={handleToggleTorch}
      />

      {/* AMOLED Deep Standby Phone Shutdown Screen */}
      <PhoneShutdownScreen
        isOpen={isPhoneShutDown}
        onPowerOn={() => {
          setIsPhoneShutDown(false);
          requestScreenWakeLock();
          playStartupSound();
          if (handsFreeMode) {
            setTimeout(() => {
              setIsListening(true);
              setStatus('listening');
            }, 600);
          }
          speakJarvis('Ram Ram ji! Mayra aur Jarvis system boot ho chuka hai. Phone is on and active!', {
            lang: speechLang,
            muted: isMuted,
          });
        }}
      />

      {/* Universal Subject Runner & App Launcher Floating HUD */}
      {activeSubjectAction && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 text-white shadow-[0_0_35px_rgba(6,182,212,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 animate-pulse">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">JARVIS Subject Runner</p>
                  <h4 className="text-sm font-bold text-white truncate max-w-[220px]">{activeSubjectAction.title}</h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubjectAction(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Jarvis ne aapka subject run kar diya hai. Agar app direct open na hui ho to neeche button dabayein:
            </p>

            <div className="flex items-center gap-2">
              <a
                href={activeSubjectAction.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  triggerHaptic([50]);
                  playActionExecutedSound();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all text-center"
              >
                <span>▶️ Open & Run Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Universal In-App YouTube Live Media & Song Player */}
      <YouTubePlayerModal
        isOpen={isYouTubeOpen}
        initialQuery={youTubeQuery}
        forceMaximizeSignal={youTubeMaximizeSignal}
        onClose={() => setIsYouTubeOpen(false)}
      />
    </div>
  );
}
