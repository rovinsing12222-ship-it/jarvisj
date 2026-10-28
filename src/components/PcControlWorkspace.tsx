import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Monitor,
  Terminal,
  Volume2,
  VolumeX,
  Lock,
  Camera,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  WifiOff,
  Search,
  Sparkles,
  Play,
  RotateCcw,
  Square,
  Minus,
  Maximize2,
  X,
  Folder,
  Send,
  Sliders,
  Smartphone,
  Plus,
} from 'lucide-react';
import {
  PC_APPS_CATALOG,
  AppDefinition,
  VirtualWindow,
  CursorPosition,
  PcActionStep,
  findBestAppMatch,
  REAL_PC_PYTHON_BRIDGE_CODE,
} from '../utils/pcAutomation';
import {
  CustomAndroidLauncher,
  getSavedQuickAccessLaunchers,
  saveQuickAccessLaunchers,
  removeAppFromQuickAccess,
  dispatchAndroidAppLaunch,
} from '../utils/installedAndroidApps';
import { InstalledAppSelectorModal } from './InstalledAppSelectorModal';
import { triggerHaptic } from '../utils/hapticEngine';

interface PcControlWorkspaceProps {
  onSpeak?: (text: string) => void;
  isHandsFree?: boolean;
  voiceActionTrigger?: { action: string; payload?: any; timestamp: number } | null;
}

