/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Bell, 
  CheckCircle2, 
  ShieldAlert, 
  Eye, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';

export interface CriticalAlertItem {
  id: string;
  type: 'high_value_withdrawal' | 'cancellation_spike' | 'disputed_booking' | 'category_request' | 'low_rating' | 'unverified_doer_activity';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  metadata?: Record<string, any>;
  actionLabel?: string;
  entityId?: string;
}

interface AdminCriticalAlertsPanelProps {
  data: AdminAnalyticsData;
  className?: string;
}

export const AdminCriticalAlertsPanel: React.FC<AdminCriticalAlertsPanelProps> = ({
  data,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'withdrawals' | 'cancellations'>('all');
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [selectedAlertModal, setSelectedAlertModal] = useState<CriticalAlertItem | null>(null);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());

  const { raw } = data;

  // Generate dynamic alerts based on live analytics telemetry
  const allAlerts = useMemo(() => {
    const alerts: CriticalAlertItem[] = [];

    // 1. High-Value Withdrawal Requests (Pending withdrawals >= R500 or any pending)
    const pendingWithdrawals = raw.withdrawals.filter(w => w.status === 'pending');
    pendingWithdrawals.forEach(w => {
      const user = raw.users.find(u => u.id === w.userId || u.uid === w.userId);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Registered Doer';
      const isHighValue = w.amount >= 500;

      alerts.push({
        id: `withdrawal_${w.id}`,
        type: 'high_value_withdrawal',
        severity: isHighValue ? 'critical' : 'warning',
        title: isHighValue ? `High-Value Payout Request: R ${w.amount.toLocaleString()}` : `Pending Withdrawal Request: R ${w.amount.toLocaleString()}`,
        description: `${userName} requested payout to ${w.bankName || 'Bank Account'} (Acc: ${w.accountNumber || 'N/A'}). Requires audit verification.`,
        timestamp: w.createdAt || new Date().toISOString(),
        amount: w.amount,
        actionLabel: 'Review Withdrawal',
        entityId: w.id,
        metadata: {
          user,
          withdrawal: w
        }
      });
    });

    // 2. Cancellation Spike Detection
    const totalBookings = raw.bookings.length;
    const cancelledBookings = raw.bookings.filter(b => b.status === 'cancelled' || b.status === 'refunded');
    const cancellationRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;

    if (cancelledBookings.length > 0) {
      const isSpike = cancellationRate > 12 || cancelledBookings.length >= 3;
      alerts.push({
        id: 'alert_cancellation_rate',
        type: 'cancellation_spike',
        severity: isSpike ? 'critical' : 'warning',
        title: isSpike ? `Cancellation Spike Alert (${cancellationRate.toFixed(1)}% Rate)` : `Booking Cancellations Tracked (${cancelledBookings.length} Total)`,
        description: `Platform currently logs ${cancelledBookings.length} cancelled/refunded booking requests out of ${totalBookings} total orders.`,
        timestamp: cancelledBookings[0]?.createdAt || new Date().toISOString(),
        actionLabel: 'Inspect Cancelled Orders',
        metadata: {
          cancelledCount: cancelledBookings.length,
          totalBookings,
          rate: cancellationRate.toFixed(1),
          sampleBookings: cancelledBookings.slice(0, 5)
        }
      });
    }

    // 3. Disputed Bookings Alert
    const disputedBookings = raw.bookings.filter(b => b.status === 'disputed');
    disputedBookings.forEach(b => {
      alerts.push({
        id: `dispute_${b.id}`,
        type: 'disputed_booking',
        severity: 'critical',
        title: `Escrow Order Disputed: "${b.title}"`,
        description: `Client ${b.bookingOwnerName} disputed booking with Doer ${b.doerName}. Value held: R ${(b.price || 0).toLocaleString()}.`,
        timestamp: b.updatedAt || b.createdAt || new Date().toISOString(),
        amount: b.price,
        actionLabel: 'Resolve Dispute',
        entityId: b.id,
        metadata: { booking: b }
      });
    });

    // 4. Pending Category Approval Requests
    const pendingCatRequests = raw.categoryRequests.filter(c => c.status === 'pending');
    if (pendingCatRequests.length > 0) {
      alerts.push({
        id: 'alert_pending_categories',
        type: 'category_request',
        severity: 'info',
        title: `${pendingCatRequests.length} Custom Category Requests Awaiting Admin Approval`,
        description: `Doers submitted new marketplace category creation proposals (e.g., "${pendingCatRequests[0]?.name || 'New Category'}").`,
        timestamp: pendingCatRequests[0]?.createdAt || new Date().toISOString(),
        actionLabel: 'Manage Categories',
        metadata: { requests: pendingCatRequests }
      });
    }

    // 5. Low Rating / Negative Reviews Alert (<= 2 stars)
    const lowReviews = raw.reviews.filter(r => (r.rating || 5) <= 2);
    if (lowReviews.length > 0) {
      alerts.push({
        id: 'alert_low_ratings',
        type: 'low_rating',
        severity: 'warning',
        title: `${lowReviews.length} Negative Customer Review(s) Logged`,
        description: `Service feedback rated <= 2 stars submitted recently. Recent comment: "${lowReviews[0]?.comment || 'Quality concern reported'}".`,
        timestamp: lowReviews[0]?.createdAt || new Date().toISOString(),
        actionLabel: 'View Negative Reviews',
        metadata: { reviews: lowReviews }
      });
    }

    // 6. Unverified Doer High Activity Alert
    const unverifiedActiveDoers = raw.users.filter(u => 
      u.role === 'doer' && 
      (u.verificationStatus === 'unverified' || !u.verificationStatus)
    );
    
    // Check if any unverified doer has services or completed bookings
    const activeUnverifiedDoersWithJobs = unverifiedActiveDoers.filter(u => {
      const doerBookings = raw.bookings.filter(b => b.doerId === u.id || b.doerId === u.uid);
      const doerServices = raw.services.filter(s => s.doerId === u.id || s.doerId === u.uid);
      return doerBookings.length > 0 || doerServices.length > 0;
    });

    if (activeUnverifiedDoersWithJobs.length > 0) {
      alerts.push({
        id: 'alert_unverified_doer_activity',
        type: 'unverified_doer_activity',
        severity: 'warning',
        title: `${activeUnverifiedDoersWithJobs.length} Unverified Doer(s) Operating Active Services`,
        description: `Unverified provider profiles are currently listing services or accepting client bookings. Verification prompt recommended.`,
        timestamp: new Date().toISOString(),
        actionLabel: 'Verify Doer Profiles',
        metadata: { unverifiedUsers: activeUnverifiedDoersWithJobs }
      });
    }

    // 7. System & Real-Time Notifications Collection Monitoring
    const systemNotifications = raw.notifications.filter(n => {
      const titleLower = (n.title || '').toLowerCase();
      const msgLower = (n.message || '').toLowerCase();
      return (
        n.type === 'admin_alert' ||
        n.type === 'withdrawal' ||
        n.type === 'dispute' ||
        (n as any).isCritical ||
        titleLower.includes('urgent') ||
        titleLower.includes('critical') ||
        titleLower.includes('cancel') ||
        titleLower.includes('withdrawal') ||
        msgLower.includes('cancellation')
      );
    });

    systemNotifications.forEach(n => {
      const alertId = `notif_${n.id}`;
      if (!alerts.some(a => a.id === alertId || a.entityId === n.id)) {
        alerts.push({
          id: alertId,
          type: n.type === 'withdrawal' ? 'high_value_withdrawal' : 'cancellation_spike',
          severity: (n as any).isCritical ? 'critical' : 'warning',
          title: n.title || 'System Notification Alert',
          description: n.message || 'Automated notification event stored in database.',
          timestamp: n.createdAt || new Date().toISOString(),
          actionLabel: 'View System Event',
          entityId: n.id,
          metadata: { notification: n }
        });
      }
    });

    return alerts;
  }, [raw]);

  // Filter out dismissed alerts
  const visibleAlerts = useMemo(() => {
    return allAlerts.filter(a => !dismissedAlertIds.has(a.id));
  }, [allAlerts, dismissedAlertIds]);

  // Filtered subset by category tab
  const filteredAlerts = useMemo(() => {
    return visibleAlerts.filter(a => {
      if (activeFilter === 'critical') return a.severity === 'critical';
      if (activeFilter === 'warning') return a.severity === 'warning';
      if (activeFilter === 'withdrawals') return a.type === 'high_value_withdrawal';
      if (activeFilter === 'cancellations') return a.type === 'cancellation_spike' || a.type === 'disputed_booking';
      return true;
    });
  }, [visibleAlerts, activeFilter]);

  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDismissedAlertIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleAcknowledge = (id: string) => {
    setAcknowledgedAlertIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const getAlertStyle = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-50/80 border-rose-200 text-rose-950',
          badgeBg: 'bg-rose-600 text-white',
          iconBg: 'bg-rose-100 text-rose-600',
          icon: ShieldAlert
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/80 border-amber-200 text-amber-950',
          badgeBg: 'bg-amber-500 text-white',
          iconBg: 'bg-amber-100 text-amber-700',
          icon: AlertTriangle
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50/80 border-blue-200 text-blue-950',
          badgeBg: 'bg-blue-600 text-white',
          iconBg: 'bg-blue-100 text-blue-600',
          icon: AlertCircle
        };
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden transition-all ${className}`}>
      {/* Panel Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
            {visibleAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                {visibleAlerts.length}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Admin Command Critical Events & Alerts Panel
              </h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                criticalCount > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {criticalCount > 0 ? 'Elevated Risk' : 'Normal Operation'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Automated anomaly detection • High-value payout triggers & cancellation spike metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            <span>{criticalCount} Critical</span>
            <span className="text-slate-500 mx-0.5">|</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            <span>{warningCount} Warnings</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700"
            title={isExpanded ? 'Collapse Panel' : 'Expand Panel'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Section */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50 border-t border-slate-100">
          {/* Category / Severity Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="flex overflow-x-auto gap-1.5 scrollbar-none max-w-full">
              {[
                { id: 'all', label: `All Alerts (${visibleAlerts.length})` },
                { id: 'critical', label: `Critical (${criticalCount})` },
                { id: 'warning', label: `Warnings (${warningCount})` },
                { id: 'withdrawals', label: `High Withdrawals` },
                { id: 'cancellations', label: `Cancellations & Disputes` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    activeFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {dismissedAlertIds.size > 0 && (
              <button
                onClick={() => setDismissedAlertIds(new Set())}
                className="text-xs font-bold text-slate-500 hover:text-brand flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Dismissed ({dismissedAlertIds.size})</span>
              </button>
            )}
          </div>

          {/* Alerts List Container */}
          {filteredAlerts.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-black text-slate-800">No Active Critical Alerts</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active anomaly triggers match the selected filter. Platform withdrawals, cancellation metrics, and ratings are operating within healthy parameters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAlerts.map(alert => {
                const style = getAlertStyle(alert.severity);
                const IconComp = style.icon;
                const isAcknowledged = acknowledgedAlertIds.has(alert.id);

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${style.bg} ${
                      isAcknowledged ? 'opacity-65 grayscale-[30%]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${style.iconBg}`}>
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${style.badgeBg}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs font-black text-slate-900 truncate">
                            {alert.title}
                          </span>
                          {isAcknowledged && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Reviewed
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {alert.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {alert.amount !== undefined && (
                            <span className="font-bold text-slate-900 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                              Exposure: R {alert.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 w-full sm:w-auto justify-end">
                      {!isAcknowledged ? (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-250 shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark Reviewed</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-500 px-2">Audit Done</span>
                      )}

                      <button
                        onClick={() => setSelectedAlertModal(alert)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={(e) => handleDismiss(alert.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 rounded-lg transition-all"
                        title="Dismiss Alert"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alert Inspection Modal */}
      {selectedAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 space-y-5 p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedAlertModal.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Alert ID: {selectedAlertModal.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlertModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Event Overview</div>
                <p className="text-slate-700 font-medium text-xs leading-relaxed">
                  {selectedAlertModal.description}
                </p>
              </div>

              {selectedAlertModal.amount !== undefined && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-800">Financial Exposure Value:</span>
                  <span className="text-sm font-black text-emerald-900">R {selectedAlertModal.amount.toLocaleString()}</span>
                </div>
              )}

              {/* Specific metadata renderer */}
              {selectedAlertModal.metadata?.withdrawal && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
                  <div className="font-bold text-slate-900">Payout Details:</div>
                  <div>Bank Name: <span className="font-black text-slate-900">{selectedAlertModal.metadata.withdrawal.bankName || 'N/A'}</span></div>
                  <div>Account #: <span className="font-black text-slate-900">{selectedAlertModal.metadata.withdrawal.accountNumber || 'N/A'}</span></div>
                  <div>Status: <span className="font-black text-amber-600 uppercase">{selectedAlertModal.metadata.withdrawal.status}</span></div>
                </div>
              )}

              {selectedAlertModal.metadata?.booking && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
                  <div className="font-bold text-slate-900">Booking / Dispute Details:</div>
                  <div>Client: <span className="font-black text-slate-900">{selectedAlertModal.metadata.booking.bookingOwnerName}</span></div>
                  <div>Doer: <span className="font-black text-slate-900">{selectedAlertModal.metadata.booking.doerName}</span></div>
                  <div>Status: <span className="font-black text-rose-600 uppercase">{selectedAlertModal.metadata.booking.status}</span></div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  handleAcknowledge(selectedAlertModal.id);
                  setSelectedAlertModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Acknowledge & Close
              </button>
              <button
                onClick={() => setSelectedAlertModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
