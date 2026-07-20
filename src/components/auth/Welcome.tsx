import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import RegisterForm from './RegisterForm';

export default function Welcome() {
  const [errorMsg, setErrorMsg] = useState('');
  const [view, setView] = useState<'main' | 'login' | 'register'>('main');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.warn('Error signing in with Google', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was blocked. Please open the app in a new tab.');
      } else {
        setErrorMsg('An error occurred during sign in. Please try again.');
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.warn('Error with email auth', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password.');
      } else {
        setErrorMsg(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-50 overflow-y-auto" id="welcome-root">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col items-center gap-6 w-full max-w-sm py-12"
        >
          {view === 'main' && (
            <>
              <motion.div
                className="bg-brand p-6 geom-card w-24 h-24 flex items-center justify-center shadow-lg shadow-brand/20 mt-12 hover:shadow-lg transition-all duration-300"
                whileHover={{
                  scale: 1.02
                }}>
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">Welcome to DOER</h1>
                <p className="text-slate-600 mt-3 text-sm font-medium">Professional profiles. Trusted connections.</p>
              </div>
              {errorMsg && (
                <div className="w-full p-3 bg-red-100 text-red-700 text-sm rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}
              <div className="w-full space-y-3 mt-4">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-4 bg-white border border-slate-200 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
                >
                  Continue with Google
                </button>
                <button
                  onClick={() => setView('login')}
                  className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-zinc-800 transition-all"
                >
                  Sign In with Email
                </button>
              </div>
              <button
                onClick={() => setView('register')}
                className="mt-6 text-sm font-bold text-brand hover:text-brand-hover transition-colors"
              >
                Need an account? Create one now
              </button>
            </>
          )}

          {view === 'login' && (
            <div className="w-full">
              <button 
                onClick={() => setView('main')}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              
              <motion.div
                className="bg-brand p-4 geom-card-sm w-16 h-16 flex items-center justify-center shadow-lg mx-auto mb-6 hover:shadow-lg transition-all duration-300"
                whileHover={{
                  scale: 1.02
                }}>
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-black text-slate-900 mb-6">Welcome Back</h2>
              
              {errorMsg && (
                <div className="w-full p-3 mb-6 bg-red-100 text-red-700 text-sm rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}
              
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm font-medium placeholder:text-slate-400"
                />
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm font-medium placeholder:text-slate-400 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-zinc-900 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-zinc-800 transition-all disabled:opacity-70"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          )}

          {view === 'register' && (
            <RegisterForm onBack={() => setView('main')} />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
