import React, { useState, useRef } from 'react';
import {
  Power,
  Lock,
  Unlock,
  Sparkles,
  HelpCircle,
  Smartphone,
  CheckCircle2,
  X,
  ExternalLink,
  Volume2,
  Mic,
} from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';
import { playAssistantInvokeSound, playPhoneLockSound, playPhoneUnlockSound } from '../utils/audioSynth';

interface PowerLockButtonProps {
  isPhoneLocked: boolean;
  onToggleLock: () => void;
  onTriggerAssistant: () => void;
  isGuideOpen: boolean;
  onOpenGuide: () => void;
  onCloseGuide: () => void;
}

export const PowerLockButton: React.FC<PowerLockButtonProps> = ({
  isPhoneLocked,
  onToggleLock,
  onTriggerAssistant,
  isGuideOpen,
  onOpenGuide,
  onCloseGuide,
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showToast, setShowToast] = useState<string | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const didTriggerHoldRef = useRef(false);

  const startHold = () => {
    didTriggerHoldRef.current = false;
    setIsHolding(true);
    setHoldProgress(0);
    triggerHaptic([25]);

    const startTime = Date.now();
    const HOLD_DURATION = 550; // 550ms hold to trigger Gemini / Assistant

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldProgress(progress);
    }, 25);

    holdTimerRef.current = setTimeout(() => {
      didTriggerHoldRef.current = true;
      setIsHolding(false);
      setHoldProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      // Trigger Gemini / Jarvis invocation!
      triggerHaptic([50, 100, 60]);
      playAssistantInvokeSound();
      onTriggerAssistant();
      setShowToast('⚡ Google Gemini / JARVIS Activated via Power Button Hold!');
      setTimeout(() => setShowToast(null), 3500);
    }, HOLD_DURATION);
  };

  const endHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    // If released before 550ms, treat as a single click: Lock or Unlock the phone!
    if (!didTriggerHoldRef.current) {
      triggerHaptic([35]);
      if (isPhoneLocked) {
        playPhoneUnlockSound();
      } else {
        playPhoneLockSound();
      }
      onToggleLock();
    }

    setIsHolding(false);
    setHoldProgress(0);
  };

  return (
    <>
      {/* Physical Android Power / Lock Button Simulated on the right edge */}
      <div className="fixed right-1 sm:right-3 top-1/2 -translate-y-1/2 z-[110] flex flex-col items-center gap-2 select-none">
        {/* Helper Tooltip Badge */}
        <div className="hidden sm:flex flex-col items-end pointer-events-none mb-1 text-right">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40 shadow-lg backdrop-blur-md">
            <Power className="w-2.5 h-2.5" />
            <span>Power / Lock Key</span>
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">
            Tap: Lock/Unlock • Hold: Gemini
          </span>
        </div>

        {/* Physical Button Surface */}
        <div className="relative flex items-center justify-center">
          {/* Circular Charging Ring during Hold */}
          {isHolding && (
            <div className="absolute -inset-3 rounded-2xl pointer-events-none">
              <div
                className="w-full h-full rounded-2xl border-2 border-cyan-400 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                style={{
                  background: `conic-gradient(#06b6d4 ${holdProgress}%, transparent ${holdProgress}%)`,
                }}
              />
            </div>
          )}

          {/* Actual Tactile Button */}
          <button
            type="button"
            id="android-power-lock-hardware-button"
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            className={`relative w-8 sm:w-10 h-24 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-between py-2 transition-all cursor-pointer shadow-2xl active:scale-95 ${
              isHolding
                ? 'bg-gradient-to-b from-cyan-500 via-indigo-500 to-fuchsia-500 border-white shadow-[0_0_30px_rgba(6,182,212,0.9)] text-white scale-105'
                : isPhoneLocked
                ? 'bg-slate-900/90 border-rose-500/70 hover:border-rose-400 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-slate-900/90 border-cyan-500/70 hover:border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
            title="Press to Lock/Unlock • Press & Hold (500ms) for Google Gemini / Assistant"
          >
            {/* Top Icon: Lock/Unlock */}
            <div className="flex flex-col items-center">
              {isPhoneLocked ? (
                <Lock className="w-4 h-4 text-rose-400" />
              ) : (
                <Unlock className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            {/* Middle: Power symbol */}
            <div className="w-6 h-6 rounded-full bg-slate-950/80 border border-slate-700/80 flex items-center justify-center">
              <Power className="w-3.5 h-3.5" />
            </div>

            {/* Bottom: Gemini / Sparkles icon */}
            <div className="flex flex-col items-center">
              <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
              <span className="text-[7px] font-black uppercase tracking-tighter text-slate-300">
                Gemini
              </span>
            </div>
          </button>
        </div>

        {/* Android Setup Guide Button */}
        <button
          type="button"
          id="btn-open-power-button-guide"
          onClick={() => {
            triggerHaptic([30]);
            onOpenGuide();
          }}
          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 shadow-lg text-[10px] flex items-center gap-1 transition-all"
          title="How to configure Power Button on Android Phone"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Settings Guide</span>
        </button>
      </div>

      {/* Floating Toast when Gemini / Jarvis is invoked via Power Button */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[130] w-[90%] max-w-md p-3.5 rounded-2xl bg-slate-950/95 border-2 border-cyan-400 text-white shadow-[0_0_35px_rgba(6,182,212,0.6)] backdrop-blur-2xl animate-fade-in flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              Power Button Trigger
            </p>
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              Google Gemini / JARVIS Voice Activated!
            </h4>
            <p className="text-[11px] text-slate-300">
              Mic listening active. Bolna shuru karein...
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Android Physical Power Button Setup Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-cyan-500/70 rounded-3xl p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>Phone Lock & Power Button (Google Gemini) Guide</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    फोन के लॉक बटन से गूगल जेमिनी / जार्विस कैसे चालू करें
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseGuide}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Interactive Demo Box */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Power Button Test</span>
                </span>
                <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/30 font-semibold">
                  Live in this App
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Screen ke right side me jo <strong className="text-white">Power / Lock Button</strong> widget hai:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] font-bold text-rose-300">1. Single Tap / Click:</p>
                  <p className="text-[10px] text-slate-400">Phone turant Lock ya Unlock hota hai.</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] font-bold text-cyan-300">2. Press & Hold (500ms):</p>
                  <p className="text-[10px] text-slate-400">Google Gemini & Jarvis assistant chalu hota hai!</p>
                </div>
              </div>
            </div>

            {/* Android Physical Phone Setup Steps */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                📱 Real Android Phone Hardware Setup Steps:
              </h4>

              <div className="flex flex-col gap-2 text-xs text-slate-300">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-white">Power Button Gesture चालू करें:</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Apne phone ki <strong className="text-slate-200">Settings</strong> ➜{' '}
                      <strong className="text-slate-200">System</strong> (ya Gestures) ➜{' '}
                      <strong className="text-slate-200">"Press and hold power button"</strong> par jayein aur{' '}
                      <strong className="text-cyan-300">"Digital Assistant"</strong> select karein.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-white">Default Digital Assistant Select करें:</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Phone <strong className="text-slate-200">Settings</strong> ➜{' '}
                      <strong className="text-slate-200">Apps</strong> ➜{' '}
                      <strong className="text-slate-200">Default Apps</strong> ➜{' '}
                      <strong className="text-slate-200">Digital Assistant App</strong> me Google Gemini ya Chrome/Jarvis applet set karein.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-white">Voice Commands भी इस्तेमाल करें:</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Aap sidhe bol sakte hain: <span className="text-emerald-300 font-mono">"Phone lock karo"</span> aur <span className="text-emerald-300 font-mono">"Phone unlock karo"</span>!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onCloseGuide();
                  triggerHaptic([40, 80]);
                  playAssistantInvokeSound();
                  onTriggerAssistant();
                  setShowToast('⚡ Google Gemini / JARVIS Activated via Power Button Hold!');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Assistant Hold Now (अभी टेस्ट करें)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
