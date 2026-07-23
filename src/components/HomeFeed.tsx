/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { MediaPreview } from './MediaPreview';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Sparkles,
  Info,
  Calendar,
  X,
  Plus,
  Minus,
  Home,
  Users,
  ArrowLeft,
  SlidersHorizontal,
  Share2,
  AlertTriangle,
  Mic,
  MicOff
} from 'lucide-react';
import { Service } from '../types';
import PullToRefresh from './PullToRefresh';
import DoerProfileModal from './DoerProfileModal';
import QRCodeScannerModal from './QRCodeScannerModal';
import { QrCode } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import PostServiceModal from './PostServiceModal';
import { logError } from '../lib/logger';
import RecommendationEngine from './RecommendationEngine';

export const formatServicePrice = (srv: Service) => {
  const pType = srv.pricingType || (srv.priceUnit === 'night' ? 'day' : srv.priceUnit === 'hr' ? 'hour' : srv.priceUnit) || 'fixed';
  if (pType === 'negotiable') {
    return 'Price Negotiable';
  }
  let unit = '';
  if (pType === 'hour') unit = ' / hour';
  else if (pType === 'day') unit = ' / day';
  else if (pType === 'week') unit = ' / week';
  else if (pType === 'month') unit = ' / month';
  else if (pType === 'year') unit = ' / year';
  return `R ${srv.price.toLocaleString('en-ZA')}${unit}`;
};

export const getDurationUnitLabel = (srv: Service) => {
  const pType = srv.pricingType || (srv.priceUnit === 'night' ? 'day' : srv.priceUnit === 'hr' ? 'hour' : srv.priceUnit) || 'fixed';
  if (pType === 'hour') return { label: 'Hours', singular: 'Hour' };
  if (pType === 'day') return { label: 'Days', singular: 'Day' };
  if (pType === 'week') return { label: 'Weeks', singular: 'Week' };
  if (pType === 'month') return { label: 'Months', singular: 'Month' };
  if (pType === 'year') return { label: 'Years', singular: 'Year' };
  return { label: '', singular: '' };
};

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm p-4 space-y-3 animate-pulse text-left">
      <div className="w-full aspect-square bg-neutral-100 rounded-2xl" />
      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 rounded-full w-3/4" />
        <div className="h-3 bg-neutral-200 rounded-full w-1/2" />
        <div className="h-4 bg-neutral-200 rounded-full w-1/4" />
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-100 shadow-sm p-3 sm:p-5 flex flex-row sm:flex-col h-[120px] sm:h-auto gap-3 sm:gap-4 animate-pulse text-left">
      {/* Image Area */}
      <div className="w-32 h-full sm:w-full sm:aspect-[16/10] sm:h-auto bg-neutral-100 rounded-xl sm:rounded-2xl shrink-0" />
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-2.5 bg-neutral-200 rounded-full w-16" />
              <div className="h-4 bg-neutral-200 rounded-full w-3/4" />
            </div>
            <div className="h-5 bg-neutral-200 rounded-lg w-8 shrink-0" />
          </div>
          <div className="space-y-1 pt-1.5 hidden sm:block">
            <div className="h-3 bg-neutral-200 rounded-full w-full" />
            <div className="h-3 bg-neutral-200 rounded-full w-5/6" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 sm:mt-4 pt-2 sm:pt-3.5 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-neutral-200 shrink-0" />
            <div className="h-2.5 bg-neutral-200 rounded-full w-16 sm:w-24 truncate" />
          </div>
          <div className="h-3.5 bg-neutral-200 rounded-full w-12 sm:w-16 shrink-0" />
        </div>
      </div>
    </div>
  );
}

interface ServiceCardProps {
  key?: string | number;
  srv: Service;
  triggerSound: (sound: string) => void;
  toggleSaveItem: (type: 'service' | 'product' | 'doer', id: string) => void;
  isSavedItem: (type: 'service' | 'product' | 'doer', id: string) => boolean;
  onClick: () => void;
  onDoerClick?: () => void;
}

