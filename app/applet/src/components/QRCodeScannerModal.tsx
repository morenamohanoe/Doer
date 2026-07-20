import React from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (profileId: string) => void;
}

export default function QRCodeScannerModal({ isOpen, onClose, onScanSuccess }: QRCodeScannerModalProps) {
  const { triggerSound, showToast, roleProfiles } = useApp();

  const saveToHistory = (profileId: string) => {
    try {
      const historyStr = localStorage.getItem('scan_history');
      let history = historyStr ? JSON.parse(historyStr) : [];
      
      const profile = roleProfiles.find(p => p.id === profileId || p.userId === profileId);
      const name = profile ? profile.displayName : 'Unknown Provider';

      history = history.filter((item: any) => item.id !== profileId);
      
      history.unshift({
        id: profileId,
        name: name,
        timestamp: Date.now()
      });

      history = history.slice(0, 20);
      
      localStorage.setItem('scan_history', JSON.stringify(history));
    } catch (err) {
      console.error('Error saving scan history:', err);
    }
  };

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const url = result[0].rawValue;
      const profilePathMatch = url.match(/\/profile\/([a-zA-Z0-9_-]+)/);
      if (profilePathMatch && profilePathMatch[1]) {
        const profileId = profilePathMatch[1];
        triggerSound('success');
        saveToHistory(profileId);
        onScanSuccess(profileId);
        onClose();
      } else {
        showToast('Invalid profile QR code', 'error');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm pointer-events-auto shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <QrCode className="w-4 h-4 text-brand" /> Scan QR
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex flex-col items-center">
                <div className="text-center mb-4">
                  <h3 className="font-extrabold text-slate-800 text-lg mb-1">Scan Profile QR</h3>
                  <p className="text-xs text-slate-500 font-semibold">Align the QR code within the frame to view their profile.</p>
                </div>

                <div className="w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative">
                  <Scanner 
                    onScan={handleScan}
                    onError={(error) => console.error(error)}
                    components={{
                      audio: false,
                      finder: false
                    }}
                  />
                  
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-48 h-48 border-2 border-brand/50 rounded-2xl relative overflow-hidden shadow-[0_0_0_1000px_rgba(0,0,0,0.3)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand rounded-br-lg" />
                      
                      <motion.div 
                        className="absolute left-0 right-0 h-1 bg-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.8)] z-10"
                        animate={{ 
                          top: ["10%", "90%", "10%"] 
                        }}
                        transition={{ 
                          duration: 2.5, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Scanner Active
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
