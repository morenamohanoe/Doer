/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Download, 
  X, 
  Users, 
  Briefcase, 
  DollarSign, 
  Wallet, 
  Trophy
} from 'lucide-react';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';

interface AdminExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AdminAnalyticsData;
}

export const AdminExportReportsModal: React.FC<AdminExportReportsModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen) return null;

  const { raw, overview, financials, leaderboards, userInsights } = data;

  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUsers = () => {
    const headers = ['UID', 'Full Name', 'Email', 'Role', 'Verification Status', 'Joined Date', 'Services Active', 'Bookings Completed', 'Revenue (R)', 'Wallet Balance (R)'];
    const rows = userInsights.map(u => [
      `"${u.uid}"`,
      `"${u.fullName.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.verificationStatus}"`,
      `"${new Date(u.joinedDate).toLocaleDateString()}"`,
      u.servicesActive,
      u.bookingsCompleted,
      u.revenueGenerated,
      u.walletBalance
    ]);
    downloadCSV('DOER_Users_Report', headers, rows);
  };

  const handleExportBookings = () => {
    const headers = ['Booking ID', 'Title', 'Price (R)', 'Client Name', 'Doer Name', 'Status', 'Created Date'];
    const rows = raw.bookings.map(b => [
      `"${b.id}"`,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      b.price || 0,
      `"${(b.bookingOwnerName || '').replace(/"/g, '""')}"`,
      `"${(b.doerName || '').replace(/"/g, '""')}"`,
      `"${b.status}"`,
      `"${b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}"`
    ]);
    downloadCSV('DOER_Bookings_Escrow_Report', headers, rows);
  };

  const handleExportRevenue = () => {
    const headers = ['Metric', 'Value (R)'];
    const rows = [
      ['Total Revenue', overview.totalRevenue],
      ['Service Fees Collected (10%)', financials.totalServiceFeesCollected],
      ['Withdrawal Fees Collected', financials.totalWithdrawalFeesCollected],
      ['Total Platform Earnings', overview.totalFeesCollected],
      ['Monthly Revenue', financials.monthlyRevenue],
      ['Yearly Revenue', financials.yearlyRevenue]
    ];
    downloadCSV('DOER_Revenue_Fees_Report', headers, rows);
  };

  const handleExportWithdrawals = () => {
    const headers = ['Withdrawal ID', 'User ID', 'Amount (R)', 'Fee (R)', 'Status', 'Date'];
    const rows = raw.withdrawals.map(w => [
      `"${w.id}"`,
      `"${w.userId}"`,
      w.amount || 0,
      w.feeAmount || 0,
      `"${w.status}"`,
      `"${w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'N/A'}"`
    ]);
    downloadCSV('DOER_Withdrawals_Report', headers, rows);
  };

  const handleExportLeaderboard = () => {
    const headers = ['Rank', 'Name', 'Location', 'Earnings (R)', 'Jobs Completed'];
    const rows = leaderboards.topEarners.map(e => [
      e.rank,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.location.replace(/"/g, '""')}"`,
      e.metricValue,
      e.metricLabel
    ]);
    downloadCSV('DOER_Top_Performers_Report', headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand text-white rounded-2xl shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Executive Intelligence Reports</h3>
              <p className="text-xs text-slate-300 font-medium">Export raw Firestore telemetry formatted for Excel & BI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={handleExportUsers}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">User Account Directory</div>
                <div className="text-[11px] text-slate-500 font-medium">{userInsights.length} total user accounts</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-all" />
          </button>

          <button
            onClick={handleExportBookings}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Bookings & Escrow Ledger</div>
                <div className="text-[11px] text-slate-500 font-medium">{raw.bookings.length} service requests</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-all" />
          </button>

          <button
            onClick={handleExportRevenue}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Revenue & Platform Fees</div>
                <div className="text-[11px] text-slate-500 font-medium">Platform 10% cut & transaction fees</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-all" />
          </button>

          <button
            onClick={handleExportWithdrawals}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Doer Withdrawals & Payouts</div>
                <div className="text-[11px] text-slate-500 font-medium">{raw.withdrawals.length} payout requests</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-all" />
          </button>

          <button
            onClick={handleExportLeaderboard}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Top Performers Leaderboard</div>
                <div className="text-[11px] text-slate-500 font-medium">Ranked top doers by revenue & volume</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-all" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
