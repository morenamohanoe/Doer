/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Wallet, 
  ArrowUpRight, 
  Users,
  Award
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';

interface FinancialAnalyticsSectionProps {
  data: AdminAnalyticsData;
}

export const FinancialAnalyticsSection: React.FC<FinancialAnalyticsSectionProps> = ({ data }) => {
  const { financials } = data;

  return (
    <div className="space-y-6">
      {/* Financial Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Total Revenue</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 truncate">
            R {financials.totalPlatformRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 truncate">
            R {financials.monthlyRevenue.toLocaleString()} this month
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Service Fees (10%)</span>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 truncate">
            R {financials.totalServiceFeesCollected.toLocaleString()}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 truncate">
            Platform Cut from Completed Escrow
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Withdrawal Fees</span>
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 truncate">
            R {financials.totalWithdrawalFeesCollected.toLocaleString()}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 truncate">
            Processing fees on doer payouts
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Avg Payout Amount</span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 truncate">
            R {financials.avgWithdrawalAmount.toLocaleString()}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 truncate">
            Per withdrawal request
          </div>
        </div>
      </div>

      {/* Time-Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Platform Fees Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                Revenue & Fee Collection Trend
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daily completed booking volume vs platform earnings
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 shrink-0">
              Daily Aggregate
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financials.timeSeriesRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: number) => [`R ${val.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="fees" name="Platform Fees" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorFees)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Withdrawals & Payouts Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-600 shrink-0" />
                Doer Payout & Withdrawal Volume
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Total fund withdrawals requested and processed
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 shrink-0">
              Escrow Payouts
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financials.timeSeriesRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: number) => [`R ${val.toLocaleString()}`, 'Withdrawals']}
                />
                <Bar dataKey="withdrawals" name="Withdrawal Volume" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Profitable Doers & Highest Paying Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Profitable Doers */}
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-5 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 gap-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 truncate">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">Most Profitable Service Doers</span>
            </h4>
            <span className="text-xs text-slate-400 font-bold shrink-0">Top 10 Earners</span>
          </div>

          <div className="space-y-3">
            {financials.mostProfitableDoers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No doer earnings recorded yet.</p>
            ) : (
              financials.mostProfitableDoers.map((doer, idx) => (
                <div key={doer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-xs font-black text-slate-400 shrink-0">#{idx + 1}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{doer.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">{doer.jobs} completed jobs</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-emerald-600">R {doer.earnings.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold">Gross Earned</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Highest Paying Clients */}
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-5 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 gap-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 truncate">
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">Highest Paying Clients</span>
            </h4>
            <span className="text-xs text-slate-400 font-bold shrink-0">Top 10 Spenders</span>
          </div>

          <div className="space-y-3">
            {financials.highestPayingClients.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No client spending recorded yet.</p>
            ) : (
              financials.highestPayingClients.map((client, idx) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-xs font-black text-slate-400 shrink-0">#{idx + 1}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{client.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">{client.bookings} completed bookings</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-indigo-600">R {client.spent.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold">Total Spent</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
