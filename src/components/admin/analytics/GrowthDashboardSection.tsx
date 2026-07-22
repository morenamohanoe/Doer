/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';
import { AnalyticsDateRangePicker } from './AnalyticsDateRangePicker';

interface GrowthDashboardSectionProps {
  data: AdminAnalyticsData;
  dateRangeFilter: 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';
  setDateRangeFilter: (range: 'today' | '7d' | '30d' | '90d' | 'year' | 'custom') => void;
  customStart: string;
  setCustomStart: (val: string) => void;
  customEnd: string;
  setCustomEnd: (val: string) => void;
}

export const GrowthDashboardSection: React.FC<GrowthDashboardSectionProps> = ({
  data,
  dateRangeFilter,
  setDateRangeFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd
}) => {
  const { overview, financials } = data;

  return (
    <div className="space-y-6">
      {/* Date Range Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
            Platform Growth & Trajectory Dashboard
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Evaluate platform trajectory across user adoption, service catalog expansion, and transaction velocity.
          </p>
        </div>

        <AnalyticsDateRangePicker
          dateRangeFilter={dateRangeFilter}
          setDateRangeFilter={setDateRangeFilter}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
      </div>

      {/* Growth Metric Rate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase truncate">User Growth</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1 truncate">+{overview.newUsersThisMonth}</div>
          <div className="text-[11px] sm:text-xs text-emerald-600 font-bold mt-1 truncate">+{overview.platformGrowthThisMonth}% Growth</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase truncate">Service Growth</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1 truncate">+{overview.newServicesThisMonth}</div>
          <div className="text-[11px] sm:text-xs text-brand font-bold mt-1 truncate">Catalog Expansion</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase truncate">Booking Growth</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1 truncate">+{overview.newBookingsThisMonth}</div>
          <div className="text-[11px] sm:text-xs text-indigo-600 font-bold mt-1 truncate">New Reservations</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase truncate">Revenue Volume</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1 truncate">R {financials.monthlyRevenue.toLocaleString()}</div>
          <div className="text-[11px] sm:text-xs text-purple-600 font-bold mt-1 truncate">Monthly Gross</div>
        </div>
      </div>

      {/* Trajectory Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User & Booking Velocity Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-brand shrink-0" />
                Revenue & Transaction Growth Rate
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Financial scaling trajectory over time
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financials.timeSeriesRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: number) => [`R ${val.toLocaleString()}`, 'Value']}
                />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="fees" name="Platform Fees" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Withdrawal & Escrow Volume Growth */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600 shrink-0" />
                Escrow & Withdrawal Growth
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Doer payout volume momentum
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financials.timeSeriesRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: number) => [`R ${val.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="withdrawals" name="Payouts" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
