import React from 'react';
import { useRole } from '../../context/AuthContext';
import { Shield, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'doer')[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">
          Verifying Access Permissions...
        </p>
      </div>
    );
  }

  const isAllowed = allowedRoles.includes(role as 'admin' | 'doer');

  if (!isAllowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] bg-slate-50/50 rounded-2xl border border-slate-100 max-w-md mx-auto my-12 shadow-sm"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-rose-100 rounded-full blur-xl opacity-50 scale-150 animate-pulse" />
          <div className="relative w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100 shadow-sm">
            <Shield className="w-8 h-8 text-rose-500" />
            <Lock className="w-3.5 h-3.5 text-rose-600 absolute bottom-3 right-3 bg-white rounded-full p-0.5 shadow-sm" />
          </div>
        </div>

        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">
          Access Restricted
        </h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6">
          This area is designated for <strong>{allowedRoles.join(' or ')}</strong> accounts only. Your current role is <strong>{role || 'unknown'}</strong>.
        </p>

        <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md uppercase tracking-widest">
          SECURITY_POLICY_VIOLATION_ERR
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
