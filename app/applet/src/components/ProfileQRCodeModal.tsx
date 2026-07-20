import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Smartphone } from 'lucide-react';

interface ProfileQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

export default function ProfileQRCodeModal({ isOpen, onClose, profileId, profileName }: ProfileQRCodeModalProps) {
  const qrRef = useRef<SVGSVGElement>(null);
  
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
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileName}'s Profile`,
          text: `Check out ${profileName}'s professional profile!`,
          url: profileUrl,
        });
      } catch (err) {
        console.error('Error sharing', err);
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
                  <Smartphone className="w-4 h-4 text-brand" /> Profile Pass
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
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed px-4">
                    Scan to view profile and book services instantly. Perfect for face-to-face networking.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-center mb-8 relative">
                  <QRCodeSVG 
                    value={profileUrl} 
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#0f172a"
                    ref={qrRef}
                  />
                  {/* Decorative corners for the QR code container */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-brand/30 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-brand/30 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-brand/30 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-brand/30 rounded-br-lg" />
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={handleDownload}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Save to Gallery
                  </button>
                  
                  {navigator.share && (
                    <button 
                      onClick={handleShare}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Share2 className="w-4 h-4" /> Share Direct Link
                    </button>
                  )}
                </div>
                
                <p className="mt-6 text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-center italic">
                  Image will be saved as a high-quality PNG
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
