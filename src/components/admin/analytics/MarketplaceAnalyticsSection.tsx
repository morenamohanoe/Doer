/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Layers, 
  MapPin, 
  Briefcase, 
  Tag, 
  FolderPlus
} from 'lucide-react';
import { AdminAnalyticsData } from '../../../hooks/useAdminAnalyticsData';

interface MarketplaceAnalyticsSectionProps {
  data: AdminAnalyticsData;
}

export const MarketplaceAnalyticsSection: React.FC<MarketplaceAnalyticsSectionProps> = ({ data }) => {
  const { marketplace } = data;

  return (
    <div className="space-y-6">
      {/* Category Overview & Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Popular Categories */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" />
                Service Catalog Distribution by Category
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Proportion of active listed services per category
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {marketplace.popularCategories.length} Categories
            </span>
          </div>

          <div className="space-y-3">
            {marketplace.popularCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No categories listed yet.</p>
            ) : (
              marketplace.popularCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{cat.category}</span>
                    <span>{cat.count} services ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand h-full rounded-full transition-all duration-500" 
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Category Moderation Requests */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-500" />
                User Suggested Categories
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Category expansion requests submitted by doers and clients
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {marketplace.requestedCategories.length} Requests
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {marketplace.requestedCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No pending user category requests.</p>
            ) : (
              marketplace.requestedCategories.map((req, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900">{req.name}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Services & Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services by Revenue */}
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Top Performing Listed Services
            </h4>
            <span className="text-xs text-slate-400 font-bold">Highest Grossing</span>
          </div>

          <div className="space-y-3">
            {marketplace.topServices.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No services recorded.</p>
            ) : (
              marketplace.topServices.map((srv, idx) => (
                <div key={srv.id || idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">{srv.title}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {srv.category} • Offered by {srv.doerName}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-emerald-600">
                      R {srv.revenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {srv.bookingsCount} completed
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Geographic Marketplace Distribution */}
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              Geographic Market Distribution
            </h4>
            <span className="text-xs text-slate-400 font-bold">Provinces & Hubs</span>
          </div>

          <div className="space-y-3">
            {marketplace.topLocations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No location distribution data yet.</p>
            ) : (
              marketplace.topLocations.map((loc, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{loc.location}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{loc.usersCount} registered users</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">R {loc.revenue.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{loc.bookingsCount} bookings</div>
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
