/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Star, 
  DollarSign, 
  Briefcase, 
  Eye, 
  Wallet, 
  CheckCircle2, 
  MessageSquare, 
  Activity, 
  FolderCheck,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';

interface UserLeaderboardsSectionProps {
  data: AdminAnalyticsData;
}

type LeaderboardCategory = 
  | 'topEarners'
  | 'topJobCompleters'
  | 'topRatedDoers'
  | 'mostActiveUsers'
  | 'mostReviewsReceived'
  | 'mostReviewsGiven'
  | 'mostViewedServices'
  | 'mostBookedServices'
  | 'mostPortfolioViews'
  | 'highestWalletBalances'
  | 'mostWithdrawals'
  | 'mostSuccessfulDoers';

export const UserLeaderboardsSection: React.FC<UserLeaderboardsSectionProps> = ({ data }) => {
  const { leaderboards } = data;
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('topEarners');

  const categories = [
    { id: 'topEarners' as LeaderboardCategory, label: 'Top Earners', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'topJobCompleters' as LeaderboardCategory, label: 'Top Job Completers', icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'topRatedDoers' as LeaderboardCategory, label: 'Top Rated Doers', icon: Star, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'mostActiveUsers' as LeaderboardCategory, label: 'Most Active Users', icon: Activity, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'mostReviewsReceived' as LeaderboardCategory, label: 'Most Reviews Received', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'mostReviewsGiven' as LeaderboardCategory, label: 'Most Reviews Given', icon: MessageSquare, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'mostViewedServices' as LeaderboardCategory, label: 'Most Viewed Services', icon: Eye, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'mostBookedServices' as LeaderboardCategory, label: 'Most Booked Services', icon: Briefcase, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'mostPortfolioViews' as LeaderboardCategory, label: 'Most Portfolio Views', icon: FolderCheck, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { id: 'highestWalletBalances' as LeaderboardCategory, label: 'Highest Wallet Balances', icon: Wallet, color: 'text-emerald-700 bg-emerald-100 border-emerald-300' },
    { id: 'mostWithdrawals' as LeaderboardCategory, label: 'Most Withdrawals', icon: ArrowUpRight, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'mostSuccessfulDoers' as LeaderboardCategory, label: 'Most Successful Doers', icon: UserCheck, color: 'text-brand bg-brand/10 border-brand/20' },
  ];

  const currentList = leaderboards[selectedCategory] || [];
  const currentCategoryConfig = categories.find(c => c.id === selectedCategory);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-400/30 ring-2 ring-amber-300">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center text-sm shadow-md shadow-slate-300/30 ring-2 ring-slate-200">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-sm shadow-md shadow-amber-700/30 ring-2 ring-amber-600">
          🥉 3
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Selection Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Platform Leaderboards & Hall of Fame
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            12 Categories • Sourced from Live Firestore
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                    : 'bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Leaderboard List */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              {currentCategoryConfig && <currentCategoryConfig.icon className="w-5 h-5 text-brand" />}
              {currentCategoryConfig?.label}
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ranked automatically based on verified user transactions and activity logs.
            </p>
          </div>
          <span className="px-3 py-1 bg-brand/10 text-brand font-bold text-xs rounded-full self-start sm:self-auto">
            {currentList.length} Top Performers
          </span>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trophy className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-600">No leaderboard entries found for this category yet.</p>
            <p className="text-xs text-slate-400 mt-1">Data will populate automatically as users interact with services and complete bookings.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentList.map((item) => (
              <div 
                key={item.id + item.rank}
                className="p-4 hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {getRankBadge(item.rank)}

                  <img 
                    src={item.avatar} 
                    alt={item.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80');
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-black text-slate-900 truncate flex flex-wrap items-center gap-2">
                      <span className="truncate">{item.name}</span>
                      {item.rank <= 3 && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          TOP {item.rank}
                        </span>
                      )}
                    </h5>
                    <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>{item.location}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Joined {new Date(item.lastActive).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 pl-11 sm:pl-0">
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    {item.metricLabel}
                  </div>
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                    Verified Metric
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
