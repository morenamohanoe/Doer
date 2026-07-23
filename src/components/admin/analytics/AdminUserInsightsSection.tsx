/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';

interface AdminUserInsightsSectionProps {
  data: AdminAnalyticsData;
}

export const AdminUserInsightsSection: React.FC<AdminUserInsightsSectionProps> = ({ data }) => {
  const { userInsights } = data;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'bookings' | 'rating' | 'wallet' | 'joined'>('revenue');

  // Filtered & Sorted User List
  const filteredUsers = useMemo(() => {
    return userInsights
      .filter((u) => {
        const matchesSearch = 
          u.fullName.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.uid.toLowerCase().includes(search.toLowerCase()) ||
          (u.location && u.location.toLowerCase().includes(search.toLowerCase()));

        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        
        const isUserVerified = 
          u.verificationStatus === 'verified' || 
          u.verificationStatus === 'identity_verified' || 
          u.verificationStatus === 'business_verified' || 
          u.verificationStatus === 'credentials_verified' || 
          u.verificationStatus === 'phone_verified';

        const matchesVerification = 
          verificationFilter === 'all' ||
          (verificationFilter === 'verified' && isUserVerified) ||
          (verificationFilter === 'unverified' && (u.verificationStatus === 'unverified' || !u.verificationStatus)) ||
          (verificationFilter === 'pending' && u.verificationStatus === 'pending') ||
          u.verificationStatus === verificationFilter;

        return matchesSearch && matchesRole && matchesVerification;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        if (sortBy === 'revenue') { valA = a.revenueGenerated; valB = b.revenueGenerated; }
        else if (sortBy === 'bookings') { valA = a.bookingsCompleted; valB = b.bookingsCompleted; }
        else if (sortBy === 'rating') { valA = a.avgRating; valB = b.avgRating; }
        else if (sortBy === 'wallet') { valA = a.walletBalance; valB = b.walletBalance; }
        else if (sortBy === 'joined') { valA = new Date(a.joinedDate).getTime(); valB = new Date(b.joinedDate).getTime(); }

        return valB - valA;
      });
  }, [userInsights, search, roleFilter, verificationFilter, sortBy]);

  // Export User Table to CSV
  const handleExportCSV = () => {
    const headers = [
      'UID',
      'Full Name',
      'Email',
      'Role',
      'Verification Status',
      'Joined Date',
      'Services Created',
      'Active Services',
      'Bookings Completed',
      'Revenue Generated (R)',
      'Reviews Received',
      'Average Rating',
      'Wallet Balance (R)',
      'Withdrawals Made (R)',
      'Portfolio Projects'
    ];

    const rows = filteredUsers.map(u => [
      `"${u.uid}"`,
      `"${u.fullName.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.verificationStatus}"`,
      `"${new Date(u.joinedDate).toLocaleDateString()}"`,
      u.servicesCreated,
      u.servicesActive,
      u.bookingsCompleted,
      u.revenueGenerated,
      u.reviewsReceived,
      u.avgRating,
      u.walletBalance,
      u.withdrawalsMade,
      u.portfolioProjects
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DOER_User_Insights_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter & Controls Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand" />
              User Behavior & Financial Intelligence Directory
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Granular per-user metrics for auditing platform activities, revenue generation, and service fulfillment.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-md shadow-slate-900/10"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export User Directory (CSV)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand truncate"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-500 shrink-0">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none w-full truncate cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="doer">Doers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-500 shrink-0">Verify:</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none w-full truncate cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-500 shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none w-full truncate cursor-pointer"
            >
              <option value="revenue">Revenue Generated</option>
              <option value="bookings">Completed Bookings</option>
              <option value="rating">Average Rating</option>
              <option value="wallet">Wallet Balance</option>
              <option value="joined">Joined Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Insights Table */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Showing {filteredUsers.length} of {userInsights.length} Accounts
          </span>
          <span className="text-xs text-slate-400 font-bold">
            Real-time Firestore Telemetry
          </span>
        </div>

        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[780px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">User Profile</th>
                <th className="px-4 py-3">Role & Verification</th>
                <th className="px-4 py-3 text-center">Services</th>
                <th className="px-4 py-3 text-center">Bookings</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-right">Wallet Balance</th>
                <th className="px-4 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-bold">
                    No users match the specified search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.avatarUrl} 
                          alt={u.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80');
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 truncate">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-bold truncate">{u.email}</div>
                          {u.location && (
                            <div className="text-[9px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-brand shrink-0" /> {u.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block w-fit text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-brand/10 text-brand'
                        }`}>
                          {u.role}
                        </span>
                        {(() => {
                          const status = u.verificationStatus;
                          if (status === 'identity_verified' || status === 'verified') {
                            return <span className="text-[10px] font-bold text-emerald-600">✓ Identity Verified</span>;
                          }
                          if (status === 'business_verified') {
                            return <span className="text-[10px] font-bold text-purple-600">✓ Business Verified</span>;
                          }
                          if (status === 'credentials_verified') {
                            return <span className="text-[10px] font-bold text-indigo-600">✓ Credentials Verified</span>;
                          }
                          if (status === 'phone_verified') {
                            return <span className="text-[10px] font-bold text-blue-600">✓ Phone Verified</span>;
                          }
                          if (status === 'pending') {
                            return <span className="text-[10px] font-bold text-amber-500">⚠ Pending</span>;
                          }
                          return <span className="text-[10px] font-bold text-slate-400">Unverified</span>;
                        })()}
                        {u.trustScore && (
                          <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                            Trust Score: <span className="font-black text-brand">{u.trustScore.score}%</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center font-black text-slate-900">
                      {u.servicesActive} <span className="text-[10px] text-slate-400 font-bold">/ {u.servicesCreated}</span>
                    </td>

                    <td className="px-4 py-3 text-center font-black text-slate-900">
                      {u.bookingsCompleted}
                    </td>

                    <td className="px-4 py-3 text-right font-black text-emerald-600">
                      R {u.revenueGenerated.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="font-black text-amber-600">{u.avgRating} ★</span>
                      <div className="text-[9px] text-slate-400 font-bold">({u.reviewsReceived} reviews)</div>
                    </td>

                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      R {u.walletBalance.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right text-[11px] text-slate-500 font-bold">
                      {new Date(u.joinedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
