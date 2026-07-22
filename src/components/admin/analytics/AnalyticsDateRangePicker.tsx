/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Check } from 'lucide-react';

export type DateRangeFilterType = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export interface AnalyticsDateRangePickerProps {
  dateRangeFilter: DateRangeFilterType;
  setDateRangeFilter: (range: DateRangeFilterType) => void;
  customStart: string;
  setCustomStart: (date: string) => void;
  customEnd: string;
  setCustomEnd: (date: string) => void;
  className?: string;
}

export const AnalyticsDateRangePicker: React.FC<AnalyticsDateRangePickerProps> = ({
  dateRangeFilter,
  setDateRangeFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  className = ''
}) => {
  const presets: { id: DateRangeFilterType; label: string; shortLabel: string }[] = [
    { id: 'today', label: 'Today', shortLabel: 'Today' },
    { id: '7d', label: '7 Days', shortLabel: '7D' },
    { id: '30d', label: '30 Days', shortLabel: '30D' },
    { id: '90d', label: '90 Days', shortLabel: '90D' },
    { id: 'year', label: 'This Year', shortLabel: 'Year' },
    { id: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
  ];

  // Calculate formatted label summary
  const getActiveSummaryLabel = () => {
    const now = new Date();
    const formatDate = (d: Date) => d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

    if (dateRangeFilter === 'today') {
      return `Today (${formatDate(now)})`;
    }
    if (dateRangeFilter === '7d') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${formatDate(past)} – ${formatDate(now)}`;
    }
    if (dateRangeFilter === '30d') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `${formatDate(past)} – ${formatDate(now)}`;
    }
    if (dateRangeFilter === '90d') {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return `${formatDate(past)} – ${formatDate(now)}`;
    }
    if (dateRangeFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return `${formatDate(startOfYear)} – ${formatDate(now)}`;
    }
    if (dateRangeFilter === 'custom') {
      if (customStart && customEnd) {
        const s = new Date(customStart);
        const e = new Date(customEnd);
        return `${formatDate(s)} – ${formatDate(e)}`;
      }
      if (customStart) {
        const s = new Date(customStart);
        return `From ${formatDate(s)}`;
      }
      return 'Custom Range';
    }
    return 'Last 30 Days';
  };

  const handleSelectPreset = (id: DateRangeFilterType) => {
    setDateRangeFilter(id);
    if (id === 'custom') {
      if (!customStart) {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setCustomStart(d.toISOString().split('T')[0]);
      }
      if (!customEnd) {
        setCustomEnd(new Date().toISOString().split('T')[0]);
      }
    }
  };

  return (
    <div className={`flex flex-col lg:flex-row items-start lg:items-center gap-3 max-w-full min-w-0 ${className}`}>
      {/* Date Range Selector Pill Group */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 max-w-full overflow-x-auto scrollbar-none shadow-inner shrink-0">
        {presets.map((preset) => {
          const isSelected = dateRangeFilter === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 shrink-0 ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-brand shrink-0" />}
              <span className="hidden xl:inline">{preset.label}</span>
              <span className="inline xl:hidden">{preset.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Date Range Summary & Custom Trigger */}
      <div className="flex items-center gap-2 flex-wrap min-w-0 max-w-full">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 shrink-0 min-w-0 max-w-full">
          <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-none">
            {getActiveSummaryLabel()}
          </span>
        </div>

        {/* Custom Date Range Popover/Inline Toggle */}
        {dateRangeFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-brand/30 shadow-sm max-w-full">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold shrink-0">to</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
