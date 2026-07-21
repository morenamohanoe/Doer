import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from './firebase';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  actionUrl?: string,
  requestId?: string
) => {
  const notifRef = doc(collection(db, 'notifications'));
  const newNotification: any = { // simplified type for creation
    id: notifRef.id,
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (actionUrl !== undefined) {
    newNotification.actionUrl = actionUrl;
  }
  
  if (requestId !== undefined) {
    newNotification.requestId = requestId;
  }

  await setDoc(notifRef, newNotification);
};
