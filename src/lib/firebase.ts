import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || 'ai-studio-doer-5d4a57f4-3066-4fec-a081-9fae989dbe87');
export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

if (import.meta.env.DEV) {
  console.log('Firebase Project ID:', firebaseConfig.projectId);
  console.log('Firestore Database ID:', 'ai-studio-doer-5d4a57f4-3066-4fec-a081-9fae989dbe87');
  
  // Test connection status
  import('firebase/firestore').then(({ doc, getDoc }) => {
    getDoc(doc(db, 'system', 'status'))
      .then(() => console.log('Firestore Connection Status: SUCCESS'))
      .catch((err) => {
        if (err.code === 'permission-denied') {
          console.log('Firestore Connection Status: SUCCESS (Connection OK, Permission Denied expected)');
        } else {
          console.error('Firestore Connection Status: FAILED', err);
        }
      });
  });
}

