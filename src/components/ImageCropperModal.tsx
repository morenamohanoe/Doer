import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { getCroppedImg } from '../lib/cropImage';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  aspectRatio: number;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string) => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  aspectRatio,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Crop Image</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative h-80 w-full bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-slate-400">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="w-full py-3 bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    <Check className="w-4 h-4" /> Save Cropped Image
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
