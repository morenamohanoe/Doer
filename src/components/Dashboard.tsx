/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { MediaPreview } from './MediaPreview';
import {
  Wallet,
  ShieldAlert,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Coins,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Info,
  Shield,
  Briefcase,
  ShoppingBag,
  User,
  Star,
  Award,
  Flame,
  Check,
  X,
  Pencil,
  Trash2
} from 'lucide-react';
import { EscrowStatusType } from '../types';
import { GeometricDivider } from './GeometricDivider';
import PullToRefresh from './PullToRefresh';
import PostServiceModal from './PostServiceModal';
import ConfirmationModal from './ConfirmationModal';
import ProfileMetricsChart from './ProfileMetricsChart';
import ActivityTimeline from './ActivityTimeline';

export function DashboardCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-3.5 animate-pulse text-left">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          {/* Status Badge */}
          <div className="h-5 bg-slate-200 rounded-full w-20" />
          {/* Title */}
          <div className="h-4 bg-slate-200 rounded-full w-2/3" />
          {/* Subtitle */}
          <div className="h-3 bg-slate-200 rounded-full w-1/2" />
        </div>
        <div className="text-right space-y-1.5">
          <div className="h-4 bg-slate-200 rounded-full w-16" />
          <div className="h-3 bg-slate-200 rounded-full w-20" />
        </div>
      </div>

      <div className="border-t border-slate-100/50 my-1.5" />

      {/* Context Info Box */}
      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50 space-y-1.5">
        <div className="h-3 bg-slate-200 rounded-full w-5/6" />
        <div className="h-3 bg-slate-200 rounded-full w-3/4" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <div className="h-10 bg-slate-200 rounded-xl flex-1" />
        <div className="h-10 bg-slate-200 rounded-xl w-12" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    activeRole,
    serviceRequests,
    updateRequestStatus,
    wallet,
    topUpWallet,
    roleProfiles,
    verificationRequests,
    conversations,
    triggerSound,
    portfolioProjects,
    addPortfolioProject,
    reviews,
    addReview,
    services,
    currentUser,
    deleteService,
    loadingProfile
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // If profile is still loading, we stay in loading state
    if (loadingProfile) {
      setIsLoading(true);
      return;
    }
    
    // Once profile is loaded, wait a tiny bit for firestore snapshots to settle
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [loadingProfile]);

  const [disputeText, setDisputeText] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; serviceId: string | null }>({ isOpen: false, serviceId: null });
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'bookings' | 'jobs' | 'sales'>('bookings');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [hasAutoRouted, setHasAutoRouted] = useState(false);

  const profile = roleProfiles.find((p) => p.role === 'doer' && (p.userId === currentUser?.uid || p.userId === currentUser?.id)) || roleProfiles.find((p) => p.userId === currentUser?.uid || p.userId === currentUser?.id) || roleProfiles[0];

  // States for ratings and reviews on completed jobs
  const [requestRatings, setRequestRatings] = useState<Record<string, number>>({});
  const [requestComments, setRequestComments] = useState<Record<string, string>>({});

  // States for Quick Add Portfolio Project upon Job Completion
  const [selectedQuickAddReq, setSelectedQuickAddReq] = useState<any>(null);
  const [quickDesc, setQuickDesc] = useState('');
  const [quickBefore, setQuickBefore] = useState('');
  const [quickAfter, setQuickAfter] = useState('');
  const [quickCover, setQuickCover] = useState('');

  // States for filtering and sorting
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // --- STATS CALCULATIONS ---
  // Filter jobs for me as Booking Owner (Hired someone)
  const myBookings = serviceRequests.filter((r) => 
    r.bookingOwnerId === currentUser?.id || r.bookingOwnerId === currentUser?.uid
  );

  // Filter jobs for me as Doer (Providing service)
  const doerRequests = serviceRequests.filter((r) => 
    (r.doerId === profile.userId || r.doerId === currentUser?.id || r.doerId === currentUser?.uid) && 
    !r.isProductOrder
  );
  
  useEffect(() => {
    if (hasAutoRouted || serviceRequests.length === 0 || isLoading) return;
    
    const activeJobs = doerRequests.filter(r => ['requested', 'accepted', 'deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'disputed'].includes(r.status));
    const activeBookings = myBookings.filter(r => ['requested', 'accepted', 'deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'disputed'].includes(r.status));
    
    if (activeJobs.length > 0 && activeBookings.length === 0) {
      setSubTab('jobs');
    } else if (activeBookings.length > 0 && activeJobs.length === 0) {
      setSubTab('bookings');
    }
    setHasAutoRouted(true);
  }, [serviceRequests, isLoading, hasAutoRouted, doerRequests, myBookings]);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const doerEarningsToday = doerRequests
    .filter((r) => r.status === 'released' && new Date(r.updatedAt || r.createdAt) >= todayStart)
    .reduce((sum, r) => sum + r.price, 0);

  // Filter orders for me as Sales Merchant
  const mySales = serviceRequests.filter((r) => 
    (r.doerId === profile.userId || r.doerId === currentUser?.id || r.doerId === currentUser?.uid) && 
    r.isProductOrder
  );
  const mySalesRevenue = mySales
    .filter((r) => r.status === 'released')
    .reduce((sum, r) => sum + r.price, 0);

  // Helper for applying sorting and filtering
  const applyFiltersAndSorting = (requests: typeof serviceRequests) => {
    let result = [...requests];
    
    // Filter
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'amount_desc') return b.price - a.price;
      if (sortBy === 'amount_asc') return a.price - b.price;
      return 0;
    });
    
    return result;
  };

  const filteredMyBookings = applyFiltersAndSorting(myBookings);
  const filteredDoerRequests = applyFiltersAndSorting(doerRequests);
  const filteredMySales = applyFiltersAndSorting(mySales);

  // Admin global metrics (Calculated from true live state)
  const totalVerifiedAccounts = 5 + verificationRequests.filter((v) => v.status === 'approved').length;
  const escrowHoldingLedger = serviceRequests
    .filter((r) => ['deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'disputed'].includes(r.status))
    .reduce((sum, r) => sum + r.depositAmount, 0);

  const disputes = serviceRequests.filter((r) => r.status === 'disputed');

  // Custom visual badge helper
  const renderStatusBadge = (status: EscrowStatusType) => {
    const styles: { [key: string]: string } = {
      requested: 'bg-amber-50 text-amber-700 border-amber-200',
      accepted: 'bg-brand-light text-brand-dark border-brand/20',
      deposit_paid: 'bg-blue-50 text-blue-700 border-blue-200',
      in_progress: 'bg-violet-50 text-violet-700 border-violet-200',
      awaiting_approval: 'bg-orange-50 text-orange-700 border-orange-200',
      completed: 'bg-teal-50 text-teal-700 border-teal-200',
      released: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      disputed: 'bg-rose-50 text-rose-700 border-rose-200'
    };

    return (
      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${styles[status] || 'bg-slate-100'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Render a 3-stage visual progress tracker for jobs
  const renderJobProgress = (status: EscrowStatusType) => {
    const isStep1ActiveOrDone = ['accepted', 'deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'released'].includes(status);
    const isStep2ActiveOrDone = ['in_progress', 'awaiting_approval', 'completed', 'released'].includes(status);
    const isStep3ActiveOrDone = ['awaiting_approval', 'completed', 'released'].includes(status);

    const isStep1Done = ['deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'released'].includes(status);
    const isStep2Done = ['awaiting_approval', 'completed', 'released'].includes(status);
    const isStep3Done = ['released'].includes(status);

    const isTerminalNegative = ['disputed', 'cancelled', 'rejected', 'refunded'].includes(status);

    if (isTerminalNegative) {
      return (
        <div className="bg-rose-50/60 p-2.5 rounded-2xl border border-rose-100 text-center flex items-center justify-center gap-2 text-rose-700 text-[10px] font-bold my-3">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>Job Progress Suspended ({status.toUpperCase()})</span>
        </div>
      );
    }

    return (
      <div className="my-4 px-2 select-none">
        <div className="flex items-center justify-between relative">
          {/* Progress Connecting Line Base */}
          <div className="absolute left-[10%] right-[10%] top-[14px] h-[2px] bg-slate-100 z-0" />
          
          {/* Active Progress Connecting Line */}
          <div 
            className="absolute left-[10%] top-[14px] h-[2px] bg-brand transition-all duration-500 ease-in-out z-0"
            style={{ 
              width: isStep2Done 
                ? '80%' 
                : isStep1Done 
                ? '40%' 
                : '0%' 
            }} 
          />

          {/* Stage 1: Start */}
          <div className="flex flex-col items-center relative z-10 w-[30%]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
              isStep1Done 
                ? 'bg-brand text-white border-brand scale-105' 
                : status === 'requested'
                ? 'bg-amber-50 text-amber-600 border-amber-300 animate-pulse'
                : isStep1ActiveOrDone
                ? 'bg-brand-light text-brand-dark border-brand/50'
                : 'bg-white text-slate-400 border-slate-200'
            }`}>
              {isStep1Done ? '✓' : '1'}
            </div>
            <span className={`text-[10px] font-black mt-1 text-center transition-colors ${isStep1ActiveOrDone ? 'text-slate-900' : 'text-slate-400'}`}>
              Start
            </span>
            <span className="text-[8px] font-bold text-slate-400 text-center leading-tight">Offer & Deposit</span>
          </div>

          {/* Stage 2: In Progress */}
          <div className="flex flex-col items-center relative z-10 w-[30%]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
              isStep2Done 
                ? 'bg-zinc-900 text-white border-zinc-900 scale-105' 
                : status === 'in_progress'
                ? 'bg-violet-50 text-violet-700 border-violet-300 animate-pulse scale-105'
                : isStep2ActiveOrDone
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}>
              {isStep2Done ? '✓' : '2'}
            </div>
            <span className={`text-[10px] font-black mt-1 text-center transition-colors ${isStep2ActiveOrDone ? 'text-slate-900' : 'text-slate-400'}`}>
              In Progress
            </span>
            <span className="text-[8px] font-bold text-slate-400 text-center leading-tight">Active Work</span>
          </div>

          {/* Stage 3: Completed */}
          <div className="flex flex-col items-center relative z-10 w-[30%]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
              isStep3Done 
                ? 'bg-emerald-600 text-white border-emerald-600 scale-105' 
                : status === 'awaiting_approval' || status === 'completed'
                ? 'bg-orange-50 text-orange-700 border-orange-300 animate-pulse scale-105'
                : 'bg-white text-slate-400 border-slate-200'
            }`}>
              {isStep3Done ? '✓' : '3'}
            </div>
            <span className={`text-[10px] font-black mt-1 text-center transition-colors ${isStep3ActiveOrDone ? 'text-slate-900' : 'text-slate-400'}`}>
              Completed
            </span>
            <span className="text-[8px] font-bold text-slate-400 text-center leading-tight">Satisfied & Released</span>
          </div>
        </div>
      </div>
    );
  };

  const renderEscrowProgress = (status: EscrowStatusType) => {
    const isPendingDeposit = ['requested', 'accepted'].includes(status);
    const isFundsHeld = ['deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'disputed'].includes(status);
    const isReleased = status === 'released';
    const isRefunded = ['cancelled', 'rejected', 'refunded'].includes(status);

    let activePhase: 1 | 2 | 3 | null = null;
    if (isPendingDeposit) activePhase = 1;
    else if (isFundsHeld) activePhase = 2;
    else if (isReleased) activePhase = 3;

    return (
      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/80 my-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-violet-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Escrow Payment Stage</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[8px] font-extrabold text-emerald-500 uppercase tracking-wider animate-pulse">Syncing...</span>
          </div>
        </div>
        <div className="flex items-center justify-between relative px-1 select-none">
          <div className="absolute left-[12%] right-[12%] top-[8px] h-[2px] bg-slate-200 rounded-full z-0" />
          <div 
            className="absolute left-[12%] top-[8px] h-[2px] bg-violet-600 rounded-full transition-all duration-500 ease-in-out z-0"
            style={{
              width: isReleased ? '76%' : isFundsHeld ? '38%' : '0%'
            }}
          />

          <div className="flex flex-col items-center relative z-10 w-[30%]">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border transition-all duration-300 ${
              isFundsHeld || isReleased
                ? 'bg-violet-600 text-white border-violet-600'
                : isPendingDeposit
                ? 'bg-amber-50 text-amber-600 border-amber-300 animate-pulse'
                : 'bg-white text-slate-300 border-slate-200'
            }`}>
              {isFundsHeld || isReleased ? '✓' : '1'}
            </div>
            <span className={`text-[8px] font-black mt-1 text-center leading-tight ${activePhase === 1 ? 'text-amber-600' : (isFundsHeld || isReleased) ? 'text-slate-600' : 'text-slate-400'}`}>
              {isRefunded ? 'Refunded' : 'Pending Deposit'}
            </span>
          </div>

          <div className="flex flex-col items-center relative z-10 w-[30%]">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border transition-all duration-300 ${
              isReleased
                ? 'bg-violet-600 text-white border-violet-600'
                : status === 'disputed'
                ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                : isFundsHeld
                ? 'bg-violet-50 text-violet-700 border-violet-300 animate-pulse'
                : 'bg-white text-slate-300 border-slate-200'
            }`}>
              {isReleased ? '✓' : '2'}
            </div>
            <span className={`text-[8px] font-black mt-1 text-center leading-tight ${
              status === 'disputed' ? 'text-rose-600' : activePhase === 2 ? 'text-violet-600' : isReleased ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {status === 'disputed' ? 'Funds Frozen' : 'Funds Held'}
            </span>
          </div>

          <div className="flex flex-col items-center relative z-10 w-[30%]">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border transition-all duration-300 ${
              isReleased
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-300 border-slate-200'
            }`}>
              {isReleased ? '✓' : '3'}
            </div>
            <span className={`text-[8px] font-black mt-1 text-center leading-tight ${activePhase === 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
              Released
            </span>
          </div>
        </div>
      </div>
    );
  };

  const FilterControls = () => (
    <div className="flex gap-2">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded-lg px-3 py-2 outline-none flex-1 font-bold shadow-sm"
      >
        <option value="all">All Statuses</option>
        <option value="requested">Requested</option>
        <option value="accepted">Accepted</option>
        <option value="deposit_paid">Deposit Paid</option>
        <option value="in_progress">In Progress</option>
        <option value="awaiting_approval">Awaiting Approval</option>
        <option value="completed">Completed</option>
        <option value="released">Released</option>
        <option value="disputed">Disputed</option>
      </select>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded-lg px-3 py-2 outline-none flex-1 font-bold shadow-sm"
      >
        <option value="date_desc">Newest First</option>
        <option value="date_asc">Oldest First</option>
        <option value="amount_desc">Highest Amount</option>
        <option value="amount_asc">Lowest Amount</option>
      </select>
    </div>
  );

  const activeBookingsCount = myBookings.filter(r => ['requested', 'accepted', 'deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'disputed'].includes(r.status)).length;
  const activeJobsCount = doerRequests.filter(r => ['requested', 'accepted', 'deposit_paid', 'in_progress', 'awaiting_approval', 'completed', 'disputed'].includes(r.status)).length;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden text-left" id="dashboard-root">
      <PullToRefresh onRefresh={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }}>
        <div className="pb-24 px-6 pt-6 space-y-6">

          {/* Prominent Dashboard 'List a Service' Entry Point Banner */}

          {/* ⚡ UNIFIED WORKSPACE NAVIGATION TAB BAR */}
          {activeRole === 'doer' && (
            <div className="flex bg-slate-200/60 p-1 rounded-2xl border border-slate-200 shadow-inner select-none">
              <button
                onClick={() => { triggerSound('click'); setSubTab('bookings'); }}
                className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'bookings' ? 'bg-zinc-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Requests
                {activeBookingsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                )}
              </button>
              <button
                onClick={() => { triggerSound('click'); setSubTab('jobs'); }}
                className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'jobs' ? 'bg-zinc-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Jobs
                {activeJobsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => { triggerSound('click'); setSubTab('sales'); }}
                className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'sales' ? 'bg-zinc-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Sales
              </button>
            </div>
          )}
      
      {/* 👤 BOOKINGS DASHBOARD */}
      {subTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-slate-900 truncate">My Hired Services</h2>
              <p className="text-xs text-slate-500 font-semibold truncate sm:not-truncate">Track hired service requests and secure escrow payments</p>
            </div>
          </div>

          <GeometricDivider />

          <FilterControls />

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <DashboardCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredMyBookings.length === 0 ? (
            <motion.div
              className="bg-white p-8 geom-card border border-slate-100 text-center shadow-xs hover:shadow-lg transition-all duration-300"
              whileHover={{
                scale: 1.02
              }}>
              <Clock className="w-10 h-10 text-brand mx-auto mb-3 opacity-30" />
              <h3 className="font-extrabold text-slate-800 text-sm">No Hired Services</h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                You haven’t hired any services yet. Go to the marketplace to find and hire local DOERs!
              </p>
              {filteredDoerRequests.length > 0 && (
                <div className="mt-5 p-3 bg-brand-light/30 rounded-2xl border border-brand/10">
                  <p className="text-[10px] font-black text-brand-dark uppercase tracking-tight">
                    💡 Looking for your work?
                  </p>
                  <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                    You have {filteredDoerRequests.length} active job{filteredDoerRequests.length > 1 ? 's' : ''} where you are the provider. Check the <span className="text-zinc-900 underline cursor-pointer" onClick={() => setSubTab('jobs')}>My Jobs</span> tab!
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredMyBookings.map((req) => (
                <motion.div
                  key={req.id}
                  className="bg-white p-5 geom-card border border-slate-100 shadow-sm space-y-3.5 hover:shadow-lg transition-all duration-300"
                  whileHover={{
                    scale: 1.02
                  }}>
                  <div className="flex justify-between items-start">
                    <div>
                      {renderStatusBadge(req.status)}
                      <h4 className="text-sm font-black text-slate-900 mt-2">{req.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        DOER: {req.doerName} • 50% Deposit: R{req.depositAmount}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">Total R{req.price}</span>
                      <span className="text-[9px] text-slate-400 font-bold">Escrow Active</span>
                    </div>
                  </div>

                  <GeometricDivider variant="card" className="my-1.5" />

                  {renderJobProgress(req.status)}
                  {renderEscrowProgress(req.status)}

                  {/* Context Info Box */}
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-600 font-semibold leading-normal">
                    {req.status === 'requested' && 'Waiting for the DOER to accept your service request. Rest easy, no deposit is charged yet.'}
                    {req.status === 'accepted' && 'Request accepted! Please pay the 50% deposit to authorize work. Funds stay held in secure escrow.'}
                    {req.status === 'deposit_paid' && 'Deposit holds safely in secure escrow. The DOER is preparing to start the job!'}
                    {req.status === 'in_progress' && 'The job is currently in progress! Communicate with your DOER in the chat.'}
                    {req.status === 'awaiting_approval' && 'Service marked as complete! If everything was perfect, approve to authorize full payment.'}
                    {req.status === 'completed' && 'Approved! Please click Release Funds to pay the DOER.'}
                    {req.status === 'released' && 'Outstanding! This service is fully completed, and escrow funds have been released.'}
                    {req.status === 'disputed' && `Dispute under investigation: "${req.disputeReason}". Admin resolving shortly.`}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex gap-2">
                    {req.status === 'accepted' && (
                      <button
                        onClick={() => updateRequestStatus(req.id, 'deposit_paid')}
                        className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" /> Pay 50% Deposit (R{req.depositAmount})
                      </button>
                    )}

                    {req.status === 'awaiting_approval' && (
                      <>
                        <button
                          onClick={() => updateRequestStatus(req.id, 'completed')}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm"
                        >
                          Approve Work
                        </button>
                        <button
                          onClick={() => {
                            triggerSound('click');
                            setActiveDisputeId(req.id);
                          }}
                          className="px-3 py-2.5 border border-rose-150 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs"
                        >
                          Dispute
                        </button>
                      </>
                    )}

                    {req.status === 'completed' && (
                      <button
                        onClick={() => updateRequestStatus(req.id, 'released')}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" /> I am Satisfied • Release Remaining Funds (R{req.price - req.depositAmount})
                      </button>
                    )}

                    {['requested', 'accepted', 'deposit_paid', 'in_progress', 'awaiting_approval'].includes(req.status) && (
                      <button
                        onClick={() => {
                          triggerSound('alert');
                          setCancelConfirmId(req.id);
                        }}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center transition-colors"
                        title="Cancel Job"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Chat shortcut */}
                    <button
                      type="button"
                      onClick={() => { window.dispatchEvent(new CustomEvent('navigateTab', { detail: 'conversations' })) }}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                      title="Open Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rating & Review Section (Unlocked upon Job Completion / Released Status) */}
                  {req.status === 'released' && (() => {
                    const existingReview = reviews.find((r) => r.id === `rev-${req.id}`);
                    if (existingReview) {
                      return (
                        <div className="mt-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Your Feedback
                            </span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= existingReview.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-700 font-semibold italic">"{existingReview.comment}"</p>
                          <div className="text-[9px] text-slate-400 font-bold">
                            Reviewed on {new Date(existingReview.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    }

                    const currentRating = requestRatings[req.id] || 0;
                    const currentComment = requestComments[req.id] || '';

                    return (
                      <div className="mt-3 p-4 rounded-2xl border border-brand/10 bg-brand-light/20 space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-brand" /> Rate & Review Job
                            </h5>
                            <p className="text-[10px] text-slate-500 font-bold">Help others in South Africa hire trustworthy DOERs!</p>
                          </div>
                          
                          {/* Stars Input */}
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const isSelected = star <= currentRating;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    triggerSound('click');
                                    setRequestRatings((prev) => ({ ...prev, [req.id]: star }));
                                  }}
                                  className="hover:scale-110 transition-transform p-0.5 cursor-pointer"
                                >
                                  <Star
                                    className={`w-5 h-5 transition-colors ${
                                      isSelected ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Quick Feedback Chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Excellent work! 🇿🇦",
                            "Punctual and reliable ⏰",
                            "Super professional!",
                            "Highly recommended 👍",
                            "Great pricing 💰"
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                triggerSound('click');
                                setRequestComments((prev) => {
                                  const curr = prev[req.id] || '';
                                  const next = curr ? `${curr} ${preset}` : preset;
                                  return { ...prev, [req.id]: next };
                                });
                              }}
                              className="text-[9px] font-black text-slate-600 bg-white border border-slate-150 rounded-full px-2.5 py-1 hover:border-brand hover:text-brand transition-colors cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        {/* Review Text Input */}
                        <div className="space-y-1.5">
                          <textarea
                            placeholder="Share your experience working with this provider..."
                            value={currentComment}
                            onChange={(e) => setRequestComments((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            maxLength={200}
                            rows={2}
                            className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand/30 resize-none text-left"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold">
                              {currentComment.length}/200 characters
                            </span>
                            <button
                              type="button"
                              disabled={!(currentRating > 0)}
                              onClick={() => {
                                const rtg = currentRating || 5;
                                const cmt = (currentComment || 'Outstanding job!').trim();
                                addReview(req.doerId, rtg, cmt, `rev-${req.id}`);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                currentRating > 0
                                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Submit Review
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Active Dispute Form */}
                  {activeDisputeId === req.id && (
                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2 mt-2">
                      <label className="block text-[10px] font-bold text-rose-950 uppercase tracking-wider">
                        Briefly describe the issue:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., job was left half completed, or provider did not show up"
                        value={disputeText}
                        onChange={(e) => setDisputeText(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-rose-150 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!disputeText.trim()) return;
                            updateRequestStatus(req.id, 'disputed', disputeText);
                            setActiveDisputeId(null);
                            setDisputeText('');
                          }}
                          className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-[11px] font-black"
                        >
                          Submit Dispute
                        </button>
                        <button
                          onClick={() => {
                            setActiveDisputeId(null);
                            setDisputeText('');
                          }}
                          className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 💼 DOER DASHBOARD */}
      {subTab === 'jobs' && activeRole === 'doer' && (() => {
        const eligibleProjects = doerRequests.filter((req) => 
          req.status === 'released' && 
          !portfolioProjects.some((p) => p.title.toLowerCase() === req.title.toLowerCase())
        );

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">Doer Jobs</h2>
                <p className="text-xs text-slate-500 font-semibold">Track your active contracts</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200 px-3 py-1.5 rounded-full">
                Score: {roleProfiles.find(p => p.role === 'doer' && (p.userId === currentUser?.uid || p.userId === currentUser?.id))?.trustScore.score || roleProfiles.find(p => p.role === 'doer')?.trustScore.score || 50}/100
              </span>
            </div>
            <GeometricDivider />
            {/* 🎉 CELEBRATION PORTFOLIO PROMPT */}
            {eligibleProjects.length > 0 && (
              <div className="space-y-3">
                {eligibleProjects.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-zinc-950 to-slate-900 text-white p-5 rounded-3xl border border-brand/20 shadow-lg relative overflow-hidden space-y-3"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-brand text-zinc-950 rounded-xl flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-zinc-900" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-brand uppercase tracking-wider">Boost Your Trust Score! 🎉</h4>
                        <p className="text-[11px] text-zinc-300 font-semibold mt-0.5 leading-normal">
                          You successfully completed the job <strong className="text-white">"{req.title}"</strong> for {req.bookingOwnerName}! 
                          Convert this into a verified Portfolio project to add <strong className="text-brand">+5 to +15 points</strong> to your Trust Score!
                        </p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          triggerSound('click');
                          setSelectedQuickAddReq(req);
                        }}
                        className="w-full py-2 bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl font-black text-xs transition-colors"
                      >
                        Convert to Portfolio Project 🚀
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {/* Income Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
              {isLoading ? (
                <>
                  <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-xs space-y-2 animate-pulse text-left">
                    <div className="h-3 bg-slate-200 rounded-full w-20" />
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                    <div className="h-3 bg-slate-200 rounded-full w-16" />
                  </div>
                  <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-xs space-y-2 animate-pulse text-left">
                    <div className="h-3 bg-slate-200 rounded-full w-24" />
                    <div className="h-6 bg-slate-200 rounded-full w-20" />
                    <div className="h-3 bg-slate-200 rounded-full w-28" />
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    className="bg-white p-4 geom-card border border-slate-100 shadow-xs text-left hover:shadow-lg transition-all duration-300"
                    whileHover={{
                      scale: 1.02
                    }}>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Earnings Today</span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">R {doerEarningsToday}</h3>
                    <span className="text-[9px] text-emerald-600 font-bold">100% Cleared</span>
                  </motion.div>
                  <motion.div
                    className="bg-white p-4 geom-card border border-slate-100 shadow-xs text-left hover:shadow-lg transition-all duration-300"
                    whileHover={{
                      scale: 1.02
                    }}>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Wallet Balance</span>
                    <h3 className="text-lg font-black text-zinc-900 mt-1">R {wallet.balance}</h3>
                    <span className="text-[9px] text-slate-400 font-bold">Held Escrow: R{wallet.escrowBalance}</span>
                  </motion.div>
                </>
              )}
            </div>
            {/* 📊 SERVICE REQUEST METRICS & RATING TRENDS CHART */}
            <ProfileMetricsChart
              completedJobsCount={profile?.completedJobsCount || 0}
              rating={profile?.rating || 0}
              doerRequests={doerRequests}
              reviews={reviews.filter(rev => rev.targetId === profile.id || rev.targetId === profile.userId)}
            />
            <div className="mt-8">
              <ActivityTimeline requests={doerRequests} />
            </div>
            {/* Active Job Requests */}
            <div>
              <GeometricDivider className="my-5" />
              <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                <GeometricDivider variant="accent" />
                Service Contracts
              </h3>
              
              <div className="mb-4">
                <FilterControls />
              </div>

              {isLoading ? (
                <div className="space-y-3.5">
                  {[1, 2].map((i) => (
                    <DashboardCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredDoerRequests.length === 0 ? (
                <motion.div
                  className="bg-white p-8 geom-card border border-slate-100 text-center shadow-xs hover:shadow-lg transition-all duration-300"
                  whileHover={{
                    scale: 1.02
                  }}>
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-extrabold text-slate-800 text-sm">No Service Contracts</h4>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                    Once clients hire you for your published services, active escrow contracts will appear right here.
                  </p>
                  {filteredMyBookings.length > 0 && (
                    <div className="mt-5 p-3 bg-brand-light/30 rounded-2xl border border-brand/10">
                      <p className="text-[10px] font-black text-brand-dark uppercase tracking-tight">
                        💡 Looking for hired services?
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                        You have {filteredMyBookings.length} active service request{filteredMyBookings.length > 1 ? 's' : ''} where you are the client. Check the <span className="text-zinc-900 underline cursor-pointer" onClick={() => setSubTab('bookings')}>My Requests</span> tab!
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-3.5">
                  {filteredDoerRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      className="bg-white p-5 geom-card border border-slate-100 shadow-sm space-y-3.5 hover:shadow-lg transition-all duration-300"
                      whileHover={{
                        scale: 1.02
                      }}>
                      <div className="flex justify-between items-start">
                        <div>
                          {renderStatusBadge(req.status)}
                          <h4 className="text-sm font-black text-slate-900 mt-2">{req.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            Client: {req.bookingOwnerName} • 50% Deposit: R{req.depositAmount}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">Payout R{req.price}</span>
                          <span className="text-[9px] text-slate-400 font-bold">ZAR Account</span>
                        </div>
                      </div>

                      <GeometricDivider variant="card" className="my-1.5" />

                      {renderJobProgress(req.status)}
                      {renderEscrowProgress(req.status)}

                      <div className="flex gap-2 w-full">
                        {req.status === 'requested' && (
                          <div className="flex gap-2 flex-1">
                            <button
                              onClick={() => updateRequestStatus(req.id, 'accepted')}
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-all"
                            >
                              Accept Offer
                            </button>
                            <button
                              onClick={() => updateRequestStatus(req.id, 'rejected')}
                              className="px-4 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl font-bold text-xs cursor-pointer transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {req.status === 'accepted' && (
                          <div className="flex-1 py-2 px-3 bg-amber-50 border border-amber-100 rounded-xl text-center text-[10px] font-bold text-amber-700 flex items-center justify-center">
                            Awaiting Client's 50% deposit before you can start
                          </div>
                        )}

                        {req.status === 'deposit_paid' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'in_progress')}
                            className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-zinc-800 shadow-sm transition-all"
                          >
                            Start Job
                          </button>
                        )}

                        {req.status === 'in_progress' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'awaiting_approval')}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-emerald-700 shadow-sm transition-all"
                          >
                            Submit For Approval
                          </button>
                        )}

                        {/* Chat Shortcut */}
                        <button
                          type="button"
                          onClick={() => { window.dispatchEvent(new CustomEvent('navigateTab', { detail: 'conversations' })) }}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* My Listed Services Section with required empty state and Create button */}
              <div>
                <GeometricDivider className="my-5" />
                <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GeometricDivider variant="accent" />
                    My Listed Services
                  </span>
                  {services.filter((s) => s.userId === currentUser.id || s.doerId === profile.userId).length > 0 && (
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setIsServiceModalOpen(true);
                      }}
                      className="text-[10px] font-black uppercase text-brand hover:underline cursor-pointer"
                    >
                      + Add Service
                    </button>
                  )}
                </h3>

                {(() => {
                  const myListedServices = services.filter(
                    (s) => s.userId === currentUser.id || s.doerId === profile.userId
                  );

                  if (myListedServices.length === 0) {
                    return (
                      <motion.div
                        className="bg-white p-8 geom-card border border-slate-100 text-center shadow-xs flex flex-col items-center justify-center space-y-3 hover:shadow-lg transition-all duration-300"
                        whileHover={{
                          scale: 1.02
                        }}>
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="font-extrabold text-slate-800 text-sm">No services published yet</h4>
                        <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                          You haven't published any services yet.
                        </p>
                        <button
                          onClick={() => {
                            triggerSound('click');
                            setIsServiceModalOpen(true);
                          }}
                          className="px-4 py-2 bg-brand hover:bg-brand-hover text-zinc-900 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                        >
                          + Create Service
                        </button>
                      </motion.div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {myListedServices.map((srv) => (
                        <div key={srv.id} className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between">
                          <div className="w-full h-32 bg-slate-100 overflow-hidden relative">
                            <MediaPreview 
                              urls={srv.imageUrls} 
                              featuredUrl={srv.featuredImageUrl} 
                            />
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5 text-xs text-left">
                              <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{srv.title}</h4>
                              <p className="text-slate-500 leading-normal line-clamp-2 font-medium">{srv.description}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-50 flex flex-wrap items-center justify-between gap-2">
                              <span className="font-black text-slate-900 text-xs whitespace-nowrap">
                                R {srv.price} <span className="text-[9px] text-slate-400 font-bold">/{srv.pricingType || srv.priceUnit}</span>
                              </span>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    triggerSound('click');
                                    setEditingService(srv);
                                  }}
                                  className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-600 hover:text-brand-dark border border-slate-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3 text-slate-500" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteConfirm({ isOpen: true, serviceId: srv.id });
                                  }}
                                  className="px-2.5 py-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3 text-slate-500 hover:text-rose-600" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        );
      })()}

      {/* 🛍️ SALES DASHBOARD */}
      {(subTab === 'sales') && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-slate-900 truncate">My Sales Merchant</h2>
              <p className="text-xs text-slate-500 font-semibold truncate sm:not-truncate">Manage stock and physical product orders</p>
            </div>
            <span className="bg-amber-50 text-amber-700 text-xs font-black border border-amber-200 px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
              Active Store
            </span>
          </div>

          <GeometricDivider />

          {/* Revenue metrics */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="bg-white p-4 geom-card border border-slate-100 shadow-xs text-left hover:shadow-lg transition-all duration-300"
              whileHover={{
                scale: 1.02
              }}>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Sales Revenue</span>
              <h3 className="text-lg font-black text-slate-900 mt-1">R {mySalesRevenue}</h3>
              <span className="text-[9px] text-emerald-600 font-bold">100% Secure</span>
            </motion.div>
            <motion.div
              className="bg-white p-4 geom-card border border-slate-100 shadow-xs text-left hover:shadow-lg transition-all duration-300"
              whileHover={{
                scale: 1.02
              }}>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Wallet Balance</span>
              <h3 className="text-lg font-black text-zinc-900 mt-1">R {wallet.balance}</h3>
              <span className="text-[9px] text-slate-400 font-bold">Withdrawable now</span>
            </motion.div>
          </div>

          {/* Orders */}
          <div>
            <GeometricDivider className="my-5" />
            <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
              <GeometricDivider variant="accent" />
              Merchant Orders
            </h3>
            
            <div className="mb-4">
              <FilterControls />
            </div>

            {filteredMySales.length === 0 ? (
              <motion.div
                className="bg-white p-8 geom-card border border-slate-100 text-center shadow-xs hover:shadow-lg transition-all duration-300"
                whileHover={{
                  scale: 1.02
                }}>
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-extrabold text-slate-800 text-sm">No Orders Yet</h4>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                  When users purchase your listed crafts, biltong, or hoodies, order requests will appear here.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3.5">
                {filteredMySales.map((req) => (
                  <motion.div
                    key={req.id}
                    className="bg-white p-5 geom-card border border-slate-100 shadow-sm space-y-3.5 hover:shadow-lg transition-all duration-300"
                    whileHover={{
                      scale: 1.02
                    }}>
                    <div className="flex justify-between items-start">
                      <div>
                        {renderStatusBadge(req.status)}
                        <h4 className="text-sm font-black text-slate-900 mt-2">{req.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          Buyer: {req.bookingOwnerName} • 50% Deposit: R{req.depositAmount}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block">Total R{req.price}</span>
                        <span className="text-[9px] text-slate-400 font-bold">Escrow Verified</span>
                      </div>
                    </div>

                    <GeometricDivider variant="card" className="my-1.5" />

                    <div className="flex gap-2">
                      {req.status === 'requested' && (
                        <button
                          onClick={() => updateRequestStatus(req.id, 'accepted')}
                          className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs"
                        >
                          Accept Order & Package Item
                        </button>
                      )}

                      {req.status === 'deposit_paid' && (
                        <button
                          onClick={() => updateRequestStatus(req.id, 'awaiting_approval')}
                          className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                        >
                          Ship / Dispatch Item (Courier)
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => { window.dispatchEvent(new CustomEvent('navigateTab', { detail: 'conversations' })) }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎨 QUICK ADD PORTFOLIO DIALOG ON JOB COMPLETION */}
      {selectedQuickAddReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 text-left backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-2xl max-w-md w-full space-y-4 text-xs font-semibold"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand" /> Convert Completed Job to Portfolio
              </span>
              <button
                onClick={() => setSelectedQuickAddReq(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Prepopulated Title</span>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 font-bold text-slate-800">
                  {selectedQuickAddReq.title}
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Describe the Work Completed</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., Replaced standard copper pipes with leak-proof PVC cabling. Tested pressure, finalized joint fittings cleanly..."
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Before Photo URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={quickBefore}
                    onChange={(e) => setQuickBefore(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">After Photo URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={quickAfter}
                    onChange={(e) => setQuickAfter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-[10px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Optional Cover Photo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={quickCover}
                  onChange={(e) => setQuickCover(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-[10px]"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!quickDesc.trim()) {
                  return;
                }
                const category = selectedQuickAddReq.title.toLowerCase().includes('leak') || selectedQuickAddReq.title.toLowerCase().includes('plumb') ? 'plumbing' : 'gardening';
                
                const defaultCover = category === 'plumbing' 
                  ? 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80';

                addPortfolioProject(
                  selectedQuickAddReq.title,
                  quickDesc,
                  category,
                  quickCover || defaultCover,
                  quickBefore || undefined,
                  quickAfter || undefined,
                  []
                );

                setSelectedQuickAddReq(null);
                setQuickDesc('');
                setQuickBefore('');
                setQuickAfter('');
                setQuickCover('');
              }}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl font-black text-xs shadow-md transition-all"
            >
              Confirm & Publish Proof (+5 Trust Points)
            </button>
          </motion.div>
        </div>
      )}

        </div>
      </PullToRefresh>
      {/* --- POST SERVICE MODAL --- */}
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
      {cancelConfirmId && (
        <ConfirmationModal
          isOpen={!!cancelConfirmId}
          onClose={() => setCancelConfirmId(null)}
          onConfirm={() => {
            if (cancelConfirmId) {
              triggerSound('click');
              updateRequestStatus(cancelConfirmId, 'cancelled');
              setCancelConfirmId(null);
            }
          }}
          title="Cancel Job?"
          message="Are you sure you want to cancel this job? If a deposit was paid, it will be credited back to your account, and a penalty may be applied to the provider."
        />
      )}
    </div>
  );
}
