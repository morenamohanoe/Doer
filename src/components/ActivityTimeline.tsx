import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, AlertCircle, RotateCcw, ShieldCheck, User } from 'lucide-react';
import { ServiceRequest } from '../types';

interface ActivityTimelineProps {
  requests: ServiceRequest[];
}

export default function ActivityTimeline({ requests }: ActivityTimelineProps) {
  // Sort requests by updatedAt or createdAt to get most recent first
  const sortedActivities = [...requests]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 10); // Show last 10 activities

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'released':
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Completed' };
      case 'funded':
        return { icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Funded' };
      case 'cancelled':
        return { icon: RotateCcw, color: 'text-red-500', bg: 'bg-red-50', label: 'Cancelled' };
      case 'disputed':
        return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Disputed' };
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Requested' };
    }
  };

  const formatTimeAgo = (date: string | number) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Live Updates</span>
      </div>

      <div className="relative space-y-6">
        {/* Vertical Line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />

        {sortedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">No recent activity found</p>
          </div>
        ) : (
          sortedActivities.map((req, index) => {
            const config = getStatusConfig(req.status);
            const Icon = config.icon;

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-10 group"
              >
                {/* Timeline Dot/Icon */}
                <div className={`absolute left-0 p-2 rounded-full ${config.bg} border-2 border-white ring-4 ring-white z-10 transition-transform group-hover:scale-110`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-900">
                      Job #{req.id.slice(-4).toUpperCase()} {config.label.toLowerCase()}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatTimeAgo(req.updatedAt || req.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {req.status === 'requested' 
                      ? `New request for "${req.title}" by ${req.bookingOwnerName}`
                      : `Job "${req.title}" ${config.label.toLowerCase()} by ${req.doerName}`
                    }
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
