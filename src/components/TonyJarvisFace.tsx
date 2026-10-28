import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Loader2,
  Radio,
  Shield,
  Zap,
  Activity,
  Terminal,
  Cpu,
  Eye,
  RotateCw,
  Phone,
  Video,
  Music,
  Compass,
  Command,
} from 'lucide-react';
import { JarvisMoodConfig } from '../types';
import jarvisFaceImg from '../assets/images/jarvis_tony_face_1789922383424.jpg';
import { triggerHaptic } from '../utils/hapticEngine';
import { speakJarvis } from '../utils/audioSynth';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

export interface TonyJarvisFaceProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  isListening: boolean;
  handsFreeMode: boolean;
  onToggleListen: () => void;
  onToggleHandsFree?: () => void;
  moodConfig?: JarvisMoodConfig;
  onExecuteCommand?: (commandText: string) => void;
  lastSpokenText?: string;
  liveSpeechTranscript?: string;
}

export const TonyJarvisFace: React.FC<TonyJarvisFaceProps> = ({
  status,
  isListening,
  handsFreeMode,
  onToggleListen,
  onToggleHandsFree,
  moodConfig,
  onExecuteCommand,
  lastSpokenText,
  liveSpeechTranscript,
}) => {
  const [viewStyle, setViewStyle] = useState<'hologram' | 'wireframe3d'>('hologram');
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>('');
  const [speakingBarOffset, setSpeakingBarOffset] = useState<number>(0);

  // Three.js wireframe sphere / particle face canvas refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const sphereWireRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Listen for microphone audio level events from speech engine
  useEffect(() => {
    const handleMicVolume = (e: any) => {
      if (e.detail && typeof e.detail.volume === 'number') {
        setLiveAudioLevel(Math.min(100, Math.max(0, e.detail.volume)));
      }
    };
    window.addEventListener('jarvis:mic-volume', handleMicVolume);
    window.addEventListener('jarvis:speech-volume', handleMicVolume);
    return () => {
      window.removeEventListener('jarvis:mic-volume', handleMicVolume);
      window.removeEventListener('jarvis:speech-volume', handleMicVolume);
    };
  }, []);

  // When speaking, animate the mouth waveform bars continuously
  useEffect(() => {
    if (status !== 'speaking') return;
    const interval = setInterval(() => {
      setSpeakingBarOffset((prev) => (prev + 1) % 100);
    }, 80);
    return () => clearInterval(interval);
  }, [status]);

  // Three.js Wireframe 3D Matrix rendering
  useEffect(() => {
    if (viewStyle !== 'wireframe3d' || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Create 3D Holographic Particle Grid Sphere for J.A.R.V.I.S. cybernetic core
    const particleCount = 1800;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cyanColor = new THREE.Color(0x06b6d4);
    const goldColor = new THREE.Color(0xf59e0b);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 7.5 + (Math.random() - 0.5) * 1.8;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixRatio = Math.sin(phi) * 0.5 + 0.5;
      const mixed = cyanColor.clone().lerp(goldColor, mixRatio > 0.6 ? 0.4 : 0);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Geometric Wireframe Polyhedron
    const sphereGeo = new THREE.IcosahedronGeometry(7, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireMesh = new THREE.Mesh(sphereGeo, wireMat);
    scene.add(wireMesh);
    sphereWireRef.current = wireMesh;

    // Orbital ring
    const ringGeo = new THREE.TorusGeometry(9.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    scene.add(ringMesh);

    let angle = 0;
    const animate = () => {
      angle += 0.008;
      if (particlesRef.current) {
        particlesRef.current.rotation.y = angle;
        particlesRef.current.rotation.x = Math.sin(angle * 0.5) * 0.2;
      }
      if (sphereWireRef.current) {
        sphereWireRef.current.rotation.y = -angle * 0.7;
        sphereWireRef.current.rotation.z = angle * 0.4;
      }
      ringMesh.rotation.z = angle * 1.5;

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [viewStyle]);

  // Quick Action Command Execution
  const handleQuickCommand = (cmd: string) => {
    triggerHaptic([30, 40]);
    if (onExecuteCommand) {
      onExecuteCommand(cmd);
    }
  };

  // Test Voice Dialogue
  const handleTestDialogue = () => {
    triggerHaptic([40, 60]);
    speakJarvis('At your service, Sir. J.A.R.V.I.S. neural telemetry is fully calibrated and standing by.', {
      pitch: 0.94,
      rate: 0.98,
    });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return '#06b6d4'; // Cyan
      case 'speaking':
        return '#a855f7'; // Purple/Violet
      case 'processing':
        return '#f59e0b'; // Amber Gold
      default:
        return moodConfig?.glowHex || '#38bdf8';
    }
  };

  const activeColor = getStatusColor();

  return (
    <div className="w-full flex flex-col items-center select-none relative">
      {/* Stark Industries Hologram HUD Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-950/80 border border-cyan-500/30 rounded-2xl backdrop-blur-md text-[11px] font-mono text-cyan-300">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-bold tracking-wider text-slate-200 uppercase">
            STARK IND. // J.A.R.V.I.S. MK-VII
          </span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-950/90 border border-cyan-400/40 text-[9px] text-cyan-400">
            ONLINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Style toggle: Hologram Face vs 3D Wireframe */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setViewStyle('hologram');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                viewStyle === 'hologram'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hologram
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setViewStyle('wireframe3d');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                viewStyle === 'wireframe3d'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D Matrix
            </button>
          </div>

          {/* Hands-Free Button */}
          {onToggleHandsFree && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic([25]);
                onToggleHandsFree();
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition-all cursor-pointer ${
                handsFreeMode
                  ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Continuous Hands-Free voice conversation mode"
            >
              <Radio className={`w-3 h-3 ${handsFreeMode ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{handsFreeMode ? 'HANDS-FREE ON' : 'TOUCH TO TALK'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Holographic Face Stage with HUD Target Rings */}
      <div className="relative w-full max-w-sm sm:max-w-md h-80 sm:h-96 flex items-center justify-center">
        {/* Dynamic Holographic Aura pulsing with audio level */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none filter blur-3xl opacity-40 z-0"
          animate={{
            scale:
              status === 'speaking'
                ? 1 + (liveAudioLevel / 100) * 0.25
                : status === 'listening'
                ? [1, 1.35, 1]
                : [1, 1.08, 1],
            opacity:
              status === 'speaking'
                ? 0.5 + (liveAudioLevel / 100) * 0.45
                : status === 'listening'
                ? 0.75
                : 0.35,
          }}
          transition={{
            duration: status === 'speaking' ? 0.08 : status === 'listening' ? 1.4 : 2.5,
            repeat: status === 'speaking' ? 0 : Infinity,
            ease: 'easeOut',
          }}
          style={{
            background: `radial-gradient(circle, ${activeColor} 0%, rgba(6, 182, 212, 0.2) 40%, transparent 75%)`,
          }}
        />

        {/* Outer Rotating Tactical Reticle Ring 1 */}
        <motion.div
          className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full border border-cyan-500/20 pointer-events-none z-10 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full border-2 border-dashed border-cyan-400/20 rounded-full" />
          <div className="absolute top-0 w-3 h-1 bg-cyan-400/80 shadow-[0_0_8px_#38bdf8]" />
          <div className="absolute bottom-0 w-3 h-1 bg-cyan-400/80 shadow-[0_0_8px_#38bdf8]" />
          <div className="absolute left-0 w-1 h-3 bg-cyan-400/80 shadow-[0_0_8px_#38bdf8]" />
          <div className="absolute right-0 w-1 h-3 bg-cyan-400/80 shadow-[0_0_8px_#38bdf8]" />
        </motion.div>

        {/* Counter-Rotating Tactical Ring 2 with Degree Coordinates */}
        <motion.div
          className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-cyan-500/30 pointer-events-none z-10"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{
            borderStyle: 'dashed',
            borderColor: `${activeColor}40`,
          }}
        />

        {/* Audio Radar Concentric Waves (Active when listening or speaking) */}
        {(status === 'listening' || status === 'speaking') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <motion.div
              animate={{ scale: [0.8, 1.45], opacity: [0.8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              className="w-56 h-56 rounded-full border-2"
              style={{ borderColor: activeColor }}
            />
            <motion.div
              animate={{ scale: [0.8, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              className="w-56 h-56 rounded-full border"
              style={{ borderColor: activeColor }}
            />
          </div>
        )}

        {/* Center J.A.R.V.I.S. Face Presentation (Interactive Orb Container) */}
        <motion.div
          id="tony-jarvis-face-core"
          onClick={() => {
            triggerHaptic([35]);
            onToggleListen();
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="relative z-20 w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border-2 bg-slate-950/90 shadow-2xl backdrop-blur-xl group"
          style={{
            borderColor:
              status === 'speaking'
                ? `rgba(168, 85, 247, ${0.7 + (liveAudioLevel / 100) * 0.3})`
                : `${activeColor}90`,
            boxShadow:
              status === 'speaking'
                ? `0 0 ${28 + (liveAudioLevel / 100) * 36}px rgba(168, 85, 247, ${
                    0.5 + (liveAudioLevel / 100) * 0.45
                  }), inset 0 0 ${16 + (liveAudioLevel / 100) * 22}px rgba(6, 182, 212, 0.4)`
                : `0 0 35px ${activeColor}40, inset 0 0 25px ${activeColor}30`,
            transform: status === 'speaking' ? `scale(${1 + (liveAudioLevel / 100) * 0.04})` : undefined,
            transition: 'transform 80ms ease-out, box-shadow 80ms ease-out, border-color 80ms ease-out',
          }}
          title={isListening ? 'Click to stop listening' : 'Click to speak with J.A.R.V.I.S.'}
        >
          {viewStyle === 'hologram' ? (
            /* Hologram Face Image & Visualizer Layer */
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Central Holographic Face Asset */}
              <img
                src={jarvisFaceImg}
                alt="J.A.R.V.I.S. Hologram Face"
                className="w-full h-full object-cover filter contrast-125 brightness-105 transform group-hover:scale-105 transition-transform duration-700"
                style={{
                  mixBlendMode: 'screen',
                }}
              />

              {/* Holographic Blue/Cyan Vignette Wash */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(15, 23, 42, 0.7) 80%, rgba(2, 6, 23, 0.95) 100%)`,
                }}
              />

              {/* Dynamic Scanning Laser Beam traversing the Face */}
              <motion.div
                className="absolute inset-x-0 h-1 pointer-events-none opacity-70"
                style={{
                  background: `linear-gradient(90deg, transparent, ${activeColor}, #ffffff, ${activeColor}, transparent)`,
                  boxShadow: `0 0 15px ${activeColor}`,
                }}
                animate={{
                  top: ['0%', '100%', '0%'],
                }}
                transition={{
                  duration: status === 'speaking' ? 1.6 : 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Cybernetic Talking Mouth / Audio Waveform Bars (Synchronized with speech & mic) */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-950/80 px-3 py-1 rounded-full border border-cyan-500/40 backdrop-blur-md shadow-lg pointer-events-none z-30">
                {[0.4, 0.9, 0.6, 1.0, 0.7, 0.85, 0.5, 0.95].map((scale, i) => {
                  const dynamicHeight =
                    status === 'speaking'
                      ? Math.sin((speakingBarOffset + i * 15) * (Math.PI / 180)) * 12 + 10
                      : status === 'listening'
                      ? Math.max(4, (liveAudioLevel / 100) * 22 * scale)
                      : 4;

                  return (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(3, dynamicHeight)}px`,
                        backgroundColor: activeColor,
                        boxShadow: `0 0 6px ${activeColor}`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Dynamic Eyes Glow Reticle */}
              <div className="absolute top-20 inset-x-0 flex items-center justify-center gap-8 pointer-events-none">
                <motion.div
                  className="w-4 h-2 rounded-full"
                  animate={{
                    opacity: status === 'speaking' || status === 'listening' ? [0.6, 1, 0.6] : [0.4, 0.7, 0.4],
                    scale: status === 'speaking' ? [1, 1.25, 1] : 1,
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    backgroundColor: activeColor,
                    boxShadow: `0 0 12px ${activeColor}, 0 0 20px #ffffff`,
                  }}
                />
                <motion.div
                  className="w-4 h-2 rounded-full"
                  animate={{
                    opacity: status === 'speaking' || status === 'listening' ? [0.6, 1, 0.6] : [0.4, 0.7, 0.4],
                    scale: status === 'speaking' ? [1, 1.25, 1] : 1,
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    backgroundColor: activeColor,
                    boxShadow: `0 0 12px ${activeColor}, 0 0 20px #ffffff`,
                  }}
                />
              </div>
            </div>
          ) : (
            /* Three.js 3D Wireframe Cybernetic Matrix Canvas */
            <div ref={canvasContainerRef} className="w-full h-full relative" />
          )}

          {/* Center Tactical Status Badge */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/85 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 z-30 shadow-md">
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: activeColor }}
            />
            <span className="uppercase font-semibold tracking-wider">
              {status === 'listening'
                ? 'LISTENING'
                : status === 'speaking'
                ? 'SPEAKING'
                : status === 'processing'
                ? 'THINKING'
                : 'STANDBY'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Real-Time Acoustic Waveform Visualizer Bar Chart below the Face */}
      <div className="w-full max-w-sm sm:max-w-md mt-1 px-3 z-20">
        <div className="px-3 py-2 rounded-2xl bg-slate-950/85 border border-cyan-500/35 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.14)] flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[10px] font-mono mb-1 text-cyan-400">
            <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
              <Activity className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : status === 'speaking' ? 'text-purple-400 animate-pulse' : 'text-cyan-400'}`} />
              <span>Acoustic Frequency Spectrum</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                BARS
              </span>
              <span className={`text-[10px] font-mono font-bold ${isListening ? 'text-emerald-400' : status === 'speaking' ? 'text-purple-400' : 'text-cyan-400/70'}`}>
                {isListening ? `${liveAudioLevel}% MIC` : status === 'speaking' ? 'SPEAKING' : 'IDLE'}
              </span>
            </div>
          </div>
          <AudioWaveformVisualizer
            isListening={isListening || status === 'speaking'}
            transcript={liveSpeechTranscript}
            audioLevel={liveAudioLevel}
            defaultMode="bars"
            height={46}
            accentTheme="cyan-emerald"
            showControls={false}
            showMetrics={false}
            className="w-full"
          />
        </div>
      </div>

      {/* Real-Time Interactive Dialogue Bubble ("jaise ki bolata hun to baat karna") */}
      <div className="w-full max-w-xl mt-3 px-2">
        <AnimatePresence mode="wait">
          {/* 1. When User is Speaking (Live Mic Transcript) */}
          {isListening ? (
            <motion.div
              key="hud-listening-dialogue"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-1 border-b border-cyan-500/20 pb-1">
                <span className="flex items-center gap-1.5 font-bold">
                  <Mic className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />
                  YOU (SIR) • SPEAKING
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  AUDIO LEVEL: {liveAudioLevel}%
                </span>
              </div>
              <p className="text-sm sm:text-base font-medium text-white leading-relaxed min-h-[24px]">
                {liveSpeechTranscript ? (
                  <span className="text-cyan-200 font-semibold">"{liveSpeechTranscript}"</span>
                ) : (
                  <span className="text-slate-400 italic">
                    Sir, I am listening... Speak any command (e.g. "YouTube chalao", "Dad ko call lagao")
                  </span>
                )}
              </p>
            </motion.div>
          ) : (
            /* 2. When J.A.R.V.I.S. is Speaking or Replying */
            <motion.div
              key="hud-jarvis-dialogue"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden group"
              style={{
                borderColor: status === 'speaking' ? '#a855f7' : undefined,
                boxShadow: status === 'speaking' ? '0 0 25px rgba(168,85,247,0.3)' : undefined,
              }}
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1 border-b border-slate-800/80 pb-1">
                <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  J.A.R.V.I.S. RESPONSE
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestDialogue}
                    className="text-[10px] text-cyan-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 transition-colors cursor-pointer"
                    title="Test J.A.R.V.I.S. voice"
                  >
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>Test Voice</span>
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">MCU PROTOCOL</span>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                "{lastSpokenText || 'At your service, Sir. J.A.R.V.I.S. is ready for your command.'}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Main Action Controls: Talk Now Button */}
      <div className="w-full max-w-md flex items-center justify-center gap-3 mt-3 px-2">
        <button
          id="btn-jarvis-talk-main"
          type="button"
          onClick={() => {
            triggerHaptic([30, 40]);
            onToggleListen();
          }}
          className={`flex-1 py-3 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer active:scale-95 border ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
              : 'bg-gradient-to-r from-cyan-600 via-sky-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.35)]'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5 text-white" />
              <span>Tap to Stop Listening</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 text-white animate-pulse" />
              <span>Jarvis se Baat Karein (Tap to Speak)</span>
            </>
          )}
        </button>
      </div>

      {/* Tony Stark Quick Voice Directives (Instant Execution Chips) */}
      <div className="w-full max-w-xl mt-3.5 px-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 px-1">
          <span className="flex items-center gap-1 font-semibold text-cyan-400">
            <Command className="w-3 h-3 text-cyan-400" />
            STARK VOICE DIRECTIVES (TAP OR SPEAK)
          </span>
          <span className="text-[10px] text-slate-500">Instant Execution</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {[
            { label: 'YouTube Chalao', cmd: 'YouTube open karo' },
            { label: 'Dad Ko Call Lagao', cmd: 'Dad ko call lagao' },
            { label: 'Torch / Flashlight On', cmd: 'Flashlight on karo' },
            { label: 'Camera Kholo', cmd: 'Camera open karo' },
            { label: 'System Status Report', cmd: 'Jarvis all system status' },
            { label: 'Play AC/DC Music', cmd: 'YouTube par AC/DC play karo' },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickCommand(item.cmd)}
              className="px-2.5 py-2 rounded-xl text-left bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 transition-all flex items-center justify-between gap-1 text-xs cursor-pointer group active:scale-95"
            >
              <span className="truncate font-medium group-hover:text-white">
                {item.label}
              </span>
              <Zap className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
