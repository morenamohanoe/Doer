import React from 'react';
import { useApp } from '../context/AppContext';
import { WifiOff } from 'lucide-react';

export const ConnectivityBanner: React.FC = () => {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white p-2 text-center flex items-center justify-center gap-2">
      <WifiOff size={16} />
      <span className="text-sm font-medium">You are currently offline.</span>
    </div>
  );
};
