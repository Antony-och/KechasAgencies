import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { StaffInviteDoc, StaffMemberDoc } from '../lib/adminTypes';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';

const BOOTSTRAP_ADMIN_EMAIL = 'antonyonyi75@gmail.com';

interface AuthContextValue {
  user: User | null;
  staffProfile: StaffMemberDoc | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string;
  isAuthorizedStaff: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffMemberDoc | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthError('');

      if (!firebaseUser) {
        setStaffProfile(null);
        setAuthReady(true);
        return;
      }

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
          // Check if user is the bootstrap admin or has a valid staff invite
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
              // Not invited or permission denied on invite lookup
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
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  async function signInWithGoogle() {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.'
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOutUser() {
    await signOut(auth);
    setStaffProfile(null);
  }

  const isAuthorizedStaff = Boolean(
    user &&
      user.emailVerified &&
      staffProfile &&
      staffProfile.status === 'active' &&
      (staffProfile.role === 'admin' || staffProfile.role === 'dispatcher')
  );

  const isAdmin = Boolean(isAuthorizedStaff && staffProfile?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        staffProfile,
        authReady,
        authLoading,
        authError,
        isAuthorizedStaff,
        isAdmin,
        signInWithGoogle,
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
