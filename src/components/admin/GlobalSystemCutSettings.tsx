import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useApp } from '../../context/AppContext';
import { Save, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logError } from '../../lib/logger';

export default function GlobalSystemCutSettings() {
  const { withdrawalFeePercentage, serviceFee } = useApp();
  const [newFee, setNewFee] = useState(withdrawalFeePercentage);
  const [newServiceFee, setNewServiceFee] = useState(serviceFee);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNewFee(withdrawalFeePercentage);
    setNewServiceFee(serviceFee);
  }, [withdrawalFeePercentage, serviceFee]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalServiceFee = Number(newServiceFee);
      await setDoc(doc(db, 'platform_settings', 'general'), { 
        withdrawalFeePercentage: Number(newFee),
        serviceFee: finalServiceFee
      }, { merge: true });
      setIsEditing(false);
      setShowConfirm(false);
    } catch (e) {
      logError(e);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">Master Global Settings</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Control platform commission and service fee caps</p>
        </div>
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Withdrawal Commission</span>
              <p className="text-xl font-black text-slate-800 mt-1">{withdrawalFeePercentage}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fixed Service Fee</span>
              <p className="text-xl font-black text-slate-800 mt-1">R {serviceFee}</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setIsEditing(true)} 
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer active:scale-95"
            >
              Modify System Settings
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Withdrawal Commission (%)
              </label>
              <div className="relative flex items-center">
                <input 
                  type="number" 
                  value={newFee} 
                  onChange={e => setNewFee(Number(e.target.value))} 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-black text-slate-800 text-sm" 
                  placeholder="e.g. 5"
                />
                <span className="absolute right-4 font-black text-slate-400 text-sm">%</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Fixed Service Fee (ZAR)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-black text-slate-400 text-sm">R</span>
                <input 
                  type="number" 
                  value={newServiceFee} 
                  onChange={e => setNewServiceFee(Number(e.target.value))} 
                  className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-black text-slate-800 text-sm" 
                  placeholder="e.g. 150"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={() => {
                setNewFee(withdrawalFeePercentage);
                setNewServiceFee(serviceFee);
                setIsEditing(false);
              }} 
              className="text-slate-500 hover:text-slate-700 text-xs font-bold px-4 py-2"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={() => setShowConfirm(true)} 
              className="bg-brand text-zinc-900 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION MODAL WITH CURRENT VS PENDING COMPARISON --- */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Confirm Settings Update</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Critical system parameter alteration</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-5">
                You are about to modify the platform's core commission rates. Please explicitly validate the differences below:
              </p>

              {/* Comparison Matrix */}
              <div className="space-y-3 mb-6">
                {/* Withdrawal Fee Comparison */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Withdrawal Commission</span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs font-black text-slate-400">{withdrawalFeePercentage}%</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      <span className={`text-sm font-black ${newFee !== withdrawalFeePercentage ? 'text-amber-600' : 'text-slate-700'}`}>
                        {newFee}%
                      </span>
                    </div>
                  </div>
                  {newFee !== withdrawalFeePercentage && (
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase border border-amber-100">
                      Modified
                    </span>
                  )}
                </div>

                {/* Service Fee Comparison */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Platform Service Fee</span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs font-black text-slate-400">R {serviceFee}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      <span className={`text-sm font-black ${newServiceFee !== serviceFee ? 'text-amber-600' : 'text-slate-700'}`}>
                        R {newServiceFee}
                      </span>
                    </div>
                  </div>
                  {newServiceFee !== serviceFee && (
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase border border-amber-100">
                      Modified
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-rose-600/80 font-bold bg-rose-50/50 p-3 rounded-xl border border-rose-100/50 mb-6 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Warning: This will immediately affect all incoming bookings and withdrawal request calculations for all users on the platform.</span>
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowConfirm(false)} 
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSave} 
                  disabled={saving} 
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Applying...' : 'Apply Immediately'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
