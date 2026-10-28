import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Sparkles, SwitchCamera, Check, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured?: (photoDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Stop camera tracks cleanly
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  };

  // Start camera stream
  const startCamera = async (mode: 'user' | 'environment') => {
    stopStream();
    setErrorMessage('');
    setCapturedImage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera hardware access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasPermission(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      // Fallback: try basic video without facing constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
        setHasPermission(true);
      } catch (fallbackErr: any) {
        setHasPermission(false);
        setErrorMessage(fallbackErr?.message || 'Camera permission denied or camera not found.');
      }
    }
  };

  const handleCloseModal = () => {
    triggerHaptic([30]);
    stopStream();
    setCapturedImage(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  // Flip between front and rear cameras
  const toggleFacingMode = () => {
    triggerHaptic([40]);
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
  };

  // Capture current photo frame from video stream
  const capturePhoto = () => {
    triggerHaptic([70, 40]);
    setIsCapturing(true);

    if (!videoRef.current) {
      setIsCapturing(false);
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          // Flip horizontally for front mirror preview
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        if (onPhotoCaptured) {
          onPhotoCaptured(dataUrl);
        }
      }
    } catch (e) {
      console.error('Photo capture error:', e);
    } finally {
      setIsCapturing(false);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    triggerHaptic([30]);
    setCapturedImage(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="jarvis-camera-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Jarvis Live Camera</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {facingMode === 'environment' ? 'BACK' : 'FRONT'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Phone camera view</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPermission && !capturedImage && (
              <button
                id="btn-switch-camera"
                onClick={toggleFacingMode}
                title="Switch Camera (Front / Back)"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-close-camera"
              onClick={handleCloseModal}
              title="Close Camera"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Viewport */}
        <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {hasPermission === false ? (
            <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-200">{errorMessage || 'Camera permission denied.'}</p>
              <p className="text-[11px] text-slate-400">
                Please allow camera access in your browser settings or use native camera app.
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Permission</span>
                </button>
                <a
                  href="intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Native App</span>
                </a>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Captured from camera"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5 shadow">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Captured</span>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Viewfinder Target Guidelines */}
              <div className="absolute inset-4 pointer-events-none border border-cyan-400/20 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Shutter Controls */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-around">
          {capturedImage ? (
            <>
              <button
                id="btn-retake-photo"
                onClick={retakePhoto}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                id="btn-save-photo"
                onClick={() => {
                  triggerHaptic([50]);
                  // Trigger download of image
                  const link = document.createElement('a');
                  link.download = `jarvis_photo_${Date.now()}.jpg`;
                  link.href = capturedImage;
                  link.click();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Save Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFacingMode}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                title="Switch Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                id="btn-shutter-capture"
                onClick={capturePhoto}
                disabled={!hasPermission || isCapturing}
                className="w-16 h-16 rounded-full border-4 border-white/80 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl bg-slate-900 disabled:opacity-40"
                title="Capture Photo"
              >
                <div className="w-full h-full rounded-full bg-cyan-400 hover:bg-cyan-300 transition-colors" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic([30]);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
