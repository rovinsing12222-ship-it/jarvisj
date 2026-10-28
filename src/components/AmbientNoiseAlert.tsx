import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  Radio,
  Sliders,
  CheckCircle2,
  X,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { AmbientNoiseState } from '../types';
import { triggerHaptic } from '../utils/deviceHardware';

interface AmbientNoiseAlertProps {
  ambientNoise: AmbientNoiseState;
  isMuted: boolean;
  onEnableMuted: () => void;
  onDismiss: () => void;
  onToggleAutoMutePreference?: (enabled: boolean) => void;
  autoMuteEnabled?: boolean;
}

export const AmbientNoiseAlert: React.FC<AmbientNoiseAlertProps> = ({
  ambientNoise,
  isMuted,
  onEnableMuted,
  onDismiss,
  onToggleAutoMutePreference,
  autoMuteEnabled = false,
}) => {
  const [alwaysAutoMute, setAlwaysAutoMute] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jarvis_auto_mute_always') === 'true';
    } catch {
      return false;
    }
  });

  const handleEnableMutedClick = () => {
    triggerHaptic([40, 60]);
    onEnableMuted();
  };

  const handleToggleAutoMute = (val: boolean) => {
    setAlwaysAutoMute(val);
    try {
      localStorage.setItem('jarvis_auto_mute_always', val ? 'true' : 'false');
    } catch {}
    onToggleAutoMutePreference?.(val);
  };

  return (
    <div
      id="jarvis-ambient-noise-alert"
      className="w-full max-w-2xl mx-auto px-2 sm:px-4 mb-3 animate-fade-in select-none"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/80 bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-rose-950/90 backdrop-blur-xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all">
        {/* Glow ambient background element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-400/60 flex items-center justify-center flex-shrink-0 text-amber-300 shadow-inner mt-0.5 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  High Ambient Noise Detected
                </span>
                <span className="text-xs font-mono font-bold text-amber-200 bg-slate-950/70 px-2 py-0.5 rounded-md border border-amber-500/30">
                  ~{ambientNoise.approxDb} dB ({ambientNoise.level}%)
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mt-1">
                Jarvis Suggestion: Enable 'Muted' Mode for Better Speech Recognition
              </h4>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Aapke aas-paas kaafi shor (background noise/chatter) detect hua hai. Loud environment me Jarvis ka vocal speaker microphone speech ko confuse kar sakta hai. <strong className="text-amber-200">Muted Mode</strong> enable karne se Jarvis text me respond karegi aur speech recognition 100% accurate rahegi.
              </p>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center gap-2.5 flex-wrap">
                {!isMuted ? (
                  <button
                    type="button"
                    id="btn-enable-muted-mode-suggested"
                    onClick={handleEnableMutedClick}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <VolumeX className="w-4 h-4 text-slate-950" />
                    <span>Enable 'Muted' Mode Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Muted Mode is currently ACTIVE (Optimized for Noise)</span>
                  </div>
                )}

                <label className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
                  <input
                    type="checkbox"
                    checked={alwaysAutoMute}
                    onChange={(e) => handleToggleAutoMute(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Always Auto-Mute when loud</span>
                </label>

                <button
                  type="button"
                  id="btn-dismiss-ambient-noise-alert"
                  onClick={onDismiss}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors"
                >
                  Dismiss / Keep Unmuted
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            title="Close Alert"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
