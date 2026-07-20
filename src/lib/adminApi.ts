import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';

const checkAdmin = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthorized');
  
  const tokenResult = await user.getIdTokenResult();
  if (!tokenResult.claims.admin) {
    throw new Error('Administrator access required.');
  }
};

export const adminApi = {
  getReports: async () => {
    await checkAdmin();
    const querySnapshot = await getDocs(collection(db, 'reports'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  getVerificationRequests: async () => {
    await checkAdmin();
    const querySnapshot = await getDocs(collection(db, 'verification_requests'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  getPlatformSettings: async () => {
    await checkAdmin();
    const querySnapshot = await getDocs(collection(db, 'platform_settings'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
