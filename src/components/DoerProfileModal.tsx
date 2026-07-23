/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getProperAvatar } from '../utils/avatarUtils';
import { motion, AnimatePresence } from 'motion/react';
import { MediaPreview } from './MediaPreview';
import {
  X,
  Star,
  MapPin,
  ShieldCheck,
  Award,
  MessageSquare,
  Phone,
  Mail,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Check,
  Lock,
  Briefcase,
  FileText,
  ZoomIn,
  ZoomOut,
  Pencil,
  Trash2,
  Info
} from 'lucide-react';
import { PortfolioProject, PortfolioImage } from '../types';
import PortfolioMasonryGrid from './PortfolioMasonryGrid';
import PostServiceModal from './PostServiceModal';
import ConfirmationModal from './ConfirmationModal';
import { logError } from '../lib/logger';
import { copyToClipboard } from './HomeFeed';

interface DoerProfileModalProps {
  doerId: string; // ID of the role profile to display
  onClose: () => void;
}

export default function DoerProfileModal({ doerId, onClose }: DoerProfileModalProps) {
  const {
    roleProfiles,
    portfolioProjects,
    reviews,
    services,
    currentUser,
    serviceRequests,
    sendMessage,
    addPortfolioProject,
    triggerSound,
    showToast,
    isSavedItem,
    toggleSaveItem,
    deleteService,
    serviceCategories,
    addReview
  } = useApp();

  // Find the target Doer Profile
  const profile = roleProfiles.find((p) => p.id === doerId) || roleProfiles.find((p) => p.userId === doerId) || roleProfiles[0];
  const isOwnProfile = profile.userId === currentUser.id;

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

  // Tabs structure: About, Reviews, Portfolio, Services, Certifications (Optional), Contact
  const [activeTab, setActiveTab] = useState<'portfolio' | 'about' | 'reviews' | 'services' | 'certs' | 'contact'>('portfolio');

  // Lightbox Viewer State
  const [activeLightboxProject, setActiveLightboxProject] = useState<PortfolioProject | null>(null);
  const [lightboxImages] = useState<PortfolioImage[]>([]);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; serviceId: string | null }>({ isOpen: false, serviceId: null });

  // Reset zoom level on image transition
  useEffect(() => {
    setZoomLevel(1);
  }, [currentLightboxIndex]);

  // Search & Filter state for Portfolio discoverability
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioFilterCategory, setPortfolioFilterCategory] = useState<string>('all');
  const [showEduTooltip, setShowEduTooltip] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Add Portfolio Form state
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjCategory, setNewProjCategory] = useState('plumbing');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjCover, setNewProjCover] = useState('');

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSortOrder, setReviewSortOrder] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [newProjBefore, setNewProjBefore] = useState('');
  const [newProjAfter, setNewProjAfter] = useState('');
  const [newProjExtraImages, setNewProjExtraImages] = useState<{ imageUrl: string; caption: string }[]>([
    { imageUrl: '', caption: '' }
  ]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    
    addReview(profile.id, reviewRating, reviewComment.trim());
    setReviewComment('');
    setReviewRating(5);
    setShowReviewForm(false);
  };

  useEffect(() => {
    if (serviceCategories && serviceCategories.length > 0 && !serviceCategories.some(c => c.id === newProjCategory)) {
      setNewProjCategory(serviceCategories[0].id);
    }
  }, [serviceCategories, newProjCategory]);

  // Navigate lightbox images
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerSound('click');
    setCurrentLightboxIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerSound('click');
    setCurrentLightboxIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1));
  };

  // Direct contact / Chat bridge
  const handleInitiateChat = () => {
    // Check if there is an accepted service request with this doer
    const acceptedRequest = serviceRequests.find(r => 
      (r.doerId === profile.id || r.doerId === profile.userId) && 
      r.bookingOwnerId === currentUser.id && 
      r.status !== 'requested' && r.status !== 'rejected'
    );

    if (!acceptedRequest) {
      triggerSound('alert');
      showToast('Communication is locked until your job request is accepted by the DOER.', 'warning');
      return;
    }

    triggerSound('success');
    showToast(`Opening chat with ${profile.title.split(' ')[0]}...`, 'success');
    onClose();
    // Navigate to Chat tab
    const conversationId = `conv-${profile.id}`;
    // If it's the first time, we can send a follow up or just open the view
    sendMessage(conversationId, `Hello! I'm following up on our accepted request for "${acceptedRequest.title}".`);
  };

  // Fetch portfolio projects for this Doer
  const doerProjects = portfolioProjects.filter((p) => p.userId === profile.id || p.userId === profile.userId);

  // Filter & Search Portfolio
  const filteredProjects = doerProjects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
                          p.description.toLowerCase().includes(portfolioSearch.toLowerCase());
    const matchesCategory = portfolioFilterCategory === 'all' || p.category_id === portfolioFilterCategory;
    return matchesSearch && matchesCategory;
  });

  // Fetch reviews for this Doer
  const doerReviews = reviews.filter((r) => r.targetId === profile.id || r.targetId === profile.userId);
  const dynamicReviewCount = doerReviews.length;
  const dynamicAverageRating = dynamicReviewCount > 0 
    ? (doerReviews.reduce((acc, curr) => acc + curr.rating, 0) / dynamicReviewCount).toFixed(1)
    : "0.0";

  // Dynamic Completed Jobs and Trust Score
  const dynamicCompletedJobsCount = serviceRequests.filter(
    (r) => (r.doerId === profile.id || r.doerId === profile.userId) && r.status === 'released' && !r.isProductOrder
  ).length;

  const dynamicTotalJobsRequested = serviceRequests.filter(
    (r) => (r.doerId === profile.id || r.doerId === profile.userId) && !r.isProductOrder
  ).length;

  const dynamicSalesCount = serviceRequests.filter(
    (r) => (r.doerId === profile.id || r.doerId === profile.userId) && r.status === 'released' && r.isProductOrder
  ).length;

  const finalCompletedJobs = Math.max(profile.completedJobsCount || 0, dynamicCompletedJobsCount);

  const dynamicActiveProjectsCount = serviceRequests.filter(
    (r) => (r.doerId === profile.id || r.doerId === profile.userId) &&
           ['accepted', 'deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'disputed'].includes(r.status) &&
           !r.isProductOrder
  ).length;

  const dynamicCompletionRate = dynamicTotalJobsRequested > 0
    ? Math.round((dynamicCompletedJobsCount / dynamicTotalJobsRequested) * 100)
    : (profile.completionRate || 100);

  // Real-time Trust Score Calculation
  const dynamicTrustScore = (() => {
    // 1. Verification (Max 30)
    let verificationScore = profile.trustScore?.verificationScore || 10;
    if (isOwnProfile) {
      const isIdVerified = currentUser.verificationStatus === 'identity_verified' || currentUser.verificationStatus === 'business_verified';
      const isBizVerified = currentUser.verificationStatus === 'business_verified';
      verificationScore = 10; // phone is always true for registered users
      if (isIdVerified) verificationScore += 15;
      if (isBizVerified) verificationScore += 5;
    }

    // 2. Reputation (Max 30)
    let reputationScore = 15;
    if (dynamicReviewCount > 0) {
      reputationScore = Math.round((Number(dynamicAverageRating) / 5) * 30);
    } else if (profile.trustScore?.reputationScore) {
      reputationScore = profile.trustScore.reputationScore;
    }

    // 3. Reliability (Max 25)
    const reliabilityScore = Math.round((dynamicCompletionRate / 100) * 25);

    // 4. Activity (Max 15)
    const rawActivity = (finalCompletedJobs * 0.5) + (dynamicSalesCount * 0.1);
    const activityScore = Math.min(15, Math.ceil(rawActivity));

    // 5. Portfolio Bonus points (First verified project: +5, Five: +10, Ten: +15)
    const verifiedPortfolioCount = doerProjects.filter(p => p.isVerified).length;
    let portfolioBonus = 0;
    if (verifiedPortfolioCount >= 10) portfolioBonus = 15;
    else if (verifiedPortfolioCount >= 5) portfolioBonus = 10;
    else if (verifiedPortfolioCount >= 1) portfolioBonus = 5;

    const score = verificationScore + reputationScore + reliabilityScore + activityScore + portfolioBonus;
    const finalScore = Math.min(100, score);

    let level = 'New User';
    if (finalScore >= 76) level = 'Top Rated User';
    else if (finalScore >= 51) level = 'Trusted User';
    else if (finalScore >= 26) level = 'Active User';

    return {
      score: finalScore,
      level
    };
  })();

  const sortedReviews = [...doerReviews].sort((a, b) => {
    if (reviewSortOrder === 'highest') return b.rating - a.rating;
    if (reviewSortOrder === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  doerReviews.forEach(r => {
    const star = Math.floor(r.rating) as 1 | 2 | 3 | 4 | 5;
    if (ratingCounts[star] !== undefined) ratingCounts[star]++;
  });

  // Fetch services listed by this Doer
  const doerServices = services.filter((s) => s.doerId === profile.id || s.doerId === profile.userId);

  // South African Presets for Portfolio Creation
  const UNSPLASH_Plumbing_PRESETS = [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1585338087338-3f70dbfeec31?w=600&auto=format&fit=crop&q=80'
  ];

  const UNSPLASH_Gardening_PRESETS = [
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530731141654-5961fe27689c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80'
  ];

  const UNSPLASH_Construction_PRESETS = [
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80'
  ];

  const handlePresetSelect = (url: string) => {
    triggerSound('click');
    if (!newProjCover) setNewProjCover(url);
    else if (!newProjBefore) setNewProjBefore(url);
    else if (!newProjAfter) setNewProjAfter(url);
  };

  const handleAddExtraImageField = () => {
    triggerSound('click');
    setNewProjExtraImages((prev) => [...prev, { imageUrl: '', caption: '' }]);
  };

  const handleRemoveExtraImageField = (idx: number) => {
    triggerSound('click');
    setNewProjExtraImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateExtraImage = (idx: number, field: 'imageUrl' | 'caption', val: string) => {
    setNewProjExtraImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, [field]: val } : img))
    );
  };

  const handleSubmitPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDesc.trim()) {
      showToast('Please provide a project title and description.', 'error');
      return;
    }

    const defaultCover = newProjCategory === 'plumbing' ? UNSPLASH_Plumbing_PRESETS[0] : newProjCategory === 'gardening' ? UNSPLASH_Gardening_PRESETS[0] : UNSPLASH_Construction_PRESETS[0];

    // Create the portfolio project
    addPortfolioProject(
      newProjTitle,
      newProjDesc,
      newProjCategory,
      newProjCover || defaultCover,
      newProjBefore || undefined,
      newProjAfter || undefined,
      newProjExtraImages.filter((img) => img.imageUrl.trim() !== '')
    );

    // Reset Form
    setNewProjTitle('');
    setNewProjDesc('');
    setNewProjCover('');
    setNewProjBefore('');
    setNewProjAfter('');
    setNewProjExtraImages([{ imageUrl: '', caption: '' }]);
    setShowAddProjectForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-0 md:p-6 text-left">
      {/* Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="bg-white w-full h-full md:max-w-4xl md:h-[90vh] md:rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative"
      >
        {/* Top Header Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => {
              triggerSound('click');
              handleShare(profile.displayName, `Check out ${profile.displayName}'s profile on our app!`);
            }}
            className="p-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-all shadow-md backdrop-blur-xs flex items-center justify-center group cursor-pointer"
            title="Share Profile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 transition-transform group-hover:scale-105"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button
            onClick={() => toggleSaveItem('doer', profile.id)}
            className="p-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-all shadow-md backdrop-blur-xs flex items-center justify-center group cursor-pointer"
          >
            <motion.span
              animate={{ scale: isSavedItem('doer', profile.id) ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isSavedItem('doer', profile.id) ? '#F43F5E' : 'none'}
                stroke={isSavedItem('doer', profile.id) ? '#F43F5E' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 transition-transform group-hover:scale-105"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </motion.span>
          </button>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-all shadow-md backdrop-blur-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROFILE COVER BANNER */}
        <div className="h-40 md:h-48 w-full relative bg-slate-200 overflow-hidden">
          {profile.coverImageUrl ? (
            <img onClick={() => setViewingImage(profile.coverImageUrl)} src={profile.coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover cursor-pointer" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-r ${profile.bannerColor || 'from-indigo-600 to-indigo-800'}`} />
          )}
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute top-12 left-6 right-6 md:top-16 flex items-end gap-4 z-10">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-white flex-shrink-0">
              <img
                onClick={(e) => setViewingImage(e.currentTarget.src)}
                src={getProperAvatar(profile.profileImageUrl || profile.avatarUrl, isOwnProfile ? `${currentUser.firstName} ${currentUser.lastName}` : profile.displayName, profile.id || profile.uid, profile.gender)}
                alt={isOwnProfile ? `${currentUser.firstName} ${currentUser.lastName}` : profile.title}
                className="w-full h-full object-cover cursor-pointer"
              />
            </div>
            
            {/* Header Identity */}
            <div className="text-white pb-1 select-none">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base md:text-xl font-black tracking-tight leading-tight drop-shadow-md">
                  {isOwnProfile ? `${currentUser.firstName} ${currentUser.lastName}` : (
                    profile.id === 'doer-1' ? 'Sipho Ngwenya' :
                    profile.id === 'doer-2' ? 'Anika van der Merwe' :
                    profile.id === 'doer-3' ? 'David Nkosi' :
                    profile.id === 'doer-4' ? 'Naledi Khumalo' :
                    (profile.displayName && !['freelancer', 'Freelancer', 'Doer', 'User'].includes(profile.displayName) ? profile.displayName : (profile.occupation ? `${profile.occupation} Specialist` : (profile.title || 'Service Professional')))
                  )}
                </h2>
                <span className="bg-brand text-zinc-900 p-0.5 rounded-full text-xs shadow-xs" title="Verified by DOER">
                  <ShieldCheck className="w-3.5 h-3.5 fill-current" />
                </span>
                <span className="bg-white/20 backdrop-blur-md text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/10 tracking-widest">
                  {profile.role.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-white/90 font-semibold mt-0.5 drop-shadow-sm line-clamp-1">
                {profile.title}
              </p>
              <div className="flex items-center gap-1.5 text-white/80 font-semibold text-[10px] mt-1 drop-shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                {profile.location || 'Johannesburg'}
              </div>
            </div>
          </div>
        </div>

        {/* 📋 INSTANT HIRING TRUST DASHBOARD (ANSWERS "CAN I TRUST THIS PERSON" IN 10 SECONDS) */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {/* Trust Score Card */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs flex flex-col gap-2 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center font-black text-brand-dark text-xs border border-brand/20">
                {dynamicTrustScore.score}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block">Trust Score</span>
                <span className="text-[11px] font-black text-slate-900 leading-none truncate block">{dynamicTrustScore.level}</span>
              </div>
            </div>
            {/* Visual progress bar gauge */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand h-full rounded-full transition-all duration-500" 
                  style={{ width: `${dynamicTrustScore.score}%` }} 
                />
              </div>
              <div className="flex justify-between items-center text-[7.5px] font-extrabold text-slate-400">
                <span>0</span>
                <span>{dynamicTrustScore.score}/100 PTS</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Success Rate & Active Projects */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between text-left h-full">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-100">
                {dynamicCompletionRate}%
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block">Jobs Overview</span>
                <span className="text-xs font-black text-slate-900 leading-none">{finalCompletedJobs} Completed</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between mt-1 text-[8.5px] font-bold">
              <span className="text-slate-400">Active Projects:</span>
              <span className="text-brand-dark font-black bg-brand/10 px-1.5 py-0.5 rounded-md">
                {dynamicActiveProjectsCount} Projects
              </span>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs border border-amber-100 gap-0.5">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {dynamicAverageRating}
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block">Client Rating</span>
              <span className="text-xs font-black text-slate-900 leading-none">{dynamicReviewCount} Reviews</span>
            </div>
          </div>

          {/* Verified Projects count */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs border border-blue-100">
              {doerProjects.length}
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block">Portfolio Works</span>
              <span className="text-xs font-black text-slate-900 leading-none">{doerProjects.filter(p => p.isVerified).length} Verified</span>
            </div>
          </div>
        </div>

        {/* 📂 PROFILE MENU TABS */}
        <div className="flex border-b border-slate-100 bg-white overflow-x-auto scrollbar-none select-none">
          {[
            { id: 'portfolio', label: '🎨 Portfolio' },
            { id: 'about', label: '👤 About Doer' },
            { id: 'reviews', label: `⭐️ Reviews (${dynamicReviewCount})` },
            { id: 'services', label: '💼 Services' },
            { id: 'certs', label: '📜 Certifications' },
            { id: 'contact', label: '📞 Contact' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerSound('click');
                setActiveTab(tab.id as any);
              }}
              className={`px-5 py-3 text-xs font-black tracking-wide uppercase whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-brand text-brand-dark bg-brand/5 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 📚 TAB PANEL CONTENTS */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              
              {/* Header inside portfolio tab */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" /> Work Proof Showcase
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Visually verify prior job quality before hiring. Trust is built on proof.</p>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => {
                      triggerSound('click');
                      setShowAddProjectForm(!showAddProjectForm);
                    }}
                    className="px-3 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project Proof
                  </button>
                )}
              </div>

              {/* ➕ ADD PORTFOLIO PROJECT FORM */}
              <AnimatePresence>
                {showAddProjectForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-white p-5 rounded-2xl border border-brand/20 shadow-sm space-y-4 text-xs font-semibold"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="font-extrabold text-brand-dark text-sm flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" /> Publish New Project Portfolio Entry
                      </span>
                      <button
                        onClick={() => setShowAddProjectForm(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSubmitPortfolio} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Project Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Bathroom Modernization"
                            value={newProjTitle}
                            onChange={(e) => setNewProjTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Service Category *</label>
                          <select
                            value={newProjCategory}
                            onChange={(e) => setNewProjCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl font-bold"
                          >
                            {serviceCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Project Description *</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Describe the problem, step-by-step resolution, plumbing components used, and custom final details."
                          value={newProjDesc}
                          onChange={(e) => setNewProjDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl font-medium leading-relaxed"
                        />
                      </div>

                      {/* Before / After Photos selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Cover Image URL *</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={newProjCover}
                            onChange={(e) => setNewProjCover(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-[10px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Before Photo URL (Optional)</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={newProjBefore}
                            onChange={(e) => setNewProjBefore(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-[10px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">After Photo URL (Optional)</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={newProjAfter}
                            onChange={(e) => setNewProjAfter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-[10px]"
                          />
                        </div>
                      </div>

                      {/* Image Presets Picker */}
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Or Quick Pick High-Res Proof Photos</span>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {(newProjCategory === 'plumbing' ? UNSPLASH_Plumbing_PRESETS : newProjCategory === 'gardening' ? UNSPLASH_Gardening_PRESETS : UNSPLASH_Construction_PRESETS).map((url, i) => (
                            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handlePresetSelect(url)}>
                              <img src={url} alt="Preset" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-white text-[9px] font-black">Pick</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional Gallery images */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Additional Project Gallery Images</span>
                          <button type="button" onClick={handleAddExtraImageField} className="text-brand font-black text-[10px] hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Image
                          </button>
                        </div>
                        {newProjExtraImages.map((img, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Image URL"
                              value={img.imageUrl}
                              onChange={(e) => handleUpdateExtraImage(idx, 'imageUrl', e.target.value)}
                              className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-[10px]"
                            />
                            <input
                              type="text"
                              placeholder="Caption"
                              value={img.caption}
                              onChange={(e) => handleUpdateExtraImage(idx, 'caption', e.target.value)}
                              className="w-1/3 px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-[10px]"
                            />
                            {newProjExtraImages.length > 1 && (
                              <button type="button" onClick={() => handleRemoveExtraImageField(idx)} className="text-rose-500 font-extrabold text-[10px]">
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl font-black text-xs shadow-md transition-all mt-2"
                      >
                        Publish Verified Project Proof 🚀 (+5-15 Trust Points)
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* DISCOVERABILITY & SEARCH PANEL */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="text"
                  placeholder="Search previous project works..."
                  value={portfolioSearch}
                  onChange={(e) => setPortfolioSearch(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-300"
                />
                
                <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
                  {[
                    { id: 'all', label: 'All Projects' },
                    ...serviceCategories.map((cat) => ({ id: cat.id, label: cat.name }))
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setPortfolioFilterCategory(filter.id)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg whitespace-nowrap transition-colors uppercase ${
                        portfolioFilterCategory === filter.id
                          ? 'bg-zinc-900 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MASONRY GRID AND BEFORE / AFTER SECTION */}
              {filteredProjects.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-150">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <span className="font-extrabold text-slate-800 text-xs block">No portfolio projects published yet</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Verified work proofs display here once jobs are completed!</span>
                </div>
              ) : (
                <PortfolioMasonryGrid projects={filteredProjects} />
              )}
            </div>
          )}

          {/* TAB: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-5 text-xs text-slate-600 font-medium leading-relaxed">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="font-black text-slate-900 text-sm">Professional Biography</h4>
                <p className="text-slate-500 leading-relaxed font-medium">
                  {profile.bio}
                </p>
              </div>

              {/* Bio & Identity details (Gender, Location, Experience) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="font-black text-slate-900 text-sm">Identity & Profile Details</h4>
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  {profile.gender && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Gender</span>
                      <span className="text-xs font-black text-slate-800 capitalize">{profile.gender}</span>
                    </div>
                  )}
                  {profile.yearsOfExperience !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Experience</span>
                      <span className="text-xs font-black text-slate-800">{profile.yearsOfExperience} Year{profile.yearsOfExperience !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60 col-span-2">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Primary Service Area</span>
                      <span className="text-xs font-black text-slate-800">{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media Links display */}
              {(profile.linkedInUrl || profile.githubUrl || profile.websiteUrl || profile.facebookUrl || profile.instagramUrl || profile.tiktokUrl || profile.xUrl || profile.youtubeUrl) && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="font-black text-slate-900 text-sm">Professional & Social Links</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {profile.linkedInUrl && (
                      <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 transition-colors">
                        <span className="font-extrabold text-indigo-600 uppercase text-[9px] tracking-wider">LinkedIn</span>
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 transition-colors">
                        <span className="font-extrabold text-zinc-900 uppercase text-[9px] tracking-wider">GitHub</span>
                      </a>
                    )}
                    {profile.websiteUrl && (
                      <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 transition-colors">
                        <span className="font-extrabold text-brand-dark uppercase text-[9px] tracking-wider">Portfolio Website</span>
                      </a>
                    )}
                    {profile.facebookUrl && (
                      <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 transition-colors">
                        <span className="font-extrabold text-blue-600 uppercase text-[9px] tracking-wider">Facebook</span>
                      </a>
                    )}
                    {profile.instagramUrl && (
                      <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 transition-colors">
                        <span className="font-extrabold text-pink-600 uppercase text-[9px] tracking-wider">Instagram</span>
                      </a>
                    )}
                    {profile.tiktokUrl && (
                      <a href={profile.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 transition-colors">
                        <span className="font-extrabold text-slate-800 uppercase text-[9px] tracking-wider">TikTok</span>
                      </a>
                    )}
                    {profile.xUrl && (
                      <a href={profile.xUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 transition-colors">
                        <span className="font-extrabold text-slate-900 uppercase text-[9px] tracking-wider">X (Twitter)</span>
                      </a>
                    )}
                    {profile.youtubeUrl && (
                      <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 transition-colors">
                        <span className="font-extrabold text-red-600 uppercase text-[9px] tracking-wider">YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="font-black text-slate-900 text-sm">Skilled Qualifications</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {profile.skills.length > 0 ? (
                    profile.skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] tracking-wider border border-slate-150">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">No specific skills listed yet.</span>
                  )}
                </div>
              </div>

              {/* Service details & Hourly price */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="font-black text-slate-900 text-sm">Hiring Rates</h4>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900">
                    R {profile.hourlyRate ? profile.hourlyRate : '300'} <span className="text-xs text-slate-400 font-bold">/ hour</span>
                  </span>
                  <span className="bg-brand-light text-brand-dark px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase">
                    Escrow Protected
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                  All transactions on DOER use 50% escrow guarantee deposits. The Doer only receives payment after you confirm work completion.
                </p>
              </div>
            </div>
          )}

          {/* TAB: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-5 items-center justify-between text-xs">
                <div className="text-center sm:text-left">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wide block">Aggregate Score</span>
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                    <span className="text-2xl font-black text-slate-900">{dynamicAverageRating}</span>
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${parseFloat(dynamicAverageRating) >= s ? "fill-amber-500 text-amber-500" : "fill-slate-100 text-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    Based on {dynamicReviewCount} user ratings and job feedback logs.
                  </span>
                </div>
                
                <div className="flex items-center gap-1 bg-brand-light border border-brand/20 p-3 rounded-2xl">
                  <Award className="w-5 h-5 text-brand-dark" />
                  <div>
                    <span className="font-extrabold text-brand-dark text-[10px] block">100% Verified Reviews</span>
                    <span className="text-[9px] text-brand-dark font-medium leading-none block mt-0.5">Reviews can only be left after successful escrow release.</span>
                  </div>
                </div>
              </div>

              {/* Review Summary */}
              {dynamicReviewCount > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                  <div className="flex gap-6 items-center">
                    <div className="text-center">
                      <div className="text-4xl font-black text-slate-800">{dynamicAverageRating}</div>
                      <div className="flex items-center justify-center gap-0.5 mt-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3.5 h-3.5 ${parseFloat(dynamicAverageRating) >= star ? 'fill-amber-500' : 'fill-slate-100 text-slate-200'}`} />
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">{dynamicReviewCount} Ratings</div>
                    </div>
                    
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingCounts[star as keyof typeof ratingCounts];
                        const percentage = dynamicReviewCount > 0 ? (count / dynamicReviewCount) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="w-2 text-slate-500">{star}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="w-6 text-right text-slate-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Review Action */}
              {!isOwnProfile && (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  {!showReviewForm ? (
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setShowReviewForm(true);
                      }}
                      className="w-full p-4 flex items-center justify-center gap-2 text-brand font-black text-xs hover:bg-slate-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Write a Review
                    </button>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="p-4 space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-extrabold text-slate-800 text-xs">Rate your experience</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`p-1 transition-all ${reviewRating >= star ? 'text-amber-500 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
                            >
                              <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-amber-500' : 'fill-slate-100'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write your review here..."
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand min-h-[100px] resize-none text-slate-700 font-medium"
                        required
                      />
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerSound('click');
                            setShowReviewForm(false);
                            setReviewComment('');
                            setReviewRating(5);
                          }}
                          className="flex-1 p-3 rounded-xl border border-slate-200 font-extrabold text-slate-500 text-xs hover:bg-slate-50 active:scale-95 transition-all"
                        >
                          CANCEL
                        </button>
                        <button
                          type="submit"
                          disabled={!reviewComment.trim()}
                          className="flex-1 p-3 rounded-xl bg-brand text-white font-extrabold text-xs hover:bg-brand-dark active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                          SUBMIT REVIEW
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-extrabold text-slate-800 text-sm">Feedback</h3>
                  {dynamicReviewCount > 0 && (
                    <select
                      value={reviewSortOrder}
                      onChange={(e) => setReviewSortOrder(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand"
                    >
                      <option value="newest">Newest First</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </select>
                  )}
                </div>
                {doerReviews.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
                    <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="font-extrabold text-slate-800 text-xs block">No reviews yet</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">This Doer has no review logs registered yet.</span>
                  </div>
                ) : (
                  sortedReviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200">
                            <img src={rev.authorAvatar} alt={rev.authorName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block leading-tight">{rev.authorName}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex text-amber-500 font-black text-[10px] items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {rev.rating}
                        </div>
                      </div>
                      <p className="text-slate-500 leading-relaxed font-semibold italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Services Listed</span>
              {doerServices.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-slate-150 flex flex-col items-center justify-center space-y-3 p-6">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                  <span className="font-extrabold text-slate-800 text-xs block text-center">
                    You haven't published any services yet.
                  </span>
                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setIsServiceModalOpen(true);
                      }}
                      className="px-4 py-2 bg-brand hover:bg-brand-hover text-zinc-900 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                    >
                      + Create Service
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doerServices.map((srv) => (
                    <div key={srv.id} className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
                      <div className="w-full h-32 bg-slate-100 overflow-hidden relative">
                        <MediaPreview 
                          urls={srv.imageUrls} 
                          featuredUrl={srv.featuredImageUrl} 
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5 text-xs">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{srv.title}</h4>
                          <p className="text-slate-500 leading-normal line-clamp-2 font-medium">{srv.description}</p>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-50 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black text-slate-900 text-xs whitespace-nowrap">
                            R {srv.price} <span className="text-[9px] text-slate-400 font-bold">/{srv.pricingType || srv.priceUnit}</span>
                          </span>
                          
                          {!isOwnProfile ? (
                            <button
                              onClick={() => {
                                triggerSound('success');
                                showToast(`Booking ${srv.title}...`, 'success');
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-brand text-zinc-900 font-black rounded-xl text-[9px] hover:bg-brand-hover shadow-2xs transition-all cursor-pointer"
                            >
                              Hire Doer
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  triggerSound('click');
                                  setEditingService(srv);
                                }}
                                className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-600 hover:text-brand-dark border border-slate-200 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3 text-slate-500" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({ isOpen: true, serviceId: srv.id });
                                }}
                                className="px-2.5 py-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3 text-slate-500 hover:text-rose-600" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CERTIFICATIONS */}
          {activeTab === 'certs' && (
            <div className="space-y-4">
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Industry Credentials & Certifications</span>
              
              <div className="space-y-3 text-xs">
                {profile.highestEducation && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900">Highest Level of Education</span>
                        {/* Verified badge with info icon */}
                        <div className="relative inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-150">
                          <Check className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                          <span>Verified</span>
                          <button 
                            type="button" 
                            className="text-emerald-500 hover:text-emerald-700 focus:outline-none ml-0.5 cursor-pointer flex items-center"
                            onClick={() => {
                              triggerSound('click');
                              setShowEduTooltip(!showEduTooltip);
                            }}
                            onMouseEnter={() => setShowEduTooltip(true)}
                            onMouseLeave={() => setShowEduTooltip(false)}
                          >
                            <Info className="w-3 h-3 text-emerald-500" />
                          </button>
                          
                          {/* Tooltip content bubble */}
                          {showEduTooltip && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-lg z-50 font-medium normal-case leading-normal">
                              <div className="font-black text-emerald-400 mb-1 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 fill-emerald-500 text-slate-900" />
                                Credentials Verified
                              </div>
                              Our verification partner checks student registration records, National ID databases, and university registers to confirm this academic qualification.
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-800 block mt-1">{profile.highestEducation}</span>
                      {profile.university || profile.college || profile.tradeSchool ? (
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          {profile.university || profile.college || profile.tradeSchool}
                          {profile.graduationYear ? ` (Graduated: ${profile.graduationYear})` : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {profile.category_id === 'plumbing' || doerId === 'doer-1' ? (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-dark flex items-center justify-center border border-brand/20">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block">PIRB Licensed Gas & Geyser Installer</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Plumbing Industry Registration Board (Reg: PIRB-991204)</span>
                      <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider block mt-1.5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Valid & Verified Registry COC Provider
                      </span>
                    </div>
                  </div>
                ) : null}

                {profile.category_id === 'tutoring' || doerId === 'doer-3' ? (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block">BSc (Hons) Pure Mathematics & Physics</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">University of the Witwatersrand, Johannesburg</span>
                      <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider block mt-1.5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Degree Transcript Verified
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Default General Certification */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block">DOER Safety-Screened Certification</span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">DOER Security & Identity Verification Office</span>
                    <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider block mt-1.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Background-check cleared
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACT */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Secure Communication Portal</span>
              
              <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-4 text-xs font-semibold">
                <div className="flex gap-3.5 items-center">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand-dark border border-brand/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block">Encrypted Contact System</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">DOER protects your private details until escrow deposit payment completes.</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-bold flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" /> WhatsApp / Call
                    </span>
                    <span className="text-slate-800 font-black bg-white px-2.5 py-1 rounded border border-slate-150">
                      +27 {isOwnProfile ? currentUser.phoneNumber : '•• ••• ••••'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-bold flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" /> Direct Email
                    </span>
                    <span className="text-slate-800 font-black bg-white px-2.5 py-1 rounded border border-slate-150">
                      {isOwnProfile ? currentUser.email : '••••••••@gmail.com'}
                    </span>
                  </div>
                </div>

                {!isOwnProfile && (
                  <button
                    onClick={handleInitiateChat}
                    className="w-full py-3 bg-zinc-900 text-white hover:bg-zinc-950 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all mt-3"
                  >
                    <MessageSquare className="w-4 h-4 text-brand fill-brand/20" /> Open Secure Chat Room with Doer
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>

      {/* --- PREMIUM LIGHTBOX FULLSCREEN IMAGE VIEWER (AIRBNB STYLE SWIPABLE INTERFACES) --- */}
      <AnimatePresence>
        {activeLightboxProject && (
          <div className="fixed inset-0 z-[100] bg-zinc-950/95 flex flex-col justify-between text-left">
            {/* Lightbox Header */}
            <div className="p-6 flex justify-between items-center text-white select-none z-10">
              <div>
                <span className="text-[10px] font-black uppercase text-brand tracking-widest block">PORTFOLIO PROJECT GALLERY</span>
                <h3 className="font-black text-sm md:text-base tracking-tight mt-0.5">{activeLightboxProject.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <button
                  onClick={() => {
                    triggerSound('click');
                    setZoomLevel(prev => Math.min(prev + 0.5, 3));
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    triggerSound('click');
                    setZoomLevel(prev => Math.max(prev - 0.5, 1));
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveLightboxProject(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Main Swiper Stage */}
            <div className="flex-1 flex items-center justify-between px-4 relative">
              {/* Left Navigation */}
              <button
                onClick={handlePrevImage}
                className="absolute left-6 z-10 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all backdrop-blur-md"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Central Focused Image */}
              <div className="w-full max-w-2xl mx-auto h-[55vh] flex flex-col justify-center items-center relative p-4 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentLightboxIndex}
                    src={lightboxImages[currentLightboxIndex]?.imageUrl}
                    alt={lightboxImages[currentLightboxIndex]?.caption}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: zoomLevel }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    drag={zoomLevel === 1 ? 'x' : true}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={zoomLevel === 1 ? 0.4 : 0.1}
                    onDragEnd={(e, info) => {
                      if (zoomLevel === 1) {
                        if (info.offset.x < -60) {
                          handleNextImage(e as any);
                        } else if (info.offset.x > 60) {
                          handlePrevImage(e as any);
                        }
                      }
                    }}
                    onDoubleClick={() => {
                      triggerSound('click');
                      setZoomLevel(prev => prev === 1 ? 2 : 1);
                    }}
                    className="max-h-[45vh] max-w-full rounded-2xl object-contain shadow-2xl cursor-grab active:cursor-grabbing select-none"
                  />
                </AnimatePresence>
                
                {/* Image Caption & sort counter */}
                <div className="text-center mt-4 text-xs font-semibold text-slate-300 max-w-md select-none z-10">
                  <p className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 inline-block text-[11px] leading-relaxed">
                    {lightboxImages[currentLightboxIndex]?.caption || 'Work Gallery Photo'}
                  </p>
                  <span className="block mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Swipe or Double-Tap to Zoom • Image {currentLightboxIndex + 1} of {lightboxImages.length}
                  </span>
                </div>
              </div>

              {/* Right Navigation */}
              <button
                onClick={handleNextImage}
                className="absolute right-6 z-10 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all backdrop-blur-md"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* --- IMMERSIVE INTERACTIVE GALLERY THUMBS LIST --- */}
            <div className="px-6 py-2 bg-zinc-950 border-t border-zinc-900/60 overflow-x-auto scrollbar-none flex justify-center gap-2 select-none z-10">
              {lightboxImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => {
                    triggerSound('click');
                    setCurrentLightboxIndex(idx);
                  }}
                  className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    currentLightboxIndex === idx ? 'border-brand scale-105 shadow-md shadow-brand/10' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Lightbox Bottom description panel */}
            <div className="p-6 bg-zinc-900 border-t border-zinc-800 text-xs">
              <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-300">
                <div className="space-y-1 sm:max-w-xl">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">PROJECT NARRATIVE</span>
                  <p className="font-semibold text-slate-300 leading-relaxed">
                    {activeLightboxProject.description}
                  </p>
                  {activeLightboxProject.clientFeedback && (
                    <p className="text-[10px] text-brand font-medium italic border-l-2 border-brand pl-2.5 mt-1.5">
                      Client feedback: "{activeLightboxProject.clientFeedback}"
                    </p>
                  )}
                </div>
                
                <div className="flex-shrink-0 flex gap-2 w-full md:w-auto">
                  {activeLightboxProject.isVerified && (
                    <span className="bg-emerald-950 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-900/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Proof
                    </span>
                  )}
                  
                  <span className="bg-zinc-800 text-slate-300 px-3 py-1.5 rounded-xl border border-zinc-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> {activeLightboxProject.views} Views
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {(isServiceModalOpen || editingService) && (
        <PostServiceModal
          isOpen={isServiceModalOpen || !!editingService}
          onClose={() => {
            setIsServiceModalOpen(false);
            setEditingService(null);
          }}
          editingService={editingService || undefined}
        />
      )}

      {/* --- CONFIRMATION MODAL --- */}
      {deleteConfirm.isOpen && (
        <ConfirmationModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, serviceId: null })}
          onConfirm={() => {
            if (deleteConfirm.serviceId) {
              triggerSound('click');
              deleteService(deleteConfirm.serviceId);
            }
          }}
          title="Delete Service"
          message="Are you sure you want to permanently delete this service? This action cannot be undone."
        />
      )}

      <AnimatePresence>
        {viewingImage && (
          <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4">
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 text-white p-2">
              <X className="w-8 h-8" />
            </button>
            <img src={viewingImage} alt="Fullscreen View" className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
