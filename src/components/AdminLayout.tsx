import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  CalendarCheck2,
  CarFront,
  ExternalLink,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Receipt,
  RotateCcw,
  Settings,
  Users,
  UserSquare2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemoPortal } from '../contexts/DemoPortalContext';
import { SITE_CONFIG } from '../data/site';
import { ensurePortalSeeded } from '../lib/seedPortal';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end: boolean;
  adminOnly?: boolean;
}

const PORTAL_NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck2, end: false },
  { to: '/admin/fleet', label: 'Fleet & Maintenance', icon: CarFront, end: false },
  { to: '/admin/drivers', label: 'Chauffeurs', icon: UserSquare2, end: false },
  { to: '/admin/finance', label: 'Payments & Invoices', icon: Receipt, end: false, adminOnly: true },
  { to: '/admin/clients', label: 'Clients & NGOs', icon: Users, end: false, adminOnly: true },
  { to: '/admin/content', label: 'Website Content', icon: FileText, end: false, adminOnly: true },
  { to: '/admin/settings', label: 'Settings & Staff', icon: Settings, end: false, adminOnly: true },
];

export function RequireAdminRoute({ children }: { children: ReactNode }) {
  const { authReady, isAuthorizedStaff, isAdmin } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
        <div className="text-sm text-[#4B5563]">Verifying staff credentials...</div>
      </div>
    );
  }

  if (!isAuthorizedStaff) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Administrator Access Required" breadcrumb="Restricted">
        <div className="max-w-lg mx-auto mt-10 rounded-lg border border-[#111827]/12 bg-white p-8 text-center space-y-4">
          <div className="w-11 h-11 rounded-md bg-[#EFF3F9] border border-[#194793]/20 text-[#194793] flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-medium text-[#111827]">
              Restricted to Administrators
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              The Dispatch Portal focuses on daily vehicle bookings, fleet readiness, and chauffeur
              assignments. Financial ledgers, client accounts, website content, and pricing settings
              are restricted to Administrator accounts.
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672] transition-colors whitespace-nowrap"
          >
            Return to Dispatch Overview
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({
  title,
  breadcrumb,
  children,
}: {
  title: string;
  breadcrumb: string;
  children: ReactNode;
}) {
  const {
    staffProfile,
    authReady,
    isAuthorizedStaff,
    isAdmin,
    isDemoMode,
    signOutUser,
  } = useAuth();
  const { resetDemoData } = useDemoPortal();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthorizedStaff && !isDemoMode) {
      ensurePortalSeeded(isAdmin);
    }
  }, [isAuthorizedStaff, isAdmin, isDemoMode]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
        <div className="text-sm text-[#4B5563]">Verifying staff credentials...</div>
      </div>
    );
  }

  if (!isAuthorizedStaff) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const visibleNav = PORTAL_NAV.filter((item) => isAdmin || !item.adminOnly);
  const portalBrand = isAdmin ? 'Kechas Admin' : 'Kechas Dispatch';

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0E2447] text-white border-r border-white/10 print:hidden">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-white/10">
          <span className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/25 bg-[#194793]">
            <img
              src={SITE_CONFIG.logoSrc}
              alt="Kechas Agencies"
              className="w-full h-full object-cover scale-[1.04]"
            />
          </span>
          <div className="min-w-0">
            <div className="font-serif text-base font-medium truncate">{portalBrand}</div>
            <div className="text-[11px] text-[#94A3B8] capitalize">
              Role: {staffProfile?.role || 'staff'}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Portal navigation">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#194793] text-white'
                      : 'text-[#CBD5E1] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="text-xs text-[#CBD5E1] truncate">
            {isDemoMode ? `Demo: ${staffProfile?.email}` : staffProfile?.email}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-white/20 text-xs font-medium text-white hover:bg-white/10 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Public Site</span>
            </Link>
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#C8231D] text-xs font-medium text-white hover:bg-[#A61B16] whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isDemoMode ? 'Exit Demo' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#111827]/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-full bg-[#0E2447] text-white flex flex-col h-full z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
              <span className="font-serif text-lg">{portalBrand}</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                className="p-2 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap ${
                        isActive ? 'bg-[#194793] text-white' : 'text-[#CBD5E1]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 flex items-center gap-2">
              <Link
                to="/"
                className="flex-1 text-center px-3 py-2 rounded-md border border-white/20 text-xs text-white whitespace-nowrap"
              >
                Public Site
              </Link>
              <button
                type="button"
                onClick={signOutUser}
                className="px-3 py-2 rounded-md bg-[#C8231D] text-xs text-white whitespace-nowrap"
              >
                {isDemoMode ? 'Exit Demo' : 'Sign Out'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 print:pl-0 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#111827]/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 rounded-md border border-[#111827]/15 text-[#111827]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-[#4B5563] truncate">
                {portalBrand} / {breadcrumb}
              </p>
              <h1 className="font-serif text-lg sm:text-xl font-medium text-[#111827] truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/bookings"
              className="px-3.5 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672] whitespace-nowrap"
            >
              Bookings Desk
            </Link>
          </div>
        </header>

        {isDemoMode && (
          <div
            role="status"
            className="bg-[#EFF3F9] border-b border-[#1B479B]/20 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden"
          >
            <div className="flex items-center gap-2 text-[#123270] min-w-0">
              <FlaskConical className="w-4 h-4 text-[#D61C1C] shrink-0" aria-hidden="true" />
              <span className="font-semibold">
                Demo Dispatcher Account ({staffProfile?.email})
              </span>
              <span className="hidden sm:inline text-[#4B5563]">
                — Sample Kisumu dispatch sandbox; edits stay in this browser session.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={resetDemoData}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#1B479B]/25 bg-white text-[#1B479B] font-semibold hover:bg-[#F8FAFC] whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset Data</span>
              </button>
              <button
                type="button"
                onClick={signOutUser}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1B479B] text-white font-semibold hover:bg-[#15397E] whitespace-nowrap"
              >
                <span>Exit Demo &amp; Sign In</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
