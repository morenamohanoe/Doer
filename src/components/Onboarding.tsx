import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Shield, Briefcase, User, Star, Plus, X } from 'lucide-react';

const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80';

export default function Onboarding() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fields focused on marketplace and professional details
  const [fields, setFields] = useState({
    // Step 1: Professional Details
    occupation: '',
    yearsOfExperience: '',
    education: '',
    bio: '',
    skills: '',
    languages: 'English',

    // Step 2: Marketplace & Media
    categories: '',
    servicesOffered: '',
    hourlyRate: '',
    coverImageUrl: '',
    portfolioImages: [] as string[],
    portfolioVideos: '',
    projectLinks: '',

    // Step 3: Verification details
    idType: 'South African Smart ID',
    idNumber: '',
    poaType: 'Municipal Utility Bill',
    poaIssuer: '',
  });

  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const [isProcessingPortfolio, setIsProcessingPortfolio] = useState(false);

  // Populate state from current user / profile once loaded
  useEffect(() => {
    if (profile) {
      setFields(prev => ({
        ...prev,
        coverImageUrl: profile.coverImageUrl || '',
        occupation: profile.occupation || '',
        yearsOfExperience: profile.yearsOfExperience?.toString() || '',
        education: profile.education || '',
        bio: profile.bio || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
        languages: Array.isArray(profile.languages) ? profile.languages.join(', ') : (profile.languages || 'English'),
        categories: Array.isArray(profile.categories) ? profile.categories.join(', ') : (profile.categories || ''),
        servicesOffered: Array.isArray(profile.servicesOffered) ? profile.servicesOffered.join(', ') : (profile.servicesOffered || ''),
        hourlyRate: profile.hourlyRate?.toString() || '',
        portfolioImages: Array.isArray(profile.portfolioImages) ? profile.portfolioImages : [],
        portfolioVideos: Array.isArray(profile.portfolioVideos) ? profile.portfolioVideos.join(', ') : '',
        projectLinks: Array.isArray(profile.projectLinks) ? profile.projectLinks.join(', ') : '',
      }));
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const isValidUrl = (url: string) => {
    if (!url) return false;
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/');
  };

  const getActiveProfilePreview = () => {
    return profile?.avatarUrl || DEFAULT_AVATAR_URL;
  };

  const validateStep1 = () => {
    if (!fields.occupation.trim() || !fields.yearsOfExperience.trim() || !fields.education.trim() || !fields.bio.trim() || !fields.skills.trim() || !fields.languages.trim()) {
      setErrorMsg('Please fill in all professional background fields.');
      return false;
    }
    if (isNaN(Number(fields.yearsOfExperience)) || Number(fields.yearsOfExperience) < 0) {
      setErrorMsg('Years of Experience must be a valid number.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const validateStep2 = () => {
    if (!fields.categories.trim() || !fields.servicesOffered.trim() || !fields.hourlyRate.trim()) {
      setErrorMsg('Please set up your service offerings and hourly rate.');
      return false;
    }
    if (isNaN(Number(fields.hourlyRate)) || Number(fields.hourlyRate) <= 0) {
      setErrorMsg('Hourly Rate must be a valid positive number.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const validateStep3 = () => {
    if (!fields.idNumber.trim()) {
      setErrorMsg('Please enter your South African ID Number or Passport details.');
      return false;
    }
    if (fields.idNumber.trim().length < 8) {
      setErrorMsg('ID / Passport reference must be at least 8 digits/characters.');
      return false;
    }
    if (!fields.poaIssuer.trim()) {
      setErrorMsg('Please specify the Proof of Address document issuer.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateStep3()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const skillsArray = fields.skills.split(',').map(s => s.trim()).filter(s => s !== '');
      const languagesArray = fields.languages.split(',').map(l => l.trim()).filter(l => l !== '');
      const categoriesArray = fields.categories.split(',').map(c => c.trim()).filter(c => c !== '');
      const servicesArray = fields.servicesOffered.split(',').map(s => s.trim()).filter(s => s !== '');

      const portfolioImagesArray = fields.portfolioImages.filter(url => isValidUrl(url));
      const portfolioVideosArray = fields.portfolioVideos.split(',').map(url => url.trim()).filter(url => isValidUrl(url));
      const projectLinksArray = fields.projectLinks.split(',').map(url => url.trim()).filter(url => isValidUrl(url));

      const rawDoerPayload: Record<string, any> = {
        userId: user.uid,
        bio: fields.bio.trim(),
        occupation: fields.occupation.trim(),
        yearsOfExperience: Number(fields.yearsOfExperience),
        education: fields.education.trim(),
        skills: skillsArray,
        languages: languagesArray,
        categories: categoriesArray,
        servicesOffered: servicesArray,
        hourlyRate: Number(fields.hourlyRate),
        isActive: true,
        updatedAt: new Date().toISOString(),
        
        avatarUrl: profile?.avatarUrl || DEFAULT_AVATAR_URL,
        coverImageUrl: fields.coverImageUrl.trim(),
        portfolioImages: portfolioImagesArray,
        portfolioVideos: portfolioVideosArray,
        projectLinks: projectLinksArray,
      };

      const rawUserPayload = {
        profileCompleted: true,
        onboardingCompleted: true,
        avatarUrl: profile?.avatarUrl || DEFAULT_AVATAR_URL,
        updatedAt: new Date().toISOString()
      };

      const rawVerificationPayload = {
        uid: user.uid,
        governmentId: fields.idNumber.trim(),
        idType: fields.idType,
        poaType: fields.poaType,
        poaIssuer: fields.poaIssuer.trim(),
        backgroundCheckStatus: 'pending',
        updatedAt: new Date().toISOString()
      };

      // Perform updates
      await updateDoc(doc(db, 'users', user.uid), rawUserPayload);
      await setDoc(doc(db, 'doer_profiles', user.uid), rawDoerPayload, { merge: true });
      await setDoc(doc(db, 'user_verifications', user.uid), rawVerificationPayload, { merge: true });

      window.location.reload();
    } catch (err: any) {
      console.error('Error saving onboarding info:', err);
      setErrorMsg(err.message || 'Failed to complete profile onboarding.');
      setLoading(false);
    }
  };

  const handleSkipOnboarding = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rawUserPayload = {
        profileCompleted: true,
        onboardingCompleted: true,
        avatarUrl: profile?.avatarUrl || DEFAULT_AVATAR_URL,
        updatedAt: new Date().toISOString()
      };

      const rawDoerPayload = {
        userId: user.uid,
        bio: 'Welcome to my DOER profile! I am ready to offer my skills and services to the community.',
        occupation: 'Service Provider',
        yearsOfExperience: 1,
        education: 'Secondary Education',
        skills: ['General Service'],
        languages: ['English'],
        categories: ['General Help'],
        servicesOffered: ['General Assistance'],
        hourlyRate: 150,
        isActive: true,
        updatedAt: new Date().toISOString(),
        avatarUrl: profile?.avatarUrl || DEFAULT_AVATAR_URL,
        coverImageUrl: '',
        portfolioImages: [],
        portfolioVideos: [],
        projectLinks: [],
      };

      const rawVerificationPayload = {
        uid: user.uid,
        governmentId: 'Pending Verification',
        idType: 'South African Smart ID',
        poaType: 'Municipal Utility Bill',
        poaIssuer: 'Pending',
        backgroundCheckStatus: 'pending',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), rawUserPayload);
      await setDoc(doc(db, 'doer_profiles', user.uid), rawDoerPayload, { merge: true });
      await setDoc(doc(db, 'user_verifications', user.uid), rawVerificationPayload, { merge: true });

      window.location.reload();
    } catch (err: any) {
      console.error('Error skipping onboarding:', err);
      setErrorMsg(err.message || 'Failed to skip onboarding.');
      setLoading(false);
    }
  };

  const renderStepIcon = (s: number) => {
    switch (s) {
      case 1: return <Briefcase className="w-5 h-5" />;
      case 2: return <Star className="w-5 h-5" />;
      case 3: return <Shield className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden" id="onboarding-root">
      
      {/* Header and Step tracker */}
      <div className="px-6 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm z-10 flex flex-col">
        <div className="flex items-center justify-between mb-4 select-none">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-9" />}
          <div className="text-sm font-bold text-slate-400">Step {step} of 3</div>
          <button 
            onClick={handleSkipOnboarding}
            disabled={loading}
            className="text-[10px] font-black text-slate-500 hover:text-zinc-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-all cursor-pointer uppercase tracking-wider"
          >
            {loading ? 'Skipping...' : 'Skip Setup'}
          </button>
        </div>
        
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= s ? 'bg-zinc-900 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : renderStepIcon(s)}
              </div>
              <div className={`h-1 w-full rounded-full ${step >= s ? 'bg-zinc-900' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-black text-slate-900 mt-6 text-center">
          {step === 1 && 'Professional Profile'}
          {step === 2 && 'Marketplace & Portfolio'}
          {step === 3 && 'Trust & Verification'}
        </h2>
        <p className="text-slate-500 text-xs font-semibold mt-1 text-center">
          {step === 1 && 'Showcase your skills, education, and professional background.'}
          {step === 2 && 'Define your rates, categories, and showcase your visual work.'}
          {step === 3 && 'Verify your identity securely to build trust in the community.'}
        </p>
      </div>

      {/* Main Form Fields wrapper */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {errorMsg && (
          <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Professional Details */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl mb-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Account Review</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-zinc-900">{profile?.firstName} {profile?.lastName}</span>
                <span className="text-[9px] font-bold text-zinc-400 bg-white border border-zinc-100 px-2 py-0.5 rounded-full">Verified Identity</span>
              </div>
            </div>

            <InputField label="Occupation / Job Title *" name="occupation" value={fields.occupation} onChange={handleChange} placeholder="e.g. Master Plumber, Graphic Designer" />
            
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Years of Experience *" name="yearsOfExperience" type="number" value={fields.yearsOfExperience} onChange={handleChange} placeholder="e.g. 5" />
              <InputField label="Highest Education *" name="education" value={fields.education} onChange={handleChange} placeholder="e.g. National Diploma, Matric" />
            </div>

            <InputField label="Languages (comma separated) *" name="languages" value={fields.languages} onChange={handleChange} placeholder="English, Zulu, Xhosa" />

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Skills (comma separated) *</label>
              <textarea name="skills" rows={3} value={fields.skills} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-zinc-900" placeholder="e.g. Plumbing, Drainage, Pipe repair" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bio / About Me *</label>
              <textarea name="bio" rows={4} value={fields.bio} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-zinc-900" placeholder="Write a brief professional description..." />
            </div>
          </motion.div>
        )}

        {/* STEP 2: Marketplace & Portfolio */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <InputField label="Service Category *" name="categories" value={fields.categories} onChange={handleChange} placeholder="e.g. Home Repairs" />
               <InputField label="Hourly Rate (ZAR) *" name="hourlyRate" type="number" value={fields.hourlyRate} onChange={handleChange} placeholder="e.g. 350" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detailed Services Offered *</label>
              <textarea name="servicesOffered" rows={3} value={fields.servicesOffered} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-zinc-900" placeholder="e.g. Leak Detection, Geyser Installation" />
            </div>

            {/* Marketplace & Portfolio Section */}
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Visual Identity & Media
              </h3>
              
              <div className="space-y-4">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cover Image URL (Optional)</span>
                  <input
                    type="text"
                    name="coverImageUrl"
                    placeholder="https://... cover link"
                    value={fields.coverImageUrl || ""}
                    onChange={(e) => setFields({ ...fields, coverImageUrl: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-zinc-900"
                  />
                  <p className="text-[8px] text-slate-400 italic mt-1 font-bold">Recommended size: 1200 x 400px</p>
                </div>
                {/* Profile Avatar Display (Read-only since it was uploaded in registration) */}
                <div className="flex items-center gap-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm bg-white shrink-0">
                    <img src={getActiveProfilePreview()} className="w-full h-full object-cover" alt="Avatar" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Profile Avatar</p>
                    <p className="text-xs font-bold text-zinc-900 leading-tight">Collected during registration</p>
                  </div>
                </div>
              </div>

            <div className="space-y-3 pt-2 border-t border-slate-50">
                <div className="space-y-2">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Portfolio Gallery URLs</span>
                  <p className="text-[8px] text-slate-400 font-bold mb-2">Paste image URLs separated by commas</p>
                  <textarea
                    name="portfolioImages"
                    rows={2}
                    value={fields.portfolioImages ? fields.portfolioImages.join(', ') : ''}
                    onChange={(e) => setFields({ ...fields, portfolioImages: e.target.value.split(',').map(u => u.trim()).filter(Boolean) })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-zinc-900"
                    placeholder="https://img1.jpg, https://img2.jpg..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Portfolio Video URLs (comma separated)</label>
                  <textarea name="portfolioVideos" rows={2} value={fields.portfolioVideos} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-zinc-900" placeholder="Paste YouTube/Vimeo URLs..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project / Demo / GitHub URLs</label>
                  <textarea name="projectLinks" rows={2} value={fields.projectLinks} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-zinc-900" placeholder="Paste links to your work..." />
                </div>
              </div>
          </motion.div>
        )}

        {/* STEP 3: Trust & Verification */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold leading-relaxed shadow-sm">
              🛡️ VERIFIED BADGE STATUS: Enter your identity details below. No file or document uploads are required for this release, keeping your onboarding secure and lightning-fast!
            </div>

            {/* Government ID Information */}
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-zinc-900" /> Identity Verification Details
              </h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Document Type *</label>
                <select name="idType" value={fields.idType} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-zinc-900">
                  <option value="South African Smart ID">South African Smart ID</option>
                  <option value="South African Green ID Book">South African Green ID Book</option>
                  <option value="Passport">Passport / Refugee Permit</option>
                </select>
              </div>

              <InputField label="ID / Document Number *" name="idNumber" value={fields.idNumber} onChange={handleChange} placeholder="e.g. 13-digit National ID or Passport Number" />
            </div>

            {/* Proof of Address Information */}
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-900" /> Proof of Address Information
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address Document Type *</label>
                <select name="poaType" value={fields.poaType} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-zinc-900">
                  <option value="Municipal Utility Bill">Municipal Utility Bill (Water/Lights)</option>
                  <option value="Bank Statement">Recent Bank Statement</option>
                  <option value="Cell Phone / Retail Account">Retail Store / Cell Phone Account</option>
                  <option value="Lease Agreement">Signed Rental Lease Agreement</option>
                  <option value="Tribal Authority Letter">Letter from Tribal Authority</option>
                </select>
              </div>

              <InputField label="Document Issuer Name *" name="poaIssuer" value={fields.poaIssuer} onChange={handleChange} placeholder="e.g. City of Johannesburg, FNB, Eskom, MTN" />
            </div>

          </motion.div>
        )}
      </div>

      {/* Persistent Bottom buttons */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-slate-100 shadow-lg z-10">
        <button
          onClick={step === 3 ? handleSubmit : handleNext}
          disabled={loading}
          className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-zinc-800 transition-all disabled:opacity-75 flex items-center justify-center gap-2"
        >
          {loading ? 'Finalizing Profile...' : (step === 3 ? 'Complete Setup' : 'Continue')}
          {!loading && step < 3 && <ArrowRight className="w-4 h-4" />}
          {!loading && step === 3 && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
}

function InputField({ label, ...props }: any) {
  return (
    <div className="space-y-1 w-full">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <input 
        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 transition-all" 
        {...props} 
      />
    </div>
  );
}
