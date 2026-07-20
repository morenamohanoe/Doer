import { storage } from './firebase';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

export const uploadCroppedImage = async (dataUrl: string, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, 'data_url');
  return getDownloadURL(storageRef);
};

export const deleteImage = async (url: string): Promise<void> => {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return;
  try {
    // Basic extraction of path from URL - this might need refinement depending on how Storage URLs are structured
    // Firebase storage URLs often look like: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?alt=media&token=[token]
    const decodedUrl = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
    const storageRef = ref(storage, decodedUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};
