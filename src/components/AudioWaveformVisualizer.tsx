import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  Activity,
  Radio,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  BarChart2,
  Waves,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { AmbientNoiseState } from '../types';

export interface AudioWaveformVisualizerProps {
  isListening: boolean;
  transcript?: string;
  audioLevel?: number;
  onAudioLevelChange?: (level: number) => void;
  accentTheme?: 'cyan-emerald' | 'pink-rose' | 'cyber-amber';
  defaultMode?: 'fluid' | 'bars' | 'dual';
  height?: number;
  showControls?: boolean;
  showMetrics?: boolean;
  className?: string;
  isMuted?: boolean;
  onEnableMuted?: () => void;
  onAmbientNoiseChange?: (noise: AmbientNoiseState) => void;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isListening,
  transcript = '',
  audioLevel: externalAudioLevelProp,
  onAudioLevelChange,
  accentTheme = 'cyan-emerald',
  defaultMode = 'fluid',
  height = 110,
  showControls = true,
  showMetrics = true,
  className = '',
  isMuted = false,
  onEnableMuted,
  onAmbientNoiseChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<'fluid' | 'bars' | 'dual'>(defaultMode);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [peakLevel, setPeakLevel] = useState<number>(0);
  const [micStatus, setMicStatus] = useState<'idle' | 'active' | 'denied' | 'fallback'>('idle');
  const [sensitivity, setSensitivity] = useState<number>(1.2); // 1.2x default voice boost
  const [ambientNoise, setAmbientNoise] = useState<AmbientNoiseState>({
    level: 15,
    approxDb: 38,
    status: 'quiet',
    isTooLoud: false,
    suggestMute: false,
    autoMuted: false,
  });

  // Audio Context & Analyser Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const smoothVolumeRef = useRef<number>(0);
  const peakDecayRef = useRef<number>(0);
  const barPeaksRef = useRef<number[]>(new Array(36).fill(0));
  const noiseWindowRef = useRef<number[]>([]);
  const loudDurationRef = useRef<number>(0);
  const lastNoiseCheckRef = useRef<number>(Date.now());
  const onAudioLevelChangeRef = useRef(onAudioLevelChange);
  onAudioLevelChangeRef.current = onAudioLevelChange;
  const onAmbientNoiseChangeRef = useRef(onAmbientNoiseChange);
  onAmbientNoiseChangeRef.current = onAmbientNoiseChange;
  const externalAudioLevelRef = useRef<number>(externalAudioLevelProp ?? 0);

  useEffect(() => {
    if (typeof externalAudioLevelProp === 'number') {
      externalAudioLevelRef.current = externalAudioLevelProp;
    }
  }, [externalAudioLevelProp]);

  useEffect(() => {
    const handleGlobalMicVolume = (e: any) => {
      const vol = e.detail?.volume ?? e.detail?.audioLevel ?? 0;
      if (typeof vol === 'number') {
        externalAudioLevelRef.current = vol;
      }
    };
    window.addEventListener('jarvis:mic-volume', handleGlobalMicVolume);
    return () => window.removeEventListener('jarvis:mic-volume', handleGlobalMicVolume);
  }, []);

