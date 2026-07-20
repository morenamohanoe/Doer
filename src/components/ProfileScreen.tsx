/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  ShieldCheck,
  Award,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  MapPin,
  Check,
  ChevronRight,
  Building,
  CreditCard,
  Phone,
  Mail,
  Flame,
  ChevronDown,
  Sparkles,
  LogOut,
  Camera,
  X,
  Calendar,
  Briefcase,
  GraduationCap,
  Coins,
  Video,
  ExternalLink,
  Smile,
  Star,
  FileText,
  History,
  QrCode
} from 'lucide-react';
import DoerProfileModal from './DoerProfileModal';
import PullToRefresh from './PullToRefresh';
import PostServiceModal from './PostServiceModal';
import { signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import PortfolioGalleryWithLightbox from './PortfolioGalleryWithLightbox';
import VerificationDetailsModal from './VerificationDetailsModal';
import DynamicPricingCalculator from './DynamicPricingCalculator';
import ProfileQRCodeModal from './ProfileQRCodeModal';

export default function ProfileScreen() {
  const {
    currentUser,
    roleProfiles,
    activeRole,
    wallet,
    requestWithdrawal,
    submitVerification,
    verificationRequests,
    roleProgressions,
    resetAllData,
    triggerSound,
    savedItems,
    toggleSaveItem,
    isSavedItem,
    services,
    products,
    showToast,
    updateUserAvatar,
    reviews,
    portfolioProjects,
    serviceRequests
  } = useApp();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('First National Bank (FNB)');
  const [accountNum, setAccountNum] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [showMyPortfolio, setShowMyPortfolio] = useState(false);
  const [focusedSavedDoerId, setFocusedSavedDoerId] = useState<string | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  // States for manual credential verification
  const [credName, setCredName] = useState('');
  const [credIssuer, setCredIssuer] = useState('');
  const [credNumber, setCredNumber] = useState('');
  const [credFileName, setCredFileName] = useState('');
  const [isSubmittingCred, setIsSubmittingCred] = useState(false);
  const [showCredForm, setShowCredForm] = useState(false);

  useEffect(() => {
    const history = localStorage.getItem('scan_history');
    if (history) {
      try {
        setScanHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to parse scan history');
      }
    }
  }, []);

  const clearHistory = () => {
    triggerSound('click');
    localStorage.removeItem('scan_history');
    setScanHistory([]);
    showToast('Scan history cleared');
  };

  const handleRequestCredentialVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credName || !credIssuer) {
      showToast('Please specify the qualification name and issuing body', 'warning');
      return;
    }
    setIsSubmittingCred(true);
    triggerSound('success');
    
    try {
      const docRef = doc(db, 'users', currentUser.id);
      const newCred = {
        name: credName,
        issuer: credIssuer,
        number: credNumber || 'N/A',
        fileName: credFileName || 'qualification_certificate.pdf',
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, {
        submittedCredentials: newCred,
        credentialsVerified: false
      });
      
      showToast('Credentials submitted for manual verification!', 'success');
      setShowCredForm(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to submit credentials', 'error');
    } finally {
      setIsSubmittingCred(false);
    }
  };

  const handleSimulateAdminApproval = async () => {
    triggerSound('success');
    try {
      const docRef = doc(db, 'users', currentUser.id);
      
      await updateDoc(docRef, {
        'submittedCredentials.status': 'approved',
        credentialsVerified: true,
        verificationStatus: 'credentials_verified'
      });
      
      showToast('Credentials manually approved! Verified Badge unlocked 🛡️', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to approve credentials', 'error');
    }
  };

  // Find active profile
  const profile = roleProfiles.find((p) => p.role === activeRole && (p.userId === currentUser?.uid || p.userId === currentUser?.id)) || roleProfiles.find((p) => p.userId === currentUser?.uid || p.userId === currentUser?.id) || roleProfiles[0];

  // Fetch reviews for this Doer
  const doerReviews = reviews.filter((r) => r.targetId === profile?.id || r.targetId === profile?.userId);
  const dynamicReviewCount = doerReviews.length;
  const dynamicAverageRating = dynamicReviewCount > 0 
    ? (doerReviews.reduce((acc, curr) => acc + curr.rating, 0) / dynamicReviewCount).toFixed(1)
    : (profile?.rating || 0).toFixed(1);

  // Fetch portfolio projects for this Doer
  const doerProjects = portfolioProjects.filter((p) => p.userId === profile?.id || p.userId === profile?.userId);

  // Dynamic Completed Jobs and Trust Score
  const dynamicCompletedJobsCount = serviceRequests.filter(
    (r) => (r.doerId === profile?.id || r.doerId === profile?.userId) && r.status === 'released' && !r.isProductOrder
  ).length;

  const dynamicTotalJobsRequested = serviceRequests.filter(
    (r) => (r.doerId === profile?.id || r.doerId === profile?.userId) && !r.isProductOrder
  ).length;

  const dynamicSalesCount = serviceRequests.filter(
    (r) => (r.doerId === profile?.id || r.doerId === profile?.userId) && r.status === 'released' && r.isProductOrder
  ).length;

  const finalCompletedJobs = Math.max(profile?.completedJobsCount || 0, dynamicCompletedJobsCount);

  const dynamicCompletionRate = dynamicTotalJobsRequested > 0
    ? Math.round((dynamicCompletedJobsCount / dynamicTotalJobsRequested) * 100)
    : (profile?.completionRate || 100);

  // Real-time Trust Score Calculation
  const dynamicTrustScore = (() => {
    // 1. Verification (Max 30)
    let verificationScore = profile?.trustScore?.verificationScore || 10;
    const isIdVerified = currentUser?.verificationStatus === 'identity_verified' || currentUser?.verificationStatus === 'business_verified';
    const isBizVerified = currentUser?.verificationStatus === 'business_verified';
    verificationScore = 10; // phone is always true for registered users
    if (isIdVerified) verificationScore += 15;
    if (isBizVerified) verificationScore += 5;

    // 2. Reputation (Max 30)
    let reputationScore = 15;
    if (dynamicReviewCount > 0) {
      reputationScore = Math.round((Number(dynamicAverageRating) / 5) * 30);
    } else if (profile?.trustScore?.reputationScore) {
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
      level,
      verificationScore,
      reputationScore,
      reliabilityScore,
      activityScore
    };
  })();

  const [isEditing, setIsEditing] = useState(false);
  
  const [editFields, setEditFields] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phone: currentUser?.phoneNumber || '',
    location: currentUser?.location || '',
    customProfileUrl: currentUser?.avatarUrl || '',
    customCoverUrl: profile?.coverImageUrl || '',
    linkedInUrl: profile?.linkedInUrl || '',
    githubUrl: profile?.githubUrl || '',
    websiteUrl: profile?.websiteUrl || '',
    facebookUrl: profile?.facebookUrl || '',
    instagramUrl: profile?.instagramUrl || '',
    tiktokUrl: profile?.tiktokUrl || '',
    xUrl: profile?.xUrl || '',
    youtubeUrl: profile?.youtubeUrl || '',
    
    // New fields
    dateOfBirth: currentUser?.dateOfBirth || '',
    gender: currentUser?.gender || profile?.gender || '',
    verificationStatus: currentUser?.verificationStatus || 'unverified',
    bio: profile?.bio || '',
    categories: profile?.categories?.join(', ') || '',
    highestEducation: profile?.highestEducation || profile?.education || '',
    hourlyRate: profile?.hourlyRate || 150,
    languages: profile?.languages?.join(', ') || '',
    occupation: profile?.occupation || '',
    portfolioVideos: profile?.portfolioVideos?.join(', ') || '',
    projectLinks: profile?.projectLinks?.join(', ') || '',
    servicesOffered: profile?.servicesOffered?.join(', ') || '',
    skills: profile?.skills?.join(', ') || '',
  });


  const [editUseCustomCoverUrl, setEditUseCustomCoverUrl] = useState(!!profile?.coverImageUrl);
  const [savingProfile, setSavingProfile] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [cropModalData, setCropModalData] = useState<{ isOpen: boolean; imageSrc: string; type: 'profile' | 'cover', aspectRatio: number }>({ isOpen: false, imageSrc: '', type: 'profile', aspectRatio: 1 });
  const [isProcessingMedia, setIsProcessingMedia] = useState({ profile: false, cover: false });

  // Sync edits when context loads
  React.useEffect(() => {
    if (currentUser) {
      setEditFields(prev => ({
        ...prev,
        firstName: currentUser.firstName || prev.firstName,
        lastName: currentUser.lastName || prev.lastName,
        phone: currentUser.phoneNumber || prev.phone,
        location: currentUser.location || (currentUser.city ? (currentUser.province ? `${currentUser.city}, ${currentUser.province}` : currentUser.city) : currentUser.province) || prev.location,
        customProfileUrl: currentUser.avatarUrl || prev.customProfileUrl,
        dateOfBirth: currentUser.dateOfBirth || prev.dateOfBirth || '',
        gender: currentUser.gender || prev.gender || '',
        verificationStatus: currentUser.verificationStatus || prev.verificationStatus || 'unverified',
      }));
    }
    if (profile) {
      setEditFields(prev => ({
        ...prev,
        customCoverUrl: profile.coverImageUrl || prev.customCoverUrl,
        linkedInUrl: profile.linkedInUrl || prev.linkedInUrl,
        githubUrl: profile.githubUrl || prev.githubUrl,
        websiteUrl: profile.websiteUrl || prev.websiteUrl,
        facebookUrl: profile.facebookUrl || prev.facebookUrl,
        instagramUrl: profile.instagramUrl || prev.instagramUrl,
        tiktokUrl: profile.tiktokUrl || prev.tiktokUrl,
        xUrl: profile.xUrl || prev.xUrl,
        youtubeUrl: profile.youtubeUrl || prev.youtubeUrl,
        bio: profile.bio || prev.bio || '',
        categories: profile.categories?.join(', ') || prev.categories || '',
        highestEducation: profile.highestEducation || profile.education || prev.highestEducation || '',
        hourlyRate: profile.hourlyRate || prev.hourlyRate || 150,
        languages: profile.languages?.join(', ') || prev.languages || '',
        occupation: profile.occupation || prev.occupation || '',
        portfolioVideos: profile.portfolioVideos?.join(', ') || prev.portfolioVideos || '',
        projectLinks: profile.projectLinks?.join(', ') || prev.projectLinks || '',
        servicesOffered: profile.servicesOffered?.join(', ') || prev.servicesOffered || '',
        skills: profile.skills?.join(', ') || prev.skills || '',
      }));
      if (profile.coverImageUrl) {
        setEditUseCustomCoverUrl(true);
      }
    }
  }, [currentUser, profile]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  const isUrlValid = (url: string) => {
    return url.trim().startsWith('http://') || url.trim().startsWith('https://') || url.trim().startsWith('data:image/');
  };

  const handleSaveProfile = async () => {
    if (!editFields.firstName.trim() || !editFields.lastName.trim() || !editFields.phone.trim()) {
      showToast('First Name, Last Name, and Phone are required.', 'error');
      return;
    }

    if (editFields.customProfileUrl.trim() && !isUrlValid(editFields.customProfileUrl)) {
      showToast('Custom Profile Image URL must start with http:// or https://', 'error');
      return;
    }
    if (editUseCustomCoverUrl && editFields.customCoverUrl.trim() && !isUrlValid(editFields.customCoverUrl)) {
      showToast('Custom Cover Image URL must start with http:// or https://', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      let avatarUrl = editFields.customProfileUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80';
      let coverImageUrl = editUseCustomCoverUrl && isUrlValid(editFields.customCoverUrl) ? editFields.customCoverUrl.trim() : '';

      if (editFields.customProfileUrl.startsWith('data:image/')) {
        const oldUrl = currentUser.avatarUrl;
        if (oldUrl && oldUrl.includes('firebasestorage.googleapis.com')) {
        }
      }

      if (editUseCustomCoverUrl && editFields.customCoverUrl.startsWith('data:image/')) {
        const oldUrl = profile?.coverImageUrl;
        if (oldUrl && oldUrl.includes('firebasestorage.googleapis.com')) {
        }
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const cleanedUserFields: Record<string, any> = {
        firstName: editFields.firstName.trim(),
        lastName: editFields.lastName.trim(),
        phoneNumber: editFields.phone.trim(),
        phone: deleteField(),
        location: editFields.location.trim(),
        avatarUrl,
        profileImageUrl: deleteField(),
        dateOfBirth: editFields.dateOfBirth.trim() || deleteField(),
        gender: editFields.gender.trim() || deleteField(),
        verificationStatus: editFields.verificationStatus,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userRef, cleanedUserFields);

      // If activeRole is doer, update the doer profile too
      if (activeRole === 'doer') {
        const doerRef = doc(db, 'doer_profiles', currentUser.uid);
        const cleanedDoerFields: Record<string, any> = {
          displayName: `${editFields.firstName.trim()} ${editFields.lastName.trim()}`,
          avatarUrl,
          linkedInUrl: editFields.linkedInUrl.trim() || deleteField(),
          githubUrl: editFields.githubUrl.trim() || deleteField(),
          websiteUrl: editFields.websiteUrl.trim() || deleteField(),
          facebookUrl: editFields.facebookUrl.trim() || deleteField(),
          instagramUrl: editFields.instagramUrl.trim() || deleteField(),
          tiktokUrl: editFields.tiktokUrl.trim() || deleteField(),
          xUrl: editFields.xUrl.trim() || deleteField(),
          youtubeUrl: editFields.youtubeUrl.trim() || deleteField(),
          
          // Professional profile fields
          bio: editFields.bio.trim() || deleteField(),
          occupation: editFields.occupation.trim() || deleteField(),
          highestEducation: editFields.highestEducation.trim() || deleteField(),
          hourlyRate: Number(editFields.hourlyRate) || 0,
          gender: editFields.gender.trim() || deleteField(),
          skills: editFields.skills.split(',').map((s) => s.trim()).filter(Boolean),
          languages: editFields.languages.split(',').map((s) => s.trim()).filter(Boolean),
          categories: editFields.categories.split(',').map((s) => s.trim()).filter(Boolean),
          servicesOffered: editFields.servicesOffered.split(',').map((s) => s.trim()).filter(Boolean),
          portfolioVideos: editFields.portfolioVideos.split(',').map((s) => s.trim()).filter(Boolean),
          projectLinks: editFields.projectLinks.split(',').map((s) => s.trim()).filter(Boolean),
          
          updatedAt: new Date().toISOString()
        };

        if (avatarUrl && avatarUrl !== 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80') {
          cleanedDoerFields.profileImageUrl = avatarUrl;
        } else {
          cleanedDoerFields.profileImageUrl = deleteField();
        }

        if (coverImageUrl) {
          cleanedDoerFields.coverImageUrl = coverImageUrl;
        } else {
          cleanedDoerFields.coverImageUrl = deleteField();
        }

        await updateDoc(doerRef, cleanedDoerFields);
      }

      showToast('Profile and professional details updated successfully!', 'success');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      showToast(err.message || 'Failed to update profile.', 'error');
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setSavingProfile(false);
    }
  };
  const trust = dynamicTrustScore;

  const activeProg = roleProgressions.find((p) => p.role === 'doer');

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      setWithdrawMessage('Please enter a valid numeric amount to withdraw.');
      return;
    }
    if (!accountNum.trim()) {
      setWithdrawMessage('Please provide your South African bank account number.');
      return;
    }

    setWithdrawing(true);
    setTimeout(() => {
      const success = requestWithdrawal(Number(withdrawAmount), bankName, accountNum);
      setWithdrawing(false);
      if (success) {
        setWithdrawMessage(`Withdrawal of R${withdrawAmount} queued successfully!`);
        setWithdrawAmount('');
        setAccountNum('');
      } else {
        setWithdrawMessage('Withdrawal failed. Check if you have enough funds.');
      }
    }, 1500);
  };

  const isIdentitySubmitted = verificationRequests.some((r) => r.type === 'identity');
  const isIdentityApproved = currentUser.verificationStatus === 'identity_verified' || currentUser.verificationStatus === 'business_verified';
  const isBusinessSubmitted = verificationRequests.some((r) => r.type === 'business');
  const isBusinessApproved = currentUser.verificationStatus === 'business_verified';

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden text-left" id="profile-root">
      <PullToRefresh onRefresh={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }}>
        <div className="pb-24 px-6 pt-6 space-y-6">
      
      {/* 👤 CORE PROFILE DETAILS */}
      {/* 👤 CORE PROFILE DETAILS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden flex flex-col">
        {/* Cover Banner Display */}
        <div className="h-24 w-full bg-slate-100 relative overflow-hidden border-b border-slate-100 group">
          {profile?.coverImageUrl ? (
            <img onClick={() => !isEditing && setViewingImage(profile.coverImageUrl)} src={profile.coverImageUrl} alt="Cover Banner" className={`w-full h-full object-cover ${!isEditing ? 'cursor-pointer' : ''}`} />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-950 flex items-center justify-center text-slate-400 text-[9px] uppercase tracking-wider font-extrabold">
              Standard Banner Active
            </div>
          )}
          
        </div>

        <div className="p-5">
          <div className="flex items-center gap-4 -mt-10 relative z-10">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-white relative">
                <img onClick={() => !isEditing && setViewingImage(currentUser.avatarUrl)} src={currentUser.avatarUrl} alt="Avatar" className={`w-full h-full object-cover ${!isEditing ? 'cursor-pointer' : ''}`} />
                
              </div>
            </div>
            <div className="pt-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-base">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                
                {/* Clickable dedicated verified badge */}
                <button
                  onClick={() => {
                    triggerSound('click');
                    setIsVerificationModalOpen(true);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 border ${
                    currentUser.verificationStatus === 'credentials_verified' || currentUser.credentialsVerified
                      ? 'bg-emerald-600 text-white border-emerald-750 shadow-xs font-black'
                      : currentUser.verificationStatus === 'business_verified'
                      ? 'bg-purple-100/70 border-purple-300 text-purple-700 shadow-sm'
                      : currentUser.verificationStatus === 'identity_verified'
                      ? 'bg-emerald-100/70 border-emerald-300 text-emerald-700 shadow-sm'
                      : currentUser.verificationStatus === 'phone_verified'
                      ? 'bg-blue-100/70 border-blue-300 text-blue-700 shadow-sm'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                  title="Click to view Verification Details & Requirements"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${
                    currentUser.verificationStatus === 'credentials_verified' || currentUser.credentialsVerified ? 'text-white' : currentUser.verificationStatus === 'business_verified' ? 'text-purple-700' : currentUser.verificationStatus === 'identity_verified' ? 'text-emerald-700' : currentUser.verificationStatus === 'phone_verified' ? 'text-blue-700' : 'text-slate-400'
                  }`} />
                  <span>
                    {currentUser.verificationStatus === 'credentials_verified' || currentUser.credentialsVerified
                      ? 'Verified Artisan'
                      : currentUser.verificationStatus === 'business_verified'
                      ? 'Business Verified'
                      : currentUser.verificationStatus === 'identity_verified'
                      ? 'ID Verified'
                      : currentUser.verificationStatus === 'phone_verified'
                      ? 'Phone Verified'
                      : 'Unverified Provider'}
                  </span>
                </button>
              </div>
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-brand" /> {currentUser.location || (currentUser.city ? (currentUser.province ? `${currentUser.city}, ${currentUser.province}` : currentUser.city) : currentUser.province) || 'Johannesburg'}
              </span>
            </div>
          </div>

          {/* Contact & Personal info read-only */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-[11px] text-slate-600">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-400 text-[9px]">Contact & Personal Details</h4>
            <div className="space-y-2 font-semibold">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50/60 gap-2">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-400">Phone:</span>
                </span>
                <span className="text-slate-700 font-bold truncate">
                  {currentUser.phoneNumber ? (currentUser.phoneNumber.startsWith('+27') || currentUser.phoneNumber.startsWith('27') ? (currentUser.phoneNumber.startsWith('+') ? currentUser.phoneNumber : `+${currentUser.phoneNumber}`) : `+27 ${currentUser.phoneNumber.replace(/^0/, '')}`) : 'Not Specified'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50/60 gap-2">
                <span className="flex items-center gap-1.5 text-slate-400 flex-shrink-0 min-w-[14px] font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-400">Email:</span>
                </span>
                <span className="text-slate-700 font-bold break-all text-right max-w-[180px] sm:max-w-[240px]" title={currentUser.email}>
                  {currentUser.email}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50/60 gap-2">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-400">DOB:</span>
                </span>
                <span className="text-slate-700 font-bold">
                  {currentUser.dateOfBirth || 'Not Specified'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50/60 gap-2">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Smile className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-400">Gender:</span>
                </span>
                <span className="text-slate-700 font-bold">
                  {currentUser.gender || 'Not Specified'}
                </span>
              </div>
            </div>
            
            {/* Verification Status Banner Badge */}
            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
              <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">Verification Status</span>
              <button
                onClick={() => {
                  triggerSound('click');
                  setIsVerificationModalOpen(true);
                }}
                className="hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center"
                title="Click for Verification Details"
              >
                {currentUser.credentialsVerified && (
                  <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[9px] font-black border border-emerald-700 flex items-center gap-1 uppercase tracking-wider shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-white fill-white/10" /> Verified Artisan
                  </span>
                )}
                {!currentUser.credentialsVerified && currentUser.verificationStatus === 'business_verified' && (
                  <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-[9px] font-black border border-purple-150 flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-purple-700 fill-purple-100" /> Business Verified
                  </span>
                )}
                {!currentUser.credentialsVerified && currentUser.verificationStatus === 'identity_verified' && (
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black border border-emerald-150 flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-emerald-700 fill-emerald-100" /> Identity Verified
                  </span>
                )}
                {!currentUser.credentialsVerified && currentUser.verificationStatus === 'phone_verified' && (
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[9px] font-black border border-blue-150 flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-blue-700 fill-blue-100" /> Phone Verified
                  </span>
                )}
                {!currentUser.credentialsVerified && (!currentUser.verificationStatus || currentUser.verificationStatus === 'unverified') && (
                  <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full text-[9px] font-black border border-slate-200 flex items-center gap-1 uppercase tracking-wider">
                    Unverified
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Edit Profile Toggle */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => {
                triggerSound('click');
                setIsEditing(!isEditing);
              }}
              className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-200 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" /> {isEditing ? 'Close Editor' : 'Edit Profile'}
            </button>
            <button
              onClick={() => {
                triggerSound('click');
                setIsQRModalOpen(true);
              }}
              className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-200 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-500"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg> Share QR Code
            </button>
          </div>

          {/* Collapsible Profile & Media Editor Form */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-slate-150 space-y-4"
            >
              <div className="space-y-3">
                 <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                   Visual Identity Editor
                 </h4>

                 {savingProfile && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="bg-brand/10 border border-brand/20 rounded-lg p-2 flex items-center gap-3 overflow-hidden"
                   >
                     <div className="flex-1">
                       <div className="flex justify-between items-center mb-1">
                         <span className="text-[9px] font-black uppercase text-brand">Uploading to cloud</span>
                         <span className="text-[9px] font-bold text-slate-500 animate-pulse">Wait a moment...</span>
                       </div>
                       <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ x: '-100%' }}
                           animate={{ x: '100%' }}
                           transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                           className="h-full w-1/2 bg-brand"
                         />
                       </div>
                     </div>
                   </motion.div>
                 )}

                 {/* Edit Live Preview Card */}
                 <div className="relative w-full h-24 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                   {editFields.customCoverUrl && isUrlValid(editFields.customCoverUrl) ? (
                     <img src={editFields.customCoverUrl.trim()} alt="Cover Preview" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-950 flex items-center justify-center text-slate-400 text-[8px] uppercase tracking-wider font-bold">
                       Standard banner preview
                     </div>
                   )}
                   
                   {isProcessingMedia.cover && (
                     <motion.div 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center backdrop-blur-[1px] z-10"
                     >
                       <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mb-1" />
                       <span className="text-[7px] font-black text-white uppercase tracking-widest">Processing Cover</span>
                     </motion.div>
                   )}
 
                   <div className="absolute bottom-1.5 left-3 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-white z-20">
                     <img
                       src={editFields.customProfileUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80'}
                       alt="Profile Preview"
                       className="w-full h-full object-cover"
                     />
                     {isProcessingMedia.profile && (
                       <div className="absolute inset-0 bg-brand/40 flex items-center justify-center">
                         <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       </div>
                     )}
                   </div>
                 </div>

                {/* Media URL Inputs */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">
                      Profile Image URL
                    </span>
                    <input
                      type="text"
                      name="customProfileUrl"
                      placeholder="https://images.unsplash.com/... profile link"
                      value={editFields.customProfileUrl}
                      onChange={handleEditChange}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">
                      Cover Image URL
                    </span>
                    <div className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editUseCustomCoverUrl}
                        onChange={(e) => setEditUseCustomCoverUrl(e.target.checked)}
                        className="w-3.5 h-3.5 text-brand rounded border-slate-300 focus:ring-brand"
                      />
                      <span className="text-[10px] font-bold text-slate-700">Enable Custom Cover</span>
                    </div>
                    {editUseCustomCoverUrl && (
                      <input
                        type="text"
                        name="customCoverUrl"
                        placeholder="https://images.unsplash.com/... cover link"
                        value={editFields.customCoverUrl}
                        onChange={handleEditChange}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Account details edits */}
                {/* Account details edits */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Contact & Personal Info
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">First Name</label>
                      <input type="text" name="firstName" value={editFields.firstName} onChange={handleEditChange} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Last Name</label>
                      <input type="text" name="lastName" value={editFields.lastName} onChange={handleEditChange} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Phone</label>
                      <input type="text" name="phone" value={editFields.phone} onChange={handleEditChange} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Location</label>
                      <input type="text" name="location" value={editFields.location} onChange={handleEditChange} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={editFields.dateOfBirth} onChange={handleEditChange} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Gender</label>
                      <select name="gender" value={editFields.gender} onChange={handleEditChange} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Verification Status</label>
                    <select name="verificationStatus" value={editFields.verificationStatus} onChange={handleEditChange} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold">
                      <option value="unverified">Unverified</option>
                      <option value="phone_verified">Phone Verified</option>
                      <option value="identity_verified">Identity Verified</option>
                      <option value="business_verified">Business Verified</option>
                    </select>
                  </div>
                </div>

                {/* Doer Professional Profile info edits */}
                {activeRole === 'doer' && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Doer Professional Profile Details
                    </h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Bio / Introduction</label>
                      <textarea name="bio" value={editFields.bio} onChange={handleEditChange} rows={3} placeholder="Tell clients about yourself, your background, and your dedication..." className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Occupation</label>
                        <input type="text" name="occupation" value={editFields.occupation} onChange={handleEditChange} placeholder="e.g. Electrician, Carpenter, Developer" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Highest Education</label>
                        <input type="text" name="highestEducation" value={editFields.highestEducation} onChange={handleEditChange} placeholder="e.g. BSc in Computer Science, N6 Diploma" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Hourly Rate (ZAR)</label>
                      <input type="number" name="hourlyRate" value={editFields.hourlyRate} onChange={handleEditChange} placeholder="e.g. 150" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    
                    {/* Dynamic Pricing Calculator to help estimate quote ranges */}
                    <div className="pt-1">
                      <DynamicPricingCalculator hourlyRate={Number(editFields.hourlyRate)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Categories</label>
                      <span className="text-[8px] text-slate-400 font-medium block -mt-1 mb-1">Separate categories with commas (e.g. Home Services, Repair, Design)</span>
                      <input type="text" name="categories" value={editFields.categories} onChange={handleEditChange} placeholder="Home Services, Repair, Design" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Skills</label>
                      <span className="text-[8px] text-slate-400 font-medium block -mt-1 mb-1">Separate skills with commas (e.g. Carpentry, Welding, Plumbing)</span>
                      <input type="text" name="skills" value={editFields.skills} onChange={handleEditChange} placeholder="Carpentry, Plumbing, Wiring" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Languages Spoken</label>
                      <span className="text-[8px] text-slate-400 font-medium block -mt-1 mb-1">Separate languages with commas (e.g. English, Zulu, Afrikaans)</span>
                      <input type="text" name="languages" value={editFields.languages} onChange={handleEditChange} placeholder="English, Zulu, Sotho" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Services Offered</label>
                      <span className="text-[8px] text-slate-400 font-medium block -mt-1 mb-1">Separate services with commas (e.g. Leak fixing, Paint job)</span>
                      <input type="text" name="servicesOffered" value={editFields.servicesOffered} onChange={handleEditChange} placeholder="Leak repair, Cabinet installation" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Portfolio Videos</label>
                      <span className="text-[8px] text-slate-400 font-medium block -mt-1 mb-1">Separate YouTube/Vimeo video links with commas</span>
                      <input type="text" name="portfolioVideos" value={editFields.portfolioVideos} onChange={handleEditChange} placeholder="https://youtube.com/watch?v=..., https://vimeo.com/..." className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Project Links / Case Studies</label>
                      <span className="text-[8px] text-slate-400 font-medium block -mt-1 mb-1">Separate website/GitHub links with commas</span>
                      <input type="text" name="projectLinks" value={editFields.projectLinks} onChange={handleEditChange} placeholder="https://github.com/my-project, https://myportfolio.com/project-1" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold" />
                    </div>
                  </div>
                )}

                {/* Social media URLs edits */}
                {activeRole === 'doer' && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Professional & Social Media Links
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">LinkedIn URL</label>
                        <input type="text" name="linkedInUrl" value={editFields.linkedInUrl} onChange={handleEditChange} placeholder="https://..." className="w-full p-2 border border-slate-200 rounded-lg text-[10px] font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">GitHub URL</label>
                        <input type="text" name="githubUrl" value={editFields.githubUrl} onChange={handleEditChange} placeholder="https://..." className="w-full p-2 border border-slate-200 rounded-lg text-[10px] font-semibold" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Website URL</label>
                        <input type="text" name="websiteUrl" value={editFields.websiteUrl} onChange={handleEditChange} placeholder="https://..." className="w-full p-2 border border-slate-200 rounded-lg text-[10px] font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">YouTube URL</label>
                        <input type="text" name="youtubeUrl" value={editFields.youtubeUrl} onChange={handleEditChange} placeholder="https://..." className="w-full p-2 border border-slate-200 rounded-lg text-[10px] font-semibold" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Save button */}
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={handleSaveProfile}
                  className="w-full mt-2 py-2.5 bg-brand text-brand-dark rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 💼 DOER PROFESSIONAL PROFILE DETAILS */}
      {activeRole === 'doer' && profile && (
        <motion.div
          className="bg-white p-5 geom-card border border-slate-100 shadow-xs space-y-4 hover:shadow-lg transition-all duration-300"
          whileHover={{
            scale: 1.02
          }}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-black text-slate-900 text-sm">Professional Profile</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your public professional details visible to clients</p>
            </div>
            {profile.hourlyRate > 0 && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-600" /> R{profile.hourlyRate}/hr
              </span>
            )}
          </div>

          {/* Bio / Description */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Biography</span>
            {profile.bio ? (
              <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50/30 p-3 rounded-xl border border-dashed border-slate-200">
                No bio added yet. Click 'Edit Profile' to write a professional introduction!
              </p>
            )}
          </div>

          {/* Occupation, Education, Gender, & Trust Score Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-400" /> Occupation
              </span>
              <span className="text-xs font-black text-slate-800 block">
                {profile.occupation || 'Not Specified'}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-slate-400" /> Highest Education
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-800 block">
                  {profile.highestEducation || profile.education || 'Not Specified'}
                </span>
                {(profile.highestEducation || profile.education) && (
                  <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-emerald-150 flex items-center gap-0.5" title="Academic qualifications are verified by our registration check partners.">
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Smile className="w-3 h-3 text-slate-400" /> Gender
              </span>
              <span className="text-xs font-black text-slate-800 block">
                {currentUser.gender || profile.gender || 'Not Specified'}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-brand" /> Trust Score
              </span>
              <span className="text-xs font-black text-slate-800 block">
                {trust.score}/100 ({trust.level})
              </span>
            </div>
          </div>

          {/* Lists / Tags sections */}
          <div className="space-y-3 pt-2">
            {/* Categories */}
            {profile.categories && profile.categories.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Service Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.categories.map((cat, idx) => (
                    <span key={idx} className="bg-brand-light text-brand-dark px-2.5 py-1 rounded-lg text-[10px] font-black border border-brand/20 uppercase tracking-wide">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Professional Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-slate-150">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Languages Spoken</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map((lang, idx) => (
                    <span key={idx} className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-amber-150">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services Offered */}
            {profile.servicesOffered && profile.servicesOffered.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Services Offered</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.servicesOffered.map((srv, idx) => (
                    <span key={idx} className="bg-blue-50/60 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-blue-150">
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Videos & Project Links Row */}
          {((profile.portfolioVideos && profile.portfolioVideos.length > 0) || (profile.projectLinks && profile.projectLinks.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              {/* Portfolio Videos */}
              {profile.portfolioVideos && profile.portfolioVideos.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Portfolio Videos</span>
                  <div className="space-y-1.5">
                    {profile.portfolioVideos.map((vid, idx) => (
                      <a
                        key={idx}
                        href={vid.startsWith('http') ? vid : `https://${vid}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl border border-slate-100 transition-colors"
                      >
                        <Video className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <span className="truncate flex-1">{vid}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Links */}
              {profile.projectLinks && profile.projectLinks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Project Links / Cases</span>
                  <div className="space-y-1.5">
                    {profile.projectLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl border border-slate-100 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-brand-dark flex-shrink-0" />
                        <span className="truncate flex-1">{link}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* 🎨 PORTFOLIO WORK GALLERY WITH EXPANDABLE LIGHTBOX */}
      {activeRole === 'doer' && (
        <PortfolioGalleryWithLightbox userId={profile?.id || 'my-doer-profile'} />
      )}

      {/* 📜 RECENT SCANS / HISTORY */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-brand" /> Recent Profile Scans
            </h4>
            <button 
              onClick={clearHistory}
              className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-tighter transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {scanHistory.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  triggerSound('click');
                  setFocusedSavedDoerId(item.id);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-black text-xs">
                    {item.name ? item.name.charAt(0) : '?'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-800">{item.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      Scanned {new Date(item.timestamp).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🏆 ROLE PROGRESSION & TRUST SCORE */}
      {activeRole === 'doer' && (
        <div className="space-y-4">
          {/* Progress Tracker */}
          {activeProg && (
            <motion.div
              className="bg-white p-5 geom-card border border-slate-100 shadow-xs hover:shadow-lg transition-all duration-300"
              whileHover={{
                scale: 1.02
              }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Progression Level</span>
                <span className="text-xs font-black text-zinc-900 flex items-center gap-1">
                  <Award className="w-4 h-4 text-brand" /> {activeProg.currentLevel}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${activeProg.progressPercent}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-bold mt-1.5 block">
                {activeProg.progressPercent === 100 ? 'Highest Rank Reached!' : 'Complete more jobs & boost Trust Score to rank up.'}
              </span>
            </motion.div>
          )}

          {/* Interactive Trust Score Details */}
          <motion.div
            className="bg-white p-5 geom-card border border-slate-100 shadow-xs space-y-4 hover:shadow-lg transition-all duration-300"
            whileHover={{
              scale: 1.02
            }}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div>
                <h4 className="font-black text-slate-900 text-sm">Trust Score Breakdown</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{trust.level}</span>
              </div>
              <motion.div
                className="h-11 w-11 bg-brand-light text-brand-dark font-black geom-card-sm flex items-center justify-center text-sm border border-brand/20 hover:shadow-lg transition-all duration-300"
                whileHover={{
                  scale: 1.02
                }}>
                {trust.score}
              </motion.div>
            </div>

            {/* Score sliders */}
            <div className="space-y-2 text-xs">
              {[
                { name: 'Verification Score', score: trust.verificationScore, max: 30, color: 'bg-emerald-500' },
                { name: 'Reputation Score (Ratings)', score: trust.reputationScore, max: 30, color: 'bg-brand' },
                { name: 'Reliability Score (Completion)', score: trust.reliabilityScore, max: 25, color: 'bg-violet-500' },
                { name: 'Activity Score (Volume)', score: trust.activityScore, max: 15, color: 'bg-orange-500' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-bold text-[10px]">
                    <span className="text-slate-500">{item.name}</span>
                    <span className="text-slate-800">
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.score / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* 🛡️ SECURITY VERIFICATION PORTAL */}
      <motion.div
        className="bg-white p-5 geom-card border border-slate-100 shadow-xs space-y-3.5 hover:shadow-lg transition-all duration-300"
        whileHover={{
          scale: 1.02
        }}>
        <div>
          <h4 className="font-black text-slate-900 text-sm">Security & Verifications</h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Unlock more jobs and maximize Trust Score with South African verification</p>
        </div>

        <div className="space-y-2">
          {/* Identity item */}
          <motion.div
            className="flex justify-between items-center p-3.5 bg-slate-50 geom-card-sm border border-slate-100 hover:shadow-lg transition-all duration-300"
            whileHover={{
              scale: 1.02
            }}>
            <div>
              <span className="font-bold text-slate-800 text-xs block">South African Smart ID Card</span>
              <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                {isIdentityApproved ? 'Status: Approved' : isIdentitySubmitted ? 'Status: Pending Review' : 'Add 15 points to Trust Score'}
              </span>
            </div>
            {isIdentityApproved ? (
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-150">
                Verified
              </span>
            ) : isIdentitySubmitted ? (
              <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-150 animate-pulse">
                Pending
              </span>
            ) : (
              <button
                onClick={() => submitVerification('identity')}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-[10px] font-black shadow-sm"
              >
                Verify
              </button>
            )}
          </motion.div>

          {/* Business item */}
          <motion.div
            className="flex justify-between items-center p-3.5 bg-slate-50 geom-card-sm border border-slate-100 hover:shadow-lg transition-all duration-300"
            whileHover={{
              scale: 1.02
            }}>
            <div>
              <span className="font-bold text-slate-800 text-xs block">CIPC Registration Certificate</span>
              <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                {isBusinessApproved ? 'Status: Approved' : isBusinessSubmitted ? 'Status: Pending Review' : 'Add 5 points to Trust Score'}
              </span>
            </div>
            {isBusinessApproved ? (
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-150">
                Verified
              </span>
            ) : isBusinessSubmitted ? (
              <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-150 animate-pulse">
                Pending
              </span>
            ) : (
              <button
                onClick={() => submitVerification('business')}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-[10px] font-black shadow-sm"
              >
                Verify
              </button>
            )}
          </motion.div>

          {/* Credentials Manual Verification portal */}
          <div className="pt-3.5 border-t border-slate-100 space-y-3">
            <motion.div
              className="flex justify-between items-center p-3.5 bg-slate-50 geom-card-sm border border-slate-100 hover:shadow-lg transition-all duration-300"
              whileHover={{
                scale: 1.02
              }}>
              <div>
                <span className="font-bold text-slate-800 text-xs block">Trade Credentials & Certifications</span>
                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                  {currentUser.credentialsVerified 
                    ? `Status: Approved (${currentUser.submittedCredentials?.name || 'Artisan Qualification'})` 
                    : currentUser.submittedCredentials?.status === 'pending'
                    ? 'Status: Pending Manual Admin Review' 
                    : 'Submit qualification certificates for manual verification'}
                </span>
              </div>
              {currentUser.credentialsVerified ? (
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-150 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified
                </span>
              ) : currentUser.submittedCredentials?.status === 'pending' ? (
                <div className="flex flex-col gap-1.5 items-end">
                  <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-150 animate-pulse">
                    Pending
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulateAdminApproval}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 rounded-lg text-[9px] font-black shadow-xs transition-all cursor-pointer"
                  >
                    Approve Now
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    triggerSound('click');
                    setShowCredForm(!showCredForm);
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-[10px] font-black shadow-sm cursor-pointer"
                >
                  {showCredForm ? 'Close' : 'Verify'}
                </button>
              )}
            </motion.div>

            {/* Submission Form */}
            {showCredForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleRequestCredentialVerification}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3"
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Qualification / Certificate Name</label>
                    <input 
                      type="text"
                      value={credName}
                      onChange={(e) => setCredName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand transition-all"
                      placeholder="e.g. CETA Carpentry Level 4, Wireman License"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Issuing Authority / Board</label>
                    <input 
                      type="text"
                      value={credIssuer}
                      onChange={(e) => setCredIssuer(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand transition-all"
                      placeholder="e.g. SAQA, Department of Labour, MERSETA"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Certificate Number</label>
                      <input 
                        type="text"
                        value={credNumber}
                        onChange={(e) => setCredNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-brand transition-all"
                        placeholder="e.g. CERT-2024-9988"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Select Certificate File</label>
                      <div className="relative">
                        <input 
                          type="file"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCredFileName(e.target.files[0].name);
                              triggerSound('success');
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 truncate flex items-center justify-between">
                          <span className="truncate">{credFileName || 'Choose PDF / Image'}</span>
                          <span className="text-[9px] font-extrabold uppercase text-brand">Browse</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    type="button"
                    onClick={() => setShowCredForm(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingCred}
                    className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-black shadow-sm transition-all"
                  >
                    {isSubmittingCred ? 'Uploading...' : 'Submit Verification'}
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </div>
      </motion.div>

      {/* 🏦 FINANCIAL WITHDRAWALS SYSTEM */}
      {activeRole === 'doer' && (
        <motion.div
          className="bg-white p-5 geom-card border border-slate-100 shadow-xs space-y-4 hover:shadow-lg transition-all duration-300"
          whileHover={{
            scale: 1.02
          }}>
          <div>
            <h4 className="font-black text-slate-900 text-sm">ZAR Bank Withdrawal</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Transfer funds securely from your DOER wallet to your bank account</p>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                  Amount (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R</span>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                  Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold"
                >
                  <option>First National Bank (FNB)</option>
                  <option>Standard Bank</option>
                  <option>Capitec Bank</option>
                  <option>Nedbank</option>
                  <option>Absa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 62123456789"
                value={accountNum}
                onChange={(e) => setAccountNum(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold"
              />
            </div>

            {withdrawMessage && (
              <p className="text-[11px] font-bold text-brand-dark bg-brand-light p-2 rounded-xl">
                {withdrawMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={withdrawing}
              className="w-full py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs shadow-md shadow-emerald-50 flex items-center justify-center gap-1 transition-all"
            >
              {withdrawing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing transfer...
                </>
              ) : (
                'Request Instant Payout 🚀'
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* ❤️ SAVED ITEMS (FAVORITES) SECTION */}
      <motion.div
        className="bg-white p-5 geom-card border border-slate-100 shadow-xs space-y-4 hover:shadow-lg transition-all duration-300"
        whileHover={{
          scale: 1.02
        }}>
        <div>
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
            <span>Saved Favorites</span>
            <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black">
              {savedItems.length}
            </span>
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quickly access your pinned services, products, and Doers</p>
        </div>

        {savedItems.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs font-bold text-slate-400">
            No saved items yet. Tap the heart ❤️ on services, products, or Doers to pin them here!
          </div>
        ) : (
          <div className="space-y-3">
            {/* Filter and display services */}
            {savedItems.filter(item => item.itemType === 'service').map(item => {
              const srv = services.find(s => s.id === item.itemId);
              if (!srv) return null;
              return (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={srv.imageUrls[0]} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-brand uppercase tracking-wider block">Service</span>
                      <h5 className="text-xs font-black text-slate-800 truncate">{srv.title}</h5>
                      <span className="text-[10px] font-semibold text-slate-500 block">R{srv.price} • {srv.doerName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSaveItem('service', srv.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F43F5E" stroke="#F43F5E" strokeWidth="2" className="w-4 h-4">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Filter and display products */}
            {savedItems.filter(item => item.itemType === 'product').map(item => {
              const prd = products.find(p => p.id === item.itemId);
              if (!prd) return null;
              return (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={prd.imageUrls[0]} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">Product</span>
                      <h5 className="text-xs font-black text-slate-800 truncate">{prd.title}</h5>
                      <span className="text-[10px] font-semibold text-slate-500 block">R{prd.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSaveItem('product', prd.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F43F5E" stroke="#F43F5E" strokeWidth="2" className="w-4 h-4">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Filter and display doers */}
            {savedItems.filter(item => item.itemType === 'doer').map(item => {
              const dr = roleProfiles.find(r => r.id === item.itemId);
              if (!dr) return null;
              const avatar = dr.avatarUrl || dr.profileImageUrl || (dr.id === 'doer-1' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80' : dr.id === 'doer-2' ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop&q=80' : dr.id === 'doer-4' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80' : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&fit=crop&q=80');
              const name = dr.id === 'doer-1' ? 'Sipho Ngwenya' : dr.id === 'doer-2' ? 'Anika van der Merwe' : dr.id === 'doer-3' ? 'David Nkosi' : dr.id === 'doer-4' ? 'Naledi Khumalo' : (dr.displayName || 'Freelancer');
              return (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={avatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-200" alt="" />
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wider block">Verified Doer</span>
                      <h5 className="text-xs font-black text-slate-800 truncate">{name}</h5>
                      <span className="text-[10px] font-semibold text-slate-500 block">{dr.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setFocusedSavedDoerId(dr.id);
                      }}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-[9px] font-extrabold uppercase rounded-lg cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      onClick={() => toggleSaveItem('doer', dr.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F43F5E" stroke="#F43F5E" strokeWidth="2" className="w-4 h-4">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 🛡️ ACCOUNT CONTROLS */}
      <motion.div
        className="bg-white p-5 geom-card border border-slate-100 shadow-xs text-center hover:shadow-lg transition-all duration-300"
        whileHover={{
          scale: 1.02
        }}>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3">Account Controls</span>
        <button
          onClick={() => {
            triggerSound('click');
            signOut(auth);
          }}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout Account
        </button>
      </motion.div>


        </div>
      </PullToRefresh>
      {showMyPortfolio && (
        <DoerProfileModal doerId="my-doer-profile" onClose={() => setShowMyPortfolio(false)} />
      )}
      {focusedSavedDoerId && (
        <DoerProfileModal doerId={focusedSavedDoerId} onClose={() => setFocusedSavedDoerId(null)} />
      )}
      {/* --- POST SERVICE MODAL --- */}
      {isServiceModalOpen && (
        <PostServiceModal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} />
      )}
      {/* --- VERIFICATION DETAILS & COMPLIANCE MODAL --- */}
      <ProfileQRCodeModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        profileId={profile.id} 
        profileName={profile.displayName} 
      />
      {isVerificationModalOpen && (
        <VerificationDetailsModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          currentUser={currentUser}
          isIdentitySubmitted={isIdentitySubmitted}
          isIdentityApproved={isIdentityApproved}
          isBusinessSubmitted={isBusinessSubmitted}
          isBusinessApproved={isBusinessApproved}
          onSubmitVerification={(type) => {
            submitVerification(type);
            showToast(`${type === 'identity' ? 'ID Card' : 'CIPC Certificate'} verification request submitted!`, 'success');
          }}
        />
      )}
      {/* Modals */}
      <AnimatePresence>
        {viewingImage && (
          <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4">
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
