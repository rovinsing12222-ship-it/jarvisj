import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Fingerprint,
  Shield,
  ShieldCheck,
  Key,
  Flashlight,
  Camera,
  Battery,
  Wifi,
  Signal,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  PhoneCall,
  CheckCircle2,
  Zap,
  Play,
  Music,
  Radio,
  Clock,
  Youtube,
  Building2,
  ChevronRight,
  Smile,
} from 'lucide-react';
import { triggerHaptic, setTorch } from '../utils/deviceHardware';
import {
  playPhoneUnlockSound,
  playBeepSound,
  speakJarvis,
  getActiveVoiceModel,
  playAssistantInvokeSound,
  playChordProgression,
  startBackgroundAudioKeepAlive,
  stopBackgroundAudioKeepAlive,
} from '../utils/audioSynth';
import { playWakeChime, checkWakeWord } from '../utils/wakeWordEngine';
import { requestScreenWakeLock, releaseScreenWakeLock } from '../utils/wakeLock';
import {
  getSafeTrustedModeConfig,
  matchSafeTrustedCommand,
  SafeTrustedModeConfig,
} from '../utils/safeTrustedModeEngine';
import { launchPhoneCall } from '../utils/deviceHardware';

interface PhoneLockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  batteryLevel: string;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  liveTranscript?: string;
  onExecuteCommand?: (command: string) => void;
  speechLang?: string;
  isMuted?: boolean;
  torchActive?: boolean;
  onToggleTorch?: () => void;
}