export function ServiceCard({ srv, triggerSound, toggleSaveItem, isSavedItem, onClick, onDoerClick }: ServiceCardProps) {
  const { serviceCategories, reviews, showToast, serviceRequests } = useApp();
  const catObj = serviceCategories.find(c => c.id === srv.category || c.name === srv.category);
  const displayCategoryName = catObj ? catObj.name : (srv.categoryName || srv.category);
  const doerReviews = reviews.filter((r) => {
    if (r.targetId !== srv.doerId) return false;
    // Check if there is a completed project (booking) for this review
    if (r.bookingId) {
      const b = serviceRequests.find((req) => req.id === r.bookingId);
      if (b && (b.status === 'released' || b.status === 'completed')) {
        return true;
      }
    }
    const reviewerId = r.authorId || r.reviewerId;
    if (reviewerId) {
      const hasCompletedBooking = serviceRequests.some(
        (req) => (req.bookingOwnerId === reviewerId && req.doerId === srv.doerId) && 
                 (req.status === 'released' || req.status === 'completed')
      );
      if (hasCompletedBooking) {
        return true;
      }
    }
    return false;
  });
  const computedRating = doerReviews.length > 0
    ? (doerReviews.reduce((acc, curr) => acc + curr.rating, 0) / doerReviews.length).toFixed(1)
    : "0.0";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-100 hover:shadow-md transition-all duration-300 cursor-pointer text-left relative geom-card flex flex-row sm:flex-col h-[125px] sm:h-auto gap-1"
    >
      {/* Aspect ratio layout for stunning property card */}
      <div className="w-32 h-full sm:w-full sm:aspect-[16/10] sm:h-auto bg-neutral-100 overflow-hidden relative flex items-center justify-center shrink-0">
        <MediaPreview 
          urls={srv.imageUrls} 
          featuredUrl={srv.featuredImageUrl} 
          onNavigate={() => triggerSound('click')}
        />

        {/* Featured Star Badge */}
        {srv.isFeatured && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-neutral-900/80 backdrop-blur-md px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1 z-10">
            <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-400 fill-amber-400" />
            <span className="text-[6px] sm:text-[8px] font-extrabold text-white uppercase tracking-wider">Premium</span>
          </div>
        )}

        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-2 z-10">
          {/* Report Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerSound('click');
              showToast('Content flagged and reported to administrators.', 'warning');
            }}
            className="p-1 sm:p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-md hover:bg-rose-50 transition-all text-rose-500 flex items-center justify-center border border-rose-100 cursor-pointer active:scale-90"
            title="Report inappropriate content"
          >
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          
          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerSound('click');
              const shareTitle = srv.title;
              const shareText = `Check out this service: ${srv.title}`;
              const shareUrl = window.location.href;
              
              if (navigator.share) {
                navigator.share({
                  title: shareTitle,
                  text: shareText,
                  url: shareUrl,
                }).catch((error) => {
                  console.log('Error sharing', error);
                  if (error.name !== 'AbortError') {
                    copyToClipboard(`${shareTitle} - ${shareText}\n${shareUrl}`)
                      .then((success) => {
                        if (success) {
                          showToast('Link copied to clipboard!', 'success');
                        } else {
                          showToast('Sharing not supported on this device.', 'error');
                        }
                      });
                  }
                });
              } else {
                copyToClipboard(`${shareTitle} - ${shareText}\n${shareUrl}`)
                  .then((success) => {
                    if (success) {
                      showToast('Link copied to clipboard!', 'success');
                    } else {
                      showToast('Sharing not supported on this device.', 'error');
                    }
                  });
              }
            }}
            className="p-1 sm:p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all text-neutral-600 flex items-center justify-center border border-neutral-100 cursor-pointer active:scale-90"
            title="Share"
          >
            <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Bookmark/Save button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerSound('click');
              toggleSaveItem('service', srv.id);
            }}
            className="p-1 sm:p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all text-neutral-600 flex items-center justify-center border border-neutral-100 cursor-pointer active:scale-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isSavedItem('service', srv.id) ? '#EF4444' : 'none'}
              stroke={isSavedItem('service', srv.id) ? '#EF4444' : '#525252'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card text details */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-1.5">
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-neutral-400 block truncate">
                {displayCategoryName} • {srv.location}
              </span>
              <h3 className="text-xs sm:text-base font-extrabold text-neutral-900 tracking-tight leading-tight line-clamp-1 mt-0.5">
                {srv.title}
              </h3>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 bg-neutral-50 border border-neutral-100 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shrink-0">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[10px] sm:text-xs font-black text-neutral-800">{computedRating}</span>
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium leading-relaxed mt-1 sm:mt-2 line-clamp-1 sm:line-clamp-2">
            {srv.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-1 sm:mt-4 pt-1.5 sm:pt-3.5 border-t border-neutral-100">
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <button 
              type="button"
              className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity bg-transparent p-1 sm:p-1.5 -ml-1 sm:-ml-1.5 rounded-full border border-neutral-200 min-w-0"
              onClick={(e) => {
                e.stopPropagation();
                triggerSound('click');
                if (onDoerClick) onDoerClick();
              }}
            >
              <img
                src={srv.doerAvatar}
                alt={srv.doerName}
                className="w-4 h-4 sm:w-6 sm:h-6 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(srv.doerName)}&background=random`;
                }}
              />
              <span className="text-[9px] sm:text-xs font-semibold text-neutral-600 truncate max-w-[80px] sm:max-w-none pr-1">Offered by {srv.doerName.split(' ')[0]}</span>
            </button>

            {/* Like Doer Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerSound('click');
                toggleSaveItem('doer', srv.doerId);
              }}
              className="p-1 sm:p-1.5 bg-rose-50/50 hover:bg-rose-50 text-rose-500 rounded-full border border-neutral-100 cursor-pointer active:scale-90 transition-all flex items-center justify-center shrink-0"
              title={isSavedItem('doer', srv.doerId) ? "Remove from Favorites" : "Like Doer"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isSavedItem('doer', srv.doerId) ? '#EF4444' : 'none'}
                stroke={isSavedItem('doer', srv.doerId) ? '#EF4444' : '#888888'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs sm:text-sm font-black text-neutral-900">
              {formatServicePrice(srv)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const copyToClipboard = (text: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(() => {
          resolve(fallbackCopyToClipboard(text));
        });
    } else {
      resolve(fallbackCopyToClipboard(text));
    }
  });
};

const fallbackCopyToClipboard = (text: string): boolean => {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed', err);
    return false;
  }
};

export default function HomeFeed() {
  const {
    services,
    createRequest,
    reviews,
    currentUser,
    profile,
    triggerSound,
    toggleSaveItem,
    isSavedItem,
    showToast,
    serviceCategories,
    serviceFee,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filterLocation,
    setFilterLocation,
    serviceRequests
  } = useApp();

  const activeCategories = serviceCategories.filter(cat => cat.status === 'approved');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const [focusedDoerId, setFocusedDoerId] = useState<string | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Try Chrome or Safari!', 'error');
      return;
    }

    try {
      triggerSound('click');
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-ZA';

      rec.onstart = () => {
        setIsListening(true);
        showToast('Listening... Say what you are looking for.', 'info');
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          showToast('Microphone permission denied. Please allow microphone access in your browser.', 'error');
        } else {
          showToast('Speech recognition failed. Try speaking louder.', 'error');
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const cleanTranscript = transcript.endsWith('.') ? transcript.slice(0, -1) : transcript;
          setSearchQuery(cleanTranscript);
          triggerSound('success');
          showToast(`Searching for "${cleanTranscript}"`, 'success');
        }
      };

      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      showToast('Could not start microphone.', 'error');
    }
  };

  const handleShare = (title: string, text: string) => {
    const shareUrl = window.location.href;
    const shareText = `${title} - ${text}`;
    if (navigator.share) {
      navigator.share({
        title,
        text,
        url: shareUrl,
      }).catch((err) => {
        logError(err);
        if (err.name !== 'AbortError') {
          copyToClipboard(`${shareText}\n${shareUrl}`)
            .then((success) => {
              if (success) {
                showToast('Link copied to clipboard!', 'success');
              } else {
                showToast('Failed to copy link.', 'error');
              }
            });
        }
      });
    } else {
      copyToClipboard(`${shareText}\n${shareUrl}`)
        .then((success) => {
          if (success) {
            showToast('Link copied to clipboard!', 'success');
          } else {
            showToast('Failed to copy link.', 'error');
          }
        });
    }
  };

  const downloadSocialCard = (srv: Service) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, '#1E293B'); // Slate 800
    grad.addColorStop(1, '#0F172A'); // Slate 900
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // Dynamic borders
    ctx.strokeStyle = '#22C55E'; // Emerald 500
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 590, 390);

    // Highlight Corner accents
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(5, 5, 50, 10);
    ctx.fillRect(5, 5, 10, 50);
    ctx.fillRect(545, 5, 50, 10);
    ctx.fillRect(585, 5, 10, 50);

    // App Logo
    ctx.fillStyle = '#22C55E';
    ctx.font = '900 24px Arial, sans-serif';
    ctx.fillText('DOER', 35, 50);

    // Subtitle
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('SOUTH AFRICA\'S VERIFIED ON-DEMAND SERVICES', 35, 75);

    // Draw Price Tag Badge
    ctx.fillStyle = '#10B981'; // Emerald 600
    ctx.beginPath();
    ctx.roundRect(400, 30, 165, 45, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    const rateUnit = srv.pricingType === 'negotiable' ? 'Negotiable' : `R ${srv.price}/${srv.pricingType || srv.priceUnit || 'hr'}`;
    ctx.fillText(rateUnit, 482, 58);
    ctx.textAlign = 'left'; // Reset

    // Draw Horizontal divider line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(35, 95);
    ctx.lineTo(565, 95);
    ctx.stroke();

    // Service Title (Wrappable)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial, sans-serif';
    const words = srv.title.split(' ');
    let line = '';
    let y = 140;
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 530 && n > 0) {
        ctx.fillText(line, 35, y);
        line = words[n] + ' ';
        y += 35;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 35, y);

    // Category and Location tag
    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 12px Arial, sans-serif';
    const catName = srv.categoryName || srv.category || 'Professional';
    ctx.fillText(`CATEGORY: ${catName.toUpperCase()}  •  📍 ${srv.location.toUpperCase()}`, 35, y + 30);

    // Provider Info box
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.beginPath();
    ctx.roundRect(35, 275, 530, 95, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(35, 275, 530, 95);

    // Provider name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`Hired Provider: ${srv.doerName}`, 55, 315);

    // Trust Score Badge
    ctx.fillStyle = '#F59E0B'; // Amber 500
    ctx.beginPath();
    ctx.roundRect(55, 332, 160, 24, 6);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(`🛡️ TRUST SCORE: ${srv.doerTrustScore}%`, 65, 348);

    // Platform Call-to-action
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'italic 11px Arial, sans-serif';
    ctx.fillText('Scan to view portfolio and book securely via Escrow', 240, 346);

    try {
      // Trigger download of PNG
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${srv.title.replace(/\s+/g, '_')}_social_card.png`;
      a.href = dataUrl;
      a.click();
      showToast('Social media card generated and downloaded!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Card exported as data stream.', 'info');
    }
  };
  
  // Selection details state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);

  // Deep Link Parser
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const srvId = params.get('serviceId');
    if (srvId && services.length > 0) {
      const found = services.find(s => s.id === srvId);
      if (found) {
        setSelectedService(found);
        triggerSound('success');
        showToast(`Loaded from share link: ${found.title}`, 'success');
      }
    }
  }, [services]);
  
  // Interactive multi-step booking state
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Dates & Nights, 2: Guests, 3: Confirmation
  const [bookingNights, setBookingNights] = useState(3);
  const [bookingGuests, setBookingGuests] = useState(2);
  const [checkInDate, setCheckInDate] = useState('2026-07-15');
  const [bookedSuccess, setBookedSuccess] = useState(false);

  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterPricingType, setFilterPricingType] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Geolocation Proximity Setup
  const SOUTH_AFRICA_COORDS: Record<string, { lat: number; lng: number }> = {
    johannesburg: { lat: -26.2041, lng: 28.0473 },
    gauteng: { lat: -26.2708, lng: 28.1123 },
    'cape town': { lat: -33.9249, lng: 18.4241 },
    'western cape': { lat: -33.9249, lng: 18.4241 },
    durban: { lat: -29.8587, lng: 31.0218 },
    'kwazulu-natal': { lat: -29.8587, lng: 31.0218 },
    pretoria: { lat: -25.7479, lng: 28.2293 },
    tshwane: { lat: -25.7479, lng: 28.2293 },
    'port elizabeth': { lat: -33.9608, lng: 25.6022 },
    gqeberha: { lat: -33.9608, lng: 25.6022 },
    bloemfontein: { lat: -29.0852, lng: 26.1596 },
    'free state': { lat: -29.0852, lng: 26.1596 },
    soweto: { lat: -26.2678, lng: 27.8585 },
    sandton: { lat: -26.1076, lng: 28.0567 },
    randburg: { lat: -26.0936, lng: 27.9830 },
    midrand: { lat: -25.9992, lng: 28.1262 },
    centurion: { lat: -25.8640, lng: 28.2120 },
    roodepoort: { lat: -26.1625, lng: 27.8725 },
  };

  const getCoordsForLoc = (locStr: string): { lat: number; lng: number } | null => {
    if (!locStr) return null;
    const clean = locStr.toLowerCase().trim();
    for (const [key, coords] of Object.entries(SOUTH_AFRICA_COORDS)) {
      if (clean.includes(key) || key.includes(clean)) {
        return coords;
      }
    }
    return null;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestDeviceLocation = (showToastNotification: boolean = false) => {
    if (!navigator.geolocation) {
      if (showToastNotification) {
        showToast('Geolocation is not supported by your browser.', 'error');
      }
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeviceCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          if (showToastNotification) {
            showToast('Location detected successfully!', 'success');
          }
        },
        (error) => {
          console.warn("HomeFeed Geolocation permission/retrieval failed:", error);
          if (showToastNotification) {
            if (error.code === error.PERMISSION_DENIED) {
              showToast('Location permission denied. Please allow location access in your browser.', 'error');
            } else {
              showToast('Failed to retrieve location details.', 'error');
            }
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      );
    } catch (err) {
      console.error("Error invoking getCurrentPosition:", err);
      if (showToastNotification) {
        showToast('Could not access location.', 'error');
      }
    }
  };

  // Filters (repurposed Services as Stays) with Location Proximity & Purchase History relevance scoring and profile exclusion
  const filteredServices = useMemo(() => {
    const myUserId = currentUser?.id || currentUser?.uid || profile?.userId || profile?.id;

    // 1. Filter services first
    const filtered = services.filter((srv) => {
      // Exclude user's own profile/listings from the feed
      if (myUserId && (srv.userId === myUserId || srv.doerId === myUserId)) {
        return false;
      }

      const matchesSearch = srv.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            srv.doerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            srv.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || selectedCategory === 'all' ? true : 
        (srv.category === selectedCategory || srv.categoryId === selectedCategory || srv.categoryName === selectedCategory);
      
      const catNameMatch = selectedCategory && selectedCategory !== 'all' 
        ? serviceCategories.find(c => c.id === selectedCategory)?.name === srv.category
        : false;
      
      const finalCategoryMatch = matchesCategory || catNameMatch;
      
      const currentPricingType = srv.pricingType || (srv.priceUnit === 'night' ? 'day' : srv.priceUnit === 'hr' ? 'hour' : srv.priceUnit) || 'fixed';
      const matchesPricingType = filterPricingType === 'all' ? true : currentPricingType === filterPricingType;

      const matchesMinPrice = minPrice === '' ? true : (srv.price >= Number(minPrice));
      const matchesMaxPrice = maxPrice === '' ? true : (srv.price <= Number(maxPrice));

      const matchesLocation = filterLocation.trim() === '' ? true : srv.location.toLowerCase().includes(filterLocation.toLowerCase());

      const dr = reviews.filter((r) => r.targetId === srv.doerId);
      const srvRating = dr.length > 0 ? dr.reduce((acc, curr) => acc + curr.rating, 0) / dr.length : 0.0;
      const matchesRating = srvRating >= minRating;

      return matchesSearch && finalCategoryMatch && matchesPricingType && matchesMinPrice && matchesMaxPrice && matchesLocation && matchesRating;
    });

    // 2. Pre-calculate user purchase category frequencies
    const boughtCategoryFrequencies: Record<string, number> = {};
    if (myUserId && serviceRequests) {
      serviceRequests.forEach(req => {
        if (req.bookingOwnerId === myUserId && (req.status === 'released' || req.status === 'completed')) {
          if (req.serviceId) {
            const srvObj = services.find(s => s.id === req.serviceId);
            if (srvObj) {
              const cat = (srvObj.category || srvObj.categoryId || srvObj.categoryName || '').toLowerCase().trim();
              if (cat) {
                boughtCategoryFrequencies[cat] = (boughtCategoryFrequencies[cat] || 0) + 1;
              }
            }
          }
        }
      });
    }

    // 3. User location coords from profile
    const userLocationStr = (profile?.location || profile?.city || currentUser?.location || '').toLowerCase().trim();
    const userProfileCoords = getCoordsForLoc(userLocationStr);

    // Reference coords is deviceCoords if available, else userProfileCoords, else defaults to Johannesburg
    const referenceCoords = deviceCoords || userProfileCoords || SOUTH_AFRICA_COORDS['johannesburg'];

    // 4. Calculate sorting metrics and sort the filtered list
    return filtered
      .map(srv => {
        // Compute distance proximity
        const srvCoords = getCoordsForLoc(srv.location) || SOUTH_AFRICA_COORDS['johannesburg'];
        const distanceKm = calculateDistance(referenceCoords.lat, referenceCoords.lng, srvCoords.lat, srvCoords.lng);
        const proximityScore = Math.max(0, 150 - distanceKm); // Score up to 150 points for local proximity

        // Compute purchase history relevance
        let relevanceScore = 0;
        const srvCat = (srv.category || srv.categoryId || srv.categoryName || '').toLowerCase().trim();
        if (srvCat && boughtCategoryFrequencies[srvCat]) {
          relevanceScore += boughtCategoryFrequencies[srvCat] * 100; // Add 100 points per prior completed purchase in this category to strongly prioritize
        }

        // Incorporate general rating & trust score subtly
        const srvRating = srv.rating || 4.0;
        const trustBonus = (srv.doerTrustScore || 50) * 0.2;

        const combinedRank = proximityScore + relevanceScore + (srvRating * 15) + trustBonus;

        return {
          srv,
          combinedRank
        };
      })
      .sort((a, b) => b.combinedRank - a.combinedRank)
      .map(item => item.srv);
  }, [
    services,
    serviceRequests,
    currentUser,
    profile,
    searchQuery,
    selectedCategory,
    serviceCategories,
    filterPricingType,
    minPrice,
    maxPrice,
    filterLocation,
    reviews,
    minRating,
    deviceCoords
  ]);

  const handleStartBooking = () => {
    triggerSound('click');
    setIsBooking(true);
    setBookingStep(1);
  };

  const handleNextStep = () => {
    triggerSound('click');
    setBookingStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    triggerSound('click');
    if (bookingStep === 1) {
      setIsBooking(false);
    } else {
      setBookingStep((prev) => prev - 1);
    }
  };

  const handleConfirmBooking = (service: Service) => {
    const nightPrice = service.price;
    const subtotal = nightPrice * bookingNights;
    const totalPrice = subtotal + serviceFee;

    triggerSound('success');
    // Save booking via the secure Escrow request engine using dynamic total price
    createRequest(service.id, 'service', totalPrice);
    setBookedSuccess(true);
    
    // Reset booking state
    setTimeout(() => {
      setBookedSuccess(false);
      setIsBooking(false);
      setSelectedService(null);
    }, 3500);
  };

  // Helper to compute checkout date based on checkin date and nights
  const getCheckOutDate = (startDateStr: string, nights: number) => {
    try {
      const parts = startDateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + nights);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch (e) {
      return '2026-07-18';
    }
  };

  const checkOutDate = getCheckOutDate(checkInDate, bookingNights);

  // Dynamic Category Rendering

  const selectedDoerReviews = selectedService ? reviews.filter((r) => r.targetId === selectedService.doerId) : [];
  const selectedComputedRating = selectedDoerReviews.length > 0
    ? (selectedDoerReviews.reduce((acc, curr) => acc + curr.rating, 0) / selectedDoerReviews.length).toFixed(1)
    : "0.0";
  const selectedReviewCount = selectedDoerReviews.length;

  return (
    <PullToRefresh onRefresh={async () => {
      // Manual refresh logic - since we use onSnapshot, we can just simulate a small delay
      // but in a real app this might trigger a forced re-fetch or clear cache
      await new Promise(resolve => setTimeout(resolve, 1200));
      triggerSound('success');
    }}>
      <div className="flex flex-col min-h-full bg-neutral-50 relative pb-20">
        
        {/* --- PREMIUM AIRBNB-INSPIRED MINIMALIST HEADER --- */}
        <div className="px-6 pt-8 pb-4 bg-white border-b border-neutral-100">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest">
                Explore South Africa
              </p>
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight mt-0.5">
                Welcome, {currentUser.firstName || 'David'}
              </h1>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[10px] font-bold text-neutral-600">{currentUser.locationName || 'Johannesburg'}</span>
              </div>
              <button 
                onClick={() => { triggerSound('click'); setIsQRScannerOpen(true); }}
                className="p-1.5 bg-neutral-50 border border-neutral-100 rounded-full hover:bg-neutral-100 text-neutral-600 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                title="Scan QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search stay bar */}
          <div className="relative mt-5 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Search services, doers, and categories..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-16 py-3.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white text-neutral-800 placeholder-neutral-400 text-xs font-semibold rounded-2xl border transition-all shadow-inner ${
                  isListening ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/10' : 'border-neutral-200 focus:border-neutral-900 focus:outline-none'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-neutral-400 hover:text-neutral-900 font-bold text-xs p-1"
                    title="Clear Search"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className={`p-1.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse scale-110 shadow-md shadow-rose-200'
                      : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                  title="Search with Voice"
                >
                  {isListening ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                triggerSound('click');
                setShowFilters(!showFilters);
              }}
              className={`px-5 py-3.5 rounded-2xl border flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-wider ${
                showFilters || minPrice || maxPrice || filterPricingType !== 'all' || filterLocation || minRating > 0
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-brand text-neutral-900 border-brand'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>


        {/* Advanced Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-b border-neutral-150 shadow-xs"
            >
              <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-neutral-800">Advanced Filters</span>
                <button
                  onClick={() => {
                    triggerSound('click');
                    setMinPrice('');
                    setMaxPrice('');
                    setFilterPricingType('all');
                    setFilterLocation('');
                    setMinRating(0);
                  }}
                  className="text-[10px] font-black text-slate-500 hover:text-neutral-900 hover:underline"
                >
                  Reset All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price Range */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Price Range (ZAR R)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-xs font-semibold text-neutral-800"
                    />
                    <span className="text-neutral-400 text-xs">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-xs font-semibold text-neutral-800"
                    />
                  </div>
                </div>

                {/* Pricing Type */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Pricing Type
                  </span>
                  <select
                    value={filterPricingType}
                    onChange={(e) => setFilterPricingType(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-xs font-semibold text-neutral-800"
                  >
                    <option value="all">All Pricing Types</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                    <option value="week">Per Week</option>
                    <option value="month">Per Month</option>
                    <option value="year">Per Year</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Location Search
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Sandton, Cape Town"
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-xs font-semibold text-neutral-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        triggerSound('click');
                        requestDeviceLocation(true);
                      }}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider flex items-center justify-center shrink-0 border border-neutral-250 cursor-pointer"
                      title="Detect My Location"
                    >
                      {deviceCoords ? '📍 OK' : '📍 Detect'}
                    </button>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Minimum Rating
                  </span>
                  <div className="flex gap-1.5">
                    {[0, 3, 4, 4.5, 4.8].map((ratingVal) => (
                      <button
                        key={ratingVal}
                        type="button"
                        onClick={() => {
                          triggerSound('click');
                          setMinRating(ratingVal);
                        }}
                        className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          minRating === ratingVal
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {ratingVal === 0 ? 'Any' : `${ratingVal}★`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Horizontal Category Scroller */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-shrink-0 w-28 h-9 bg-neutral-200/60 animate-pulse rounded-full border border-neutral-100" />
              ))
            ) : (
              <>
                <button
                  onClick={() => {
                    triggerSound('click');
                    setSelectedCategory('all');
                  }}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold transition-all duration-200 ${
                    !selectedCategory || selectedCategory === 'all'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Home className={`w-4 h-4 ${(!selectedCategory || selectedCategory === 'all') ? 'text-white' : 'text-neutral-500'}`} />
                  All
                </button>
                {activeCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        triggerSound('click');
                        setSelectedCategory(isSelected ? 'all' : cat.id);
                      }}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm scale-95'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <CategoryIcon name={cat.icon} className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-neutral-500'}`} />
                      {cat.name}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Prominent 'List a Service' Entry Point Banner */}
        <div className="px-6 py-2">
          <div className="bg-gradient-to-r from-amber-500/10 to-brand/10 border border-brand/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <span className="inline-block bg-brand text-neutral-900 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Service Provider / DOER
              </span>
              <h3 className="text-xs sm:text-sm font-black text-neutral-900 tracking-tight">
                Earn extra income in South Africa!
              </h3>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 font-semibold max-w-sm">
                Have a manual skill, tuition expertise, or general services to offer? Publish your service to the local marketplace.
              </p>
            </div>
            <button
              onClick={() => {
                triggerSound('click');
                setIsServiceModalOpen(true);
              }}
              className="bg-brand hover:bg-brand-hover text-neutral-900 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black shadow-md shadow-brand/10 hover:scale-[1.02] transition-all self-start sm:self-center cursor-pointer"
            >
              + List a Service
            </button>
          </div>
        </div>

        {/* Property Feed List */}
        <div className="px-6 py-4 space-y-7">
              <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-neutral-900 tracking-tight">
              {selectedCategory ? `${serviceCategories.find(c => c.id === selectedCategory)?.name || 'Filtered'} Services` : 'Featured Services'}
            </h2>
            <span className="text-[11px] font-semibold text-neutral-400">Verified DOERs</span>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <ServiceCardSkeleton key={`srv-${i}`} />
              ))}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <ProductCardSkeleton key={`prod-${i}`} />
                ))}
              </div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white py-12 px-6 rounded-3xl text-center border border-neutral-100 shadow-sm">
              <Info className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-neutral-700">No services matching filters</p>
              <p className="text-[11px] text-neutral-400 mt-1">Try resetting search or filters.</p>
              {selectedCategory && selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="mt-4 px-4 py-2 bg-neutral-900 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-all"
                >
                  Clear Categories
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredServices.map((srv) => (
                <ServiceCard
                  key={srv.id}
                  srv={srv}
                  triggerSound={triggerSound}
                  toggleSaveItem={toggleSaveItem}
                  isSavedItem={isSavedItem}
                  onClick={() => {
                    triggerSound('click');
                    setSelectedService(srv);
                    setIsBooking(false);
                    setBookingStep(1);
                  }}
                  onDoerClick={() => {
                    setFocusedDoerId(srv.doerId);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 🤖 PERSONALIZED RECOMMENDATION ENGINE */}
        <div className="px-6 py-2">
          <RecommendationEngine 
            onSelectDoer={(doerId) => setFocusedDoerId(doerId)}
            onSelectService={(service) => setSelectedService(service)}
          />
        </div>

        {/* --- DYNAMIC STAYS DETAILS & BOOKING CENTERED MODAL --- */}
        <AnimatePresence>
          {selectedService && (
            <div className="absolute inset-0 bg-neutral-950/70 z-50 flex items-center justify-center p-4 sm:p-6 text-left">
              <div className="absolute inset-0" onClick={() => {
                if (!bookedSuccess) {
                  setSelectedService(null);
                  setIsBooking(false);
                }
              }} />
              
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                className="bg-white rounded-3xl overflow-hidden max-h-[85vh] w-full max-w-lg flex flex-col shadow-2xl relative z-10"
              >
                {/* Image header banner with Gallery support */}
                <div className="h-56 w-full bg-neutral-100 relative">
                  <MediaPreview 
                    urls={selectedService.imageUrls} 
                    featuredUrl={selectedService.featuredImageUrl} 
                    onNavigate={() => triggerSound('click')}
                  />
                  <div className="absolute top-5 right-5 flex gap-2">
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setIsShareCardOpen(true);
                      }}
                      className="p-2.5 bg-neutral-900/50 backdrop-blur-md text-white rounded-full transition-all active:scale-95 cursor-pointer hover:bg-neutral-900/80"
                      title="Share Service & Generate Card"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        triggerSound('click');
                        toggleSaveItem('service', selectedService.id);
                      }}
                      className="p-2.5 bg-neutral-900/50 backdrop-blur-md text-white rounded-full transition-all active:scale-95 cursor-pointer hover:bg-neutral-900/80"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={isSavedItem('service', selectedService.id) ? '#EF4444' : 'none'}
                        stroke={isSavedItem('service', selectedService.id) ? '#EF4444' : 'currentColor'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setSelectedService(null);
                        setIsBooking(false);
                      }}
                      className="p-2.5 bg-neutral-900/50 backdrop-blur-md text-white rounded-full transition-all cursor-pointer hover:bg-neutral-900/80"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Content area: Switches between Details and Step-by-Step Booking views */}
                <div className="p-6 flex-1 overflow-y-auto">
                  
                  {!isBooking ? (
                    /* --- SUB-VIEW 1: DETAILS DISPLAY --- */
                    <div className="space-y-6">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2.5 py-0.5 bg-neutral-100 text-neutral-800 rounded-full uppercase tracking-wider">
                              {serviceCategories.find(c => c.id === selectedService.category || c.name === selectedService.category)?.name || selectedService.categoryName || selectedService.category}
                            </span>
                            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                              • {selectedService.location}
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-neutral-900 leading-tight tracking-tight">
                            {selectedService.title}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-amber-500 font-black text-sm">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {selectedComputedRating}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-bold block">
                            ({selectedReviewCount} verified reviews)
                          </span>
                        </div>
                      </div>

                      {/* Description and Bio */}
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Description</h4>
                        <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                          {selectedService.description}
                        </p>
                      </div>

                      {/* Media Showcase (Optional Video & Portfolio links) */}
                      {((selectedService.videoUrls && selectedService.videoUrls.length > 0) || 
                        (selectedService.portfolioLinks && selectedService.portfolioLinks.length > 0)) && (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                          <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Showcase & Portfolio</h4>
                          
                          {selectedService.videoUrls && selectedService.videoUrls.filter(Boolean).map((video, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-blue-600 font-bold hover:underline">
                              <span>🎥 Video Tour:</span>
                              <a href={video} target="_blank" rel="noopener noreferrer" className="line-clamp-1 break-all text-blue-600">
                                {video}
                              </a>
                            </div>
                          ))}

                          {selectedService.portfolioLinks && selectedService.portfolioLinks.filter(Boolean).map((link, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-emerald-600 font-bold hover:underline">
                              <span>🔗 Portfolio Link:</span>
                              <a href={link} target="_blank" rel="noopener noreferrer" className="line-clamp-1 break-all text-emerald-600">
                                {link}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Verified Host Section */}
                      <div className="p-4 border border-neutral-100 rounded-2xl space-y-3.5">
                        <div className="flex justify-between items-center">
                          <button 
                            type="button"
                            onClick={() => {
                              triggerSound('click');
                              setFocusedDoerId(selectedService.doerId);
                            }}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity bg-transparent text-left"
                          >
                            <img
                              src={selectedService.doerAvatar}
                              alt={selectedService.doerName}
                              className="w-10 h-10 rounded-full object-cover border border-neutral-100"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedService.doerName)}&background=random`;
                              }}
                            />
                            <div>
                              <span className="font-black text-neutral-900 text-sm block">
                                Hosted by {selectedService.doerName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                                  🛡️ Trust Score {selectedService.doerTrustScore}
                                </span>
                                <span className="text-[10px] font-semibold text-neutral-400">Verified Host</span>
                              </div>
                            </div>
                          </button>

                          {/* Save/Like Host (Doer) Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerSound('click');
                              toggleSaveItem('doer', selectedService.doerId);
                            }}
                            className="p-2.5 bg-rose-50/50 hover:bg-rose-50 text-rose-500 rounded-full border border-neutral-150 cursor-pointer active:scale-90 transition-all flex items-center justify-center shadow-xs"
                            title={isSavedItem('doer', selectedService.doerId) ? "Remove from Favorites" : "Like Doer"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={isSavedItem('doer', selectedService.doerId) ? '#EF4444' : 'none'}
                              stroke={isSavedItem('doer', selectedService.doerId) ? '#EF4444' : '#888888'}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                            >
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-neutral-500 pt-1.5 border-t border-neutral-50">
                          <div>🛡️ ID and Background Checked</div>
                          <div>📞 Confirmed Mobile Connection</div>
                        </div>

                        <button
                          onClick={() => {
                            triggerSound('click');
                            setFocusedDoerId(selectedService.doerId);
                          }}
                          className="w-full py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-neutral-200"
                        >
                          <Sparkles className="w-3 h-3 text-neutral-900" /> View Host Portfolio & Previous Reviews
                        </button>
                      </div>

                      {/* Review List */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                          Recent Guest Feedback
                        </h4>
                        <div className="space-y-2.5">
                          {reviews.slice(0, 2).map((rev) => (
                            <div key={rev.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={rev.authorAvatar}
                                    alt={rev.authorName}
                                    className="w-5 h-5 rounded-full object-cover border border-neutral-200"
                                  />
                                  <span className="text-[11px] font-extrabold text-neutral-800">
                                    {rev.authorName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold bg-white px-2 py-0.5 rounded-lg border border-neutral-100">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {rev.rating}
                                </div>
                              </div>
                              <p className="text-[11px] text-neutral-500 font-medium mt-1.5">
                                "{rev.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fixed bottom price bar & booking CTA */}
                      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">
                            {selectedService.pricingType === 'negotiable' ? 'Pricing' : 'Service Rate'}
                          </span>
                          <span className="text-xl font-black text-neutral-900">
                            {formatServicePrice(selectedService)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              triggerSound('click');
                              setIsShareCardOpen(true);
                            }}
                            className="px-4 py-3.5 border border-neutral-250 hover:bg-neutral-50 text-neutral-700 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            title="Share Service & Generate Card"
                          >
                            <Share2 className="w-4 h-4 text-neutral-900" />
                            <span className="hidden sm:inline">Share</span>
                          </button>
                          {selectedService.userId === currentUser?.id || selectedService.userId === currentUser?.uid || selectedService.doerId === currentUser?.id || selectedService.doerId === currentUser?.uid || (profile && (selectedService.userId === profile.id || selectedService.userId === profile.userId || selectedService.doerId === profile.id || selectedService.doerId === profile.userId)) ? (
                            <div className="px-6 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest text-center border border-slate-200">
                              Your Listing
                            </div>
                          ) : (
                            <button
                              onClick={handleStartBooking}
                              className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98]"
                            >
                              Request Service
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- SUB-VIEW 2: STEP-BY-STEP INTERACTIVE BOOKING FLOW --- */
                    <div className="space-y-6">
                      
                      {/* Back and Progress indicators */}
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <button
                          onClick={handlePrevStep}
                          className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 text-xs font-black uppercase tracking-wider"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map((s) => (
                            <div
                              key={s}
                              className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                                s === bookingStep
                                  ? 'bg-neutral-900'
                                  : s < bookingStep
                                  ? 'bg-neutral-400'
                                  : 'bg-neutral-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                          Step {bookingStep} of 3
                        </span>
                      </div>

                      {/* STEP 1: SELECT DATES & DURATION */}
                      {bookingStep === 1 && (
                        <div className="space-y-5 py-2">
                          <div>
                            <h4 className="text-lg font-black text-neutral-900 tracking-tight">
                              {selectedService.pricingType === 'negotiable' ? 'Request Consultation' : 'When do you need this?'}
                            </h4>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {selectedService.pricingType === 'negotiable'
                                ? 'Discuss pricing and details directly with the DOER.'
                                : 'Configure dates to compute direct escrow pricing.'}
                            </p>
                          </div>
 
                          {/* Check-In / Start Date Input */}
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400">
                              Start Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                              <input
                                type="date"
                                value={checkInDate}
                                onChange={(e) => setCheckInDate(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-800 text-xs font-bold"
                              />
                            </div>
                          </div>
 
                          {/* Dynamic Length / Duration Counter (+/-) */}
                          {selectedService.pricingType !== 'negotiable' && selectedService.pricingType !== 'fixed' && getDurationUnitLabel(selectedService).label && (
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                {getDurationUnitLabel(selectedService).label} Requested
                              </label>
                              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                                <div>
                                  <span className="text-sm font-black text-neutral-900">
                                    {bookingNights} {bookingNights === 1 ? getDurationUnitLabel(selectedService).singular : getDurationUnitLabel(selectedService).label}
                                  </span>
                                  {selectedService.pricingType === 'day' && (
                                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                                      End Date: {checkOutDate}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      triggerSound('click');
                                      setBookingNights((n) => Math.max(1, n - 1));
                                    }}
                                    className="w-8 h-8 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-700 hover:border-neutral-900 transition-all cursor-pointer active:scale-90"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      triggerSound('click');
                                      setBookingNights((n) => n + 1);
                                    }}
                                    className="w-8 h-8 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-700 hover:border-neutral-900 transition-all cursor-pointer active:scale-90"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedService.pricingType === 'fixed' && (
                            <div className="p-4 bg-brand/5 border border-brand/10 rounded-xl text-xs font-semibold text-neutral-700">
                              👌 This service has a single fixed-rate price structure.
                            </div>
                          )}

                          {selectedService.pricingType === 'negotiable' && (
                            <div className="p-4 bg-brand/5 border border-brand/10 rounded-xl text-xs font-semibold text-neutral-700">
                              🤝 Discussion-based negotiable service. No upfront cost.
                            </div>
                          )}
 
                          <button
                            onClick={handleNextStep}
                            className="w-full mt-6 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                          >
                            Continue
                          </button>
                        </div>
                      )}
 
                      {/* STEP 2: SERVICE SCALE & TEAM */}
                      {bookingStep === 2 && (
                        <div className="space-y-5 py-2">
                          <div>
                            <h4 className="text-lg font-black text-neutral-900 tracking-tight">
                              What scale of service is required?
                            </h4>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              Estimate how many crew members or scale is needed for the service.
                            </p>
                          </div>
 
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400">
                              Crew Size / Scale
                            </label>
                            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                              <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-neutral-400" />
                                <div>
                                  <span className="text-sm font-black text-neutral-900">
                                    {bookingGuests} {bookingGuests === 1 ? 'Person' : 'People'}
                                  </span>
                                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                                    Scale estimate registered
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    triggerSound('click');
                                    setBookingGuests((g) => Math.max(1, g - 1));
                                  }}
                                  className="w-8 h-8 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-700 hover:border-neutral-900 transition-all cursor-pointer active:scale-90"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    triggerSound('click');
                                    setBookingGuests((g) => Math.min(6, g + 1));
                                  }}
                                  className="w-8 h-8 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-700 hover:border-neutral-900 transition-all cursor-pointer active:scale-90"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
 
                          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 text-[11px] font-semibold text-neutral-500 leading-normal flex gap-2">
                            <span className="text-base leading-none">ℹ️</span>
                            <span>The DOER will connect with you immediately in Chats once you hire them to discuss instructions.</span>
                          </div>
 
                          <button
                            onClick={handleNextStep}
                            className="w-full mt-6 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                          >
                            Review Price Details
                          </button>
                        </div>
                      )}
 
                      {/* STEP 3: PRICE BREAKDOWN & ESCROW CONFIRMATION */}
                      {bookingStep === 3 && (
                        <div className="space-y-5 py-2">
                          <div>
                            <h4 className="text-lg font-black text-neutral-900 tracking-tight">
                              Confirm and Hire
                            </h4>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              Review your receipt and escrow protection details.
                            </p>
                          </div>
 
                          {/* Invoice breakdown */}
                          {selectedService.pricingType !== 'negotiable' ? (
                            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-neutral-500">
                                  {selectedService.pricingType === 'fixed' ? 'Fixed Service Rate' : `R ${selectedService.price.toLocaleString('en-ZA')} x ${bookingNights} ${bookingNights === 1 ? getDurationUnitLabel(selectedService).singular : getDurationUnitLabel(selectedService).label}`}
                                </span>
                                <span className="font-bold text-neutral-800">
                                  R {(selectedService.price * (selectedService.pricingType === 'fixed' ? 1 : bookingNights)).toLocaleString('en-ZA')}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-neutral-500">Service Fee</span>
                                <span className="font-bold text-neutral-800">R {serviceFee}</span>
                              </div>
                              
                              <div className="border-t border-neutral-200 pt-3 flex justify-between items-center">
                                <span className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                                  Total Invoice
                                </span>
                                <span className="text-base font-black text-neutral-900">
                                  R {((selectedService.price * (selectedService.pricingType === 'fixed' ? 1 : bookingNights)) + serviceFee).toLocaleString('en-ZA')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-neutral-500">Inquiry Price</span>
                                <span className="font-extrabold text-neutral-800 uppercase text-[10px] bg-brand-light text-brand-dark px-2 py-0.5 rounded-md border border-brand/10">Negotiable</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-neutral-500">Upfront Call-Out Fee</span>
                                <span className="font-bold text-neutral-800">R 0</span>
                              </div>
                              
                              <div className="border-t border-neutral-200 pt-3 flex justify-between items-center">
                                <span className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                                  Estimated Upfront Price
                                </span>
                                <span className="text-base font-black text-neutral-900">
                                  R 0
                                </span>
                              </div>
                            </div>
                          )}
 
                          {/* Escrow Mechanism Explanation */}
                          <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-3">
                            <div className="flex items-start gap-2.5">
                              <div className="p-1.5 bg-neutral-900 text-white rounded-lg flex items-center justify-center mt-0.5">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <div className="text-xs">
                                <span className="font-extrabold text-neutral-900 block">
                                  Safe Escrow Protection
                                </span>
                                <p className="text-[11px] text-neutral-500 font-medium leading-relaxed mt-1">
                                  {selectedService.pricingType === 'negotiable' ? (
                                    <span>DOER.za covers all requests with double-escrow protection. Once you negotiate and agree on a final price in Chat, a custom safe payment link will be generated for you.</span>
                                  ) : (
                                    <span>DOER.za uses dual-release escrow. To protect your payment, you only pay a 50% deposit now (<span className="font-extrabold text-neutral-800">R {Math.round(((selectedService.price * (selectedService.pricingType === 'fixed' ? 1 : bookingNights)) + serviceFee) * 0.5).toLocaleString('en-ZA')}</span>). This is securely locked. The DOER is notified, but gets paid only AFTER you approve the completed work.</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
 
                          <button
                            onClick={() => handleConfirmBooking(selectedService)}
                            className="w-full mt-6 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
                          >
                            {selectedService.pricingType === 'negotiable' ? 'Send Negotiation Inquiry' : 'Hire DOER with Escrow'}
                          </button>
                        </div>
                      )}
 
                    </div>
                  )}
 
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
 
        {/* --- BOOKING SUCCESS TOAST PANEL (AESTHETIC OVERLAY) --- */}
        <AnimatePresence>
          {bookedSuccess && selectedService && (
            <div className="absolute inset-0 bg-neutral-950/80 z-[60] flex items-center justify-center p-6 text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="bg-white p-7 rounded-3xl shadow-2xl max-w-sm flex flex-col items-center space-y-5 border border-neutral-100"
              >
                <div className="w-16 h-16 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-lg relative">
                  <span className="text-xl">✨</span>
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-900 animate-ping opacity-25" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900 tracking-tight">
                    {selectedService.pricingType === 'negotiable' ? 'Inquiry Sent! 💬' : 'DOER Hired! 🔒'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed mt-2">
                    {selectedService.pricingType === 'negotiable' ? (
                      <span>Your inquiry has been sent to the DOER. You can now chat and negotiate directly.</span>
                    ) : (
                      <span>A secure escrow hold of <span className="font-bold text-neutral-800">R {Math.round(((selectedService.price * (selectedService.pricingType === 'fixed' ? 1 : bookingNights)) + serviceFee) * 0.5).toLocaleString('en-ZA')}</span> has been successfully processed.</span>
                    )}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-2 font-medium leading-normal">
                    DOER <span className="font-extrabold text-neutral-600">{selectedService.doerName}</span> has been notified and your active contract is visible under your Workspace Dashboard.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- SERVICE SOCIAL CARD SHARE OVERLAY MODAL --- */}
        <AnimatePresence>
          {isShareCardOpen && selectedService && (
            <div className="absolute inset-0 bg-neutral-950/80 z-[70] flex items-center justify-center p-4 sm:p-6 text-left">
              <div className="absolute inset-0" onClick={() => setIsShareCardOpen(false)} />
              
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                className="bg-neutral-900 border border-neutral-800 text-white rounded-3xl overflow-hidden w-full max-w-md flex flex-col shadow-2xl relative z-10 p-6 space-y-6"
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <div>
                    <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-emerald-400" /> Share & Social Card
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">
                      Generate a South African verified service pass
                    </p>
                  </div>
                  <button
                    onClick={() => setIsShareCardOpen(false)}
                    className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Social Card Preview */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-gradient-to-br from-neutral-850 to-neutral-950 p-5 shadow-xl space-y-5">
                  {/* Decorative neon dots */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black tracking-widest text-emerald-400">DOER</h4>
                      <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
                        South Africa Secure Escrow Service
                      </p>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-600 rounded-lg text-[10px] font-black text-white uppercase tracking-wider">
                      {selectedService.pricingType === 'negotiable' ? 'Negotiable' : `R ${selectedService.price.toLocaleString('en-ZA')}/${selectedService.pricingType || selectedService.priceUnit || 'hr'}`}
                    </div>
                  </div>

                  {/* Service Details on Card */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase bg-neutral-800 text-emerald-400 px-2 py-0.5 rounded border border-neutral-700 inline-block">
                      {serviceCategories.find(c => c.id === selectedService.category || c.name === selectedService.category)?.name || selectedService.categoryName || selectedService.category}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight leading-tight pt-1">
                      {selectedService.title}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest">
                      📍 {selectedService.location}
                    </p>
                  </div>

                  {/* Provider Info Row */}
                  <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedService.doerAvatar}
                        alt={selectedService.doerName}
                        className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedService.doerName)}&background=random`;
                        }}
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{selectedService.doerName}</span>
                        <span className="text-[9px] text-neutral-400 font-medium">Hired Provider</span>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md text-[9px] font-bold border border-amber-500/30">
                      🛡️ Score {selectedService.doerTrustScore}%
                    </div>
                  </div>

                  {/* Geometric Mock QR / Barcode element */}
                  <div className="flex items-center justify-between pt-1 text-[9px] font-bold text-neutral-500">
                    <div className="flex gap-0.5 items-center">
                      <span className="w-1 h-3 bg-neutral-600 animate-pulse" />
                      <span className="w-2.5 h-3 bg-neutral-600 animate-pulse" />
                      <span className="w-0.5 h-3 bg-neutral-600 animate-pulse" />
                      <span className="w-1.5 h-3 bg-neutral-600 animate-pulse" />
                      <span className="w-1 h-3 bg-neutral-600 animate-pulse" />
                      <span className="w-3 h-3 bg-neutral-600 animate-pulse" />
                      <span className="w-0.5 h-3 bg-neutral-600 animate-pulse" />
                      <span className="w-1.5 h-3 bg-neutral-600 animate-pulse" />
                      <span className="text-[8px] font-mono tracking-widest ml-1.5">DOER-{selectedService.id.substring(0,6).toUpperCase()}</span>
                    </div>
                    <div className="text-right text-[8px] text-neutral-400 uppercase">
                      SCAN TO BOOK SECURELY
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerSound('success');
                      const deepLinkUrl = `${window.location.origin}${window.location.pathname}?serviceId=${selectedService.id}`;
                      copyToClipboard(deepLinkUrl)
                        .then((success) => {
                          if (success) {
                            showToast('Deep Link copied! Share it anywhere.', 'success');
                          } else {
                            showToast('Failed to copy link.', 'error');
                          }
                        });
                    }}
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] transition-all rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-neutral-750 text-white"
                  >
                    🔗 Copy Deep Link
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerSound('success');
                      downloadSocialCard(selectedService);
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 transition-all rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20 font-bold"
                  >
                    📥 Download HD Share Card
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerSound('click');
                      const deepLinkUrl = `${window.location.origin}${window.location.pathname}?serviceId=${selectedService.id}`;
                      handleShare(selectedService.title, `Check out ${selectedService.title} by ${selectedService.doerName} on DOER secure escrow marketplace: ${deepLinkUrl}`);
                    }}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] transition-all rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer border border-neutral-800 text-neutral-400 hover:text-white"
                  >
                    📲 Share via Mobile / Chat
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- DOER PROFILE FULL PORTFOLIO MODAL --- */}
        <AnimatePresence>
          {focusedDoerId && (
            <DoerProfileModal doerId={focusedDoerId} onClose={() => setFocusedDoerId(null)} />
          )}
        </AnimatePresence>

        {/* --- QR SCANNER MODAL --- */}
        <QRCodeScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={(profileId) => setFocusedDoerId(profileId)}
        />
        
        {/* --- QR SCANNER MODAL --- */}
        <QRCodeScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={(profileId) => setFocusedDoerId(profileId)}
        />
        
        {/* --- POST SERVICE MODAL --- */}
        {isServiceModalOpen && (
          <PostServiceModal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} />
        )}

      </div>
    </PullToRefresh>
  );
}
