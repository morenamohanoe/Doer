import { logWarn } from './lib/logger';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import Onboarding from './components/Onboarding';
import Welcome from './components/auth/Welcome';
import HomeFeed from './components/HomeFeed';
import Dashboard from './components/Dashboard';
import WalletScreen from './components/WalletScreen';
import ChatScreen from './components/ChatScreen';
import ProfileScreen from './components/ProfileScreen';
import DoerProfileModal from './components/DoerProfileModal';
import AdminCategoryModeration from './components/AdminCategoryModeration';
import LoadingScreen from './components/LoadingScreen';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import Navigation from './components/Navigation';
import { motion, AnimatePresence } from 'motion/react';
import SEO from './components/SEO';
import { NotificationSettings, ServiceCategory } from './types';
import {
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle,
  Briefcase,
  Shield,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Bell,
  Wallet,
  Settings,
  MessageSquare,
  CreditCard,
  Heart,
  Star,
} from 'lucide-react';

const toastStyles = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200',
    icon: CheckCircle,
    iconColor: 'text-emerald-500'
  },
  error: {
    bg: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200',
    icon: AlertCircle,
    iconColor: 'text-rose-500'
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500'
  },
  info: {
    bg: 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/90 dark:border-indigo-800 dark:text-indigo-200',
    icon: Info,
    iconColor: 'text-indigo-500'
  }
};

