import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  type: 'profile' | 'cover';
  onCropComplete: (croppedBase64: string) => void;
}

// Helper to create HTML Image element and crop with Canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  type: 'profile' | 'cover'
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  // Optimize dimensions to avoid huge base64 strings
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  if (type === 'profile') {
    const maxDim = 250;
    if (pixelCrop.width > maxDim) {
      targetWidth = maxDim;
      targetHeight = maxDim;
    }
  } else {
    const maxWidth = 800;
    if (pixelCrop.width > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = Math.round(maxWidth / 4); // 4:1 aspect ratio
    }
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas.toDataURL('image/jpeg', 0.85); // 0.85 quality is great and keeps file size tiny
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  type,
  onCropComplete
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsData: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    try {
      setIsProcessing(true);
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels, type);
      onCropComplete(croppedBase64);
      onClose();
    } catch (err) {
      console.error('Error during image crop process: ', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                <Move className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {type === 'profile' ? 'Crop Profile Photo' : 'Crop Cover Banner'}
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Interactive Workspace using react-easy-crop */}
          <div className="relative w-full h-80 bg-slate-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={type === 'profile' ? 1 : 4}
              cropShape={type === 'profile' ? 'round' : 'rect'}
              showGrid={true}
              onCropChange={onCropChange}
              onCropComplete={handleCropComplete}
              onZoomChange={onZoomChange}
            />
          </div>

          {/* Instructions and Controls */}
          <div className="p-4 space-y-4 bg-white">
            <div className="text-center text-[11px] text-slate-500 font-medium">
              Drag to position the image. Pinch or use the slider below to zoom in/out.
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(1, prev - 0.2))}
                className="p-1.5 hover:bg-slate-50 text-slate-500 rounded-lg border border-slate-200"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand focus:outline-none"
                />
                <span className="text-[10px] font-black text-slate-500 w-10 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                className="p-1.5 hover:bg-slate-50 text-slate-500 rounded-lg border border-slate-200"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl border border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 bg-brand hover:bg-brand-dark text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing...' : 'Apply & Save'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
