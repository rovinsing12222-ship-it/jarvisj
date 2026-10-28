import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Loader2,
  Radio,
  Box,
  Heart,
  Music,
  Music2,
  Square,
  SkipForward,
  Palette,
  ListOrdered,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  VolumeX,
  Activity,
} from 'lucide-react';
import { JarvisMoodConfig } from '../types';
import userGirlAvatarImg from '../assets/images/user_girl_avatar.jpg';
import { triggerHaptic } from '../utils/hapticEngine';
import { playBeepSound, speakJarvis } from '../utils/audioSynth';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

export interface GirlAssistant3DProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  isListening: boolean;
  handsFreeMode: boolean;
  onToggleListen: () => void;
  onToggleHandsFree?: () => void;
  initialViewMode?: 'illustration' | 'mesh3d';
  isSinging?: boolean;
  activeSongTitle?: string;
  activeSongArtist?: string;
  currentLyricLine?: string;
  onSingSong?: (songId?: string) => void;
  onStopSong?: () => void;
  onNextSong?: () => void;
  moodConfig?: JarvisMoodConfig;
  onExecuteCommand?: (commandText: string) => void;
  lastSpokenText?: string;
  liveSpeechTranscript?: string;
}

export const GirlAssistant3D: React.FC<GirlAssistant3DProps> = ({
  status,
  isListening,
  handsFreeMode,
  onToggleListen,
  onToggleHandsFree,
  initialViewMode = 'illustration',
  isSinging = false,
  activeSongTitle,
  activeSongArtist,
  currentLyricLine,
  onSingSong,
  onStopSong,
  onNextSong,
  moodConfig,
  onExecuteCommand,
  lastSpokenText,
  liveSpeechTranscript,
}) => {
  const [viewMode, setViewMode] = useState<'illustration' | 'mesh3d'>(initialViewMode);
  const [digitalArtFx, setDigitalArtFx] = useState(true);
  const [localTranscript, setLocalTranscript] = useState<string>(liveSpeechTranscript || '');
  const [typedCommand, setTypedCommand] = useState<string>('');
  const [noteBeat, setNoteBeat] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Listen to live note events from singing synthesizer to pulse the visualizer
  useEffect(() => {
    const handleSingingNote = () => {
      setNoteBeat((prev) => (prev + 1) % 100);
    };
    window.addEventListener('jarvis:singing-note', handleSingingNote);
    return () => {
      window.removeEventListener('jarvis:singing-note', handleSingingNote);
    };
  }, []);

  // Real-time microphone listening level and error/prompt tracking
  const [micIssue, setMicIssue] = useState<{ status: 'denied' | 'silent'; message: string } | null>(null);
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);

  useEffect(() => {
    const handleMicStatus = (e: any) => {
      if (e.detail?.status === 'denied' || e.detail?.status === 'silent') {
        setMicIssue({ status: e.detail.status, message: e.detail.message });
      } else if (e.detail?.status === 'listening') {
        setMicIssue(null);
      }
    };
    const handleMicVolume = (e: any) => {
      const vol = e.detail?.volume ?? e.detail?.audioLevel ?? 0;
      setLiveAudioLevel(vol);
    };

    window.addEventListener('jarvis:mic-status', handleMicStatus);
    window.addEventListener('jarvis:mic-volume', handleMicVolume);
    window.addEventListener('jarvis:speech-volume', handleMicVolume);
    return () => {
      window.removeEventListener('jarvis:mic-status', handleMicStatus);
      window.removeEventListener('jarvis:mic-volume', handleMicVolume);
      window.removeEventListener('jarvis:speech-volume', handleMicVolume);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      setMicIssue(null);
    }
  }, [isListening]);

  // Sync and listen to real-time speech recognition
  useEffect(() => {
    if (liveSpeechTranscript !== undefined) {
      setLocalTranscript(liveSpeechTranscript);
    }
  }, [liveSpeechTranscript]);

  useEffect(() => {
    const handleLiveSpeech = (e: any) => {
      const text = e.detail?.transcript ?? '';
      setLocalTranscript(text);
    };
    window.addEventListener('jarvis:live-speech', handleLiveSpeech);
    return () => {
      window.removeEventListener('jarvis:live-speech', handleLiveSpeech);
    };
  }, []);

  // Animatable 3D realistic girl parts
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const neckGroupRef = useRef<THREE.Group | null>(null);
  const chestGroupRef = useRef<THREE.Group | null>(null);
  const jawRef = useRef<THREE.Group | null>(null);
  const upperLipRef = useRef<THREE.Mesh | null>(null);
  const lowerLipRef = useRef<THREE.Mesh | null>(null);
  const mouthCavityRef = useRef<THREE.Mesh | null>(null);
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const leftEyePupilRef = useRef<THREE.Group | null>(null);
  const rightEyePupilRef = useRef<THREE.Group | null>(null);
  const hairStrandsRef = useRef<THREE.Group[]>([]);
  const audioAuraRef = useRef<THREE.Group | null>(null);

  // Interaction & State refs
  const statusRef = useRef(status);
  statusRef.current = status;
  const isPointerDownRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const blinkTimerRef = useRef(0);
  const isBlinkingRef = useRef(false);

  useEffect(() => {
    // Only initialize heavy Three.js 3D WebGL renderer when 3D Mesh Mode is active!
    // Keeps illustration mode (default) ultra-fast, lightweight, and battery-friendly on startup.
    if (viewMode !== 'mesh3d') return;

    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 350;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera with portrait lens focal length
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
    camera.position.set(0, 0.28, 3.4);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High Dynamic Range Tone Mapping
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('WebGL is not supported or context lost in this WebView/device:', err);
      return;
    }

    // 4. Studio Portrait 3-Point Lighting for realistic human skin & hair
    const ambientLight = new THREE.AmbientLight(0xfff1ea, 1.3);
    scene.add(ambientLight);

    // Warm key light (simulates soft beauty studio softbox)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(2.2, 3.0, 3.2);
    scene.add(keyLight);

    // Soft cool fill light to soften shadows on cheeks
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    fillLight.position.set(-2.5, 1.5, 2.0);
    scene.add(fillLight);

    // Golden rim / hair kicker light from behind
    const hairRimLight = new THREE.DirectionalLight(0xfef08a, 1.8);
    hairRimLight.position.set(0, 3.5, -2.5);
    scene.add(hairRimLight);

    // Subtle rosy bounce light from below
    const bounceLight = new THREE.PointLight(0xfda4af, 1.0, 5);
    bounceLight.position.set(0, -1.5, 1.5);
    scene.add(bounceLight);

    // 5. MASTER AVATAR GROUP
    const avatarGroup = new THREE.Group();
    avatarGroupRef.current = avatarGroup;
    scene.add(avatarGroup);

    // Realistic Materials for 22-year-old Indian Girl AI
    // Warm radiant Indian skin tone
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xcaa085,
      roughness: 0.58,
      metalness: 0.05,
    });

    // Rosy cheek blush material
    const blushMaterial = new THREE.MeshBasicMaterial({
      color: 0xbe185d,
      transparent: true,
      opacity: 0.25,
    });

    // Luscious Espresso Black-Brown Hair
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x181412,
      roughness: 0.45,
      metalness: 0.2,
    });

    // Bold Cyberpunk Hair Highlight strands (Electric Cyan & Neon Violet)
    const hairHighlightMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.3,
      metalness: 0.4,
    });

    // Bold Berry Rose Lip Material with glossy finish
    const lipMaterial = new THREE.MeshStandardMaterial({
      color: 0xbe185d,
      roughness: 0.25,
      metalness: 0.2,
    });

    // Chic Bold Cyber Jacket (Midnight Slate with Circuit Trim)
    const clothMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.25,
    });

    // Gold Pendant Necklace Material
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.18,
      metalness: 0.88,
    });

    // Pearlescent Teeth Material
    const teethMaterial = new THREE.MeshBasicMaterial({
      color: 0xfefce8,
    });

    // --- CHEST & SHOULDERS (Graceful Feminine Upper Body) ---
    const chestGroup = new THREE.Group();
    chestGroupRef.current = chestGroup;
    avatarGroup.add(chestGroup);

    // Shoulders & upper bust
    const shouldersGeo = new THREE.CylinderGeometry(0.36, 0.72, 0.75, 32);
    const shoulders = new THREE.Mesh(shouldersGeo, clothMaterial);
    shoulders.position.set(0, -0.82, -0.06);
    chestGroup.add(shoulders);

    // Off-shoulder neckline trim
    const collarTrimGeo = new THREE.TorusGeometry(0.38, 0.04, 16, 32);
    const collarTrim = new THREE.Mesh(collarTrimGeo, clothMaterial);
    collarTrim.rotation.x = Math.PI / 2;
    collarTrim.position.set(0, -0.48, -0.04);
    chestGroup.add(collarTrim);

    // Clavicle & Upper chest skin (natural feminine cleavage / collarbone)
    const upperChestSkinGeo = new THREE.CylinderGeometry(0.24, 0.35, 0.35, 24);
    const upperChestSkin = new THREE.Mesh(upperChestSkinGeo, skinMaterial);
    upperChestSkin.position.set(0, -0.42, 0.02);
    chestGroup.add(upperChestSkin);

    // Delicate Gold Chain Necklace
    const necklaceGeo = new THREE.TorusGeometry(0.22, 0.012, 12, 32);
    const necklace = new THREE.Mesh(necklaceGeo, goldMaterial);
    necklace.rotation.x = Math.PI / 2 + 0.15;
    necklace.position.set(0, -0.36, 0.04);
    chestGroup.add(necklace);

    // Sparkling Little Heart / Gem Pendant
    const pendantGeo = new THREE.OctahedronGeometry(0.038, 0);
    const pendant = new THREE.Mesh(pendantGeo, goldMaterial);
    pendant.position.set(0, -0.48, 0.16);
    necklace.add(pendant);

    // --- NECK GROUP ---
    const neckGroup = new THREE.Group();
    neckGroupRef.current = neckGroup;
    avatarGroup.add(neckGroup);

    // Slender graceful neck
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 24);
    const neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.position.set(0, -0.25, -0.03);
    neckGroup.add(neck);

    // --- REALISTIC HEAD & FACE GROUP ---
    const headGroup = new THREE.Group();
    headGroupRef.current = headGroup;
    avatarGroup.add(headGroup);

    // 1. Cranium & Oval Feminine Facial Base
    const headGeo = new THREE.SphereGeometry(0.52, 36, 36);
    headGeo.scale(0.88, 1.15, 0.95);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.set(0, 0.24, -0.02);
    headGroup.add(headMesh);

    // 2. Soft Cheeks & Delicate Tapered Jawline
    const jawTaperGeo = new THREE.ConeGeometry(0.34, 0.48, 32);
    jawTaperGeo.scale(0.85, 1.0, 0.72);
    const jawTaper = new THREE.Mesh(jawTaperGeo, skinMaterial);
    jawTaper.rotation.x = Math.PI;
    jawTaper.position.set(0, 0.08, 0.11);
    headGroup.add(jawTaper);

    // 3. Cute Cheek Blush (Left & Right soft rosy glow)
    [-1, 1].forEach((side) => {
      const blushGeo = new THREE.CircleGeometry(0.11, 24);
      const blush = new THREE.Mesh(blushGeo, blushMaterial);
      blush.position.set(side * 0.26, 0.18, 0.44);
      blush.rotation.y = side * 0.35;
      headGroup.add(blush);
    });

    // 4. Delicate Feminine Nose
    const noseBridgeGeo = new THREE.CylinderGeometry(0.022, 0.038, 0.16, 16);
    const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMaterial);
    noseBridge.position.set(0, 0.22, 0.48);
    noseBridge.rotation.x = 0.22;
    headGroup.add(noseBridge);

    const noseTipGeo = new THREE.SphereGeometry(0.042, 16, 16);
    const noseTip = new THREE.Mesh(noseTipGeo, skinMaterial);
    noseTip.position.set(0, 0.16, 0.52);
    headGroup.add(noseTip);

    // --- REALISTIC HUMAN EYES (Hazel / Deep Amber-Brown) ---
    const eyeSpacing = 0.21;
    const eyeY = 0.27;
    const eyeZ = 0.43;

    [-1, 1].forEach((side) => {
      const eyeSocketGroup = new THREE.Group();
      eyeSocketGroup.position.set(side * eyeSpacing, eyeY, eyeZ);
      headGroup.add(eyeSocketGroup);

      // Eye White (Sclera)
      const scleraGeo = new THREE.SphereGeometry(0.095, 24, 24);
      scleraGeo.scale(1.2, 0.85, 0.75);
      const scleraMat = new THREE.MeshStandardMaterial({
        color: 0xfdfdfd,
        roughness: 0.15,
      });
      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      eyeSocketGroup.add(sclera);

      // Eye Iris Group (Animatable pupil gaze)
      const pupilGroup = new THREE.Group();
      pupilGroup.position.set(0, 0, 0.065);
      eyeSocketGroup.add(pupilGroup);

      if (side === -1) leftEyePupilRef.current = pupilGroup;
      else rightEyePupilRef.current = pupilGroup;

      // Iris (Warm Hazel-Brown with depth)
      const irisGeo = new THREE.CircleGeometry(0.058, 32);
      const irisMat = new THREE.MeshBasicMaterial({ color: 0x6b3f20 });
      const iris = new THREE.Mesh(irisGeo, irisMat);
      pupilGroup.add(iris);

      // Inner Amber Ring
      const innerIrisGeo = new THREE.CircleGeometry(0.042, 24);
      const innerIrisMat = new THREE.MeshBasicMaterial({ color: 0xa16207 });
      const innerIris = new THREE.Mesh(innerIrisGeo, innerIrisMat);
      innerIris.position.set(0, 0, 0.002);
      pupilGroup.add(innerIris);

      // Deep Black Pupil
      const pupilGeo = new THREE.CircleGeometry(0.024, 24);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, 0.004);
      pupilGroup.add(pupil);

      // Primary Catchlight Sparkle (Makes eyes look alive & moist)
      const catchlight1 = new THREE.Mesh(
        new THREE.CircleGeometry(0.014, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      catchlight1.position.set(0.018, 0.018, 0.006);
      pupilGroup.add(catchlight1);

      // Secondary subtle catchlight
      const catchlight2 = new THREE.Mesh(
        new THREE.CircleGeometry(0.007, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
      );
      catchlight2.position.set(-0.014, -0.012, 0.006);
      pupilGroup.add(catchlight2);

      // Eyelash line (Feminine winged eyeliner)
      const lashLineGeo = new THREE.TorusGeometry(0.088, 0.014, 8, 24, Math.PI * 0.85);
      const lashLineMat = new THREE.MeshBasicMaterial({ color: 0x180b06 });
      const lashLine = new THREE.Mesh(lashLineGeo, lashLineMat);
      lashLine.position.set(0, 0.038, 0.052);
      lashLine.rotation.z = side === 1 ? -0.16 : Math.PI + 0.16;
      eyeSocketGroup.add(lashLine);

      // Delicate Arched Natural Eyebrow (soft rose-plum tone)
      const browGeo = new THREE.BoxGeometry(0.16, 0.022, 0.018);
      const browMat = new THREE.MeshBasicMaterial({ color: 0x9d174d });
      const brow = new THREE.Mesh(browGeo, browMat);
      brow.position.set(side * 0.02, 0.14, 0.04);
      brow.rotation.z = side * 0.14;
      eyeSocketGroup.add(brow);
    });

    // Blinking Natural Eyelids
    const eyelidGeo = new THREE.SphereGeometry(0.105, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55);
    eyelidGeo.scale(1.22, 0.88, 0.78);

    const leftLid = new THREE.Mesh(eyelidGeo, skinMaterial.clone());
    leftLid.position.set(-eyeSpacing, eyeY + 0.012, eyeZ);
    leftLid.rotation.x = -Math.PI / 2;
    leftLid.scale.set(1, 0.05, 1);
    leftEyelidRef.current = leftLid;
    headGroup.add(leftLid);

    const rightLid = new THREE.Mesh(eyelidGeo, skinMaterial.clone());
    rightLid.position.set(eyeSpacing, eyeY + 0.012, eyeZ);
    rightLid.rotation.x = -Math.PI / 2;
    rightLid.scale.set(1, 0.05, 1);
    rightEyelidRef.current = rightLid;
    headGroup.add(rightLid);

    // --- REALISTIC MOUTH & LIP-SYNC SYSTEM ---
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, 0.04, 0.44);
    headGroup.add(jawGroup);
    jawRef.current = jawGroup;

    // Upper Lip with Natural Cupid's Bow
    const upperLipGeo = new THREE.CylinderGeometry(0.018, 0.024, 0.13, 20);
    upperLipGeo.rotateZ(Math.PI / 2);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMaterial);
    upperLip.position.set(0, 0.028, 0.022);
    jawGroup.add(upperLip);
    upperLipRef.current = upperLip;

    // Lower Lip with Fullness
    const lowerLipGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.12, 20);
    lowerLipGeo.rotateZ(Math.PI / 2);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMaterial);
    lowerLip.position.set(0, -0.008, 0.018);
    jawGroup.add(lowerLip);
    lowerLipRef.current = lowerLip;

    // Inner Teeth Row
    const teethGeo = new THREE.BoxGeometry(0.085, 0.018, 0.02);
    const teeth = new THREE.Mesh(teethGeo, teethMaterial);
    teeth.position.set(0, 0.012, 0.005);
    jawGroup.add(teeth);

    // Mouth Cavity Depth
    const mouthCavityGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.09, 16);
    mouthCavityGeo.rotateZ(Math.PI / 2);
    const mouthCavityMat = new THREE.MeshBasicMaterial({ color: 0x3f0e1a });
    const mouthCavity = new THREE.Mesh(mouthCavityGeo, mouthCavityMat);
    mouthCavity.position.set(0, 0.01, -0.005);
    jawGroup.add(mouthCavity);
    mouthCavityRef.current = mouthCavity;

    // --- GORGEOUS LAYERED FEMININE BRUNETTE HAIR ---
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    // 1. Main Hair Volume (Top, Back, Sides)
    const hairCapGeo = new THREE.SphereGeometry(0.57, 36, 32, 0, Math.PI * 2, 0, Math.PI * 0.75);
    hairCapGeo.scale(0.95, 1.14, 1.06);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMaterial);
    hairCap.position.set(0, 0.28, -0.05);
    hairGroup.add(hairCap);

    // 2. Crown & Back hair falling over shoulders
    const backHairGeo = new THREE.CylinderGeometry(0.48, 0.65, 0.95, 24);
    const backHair = new THREE.Mesh(backHairGeo, hairMaterial);
    backHair.position.set(0, -0.15, -0.24);
    backHair.rotation.x = -0.15;
    hairGroup.add(backHair);

    // 3. Side Framing Locks (Left & Right graceful hair falling over chest)
    const hairStrandList: THREE.Group[] = [];

    [-1, 1].forEach((side) => {
      const lockGroup = new THREE.Group();
      lockGroup.position.set(side * 0.44, 0.22, 0.12);
      hairGroup.add(lockGroup);
      hairStrandList.push(lockGroup);

      // Upper temple flow
      const upperLockGeo = new THREE.CylinderGeometry(0.065, 0.09, 0.45, 16);
      upperLockGeo.scale(1, 1, 0.6);
      const upperLock = new THREE.Mesh(upperLockGeo, hairMaterial);
      upperLock.position.set(0, -0.18, 0.04);
      upperLock.rotation.z = side * -0.18;
      lockGroup.add(upperLock);

      // Lower flowing lock over shoulder (long flowing anime hair)
      const lowerLockGeo = new THREE.ConeGeometry(0.095, 0.82, 16);
      lowerLockGeo.scale(1, 1, 0.5);
      const lowerLock = new THREE.Mesh(lowerLockGeo, hairMaterial);
      lowerLock.position.set(side * 0.04, -0.65, 0.12);
      lowerLock.rotation.z = side * -0.08;
      lowerLock.rotation.x = 0.12;
      lockGroup.add(lowerLock);

      // Subtle luminous rose highlight strand
      const hlLockGeo = new THREE.CylinderGeometry(0.022, 0.038, 0.62, 12);
      const hlLock = new THREE.Mesh(hlLockGeo, hairHighlightMat);
      hlLock.position.set(side * 0.02, -0.38, 0.16);
      hlLock.rotation.z = side * -0.12;
      lockGroup.add(hlLock);
    });
    hairStrandsRef.current = hairStrandList;

    // 4. Soft Layered Front Bangs / Fringe (Natural side-parting)
    const bangsCenter = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.16, 0.09),
      hairMaterial
    );
    bangsCenter.position.set(-0.06, 0.52, 0.44);
    bangsCenter.rotation.x = -0.24;
    bangsCenter.rotation.z = 0.06;
    hairGroup.add(bangsCenter);

    const bangsSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.22, 0.08),
      hairMaterial
    );
    bangsSide.position.set(0.18, 0.48, 0.42);
    bangsSide.rotation.x = -0.22;
    bangsSide.rotation.z = -0.18;
    hairGroup.add(bangsSide);

    // 5. 3D DELICATE BLOOMING PINK ROSE HELD NEAR CHEST (User requested pink rose)
    const roseGroup = new THREE.Group();
    roseGroup.position.set(0.16, -0.36, 0.36);
    roseGroup.rotation.set(-0.22, -0.26, 0.2);
    headGroup.add(roseGroup);

    // Slender green stem
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.55,
      metalness: 0.05,
    });
    const stemGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.52, 16);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, -0.16, 0);
    roseGroup.add(stem);

    // Delicate green leaves on stem
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    [-1, 1].forEach((side) => {
      const leafGeo = new THREE.SphereGeometry(0.052, 12, 12);
      leafGeo.scale(1.8, 0.22, 0.8);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(side * 0.045, -0.12 + side * 0.08, 0.02);
      leaf.rotation.set(0.2, 0, side * 0.7);
      roseGroup.add(leaf);
    });

    // Calyx / sepals under bud
    const calyxMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const calyxGeo = new THREE.ConeGeometry(0.045, 0.065, 8);
    const calyx = new THREE.Mesh(calyxGeo, calyxMat);
    calyx.position.set(0, 0.045, 0);
    calyx.rotation.x = Math.PI;
    roseGroup.add(calyx);

    // Rose Petal Materials
    const rosePetalMatOuter = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Rich radiant pink rose
      roughness: 0.42,
      metalness: 0.08,
    });
    const rosePetalMatInner = new THREE.MeshStandardMaterial({
      color: 0xfb7185, // Luminous soft pink petal
      roughness: 0.38,
      metalness: 0.1,
    });

    // Outer swirling velvet petals
    for (let p = 0; p < 7; p++) {
      const angle = (p / 7) * Math.PI * 2;
      const petalGeo = new THREE.SphereGeometry(0.052, 16, 16);
      petalGeo.scale(1.25, 0.4, 0.9);
      const petal = new THREE.Mesh(petalGeo, rosePetalMatOuter);
      petal.position.set(Math.cos(angle) * 0.035, 0.075, Math.sin(angle) * 0.035);
      petal.rotation.set(0.42, angle, 0.2);
      roseGroup.add(petal);
    }

    // Inner bud core petals
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2 + 0.5;
      const innerPetalGeo = new THREE.SphereGeometry(0.038, 12, 12);
      innerPetalGeo.scale(1.0, 0.5, 0.8);
      const innerPetal = new THREE.Mesh(innerPetalGeo, rosePetalMatInner);
      innerPetal.position.set(Math.cos(angle) * 0.02, 0.09, Math.sin(angle) * 0.02);
      innerPetal.rotation.set(0.25, angle, 0.15);
      roseGroup.add(innerPetal);
    }

    // Rose center heart bud
    const centerBudGeo = new THREE.SphereGeometry(0.026, 12, 12);
    const centerBud = new THREE.Mesh(
      centerBudGeo,
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 })
    );
    centerBud.position.set(0, 0.095, 0);
    roseGroup.add(centerBud);

    // Cute AI Smart Earbud in right ear (Shows she is your connected assistant)
    const earbudGeo = new THREE.SphereGeometry(0.042, 16, 16);
    const earbudMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.85,
      roughness: 0.15,
    });
    const earbud = new THREE.Mesh(earbudGeo, earbudMat);
    earbud.position.set(0.46, 0.22, 0.02);
    headGroup.add(earbud);

    const earbudLed = new THREE.Mesh(
      new THREE.RingGeometry(0.015, 0.025, 16),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    earbudLed.position.set(0.485, 0.22, 0.02);
    earbudLed.rotation.y = Math.PI / 2;
    headGroup.add(earbudLed);

    // Subtle Holographic Aura Ring behind her (Shows AI status)
    const auraGroup = new THREE.Group();
    auraGroup.position.set(0, 0.2, -0.4);
    avatarGroup.add(auraGroup);
    audioAuraRef.current = auraGroup;

    const auraRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.014, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
    );
    auraGroup.add(auraRing1);

    const auraRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.01, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.25 })
    );
    auraRing2.rotation.x = 0.4;
    auraGroup.add(auraRing2);

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Interactive Touch / Mouse Orbit
    const handlePointerDown = (e: PointerEvent) => {
      isPointerDownRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;
      const deltaX = e.clientX - prevPointerRef.current.x;
      const deltaY = e.clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      targetRotationRef.current.y += deltaX * 0.007;
      targetRotationRef.current.x = Math.max(
        -0.25,
        Math.min(0.25, targetRotationRef.current.x + deltaY * 0.005)
      );
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
    };

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 8. LIFELIKE HUMAN ANIMATION LOOP
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentStatus = statusRef.current;

      // Orbit dampening
      if (!isPointerDownRef.current) {
        targetRotationRef.current.x *= 0.94;
        targetRotationRef.current.y *= 0.95;
      }
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;

      if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = currentRotationRef.current.y;
        avatarGroupRef.current.rotation.x = currentRotationRef.current.x;
      }

      // Natural Human Breathing (Subtle chest & shoulder movement)
      const breathing = Math.sin(elapsed * 1.6) * 0.024;
      if (chestGroupRef.current) {
        chestGroupRef.current.position.y = breathing * 0.6;
        chestGroupRef.current.scale.set(1 + breathing * 0.04, 1 + breathing * 0.03, 1 + breathing * 0.04);
      }
      if (neckGroupRef.current) {
        neckGroupRef.current.position.y = breathing * 0.4;
      }

      // Natural Head Posture & Realistic Reactions
      if (headGroupRef.current) {
        if (currentStatus === 'listening') {
          // Attentive, warm head tilt (curious, listening like a real person)
          headGroupRef.current.rotation.z = 0.06 + Math.sin(elapsed * 2.0) * 0.015;
          headGroupRef.current.rotation.x = 0.06 + Math.sin(elapsed * 1.5) * 0.01;
          headGroupRef.current.rotation.y = Math.sin(elapsed * 0.8) * 0.03;
        } else if (currentStatus === 'speaking') {
          // Expressive conversational head nodding & speech gestures
          headGroupRef.current.rotation.x = Math.sin(elapsed * 5.0) * 0.035;
          headGroupRef.current.rotation.y = Math.cos(elapsed * 3.2) * 0.025;
          headGroupRef.current.rotation.z = Math.sin(elapsed * 2.5) * 0.015;
        } else if (currentStatus === 'processing') {
          // Thoughtful upward tilt
          headGroupRef.current.rotation.z = -0.05;
          headGroupRef.current.rotation.x = -0.04 + Math.sin(elapsed * 3.0) * 0.01;
        } else {
          // Natural idle breathing micro-motion
          headGroupRef.current.rotation.x = Math.sin(elapsed * 0.9) * 0.02;
          headGroupRef.current.rotation.y = Math.cos(elapsed * 0.7) * 0.025;
          headGroupRef.current.rotation.z = Math.sin(elapsed * 0.5) * 0.01;
        }
      }

      // Hair sway physics
      hairStrandsRef.current.forEach((strand, idx) => {
        const sway = Math.sin(elapsed * 2.0 + idx) * 0.025;
        strand.rotation.z = (idx === 0 ? -0.1 : 0.1) + sway;
      });

      // Natural Eye Saccades (Micro-movements looking warmly at the user)
      const gazeX = Math.sin(elapsed * 1.2) * 0.008;
      const gazeY = Math.cos(elapsed * 1.4) * 0.006;
      if (leftEyePupilRef.current && rightEyePupilRef.current) {
        leftEyePupilRef.current.position.x = gazeX;
        leftEyePupilRef.current.position.y = gazeY;
        rightEyePupilRef.current.position.x = gazeX;
        rightEyePupilRef.current.position.y = gazeY;
      }

      // Natural Human Eye Blinking
      blinkTimerRef.current += 0.016;
      if (blinkTimerRef.current > 3.6) {
        isBlinkingRef.current = true;
        if (blinkTimerRef.current > 3.82) {
          isBlinkingRef.current = false;
          blinkTimerRef.current = Math.random() * 1.2;
        }
      }

      const lidTarget = isBlinkingRef.current ? 1.0 : 0.05;
      if (leftEyelidRef.current && rightEyelidRef.current) {
        leftEyelidRef.current.scale.y += (lidTarget - leftEyelidRef.current.scale.y) * 0.4;
        rightEyelidRef.current.scale.y += (lidTarget - rightEyelidRef.current.scale.y) * 0.4;
      }

      // REALISTIC LIP-SYNC & SPEECH MOUTH MOVEMENT
      if (jawRef.current && upperLipRef.current && lowerLipRef.current) {
        if (currentStatus === 'speaking') {
          // Multi-frequency phonetic speech articulation (vowel shapes A, E, O, M)
          const vowelPulse =
            (Math.sin(elapsed * 16) * 0.5 + 0.5) * (Math.cos(elapsed * 8) * 0.3 + 0.7);
          const mouthOpen = vowelPulse * 0.048 + 0.012;

          jawRef.current.position.y = 0.04 - mouthOpen * 0.45;
          lowerLipRef.current.position.y = -mouthOpen;
          upperLipRef.current.position.y = 0.028 + mouthOpen * 0.15;
          if (mouthCavityRef.current) {
            mouthCavityRef.current.scale.y = 1 + vowelPulse * 1.8;
          }
        } else if (currentStatus === 'listening') {
          // Warm attentive gentle smile
          jawRef.current.position.y = 0.04;
          lowerLipRef.current.position.y = -0.004;
          upperLipRef.current.position.y = 0.03;
          if (mouthCavityRef.current) {
            mouthCavityRef.current.scale.y = 0.6;
          }
        } else {
          // Resting soft lips
          jawRef.current.position.y = 0.04;
          lowerLipRef.current.position.y = -0.008;
          upperLipRef.current.position.y = 0.028;
          if (mouthCavityRef.current) {
            mouthCavityRef.current.scale.y = 0.3;
          }
        }
      }

      // Subtle Aura Ring rotation
      if (audioAuraRef.current) {
        audioAuraRef.current.rotation.z += 0.008;
        if (currentStatus === 'speaking') {
          audioAuraRef.current.rotation.z += 0.025;
        } else if (currentStatus === 'listening') {
          audioAuraRef.current.rotation.z += 0.015;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      resizeObserver.disconnect();
      canvasEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [viewMode]);

  // UI state badges & info
  const getBadgeDetails = () => {
    if (isSinging) {
      return {
        title: `🎵 Gana Ga Rahi Hu: ${activeSongTitle || 'Kesariya'}`,
        subtitle: currentLyricLine ? `🎤 "${currentLyricLine}"` : 'Digital Art Animation & Synthesizer Surila Melody...',
        color: 'text-fuchsia-200 border-fuchsia-500/60 bg-fuchsia-950/85 shadow-[0_0_30px_rgba(217,70,239,0.45)]',
        glow: 'bg-fuchsia-500/35',
        icon: <Music className="w-4 h-4 text-fuchsia-400 animate-bounce" />,
      };
    }

    switch (status) {
      case 'listening':
        return {
          title: '🎙️ Aanya Sun Rahi Hai... (Listening Live)',
          subtitle: handsFreeMode
            ? '🎙️ Hands-Free ON: Bina click kare baat karein, sab sun rahi hu'
            : 'Speak now: "YouTube kholo", "Baat karo", "Dad ko phone lagao"',
          color: 'text-emerald-300 border-emerald-500/50 bg-emerald-950/80 shadow-[0_0_25px_rgba(16,185,129,0.35)]',
          glow: 'bg-emerald-500/20',
          icon: <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />,
        };
      case 'speaking':
        return {
          title: '💬 Aanya Live Baat Kar Rahi Hai... (Speaking)',
          subtitle: '22-Yr Cute & Bold Indian AI • Live Interaction & Voice Active',
          color: 'text-rose-200 border-rose-500/50 bg-rose-950/80 shadow-[0_0_25px_rgba(244,63,94,0.35)]',
          glow: 'bg-rose-500/20',
          icon: <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />,
        };
      case 'processing':
        return {
          title: '✨ Google Gemini Quick Answer Engine...',
          subtitle: 'Google Gemini se har question ka instant fast answer generate ho raha hai...',
          color: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/80 shadow-[0_0_25px_rgba(6,182,212,0.35)]',
          glow: 'bg-cyan-500/20',
          icon: <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />,
        };
      default:
        return {
          title: '👩 Aanya (22) • Cute & Bold Indian AI',
          subtitle: handsFreeMode
            ? '🎙️ Always Online: Jo chahein bolein, live sun rahi hu!'
            : 'Tap mic ya avatar to talk live with Aanya',
          color: 'text-pink-200 border-pink-500/40 bg-slate-900/85 shadow-[0_0_20px_rgba(244,114,182,0.25)]',
          glow: 'bg-pink-500/15',
          icon: <Heart className="w-4 h-4 text-pink-400 fill-pink-400/30 animate-pulse" />,
        };
    }
  };

  const badge = getBadgeDetails();

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Visual Mode Selector Tabs (Illustration vs 3D Mesh) */}
      <div className="w-full max-w-sm flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('illustration')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'illustration'
                ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Live Photo & Portrait of 22-Year-Old Cute and Bold Indian Girl AI"
          >
            <span>👩 Live Photo (22 Yr Indian Girl)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mesh3d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'mesh3d'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Interactive 3D WebGL Mesh (Rotate in 3D)"
          >
            <Box className="w-3 h-3 text-cyan-400" />
            <span>💃 3D WebGL</span>
          </button>
        </div>

        {/* Hands-Free indicator badge */}
        {onToggleHandsFree && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleHandsFree();
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all active:scale-95 shadow-md ${
              handsFreeMode
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Continuous conversation: Bina click kare bolte rahein"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                handsFreeMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{handsFreeMode ? '🎙️ Online Hands-Free' : 'Push-to-Talk'}</span>
          </button>
        )}
      </div>

      {/* Interactive Avatar Stage */}
      <div
        className={`relative w-full max-w-sm h-72 sm:h-80 flex items-center justify-center overflow-hidden rounded-3xl border bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 shadow-2xl transition-all duration-700 ${
          moodConfig ? moodConfig.borderColor : 'border-pink-500/20'
        }`}
        style={
          moodConfig
            ? {
                boxShadow: `0 0 35px ${moodConfig.glowColor}`,
              }
            : undefined
        }
      >
        {/* Dynamic Mood Background Radial Glow */}
        <div
          className={`absolute inset-0 rounded-3xl blur-3xl pointer-events-none transition-all duration-700 ${
            moodConfig ? '' : badge.glow
          }`}
          style={{
            background: moodConfig
              ? `radial-gradient(ellipse at center, ${moodConfig.glowColor} 0%, rgba(15, 23, 42, 0) 75%)`
              : undefined,
          }}
        />

        {/* Floating animated sparkles & subtle rose petals */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div className="absolute top-4 left-6 w-2 h-2 rounded-full bg-pink-400/40 animate-ping" />
          <div className="absolute top-12 right-8 w-1.5 h-1.5 rounded-full bg-rose-300/60 animate-pulse" />
          <div className="absolute bottom-12 left-10 w-2.5 h-2.5 rounded-full bg-pink-300/30 animate-pulse" />
        </div>

        {/* Floating Animated Musical Notes for Digital Art Singing & Music Animation */}
        {(isSinging || (digitalArtFx && status === 'speaking')) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-25">
            {[
              { note: '🎵', left: '12%', delay: '0s', dur: '3.2s' },
              { note: '🌸', left: '26%', delay: '1.2s', dur: '4.1s' },
              { note: '🎶', left: '44%', delay: '0.5s', dur: '3.5s' },
              { note: '✨', left: '62%', delay: '1.8s', dur: '3.8s' },
              { note: '💖', left: '78%', delay: '0.3s', dur: '4.3s' },
              { note: '🎼', left: '88%', delay: '2.0s', dur: '3.4s' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="absolute bottom-6 text-base sm:text-lg animate-bounce drop-shadow-[0_0_12px_rgba(244,114,182,0.8)] opacity-90 transition-all pointer-events-none"
                style={{
                  left: item.left,
                  animationDuration: item.dur,
                  animationDelay: item.delay,
                }}
              >
                {item.note}
              </div>
            ))}
          </div>
        )}

        {/* Real-time Singing Karaoke Overlay Card */}
        {isSinging && (
          <div className="absolute top-2 inset-x-2.5 z-35 p-2 rounded-2xl bg-slate-950/92 border border-fuchsia-500/50 backdrop-blur-xl shadow-2xl flex flex-col gap-1 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-fuchsia-300 text-xs font-bold truncate">
                <Music2 className="w-3.5 h-3.5 text-fuchsia-400 animate-spin flex-shrink-0" />
                <span className="truncate">🎵 {activeSongTitle || 'Kesariya'}</span>
                {activeSongArtist && (
                  <span className="text-[10px] text-fuchsia-400/80 font-normal hidden sm:inline">
                    • {activeSongArtist}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {onNextSong && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNextSong();
                    }}
                    className="px-2 py-0.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-[10px] font-semibold text-pink-200 border border-pink-500/40 flex items-center gap-1 active:scale-95 transition-all"
                    title="Agla Gaana (Next Song)"
                  >
                    <SkipForward className="w-2.5 h-2.5" />
                    <span>Next</span>
                  </button>
                )}
                {onStopSong && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStopSong();
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-[10px] font-semibold text-rose-200 border border-rose-500/40 flex items-center gap-1 active:scale-95 transition-all"
                    title="Stop Song"
                  >
                    <Square className="w-2.5 h-2.5" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>
            {currentLyricLine && (
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide text-center py-1 px-2 rounded-xl bg-gradient-to-r from-pink-500/20 via-fuchsia-500/25 to-pink-500/20 border border-pink-500/30 shadow-inner animate-pulse">
                🎤 "{currentLyricLine}"
              </p>
            )}
          </div>
        )}

        {/* 1. 3D Digital Illustration View (Default) */}
        <div
          className={`w-full h-full relative z-10 flex flex-col items-center justify-center p-4 transition-all duration-500 ${
            viewMode === 'illustration' ? 'opacity-100 scale-100' : 'hidden opacity-0 scale-95'
          }`}
        >
          {/* Concentric Audio Halo Rings */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Outer expanding sonar ping wave when actively listening */}
              {(status === 'listening' || isListening) && (
                <>
                  <div className="absolute -inset-10 sm:-inset-12 rounded-full border-2 border-emerald-400/40 animate-ping duration-1000 pointer-events-none" />
                  <div className="absolute -inset-7 sm:-inset-8 rounded-full border border-emerald-300/30 animate-pulse pointer-events-none shadow-[0_0_35px_rgba(16,185,129,0.5)]" />
                </>
              )}

              {/* Outer rotating decorative ring */}
              <div
                className={`absolute -inset-6 rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
                  status === 'speaking'
                    ? 'border-rose-400/60 animate-spin duration-[15s]'
                    : status === 'listening' || isListening
                    ? 'border-emerald-300/80 animate-spin duration-[8s]'
                    : 'border-pink-500/25 animate-spin duration-[30s]'
                }`}
              />

              {/* Subtle Audio-Synced Glowing Animation when actively speaking */}
              {status === 'speaking' && (
                <>
                  {/* Outer atmospheric aura bloom modulated by speech volume */}
                  <div
                    className="absolute -inset-8 sm:-inset-10 rounded-full pointer-events-none transition-all duration-75 ease-out"
                    style={{
                      transform: `scale(${1 + (liveAudioLevel / 100) * 0.16})`,
                      background: `radial-gradient(circle, rgba(6, 182, 212, ${0.35 + (liveAudioLevel / 100) * 0.45}) 0%, rgba(244, 114, 182, ${0.2 + (liveAudioLevel / 100) * 0.3}) 45%, transparent 72%)`,
                      filter: `blur(${18 + (liveAudioLevel / 100) * 16}px)`,
                      opacity: 0.65 + (liveAudioLevel / 100) * 0.35,
                    }}
                  />
                  {/* Concentric acoustic energy halo ring */}
                  <div
                    className="absolute -inset-4 sm:-inset-5 rounded-full pointer-events-none transition-all duration-75 ease-out border border-cyan-400/80"
                    style={{
                      transform: `scale(${1 + (liveAudioLevel / 100) * 0.08})`,
                      boxShadow: `0 0 ${20 + (liveAudioLevel / 100) * 45}px rgba(6, 182, 212, ${0.65 + (liveAudioLevel / 100) * 0.35}), inset 0 0 ${12 + (liveAudioLevel / 100) * 20}px rgba(244, 114, 182, 0.4)`,
                      opacity: 0.7 + (liveAudioLevel / 100) * 0.3,
                    }}
                  />
                </>
              )}

              {/* Middle pulsing reactive wave */}
              <div
                className={`absolute -inset-3 rounded-full border-2 transition-all duration-500 pointer-events-none ${
                  status === 'speaking'
                    ? 'border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                    : status === 'listening' || isListening
                    ? 'border-emerald-400/90 scale-105 shadow-[0_0_35px_rgba(16,185,129,0.7)] animate-pulse'
                    : status === 'processing'
                    ? 'border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.5)]'
                    : 'border-pink-400/30 shadow-[0_0_15px_rgba(244,114,182,0.2)]'
                }`}
                style={
                  status === 'speaking'
                    ? {
                        transform: `scale(${1 + (liveAudioLevel / 100) * 0.06})`,
                        transition: 'transform 80ms ease-out',
                      }
                    : undefined
                }
              />

              {/* 22-Year-Old Cute & Bold Indian Girl Avatar Circle */}
              <div
                onClick={onToggleListen}
                style={
                  status === 'speaking'
                    ? {
                        transform: `scale(${1 + (liveAudioLevel / 100) * 0.045})`,
                        boxShadow: `0 0 ${35 + (liveAudioLevel / 100) * 45}px rgba(6, 182, 212, ${0.75 + (liveAudioLevel / 100) * 0.25}), 0 0 ${15 + (liveAudioLevel / 100) * 25}px rgba(244, 114, 182, 0.5)`,
                        borderColor: `rgba(6, 182, 212, ${0.85 + (liveAudioLevel / 100) * 0.15})`,
                        transition: 'transform 80ms ease-out, box-shadow 80ms ease-out, border-color 80ms ease-out',
                      }
                    : undefined
                }
                className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 cursor-pointer active:scale-95 transition-all group ${
                  status === 'speaking'
                    ? 'border-cyan-400 ring-4 ring-cyan-500/40'
                    : status === 'listening' || isListening
                    ? 'border-emerald-400 shadow-[0_0_45px_rgba(16,185,129,0.7)] ring-4 ring-emerald-500/30'
                    : 'border-cyan-400/60 shadow-[0_0_35px_rgba(6,182,212,0.35)] hover:border-cyan-300'
                }`}
                title="Click karein aur bolkar baat karein (Tap to talk with Jarvis AI)"
              >
                <img
                  src={userGirlAvatarImg}
                  alt="Jarvis AI Girl Assistant"
                  style={
                    status === 'speaking'
                      ? {
                          filter: `brightness(${1.05 + (liveAudioLevel / 100) * 0.18}) contrast(${1.02 + (liveAudioLevel / 100) * 0.08})`,
                          transition: 'filter 80ms ease-out',
                        }
                      : undefined
                  }
                  className={`w-full h-full object-cover object-center transition-all duration-300 ${
                    status === 'speaking'
                      ? 'scale-105 drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]'
                      : 'group-hover:scale-105'
                  }`}
                  referrerPolicy="no-referrer"
                />

                {/* Cyberpunk Holographic Lighting Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/15 via-transparent to-pink-500/15 pointer-events-none" />

                {/* Center status tag on hover/speaking */}
                {status === 'speaking' && (
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-cyan-950/95 border border-cyan-400 text-[10px] font-bold text-cyan-200 backdrop-blur-md shadow-lg animate-pulse flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />
                    <span>🔊 Live Bol Rahi Hu...</span>
                  </div>
                )}
                {(status === 'listening' || isListening) && (
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-emerald-950/95 border border-emerald-400 text-[10px] font-bold text-emerald-200 backdrop-blur-md shadow-lg animate-pulse flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-300 animate-ping" />
                    <span>🎙️ Sun Rahi Hu... Bolo Sir!</span>
                  </div>
                )}
                {status === 'idle' && !isListening && (
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-400/80 text-[10px] font-bold text-cyan-200 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>🎙️ Bol Kar Baat Karein</span>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Dynamic Waveform Equalizer when Listening */}
            {(status === 'listening' || isListening) && (
              <div className="mt-3 flex items-center gap-2 bg-slate-950/85 border border-emerald-500/50 px-3 py-1 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="text-[11px] font-bold text-emerald-300">Listening...</span>
                <div className="flex items-center gap-1 h-5">
                  {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7].map((factor, idx) => (
                    <span
                      key={idx}
                      className="w-1 bg-emerald-400 rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(4, Math.min(18, 4 + (liveAudioLevel / 100) * factor * 18))}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. 3D WebGL Canvas Container (Toggled via viewMode) */}
        <div
          ref={containerRef}
          className={`w-full h-full cursor-grab active:cursor-grabbing relative z-10 flex items-center justify-center transition-all duration-500 ${
            viewMode === 'mesh3d' ? 'opacity-100 scale-100' : 'hidden opacity-0 scale-95'
          }`}
          title="Drag to rotate 3D AI Girl Avatar"
        />

        {/* 3D Orbit Drag Hint (Only in 3D Mesh Mode) */}
        {viewMode === 'mesh3d' && (
          <div className="absolute top-2 right-3 z-30 pointer-events-none text-[10px] text-slate-400 font-mono bg-slate-950/70 border border-slate-800 px-2 py-1 rounded-lg backdrop-blur-sm">
            3D Rotate: Drag
          </div>
        )}

        {/* Live Audio Waveform HUD at bottom of Avatar */}
        <div className="absolute bottom-2.5 z-30 flex items-center gap-1 bg-slate-950/85 px-3.5 py-1.5 rounded-full border border-pink-500/30 backdrop-blur-md shadow-lg pointer-events-none">
          {[0.35, 0.75, 1.0, 0.55, 0.9, 0.45, 0.85, 0.65, 0.4].map((scale, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                status === 'speaking'
                  ? 'bg-rose-400 animate-pulse'
                  : status === 'listening'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-pink-400/60'
              }`}
              style={{
                height:
                  status === 'listening' || status === 'speaking'
                    ? `${Math.max(6, scale * 22)}px`
                    : '6px',
              }}
            />
          ))}
          <span className="text-[10px] font-mono ml-1.5 uppercase font-bold text-pink-300">
            {status === 'speaking' ? 'Lip-Sync' : status === 'listening' ? '🟢 Voice Connected' : 'Online'}
          </span>
        </div>
      </div>

      {/* Dynamic Real-Time Acoustic Waveform Visualizer Bar Chart below the Avatar Face */}
      <div className="w-full max-w-md mt-2 px-1 z-20">
        <div className="px-3 py-2 rounded-2xl bg-slate-950/85 border border-pink-500/35 backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.15)] flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[10px] font-mono mb-1 text-pink-400">
            <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
              <Activity className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : status === 'speaking' ? 'text-pink-400 animate-pulse' : 'text-pink-400'}`} />
              <span>Acoustic Frequency Spectrum</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                BARS
              </span>
              <span className={`text-[10px] font-mono font-bold ${isListening ? 'text-emerald-400' : status === 'speaking' ? 'text-pink-400' : 'text-slate-400'}`}>
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
            accentTheme="pink-rose"
            showControls={false}
            showMetrics={false}
            className="w-full"
          />
        </div>
      </div>

      {/* Main Status & Hands-Free Interaction Banner */}
      <div
        onClick={onToggleListen}
        className={`w-full max-w-md mt-2 p-3 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${badge.color}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-center flex-shrink-0">
            {badge.icon}
          </div>
          <div className="text-left">
            <h4 className="text-xs sm:text-sm font-bold tracking-wide">{badge.title}</h4>
            <p className="text-[11px] opacity-85 leading-snug">{badge.subtitle}</p>
          </div>
        </div>

        {/* Quick Mic Action Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleListen();
          }}
          className={`p-2.5 rounded-xl border transition-all active:scale-90 ${
            isListening
              ? 'bg-emerald-500/25 border-emerald-400/80 text-emerald-200 shadow-md animate-pulse'
              : 'bg-pink-500/20 border-pink-400/50 text-pink-200 hover:bg-pink-500/30'
          }`}
          title={isListening ? 'Stop Listening' : 'Start Listening'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>

      {/* Live Speech Recognition & Assistant Spoken Reply HUD */}
      <div className="w-full max-w-md mt-2 p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-xl shadow-xl flex flex-col gap-2">
        {/* Active Speech Transcription Card */}
        {(isListening || localTranscript || status === 'listening') && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 shadow-inner">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider block">
                🎙️ Aapki Aawaz (Live Speech)
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                {localTranscript ? `"${localTranscript}"` : 'Sun rahi hu... Jaise: "YouTube open karo", "Facebook"...'}
              </p>
            </div>
            {localTranscript && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([40]);
                  playBeepSound();
                  onExecuteCommand?.(localTranscript);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex-shrink-0 shadow cursor-pointer"
              >
                Chalao ▶️
              </button>
            )}
          </div>
        )}

        {/* Jarvis Spoken Response Bubble */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 flex-shrink-0 mt-0.5">
            {status === 'speaking' ? (
              <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : status === 'processing' ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/30" />
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                <span>👩 Jarvis AI Girl Reply</span>
                {status === 'speaking' && <span className="text-pink-400 animate-pulse">• Live Bol Rahi Hai 🔊</span>}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([30]);
                  const textToSpeak = lastSpokenText || 'Namaste Rovin Sir! Main aapki AI assistant hu, mujhse jo bhi bolenge main bol-bol kar baat karungi!';
                  speakJarvis(textToSpeak, { force: true });
                }}
                className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-[10px] font-bold text-cyan-200 flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Aanya ki aawaz suno"
              >
                <Volume2 className="w-3 h-3 text-cyan-300" />
                <span>🔊 Aawaz Suno</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-100 font-medium leading-snug break-words">
              "{lastSpokenText || 'Namaste Rovin Sir! Main Aanya hu — 22 saal ki cute aur bold Indian AI girl! Mujhse jo bhi bolenge main live sun rahi hu aur turant reply karungi!'}"
            </p>
          </div>
        </div>
      </div>

      {/* 1-Tap Instant Voice Command Action Chips */}
      <div className="w-full max-w-md mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: '✨ Google Gemini Q&A', cmd: 'Google Gemini ki tarah har question ka answer jalde do' },
          { label: '⏰ Live Time (IST)', cmd: 'Running real time aur time zone batao' },
          { label: '📍 Real Location', cmd: 'Running me real time aur real location bata' },
          { label: '🧠 Science GK', cmd: 'Space me black hole kya hota hai batao' },
          { label: '💬 Live Baat Karo', cmd: 'Aanya mujhse live baat karo' },
          { label: '🔥 Bold Gup-Shup', cmd: 'Aanya kuch bold aur interesting batao' },
          { label: '▶️ YouTube', cmd: 'YouTube open karo' },
          { label: '🌐 Facebook', cmd: 'Facebook open karo' },
          { label: '💬 WhatsApp', cmd: 'WhatsApp open karo' },
          { label: '🎵 Romantic Gana', cmd: 'Koi pyara romantic gana gao' },
          { label: '📸 Camera', cmd: 'Camera kholo' },
          { label: '🔦 Torch', cmd: 'Torch on karo' },
          { label: '📞 Dad Call', cmd: 'Dad ko call lagao' },
          { label: '☀️ Mausam', cmd: 'Aaj ka mausam kaisa hai' },
        ].map((item) => (
          <button
            key={item.cmd}
            type="button"
            onClick={() => {
              triggerHaptic([40]);
              playBeepSound();
              if (onExecuteCommand) {
                onExecuteCommand(item.cmd);
              } else {
                window.dispatchEvent(
                  new CustomEvent('jarvis:simulate-command', { detail: { phrase: item.cmd } })
                );
              }
            }}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 text-xs font-semibold active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Fast Type-To-Command Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!typedCommand.trim()) return;
          triggerHaptic([40]);
          playBeepSound();
          if (onExecuteCommand) {
            onExecuteCommand(typedCommand.trim());
          }
          setTypedCommand('');
        }}
        className="w-full max-w-md mt-2 flex items-center gap-1.5"
      >
        <input
          type="text"
          value={typedCommand}
          onChange={(e) => setTypedCommand(e.target.value)}
          placeholder='Aawaz na chale to yahan likhein: "YouTube", "Facebook", "Gana"...'
          className="flex-1 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700/80 focus:border-cyan-400 text-white text-xs placeholder:text-slate-500 focus:outline-none shadow-inner"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold active:scale-95 transition-all shadow cursor-pointer flex items-center gap-1 flex-shrink-0"
        >
          <span>Run ▶️</span>
        </button>
      </form>

      {/* Mic Permission Denied / Error State Prompt */}
      {micIssue?.status === 'denied' && (
        <div className="w-full max-w-md mt-2 p-3 rounded-2xl bg-amber-950/90 border border-amber-500/70 text-amber-200 text-xs flex items-start gap-2.5 animate-fade-in shadow-xl">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="font-semibold text-white leading-tight">Microphone permission allow nahi hai</p>
            <p className="text-[11px] text-amber-200/90 mt-0.5 leading-snug">
              Browser URL me 🔒 lock icon se 'Microphone' allow karein, ya direct naye tab me open karein jahan mic 100% chalega.
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Naye Tab Mein Kholein</span>
              </a>
              <button
                type="button"
                onClick={onToggleListen}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Mic</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMicIssue(null)}
            className="text-amber-400 hover:text-white p-1 cursor-pointer"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Silent Input / Silence Detected Prompt */}
      {micIssue?.status === 'silent' && (
        <div className="w-full max-w-md mt-2 p-3 rounded-2xl bg-cyan-950/90 border border-cyan-500/70 text-cyan-200 text-xs flex items-start gap-2.5 animate-fade-in shadow-xl">
          <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 text-left">
            <p className="font-semibold text-white leading-tight">Koi aawaz nahi suni gayi (Silence detected)</p>
            <p className="text-[11px] text-cyan-200/90 mt-0.5 leading-snug">
              Aap boliye: "YouTube open karo", "Camera kholo", "WhatsApp chalao", ya "Gana gao"...
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onToggleListen}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Dobara Boliye (Touch to Speak)</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMicIssue(null)}
            className="text-cyan-400 hover:text-white p-1 cursor-pointer"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Action Interactive Buttons Bar for Digital Art, Singing & Voice */}
      <div className="w-full max-w-md mt-2 flex items-center justify-between gap-1.5 px-0.5">
        <button
          type="button"
          onClick={() => (isSinging ? onStopSong?.() : onSingSong?.())}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all active:scale-95 shadow-md ${
            isSinging
              ? 'bg-fuchsia-600/30 border-fuchsia-400 text-fuchsia-100 shadow-[0_0_15px_rgba(217,70,239,0.5)] animate-pulse'
              : 'bg-gradient-to-r from-pink-500/25 to-fuchsia-500/25 border-pink-500/40 text-pink-200 hover:bg-pink-500/35'
          }`}
          title="Jarvis se gana suniye ('gana ga', 'gana gao', 'sing a song')"
        >
          <Music className={`w-3.5 h-3.5 ${isSinging ? 'animate-bounce text-fuchsia-300' : 'text-pink-400'}`} />
          <span>{isSinging ? '⏹️ Gana Roko' : '🎵 Gana Ga'}</span>
        </button>

        <button
          type="button"
          onClick={() => setDigitalArtFx(!digitalArtFx)}
          className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all active:scale-95 ${
            digitalArtFx
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
          title="Toggle Digital Art Visual FX (Floating notes, light aura)"
        >
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Art FX</span>
        </button>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('jarvis:open-voice-cheat-sheet'));
          }}
          className="py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 transition-all active:scale-95"
          title="Open Voice Command Cheat Sheet Overlay"
        >
          <ListOrdered className="w-3.5 h-3.5 text-rose-400" />
          <span>Cheat Sheet</span>
        </button>

        <button
          type="button"
          onClick={onToggleListen}
          className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
            isListening
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-md animate-pulse'
              : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
          title="Jarvis se voice me baat karein ('bat kar')"
        >
          <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{isListening ? 'Sun Rahi' : '💬 Baat Kar'}</span>
        </button>
      </div>
    </div>
  );
};

