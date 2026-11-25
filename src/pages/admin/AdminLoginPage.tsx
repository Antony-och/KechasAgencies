import { Link, Navigate } from 'react-router-dom';
import { LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SITE_CONFIG } from '../../data/site';

export default function AdminLoginPage() {
  const {
    user,
    staffProfile,
    authReady,
    authLoading,
    authError,
    isAuthorizedStaff,
    signInWithGoogle,
    signOutUser,
  } = useAuth();

  if (authReady && isAuthorizedStaff) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-lg border border-[#111827]/12 bg-white p-7 sm:p-9 space-y-6">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#194793]/25 bg-[#194793]">
            <img
              src={SITE_CONFIG.logoSrc}
              alt="Kechas Agencies"
              className="w-full h-full object-cover scale-[1.04]"
            />
          </span>
          <div>
            <p className="text-xs font-semibold text-[#C8231D]">Staff Operations Portal</p>
            <h1 className="font-serif text-2xl text-[#111827]">Kechas Agencies</h1>
          </div>
        </div>

        {!authReady ? (
          <p className="text-sm text-[#4B5563]">Checking session status...</p>
        ) : user && !isAuthorizedStaff ? (
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-[#FEF2F2] border border-[#C8231D]/30 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#991B1B]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Access Restricted</span>
              </div>
              <p className="text-xs sm:text-sm text-[#991B1B] leading-relaxed">
                Signed in as <span className="font-mono">{user.email}</span>.{' '}
                {staffProfile?.status === 'disabled'
                  ? 'This staff account has been disabled.'
                  : 'Only authorized Kechas Agencies staff (admin or dispatcher) can access the dispatch portal.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={signOutUser}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out & Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Sign in or register your invited staff Google account to manage fleet dispatches,
              bookings, drivers, M-Pesa records, and website content.
            </p>

            <div className="p-3.5 rounded-md bg-[#EFF3F9] border border-[#194793]/15 flex items-start gap-2.5 text-xs text-[#194793]">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Role-verified access (`admin` or `dispatcher`) enforced by Firestore security rules.
              </span>
            </div>

            {authError && (
              <div
                role="alert"
                className="p-3 rounded-md bg-[#FEF2F2] border border-[#C8231D]/30 text-xs text-[#991B1B]"
              >
                {authError}
              </div>
            )}

            <button
              type="button"
              disabled={authLoading}
              onClick={signInWithGoogle}
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] disabled:opacity-60 transition-colors min-h-[46px]"
            >
              <span>{authLoading ? 'Signing in...' : 'Continue with Google (Staff Sign In / Sign Up)'}</span>
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-[#111827]/10 flex items-center justify-between text-xs text-[#4B5563]">
          <Link to="/" className="text-[#194793] font-medium hover:underline">
            ← Return to Public Site
          </Link>
          <span>Kisumu CBD</span>
        </div>
      </div>
    </div>
  );
}
