import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Shield,
  Zap,
  Activity,
  Cpu,
  Eye,
  Radio,
  Crosshair,
  Flame,
  Terminal,
  Gauge,
  Layers,
  Maximize2,
  Minimize2,
  RotateCw,
} from 'lucide-react';
import { JarvisMoodConfig } from '../types';
import { triggerHaptic } from '../utils/hapticEngine';
import { speakJarvis } from '../utils/audioSynth';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

export interface IronManSuitFaceProps {
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

export const IronManSuitFace: React.FC<IronManSuitFaceProps> = ({
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
  // Views: 'full_armor' (standing full suit from uploaded image), 'helmet' (close-up talking face), 'hud_interior' (cockpit POV)
  const [suitView, setSuitView] = useState<'full_armor' | 'helmet' | 'hud_interior'>('full_armor');
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);
  const [speakingCycle, setSpeakingCycle] = useState<number>(0);
  const [jawOffset, setJawOffset] = useState<number>(0);
  const [energyPulse, setEnergyPulse] = useState<number>(1);
  const [imgLoaded, setImgLoaded] = useState<boolean>(true);

  // Background Three.js Holographic Arc Ring & Particle Field
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Listen to real-time mic volume from Web Audio API
  useEffect(() => {
    const handleMicVolume = (e: any) => {
      if (e.detail && typeof e.detail.volume === 'number') {
        const vol = Math.min(100, Math.max(0, e.detail.volume));
        setLiveAudioLevel(vol);
      }
    };
    window.addEventListener('jarvis:mic-volume', handleMicVolume);
    window.addEventListener('jarvis:speech-volume', handleMicVolume);
    return () => {
      window.removeEventListener('jarvis:mic-volume', handleMicVolume);
      window.removeEventListener('jarvis:speech-volume', handleMicVolume);
    };
  }, []);

  // When speaking, articulate jaw and soundwave mouth grille & pulse chest Arc Reactor
  useEffect(() => {
    if (status !== 'speaking') {
      setJawOffset(0);
      setEnergyPulse(1);
      return;
    }

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setSpeakingCycle(step);
      // Natural speech jaw oscillation (0 to 6px)
      const jawMotion = Math.abs(Math.sin(step * 0.48) * 5.5 + Math.cos(step * 0.88) * 2.2);
      setJawOffset(jawMotion);
      // Dynamic arc reactor pulse with speech
      const pulse = 1 + Math.abs(Math.sin(step * 0.5)) * 0.35;
      setEnergyPulse(pulse);
    }, 60);

    return () => clearInterval(interval);
  }, [status]);

  // Three.js ambient hologram particles behind the suit
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Particle field (arc reactor blue + stark gold)
    const count = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cyan = new THREE.Color(0x38bdf8);
    const gold = new THREE.Color(0xf59e0b);
    const crimson = new THREE.Color(0xef4444);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 8;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(theta) * radius * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const rand = Math.random();
      const c = rand > 0.6 ? cyan : rand > 0.3 ? gold : crimson;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.24,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let angle = 0;
    const animate = () => {
      angle += 0.005;
      particles.rotation.y = angle * 0.7;
      particles.rotation.z = angle * 0.4;
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  const handleTestIronManSpeech = () => {
    triggerHaptic([40, 60]);
    speakJarvis(
      'Namaste Sir! Mark 85 armor online hai. Repulsor power nominal, arc reactor 100% charged. Jo bhi aap bolenge, mai bolkar jawab dunga!',
      {
        pitch: 0.95,
        rate: 1.0,
      }
    );
  };

  return (
    <div className="w-full flex flex-col items-center select-none relative">
      {/* Stark Industries Mark Armor HUD Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-950/85 border border-red-500/35 rounded-2xl backdrop-blur-md text-[11px] font-mono text-cyan-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
          <span className="font-bold tracking-wider text-amber-300 uppercase">
            STARK // MARK-LXXXV
          </span>
          <span className="px-1.5 py-0.5 rounded bg-red-950/90 border border-red-500/40 text-[9px] font-bold text-red-300 hidden sm:inline">
            VOICE SYNTH READY
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher: Standing Suit vs Helmet vs HUD */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setSuitView('full_armor');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                suitView === 'full_armor'
                  ? 'bg-red-500/25 text-amber-300 border border-amber-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full standing Iron Man Mark 85 armor"
            >
              Full Armor
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setSuitView('helmet');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                suitView === 'helmet'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Close-up talking helmet with mechanical jaw"
            >
              Helmet
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setSuitView('hud_interior');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                suitView === 'hud_interior'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tony Stark inside-helmet HUD view"
            >
              HUD POV
            </button>
          </div>

          {/* Hands-Free Always-On Mode Toggle */}
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
                  : 'bg-slate-900/60 border-slate-750 text-slate-400 hover:text-slate-200'
              }`}
              title="Hands-Free Continuous Voice Conversation"
            >
              <Radio className={`w-3 h-3 ${handsFreeMode ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{handsFreeMode ? 'ALWAYS-ON' : 'TOUCH'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Suit Presentation Stage */}
      <div className="relative w-full max-w-sm sm:max-w-md min-h-[400px] sm:min-h-[460px] flex items-center justify-center">
        {/* Three.js Particle Container */}
        <div ref={canvasContainerRef} className="absolute inset-0 pointer-events-none z-0" />

        {/* Ambient Arc Core Glow Aura behind the suit */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none filter blur-3xl opacity-50 z-0"
          animate={{
            scale: status === 'speaking' ? [1, 1.25, 1] : status === 'listening' ? [1, 1.35, 1] : [1, 1.1, 1],
            opacity: status === 'listening' || status === 'speaking' ? 0.8 : 0.45,
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background:
              status === 'speaking'
                ? 'radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, rgba(245, 158, 11, 0.25) 45%, transparent 75%)'
                : 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(56, 189, 248, 0.25) 50%, transparent 75%)',
          }}
        />

        {/* Arc Energy Rotating Target Rings */}
        <motion.div
          className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-red-500/25 pointer-events-none z-10 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full border border-dashed border-amber-400/30 rounded-full" />
          <div className="absolute top-0 w-3 h-1 bg-red-500/80 shadow-[0_0_8px_#ef4444]" />
          <div className="absolute bottom-0 w-3 h-1 bg-red-500/80 shadow-[0_0_8px_#ef4444]" />
          <div className="absolute left-0 w-1 h-3 bg-cyan-400/80 shadow-[0_0_8px_#38bdf8]" />
          <div className="absolute right-0 w-1 h-3 bg-cyan-400/80 shadow-[0_0_8px_#38bdf8]" />
        </motion.div>

        {/* Dynamic Voice Concentric Waves */}
        {(status === 'listening' || status === 'speaking') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <motion.div
              animate={{ scale: [0.85, 1.45], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              className="w-64 h-64 rounded-full border-2 border-cyan-400/70"
            />
            <motion.div
              animate={{ scale: [0.85, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
              className="w-64 h-64 rounded-full border border-amber-400/50"
            />
          </div>
        )}

        {/* Stage Container */}
        <div
          id="ironman-suit-face-stage"
          onClick={() => {
            triggerHaptic([35]);
            onToggleListen();
          }}
          className="relative z-20 w-full flex flex-col items-center justify-center cursor-pointer group"
          title={isListening ? 'Awaaz sun raha hai (Tap to Stop)' : 'Iron Man se baat karne ke liye tap karein'}
        >
          {suitView === 'full_armor' ? (
            /* ================= MODE 1: FULL STANDING MARK LXXXV SUIT (FROM UPLOADED IMAGE) ================= */
            <div className="relative w-full flex flex-col items-center justify-center">
              {/* Standby Platform Pedestal with Arc Hologram */}
              <div className="relative w-64 sm:w-76 h-96 sm:h-[440px] flex items-center justify-center">
                {/* Standing Breathing Motion */}
                <motion.div
                  className="relative w-full h-full flex items-center justify-center"
                  animate={{
                    y: status === 'speaking' ? [-2, 2, -2] : [0, -4, 0],
                    scale: status === 'listening' ? 1.02 : 1,
                  }}
                  transition={{
                    y: { duration: status === 'speaking' ? 0.35 : 3.2, repeat: Infinity, ease: 'easeInOut' },
                    scale: { duration: 0.3 },
                  }}
                >
                  {/* Mark LXXXV Image */}
                  <img
                    src="/assets/iron_man_mark_lxxxv.png"
                    alt="Iron Man Armor Mark LXXXV"
                    className="h-full w-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] z-20 transition-all"
                    onError={(e) => {
                      // Fallback to webp
                      (e.target as HTMLImageElement).src = '/assets/iron_man_mark_lxxxv.webp';
                    }}
                  />

                  {/* 1. GLOWING OPTIC VISOR EYES (Positioned on the helmet) */}
                  <div
                    className="absolute z-30 pointer-events-none flex items-center justify-center gap-1.5"
                    style={{
                      top: '7.8%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '28px',
                      height: '8px',
                    }}
                  >
                    {/* Left Eye Beam */}
                    <motion.div
                      className="w-2.5 h-1 bg-white rounded-full"
                      style={{
                        boxShadow:
                          status === 'speaking' || isListening
                            ? '0 0 10px #ffffff, 0 0 18px #38bdf8, 0 0 28px #0284c7'
                            : '0 0 6px #67e8f9, 0 0 12px #0284c7',
                        transform: 'rotate(8deg)',
                      }}
                      animate={{
                        opacity: status === 'speaking' ? [0.85, 1, 0.85] : isListening ? [0.9, 1, 0.9] : [0.75, 0.95, 0.75],
                      }}
                      transition={{ duration: status === 'speaking' ? 0.25 : 2.0, repeat: Infinity }}
                    />
                    {/* Right Eye Beam */}
                    <motion.div
                      className="w-2.5 h-1 bg-white rounded-full"
                      style={{
                        boxShadow:
                          status === 'speaking' || isListening
                            ? '0 0 10px #ffffff, 0 0 18px #38bdf8, 0 0 28px #0284c7'
                            : '0 0 6px #67e8f9, 0 0 12px #0284c7',
                        transform: 'rotate(-8deg)',
                      }}
                      animate={{
                        opacity: status === 'speaking' ? [0.85, 1, 0.85] : isListening ? [0.9, 1, 0.9] : [0.75, 0.95, 0.75],
                      }}
                      transition={{ duration: status === 'speaking' ? 0.25 : 2.0, repeat: Infinity }}
                    />
                  </div>

                  {/* 2. GLOWING TRIANGULAR CHEST ARC REACTOR (Positioned on the chest) */}
                  <motion.div
                    className="absolute z-30 pointer-events-none flex items-center justify-center"
                    style={{
                      top: '23.8%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '24px',
                      height: '24px',
                    }}
                    animate={{
                      scale: status === 'speaking' ? energyPulse : [1, 1.12, 1],
                    }}
                    transition={{
                      scale: { duration: status === 'speaking' ? 0.12 : 2.2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  >
                    {/* Arc Reactor Core SVG */}
                    <svg viewBox="0 0 40 40" className="w-full h-full filter drop-shadow-[0_0_8px_#38bdf8]">
                      {/* Outer Triangular Arc Halo */}
                      <polygon
                        points="20,4 36,32 4,32"
                        fill="rgba(56, 189, 248, 0.35)"
                        stroke="#67e8f9"
                        strokeWidth="2"
                      />
                      {/* Inner Glowing White Core */}
                      <polygon
                        points="20,10 32,30 8,30"
                        fill="#ffffff"
                        filter="drop-shadow(0 0 6px #38bdf8)"
                      />
                    </svg>

                    {/* Radial Energy Flare */}
                    <div
                      className="absolute inset-0 rounded-full bg-cyan-400/40 filter blur-md pointer-events-none"
                      style={{
                        boxShadow:
                          status === 'speaking'
                            ? '0 0 35px #38bdf8, 0 0 50px rgba(56, 189, 248, 0.6)'
                            : '0 0 18px #38bdf8',
                      }}
                    />
                  </motion.div>

                  {/* 3. REPULSOR PALM GLOW NODES */}
                  <div
                    className="absolute z-30 pointer-events-none w-2 h-2 rounded-full bg-cyan-300 filter blur-[1px] opacity-75 shadow-[0_0_10px_#38bdf8]"
                    style={{ top: '48%', left: '20%' }}
                  />
                  <div
                    className="absolute z-30 pointer-events-none w-2 h-2 rounded-full bg-cyan-300 filter blur-[1px] opacity-75 shadow-[0_0_10px_#38bdf8]"
                    style={{ top: '48%', right: '20%' }}
                  />

                  {/* 4. SOUNDWAVE RINGS EMANATING WHEN SPEAKING */}
                  {status === 'speaking' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-25">
                      <motion.div
                        className="w-48 h-48 rounded-full border border-cyan-400/60"
                        animate={{ scale: [0.7, 1.3], opacity: [0.8, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      />
                      <motion.div
                        className="w-48 h-48 rounded-full border border-amber-400/50"
                        animate={{ scale: [0.7, 1.5], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                      />
                    </div>
                  )}
                </motion.div>

                {/* Pedestal Laser Projection Disc at Feet */}
                <div className="absolute bottom-0 w-44 sm:w-52 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 filter blur-xs shadow-[0_0_20px_rgba(56,189,248,0.5)] z-10 flex items-center justify-center">
                  <div className="w-36 h-3 rounded-full bg-amber-400/30 filter blur-sm" />
                </div>
              </div>

              {/* Stark Status HUD Card Right below the Armor */}
              <div className="w-full max-w-sm mt-1 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 backdrop-blur-md flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>ARC POWER: 100%</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>NANO-ARMOR: OK</span>
                </div>
                <div className="flex items-center gap-1 text-amber-300">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>MK-LXXXV</span>
                </div>
              </div>
            </div>
          ) : suitView === 'helmet' ? (
            /* ================= MODE 2: TALKING HELMET (CLOSE-UP MECHANICAL JAW) ================= */
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden flex flex-col items-center justify-center border-2 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl backdrop-blur-xl border-amber-500/60">
              <svg viewBox="0 0 200 240" className="w-48 h-56 sm:w-56 sm:h-64 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                <defs>
                  <linearGradient id="ironCrimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="35%" stopColor="#b91c1c" />
                    <stop offset="75%" stopColor="#7f1d1d" />
                    <stop offset="100%" stopColor="#450a0a" />
                  </linearGradient>
                  <linearGradient id="ironGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="25%" stopColor="#f59e0b" />
                    <stop offset="65%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#92400e" />
                  </linearGradient>
                  <linearGradient id="ironDarkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>
                  <radialGradient id="ironEyeGlow">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="45%" stopColor="#67e8f9" />
                    <stop offset="85%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>

                {/* 1. UPPER HELMET DOME / RED TITANIUM SHELL */}
                <path
                  d="M 50,45 C 50,15 150,15 150,45 C 168,58 178,82 178,115 C 178,155 162,185 152,205 L 142,215 L 128,218 L 128,198 C 145,185 156,155 156,120 C 156,85 145,55 125,48 L 75,48 C 55,55 44,85 44,120 C 44,155 55,185 72,198 L 72,218 L 58,215 L 48,205 C 38,185 22,155 22,115 C 22,82 32,58 50,45 Z"
                  fill="url(#ironCrimsonGrad)"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                />

                {/* 2. GOLDEN BROW & UPPER CHEEK FACEPLATE */}
                <path
                  d="M 58,56 L 100,50 L 142,56 L 152,78 L 142,105 L 132,108 L 125,98 L 100,103 L 75,98 L 68,108 L 58,105 L 48,78 Z"
                  fill="url(#ironGoldGrad)"
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                />

                {/* 3. GLOWING OPTICAL EYES */}
                <polygon points="62,82 88,85 84,94 65,92" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
                <polygon points="64,84 86,87 83,92 67,91" fill="url(#ironEyeGlow)" />
                <polygon points="138,82 112,85 116,94 135,92" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
                <polygon points="136,84 114,87 117,92 133,91" fill="url(#ironEyeGlow)" />
                <line x1="66" y1="88" x2="84" y2="90" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="134" y1="88" x2="116" y2="90" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

                {/* 4. MID FACE NOSE & CHEEK INTAKES */}
                <path d="M 94,102 L 100,120 L 106,102 Z" fill="#78350f" stroke="#d97706" strokeWidth="0.8" />
                <path d="M 52,112 L 68,110 L 75,142 L 58,154 Z" fill="url(#ironGoldGrad)" stroke="#f59e0b" strokeWidth="1" />
                <path d="M 148,112 L 132,110 L 125,142 L 142,154 Z" fill="url(#ironGoldGrad)" stroke="#f59e0b" strokeWidth="1" />

                {/* 5. ARTICULATED LOWER JAW / TALKING CHIN */}
                <g transform={`translate(0, ${jawOffset})`} style={{ transition: 'transform 0.08s ease-out' }}>
                  <path d="M 68,142 L 80,140 L 100,144 L 120,140 L 132,142 L 124,185 L 100,196 L 76,185 Z" fill="url(#ironGoldGrad)" stroke="#fbbf24" strokeWidth="1.2" />
                  <path d="M 85,180 L 100,175 L 115,180 L 110,205 L 100,210 L 90,205 Z" fill="url(#ironCrimsonGrad)" stroke="#ef4444" strokeWidth="1" />
                  <rect x="82" y="152" width="36" height="10" rx="3" fill="url(#ironDarkGrad)" stroke="#0284c7" strokeWidth="0.8" />
                  {[0, 1, 2, 3, 4, 5, 6].map((barIdx) => {
                    const h =
                      status === 'speaking'
                        ? Math.sin((speakingCycle * 30 + barIdx * 45) * (Math.PI / 180)) * 3.5 + 4.5
                        : status === 'listening'
                        ? Math.min(8, (liveAudioLevel / 100) * 8 + 1.5)
                        : 2;
                    return (
                      <line
                        key={barIdx}
                        x1={86 + barIdx * 4.5}
                        y1={157 - h / 2}
                        x2={86 + barIdx * 4.5}
                        y2={157 + h / 2}
                        stroke={status === 'speaking' ? '#67e8f9' : '#38bdf8'}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
              </svg>

              {/* Status Pill */}
              <div className="absolute bottom-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-amber-500/40 backdrop-blur-md text-[10px] font-mono shadow-md pointer-events-none">
                <span className={`w-2 h-2 rounded-full ${status === 'speaking' ? 'bg-cyan-400 animate-ping' : status === 'listening' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-bold text-slate-200">
                  {status === 'speaking' ? 'JARVIS SPEAKING...' : status === 'listening' ? 'LISTENING TO YOU...' : 'TAP TO TALK'}
                </span>
              </div>
            </div>
          ) : (
            /* ================= MODE 3: HUD INTERIOR COCKPIT (TONY POV) ================= */
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden flex flex-col items-center justify-between p-3 bg-slate-950/95 font-mono text-cyan-400 text-[10px] border-2 border-cyan-500/50 shadow-2xl">
              <div className="w-full flex items-center justify-between border-b border-cyan-500/30 pb-1">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>ARMOR: 100%</span>
                </div>
                <div className="flex items-center gap-1 text-amber-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>ARC: 3.2 GW</span>
                </div>
              </div>

              <div className="relative w-36 h-36 flex items-center justify-center">
                <motion.div className="absolute inset-0 rounded-full border border-cyan-500/40" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
                <motion.div className="absolute inset-2 rounded-full border border-dashed border-red-500/40" animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} />
                <Crosshair className="w-12 h-12 text-cyan-300 animate-pulse" />
                <div className="absolute top-1 text-[9px] text-cyan-300 tracking-wider">TARGET ACQUIRED</div>
                <div className="absolute bottom-1 text-[9px] text-amber-300 font-bold">JARVIS NEURAL SYNC</div>
              </div>

              <div className="w-full flex items-center justify-center gap-1 py-1">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-cyan-400"
                    animate={{
                      height:
                        status === 'speaking'
                          ? [4, 18, 6, 22, 8][(speakingCycle + i) % 5]
                          : status === 'listening'
                          ? Math.max(3, (liveAudioLevel / 100) * 20)
                          : 4,
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>

              <div className="w-full flex items-center justify-between border-t border-cyan-500/30 pt-1 text-[9px] text-slate-300">
                <span>REPULSOR: ARMED</span>
                <span className="text-cyan-300 font-bold">MK-85 PROTOCOL</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Real-Time Acoustic Waveform Visualizer Bar Chart below the Face */}
      <div className="w-full max-w-sm sm:max-w-md mt-2 px-3 z-20">
        <div className="px-3 py-2 rounded-2xl bg-slate-950/85 border border-cyan-500/35 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[10px] font-mono mb-1 text-cyan-400">
            <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
              <Activity className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : status === 'speaking' ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
              <span>Acoustic Frequency Spectrum</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                BARS
              </span>
              <span className={`text-[10px] font-mono font-bold ${isListening ? 'text-emerald-400' : status === 'speaking' ? 'text-amber-400' : 'text-cyan-400/70'}`}>
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
            accentTheme="cyber-amber"
            showControls={false}
            showMetrics={false}
            className="w-full"
          />
        </div>
      </div>

      {/* Spoken Response Audio Box ("bolkar reply da") */}
      <div className="w-full max-w-xl mt-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 relative group shadow-xl">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-amber-300 tracking-wider uppercase">
              IRON MAN J.A.R.V.I.S. VOICE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTestIronManSpeech}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="Test Iron Man spoken audio reply"
            >
              <Volume2 className="w-3 h-3 text-amber-400" />
              <span>Bolkar Sunao</span>
            </button>
          </div>
        </div>

        {/* Live speech feedback if available */}
        {liveSpeechTranscript && (
          <div className="mb-2 p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <span>🗣️ You said: "{liveSpeechTranscript}"</span>
          </div>
        )}

        <p className="text-sm font-medium text-slate-100 leading-relaxed min-h-[36px] flex items-center">
          "{lastSpokenText || 'Namaste! Mai aapka Iron Man AI Assistant hu. Kuch bhi boliye, mai bolkar jawab dunga.'}"
        </p>
      </div>

      {/* Quick Action Control Bar (Suit Voice Dialogue & Tactical Tools) */}
      <div className="w-full max-w-xl flex items-center justify-between gap-2 mt-2 px-1 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              triggerHaptic([30]);
              if (onExecuteCommand) {
                onExecuteCommand('Iron Man suit full diagnostics report check karo');
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>Diagnostics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic([30]);
              if (onExecuteCommand) {
                onExecuteCommand('Arc Reactor power output aur health batao');
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Arc Power</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic([30]);
              if (onExecuteCommand) {
                onExecuteCommand('Time date aur battery status bolkar batao');
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-xs font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span>Time & Battery</span>
          </button>
        </div>

        {/* Live Mic Action Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic([30]);
            onToggleListen();
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
            isListening
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-red-950/80 border-red-500/50 text-red-300 hover:border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
          }`}
        >
          {isListening ? (
            <>
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mic Active (Boliye...)</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-red-400" />
              <span>Tap to Talk (Boliye)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
