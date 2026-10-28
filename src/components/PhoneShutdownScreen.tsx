import React, { useState } from 'react';
import { Power, Sparkles, Cpu, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';

interface PhoneShutdownScreenProps {
  isOpen: boolean;
  onPowerOn: () => void;
}

export const PhoneShutdownScreen: React.FC<PhoneShutdownScreenProps> = ({
  isOpen,
  onPowerOn,
}) => {
  const [isBooting, setIsBooting] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);

  if (!isOpen) return null;

  const handleStartBoot = () => {
    triggerHaptic([60, 40, 80]);
    setIsBooting(true);
    setBootProgress(10);

    const interval = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsBooting(false);
            setBootProgress(0);
            onPowerOn();
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div
      id="phone-shutdown-screen-overlay"
      className="fixed inset-0 z-[110] bg-black text-white flex flex-col items-center justify-between select-none p-6 animate-fade-in"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #030712 0%, #000000 100%)',
      }}
    >
      {/* Top subtle status */}
      <div className="w-full flex items-center justify-between text-xs text-slate-600 font-mono pt-4">
        <span>DEVICE STATUS: STANDBY</span>
        <span>ACPI S5 POWER OFF</span>
      </div>

      {/* Center Power Controls & Boot Animation */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-sm w-full">
        {isBooting ? (
          <div className="flex flex-col items-center animate-fade-in">
            {/* Pulsing Arc Reactor / Boot Emblem */}
            <div className="relative w-28 h-28 rounded-full border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.6)] animate-pulse mb-6">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-300 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-cyan-300 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-widest text-cyan-300 font-mono">
              JARVIS / MAYRA OS
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Booting System Telemetry & Background Core...
            </p>

            {/* Boot Progress Bar */}
            <div className="w-64 h-2 bg-slate-900 rounded-full border border-cyan-500/30 overflow-hidden mt-6">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 ease-out"
                style={{ width: `${bootProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-cyan-400 font-mono mt-2">{bootProgress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Interactive Power Button */}
            <button
              type="button"
              id="phone-shutdown-power-on-btn"
              onClick={handleStartBoot}
              className="group relative w-28 h-28 rounded-full bg-slate-950 border-2 border-slate-800 hover:border-cyan-500 flex items-center justify-center transition-all duration-300 active:scale-95 shadow-[0_0_30px_rgba(0,0,0,0.8)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]"
            >
              <div className="absolute inset-0 rounded-full border border-slate-700/40 group-hover:border-cyan-400/50 transition-colors" />
              <Power className="w-12 h-12 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </button>

            <h3 className="text-lg font-bold text-slate-200 mt-6 tracking-wide">
              Phone Shut Down / स्विच ऑफ है
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              System standby me hai. Turn on karne ke liye upar diye gaye Power button par tap karein.
            </p>

            <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Continuous Background Core Ready</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-[11px] text-slate-600 pb-4">
        <span>Hold Power Key or Tap Power icon to Restart</span>
      </div>
    </div>
  );
};
