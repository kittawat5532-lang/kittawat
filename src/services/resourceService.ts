import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  increment 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { Resource } from '../types';

const COLLECTION = 'resources';

export interface CreateResourceInput {
  title: string;
  description: string;
  category: string;
  gradeLevel: string;
  mediaType: Resource['mediaType'];
  url?: string;
  fileUrl?: string;
  fileName?: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
}

export const fetchResources = async (): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const list: Resource[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Resource);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
};

export const fetchResourceById = async (id: string): Promise<Resource | null> => {
  const path = `${COLLECTION}/${id}`;
  try {
    const docRef = doc(db, COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Resource;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const fetchUserResources = async (authorId: string): Promise<Resource[]> => {
  const path = COLLECTION;
  try {
    const q = query(
      collection(db, COLLECTION),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const list: Resource[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Resource);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const createResource = async (input: CreateResourceInput): Promise<string> => {
  const path = COLLECTION;
  // Strict client-side validation
  if (!input.title || input.title.trim().length < 2) {
    throw new Error('กรุณาระบุชื่อสื่อการเรียนรู้อย่างน้อย 2 ตัวอักษร');
  }
  if (!input.category) {
    throw new Error('กรุณาเลือกหมวดหมู่ความรู้');
  }
  if (!input.gradeLevel) {
    throw new Error('กรุณาเลือกระดับชั้นเป้าหมาย');
  }
  if (!input.url && !input.fileUrl) {
    throw new Error('กรุณาใส่ลิงก์สื่อการเรียนรู้ หรืออัปโหลดไฟล์ประกอบ');
  }

  const newDoc: Omit<Resource, 'id'> = {
    title: input.title.trim(),
    description: (input.description || '').trim(),
    category: input.category,
    gradeLevel: input.gradeLevel,
    mediaType: input.mediaType,
    url: input.url?.trim() || '',
    fileUrl: input.fileUrl || '',
    fileName: input.fileName || '',
    authorId: input.authorId,
    authorName: input.authorName,
    authorEmail: input.authorEmail || '',
    isHidden: false,
    viewCount: 0,
    favoriteCount: 0,
    reportCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION), newDoc);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateResource = async (id: string, updates: Partial<Resource>): Promise<void> => {
  const path = `${COLLECTION}/${id}`;
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteResource = async (id: string): Promise<void> => {
  const path = `${COLLECTION}/${id}`;
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const toggleHideResource = async (id: string, currentHidden: boolean): Promise<void> => {
  const path = `${COLLECTION}/${id}`;
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      isHidden: !currentHidden,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const incrementResourceView = async (id: string): Promise<void> => {
  const path = `${COLLECTION}/${id}`;
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      viewCount: increment(1)
    });
  } catch {
    // Non-blocking for analytics
  }
};

export const uploadResourceFile = async (
  file: File, 
  authorId: string,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; fileName: string }> => {
  // Sanitize filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `resources/${authorId}/${Date.now()}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, fileName: file.name });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
