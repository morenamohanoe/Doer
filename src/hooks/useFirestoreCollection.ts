import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirestoreCollection<T>(collectionName: string, queryConstraints: QueryConstraint[] = []) {
  return useQuery({
    queryKey: [collectionName, ...queryConstraints],
    queryFn: async () => {
      const q = query(collection(db, collectionName), ...queryConstraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    },
  });
}
