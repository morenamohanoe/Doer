import React, { useState } from 'react';
import { motion } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Upload, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80';

interface RegisterFormProps {
  onBack: () => void;
}

export default function RegisterForm({ onBack }: RegisterFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phoneNumber: '',
    country: 'South Africa',
    province: '',
    city: '',
    gender: '',
    physicalAddress: '',
    postalCode: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    privacyPolicyAccepted: false,
  });

  const [customProfileUrl, setCustomProfileUrl] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomProfileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getActiveProfilePreview = () => {
    return customProfileUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return false;
    }
    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.dateOfBirth || !formData.phoneNumber || !formData.gender || !formData.province || !formData.city || !formData.physicalAddress || !formData.postalCode) {
      setErrorMsg('Please fill in all address and contact details.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted || !formData.privacyPolicyAccepted) {
      setErrorMsg('You must accept the Terms and Privacy Policy.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const avatarUrl = customProfileUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80';

      // 1. Create auth user
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCred.user;

      // 2. Build clean payload omitting empty properties (anti-placeholder, anti-empty data)
      const rawUserPayload: Record<string, any> = {
        uid: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        country: formData.country,
        province: formData.province,
        city: formData.city,
        physicalAddress: formData.physicalAddress,
        postalCode: formData.postalCode,
        avatarUrl,
        termsAccepted: formData.termsAccepted,
        privacyPolicyAccepted: formData.privacyPolicyAccepted,
        verificationStatus: 'unverified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileCompleted: false // Onboarding needed
      };

      const cleanUserPayload: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawUserPayload)) {
        if (value === undefined || value === null || value === '' || value === 'User') continue;
        cleanUserPayload[key] = value;
      }

      // 3. Save to Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          await setDoc(userDocRef, cleanUserPayload, { merge: true });
        } else {
          await setDoc(userDocRef, cleanUserPayload);
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        throw err;
      }
      
    } catch (error: any) {
      console.warn(error);
      setErrorMsg(error.message || 'An error occurred during registration.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button 
        onClick={step === 1 ? onBack : () => setStep(step - 1)}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-brand' : 'bg-slate-200'}`} />
        ))}
      </div>

      <h2 className="text-2xl font-black text-slate-900 mb-2">Create Account</h2>
      <p className="text-slate-500 text-sm font-medium mb-6">Step {step} of 3</p>

      {errorMsg && (
        <div className="w-full p-3 mb-6 bg-red-100 text-red-700 text-sm rounded-lg font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4 text-left">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">First Name *</label>
                <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Last Name *</label>
                <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Middle Name</label>
              <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email Address *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Password *</label>
              <div className="relative w-full">
                <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Confirm Password *</label>
              <div className="relative w-full">
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand pr-10" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Date of Birth *</label>
              <input type="date" name="dateOfBirth" required value={formData.dateOfBirth} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Phone Number *</label>
              <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Gender *</label>
              <select name="gender" required value={formData.gender} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Country *</label>
              <input type="text" name="country" required value={formData.country} readOnly className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Province *</label>
                <select name="province" required value={formData.province} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">Select...</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="North West">North West</option>
                  <option value="Northern Cape">Northern Cape</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">City *</label>
                <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Physical Address *</label>
              <input type="text" name="physicalAddress" required value={formData.physicalAddress} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Postal Code *</label>
              <input type="text" name="postalCode" required value={formData.postalCode} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            
             <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center space-y-4">
              <label className="block text-[10px] font-bold uppercase text-slate-500 text-center tracking-wider">
                Your Account Profile Image
              </label>
              
              {/* Live Preview */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-brand shadow-md">
                <img src={getActiveProfilePreview()} alt="Profile Preview" className="w-full h-full object-cover" />
              </div>

              {/* Avatar Upload */}
              <div className="w-full">
                <label className="block w-full cursor-pointer bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors rounded-xl p-3 text-center">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Upload Profile Image</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">Click to select an image file</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-1 w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand" />
                <span className="text-sm font-medium text-slate-700">I accept the DOER <span className="text-brand">Terms of Service</span>.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="privacyPolicyAccepted" checked={formData.privacyPolicyAccepted} onChange={handleChange} className="mt-1 w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand" />
                <span className="text-sm font-medium text-slate-700">I accept the DOER <span className="text-brand">Privacy Policy</span>.</span>
              </label>
            </div>

          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-6 bg-zinc-900 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-zinc-800 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? 'Creating Account...' : (step === 3 ? 'Complete Registration' : 'Next Step')}
          {step < 3 && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

function UserIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