export const PcControlWorkspace: React.FC<PcControlWorkspaceProps> = ({
  onSpeak,
  voiceActionTrigger,
}) => {
  // Virtual Windows State
  const [windows, setWindows] = useState<VirtualWindow[]>([
    {
      id: 'win-welcome',
      appKey: 'terminal',
      title: 'Windows PowerShell - Myraa PC Control Core v2.4',
      icon: '⚡',
      x: 30,
      y: 30,
      width: 500,
      height: 310,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      terminalHistory: [
        'Windows PowerShell [Version 10.0.22631.3296]',
        '(c) Microsoft Corporation. All rights reserved.',
        '',
        'PS C:\\Users\\Jarvis> Initialize-AIBridge -Agent "Myraa" -Mode "Autonomous"',
        '[OK] Neural Mouse & Keyboard Automation Subsystem Ready.',
        '[OK] Windows Start Menu & Desktop Vision Hooked.',
        'PS C:\\Users\\Jarvis> _',
      ],
    },
  ]);

  const [activeWindowId, setActiveWindowId] = useState<string>('win-welcome');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTypingSearch, setIsTypingSearch] = useState(false);
  const [highlightedAppKey, setHighlightedAppKey] = useState<string | null>(null);

  // AI Cursor Simulation
  const [cursor, setCursor] = useState<CursorPosition>({
    x: 250,
    y: 200,
    isClicking: false,
    targetName: undefined,
  });
  const [showCursorRipple, setShowCursorRipple] = useState(false);

  // Execution Step Logs
  const [actionSteps, setActionSteps] = useState<PcActionStep[]>([
    {
      id: 'step-init',
      stepNumber: 1,
      action: 'SYSTEM_READY',
      details: 'Myraa Human-like Mouse & Keyboard Subsystem Initialized',
      status: 'done',
      timestamp: Date.now(),
    },
  ]);
  const [isAutomating, setIsAutomating] = useState(false);

  // Hardware Python Bridge Connection State
  const [isBridgeConnected, setIsBridgeConnected] = useState(false);
  const [bridgeStatusText, setBridgeStatusText] = useState('Checking ws://127.0.0.1:9123...');
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Quick Prompt Input
  const [promptInput, setPromptInput] = useState('');

  // Quick Access Android Launchers State (Persistent & customizable)
  const [quickLaunchers, setQuickLaunchers] = useState<CustomAndroidLauncher[]>(() =>
    getSavedQuickAccessLaunchers()
  );
  const [isAppSelectorModalOpen, setIsAppSelectorModalOpen] = useState(false);
  const [quickBarFilter, setQuickBarFilter] = useState<'all' | 'android' | 'pc'>('all');

  // Synchronize when quick access is updated elsewhere
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setQuickLaunchers(e.detail);
      }
    };
    window.addEventListener('jarvis:pc-quick-access-updated', handleUpdate);
    return () => window.removeEventListener('jarvis:pc-quick-access-updated', handleUpdate);
  }, []);

  // Audio effect generator using Web Audio API (No external assets required!)
  const playSystemAudio = useCallback((type: 'click' | 'launch' | 'type' | 'win_open') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'type') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'win_open') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'launch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, []);

  // Attempt connection to Local Python Hardware Bridge
  useEffect(() => {
    let reconnectTimeout: any;

    const connectBridge = () => {
      try {
        const ws = new WebSocket('ws://127.0.0.1:9123');
        wsRef.current = ws;

        ws.onopen = () => {
          setIsBridgeConnected(true);
          setBridgeStatusText('Physical PC Hardware Bridge Linked (ws://127.0.0.1:9123)');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'STATUS') {
              setBridgeStatusText(data.message || 'Bridge Online');
            }
          } catch {
            // ignore non-json
          }
        };

        ws.onclose = () => {
          setIsBridgeConnected(false);
          setBridgeStatusText('Virtual Desktop Active (Python daemon not running on port 9123)');
          reconnectTimeout = setTimeout(connectBridge, 7000);
        };

        ws.onerror = () => {
          setIsBridgeConnected(false);
          setBridgeStatusText('Virtual Desktop Active (ws://127.0.0.1:9123 offline)');
        };
      } catch {
        setIsBridgeConnected(false);
        setBridgeStatusText('Virtual Desktop Active');
      }
    };

    connectBridge();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Send Action to Hardware Python Bridge if Connected
  const sendToHardwareBridge = useCallback((action: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }));
    }
  }, []);

  // Smooth mouse cursor animation helper
  const animateCursorTo = (
    targetX: number,
    targetY: number,
    durationMs: number,
    targetLabel?: string
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startX = cursor.x;
      const startY = cursor.y;
      const startTime = performance.now();

      setCursor((prev) => ({ ...prev, targetName: targetLabel }));

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentX = startX + (targetX - startX) * ease;
        const currentY = startY + (targetY - startY) * ease;

        setCursor((prev) => ({
          ...prev,
          x: currentX,
          y: currentY,
        }));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  };

  // Click animation helper
  const triggerClick = async (): Promise<void> => {
    playSystemAudio('click');
    setCursor((prev) => ({ ...prev, isClicking: true }));
    setShowCursorRipple(true);
    await new Promise((r) => setTimeout(r, 120));
    setCursor((prev) => ({ ...prev, isClicking: false }));
    setTimeout(() => setShowCursorRipple(false), 300);
  };

  // Helper: Open or focus virtual window
  const openVirtualWindow = (app: AppDefinition, query?: string) => {
    const existingIndex = windows.findIndex((w) => w.appKey === app.key);
    const topZ = Math.max(...windows.map((w) => w.zIndex), 10) + 1;

    if (existingIndex >= 0) {
      // Bring existing to front & unminimize
      setWindows((prev) =>
        prev.map((w, i) =>
          i === existingIndex
            ? {
                ...w,
                isMinimized: false,
                zIndex: topZ,
                query: query || w.query,
              }
            : w
        )
      );
      setActiveWindowId(windows[existingIndex].id);
      return;
    }

    // Create new window
    const newId = `win-${app.key}-${Date.now()}`;
    const newWindow: VirtualWindow = {
      id: newId,
      appKey: app.key,
      title: query ? `${app.name} - "${query}"` : app.defaultTitle || app.name,
      icon: app.icon,
      x: 50 + (windows.length % 5) * 30,
      y: 50 + (windows.length % 5) * 30,
      width: app.key === 'calculator' ? 320 : app.key === 'terminal' ? 520 : 640,
      height: app.key === 'calculator' ? 420 : 380,
      isMinimized: false,
      isMaximized: false,
      zIndex: topZ,
      query: query,
    };

    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(newId);
  };

  // MAIN HUMAN-LIKE PC AUTOMATION SEQUENCE:
  // "She clicks Windows button, searches for app, sees which is actual app, clicks it, and plays what was said"
  const executeHumanLikeAppLaunch = async (
    appNameOrQuery: string,
    mediaQuery?: string,
    skipVoiceAnnouncement = false
  ) => {
    if (isAutomating) return;
    setIsAutomating(true);

    const matchedApp = findBestAppMatch(appNameOrQuery) || PC_APPS_CATALOG[0]; // fallback YouTube
    const targetSearchText = matchedApp.name.split(' ')[0]; // e.g. "YouTube", "Discord"

    // Add initial log
    const step1Id = `step-${Date.now()}-1`;
    setActionSteps((prev) => [
      {
        id: step1Id,
        stepNumber: prev.length + 1,
        action: 'MOVE_TO_START_BUTTON',
        details: 'Moving cursor smoothly to Windows Start Button (x: 48, y: 360)...',
        status: 'running',
        timestamp: Date.now(),
      },
      ...prev.slice(0, 15),
    ]);

    // Speak intent through Myraa if audio enabled and not already spoken by Jarvis core
    if (!skipVoiceAnnouncement && onSpeak) {
      onSpeak(`Windows button click karke ${matchedApp.name} search kar rahi hu...`);
    }

    // 1. Send hardware bridge command if linked
    sendToHardwareBridge('OPEN_APP_VIA_SEARCH', {
      appName: matchedApp.name,
      query: mediaQuery || '',
    });

    // 2. Animate Cursor to Start Button in Taskbar (Virtual screen coordinates)
    await animateCursorTo(48, 350, 450, 'Windows Start Button ⊞');
    await triggerClick();

    // 3. Open Start Menu & Search Flyout
    playSystemAudio('win_open');
    setIsStartMenuOpen(true);
    setSearchQuery('');
    setHighlightedAppKey(null);

    setActionSteps((prev) => [
      {
        id: `step-${Date.now()}-2`,
        stepNumber: prev.length + 1,
        action: 'OPENED_START_MENU',
        details: 'Windows 11 Start Menu Opened. Focusing search bar...',
        status: 'done',
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    await new Promise((r) => setTimeout(r, 200));

    // 4. Move cursor into Start Search Input
    await animateCursorTo(180, 110, 300, 'Search Input Field');
    await triggerClick();

    // 5. Type App Name Character-by-Character
    setIsTypingSearch(true);
    let typed = '';
    for (let i = 0; i < targetSearchText.length; i++) {
      typed += targetSearchText[i];
      setSearchQuery(typed);
      playSystemAudio('type');
      await new Promise((r) => setTimeout(r, 65));
    }
    setIsTypingSearch(false);

    setActionSteps((prev) => [
      {
        id: `step-${Date.now()}-3`,
        stepNumber: prev.length + 1,
        action: 'AI_VISION_APP_DETECTION',
        details: `Vision Scanner: Identified Official Match "${matchedApp.name}" (${matchedApp.category})`,
        status: 'running',
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    // Highlight the verified best match
    setHighlightedAppKey(matchedApp.key);
    await new Promise((r) => setTimeout(r, 280));

    // 6. Move Cursor to Best Match Result
    await animateCursorTo(180, 175, 380, `Verified App: ${matchedApp.name}`);
    await triggerClick();

    playSystemAudio('launch');
    setIsStartMenuOpen(false);
    setSearchQuery('');
    setHighlightedAppKey(null);

    // 7. Launch the Virtual Window
    openVirtualWindow(matchedApp, mediaQuery);

    setActionSteps((prev) => [
      {
        id: `step-${Date.now()}-4`,
        stepNumber: prev.length + 1,
        action: 'APP_LAUNCHED_AND_FOCUSED',
        details: `Successfully launched "${matchedApp.name}"! Active window focused.`,
        status: 'done',
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    // 8. If media query exists (e.g. "play Arijit Singh"), simulate typing in the app
    if (mediaQuery) {
      await new Promise((r) => setTimeout(r, 400));
      await animateCursorTo(340, 95, 350, `Search inside ${matchedApp.name}`);
      await triggerClick();

      setActionSteps((prev) => [
        {
          id: `step-${Date.now()}-5`,
          stepNumber: prev.length + 1,
          action: 'PLAY_MEDIA_QUERY',
          details: `Executing query inside app: "${mediaQuery}"...`,
          status: 'done',
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      if (!skipVoiceAnnouncement && onSpeak) {
        onSpeak(`Ji, ${matchedApp.name} open ho gaya hai aur maine "${mediaQuery}" chala diya hai!`);
      }
    } else {
      if (!skipVoiceAnnouncement && onSpeak) {
        onSpeak(`Ji, maine Windows menu se ${matchedApp.name} verify karke open kar diya hai!`);
      }
    }

    setIsAutomating(false);
  };

  // Remove an Android launcher from Quick Access Bar
  const handleRemoveQuickLauncher = (launcherId: string, launcherName: string) => {
    triggerHaptic([20]);
    removeAppFromQuickAccess(launcherId);
    setQuickLaunchers((prev) => prev.filter((l) => l.id !== launcherId));
    if (onSpeak) {
      onSpeak(`Removed "${launcherName}" from PC Quick Access bar.`);
    }
  };

  // Launch Android App via Quick Access Bar with Human-Like Feedback
  const executeAndroidAppLaunch = async (launcher: CustomAndroidLauncher, query?: string) => {
    if (isAutomating) return;
    setIsAutomating(true);
    triggerHaptic([40, 30, 50]);

    const stepId = `step-android-${Date.now()}`;
    setActionSteps((prev) => [
      {
        id: stepId,
        stepNumber: prev.length + 1,
        action: 'ANDROID_INTENT_DISPATCH',
        details: `Connecting to Android Subsystem. Preparing Intent for "${launcher.name}" (${launcher.packageName})...`,
        status: 'running',
        timestamp: Date.now(),
      },
      ...prev.slice(0, 15),
    ]);

    if (onSpeak) {
      onSpeak(`Android app ${launcher.name} launch kar rahi hu...`);
    }

    // Hardware bridge dispatch
    sendToHardwareBridge('LAUNCH_ANDROID_APP', {
      appName: launcher.name,
      packageName: launcher.packageName,
      deepLink: launcher.deepLinkUrl || '',
      query: query || launcher.customQuery || '',
    });

    // Animate cursor to center of virtual screen
    await animateCursorTo(300, 210, 320, `Android Launcher: ${launcher.name}`);
    await triggerClick();
    playSystemAudio('launch');

    // Dispatch native deep link or web fallback
    dispatchAndroidAppLaunch(launcher, query);

    // Open dedicated Virtual Android Phone Window on the desktop
    const topZ = Math.max(...windows.map((w) => w.zIndex), 10) + 1;
    const winId = `win-android-${launcher.appId}-${Date.now()}`;
    const androidWindow: VirtualWindow = {
      id: winId,
      appKey: `android_${launcher.appId}`,
      title: `${launcher.name} • Android App`,
      icon: launcher.icon,
      x: 70 + (windows.length % 4) * 35,
      y: 40 + (windows.length % 4) * 25,
      width: 430,
      height: 480,
      isMinimized: false,
      isMaximized: false,
      zIndex: topZ,
      query: query || launcher.customQuery,
      androidLauncher: launcher,
    };

    setWindows((prev) => [...prev, androidWindow]);
    setActiveWindowId(winId);

    setActionSteps((prev) => [
      {
        id: `step-${Date.now()}-done`,
        stepNumber: prev.length + 1,
        action: 'ANDROID_APP_ACTIVE',
        details: `Dispatched Android Intent: "${launcher.packageName}" is running on device & mirrored in workspace.`,
        status: 'done',
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    if (onSpeak) {
      onSpeak(`Ji Rovin Sir, Android app "${launcher.name}" launch ho gaya hai!`);
    }

    setIsAutomating(false);
  };

  // Listen to incoming Voice Action Triggers from App.tsx / VoiceController
  useEffect(() => {
    if (!voiceActionTrigger) return;
    const { action, payload } = voiceActionTrigger;

    if (action === 'openApp' || action === 'pc_open_app') {
      const appTarget = payload?.appName || payload?.target || 'youtube';
      const query = payload?.query || '';
      // Skip redundant audio announcement because App.tsx already provides the vocal confirmation
      executeHumanLikeAppLaunch(appTarget, query, true);
    } else if (action === 'pc_win_key') {
      playSystemAudio('win_open');
      setIsStartMenuOpen((prev) => !prev);
      sendToHardwareBridge('PRESS_WIN_KEY');
    } else if (action === 'pc_volume_up') {
      playSystemAudio('click');
      sendToHardwareBridge('VOLUME_UP');
    } else if (action === 'pc_volume_down') {
      playSystemAudio('click');
      sendToHardwareBridge('VOLUME_DOWN');
    } else if (action === 'pc_mute') {
      playSystemAudio('click');
      sendToHardwareBridge('MUTE');
    } else if (action === 'pc_lock') {
      sendToHardwareBridge('LOCK_PC');
    } else if (action === 'pc_show_desktop') {
      setIsStartMenuOpen(false);
      sendToHardwareBridge('SHOW_DESKTOP');
    } else if (
      action === 'pc_maximize_window' ||
      action === 'maximizeWindow' ||
      action === 'pc_maximize'
    ) {
      playSystemAudio('win_open');
      setWindows((prev) =>
        prev.map((w) => ({
          ...w,
          isMaximized: true,
          isMinimized: false,
        }))
      );
      sendToHardwareBridge('MAXIMIZE_WINDOW');
      sendToHardwareBridge('WIN_UP');
    } else if (action === 'pc_zoom_in') {
      playSystemAudio('win_open');
      sendToHardwareBridge('ZOOM_IN');
    } else if (action === 'pc_fullscreen') {
      playSystemAudio('win_open');
      sendToHardwareBridge('FULLSCREEN_F11');
    }
  }, [voiceActionTrigger]);

  // Window Manipulation Helpers
  const closeWindow = (id: string) => {
    playSystemAudio('click');
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const toggleMaximize = (id: string) => {
    playSystemAudio('click');
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const toggleMinimize = (id: string) => {
    playSystemAudio('click');
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  };

  const focusWindow = (id: string) => {
    const topZ = Math.max(...windows.map((w) => w.zIndex), 10) + 1;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: topZ, isMinimized: false } : w))
    );
    setActiveWindowId(id);
  };

  // Filter apps matching search
  const filteredApps = searchQuery
    ? PC_APPS_CATALOG.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.matchKeywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : PC_APPS_CATALOG.slice(0, 8);

  const bestMatchApp = filteredApps[0] || PC_APPS_CATALOG[0];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* TOP STATUS BAR: Hardware Bridge + Beast Mode HUD */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3.5 backdrop-blur-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
            <Monitor className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                🖥️ MYRAA PC CONTROL & AUTOMATION ENGINE
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold tracking-wider">
                2222 BEAST ARCHITECTURE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBridgeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <p className="text-xs text-slate-300 font-mono">
                {isBridgeConnected ? (
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <Wifi className="w-3 h-3 inline" /> Real Windows Hardware Linked (Port 9123)
                  </span>
                ) : (
                  <span className="text-cyan-300/90 flex items-center gap-1">
                    <WifiOff className="w-3 h-3 inline" /> Interactive Cyber Virtual OS Active (Live Mouse & Keyboard Simulation)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            id="btn-maximize-all-pc"
            onClick={() => {
              playSystemAudio('win_open');
              setWindows((prev) =>
                prev.map((w) => ({
                  ...w,
                  isMaximized: true,
                  isMinimized: false,
                }))
              );
              sendToHardwareBridge('MAXIMIZE_WINDOW');
              sendToHardwareBridge('WIN_UP');
              if (onSpeak) onSpeak('Ji Rovin Sir, PC window ko jhat bada aur maximize kar diya hai!');
            }}
            title="Jhat Bada Karo (Win + Up Arrow / Maximize)"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-amber-400/50 hover:border-amber-300 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Jhat Bada Karo</span>
          </button>

          <button
            id="btn-open-excel-quick"
            onClick={() => {
              const excelDef = PC_APPS_CATALOG.find((a) => a.key === 'excel');
              if (excelDef) {
                executeHumanLikeAppLaunch('excel');
              }
            }}
            title="Microsoft Excel (Spreadsheets & Shortcuts)"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <span>📊</span>
            <span>Excel Sheet</span>
          </button>

          <button
            id="btn-open-bridge-modal"
            onClick={() => setShowBridgeModal(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Real PC Daemon</span>
          </button>

          <button
            id="btn-lock-screen"
            onClick={() => {
              playSystemAudio('click');
              sendToHardwareBridge('LOCK_PC');
              if (onSpeak) onSpeak('Ji, PC lock kar diya hai.');
            }}
            title="Lock PC (Win+L)"
            className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK COMMAND BAR & NATURAL LANGUAGE INPUT */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-xl flex flex-col sm:flex-row items-center gap-2.5 shadow-md">
        <div className="relative flex-1 w-full">
          <input
            id="input-pc-command"
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && promptInput.trim()) {
                executeHumanLikeAppLaunch(promptInput.trim());
                setPromptInput('');
              }
            }}
            placeholder='Try typing or saying: "YouTube kholo", "Discord open karo", "Spotify par gaane chalao"...'
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <button
          id="btn-run-pc-command"
          disabled={isAutomating}
          onClick={() => {
            if (promptInput.trim()) {
              executeHumanLikeAppLaunch(promptInput.trim());
              setPromptInput('');
            }
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Execute Human-Like Control</span>
        </button>
      </div>

      {/* QUICK ACCESS BAR (PC & CUSTOM ANDROID APP LAUNCHERS) */}
      <div
        id="pc-quick-access-bar"
        className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 backdrop-blur-xl shadow-lg space-y-2.5 transition-all"
      >
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Smartphone className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                  <span>Quick Access Bar</span>
                  <span className="text-[10px] font-normal text-slate-400 lowercase">(त्वरित ऐप लॉन्चर)</span>
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                  {quickLaunchers.length} Android Pinned
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Pin and launch your favorite installed Android apps & PC tools with one tap or voice command.
              </p>
            </div>
          </div>

          {/* Filter Chips & Add Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Filter Tabs: All, Android, PC */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([15]);
                  setQuickBarFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  quickBarFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({PC_APPS_CATALOG.slice(0, 6).length + quickLaunchers.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([15]);
                  setQuickBarFilter('android');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  quickBarFilter === 'android'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🤖 Android ({quickLaunchers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([15]);
                  setQuickBarFilter('pc');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  quickBarFilter === 'pc'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🖥️ PC ({PC_APPS_CATALOG.slice(0, 6).length})
              </button>
            </div>

            {/* Button: + Add Android App Launcher */}
            <button
              type="button"
              id="btn-add-custom-android-launcher"
              onClick={() => {
                triggerHaptic([25]);
                setIsAppSelectorModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer active:scale-95 transition-all border border-emerald-400/40"
              title="Add custom Android app launcher from installed apps list"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Android App</span>
            </button>
          </div>
        </div>

        {/* Launchers Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          {/* Pinned Android App Launchers */}
          {(quickBarFilter === 'all' || quickBarFilter === 'android') &&
            quickLaunchers.map((launcher) => (
              <div
                key={launcher.id}
                className="group relative flex-shrink-0"
              >
                <button
                  type="button"
                  id={`btn-quick-launcher-${launcher.id}`}
                  onClick={() => executeAndroidAppLaunch(launcher)}
                  title={`Launch Android App: ${launcher.name}\nPackage: ${launcher.packageName}\nCategory: ${launcher.category}\nClick to mirror on PC & trigger phone intent`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-cyan-950/70 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all active:scale-95 shadow-sm group-hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
                >
                  <div className="relative">
                    <span className="text-xl block">{launcher.icon}</span>
                    <span className="absolute -bottom-1 -right-1 text-[8px] bg-emerald-500 text-slate-950 font-black px-1 rounded-full border border-slate-900 leading-none">
                      🤖
                    </span>
                  </div>
                  <div className="min-w-0 pr-3">
                    <span className="text-xs font-bold text-white block group-hover:text-emerald-300 transition-colors whitespace-nowrap">
                      {launcher.name}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400/80 block truncate max-w-[110px]">
                      {launcher.packageName.split('.').slice(-2).join('.')}
                    </span>
                  </div>
                </button>

                {/* Quick hover remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveQuickLauncher(launcher.id, launcher.name);
                  }}
                  title={`Remove ${launcher.name} from Quick Access`}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700 hover:border-rose-400 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

          {/* PC Windows Apps */}
          {(quickBarFilter === 'all' || quickBarFilter === 'pc') &&
            PC_APPS_CATALOG.slice(0, 6).map((app) => (
              <button
                key={`pc-${app.key}`}
                type="button"
                onClick={() => executeHumanLikeAppLaunch(app.name)}
                title={`PC App: ${app.name} (${app.category})`}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-500/50 text-left transition-all active:scale-95 shadow-sm group cursor-pointer"
              >
                <span className="text-xl block group-hover:scale-110 transition-transform">{app.icon}</span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                    {app.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 block truncate max-w-[90px]">
                    {app.category}
                  </span>
                </div>
              </button>
            ))}

          {/* "+ Add Android App" chip at end of strip */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic([20]);
              setIsAppSelectorModalOpen(true);
            }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Add Android Launcher</span>
          </button>
        </div>
      </div>

      {/* VIRTUAL WINDOWS 11 DESKTOP CANVAS */}
      <div
        id="virtual-pc-desktop"
        className="relative w-full h-[460px] sm:h-[520px] rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 select-none"
      >
        {/* Ambient Desktop Wallpaper Cyber Mesh */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-8 right-8 text-right pointer-events-none opacity-40">
          <p className="text-3xl font-black text-cyan-400 tracking-wider">MYRAA OS</p>
          <p className="text-[11px] font-mono text-cyan-300">Neural PC Controller • Year 2222 Edition</p>
        </div>

        {/* Desktop Shortcut Icons */}
        <div className="absolute top-4 left-4 grid grid-cols-1 gap-3 z-0">
          {PC_APPS_CATALOG.slice(0, 6).map((app) => (
            <button
              key={app.key}
              onClick={() => executeHumanLikeAppLaunch(app.name)}
              className="flex flex-col items-center justify-center w-16 p-2 rounded-xl hover:bg-cyan-500/15 hover:border hover:border-cyan-500/30 transition-all group text-center"
            >
              <div className="text-2xl group-hover:scale-110 transition-transform">{app.icon}</div>
              <span className="text-[10px] text-slate-200 font-medium truncate w-14 mt-1">
                {app.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* ACTIVE VIRTUAL WINDOWS */}
        {windows.map((win) => {
          if (win.isMinimized) return null;
          const isFocused = activeWindowId === win.id;

          return (
            <div
              key={win.id}
              onClick={() => focusWindow(win.id)}
              style={{
                left: win.isMaximized ? 0 : `${win.x}px`,
                top: win.isMaximized ? 0 : `${win.y}px`,
                width: win.isMaximized ? '100%' : `${win.width}px`,
                height: win.isMaximized ? 'calc(100% - 44px)' : `${win.height}px`,
                zIndex: win.zIndex,
              }}
              className={`absolute rounded-2xl overflow-hidden backdrop-blur-2xl shadow-2xl border flex flex-col transition-all duration-150 ${
                isFocused
                  ? 'bg-slate-900/95 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/85 border-slate-700/60'
              }`}
            >
              {/* Window Title Bar */}
              <div className="h-9 px-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between cursor-move flex-shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm">{win.icon}</span>
                  <span className="text-xs font-semibold text-slate-200 truncate">{win.title}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMinimize(win.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMaximize(win.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(win.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Window Body Contents */}
              <div className="flex-1 overflow-auto bg-slate-950/90 text-slate-200 p-3 text-xs font-sans">
                {win.appKey === 'youtube' && (
                  <div className="flex flex-col gap-3 h-full">
                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <Search className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-medium text-white flex-1 truncate">
                        {win.query || 'Official YouTube - Live Stream'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold uppercase">
                        LIVE
                      </span>
                    </div>

                    <div className="relative flex-1 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center flex-col p-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-rose-600/20 border border-rose-500/50 flex items-center justify-center mb-2 animate-pulse">
                        <Play className="w-6 h-6 text-rose-500 fill-rose-500" />
                      </div>
                      <p className="text-sm font-bold text-white">
                        {win.query ? `Playing "${win.query}"` : 'YouTube Desktop Media Stream'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        High-Definition Audio & Visuals • Controlled by Myraa
                      </p>

                      <a
                        href={
                          win.query
                            ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
                                win.query
                              )}`
                            : 'https://www.youtube.com'
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open in Real Browser Tab</span>
                      </a>
                    </div>
                  </div>
                )}

                {win.appKey === 'discord' && (
                  <div className="flex flex-col gap-2 h-full">
                    <div className="bg-indigo-950/60 p-2 rounded-xl border border-indigo-500/40 flex items-center justify-between">
                      <span className="font-bold text-indigo-200"># general-chat</span>
                      <span className="text-[10px] text-emerald-400">● 42 Members Online</span>
                    </div>
                    <div className="flex-1 bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-end gap-2">
                      <div className="text-[11px] text-slate-400">
                        <span className="font-bold text-cyan-400">Myraa AI:</span> Listening to PC
                        commands.
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <span className="font-bold text-indigo-400">You:</span> Discord opened
                        seamlessly via Windows Start menu automation!
                      </div>
                    </div>
                  </div>
                )}

                {win.appKey === 'spotify' && (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
                      <Volume2 className="w-8 h-8 text-emerald-400 animate-bounce" />
                    </div>
                    <p className="text-sm font-bold text-white">
                      {win.query || 'Cyber Lofi Hip Hop Beats'}
                    </p>
                    <p className="text-xs text-emerald-300/90 mt-0.5">Spotify Connected</p>
                    <div className="w-48 h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                      <div className="w-2/3 h-full bg-emerald-400" />
                    </div>
                  </div>
                )}

                {win.appKey === 'terminal' && (
                  <div className="font-mono text-[11px] text-emerald-400 whitespace-pre-wrap leading-relaxed">
                    {(win.terminalHistory || []).join('\n')}
                  </div>
                )}

                {win.appKey === 'notepad' && (
                  <textarea
                    defaultValue="Myraa Autonomous PC Control Note:&#10;&#10;- Windows Start key pressed&#10;- App search verified&#10;- Click & Media executed perfectly."
                    className="w-full h-full bg-transparent resize-none focus:outline-none text-slate-200 font-mono text-xs leading-relaxed"
                  />
                )}

                {win.appKey === 'calculator' && (
                  <div className="flex flex-col gap-2 h-full p-2">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-right text-lg font-mono text-cyan-300">
                      2025 × 2222 = 4,499,550
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 flex-1">
                      {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map(
                        (btn) => (
                          <button
                            key={btn}
                            onClick={() => playSystemAudio('click')}
                            className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center justify-center text-xs"
                          >
                            {btn}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {win.appKey.startsWith('android_') && win.androidLauncher ? (
                  <div className="flex flex-col h-full bg-slate-950 text-slate-200">
                    {/* Top Simulated Android Status Bar */}
                    <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold">5G</span>
                        <Wifi className="w-2.5 h-2.5 text-slate-300" />
                        <span>100%</span>
                      </div>
                    </div>

                    {/* App Header */}
                    <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner border border-slate-700">
                          {win.androidLauncher.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white">{win.androidLauncher.name}</h4>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              Android
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 block truncate max-w-[170px]">
                            {win.androidLauncher.packageName}
                          </span>
                        </div>
                      </div>

                      <a
                        href={win.androidLauncher.deepLinkUrl || 'https://play.google.com/store'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Launch App</span>
                      </a>
                    </div>

                    {/* Phone App Content Screen */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Live Status indicator */}
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                          <span className="text-[11px] text-emerald-200">Device Intent Status:</span>
                          <span className="text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            INTENT_ACTIVE
                          </span>
                        </div>

                        {/* App Information Card */}
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">Category:</span>
                            <span className="font-semibold text-cyan-300">{win.androidLauncher.category}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">Package Identifier:</span>
                            <span className="font-mono text-[10px] text-slate-200">{win.androidLauncher.packageName}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-400">Quick Access Origin:</span>
                            <span className="text-[10px] text-emerald-300">Pinned from Installed Apps</span>
                          </div>
                          {win.query && (
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-400">Command / Query:</span>
                              <span className="text-[10px] text-amber-300 font-semibold truncate max-w-[150px]">
                                "{win.query}"
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Triggers */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            if (win.androidLauncher) {
                              dispatchAndroidAppLaunch(win.androidLauncher, win.query);
                              if (onSpeak) onSpeak(`Relaunching ${win.androidLauncher.name} on your device.`);
                            }
                          }}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Dispatch Intent to Physical Phone</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const adbCmd = `adb shell monkey -p ${win.androidLauncher?.packageName} -c android.intent.category.LAUNCHER 1`;
                            navigator.clipboard?.writeText(adbCmd);
                            if (onSpeak) onSpeak('ADB Shell command copied to clipboard.');
                          }}
                          className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-mono flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy ADB Shell Launch Command</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : !['youtube', 'discord', 'spotify', 'terminal', 'notepad', 'calculator'].includes(
                  win.appKey
                ) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <span className="text-3xl mb-2">{win.icon}</span>
                    <p className="font-bold text-white">{win.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Application running under Myraa Virtual Supervisor.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {/* WINDOWS 11 START MENU & SEARCH FLYOUT */}
        {isStartMenuOpen && (
          <div
            id="windows-start-menu"
            className="absolute bottom-12 left-4 w-80 sm:w-96 max-h-[380px] bg-slate-900/95 border border-cyan-500/40 rounded-2xl backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)] z-40 p-4 flex flex-col gap-3 animate-fade-in"
          >
            {/* Search Box with Real-Time Typing Animation */}
            <div className="relative">
              <input
                type="text"
                readOnly
                value={searchQuery}
                placeholder="Type here to search..."
                className="w-full bg-slate-950 border border-cyan-500/50 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 font-medium focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-2.5" />
              {isTypingSearch && (
                <span className="absolute right-2.5 top-2 text-[10px] font-mono text-cyan-300 animate-pulse">
                  ⌨️ Typing...
                </span>
              )}
            </div>

            {/* Best Match Section */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                Best match (Verified)
              </p>
              <div
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  highlightedAppKey === bestMatchApp.key
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02]'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <span className="text-2xl">{bestMatchApp.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white truncate">{bestMatchApp.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      App
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{bestMatchApp.description}</p>
                </div>
              </div>
            </div>

            {/* Pinned / Other Apps Grid */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Apps Catalog
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {filteredApps.slice(1, 7).map((app) => (
                  <div
                    key={app.key}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left ${
                      highlightedAppKey === app.key
                        ? 'bg-cyan-500/20 border-cyan-400'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-base">{app.icon}</span>
                    <span className="text-[11px] text-slate-200 truncate">{app.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Menu Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-[9px] text-white">
                  M
                </div>
                <span className="font-medium text-slate-300">Myraa (Administrator)</span>
              </div>
              <span className="font-mono text-[10px] text-cyan-400">Windows 11 Cyber</span>
            </div>
          </div>
        )}

        {/* AUTONOMOUS GLIDING AI MOUSE CURSOR */}
        <div
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            transition: 'transform 40ms linear',
          }}
          className="absolute top-0 left-0 pointer-events-none z-50"
        >
          {/* Mouse Pointer Arrow */}
          <div className="relative">
            <svg
              className={`w-6 h-6 drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)] transition-transform ${
                cursor.isClicking ? 'scale-90' : 'scale-100'
              }`}
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Click Ripple Wave */}
            {showCursorRipple && (
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-ping pointer-events-none" />
            )}

            {/* Operation Tag HUD */}
            {cursor.targetName && (
              <div className="absolute top-5 left-4 px-2 py-0.5 rounded-md bg-slate-950/95 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 shadow-xl whitespace-nowrap">
                🤖 {cursor.targetName}
              </div>
            )}
          </div>
        </div>

        {/* WINDOWS 11 TASKBAR (BOTTOM) */}
        <div className="absolute bottom-0 inset-x-0 h-11 bg-slate-950/90 border-t border-cyan-500/30 backdrop-blur-xl flex items-center justify-between px-3 z-30">
          {/* Start & Taskbar Center Icons */}
          <div className="flex items-center gap-1.5">
            {/* Windows 11 Start Button */}
            <button
              id="btn-win-start-logo"
              onClick={() => {
                playSystemAudio('win_open');
                setIsStartMenuOpen((prev) => !prev);
              }}
              className={`p-1.5 rounded-xl transition-all ${
                isStartMenuOpen
                  ? 'bg-cyan-500/20 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'hover:bg-slate-800'
              }`}
              title="Start (Win)"
            >
              {/* Windows 4-Square Logo */}
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-cyan-400 rounded-sm" />
                <div className="bg-cyan-400 rounded-sm" />
                <div className="bg-cyan-400 rounded-sm" />
                <div className="bg-cyan-400 rounded-sm" />
              </div>
            </button>

            {/* Taskbar Pinned Quick Icons */}
            <div className="h-4 w-px bg-slate-800 mx-1" />

            {PC_APPS_CATALOG.slice(0, 5).map((app) => {
              const isWinOpen = windows.some((w) => w.appKey === app.key && !w.isMinimized);
              return (
                <button
                  key={app.key}
                  onClick={() => executeHumanLikeAppLaunch(app.name)}
                  className={`p-1.5 rounded-xl text-base transition-all relative ${
                    isWinOpen
                      ? 'bg-cyan-500/20 border border-cyan-400/40'
                      : 'hover:bg-slate-800'
                  }`}
                  title={app.name}
                >
                  {app.icon}
                  {isWinOpen && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}

            {/* Pinned Android App Launchers in Taskbar */}
            {quickLaunchers.length > 0 && <div className="h-4 w-px bg-slate-800 mx-1" />}
            {quickLaunchers.slice(0, 5).map((launcher) => {
              const isWinOpen = windows.some(
                (w) => w.appKey === `android_${launcher.appId}` && !w.isMinimized
              );
              return (
                <button
                  key={`tb-android-${launcher.id}`}
                  onClick={() => executeAndroidAppLaunch(launcher)}
                  className={`p-1.5 rounded-xl text-base transition-all relative group cursor-pointer ${
                    isWinOpen
                      ? 'bg-emerald-500/20 border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'hover:bg-slate-800'
                  }`}
                  title={`Android App: ${launcher.name} (${launcher.packageName})`}
                >
                  <div className="relative">
                    <span>{launcher.icon}</span>
                    <span className="absolute -bottom-1 -right-1 text-[7px] leading-none">🤖</span>
                  </div>
                  {isWinOpen && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}

            {/* Add Launcher Quick Button in Taskbar */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setIsAppSelectorModalOpen(true);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-all text-xs cursor-pointer ml-0.5"
              title="Add Custom Android App Launcher to Quick Bar"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* System Tray (Clock, Sound, Wifi) */}
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <button
              onClick={() => {
                playSystemAudio('click');
                sendToHardwareBridge('VOLUME_UP');
              }}
              className="p-1 hover:text-white"
              title="Volume Control"
            >
              <Volume2 className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300" />
            </button>

            <span className="font-mono text-[11px] text-slate-400">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ACTION EXECUTION LOGS & MANUAL HARDWARE CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Autonomous Action Stream (Real-Time HUD) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                Autonomous Mouse & Keystroke Action Stream
              </h4>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
              {isAutomating ? '⚡ EXECUTING STEPS...' : 'IDLE / LISTENING'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
            {actionSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-2 text-xs font-mono p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80"
              >
                <span className="text-cyan-400 font-bold">#{step.stepNumber}</span>
                <span className="text-slate-400">[{step.action}]</span>
                <span className="text-slate-200 flex-1">{step.details}</span>
                <span className="text-emerald-400">✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: PC Hardware Shortcut Deck */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white tracking-wide uppercase">
              Instant PC Controls
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                playSystemAudio('win_open');
                setIsStartMenuOpen((prev) => !prev);
                sendToHardwareBridge('PRESS_WIN_KEY');
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
            >
              <span>⊞ Win Key</span>
            </button>

            <button
              onClick={() => {
                playSystemAudio('click');
                sendToHardwareBridge('SHOW_DESKTOP');
                setIsStartMenuOpen(false);
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
            >
              <span>🖥️ Win + D</span>
            </button>

            <button
              onClick={() => {
                playSystemAudio('click');
                sendToHardwareBridge('VOLUME_UP');
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vol +</span>
            </button>

            <button
              onClick={() => {
                playSystemAudio('click');
                sendToHardwareBridge('VOLUME_DOWN');
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
            >
              <VolumeX className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vol -</span>
            </button>

            <button
              onClick={() => {
                playSystemAudio('click');
                sendToHardwareBridge('SCREENSHOT');
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Screenshot</span>
            </button>

            <button
              onClick={() => {
                playSystemAudio('click');
                sendToHardwareBridge('HOTKEY', { keys: ['alt', 'f4'] });
              }}
              className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/40 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5"
            >
              <span>❌ Alt + F4</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Real PC Hardware Python Bridge Script & Setup Guide */}
      {showBridgeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Real PC Hardware Bridge Setup (Zero-Config)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Control your actual physical Windows / Mac PC via PyAutoGUI WebSocket!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBridgeModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 text-xs">
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 leading-relaxed">
                <p className="font-bold text-white mb-1">💡 How Real PC Control Works:</p>
                1. Copy the Python script below and save as <code className="text-cyan-300">jarvis_pc_daemon.py</code> on your computer.<br />
                2. Run in CMD / PowerShell: <code className="text-emerald-300 bg-black/50 px-1.5 py-0.5 rounded">pip install pyautogui websockets</code><br />
                3. Run: <code className="text-emerald-300 bg-black/50 px-1.5 py-0.5 rounded">python jarvis_pc_daemon.py</code><br />
                4. This browser page automatically links! Now whenever you tell Myraa &quot;YouTube kholo&quot; or &quot;Volume badhao&quot;, she physically moves your real mouse and presses your real keyboard!
              </div>

              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
                  {REAL_PC_PYTHON_BRIDGE_CODE}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(REAL_PC_PYTHON_BRIDGE_CODE);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowBridgeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close & Return to Desktop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installed Android App Selector Modal */}
      <InstalledAppSelectorModal
        isOpen={isAppSelectorModalOpen}
        onClose={() => setIsAppSelectorModalOpen(false)}
        quickLaunchers={quickLaunchers}
        onLaunchersUpdated={(updated) => setQuickLaunchers(updated)}
        onSpeak={onSpeak}
      />
    </div>
  );
};
