import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isSuspended: boolean;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ needVerification: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfileData: (data: { displayName?: string; bio?: string }) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'kittawat5532@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile from Firestore
  const fetchUserProfile = async (user: FirebaseUser): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Check if user is super admin email but has role 'member'
        if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && data.role !== 'admin') {
          const updated: Partial<UserProfile> = { role: 'admin', updatedAt: new Date().toISOString() };
          await updateDoc(userDocRef, updated);
          return { ...data, ...updated };
        }
        return data;
      } else {
        // Create initial profile
        const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
          photoURL: user.photoURL || '',
          role: isSuperAdmin ? 'admin' : 'member',
          status: 'active',
          bio: 'ยินดีต้อนรับสู่คลังปัญญา EduShare Thai',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, initialProfile);
        
        // Also maintain admins collection if super admin
        if (isSuperAdmin) {
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              email: user.email,
              grantedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn('Could not set admin doc:', e);
          }
        }

        return initialProfile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await fetchUserProfile(user);
          setUserProfile(profile);
        } catch (error) {
          console.error('Failed to load user profile', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (currentUser) {
      const profile = await fetchUserProfile(currentUser);
      setUserProfile(profile);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = credential.user;
    
    // Update Firebase Auth profile
    await updateProfile(user, { displayName: displayName.trim() });
    
    // Send email verification
    try {
      await sendEmailVerification(user);
    } catch (err) {
      console.warn('Failed to send verification email automatically:', err);
    }

    // Create user profile in Firestore
    const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: displayName.trim(),
      photoURL: '',
      role: isSuperAdmin ? 'admin' : 'member',
      status: 'active',
      bio: 'สมาชิกใหม่ของคลังปัญญา EduShare',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      if (isSuperAdmin) {
        await setDoc(doc(db, 'admins', user.uid), { email: user.email, grantedAt: new Date().toISOString() });
      }
      setUserProfile(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }

    return { needVerification: !user.emailVerified };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email.trim(), password);
    const profile = await fetchUserProfile(res.user);
    setUserProfile(profile);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await signInWithPopup(auth, provider);
    const profile = await fetchUserProfile(res.user);
    setUserProfile(profile);
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('กรุณาเข้าสู่ระบบก่อน');
    await sendEmailVerification(auth.currentUser);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logOut = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserProfileData = async (data: { displayName?: string; bio?: string }) => {
    if (!currentUser || !userProfile) throw new Error('ไม่ได้เข้าสู่ระบบ');
    
    if (data.displayName && data.displayName !== currentUser.displayName) {
      await updateProfile(currentUser, { displayName: data.displayName });
    }

    const path = `users/${currentUser.uid}`;
    try {
      const updatePayload: Partial<UserProfile> = {
        updatedAt: new Date().toISOString()
      };
      if (data.displayName) updatePayload.displayName = data.displayName;
      if (data.bio !== undefined) updatePayload.bio = data.bio;

      await updateDoc(doc(db, 'users', currentUser.uid), updatePayload);
      setUserProfile(prev => prev ? ({ ...prev, ...updatePayload }) : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const isSuper = currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const isAdmin = isSuper || userProfile?.role === 'admin';
  const isModerator = isAdmin || userProfile?.role === 'moderator';
  const isSuspended = userProfile?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isModerator,
        isSuspended,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        sendVerificationEmail,
        resetPassword,
        logOut,
        updateUserProfileData,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
