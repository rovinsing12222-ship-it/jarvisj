import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronDown, Check, Activity, Volume2, Shield } from 'lucide-react';
import { JarvisMood, JarvisMoodConfig, SentimentAnalysisResult } from '../types';
import { JARVIS_MOOD_CONFIGS } from '../utils/sentimentAnalysis';
import { speakJarvis } from '../utils/audioSynth';

interface JarvisMoodIndicatorProps {
  currentMood: JarvisMoodConfig;
  activeSentiment?: SentimentAnalysisResult | null;
  onSelectMood?: (mood: JarvisMood) => void;
  className?: string;
}

export const JarvisMoodIndicator: React.FC<JarvisMoodIndicatorProps> = ({
  currentMood,
  activeSentiment,
  onSelectMood,
  className = '',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const moodList: JarvisMood[] = ['Happy', 'Professional', 'Calm', 'Supportive', 'Empathetic'];

  // Test voice in selected mood with movie Jarvis tone
  const handlePreviewMood = (e: React.MouseEvent, moodKey: JarvisMood) => {
    e.stopPropagation();
    const config = JARVIS_MOOD_CONFIGS[moodKey];
    onSelectMood?.(moodKey);
    setIsDropdownOpen(false);

    // Speak a movie-accurate Jarvis confirmation
    const phrases: Record<JarvisMood, string> = {
      Professional: 'At your service, Sir. Tactical and computational protocols engaged.',
      Happy: 'Excellent, Sir. All systems operating with optimal resonance.',
      Calm: 'Tranquil protocols active, Sir. Maintaining background vigilance.',
      Supportive: 'Allow me to manage the workload, Sir. You have my complete support.',
      Empathetic: 'Understood, Sir. Adjusting cadence to ensure effortless execution.',
    };

    speakJarvis(phrases[moodKey] || 'Mood parameters updated, Sir.', {
      pitch: moodKey === 'Professional' ? 0.94 : moodKey === 'Calm' ? 0.91 : 0.95,
      rate: 0.98,
    });
  };

  return (
    <div
      className={`w-full max-w-md flex flex-col items-center select-none relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Ambient Aura that smoothly blends Mood Glow and UI Theme */}
      <motion.div
        className="absolute -inset-1.5 rounded-3xl pointer-events-none filter blur-xl opacity-60 z-0 transition-opacity duration-700"
        animate={{
          background: `radial-gradient(ellipse at 50% 50%, ${currentMood.glowHex}40 0%, var(--theme-border-accent, rgba(6,182,212,0.2)) 50%, transparent 80%)`,
          scale: isHovered ? [1, 1.04, 1] : [1, 1.02, 1],
          opacity: isHovered ? 0.85 : 0.55,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating Tactical Orbital Ring */}
      <motion.div
        className="absolute -inset-0.5 rounded-2xl pointer-events-none opacity-30 z-0"
        style={{
          border: `1px dashed ${currentMood.glowHex}`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      />

      {/* Primary Mood Indicator Card with Framer Motion & CSS transitions */}
      <motion.div
        id="jarvis-mood-indicator-card"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="relative z-10 w-full px-3.5 py-2.5 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-3 cursor-pointer overflow-hidden transition-all duration-700 ease-out active:scale-[0.99]"
        style={{
          backgroundColor: 'var(--theme-card-bg, rgba(15, 23, 42, 0.85))',
          borderColor: `${currentMood.glowHex}80`,
          boxShadow: `0 0 20px ${currentMood.glowHex}33, 0 0 40px ${currentMood.glowHex}14, var(--theme-glow, 0 0 20px rgba(6,182,212,0.15))`,
        }}
        animate={{
          borderColor: `${currentMood.glowHex}99`,
          boxShadow: isHovered
            ? `0 0 30px ${currentMood.glowHex}55, 0 0 60px ${currentMood.glowHex}22, var(--theme-glow, 0 0 25px rgba(6,182,212,0.3))`
            : `0 0 20px ${currentMood.glowHex}33, 0 0 40px ${currentMood.glowHex}14, var(--theme-glow, 0 0 20px rgba(6,182,212,0.15))`,
        }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        title="Click to view mood telemetry or test movie Jarvis personas"
      >
        {/* Subtle holographic scanline layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${currentMood.glowHex} 2px, ${currentMood.glowHex} 4px)`,
          }}
        />

        {/* Left: Avatar Mood Badge & Title */}
        <div className="flex items-center gap-2.5 min-w-0 z-10">
          <motion.div
            key={currentMood.mood}
            initial={{ scale: 0.75, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 relative overflow-hidden border transition-colors duration-700"
            style={{
              backgroundColor: `${currentMood.glowHex}22`,
              borderColor: `${currentMood.glowHex}66`,
              boxShadow: `inset 0 0 12px ${currentMood.glowHex}40`,
            }}
          >
            <span>{currentMood.emoji}</span>
          </motion.div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-cyan-400" />
                Jarvis AI
              </span>
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                  backgroundColor: [currentMood.glowHex, '#38bdf8', currentMood.glowHex],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentMood.mood}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.3 }}
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono border transition-colors duration-700"
                  style={{
                    color: currentMood.glowHex,
                    borderColor: `${currentMood.glowHex}55`,
                    backgroundColor: `${currentMood.glowHex}18`,
                  }}
                >
                  {currentMood.mood}
                </motion.span>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={currentMood.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.3 }}
                className="text-xs font-semibold text-slate-100 truncate flex items-center gap-1.5"
              >
                <span>{currentMood.label}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Dynamic Equalizer & Telemetry Stats */}
        <div className="flex items-center gap-2 flex-shrink-0 z-10">
          {/* Micro Equalizer Wave Bars reacting to Mood */}
          <div className="flex items-end gap-0.5 h-5 px-1">
            {[0.4, 0.9, 0.6, 1.0, 0.5].map((factor, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full transition-colors duration-700"
                style={{ backgroundColor: currentMood.glowHex }}
                animate={{
                  height: [
                    `${Math.max(4, factor * 8)}px`,
                    `${Math.max(6, factor * 18)}px`,
                    `${Math.max(4, factor * 8)}px`,
                  ],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.2 + i * 0.25,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-1">
              <Activity className="w-2.5 h-2.5" style={{ color: currentMood.glowHex }} />
              <p className="text-[10px] text-slate-300 font-medium">
                {activeSentiment ? `Tone: ${activeSentiment.sentiment}` : 'Paul Bettany (MCU)'}
              </p>
            </div>
            <p className="text-[9px] text-slate-400 font-mono">
              Pitch {activeSentiment?.toneConfig.speechPitch || 0.94}x • Movie Tone
            </p>
          </div>

          <motion.div
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      </motion.div>

      {/* Mood Selector Dropdown with Framer Motion Spring Animations */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            id="jarvis-mood-selector-menu"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="w-full mt-2 p-2.5 rounded-2xl border shadow-2xl backdrop-blur-2xl z-30 transition-colors duration-700"
            style={{
              backgroundColor: 'var(--theme-card-bg, rgba(11, 17, 32, 0.96))',
              borderColor: `${currentMood.glowHex}50`,
              boxShadow: `0 15px 45px rgba(0,0,0,0.6), 0 0 35px ${currentMood.glowHex}25`,
            }}
          >
            <div className="px-2 py-1.5 mb-1.5 flex items-center justify-between border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Jarvis Mood & Persona Engine</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">MCU Movie Calibrated</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              {moodList.map((mKey, idx) => {
                const config = JARVIS_MOOD_CONFIGS[mKey];
                const isSelected = currentMood.mood === mKey;
                return (
                  <motion.button
                    key={mKey}
                    type="button"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={(e) => handlePreviewMood(e, mKey)}
                    className={`px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-slate-800/90 border shadow-md'
                        : 'bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/40 text-slate-300'
                    }`}
                    style={{
                      borderColor: isSelected ? `${config.glowHex}88` : undefined,
                      boxShadow: isSelected ? `0 0 15px ${config.glowHex}30` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base group-hover:scale-110 transition-transform">
                        {config.emoji}
                      </span>
                      <div className="truncate">
                        <p
                          className="text-xs font-bold truncate transition-colors"
                          style={{ color: isSelected ? config.glowHex : undefined }}
                        >
                          {config.mood}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {config.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Volume2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: config.glowHex }}
                        />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
