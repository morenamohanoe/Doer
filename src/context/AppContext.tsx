/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as firestore from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { createNotification } from '../lib/notifications';
import { debugServiceUpdate } from '../lib/diagnostic';
import {
  User,
  UserRole,
  UserRoleType,
  RoleProfile,
  RoleProgression,
  Service,
  ServiceCategory,
  Product,
  ServiceRequest,
  EscrowTransaction,
  Conversation,
  Message,
  Notification,
  NotificationSettings,
  Review,
  Wallet,
  Withdrawal,
  P2PTransfer,
  VerificationRequest,
  TrustScore,
  TrustLevelType,
  EscrowStatusType,
  Toast,
  PortfolioProject,
  PortfolioImage,
  SavedItem,
  CategoryRequest,
  FailedPayment
} from '../types';

interface AppContextProps {
  isOnboarded: boolean;
  onboardingStep: number;
  onboardingData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    location: string;
    locationId?: string;
    avatarUrl: string;
    goals: string[];
    categories: string[];
  };
  currentUser: User;
  currentRoles: UserRole[];
  activeRole: UserRoleType;
  roleProfiles: RoleProfile[];
  roleProgressions: RoleProgression[];
  services: Service[];
  products: Product[];
  serviceRequests: ServiceRequest[];
  escrowTransactions: EscrowTransaction[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  unreadCount: number;
  serviceCategories: ServiceCategory[];
  categoryRequests: CategoryRequest[];
  reviews: Review[];
  wallet: Wallet;
  withdrawals: Withdrawal[];
  p2pTransfers: P2PTransfer[];
  verificationRequests: VerificationRequest[];
  toasts: Toast[];
  portfolioProjects: PortfolioProject[];
  portfolioImages: PortfolioImage[];
  profile: any;
  loadingProfile: boolean;
  isAdmin: boolean;
  
  // Actions
  nextOnboardingStep: () => void;
  prevOnboardingStep: () => void;
  updateOnboardingData: (data: Partial<AppContextProps['onboardingData']>) => void;
  completeOnboarding: () => void;
  postService: (
    title: string,
    description: string,
    price: number,
    priceUnit: string,
    category: string,
    location: string,
    featuredImageUrl: string,
    imageUrls: string[],
    videoUrls: string[],
    portfolioUrls: string[]
  ) => void;
  deleteService: (serviceId: string) => Promise<void>;
  updateService: (serviceId: string, updatedFields: Partial<Service>) => Promise<void>;
  postProduct: (title: string, description: string, price: number, category: string, imageUrl: string, stock: number) => Promise<void>;
  deleteProduct?: (productId: string) => Promise<void>;
  createRequest: (entityId: string, type: 'service' | 'product', customPrice?: number) => void;
  updateRequestStatus: (requestId: string, nextStatus: EscrowStatusType, disputeReason?: string, scheduledCompletionTime?: string, completionDurationText?: string) => void;
  activeSystemReminders: any[];
  dismissSystemReminder: (id: string) => void;
  sendMessage: (conversationId: string, text: string, imageUrl?: string, systemStatus?: EscrowStatusType) => void;
  setTypingStatus: (conversationId: string, isTyping: boolean) => void;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  addReview: (targetId: string, rating: number, comment: string, customId?: string) => void;
  requestWithdrawal: (amount: number, bankName: string, accountNumber: string) => boolean;
  topUpWallet: (amount: number) => void;
  transferFunds: (recipientId: string, recipientName: string, amount: number, reference: string) => Promise<boolean>;
  submitVerification: (type: 'identity' | 'business') => void;
  markAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  deleteConversation: (conversationId: string) => void;
  triggerSound: (type: 'click' | 'success' | 'notification' | 'cash') => void;
  triggerVibration: (pattern: number | number[]) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number) => void;
  removeToast: (id: string) => void;
  addPortfolioProject: (
    title: string,
    description: string,
    categoryId: string,
    coverImage: string,
    beforeImage?: string,
    afterImage?: string,
    extraImages?: { imageUrl: string; caption: string }[]
  ) => void;
  incrementProjectViews: (projectId: string) => void;
  approveProjectVerification: (projectId: string) => void;
  savedItems: SavedItem[];
  toggleSaveItem: (itemType: 'service' | 'product' | 'doer', itemId: string) => void;
  removeSavedItemsBatch: (items: { itemType: 'service' | 'product' | 'doer'; itemId: string }[]) => void;
  isSavedItem: (itemType: 'service' | 'product' | 'doer', itemId: string) => boolean;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  isOnline: boolean;
  updateUserAvatar: (newUrl: string) => void;
  withdrawalFeePercentage: number;
  serviceFee: number;
  calculateNetEarnings: (amount: number) => number;
  calculateSystemCut: (amount: number) => number;
  failedPayments: FailedPayment[];
  addFailedPayment: (requestId: string, reason: string) => void;
  clearFailedPayment: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  filterLocation: string;
  setFilterLocation: (location: string) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Simple synthesizer for audio feedback without needing static files
