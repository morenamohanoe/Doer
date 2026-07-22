/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Activity, 
  Users, 
  Zap, 
  Clock, 
  MessageSquare, 
  Briefcase, 
  CheckCircle, 
  Star, 
  FolderCheck,
  UserCheck
} from 'lucide-react';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';

interface UserBehaviorSectionProps {
  data: AdminAnalyticsData;
}

export const UserBehaviorSection: React.FC<UserBehaviorSectionProps> = ({ data }) => {
  const { userBehavior } = data;
  const [activeSegment, setActiveSegment] = useState<'power' | 'recent' | 'active' | 'dormant'>('power');

  const activityMetrics = [
    { label: 'Total Registrations', value: userBehavior.totalRegistrations, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Login & Interactivity Index', value: userBehavior.loginFrequency, icon: Zap, color: 'text-amber-600 bg-amber-50' },
    { label: 'Profile Updates', value: userBehavior.profileUpdatesCount, icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
    { label: 'Service Publications', value: userBehavior.servicePublicationsCount, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Portfolio Projects Added', value: userBehavior.newPortfolioProjectsCount, icon: FolderCheck, color: 'text-teal-600 bg-teal-50' },
    { label: 'Messages Exchanged', value: userBehavior.messagesSentCount, icon: MessageSquare, color: 'text-sky-600 bg-sky-50' },
    { label: 'Bookings Created', value: userBehavior.bookingsCreatedCount, icon: Clock, color: 'text-rose-600 bg-rose-50' },
    { label: 'Bookings Completed', value: userBehavior.bookingsCompletedCount, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Reviews Submitted', value: userBehavior.reviewsSubmittedCount, icon: Star, color: 'text-amber-600 bg-amber-50' }
  ];

  const getSegmentUsers = () => {
    switch (activeSegment) {
      case 'power':
        return userBehavior.powerUsers;
      case 'recent':
        return userBehavior.recentlyActiveUsers;
      case 'active':
        return userBehavior.mostActiveUsers;
      case 'dormant':
        return userBehavior.dormantUsers;
      default:
        return userBehavior.powerUsers;
    }
  };

  const segmentList = getSegmentUsers();

  return (
    <div className="space-y-6">
      {/* Activity Funnel Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {activityMetrics.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-3.5 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                <IconComp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-black text-slate-900 truncate">{item.value.toLocaleString()}</div>
                <div className="text-[11px] leading-tight font-bold text-slate-500">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Segmentations & Cohort Insights */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" />
              User Behavior Cohorts & Segmentations
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Categorize platform users by activity levels, engagement patterns, and lifetime value.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSegment('power')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSegment === 'power'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚡ Power Users ({userBehavior.powerUsers.length})
            </button>
            <button
              onClick={() => setActiveSegment('recent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSegment === 'recent'
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🕒 Recently Active ({userBehavior.recentlyActiveUsers.length})
            </button>
            <button
              onClick={() => setActiveSegment('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSegment === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🔥 Most Active ({userBehavior.mostActiveUsers.length})
            </button>
            <button
              onClick={() => setActiveSegment('dormant')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSegment === 'dormant'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              💤 Dormant ({userBehavior.dormantUsers.length})
            </button>
          </div>
        </div>

        {/* User Segment List */}
        {segmentList.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">No users found in this behavior cohort.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {segmentList.map((u) => (
              <div key={u.id || u.uid} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img 
                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80'} 
                    alt={u.firstName} 
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80');
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-black text-slate-900 truncate flex flex-wrap items-center gap-1.5">
                      <span className="truncate">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || 'DOER Member'}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-brand/10 text-brand'
                      }`}>
                        {u.role || 'doer'}
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-400 font-medium truncate">{u.email}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Last Activity</div>
                  <div className="text-xs font-extrabold text-slate-700">
                    {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : 'N/A'}
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
