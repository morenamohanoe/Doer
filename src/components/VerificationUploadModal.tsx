import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle, 
  ShieldCheck, 
  Building2, 
  GraduationCap,
  Trash2
} from 'lucide-react';

interface VerificationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'identity' | 'business' | 'credentials';
  onSubmit: (data: any) => void;
}

export default function VerificationUploadModal({
  isOpen,
  onClose,
  type,
  onSubmit
}: VerificationUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identity state
  const [idNumber, setIdNumber] = useState('');
  const [frontFile, setFrontFile] = useState<string | null>(null);
  const [frontName, setFrontName] = useState('');
  const [backFile, setBackFile] = useState<string | null>(null);
  const [backName, setBackName] = useState('');
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const [selfieName, setSelfieName] = useState('');

  // Business state
  const [bizRegNumber, setBizRegNumber] = useState('');
  const [cipcFile, setCipcFile] = useState<string | null>(null);
  const [cipcName, setCipcName] = useState('');

  // Credentials state
  const [credName, setCredName] = useState('');
  const [credIssuer, setCredIssuer] = useState('');
  const [credNumber, setCredNumber] = useState('');
  const [credFile, setCredFile] = useState<string | null>(null);
  const [credFileName, setCredFileName] = useState('');

  // Drag over states
  const [dragOverFront, setDragOverFront] = useState(false);
  const [dragOverBack, setDragOverBack] = useState(false);
  const [dragOverSelfie, setDragOverSelfie] = useState(false);
  const [dragOverCipc, setDragOverCipc] = useState(false);
  const [dragOverCred, setDragOverCred] = useState(false);

  if (!isOpen) return null;

  // File to base64 helper
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
    nameSetter: (val: string) => void,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf']
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Only ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} files are allowed.`);
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('File size exceeds the 4MB limit.');
      return;
    }

    setError(null);
    nameSetter(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent, setDragState: (val: boolean) => void) => {
    e.preventDefault();
    setDragState(true);
  };

  const handleDragLeave = (setDragState: (val: boolean) => void) => {
    setDragState(false);
  };

  const handleDrop = (
    e: React.DragEvent,
    setter: (val: string | null) => void,
    nameSetter: (val: string) => void,
    setDragState: (val: boolean) => void,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf']
  ) => {
    e.preventDefault();
    setDragState(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Only ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} files are allowed.`);
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('File size exceeds the 4MB limit.');
      return;
    }

    setError(null);
    nameSetter(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'identity') {
        if (!frontFile || !backFile || !selfieFile) {
          setError('Please upload all required files (Front ID, Back ID, and Selfie).');
          setLoading(false);
          return;
        }
        if (!idNumber.trim()) {
          setError('Please provide your South African ID or Passport number.');
          setLoading(false);
          return;
        }
        onSubmit({
          idNumber: idNumber.trim(),
          frontUrl: frontFile,
          backUrl: backFile,
          selfieUrl: selfieFile,
          frontName,
          backName,
          selfieName
        });
      } else if (type === 'business') {
        if (!cipcFile) {
          setError('Please upload your CIPC Registration Certificate PDF.');
          setLoading(false);
          return;
        }
        onSubmit({
          bizRegNumber: bizRegNumber.trim(),
          cipcUrl: cipcFile,
          cipcName
        });
      } else if (type === 'credentials') {
        if (!credName.trim() || !credIssuer.trim()) {
          setError('Please enter the Qualification Name and Issuing Authority.');
          setLoading(false);
          return;
        }
        if (!credFile) {
          setError('Please upload your certificate / proof file.');
          setLoading(false);
          return;
        }
        onSubmit({
          credName: credName.trim(),
          credIssuer: credIssuer.trim(),
          credNumber: credNumber.trim() || 'N/A',
          credFileUrl: credFile,
          credFileName
        });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'identity':
        return 'SA Smart ID Card Verification';
      case 'business':
        return 'CIPC Business Registration';
      case 'credentials':
        return 'Trade Credentials & Certifications';
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case 'identity':
        return 'Front photo, back photo, and matching selfie verification';
      case 'business':
        return 'CIPC certificate validation for enterprise verified status';
      case 'credentials':
        return 'Submit qualification certificates for manual admin verification';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'identity':
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 'business':
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'credentials':
        return <GraduationCap className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
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
          className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] text-left z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                {getIcon()}
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">{getTitle()}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {getSubtitle()}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* IDENTITY SPECIFIC FIELDS */}
            {type === 'identity' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    South African ID / Passport Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9507115088083"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand transition-all"
                  />
                </div>

                {/* 3 Upload slots: Front, Back, Selfie */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Front ID */}
                  <div className="space-y-1">
                    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">ID Front Photo</span>
                    {frontFile ? (
                      <div className="relative h-24 border border-slate-200 rounded-xl overflow-hidden group">
                        <img src={frontFile} className="w-full h-full object-cover" alt="ID Front Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setFrontFile(null); setFrontName(''); }}
                            className="p-1.5 bg-rose-600 rounded-full text-white hover:bg-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => handleDragOver(e, setDragOverFront)}
                        onDragLeave={() => handleDragLeave(setDragOverFront)}
                        onDrop={(e) => handleDrop(e, setFrontFile, setFrontName, setDragOverFront, ['image/jpeg', 'image/png'])}
                        className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer relative ${
                          dragOverFront ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/50'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setFrontFile, setFrontName, ['image/jpeg', 'image/png'])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[8px] font-black uppercase text-slate-400">Front ID Image</span>
                        <span className="text-[7px] text-slate-400 font-medium">Drag or Browse</span>
                      </div>
                    )}
                  </div>

                  {/* Back ID */}
                  <div className="space-y-1">
                    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">ID Back Photo</span>
                    {backFile ? (
                      <div className="relative h-24 border border-slate-200 rounded-xl overflow-hidden group">
                        <img src={backFile} className="w-full h-full object-cover" alt="ID Back Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setBackFile(null); setBackName(''); }}
                            className="p-1.5 bg-rose-600 rounded-full text-white hover:bg-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => handleDragOver(e, setDragOverBack)}
                        onDragLeave={() => handleDragLeave(setDragOverBack)}
                        onDrop={(e) => handleDrop(e, setBackFile, setBackName, setDragOverBack, ['image/jpeg', 'image/png'])}
                        className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer relative ${
                          dragOverBack ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/50'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setBackFile, setBackName, ['image/jpeg', 'image/png'])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[8px] font-black uppercase text-slate-400">Back ID Image</span>
                        <span className="text-[7px] text-slate-400 font-medium">Drag or Browse</span>
                      </div>
                    )}
                  </div>

                  {/* Selfie */}
                  <div className="space-y-1">
                    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Selfie (Verification)</span>
                    {selfieFile ? (
                      <div className="relative h-24 border border-slate-200 rounded-xl overflow-hidden group">
                        <img src={selfieFile} className="w-full h-full object-cover" alt="Selfie Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setSelfieFile(null); setSelfieName(''); }}
                            className="p-1.5 bg-rose-600 rounded-full text-white hover:bg-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => handleDragOver(e, setDragOverSelfie)}
                        onDragLeave={() => handleDragLeave(setDragOverSelfie)}
                        onDrop={(e) => handleDrop(e, setSelfieFile, setSelfieName, setDragOverSelfie, ['image/jpeg', 'image/png'])}
                        className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer relative ${
                          dragOverSelfie ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/50'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setSelfieFile, setSelfieName, ['image/jpeg', 'image/png'])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[8px] font-black uppercase text-slate-400">Match Selfie</span>
                        <span className="text-[7px] text-slate-400 font-medium">Drag or Browse</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BUSINESS SPECIFIC FIELDS */}
            {type === 'business' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    CIPC Registration Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2021 / 123456 / 07"
                    value={bizRegNumber}
                    onChange={(e) => setBizRegNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">CIPC Certificate Document</span>
                  {cipcFile ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-emerald-600" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px]">{cipcName}</span>
                          <span className="text-[9px] text-slate-400 font-semibold block">CIPC PDF Certificate</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCipcFile(null); setCipcName(''); }}
                        className="p-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-full transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => handleDragOver(e, setDragOverCipc)}
                      onDragLeave={() => handleDragLeave(setDragOverCipc)}
                      onDrop={(e) => handleDrop(e, setCipcFile, setCipcName, setDragOverCipc, ['application/pdf'])}
                      className={`h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer relative ${
                        dragOverCipc ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/50'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => handleFileChange(e, setCipcFile, setCipcName, ['application/pdf'])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <FileText className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700">Upload CIPC Registration Certificate</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">Supports PDF (Max 4MB)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CREDENTIALS SPECIFIC FIELDS */}
            {type === 'credentials' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Qualification / Certificate Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Carpentry Level 4"
                      value={credName}
                      onChange={(e) => setCredName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Issuing Authority / Board
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CETA, SAQA"
                      value={credIssuer}
                      onChange={(e) => setCredIssuer(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Certificate Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CERT-2024-5544"
                    value={credNumber}
                    onChange={(e) => setCredNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Certification Document File</span>
                  {credFile ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-emerald-600" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px]">{credFileName}</span>
                          <span className="text-[9px] text-slate-400 font-semibold block">Qualification Document File</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCredFile(null); setCredFileName(''); }}
                        className="p-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-full transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => handleDragOver(e, setDragOverCred)}
                      onDragLeave={() => handleDragLeave(setDragOverCred)}
                      onDrop={(e) => handleDrop(e, setCredFile, setCredFileName, setDragOverCred, ['image/jpeg', 'image/png', 'application/pdf'])}
                      className={`h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer relative ${
                        dragOverCred ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-brand/50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        onChange={(e) => handleFileChange(e, setCredFile, setCredFileName, ['image/jpeg', 'image/png', 'application/pdf'])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <FileText className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700">Upload Certificate File</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">Supports PDF or Image (Max 4MB)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-600 hover:bg-slate-150 rounded-xl text-xs font-black cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 bg-zinc-950 hover:bg-black text-white rounded-xl text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Upload & Submit'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
