import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Activity,
  Sparkles,
  CheckCircle2,
  X,
  RotateCcw,
  Square,
  ArrowRight,
  ShieldCheck,
  Globe,
  Sliders,
  AlertCircle,
  HelpCircle,
  Gauge,
  Check,
} from 'lucide-react';
import {
  CALIBRATION_PROMPTS,
  getCalibrationProfile,
  saveCalibrationProfile,
  clearCalibrationProfile,
  submitVoiceCalibration,
  applyPhoneticCorrection,
} from '../utils/voiceCalibration';
import { AccentCalibrationProfile, PhoneticCorrectionResult } from '../types';

interface VoiceCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocale: string;
  onLocaleChange?: (locale: 'hi-IN' | 'en-IN' | 'en-US') => void;
}

export const VoiceCalibrationModal: React.FC<VoiceCalibrationModalProps> = ({
  isOpen,
  onClose,
  currentLocale,
  onLocaleChange,
}) => {
  const [phase, setPhase] = useState<'intro' | 'recording' | 'analyzing' | 'completed'>('intro');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [recordedTranscripts, setRecordedTranscripts] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [calibrationProfile, setCalibrationProfile] = useState<AccentCalibrationProfile | null>(null);
  const [activeStoredProfile, setActiveStoredProfile] = useState<AccentCalibrationProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Test sandbox state
  const [testInput, setTestInput] = useState<string>('jarvees vedar batao aur betri check karo');
  const [testResult, setTestResult] = useState<PhoneticCorrectionResult | null>(null);
  const [isLiveTesting, setIsLiveTesting] = useState<boolean>(false);

  // Refs for recording & audio stream
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const collectedTranscriptsRef = useRef<string[]>([]);
  const currentPromptIndexRef = useRef<number>(0);
  currentPromptIndexRef.current = currentPromptIndex;

  // Load existing profile on open
  useEffect(() => {
    if (isOpen) {
      const stored = getCalibrationProfile();
      setActiveStoredProfile(stored);
      if (stored && phase === 'intro') {
        setCalibrationProfile(stored);
      }
      setTestResult(applyPhoneticCorrection(testInput, stored));
    }
  }, [isOpen]);

  // Clean up hardware resources on unmount or close
  const cleanupHardware = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanupHardware();
      setPhase('intro');
      setSecondsRemaining(30);
      setLiveTranscript('');
      setErrorMessage(null);
    }
  }, [isOpen, cleanupHardware]);

  // Start 30-second calibration recording session
  const startCalibrationSession = async () => {
    setErrorMessage(null);
    setPhase('recording');
    setSecondsRemaining(30);
    setCurrentPromptIndex(0);
    setLiveTranscript('');
    setRecordedTranscripts([]);
    collectedTranscriptsRef.current = [];
    startTimeRef.current = Date.now();

    try {
      // 1. Initialize Microphone Audio Stream & Web Audio Analyser
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tickAudio = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(normalized);
          animFrameRef.current = requestAnimationFrame(tickAudio);
        };
        tickAudio();
      }

      // 2. Initialize Web Speech Recognition alongside audio capture
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLocale || 'en-IN';

        recognition.onresult = (e: any) => {
          let currentText = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const piece = e.results[i][0].transcript;
            currentText += piece + ' ';
            if (e.results[i].isFinal) {
              const cleaned = piece.trim();
              if (cleaned) {
                collectedTranscriptsRef.current.push(cleaned);
                setRecordedTranscripts([...collectedTranscriptsRef.current]);
              }
            }
          }
          setLiveTranscript(currentText.trim());
        };

        recognition.onerror = (e: any) => {
          console.warn('[Calibration Speech] Recognition error:', e.error);
        };

        recognition.onend = () => {
          // Restart if still in recording phase
          if (mediaStreamRef.current && startTimeRef.current > 0) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (recErr) {
          console.warn('SpeechRecognition failed to start in calibration:', recErr);
        }
      }

      // 3. 30-Second Countdown Timer with prompt pacing (every ~7.5 seconds)
      timerIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            finishCalibrationRecording();
            return 0;
          }
          // Auto-advance prompt index across the 30-second window
          const elapsed = 30 - (prev - 1);
          const nextIndex = Math.min(
            CALIBRATION_PROMPTS.length - 1,
            Math.floor(elapsed / 7.5)
          );
          if (nextIndex !== currentPromptIndexRef.current) {
            setCurrentPromptIndex(nextIndex);
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error starting calibration session:', err);
      cleanupHardware();
      setPhase('intro');
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission blocked. Please allow microphone access to calibrate your voice.'
          : 'Unable to start audio calibration. Please check your microphone connection.'
      );
    }
  };

  // Conclude 30-second recording and send to Gemini accent analysis
  const finishCalibrationRecording = async () => {
    cleanupHardware();
    setPhase('analyzing');

    const totalDurationMs = Date.now() - (startTimeRef.current || Date.now() - 30000);
    const transcripts = collectedTranscriptsRef.current;
    if (liveTranscript && !transcripts.includes(liveTranscript)) {
      transcripts.push(liveTranscript);
    }

    // Estimate speaking cadence (words per minute)
    const allWords = transcripts.join(' ').trim().split(/\s+/).filter(Boolean);
    const minutes = Math.max(0.1, totalDurationMs / 60000);
    const cadenceWpm = Math.round(allWords.length / minutes) || 135;

    try {
      const profile = await submitVoiceCalibration({
        prompts: CALIBRATION_PROMPTS.map((p) => p.text),
        transcripts: transcripts.length > 0 ? transcripts : ['Hey Jarvis turn on flashlight and check battery'],
        totalDurationMs,
        detectedCadenceWpm: cadenceWpm,
        clientLocale: currentLocale || 'en-IN',
      });

      setCalibrationProfile(profile);
      setTestResult(applyPhoneticCorrection(testInput, profile));
      setPhase('completed');
    } catch (err: any) {
      console.error('Error analyzing calibration profile:', err);
      setErrorMessage(err?.message || 'Failed to complete calibration analysis.');
      setPhase('intro');
    }
  };

  // Save profile and activate
  const handleSaveAndActivate = () => {
    if (!calibrationProfile) return;
    saveCalibrationProfile(calibrationProfile);
    setActiveStoredProfile(calibrationProfile);

    // If recommended locale is different, offer to switch
    if (
      onLocaleChange &&
      calibrationProfile.recommendedLocale &&
      calibrationProfile.recommendedLocale !== currentLocale &&
      ['hi-IN', 'en-IN', 'en-US'].includes(calibrationProfile.recommendedLocale)
    ) {
      onLocaleChange(calibrationProfile.recommendedLocale as any);
    }

    // Small vibration haptic
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
    onClose();
  };

  // Reset calibration
  const handleResetToDefault = () => {
    clearCalibrationProfile();
    setActiveStoredProfile(null);
    setCalibrationProfile(null);
    setTestResult(applyPhoneticCorrection(testInput, null));
    setPhase('intro');
  };

  // Live microphone test in sandbox
  const handleTestMicToggle = () => {
    if (isLiveTesting) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      setIsLiveTesting(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = calibrationProfile?.recommendedLocale || currentLocale || 'en-IN';

      rec.onresult = (e: any) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        if (text.trim()) {
          setTestInput(text.trim());
          setTestResult(applyPhoneticCorrection(text.trim(), calibrationProfile));
        }
      };

      rec.onend = () => {
        setIsLiveTesting(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = rec;
      rec.start();
      setIsLiveTesting(true);
    } catch {
      setIsLiveTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-calibration-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== 'recording' && phase !== 'analyzing') {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-sans">
                  Voice Calibration Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  30s Accent Tuning
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personalized phonetic adaptation for speech recognition accuracy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={phase === 'recording' || phase === 'analyzing'}
            aria-label="Close voice calibration modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. INTRO PHASE */}
          {phase === 'intro' && (
            <div className="space-y-5">
              {/* Current Status Pill Card */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-750 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      activeStoredProfile?.isActive
                        ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                        : 'bg-slate-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {activeStoredProfile?.isActive
                        ? `Calibrated: ${activeStoredProfile.accentName}`
                        : 'Speech Recognition: Default Generic Profile'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {activeStoredProfile?.isActive
                        ? `+${activeStoredProfile.accuracyBoostPercent}% Accuracy Boost • ${activeStoredProfile.recommendedLocale}`
                        : 'No accent profile stored. Standard recognition accuracy.'}
                    </div>
                  </div>
                </div>

                {activeStoredProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCalibrationProfile(activeStoredProfile);
                      setTestResult(applyPhoneticCorrection(testInput, activeStoredProfile));
                      setPhase('completed');
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition-all cursor-pointer"
                  >
                    View Active Tuning
                  </button>
                )}
              </div>

              {/* How it works explanation */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>How 30-Second Voice Calibration Works</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Default speech engines frequently misunderstand regional pronunciations (like
                  Indian English retroflex stops, <span className="text-slate-200 font-mono">v/w</span> shifts,
                  or Hinglish cadence). In this 30-second session:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
                    <div className="text-amber-400 font-bold text-xs mb-1">1. Read 4 Sentences</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      Speak 4 guided sentences covering key phonemes and assistant commands.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
                    <div className="text-cyan-400 font-bold text-xs mb-1">2. Phonetic Analysis</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      Gemini compares intended words with recognized speech to identify dialect traits.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
                    <div className="text-emerald-400 font-bold text-xs mb-1">3. Instant Boost</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      Custom phonetic shift map corrects misheard words before executing commands.
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Sentences */}
              <div className="space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-1">
                  Calibration Sentences Preview
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2 text-xs text-slate-300">
                  {CALIBRATION_PROMPTS.map((p, idx) => (
                    <div key={p.id} className="flex items-start gap-2">
                      <span className="text-amber-400 font-mono font-bold">{idx + 1}.</span>
                      <span className="text-slate-300 italic">"{p.text}"</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Button Action */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Locale: {currentLocale || 'en-IN'}</span>
                </div>

                <button
                  id="btn-start-calibration-session"
                  type="button"
                  onClick={startCalibrationSession}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start 30s Calibration</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. RECORDING PHASE */}
          {phase === 'recording' && (
            <div className="space-y-6 text-center">
              {/* 30-Second Countdown Dial */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-amber-400 transition-all duration-1000 ease-linear"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - secondsRemaining / 30)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-amber-300 font-mono tracking-tighter">
                      {secondsRemaining}s
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Remaining
                    </span>
                  </div>
                </div>

                {/* Real-time Dynamic Audio Visualizer Bar */}
                <div className="mt-3 flex items-center justify-center gap-1 h-6 w-48">
                  {[...Array(16)].map((_, i) => {
                    const barHeight = Math.max(
                      3,
                      Math.min(24, (audioLevel / 100) * 24 * (0.4 + 0.6 * Math.sin((i / 16) * Math.PI)))
                    );
                    return (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-amber-400 transition-all duration-75"
                        style={{ height: `${barHeight}px` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Active Guided Prompt Card */}
              <div className="p-5 rounded-3xl bg-slate-850 border-2 border-amber-500/40 shadow-xl space-y-2 text-left relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <span>Phrase {currentPromptIndex + 1} of 4</span>
                  <span className="text-slate-400 font-normal lowercase">
                    {CALIBRATION_PROMPTS[currentPromptIndex].phoneticFocus}
                  </span>
                </div>

                <div className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed pt-1">
                  "{CALIBRATION_PROMPTS[currentPromptIndex].text}"
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span>Speak naturally in your normal speaking accent and pace</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPromptIndex((prev) => (prev + 1) % CALIBRATION_PROMPTS.length);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next sentence</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Live Transcript Display */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>Live Speech Recognition Hearing:</span>
                </div>
                <div className="text-xs text-slate-300 font-mono italic min-h-[1.5rem]">
                  {liveTranscript || 'Listening to your voice...'}
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    cleanupHardware();
                    setPhase('intro');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  id="btn-finish-calibration-early"
                  type="button"
                  onClick={finishCalibrationRecording}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Finished Reading (Analyze Now)</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. ANALYZING PHASE */}
          {phase === 'analyzing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                <Activity className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">
                  Calibrating Phonetic Models...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Gemini is analyzing acoustic traits, regional phonetic shifts, and retroflex
                  markers to construct your personalized accent profile.
                </p>
              </div>
            </div>
          )}

          {/* 4. COMPLETED PHASE */}
          {phase === 'completed' && calibrationProfile && (
            <div className="space-y-5">
              {/* Accent Result Hero Banner */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-100">
                        {calibrationProfile.accentName}
                      </h3>
                      <div className="text-xs text-slate-400">
                        Region: {calibrationProfile.dialectRegion} • {calibrationProfile.confidenceScore}% Confidence
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>+{calibrationProfile.accuracyBoostPercent}% Accuracy Boost</span>
                  </div>
                </div>

                {/* Phonetic Traits */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {calibrationProfile.primaryPhoneticTraits.map((trait, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-medium"
                    >
                      • {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Discovered Accent Phonetic Shift Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tuned Phonetic Shift Mappings (Auto-Corrected)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {Object.keys(calibrationProfile.phoneticShiftMap).length} Command Rules
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {Object.entries(calibrationProfile.phoneticShiftMap)
                    .slice(0, 10)
                    .map(([canonical, variants]) => {
                      const list = Array.isArray(variants) ? variants : [String(variants)];
                      return (
                        <div
                          key={canonical}
                          className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="text-rose-300/80 font-mono line-through mr-1.5">
                              {list.slice(0, 2).join(', ')}
                            </span>
                            <span className="text-slate-400 font-sans">➔</span>
                          </div>
                          <span className="font-bold text-emerald-300 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            {canonical}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Live Test Sandbox Bar */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Calibrated Recognition</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleTestMicToggle}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      isLiveTesting
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{isLiveTesting ? 'Stop Speaking' : 'Speak Test Command'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => {
                      setTestInput(e.target.value);
                      setTestResult(applyPhoneticCorrection(e.target.value, calibrationProfile));
                    }}
                    placeholder="Try speaking with your accent (e.g., jarvees vedar aur betri)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {testResult && (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-400 text-[11px]">Corrected to:</span>
                      <span className="font-bold text-emerald-300 font-mono truncate">
                        "{testResult.correctedText}"
                      </span>
                    </div>

                    {testResult.corrections.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                        {testResult.corrections.length} Accent Shift(s) Fixed
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">No shifts needed</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startCalibrationSession}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-Calibrate (30s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>

                <button
                  id="btn-save-and-activate-calibration"
                  type="button"
                  onClick={handleSaveAndActivate}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Enable Accent Tuning</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