  // Cleanup helper
  const stopAudioPipeline = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    smoothVolumeRef.current = 0;
    setAudioLevel(0);
    setPeakLevel(0);
    onAudioLevelChangeRef.current?.(0);
  }, []);

  // Initialize live microphone audio capture and Web Audio Analyser
  useEffect(() => {
    if (!isListening) {
      stopAudioPipeline();
      setMicStatus('idle');
      return;
    }

    let isMounted = true;

    const startAudioStream = async () => {
      // Check if Web Speech API is present (Android Chrome, Mobile Safari, Desktop Chrome)
      // When SpeechRecognition is in use, acquiring an exclusive getUserMedia stream blocks the native
      // Android speech recognition engine from receiving audio data due to OS audio HAL exclusivity.
      const hasSpeechRecognition = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      const isMobileDevice = typeof navigator !== 'undefined' && (/android|iphone|ipad|ipod/i.test(navigator.userAgent || ''));

      if (hasSpeechRecognition || isMobileDevice) {
        // Use non-conflicting synthetic visualizer mode that dynamically reacts to speech events
        if (isMounted) {
          setMicStatus('active');
        }
        return;
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('getUserMedia not supported in this browser environment');
          if (isMounted) setMicStatus('fallback');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75; // Fast responsive tracking
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;
        source.connect(analyser);

        if (isMounted) {
          setMicStatus('active');
        }
      } catch (err: any) {
        console.warn('AudioWaveform mic stream access warning:', err.name || err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setMicStatus('denied');
          } else {
            setMicStatus('fallback');
          }
        }
      }
    };

    startAudioStream();

    return () => {
      isMounted = false;
      stopAudioPipeline();
    };
  }, [isListening, stopAudioPipeline]);

  // Listener for testing / simulating high ambient noise
  useEffect(() => {
    const handleSimulateNoise = () => {
      const simulated: AmbientNoiseState = {
        level: 78,
        approxDb: 82,
        status: 'too_loud',
        isTooLoud: true,
        suggestMute: true,
        autoMuted: Boolean(isMuted),
      };
      setAmbientNoise(simulated);
      onAmbientNoiseChangeRef.current?.(simulated);
      window.dispatchEvent(
        new CustomEvent('jarvis:ambient-noise', {
          detail: simulated,
        })
      );
    };

    window.addEventListener('jarvis:simulate-loud-noise', handleSimulateNoise);
    return () => window.removeEventListener('jarvis:simulate-loud-noise', handleSimulateNoise);
  }, [isMuted]);

  // Real-time 60fps Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;
    const freqData = new Uint8Array(128);
    const timeDomainData = new Uint8Array(128);

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const targetWidth = Math.floor(rect.width * dpr);
      const targetHeight = Math.floor(height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const displayH = height;
      const centerY = displayH / 2;

      // Clear with deep transparent gradient
      ctx.clearRect(0, 0, width, displayH);

      let instantVolume = 0;

      if (isListening && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(freqData);
        analyserRef.current.getByteTimeDomainData(timeDomainData);

        // Calculate Root-Mean-Square (RMS) amplitude
        let sumSquares = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const sample = (timeDomainData[i] - 128) / 128;
          sumSquares += sample * sample;
        }
        const rms = Math.sqrt(sumSquares / timeDomainData.length);

        // Normalize to 0-100 scale with logarithmic boost and user sensitivity
        const rawVol = Math.min(100, Math.round(Math.pow(rms * 4.2 * sensitivity, 0.85) * 100));
        instantVolume = rawVol;
      } else if (isListening || externalAudioLevelRef.current > 0) {
        // Real-time external microphone audio level tracking
        const ext = externalAudioLevelRef.current;
        if (ext > 0) {
          instantVolume = ext;
        } else if (micStatus === 'fallback') {
          const mockVoice = Math.sin(phaseRef.current * 2) * 15 + Math.cos(phaseRef.current * 5) * 10;
          instantVolume = Math.max(5, Math.min(60, 20 + mockVoice));
        } else {
          instantVolume = isListening ? 6 : 0;
        }
      } else {
        instantVolume = 0;
      }

      // Smooth volume interpolation (LERP)
      smoothVolumeRef.current += (instantVolume - smoothVolumeRef.current) * 0.28;
      const curVol = smoothVolumeRef.current;

      // Peak decay
      if (curVol > peakDecayRef.current) {
        peakDecayRef.current = curVol;
      } else {
        peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.4);
      }

      // Track ambient noise level and sustained loud environment detection
      const now = Date.now();
      if (now - lastNoiseCheckRef.current > 200) {
        lastNoiseCheckRef.current = now;
        if (isListening) {
          noiseWindowRef.current.push(curVol);
          if (noiseWindowRef.current.length > 15) {
            noiseWindowRef.current.shift();
          }

          const avgNoise =
            noiseWindowRef.current.reduce((a, b) => a + b, 0) / (noiseWindowRef.current.length || 1);
          const approxDb = Math.min(96, Math.round(35 + avgNoise * 0.58));
          const isLoudNow = avgNoise >= 55;

          if (isLoudNow) {
            loudDurationRef.current += 200;
          } else {
            loudDurationRef.current = Math.max(0, loudDurationRef.current - 120);
          }

          const shouldSuggest = loudDurationRef.current >= 1800;
          const noiseStatus: 'quiet' | 'normal' | 'loud' | 'too_loud' =
            avgNoise >= 60 ? 'too_loud' : avgNoise >= 40 ? 'loud' : avgNoise >= 20 ? 'normal' : 'quiet';

          const noiseUpdate: AmbientNoiseState = {
            level: Math.round(avgNoise),
            approxDb,
            status: noiseStatus,
            isTooLoud: shouldSuggest,
            suggestMute: shouldSuggest,
            autoMuted: Boolean(isMuted),
          };

          setAmbientNoise(noiseUpdate);
          onAmbientNoiseChangeRef.current?.(noiseUpdate);

          if (shouldSuggest) {
            window.dispatchEvent(
              new CustomEvent('jarvis:ambient-noise', {
                detail: noiseUpdate,
              })
            );
          }
        }
      }

      // Sync React state throttled for display
      if (Math.random() < 0.25) {
        setAudioLevel(Math.round(curVol));
        setPeakLevel(Math.round(peakDecayRef.current));
        onAudioLevelChangeRef.current?.(Math.round(curVol));

        // Dispatch global volume event for arc reactor / 3d avatar
        window.dispatchEvent(
          new CustomEvent('jarvis:mic-volume', {
            detail: {
              volume: Math.round(curVol),
              isSpeaking: curVol > 12,
            },
          })
        );
      }

      phaseRef.current += 0.04 + (curVol / 100) * 0.08;

      // Choose theme color palettes
      let primaryColor = '#06b6d4'; // Cyan
      let secondaryColor = '#10b981'; // Emerald
      let glowColor = 'rgba(6, 182, 212, ';
      let accentFill = 'rgba(16, 185, 129, ';

      if (accentTheme === 'pink-rose') {
        primaryColor = '#f43f5e';
        secondaryColor = '#ec4899';
        glowColor = 'rgba(244, 63, 94, ';
        accentFill = 'rgba(236, 72, 153, ';
      } else if (accentTheme === 'cyber-amber') {
        primaryColor = '#f59e0b';
        secondaryColor = '#eab308';
        glowColor = 'rgba(245, 158, 11, ';
        accentFill = 'rgba(234, 179, 8, ';
      }

      // MODE 1 & DUAL: Fluid Waveform Rendering
      if (visualMode === 'fluid' || visualMode === 'dual') {
        const waveScale = displayH * 0.42;
        const volFactor = isListening ? Math.max(0.06, curVol / 100) : 0.02;

        // Background Ambient Glow Wave
        ctx.beginPath();
        for (let x = 0; x <= width; x += 4) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI); // Pin ends to 0
          const angle = normX * Math.PI * 4 + phaseRef.current;
          const y = centerY + Math.sin(angle) * waveScale * volFactor * envelope * 1.3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${accentFill}0.35)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Secondary Harmonic Wave
        ctx.beginPath();
        for (let x = 0; x <= width; x += 3) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);
          const angle = normX * Math.PI * 6 - phaseRef.current * 1.4;
          const y = centerY + Math.cos(angle) * waveScale * volFactor * 0.8 * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${glowColor}0.5)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Main Vivid Core Waveform
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);

          // Modulate with real frequency slice if available
          let freqOffset = 0;
          if (analyserRef.current && freqData.length > 0) {
            const dataIndex = Math.min(
              freqData.length - 1,
              Math.floor(Math.abs(normX - 0.5) * 2 * (freqData.length / 2))
            );
            freqOffset = ((freqData[dataIndex] - 128) / 128) * waveScale * 0.25 * envelope;
          }

          const angle = normX * Math.PI * 5 + phaseRef.current * 1.8;
          const y = centerY + (Math.sin(angle) * waveScale * volFactor * envelope + freqOffset);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.shadowBlur = curVol > 20 ? 14 : 6;
        ctx.shadowColor = primaryColor;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = curVol > 25 ? 3 : 2;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow

        // Central Energy Node Particles along Wave
        if (isListening && curVol > 8) {
          const particleCount = 5;
          for (let p = 1; p <= particleCount; p++) {
            const px = (width / (particleCount + 1)) * p;
            const normX = px / width;
            const envelope = Math.sin(normX * Math.PI);
            const py = centerY + Math.sin(normX * Math.PI * 5 + phaseRef.current * 1.8) * waveScale * volFactor * envelope;

            ctx.beginPath();
            ctx.arc(px, py, 2.5 + (curVol / 100) * 3, 0, Math.PI * 2);
            ctx.fillStyle = curVol > 30 ? '#ffffff' : primaryColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = secondaryColor;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // MODE 2 & DUAL: Frequency Spectrum Equalizer Bars
      if (visualMode === 'bars' || visualMode === 'dual') {
        const numBars = 32;
        const barSpacing = width / numBars;
        const barWidth = Math.max(2.5, barSpacing * 0.65);
        const maxBarH = displayH * (visualMode === 'dual' ? 0.35 : 0.85);

        for (let i = 0; i < numBars; i++) {
          // Center-mirrored index mapping for symmetrical visual appeal
          const distFromCenter = Math.abs(i - (numBars - 1) / 2) / (numBars / 2);
          const freqIndex = Math.min(freqData.length - 1, Math.floor((1 - distFromCenter) * 38));

          let rawAmp = 0;
          if (isListening && analyserRef.current) {
            rawAmp = (freqData[freqIndex] / 255) * sensitivity;
          } else if (isListening || externalAudioLevelRef.current > 0 || curVol > 2) {
            const extLevel = Math.max(curVol, externalAudioLevelRef.current) / 100;
            const distFactor = 1 - distFromCenter * 0.42;
            const barSine =
              Math.sin(phaseRef.current * 3.4 + i * 0.45) * 0.4 +
              Math.cos(phaseRef.current * 1.8 + i * 0.28) * 0.3 +
              0.5;
            rawAmp = Math.max(0.05, barSine * Math.max(0.12, extLevel * 1.35) * distFactor);
          } else {
            // Calm resting baseline bar chart
            rawAmp = 0.035;
          }

          const barH = Math.max(3, rawAmp * maxBarH);

          // Update peak tracker
          if (barH > barPeaksRef.current[i]) {
            barPeaksRef.current[i] = barH;
          } else {
            barPeaksRef.current[i] = Math.max(3, barPeaksRef.current[i] - 1.2);
          }

          const x = i * barSpacing + (barSpacing - barWidth) / 2;
          const y = visualMode === 'dual' ? displayH - barH - 2 : centerY - barH / 2;

          // Gradient color: Cyan -> Emerald -> Rose for hot peaks
          const grad = ctx.createLinearGradient(x, y + barH, x, y);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
          grad.addColorStop(0.6, primaryColor);
          if (rawAmp > 0.6) {
            grad.addColorStop(1, '#f43f5e');
          } else {
            grad.addColorStop(1, secondaryColor);
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
          ctx.fill();

          // Peak floating cap dot
          const peakY = visualMode === 'dual' ? displayH - barPeaksRef.current[i] - 4 : centerY - barPeaksRef.current[i] / 2 - 2;
          ctx.fillStyle = barPeaksRef.current[i] > maxBarH * 0.6 ? '#f43f5e' : '#38bdf8';
          ctx.fillRect(x, peakY, barWidth, 1.5);
        }
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isListening, visualMode, height, accentTheme, sensitivity, micStatus]);

  // Calculate volume state badge label
  const getVolumeLabel = (level: number) => {
    if (!isListening) return 'Standby';
    if (level < 8) return 'Silent';
    if (level < 25) return 'Whisper';
    if (level < 60) return 'Clear Speech';
    return 'High Volume';
  };

  return (
    <div
      id="jarvis-audio-waveform-container"
      className={`w-full rounded-2xl border transition-all duration-300 backdrop-blur-xl relative overflow-hidden select-none ${
        isListening
          ? 'bg-slate-950/90 border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
          : 'bg-slate-950/60 border-slate-800/80 shadow-inner'
      } ${className}`}
    >
      {/* Visualizer Top Bar & Status */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1 border-b border-slate-800/60 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-colors flex-shrink-0 ${
              isListening
                ? audioLevel > 15
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-cyan-400 animate-pulse'
                : 'bg-slate-600'
            }`}
          />
          <span className="font-bold text-slate-200 tracking-wide flex items-center gap-1.5 truncate">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isListening ? 'Real-Time Mic Waveform' : 'Waveform Standby'}</span>
          </span>

          {isListening && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border transition-all ${
                audioLevel > 50
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                  : audioLevel > 15
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
              }`}
            >
              {getVolumeLabel(audioLevel)}
            </span>
          )}
        </div>

        {/* Real-Time Metrics & Sensitivity Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Ambient Noise Level Indicator & Test Button */}
          <button
            type="button"
            id="btn-ambient-noise-pill"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('jarvis:simulate-loud-noise'));
            }}
            title="Ambient Noise Level (Click to test loud room detection & auto-mute suggestion)"
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 border transition-all cursor-pointer ${
              ambientNoise.status === 'too_loud'
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
                : ambientNoise.status === 'loud'
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-cyan-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                ambientNoise.status === 'too_loud'
                  ? 'bg-rose-400 animate-ping'
                  : ambientNoise.status === 'loud'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span>~{ambientNoise.approxDb} dB</span>
            <span className="hidden sm:inline text-[9px] uppercase tracking-wider">
              • {ambientNoise.status === 'too_loud' ? 'Too Loud' : ambientNoise.status}
            </span>
          </button>

          {showMetrics && isListening && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
              <span className="hidden sm:inline text-slate-400">Level:</span>
              <span className="font-bold text-cyan-300 min-w-[34px] text-right">{audioLevel}%</span>
              <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 hidden xs:block">
                <div
                  className="h-full transition-all duration-75 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-rose-500"
                  style={{ width: `${Math.min(100, audioLevel)}%` }}
                />
              </div>
            </div>
          )}

          {/* Mode Switcher Buttons */}
          {showControls && (
            <div className="flex items-center bg-slate-900/80 rounded-lg p-0.5 border border-slate-700/80">
              <button
                type="button"
                id="btn-wave-mode-fluid"
                onClick={() => setVisualMode('fluid')}
                title="Fluid Neon Wave"
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  visualMode === 'fluid'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Waves className="w-3 h-3" />
                <span className="hidden sm:inline">Wave</span>
              </button>
              <button
                type="button"
                id="btn-wave-mode-bars"
                onClick={() => setVisualMode('bars')}
                title="Equalizer Spectrum Bars"
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  visualMode === 'bars'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span className="hidden sm:inline">Bars</span>
              </button>
              <button
                type="button"
                id="btn-wave-mode-dual"
                onClick={() => setVisualMode('dual')}
                title="Dual Wave & Spectrum"
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  visualMode === 'dual'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Dual</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Real-time Waveform Canvas */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-pointer"
          style={{ height: `${height}px` }}
          onClick={() => {
            // Cycle visual mode on canvas tap
            setVisualMode((prev) => (prev === 'fluid' ? 'bars' : prev === 'bars' ? 'dual' : 'fluid'));
          }}
        />

        {/* Live Audio Reaction Ripple Rings in Center */}
        {isListening && audioLevel > 15 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full border border-cyan-400/30 transition-all duration-100 ease-out"
              style={{
                width: `${Math.min(180, 40 + audioLevel * 1.5)}px`,
                height: `${Math.min(height * 0.9, 30 + audioLevel * 0.8)}px`,
                opacity: Math.min(0.6, audioLevel / 80),
                boxShadow: `0 0 20px rgba(6,182,212,${Math.min(0.4, audioLevel / 100)})`,
              }}
            />
          </div>
        )}

        {/* Idle / Permission Denied Helper Overlay */}
        {micStatus === 'denied' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-center">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Mic access blocked. Allow microphone in browser lock icon to react.</span>
            </div>
          </div>
        )}

        {!isListening && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-950/30">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-400 text-xs shadow-sm">
              <Mic className="w-3.5 h-3.5 text-slate-400" />
              <span>Tap microphone below to activate real-time waveform</span>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Mute Suggestion Banner when Ambient Noise is Too Loud */}
      {ambientNoise.isTooLoud && !isMuted && (
        <div
          id="wave-auto-mute-suggestion"
          className="px-3.5 py-2.5 bg-gradient-to-r from-amber-950/95 via-rose-950/90 to-amber-950/95 border-t border-amber-500/60 flex items-center justify-between gap-2.5 text-xs animate-fade-in shadow-inner"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
            <div className="truncate">
              <p className="text-amber-200 font-bold text-[11px] truncate">
                ⚠️ High Noise Detected (~{ambientNoise.approxDb} dB • {ambientNoise.level}%)
              </p>
              <p className="text-[10px] text-amber-300/85 truncate">
                Jarvis suggests enabling 'Muted' mode for clearer speech recognition
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-wave-suggest-enable-muted"
            onClick={() => onEnableMuted?.()}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 flex-shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Enable Muted</span>
          </button>
        </div>
      )}

      {/* Live Transcript / Speech Feedback Bar */}
      {isListening && (
        <div className="px-3.5 py-2 bg-slate-900/70 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                audioLevel > 10 ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <p className="text-slate-200 font-medium truncate">
              {transcript ? (
                <span className="text-white font-semibold">"{transcript}"</span>
              ) : (
                <span className="text-slate-400 italic">
                  Aap boliye, microphone live react karega...
                </span>
              )}
            </p>
          </div>

          {/* Quick Sensitivity Boost Adjustment */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              id="btn-wave-sensitivity-toggle"
              onClick={() => setSensitivity((s) => (s >= 1.8 ? 1.0 : s + 0.4))}
              title="Mic Gain Sensitivity"
              className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center gap-1"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>{Math.round(sensitivity * 100)}% Gain</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
