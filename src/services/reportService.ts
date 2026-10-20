import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Report, ModerationLog } from '../types';

const COLLECTION_REPORTS = 'reports';
const COLLECTION_LOGS = 'moderationLogs';

export const submitReport = async (input: {
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
  details?: string;
}): Promise<string> => {
  try {
    const reportData: Omit<Report, 'id'> = {
      resourceId: input.resourceId,
      resourceTitle: input.resourceTitle,
      reporterId: input.reporterId,
      reporterEmail: input.reporterEmail,
      reason: input.reason,
      details: input.details || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_REPORTS), reportData);

    // Increment resource reportCount
    try {
      await updateDoc(doc(db, 'resources', input.resourceId), {
        reportCount: increment(1)
      });
    } catch (e) {
      console.warn('Could not increment report count on resource:', e);
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_REPORTS);
  }
};

export const fetchReports = async (): Promise<Report[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_REPORTS),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const list: Report[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Report);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_REPORTS);
  }
};

export const updateReportStatus = async (
  reportId: string, 
  status: Report['status'],
  moderatorId: string
): Promise<void> => {
  const path = `${COLLECTION_REPORTS}/${reportId}`;
  try {
    await updateDoc(doc(db, COLLECTION_REPORTS, reportId), {
      status,
      resolvedAt: new Date().toISOString(),
      resolvedBy: moderatorId
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const logModerationAction = async (log: Omit<ModerationLog, 'id'>): Promise<void> => {
  try {
    await addDoc(collection(db, COLLECTION_LOGS), log);
  } catch (error) {
    console.warn('Could not write moderation log:', error);
  }
};

export const fetchModerationLogs = async (): Promise<ModerationLog[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_LOGS),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    const list: ModerationLog[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as ModerationLog);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_LOGS);
  }
};
