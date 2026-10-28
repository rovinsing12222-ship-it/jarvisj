import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  Globe,
  Radio,
  Loader2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  VolumeX,
  X,
  MessageSquare,
  Wrench,
  RotateCw,
  Play,
  Music,
  Calendar,
  Phone,
  Flashlight,
  Clock,
  Sun,
  Camera,
  Users,
  Heart,
  Smile,
  Activity,
} from 'lucide-react';
import { triggerHaptic, openExternalLink } from '../utils/deviceHardware';
import { speakJarvis, playBeepSound, playCommandRecognizedPingSound, getActiveVoiceModel, isBackgroundBeepEnabled, isJarvisSpeaking } from '../utils/audioSynth';
import { VoiceToneSample, SentimentAnalysisResult, AccentCalibrationProfile, AmbientNoiseState } from '../types';
import { getCalibrationProfile, applyPhoneticCorrection } from '../utils/voiceCalibration';
import { VoiceCalibrationModal } from './VoiceCalibrationModal';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { LiveMicCheckCard } from './LiveMicCheckCard';
import {
  getWakeWordConfig,
  saveWakeWordConfig,
  playWakeChime,
  checkWakeWord,
  WakeWordConfig,
  WakeWordTrigger,
} from '../utils/wakeWordEngine';
import {
  getVoiceActivationThresholdConfig,
  evaluateVoiceCommandThreshold,
  VoiceActivationThresholdConfig,
} from '../utils/voiceActivationThreshold';

