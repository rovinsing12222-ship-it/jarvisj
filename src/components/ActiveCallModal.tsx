import React, { useState, useEffect, useMemo } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  MessageCircle,
  RotateCcw,
  User,
  Shield,
  Clock,
  CheckCircle2,
  Activity,
  Wifi,
  Radio,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
} from 'lucide-react';
import { Contact } from '../types';
import { launchPhoneCall, launchWhatsApp, launchSms, triggerHaptic, triggerAlertHaptic } from '../utils/deviceHardware';
import { playBeepSound } from '../utils/audioSynth';

export interface CallSignalData {
  bars: number; // 1 to 4
  dbm: number; // signal strength in dBm (-70 to -110)
  latencyMs: number; // ping in ms
  jitterMs: number; // jitter in ms
  packetLossPct: number; // percentage
  stabilityScore: number; // 0 to 100%
  stability: 'excellent' | 'good' | 'fair' | 'weak';
  networkType: string;
  codec: string;
}

interface ActiveCallModalProps {
  contact: Contact;
  phoneNumber: string;
  onEndCall: () => void;
}

const generateSignalSnapshot = (forcedStability?: 'excellent' | 'good' | 'fair' | 'weak'): CallSignalData => {
  let stability: 'excellent' | 'good' | 'fair' | 'weak';
  let bars: number;

  if (forcedStability) {
    stability = forcedStability;
    bars = forcedStability === 'excellent' ? 4 : forcedStability === 'good' ? 3 : forcedStability === 'fair' ? 2 : 1;
  } else {
    // 75% chance excellent (4 bars), 20% good (3 bars), 5% fair (2 bars)
    const rand = Math.random();
    if (rand > 0.95) {
      bars = 2;
      stability = 'fair';
    } else if (rand > 0.75) {
      bars = 3;
      stability = 'good';
    } else {
      bars = 4;
      stability = 'excellent';
    }
  }

  const dbm =
    bars === 4
      ? -70 - Math.floor(Math.random() * 12)
      : bars === 3
      ? -83 - Math.floor(Math.random() * 10)
      : bars === 2
      ? -95 - Math.floor(Math.random() * 8)
      : -105 - Math.floor(Math.random() * 5);

  const latencyMs =
    bars === 4
      ? 22 + Math.floor(Math.random() * 12)
      : bars === 3
      ? 38 + Math.floor(Math.random() * 18)
      : bars === 2
      ? 60 + Math.floor(Math.random() * 25)
      : 95 + Math.floor(Math.random() * 40);

  const jitterMs =
    bars === 4
      ? 1 + Math.floor(Math.random() * 2)
      : bars === 3
      ? 2 + Math.floor(Math.random() * 3)
      : 4 + Math.floor(Math.random() * 5);

  const packetLossPct =
    bars === 4
      ? 0.0
      : bars === 3
      ? parseFloat((Math.random() * 0.1).toFixed(1))
      : parseFloat((Math.random() * 0.4 + 0.1).toFixed(1));

  const stabilityScore =
    bars === 4
      ? 97 + Math.floor(Math.random() * 3)
      : bars === 3
      ? 90 + Math.floor(Math.random() * 6)
      : bars === 2
      ? 78 + Math.floor(Math.random() * 10)
      : 60 + Math.floor(Math.random() * 15);

  return {
    bars,
    dbm,
    latencyMs,
    jitterMs,
    packetLossPct,
    stabilityScore,
    stability,
    networkType: '5G VoLTE',
    codec: 'Opus HD 48kHz',
  };
};

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  contact,
  phoneNumber,
  onEndCall,
}) => {
  const [callDurationSecs, setCallDurationSecs] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callState, setCallState] = useState<'connecting' | 'connected'>('connecting');
  const [signalData, setSignalData] = useState<CallSignalData>(() => generateSignalSnapshot('excellent'));
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Simulate call connection after 1.8 seconds
  useEffect(() => {
    // Fire customizable incoming/outgoing call vibration cadence
    triggerAlertHaptic('call');
    const timer = setTimeout(() => {
      setCallState('connected');
      triggerHaptic([30, 30]);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Duration timer
  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setCallDurationSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Real-time signal strength & call stability simulation
  useEffect(() => {
    if (callState !== 'connected') return;

    // Pulse signal changes every 3.5 seconds
    const interval = setInterval(() => {
      setSignalData((prev) => {
        // Natural gentle drift around the current signal condition
        return generateSignalSnapshot();
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleRedial = () => {
    triggerHaptic([40, 50]);
    playBeepSound();
    setCallDurationSecs(0);
    setCallState('connecting');
    setSignalData(generateSignalSnapshot('excellent'));
    launchPhoneCall(phoneNumber, contact.name);
  };

  const handleWhatsApp = () => {
    triggerHaptic([30]);
    launchWhatsApp(phoneNumber, `Hi ${contact.name}, calling you via Jarvis AI.`);
  };

  const handleSms = () => {
    triggerHaptic([30]);
    launchSms(phoneNumber, `Hi ${contact.name}, this is an urgent message.`);
  };

  const handleCycleStability = () => {
    triggerHaptic([25]);
    const sequence: Array<'excellent' | 'good' | 'fair' | 'weak'> = ['excellent', 'good', 'fair', 'weak'];
    const nextIdx = (sequence.indexOf(signalData.stability) + 1) % sequence.length;
    setSignalData(generateSignalSnapshot(sequence[nextIdx]));
  };

  // Signal color helper
  const stabilityConfig = useMemo(() => {
    switch (signalData.stability) {
      case 'excellent':
        return {
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500',
          borderColor: 'border-emerald-500/40',
          containerBg: 'bg-emerald-950/60',
          label: 'Optimal Stability',
          badgeText: 'HD Voice • Stable',
        };
      case 'good':
        return {
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-500',
          borderColor: 'border-cyan-500/40',
          containerBg: 'bg-cyan-950/60',
          label: 'Good Connection',
          badgeText: 'HD Voice • Good',
        };
      case 'fair':
        return {
          color: 'text-amber-400',
          bgColor: 'bg-amber-500',
          borderColor: 'border-amber-500/40',
          containerBg: 'bg-amber-950/60',
          label: 'Moderate Stability',
          badgeText: 'Fluctuating Signal',
        };
      case 'weak':
      default:
        return {
          color: 'text-rose-400',
          bgColor: 'bg-rose-500',
          borderColor: 'border-rose-500/40',
          containerBg: 'bg-rose-950/60',
          label: 'Weak Signal',
          badgeText: 'Reconnecting...',
        };
    }
  }, [signalData.stability]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-slate-100 flex flex-col items-center text-center max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Top Header Bar: Call Status + Live Signal Strength & Stability Indicator */}
        <div className="w-full flex items-center justify-between gap-2 mb-5">
          {/* Call Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                callState === 'connecting' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span>{callState === 'connecting' ? 'Connecting...' : 'Active Call'}</span>
          </div>

          {/* Real-time Signal Strength Meter */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic([20]);
              setShowDiagnostics((prev) => !prev)}
            }
            className={`px-2.5 py-1 rounded-full border text-xs font-mono flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm ${stabilityConfig.containerBg} ${stabilityConfig.borderColor} ${stabilityConfig.color}`}
            title="Click to view real-time call stability & network diagnostics"
          >
            {/* 4-Bar Stepped Signal Meter */}
            <div className="flex items-end gap-0.5 h-3.5" aria-label={`Signal strength: ${signalData.bars} of 4 bars`}>
              {[1, 2, 3, 4].map((barLevel) => {
                const isActive = signalData.bars >= barLevel;
                const heightClass =
                  barLevel === 1 ? 'h-1.5' : barLevel === 2 ? 'h-2' : barLevel === 3 ? 'h-2.5' : 'h-3.5';
                return (
                  <span
                    key={barLevel}
                    className={`w-1 rounded-xs transition-all duration-300 ${heightClass} ${
                      isActive ? stabilityConfig.bgColor : 'bg-slate-750'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-[11px]">{signalData.networkType}</span>
              <span className="text-[10px] opacity-80 hidden sm:inline">• {signalData.stabilityScore}%</span>
            </div>

            {showDiagnostics ? (
              <ChevronUp className="w-3 h-3 opacity-70" />
            ) : (
              <ChevronDown className="w-3 h-3 opacity-70" />
            )}
          </button>
        </div>

        {/* Contact Avatar */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_35px_rgba(6,182,212,0.4)] border-2 border-cyan-400/60 mb-4 transition-transform animate-pulse"
          style={{ backgroundColor: contact.avatarColor || '#0ea5e9' }}
        >
          {contact.name.charAt(0).toUpperCase()}
        </div>

        {/* Contact Name & Relation */}
        <h3 className="text-xl font-bold text-white tracking-wide">{contact.name}</h3>
        {contact.relation && (
          <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mt-1 font-medium">
            {contact.relation}
          </span>
        )}
        <p className="text-sm text-slate-400 font-mono mt-1">{phoneNumber}</p>

        {/* Call Duration */}
        <div className="mt-4 text-base font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>{callState === 'connecting' ? 'Dialing...' : formatDuration(callDurationSecs)}</span>
        </div>

        {/* Signal Stability Status Bar */}
        <div className="w-full mt-3 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${stabilityConfig.color} animate-pulse`} />
            <span className="text-slate-300 font-medium">Stability:</span>
            <span className={`font-bold ${stabilityConfig.color}`}>{signalData.stabilityScore}%</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>{signalData.dbm} dBm</span>
            <span>•</span>
            <span className="text-cyan-300 font-medium">{signalData.latencyMs}ms</span>
          </div>
        </div>

        {/* Expandable Real-time Network Stability & Diagnostics Drawer */}
        {showDiagnostics && (
          <div className="w-full mt-2 p-3 rounded-2xl bg-slate-950/90 border border-slate-750 text-left text-xs font-mono animate-fade-in shadow-inner">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
              <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>Call Stability Diagnostics</span>
              </span>
              <button
                type="button"
                onClick={handleCycleStability}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                title="Simulate network conditions shift"
              >
                Test Fluctuation
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Signal Power</span>
                <span className="font-semibold text-white">{signalData.dbm} dBm</span>
                <span className={`text-[10px] block ${stabilityConfig.color}`}>
                  {signalData.bars}/4 Bars ({stabilityConfig.label})
                </span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Voice Latency</span>
                <span className="font-semibold text-white">{signalData.latencyMs} ms</span>
                <span className="text-[10px] text-slate-400 block">Jitter: {signalData.jitterMs}ms</span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Packet Loss</span>
                <span className={`font-semibold ${signalData.packetLossPct > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {signalData.packetLossPct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {signalData.packetLossPct === 0 ? 'Lossless Stream' : 'Minor Dropped Frames'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Audio Codec</span>
                <span className="font-semibold text-cyan-300">{signalData.codec}</span>
                <span className="text-[10px] text-emerald-400 block">Full Duplex</span>
              </div>
            </div>

            {/* Stability Quality Meter Bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Call Stability Health</span>
                <span className={`font-bold ${stabilityConfig.color}`}>{signalData.stabilityScore}% ({stabilityConfig.label})</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stabilityConfig.bgColor}`}
                  style={{ width: `${signalData.stabilityScore}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Secondary In-Call Actions (Mute, Speaker, WhatsApp, SMS) */}
        <div className="grid grid-cols-4 gap-3 w-full mt-5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic([30]);
              setIsMuted(!isMuted);
            }}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer ${
              isMuted
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
            title="Mute microphone"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{isMuted ? 'Muted' : 'Mic'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic([30]);
              setIsSpeaker(!isSpeaker);
            }}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer ${
              isSpeaker
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
            title="Speaker toggle"
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{isSpeaker ? 'Speaker' : 'Earpiece'}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="p-3 rounded-2xl border border-emerald-500/50 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Open WhatsApp Chat"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleSms}
            className="p-3 rounded-2xl border border-blue-500/50 bg-blue-950/50 text-blue-300 hover:bg-blue-900/50 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Send SMS"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">SMS</span>
          </button>
        </div>

        {/* Primary Controls: Redial and END CALL */}
        <div className="flex items-center justify-center gap-4 w-full mt-5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleRedial}
            className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-90 cursor-pointer"
            title="Redial Call"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic([60, 80]);
              onEndCall();
            }}
            className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.5)] transition-all active:scale-95 cursor-pointer"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

