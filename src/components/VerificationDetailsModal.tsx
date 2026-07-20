import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, CheckCircle2, Circle, Smartphone, Award, HelpCircle, Briefcase, FileCheck, Check } from 'lucide-react';
import { User } from '../types';

interface VerificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  isIdentitySubmitted: boolean;
  isIdentityApproved: boolean;
  isBusinessSubmitted: boolean;
  isBusinessApproved: boolean;
  onSubmitVerification: (type: 'identity' | 'business') => void;
}

export default function VerificationDetailsModal({
  isOpen,
  onClose,
  currentUser,
  isIdentitySubmitted,
  isIdentityApproved,
  isBusinessSubmitted,
  isBusinessApproved,
  onSubmitVerification
}: VerificationDetailsModalProps) {
  
  if (!isOpen) return null;

  // Compute current verification state
  const status = currentUser.verificationStatus || 'unverified';

  // Requirements matrix
  const tiers = [
    {
      id: 'phone_verified',
      title: 'Tier 1: Phone Verified',
      description: 'Verifies phone authenticity to restrict spam & automated accounts.',
      icon: Smartphone,
      status: currentUser.phoneNumber ? 'approved' : 'missing',
      requirement: 'Provide a valid South African phone number.',
      benefit: 'Basic listing active, message clients, standard trust score (50pts).'
    },
    {
      id: 'identity_verified',
      title: 'Tier 2: Identity Verified',
      description: 'Checks official South African government ID/passport database details.',
      icon: ShieldCheck,
      status: isIdentityApproved ? 'approved' : isIdentitySubmitted ? 'pending' : 'missing',
      requirement: 'Upload clear Smart ID Card or Passport photo.',
      benefit: 'High-trust badge, Priority match on premium jobs, +15 points to Trust Score.'
    },
    {
      id: 'business_verified',
      title: 'Tier 3: Business Verified',
      description: 'Verifies corporate legitimacy through CIPC certificates.',
      icon: Briefcase,
      status: isBusinessApproved ? 'approved' : isBusinessSubmitted ? 'pending' : 'missing',
      requirement: 'Provide South African CIPC registration and Tax ID proofs.',
      benefit: 'Premium corporate badge, instant financial cashouts, +5 additional points.'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] text-left z-10 select-none"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-light text-brand rounded-lg">
                <ShieldCheck className="w-5 h-5 fill-brand/10" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Provider Verification Standards</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  South African Artisan Compliance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 overflow-y-auto space-y-5 text-slate-600">
            {/* Overview Status Card */}
            <div className="p-4 bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-xl shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Your Badge Level</span>
                <span className="bg-brand text-white px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider animate-pulse">
                  {status === 'business_verified' ? 'Tier 3: Business' : status === 'identity_verified' ? 'Tier 2: ID Verified' : status === 'phone_verified' ? 'Tier 1: Phone' : 'Unverified'}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brand" /> {status === 'business_verified' ? 'Elite business merchant' : status === 'identity_verified' ? 'Trustworthy certified doer' : 'Basic member'}
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                  Increasing your verification status boosts your profile rank in customer searches and secures faster withdrawal clearances.
                </p>
              </div>
            </div>

            {/* Verification Tiers Breakdown */}
            <div className="space-y-4">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                Verification Checklist & Requirements
              </span>

              <div className="space-y-3">
                {tiers.map((tier) => {
                  const TierIcon = tier.icon;
                  return (
                    <div
                      key={tier.id}
                      className={`p-3.5 border rounded-xl flex items-start gap-3 transition-colors ${
                        tier.status === 'approved'
                          ? 'border-emerald-100 bg-emerald-50/20'
                          : tier.status === 'pending'
                          ? 'border-amber-100 bg-amber-50/20'
                          : 'border-slate-100 bg-slate-50/40'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        tier.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-600'
                          : tier.status === 'pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <TierIcon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <h5 className="font-black text-slate-800 text-xs">{tier.title}</h5>
                          {tier.status === 'approved' ? (
                            <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Complete
                            </span>
                          ) : tier.status === 'pending' ? (
                            <span className="text-[9px] font-black text-amber-600 uppercase animate-pulse">
                              Pending Review
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-slate-400 uppercase">
                              Incomplete
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 font-medium leading-normal">
                          {tier.description}
                        </p>

                        <div className="pt-1.5 text-[9px] space-y-1">
                          <div>
                            <span className="text-slate-400 font-extrabold uppercase">Requires: </span>
                            <span className="text-slate-600 font-semibold">{tier.requirement}</span>
                          </div>
                          <div>
                            <span className="text-brand font-extrabold uppercase">Unlocks: </span>
                            <span className="text-slate-600 font-semibold">{tier.benefit}</span>
                          </div>
                        </div>

                        {/* Interactive Verification Buttons inside modal */}
                        {tier.status === 'missing' && tier.id === 'identity_verified' && (
                          <button
                            onClick={() => onSubmitVerification('identity')}
                            className="mt-2.5 px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded-lg text-[9px] font-black transition-all cursor-pointer shadow-2xs"
                          >
                            Submit ID Verification
                          </button>
                        )}
                        {tier.status === 'missing' && tier.id === 'business_verified' && (
                          <button
                            onClick={() => onSubmitVerification('business')}
                            className="mt-2.5 px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded-lg text-[9px] font-black transition-all cursor-pointer shadow-2xs"
                          >
                            Submit Business Proof
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* South African Safety & Compliance Guidelines */}
            <div className="p-3 bg-indigo-50/40 border border-indigo-50 rounded-xl space-y-1.5">
              <h5 className="text-[10px] font-black text-indigo-950 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> South African Security & Compliance
              </h5>
              <p className="text-[9px] text-indigo-900/75 leading-relaxed font-semibold">
                DOER strictly complies with South African POPIA (Protection of Personal Information Act). All uploaded documents are fully encrypted and verified against government ID registry schemas. Your physical documents are never made public.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
            >
              Acknowledge Guidelines
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
