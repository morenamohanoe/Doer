import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, collection, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { migrateExistingUser } from '../lib/migration';

interface AuthContextProps {
  user: FirebaseUser | null;
  loading: boolean;
  profile: any | null;
  profileLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextProps>({ user: null, loading: true, profile: null, profileLoading: true, isAdmin: false });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, loadingSet] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setProfileLoading(true);
        const tokenResult = await user.getIdTokenResult();
        setIsAdmin(tokenResult.claims.role === 'admin');
      } else {
        setIsAdmin(false);
      }
      setUser(user);
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
        console.error("Migration/Initialization failed:", err);
      }
    };

    if (user) {
      unsubscribeProfile = onSnapshot(doc(collection(db, 'users'), user.uid), async (document) => {
        if (document.exists()) {
          const data = document.data();
          setProfile(data);
          
          if (data.profileCompleted === undefined) {
             performMigration(user, data);
          }
        } else {
          setProfile(null);
          performMigration(user, null);
        }
        setProfileLoading(false);
      });
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, profile, profileLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
