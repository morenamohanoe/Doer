import React from 'react';
import { motion } from 'motion/react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="text-4xl font-black tracking-tighter mb-4"
      >
        DOER <span className="text-brand font-black inline-block -ml-1">.</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xs font-bold text-zinc-500 uppercase tracking-widest"
      >
        Preparing your workspace...
      </motion.div>
    </div>
  );
}