export const PhoneLockScreen: React.FC<PhoneLockScreenProps> = ({
  isLocked,
  onUnlock,
  batteryLevel,
  isListening: parentIsListening,
  onStartListening,
  onStopListening,
  liveTranscript: parentLiveTranscript,
  onExecuteCommand,
  speechLang = 'hi-IN',
  isMuted = false,
  torchActive = false,
  onToggleTorch,
}) => {
  const [currentTime, setCurrentTime] = useState({
    time: '12:00',
    date: 'गुरुवार, 12 सितंबर',
  });
  const [showPinPad, setShowPinPad] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(torchActive);
  const [cameraFeedback, setCameraFeedback] = useState(false);

  // Jarvis Wake & Active Command Follower States
  const [isJarvisAwake, setIsJarvisAwake] = useState(false);
  const [awakeStatusText, setAwakeStatusText] = useState('Jarvis Sleeping • Boliye "Jarvis" jagane ke liye');
  const [lastExecutedCommand, setLastExecutedCommand] = useState<string | null>(null);
  const [lockScreenTranscript, setLockScreenTranscript] = useState('');
  const [isLockMicActive, setIsLockMicActive] = useState(false);
  const [audioPulseLevel, setAudioPulseLevel] = useState(1);

  // Safe Trusted Mode state & execution badge
  const [safeTrustedConfig, setSafeTrustedConfig] = useState<SafeTrustedModeConfig>(() =>
    getSafeTrustedModeConfig()
  );
  const [safeModeExecutedBadge, setSafeModeExecutedBadge] = useState<string | null>(null);

  useEffect(() => {
    const handleSafeUpdate = (e: any) => {
      if (e.detail) {
        setSafeTrustedConfig(e.detail);
      }
    };
    window.addEventListener('jarvis:safe-trusted-mode-updated', handleSafeUpdate);
    return () => {
      window.removeEventListener('jarvis:safe-trusted-mode-updated', handleSafeUpdate);
    };
  }, []);

  const isUnlockingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const awakeTimeoutRef = useRef<any>(null);
  const speechLangRef = useRef(speechLang);
  speechLangRef.current = speechLang;

  // Sync torch status with prop
  useEffect(() => {
    setIsTorchOn(torchActive);
  }, [torchActive]);

  // Reset flags when screen unlocks or locks
  useEffect(() => {
    if (!isLocked) {
      isUnlockingRef.current = false;
      setIsJarvisAwake(false);
      setLockScreenTranscript('');
      setLastExecutedCommand(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    } else {
      isUnlockingRef.current = false;
      setIsJarvisAwake(false);
      setAwakeStatusText('Jarvis Sleeping • Boliye "Jarvis" jagane ke liye');
    }
  }, [isLocked]);

  // Keep CPU, Screen & Audio Context continuously active on Lock Screen
  useEffect(() => {
    if (!isLocked) {
      stopBackgroundAudioKeepAlive();
      releaseScreenWakeLock();
      return;
    }

    requestScreenWakeLock();
    startBackgroundAudioKeepAlive();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isLocked) {
        requestScreenWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopBackgroundAudioKeepAlive();
      releaseScreenWakeLock();
    };
  }, [isLocked]);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const userTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' : 'Asia/Kolkata';
      setCurrentTime({
        time: now.toLocaleTimeString('en-IN', { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: true }),
        date: now.toLocaleDateString('hi-IN', {
          timeZone: userTz,
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Safe Biometric Unlock Animation & Sound
  const handleBiometricUnlock = useCallback(
    (onComplete?: () => void) => {
      if (isUnlockingRef.current) return;
      isUnlockingRef.current = true;
      triggerHaptic([40, 60, 40]);
      setIsBiometricScanning(true);

      // Stop lock mic so it doesn't collide
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      setTimeout(() => {
        setBiometricSuccess(true);
        playPhoneUnlockSound();
        triggerHaptic([50, 80]);
        setTimeout(() => {
          setIsBiometricScanning(false);
          setBiometricSuccess(false);
          onUnlock();
          onComplete?.();
        }, 500);
      }, 700);
    },
    [onUnlock]
  );

  // Command Execution on Lock Screen or Unlocking to follow
  const handleFollowCommand = useCallback(
    (rawCommand: string) => {
      if (!rawCommand || !rawCommand.trim()) return;
      const cmd = rawCommand.trim();
      const lower = cmd.toLowerCase();

      setLastExecutedCommand(cmd);
      triggerHaptic([40, 60]);

      // 1. Phone Unlock Commands (explicit user intent to unlock)
      if (
        lower.includes('unlock') ||
        lower.includes('kholo') ||
        lower.includes('khol do') ||
        lower.includes('kholna') ||
        lower.includes('phone open') ||
        lower.includes('open phone') ||
        lower.includes('अनलॉक') ||
        lower.includes('फोन खोलो') ||
        lower === 'open' ||
        lower === 'open karo'
      ) {
        setAwakeStatusText('आदेश मिला: फोन अनलॉक कर रहा हूँ...');
        if (!isMuted) {
          isSpeakingRef.current = true;
          speakJarvis('जी सर, फोन अनलॉक कर रहा हूँ।', {
            lang: speechLangRef.current,
            muted: isMuted,
            onEnd: () => {
              isSpeakingRef.current = false;
            },
          });
        }
        handleBiometricUnlock();
        return;
      }

      // 2. Safe Trusted Mode ('Always-Run' commands without full unlock)
      const isSafeModeActive = safeTrustedConfig.enabled;
      const matchedSafeCmd = isSafeModeActive
        ? matchSafeTrustedCommand(cmd, safeTrustedConfig)
        : null;

      if (matchedSafeCmd) {
        setSafeModeExecutedBadge(matchedSafeCmd.phrase);
        setTimeout(() => setSafeModeExecutedBadge(null), 4500);

        if (safeTrustedConfig.hapticFeedback) {
          triggerHaptic([30, 60, 40]);
        }

        switch (matchedSafeCmd.actionType) {
          case 'torch': {
            const turnOff =
              lower.includes('off') ||
              lower.includes('band') ||
              lower.includes('बंद') ||
              lower.includes('stop');
            const nextTorch = !turnOff;
            setIsTorchOn(nextTorch);
            setTorch(nextTorch);
            onToggleTorch?.();
            const text = nextTorch
              ? 'आदेश मिला: फ्लैशलाइट ऑन कर दी है'
              : 'आदेश मिला: फ्लैशलाइट बंद कर दी है';
            setAwakeStatusText(`🛡️ Safe Trusted: ${text}`);
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis(
                nextTorch
                  ? 'जी सर, सुरक्षित लॉक पर फ्लैशलाइट ऑन कर दी गई है।'
                  : 'जी सर, फ्लैशलाइट बंद कर दी गई है।',
                {
                  lang: speechLangRef.current,
                  muted: isMuted,
                  onEnd: () => {
                    isSpeakingRef.current = false;
                  },
                }
              );
            }
            return;
          }

          case 'time': {
            const timeText = `सर, अभी समय ${currentTime.time} हुआ है और आज ${currentTime.date} है।`;
            setAwakeStatusText(`🛡️ Safe Trusted • समय: ${currentTime.time}`);
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis(timeText, {
                lang: speechLangRef.current,
                muted: isMuted,
                onEnd: () => {
                  isSpeakingRef.current = false;
                },
              });
            }
            return;
          }

          case 'battery': {
            const batText = `सर, डिवाइस बैटरी ${batteryLevel} चार्ज है। पावर स्थिति सामान्य है।`;
            setAwakeStatusText(`🛡️ Safe Trusted • बैटरी: ${batteryLevel}`);
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis(batText, {
                lang: speechLangRef.current,
                muted: isMuted,
                onEnd: () => {
                  isSpeakingRef.current = false;
                },
              });
            }
            return;
          }

          case 'music': {
            playChordProgression([440, 554, 659, 880], 3);
            setAwakeStatusText('🛡️ Safe Trusted • 🎵 संगीत बजा रहा हूँ');
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis('जी सर, लॉक स्क्रीन पर सिंथेसाइज़र संगीत बजा रहा हूँ।', {
                lang: speechLangRef.current,
                muted: isMuted,
                onEnd: () => {
                  isSpeakingRef.current = false;
                },
              });
            }
            return;
          }

          case 'emergency': {
            if (safeTrustedConfig.allowEmergencyWithoutUnlock) {
              setAwakeStatusText('🛡️ Safe Trusted • 🚨 आपातकालीन 112 डायल किया जा रहा है');
              if (!isMuted) {
                isSpeakingRef.current = true;
                speakJarvis('आपातकालीन सहायता कॉल 112 डायल कर रहा हूँ।', {
                  lang: speechLangRef.current,
                  muted: isMuted,
                  onEnd: () => {
                    isSpeakingRef.current = false;
                    launchPhoneCall('112');
                  },
                });
              } else {
                launchPhoneCall('112');
              }
            } else {
              setAwakeStatusText('आपातकालीन कॉल के लिए अनलॉक आवश्यक है');
              handleBiometricUnlock(() => launchPhoneCall('112'));
            }
            return;
          }

          case 'weather': {
            const weatherMsg = 'सर, आज मौसम साफ और अनुकूल है, तापमान 28 डिग्री सेल्सियस है।';
            setAwakeStatusText('🛡️ Safe Trusted • 🌤️ मौसम: 28°C, साफ');
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis(weatherMsg, {
                lang: speechLangRef.current,
                muted: isMuted,
                onEnd: () => {
                  isSpeakingRef.current = false;
                },
              });
            }
            return;
          }

          case 'joke': {
            const joke =
              'सर, एक व्यक्ति डॉक्टर से बोला - जब मैं सोता हूँ तो मुझे सपने में जार्विस दिखाई देता है! डॉक्टर बोले - फिर तो फोन लॉक में भी आपके सारे काम हो जाते होंगे!';
            setAwakeStatusText('🛡️ Safe Trusted • चुटकुला सुना रहा हूँ...');
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis(joke, {
                lang: speechLangRef.current,
                muted: isMuted,
                onEnd: () => {
                  isSpeakingRef.current = false;
                },
              });
            }
            return;
          }

          case 'gramin': {
            const graminMsg =
              'सर, डिजिटल ग्रामीण सेवा और सीएससी पोर्टल सक्रिय हैं। नागरिक सहायता हेल्पलाइन 1800-3000-3468 उपलब्ध है।';
            setAwakeStatusText('🛡️ Safe Trusted • 🏛️ ग्रामीण सेवा सक्रिय');
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis(graminMsg, {
                lang: speechLangRef.current,
                muted: isMuted,
                onEnd: () => {
                  isSpeakingRef.current = false;
                },
              });
            }
            return;
          }

          case 'mute': {
            setAwakeStatusText('🛡️ Safe Trusted • ऑडियो म्यूट आदेश');
            if (!isMuted) {
              speakJarvis('जी सर, आवाज म्यूट कर दी गई है।', {
                lang: speechLangRef.current,
                muted: isMuted,
              });
            }
            return;
          }

          case 'sleep': {
            setIsJarvisAwake(false);
            setAwakeStatusText('Jarvis Standby • Boliye "Jarvis" jagane ke liye');
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis('ठीक है सर, मैं स्टैंडबाय पर जा रहा हूँ।', {
                lang: speechLangRef.current,
                muted: isMuted,
                onEnd: () => {
                  isSpeakingRef.current = false;
                },
              });
            }
            return;
          }

          case 'custom': {
            setAwakeStatusText(`🛡️ Safe Trusted • "${matchedSafeCmd.phrase}" निष्पादित`);
            if (!isMuted && safeTrustedConfig.announceExecution) {
              isSpeakingRef.current = true;
              speakJarvis(
                `जी सर, सुरक्षित ट्रस्टेड मोड में "${matchedSafeCmd.phrase}" आदेश निष्पादित कर दिया गया है।`,
                {
                  lang: speechLangRef.current,
                  muted: isMuted,
                  onEnd: () => {
                    isSpeakingRef.current = false;
                  },
                }
              );
            }
            return;
          }
        }
      }

      // 3. Fallback for non-safe commands (Apps, Private Data, Full System Controls)
      // Require biometric/PIN unlock and then dispatch to main Jarvis system
      if (!isSafeModeActive) {
        setAwakeStatusText(`सुरक्षित ट्रस्टेड मोड बंद है • अनलॉक कर रहा हूँ...`);
      } else {
        setAwakeStatusText(`आदेश मिला: "${cmd}" - फोन खोल रहा हूँ...`);
      }

      if (!isMuted && !onExecuteCommand) {
        isSpeakingRef.current = true;
        const msg = !isSafeModeActive
          ? `सर, सुरक्षित ट्रस्टेड मोड बंद होने के कारण "${cmd}" के लिए फोन अनलॉक कर रहा हूँ।`
          : `जी सर, फोन अनलॉक करके "${cmd}" का आदेश पूरा कर रहा हूँ।`;
        speakJarvis(msg, {
          lang: speechLangRef.current,
          muted: isMuted,
          onEnd: () => {
            isSpeakingRef.current = false;
          },
        });
      }

      handleBiometricUnlock(() => {
        if (onExecuteCommand) {
          onExecuteCommand(cmd);
        }
      });
    },
    [
      batteryLevel,
      currentTime.date,
      currentTime.time,
      handleBiometricUnlock,
      isMuted,
      onExecuteCommand,
      onToggleTorch,
      safeTrustedConfig,
    ]
  );

  // Trigger Jarvis Wake Up sequence when "Jarvis" or wake word is recognized
  const handleWakeUpJarvis = useCallback(
    (remainingCommand?: string) => {
      if (isUnlockingRef.current) return;

      playWakeChime();
      playAssistantInvokeSound();
      triggerHaptic([40, 60, 80]);

      setIsJarvisAwake(true);
      setAudioPulseLevel(3);

      // If user provided a command right along with "Jarvis", execute it immediately!
      if (remainingCommand && remainingCommand.trim().length >= 2) {
        setAwakeStatusText(`⚡ जार्विस जाग गया! आदेश: "${remainingCommand}"`);
        handleFollowCommand(remainingCommand);
        return;
      }

      // If user just called "Jarvis" / "Jarvis jaag jao"
      const isAoede = getActiveVoiceModel() === 'aoede';
      setAwakeStatusText(isAoede ? '⚡ Aoede जाग गई है! बोलिए Sir, क्या काम है?' : '⚡ जार्विस जाग गया! बोलिए Sir, क्या आदेश है?');

      if (!isMuted) {
        isSpeakingRef.current = true;
        const wakeGreeting =
          speechLangRef.current === 'en-US' || speechLangRef.current === 'en-IN'
            ? isAoede
              ? 'Yes Sir! I am awake. What task can I do for you?'
              : 'At your service, Sir. I am awake. What is your command?'
            : isAoede
            ? 'जी सर! मैं जाग गई हूँ, बताइए आपका क्या काम करूँ?'
            : 'जी सर, मैं जाग गया हूँ। आदेश दें, क्या करूँ?';

        speakJarvis(wakeGreeting, {
          lang: speechLangRef.current,
          muted: isMuted,
          onEnd: () => {
            isSpeakingRef.current = false;
          },
        });
      }

      // Set 15-second awake timer so user has time to give their command
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
      awakeTimeoutRef.current = setTimeout(() => {
        setIsJarvisAwake(false);
        setAwakeStatusText('Jarvis Sleeping • Boliye "Jarvis" jagane ke liye');
        setAudioPulseLevel(1);
      }, 15000);
    },
    [handleFollowCommand, isMuted]
  );

  // Dedicated continuous speech recognition on lock screen
  useEffect(() => {
    if (!isLocked) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[PhoneLockScreen] SpeechRecognition API not supported.');
      return;
    }

    let isMounted = true;
    let restartTimer: any = null;

    const startLockListener = () => {
      if (!isMounted || isUnlockingRef.current || isSpeakingRef.current) {
        return;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      try {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = speechLangRef.current || 'hi-IN';

        recognition.onstart = () => {
          if (!isMounted) return;
          setIsLockMicActive(true);
        };

        recognition.onspeechstart = () => {
          setAudioPulseLevel(2.5);
        };

        recognition.onspeechend = () => {
          setAudioPulseLevel(1.2);
        };

        recognition.onresult = (event: any) => {
          if (!isMounted || isUnlockingRef.current) return;

          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          const current = (final || interim).trim();
          if (!current) return;

          setLockScreenTranscript(current);

          // 1. Check for Wake Word ("Jarvis", "Hey Jarvis", "जार्विस", "जार्विस जाग जाओ", "Mayra", etc.)
          const wakeResult = checkWakeWord(current);
          if (wakeResult.matched) {
            handleWakeUpJarvis(wakeResult.remainingCommand);
            return;
          }

          // 2. If Jarvis is ALREADY awake, follow any command immediately!
          if (isJarvisAwake && current.length >= 2) {
            handleFollowCommand(current);
            return;
          }

          // 3. Direct Action Command Recognition: Even from Standby, follow any spoken command!
          const lower = current.toLowerCase();
          const isDirectAction =
            lower.includes('unlock') ||
            lower.includes('kholo') ||
            lower.includes('open') ||
            lower.includes('अनलॉक') ||
            lower.includes('खोलो') ||
            lower.includes('ओपन') ||
            lower.includes('call') ||
            lower.includes('phone') ||
            lower.includes('कॉल') ||
            lower.includes('फोन') ||
            lower.includes('डायल') ||
            lower.includes('youtube') ||
            lower.includes('यूट्यूब') ||
            lower.includes('video') ||
            lower.includes('gana') ||
            lower.includes('gaana') ||
            lower.includes('song') ||
            lower.includes('गाना') ||
            lower.includes('गीत') ||
            lower.includes('music') ||
            lower.includes('bajao') ||
            lower.includes('torch') ||
            lower.includes('flashlight') ||
            lower.includes('टॉर्च') ||
            lower.includes('लाइट') ||
            lower.includes('gramin') ||
            lower.includes('csc') ||
            lower.includes('ग्रामीण') ||
            lower.includes('aadhaar') ||
            lower.includes('aadhar') ||
            lower.includes('आधार') ||
            lower.includes('pan card') ||
            lower.includes('पैन कार्ड') ||
            lower.includes('time') ||
            lower.includes('samay') ||
            lower.includes('समय') ||
            lower.includes('battery') ||
            lower.includes('बैटरी') ||
            lower.includes('camera') ||
            lower.includes('कैमरा') ||
            lower.includes('whatsapp') ||
            lower.includes('व्हाट्सएप') ||
            lower.includes('so jao') ||
            lower.includes('sleep') ||
            lower.includes('joke') ||
            lower.includes('chutkula') ||
            lower.includes('चुटकुला');

          if (isDirectAction) {
            handleFollowCommand(current);
          }
        };

        recognition.onerror = (e: any) => {
          if (!isMounted) return;
          if (e.error === 'not-allowed') {
            setIsLockMicActive(false);
            return;
          }
          // On no-speech or transient network, schedule silent restart
          if (isMounted && isLocked && !isUnlockingRef.current && !isSpeakingRef.current) {
            clearTimeout(restartTimer);
            restartTimer = setTimeout(startLockListener, 300);
          }
        };

        recognition.onend = () => {
          if (!isMounted) return;
          setIsLockMicActive(false);
          // Auto restart continuous listening loop on lock screen rapidly
          if (isMounted && isLocked && !isUnlockingRef.current && !isSpeakingRef.current) {
            clearTimeout(restartTimer);
            restartTimer = setTimeout(startLockListener, 150);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.debug('[PhoneLockScreen] Listener start info:', err);
        if (isMounted && isLocked && !isUnlockingRef.current && !isSpeakingRef.current) {
          clearTimeout(restartTimer);
          restartTimer = setTimeout(startLockListener, 600);
        }
      }
    };

    // Delay start slightly to let lock transition complete
    const initialDelay = setTimeout(startLockListener, 350);

    return () => {
      isMounted = false;
      clearTimeout(initialDelay);
      clearTimeout(restartTimer);
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [handleFollowCommand, handleWakeUpJarvis, isJarvisAwake, isLocked]);

  // Also support speech from parent (if parent VoiceController caught speech)
  useEffect(() => {
    if (!isLocked || isUnlockingRef.current) return;
    if (parentLiveTranscript) {
      setLockScreenTranscript(parentLiveTranscript);
      const wakeCheck = checkWakeWord(parentLiveTranscript);
      if (wakeCheck.matched) {
        handleWakeUpJarvis(wakeCheck.remainingCommand);
      } else if (isJarvisAwake) {
        handleFollowCommand(parentLiveTranscript);
      }
    }
  }, [handleFollowCommand, handleWakeUpJarvis, isJarvisAwake, isLocked, parentLiveTranscript]);

  if (!isLocked) return null;

  const handlePinPress = (digit: string) => {
    triggerHaptic([25]);
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        // Any 4-digit pin or default '0000' / '1234' unlocks for demo ease
        triggerHaptic([40, 80]);
        playPhoneUnlockSound();
        setTimeout(() => {
          setPinInput('');
          setShowPinPad(false);
          onUnlock();
        }, 300);
      }
    }
  };

  const handleToggleTorchClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic([35]);
    const next = !isTorchOn;
    setIsTorchOn(next);
    await setTorch(next);
    onToggleTorch?.();
  };

  const handleCameraTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic([50]);
    setCameraFeedback(true);
    setTimeout(() => setCameraFeedback(false), 2000);
  };

  return (
    <div
      id="phone-lock-screen-overlay"
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col justify-between select-none overflow-hidden animate-fade-in"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 20%, rgba(15, 23, 42, 0.95), #020617 70%, #000000 100%)',
      }}
    >
      {/* Top Android Status Bar */}
      <div className="w-full px-6 pt-3 flex items-center justify-between text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="tracking-wider">J.A.R.V.I.S. OS</span>
          <span
            className={`w-2 h-2 rounded-full transition-all ${
              isJarvisAwake
                ? 'bg-amber-400 animate-ping shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          {isJarvisAwake && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider animate-pulse">
              Awake
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Signal className="w-3.5 h-3.5" />
          <Wifi className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1">
            <span>{batteryLevel}</span>
            <Battery className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Main Lock Screen Header & Large Clock */}
      <div className="flex flex-col items-center mt-3">
        {/* Security Lock Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-cyan-300 text-xs shadow-lg backdrop-blur-md">
          {biometricSuccess ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="font-semibold tracking-wide">
            {biometricSuccess ? 'UNLOCKED / खुला' : 'PHONE LOCKED / सुरक्षित लॉक'}
          </span>
          {safeTrustedConfig.enabled && (
            <span className="ml-1 pl-2 border-l border-slate-700/80 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Safe Trusted Mode</span>
            </span>
          )}
        </div>

        {/* Safe Trusted Mode Execution Notification Toast */}
        {safeModeExecutedBadge && (
          <div className="mt-2.5 mx-4 px-3.5 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-bounce" />
            <span className="truncate">Safe Always-Run: &ldquo;{safeModeExecutedBadge}&rdquo; executed without unlock</span>
          </div>
        )}

        {/* Large Clock Display */}
        <div className="mt-4 text-center">
          <h1 className="text-5xl sm:text-7xl font-light tracking-tight text-white font-mono drop-shadow-[0_0_25px_rgba(255,255,255,0.25)]">
            {currentTime.time}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
            {currentTime.date}
          </p>
        </div>

        {/* Dynamic Jarvis Lock Screen Wake & Command Follower HUD */}
        <div className="mt-4 max-w-sm w-full px-4">
          <div
            id="btn-lock-screen-wake-jarvis"
            onClick={() => {
              triggerHaptic([35, 45]);
              if (isJarvisAwake) {
                handleWakeUpJarvis();
              } else {
                handleWakeUpJarvis();
              }
            }}
            className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl shadow-xl ${
              isJarvisAwake
                ? 'bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-cyan-950/80 border-amber-400/90 shadow-[0_0_30px_rgba(251,191,36,0.35)]'
                : 'bg-slate-900/80 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}
          >
            {/* Ambient Background Glow Effect */}
            <div
              className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
                isJarvisAwake ? 'bg-amber-500/25 animate-pulse' : 'bg-cyan-500/15'
              }`}
            />

            <div className="flex items-center gap-3 relative z-10">
              {/* Glowing Arc Core / Voice Visualizer Icon */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                  isJarvisAwake
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.7)] scale-110'
                    : isLockMicActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isJarvisAwake ? (
                  <Zap className="w-5 h-5 animate-pulse" />
                ) : (
                  <Mic className={`w-5 h-5 ${isLockMicActive ? 'animate-bounce text-cyan-400' : ''}`} />
                )}
              </div>

              {/* Status & Live Spoken Transcript */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isJarvisAwake ? 'text-amber-300' : 'text-cyan-300'
                    }`}
                  >
                    <span>{isJarvisAwake ? 'JARVIS AWAKE & LISTENING' : 'JARVIS LOCK-SCREEN LISTENER'}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isJarvisAwake ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse'
                      }`}
                    />
                  </p>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950/80 border border-slate-700/60 text-slate-300">
                    {isJarvisAwake ? 'Active' : 'Standby'}
                  </span>
                </div>

                <p className="text-xs font-semibold text-white truncate mt-0.5">
                  {awakeStatusText}
                </p>

                {/* Real-time Subtitle / Live Transcript Display */}
                {lockScreenTranscript && (
                  <p className="text-[11px] text-emerald-300 font-mono truncate mt-0.5 flex items-center gap-1">
                    <span className="text-emerald-400">🗣️</span>
                    <span>&ldquo;{lockScreenTranscript}&rdquo;</span>
                  </p>
                )}
              </div>
            </div>

            {/* Live Audio Decibel Waveform Ticker */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-300/80">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>बोलें: &ldquo;Jarvis&rdquo; या &ldquo;Jarvis jaag jao&rdquo;</span>
              </span>
              <span className="text-slate-400 font-mono">
                {isLockMicActive ? 'Mic Active • Tap to Wake' : 'Tap to Wake'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Test Voice Commands Bar (One-Tap or Voice Prompt) */}
        <div className="mt-3 max-w-sm w-full px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => handleWakeUpJarvis()}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>⚡ Jarvis Jaago</span>
            </button>

            <button
              type="button"
              onClick={() => handleFollowCommand('Phone unlock karo')}
              className="px-2.5 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/40 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <Unlock className="w-3 h-3 text-cyan-400" />
              <span>🔓 Phone Unlock</span>
            </button>

            <button
              type="button"
              onClick={() => handleFollowCommand('Torch on karo')}
              className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <Flashlight className="w-3 h-3 text-amber-400" />
              <span>🔦 Torch</span>
              {safeTrustedConfig.enabled && (
                <span className="text-[9px] text-emerald-400 font-mono">Safe</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFollowCommand('Time batao')}
              className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>⏰ Time</span>
              {safeTrustedConfig.enabled && (
                <span className="text-[9px] text-emerald-400 font-mono">Safe</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFollowCommand('Battery kitni hai')}
              className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <Battery className="w-3 h-3 text-emerald-400" />
              <span>🔋 Battery</span>
              {safeTrustedConfig.enabled && (
                <span className="text-[9px] text-emerald-400 font-mono">Safe</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFollowCommand('Gana ga kar sunao')}
              className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <Music className="w-3 h-3 text-fuchsia-400" />
              <span>🎵 Gana Bajao</span>
              {safeTrustedConfig.enabled && (
                <span className="text-[9px] text-emerald-400 font-mono">Safe</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFollowCommand('Emergency SOS 112')}
              className="px-2.5 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-200 border border-rose-600/40 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3 text-rose-400" />
              <span>🚨 SOS 112</span>
              {safeTrustedConfig.enabled && (
                <span className="text-[9px] text-emerald-400 font-mono">Safe</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFollowCommand('YouTube open karo')}
              className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <Youtube className="w-3 h-3 text-rose-400" />
              <span>▶️ YouTube (Unlock)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFollowCommand('Digital Gramin Seva open karo')}
              className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
            >
              <Building2 className="w-3 h-3 text-emerald-400" />
              <span>🏛️ Gramin Seva (Unlock)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center Action: Fingerprint Scanner OR PIN Pad */}
      <div className="flex flex-col items-center justify-center my-auto px-4">
        {!showPinPad ? (
          <div className="flex flex-col items-center">
            {/* Biometric Optical Fingerprint Sensor */}
            <button
              type="button"
              id="lock-screen-fingerprint-btn"
              onClick={() => handleBiometricUnlock()}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 group ${
                isBiometricScanning
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.7)] scale-105'
                  : isJarvisAwake
                  ? 'bg-amber-950/40 border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
                  : 'bg-cyan-950/40 border-2 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
              }`}
            >
              {/* Scan Ripples */}
              {isBiometricScanning && (
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
              )}
              <Fingerprint
                className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                  isBiometricScanning
                    ? 'text-emerald-300 animate-pulse'
                    : isJarvisAwake
                    ? 'text-amber-300 animate-pulse'
                    : 'text-cyan-400 group-hover:text-cyan-300'
                }`}
              />
            </button>

            <p className="mt-2 text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span>Touch sensor to unlock / टच करें या बोलें</span>
            </p>

            {/* Switch to PIN Keypad button */}
            <button
              type="button"
              id="lock-screen-use-pin-btn"
              onClick={() => {
                triggerHaptic([30]);
                setShowPinPad(true);
              }}
              className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700/80 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Use PIN Code (पिन कोड डालें)</span>
            </button>
          </div>
        ) : (
          /* PIN Keypad Screen */
          <div className="flex flex-col items-center bg-slate-950/90 p-5 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl animate-fade-in max-w-xs w-full">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-xs font-bold text-slate-300">Enter Device PIN (0000)</span>
              <button
                type="button"
                onClick={() => setShowPinPad(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PIN Dots */}
            <div className="flex gap-3 mb-5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    pinInput.length > idx
                      ? pinError
                        ? 'bg-rose-500 border-rose-400 scale-110'
                        : 'bg-cyan-400 border-cyan-300 scale-110'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* 3x4 Number Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') setPinInput('');
                    else if (k === '⌫') setPinInput((p) => p.slice(0, -1));
                    else handlePinPress(k);
                  }}
                  className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 active:bg-cyan-950/50 text-base font-bold text-white transition-all flex items-center justify-center active:scale-95"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Shortcuts: Torch, Camera, Quick Unlock Helper */}
      <div className="w-full px-8 pb-6 flex items-center justify-between">
        {/* Flashlight Shortcut Button */}
        <button
          type="button"
          id="lock-screen-torch-btn"
          onClick={handleToggleTorchClick}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-90 ${
            isTorchOn
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
          title="Toggle Flashlight"
        >
          <Flashlight className="w-5 h-5" />
        </button>

        {/* Swipe or Tap to Unlock indicator */}
        <div
          onClick={() => handleBiometricUnlock()}
          className="cursor-pointer text-center group active:scale-95 transition-all"
        >
          <p className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 transition-colors">
            {isJarvisAwake ? '⚡ Boliye: "Phone Unlock Karo"' : 'Boliye: "Jarvis" ya Touch to Unlock'}
          </p>
          <div
            className={`w-16 h-1 rounded-full mx-auto mt-1.5 transition-colors ${
              isJarvisAwake ? 'bg-amber-400 animate-pulse' : 'bg-slate-700 group-hover:bg-cyan-400'
            }`}
          />
        </div>

        {/* Camera Shortcut Button */}
        <button
          type="button"
          id="lock-screen-camera-btn"
          onClick={handleCameraTap}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-90 ${
            cameraFeedback
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
          title="Quick Camera"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Camera Feedback Modal if clicked */}
      {cameraFeedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce">
          📸 Camera Shortcut triggered! Phone unlock to view viewfinder.
        </div>
      )}
    </div>
  );
};
