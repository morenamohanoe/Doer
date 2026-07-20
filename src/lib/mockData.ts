/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceCategory, ProductCategory, Service, Product, RoleProfile, Review } from '../types';

export const SOUTH_AFRICAN_LOCATIONS = [
  'Sandton, Johannesburg',
  'Soweto, Johannesburg',
  'Green Point, Cape Town',
  'Stellenbosch, Western Cape',
  'Rosebank, Johannesburg',
  'Umhlanga, Durban',
  'Hatfield, Pretoria',
  'Khayelitsha, Cape Town',
  'Rondebosch, Cape Town',
  'Mamelodi, Pretoria'
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: 'Droplet',
    color: 'from-blue-500 to-indigo-600',
    description: 'Professional plumbing services: leaks, blockages, geysers, and pipe installations',
    status: 'approved',
    createdBy: 'system',
    createdAt: '2026-06-01T00:00:00Z'
  },
  {
    id: 'gardening',
    name: 'Gardening & Landscaping',
    icon: 'Leaf',
    color: 'from-emerald-500 to-teal-600',
    description: 'Expert garden maintenance, lawn mowing, landscaping, and tree felling',
    status: 'approved',
    createdBy: 'system',
    createdAt: '2026-06-01T00:00:00Z'
  },
  {
    id: 'beauty',
    name: 'Beauty & Hair',
    icon: 'Sparkles',
    color: 'from-pink-500 to-rose-600',
    description: 'Hairstyling, makeup, nails, and personal grooming services',
    status: 'approved',
    createdBy: 'system',
    createdAt: '2026-06-01T00:00:00Z'
  },
  {
    id: 'construction',
    name: 'Construction & Painting',
    icon: 'Home',
    color: 'from-orange-500 to-red-600',
    description: 'Building renovations, plastering, tiling, and interior/exterior painting',
    status: 'approved',
    createdBy: 'system',
    createdAt: '2026-06-01T00:00:00Z'
  },
  {
    id: 'electrical',
    name: 'Electrical & Solar',
    icon: 'Flame',
    color: 'from-amber-500 to-orange-600',
    description: 'Electrical installations, load-shedding backup solutions, and solar setups',
    status: 'approved',
    createdBy: 'system',
    createdAt: '2026-06-01T00:00:00Z'
  }
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'crafts', name: 'Handmade Crafts', icon: 'Gift', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'food', name: 'Artisanal Food', icon: 'UtensilsCrossed', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'apparel', name: 'Clothing & Fashion', icon: 'Shirt', color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { id: 'home', name: 'Home & Decor', icon: 'Home', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'tech', name: 'Electronics & Gear', icon: 'Cpu', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' }
];

