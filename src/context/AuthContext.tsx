import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, collection, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { migrateExistingUser } from '../lib/migration';
import { logError } from '../lib/logger';
import { getProperAvatar } from '../utils/avatarUtils';

interface AuthContextProps {
  user: (FirebaseUser & { role?: 'admin' | 'doer' }) | null;
  loading: boolean;
  profile: any | null;
  profileLoading: boolean;
  isAdmin: boolean;
  role: 'admin' | 'doer' | null;
}

const AuthContext = createContext<AuthContextProps>({ user: null, loading: true, profile: null, profileLoading: true, isAdmin: false, role: null });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(FirebaseUser & { role?: 'admin' | 'doer' }) | null>(null);
  const [loading, loadingSet] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<'admin' | 'doer' | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setProfileLoading(true);
        const tokenResult = await u.getIdTokenResult();
        setIsAdmin(tokenResult.claims.role === 'admin');
        const userRole = tokenResult.claims.role === 'admin' ? 'admin' : 'doer';
        setRole(userRole);
        const userWithRole = Object.assign(u, { role: userRole });
        setUser(userWithRole);
      } else {
        setIsAdmin(false);
        setRole(null);
        setUser(null);
      }
      loadingSet(false);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const performMigration = async (user: FirebaseUser, existingData: any) => {
      try {
        const needsMigration = !existingData || existingData.profileCompleted === undefined;
        if (!needsMigration) return;

        console.log("Checking migration or initialization for user:", user.uid);
        
        if (!existingData) {
          // 1. Initial creation for new user (e.g. Google Sign-In first time)
          const nameParts = user.displayName?.split(' ') || [];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const isEmailSignup = user.providerData.some(p => p.providerId === 'password');

          // If this is an email signup, RegisterForm handles creation.
          // We only create the default user document for OAuth (Google) sign-ins.
          if (!isEmailSignup) {
            const userDocSnap = await getDoc(doc(db, 'users', user.uid));
            if (!userDocSnap.exists()) {
              await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email || '',
                firstName,
                lastName,
                avatarUrl: user.photoURL || '',
                profileCompleted: false,
                role: 'doer',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }, { merge: true });
              console.log("[AuthContext] Clean initial user model generated for OAuth user:", user.uid);
            }
          }
        } else {
          // 2. Existing user migration to consolidated schema
          await migrateExistingUser(user.uid);
        }
        
      } catch (err) {
        logError("Migration/Initialization failed:", err);
      }
    };

    if (user) {
      const initUserData = async () => {
        // Mock document initialization removed to prevent hardcoded user data
        // Profiles should be created during the registration flow, not forcefully initialized here.
        // If a user signs in with a provider like Google, they should be redirected to an onboarding flow.
      };
      initUserData();

      unsubscribeProfile = onSnapshot(doc(collection(db, 'users'), user.uid), async (document) => {
        if (document.exists()) {
          const data = document.data();
          
          // Auto-fix Volkswagen or static generic fallback avatar if found in Firestore
          const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || data.displayName;
          const properAvatar = getProperAvatar(data.avatarUrl, fullName, user.uid, data.gender);
          if (data && (!data.avatarUrl || data.avatarUrl.includes('1599305445671-ac291c95aaa9') || data.avatarUrl.includes('photo-1534528741775-53994a69daeb'))) {
            data.avatarUrl = properAvatar;
            try {
              await setDoc(doc(db, 'users', user.uid), { avatarUrl: properAvatar }, { merge: true });
              console.log("[AuthContext] Repaired user avatar in Firestore with clean personalized avatar.");
            } catch (err) {
              console.error("[AuthContext] Failed to repair user avatar in Firestore:", err);
            }
          }
          
          setProfile(data);
          const currentRole = data.role || 'doer';
          setIsAdmin(currentRole === 'admin');
          setRole(currentRole);
          setUser(prevUser => {
            if (!prevUser) return null;
            return Object.assign(prevUser, { role: currentRole as 'admin' | 'doer' });
          });
          
          if (data.profileCompleted === undefined) {
             performMigration(user, data);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
          setRole(null);
          setUser(prevUser => {
            if (!prevUser) return null;
            return Object.assign(prevUser, { role: 'doer' as const });
          });
          performMigration(user, null);
        }
        setProfileLoading(false);
      });
    } else {
      setProfile(null);
      setRole(null);
      setProfileLoading(false);
    }
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, profile, profileLoading, isAdmin, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const useRole = () => {
  const { profile, profileLoading, role: authRole } = useAuth();

  const role = profile?.role || authRole || 'doer';
  const isAdmin = role === 'admin';
  const isDoer = role === 'doer';

  return {
    role,
    isAdmin,
    isDoer,
    loading: profileLoading,
  };
};

