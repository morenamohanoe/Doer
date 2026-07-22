/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Layers, 
  FolderCheck, 
  Clock, 
  AlertTriangle, 
  Wallet, 
  ArrowUpRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';

interface AdminOverviewSectionProps {
  data: AdminAnalyticsData;
}

export const AdminOverviewSection: React.FC<AdminOverviewSectionProps> = ({ data }) => {
  const { overview, financials } = data;

  const kpis = [
    {
      title: 'Total Users',
      value: overview.totalUsers.toLocaleString(),
      subtitle: `${overview.totalDoers} Doers • ${overview.totalClients} Clients`,
      change: `+${overview.newUsersThisMonth} this mo`,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200/60',
      badgeBg: 'bg-blue-50 text-blue-700'
    },
    {
      title: 'Platform Revenue',
      value: `R ${overview.totalRevenue.toLocaleString()}`,
      subtitle: `R ${financials.monthlyRevenue.toLocaleString()} this month`,
      change: `R ${financials.todayRevenue.toLocaleString()} today`,
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60',
      badgeBg: 'bg-emerald-50 text-emerald-700'
    },
    {
      title: 'Platform Fees Collected',
      value: `R ${overview.totalFeesCollected.toLocaleString()}`,
      subtitle: '10% Service Fee + Withdrawal Fees',
      change: '100% Sourced Live',
      icon: ShieldCheck,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200/60',
      badgeBg: 'bg-purple-50 text-purple-700'
    },
    {
      title: 'Total Bookings',
      value: overview.totalBookings.toLocaleString(),
      subtitle: `${overview.completedBookings} Completed • ${overview.pendingBookings} Active`,
      change: `+${overview.newBookingsThisMonth} this mo`,
      icon: Briefcase,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/60',
      badgeBg: 'bg-indigo-50 text-indigo-700'
    },
    {
      title: 'Active Services',
      value: overview.activeServices.toLocaleString(),
      subtitle: `Out of ${overview.totalServices} total catalog`,
      change: `+${overview.newServicesThisMonth} new`,
      icon: Layers,
      color: 'bg-amber-500/10 text-amber-600 border-amber-200/60',
      badgeBg: 'bg-amber-50 text-amber-700'
    },
    {
      title: 'Portfolio Projects',
      value: overview.totalPortfolioProjects.toLocaleString(),
      subtitle: 'Verified Doer Work Demonstrations',
      change: 'Live Showcase',
      icon: FolderCheck,
      color: 'bg-teal-500/10 text-teal-600 border-teal-200/60',
      badgeBg: 'bg-teal-50 text-teal-700'
    },
    {
      title: 'Platform Rating',
      value: `${overview.avgPlatformRating} ★`,
      subtitle: `Based on ${overview.totalReviews} verified reviews`,
      change: 'High Quality',
      icon: Star,
      color: 'bg-amber-500/10 text-amber-500 border-amber-200/60',
      badgeBg: 'bg-amber-50 text-amber-800'
    },
    {
      title: 'Wallet Balances',
      value: `R ${overview.totalWalletBalances.toLocaleString()}`,
      subtitle: `${overview.totalWithdrawalRequests} Withdrawal Requests`,
      change: 'Escrow Holdings',
      icon: Wallet,
      color: 'bg-rose-500/10 text-rose-600 border-rose-200/60',
      badgeBg: 'bg-rose-50 text-rose-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Platform Growth Highlight Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <TrendingUp className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/20 border border-brand/30 rounded-full text-brand-light text-xs font-bold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Executive BI Telemetry
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Marketplace Health & Operational Dashboard
            </h3>
            <p className="text-slate-300 text-xs font-medium max-w-xl">
              Live metrics aggregate activity across {overview.totalUsers} registered accounts, {overview.totalBookings} service bookings, and R {overview.totalRevenue.toLocaleString()} in transaction value.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Growth Rate</div>
              <div className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                +{overview.platformGrowthThisMonth}%
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">New Users (Mo)</div>
              <div className="text-base sm:text-lg font-black text-white">
                +{overview.newUsersThisMonth}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">New Bookings (Mo)</div>
              <div className="text-base sm:text-lg font-black text-brand-light">
                +{overview.newBookingsThisMonth}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {kpis.map((kpi, idx) => {
          const IconComponent = kpi.icon;
          return (
            <div 
              key={idx}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group min-w-0"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                    {kpi.title}
                  </span>
                  <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${kpi.color}`}>
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
                  {kpi.value}
                </div>

                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 truncate">
                  {kpi.subtitle}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md truncate ${kpi.badgeBg}`}>
                  {kpi.change}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0">
                  Live Firestore
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {/* Booking Funnel Status */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 truncate">
              <Briefcase className="w-4 h-4 text-brand shrink-0" />
              <span className="truncate">Booking Status Funnel</span>
            </h4>
            <span className="text-xs text-slate-400 font-bold shrink-0">{overview.totalBookings} Total</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Completed</span>
                <span>{overview.completedBookings} ({overview.totalBookings > 0 ? Math.round((overview.completedBookings / overview.totalBookings) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${overview.totalBookings > 0 ? (overview.completedBookings / overview.totalBookings) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Active / Pending</span>
                <span>{overview.pendingBookings} ({overview.totalBookings > 0 ? Math.round((overview.pendingBookings / overview.totalBookings) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${overview.totalBookings > 0 ? (overview.pendingBookings / overview.totalBookings) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Cancelled</span>
                <span>{overview.cancelledBookings} ({overview.totalBookings > 0 ? Math.round((overview.cancelledBookings / overview.totalBookings) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${overview.totalBookings > 0 ? (overview.cancelledBookings / overview.totalBookings) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Distribution Ratio */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 truncate">
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">User Base Distribution</span>
            </h4>
            <span className="text-xs text-slate-400 font-bold shrink-0">{overview.totalUsers} Total</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-2 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Verified Doers</div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">Service Providers</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-black text-slate-900">{overview.totalDoers}</div>
                <div className="text-[10px] text-slate-400 font-bold">
                  {overview.totalUsers > 0 ? Math.round((overview.totalDoers / overview.totalUsers) * 100) : 0}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-2 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Service Clients</div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">Booking Seekers</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-black text-slate-900">{overview.totalClients}</div>
                <div className="text-[10px] text-slate-400 font-bold">
                  {overview.totalUsers > 0 ? Math.round((overview.totalClients / overview.totalUsers) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Operational Queue - Spans 2 columns on tablet so nothing cuts off */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-150 shadow-sm min-w-0 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 truncate">
              <Wallet className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">Payout Queue & Fees</span>
            </h4>
            <span className="text-xs text-slate-400 font-bold shrink-0">{financials.pendingWithdrawalsCount} Pending</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-900 truncate">Pending Withdrawals</div>
                <div className="text-[11px] text-amber-700 font-medium truncate">{financials.pendingWithdrawalsCount} requests awaiting approval</div>
              </div>
              <div className="text-sm sm:text-base font-black text-amber-900 shrink-0">
                R {financials.pendingWithdrawalsAmount.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-900 truncate">Approved Payouts</div>
                <div className="text-[11px] text-emerald-700 font-medium truncate">{financials.approvedWithdrawalsCount} processed</div>
              </div>
              <div className="text-sm sm:text-base font-black text-emerald-900 shrink-0">
                R {financials.approvedWithdrawalsAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