// Seed profiles with computed trust scores using the requested formula:
// Verification (Max 30) + Reputation (Max 30) + Reliability (Max 25) + Activity (Max 15)
export const SEED_DOERS: RoleProfile[] = [
  {
    id: 'doer-1',
    userId: 'user-doer-1',
    uid: 'user-doer-1',
    displayName: 'Mock Doer 1',
    role: 'doer',
    title: 'Professional Plumber & Gas Installer',
    bio: '10 years experience in commercial and residential plumbing in Jozi. Certified PIRB plumber. Solves leaks, blockages, geysers, and gas setups.',
    hourlyRate: 350,
    rating: 4.9,
    reviewCount: 34,
    completionRate: 98,
    completedJobsCount: 88,
    salesCount: 0,
    location: 'Sandton, Johannesburg',
    skills: ['Geyser replacement', 'Leak detection', 'Drain cleaning', 'Gas COC'],
    bannerColor: 'from-sky-500 to-indigo-600',
    trustScore: {
      score: 93, // Verified=30 (Phone=10, Id=15, Biz=5), Reputation=29 (4.9 rating), Reliability=24 (98% comp), Activity=10 (88 jobs)
      verificationScore: 30,
      reputationScore: 29,
      reliabilityScore: 24,
      activityScore: 10,
      level: 'Top Rated User'
    }
  },
  {
    id: 'doer-2',
    userId: 'user-doer-2',
    uid: 'user-doer-2',
    displayName: 'Mock Doer 2',
    role: 'doer',
    title: 'Eco Gardening & Landscaping Expert',
    bio: 'Bringing life to South African gardens. Specialized in indigenous water-wise landscaping, garden cleanups, tree felling, and routine care.',
    hourlyRate: 180,
    rating: 4.8,
    reviewCount: 22,
    completionRate: 95,
    completedJobsCount: 42,
    salesCount: 0,
    location: 'Green Point, Cape Town',
    skills: ['Lawn mowing', 'Indigenous plants', 'Tree trimming', 'Irrigation'],
    bannerColor: 'from-emerald-400 to-teal-600',
    trustScore: {
      score: 82, // Verified=25 (Phone=10, Id=15), Reputation=28 (4.8 rating), Reliability=23, Activity=6
      verificationScore: 25,
      reputationScore: 28,
      reliabilityScore: 23,
      activityScore: 6,
      level: 'Top Rated User'
    }
  },
  {
    id: 'doer-3',
    userId: 'user-doer-3',
    uid: 'user-doer-3',
    displayName: 'Mock Doer 3',
    role: 'doer',
    title: 'Experienced Matric Tutor (Math & Physical Science)',
    bio: 'BSc Graduate from Wits tutoring high school and varsity students. Helping matriculants unlock A-grade averages with easy explanations.',
    hourlyRate: 200,
    rating: 4.7,
    reviewCount: 15,
    completedJobsCount: 18,
    salesCount: 0,
    completionRate: 100,
    location: 'Rosebank, Johannesburg',
    skills: ['Matric Prep', 'Calculus', 'Chemistry', 'Exam Drills'],
    bannerColor: 'from-violet-400 to-fuchsia-600',
    trustScore: {
      score: 74, // Verified=25, Reputation=27 (4.7 rating), Reliability=25 (100% comp), Activity=3
      verificationScore: 25,
      reputationScore: 27,
      reliabilityScore: 25,
      activityScore: 3,
      level: 'Trusted User'
    }
  },
  {
    id: 'doer-4',
    userId: 'user-doer-4',
    uid: 'user-doer-4',
    displayName: 'Mock Doer 4',
    role: 'doer',
    title: 'Professional Hair Braider & Wig Stylist',
    bio: 'Creative styles right in the comfort of your home or at my studio in Soweto. Knotless braids, faux locs, stitch lines, and custom wig installations.',
    hourlyRate: 150,
    rating: 5.0,
    reviewCount: 48,
    completedJobsCount: 65,
    salesCount: 0,
    completionRate: 96,
    location: 'Soweto, Johannesburg',
    skills: ['Knotless Braids', 'Wig installation', 'Conrows', 'Kids hairstyles'],
    bannerColor: 'from-rose-400 to-pink-600',
    trustScore: {
      score: 89, // Verified=25, Reputation=30 (5.0 rating), Reliability=24, Activity=10
      verificationScore: 25,
      reputationScore: 30,
      reliabilityScore: 24,
      activityScore: 10,
      level: 'Top Rated User'
    }
  },
  {
    id: 'doer-5',
    userId: 'user-doer-5',
    uid: 'user-doer-5',
    displayName: 'Mock Doer 5',
    role: 'doer',
    title: 'Karoo Biltong & Artisanal Foods',
    bio: 'Selling authentic, premium sliced beef biltong, drywors, and chili bites made using original secret family spices from the Karoo.',
    rating: 4.9,
    reviewCount: 120,
    completedJobsCount: 0,
    salesCount: 230,
    completionRate: 99,
    location: 'Hatfield, Pretoria',
    skills: ['Curing', 'Beef jerky', 'Spices', 'Vacuum sealing'],
    bannerColor: 'from-amber-400 to-orange-600',
    trustScore: {
      score: 95, // Verified=30, Reputation=29, Reliability=25, Activity=11
      verificationScore: 30,
      reputationScore: 29,
      reliabilityScore: 25,
      activityScore: 11,
      level: 'Top Rated User'
    }
  }
];

export const INITIAL_SERVICES: Service[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const SEED_REVIEWS: Review[] = [];

export const SEED_PORTFOLIO_PROJECTS: any[] = [];

export const SEED_PORTFOLIO_IMAGES: any[] = [];

