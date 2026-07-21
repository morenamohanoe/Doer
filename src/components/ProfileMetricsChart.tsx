import { motion } from "motion/react";
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Line
} from 'recharts';
import { TrendingUp, BarChart3, Star } from 'lucide-react';
import { ServiceRequest } from '../types';

interface ProfileMetricsChartProps {
  completedJobsCount: number;
  rating: number;
  doerRequests?: ServiceRequest[];
  reviews?: any[];
}

export default function ProfileMetricsChart({ completedJobsCount, rating, doerRequests = [], reviews = [] }: ProfileMetricsChartProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'revenue' | 'ratings'>('all');

  // Safely construct responsive trend metrics
  const completedRequests = doerRequests.filter(r => r.status === 'released' || r.status === 'completed');
  const totalJobs = completedRequests.length;
  
  // Calculate average rating from real reviews
  const currentRating = reviews.length > 0 
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : (rating || 0);

  // Calculate dynamic job completion rate
  const terminalStatuses = ['released', 'completed', 'cancelled', 'disputed'];
  const terminalRequests = doerRequests.filter(r => terminalStatuses.includes(r.status));
  
  const completionRate = terminalRequests.length > 0 
    ? Math.round((doerRequests.filter(r => r.status === 'released' || r.status === 'completed').length / terminalRequests.length) * 100) 
    : 0;

  const generateData = () => {
    const today = new Date();
    const monthsData = [];
    
    // Initialize empty months for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      
      monthsData.push({
        name: monthName,
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        Requests: 0,
        Revenue: 0,
        Rating: currentRating || 0, // Fallback to current overall rating if no monthly data
        ratingSum: 0,
        ratingCount: 0
      });
    }

    // Populate with real request data
    const releasedRequests = doerRequests.filter(r => r.status === 'released' || r.status === 'completed');
    
    releasedRequests.forEach(req => {
      const reqDate = new Date(req.updatedAt || req.createdAt);
      const reqMonth = reqDate.getMonth();
      const reqYear = reqDate.getFullYear();
      
      const monthObj = monthsData.find(m => m.monthIndex === reqMonth && m.year === reqYear);
      if (monthObj) {
        monthObj.Requests += 1;
        monthObj.Revenue += (req.price || 0);
      }
    });

    // Populate with real review data for ratings trend
    reviews.forEach(rev => {
      const revDate = new Date(rev.createdAt);
      const revMonth = revDate.getMonth();
      const revYear = revDate.getFullYear();

      const monthObj = monthsData.find(m => m.monthIndex === revMonth && m.year === revYear);
      if (monthObj) {
        monthObj.ratingSum += rev.rating;
        monthObj.ratingCount += 1;
      }
    });

    // Finalize ratings per month
    return monthsData.map(m => {
      let finalRating = m.Rating;
      if (m.ratingCount > 0) {
        finalRating = Number((m.ratingSum / m.ratingCount).toFixed(1));
      } else {
        // If no ratings in this month, use the average rating as a baseline
        finalRating = currentRating;
      }

      return {
        name: m.name,
        Requests: m.Requests,
        Revenue: m.Revenue,
        Rating: finalRating,
      };
    });
  };

  const data = generateData();

  // Custom tooltips with styled design matching our app themes
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/95 border border-zinc-800 p-3 rounded-xl shadow-xl text-left backdrop-blur-md select-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label} Performance</p>
          <div className="space-y-1.5 mt-2">
            {payload.map((pld: any, index: number) => (
              <div key={index} className="flex items-center gap-3 justify-between">
                <span className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                  <span 
                    className="w-2 h-2 rounded-full inline-block" 
                    style={{ backgroundColor: pld.color || pld.fill }}
                  />
                  {pld.name}:
                </span>
                <span className="text-xs font-black text-white">
                  {pld.name === 'Rating' ? `${pld.value} ★` : pld.name === 'Revenue' ? `R ${pld.value.toLocaleString('en-ZA')}` : `${pld.value} jobs`}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="bg-white p-5 geom-card border border-slate-100 shadow-xs space-y-4 text-left hover:shadow-lg transition-all duration-300"
      whileHover={{
        scale: 1.02
      }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-brand" /> Service Request Metrics &amp; Ratings
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Performance breakdown and historical metrics for the past 6 months
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'revenue' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Revenue (ZAR)
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'ratings' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Rating Trend
          </button>
        </div>
      </div>
      {/* Mini Summary Cards Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-center sm:text-left">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Completed</span>
          <span className="text-sm font-black text-slate-900 mt-0.5 block">{totalJobs} Jobs</span>
        </div>
        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-center sm:text-left">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Average Rating</span>
          <span className="text-sm font-black text-brand-dark mt-0.5 block flex items-center justify-center sm:justify-start gap-1">
            {currentRating} <Star className="w-3.5 h-3.5 fill-brand/30 text-brand" />
          </span>
        </div>
        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-center sm:text-left">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Job Completion</span>
          <span className="text-sm font-black text-emerald-600 mt-0.5 block flex items-center justify-center sm:justify-start gap-1">
            {completionRate}% <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </span>
        </div>
      </div>
      {/* Chart Canvas Area */}
      <div className="h-44 w-full select-none text-[9px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'all' ? (
            <ComposedChart data={data} margin={{ top: 5, right: -10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={8} fontWeight="bold" tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} stroke="#10b981" fontSize={8} fontWeight="bold" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="Requests" name="Jobs" fill="#f97316" radius={[4, 4, 0, 0]} barSize={14} />
              <Line yAxisId="right" type="monotone" dataKey="Revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          ) : activeTab === 'revenue' ? (
            <AreaChart data={data} margin={{ top: 5, right: -10, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={8} fontWeight="bold" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          ) : (
            <AreaChart data={data} margin={{ top: 5, right: -10, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRatings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
              <YAxis domain={[3.0, 5.0]} stroke="#94a3b8" fontSize={8} fontWeight="bold" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Rating" name="Rating" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRatings)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
