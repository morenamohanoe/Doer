/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRoleType = 'doer' | 'admin';

export interface UserRole {
  id: string;
  userId: string;
  role: UserRoleType;
  isActive: boolean;
  isPrimary?: boolean;
  activatedAt?: string;
  createdAt: string;
}

export type TrustLevelType = 'New User' | 'Active User' | 'Trusted User' | 'Top Rated User';
export type EscrowStatusType =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'deposit_paid'
  | 'in_progress'
  | 'awaiting_approval'
  | 'completed'
  | 'released'
  | 'disputed';

export interface User {
  id: string; // The uid
  uid: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  country?: string;
  province?: string;
  city?: string;
  physicalAddress?: string;
  postalCode?: string;
  avatarUrl: string;
  verificationStatus: 'unverified' | 'phone_verified' | 'identity_verified' | 'business_verified' | 'credentials_verified';
  credentialsVerified?: boolean;
  termsAccepted?: boolean;
  privacyPolicyAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
  locationId?: string;
  locationName?: string;
}

export interface DoerProfile {
  id: string; // The uid
  uid: string;
  displayName: string;
  gender?: string;
  bio?: string;
  shortIntroduction?: string;
  personalTagline?: string;
  coverImageUrl?: string;
  causesSupported?: string[];
  communityInvolvement?: string;
  occupation?: string;
  currentJobTitle?: string;
  employmentStatus?: string;
  yearsOfExperience?: number;
  industry?: string;
  specialization?: string;
  highestEducation?: string;
  college?: string;
  tradeSchool?: string;
  university?: string;
  graduationYear?: string;
  portfolioWebsite?: string;
  cvUrl?: string;
  resumeUrl?: string;
  categories?: string[];
  servicesOffered?: string[];
  serviceRadius?: number;
  remoteAvailable?: boolean;
  hourlyRate?: number;
  dailyRate?: number;
  startingPrice?: number;
  businessType?: string;
  teamSize?: string;
  travelDistance?: string; // or number
  title?: string;
  rating?: number;
  reviewCount?: number;
  completedJobsCount?: number;
  salesCount?: number;
  location?: string;
  skills?: string[];
  languages?: string[];
  bannerColor?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  activatedAt?: string;
  profileImageUrl?: string;
  portfolioImages?: string[];
  portfolioVideos?: string[];
  projectLinks?: string[];
  linkedInUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  xUrl?: string;
  githubUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  credentialsVerified?: boolean;
  verificationStatus?: string;
}

export interface UserInterests {
  uid: string;
  interests: string[];
  hobbies: string[];
}

export interface UserSkills {
  uid: string;
  skills: string[];
  toolsUsed: string[];
  softwareExpertise: string[];
}

export interface UserPortfolio {
  uid: string;
  images: string[];
  videos: string[];
  projects: string[];
}

export interface UserCertifications {
  uid: string;
  certifications: string[];
  professionalMemberships: string[];
}

export interface UserVerification {
  uid: string;
  governmentIdUrl?: string;
  passportUrl?: string;
  driversLicenseUrl?: string;
  proofOfAddressUrl?: string;
  utilityBillUrl?: string;
  selfieVerificationUrl?: string;
  backgroundCheckStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
}

export interface UserAvailability {
  uid: string;
  workingHours?: string;
  emergencyAvailability?: boolean;
  responseTime?: string;
  preferredWorkDays?: string[];
}

export interface UserSocialLinks {
  uid: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  x?: string;
  personalWebsite?: string;
}

export interface UserReferences {
  uid: string;
  referenceContacts: Array<{ name: string, phone: string, email: string, relation: string }>;
  emergencyContact?: { name: string, phone: string, relation: string };
}

export interface UserAddresses {
  uid: string;
}

export interface UserLanguages {
  uid: string;
  languagesSpoken: string[];
}

export interface ProfileCompletion {
  uid: string;
  profileStrength: number;
  details: {
    profileImage: number;
    coverImage: number;
    bio: number;
    address: number;
    skills: number;
    occupation: number;
    portfolio: number;
    references: number;
    verificationSubmitted: number;
    availability: number;
    languages: number;
    socialLinks: number;
  };
}

export interface TrustScore {
  id?: string;
  uid?: string;
  score: number;
  verificationScore?: number;
  reputationScore?: number;
  reliabilityScore?: number;
  activityScore?: number;
  level: TrustLevelType;
  identityTrust?: number;
  verificationTrust?: number;
  marketplaceTrust?: number;
  reviewTrust?: number;
  communicationTrust?: number;
  completionTrust?: number;
}

export interface RoleProfile extends DoerProfile {
  userId: string;
  role: string;
  completionRate?: number;
  trustScore?: TrustScore;
}