const playSynthSound = (type: 'click' | 'success' | 'notification' | 'cash') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      // Arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.25);
      });
    } else if (type === 'notification') {
      // High double beep
      [660, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.12);
      });
    } else if (type === 'cash') {
      // Register chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn('Audio synthesis not allowed/supported yet:', e);
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const { profile, profileLoading } = useAuth(); // Get from AuthContext
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Search, category, and location filters for dynamic SEO and feeds
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- STATE BOUNDS ---
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('doer_onboarded') === 'true';
  });

  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardingData, setOnboardingData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    location: '',
    locationId: undefined as string | undefined,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    goals: [] as string[],
    categories: [] as string[],
  });

  // Database states initialized from seed or localstorage
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const stored = localStorage.getItem('doer_user');
    if (stored) return JSON.parse(stored);
    return {
      id: 'current-user-uuid',
      email: '',
      phoneNumber: '',
      firstName: '',
      lastName: '',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&fit=crop&q=80',
      verificationStatus: 'unverified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      locationName: 'Johannesburg'
    };
  });

  const [currentRoles, setCurrentRoles] = useState<UserRole[]>(() => {
    const stored = localStorage.getItem('doer_user_roles');
    if (stored) return JSON.parse(stored);
    return [
      {
        id: 'role-doer-1',
        userId: 'current-user-uuid',
        uid: 'current-user-uuid',
        displayName: 'Current User',
        role: 'doer',
        isActive: true,
        isPrimary: true,
        activatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [activeRole, setActiveRole] = useState<UserRoleType>(() => {
    return (localStorage.getItem('doer_active_role') as UserRoleType) || 'doer';
  });

  const [roleProfiles, setRoleProfiles] = useState<RoleProfile[]>(() => {
    const stored = localStorage.getItem('doer_profiles');
    if (stored) return JSON.parse(stored);
    
    // Add current user's default profiles
    const myProfiles: RoleProfile[] = [
      {
        id: 'my-doer-profile',
        userId: 'current-user-uuid',
        uid: 'current-user-uuid',
        displayName: 'Current User',
        role: 'doer',
        title: 'Freelance Professional',
        bio: 'Ready to offer outstanding local services and help people get things done!',
        hourlyRate: 150,
        rating: 0,
        reviewCount: 0,
        completedJobsCount: 0,
        salesCount: 0,
        completionRate: 100,
        location: 'Sandton, Johannesburg',
        skills: [],
        bannerColor: 'from-blue-500 to-teal-500',
        trustScore: { score: 10, verificationScore: 10, reputationScore: 0, reliabilityScore: 0, activityScore: 0, level: 'New User' }
      }
    ];
    return [...myProfiles, ];
  });
  const [roleProgressions, setRoleProgressions] = useState<RoleProgression[]>(() => {
    const stored = localStorage.getItem('doer_progressions');
    if (stored) return JSON.parse(stored);
    return [
      {
        id: 'prog-doer',
        userId: 'current-user-uuid',
        uid: 'current-user-uuid',
        displayName: 'Current User',
        role: 'doer',
        currentLevel: 'Doer',
        nextLevelRequirements: { jobsNeeded: 10, trustScoreNeeded: 70, ratingNeeded: 4.5, identityVerifiedNeeded: true },
        progressPercent: 20
      },
    ];
  });

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<CategoryRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const q = firestore.query(firestore.collection(db, 'services'));
    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setServiceCategories([]);
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setServices(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'services');
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const q = firestore.query(firestore.collection(db, 'products'));
    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProducts([]);
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return unsubscribe;
  }, [user]);

  // Schema auto-migration hook for existing services
  useEffect(() => {
    if (services.length > 0 && user) {
      services.forEach(async (srv) => {
        const needsPricingMigration = !srv.pricingType || srv.priceUnit === 'night';
        const needsCategoryMigration = !srv.categoryId || !srv.categoryName;
        const needsUserId = !srv.userId;
        
        if (needsPricingMigration || needsCategoryMigration || needsUserId) {
          const updatedSrv: any = { ...srv };
          
          if (!updatedSrv.userId) {
            updatedSrv.userId = srv.doerId || user.uid;
          }
          if (!updatedSrv.doerId) {
            updatedSrv.doerId = updatedSrv.userId;
          }
          
          if (!updatedSrv.pricingType || updatedSrv.priceUnit === 'night') {
            if (srv.priceUnit === 'night') {
              updatedSrv.pricingType = 'day';
              updatedSrv.priceUnit = 'day';
            } else if (srv.priceUnit === 'hr') {
              updatedSrv.pricingType = 'hour';
              updatedSrv.priceUnit = 'hour';
            } else if (srv.priceUnit === 'fixed') {
              updatedSrv.pricingType = 'fixed';
              updatedSrv.priceUnit = 'fixed';
            } else {
              updatedSrv.pricingType = 'fixed';
              updatedSrv.priceUnit = 'fixed';
            }
          }
          
          if (!updatedSrv.categoryId) {
            updatedSrv.categoryId = srv.category || 'homestay';
          }
          if (!updatedSrv.categoryName) {
            const catDoc = serviceCategories.find(c => c.id === updatedSrv.categoryId);
            updatedSrv.categoryName = catDoc ? catDoc.name : updatedSrv.categoryId;
          }
          if (!updatedSrv.updatedAt) {
            updatedSrv.updatedAt = new Date().toISOString();
          }

          // If current user is the owner, write migration
          const isOwner = updatedSrv.userId === user.uid;
          if (isOwner) {
            try {
              await firestore.setDoc(firestore.doc(db, 'services', srv.id), updatedSrv, { merge: true });
              console.log(`Successfully migrated service: ${srv.id}`);
            } catch (err) {
              console.error(`Failed migrating service document ${srv.id}:`, err);
            }
          }
        }
      });
    }
  }, [services, user, serviceCategories]);

  // Sync currentUser with real Auth profile
  useEffect(() => {
    if (user) {
      setCurrentUser((prev) => ({
        ...prev,
        id: user.uid,
        uid: user.uid,
        email: user.email || prev.email || '',
        ...(profile ? {
          phoneNumber: profile.phoneNumber || profile.phone || '',
          firstName: profile.firstName || '',
          middleName: profile.middleName || '',
          lastName: profile.lastName || '',
          avatarUrl: profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
          verificationStatus: profile.verificationStatus || 'unverified',
          createdAt: profile.createdAt || prev.createdAt,
          updatedAt: profile.updatedAt || new Date().toISOString(),
          city: profile.city || '',
          province: profile.province || '',
          physicalAddress: profile.physicalAddress || '',
          location: profile.location || '',
          locationName: profile.location || (profile.city ? `${profile.city}${profile.province ? `, ${profile.province}` : ''}` : prev.locationName),
          dateOfBirth: profile.dateOfBirth || '',
          gender: profile.gender || '',
          role: profile.role || 'doer',
        } : {})
      }));

      if (profile) {
        setIsOnboarded(!!profile.profileCompleted);
      }
      
      // Update role progression list
      setRoleProgressions((prev) =>
        prev.map((prog) =>
          prog.role === 'doer'
            ? {
                ...prog,
                userId: user.uid,
                uid: user.uid,
                displayName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : prog.displayName
              }
            : prog
        )
      );

      // Update active roles
      setCurrentRoles((prev) =>
        prev.map((r) => ({
          ...r,
          userId: user.uid,
          uid: user.uid,
          displayName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : r.displayName
        }))
      );
    }
  }, [user, profile]);

  // Sync doer_profiles and user_verifications in real-time
  useEffect(() => {
    if (!user) return;

    const unsubscribeDoer = firestore.onSnapshot(
      firestore.doc(db, 'doer_profiles', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoleProfiles((prev) => {
            const otherProfiles = prev.filter((p) => p.role !== 'doer' || p.userId !== user.uid);
            
            const skillsArray = Array.isArray(data.skills) ? data.skills : [];
            const languagesArray = Array.isArray(data.languages) ? data.languages : [];
            const categoriesArray = Array.isArray(data.categories) ? data.categories : [];
            const servicesOfferedArray = Array.isArray(data.servicesOffered) ? data.servicesOffered : [];

            const liveTrustScore = data.trustScore || {
              score: 15,
              level: 'New User',
              verificationScore: 15,
              reputationScore: 0,
              reliabilityScore: 0,
              activityScore: 0
            };

            const updatedDoerProfile: RoleProfile = {
              id: user.uid,
              uid: user.uid,
              userId: user.uid,
              role: 'doer',
              displayName: data.displayName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Doer',
              bio: data.bio || '',
              occupation: data.occupation || '',
              yearsOfExperience: Number(data.yearsOfExperience) || 0,
              highestEducation: data.highestEducation || data.education || '',
              skills: skillsArray,
              languages: languagesArray,
              categories: categoriesArray,
              servicesOffered: servicesOfferedArray,
              hourlyRate: Number(data.hourlyRate) || 150,
              rating: Number(data.averageRating) || Number(data.rating) || 0.0,
              reviewCount: Number(data.reviewCount) || 0,
              completedJobsCount: Number(data.completedJobsCount) || 0,
              salesCount: Number(data.salesCount) || 0,
              completionRate: 100,
              location: profile?.city ? `${profile.city}, ${profile.province || ''}` : (data.location || 'Johannesburg, Gauteng'),
              bannerColor: data.bannerColor || 'from-zinc-800 to-zinc-950',
              trustScore: liveTrustScore,
              isActive: data.isActive !== false,
              profileImageUrl: data.profileImageUrl || '',
              coverImageUrl: data.coverImageUrl || '',
              portfolioImages: Array.isArray(data.portfolioImages) ? data.portfolioImages : [],
              portfolioVideos: Array.isArray(data.portfolioVideos) ? data.portfolioVideos : [],
              projectLinks: Array.isArray(data.projectLinks) ? data.projectLinks : [],
              linkedInUrl: data.linkedInUrl || '',
              facebookUrl: data.facebookUrl || '',
              instagramUrl: data.instagramUrl || '',
              tiktokUrl: data.tiktokUrl || '',
              xUrl: data.xUrl || '',
              githubUrl: data.githubUrl || '',
              youtubeUrl: data.youtubeUrl || '',
              websiteUrl: data.websiteUrl || ''
            };

            return [...otherProfiles, updatedDoerProfile];
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `doer_profiles/${user.uid}`);
      }
    );

    const unsubscribeVer = firestore.onSnapshot(
      firestore.doc(db, 'user_verifications', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVerificationRequests((prev) => {
            const otherRequests = prev.filter((r) => r.userId !== user.uid);
            const reqs: VerificationRequest[] = [];
            
            if (data.governmentIdUrl) {
              reqs.push({
                id: `ver-${user.uid}-id`,
                userId: user.uid,
                userName: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Doer',
                role: 'doer',
                type: 'identity',
                status: data.backgroundCheckStatus === 'approved' ? 'approved' : (data.backgroundCheckStatus === 'rejected' ? 'rejected' : 'pending'),
                documentUrl: 'South African ID Card / Smart Card',
                createdAt: data.createdAt || new Date().toISOString()
              });
            }

            if (data.proofOfAddressUrl) {
              reqs.push({
                id: `ver-${user.uid}-poa`,
                userId: user.uid,
                userName: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Doer',
                role: 'doer',
                type: 'business',
                status: data.backgroundCheckStatus === 'approved' ? 'approved' : (data.backgroundCheckStatus === 'rejected' ? 'rejected' : 'pending'),
                documentUrl: 'Proof of Address Document',
                createdAt: data.createdAt || new Date().toISOString()
              });
            }

            return [...otherRequests, ...reqs];
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `user_verifications/${user.uid}`);
      }
    );

    const unsubscribeWallet = firestore.onSnapshot(
      firestore.doc(db, 'wallets', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWallet({
            id: docSnap.id,
            userId: user.uid,
            uid: user.uid,
            displayName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Current User',
            balance: data.balance || 0,
            escrowBalance: data.escrowBalance || 0,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `wallets/${user.uid}`);
      }
    );

    const unsubscribeWithdrawals = firestore.onSnapshot(
      firestore.query(firestore.collection(db, 'withdrawals'), firestore.where('userId', '==', user.uid)),
      (snapshot) => {
        const w: any[] = [];
        snapshot.forEach((doc) => {
          w.push({ id: doc.id, ...doc.data() });
        });
        w.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setWithdrawals(w);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `withdrawals`);
      }
    );

    // Dynamic P2P Transfers subscription & merge
    const sentMap = new Map<string, P2PTransfer>();
    const receivedMap = new Map<string, P2PTransfer>();

    const updateTransfersState = () => {
      const allTransfers = Array.from(new Set([...sentMap.keys(), ...receivedMap.keys()]))
        .map(id => sentMap.get(id) || receivedMap.get(id)!)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setP2PTransfers(allTransfers);
    };

    const unsubscribeSentTransfers = firestore.onSnapshot(
      firestore.query(
        firestore.collection(db, 'p2p_transfers'),
        firestore.where('senderId', '==', user.uid)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            sentMap.delete(change.doc.id);
          } else {
            const data = change.doc.data();
            sentMap.set(change.doc.id, {
              id: change.doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              recipientId: data.recipientId,
              recipientName: data.recipientName,
              amount: data.amount,
              reference: data.reference,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
            });
          }
        });
        updateTransfersState();
      },
      (error) => {
        console.error("Error subscribing to sent transfers:", error);
      }
    );

    const unsubscribeReceivedTransfers = firestore.onSnapshot(
      firestore.query(
        firestore.collection(db, 'p2p_transfers'),
        firestore.where('recipientId', '==', user.uid)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            receivedMap.delete(change.doc.id);
          } else {
            const data = change.doc.data();
            receivedMap.set(change.doc.id, {
              id: change.doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              recipientId: data.recipientId,
              recipientName: data.recipientName,
              amount: data.amount,
              reference: data.reference,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
            });
          }
        });
        updateTransfersState();
      },
      (error) => {
        console.error("Error subscribing to received transfers:", error);
      }
    );

    return () => {
      unsubscribeDoer();
      unsubscribeVer();
      unsubscribeWallet();
      unsubscribeWithdrawals();
      unsubscribeSentTransfers();
      unsubscribeReceivedTransfers();
    };
  }, [user, profile]);

  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem('doer_products');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    const stored = localStorage.getItem('doer_requests');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>(() => {
    const stored = localStorage.getItem('doer_escrow');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const stored = localStorage.getItem('doer_conversations');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem('doer_messages');
    if (stored) return JSON.parse(stored);
    return [];
  });

  // Real-time Conversations
  useEffect(() => {
    if (!user) return;
    const activeUid = user.uid;

    const q = firestore.query(
      firestore.collection(db, 'conversations'),
      firestore.or(
        firestore.where('doerId', '==', activeUid),
        firestore.where('bookingOwnerId', '==', activeUid)
      )
    );

    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      
      data.sort((a, b) => {
        const dateA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const dateB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return dateB - dateA;
      });
      
      setConversations(data);
    }, (error) => {
      console.warn("Conversations listener error:", error);
    });

    return unsubscribe;
  }, [user]);

  // Real-time Messages
  useEffect(() => {
    if (!user || conversations.length === 0) return;

    const conversationIds = conversations.map(c => c.id);
    // Firestore 'in' operator is limited to 10 items. For simplicity we'll just listen to all if few, or handle differently.
    // In a real app, you'd listen per active conversation or use a better query.
    // For now, let's just listen to all messages where sender or recipient could be the user? 
    // Actually, messages don't have recipientId usually, they have conversationId.
    
    // Better: listen to messages for the active conversation, but we need all messages for the list preview too?
    // Let's listen to all messages for conversations the user is part of.
    if (conversationIds.length === 0) return;

    // Chunking might be needed if > 10 conversations.
    const q = firestore.query(
      firestore.collection(db, 'messages'),
      firestore.where('conversationId', 'in', conversationIds.slice(0, 10))
    );

    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      data.sort((a, b) => {
        const valA = a.createdAt;
        const valB = b.createdAt;
        let dateA = 0;
        let dateB = 0;
        if (valA) {
          const rawA: any = valA;
          if (typeof rawA === 'object' && rawA !== null && 'toDate' in rawA && typeof rawA.toDate === 'function') {
            dateA = rawA.toDate().getTime();
          } else {
            dateA = new Date(rawA).getTime();
          }
        }
        if (valB) {
          const rawB: any = valB;
          if (typeof rawB === 'object' && rawB !== null && 'toDate' in rawB && typeof rawB.toDate === 'function') {
            dateB = rawB.toDate().getTime();
          } else {
            dateB = new Date(rawB).getTime();
          }
        }
        return dateB - dateA;
      });
      
      setMessages(data);
    }, (error) => {
      console.warn("Messages listener error:", error);
    });

    return unsubscribe;
  }, [user, conversations]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const q = firestore.query(firestore.collection(db, 'service_categories'));
    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setServiceCategories([]);
      } else {
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as ServiceCategory));
        // Sort by displayOrder ascending, then by name
        data.sort((a, b) => {
          const orderA = a.displayOrder !== undefined ? a.displayOrder : 999;
          const orderB = b.displayOrder !== undefined ? b.displayOrder : 999;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
        setServiceCategories(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'service_categories');
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const isUserAdmin = currentUser?.role === 'admin';
    if (!isUserAdmin) {
      setCategoryRequests([]);
      return;
    }
    const q = firestore.query(firestore.collection(db, 'category_requests'));
    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CategoryRequest));
      setCategoryRequests(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'category_requests');
    });
    return unsubscribe;
  }, [user]);

  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Realtime Service Requests
  useEffect(() => {
    if (!user) return;
    const activeUid = user.uid;

    const q = firestore.query(
      firestore.collection(db, 'service_requests'),
      firestore.or(
        firestore.where('doerId', '==', activeUid),
        firestore.where('bookingOwnerId', '==', activeUid)
      )
    );

    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceRequest[];
      
      setServiceRequests(requests);
      localStorage.setItem('doer_requests', JSON.stringify(requests));
      
      // Trigger profile recalculation
      recalculateMyProfiles(requests);
    }, (error) => {
      console.warn("Service requests listener error:", error);
    });

    return unsubscribe;
  }, [user]);
  
  // Realtime Reviews
  useEffect(() => {
    const q = firestore.query(firestore.collection(db, 'reviews'));
    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const allReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(allReviews);
      recalculateMyProfiles(undefined, allReviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    });
    return unsubscribe;
  }, []);

  const [wallet, setWallet] = useState<Wallet>(() => {
    const stored = localStorage.getItem('doer_wallet');
    if (stored) return JSON.parse(stored);
    return {
      id: 'wallet-uuid',
      userId: 'current-user-uuid',
        uid: 'current-user-uuid',
        displayName: 'Current User',
      balance: 0, // Starting balance ZAR R0
      escrowBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(() => {
    const stored = localStorage.getItem('doer_withdrawals');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [p2pTransfers, setP2PTransfers] = useState<P2PTransfer[]>(() => {
    const stored = localStorage.getItem('doer_p2p_transfers');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(() => {
    const stored = localStorage.getItem('doer_verifications');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>(() => {
    const stored = localStorage.getItem('doer_portfolio_projects');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>(() => {
    const stored = localStorage.getItem('doer_portfolio_images');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>(() => {
    const stored = localStorage.getItem('doer_failed_payments');
    if (stored) return JSON.parse(stored);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('doer_failed_payments', JSON.stringify(failedPayments));
  }, [failedPayments]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const stored = localStorage.getItem('doer_saved_items');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const stored = localStorage.getItem('doer_notification_settings');
    if (stored) return JSON.parse(stored);
    return {
      jobUpdates: true,
      messages: true,
      payments: true,
      promotions: true,
    };
  });

  const [withdrawalFeePercentage, setWithdrawalFeePercentage] = useState(0);
  const [serviceFee, setServiceFee] = useState(150);

  useEffect(() => {
    const docRef = firestore.doc(db, 'platform_settings', 'general');
    const unsubscribe = firestore.onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWithdrawalFeePercentage(data.withdrawalFeePercentage || 0);
        if (data.serviceFee !== undefined) {
          setServiceFee(data.serviceFee);
        }
      }
    }, (error) => {
      console.error("Error fetching platform settings:", error);
    });
    return unsubscribe;
  }, []);

  const calculateSystemCut = (amount: number) => {
    return (amount * withdrawalFeePercentage) / 100;
  };

  const calculateNetEarnings = (amount: number) => {
    return amount - calculateSystemCut(amount);
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
  };

  // Real-time Firestore sync for saved items
  useEffect(() => {
    if (!user || !currentUser || currentUser.id === 'current-user-uuid' || currentUser.id !== user.uid) {
      const stored = localStorage.getItem('doer_saved_items');
      if (stored) {
        setSavedItems(JSON.parse(stored));
      } else {
        setSavedItems([]);
      }
      return;
    }

    const q = firestore.query(
      firestore.collection(db, 'saved_items'),
      firestore.where('userId', '==', currentUser.id)
    );

    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const items: SavedItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SavedItem));
      
      items.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setSavedItems(items);
    }, (error) => {
      console.error("Error fetching saved items:", error);
      handleFirestoreError(error, OperationType.GET, 'saved_items');
    });

    return () => unsubscribe();
  }, [user, currentUser]);

  // --- SAVE TO LOCAL STORAGE ON STATE CHANGE ---
  useEffect(() => {
    localStorage.setItem('doer_saved_items', JSON.stringify(savedItems));
  }, [savedItems]);
  useEffect(() => {
    localStorage.setItem('doer_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('doer_user_roles', JSON.stringify(currentRoles));
  }, [currentRoles]);

  useEffect(() => {
    localStorage.setItem('doer_active_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem('doer_profiles', JSON.stringify(roleProfiles));
  }, [roleProfiles]);

  useEffect(() => {
    localStorage.setItem('doer_progressions', JSON.stringify(roleProgressions));
  }, [roleProgressions]);

  useEffect(() => {
    localStorage.setItem('doer_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('doer_requests', JSON.stringify(serviceRequests));
  }, [serviceRequests]);

  useEffect(() => {
    localStorage.setItem('doer_escrow', JSON.stringify(escrowTransactions));
  }, [escrowTransactions]);

  useEffect(() => {
    localStorage.setItem('doer_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('doer_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('doer_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('doer_wallet', JSON.stringify(wallet));
  }, [wallet]);

  // Real-time Firestore sync for portfolio projects
  useEffect(() => {
    const q = firestore.query(firestore.collection(db, 'portfolio_projects'));
    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const projects: PortfolioProject[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PortfolioProject));
      setPortfolioProjects(projects);
    }, (error) => {
      console.error("Error fetching portfolio projects:", error);
      handleFirestoreError(error, OperationType.GET, 'portfolio_projects');
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for portfolio images
  useEffect(() => {
    const q = firestore.query(firestore.collection(db, 'portfolio_images'));
    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const images: PortfolioImage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PortfolioImage));
      setPortfolioImages(images);
    }, (error) => {
      console.error("Error fetching portfolio images:", error);
      handleFirestoreError(error, OperationType.GET, 'portfolio_images');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('doer_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem('doer_p2p_transfers', JSON.stringify(p2pTransfers));
  }, [p2pTransfers]);

  useEffect(() => {
    localStorage.setItem('doer_verifications', JSON.stringify(verificationRequests));
  }, [verificationRequests]);

  useEffect(() => {
    localStorage.setItem('doer_portfolio_projects', JSON.stringify(portfolioProjects));
  }, [portfolioProjects]);

  useEffect(() => {
    localStorage.setItem('doer_portfolio_images', JSON.stringify(portfolioImages));
  }, [portfolioImages]);

  useEffect(() => {
    localStorage.setItem('doer_notification_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const triggerSound = (type: 'click' | 'success' | 'notification' | 'cash') => {
    playSynthSound(type);
  };

  const triggerVibration = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Haptic feedback not supported in this browser context", e);
      }
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  // --- ONBOARDING ENGINE ---
  const nextOnboardingStep = () => {
    triggerSound('click');
    setOnboardingStep((prev) => Math.min(prev + 1, 6));
  };

  const prevOnboardingStep = () => {
    triggerSound('click');
    setOnboardingStep((prev) => Math.max(prev - 1, 1));
  };

  const updateOnboardingData = (data: Partial<AppContextProps['onboardingData']>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
  };

  const completeOnboarding = async () => {
    triggerSound('success');
    
    if (user) {
      await firestore.setDoc(firestore.doc(firestore.collection(db, 'users'), user.uid), {
        firstName: onboardingData.firstName,
        lastName: onboardingData.lastName,
        phoneNumber: onboardingData.phoneNumber || '+27 82 123 4567',
        location: onboardingData.location,
        locationId: onboardingData.locationId || null,
        avatarUrl: onboardingData.avatarUrl,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    
    // ... rest of the sync state updates ...

    const updatedUser = {
      ...currentUser,
      firstName: onboardingData.firstName,
      lastName: onboardingData.lastName,
      phoneNumber: onboardingData.phoneNumber || '+27 82 123 4567',
      location: onboardingData.location,
      locationId: onboardingData.locationId,
      avatarUrl: onboardingData.avatarUrl
    };

    // Activate the corresponding roles from goal selection
    const updatedRolesList: UserRole[] = [
      {
        id: 'role-doer-1',
        userId: currentUser.id,
        role: 'doer',
        isActive: true,
        isPrimary: true,
        activatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    // Update profiles
    const updatedProfiles = roleProfiles.map((prof) => {
      if (prof.userId === currentUser.id) {
        return {
          ...prof,
          location: onboardingData.location,
          skills: onboardingData.categories,
          bio: `I am passionate about ${onboardingData.goals.includes('services') ? 'providing great local services' : 'selling gorgeous products'} in ${onboardingData.location.split(',')[0]}!`
        };
      }
      return prof;
    });

    setCurrentUser(updatedUser);
    setCurrentRoles(updatedRolesList);
    setRoleProfiles(updatedProfiles);
    setIsOnboarded(true);
    localStorage.setItem('doer_onboarded', 'true');
    
    // Switch to first role chosen or doer
    const initialRole: UserRoleType = 'doer';
    setActiveRole(initialRole);

    // Send high priority notification
    dispatchNotification('Onboarding Complete! 🚀', 'Your South African DOER account is fully active. Go ahead and start exploring.', 'alert');
  };

  const updateUserAvatar = (newUrl: string) => {
    setCurrentUser(prev => ({ ...prev, avatarUrl: newUrl }));
  };

  // --- HELPER TO DISPATCH NOTIFICATIONS ---
  const dispatchNotification = (title: string, message: string, type: string, actionUrl?: string, requestId?: string) => {
    createNotification(currentUser?.id || 'current-user-uuid', title, message, type, actionUrl, requestId);
  };

  // --- CALCULATION OF TRUST SCORE & PROGRESION ---
  const calculateMyTrustScore = (
    profile: RoleProfile,
    isPhoneVerif: boolean,
    isIdVerif: boolean,
    isBizVerif: boolean
  ): TrustScore => {
    // 1. Verification Score (Max 30)
    let verificationScore = 0;
    if (isPhoneVerif) verificationScore += 10;
    if (isIdVerif) verificationScore += 15;
    if (isBizVerif) verificationScore += 5;

    // 2. Reputation Score (Max 30)
    // Formula: (Rating / 5) * 30. If no reviews yet, default to starting score based on standard (e.g. 15)
    let reputationScore = 0;
    if (profile.reviewCount > 0) {
      reputationScore = Math.round((profile.rating / 5) * 30);
    } else {
      reputationScore = 15; // Starting reputation
    }

    // 3. Reliability Score (Max 25)
    // Based on job completion rate (default 100% -> 25 points, drops if lower)
    const reliabilityScore = Math.round((profile.completionRate / 100) * 25);

    // 4. Activity Score (Max 15)
    // 0.3 per completed job + 0.1 per product sold
    const rawActivity = (profile.completedJobsCount * 0.5) + (profile.salesCount * 0.1);
    const activityScore = Math.min(15, Math.ceil(rawActivity));

    // 5. Portfolio Bonus points (First verified project: +5, Five: +10, Ten: +15)
    const verifiedPortfolioCount = portfolioProjects.filter((p) => p.userId === profile.id && p.isVerified).length;
    let portfolioBonus = 0;
    if (verifiedPortfolioCount >= 10) portfolioBonus = 15;
    else if (verifiedPortfolioCount >= 5) portfolioBonus = 10;
    else if (verifiedPortfolioCount >= 1) portfolioBonus = 5;

    const score = verificationScore + reputationScore + reliabilityScore + activityScore + portfolioBonus;

    let level: TrustLevelType = 'New User';
    if (score >= 76) level = 'Top Rated User';
    else if (score >= 51) level = 'Trusted User';
    else if (score >= 26) level = 'Active User';

    return {
      score: Math.min(100, score),
      verificationScore,
      reputationScore,
      reliabilityScore,
      activityScore,
      level
    };
  };

  const runAutomaticProgressionChecks = (prof: RoleProfile) => {
    const isIdVerified = currentUser.verificationStatus === 'identity_verified' || currentUser.verificationStatus === 'business_verified';
    
    // Check upgrades for Doer
    if (prof.role === 'doer') {
      let nextLevel = 'Doer';
      let progressPercent = 10;

      if (prof.completedJobsCount >= 50 && prof.rating >= 4.7 && prof.trustScore.score >= 76) {
        nextLevel = 'Top Doer';
        progressPercent = 100;
      } else if (prof.completedJobsCount >= 10 && prof.trustScore.score > 70 && prof.rating > 4.5) {
        nextLevel = 'Trusted Doer';
        progressPercent = 75;
      } else if (isIdVerified) {
        nextLevel = 'Verified Doer';
        progressPercent = 50;
      }

      setRoleProgressions((prev) =>
        prev.map((p) => {
          if (p.role === 'doer') {
            const hasUpgraded = p.currentLevel !== nextLevel;
            if (hasUpgraded) {
              setTimeout(() => {
                dispatchNotification(
                  `🎉 Rank Up: ${nextLevel}!`,
                  `Congratulations! You have been upgraded to ${nextLevel}. Keep providing amazing services!`,
                  'HIGH'
                );
              }, 1000);
            }
            return {
              ...p,
              currentLevel: nextLevel,
              progressPercent
            };
          }
          return p;
        })
      );
    }
  };

  const recalculateMyProfiles = (newRequestList?: ServiceRequest[], newReviews?: Review[], updatedUserStatus?: string) => {
    const isPhoneVerif = true; // Onboarded users have phone verified
    const currentVerif = updatedUserStatus || currentUser.verificationStatus;
    const isIdVerif = currentVerif === 'identity_verified' || currentVerif === 'business_verified';
    const isBizVerif = currentVerif === 'business_verified';

    const requestsToCheck = newRequestList || serviceRequests;
    const reviewsToCheck = newReviews || reviews;

    setRoleProfiles((prev) => {
      const updated = prev.map((prof) => {
        if (prof.userId === currentUser.id) {
          // Count metrics
          const completedJobs = requestsToCheck.filter(
            (r) => r.doerId === currentUser.id && r.status === 'released' && !r.isProductOrder
          ).length;

          const totalJobsRequested = requestsToCheck.filter(
            (r) => r.doerId === currentUser.id && !r.isProductOrder
          ).length;

          const totalSales = requestsToCheck.filter(
            (r) => r.doerId === currentUser.id && r.status === 'released' && r.isProductOrder
          ).length;

          // Calculate custom average rating
          const myReviews = reviewsToCheck.filter((rv) => rv.targetId === prof.id);
          const avgRating = myReviews.length > 0 
            ? parseFloat((myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1))
            : (prof.rating || 0.0);

          // Calculate completion rate
          const completionRate = totalJobsRequested > 0 
            ? Math.round((completedJobs / totalJobsRequested) * 100)
            : 100;

          const updatedProf = {
            ...prof,
            completedJobsCount: completedJobs,
            salesCount: totalSales,
            rating: avgRating,
            reviewCount: myReviews.length,
            completionRate
          };

          const trustScore = calculateMyTrustScore(updatedProf, isPhoneVerif, isIdVerif, isBizVerif);
          const finalProf = { ...updatedProf, trustScore };

          // Run upgrades in background
          setTimeout(() => runAutomaticProgressionChecks(finalProf), 100);

          return finalProf;
        }
        return prof;
      });
      return updated;
    });
  };

  // --- PUBLISHING FUNCTIONS ---
  const postService = async (
    title: string,
    description: string,
    price: number,
    priceUnit: string,
    category: string,
    location: string,
    featuredImageUrl: string,
    imageUrls: string[],
    videoUrls: string[],
    portfolioUrls: string[]
  ) => {
    triggerSound('success');
    
    let pricingType: 'fixed' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'negotiable' = 'fixed';
    if (priceUnit === 'hr' || priceUnit === 'hour') pricingType = 'hour';
    else if (priceUnit === 'night' || priceUnit === 'day') pricingType = 'day';
    else if (priceUnit === 'week') pricingType = 'week';
    else if (priceUnit === 'month') pricingType = 'month';
    else if (priceUnit === 'year') pricingType = 'year';
    else if (priceUnit === 'negotiable') pricingType = 'negotiable';
    else if (priceUnit === 'fixed') pricingType = 'fixed';

    const serviceId = `srv-${Date.now()}`;
    const categoryDoc = serviceCategories.find(c => c.id === category);
    const categoryName = categoryDoc ? categoryDoc.name : category;

    const finalUserId = user?.uid || currentUser.id;

    const newService: Service = {
      id: serviceId,
      userId: finalUserId,
      doerId: finalUserId,
      doerName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'John Doe',
      doerAvatar: currentUser.avatarUrl,
      doerTrustScore: roleProfiles.find((p) => p.role === 'doer' && (p.userId === finalUserId))?.trustScore.score || roleProfiles.find((p) => p.role === 'doer')?.trustScore.score || 50,
      title,
      description,
      price: pricingType === 'negotiable' ? 0 : price,
      priceUnit: (priceUnit || pricingType) as any,
      pricingType,
      category,
      categoryId: category,
      categoryName,
      location,
      featuredImageUrl,
      imageUrls,
      videoUrls,
      portfolioUrls,
      rating: 0.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    try {
      await firestore.setDoc(firestore.doc(db, 'services', serviceId), newService);
      dispatchNotification('Service Published! 💼', `"${title}" is now live and visible to users.`, 'info');
      showToast(`Service "${title}" published! 💼`, 'success');
    } catch (err: any) {
      console.error("CRITICAL ERROR: Failed to publish service to Firestore:", err);
      console.error("Firestore Error Code:", err?.code);
      console.error("Firestore Error Message:", err?.message);
      showToast(`Publishing failed: ${err?.message || err}`, 'error');
      handleFirestoreError(err, OperationType.WRITE, 'services');
    }
  };

  const deleteService = async (serviceId: string) => {
    triggerSound('click');
    const previousServices = services;
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    try {
      await firestore.deleteDoc(firestore.doc(db, 'services', serviceId));
      dispatchNotification('Service Deleted 🗑️', 'The service listing has been removed.', 'info');
      showToast('Service listing deleted.', 'success');
    } catch (err: any) {
      console.error("Failed to delete service:", err);
      setServices(previousServices);
      handleFirestoreError(err, OperationType.DELETE, 'services');
    }
  };

  const updateService = async (serviceId: string, updatedFields: Partial<Service>) => {
    triggerSound('success');
    try {
      const payload: any = {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
      if (updatedFields.priceUnit) {
        let pricingType: 'fixed' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'negotiable' = 'fixed';
        const priceUnit = updatedFields.priceUnit;
        if (priceUnit === 'hr' || priceUnit === 'hour') pricingType = 'hour';
        else if (priceUnit === 'night' || priceUnit === 'day') pricingType = 'day';
        else if (priceUnit === 'week') pricingType = 'week';
        else if (priceUnit === 'month') pricingType = 'month';
        else if (priceUnit === 'year') pricingType = 'year';
        else if (priceUnit === 'negotiable') pricingType = 'negotiable';
        else if (priceUnit === 'fixed') pricingType = 'fixed';
        payload.pricingType = pricingType;
      }
      debugServiceUpdate(serviceId, payload);
      await firestore.updateDoc(firestore.doc(db, 'services', serviceId), payload);
      dispatchNotification('Service Updated 📝', 'Your changes have been saved.', 'info');
      showToast('Service updated successfully.', 'success');
    } catch (err: any) {
      console.error("Failed to update service:", err);
      handleFirestoreError(err, OperationType.UPDATE, 'services');
    }
  };

  const postProduct = async (
    title: string,
    description: string,
    price: number,
    category: string,
    imageUrl: string,
    stock: number
  ) => {
    triggerSound('success');
    const finalUserId = user?.uid || currentUser.id;
    const productId = `prd-${Date.now()}`;
    const newProduct: any = {
      id: productId,
      userId: finalUserId,
      doerId: finalUserId,
      doerName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Zama Zulu Crafts',
      doerAvatar: currentUser.avatarUrl,
      doerTrustScore: roleProfiles.find((p) => p.role === 'doer' && (p.userId === finalUserId))?.trustScore?.score || roleProfiles.find((p) => p.role === 'doer')?.trustScore?.score || 50,
      title,
      description,
      price,
      category,
      imageUrls: [imageUrl || 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=600&auto=format&fit=crop&q=80'],
      stock,
      createdAt: new Date().toISOString()
    };

    setProducts((prev) => [newProduct, ...prev]);
    try {
      await firestore.setDoc(firestore.doc(db, 'products', productId), newProduct);
      dispatchNotification('Product Published! 🛍️', `"${title}" has been listed on the marketplace.`, 'info');
      showToast(`Product "${title}" published! 🛍️`, 'success');
    } catch (err: any) {
      console.error("Failed to post product to Firestore:", err);
      showToast(`Failed to publish product to database: ${err?.message || err}`, 'error');
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const deleteProduct = async (productId: string) => {
    triggerSound('click');
    const previousProducts = products;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await firestore.deleteDoc(firestore.doc(db, 'products', productId));
      dispatchNotification('Product Deleted 🗑️', 'The product listing has been removed.', 'info');
      showToast('Product listing deleted.', 'success');
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      setProducts(previousProducts);
      handleFirestoreError(err, OperationType.DELETE, 'products');
    }
  };

  // --- ESCROW REQUEST ENGINE (ESCROW PAYMENTS SYSTEM) ---
  const createRequest = (entityId: string, type: 'service' | 'product', customPrice?: number) => {
    triggerSound('click');
    
    let title = '';
    let price = 0;
    let doerId = '';
    let doerName = '';
    let location = '';

    if (type === 'service') {
      const srv = services.find((s) => s.id === entityId);
      if (!srv) return;
      title = srv.title;
      price = customPrice || srv.price;
      doerId = srv.doerId;
      doerName = srv.doerName;
      location = srv.location;
    } else {
      const prd = products.find((p) => p.id === entityId);
      if (!prd) return;
      title = `Order: ${prd.title}`;
      price = prd.price;
      doerId = prd.doerId;
      doerName = prd.doerName;
      location = currentUser.location;
    }

    if (doerId === currentUser.id) {
      showToast("You cannot request or book your own listing!", "error");
      return;
    }

    // Prevent duplicate requests for the same job/listing while one is still active
    const existingActiveRequest = serviceRequests.find((r) => 
      r.bookingOwnerId === currentUser.id && 
      r.doerId === doerId && 
      ((type === 'service' && r.serviceId === entityId) || (type === 'product' && r.productId === entityId)) &&
      !['rejected', 'cancelled', 'refunded', 'released', 'completed', 'disputed'].includes(r.status)
    );

    if (existingActiveRequest) {
      showToast(`You already have an active request for "${title}". The DOER must accept or reject it first.`, 'error');
      return;
    }

    const requestId = `req-${Date.now()}`;
    const depositAmount = Math.round(price * 0.5); // 50% escrow deposit required

    const newRequest: ServiceRequest = {
      id: requestId,
      serviceId: type === 'service' ? entityId : null,
      productId: type === 'product' ? entityId : null,
      title,
      description: type === 'service' ? `On-demand service hire request.` : `Product order request.`,
      price,
      depositAmount,
      bookingOwnerId: currentUser.id,
      bookingOwnerName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Booking Owner',
      bookingOwnerAvatar: currentUser.avatarUrl,
      doerId,
      doerName,
      location,
      status: 'requested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isProductOrder: type === 'product'
    };

    const updatedRequests = [newRequest, ...serviceRequests];
    setServiceRequests(updatedRequests);

    // Sync to Firestore
    firestore.setDoc(firestore.doc(db, 'service_requests', requestId), newRequest)
      .catch(err => console.error("Failed to sync request to Firestore:", err));

    // Create Escrow Transaction record
    const newTx: EscrowTransaction = {
      id: `tx-${Date.now()}`,
      requestId,
      amount: price,
      depositAmount,
      status: 'held',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEscrowTransactions((prev) => [newTx, ...prev]);

    // Notify Doer about the new request
    const conversationId = `conv-${doerId}`;
    createNotification(
      doerId,
      'New Job Request! 📩',
      `${currentUser.firstName} wants to hire you for "${title}". Review and accept to start chatting.`,
      'booking',
      '/stats',
      requestId
    );

    dispatchNotification(
      'Request Sent! ⏳',
      `Your request for "${title}" has been sent to ${doerName}. You can start chatting once they accept.`,
      'info',
      '/stats'
    );

    // Notify Doer
    createNotification(
      doerId,
      'New Job Request! 📝',
      `${currentUser.firstName} wants to hire you for "${title}".`,
      'booking',
      '/stats'
    );

    showToast(`Request for "${title}" sent! ⏳`, 'success');

    // --- HIGH-FIDELITY SIMULATION ---
    // If renting from a mock/seed Doer (not current user), automate their accept/updates!
    if (doerId.startsWith('doer-') || doerId.startsWith('user-')) {
      setTimeout(() => {
        // Auto-accept request
        updateRequestStatus(requestId, 'accepted');
        
        // Send nice chat reply from Doer
        setTimeout(() => {
          const replies = [
            `Hi! I would love to assist you with this. Please pay the 50% deposit of R${depositAmount} so we can get started right away.`,
            `Great request! I am available to take this job. Once the secure escrow deposit of R${depositAmount} is made, I will start planning.`,
            `Pleasure connecting! I am fully prepped for this. I will look out for the deposit confirmation to begin!`
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          
          const doerReplyMsg: Message = {
            id: `msg-${Date.now() + 1}`,
            conversationId,
            senderId: doerId,
            receiverId: currentUser.id,
            senderName: doerName,
            text: randomReply,
            createdAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            read: false
          };
          setMessages((prev) => [doerReplyMsg, ...prev]);
          
          // Trigger notification
          dispatchNotification(
            `Message from ${doerName} 💬`,
            randomReply,
            'HIGH'
          );
        }, 1500);

      }, 3000);
    }
  };

  const simulateDoerMessage = (conversationId: string, doerId: string, doerName: string, receiverId: string, text: string) => {
    const activeConv = conversations.find(c => c.id === conversationId);
    const bookingOwnerId = activeConv ? activeConv.bookingOwnerId : receiverId;
    const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newMsg: Message = {
      id: msgId,
      conversationId,
      senderId: doerId,
      receiverId,
      senderName: doerName,
      text,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      bookingOwnerId,
      doerId,
      read: false
    };

    setMessages((prev) => [newMsg, ...prev]);

    firestore.setDoc(firestore.doc(db, 'messages', msgId), {
      ...newMsg,
      timestamp: firestore.serverTimestamp(),
      createdAt: firestore.serverTimestamp()
    }).catch(err => console.error("Failed to send simulated message to Firestore:", err));

    firestore.updateDoc(firestore.doc(db, 'conversations', conversationId), {
      lastMessage: text,
      lastMessageSenderId: doerId,
      lastMessageSenderName: doerName,
      lastMessageTime: firestore.serverTimestamp(),
      unreadCount: firestore.increment(1)
    }).catch(err => console.error("Failed to update conversation preview in Firestore:", err));
  };

  const updateRequestStatus = (
    requestId: string,
    nextStatus: EscrowStatusType,
    disputeReason?: string,
    scheduledCompletionTime?: string,
    completionDurationText?: string
  ) => {
    const req = serviceRequests.find((r) => r.id === requestId);
    if (!req) return;

    const conversationId = `conv-${req.doerId}`;

    // Apply strict business rules
    let logText = '';
    let isWalletImpact = false;
    let walletDiff = 0;
    let escrowDiff = 0;

    if (nextStatus === 'accepted') {
      logText = `Doer ${req.doerName} has accepted the job request! Please pay the 50% deposit of R${req.depositAmount} to secure the contract and commence work.`;
      
      // Haptic feedback
      triggerVibration([100, 50, 100]);

      // Notify Owner
      createNotification(
        req.bookingOwnerId,
        'Job Accepted! ✅',
        `${req.doerName} has accepted your job! Please pay the 50% deposit of R${req.depositAmount} to secure the contract so work can commence.`,
        'booking',
        '/stats'
      );

      showToast(`Job accepted! Please pay the R${req.depositAmount} deposit to secure the contract. 🛡️`, 'info');

      // NOW Create the Chat Conversation upon acceptance
      const conversationId = `conv-${req.doerId}`;
      let existingConv = conversations.find((c) => c.id === conversationId);
      
      if (!existingConv) {
        const doerProf = roleProfiles.find(p => p.id === req.doerId);
        const newConv: Conversation = {
          id: conversationId,
          bookingOwnerId: req.bookingOwnerId,
          bookingOwnerName: req.bookingOwnerName,
          bookingOwnerAvatar: req.bookingOwnerAvatar,
          doerId: req.doerId,
          doerName: req.doerName,
          doerAvatar: doerProf?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
          lastMessageText: `Job accepted: ${req.title}`,
          lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unreadCount: 1
        };
        
        firestore.setDoc(firestore.doc(db, 'conversations', conversationId), {
          ...newConv,
          createdAt: firestore.serverTimestamp()
        }).catch(err => console.error("Failed to create conversation in Firestore:", err));
      }

      // Initial System Message in chat
      const systemMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: conversationId,
        senderId: 'system',
        receiverId: req.bookingOwnerId,
        senderName: 'DOER Escrow',
        text: `Job request for "${req.title}" has been ACCEPTED. R${req.depositAmount} deposit is held in Escrow. You can now start communicating!`,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        jobUpdateStatus: 'accepted',
        bookingOwnerId: req.bookingOwnerId,
        doerId: req.doerId,
        read: false
      };
      
      firestore.setDoc(firestore.doc(db, 'messages', systemMsg.id), {
        ...systemMsg,
        timestamp: firestore.serverTimestamp(),
        createdAt: firestore.serverTimestamp()
      }).catch(err => console.error("Failed to create system message in Firestore:", err));

    } else if (nextStatus === 'rejected') {
      logText = `Job request for "${req.title}" was declined by the DOER.`;
      
      // Notify Owner
      createNotification(
        req.bookingOwnerId,
        'Job Declined ❌',
        `${req.doerName} is unavailable for this request at the moment.`,
        'alert',
        '/stats'
      );
      showToast(`Request declined by ${req.doerName}.`, 'warning');
    } else if (nextStatus === 'cancelled') {
      logText = `Job "${req.title}" was cancelled. 50% deposit (R${req.depositAmount}) refunded to Owner. Penalty deducted from Doer.`;
      
      // Refund Owner (if current user is owner)
      if (req.bookingOwnerId === currentUser.id) {
        isWalletImpact = true;
        walletDiff = req.depositAmount;
        escrowDiff = -req.depositAmount;
      }

      // Penalize Doer (Deduct from their account as per requirement)
      // If we have access to Firestore, we can try to penalize the doer even if we aren't them.
      if (req.doerId) {
        // We'll simulate the deduction in Firestore
        // Note: In a real app, this would be a secure Cloud Function
        const doerWalletRef = firestore.doc(db, 'wallets', req.doerId);
        firestore.getDoc(doerWalletRef).then((docSnap) => {
          if (docSnap.exists()) {
            const currentBal = docSnap.data().balance || 0;
            firestore.updateDoc(doerWalletRef, {
              balance: currentBal - req.depositAmount,
              updatedAt: firestore.serverTimestamp()
            });
          }
        }).catch(console.error);
        
        // If the current user IS the doer, we update local state too
        if (req.doerId === currentUser.id) {
          isWalletImpact = true;
          walletDiff = -req.depositAmount;
          escrowDiff = 0;
        }
      }

      createNotification(
        req.bookingOwnerId,
        'Job Cancelled ⛔',
        `The job "${req.title}" was cancelled. R${req.depositAmount} has been refunded to your wallet.`,
        'alert',
        '/stats'
      );
      createNotification(
        req.doerId,
        'Job Cancelled ⛔',
        `The job "${req.title}" was cancelled. A penalty of R${req.depositAmount} has been deducted from your account.`,
        'alert',
        '/stats'
      );
      showToast('Job cancelled and funds adjusted.', 'warning');
    } else if (nextStatus === 'deposit_paid') {
      logText = `Secure deposit of R${req.depositAmount} paid into DOER Escrow. Funds are safely held. Work has officially commenced.`;
      
      // Haptic feedback
      triggerVibration([150, 100, 150]);
      triggerSound('cash');

      // Notify Doer
      createNotification(
        req.doerId,
        'Deposit Received! 🔒',
        `Booking Owner ${req.bookingOwnerName} has paid the 50% deposit of R${req.depositAmount} into secure escrow. You can start working!`,
        'payment',
        '/stats'
      );

      // Take funds from Booking Owner wallet, hold in Escrow balance
      if (req.bookingOwnerId === currentUser.id) {
        // Check if booking owner has enough balance
        if (wallet.balance < req.depositAmount) {
          dispatchNotification('Insufficient Wallet Balance ❌', 'Please top up your wallet to pay the escrow deposit.', 'alert');
          showToast('Insufficient wallet balance!', 'error');
          addFailedPayment(requestId, 'Insufficient Wallet Balance');
          return;
        }
        isWalletImpact = true;
        walletDiff = -req.depositAmount;
        escrowDiff = req.depositAmount;
      }
      showToast(`Escrow deposit of R${req.depositAmount} paid! Work started. 🔒`, 'success');

      // --- HIGH-FIDELITY SIMULATION FOR MOCK DOERS ---
      if (req.doerId.startsWith('doer-') || req.doerId.startsWith('user-')) {
        const dId = req.doerId;
        const dName = req.doerName;
        const convId = `conv-${dId}`;
        const bookingOwnerId = req.bookingOwnerId;

        // 1. Simulate Doer starting the job after 3 seconds
        setTimeout(() => {
          updateRequestStatus(requestId, 'in_progress', undefined, undefined, '2 days');

          simulateDoerMessage(
            convId,
            dId,
            dName,
            bookingOwnerId,
            `Awesome! I have received confirmation of your deposit. Funds of R${req.depositAmount} are secured in DOER Escrow. I am officially starting the work now! 🛠️`
          );

          // 2. Simulate Doer completing the job after 5 seconds
          setTimeout(() => {
            updateRequestStatus(requestId, 'awaiting_approval');

            simulateDoerMessage(
              convId,
              dId,
              dName,
              bookingOwnerId,
              `Hi! I have successfully completed the work for "${req.title}". Please review the results and approve the contract to release the remaining balance. Thanks! 😊`
            );
          }, 5000);

        }, 3000);
      }
    } else if (nextStatus === 'in_progress') {
      logText = `Work status updated: In Progress.${completionDurationText ? ` Estimated completion: ${completionDurationText}.` : ''}`;
      showToast(`Job status updated to In Progress 🛠️${completionDurationText ? ` (${completionDurationText})` : ''}`, 'info');
    } else if (nextStatus === 'awaiting_approval') {
      logText = `Doer has marked the job as complete. Awaiting Booking Owner approval to release final funds.`;
      
      // Notify Owner
      createNotification(
        req.bookingOwnerId,
        'Approval Needed! 📝',
        `${req.doerName} has completed the job. Please inspect and approve to release the secure funds.`,
        'booking',
        '/stats'
      );
      showToast('Work completed! Awaiting approval 📝', 'info');
    } else if (nextStatus === 'completed') {
      logText = `Booking Owner approved the work! Outstanding balance of R${req.price - req.depositAmount} is now collected.`;
      triggerSound('cash');
      showToast('Work approved! Outstanding balance collected 💸', 'success');
      
      // Charge remainder from booking owner wallet and add full price to escrow hold
      if (req.bookingOwnerId === currentUser.id) {
        const remainder = req.price - req.depositAmount;
        isWalletImpact = true;
        walletDiff = -remainder;
        escrowDiff = remainder;
      }
    } else if (nextStatus === 'released') {
      logText = `All funds (R${req.price}) released to ${req.doerName}! Job successfully concluded. Thank you for using DOER.`;
      triggerSound('cash');

      // Notify Doer
      createNotification(
        req.doerId,
        'Earning Released! 💰',
        `R${req.price} has been credited to your wallet for "${req.title}". It is available for instant withdrawal!`,
        'payment',
        '/stats'
      );

      // Escrow releases to Doer wallet
      if (req.bookingOwnerId === currentUser.id) {
        isWalletImpact = true;
        escrowDiff = -req.price; // Clear escrow hold for this job

        // Credit Doer in Firestore
        if (req.doerId) {
          const doerWalletRef = firestore.doc(db, 'wallets', req.doerId);
          firestore.getDoc(doerWalletRef).then((docSnap) => {
            const currentBal = docSnap.exists() ? (docSnap.data().balance || 0) : 0;
            firestore.setDoc(doerWalletRef, {
              balance: currentBal + req.price,
              updatedAt: firestore.serverTimestamp()
            }, { merge: true });
          }).catch(console.error);
        }
      } else if (req.doerId === currentUser.id) {
        // If we are the doer, we see the impact in our local wallet
        isWalletImpact = true;
        walletDiff = req.price;
        escrowDiff = 0; 
      }
      showToast(`Funds of R${req.price} released successfully! 💰`, 'success');

      // --- HIGH-FIDELITY SIMULATION FOR MOCK DOERS ---
      if (req.doerId.startsWith('doer-') || req.doerId.startsWith('user-')) {
        const dId = req.doerId;
        const dName = req.doerName;
        const convId = `conv-${dId}`;
        const bookingOwnerId = req.bookingOwnerId;

        setTimeout(() => {
          simulateDoerMessage(
            convId,
            dId,
            dName,
            bookingOwnerId,
            `Thank you so much! I have received the payout of R${req.price}. It was a pleasure working with you. Please leave a review if you have a moment! 🙏✨`
          );
        }, 1500);
      }
    } else if (nextStatus === 'disputed') {
      logText = `Job placed under formal Dispute. Reason: "${disputeReason || 'Unsatisfactory quality'}". DOER Admin team is auditing.`;
      
      // Notify Both
      createNotification(
        req.bookingOwnerId,
        'Dispute Opened! ⚠️',
        `A dispute has been logged for "${req.title}". Hold tight while our support team reviews.`,
        'alert',
        '/stats'
      );
      createNotification(
        req.doerId,
        'Dispute Opened! ⚠️',
        `A dispute has been logged for "${req.title}". Hold tight while our support team reviews.`,
        'alert',
        '/stats'
      );
      showToast('Dispute opened and sent to support! ⚠️', 'warning');
    }

    // Update Request List state
    const updatedRequests = serviceRequests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: nextStatus,
          disputeReason: disputeReason || r.disputeReason,
          scheduledCompletionTime: scheduledCompletionTime || r.scheduledCompletionTime,
          completionDurationText: completionDurationText || r.completionDurationText,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });
    setServiceRequests(updatedRequests);

    // Sync to Firestore
    const firestoreUpdate: any = {
      status: nextStatus,
      updatedAt: firestore.serverTimestamp()
    };
    if (scheduledCompletionTime) firestoreUpdate.scheduledCompletionTime = scheduledCompletionTime;
    if (completionDurationText) firestoreUpdate.completionDurationText = completionDurationText;

    firestore.updateDoc(firestore.doc(db, 'service_requests', requestId), firestoreUpdate).catch(err => console.error("Failed to update request status in Firestore:", err));

    // Write system message inside chat
    const sysMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: 'system',
      receiverId: req.bookingOwnerId,
      senderName: 'DOER Escrow',
      text: logText,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      jobUpdateStatus: nextStatus,
      jobUpdateAmount: req.price,
      bookingOwnerId: req.bookingOwnerId,
      doerId: req.doerId,
      read: false
    };
    
    // Write message to Firestore for persistent chat log
    firestore.setDoc(firestore.doc(db, 'messages', sysMsg.id), {
      ...sysMsg,
      timestamp: firestore.serverTimestamp(),
      createdAt: firestore.serverTimestamp()
    }).catch(err => console.error("Failed to write system status log message to Firestore:", err));

    // Apply wallet impact
    if (isWalletImpact) {
      const newBalance = wallet.balance + walletDiff;
      const newEscrow = wallet.escrowBalance + escrowDiff;
      setWallet((prev) => ({
        ...prev,
        balance: newBalance,
        escrowBalance: newEscrow,
        updatedAt: new Date().toISOString()
      }));
      
      if (currentUser?.id) {
        firestore.setDoc(firestore.doc(db, 'wallets', currentUser.id), {
          balance: newBalance,
          escrowBalance: newEscrow,
          updatedAt: firestore.serverTimestamp()
        }, { merge: true }).catch(console.error);
      }
    }

    // Recalculate metrics on job completion
    if (nextStatus === 'released') {
      setTimeout(() => recalculateMyProfiles(updatedRequests), 200);
    }
  };

  // --- MESSAGING ENGINE ---
  const sendMessage = (conversationId: string, text: string, imageUrl?: string, systemStatus?: EscrowStatusType) => {
    triggerSound('click');
    const senderName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'John Doe';
    const activeConv = conversations.find(c => c.id === conversationId);
    
    const bookingOwnerId = activeConv ? activeConv.bookingOwnerId : currentUser.id;
    const doerId = activeConv ? activeConv.doerId : '';
    const recipientId = activeConv ? (activeConv.doerId === currentUser.id ? activeConv.bookingOwnerId : activeConv.doerId) : '';

    // Prevent users from sending messages to themselves
    if (currentUser.id && recipientId && currentUser.id === recipientId) {
      console.warn("Attempted to send message to oneself. Aborting.");
      showToast("You cannot send messages to yourself!", "error");
      return;
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      receiverId: recipientId,
      senderName,
      text,
      imageUrl,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      jobUpdateStatus: systemStatus,
      bookingOwnerId,
      doerId,
      read: false
    };

    // setMessages is handled by onSnapshot

    // Write message to Firestore
    firestore.setDoc(firestore.doc(db, 'messages', newMsg.id), {
      ...newMsg,
      timestamp: firestore.serverTimestamp(),
      createdAt: firestore.serverTimestamp()
    }).catch(err => console.error("Failed to send message to Firestore:", err));

    // Notify recipient
    if (activeConv) {
      createNotification(
        recipientId,
        `New Message from ${senderName} 💬`,
        text.length > 50 ? text.substring(0, 50) + '...' : text,
        'message',
        '/chats'
      );

      // Update conversation last message preview in Firestore
      firestore.updateDoc(firestore.doc(db, 'conversations', conversationId), {
        lastMessageText: text || 'Sent an image 📸',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: firestore.increment(1) // This is a bit naive but works for mock
      }).catch(err => console.error("Failed to update conversation in Firestore:", err));
    }

    // --- SIMULATED MOCK DOER REPLY ---
    if (activeConv && (activeConv.doerId.startsWith('doer-') || activeConv.doerId.startsWith('user-'))) {
      setTimeout(() => {
        const responses = [
          "Perfect, I've got that. See you soon!",
          "Excellent, thank you for clarifying. I am on track.",
          "Absolutely! I pride myself on high quality work. Will update you as soon as the next step is ready.",
          "Awesome. On my way! Please ensure geyser/power is accessible if necessary.",
          "That sounds perfect. I am wrapping up a quick task and then fully focused on your request."
        ];
        const textReply = responses[Math.floor(Math.random() * responses.length)];
        
        const doerReply: Message = {
          id: `msg-${Date.now() + 2}`,
          conversationId,
          senderId: activeConv.doerId,
          receiverId: activeConv.bookingOwnerId,
          senderName: activeConv.doerName,
          text: textReply,
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          bookingOwnerId: activeConv.bookingOwnerId,
          doerId: activeConv.doerId,
          read: false
        };

        if (doerReply.senderId === doerReply.receiverId) {
          console.warn("Mock doer reply would be to themselves. Aborting.");
          return;
        }

        // Write to Firestore
        firestore.setDoc(firestore.doc(db, 'messages', doerReply.id), {
          ...doerReply,
          timestamp: firestore.serverTimestamp(),
          createdAt: firestore.serverTimestamp()
        }).catch(err => console.error("Failed to send mock reply to Firestore:", err));

        triggerSound('notification');

        // Update conversation in Firestore
        firestore.updateDoc(firestore.doc(db, 'conversations', conversationId), {
          lastMessageText: textReply,
          lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unreadCount: firestore.increment(1)
        }).catch(err => console.error("Failed to update conversation in Firestore:", err));
      }, 2500);
    }
  };

  const setTypingStatus = (conversationId: string, isTyping: boolean) => {
    if (!currentUser || !currentUser.id) return;
    const activeConv = conversations.find(c => c.id === conversationId);
    if (!activeConv) return;
    const recipientId = activeConv.doerId === currentUser.id ? activeConv.bookingOwnerId : activeConv.doerId;

    const docId = `typing-${conversationId}-${currentUser.id}`;

    if (isTyping) {
      const typingMsg: Message = {
        id: docId,
        conversationId,
        senderId: currentUser.id,
        receiverId: recipientId,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'John Doe',
        text: 'typing...',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        typing: true,
        bookingOwnerId: activeConv.bookingOwnerId,
        doerId: activeConv.doerId
      };

      firestore.setDoc(firestore.doc(db, 'messages', docId), {
        ...typingMsg,
        timestamp: firestore.serverTimestamp(),
        createdAt: firestore.serverTimestamp()
      }).catch(err => console.error("Failed to set typing status:", err));
    } else {
      firestore.deleteDoc(firestore.doc(db, 'messages', docId))
        .catch(err => console.error("Failed to delete typing status:", err));
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!currentUser || !currentUser.id) return;

    // Find all unread messages received by current user in this conversation
    const unreadReceivedMessages = messages.filter(
      (m) => m.conversationId === conversationId && m.receiverId === currentUser.id && !m.read
    );

    if (unreadReceivedMessages.length === 0) return;

    const promises = unreadReceivedMessages.map((msg) => {
      return firestore.updateDoc(firestore.doc(db, 'messages', msg.id), {
        read: true
      }).catch(err => console.error("Failed to mark message as read:", err));
    });

    await Promise.all(promises);

    // Reset unread count for conversation in Firestore
    firestore.updateDoc(firestore.doc(db, 'conversations', conversationId), {
      unreadCount: 0
    }).catch(err => console.error("Failed to reset unread count:", err));
  };

  // --- REVIEWS ENGINE ---
  const addReview = async (targetId: string, rating: number, comment: string, customId?: string) => {
    if (!user) return;
    triggerSound('success');

    const reviewId = customId || firestore.doc(firestore.collection(db, 'reviews')).id;
    const newReview: Review = {
      id: reviewId,
      targetId,
      authorId: user.uid,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'User',
      authorAvatar: currentUser.avatarUrl || '',
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    try {
      await firestore.setDoc(firestore.doc(db, 'reviews', reviewId), newReview);
      dispatchNotification('Review Submitted! 🌟', 'Thank you for your feedback! This helps calculate the community Trust Score.', 'info');
      showToast('Review submitted successfully! 🌟', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit review', 'error');
    }
  };

  const addFailedPayment = (requestId: string, reason: string) => {
    const req = serviceRequests.find((r) => r.id === requestId);
    if (!req) return;

    const failedPayment: FailedPayment = {
      id: `fail-${Date.now()}`,
      requestId,
      title: req.title,
      depositAmount: req.depositAmount,
      totalAmount: req.price,
      reason,
      timestamp: new Date().toISOString(),
      recipientName: req.doerName,
    };

    setFailedPayments((prev) => [failedPayment, ...prev]);
  };

  const clearFailedPayment = (id: string) => {
    setFailedPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const topUpWallet = async (amount: number) => {
    if (!currentUser.id) return;
    triggerSound('cash');
    const newBalance = wallet.balance + amount;
    
    // Update local state immediately for fast feedback
    setWallet((prev) => ({
      ...prev,
      balance: newBalance,
      updatedAt: new Date().toISOString()
    }));
    
    try {
      await firestore.setDoc(firestore.doc(db, 'wallets', currentUser.id), {
        balance: newBalance,
        updatedAt: firestore.serverTimestamp()
      }, { merge: true });
      dispatchNotification('Wallet Topped Up! 💸', `Successfully added R${amount} to your DOER Wallet.`, 'payment');
      showToast(`R${amount} added to your wallet!`, 'success');
    } catch (e) {
      console.error('Error topping up:', e);
      showToast('Error updating wallet', 'error');
    }
  };

  const transferFunds = async (recipientId: string, recipientName: string, amount: number, reference: string): Promise<boolean> => {
    if (!currentUser.id) {
      showToast("Please login to transfer funds", "error");
      return false;
    }
    if (recipientId === currentUser.id) {
      showToast("You cannot transfer funds to your own wallet!", "error");
      return false;
    }
    if (amount <= 0) {
      showToast("Transfer amount must be greater than zero", "error");
      return false;
    }
    if (wallet.balance < amount) {
      showToast("Insufficient wallet balance!", "error");
      return false;
    }

    triggerSound('cash');
    const newSenderBalance = wallet.balance - amount;

    // Deduct locally immediately for fast visual feedback
    setWallet((prev) => ({
      ...prev,
      balance: newSenderBalance,
      updatedAt: new Date().toISOString()
    }));

    const transferId = `p2p-${Date.now()}`;
    const newTransfer: P2PTransfer = {
      id: transferId,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Doer Client',
      recipientId,
      recipientName,
      amount,
      reference,
      createdAt: new Date().toISOString()
    };

    // Update state instantly too
    setP2PTransfers((prev) => [newTransfer, ...prev]);

    try {
      const batch = firestore.writeBatch(db);

      // 1. Save transfer document
      batch.set(firestore.doc(db, 'p2p_transfers', transferId), {
        ...newTransfer,
        createdAt: firestore.serverTimestamp()
      });

      // 2. Deduct from sender's wallet in DB
      batch.set(firestore.doc(db, 'wallets', currentUser.id), {
        balance: newSenderBalance,
        updatedAt: firestore.serverTimestamp()
      }, { merge: true });

      // 3. Add to recipient's wallet in DB
      batch.set(firestore.doc(db, 'wallets', recipientId), {
        balance: firestore.increment(amount),
        updatedAt: firestore.serverTimestamp()
      }, { merge: true });

      await batch.commit();

      dispatchNotification(
        'Payment Sent! 💸',
        `Successfully transferred R${amount} to ${recipientName} (Ref: ${reference}).`,
        'payment'
      );
      showToast(`Transferred R${amount} to ${recipientName}!`, 'success');
      return true;
    } catch (e) {
      console.error('Error executing transfer:', e);
      showToast('Error transferring funds. Please try again.', 'error');
      
      // Revert wallet balance state on database error
      setWallet((prev) => ({
        ...prev,
        balance: prev.balance + amount,
        updatedAt: new Date().toISOString()
      }));
      return false;
    }
  };

  // --- WALLET WITHDRAWAL (FINANCIAL SYSTEMS) ---
  const requestWithdrawal = (amount: number, bankName: string, accountNumber: string): boolean => {
    if (!currentUser.id) return false;
    if (wallet.balance < amount) {
      dispatchNotification('Withdrawal Failed ❌', 'Insufficient funds available in your DOER wallet.', 'alert');
      showToast('Withdrawal failed: Insufficient wallet balance!', 'error');
      return false;
    }

    triggerSound('cash');

    const feeAmount = (amount * withdrawalFeePercentage) / 100;
    const payoutAmount = amount - feeAmount;

    const withdrawalId = `wth-${Date.now()}`;
    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      userId: currentUser.id,
      amount,
      feeAmount,
      payoutAmount,
      bankName,
      accountNumber,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);

    const newBalance = wallet.balance - amount;

    // Deduct instantly from balance locally
    setWallet((prev) => ({
      ...prev,
      balance: newBalance,
      updatedAt: new Date().toISOString()
    }));

    (async () => {
      try {
        const batch = firestore.writeBatch(db);
        batch.set(firestore.doc(db, 'withdrawals', withdrawalId), {
          ...newWithdrawal,
          createdAt: firestore.serverTimestamp()
        });
        batch.set(firestore.doc(db, 'wallets', currentUser.id), {
          balance: newBalance,
          updatedAt: firestore.serverTimestamp()
        }, { merge: true });
        
        await batch.commit();

        dispatchNotification(
          'Withdrawal Requested! 🏦',
          `Withdrawal of R${amount} submitted. Fee: R${feeAmount.toFixed(2)}, Payout: R${payoutAmount.toFixed(2)}.`,
          'payment'
        );
        showToast(`Withdrawal request submitted! 🏦`, 'success');

        // Auto-approve after 5 seconds for simulation delight
        setTimeout(async () => {
          try {
            await firestore.updateDoc(firestore.doc(db, 'withdrawals', withdrawalId), {
              status: 'completed'
            });
            setWithdrawals((prev) =>
              prev.map((w) => {
                if (w.id === withdrawalId) {
                  return { ...w, status: 'completed' };
                }
                return w;
              })
            );
            dispatchNotification(
              'Withdrawal Completed! ✅',
              `Your withdrawal of R${amount} has cleared successfully.`,
              'alert'
            );
            showToast(`Withdrawal of R${amount} completed! ✅`, 'success');
          } catch (e) {
            console.error('Error completing withdrawal', e);
          }
        }, 6000);
      } catch (e) {
        console.error('Error requesting withdrawal:', e);
        showToast('Error requesting withdrawal', 'error');
      }
    })();

    return true;
  };

  // --- IDENTITY & BUSINESS VERIFICATION ---
  const submitVerification = (type: 'identity' | 'business') => {
    triggerSound('success');
    
    const newReq: VerificationRequest = {
      id: `ver-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'John Doe',
      role: activeRole,
      type,
      status: 'pending',
      documentUrl: type === 'identity' ? 'South African ID Card / Smart Card' : 'CIPC Registration Certificate / Bank Confirmation Letter',
      createdAt: new Date().toISOString()
    };

    setVerificationRequests((prev) => [newReq, ...prev]);
    dispatchNotification('Verification Submitted! 🛡️', `Your ${type === 'identity' ? 'SA Smart ID' : 'CIPC business docs'} have been loaded. Admin will review within 2 hours.`, 'info');
    showToast(`Verification documents uploaded! 🛡️`, 'success');
  };

  // --- REAL-TIME NOTIFICATIONS ---
  const prevNotificationsRef = useRef<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = firestore.query(
      firestore.collection(db, 'notifications'),
      firestore.where('userId', '==', user.uid)
    );

    const unsubscribe = firestore.onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));

      newNotifications.sort((a, b) => {
        const dateA = a.createdAt ? (typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
        const dateB = b.createdAt ? (typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
        return dateB - dateA;
      });

      if (newNotifications.length > prevNotificationsRef.current.length) {
         triggerSound('notification');
      }
      
      const unread = newNotifications.filter(n => {
        if (n.isRead) return false;
        if (n.type === 'booking' && !notificationSettings.jobUpdates) return false;
        if (n.type === 'message' && !notificationSettings.messages) return false;
        if (n.type === 'payment' && !notificationSettings.payments) return false;
        if (n.type === 'promo' && !notificationSettings.promotions) return false;
        return true;
      }).length;
      setUnreadCount(unread);
      
      prevNotificationsRef.current = newNotifications;
      setNotifications(newNotifications);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user, notificationSettings]);

  // Background listener that checks payment status and forces a notifications refresh on request status update
  useEffect(() => {
    if (!user || serviceRequests.length === 0) return;

    const checkPaymentAndRefreshNotifications = async () => {
      try {
        const q = firestore.query(
          firestore.collection(db, 'notifications'),
          firestore.where('userId', '==', user.uid)
        );
        const snapshot = await firestore.getDocs(q);
        const newNotifications: Notification[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));

        newNotifications.sort((a, b) => {
          const dateA = a.createdAt ? (typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
          const dateB = b.createdAt ? (typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
          return dateB - dateA;
        });

        setNotifications(newNotifications);
        
        const unread = newNotifications.filter(n => {
          if (n.isRead) return false;
          if (n.type === 'booking' && !notificationSettings.jobUpdates) return false;
          if (n.type === 'message' && !notificationSettings.messages) return false;
          if (n.type === 'payment' && !notificationSettings.payments) return false;
          if (n.type === 'promo' && !notificationSettings.promotions) return false;
          return true;
        }).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error in background payment status listener:", err);
      }
    };

    checkPaymentAndRefreshNotifications();
  }, [serviceRequests, user, notificationSettings]);

  // --- NOTIFICATION MANAGEMENT ---
  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.isRead) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

    try {
      await firestore.updateDoc(firestore.doc(db, 'notifications', id), {
        isRead: true,
        updatedAt: firestore.serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
      // Revert if needed (onSnapshot will eventually fix it anyway)
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.isRead);
    if (unreadNotifs.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      const batch = firestore.writeBatch(db);
      unreadNotifs.forEach(n => {
        batch.update(firestore.doc(db, 'notifications', n.id), { isRead: true, updatedAt: firestore.serverTimestamp() });
      });
      await batch.commit();
      triggerSound('success');
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const clearNotification = async (id: string) => {
    if (!id) return;
    
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await firestore.deleteDoc(firestore.doc(db, 'notifications', id));
      triggerSound('click');
    } catch (err) {
      console.error("Failed to clear notification:", err);
      // Re-fetch or let onSnapshot handle recovery
    }
  };

  const clearAllNotifications = async () => {
    if (!notifications || notifications.length === 0) return;

    // Capture IDs before clearing state
    const idsToDelete = notifications.map(n => n.id);

    // Optimistic update
    setNotifications([]);
    setUnreadCount(0);

    try {
      // For large sets, we use a batch (limit 500)
      // If we have more than 500, we'll just do the first 500 for now or chunk it
      const batchSize = 450;
      const chunks = [];
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        chunks.push(idsToDelete.slice(i, i + batchSize));
      }

      for (const chunk of chunks) {
        const batch = firestore.writeBatch(db);
        chunk.forEach(id => {
          batch.delete(firestore.doc(db, 'notifications', id));
        });
        await batch.commit();
      }
      
      triggerSound('click');
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    }
  };

  const toggleSaveItem = async (itemType: 'service' | 'product' | 'doer', itemId: string) => {
    triggerSound('click');
    const isUserLoggedIn = user && currentUser && currentUser.id !== 'current-user-uuid' && currentUser.id === user.uid;

    if (isUserLoggedIn) {
      const docId = `${currentUser.id}_${itemId}`;
      const docRef = firestore.doc(db, 'saved_items', docId);

      try {
        const exists = savedItems.some((item) => item.itemType === itemType && item.itemId === itemId);
        if (exists) {
          await firestore.deleteDoc(docRef);
          showToast(`Removed from Saved Items`, 'info');
        } else {
          const newItem = {
            userId: currentUser.id,
            itemId,
            itemType,
            createdAt: new Date().toISOString()
          };
          await firestore.setDoc(docRef, newItem);
          showToast(`Saved to Favorites ❤️`, 'success');
        }
      } catch (error: any) {
        console.error("Error toggling saved item in Firestore:", error);
        handleFirestoreError(error, OperationType.WRITE, 'saved_items');
      }
    } else {
      setSavedItems((prev) => {
        const exists = prev.find((item) => item.itemType === itemType && item.itemId === itemId);
        if (exists) {
          showToast(`Removed from Saved Items`, 'info');
          return prev.filter((item) => !(item.itemType === itemType && item.itemId === itemId));
        } else {
          const newItem: SavedItem = {
            id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: 'current-user-uuid',
            uid: 'current-user-uuid',
            displayName: 'Current User',
            itemType,
            itemId,
            createdAt: new Date().toISOString()
          };
          showToast(`Saved to Favorites ❤️`, 'success');
          return [...prev, newItem];
        }
      });
    }
  };

  const removeSavedItemsBatch = async (itemsToRemove: { itemType: 'service' | 'product' | 'doer'; itemId: string }[]) => {
    triggerSound('click');
    const isUserLoggedIn = user && currentUser && currentUser.id !== 'current-user-uuid' && currentUser.id === user.uid;

    if (isUserLoggedIn) {
      try {
        const batch = firestore.writeBatch(db);
        let count = 0;
        itemsToRemove.forEach((item) => {
          const docId = `${currentUser.id}_${item.itemId}`;
          batch.delete(firestore.doc(db, 'saved_items', docId));
          count++;
        });
        if (count > 0) {
          await batch.commit();
          showToast(`Successfully removed ${count} items`, 'info');
        }
      } catch (error: any) {
        console.error("Error batch removing saved items in Firestore:", error);
        handleFirestoreError(error, OperationType.DELETE, 'saved_items');
      }
    } else {
      setSavedItems((prev) => {
        const filtered = prev.filter(
          (saved) => !itemsToRemove.some((rem) => rem.itemType === saved.itemType && rem.itemId === saved.itemId)
        );
        const countRemoved = prev.length - filtered.length;
        if (countRemoved > 0) {
          showToast(`Successfully removed ${countRemoved} items`, 'info');
        }
        return filtered;
      });
    }
  };

  const isSavedItem = (itemType: 'service' | 'product' | 'doer', itemId: string) => {
    return savedItems.some((item) => item.itemType === itemType && item.itemId === itemId);
  };

  const deleteConversation = async (conversationId: string) => {
    triggerSound('click');
    
    // Optimistic local update
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    setMessages(prev => prev.filter(m => m.conversationId !== conversationId));

    try {
      // Delete conversation doc
      await firestore.deleteDoc(firestore.doc(db, 'conversations', conversationId));
      
      // Delete associated messages (in chunks if many)
      const q = firestore.query(firestore.collection(db, 'messages'), firestore.where('conversationId', '==', conversationId));
      const snapshot = await firestore.getDocs(q);
      const batch = firestore.writeBatch(db);
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      showToast('Conversation deleted successfully', 'success');
    } catch (err) {
      console.error("Failed to delete conversation from Firestore:", err);
      showToast('Error deleting conversation', 'error');
    }
  };


  const addPortfolioProject = async (
    title: string,
    description: string,
    categoryId: string,
    coverImage: string,
    beforeImage?: string,
    afterImage?: string,
    extraImages?: { imageUrl: string; caption: string }[]
  ) => {
    triggerSound('success');
    const projectId = firestore.doc(firestore.collection(db, 'portfolio_projects')).id;
    const activeProfile = roleProfiles.find((p) => p.role === activeRole && p.userId === currentUser.id);
    const activeProfileId = activeProfile ? activeProfile.id : (currentUser?.id || 'my-doer-profile');

    const newProject: PortfolioProject = {
      id: projectId,
      userId: activeProfileId,
      title,
      description,
      category_id: categoryId,
      cover_image: coverImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
      isVerified: true, 
      completedThroughDoer: true,
      views: 1,
      rating: 0.0,
      avgRating: 0.0,
      createdAt: new Date().toISOString(),
      beforeImage,
      afterImage
    };

    try {
      await firestore.setDoc(firestore.doc(db, 'portfolio_projects', projectId), newProject);

      if (extraImages && extraImages.length > 0) {
        for (let i = 0; i < extraImages.length; i++) {
          const img = extraImages[i];
          const imageId = firestore.doc(firestore.collection(db, 'portfolio_images')).id;
          const newImage: PortfolioImage = {
            id: imageId,
            projectId,
            imageUrl: img.imageUrl,
            thumbnailUrl: img.imageUrl,
            caption: img.caption || '',
            sortOrder: i + 1
          };
          await firestore.setDoc(firestore.doc(db, 'portfolio_images', imageId), newImage);
        }
      }

      setTimeout(() => {
        recalculateMyProfiles();
      }, 100);

      dispatchNotification('Portfolio Project Added! 🎨', 'Adding a project is a great way to showcase your skills and boost your Trust Score.', 'info');
      showToast(`Portfolio project "${title}" created successfully! 🎨`, 'success');
    } catch (err) {
      console.error("Error adding portfolio project:", err);
      showToast('Failed to save portfolio project', 'error');
    }
  };

  const incrementProjectViews = (projectId: string) => {
    setPortfolioProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, views: p.views + 1 } : p))
    );
  };

  const approveProjectVerification = (projectId: string) => {
    setPortfolioProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          if (!p.isVerified) {
            showToast(`Project "${p.title}" verified! Trust Score boosted 🛡️`, 'success');
          }
          return { ...p, isVerified: true };
        }
        return p;
      })
    );
    setTimeout(() => {
      recalculateMyProfiles();
    }, 100);
  };

  const [activeSystemReminders, setActiveSystemReminders] = useState<any[]>([]);

  const dismissSystemReminder = (id: string) => {
    setActiveSystemReminders(prev => prev.filter(r => r.id !== id));
  };

  // Check for upcoming job completions
  useEffect(() => {
    if (!currentUser) return;
    
    const checkInterval = setInterval(() => {
      const now = new Date();
      const inProgressRequests = serviceRequests.filter(r => 
        r.status === 'in_progress' && 
        r.scheduledCompletionTime &&
        (r.bookingOwnerId === currentUser.id || r.doerId === currentUser.id)
      );
      
      inProgressRequests.forEach(req => {
        if (!req.scheduledCompletionTime) return;
        
        const completionTime = new Date(req.scheduledCompletionTime);
        const diffMs = completionTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        // If within 1 hour, and greater than 0
        if (diffHours > 0 && diffHours <= 1) {
          const reminderId = `reminder-${req.id}-1hr`;
          
          setActiveSystemReminders(prev => {
            if (!prev.find(r => r.id === reminderId)) {
              // Trigger local push notification
              if ('Notification' in window && window.Notification.permission === 'granted') {
                new window.Notification('Job Ending Soon', {
                  body: `The job "${req.title}" is scheduled to complete in less than 1 hour.`,
                  icon: '/favicon.ico'
                });
              }
              
              // Return updated state
              return [...prev, {
                id: reminderId,
                title: 'Job Ending Soon',
                message: `The job "${req.title}" is scheduled to complete in less than 1 hour.`,
                requestId: req.id
              }];
            }
            return prev;
          });
        }
      });
    }, 60000); // Check every minute
    
    // Check permission
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
    
    return () => clearInterval(checkInterval);
  }, [serviceRequests, currentUser]);

  return (
    <AppContext.Provider
      value={{
        isOnboarded,
        onboardingStep,
        onboardingData,
        currentUser,
        currentRoles,
        activeRole,
        roleProfiles,
        roleProgressions,
        services,
        products,
        serviceRequests,
        escrowTransactions,
        conversations,
        messages,
        notifications,
        notificationSettings,
        updateNotificationSettings,
        unreadCount,
        serviceCategories,
        categoryRequests,
        reviews,
        wallet,
        withdrawals,
        p2pTransfers,
        verificationRequests,
        toasts,
        portfolioProjects,
        portfolioImages,
        profile,
        loadingProfile: profileLoading,
        isAdmin,
        
        nextOnboardingStep,
        prevOnboardingStep,
        updateOnboardingData,
        completeOnboarding,
        postService,
        deleteService,
        updateService,
        postProduct,
        deleteProduct,
        createRequest,
        updateRequestStatus,
        sendMessage,
        setTypingStatus,
        markMessagesAsRead,
        addReview,
        requestWithdrawal,
        topUpWallet,
        transferFunds,
        submitVerification,
        markAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        clearAllNotifications,
        deleteConversation,
        triggerSound,
        triggerVibration,
        showToast,
        removeToast,
        addPortfolioProject,
        incrementProjectViews,
        approveProjectVerification,
        savedItems,
        toggleSaveItem,
        removeSavedItemsBatch,
        isSavedItem,
        setNotifications,
        isOnline,
        updateUserAvatar,
        withdrawalFeePercentage,
        serviceFee,
        calculateNetEarnings,
        calculateSystemCut,
        activeSystemReminders,
        dismissSystemReminder,
        failedPayments,
        addFailedPayment,
        clearFailedPayment,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        filterLocation,
        setFilterLocation
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
