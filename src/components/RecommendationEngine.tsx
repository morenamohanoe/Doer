/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getProperAvatar } from '../utils/avatarUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Star, 
  ShieldCheck, 
  SlidersHorizontal, 
  Check, 
  Search,
  Award,
  MapPin,
  Briefcase
} from 'lucide-react';
import CategoryIcon from './CategoryIcon';

interface RecommendedDoer {
  doerId: string;
  doerName: string;
  doerAvatar: string;
  doerTrustScore: number;
  rating: number;
  reviewCount: number;
  categories: string[];
  skills?: string[];
  bio?: string;
  occupation?: string;
  location?: string;
  hourlyRate?: number;
  yearsOfExperience?: number;
  verificationStatus?: string;
  completedJobsCount?: number;
  servicesOffered: { id: string; title: string; price: number; pricingType: string }[];
  relevanceScore: number;
}

interface RecommendationEngineProps {
  onSelectDoer: (doerId: string) => void;
  onSelectService: (service: any) => void;
}

export default function RecommendationEngine({ onSelectDoer, onSelectService }: RecommendationEngineProps) {
  const { 
    services, 
    roleProfiles, 
    serviceCategories, 
    triggerSound, 
    showToast,
    searchQuery,
    currentUser
  } = useApp();

  // --- LOCAL PERSISTENCE FOR SEARCH & PREFERENCES ---
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem('doer_search_history');
    return stored ? JSON.parse(stored) : [];
  });

  const [preferredCategories, setPreferredCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem('doer_category_preferences');
    return stored ? JSON.parse(stored) : [];
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [customKeyword, setCustomKeyword] = useState('');

  // --- AUTO-TRACK SEARCH HISTORY ---
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) return;

    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setSearchHistory(prev => {
        // Remove duplicates and place newest at front
        const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, 10);
        localStorage.setItem('doer_search_history', JSON.stringify(updated));
        return updated;
      });
    }, 1500); // 1.5s debounce

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // --- AUTO-TRACK CATEGORY PREFERENCES (BASED ON SEARCH/CLICKS) ---
  // If search query matches a category name exactly, auto-prefer it
  useEffect(() => {
    if (!searchQuery) return;
    const matchedCat = serviceCategories.find(
      cat => cat.name.toLowerCase() === searchQuery.toLowerCase() && cat.status === 'approved'
    );
    if (matchedCat) {
      setPreferredCategories(prev => {
        if (prev.includes(matchedCat.id)) return prev;
        const updated = [...prev, matchedCat.id];
        localStorage.setItem('doer_category_preferences', JSON.stringify(updated));
        return updated;
      });
    }
  }, [searchQuery, serviceCategories]);

  // --- HELPER HANDLERS ---
  const handleRemoveSearchTerm = (term: string) => {
    triggerSound('click');
    const updated = searchHistory.filter(t => t !== term);
    setSearchHistory(updated);
    localStorage.setItem('doer_search_history', JSON.stringify(updated));
    showToast('Search term removed', 'info');
  };

  const handleClearAllHistory = () => {
    triggerSound('click');
    setSearchHistory([]);
    localStorage.removeItem('doer_search_history');
    showToast('Search history cleared', 'success');
  };

  const handleToggleCategoryPref = (catId: string) => {
    triggerSound('click');
    setPreferredCategories(prev => {
      const exists = prev.includes(catId);
      const updated = exists ? prev.filter(id => id !== catId) : [...prev, catId];
      localStorage.setItem('doer_category_preferences', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddCustomKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyword.trim()) return;
    triggerSound('success');
    const trimmed = customKeyword.trim();
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      localStorage.setItem('doer_search_history', JSON.stringify(updated));
      return updated;
    });
    setCustomKeyword('');
    showToast(`Added "${trimmed}" to recommendation keywords`, 'success');
  };

  // --- RECOMMENDATION GENERATOR ---
  const recommendedDoers: RecommendedDoer[] = React.useMemo(() => {
    const uniqueDoersMap: Record<string, RecommendedDoer> = {};
    
    const cleanAvatar = (url?: string, name?: string, id?: string, gender?: string) => {
      return getProperAvatar(url, name, id, gender);
    };

    // 1. Extract and map doers from services
    services.forEach(srv => {
      const doerId = srv.doerId;
      if (!doerId) return;

      // Filter out current user's own services
      if (currentUser && (doerId === currentUser.id || doerId === currentUser.uid)) {
        return;
      }

      const prof = roleProfiles.find(p => p.id === doerId || p.userId === doerId);

      const catObj = serviceCategories.find(c => c.id === srv.category || c.name === srv.category || c.id === srv.categoryId);
      const catName = catObj ? catObj.name : srv.category;

      if (!uniqueDoersMap[doerId]) {
        const doerName = (prof?.displayName && !['Freelancer', 'John Doe', 'Doer', 'User', 'freelancer'].includes(prof.displayName)) 
          ? prof.displayName 
          : ((srv.doerName && !['Freelancer', 'John Doe', 'Doer', 'User', 'freelancer'].includes(srv.doerName)) 
              ? srv.doerName 
              : (prof?.occupation ? `${prof.occupation} Specialist` : 'Verified Service Doer'));
        const doerAvatar = cleanAvatar(prof?.profileImageUrl || prof?.avatarUrl || srv.doerAvatar, doerName, doerId, prof?.gender);
        const occupation = prof?.occupation || prof?.title || prof?.currentJobTitle || 'Local Service Provider';
        const location = prof?.location || (prof?.city ? `${prof.city}${prof.province ? ', ' + prof.province : ''}` : srv.location || '');

        uniqueDoersMap[doerId] = {
          doerId,
          doerName,
          doerAvatar,
          doerTrustScore: prof?.trustScore?.score || srv.doerTrustScore || 50,
          rating: prof?.rating || srv.rating || 4.0,
          reviewCount: prof?.reviewCount || srv.reviewCount || 0,
          categories: [],
          skills: prof?.skills,
          bio: prof?.bio || prof?.shortIntroduction,
          occupation,
          location,
          hourlyRate: prof?.hourlyRate,
          yearsOfExperience: prof?.yearsOfExperience,
          verificationStatus: prof?.verificationStatus,
          completedJobsCount: prof?.completedJobsCount,
          servicesOffered: [],
          relevanceScore: 0
        };
      }

      const d = uniqueDoersMap[doerId];
      if (catName && !d.categories.includes(catName)) {
        d.categories.push(catName);
      }

      // Check if service is already added
      if (!d.servicesOffered.some(s => s.id === srv.id)) {
        d.servicesOffered.push({
          id: srv.id,
          title: srv.title,
          price: srv.price,
          pricingType: srv.pricingType || (srv.priceUnit === 'night' ? 'day' : srv.priceUnit === 'hr' ? 'hour' : srv.priceUnit) || 'fixed'
        });
      }

      // Track highest rating / review count
      if (srv.rating > d.rating) d.rating = srv.rating;
      if (srv.reviewCount > d.reviewCount) d.reviewCount = srv.reviewCount;
    });

    // 2. Extract and merge doers from roleProfiles
    roleProfiles.forEach(prof => {
      if (prof.role !== 'doer') return;
      const doerId = prof.id || prof.userId;
      if (!doerId) return;

      // Filter out current user's own profile
      if (currentUser && (doerId === currentUser.id || doerId === currentUser.uid || prof.userId === currentUser.id || prof.userId === currentUser.uid)) {
        return;
      }

      if (!uniqueDoersMap[doerId]) {
        const doerName = (prof.displayName && !['Freelancer', 'John Doe', 'Doer', 'User', 'freelancer'].includes(prof.displayName))
          ? prof.displayName
          : (prof.occupation ? `${prof.occupation} Specialist` : 'Verified Service Doer');
        const doerAvatar = cleanAvatar(prof.profileImageUrl || prof.avatarUrl, doerName, doerId, prof.gender);
        const occupation = prof.occupation || prof.title || prof.currentJobTitle || 'Local Service Provider';
        const location = prof.location || (prof.city ? `${prof.city}${prof.province ? ', ' + prof.province : ''}` : '');

        uniqueDoersMap[doerId] = {
          doerId,
          doerName,
          doerAvatar,
          doerTrustScore: prof.trustScore?.score || 50,
          rating: prof.rating || 4.0,
          reviewCount: prof.reviewCount || 0,
          categories: [],
          skills: prof.skills,
          bio: prof.bio || prof.shortIntroduction,
          occupation,
          location,
          hourlyRate: prof.hourlyRate,
          yearsOfExperience: prof.yearsOfExperience,
          verificationStatus: prof.verificationStatus,
          completedJobsCount: prof.completedJobsCount,
          servicesOffered: [],
          relevanceScore: 0
        };
      } else {
        const d = uniqueDoersMap[doerId];
        if (prof.displayName && prof.displayName !== 'John Doe' && prof.displayName !== 'Freelancer') {
          d.doerName = prof.displayName;
        }
        if (prof.profileImageUrl || prof.avatarUrl) {
          d.doerAvatar = cleanAvatar(prof.profileImageUrl || prof.avatarUrl, d.doerName, doerId, prof.gender);
        }
        if (prof.occupation || prof.title || prof.currentJobTitle) {
          d.occupation = prof.occupation || prof.title || prof.currentJobTitle;
        }
        if (prof.location || prof.city) {
          d.location = prof.location || (prof.city ? `${prof.city}${prof.province ? ', ' + prof.province : ''}` : '');
        }
        if (prof.bio || prof.shortIntroduction) {
          d.bio = prof.bio || prof.shortIntroduction;
        }
        if (prof.skills) d.skills = prof.skills;
        if (prof.hourlyRate) d.hourlyRate = prof.hourlyRate;
        if (prof.yearsOfExperience) d.yearsOfExperience = prof.yearsOfExperience;
        if (prof.verificationStatus) d.verificationStatus = prof.verificationStatus;
        if (prof.completedJobsCount) d.completedJobsCount = prof.completedJobsCount;
        if (prof.trustScore?.score) d.doerTrustScore = prof.trustScore.score;
      }

      const d = uniqueDoersMap[doerId];
      if (prof.categories) {
        prof.categories.forEach(cat => {
          const catObj = serviceCategories.find(c => c.id === cat || c.name === cat);
          const catName = catObj ? catObj.name : cat;
          if (catName && !d.categories.includes(catName)) {
            d.categories.push(catName);
          }
        });
      }
    });

    // 3. Compute relevance scores
    const doersList = Object.values(uniqueDoersMap);
    
    doersList.forEach(d => {
      let score = 0;

      // Rating bonus: Highly-rated providers are highly preferred! (Max 50 points)
      score += (d.rating || 4.0) * 10;

      // Review count bonus: More reviews indicate active & popular service (Max 20 points)
      score += Math.min(d.reviewCount || 0, 20) * 1;

      // Trust score bonus: Higher trust means higher security (Max 15 points)
      score += (d.doerTrustScore || 50) * 0.15;

      // Category preference match bonus: +45 points per matching category preference
      if (preferredCategories.length > 0) {
        preferredCategories.forEach(prefCatId => {
          const prefCat = serviceCategories.find(c => c.id === prefCatId);
          if (prefCat) {
            const hasMatch = d.categories.some(c => c.toLowerCase() === prefCat.name.toLowerCase()) || 
                             d.servicesOffered.some(s => {
                               const fullSrv = services.find(x => x.id === s.id);
                               return fullSrv?.category === prefCatId || fullSrv?.categoryId === prefCatId;
                             });
            if (hasMatch) {
              score += 45;
            }
          }
        });
      }

      // Search History keyword matches: +25 points per matching term (Max 75 points)
      if (searchHistory.length > 0) {
        let historyMatches = 0;
        searchHistory.forEach(keyword => {
          const k = keyword.toLowerCase().trim();
          if (!k) return;

          let match = false;
          if (d.doerName.toLowerCase().includes(k)) match = true;
          if (d.bio && d.bio.toLowerCase().includes(k)) match = true;
          if (d.skills && d.skills.some(s => s.toLowerCase().includes(k))) match = true;
          if (d.servicesOffered.some(s => s.title.toLowerCase().includes(k))) match = true;

          if (match) {
            historyMatches++;
          }
        });
        score += Math.min(historyMatches, 3) * 25;
      }

      d.relevanceScore = Math.round(score);
    });

    // 4. Sort and return only Doers with rating >= 4.0 (Top Rated) or any highly relevant
    // We sort by relevance score descending.
    return doersList
      .filter(d => d.rating >= 4.0) // Must be Top Rated
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Recommend top 5
  }, [services, roleProfiles, serviceCategories, preferredCategories, searchHistory]);

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-xs space-y-5 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="w-4 h-4 fill-indigo-100" />
          </div>
          <div>
            <h3 className="text-sm font-black text-neutral-900 tracking-tight">Recommended for You</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
              Personalized Top-Rated Doers
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerSound('click');
            setShowConfigPanel(!showConfigPanel);
          }}
          className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            showConfigPanel 
              ? 'bg-neutral-900 text-white border-neutral-900' 
              : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Preferences
        </button>
      </div>

      {/* COLLAPSIBLE PREFERENCES PANEL */}
      <AnimatePresence>
        {showConfigPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-neutral-100 pb-4 space-y-4"
          >
            {/* Search History Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Your Search Keywords ({searchHistory.length})
                </span>
                {searchHistory.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="text-[9px] font-black text-rose-500 hover:underline uppercase"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {searchHistory.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {searchHistory.map((term, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full"
                    >
                      {term}
                      <button 
                        onClick={() => handleRemoveSearchTerm(term)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-[9px] ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-neutral-400 font-semibold italic">
                  No search history tracked yet. Try searching in the main bar!
                </p>
              )}

              {/* Add Custom Keyword manually */}
              <form onSubmit={handleAddCustomKeyword} className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Add manual keyword preference..."
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 rounded-xl text-[10px] font-medium border border-neutral-200 focus:outline-none focus:border-neutral-900 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customKeyword.trim()}
                  className="px-3.5 py-1.5 bg-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-300 text-white font-black text-[10px] rounded-xl cursor-pointer hover:bg-black transition-all"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Category Preferences Checklist */}
            <div className="space-y-2 pt-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Preferred Service Categories
              </span>
              <div className="flex flex-wrap gap-2">
                {serviceCategories
                  .filter(cat => cat.status === 'approved')
                  .map(cat => {
                    const isSelected = preferredCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategoryPref(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                          isSelected
                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <CategoryIcon name={cat.icon} className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                        {cat.name}
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
              </div>
              <p className="text-[9px] text-neutral-400 font-semibold italic">
                Tips: Check categories to boost recommendations matching those areas. Clicking categories in the main filter bar also trains the engine.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECOMMENDATIONS LIST */}
      {recommendedDoers.length > 0 ? (
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4">
          {recommendedDoers.map((doer) => (
            <motion.div
              key={doer.doerId}
              whileHover={{ scale: 1.01 }}
              className="bg-neutral-50 border border-neutral-150 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs relative overflow-hidden group hover:border-indigo-200 hover:bg-indigo-50/10 transition-all duration-300"
            >
              {/* Header Section: Avatar + Primary Info + Right Badge Column */}
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <button
                  type="button"
                  onClick={() => onSelectDoer(doer.doerId)}
                  className="w-12 h-12 rounded-full overflow-hidden border border-neutral-200 hover:opacity-85 transition-all shrink-0 cursor-pointer"
                >
                  <img 
                    src={doer.doerAvatar} 
                    alt={doer.doerName} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </button>

                {/* Primary Info (Name, Occupation, Location) */}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h4 
                    onClick={() => onSelectDoer(doer.doerId)}
                    className="font-black text-neutral-950 text-xs sm:text-sm hover:underline cursor-pointer truncate leading-tight"
                    title={doer.doerName}
                  >
                    {doer.doerName}
                  </h4>

                  {/* Occupation */}
                  {doer.occupation && (
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-950 truncate">
                      <Briefcase className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="truncate">{doer.occupation}</span>
                    </div>
                  )}

                  {/* Address / Location */}
                  {doer.location && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{doer.location}</span>
                    </div>
                  )}
                </div>

                {/* Top-Right Column: Match Score & Rating */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="bg-indigo-50 text-indigo-700 border border-indigo-100/80 text-[8px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 fill-indigo-200" />
                    <span>{doer.relevanceScore}% Match</span>
                  </div>

                  <div className="flex items-center text-amber-500 font-extrabold text-[10px] whitespace-nowrap bg-amber-50/80 px-1.5 py-0.5 rounded-md border border-amber-100/60">
                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                    <span className="ml-0.5">{doer.rating.toFixed(1)}</span>
                    <span className="text-neutral-400 font-semibold ml-0.5">({doer.reviewCount})</span>
                  </div>
                </div>
              </div>

              {/* Badges & Categories Row */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {doer.categories.length > 0 && (
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md truncate max-w-[150px]">
                    {doer.categories.join(' • ')}
                  </span>
                )}

                <div className="flex items-center gap-0.5 text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/60 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>{doer.doerTrustScore} Trust Score</span>
                </div>

                {doer.yearsOfExperience !== undefined && doer.yearsOfExperience > 0 && (
                  <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                    {doer.yearsOfExperience} yrs exp
                  </span>
                )}

                {doer.hourlyRate && doer.hourlyRate > 0 && (
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                    R{doer.hourlyRate}/hr
                  </span>
                )}
              </div>

              {/* Bio / Tagline if available */}
              {doer.bio && (
                <p className="text-[10px] font-medium text-neutral-500 line-clamp-2 italic border-l-2 border-neutral-200 pl-2 leading-relaxed">
                  "{doer.bio}"
                </p>
              )}

              {/* Active Services offered */}
              {doer.servicesOffered.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-neutral-150">
                  <span className="block text-[8px] font-extrabold uppercase tracking-widest text-neutral-400">
                    Recommended Services
                  </span>
                  <div className="space-y-1">
                    {doer.servicesOffered.slice(0, 2).map((srv) => (
                      <div 
                        key={srv.id}
                        className="flex items-center justify-between gap-2 p-1.5 bg-white border border-neutral-150 rounded-lg hover:border-brand hover:shadow-xs transition-all cursor-pointer group/srv"
                        onClick={() => {
                          const fullSrv = services.find(x => x.id === srv.id);
                          if (fullSrv) onSelectService(fullSrv);
                        }}
                      >
                        <span className="text-[10px] font-bold text-neutral-700 truncate group-hover/srv:text-neutral-900 group-hover/srv:underline">
                          {srv.title}
                        </span>
                        <span className="text-[10px] font-black text-brand-dark bg-brand/15 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                          R {srv.price.toLocaleString('en-ZA')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 p-4">
          <Award className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-[11px] font-bold text-neutral-600">No matching top-rated recommendations yet</p>
          <p className="text-[10px] text-neutral-400 mt-1 max-w-sm mx-auto">
            Try enabling more preferred categories or typing queries in the search bar above to train your personalized engine!
          </p>
        </div>
      )}

    </div>
  );
}
