import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Img: string) => void;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize camera stream
  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing camera: ', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please enable camera permissions in your browser settings.'
          : 'Could not access camera. Please make sure no other app is using it.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Img = canvas.toDataURL('image/jpeg', 0.95);
      
      // Stop camera tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      
      // Return captured frame
      onCapture(base64Img);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Capture Photo
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Camera Stream viewport */}
          <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-8 h-8 animate-spin text-brand" />
                <span className="text-xs font-bold uppercase tracking-wider">Accessing camera...</span>
              </div>
            )}

            {error ? (
              <div className="p-6 text-center max-w-xs flex flex-col items-center justify-center text-slate-300 gap-3">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
              />
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-white flex flex-col gap-3">
            {!error && !isInitializing && (
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Flip Camera
                </button>

                <button
                  type="button"
                  onClick={handleCapture}
                  className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Capture Photo
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl border border-slate-200 transition-all text-center"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
