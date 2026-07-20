/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  MessageSquare,
  BarChart3,
  User,
  Plus,
  Bell,
  X,
  Sparkles,
  Shield,
  Briefcase,
  ShoppingBag,
  Info
} from 'lucide-react';
import PostServiceModal from './PostServiceModal';
import PostProductModal from './PostProductModal';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export default function Navigation({ currentTab, setTab }: NavigationProps) {
  const {
    activeRole,
    isAdmin,
    triggerSound
  } = useApp();

  const [isPostSheetOpen, setIsPostSheetOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    triggerSound('click');
    setTab(tab);
  };

  const handlePostClick = () => {
    triggerSound('click');
    setIsPostSheetOpen(true);
  };

  const handleOpenPostType = (type: 'service' | 'product') => {
    triggerSound('success');
    setIsPostSheetOpen(false);
    if (type === 'service') {
      setIsServiceModalOpen(true);
    } else {
      setIsProductModalOpen(true);
    }
  };

  return (
    <>
      {/* --- NATIVE BOTTOM TAB BAR --- */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-150 shadow-xl px-4 py-2 flex justify-around items-center z-40 h-16 rounded-t-[24px]">
        
        {/* TAB 1: HOME */}
        <button
          onClick={() => handleTabChange('home')}
          className={`flex flex-col items-center gap-0.5 w-12 transition-all ${
            currentTab === 'home' ? 'text-brand scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Home</span>
        </button>

        {/* TAB 2: DASHBOARD */}
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center gap-0.5 w-12 transition-all ${
            currentTab === 'dashboard' ? 'text-brand scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Stats</span>
        </button>

        {/* TAB 3: CENTRAL ACTION FAB (Always visible for quick service listing) */}
        <div className="relative -top-5">
          <button
            onClick={handlePostClick}
            className="bg-brand text-white p-3.5 rounded-full shadow-lg shadow-brand/20 border-4 border-white transition-all active:scale-95 flex items-center justify-center hover:bg-brand-hover cursor-pointer"
          >
            <Plus className="w-6 h-6 font-black" />
          </button>
        </div>

        {/* TAB 4: MESSAGES */}
        <button
          onClick={() => handleTabChange('conversations')}
          className={`flex flex-col items-center gap-0.5 w-12 transition-all ${
            currentTab === 'conversations' ? 'text-brand scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Chats</span>
        </button>

        {/* TAB 5: PROFILE */}
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex flex-col items-center gap-0.5 w-12 transition-all ${
            currentTab === 'profile' ? 'text-brand scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Profile</span>
        </button>

        {/* TAB 6: ADMIN (Conditional) */}
        {isAdmin && (
          <button
            onClick={() => handleTabChange('admin')}
            className={`flex flex-col items-center gap-0.5 w-12 transition-all ${
              currentTab === 'admin' ? 'text-brand scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Admin</span>
          </button>
        )}
      </div>

      {/* --- QUICK ACTION POST SHEET --- */}
      <AnimatePresence>
        {isPostSheetOpen && (
          <div className="absolute inset-0 bg-slate-900/60 z-50 flex flex-col justify-end text-left">
            <div className="flex-1" onClick={() => setIsPostSheetOpen(false)} />
            <motion.div
              initial={{ y: 250 }}
              animate={{ y: 0 }}
              exit={{ y: 250 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
              className="bg-white rounded-t-[32px] p-6 shadow-2xl relative border-t border-slate-100"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Choose Post Type</h3>
                  <p className="text-xs text-slate-500 font-semibold">Publish to the South African marketplace</p>
                </div>
                <button
                  onClick={() => setIsPostSheetOpen(false)}
                  className="p-1 bg-slate-100 rounded-full"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4">
                <button
                  onClick={() => handleOpenPostType('service')}
                  className="p-4 bg-brand-light/40 hover:bg-brand-light/60 border border-brand/20 rounded-2xl text-left space-y-2 flex flex-col justify-between"
                >
                  <div className="p-2.5 bg-brand text-white rounded-xl w-10 h-10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">List a Service</span>
                    <span className="text-[10px] text-slate-500 font-semibold leading-tight block">Promote your manual skills, tuition, or properties</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenPostType('product')}
                  className="p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-2xl text-left space-y-2 flex flex-col justify-between"
                >
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl w-10 h-10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">Sell Product</span>
                    <span className="text-[10px] text-slate-500 font-semibold leading-tight block">Sell crafts, curing biltong, custom food, fashion</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* MODAL SYSTEM COMPONENT POPUPS */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <PostServiceModal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isProductModalOpen && (
          <PostProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
