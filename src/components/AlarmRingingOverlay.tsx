import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlarmClock, Bell, CheckCircle2, RefreshCw, Volume2, ShieldAlert } from 'lucide-react';
import { ScheduleItem } from '../types';
import { playAlertSound, speakJarvis } from '../utils/audioSynth';
import { triggerHaptic, triggerAlertHaptic } from '../utils/deviceHardware';

interface AlarmRingingOverlayProps {
  activeAlarm: ScheduleItem | null;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const AlarmRingingOverlay: React.FC<AlarmRingingOverlayProps> = ({
  activeAlarm,
  onDismiss,
  onSnooze,
}) => {
  useEffect(() => {
    if (!activeAlarm) return;

    // Continuous sound and custom alert vibration loop while ringing
    playAlertSound();
    triggerAlertHaptic('alarm');

    const title = activeAlarm.title;
    const cat = activeAlarm.category;
    speakJarvis(
      `Attention Sir. Your scheduled ${cat}, "${title}", is active right now.`
    );

    const interval = setInterval(() => {
      playAlertSound();
      triggerAlertHaptic('alarm');
    }, 4000);

    return () => clearInterval(interval);
  }, [activeAlarm]);

  if (!activeAlarm) return null;

  const isAlarm = activeAlarm.category === 'alarm';

  return (
    <AnimatePresence>
      <div
        id="jarvis-active-alarm-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-md p-6 rounded-3xl bg-gray-950 border-2 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.6)] text-center overflow-hidden"
        >
          {/* Pulsing Alert Radar Background */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0.05, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-64 h-64 rounded-full bg-cyan-500/20 blur-xl"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Icon */}
            <motion.div
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.8)] mb-4"
            >
              {isAlarm ? (
                <AlarmClock className="w-12 h-12 text-yellow-400" />
              ) : (
                <Bell className="w-12 h-12 text-cyan-400" />
              )}
            </motion.div>

            {/* Title & Status */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>TIMELY ALERT: {activeAlarm.category.toUpperCase()} ACTIVE</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-cyan-100 font-sans tracking-wide mb-1">
              {activeAlarm.title}
            </h2>

            <p className="text-base font-mono text-cyan-400 font-semibold mb-6">
              Scheduled for {activeAlarm.time} {activeAlarm.date ? `• ${activeAlarm.date}` : ''}
            </p>

            {/* Controls: Snooze & Dismiss */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                id="btn-alarm-snooze-5"
                onClick={() => onSnooze(5)}
                className="py-3 px-4 rounded-xl bg-gray-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/80 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>SNOOZE (5M)</span>
              </button>

              <button
                id="btn-alarm-dismiss"
                onClick={onDismiss}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>DISMISS</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