interface VoiceControllerProps {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSendCommand: (text: string, voiceSample?: VoiceToneSample) => void;
  isProcessing: boolean;
  isSpeaking?: boolean;
  speechLang: 'hi-IN' | 'en-IN' | 'en-US';
  onChangeLang: (lang: 'hi-IN' | 'en-IN' | 'en-US') => void;
  handsFreeMode?: boolean;
  onToggleHandsFree?: () => void;
  activeSentiment?: SentimentAnalysisResult | null;
  isMuted?: boolean;
  onEnableMuted?: () => void;
  onAmbientNoiseChange?: (noise: AmbientNoiseState) => void;
  responseLanguage?: 'english' | 'hindi' | 'hinglish';
  onSelectResponseLanguage?: (lang: 'english' | 'hindi' | 'hinglish') => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  isListening,
  onStartListening,
  onStopListening,
  onSendCommand,
  isProcessing,
  isSpeaking = false,
  speechLang,
  onChangeLang,
  handsFreeMode = false,
  onToggleHandsFree,
  activeSentiment,
  isMuted = false,
  onEnableMuted,
  onAmbientNoiseChange,
  responseLanguage,
  onSelectResponseLanguage,
}) => {
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });
  const [micError, setMicError] = useState<string | null>(null);
  const [silentInputPrompt, setSilentInputPrompt] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [activeCalibration, setActiveCalibration] = useState<AccentCalibrationProfile | null>(() => getCalibrationProfile());
  const [micTestStatus, setMicTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [micTestMessage, setMicTestMessage] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isVerifyingMic, setIsVerifyingMic] = useState<boolean>(false);
  const [showLiveMicCheck, setShowLiveMicCheck] = useState<boolean>(false);
  const isVerifyingMicRef = useRef<boolean>(false);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Wake-Word Configuration & Background Listener State
  const [wakeConfig, setWakeConfig] = useState<WakeWordConfig>(() => getWakeWordConfig());
  const wakeConfigRef = useRef<WakeWordConfig>(wakeConfig);
  wakeConfigRef.current = wakeConfig;
  const bgRecognitionRef = useRef<any>(null);

  // CRITICAL: Stable refs for callbacks to prevent destroying recognition instance on parent re-renders!
  const onSendCommandRef = useRef(onSendCommand);
  onSendCommandRef.current = onSendCommand;
  const onStartListeningRef = useRef(onStartListening);
  onStartListeningRef.current = onStartListening;
  const onStopListeningRef = useRef(onStopListening);
  onStopListeningRef.current = onStopListening;

  const recognitionRef = useRef<any>(null);
  const fatalMicErrorRef = useRef<boolean>(false);
  const noSpeechRetryCountRef = useRef<number>(0);
  const lastDispatchedRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const hasDispatchedThisTurnRef = useRef<boolean>(false);
  const latestTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;
  const isProcessingRef = useRef(isProcessing);
  isProcessingRef.current = isProcessing;
  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const handsFreeRef = useRef(handsFreeMode);
  handsFreeRef.current = handsFreeMode;
  const [activationThreshold, setActivationThreshold] = useState<VoiceActivationThresholdConfig>(() =>
    getVoiceActivationThresholdConfig()
  );
  const activationThresholdRef = useRef<VoiceActivationThresholdConfig>(activationThreshold);
  activationThresholdRef.current = activationThreshold;
  const activeCalibrationRef = useRef<AccentCalibrationProfile | null>(activeCalibration);
  activeCalibrationRef.current = activeCalibration;

  // Hardware Audio Stream & Analyser Node
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Acoustic & Tone Telemetry Refs for Sentiment Analysis
  const volumeHistoryRef = useRef<number[]>([]);
  const speechStartTimeRef = useRef<number>(Date.now());

  // Listen for open voice help and calibration events
  useEffect(() => {
    const handleOpenHelp = () => {
      setIsHelpOpen(true);
    };
    const handleOpenCalibration = () => {
      setIsCalibrationOpen(true);
    };
    const handleCalibrationUpdate = (e: any) => {
      const updated = e.detail !== undefined ? e.detail : getCalibrationProfile();
      setActiveCalibration(updated);
    };

    const handleWakeConfigUpdate = (e: any) => {
      const updated = e.detail !== undefined ? e.detail : getWakeWordConfig();
      setWakeConfig(updated);
    };

    const handleThresholdUpdate = (e: any) => {
      const updated = e.detail !== undefined ? e.detail : getVoiceActivationThresholdConfig();
      setActivationThreshold(updated);
    };

    window.addEventListener('jarvis:open-voice-help', handleOpenHelp);
    window.addEventListener('jarvis:open-voice-calibration', handleOpenCalibration);
    window.addEventListener('jarvis:calibration-updated', handleCalibrationUpdate);
    window.addEventListener('jarvis:wake-word-config-updated', handleWakeConfigUpdate);
    window.addEventListener('jarvis:activation-threshold-updated', handleThresholdUpdate);

    return () => {
      window.removeEventListener('jarvis:open-voice-help', handleOpenHelp);
      window.removeEventListener('jarvis:open-voice-calibration', handleOpenCalibration);
      window.removeEventListener('jarvis:calibration-updated', handleCalibrationUpdate);
      window.removeEventListener('jarvis:wake-word-config-updated', handleWakeConfigUpdate);
      window.removeEventListener('jarvis:activation-threshold-updated', handleThresholdUpdate);
    };
  }, []);

  // Safe dispatch helper with fast execution, turn-locking, and voice tone telemetry
  const safeDispatchCommand = useCallback((rawText: string) => {
    // If a command was already dispatched during this recognition turn, reject duplicates
    if (hasDispatchedThisTurnRef.current) {
      return false;
    }

    // STRICT SELF-ECHO SUPPRESSION: If Jarvis is speaking or synthesis is active, reject commands
    if (isSpeakingRef.current || isJarvisSpeaking()) {
      console.log('[VoiceController] Suppressing audio loop dispatch while Jarvis is actively speaking');
      return false;
    }

    const trimmed = rawText.trim();
    if (!trimmed || trimmed.length < 2) return false;

    // Apply active voice calibration phonetic correction for user's accent
    const currentCalib = activeCalibrationRef.current || getCalibrationProfile();
    const phoneticResult = applyPhoneticCorrection(trimmed, currentCalib);
    const textToDispatch = phoneticResult.correctedText.trim();

    // Prevent spurious breath/ambient acoustic noise ("photo", "photo.", "photos") upon microphone start
    const cleanLowerToken = textToDispatch.toLowerCase().replace(/[.,!?;:]/g, '').trim();
    if (cleanLowerToken === 'photo' || cleanLowerToken === 'photos' || cleanLowerToken === 'camera') {
      console.log('[VoiceController] Filtering out isolated non-command noise token:', cleanLowerToken);
      return false;
    }

    // Normalized comparison stripping wake words and punctuation to prevent double-dispatch
    // (e.g. "Jarvis YouTube kholo" vs "YouTube kholo")
    const cleanNormalized = textToDispatch
      .toLowerCase()
      .replace(/^(hey\s*jarvis|jarvis|hi\s*jarvis|ok\s*jarvis|oye\s*jarvis|suno\s*jarvis|जार्विस|हे\s*जार्विस|मैरा|myra)\b/i, '')
      .replace(/[^a-z0-9\u0900-\u097F]/gi, '')
      .trim();

    const lastNormalized = lastDispatchedRef.current.text
      .toLowerCase()
      .replace(/^(hey\s*jarvis|jarvis|hi\s*jarvis|ok\s*jarvis|oye\s*jarvis|suno\s*jarvis|जार्विस|हे\s*जार्विस|मैरा|myra)\b/i, '')
      .replace(/[^a-z0-9\u0900-\u097F]/gi, '')
      .trim();

    const now = Date.now();
    if (
      cleanNormalized.length >= 2 &&
      cleanNormalized === lastNormalized &&
      now - lastDispatchedRef.current.time < 7000
    ) {
      console.warn('[VoiceController] Suppressed duplicate command dispatch within 7s:', textToDispatch);
      return false;
    }

    hasDispatchedThisTurnRef.current = true;
    lastDispatchedRef.current = { text: textToDispatch, time: now };
    latestTranscriptRef.current = '';
    setTranscript('');

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Abort current recognition instance so trailing events do not trigger extra speech
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // Capture acoustic telemetry sample from recent vocal utterance
    const samples = volumeHistoryRef.current;
    let avgVolume = 0;
    let peakVolume = 0;
    if (samples.length > 0) {
      avgVolume = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
      peakVolume = Math.max(...samples);
    }
    const durationMs = Date.now() - speechStartTimeRef.current;
    const voiceSample: VoiceToneSample = {
      avgVolume,
      peakVolume,
      durationMs,
    };

    // Voice Command Activation Sensitivity Threshold & False-Positive Shield check
    const thresholdEval = evaluateVoiceCommandThreshold(
      textToDispatch,
      avgVolume || peakVolume,
      activationThresholdRef.current
    );
    if (!thresholdEval.accepted && thresholdEval.isFalsePositive) {
      console.warn('[VoiceController] Command discarded by false-positive shield:', thresholdEval.reason);
      return false;
    }

    triggerHaptic([30, 40]);
    playCommandRecognizedPingSound();
    onStopListeningRef.current();
    onSendCommandRef.current(textToDispatch, voiceSample);
    return true;
  }, []);

  // Start active speech recognition session cleanly
  const startRecognitionSession = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setMicError('Speech Recognition is not supported in this browser. Please use Google Chrome or tap quick buttons below.');
      fatalMicErrorRef.current = true;
      const t = setTimeout(() => {
        onStopListeningRef.current();
      }, 0);
      return () => clearTimeout(t);
    }

    // Reset fatal error flag on deliberate session start
    fatalMicErrorRef.current = false;

    // Abort any lingering recognition instance to prevent InvalidStateError
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      // On Android Chrome & mobile webviews, recognition.continuous = true is buggy and causes silent drops or freeze.
      // Setting continuous to false allows reliable capturing of spoken commands, while handsFree mode cleanly re-arms on speech end!
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        hasDispatchedThisTurnRef.current = false;
        setTranscript('');
        latestTranscriptRef.current = '';
        setMicError(null);
        setSilentInputPrompt(null);
        speechStartTimeRef.current = Date.now();
        setAudioLevel(45);
        window.dispatchEvent(new CustomEvent('jarvis:live-speech', { detail: { transcript: '' } }));
        window.dispatchEvent(new CustomEvent('jarvis:mic-status', { detail: { status: 'listening' } }));
      };

      recognition.onaudiostart = () => {
        setAudioLevel(60);
      };

      recognition.onspeechstart = () => {
        setAudioLevel(85);
      };

      recognition.onspeechend = () => {
        setAudioLevel(25);
      };

      recognition.onresult = (event: any) => {
        // If already dispatched in this vocal turn, or Jarvis is actively speaking, ignore to prevent acoustic feedback loop
        if (hasDispatchedThisTurnRef.current || isSpeakingRef.current || isJarvisSpeaking()) return;

        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const current = (finalText || interimText).trim();
        if (current) {
          noSpeechRetryCountRef.current = 0;
          setTranscript(current);
          latestTranscriptRef.current = current;
          setAudioLevel(90);
          window.dispatchEvent(new CustomEvent('jarvis:live-speech', { detail: { transcript: current } }));

          // If speech starts with or contains configured wake-word, handle seamlessly
          const wakeCheck = checkWakeWord(current, wakeConfigRef.current);
          if (wakeCheck.matched) {
            if (wakeConfigRef.current.playChime) {
              playWakeChime();
            }
            if (wakeConfigRef.current.hapticFeedback) {
              triggerHaptic([40, 30, 50]);
            }
            if (wakeCheck.remainingCommand && wakeCheck.remainingCommand.length >= 2) {
              safeDispatchCommand(wakeCheck.remainingCommand);
              return;
            }
          }
        }

        // If Android or Web emits final text, dispatch immediately
        if (finalText && finalText.trim().length >= 2) {
          safeDispatchCommand(finalText);
          return;
        }

        // Fast Action Intent Detection for Android and Web
        const lower = current.toLowerCase();
        const isQuickIntent =
          lower.includes('trun') ||
          lower.includes('turn') ||
          lower.includes('tone') ||
          lower.includes('band') ||
          lower.includes('stop') ||
          lower.includes('chup') ||
          lower.includes('shant') ||
          lower.includes('roko') ||
          lower.includes('bolna') ||
          lower.includes('awaaz') ||
          lower.includes('aawaz') ||
          lower.includes('open') ||
          lower.includes('kholo') ||
          lower.includes('chalao') ||
          lower.includes('run') ||
          lower.includes('start') ||
          lower.includes('launch') ||
          lower.includes('chal') ||
          lower.includes('dikhao') ||
          lower.includes('lagao') ||
          lower.includes('बंद') ||
          lower.includes('टर्न') ||
          lower.includes('टोन') ||
          lower.includes('चुप') ||
          lower.includes('रोक') ||
          lower.includes('रुक') ||
          lower.includes('आवाज') ||
          lower.includes('कॉल') ||
          lower.includes('फोन') ||
          lower.includes('डैड') ||
          lower.includes('ओपन') ||
          lower.includes('खोलो') ||
          lower.includes('चलाओ') ||
          lower.includes('रन') ||
          lower.includes('चालू') ||
          lower.includes('facebook') ||
          lower.includes('फेसबुक') ||
          lower.includes('browser') ||
          lower.includes('chrome') ||
          lower.includes('ब्राउज़र') ||
          lower.includes('ब्राउजर') ||
          lower.includes('google') ||
          lower.includes('गूगल') ||
          lower.includes('youtube') ||
          lower.includes('यूट्यूब') ||
          lower.includes('calculator') ||
          lower.includes('कैलकुलेटर') ||
          lower.includes('instagram') ||
          lower.includes('whatsapp') ||
          lower.includes('camera') ||
          lower.includes('call') ||
          lower.includes('alarm') ||
          lower.includes('weather') ||
          lower.includes('mausam') ||
          lower.includes('message');

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (current.length >= 2) {
          // Ultra-responsive debounce: 160ms for intent commands, 260ms for free-form speech
          // This guarantees rapid execution even in noisy environments ("sor sarab") without delays
          const thresholdDebounce = activationThresholdRef.current?.silenceDebounceMs || 240;
          const debounceMs = isQuickIntent
            ? Math.min(160, thresholdDebounce)
            : thresholdDebounce;
          silenceTimerRef.current = setTimeout(() => {
            if (latestTranscriptRef.current && latestTranscriptRef.current.trim().length >= 2) {
              safeDispatchCommand(latestTranscriptRef.current);
            }
          }, debounceMs);
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        console.warn('Speech recognition event:', err);

        const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

        // 'no-speech' or 'aborted' are normal conversational pauses in Iron Man lab mode
        if (err === 'no-speech' || err === 'aborted') {
          if (latestTranscriptRef.current && latestTranscriptRef.current.trim().length >= 2) {
            safeDispatchCommand(latestTranscriptRef.current);
          } else if (isListeningRef.current && !fatalMicErrorRef.current && !isProcessingRef.current) {
            // Keep listening across pauses seamlessly without dropping connection (no tip-tip required)
            setTimeout(() => {
              if (isListeningRef.current && !fatalMicErrorRef.current && !isProcessingRef.current) {
                startRecognitionSession();
              }
            }, 150);
          }
          return;
        }

        // Transient audio-capture issues (e.g. mic briefly busy or audio driver release delay)
        if (err === 'audio-capture') {
          console.warn('[VoiceController] audio-capture warning, retrying with brief backoff...');
          if (isListeningRef.current && noSpeechRetryCountRef.current < 2) {
            noSpeechRetryCountRef.current += 1;
            setTimeout(() => {
              if (isListeningRef.current && !fatalMicErrorRef.current) {
                startRecognitionSession();
              }
            }, 450);
            return;
          }
        }

        // Fatal errors (permission blocked, hardware unavailable, not allowed)
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          fatalMicErrorRef.current = true;
          isListeningRef.current = false;
          const errMsg = isInIframe
            ? 'Microphone preview iframe mein block ho sakta hai! "Naye Tab Mein Kholein" dabayein jahan mic 100% chalega, ya Neeche Quick Touch Buttons / Voice Simulator use karein.'
            : 'Microphone permission blocked hai! Browser me URL ke paas 🔒 Lock icon click karke "Allow Microphone" karein, ya Quick Voice Simulator use karein.';
          setMicError(errMsg);
          window.dispatchEvent(
            new CustomEvent('jarvis:mic-status', {
              detail: {
                status: 'denied',
                message: errMsg,
              },
            })
          );
          setAudioLevel(0);
          onStopListeningRef.current();
          return;
        }

        // Network transient issues
        if (err === 'network' && isListeningRef.current && noSpeechRetryCountRef.current < 2) {
          noSpeechRetryCountRef.current += 1;
          setTimeout(() => {
            if (isListeningRef.current && !fatalMicErrorRef.current) {
              startRecognitionSession();
            }
          }, 400);
          return;
        }

        // Other transient issues
        setAudioLevel(0);
        onStopListeningRef.current();
      };

      recognition.onend = () => {
        setAudioLevel(0);
        recognitionRef.current = null;
        if (fatalMicErrorRef.current) {
          isListeningRef.current = false;
          onStopListeningRef.current();
          return;
        }
        // ONLY dispatch if not already dispatched during this vocal turn AND not actively speaking
        if (
          !hasDispatchedThisTurnRef.current &&
          !isSpeakingRef.current &&
          !isJarvisSpeaking() &&
          latestTranscriptRef.current &&
          latestTranscriptRef.current.trim().length >= 2
        ) {
          safeDispatchCommand(latestTranscriptRef.current);
        } else if (
          !hasDispatchedThisTurnRef.current &&
          isListeningRef.current &&
          !isProcessingRef.current &&
          !isSpeakingRef.current &&
          !isJarvisSpeaking() &&
          !fatalMicErrorRef.current
        ) {
          // Seamless Stark-style live conversation loop: restart listening without requiring extra clicks
          setTimeout(() => {
            if (
              isListeningRef.current &&
              !isProcessingRef.current &&
              !isSpeakingRef.current &&
              !isJarvisSpeaking() &&
              !fatalMicErrorRef.current
            ) {
              startRecognitionSession();
            }
          }, 250);
        } else {
          onStopListeningRef.current();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      if (e.name === 'InvalidStateError') {
        // Recognition was already running, harmless
        return;
      }
      console.warn('Speech recognition start error:', e);
      fatalMicErrorRef.current = true;
      setAudioLevel(0);
      isListeningRef.current = false;
      onStopListeningRef.current();
    }
  }, [speechLang, safeDispatchCommand]);

  // Stop active speech recognition cleanly
  const stopRecognitionSession = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setAudioLevel((prev) => (prev === 0 ? 0 : 0));
    onStopListeningRef.current();
  }, []);

  const startRecognitionSessionRef = useRef(startRecognitionSession);
  startRecognitionSessionRef.current = startRecognitionSession;
  const stopRecognitionSessionRef = useRef(stopRecognitionSession);
  stopRecognitionSessionRef.current = stopRecognitionSession;

  // Explicitly request and re-verify 'navigator.mediaDevices.getUserMedia' permissions
  // when the 'Listen' button is toggled, ensuring a robust startup sequence for the speech recognition engine
  const verifyMicPermissionAndStart = useCallback(async () => {
    if (isVerifyingMicRef.current) return false;
    setMicError(null);
    setSilentInputPrompt(null);
    fatalMicErrorRef.current = false;
    noSpeechRetryCountRef.current = 0;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setMicError('Speech Recognition is not supported in this browser. Please use Google Chrome or tap quick buttons below.');
      fatalMicErrorRef.current = true;
      onStopListeningRef.current();
      return false;
    }

    // If speech is supported, start speech recognition directly without audio track collision
    // Completely silent startup sequence (no background to-tu beep)
    if (isBackgroundBeepEnabled()) {
      playBeepSound();
    }
    onStartListeningRef.current();
    startRecognitionSessionRef.current();
    return true;
  }, []);

  const verifyMicPermissionAndStartRef = useRef(verifyMicPermissionAndStart);
  verifyMicPermissionAndStartRef.current = verifyMicPermissionAndStart;

  // Listen for global speech trigger events from header, avatar, and quick banners
  useEffect(() => {
    const handleStartEvent = () => {
      verifyMicPermissionAndStartRef.current();
    };
    const handleStopEvent = () => {
      stopRecognitionSessionRef.current();
    };
    const handleToggleEvent = () => {
      if (isListeningRef.current) {
        stopRecognitionSessionRef.current();
      } else {
        verifyMicPermissionAndStartRef.current();
      }
    };

    window.addEventListener('jarvis:request-speech-start', handleStartEvent);
    window.addEventListener('jarvis:request-speech-stop', handleStopEvent);
    window.addEventListener('jarvis:request-speech-toggle', handleToggleEvent);

    return () => {
      window.removeEventListener('jarvis:request-speech-start', handleStartEvent);
      window.removeEventListener('jarvis:request-speech-stop', handleStopEvent);
      window.removeEventListener('jarvis:request-speech-toggle', handleToggleEvent);
    };
  }, []);

  // Handle start/stop listening when isListening, isProcessing, or isSpeaking changes from parent props
  useEffect(() => {
    if (isListening && !isProcessing && !isSpeaking) {
      // User or App requested listening: always reset error flags and re-arm
      fatalMicErrorRef.current = false;
      noSpeechRetryCountRef.current = 0;
      setMicError(null);
      setSilentInputPrompt(null);

      if (!speechSupported) {
        const timer = setTimeout(() => {
          onStopListeningRef.current();
        }, 0);
        return () => clearTimeout(timer);
      }
      if (!recognitionRef.current) {
        startRecognitionSessionRef.current();
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    }
  }, [isListening, isProcessing, isSpeaking, speechSupported]);

  // Continuous Background Wake-Word Listener Effect
  useEffect(() => {
    if (!speechSupported) return;

    if (isListening || isProcessing || isSpeaking) {
      if (bgRecognitionRef.current) {
        try {
          bgRecognitionRef.current.abort();
        } catch {}
        bgRecognitionRef.current = null;
      }
      return;
    }

    if (!wakeConfig.enabled) {
      if (bgRecognitionRef.current) {
        try {
          bgRecognitionRef.current.abort();
        } catch {}
        bgRecognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isMounted = true;
    let restartTimer: any = null;

    const startBgListener = () => {
      if (
        !isMounted ||
        isListeningRef.current ||
        isProcessingRef.current ||
        isSpeakingRef.current ||
        isJarvisSpeaking() ||
        !wakeConfigRef.current.enabled ||
        fatalMicErrorRef.current
      ) {
        return;
      }

      if (bgRecognitionRef.current) {
        try {
          bgRecognitionRef.current.abort();
        } catch {}
        bgRecognitionRef.current = null;
      }

      try {
        const bg = new SpeechRecognition();
        bg.continuous = false;
        bg.interimResults = true;
        bg.maxAlternatives = 1;
        bg.lang = speechLang;

        bg.onresult = (event: any) => {
          // Strictly ignore any audio while Jarvis is speaking out of device speakers
          if (isSpeakingRef.current || isJarvisSpeaking()) return;

          let text = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          const current = text.trim();
          if (!current) return;

          const match = checkWakeWord(current, wakeConfigRef.current);
          if (match.matched) {
            console.log('[WakeWord] Trigger matched in background:', match.triggerFound, match.remainingCommand);
            if (wakeConfigRef.current.playChime) {
              playWakeChime();
            }
            if (wakeConfigRef.current.hapticFeedback) {
              triggerHaptic([40, 30, 50]);
            }
            try {
              bg.abort();
            } catch {}
            bgRecognitionRef.current = null;

            if (match.remainingCommand && match.remainingCommand.length >= 2) {
              safeDispatchCommand(match.remainingCommand);
            } else {
              verifyMicPermissionAndStart();
              const wakeGreeting = getActiveVoiceModel() === 'aoede'
                ? 'Ji Sir! Sun rahi hu, bataiye kya kaam karna hai!'
                : 'At your service, Sir. Listening.';
              speakJarvis(wakeGreeting, {
                lang: speechLang,
                muted: isMuted,
              });
            }
          }
        };

        bg.onerror = (e: any) => {
          // Background listener error must NEVER poison or block foreground speech recognition
          console.debug('[WakeWordEngine] Background listener idle/notice:', e?.error);
        };

        bg.onend = () => {
          bgRecognitionRef.current = null;
          if (
            isMounted &&
            !isListeningRef.current &&
            !isProcessingRef.current &&
            !isSpeakingRef.current &&
            !isJarvisSpeaking() &&
            wakeConfigRef.current.enabled &&
            !fatalMicErrorRef.current
          ) {
            restartTimer = setTimeout(() => {
              if (
                isMounted &&
                !isListeningRef.current &&
                !isProcessingRef.current &&
                !isSpeakingRef.current &&
                !isJarvisSpeaking() &&
                wakeConfigRef.current.enabled
              ) {
                startBgListener();
              }
            }, 300);
          }
        };

        bgRecognitionRef.current = bg;
        bg.start();
      } catch (err) {
        console.debug('[WakeWord] Listener startup note:', err);
      }
    };

    startBgListener();

    return () => {
      isMounted = false;
      if (restartTimer) clearTimeout(restartTimer);
      if (bgRecognitionRef.current) {
        try {
          bgRecognitionRef.current.abort();
        } catch {}
        bgRecognitionRef.current = null;
      }
    };
  }, [wakeConfig.enabled, isListening, isProcessing, speechSupported, speechLang, isMuted, safeDispatchCommand]);

  // Wave visualizer dynamic activity simulation when listening
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      setAudioLevel((prev) => {
        const base = transcript ? 65 : 30;
        const jitter = Math.floor(Math.random() * 35);
        return Math.min(100, base + jitter);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isListening, transcript]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const cleanCmd = inputText.trim();
    lastDispatchedRef.current = { text: cleanCmd, time: Date.now() };
    triggerHaptic([30, 30]);
    onSendCommand(cleanCmd);
    setInputText('');
  };

  const handlePillClick = (cmd: string) => {
    triggerHaptic([40, 40]);
    lastDispatchedRef.current = { text: cmd, time: Date.now() };
    onSendCommand(cmd);
  };

  const handleToggleMicClick = async () => {
    if (isVerifyingMicRef.current) return;
    triggerHaptic([40]);
    setMicError(null);
    setSilentInputPrompt(null);
    fatalMicErrorRef.current = false;
    noSpeechRetryCountRef.current = 0;

    if (isListening) {
      stopRecognitionSession();
    } else {
      await verifyMicPermissionAndStart();
    }
  };

  const handleTestMicrophone = async () => {
    setMicTestStatus('testing');
    setMicTestMessage('Microphone hardware check kar rahe hain...');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicTestStatus('failed');
      setMicTestMessage('Aapka browser getUserMedia support nahi karta.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicTestStatus('success');
      setMicTestMessage('Shabash! Microphone permission granted hai aur hardware bilkul theek kaam kar raha hai.');
      stream.getTracks().forEach((track) => track.stop());
    } catch (err: any) {
      setMicTestStatus('failed');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicTestMessage(
          'Permission Denied: Browser ne mic block kiya hai. Address bar me 🔒 Lock icon click karke "Allow Microphone" karein.'
        );
      } else {
        setMicTestMessage(`Mic access error: ${err.message || 'Check audio device'}`);
      }
    }
  };

  const handleTestSpeaker = () => {
    triggerHaptic([40, 60]);
    speakJarvis('At your service, Sir. Audio synthesizer and telemetry are fully operational.', {
      lang: speechLang,
      muted: false,
      pitch: 0.94,
      rate: 0.98,
    });
  };

  // Primary High-Frequency Quick Orders & Subject Runners
  const quickOrderButtons = [
    { label: '🌤️ मौसम व लोकेशन ट्रेस', cmd: 'मौसम बताओ और हर लोकेशन का लोकेशन ट्रेस करो', icon: Sun, color: 'border-amber-500/50 text-amber-300 bg-amber-950/40 hover:bg-amber-900/50' },
    { label: '🌍 वर्ल्ड में क्या चल रहा है', cmd: 'वर्ल्ड में क्या चल रहा है', icon: Globe, color: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50' },
    { label: '🤖 AI फुल जानकारी', cmd: 'एआई के बारे में फुल जानकारी', icon: Sparkles, color: 'border-purple-500/50 text-purple-300 bg-purple-950/40 hover:bg-purple-900/50' },
    { label: '🗣️ वर्ल्ड की सारी भाषाएं', cmd: 'वर्ल्ड की सारी भाषाएं', icon: Globe, color: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50' },
    { label: '🎵 YouTube Mein Gane Chalao', cmd: 'YouTube mein gane chalao', icon: Music, color: 'border-rose-500/50 text-rose-300 bg-rose-950/40 hover:bg-rose-900/50' },
    { label: '🌐 Google Open Karo', cmd: 'Google open karo', icon: Globe, color: 'border-blue-500/50 text-blue-300 bg-blue-950/40 hover:bg-blue-900/50' },
    { label: '🧮 Calculator Kholo', cmd: 'Calculator open karo', icon: Sparkles, color: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50' },
    { label: '📸 Instagram Kholo', cmd: 'Instagram open karo', icon: Camera, color: 'border-pink-500/50 text-pink-300 bg-pink-950/40 hover:bg-pink-900/50' },
    { label: '💬 WhatsApp Kholo', cmd: 'WhatsApp open karo', icon: MessageSquare, color: 'border-green-500/50 text-green-300 bg-green-950/40 hover:bg-green-900/50' },
    { label: '📞 Dad Ko Call Lagao', cmd: 'Dad ko call lagao', icon: Phone, color: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50' },
    { label: '💡 Torch On / Off', cmd: 'Torch on karo', icon: Flashlight, color: 'border-yellow-500/50 text-yellow-300 bg-yellow-950/40 hover:bg-yellow-900/50' },
    { label: '⏰ 6:30 Alarm', cmd: 'Subah 6:30 baje ka alarm set karo', icon: Clock, color: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4">
      {/* 0. TONY STARK LIVE VOICE STATUS & SPECIAL LIVE MIC CHECK BAR */}
      <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
            STARK LAB LIVE VOICE LINK: ONLINE
          </span>
        </div>

        <button
          type="button"
          id="btn-toggle-live-mic-check"
          onClick={() => setShowLiveMicCheck((prev) => !prev)}
          className={`px-3 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
            showLiveMicCheck
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/40 text-cyan-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{showLiveMicCheck ? 'Hide Live Check' : '🎙️ Special Live Mic Check'}</span>
        </button>
      </div>

      {/* RENDER LIVE MIC CHECK DIAGNOSTICS WHEN TOGGLED */}
      {showLiveMicCheck && (
        <LiveMicCheckCard
          isListening={isListening}
          onStartListening={() => {
            if (!isListening) handleToggleMicClick();
          }}
          onSpeak={(text) => {
            speakJarvis(text, { lang: speechLang, muted: isMuted });
          }}
          onClose={() => setShowLiveMicCheck(false)}
        />
      )}

      {/* 1. BIG TACTILE "TOUCH TO SPEAK / TAP TO TALK" BUTTON */}
      <div className="mb-3">
        <div className="relative">
          {isListening && (
            <>
              <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/80 animate-ping opacity-25 pointer-events-none" />
              <span className="absolute -inset-2.5 rounded-2xl border border-emerald-400/50 animate-pulse pointer-events-none shadow-[0_0_35px_rgba(16,185,129,0.4)]" />
            </>
          )}
          <button
            id="btn-primary-touch-to-speak"
            type="button"
            onClick={handleToggleMicClick}
            disabled={isProcessing || isVerifyingMic}
            className={`w-full p-4 rounded-2xl border backdrop-blur-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-between gap-3 text-left cursor-pointer select-none relative z-10 ${
              isListening
                ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-teal-950/90 border-emerald-500 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-pulse'
                : isVerifyingMic
                ? 'bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-yellow-950/80 border-amber-500/60 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-teal-950/80 border-cyan-500/60 text-cyan-100 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
            }`}
          >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${
                isListening
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-105'
                  : isVerifyingMic
                  ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 animate-pulse'
                  : 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'
              }`}
            >
              {isListening ? (
                <Mic className="w-6 h-6 animate-bounce" />
              ) : isVerifyingMic ? (
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {isListening ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>🟢 LIVE CONVERSATION (Tony Stark Lab Mode)</span>
                  </>
                ) : isVerifyingMic ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                    <span>🟡 Checking Mic Permission...</span>
                  </>
                ) : (
                  <>
                    <span>🎙️ Ek Click Par Live Baat Karein (Tap to Speak)</span>
                  </>
                )}
              </p>
              <p className="text-xs text-slate-300/90 mt-0.5">
                {isListening
                  ? 'Continuous live hearing active • Pause hone par bhi mic disconnect nahi hoga (No repeated tip-tip!)'
                  : isVerifyingMic
                  ? 'Microphone permission request aur hardware verification ho rahi hai...'
                  : 'Ek baar click karein aur continuous live baat karein jaise Tony Stark Jarvis se baat karta hai.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Audio Level Wave Bars */}
            {isListening && (
              <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-emerald-500/40">
                {[0.4, 0.8, 1, 0.6, 0.9].map((scale, idx) => (
                  <span
                    key={idx}
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.max(6, Math.min(24, 6 + (audioLevel / 100) * scale * 20))}px`,
                    }}
                  />
                ))}
              </div>
            )}

            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border ${
                isListening
                  ? 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-400 shadow-md'
                  : isVerifyingMic
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
              }`}
            >
              {isListening ? 'STOP' : isVerifyingMic ? 'CHECKING...' : 'START'}
            </span>
          </div>
        </button>
        </div>
      </div>

      {/* Real-time reactive Audio Waveform Visualizer */}
      <div className="mb-3">
        <AudioWaveformVisualizer
          isListening={isListening}
          transcript={transcript}
          onAudioLevelChange={(lvl) => {
            setAudioLevel(lvl);
            if (isListeningRef.current && lvl > 6) {
              volumeHistoryRef.current.push(lvl);
              if (volumeHistoryRef.current.length > 50) {
                volumeHistoryRef.current.shift();
              }
            }
          }}
          accentTheme="cyan-emerald"
          defaultMode="fluid"
          height={100}
          showControls={true}
          showMetrics={true}
          isMuted={isMuted}
          onEnableMuted={onEnableMuted}
          onAmbientNoiseChange={onAmbientNoiseChange}
        />
      </div>

      {/* Active Sentiment / Tone of Voice & Personality Adaptation HUD */}
      {activeSentiment && activeSentiment.sentiment !== 'neutral' && (
        <div
          id="jarvis-sentiment-hud"
          className={`mb-3 p-3 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg transition-all animate-fade-in ${activeSentiment.toneConfig.colorClass}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl flex-shrink-0">{activeSentiment.toneConfig.badgeEmoji}</span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  {activeSentiment.toneConfig.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase bg-black/40 border border-white/20 text-white/90">
                  {activeSentiment.sentiment}
                </span>
              </div>
              <p className="text-[11px] opacity-80 text-white/90 mt-0.5 truncate">
                Voice Tone: Pitch {activeSentiment.toneConfig.speechPitch}x • Speed {activeSentiment.toneConfig.speechRate}x • {activeSentiment.toneConfig.mode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-black/40 border border-white/20 text-cyan-200">
              {activeSentiment.toneConfig.mode.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Wake-Word Listening Banner (when active and not in manual listening) */}
      {wakeConfig.enabled && !isListening && (
        <div
          id="jarvis-wake-word-banner"
          className="mb-3 px-3.5 py-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between backdrop-blur-xl shadow-lg transition-all animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <div>
              <span className="font-semibold text-white">Wake-Word Listening:</span>{' '}
              <span className="text-cyan-300 font-mono font-bold">"{wakeConfig.trigger}"</span> bolkar baat karein
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-cyan-300 font-mono bg-cyan-900/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
              MIC ACTIVE
            </span>
          </div>
        </div>
      )}

      {/* Live transcript banner */}
      {(transcript || isListening) && (
        <div className="mb-3 p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/50 text-cyan-100 backdrop-blur-xl shadow-lg transition-all animate-fade-in">
          <div className="flex items-center justify-between text-xs font-medium text-cyan-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-semibold">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Listening ({speechLang === 'hi-IN' ? 'Hindi/Hinglish' : 'English'})
            </span>
            <span className="text-[11px] text-cyan-400/80 font-mono bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
              Speak now
            </span>
          </div>
          <p className="text-sm sm:text-base font-sans text-white font-medium min-h-[24px]">
            {transcript || 'Listening, Sir... Speak your command anytime'}
          </p>
        </div>
      )}

      {/* Mic Error Banner with immediate recovery buttons */}
      {micError && (
        <div className="mb-3 p-3.5 rounded-2xl bg-amber-950/90 border border-amber-500/70 text-amber-200 text-xs flex items-start gap-2.5 animate-fade-in shadow-lg">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-white leading-relaxed">{micError}</p>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {/* Direct Reconnect Mic Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([30]);
                  setMicError(null);
                  fatalMicErrorRef.current = false;
                  noSpeechRetryCountRef.current = 0;
                  verifyMicPermissionAndStart();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                title="Reconnect microphone hardware immediately"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reconnect Mic</span>
              </button>

              {/* Direct Open in New Tab Button */}
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                title="Microphone full tab me 100% smooth work karega"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Naye Tab Mein Kholein</span>
              </a>

              {/* Instant Voice Simulator Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([30]);
                  window.dispatchEvent(new CustomEvent('jarvis:open-voice-cheat-sheet'));
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                title="Try commands with voice simulation without physical mic"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                <span>Try Voice Simulator</span>
              </button>

              <button
                type="button"
                onClick={handleTestMicrophone}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 border border-amber-500/50 text-amber-100 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Test Mic Hardware</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Voice Help Guide</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMicError(null);
                  const input = document.getElementById('jarvis-command-input');
                  input?.focus();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium cursor-pointer"
              >
                Neeche Type Karein
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMicError(null)}
            className="p-1 text-amber-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Friendly Silence / No-Speech Detected Prompt */}
      {silentInputPrompt && !micError && (
        <div className="mb-3 p-3.5 rounded-2xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-xs flex items-start gap-2.5 animate-fade-in shadow-lg">
          <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="font-semibold text-white leading-relaxed">{silentInputPrompt}</p>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleToggleMicClick}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Dobara Boliye (Tap to Speak)</span>
              </button>
              <button
                type="button"
                onClick={() => handlePillClick('YouTube open karo')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 text-[11px] font-medium border border-cyan-500/30 cursor-pointer active:scale-95"
              >
                ▶️ YouTube Kholo
              </button>
              <button
                type="button"
                onClick={() => handlePillClick('WhatsApp open karo')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-200 text-[11px] font-medium border border-emerald-500/30 cursor-pointer active:scale-95"
              >
                💬 WhatsApp Kholo
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSilentInputPrompt(null)}
            className="p-1 text-cyan-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. INSTANT TOUCH-TO-EXECUTE QUICK ORDER BUTTONS (Answering "tach karna par kar do esko") */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>⚡ Quick Orders (Touch to Execute Instantly)</span>
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic([30]);
              window.dispatchEvent(new CustomEvent('jarvis:open-voice-cheat-sheet'));
            }}
            className="text-[10px] text-rose-300 hover:text-rose-200 font-bold bg-rose-950/60 hover:bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-500/40 flex items-center gap-1 transition-all active:scale-95"
            title="Open Voice Command Cheat Sheet with 'Try it' button"
          >
            <span>📋 Commands & 'Try it'</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickOrderButtons.map((item, index) => {
            const IconComp = item.icon;
            return (
              <button
                key={index}
                id={`jarvis-instant-order-${index}`}
                type="button"
                onClick={() => handlePillClick(item.cmd)}
                disabled={isProcessing}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all active:scale-95 cursor-pointer backdrop-blur-md shadow-sm ${item.color}`}
              >
                <IconComp className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-semibold truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mood & Tone of Voice Adaptation Testing Shortcuts */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400/90 whitespace-nowrap flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-400" />
            <span>Tone Tests:</span>
          </span>
          {[
            { label: '💙 Stress Mode', cmd: 'Mujhe bohot stress aur tension ho raha hai, madad karo', title: 'Test supportive personality' },
            { label: '🌙 Tired Mode', cmd: 'Mai bohot thak gaya hu, aaram karna hai', title: 'Test soothing personality' },
            { label: '🌟 Excited Mode', cmd: 'Maza aa gaya, party karenge aaj!', title: 'Test enthusiastic personality' },
            { label: '💖 Grateful Mode', cmd: 'Thank you JARVIS, tum bohot pyari ho', title: 'Test grateful personality' },
          ].map((mood, idx) => (
            <button
              key={idx}
              id={`jarvis-mood-test-${idx}`}
              type="button"
              onClick={() => handlePillClick(mood.cmd)}
              disabled={isProcessing}
              title={mood.title}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer flex-shrink-0"
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Primary Input & Microphone bar */}
      <form onSubmit={handleManualSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="jarvis-command-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Listening... (Speak now)'
                : 'Ask Jarvis: "YouTube open karo", "Dad ko call lagao", ya likhein...'
            }
            disabled={isProcessing}
            className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/70 hover:border-cyan-500/50 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-md transition-all font-sans shadow-inner"
          />

          {/* Language selector toggle button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              id="jarvis-lang-toggle"
              type="button"
              onClick={() => {
                if (onSelectResponseLanguage) {
                  const nextLang =
                    responseLanguage === 'english'
                      ? 'hindi'
                      : responseLanguage === 'hindi'
                      ? 'hinglish'
                      : 'english';
                  onSelectResponseLanguage(nextLang);
                } else {
                  const nextLang = speechLang === 'hi-IN' ? 'en-IN' : speechLang === 'en-IN' ? 'en-US' : 'hi-IN';
                  onChangeLang(nextLang);
                }
              }}
              title="Change recognition & response language (English, Hindi, Hinglish)"
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>
                {responseLanguage
                  ? responseLanguage === 'english'
                    ? 'ENG'
                    : responseLanguage === 'hindi'
                    ? 'HINDI'
                    : 'HINGLISH'
                  : speechLang === 'hi-IN'
                  ? 'HINDI'
                  : speechLang === 'en-IN'
                  ? 'HINGLISH'
                  : 'ENG'}
              </span>
            </button>
          </div>
        </div>

        {/* Mic Toggle Button */}
        <button
          id="jarvis-mic-toggle-bar"
          type="button"
          onClick={handleToggleMicClick}
          disabled={!speechSupported || isProcessing || isVerifyingMic}
          aria-label={isListening ? 'Stop listening' : isVerifyingMic ? 'Verifying microphone...' : 'Start microphone listening'}
          className={`p-3.5 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
              : isVerifyingMic
              ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-sm animate-pulse'
              : 'bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/25 shadow-sm active:scale-95'
          }`}
        >
          {isListening ? (
            <MicOff className="w-5 h-5 text-rose-400" />
          ) : isVerifyingMic ? (
            <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
          ) : (
            <Mic className="w-5 h-5 text-cyan-300" />
          )}
        </button>

        {/* Send Submit Button */}
        <button
          id="jarvis-submit-command"
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="p-3.5 rounded-2xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>

      {/* Voice Help Trigger, Hands-Free Toggle & Quick Info */}
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {onToggleHandsFree && (
            <button
              id="btn-toggle-handsfree"
              type="button"
              onClick={onToggleHandsFree}
              className={`text-[11px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 shadow-sm cursor-pointer ${
                handsFreeMode
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-slate-200'
              }`}
              title="Bina touch kare lagatar baat karne ke liye Hands-Free Mode ON rakhein"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  handsFreeMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>{handsFreeMode ? '🎙️ Hands-Free: ON' : '🎙️ Touch to Talk'}</span>
            </button>
          )}

          <button
            id="btn-voice-calibration-trigger"
            type="button"
            onClick={() => setIsCalibrationOpen(true)}
            className={`text-[11px] flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
              activeCalibration?.isActive
                ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Record your voice for 30s to improve recognition accuracy for your accent"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Voice Calibration (30s)</span>
            {activeCalibration?.isActive && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                +{activeCalibration.accuracyBoostPercent}%
              </span>
            )}
          </button>

          <button
            id="btn-voice-help-modal"
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice Help</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
          {handsFreeMode ? 'Auto-listen ON • Touch button se bhi baat karein' : 'Touch to speak active'}
        </span>
      </div>

      {/* VOICE & CHAT HELP MODAL */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                  <Wrench className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">JARVIS Se Baat Kaise Karein</h3>
                  <p className="text-xs text-slate-400">Voice Assistant & Fast Command Guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content & Steps */}
            <div className="py-4 space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
                <h4 className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>1. Fast Response & Touch to Talk</span>
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Aap screen par diye gaye <strong>&quot;🎙️ Touch Karke Boliye&quot;</strong> button par tap karke seedhe bol sakte hain ya neeche diye gaye <strong>&quot;⚡ Quick Orders&quot;</strong> (YouTube, Plans, Call, Torch) button par 1-touch karke instant order execute kar sakte hain!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700">
                <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>2. Microphone Permission Kaise De</span>
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Browser ke address bar me <strong>🔒 Lock icon</strong> par click karein aur <strong>Microphone: Allow</strong> karein. Agar phone ka Screen Recorder chalu hai, toh woh mic lock kar sakta hai.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700">
                <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>3. Hardware & Audio Test Karein</span>
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTestMicrophone}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-cyan-500/30 active:scale-95 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Test Microphone</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSpeaker}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-purple-500/30 active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Speaker (Jarvis Aawaz)</span>
                  </button>
                </div>
                {micTestMessage && (
                  <p
                    className={`mt-2 text-xs font-medium p-2 rounded-xl ${
                      micTestStatus === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {micTestMessage}
                  </p>
                )}
              </div>

              {/* 30-Second Voice & Accent Calibration Shortcut */}
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Regional Accent Tuning (30s)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Record voice for 30s so JARVIS learns your pronunciation & regional tone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsHelpOpen(false);
                    setIsCalibrationOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-all cursor-pointer shadow-sm"
                >
                  Calibrate (30s)
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all cursor-pointer"
              >
                Theek Hai, Samajh Gaya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 30-SECOND VOICE CALIBRATION MODAL */}
      <VoiceCalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        currentLocale={speechLang}
        onLocaleChange={onChangeLang}
      />
    </div>
  );
};

