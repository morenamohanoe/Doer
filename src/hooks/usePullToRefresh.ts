import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const { triggerSound } = useApp();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  
  const THRESHOLD = 65;
  const MAX_PULL = 110;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing || isSuccess) return;
    
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing || isSuccess) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    
    if (deltaY > 0) {
      const distance = Math.min(MAX_PULL, Math.pow(deltaY, 0.8));
      setPullDistance(distance);
      
      if (e.cancelable) {
        e.preventDefault();
      }
    } else {
      isPullingRef.current = false;
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || isRefreshing || isSuccess) return;
    isPullingRef.current = false;
    
    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      triggerSound('click');
      
      try {
        await onRefresh();
        setIsSuccess(true);
        triggerSound('success');
      } catch (error) {
        console.error("Refresh failed", error);
      } finally {
        setIsRefreshing(false);
        setTimeout(() => {
          setIsSuccess(false);
          setPullDistance(0);
        }, 1000);
      }
    } else {
      setPullDistance(0);
    }
  };

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isSuccess,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    THRESHOLD
  };
};
