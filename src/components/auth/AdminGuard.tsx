import React from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { motion } from 'motion/react';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <div>Loading...</div>;

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full p-6 text-center"
      >
        <h2 className="text-xl font-black text-slate-900 mb-2">Administrator access required.</h2>
        <p className="text-sm text-slate-500 mb-6">You do not have permission to view this page.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-brand text-zinc-900 px-6 py-3 rounded-2xl font-black text-sm"
        >
          Return To Marketplace
        </button>
      </motion.div>
    );
  }

  return <>{children}</>;
};
