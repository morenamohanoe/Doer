import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2 } from 'lucide-react';
import { logError } from '../lib/logger';
import { useApp } from '../context/AppContext';
import { copyToClipboard } from './HomeFeed';

interface ProfileQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

export default function ProfileQRCodeModal({ isOpen, onClose, profileId, profileName }: ProfileQRCodeModalProps) {
  const qrRef = useRef<SVGSVGElement>(null);
  const { showToast } = useApp();
  
  // Generating a unique URL that would theoretically link to the user's profile
  const profileUrl = `${window.location.origin}/profile/${profileId}`;

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `doer_profile_${profileName.replace(/\s+/g, '_')}_qr.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const handleShare = async () => {
    const shareTitle = `${profileName}'s Profile`;
    const shareText = `Check out ${profileName}'s professional profile!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: profileUrl,
        });
      } catch (err: any) {
        logError('Error sharing', err);
        if (err.name !== 'AbortError') {
          const success = await copyToClipboard(`${shareTitle} - ${shareText}\n${profileUrl}`);
          if (success) {
            showToast('Link copied to clipboard!', 'success');
          } else {
            showToast('Failed to copy link.', 'error');
          }
        }
      }
    } else {
      const success = await copyToClipboard(`${shareTitle} - ${shareText}\n${profileUrl}`);
      if (success) {
        showToast('Link copied to clipboard!', 'success');
      } else {
        showToast('Failed to copy link.', 'error');
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
                  <Share2 className="w-4 h-4 text-brand" /> Share Profile
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center">
                <div className="text-center mb-6">
                  <h3 className="font-extrabold text-slate-800 text-lg mb-1">{profileName}</h3>
                  <p className="text-xs text-slate-500 font-semibold">Scan to view profile and book services instantly.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-center mb-6">
                  <QRCodeSVG 
                    value={profileUrl} 
                    size={220}
                    level="H"
                    includeMargin={true}
                    fgColor="#0f172a"
                    ref={qrRef}
                  />
                </div>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={handleDownload}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Save Image
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex-1 bg-brand hover:bg-brand-hover text-slate-900 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share Link
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
