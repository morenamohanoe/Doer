import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSwipeable } from 'react-swipeable';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { PortfolioImage } from '../types';

interface PortfolioLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: PortfolioImage[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  projectTitle: string;
  projectDescription?: string;
}

export default function PortfolioLightbox({
  isOpen,
  onClose,
  images,
  currentIndex,
  setCurrentIndex,
  projectTitle,
  projectDescription
}: PortfolioLightboxProps) {
  
  // Keyboard Navigation Support
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  
  // Resolve image type (before, during, after, general) based on caption, ID or tags
  const getImageType = (img: PortfolioImage): 'before' | 'during' | 'after' | 'general' => {
    const caption = (img.caption || '').toLowerCase();
    const id = (img.id || '').toLowerCase();
    if (caption.includes('before') || id.includes('before')) return 'before';
    if (caption.includes('during') || id.includes('during') || id.includes('progress')) return 'during';
    if (caption.includes('after') || id.includes('after')) return 'after';
    return 'general';
  };

  const imageType = getImageType(currentImage);

  const handleNext = () => {
    setCurrentIndex((currentIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };

  // Touch Swipe Handlers (react-swipeable)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    trackMouse: true,
    preventScrollOnSwipe: true
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-zinc-950/98 z-55 flex flex-col justify-between overflow-hidden touch-none"
        id="portfolio-lightbox-overlay"
      >
        {/* LIGHTBOX HEADER */}
        <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-50">
          <div className="flex flex-col items-start gap-1">
            <span className="text-xs font-black uppercase text-brand tracking-widest leading-none">
              Work Proof Gallery
            </span>
            <h4 className="text-sm font-black truncate max-w-[200px] leading-tight">
              {projectTitle}
            </h4>
          </div>

          {/* Active Image Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold bg-zinc-800/80 border border-zinc-750 px-2.5 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </span>
            
            {/* Image Type Badge (Before -> Orange, During -> Blue, After -> Green, General -> Slate) */}
            {imageType === 'before' && (
              <span className="text-[9px] font-black uppercase bg-orange-600 text-white px-2.5 py-1 rounded-full tracking-wider border border-orange-500 shadow-sm animate-pulse">
                Before
              </span>
            )}
            {imageType === 'during' && (
              <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-2.5 py-1 rounded-full tracking-wider border border-blue-500 shadow-sm">
                During
              </span>
            )}
            {imageType === 'after' && (
              <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2.5 py-1 rounded-full tracking-wider border border-emerald-500 shadow-sm">
                After
              </span>
            )}
            {imageType === 'general' && (
              <span className="text-[9px] font-black uppercase bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full tracking-wider border border-zinc-600 shadow-sm">
                Proof
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full border border-zinc-750 transition-colors cursor-pointer"
            title="Close Gallery (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN VISUAL CANVAS */}
        <div className="flex-1 w-full flex items-center justify-center relative select-none" {...swipeHandlers}>
          {/* Nav arrows on desktop */}
          <button
            onClick={handlePrev}
            className="hidden sm:flex absolute left-6 p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 text-white rounded-full transition-all z-30 cursor-pointer active:scale-90"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Interactive Zoom Canvas */}
          <div className="w-full h-full flex items-center justify-center p-2 relative">
            <TransformWrapper
              initialScale={1}
              initialPositionX={0}
              initialPositionY={0}
              minScale={0.8}
              maxScale={4}
              doubleTap={{ step: 0.5 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full !flex !items-center !center !justify-center">
                    <motion.img
                      key={currentImage.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      src={currentImage.imageUrl} // Original image_url loaded only when lightbox is active!
                      alt={currentImage.caption || projectTitle}
                      className="max-h-[70vh] max-w-full object-contain pointer-events-auto rounded-xl shadow-2xl border border-zinc-900"
                    />
                  </TransformComponent>

                  {/* Manual Zoom Overlay controls for convenience */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/85 border border-zinc-800/90 rounded-full px-4 py-1.5 flex items-center gap-4 text-zinc-400 z-40 backdrop-blur-md">
                    <button onClick={() => zoomOut()} className="hover:text-white p-1" title="Zoom Out">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button onClick={() => zoomIn()} className="hover:text-white p-1" title="Zoom In">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button onClick={() => resetTransform()} className="hover:text-white p-1" title="Reset Zoom">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </TransformWrapper>
          </div>

          <button
            onClick={handleNext}
            className="hidden sm:flex absolute right-6 p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 text-white rounded-full transition-all z-30 cursor-pointer active:scale-90"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* LIGHTBOX FOOTER / DESCRIPTION */}
        <div className="p-5 bg-gradient-to-t from-black/90 via-black/75 to-transparent text-white border-t border-zinc-900/50 flex flex-col gap-1 z-40">
          <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">
            {currentImage.caption ? 'Asset Caption' : 'Project Summary'}
          </p>
          <p className="text-xs font-black text-white/95 leading-relaxed">
            {currentImage.caption || projectDescription || 'No description provided.'}
          </p>
          
          <div className="flex gap-2 items-center text-[9px] text-zinc-500 font-extrabold mt-1">
            <span>Verify status: Verified work by DOER</span>
            <span>•</span>
            <span className="text-brand">Mobile pinch & drag supported</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
