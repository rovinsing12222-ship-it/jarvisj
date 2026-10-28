import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { JarvisMoodConfig } from '../types';

interface ArcReactorCoreProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  isListening: boolean;
  onToggleListen: () => void;
  voiceLevel?: number;
  commandCount?: number;
  moodConfig?: JarvisMoodConfig;
}

export const ArcReactorCore: React.FC<ArcReactorCoreProps> = ({
  status,
  isListening,
  onToggleListen,
  moodConfig,
}) => {
  const [liveVolume, setLiveVolume] = useState<number>(0);

  useEffect(() => {
    const handleVolume = (e: any) => {
      const vol = e.detail?.volume ?? e.detail?.audioLevel ?? 0;
      if (typeof vol === 'number') {
        setLiveVolume(vol);
      }
    };
    window.addEventListener('jarvis:mic-volume', handleVolume);
    window.addEventListener('jarvis:speech-volume', handleVolume);
    return () => {
      window.removeEventListener('jarvis:mic-volume', handleVolume);
      window.removeEventListener('jarvis:speech-volume', handleVolume);
    };
  }, []);
  const getOrbTheme = () => {
    switch (status) {
      case 'listening':
        return {
          glow: 'from-cyan-500/40 via-teal-500/25 to-transparent',
          core: 'from-cyan-400 via-teal-300 to-sky-500',
          border: 'border-cyan-400/80',
          shadow: 'shadow-[0_0_50px_rgba(6,182,212,0.6)]',
          badgeText: 'text-cyan-300',
          badgeBg: 'bg-cyan-950/80 border-cyan-500/40',
          statusText: 'Listening to your voice...',
        };
      case 'processing':
        return {
          glow: 'from-amber-500/40 via-yellow-500/25 to-transparent',
          core: 'from-amber-400 via-yellow-300 to-orange-500',
          border: 'border-amber-400/80',
          shadow: 'shadow-[0_0_50px_rgba(245,158,11,0.6)]',
          badgeText: 'text-amber-300',
          badgeBg: 'bg-amber-950/80 border-amber-500/40',
          statusText: 'Thinking & processing...',
        };
      case 'speaking':
        return {
          glow: 'from-purple-500/40 via-pink-500/25 to-transparent',
          core: 'from-purple-400 via-pink-400 to-indigo-500',
          border: 'border-purple-400/80',
          shadow: 'shadow-[0_0_50px_rgba(168,85,247,0.6)]',
          badgeText: 'text-purple-300',
          badgeBg: 'bg-purple-950/80 border-purple-500/40',
          statusText: 'Jarvis is speaking...',
        };
      default:
        return {
          glow: 'from-cyan-600/20 via-sky-600/10 to-transparent',
          core: 'from-cyan-500/80 via-sky-600 to-slate-800',
          border: 'border-cyan-500/40',
          shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]',
          badgeText: 'text-cyan-400/80',
          badgeBg: 'bg-slate-900/80 border-cyan-500/20',
          statusText: 'Tap to start Jarvis • Ram Ram ji',
        };
    }
  };

  const theme = getOrbTheme();

  return (
    <div className="relative flex flex-col items-center justify-center py-6 select-none">
      {/* Ambient Pulsing Aura with dynamic Mood Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {moodConfig && (
          <div
            className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
            style={{
              background: `radial-gradient(circle, ${moodConfig.glowColor} 0%, rgba(15, 23, 42, 0) 70%)`,
            }}
          />
        )}
        <motion.div
          animate={{
            scale:
              status === 'listening'
                ? [1, 1.25, 1]
                : status === 'speaking'
                ? 1 + (liveVolume / 100) * 0.22
                : [1, 1.05, 1],
            opacity:
              status === 'listening'
                ? [0.6, 0.9, 0.6]
                : status === 'speaking'
                ? 0.5 + (liveVolume / 100) * 0.45
                : [0.25, 0.4, 0.25],
          }}
          transition={{
            duration: status === 'speaking' ? 0.08 : status === 'listening' ? 1.6 : 3.5,
            repeat: status === 'speaking' ? 0 : Infinity,
            ease: 'easeOut',
          }}
          className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-radial ${theme.glow} blur-3xl`}
        />
      </div>

      {/* Outer Ripple Wave Rings (when listening or speaking) */}
      {(status === 'listening' || status === 'speaking') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{
              scale: status === 'speaking' ? [1, 1.4 + (liveVolume / 100) * 0.4] : [1, 1.6],
              opacity: status === 'speaking' ? [0.7, 0] : [0.6, 0],
            }}
            transition={{ duration: status === 'speaking' ? 1.2 : 1.8, repeat: Infinity, ease: 'easeOut' }}
            className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full border ${theme.border}`}
          />
          <motion.div
            animate={{
              scale: status === 'speaking' ? [1, 1.7 + (liveVolume / 100) * 0.5] : [1, 1.9],
              opacity: status === 'speaking' ? [0.5, 0] : [0.4, 0],
            }}
            transition={{ duration: status === 'speaking' ? 1.8 : 2.4, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
            className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full border ${theme.border}`}
          />
        </div>
      )}

      {/* Main Interactive AI Orb Button */}
      <motion.button
        id="jarvis-voice-orb"
        onClick={onToggleListen}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        style={
          status === 'speaking'
            ? {
                boxShadow: `0 0 ${30 + (liveVolume / 100) * 45}px rgba(168, 85, 247, ${0.5 + (liveVolume / 100) * 0.45}), 0 0 ${15 + (liveVolume / 100) * 25}px rgba(6, 182, 212, 0.4)`,
                borderColor: `rgba(168, 85, 247, ${0.7 + (liveVolume / 100) * 0.3})`,
                transform: `scale(${1 + (liveVolume / 100) * 0.04})`,
                transition: 'transform 80ms ease-out, box-shadow 80ms ease-out, border-color 80ms ease-out',
              }
            : undefined
        }
        className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${theme.shadow} border-2 ${theme.border} bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl group focus:outline-none`}
        aria-label={isListening ? 'Stop listening' : 'Start speaking with Jarvis'}
      >
        {/* Subtle audio-reactive speech pulse glow ring behind orb */}
        {status === 'speaking' && (
          <div
            className="absolute -inset-4 sm:-inset-6 rounded-full pointer-events-none transition-all duration-75 ease-out"
            style={{
              transform: `scale(${1 + (liveVolume / 100) * 0.12})`,
              background: `radial-gradient(circle, rgba(168, 85, 247, ${0.35 + (liveVolume / 100) * 0.45}) 0%, rgba(6, 182, 212, ${0.2 + (liveVolume / 100) * 0.3}) 50%, transparent 75%)`,
              filter: `blur(${14 + (liveVolume / 100) * 14}px)`,
              opacity: 0.6 + (liveVolume / 100) * 0.4,
            }}
          />
        )}

        {/* Sleek Inner Core Glow */}
        <motion.div
          animate={{
            scale:
              status === 'listening'
                ? [0.95 + (liveVolume / 100) * 0.25, 1.05 + (liveVolume / 100) * 0.3, 0.95 + (liveVolume / 100) * 0.25]
                : status === 'speaking'
                ? 0.96 + (liveVolume / 100) * 0.18
                : 1,
          }}
          transition={{
            duration: status === 'speaking' ? 0.08 : status === 'listening' ? 0.3 : 1.2,
            repeat: status === 'speaking' ? 0 : Infinity,
            ease: 'easeOut',
          }}
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr ${theme.core} opacity-90 flex items-center justify-center shadow-inner relative overflow-hidden`}
        >
          {/* Subtle glossy glass reflection */}
          <div className="absolute -top-6 left-2 right-2 h-16 bg-white/20 rounded-full blur-md transform -rotate-12 pointer-events-none" />

          {/* Central Animated Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center text-slate-950">
            {status === 'processing' ? (
              <Loader2 className="w-10 h-10 animate-spin text-slate-950" />
            ) : status === 'speaking' ? (
              <Volume2 className="w-10 h-10 animate-pulse text-slate-950" />
            ) : isListening ? (
              <Mic className="w-10 h-10 text-slate-950 animate-bounce" />
            ) : (
              <Sparkles className="w-9 h-9 text-slate-950 group-hover:scale-110 transition-transform" />
            )}
          </div>
        </motion.div>

        {/* Minimal Audio Waveform Indicator (when active) */}
        {(status === 'listening' || status === 'speaking') && (
          <div className="absolute -bottom-3 flex items-center gap-1 bg-slate-950/90 px-3 py-1 rounded-full border border-cyan-400/40 shadow-lg">
            {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7].map((heightScale, i) => (
              <motion.span
                key={i}
                animate={{ scaleY: [0.3, heightScale, 0.3] }}
                transition={{
                  duration: 0.6 + (i % 3) * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.08,
                }}
                className={`w-1 h-3.5 rounded-full ${
                  status === 'speaking' ? 'bg-purple-400' : 'bg-cyan-400'
                }`}
              />
            ))}
          </div>
        )}
      </motion.button>

      {/* Clean Status Pill */}
      <div className="mt-5 flex flex-col items-center gap-1 text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium tracking-wide border backdrop-blur-md transition-all ${theme.badgeBg} ${theme.badgeText}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'listening'
                ? 'bg-cyan-400 animate-ping'
                : status === 'speaking'
                ? 'bg-purple-400 animate-pulse'
                : status === 'processing'
                ? 'bg-amber-400 animate-spin'
                : 'bg-emerald-400'
            }`}
          />
          {theme.statusText}
        </span>
      </div>
    </div>
  );
};
