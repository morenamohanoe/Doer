import React from 'react';

interface GeometricDividerProps {
  className?: string;
  variant?: 'full' | 'subtle' | 'card' | 'accent';
}

export function GeometricDivider({ className = '', variant = 'full' }: GeometricDividerProps) {
  if (variant === 'card') {
    return (
      <div className={`flex items-center gap-2 w-full ${className}`} id="geom-div-card">
        <div className="h-[1px] bg-slate-100 flex-1" />
        <div className="flex gap-1 flex-shrink-0 items-center justify-center">
          <span className="w-1 h-3.5 bg-brand transform rotate-45 rounded-xs" />
          <span className="w-1 h-3.5 bg-brand/30 transform rotate-45 rounded-xs" />
        </div>
        <div className="h-[1px] bg-slate-100 flex-1" />
      </div>
    );
  }

  if (variant === 'accent') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} id="geom-div-accent">
        <span className="w-1.5 h-4 bg-brand transform rotate-45 rounded-xs" />
        <span className="w-1.5 h-4 bg-brand/30 transform rotate-45 rounded-xs" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 w-full my-4 ${className}`} id="geom-div-full">
      {/* Left fading line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200/80 to-slate-200 flex-1" />
      
      {/* 45-degree cuts */}
      <div className="flex items-center gap-1.5 flex-shrink-0 py-1">
        <span className="w-1 h-3.5 bg-brand/20 transform rotate-45 rounded-xs" />
        <span className="w-1 h-3.5 bg-brand transform rotate-45 rounded-xs" />
        <span className="w-1 h-3.5 bg-brand/20 transform rotate-45 rounded-xs" />
      </div>

      {/* Right fading line */}
      <div className="h-[1px] bg-gradient-to-l from-transparent via-slate-200/80 to-slate-200 flex-1" />
    </div>
  );
}