export interface RoleProgression {
  id: string;
  userId: string;
  role: 'doer';
  currentLevel: string; // 'Doer' | 'Verified Doer' | 'Trusted Doer' | 'Top Doer' | 'Premium Doer'
  nextLevelRequirements: {
    jobsNeeded?: number;
    trustScoreNeeded?: number;
    ratingNeeded?: number;
    identityVerifiedNeeded?: boolean;
  };
  progressPercent: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  status: 'pending' | 'approved' | 'archived';
  createdBy: string;
  createdAt: any;
  displayOrder?: number;
}

export interface CategoryRequest {
  id: string;
  name: string;
  requestedBy: string;
  requestedByEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Service {
  id: string;
  userId?: string;
  doerId: string;
  doerName: string;
  doerAvatar: string;
  doerTrustScore: number;
  title: string;
  description: string;
  price: number; // ZAR Rands
  priceUnit?: 'hr' | 'fixed' | 'night' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'negotiable';
  pricingType?: 'fixed' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'negotiable';
  category: string;
  categoryId?: string;
  categoryName?: string;
  location: string;
  featuredImageUrl?: string;
  imageUrls: string[];
  videoUrls?: string[];
  portfolioUrls?: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  isFeatured?: boolean;
}

export interface Product {
  id: string;
  doerId: string;
  doerName: string;
  doerAvatar: string;
  doerTrustScore: number;
  title: string;
  description: string;
  price: number; // ZAR Rands
  category: string;
  imageUrls: string[];
  stock: number;
  createdAt: string;
  isPopular?: boolean;
}

export interface ServiceRequest {
  id: string;
  serviceId?: string | null; // Optional if direct request
  productId?: string | null; // Optional if purchasing a physical product
  title: string;
  description: string;
  price: number;
  depositAmount: number; // 50%
  bookingOwnerName: string;
  bookingOwnerAvatar: string;
  bookingOwnerId: string;
  doerId: string;
  doerName: string;
  location: string;
  status: EscrowStatusType;
  createdAt: string;
  updatedAt: string;
  disputeReason?: string;
  isProductOrder?: boolean;
  scheduledCompletionTime?: string;
  completionDurationText?: string;
}

export interface EscrowTransaction {
  id: string;
  requestId: string;
  amount: number;
  depositAmount: number;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  bookingOwnerId: string;
  bookingOwnerName: string;
  bookingOwnerAvatar: string;
  doerId: string;
  doerName: string;
  doerAvatar: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  timestamp?: any;
  jobUpdateStatus?: EscrowStatusType; // For job state change logs in chat
  jobUpdateAmount?: number;
  bookingOwnerId?: string;
  doerId?: string;
  typing?: boolean;
  read?: boolean;
}

export interface NotificationSettings {
  jobUpdates: boolean;
  messages: boolean;
  payments: boolean;
  promotions: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  requestId?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Review {
  id: string;
  bookingId?: string;
  reviewerId?: string;
  authorId?: string;
  targetId: string; // Doer or Service ID
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number; // ZAR Rands
  escrowBalance: number; // Held funds
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  feeAmount: number;
  payoutAmount: number;
  bankName: string;
  accountNumber: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface P2PTransfer {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  reference: string;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  role: UserRoleType;
  type: 'identity' | 'business';
  status: 'pending' | 'approved' | 'rejected';
  documentUrl?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface PortfolioProject {
  id: string;
  userId: string; // The Doer profile ID
  title: string;
  description: string;
  category_id: string; // e.g. plumbing, gardening
  cover_image: string;
  isVerified: boolean; // Verified by DOER badge
  completedThroughDoer: boolean;
  views: number;
  rating: number;
  avgRating?: number; // for listing stats
  clientFeedback?: string; // from booking owner on complete
  beforeImage?: string; // before photo for before/after comparison
  afterImage?: string; // after photo for before/after comparison
  createdAt: string;
}

export interface PortfolioImage {
  id: string;
  projectId: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  sortOrder: number;
}

export interface SavedItem {
  id: string;
  userId: string;
  uid?: string;
  displayName?: string;
  itemType: 'service' | 'product' | 'doer';
  itemId: string;
  createdAt: string;
}

export interface Booking extends ServiceRequest {}

export interface BookingRequest {
  serviceId?: string;
  productId?: string;
  title: string;
  description: string;
  price: number;
  bookingOwnerId: string;
  doerId: string;
}

export interface BookingSummary {
  id: string;
  title: string;
  price: number;
  status: EscrowStatusType;
  bookingOwnerName: string;
  doerName: string;
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  bookingId: string;
  bookingOwnerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
}

export interface DashboardMetrics {
  totalEscrowVolume: number;
  activeBookingsCount: number;
  totalWalletsBalance: number;
  disputedRatio: number;
}

export interface AdminReports extends Report {}

export interface FailedPayment {
  id: string;
  requestId: string;
  title: string;
  depositAmount: number;
  totalAmount: number;
  reason: string;
  timestamp: string;
  recipientName: string;
}
