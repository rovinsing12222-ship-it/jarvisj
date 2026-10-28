import React, { useState, useEffect, useMemo } from 'react';
import {
  Vibrate,
  Sliders,
  Sparkles,
  CheckCircle2,
  BellRing,
  PhoneCall,
  MessageSquare,
  Clock,
  ShieldAlert,
  Mic,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Upload,
  Volume2,
  X,
  Zap,
  Activity,
  Layers,
  Flame,
  Info,
} from 'lucide-react';
import {
  HapticAlertType,
  AlertHapticPatternConfig,
  AlertHapticsMap,
} from '../types';
import {
  getAllAlertHapticConfigs,
  getAlertHapticConfig,
  saveAlertHapticConfig,
  saveAllAlertHapticConfigs,
  resetAlertHapticConfig,
  DEFAULT_ALERT_HAPTICS,
  ALERT_PATTERN_PRESETS,
  testAlertHapticPattern,
  isVibrationSupported,
} from '../utils/hapticEngine';
import { triggerHaptic } from '../utils/deviceHardware';

interface HapticAlertCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAlert?: HapticAlertType;
  onSpeak?: (text: string) => void;
}

const ALERT_TABS: Array<{
  id: HapticAlertType;
  name: string;
  hindiName: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
}> = [
  {
    id: 'alarm',
    name: 'Alarms',
    hindiName: 'अलार्म व वेकअप',
    icon: BellRing,
    accentColor: 'text-amber-400 border-amber-500/50 bg-amber-500/10',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
  },
  {
    id: 'message',
    name: 'Messages',
    hindiName: 'एसएमएस व संदेश',
    icon: MessageSquare,
    accentColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'call',
    name: 'Phone Calls',
    hindiName: 'इनकमिंग कॉल',
    icon: PhoneCall,
    accentColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'reminder',
    name: 'Reminders',
    hindiName: 'टास्क व रिमाइंडर',
    icon: Clock,
    accentColor: 'text-purple-400 border-purple-500/50 bg-purple-500/10',
    badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
  },
  {
    id: 'emergency',
    name: 'Emergency',
    hindiName: 'सुरक्षा व चेतावनी',
    icon: ShieldAlert,
    accentColor: 'text-rose-400 border-rose-500/50 bg-rose-500/10',
    badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
  },
  {
    id: 'voice_wake',
    name: 'Voice Wake',
    hindiName: 'वॉयस ट्रिगर',
    icon: Mic,
    accentColor: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
    badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-500/30',
  },
];

