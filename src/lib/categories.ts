import { 
  collection, 
  addDoc, 
  setDoc,
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { ServiceCategory, CategoryRequest } from '../types';

/**
 * Creates a brand new service category (Admin action).
 */
export const addServiceCategory = async (categoryData: {
  name: string;
  description: string;
  icon: string;
  color: string;
  displayOrder: number;
  status: 'approved' | 'pending' | 'archived';
  createdBy: string;
}): Promise<string> => {
  const normalizedName = categoryData.name.trim().toLowerCase();
  
  // Check for duplicates
  const q = query(
    collection(db, 'service_categories'),
    where('name_lowercase', '==', normalizedName)
  );
  
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const existing = querySnapshot.docs[0];
    // If it exists but is archived, we can unarchive it, otherwise throw/return
    const docRef = doc(db, 'service_categories', existing.id);
    await updateDoc(docRef, {
      ...categoryData,
      status: 'approved',
      updatedAt: serverTimestamp()
    });
    return existing.id;
  }

  const docRef = await addDoc(collection(db, 'service_categories'), {
    name: categoryData.name.trim(),
    name_lowercase: normalizedName,
    description: categoryData.description.trim(),
    icon: categoryData.icon,
    color: categoryData.color,
    displayOrder: Number(categoryData.displayOrder) || 0,
    status: categoryData.status,
    createdBy: categoryData.createdBy,
    createdAt: serverTimestamp()
  });

  return docRef.id;
};

/**
 * Updates an existing service category (Admin action).
 */
export const updateServiceCategory = async (
  id: string, 
  updates: Partial<ServiceCategory>
): Promise<void> => {
  const docRef = doc(db, 'service_categories', id);
  const dataToUpdate: any = { ...updates };
  
  if (updates.name) {
    dataToUpdate.name = updates.name.trim();
    dataToUpdate.name_lowercase = updates.name.trim().toLowerCase();
  }
  if (updates.displayOrder !== undefined) {
    dataToUpdate.displayOrder = Number(updates.displayOrder);
  }
  
  dataToUpdate.updatedAt = serverTimestamp();
  await updateDoc(docRef, dataToUpdate);
};

/**
 * Archives an existing service category (Admin action).
 */
export const archiveCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, 'service_categories', id);
  await updateDoc(docRef, {
    status: 'archived',
    updatedAt: serverTimestamp()
  });
};

/**
 * Permanently deletes a service category (Admin action).
 */
export const deleteCategory = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'service_categories', id));
};

/**
 * Submits a new category request (User action).
 */
export const submitCategoryRequest = async (
  name: string, 
  userId: string, 
  userEmail: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'category_requests'), {
    name: name.trim(),
    requestedBy: userId,
    requestedByEmail: userEmail,
    status: 'pending',
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

/**
 * Approves a category request, marking it approved and optionally converting it 
 * into a live service category with provided metadata (Admin action).
 */
export const approveCategoryRequest = async (
  requestId: string,
  categoryMeta: {
    name: string;
    description: string;
    icon: string;
    color: string;
    displayOrder: number;
    createdBy: string;
  }
): Promise<string> => {
  // 1. Create the service category
  const categoryId = await addServiceCategory({
    ...categoryMeta,
    status: 'approved'
  });

  // 2. Update the request status
  const requestRef = doc(db, 'category_requests', requestId);
  await updateDoc(requestRef, {
    status: 'approved',
    convertedCategoryId: categoryId,
    updatedAt: serverTimestamp()
  });

  return categoryId;
};

/**
 * Rejects a category request (Admin action).
 */
export const rejectCategoryRequest = async (requestId: string): Promise<void> => {
  const requestRef = doc(db, 'category_requests', requestId);
  await updateDoc(requestRef, {
    status: 'rejected',
    updatedAt: serverTimestamp()
  });
};
