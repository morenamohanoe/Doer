/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  Trophy, 
  DollarSign, 
  Activity, 
  Layers, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { useAdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';
import { AdminOverviewSection } from './AdminOverviewSection';
import { UserLeaderboardsSection } from './UserLeaderboardsSection';
import { FinancialAnalyticsSection } from './FinancialAnalyticsSection';
import { UserBehaviorSection } from './UserBehaviorSection';
import { MarketplaceAnalyticsSection } from './MarketplaceAnalyticsSection';
import { GrowthDashboardSection } from './GrowthDashboardSection';
import { AdminUserInsightsSection } from './AdminUserInsightsSection';
import { AdminExportReportsModal } from './AdminExportReportsModal';
import { AnalyticsDateRangePicker } from './AnalyticsDateRangePicker';
import { AdminCriticalAlertsPanel } from './AdminCriticalAlertsPanel';

type AnalyticsSubTab = 
  | 'overview'
  | 'leaderboards'
  | 'financials'
  | 'behavior'
  | 'marketplace'
  | 'growth'
  | 'insights';

export const AdminAnalyticsDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>('overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | '7d' | '30d' | '90d' | 'year' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const analyticsData = useAdminAnalyticsData(dateRangeFilter, customStart, customEnd);

  const subTabs = [
    { id: 'overview' as AnalyticsSubTab, label: 'Overview', icon: BarChart3 },
    { id: 'leaderboards' as AnalyticsSubTab, label: 'Leaderboards', icon: Trophy },
    { id: 'financials' as AnalyticsSubTab, label: 'Financial Analytics', icon: DollarSign },
    { id: 'behavior' as AnalyticsSubTab, label: 'User Behavior', icon: Activity },
    { id: 'marketplace' as AnalyticsSubTab, label: 'Marketplace', icon: Layers },
    { id: 'growth' as AnalyticsSubTab, label: 'Growth Dashboard', icon: TrendingUp },
    { id: 'insights' as AnalyticsSubTab, label: 'User Insights', icon: Users },
  ];

  if (analyticsData.loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-600">Aggregating Live Firestore Telemetry...</p>
        <p className="text-xs text-slate-400">Computing analytics across users, bookings, services, and escrow holdings.</p>
      </div>
    );
  }

  if (analyticsData.error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-black text-rose-900">Failed to Load Live Analytics</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{analyticsData.error}</p>
        <button
          onClick={analyticsData.refresh}
          className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-rose-700 transition-all"
        >
          Retry Fetching Telemetry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 sm:pb-36">
      {/* Analytics Dashboard Sub-Navigation & Header Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand/10 text-brand rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Admin Analytics & Business Intelligence Command Center
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Live executive platform data • Last synced: {analyticsData.lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={analyticsData.refresh}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
              <span>Sync Live</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-black rounded-xl transition-all shadow-md shadow-brand/10 flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export Intelligence Reports</span>
            </button>
          </div>
        </div>

        {/* Global Custom Date Range Picker Component Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-150 min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Analytics Interval Filter:</span>
          </div>
          <AnalyticsDateRangePicker
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
            className="min-w-0 max-w-full"
          />
        </div>

        {/* Sub-Tabs Grid Selector */}
        <div className="flex overflow-x-auto sm:flex-wrap gap-2 pt-2 border-t border-slate-100 pb-1 sm:pb-0 scrollbar-none">
          {subTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Command Critical Events & Notifications Panel */}
      <AdminCriticalAlertsPanel data={analyticsData} />

      {/* Render Selected Sub-Section */}
      {activeSubTab === 'overview' && <AdminOverviewSection data={analyticsData} />}
      {activeSubTab === 'leaderboards' && <UserLeaderboardsSection data={analyticsData} />}
      {activeSubTab === 'financials' && <FinancialAnalyticsSection data={analyticsData} />}
      {activeSubTab === 'behavior' && <UserBehaviorSection data={analyticsData} />}
      {activeSubTab === 'marketplace' && <MarketplaceAnalyticsSection data={analyticsData} />}
      {activeSubTab === 'growth' && (
        <GrowthDashboardSection 
          data={analyticsData} 
          dateRangeFilter={dateRangeFilter}
          setDateRangeFilter={setDateRangeFilter}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
      )}
      {activeSubTab === 'insights' && <AdminUserInsightsSection data={analyticsData} />}

      {/* Export Reports Modal */}
      <AdminExportReportsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={analyticsData}
      />
    </div>
  );
};
