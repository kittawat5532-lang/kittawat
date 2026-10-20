import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus, SiteSettings, DEFAULT_CATEGORIES } from '../types';

const COLLECTION_USERS = 'users';
const COLLECTION_SETTINGS = 'settings';

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_USERS),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const list: UserProfile[] = [];
    snap.forEach((d) => {
      list.push({ uid: d.id, ...d.data() } as UserProfile);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_USERS);
  }
};

export const updateUserRole = async (
  targetUid: string, 
  newRole: UserRole
): Promise<void> => {
  const path = `${COLLECTION_USERS}/${targetUid}`;
  try {
    await updateDoc(doc(db, COLLECTION_USERS, targetUid), {
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    // If made admin, also ensure entry in admins collection
    if (newRole === 'admin') {
      try {
        await setDoc(doc(db, 'admins', targetUid), {
          grantedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Could not update admins collection:', e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const toggleUserStatus = async (
  targetUid: string, 
  currentStatus: UserStatus
): Promise<UserStatus> => {
  const nextStatus: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
  const path = `${COLLECTION_USERS}/${targetUid}`;
  try {
    await updateDoc(doc(db, COLLECTION_USERS, targetUid), {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
    return nextStatus;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const path = `${COLLECTION_SETTINGS}/general`;
  try {
    const snap = await getDoc(doc(db, COLLECTION_SETTINGS, 'general'));
    if (snap.exists()) {
      return snap.data() as SiteSettings;
    }
    // Return default settings
    return {
      siteName: 'EduShare Thai (คลังปัญญาแบ่งปัน)',
      description: 'ศูนย์กลางรวบรวมและแบ่งปันสื่อการเรียนรู้ แหล่งค้นคว้าความรู้ และบทเรียนคุณภาพสำหรับคนไทยทุกคน',
      announcement: 'ยินดีต้อนรับสู่อาณาจักรแห่งการเรียนรู้ร่วมกัน! คุณสามารถร่วมแบ่งปันชีทสรุป วิดีโอ หรือลิงก์การเรียนรู้ที่เป็นประโยชน์ได้ทันที',
      bannerText: 'ร่วมสร้างสังคมแห่งการแบ่งปันความรู้ ไม่ว่าจะเป็น นักเรียน นักศึกษา หรือคุณครู'
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>, updatedBy: string): Promise<void> => {
  const path = `${COLLECTION_SETTINGS}/general`;
  try {
    await setDoc(doc(db, COLLECTION_SETTINGS, 'general'), {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchCustomCategories = async (): Promise<string[]> => {
  const path = `${COLLECTION_SETTINGS}/categories`;
  try {
    const snap = await getDoc(doc(db, COLLECTION_SETTINGS, 'categories'));
    if (snap.exists() && Array.isArray(snap.data()?.list) && snap.data().list.length > 0) {
      return snap.data().list as string[];
    }
    return DEFAULT_CATEGORIES;
  } catch (error) {
    console.warn('Using default categories due to fetch error:', error);
    return DEFAULT_CATEGORIES;
  }
};

export const updateCustomCategories = async (list: string[], updatedBy: string): Promise<void> => {
  const path = `${COLLECTION_SETTINGS}/categories`;
  try {
    await setDoc(doc(db, COLLECTION_SETTINGS, 'categories'), {
      list,
      updatedAt: new Date().toISOString(),
      updatedBy
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
