import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const {
    containerRef,
    pullDistance,
    isRefreshing,
    isSuccess,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    THRESHOLD
  } = usePullToRefresh(onRefresh);

  const radius = 8;
  const circumference = 2 * Math.PI * radius; // ~50.26
  const progress = Math.min(1, pullDistance / THRESHOLD);
  const strokeDashoffset = circumference - (progress * circumference);

  const showIndicator = pullDistance > 0 || isRefreshing || isSuccess;

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full overflow-y-auto relative scrollbar-none"
    >
      {/* Premium Floating Pull-To-Refresh Indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ 
              opacity: Math.min(1, pullDistance > 0 ? pullDistance / 15 : 1), 
              y: Math.min(pullDistance - 15, 45),
              scale: 1
            }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={pullDistance > 0 ? { type: 'just' } : { type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-white/95 backdrop-blur-md text-neutral-800 rounded-full px-4 py-2 shadow-xl border border-neutral-100 flex items-center justify-center gap-2.5">
              {isSuccess ? (
                <>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full"
                  >
                    <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                  </motion.div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                    Updated
                  </span>
                </>
              ) : isRefreshing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-5 h-5 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20">
                      <circle 
                        cx="10" 
                        cy="10" 
                        r={radius} 
                        className="stroke-neutral-100 fill-none" 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx="10" 
                        cy="10" 
                        r={radius} 
                        className="stroke-brand fill-none" 
                        strokeWidth="2.5" 
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * 0.3}
                        strokeLinecap="round"
                      />
                    </svg>
                  </motion.div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 animate-pulse">
                    Refreshing...
                  </span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 flex items-center justify-center relative">
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                      <circle 
                        cx="10" 
                        cy="10" 
                        r={radius} 
                        className="stroke-neutral-100/80 fill-none" 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx="10" 
                        cy="10" 
                        r={radius} 
                        className="stroke-brand fill-none" 
                        strokeWidth="2.5" 
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-150 ${pullDistance >= THRESHOLD ? 'text-brand' : 'text-neutral-400'}`}>
                    {pullDistance >= THRESHOLD ? 'Release to update' : 'Pull to update'}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with modern transition states */}
      <motion.div
        animate={{ 
          y: pullDistance * 0.4,
        }}
        transition={pullDistance > 0 ? { type: 'just' } : { type: 'spring', damping: 25, stiffness: 280 }}
        className={`w-full h-full transition-all duration-300 ${isRefreshing ? 'opacity-75 saturate-[0.85] blur-[0.3px] pointer-events-none' : ''}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
