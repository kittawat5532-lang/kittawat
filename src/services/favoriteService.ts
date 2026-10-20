import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  increment, 
  updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Favorite, Resource } from '../types';

const COLLECTION = 'favorites';

export const checkIsFavorite = async (userId: string, resourceId: string): Promise<boolean> => {
  const favoriteDocId = `${userId}_${resourceId}`;
  try {
    const snap = await getDoc(doc(db, COLLECTION, favoriteDocId));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${favoriteDocId}`);
  }
};

export const toggleFavorite = async (
  userId: string, 
  resource: Resource
): Promise<{ isFavorited: boolean }> => {
  const favoriteDocId = `${userId}_${resource.id}`;
  const favoriteRef = doc(db, COLLECTION, favoriteDocId);
  const resourceRef = doc(db, 'resources', resource.id);

  try {
    const existingSnap = await getDoc(favoriteRef);
    if (existingSnap.exists()) {
      // Remove favorite
      await deleteDoc(favoriteRef);
      try {
        await updateDoc(resourceRef, { favoriteCount: increment(-1) });
      } catch (e) {
        console.warn('Could not decrement favorite count:', e);
      }
      return { isFavorited: false };
    } else {
      // Add favorite
      const newFav: Favorite = {
        id: favoriteDocId,
        userId,
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceCategory: resource.category,
        createdAt: new Date().toISOString()
      };
      await setDoc(favoriteRef, newFav);
      try {
        await updateDoc(resourceRef, { favoriteCount: increment(1) });
      } catch (e) {
        console.warn('Could not increment favorite count:', e);
      }
      return { isFavorited: true };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION}/${favoriteDocId}`);
  }
};

export const fetchUserFavorites = async (userId: string): Promise<Favorite[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list: Favorite[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Favorite);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
};
