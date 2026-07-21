import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Eye, Star, ShieldCheck, Quote, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { PortfolioProject, PortfolioImage } from '../types';
import { useApp } from '../context/AppContext';

interface PortfolioProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PortfolioProject;
  images: PortfolioImage[];
  onOpenLightbox: (index: number) => void;
}

export default function PortfolioProjectDetailModal({
  isOpen,
  onClose,
  project,
  images,
  onOpenLightbox
}: PortfolioProjectDetailModalProps) {
  const { serviceCategories, triggerSound } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'comparison'>('details');

  if (!isOpen) return null;

  const catObj = serviceCategories.find((c) => c.id === project.category_id);
  const categoryName = catObj ? catObj.name : (project.category_id || 'Services');
  const categoryColor = catObj ? catObj.color : 'from-slate-500 to-slate-600';

  const isVerified = project.isVerified || (project as any).is_verified;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] text-left"
        >
          {/* Top Header Banner Image */}
          <div className="relative h-48 bg-slate-100 overflow-hidden flex-shrink-0">
            <img
              src={project.cover_image}
              alt={project.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

            {/* Float category & verified status */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${categoryColor} shadow-md`}>
                {categoryName}
              </span>
              {isVerified && (
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white bg-zinc-900/90 border border-brand/40 flex items-center gap-1 shadow-md backdrop-blur-xs">
                  <ShieldCheck className="w-3 h-3 text-brand fill-brand/10" />
                  Verified
                </span>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                triggerSound('click');
                onClose();
              }}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-slate-800 rounded-full transition-colors cursor-pointer shadow-md active:scale-95 z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Overlay Title Block */}
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow-xs">
                {project.title}
              </h3>
              <div className="flex gap-4 items-center text-[10px] text-slate-200/90 font-bold mt-1.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'Recent'}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {project.views} views
                </span>
                <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  ★ {project.rating === 0 ? "0.0" : project.rating || "0.0"} Score
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation if Before/After exists */}
          {(project.beforeImage || project.afterImage) && (
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 flex-shrink-0">
              <button
                onClick={() => {
                  triggerSound('click');
                  setActiveTab('details');
                }}
                className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
                  activeTab === 'details'
                    ? 'bg-white text-brand shadow-2xs font-extrabold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                📋 Project Overview
              </button>
              <button
                onClick={() => {
                  triggerSound('click');
                  setActiveTab('comparison');
                }}
                className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
                  activeTab === 'comparison'
                    ? 'bg-white text-brand shadow-2xs font-extrabold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                🔄 Before & After Proof
              </button>
            </div>
          )}

          {/* Scrollable Detail Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-none">
            {activeTab === 'details' ? (
              <>
                {/* Project Description / Case study */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    Problem & Solution Overview
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>

                {/* Doer Verification Explainer Badge */}
                {isVerified && (
                  <div className="p-4 rounded-2xl border border-brand/20 bg-brand/5 flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5 fill-brand/5" />
                    <div>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                        Verified Work Proof
                      </h5>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        This work proof has been verified through GPS telemetry coordinates, customer digital sign-off, or payment transactions on the DOER platform.
                      </p>
                    </div>
                  </div>
                )}

                {/* Client Feedback section */}
                {project.clientFeedback && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Client Review
                    </h4>
                    <div className="relative bg-indigo-50/45 border border-indigo-100 p-4 rounded-2xl flex gap-3 items-start">
                      <Quote className="w-8 h-8 text-indigo-200 shrink-0 transform -scale-x-100" />
                      <div className="space-y-1">
                        <div className="flex text-amber-500 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                          "{project.clientFeedback}"
                        </p>
                        <span className="block text-[9px] font-extrabold text-indigo-600/90 uppercase tracking-wider">
                          ✓ Completed Job Verified Feedback
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Gallery Grid */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Photo Gallery ({images.length})</span>
                    <span className="text-[9px] font-semibold text-slate-400 normal-case">Click any photo to zoom/view</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-2.5">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        onClick={() => {
                          triggerSound('click');
                          onOpenLightbox(idx);
                        }}
                        className="group relative h-20 rounded-xl overflow-hidden border border-slate-150 cursor-pointer hover:border-brand/40 hover:shadow-xs transition-all bg-slate-50"
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Before/After Side-by-Side proof comparison */
              <div className="space-y-5 text-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before */}
                  {project.beforeImage && (
                    <div className="space-y-1.5">
                      <span className="inline-block bg-orange-100 text-orange-700 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                        Before Work
                      </span>
                      <div
                        onClick={() => {
                          const idx = images.findIndex(img => img.id === `before-${project.id}`);
                          if (idx >= 0) onOpenLightbox(idx);
                        }}
                        className="relative h-44 rounded-2xl overflow-hidden border border-orange-100 cursor-pointer hover:shadow-md transition-shadow group bg-slate-50"
                      >
                        <img
                          src={project.beforeImage}
                          alt="Before"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-extrabold uppercase bg-orange-600 px-3 py-1.5 rounded-full shadow-sm">
                            Zoom Before
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* After */}
                  {project.afterImage && (
                    <div className="space-y-1.5">
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                        After Work
                      </span>
                      <div
                        onClick={() => {
                          const idx = images.findIndex(img => img.id === `after-${project.id}`);
                          if (idx >= 0) onOpenLightbox(idx);
                        }}
                        className="relative h-44 rounded-2xl overflow-hidden border border-emerald-100 cursor-pointer hover:shadow-md transition-shadow group bg-slate-50"
                      >
                        <img
                          src={project.afterImage}
                          alt="After"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-extrabold uppercase bg-emerald-600 px-3 py-1.5 rounded-full shadow-sm">
                            Zoom After
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informative helper caption */}
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-indigo-700/80 text-[10px] font-bold flex items-center justify-center gap-1.5">
                  <span>✨ Real work proof transformation from start to final sign-off.</span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer with interactive cta */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
              Project case study ID: {project.id}
            </span>
            <button
              onClick={() => {
                triggerSound('click');
                onOpenLightbox(0);
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
            >
              <ImageIcon className="w-3.5 h-3.5" /> View Slideshow <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