function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="absolute top-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts && toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              whileHover={{ scale: 1.02 }}
              className={`p-3 border flex items-center justify-between gap-3 ${style.bg} geom-card-sm pointer-events-auto shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${style.iconColor}`} />
                  <span className="text-[11px] font-black tracking-tight leading-tight">{toast.message}</span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function SystemRemindersContainer() {
  const { activeSystemReminders, dismissSystemReminder } = useApp();

  return (
    <div className="absolute top-4 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {activeSystemReminders && activeSystemReminders.map((reminder) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="pointer-events-auto shadow-lg"
          >
            <div className="p-4 border flex items-start justify-between gap-3 bg-indigo-600 border-indigo-700 text-white rounded-2xl">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 bg-indigo-500 rounded-full mt-0.5 animate-pulse">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm">{reminder.title}</div>
                  <div className="text-xs text-indigo-100 font-medium leading-tight mt-0.5">{reminder.message}</div>
                </div>
              </div>
              <button
                onClick={() => dismissSystemReminder(reminder.id)}
                className="p-1 hover:bg-indigo-500 rounded-full transition-colors shrink-0"
              >
                <X className="w-4 h-4 opacity-80 hover:opacity-100" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AppContent() {
  const {
    currentUser,
    roleProfiles,
    triggerSound,
    notifications,
    markAllNotificationsAsRead,
    clearNotification,
    clearAllNotifications,
    showToast,
    profile,
    loadingProfile,
    unreadCount,
    markAsRead,
    notificationSettings,
    updateNotificationSettings,
    wallet,
    savedItems = [],
    toggleSaveItem,
    removeSavedItemsBatch,
    services = [],
    products = [],
    serviceCategories = [],
    createRequest,
    updateRequestStatus,
    serviceRequests,
    failedPayments = [],
    clearFailedPayment,
    topUpWallet,
    searchQuery,
    selectedCategory,
    filterLocation
  } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [currentTab, setTab] = useState('home');
  
  useEffect(() => {
    const handleNavigateTab = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setTab(e.detail);
      }
    };
    window.addEventListener('navigateTab', handleNavigateTab);
    return () => window.removeEventListener('navigateTab', handleNavigateTab);
  }, []);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [activeNotificationCategory, setActiveNotificationCategory] = useState('All');
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedFilterCategory, setSavedFilterCategory] = useState<'all' | 'service' | 'product' | 'doer'>('all');
  const [selectedSavedDetail, setSelectedSavedDetail] = useState<any | null>(null);
  const [focusedDoerId, setFocusedDoerId] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedBatchKeys, setSelectedBatchKeys] = useState<string[]>([]);

  // Service worker-style background polling hook for Escrow deposit confirmations & status updates
  const lastStatusesRef = React.useRef<Record<string, string>>({});
  
  React.useEffect(() => {
    if (!serviceRequests || serviceRequests.length === 0) return;

    // Build the status map for current requests
    const currentStatuses: Record<string, string> = {};
    serviceRequests.forEach(req => {
      currentStatuses[req.id] = req.status;
    });

    // On first load, initialize the ref and don't trigger alerts for existing states
    if (Object.keys(lastStatusesRef.current).length === 0) {
      lastStatusesRef.current = currentStatuses;
      return;
    }

    // Scan for changes compared to the last recorded states
    serviceRequests.forEach(req => {
      const oldStatus = lastStatusesRef.current[req.id];
      const newStatus = req.status;

      if (oldStatus && oldStatus !== newStatus) {
        console.log(`%c[Escrow Poller] Transaction "${req.title}" status changed: ${oldStatus} -> ${newStatus}`, 'color: #8b5cf6; font-weight: bold; padding: 2px; background: #ede9fe; border-radius: 4px;');

        // If the transaction status changed to 'deposit_paid' (Escrow Secured)
        if (newStatus === 'deposit_paid') {
          // Trigger Haptic feedback vibration
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([120, 80, 120]);
            } catch (e) {
              logWarn('Haptic vibration failed:', e);
            }
          }
          triggerSound('success');
          showToast(`🛡️ Escrow Secured: R ${req.depositAmount} is now Held in Escrow for "${req.title}"!`, 'success');
        }
        
        // If the transaction status changed to 'released' or 'completed' (Payment Received by Doer)
        if (newStatus === 'completed' || newStatus === 'released') {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(200);
            } catch (e) {
              logWarn('Haptic vibration failed:', e);
            }
          }
          triggerSound('success');
          showToast(`💰 Escrow Released: R ${req.depositAmount} transferred to DOER for "${req.title}"!`, 'success');
        }
      }
    });

    // Update the ref cache
    lastStatusesRef.current = currentStatuses;
  }, [serviceRequests, showToast, triggerSound]);

  // Periodic service-worker simulated polling effect to print active escrow telemetry logs
  const serviceRequestsRef = React.useRef(serviceRequests);
  React.useEffect(() => {
    serviceRequestsRef.current = serviceRequests;
  }, [serviceRequests]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const pendingOrHeld = (serviceRequestsRef.current || []).filter(
        req => ['requested', 'accepted', 'deposit_paid'].includes(req.status)
      );
      console.log(
        `%c[Escrow Sync Worker] Syncing transaction logs with Firestore... (${pendingOrHeld.length} tracked escrow contracts in progress)`,
        'color: #6366f1; font-family: monospace; font-size: 10px; font-weight: 600;'
      );
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Payment Failed notification alert detection
  const [activeFailedPayment, setActiveFailedPayment] = React.useState<any | null>(null);
  const [showSupportModal, setShowSupportModal] = React.useState(false);
  const [isCheckingPaymentStatus, setIsCheckingPaymentStatus] = React.useState(false);
  const [paymentDiagnosticResult, setPaymentDiagnosticResult] = React.useState<string | null>(null);
  const lastFailedCountRef = React.useRef(0);

  React.useEffect(() => {
    if (failedPayments && failedPayments.length > lastFailedCountRef.current) {
      const newFail = failedPayments[0];
      setActiveFailedPayment(newFail);
      triggerSound('notification');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch (e) {
          logWarn('Haptic vibration failed:', e);
        }
      }
    }
    lastFailedCountRef.current = failedPayments ? failedPayments.length : 0;
  }, [failedPayments, triggerSound]);

  const filteredNotifications = React.useMemo(() => {
    return notifications?.filter(n => {
    // Apply Global User Preferences first
    if (n.type === 'booking' && !notificationSettings.jobUpdates) return false;
    if (n.type === 'message' && !notificationSettings.messages) return false;
    if (n.type === 'payment' && !notificationSettings.payments) return false;
    if (n.type === 'promo' && !notificationSettings.promotions) return false;

    if (activeNotificationCategory === 'All') return true;
    if (activeNotificationCategory === 'High Priority') return n.type === 'alert' || n.type === 'HIGH';
    // Mapping internal types to categories
    if (activeNotificationCategory === 'System') return n.type === 'system' || n.type === 'info';
    if (activeNotificationCategory === 'Jobs') return n.type === 'booking';
    if (activeNotificationCategory === 'Messages') return n.type === 'message';
    if (activeNotificationCategory === 'Payments') return n.type === 'payment';
    return true;
  });
  }, [notifications, notificationSettings, activeNotificationCategory]);

  const handleClearAll = React.useCallback(() => {
    if (!notifications || notifications.length === 0) {
      showToast("No notifications to clear", 'info');
      return;
    }
    
    // Perform clear
    clearAllNotifications();
    showToast("Notifications cleared", 'info');
    setIsNotificationOpen(false);
    triggerSound('click');
  }, [notifications, clearAllNotifications, showToast, triggerSound]);

  const handleOpenNotifications = React.useCallback(() => {
    triggerSound('click');
    setIsNotificationOpen(true);
  }, [triggerSound]);

  const handleNotificationClick = React.useCallback((n: any) => {
    markAsRead(n.id);
    triggerSound('click');
    setIsNotificationOpen(false);

    if (n.actionUrl) {
      // Improved navigation logic
      const url = n.actionUrl.toLowerCase();
      if (url === '/chats' || url.includes('/chat') || url === 'conversations') setTab('conversations');
      else if (url === '/profile' || url === 'profile') setTab('profile');
      else if (url === '/stats' || url === '/dashboard' || url === 'dashboard') setTab('dashboard');
      else if (url === '/home' || url === 'home') setTab('home');
      else if (url === '/wallet' || url === 'wallet') setTab('wallet');
      else if (url === '/admin' || url === 'admin') setTab('admin');
      else setTab('home'); // default
    } else {
      // Intelligent fallback based on content
      const msg = (n.message || '').toLowerCase();
      const title = (n.title || '').toLowerCase();
      
      if (title.includes('message') || title.includes('chat') || msg.includes('sent you a message') || msg.includes('new message')) {
        setTab('conversations');
      } else if (title.includes('booking') || title.includes('job') || msg.includes('booking') || msg.includes('appointment') || msg.includes('request')) {
        setTab('dashboard');
      } else if (title.includes('wallet') || title.includes('payment') || title.includes('topped up') || msg.includes('wallet') || msg.includes('payment') || msg.includes('withdrawn')) {
        setTab('wallet');
      } else if (title.includes('portfolio') || title.includes('published') || title.includes('profile')) {
        setTab('profile');
      } else if (title.includes('system') || title.includes('admin')) {
        setTab('admin');
      }
    }
  }, [markAsRead, triggerSound, setTab]);

  if (authLoading || loadingProfile) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Welcome />;
  }

  // Only route to onboarding if profile is explicitly not completed
  if (!profile || !profile.profileCompleted) {
    return <Onboarding />;
  }



  const getSavedItemDetails = (item: any) => {
    if (item.itemType === 'service') {
      const srv = services.find((s: any) => s.id === item.itemId);
      if (!srv) return null;
      return {
        id: srv.id,
        type: 'service' as const,
        title: srv.title,
        price: srv.price,
        location: srv.location,
        image: srv.imageUrls?.[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&fit=crop&q=80',
        description: srv.description,
        doerName: srv.doerName,
        doerAvatar: srv.doerAvatar,
        category: srv.categoryName || srv.category,
        raw: srv
      };
    } else if (item.itemType === 'product') {
      const prd = products.find((p: any) => p.id === item.itemId);
      if (!prd) return null;
      return {
        id: prd.id,
        type: 'product' as const,
        title: prd.title,
        price: prd.price,
        location: 'Delivery Available',
        image: prd.imageUrls?.[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&fit=crop&q=80',
        description: prd.description,
        doerName: prd.doerName || 'Seller',
        doerAvatar: prd.doerAvatar,
        category: prd.category,
        raw: prd
      };
    } else if (item.itemType === 'doer') {
      const dr = roleProfiles.find((r: any) => r.id === item.itemId);
      if (!dr) return null;
      const avatar = dr.avatarUrl || dr.profileImageUrl || (dr.id === 'doer-1' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80' : dr.id === 'doer-2' ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop&q=80' : dr.id === 'doer-4' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80' : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&fit=crop&q=80');
      const name = dr.id === 'doer-1' ? 'Sipho Ngwenya' : dr.id === 'doer-2' ? 'Anika van der Merwe' : dr.id === 'doer-3' ? 'David Nkosi' : dr.id === 'doer-4' ? 'Naledi Khumalo' : (dr.displayName || 'Freelancer');
      return {
        id: dr.id,
        type: 'doer' as const,
        title: name,
        price: dr.trustScore?.score || 50,
        location: dr.locationName || 'South Africa',
        image: avatar,
        description: dr.bio || dr.personalTagline || 'No bio provided.',
        doerName: name,
        doerAvatar: avatar,
        category: 'Verified Doer',
        raw: dr
      };
    }
    return null;
  };

  const getSeoProps = () => {
    switch (currentTab) {
      case 'home': {
        const activeCatObj = serviceCategories.find((c: ServiceCategory) => c.id === selectedCategory || c.name === selectedCategory);
        const categoryName = activeCatObj ? activeCatObj.name : selectedCategory;

        if (categoryName || searchQuery || filterLocation) {
          const categoryText = categoryName 
            ? `${categoryName}` 
            : (searchQuery ? `${searchQuery}` : 'On-Demand Services');
          
          const locationText = filterLocation 
            ? ` in ${filterLocation}` 
            : ' across South Africa';

          return {
            title: `${categoryText} Services${locationText} | DOER Marketplace`,
            description: `Connect with trusted ${categoryText.toLowerCase()} professionals${locationText} on DOER. View ratings, completed portfolio projects, and book local services to support local livelihoods.`,
            keywords: `DOER, ${categoryText.toLowerCase()}${filterLocation ? `, ${categoryText.toLowerCase()} ${filterLocation.toLowerCase()}` : ''}, local services, handymen south africa, earn income, skill marketplace`
          };
        }

        return {
          title: "DOER | South Africa's On-Demand Services & Skills Marketplace",
          description: "DOER helps South Africans market skills, sell products, generate income, and connect with trusted customers. Helping people get things done while helping others earn a living.",
          keywords: "DOER, local services, handyman south africa, earn income, market skills, sell products online, find local doer, trustworthy help, johannesburg freelancers"
        };
      }
      case 'dashboard':
        return {
          title: "My Work & Booking Milestones Dashboard | DOER",
          description: "Track your active jobs, ongoing customer bookings, and product orders in real-time. Manage your goals and milestones smoothly.",
          keywords: "DOER dashboard, tracking local jobs, direct service milestones, freelance work status, South Africa services"
        };
      case 'conversations':
        return {
          title: "Direct Secure Messages & Freelance Chat | DOER",
          description: "Chat directly with verified service providers or customers. Discuss requirements, negotiate prices, and schedule services smoothly.",
          keywords: "DOER chat, secure service messages, contact local providers, direct customer chat, freelance conversation"
        };
      case 'profile':
        return {
          title: "Professional Provider Portfolio & Customer Profile | DOER",
          description: "Set up your verified provider portfolio, showcase your skills or products, view trust scores, and manage your DOER profile settings.",
          keywords: "DOER profile, trust score, skills portfolio, service catalog, product shop, South African freelance resume"
        };
      case 'admin':
        return {
          title: "System Administration & Category Moderation Console | DOER",
          description: "DOER Admin system panel for service approvals, system commission cut metrics, and provider validations.",
          keywords: "DOER admin, system cut configuration, provider verification, services category moderation"
        };
      case 'wallet':
        return {
          title: "My Secure Income Wallet & Direct Bank Withdrawals | DOER",
          description: "Manage your secure deposits, withdraw earned income directly to major South African banks, and view transaction history.",
          keywords: "DOER wallet, withdraw earnings, South African banks EFT, secure payment escrow, peer-to-peer transfers"
        };
      default:
        return {
          title: "DOER | South Africa's On-Demand Services & Skills Marketplace",
          description: "Helping people get things done while helping others earn a living. Market skills, sell products, and find trusted help.",
          keywords: "DOER, doer app, local services, South Africa freelance"
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden" id="app-content-root">
      <SEO {...getSeoProps()} />
      <SystemRemindersContainer />
      <ConnectivityBanner />
      
      {/* --- TOP APPLICATION STATUS BAR --- */}
      <div className="px-6 pt-5 pb-3 bg-zinc-900 flex justify-between items-center z-30 border-b border-zinc-800 shadow-xs select-none">
        
        {/* Brand visual badge */}
        <span className="text-sm font-black tracking-tighter text-white">
          DOER <span className="text-brand font-black inline-block -ml-1 text-base">.</span> <span className="text-[10px] text-white">🇿🇦</span>
        </span>

        {/* Right side: Bell & Profile */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { triggerSound('click'); setTab('wallet'); }}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-xl cursor-pointer transition-colors text-left"
          >
            <Wallet className="w-3.5 h-3.5 text-brand" />
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] text-zinc-400 font-bold leading-none uppercase tracking-wider">Wallet</span>
              <span className="text-xs font-black text-white whitespace-nowrap">R {wallet.balance}</span>
            </div>
          </button>
          <button
            onClick={handleOpenNotifications}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 relative transition-all active:scale-95 cursor-pointer flex items-center justify-center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-600 text-white font-extrabold text-[8px] rounded-full flex items-center justify-center ring-2 ring-zinc-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Saved Favorites (Heart) Button */}
          <button
            onClick={() => { triggerSound('click'); setIsSavedModalOpen(true); }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-rose-500 rounded-xl border border-zinc-700 relative transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            title="Saved Favorites"
          >
            <motion.div
              key={savedItems.length}
              animate={{
                scale: [1, 1.25, 0.9, 1.15, 1],
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
              className="flex items-center justify-center"
            >
              <Heart className="w-4 h-4" fill={savedItems.length > 0 ? "currentColor" : "none"} />
            </motion.div>
            {savedItems.length > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-600 text-white font-extrabold text-[8px] rounded-full flex items-center justify-center ring-2 ring-zinc-900">
                {savedItems.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setTab('profile')}
            className="w-8 h-8 rounded-full border-2 border-zinc-700 overflow-hidden cursor-pointer active:scale-95 transition-all"
          >
            <img 
              src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* --- MAIN TAB PAGES --- */}
      <div className="flex-1 overflow-hidden relative bg-slate-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            {currentTab === 'home' && <HomeFeed />}
            {currentTab === 'dashboard' && <Dashboard />}
            {currentTab === 'conversations' && <ChatScreen />}
            {currentTab === 'profile' && <ProfileScreen />}
            {currentTab === 'admin' && <AdminCategoryModeration />}
            {currentTab === 'wallet' && <WalletScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* --- BOTTOM SYSTEM NAVIGATION --- */}
      <Navigation currentTab={currentTab} setTab={setTab} />

      {/* --- GLOBAL TOAST SYSTEM --- */}
      <ToastContainer />

      {/* --- NOTIFICATIONS PANEL OVERLAY --- */}
      <AnimatePresence>
        {isNotificationOpen && (
          <div className="absolute inset-0 bg-slate-900/60 z-50 flex flex-col justify-end text-left">
            <div className="flex-1" onClick={() => setIsNotificationOpen(false)} />
            <motion.div
              initial={{ y: 500 }}
              animate={{ y: 0 }}
              exit={{ y: 500 }}
              transition={{ type: 'spring', stiffness: 220, damping: 25 }}
              className="bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[80vh] flex flex-col border-t border-slate-150 relative z-50"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-brand text-zinc-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-tighter"
                      >
                        {unreadCount} Unread
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">Priority filtered activity updates</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                    className={`p-1.5 rounded-full transition-colors ${
                      showNotificationSettings ? 'bg-brand text-zinc-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Settings className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {showNotificationSettings ? (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 overflow-y-auto pr-1"
                  >
                    <div className="space-y-4 py-2">
                      <div className="pb-2 border-b border-slate-100">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Notification Preferences</h4>
                        <p className="text-[10px] text-slate-500 font-bold">Control which activity alerts you receive</p>
                      </div>

                      <div className="space-y-3">
                        {[
                          { id: 'jobUpdates', label: 'Job & Booking Updates', icon: Briefcase, color: 'bg-brand/10 text-brand' },
                          { id: 'messages', label: 'Chat & Direct Messages', icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
                          { id: 'payments', label: 'Payments & Financials', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
                          { id: 'promotions', label: 'Platform & Promotions', icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
                        ].map((pref) => (
                          <div key={pref.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${pref.color}`}>
                                <pref.icon className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-black text-slate-700 tracking-tight">{pref.label}</span>
                            </div>
                            <button
                              onClick={() => {
                                triggerSound('click');
                                updateNotificationSettings({ [pref.id]: !notificationSettings[pref.id as keyof NotificationSettings] });
                              }}
                              className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${
                                notificationSettings[pref.id as keyof NotificationSettings] ? 'bg-brand' : 'bg-slate-300'
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                                  notificationSettings[pref.id as keyof NotificationSettings] ? 'left-5.5' : 'left-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={() => setShowNotificationSettings(false)}
                          className="w-full py-3 bg-neutral-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-800 transition-all active:scale-95 shadow-md"
                        >
                          Save & Back
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 overflow-y-auto pr-1 flex flex-col"
                  >
                    {/* Notification Categories Tabs */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide shrink-0">
                      {['All', 'High Priority', 'System', 'Jobs', 'Messages', 'Payments'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActiveNotificationCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                            activeNotificationCategory === cat 
                              ? 'bg-brand text-zinc-900 shadow-sm' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mb-4 shrink-0">
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="flex-1 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 rounded-xl py-2 active:scale-95 transition-all cursor-pointer"
                      >
                        Mark All Read
                      </button>
                      <button 
                        onClick={handleClearAll}
                        className="flex-1 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-xl py-2 active:scale-95 transition-all cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    {/* List Notifications */}
                    <div className="flex-1 overflow-y-auto space-y-3.5 pb-4 scrollbar-hide">
                      <AnimatePresence mode="popLayout" initial={false}>
                  {!filteredNotifications || filteredNotifications.length === 0 ? (
                    <motion.div 
                      key="empty-notif"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center py-12"
                    >
                      <p className="text-xs font-bold text-slate-400">You're all caught up.</p>
                    </motion.div>
                  ) : (
                    filteredNotifications.map((n) => (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100, transition: { duration: 0.3, ease: 'backIn' } }}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 rounded-2xl border flex gap-3 relative overflow-hidden transition-all cursor-pointer group ${
                          n.type === 'alert' || n.type === 'HIGH'
                            ? 'bg-rose-50/50 border-rose-100'
                            : n.isRead ? 'bg-slate-50/50 border-slate-100 opacity-75' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        {(n.type === 'alert' || n.type === 'HIGH') && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-rose-600" />
                        )}
                        
                        {!n.isRead && (
                          <div className="absolute top-4 right-10 w-2 h-2 bg-brand rounded-full shadow-[0_0_8px_rgba(255,193,7,0.6)]" />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className={`text-xs font-extrabold ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h4>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                              {n.createdAt && typeof n.createdAt !== 'string' && typeof n.createdAt.seconds === 'number'
                                ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'just now'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5 line-clamp-2">{n.message}</p>
                          
                          {n.requestId && n.type === 'booking' && (
                            (() => {
                              const req = serviceRequests.find(r => r.id === n.requestId);
                              if (req && req.status === 'requested') {
                                return (
                                  <div className="flex gap-2 mt-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateRequestStatus(n.requestId!, 'accepted');
                                        markAsRead(n.id);
                                      }}
                                      className="px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-black rounded-xl hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer active:scale-95"
                                    >
                                      Accept Offer
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateRequestStatus(n.requestId!, 'rejected');
                                        markAsRead(n.id);
                                      }}
                                      className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-500 text-[10px] font-black rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer active:scale-95"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                );
                              }
                              return null;
                            })()
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(n.id);
                            showToast("Notification removed", 'info');
                          }}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* --- SAVED FAVORITES (LIKED LISTINGS) CENTERED MODAL --- */}
      <AnimatePresence>
        {isSavedModalOpen && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 text-left">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => {
              setIsSavedModalOpen(false);
              setSelectedSavedDetail(null);
            }} />

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="bg-white rounded-3xl overflow-hidden max-h-[80vh] w-full max-w-sm flex flex-col shadow-2xl relative z-10 border border-slate-100"
            >
              {selectedSavedDetail ? (
                /* --- SUB-VIEW: DETAIL PREVIEW PANEL --- */
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Header Image */}
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex-shrink-0">
                    <img 
                      src={selectedSavedDetail.image} 
                      alt={selectedSavedDetail.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Back Button */}
                    <button
                      onClick={() => setSelectedSavedDetail(null)}
                      className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-md text-slate-800 rounded-full shadow-sm hover:bg-white transition-all active:scale-95 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>

                    {/* Quick Category Overlay */}
                    <span className="absolute bottom-4 left-4 text-[10px] font-black px-2.5 py-0.5 bg-brand text-zinc-900 rounded-full uppercase tracking-wider">
                      {selectedSavedDetail.category}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                        {selectedSavedDetail.title}
                      </h4>
                      {selectedSavedDetail.type !== 'doer' ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm font-extrabold text-zinc-900">
                            R {selectedSavedDetail.price}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">• {selectedSavedDetail.location}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-black text-slate-700">Trust Score: {selectedSavedDetail.price} pts</span>
                          <span className="text-[10px] text-slate-400 font-semibold">• {selectedSavedDetail.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100" />

                    {/* Doer / Seller Card */}
                    <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <img 
                        src={selectedSavedDetail.doerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80"} 
                        alt={selectedSavedDetail.doerName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black uppercase text-brand tracking-wider">Provider</span>
                        <h5 className="text-xs font-black text-slate-800 truncate leading-none mt-0.5">{selectedSavedDetail.doerName}</h5>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</h5>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {selectedSavedDetail.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        triggerSound('click');
                        toggleSaveItem(selectedSavedDetail.type, selectedSavedDetail.id);
                        setSelectedSavedDetail(null);
                        showToast("Removed from saved favorites", "info");
                      }}
                      className="flex-1 bg-white border border-slate-200 text-rose-500 rounded-xl py-2.5 font-bold text-xs hover:bg-rose-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5" fill="currentColor" />
                      Unlike
                    </button>

                    {selectedSavedDetail.type !== 'doer' && (
                      <button
                        onClick={() => {
                          triggerSound('success');
                          createRequest(selectedSavedDetail.id, selectedSavedDetail.type);
                          setTab('conversations');
                          setIsSavedModalOpen(false);
                          setSelectedSavedDetail(null);
                        }}
                        className="flex-1 bg-brand text-zinc-900 rounded-xl py-2.5 font-black text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {selectedSavedDetail.type === 'service' ? 'Book Now' : 'Buy Now'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* --- MAIN VIEW: LIST OF FAVORITES --- */
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Header */}
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span>Liked Listings</span>
                        <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                          {savedItems.length}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quickly access your pinned favorites</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {savedItems.length > 0 && (
                        <button
                          onClick={() => {
                            triggerSound('click');
                            setIsSelectMode(!isSelectMode);
                            setSelectedBatchKeys([]);
                          }}
                          className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            isSelectMode 
                              ? 'bg-rose-50 text-rose-600 border-rose-150 hover:bg-rose-100/80'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/80'
                          }`}
                        >
                          {isSelectMode ? 'Cancel' : 'Select'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsSavedModalOpen(false);
                          setIsSelectMode(false);
                          setSelectedBatchKeys([]);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-1.5 px-5 py-3 border-b border-slate-100 overflow-x-auto scrollbar-hide flex-shrink-0">
                    {([
                      { id: 'all', label: 'All' },
                      { id: 'service', label: 'Services' },
                      { id: 'product', label: 'Products' },
                      { id: 'doer', label: 'Doers' }
                    ] as const).map(pill => (
                      <button
                        key={pill.id}
                        onClick={() => { 
                          triggerSound('click'); 
                          setSavedFilterCategory(pill.id); 
                          setSelectedBatchKeys([]); // Reset selection on filter change
                        }}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all cursor-pointer ${
                          savedFilterCategory === pill.id
                            ? 'bg-zinc-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Favorites List Container */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {savedItems.filter(item => savedFilterCategory === 'all' || item.itemType === savedFilterCategory).length === 0 ? (
                      <div className="text-center py-12 px-4 space-y-2">
                        <div className="text-3xl">❤️</div>
                        <p className="text-xs font-bold text-slate-400">No matching favorites saved yet.</p>
                        <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mx-auto leading-normal">
                          Tap the heart ❤️ icon on service listings or seller profiles to pin them here!
                        </p>
                      </div>
                    ) : (
                      savedItems
                        .filter(item => savedFilterCategory === 'all' || item.itemType === savedFilterCategory)
                        .map(item => {
                          const details = getSavedItemDetails(item);
                          if (!details) return null;
                          const key = `${item.itemType}:${item.itemId}`;
                          const isChecked = selectedBatchKeys.includes(key);

                          return (
                            <motion.div
                              key={item.id}
                              whileHover={{ y: -1 }}
                              className={`p-2.5 rounded-2xl border flex items-center gap-3 justify-between transition-all cursor-pointer ${
                                isChecked 
                                  ? 'bg-rose-50/40 border-rose-100' 
                                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'
                              }`}
                              onClick={() => {
                                triggerSound('click');
                                if (isSelectMode) {
                                  setSelectedBatchKeys(prev => 
                                    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                                  );
                                } else if (details.type === 'doer') {
                                  setFocusedDoerId(details.id);
                                } else {
                                  setSelectedSavedDetail(details);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {isSelectMode && (
                                  <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                                    isChecked 
                                      ? 'bg-rose-500 border-rose-500 text-white' 
                                      : 'border-slate-300 bg-white hover:border-slate-400'
                                  }`}>
                                    {isChecked && (
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>
                                )}
                                <img 
                                  src={details.image} 
                                  className={`w-11 h-11 object-cover flex-shrink-0 border border-slate-200 ${details.type === 'doer' ? 'rounded-full' : 'rounded-xl'}`} 
                                  alt="" 
                                />
                                <div className="min-w-0 flex-1">
                                  <span className={`text-[8px] font-black uppercase tracking-wider block ${
                                    details.type === 'service' 
                                      ? 'text-brand' 
                                      : details.type === 'product' 
                                      ? 'text-emerald-600' 
                                      : 'text-indigo-600'
                                  }`}>
                                    {details.type}
                                  </span>
                                  <h5 className="text-xs font-black text-slate-800 truncate leading-snug">{details.title}</h5>
                                  <span className="text-[10px] font-semibold text-slate-400 block truncate">
                                    {details.type !== 'doer' ? `R ${details.price} • ${details.doerName}` : `Trust: ${details.price} pts`}
                                  </span>
                                </div>
                              </div>

                              {!isSelectMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerSound('click');
                                    toggleSaveItem(item.itemType, item.itemId);
                                    showToast(`Removed "${details.title}" from favorites`, 'info');
                                  }}
                                  className="p-2 hover:bg-rose-50 text-rose-500 rounded-full transition-all cursor-pointer flex-shrink-0 active:scale-90"
                                >
                                  <Heart className="w-4 h-4 fill-rose-500" />
                                </button>
                              )}
                            </motion.div>
                          );
                        })
                    )}
                  </div>

                  {/* Batch Actions Footer */}
                  {isSelectMode && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {selectedBatchKeys.length} Selected
                      </div>
                      <div className="flex gap-2">
                        {selectedBatchKeys.length > 0 && (
                          <button
                            onClick={() => {
                              triggerSound('click');
                              setSelectedBatchKeys([]);
                            }}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            Deselect All
                          </button>
                        )}
                        <button
                          disabled={selectedBatchKeys.length === 0}
                          onClick={() => {
                            const itemsToRemove = selectedBatchKeys.map(key => {
                              const [itemType, itemId] = key.split(':');
                              return { itemType: itemType as 'service' | 'product' | 'doer', itemId };
                            });
                            removeSavedItemsBatch(itemsToRemove);
                            setSelectedBatchKeys([]);
                            setIsSelectMode(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs ${
                            selectedBatchKeys.length === 0
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                              : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 cursor-pointer'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {focusedDoerId && (
        <DoerProfileModal
          doerId={focusedDoerId}
          onClose={() => setFocusedDoerId(null)}
        />
      )}

      {/* Payment Failed Actionable Alert Modal */}
      <AnimatePresence>
        {activeFailedPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 w-full max-w-sm text-center relative overflow-hidden"
              id="payment-failed-modal"
            >
              {/* Pulsing Alert Icon */}
              <div className="relative w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping opacity-30" />
                <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight">Secure Escrow Failed</h3>
              <p className="text-[10px] text-rose-600 font-extrabold uppercase tracking-widest mb-4">Transaction Interrupted</p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Service Title:</span>
                  <span className="text-slate-800 font-black truncate max-w-[150px]">{activeFailedPayment.title}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">50% Escrow Deposit:</span>
                  <span className="text-rose-600 font-black">R {activeFailedPayment.depositAmount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Recipient Doer:</span>
                  <span className="text-slate-800 font-black">{activeFailedPayment.recipientName}</span>
                </div>
                <div className="border-t border-slate-100 my-1 pt-1.5 flex justify-between items-start text-xs">
                  <span className="text-slate-400 font-bold shrink-0">Reason:</span>
                  <span className="text-rose-500 font-black text-right text-[11px] leading-tight">{activeFailedPayment.reason}</span>
                </div>
              </div>

              {paymentDiagnosticResult && (
                <div className="bg-violet-50/50 rounded-2xl p-3 border border-violet-100 text-left text-[10px] text-violet-800 font-mono leading-relaxed mb-4 whitespace-pre-line animate-fade-in">
                  <div className="font-extrabold uppercase text-[8px] text-violet-600 mb-1 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                    Clearing House Diagnostic
                  </div>
                  {paymentDiagnosticResult}
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  onClick={async () => {
                    triggerSound('cash');
                    const missingAmount = activeFailedPayment.depositAmount;
                    topUpWallet(Math.max(1000, missingAmount));
                    
                    setTimeout(async () => {
                      updateRequestStatus(activeFailedPayment.requestId, 'deposit_paid');
                      clearFailedPayment(activeFailedPayment.id);
                      setActiveFailedPayment(null);
                      setPaymentDiagnosticResult(null);
                      setIsCheckingPaymentStatus(false);
                      showToast(`🛡️ Payment Retried: Escrow deposit of R${missingAmount} secured!`, 'success');
                    }, 500);
                  }}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-98 cursor-pointer"
                  id="retry-payment-button"
                >
                  Top Up & Retry Payment
                </button>

                <button
                  disabled={isCheckingPaymentStatus}
                  onClick={() => {
                    triggerSound('click');
                    setIsCheckingPaymentStatus(true);
                    setPaymentDiagnosticResult(null);
                    setTimeout(() => {
                      setIsCheckingPaymentStatus(false);
                      triggerSound('success');
                      setPaymentDiagnosticResult(
                        `Escrow Verification Completed:\n• Provider API Status: FAILED (Err: 402 - Payment Required)\n• Diagnostic: Client wallet balance is R ${wallet?.balance || 0}, but R ${activeFailedPayment.depositAmount} is required for the 50% escrow down-payment.\n• Recommendation: Top up R ${Math.max(100, activeFailedPayment.depositAmount - (wallet?.balance || 0))} or use the Auto-Fund feature.`
                      );
                      showToast("Escrow diagnostic complete! 🔍", "success");
                    }, 1800);
                  }}
                  className="w-full py-2.5 bg-violet-50 hover:bg-violet-100 disabled:opacity-60 text-violet-700 border border-violet-150 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  id="check-payment-status-button"
                >
                  {isCheckingPaymentStatus ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-600" />
                      Checking Provider API...
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5 text-violet-600" />
                      Check Payment Status (API)
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      triggerSound('click');
                      setShowSupportModal(true);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    id="contact-support-button"
                  >
                    Contact Support
                  </button>
                  <button
                    onClick={() => {
                      triggerSound('click');
                      clearFailedPayment(activeFailedPayment.id);
                      setActiveFailedPayment(null);
                      setPaymentDiagnosticResult(null);
                      setIsCheckingPaymentStatus(false);
                    }}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-400 border border-slate-150 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                    id="dismiss-failed-button"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Support Chat Simulator Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-sm h-[480px] flex flex-col overflow-hidden relative"
              id="support-chat-modal"
            >
              {/* Support Header */}
              <div className="bg-zinc-950 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-zinc-900 font-black text-xs shrink-0">
                    🛡️
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black leading-tight">DOER Escrow Support</h4>
                    <span className="text-[8px] text-emerald-400 font-extrabold uppercase tracking-widest block">Agent Active • Online</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerSound('click');
                    setShowSupportModal(false);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                <div className="flex gap-2 text-left">
                  <span className="text-xs bg-white p-3 rounded-2xl rounded-tl-xs border border-slate-100 shadow-2xs font-medium text-slate-700 max-w-[80%]">
                    Hello! I am your DOER Escrow Concierge. I noticed a transaction failure alert in your account. How can I assist you in securing your escrow contract today?
                  </span>
                </div>

                {activeFailedPayment && (
                  <div className="flex justify-end">
                    <span className="text-xs bg-brand text-zinc-950 p-3 rounded-2xl rounded-tr-xs font-bold shadow-2xs max-w-[80%]">
                      I got an error trying to pay R {activeFailedPayment.depositAmount} for "{activeFailedPayment.title}".
                    </span>
                  </div>
                )}

                <div className="flex gap-2 text-left">
                  <span className="text-xs bg-white p-3 rounded-2xl rounded-tl-xs border border-slate-100 shadow-2xs font-medium text-slate-700 max-w-[80%]">
                    Ah, yes. The payment failed due to <strong>Insufficient Wallet Balance</strong>. You can retry instantly by clicking the "Top Up & Retry" button, which will automatically credit your account. Alternatively, you can add ZAR in the Wallet screen.
                  </span>
                </div>
              </div>

              {/* Quick Reply Actions */}
              <div className="p-3 bg-white border-t border-slate-100 space-y-2">
                <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest text-left px-1">Quick Actions</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      triggerSound('cash');
                      if (activeFailedPayment) {
                        const missingAmount = activeFailedPayment.depositAmount;
                        topUpWallet(Math.max(1000, missingAmount));
                        setTimeout(() => {
                          updateRequestStatus(activeFailedPayment.requestId, 'deposit_paid');
                          clearFailedPayment(activeFailedPayment.id);
                          setActiveFailedPayment(null);
                          setShowSupportModal(false);
                          showToast(`🛡️ Support assisted! Escrow deposit of R${missingAmount} secured!`, 'success');
                        }, 500);
                      } else {
                        topUpWallet(1000);
                        showToast("Account funded with R 1,000!", "success");
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-150 transition-all cursor-pointer"
                  >
                    ⚡ Auto-Fund & Secure Escrow
                  </button>
                  <button
                    onClick={() => {
                      triggerSound('click');
                      showToast("Escrow policy documentation downloaded! 📚", "info");
                    }}
                    className="px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-slate-600 border border-slate-150 rounded-full text-[10px] font-medium transition-all cursor-pointer"
                  >
                    📖 Read Escrow Rules
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      {/* Fully responsive viewport wrapper */}
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-150 flex items-center justify-center font-sans antialiased md:py-4 md:px-4">
        
        {/* Main app container: Full screen on mobile, elegant card on tablet/desktop */}
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl h-screen md:h-[94vh] bg-white md:rounded-[32px] md:shadow-2xl relative overflow-hidden flex flex-col md:border md:border-slate-100 transition-all">
          <AppContent />
        </div>

      </div>
    </AppProvider>
  );
}
