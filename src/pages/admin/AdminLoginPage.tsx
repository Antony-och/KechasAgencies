import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Play,
  Receipt,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SITE_CONFIG } from '../../data/site';

const PORTAL_BACKDROP = '/src/assets/images/about_kechas_chauffeur_dispatch_1795681169503.jpg';

function GoogleMark() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.88Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.93.46 3.76 1.26 5.39l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.11c.95-2.85 3.6-4.97 6.73-4.97Z"
      />
    </svg>
  );
}

export default function AdminLoginPage() {
  const {
    user,
    staffProfile,
    authReady,
    authLoading,
    authError,
    isAuthorizedStaff,
    signInWithGoogle,
    enterDemoMode,
    refreshStaffProfile,
    signOutUser,
  } = useAuth();
  const location = useLocation();
  const [bgError, setBgError] = useState(false);

  const fromState = (location.state as { from?: string } | null)?.from;
  const redirectTarget =
    fromState && fromState.startsWith('/admin') && fromState !== '/admin/login'
      ? fromState
      : '/admin';

  if (authReady && isAuthorizedStaff) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFC]">
      {/* Left Brand & Dispatch Overview Panel */}
      <aside className="hidden lg:flex lg:col-span-7 relative overflow-hidden bg-[#0B1E45] text-white flex-col justify-between p-10 xl:p-14">
        {/* Background Photo + Directional Royal/Cobalt Blue Gradient Scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#123270] via-[#1B479B] to-[#0B1E45]"
        >
          {!bgError && (
            <img
              src={PORTAL_BACKDROP}
              alt=""
              onError={() => setBgError(true)}
              className="w-full h-full object-cover object-[72%_28%]"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(98deg, rgba(10, 26, 62, 0.97) 0%, rgba(18, 50, 112, 0.92) 48%, rgba(27, 71, 155, 0.62) 78%, rgba(11, 29, 68, 0.42) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(10, 26, 62, 0.55) 0%, rgba(10, 26, 62, 0.15) 45%, rgba(9, 23, 54, 0.92) 100%)',
            }}
          />
        </div>

        {/* Top Lockup */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-3.5 group">
            <span className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white/25 bg-[#1B479B] shadow-md">
              <img
                src={SITE_CONFIG.logoSrc}
                alt="Kechas Agencies"
                className="w-full h-full object-cover scale-[1.04]"
              />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF6B63]">
                KISUMU DISPATCH COMMAND
              </p>
              <p className="font-serif text-xl font-semibold text-white group-hover:text-[#F8FAFC] transition-colors">
                {SITE_CONFIG.brandName}
              </p>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-[#F8FAFC]">
            <MapPin className="w-3.5 h-3.5 text-[#FF6B63]" aria-hidden="true" />
            <span>Kisumu CBD · Western Kenya</span>
          </span>
        </div>

        {/* Center Command Headline & Operational Pillars */}
        <div className="relative z-10 max-w-xl space-y-8 my-10">
          <div className="space-y-4">
            <h2 className="font-serif text-4xl xl:text-[2.85rem] font-semibold leading-[1.08] tracking-tight text-white">
              Staff Operations{' '}
              <span className="underline decoration-[#D61C1C] decoration-[3.5px] underline-offset-[8px]">
                Portal
              </span>
              .
            </h2>
            <p className="text-base leading-relaxed text-[#F8FAFC]/90 max-w-lg">
              Central workspace for Kechas Agencies coordinators and administrators to assign
              chauffeurs, confirm M-Pesa deposits, and keep our regional fleet dispatched on time.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-[#0B1E45]/60 backdrop-blur-sm border border-white/15">
              <span className="w-9 h-9 rounded-md bg-[#1B479B] border border-white/15 flex items-center justify-center shrink-0">
                <CalendarClock className="w-4 h-4 text-[#FF6B63]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Dispatch & KIS Flight Tracking</p>
                <p className="text-xs text-[#F8FAFC]/75 mt-0.5 leading-relaxed">
                  Assign drivers and vehicles across Kisumu arrivals and ten regional counties.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-[#0B1E45]/60 backdrop-blur-sm border border-white/15">
              <span className="w-9 h-9 rounded-md bg-[#1B479B] border border-white/15 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 text-[#FF6B63]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">M-Pesa & VAT Invoicing</p>
                <p className="text-xs text-[#F8FAFC]/75 mt-0.5 leading-relaxed">
                  Verify Paybill {SITE_CONFIG.mpesa.paybill} receipts, corporate retainers, and trip settlements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-[#0B1E45]/60 backdrop-blur-sm border border-white/15">
              <span className="w-9 h-9 rounded-md bg-[#1B479B] border border-white/15 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-[#FF6B63]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Fleet & Route Readiness</p>
                <p className="text-xs text-[#F8FAFC]/75 mt-0.5 leading-relaxed">
                  Update live vehicle availability, daily rates, and corridor route guides.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Operations Footer */}
        <div className="relative z-10 pt-5 border-t border-white/15 flex items-center justify-between text-xs text-[#F8FAFC]/75">
          <span>{SITE_CONFIG.address}</span>
          <span className="inline-flex items-center gap-1.5 text-[#F8FAFC]/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B63]" aria-hidden="true" />
            <span>Role-verified Firestore access</span>
          </span>
        </div>
      </aside>

      {/* Right Sign-In Panel */}
      <main className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-8 lg:p-12 bg-[#F8FAFC]">
        {/* Mobile/Tablet Header Strip */}
        <div className="lg:hidden flex items-center justify-between pb-6">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#1B479B]/25 bg-[#1B479B]">
              <img
                src={SITE_CONFIG.logoSrc}
                alt="Kechas Agencies"
                className="w-full h-full object-cover scale-[1.04]"
              />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D61C1C]">
                Staff Operations Portal
              </p>
              <p className="font-serif text-lg font-semibold text-[#111827]">
                {SITE_CONFIG.brandName}
              </p>
            </div>
          </Link>
        </div>

        {/* Centered Auth Card */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="w-full max-w-[430px] rounded-xl border border-[#123270]/12 bg-white shadow-xl shadow-[#0B1D42]/8 overflow-hidden">
            {/* Brand Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#123270] via-[#1B479B] to-[#D61C1C]" />

            <div className="p-7 sm:p-9 space-y-6">
              {!authReady ? (
                <div className="py-10 flex flex-col items-center text-center space-y-3">
                  <Loader2
                    className="w-8 h-8 text-[#1B479B] animate-spin"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#111827]">
                      Checking dispatch session
                    </p>
                    <p className="text-xs text-[#4B5563]">
                      Verifying Google identity and staff permissions...
                    </p>
                  </div>
                </div>
              ) : user && !isAuthorizedStaff ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D61C1C]">
                      PERMISSION HOLD
                    </p>
                    <h1 className="font-serif text-2xl font-semibold text-[#111827]">
                      {staffProfile?.status === 'disabled'
                        ? 'Staff account disabled'
                        : 'Authorization required'}
                    </h1>
                    <div className="w-9 h-[3px] bg-[#D61C1C] rounded-full" aria-hidden="true" />
                  </div>

                  {/* Signed-in User Summary */}
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#F4F7FC] border border-[#1B479B]/15">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-[#1B479B]/20 shrink-0"
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-[#1B479B] text-white text-sm font-semibold flex items-center justify-center shrink-0">
                        {(user.displayName || user.email || 'S').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">
                        {user.displayName || 'Google Account'}
                      </p>
                      <p className="font-mono text-xs text-[#4B5563] truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#D61C1C]/25 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#991B1B]">
                      <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        {staffProfile?.status === 'disabled'
                          ? 'Access Suspended'
                          : 'No Active Staff Record Found'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed">
                      {staffProfile?.status === 'disabled'
                        ? 'This staff account has been disabled by an administrator. Contact your Kisumu operations manager to restore access.'
                        : 'Only active or invited Kechas Agencies team members can enter the portal. Ask an Operations Admin to invite this email under Staff & Permissions, then click Recheck Access.'}
                    </p>
                  </div>

                  {authError && (
                    <div
                      role="alert"
                      className="p-3 rounded-md bg-[#FEF2F2] border border-[#D61C1C]/30 text-xs text-[#991B1B]"
                    >
                      {authError}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {staffProfile?.status !== 'disabled' && (
                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={refreshStaffProfile}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-md bg-white hover:bg-[#F3F6FB] border border-[#123270]/25 text-[#123270] text-sm font-semibold transition-colors disabled:opacity-60"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${authLoading ? 'animate-spin' : ''}`}
                          aria-hidden="true"
                        />
                        <span>{authLoading ? 'Checking...' : 'Recheck Staff Access'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={signOutUser}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-[#123270] border-b-[3px] border-b-[#D61C1C] transition-colors disabled:opacity-60"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span>Sign Out & Switch Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => enterDemoMode('dispatcher')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-md bg-[#F4F7FC] hover:bg-[#E7EEF9] border border-[#1B479B]/25 text-[#123270] text-xs font-semibold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-[#D61C1C]" aria-hidden="true" />
                      <span>Try Demo Dispatcher Account Instead</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D61C1C]">
                      STAFF OPERATIONS PORTAL
                    </p>
                    <h1 className="font-serif text-2xl sm:text-[1.75rem] font-semibold text-[#111827]">
                      Sign in to dispatch
                    </h1>
                    <div className="w-9 h-[3px] bg-[#D61C1C] rounded-full" aria-hidden="true" />
                    <p className="text-sm text-[#4B5563] leading-relaxed pt-1">
                      Continue with your authorized Kechas Agencies Google account to manage
                      bookings, drivers, fleet availability, and M-Pesa billing.
                    </p>
                  </div>

                  {authError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#D61C1C]/30 flex items-start gap-2.5 text-xs sm:text-sm text-[#991B1B]"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* Official Google Sign-In CTA */}
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={signInWithGoogle}
                    className="w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 min-h-[52px] rounded-lg bg-[#1B479B] hover:bg-[#15397E] active:bg-[#123270] text-white text-sm font-semibold border border-[#123270] border-b-[3px] border-b-[#D61C1C] shadow-md shadow-[#123270]/20 transition-colors disabled:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B479B] focus-visible:ring-offset-2"
                  >
                    <span className="w-7 h-7 rounded bg-white flex items-center justify-center shrink-0">
                      {authLoading ? (
                        <Loader2
                          className="w-4 h-4 text-[#1B479B] animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <GoogleMark />
                      )}
                    </span>
                    <span>
                      {authLoading ? 'Signing in with Google...' : 'Continue with Google'}
                    </span>
                  </button>

                  {/* Demo Dispatcher Account */}
                  <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#123270]/15 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#123270]">
                        Demo Dispatcher Account
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#EFF3F9] border border-[#1B479B]/20 font-mono text-[10px] font-semibold text-[#1B479B]">
                        role: dispatcher
                      </span>
                    </div>
                    <div className="text-xs text-[#4B5563] space-y-1">
                      <p className="font-mono text-[11px] text-[#111827] font-medium">
                        dispatcher-demo@kechasagencies.co.ke
                      </p>
                      <p className="leading-relaxed">
                        Instant 1-click Dispatcher preview with sample Kisumu trips, 8-point vehicle
                        handovers, M-Pesa billing, and client audits.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => enterDemoMode('dispatcher')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md bg-white hover:bg-[#EFF3F9] border border-[#1B479B]/30 text-[#123270] text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <Play className="w-4 h-4 text-[#D61C1C]" aria-hidden="true" />
                      <span>Sign in as Demo Dispatcher</span>
                    </button>
                  </div>

                  {/* Role Access Summary */}
                  <div className="p-4 rounded-lg bg-[#F4F7FC] border border-[#1B479B]/15 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123270]">
                      <ShieldCheck className="w-4 h-4 text-[#1B479B] shrink-0" aria-hidden="true" />
                      <span>Role-Verified Portal Access</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-md bg-white border border-[#123270]/10 space-y-0.5">
                        <p className="font-semibold text-[#111827] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1B479B]" aria-hidden="true" />
                          <span>Admin</span>
                        </p>
                        <p className="text-[11px] text-[#4B5563]">
                          Full fleet, finance, CMS & staff control
                        </p>
                      </div>
                      <div className="p-2.5 rounded-md bg-white border border-[#123270]/10 space-y-0.5">
                        <p className="font-semibold text-[#111827] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#D61C1C]" aria-hidden="true" />
                          <span>Dispatcher</span>
                        </p>
                        <p className="text-[11px] text-[#4B5563]">
                          Live bookings, drivers & trip status
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                      Invited staff activate automatically on first Google sign-in using their
                      invited email address.
                    </p>
                  </div>
                </div>
              )}

              {/* Card Bottom Links */}
              <div className="pt-5 border-t border-[#111827]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#1B479B] hover:text-[#123270] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Return to Public Site</span>
                </Link>
                <a
                  href={SITE_CONFIG.phoneHref}
                  className="inline-flex items-center gap-1.5 text-[#4B5563] hover:text-[#111827] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D61C1C]" aria-hidden="true" />
                  <span className="font-mono tabular-nums">{SITE_CONFIG.phoneDisplay}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright / Location Note */}
        <p className="text-center text-[11px] text-[#6B7280] pt-4">
          {SITE_CONFIG.brandName} Operations · {SITE_CONFIG.airportDesk}
        </p>
      </main>
    </div>
  );
}
