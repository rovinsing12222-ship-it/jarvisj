import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils/deviceHardware';
import { playAssistantInvokeSound } from '../utils/audioSynth';

export type JarvisResponseLanguage = 'english' | 'hindi' | 'hinglish';

export interface JarvisLanguageDropdownProps {
  currentLanguage: JarvisResponseLanguage;
  onSelectLanguage: (lang: JarvisResponseLanguage) => void;
  disabled?: boolean;
}

interface LanguageOption {
  id: JarvisResponseLanguage;
  label: string;
  nativeLabel: string;
  badge: string;
  description: string;
  samplePrompt: string;
  flagEmoji: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'english',
    label: 'English',
    nativeLabel: 'English (British MCU)',
    badge: 'MCU Butler',
    description: 'Articulate British AI Butler accent & phrasing (Paul Bettany cadence)',
    samplePrompt: '"Right away, Sir. Opening YouTube on your screen now."',
    flagEmoji: '🇬🇧',
  },
  {
    id: 'hindi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी (शुद्ध हिन्दी)',
    badge: 'शुद्ध हिन्दी',
    description: 'पूर्णतः शुद्ध, स्पष्ट व औपचारिक हिन्दी उच्चारण एवं उत्तर',
    samplePrompt: '"जी सर, मैं तुरंत आपके फोन में यूट्यूब खोल रहा हूँ। आदेश दें।"',
    flagEmoji: '🇮🇳',
  },
  {
    id: 'hinglish',
    label: 'Hinglish',
    nativeLabel: 'Hinglish (हिंग्लिश)',
    badge: 'Bilingual Mix',
    description: 'Natural conversational Hindi + English blend in Roman script',
    samplePrompt: '"Ji Sir, main aapke phone me YouTube open kar raha hu."',
    flagEmoji: '🇮🇳',
  },
];

export const JarvisLanguageDropdown: React.FC<JarvisLanguageDropdownProps> = ({
  currentLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<JarvisResponseLanguage>(currentLanguage);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep internal state synchronized with currentLanguage prop
  useEffect(() => {
    setSelectedLang(currentLanguage);
  }, [currentLanguage]);

  // Listen to global language change events from across the app
  useEffect(() => {
    const handleGlobalChange = (e: any) => {
      const lang = e.detail?.language;
      if (lang && (lang === 'english' || lang === 'hindi' || lang === 'hinglish')) {
        setSelectedLang(lang);
      }
    };
    window.addEventListener('jarvis:language-changed', handleGlobalChange);
    return () => window.removeEventListener('jarvis:language-changed', handleGlobalChange);
  }, []);

  // Close dropdown on outside click or Touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    triggerHaptic([25]);
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (lang: JarvisResponseLanguage) => {
    triggerHaptic([35, 45]);
    playAssistantInvokeSound();
    setSelectedLang(lang);
    try {
      localStorage.setItem('jarvis_ai_response_lang', lang);
    } catch {}
    window.dispatchEvent(new CustomEvent('jarvis:language-changed', { detail: { language: lang } }));
    onSelectLanguage(lang);
    setIsOpen(false);
  };

  const effectiveLang = selectedLang || currentLanguage;
  const activeOption =
    LANGUAGE_OPTIONS.find((opt) => opt.id === effectiveLang) || LANGUAGE_OPTIONS[2];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Dropdown Trigger Button placed directly beside #btn-voice-mute */}
      <button
        type="button"
        id="btn-jarvis-language-dropdown"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Jarvis AI Response Language: ${activeOption.label} (Click to switch to English, Hindi, or Hinglish)`}
        className={`px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
          isOpen
            ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
            : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-cyan-300 hover:text-white hover:border-cyan-500/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="text-[11px] font-mono font-bold tracking-wide">
          {activeOption.id === 'english' ? 'ENG' : activeOption.id === 'hindi' ? 'हिन्दी' : 'HINGLISH'}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-300' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            id="jarvis-language-dropdown-menu"
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/98 border border-cyan-500/40 p-2 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden"
          >
            {/* Header info */}
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  AI Response Language
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">STARK VOICE V7</span>
            </div>

            {/* Language Options List */}
            <div className="space-y-1.5" role="menu" aria-orientation="vertical">
              {LANGUAGE_OPTIONS.map((option) => {
                const isSelected = option.id === effectiveLang;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitem"
                    id={`opt-lang-${option.id}`}
                    onClick={() => handleSelect(option.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer group ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/80 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{option.flagEmoji}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-200">
                            {option.label}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            ({option.nativeLabel})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold ${
                            isSelected
                              ? 'bg-cyan-500/30 border-cyan-400/60 text-cyan-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {option.badge}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight">
                      {option.description}
                    </p>

                    <div className="text-[10px] font-mono text-cyan-400/80 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/60 truncate mt-0.5">
                      <span className="text-slate-500 mr-1">Eg:</span>
                      {option.samplePrompt}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Helper Note */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 px-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Speaks & generates replies in chosen dialect</span>
              <span className="font-mono text-cyan-400">Instant Switch</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