export const HapticAlertCustomizerModal: React.FC<HapticAlertCustomizerModalProps> = ({
  isOpen,
  onClose,
  initialAlert = 'alarm',
  onSpeak,
}) => {
  const [activeAlert, setActiveAlert] = useState<HapticAlertType>(initialAlert);
  const [allConfigs, setAllConfigs] = useState<AlertHapticsMap>(() => getAllAlertHapticConfigs());
  const [isTesting, setIsTesting] = useState(false);
  const [currentTestStepIndex, setCurrentTestStepIndex] = useState<number | null>(null);
  const [hasVibrateSupport] = useState(() => isVibrationSupported());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');

  // Sync state if initialAlert changes
  useEffect(() => {
    if (initialAlert) {
      setActiveAlert(initialAlert);
    }
  }, [initialAlert]);

  // Current active configuration
  const currentConfig: AlertHapticPatternConfig = useMemo(() => {
    return allConfigs[activeAlert] || DEFAULT_ALERT_HAPTICS[activeAlert] || DEFAULT_ALERT_HAPTICS.alarm;
  }, [allConfigs, activeAlert]);

  // Total duration of a single loop
  const totalSingleDurationMs = useMemo(() => {
    return (currentConfig.pattern || []).reduce((acc, ms) => acc + ms, 0);
  }, [currentConfig.pattern]);

  // Total duration of all repeats
  const totalFullDurationMs = useMemo(() => {
    const loops = Math.max(1, currentConfig.repeatCount || 1);
    const gaps = (loops - 1) * 200;
    return totalSingleDurationMs * loops + gaps;
  }, [totalSingleDurationMs, currentConfig.repeatCount]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Update field in current alert
  const handleUpdateCurrentAlert = (patch: Partial<AlertHapticPatternConfig>, announce?: string) => {
    const updated = saveAlertHapticConfig(activeAlert, patch);
    setAllConfigs((prev) => ({
      ...prev,
      [activeAlert]: updated,
    }));
    if (announce) {
      showToast(announce);
      onSpeak?.(announce);
    }
  };

  // Live test vibration pattern
  const handleTestPattern = () => {
    triggerHaptic([20]);
    setIsTesting(true);

    const fullSequence = testAlertHapticPattern(
      currentConfig.pattern,
      currentConfig.intensityMultiplier,
      currentConfig.repeatCount
    );

    // Animate visual stepper through each pulse/pause
    let accumulatedTime = 0;
    const timeouts: any[] = [];

    const patternLen = currentConfig.pattern.length;
    const loops = Math.max(1, currentConfig.repeatCount || 1);

    for (let loop = 0; loop < loops; loop++) {
      for (let i = 0; i < patternLen; i++) {
        const stepTime = accumulatedTime;
        const dur = currentConfig.pattern[i];
        const timer = setTimeout(() => {
          setCurrentTestStepIndex(i);
        }, stepTime);
        timeouts.push(timer);
        accumulatedTime += dur;
      }
      if (loop < loops - 1) {
        accumulatedTime += 200; // inter-loop gap
      }
    }

    const endTimer = setTimeout(() => {
      setIsTesting(false);
      setCurrentTestStepIndex(null);
    }, Math.max(300, totalFullDurationMs + 100));
    timeouts.push(endTimer);
  };

  // Apply a preset to active alert
  const handleApplyPreset = (preset: typeof ALERT_PATTERN_PRESETS[0]) => {
    triggerHaptic([30, 40]);
    handleUpdateCurrentAlert(
      {
        pattern: [...preset.pattern],
        presetName: preset.name,
      },
      `Applied ${preset.name} to ${currentConfig.name}`
    );
    setSelectedStepIndex(0);
    // Instant test for tactile feedback
    testAlertHapticPattern(preset.pattern, currentConfig.intensityMultiplier, 1);
  };

  // Sequencer step manipulations
  const handleUpdateStepDuration = (index: number, newDuration: number) => {
    const clamped = Math.max(10, Math.min(1500, Math.round(newDuration)));
    const updatedPattern = [...currentConfig.pattern];
    updatedPattern[index] = clamped;
    handleUpdateCurrentAlert({
      pattern: updatedPattern,
      presetName: 'Custom Pattern',
    });
  };

  const handleToggleStepType = (index: number) => {
    triggerHaptic([20]);
    // Steps alternate: even = pulse, odd = pause
    // If user wants to swap, we can split or adjust
    showToast('Pulses (⚡) and Pauses (⏸) automatically alternate in hardware sequences.');
  };

  const handleAddStep = (type: 'pulse' | 'pause') => {
    triggerHaptic([25]);
    const updatedPattern = [...currentConfig.pattern];
    const defaultDur = type === 'pulse' ? 100 : 60;
    updatedPattern.push(defaultDur);
    handleUpdateCurrentAlert({
      pattern: updatedPattern,
      presetName: 'Custom Pattern',
    });
    setSelectedStepIndex(updatedPattern.length - 1);
    showToast(`Added ${defaultDur}ms ${type}`);
  };

  const handleRemoveStep = (index: number) => {
    if (currentConfig.pattern.length <= 1) {
      showToast('At least one vibration step is required');
      return;
    }
    triggerHaptic([25]);
    const updatedPattern = currentConfig.pattern.filter((_, i) => i !== index);
    handleUpdateCurrentAlert({
      pattern: updatedPattern,
      presetName: 'Custom Pattern',
    });
    setSelectedStepIndex(Math.max(0, index - 1));
    showToast('Step removed');
  };

  const handleResetCurrentAlert = () => {
    triggerHaptic([40, 60]);
    resetAlertHapticConfig(activeAlert);
    setAllConfigs(getAllAlertHapticConfigs());
    showToast(`Reset ${currentConfig.name} to factory default`);
  };

  const handleResetAllAlerts = () => {
    triggerHaptic([60, 60]);
    resetAlertHapticConfig();
    setAllConfigs(getAllAlertHapticConfigs());
    showToast('All alert vibration patterns restored to factory defaults');
  };

  const handleExportJson = () => {
    triggerHaptic([20]);
    const str = JSON.stringify(currentConfig, null, 2);
    try {
      navigator.clipboard.writeText(str);
      showToast('Pattern profile copied to clipboard!');
    } catch {
      showToast('Pattern profile JSON ready');
    }
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed.pattern) && parsed.pattern.length > 0) {
        handleUpdateCurrentAlert({
          pattern: parsed.pattern.map((n: any) => Math.max(10, Math.min(2000, Number(n) || 50))),
          presetName: parsed.presetName || 'Imported Profile',
          repeatCount: Math.max(1, Math.min(5, Number(parsed.repeatCount) || 1)),
          intensityMultiplier: Math.max(0.5, Math.min(2.0, Number(parsed.intensityMultiplier) || 1.0)),
        });
        setJsonImportOpen(false);
        setJsonText('');
        showToast('Pattern successfully imported!');
      } else {
        showToast('Invalid pattern array in JSON');
      }
    } catch (e) {
      showToast('Error parsing JSON text');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="jarvis-haptic-alert-customizer-modal"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950 border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-white overflow-hidden relative">
        {/* Glow corner highlights */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Vibrate className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  Haptic Alert Studio & Admin Customizer
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                  ADMIN TOOL
                </span>
                {!hasVibrateSupport && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    Visual Wave Simulation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Customize tactile vibration patterns, pulse rhythms & loops for Alarms, Messages, and Calls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-close-haptic-customizer"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ALERT TYPE SELECTOR TABS */}
        <div className="p-2 sm:p-3 bg-slate-900/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-10">
          {ALERT_TABS.map((tab) => {
            const isSelected = activeAlert === tab.id;
            const Icon = tab.icon;
            const cfg = allConfigs[tab.id];
            const isEnabled = cfg ? cfg.enabled : true;

            return (
              <button
                key={tab.id}
                type="button"
                id={`tab-alert-${tab.id}`}
                onClick={() => {
                  triggerHaptic([20]);
                  setActiveAlert(tab.id);
                  setSelectedStepIndex(0);
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.name}</span>
                {!isEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" title="Disabled" />
                )}
              </button>
            );
          })}
        </div>

        {/* TOAST FEEDBACK BANNER */}
        {toastMessage && (
          <div className="px-4 py-2 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between font-medium animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white text-[10px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. TOP ALERT SUMMARY & MASTER TOGGLE CARD */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                <Vibrate className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    {currentConfig.name}
                  </h3>
                  <span className="text-xs text-amber-300 font-medium">
                    ({currentConfig.hindiName})
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 text-[10px] font-mono border border-slate-700">
                    Preset: {currentConfig.presetName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {currentConfig.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                  <span>Steps: <strong className="text-white">{currentConfig.pattern.length}</strong></span>
                  <span>•</span>
                  <span>Loop Time: <strong className="text-cyan-300">{totalSingleDurationMs}ms</strong></span>
                  <span>•</span>
                  <span>Repeats: <strong className="text-amber-300">{currentConfig.repeatCount}x</strong></span>
                  <span>•</span>
                  <span>Total Duration: <strong className="text-white">{totalFullDurationMs}ms</strong></span>
                </div>
              </div>
            </div>

            {/* Master Toggle & Test Action */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-semibold">
                  {currentConfig.enabled ? 'Alert Vibration Active' : 'Muted'}
                </span>
                <button
                  type="button"
                  id="btn-toggle-alert-enabled"
                  onClick={() =>
                    handleUpdateCurrentAlert(
                      { enabled: !currentConfig.enabled },
                      `${currentConfig.name} vibration ${!currentConfig.enabled ? 'Enabled' : 'Disabled'}`
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    currentConfig.enabled ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                id="btn-test-alert-pattern"
                onClick={handleTestPattern}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isTesting
                    ? 'bg-amber-400 text-slate-950 shadow-amber-400/30 animate-pulse'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Vibrating Now...' : 'Test Pattern'}</span>
              </button>
            </div>
          </div>

          {/* 2. INTERACTIVE WAVEFORM SEQUENCER (BEAT & MILLISECOND STEP EDITOR) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Interactive Step Sequencer (Beat Timeline)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Alternates between ⚡ Vibration Pulses (even) and ⏸ Silent Pauses (odd)
              </span>
            </div>

            {/* Sequencer Visual Wave Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 min-h-[90px] flex flex-col justify-center">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
                {currentConfig.pattern.map((durationMs, idx) => {
                  const isPulse = idx % 2 === 0;
                  const isSelected = selectedStepIndex === idx;
                  const isCurrentlyPlaying = currentTestStepIndex === idx;

                  // Visual width proportional to duration
                  const minWidthPx = Math.max(38, Math.min(180, Math.round(durationMs * 0.4)));

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        triggerHaptic([15]);
                        setSelectedStepIndex(idx);
                      }}
                      style={{ width: `${minWidthPx}px` }}
                      className={`h-16 rounded-xl flex flex-col items-center justify-center p-1 relative transition-all cursor-pointer shrink-0 border text-center ${
                        isCurrentlyPlaying
                          ? 'bg-amber-400 text-slate-950 border-amber-300 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.6)] font-bold'
                          : isPulse
                          ? isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)] font-bold'
                            : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
                          : isSelected
                          ? 'bg-slate-700 text-white border-slate-400 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                      title={`Step #${idx + 1}: ${isPulse ? 'Vibration Pulse' : 'Silent Pause'} (${durationMs}ms)`}
                    >
                      <span className="text-[10px] opacity-75 leading-tight">
                        {isPulse ? '⚡ Pulse' : '⏸ Pause'}
                      </span>
                      <span className="text-xs font-mono font-bold mt-0.5">
                        {durationMs}ms
                      </span>
                      <span className="text-[8px] font-mono opacity-50 absolute bottom-0.5">
                        #{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sequencer Add Step Action Row */}
              <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-850">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddStep('pulse')}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pulse (⚡)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddStep('pause')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pause (⏸)</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Selected Step: <strong className="text-cyan-300">#{selectedStepIndex + 1}</strong>
                </div>
              </div>
            </div>

            {/* Selected Step Inspector & Fine-Tuning Slider */}
            {currentConfig.pattern[selectedStepIndex] !== undefined && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-850 border border-slate-750 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    #{selectedStepIndex + 1}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {selectedStepIndex % 2 === 0 ? '⚡ Vibration Pulse Duration' : '⏸ Silent Pause Gap'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Drag slider or click steps to calibrate millisecond cadence
                    </span>
                  </div>
                </div>

                {/* Duration Slider & Quick Controls */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={currentConfig.pattern[selectedStepIndex]}
                    onChange={(e) => handleUpdateStepDuration(selectedStepIndex, Number(e.target.value))}
                    className="flex-1 sm:w-44 accent-cyan-400 cursor-pointer"
                  />

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStepDuration(
                          selectedStepIndex,
                          currentConfig.pattern[selectedStepIndex] - 25
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer active:scale-95"
                      title="Decrease by 25ms"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300 min-w-[55px] text-center">
                      {currentConfig.pattern[selectedStepIndex]}ms
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStepDuration(
                          selectedStepIndex,
                          currentConfig.pattern[selectedStepIndex] + 25
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer active:scale-95"
                      title="Increase by 25ms"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStep(selectedStepIndex)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs cursor-pointer active:scale-95"
                    title="Delete this step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. PATTERN PRESET LIBRARY */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  One-Click Pattern Presets:
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Click any preset to apply directly to {currentConfig.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ALERT_PATTERN_PRESETS.map((preset) => {
                const isCurrent = currentConfig.presetName === preset.name;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-gradient-to-br from-cyan-950/90 to-slate-900 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {preset.name}
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>[{preset.pattern.join(', ')}]</span>
                      <span className="text-cyan-400 font-bold">Apply ➔</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. INTENSITY & REPEAT LOOPS CONFIGURATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Intensity Multiplier */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Vibration Strength (Multiplier):</span>
                </span>
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {currentConfig.intensityMultiplier}x
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Subtle', val: 0.7 },
                  { label: 'Standard', val: 1.0 },
                  { label: 'Strong', val: 1.3 },
                  { label: 'Max', val: 1.8 },
                ].map((tier) => (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => {
                      triggerHaptic([20]);
                      handleUpdateCurrentAlert({ intensityMultiplier: tier.val });
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      currentConfig.intensityMultiplier === tier.val
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Repeat Loop Count */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cadence Repeat Loop:</span>
                </span>
                <span className="font-mono text-xs font-bold text-amber-300">
                  {currentConfig.repeatCount} Repeat{currentConfig.repeatCount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      triggerHaptic([20]);
                      handleUpdateCurrentAlert({ repeatCount: count });
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      currentConfig.repeatCount === count
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {count}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. IMPORT / EXPORT JSON POPUP / DRAWER */}
          {jsonImportOpen && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/50 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import / Paste Custom Haptic JSON Profile:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setJsonImportOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='Paste JSON with {"pattern": [100, 50, 100], "presetName": "Custom", "repeatCount": 2}...'
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  Apply Imported Pattern
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetCurrentAlert}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset {currentConfig.name}</span>
            </button>

            <button
              type="button"
              onClick={handleResetAllAlerts}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Reset all alert patterns to factory standards"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset All Alerts</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Copy pattern JSON"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setJsonImportOpen(!jsonImportOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Done & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
