import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface MediaPreviewProps {
  urls: string[];
  featuredUrl?: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
  onNavigate?: () => void;
}

const FALLBACK_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmNWY1ZjUiLz48cGF0aCBkPSJNMzAgNzAgTDUwIDQwIEw3MCA3MCBNNTAgNDAgTDUwIDgwIE00MCA1MCBMNjAgNTAiIHN0cm9rZT0iI2NjYyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';

export function MediaPreview({ 
  urls = [], 
  featuredUrl, 
  className = "w-full h-full", 
  objectFit = 'cover',
  onNavigate
}: MediaPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBroken, setIsBroken] = useState(false);

  const allUrls = React.useMemo(() => {
    let list = [...(urls || [])];
    if (featuredUrl) {
      list = list.filter(u => u !== featuredUrl);
      list.unshift(featuredUrl);
    }
    return list.length > 0 ? list : [];
  }, [urls, featuredUrl]);

  useEffect(() => {
    setIsBroken(false);
  }, [currentIndex, allUrls]);

  if (allUrls.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <img src={FALLBACK_SVG} alt="Placeholder" className="w-16 h-16 opacity-50" />
      </div>
    );
  }

  const currentUrl = allUrls[currentIndex] || '';
  
  const isVideo = currentUrl.match(/\.(mp4|webm|ogg)$/i) || currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be') || currentUrl.includes('vimeo.com');
  const isYouTube = currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be');
  
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) onNavigate();
    setCurrentIndex((prev) => (prev + 1) % allUrls.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) onNavigate();
    setCurrentIndex((prev) => (prev - 1 + allUrls.length) % allUrls.length);
  };

  return (
    <div className={`relative group overflow-hidden flex items-center justify-center bg-neutral-100 ${className}`}>
      {isVideo ? (
        isYouTube ? (
          <div className="w-full h-full relative bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(currentUrl)}?autoplay=0&controls=0&modestbranding=1`}
              className="w-full h-full absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
              <Play className="w-12 h-12 text-white opacity-70" />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded">VIDEO</div>
          </div>
        )
      ) : (
        isBroken ? (
           <div className="w-full h-full flex items-center justify-center bg-neutral-100">
             <img src={FALLBACK_SVG} alt="Placeholder" className="w-16 h-16 opacity-50" />
           </div>
        ) : (
           <img
             src={currentUrl}
             alt={`Media ${currentIndex + 1}`}
             className={`w-full h-full transition-transform duration-700 ease-out group-hover:scale-105 ${objectFit === 'contain' ? 'object-contain bg-slate-100' : 'object-cover'}`}
             referrerPolicy="no-referrer"
             onError={() => setIsBroken(true)}
           />
        )
      )}

      {/* Gallery controls */}
      {allUrls.length > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-start px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            <button
              onClick={handlePrev}
              className="w-7 h-7 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center text-neutral-850 hover:scale-110 active:scale-90 transition-all z-20 pointer-events-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-neutral-800">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-end px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            <button
              onClick={handleNext}
              className="w-7 h-7 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center text-neutral-850 hover:scale-110 active:scale-90 transition-all z-20 pointer-events-auto"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-neutral-800">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full z-20">
            {allUrls.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
