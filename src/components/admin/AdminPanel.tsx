import { motion } from "motion/react";
import React from 'react';
import { Shield } from 'lucide-react';
import GlobalSystemCutSettings from './GlobalSystemCutSettings';

export default function AdminPanel() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand text-zinc-900 rounded-xl">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Console</h1>
      </div>

      <GlobalSystemCutSettings />

      <div className="grid grid-cols-1 gap-4 mt-6">
        {['Reports', 'Verification Requests', 'Escrow Management'].map(section => (
          <motion.div
            key={section}
            className="geom-card p-4 hover:shadow-lg transition-all duration-300"
            whileHover={{
              scale: 1.02
            }}>
            <h3 className="font-bold text-slate-800">{section}</h3>
            <p className="text-xs text-slate-500">Manage {section.toLowerCase()}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
