import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { StaffInviteDoc, StaffMemberDoc, StaffRole } from '../lib/adminTypes';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';

const BOOTSTRAP_ADMIN_EMAIL = 'antonyonyi75@gmail.com';
const DEMO_STORAGE_KEY = 'kechas_demo_role';

function readStoredDemoRole(): StaffRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = window.sessionStorage.getItem(DEMO_STORAGE_KEY);
    return val === 'dispatcher' || val === 'admin' ? val : null;
  } catch {
    return null;
  }
}

function buildDemoProfile(role: StaffRole): StaffMemberDoc {
  if (role === 'admin') {
    return {
      uid: 'demo_admin_01',
      email: 'admin-demo@kechasagencies.co.ke',
      fullName: 'Samuel Ochieng (Demo Admin)',
      role: 'admin',
      status: 'active',
    };
  }
  return {
    uid: 'demo_dispatcher_01',
    email: 'dispatcher-demo@kechasagencies.co.ke',
    fullName: 'Grace Achieng (Demo Dispatcher)',
    role: 'dispatcher',
    status: 'active',
  };
}

interface AuthContextValue {
  user: User | null;
  staffProfile: StaffMemberDoc | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string;
  isAuthorizedStaff: boolean;
  isAdmin: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  enterDemoMode: (role?: StaffRole) => void;
  refreshStaffProfile: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffMemberDoc | null>(null);
  const [demoRole, setDemoRole] = useState<StaffRole | null>(() => readStoredDemoRole());
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  async function syncStaffProfile(firebaseUser: User) {
    try {
      const staffPath = `staff/${firebaseUser.uid}`;
      const staffRef = doc(db, 'staff', firebaseUser.uid);
      let snap;
      try {
        snap = await getDoc(staffRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, staffPath);
      }

      if (snap && snap.exists()) {
        const data = snap.data() as StaffMemberDoc;
        setStaffProfile(data);
      } else {
        const emailLower = (firebaseUser.email || '').toLowerCase();
        const isBootstrap =
          emailLower === BOOTSTRAP_ADMIN_EMAIL && firebaseUser.emailVerified;

        let invitedRole: 'admin' | 'dispatcher' | null = isBootstrap ? 'admin' : null;

        if (!isBootstrap && emailLower && firebaseUser.emailVerified) {
          try {
            const inviteSnap = await getDoc(doc(db, 'staff_invites', emailLower));
            if (inviteSnap.exists()) {
              const inviteData = inviteSnap.data() as StaffInviteDoc;
              invitedRole = inviteData.role;
            }
          } catch {
            invitedRole = null;
          }
        }

        if (invitedRole && emailLower) {
          const newStaff: StaffMemberDoc = {
            uid: firebaseUser.uid,
            email: emailLower,
            fullName: firebaseUser.displayName || emailLower.split('@')[0],
            role: invitedRole,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(staffRef, newStaff);
            setStaffProfile(newStaff);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, staffPath);
          }
        } else {
          setStaffProfile(null);
        }
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Unable to verify staff permissions.'
      );
      setStaffProfile(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthError('');

      if (!firebaseUser) {
        setStaffProfile(null);
        setAuthReady(true);
        return;
      }

      await syncStaffProfile(firebaseUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  async function signInWithGoogle() {
    setAuthError('');
    setAuthLoading(true);
    try {
      setDemoRole(null);
      try {
        window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {
        // Ignore storage restrictions
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-blocked') {
        setAuthError(
          'Your browser blocked the Google sign-in window. Allow popups for this site and click Continue with Google again.'
        );
      } else if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        setAuthError(
          'The Google sign-in window was closed before completing. Click below whenever you are ready to try again.'
        );
      } else {
        setAuthError(
          err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.'
        );
      }
    } finally {
      setAuthLoading(false);
    }
  }

  function enterDemoMode(role: StaffRole = 'dispatcher') {
    setAuthError('');
    setDemoRole(role);
    try {
      window.sessionStorage.setItem(DEMO_STORAGE_KEY, role);
    } catch {
      // Ignore storage restrictions
    }
  }

  async function refreshStaffProfile() {
    if (!user) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      await syncStaffProfile(user);
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOutUser() {
    setDemoRole(null);
    try {
      window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      // Ignore storage restrictions
    }
    if (auth.currentUser) {
      await signOut(auth);
    }
    setStaffProfile(null);
  }

  const isDemoMode = Boolean(demoRole);
  const resolvedStaffProfile = isDemoMode && demoRole ? buildDemoProfile(demoRole) : staffProfile;

  const isAuthorizedStaff = Boolean(
    isDemoMode ||
      (user &&
        user.emailVerified &&
        staffProfile &&
        staffProfile.status === 'active' &&
        (staffProfile.role === 'admin' || staffProfile.role === 'dispatcher'))
  );

  const isAdmin = Boolean(
    isDemoMode
      ? demoRole === 'admin'
      : isAuthorizedStaff && staffProfile?.role === 'admin'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        staffProfile: resolvedStaffProfile,
        authReady,
        authLoading,
        authError,
        isAuthorizedStaff,
        isAdmin,
        isDemoMode,
        signInWithGoogle,
        enterDemoMode,
        refreshStaffProfile,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
