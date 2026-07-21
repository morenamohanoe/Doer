import React from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { logError } from '../lib/logger';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (profileId: string) => void;
  onRawScanSuccess?: (rawValue: string) => void;
}

export default function QRCodeScannerModal({ isOpen, onClose, onScanSuccess, onRawScanSuccess }: QRCodeScannerModalProps) {
  const { triggerSound, showToast } = useApp();

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const url = result[0].rawValue;
      if (onRawScanSuccess) {
        triggerSound('success');
        onRawScanSuccess(url);
        onClose();
        return;
      }
      // Extract profileId from URL: e.g. window.location.origin + /profile/1234
      const profilePathMatch = url.match(/\/profile\/([a-zA-Z0-9_-]+)/);
      if (profilePathMatch && profilePathMatch[1]) {
        triggerSound('success');
        if (onScanSuccess) {
          onScanSuccess(profilePathMatch[1]);
        }
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

                <div className="w-full bg-slate-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  <Scanner 
                    onScan={handleScan}
                    onError={(error) => logError(error)}
                    components={{
                      audio: false,
                      finder: true
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
