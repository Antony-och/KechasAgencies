import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  ArrowRight,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Lock,
  MessageCircle,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import {
  StaffInviteDoc,
  StaffMemberDoc,
  StaffRole,
  StaffStatus,
  VehicleDoc,
} from '../../lib/adminTypes';
import { formatKes } from '../../data/fleet';
import { SITE_CONFIG } from '../../data/site';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoPortal } from '../../contexts/DemoPortalContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import { getChauffeurDailyFeeKes } from '../../lib/pricing';

type SettingsTab = 'company' | 'pricing' | 'staff' | 'policies';

const BOOTSTRAP_ADMIN_EMAIL = 'antonyonyi75@gmail.com';
const DRIVER_FEE_PRESETS = [1500, 2000, 2500, 3000];

const PERMISSIONS_MATRIX = [
  { module: 'Bookings & Dispatch Workflow', admin: 'Full CRUD + Reopen Closed', dispatcher: 'Create, Assign & Dispatch' },
  { module: 'Fleet Inventory & Maintenance', admin: 'Full CRUD + Delete Vehicles', dispatcher: 'Add, Edit & Log Service' },
  { module: 'Chauffeurs / Drivers Directory', admin: 'Full CRUD + Delete Drivers', dispatcher: 'Add, Edit & Assign' },
  { module: 'Payments, M-Pesa & Invoices', admin: 'Record, Print & Edit Past', dispatcher: 'Record & Print Invoices' },
  { module: 'Website Content Manager (CMS)', admin: 'Publish, Edit & Delete', dispatcher: 'Publish & Edit' },
  { module: 'Settings, Pricing & Staff Access', admin: 'Full Control & Invites', dispatcher: 'Read-Only View' },
];

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'KA'
  );
}

export default function AdminSettingsPage() {
  const { isAdmin, staffProfile, isDemoMode } = useAuth();
  const demo = useDemoPortal();
  const { settings } = useSiteData();

  const [activeTab, setActiveTab] = useState<SettingsTab>('pricing');

  // Company & Dispatch state
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [phoneDisplay, setPhoneDisplay] = useState(settings.phoneDisplay);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [dispatchHours, setDispatchHours] = useState(
    settings.dispatchHours || SITE_CONFIG.dispatchHours
  );

  // Pricing & Billing state
  const [mpesaPaybill, setMpesaPaybill] = useState(settings.mpesaPaybill);
  const [mpesaAccount, setMpesaAccount] = useState(settings.mpesaAccount);
  const [vatEnabled, setVatEnabled] = useState(settings.vatEnabled);
  const [vatRatePercent, setVatRatePercent] = useState(settings.vatRatePercent);
  const [chauffeurDailyFeeKes, setChauffeurDailyFeeKes] = useState(
    getChauffeurDailyFeeKes(settings)
  );
  const [syncFleetOnSave, setSyncFleetOnSave] = useState(true);

  // Invoices & Policies state
  const [kraPin, setKraPin] = useState(settings.kraPin || 'P051940221K');
  const [bankDetails, setBankDetails] = useState(
    settings.bankDetails || 'KCB Bank Kisumu · Acc: 1204889120 · Kisumu Main'
  );
  const [bookingTermsSummary, setBookingTermsSummary] = useState(
    settings.bookingTermsSummary ||
      'Chauffeur rates include driver allowance and comprehensive insurance. Self-drive requires a valid driving licence and National ID or Passport.'
  );

  // Save & copy feedback
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [syncNotice, setSyncNotice] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Fleet for Rate Impact Preview & Backup
  const [fleetVehicles, setFleetVehicles] = useState<VehicleDoc[]>([]);

  // Staff & Invites state
  const [staffList, setStaffList] = useState<StaffMemberDoc[]>([]);
  const [invites, setInvites] = useState<StaffInviteDoc[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | StaffRole>('all');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('dispatcher');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [confirmRemoveUid, setConfirmRemoveUid] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  useEffect(() => {
    setCompanyName(settings.companyName);
    setPhoneDisplay(settings.phoneDisplay);
    setWhatsappNumber(settings.whatsappNumber);
    setEmail(settings.email);
    setAddress(settings.address);
    setDispatchHours(settings.dispatchHours || SITE_CONFIG.dispatchHours);
    setMpesaPaybill(settings.mpesaPaybill);
    setMpesaAccount(settings.mpesaAccount);
    setVatEnabled(settings.vatEnabled);
    setVatRatePercent(settings.vatRatePercent);
    setChauffeurDailyFeeKes(getChauffeurDailyFeeKes(settings));
    setKraPin(settings.kraPin || 'P051940221K');
    setBankDetails(
      settings.bankDetails || 'KCB Bank Kisumu · Acc: 1204889120 · Kisumu Main'
    );
    setBookingTermsSummary(
      settings.bookingTermsSummary ||
        'Chauffeur rates include driver allowance and comprehensive insurance. Self-drive requires a valid driving licence and National ID or Passport.'
    );
  }, [settings]);

  useEffect(() => {
    if (isDemoMode) {
      setFleetVehicles([...demo.vehicles].sort((a, b) => a.name.localeCompare(b.name)));
      return;
    }

    const unsubVehicles = onSnapshot(
      collection(db, 'vehicles'),
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ ...(d.data() as VehicleDoc), id: d.id }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setFleetVehicles(rows);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'vehicles')
    );

    if (!isAdmin) {
      return () => unsubVehicles();
    }

    const unsubStaff = onSnapshot(
      collection(db, 'staff'),
      (snap) => {
        const rows = snap.docs
          .map((d) => d.data() as StaffMemberDoc)
          .sort((a, b) => a.fullName.localeCompare(b.fullName));
        setStaffList(rows);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'staff')
    );
    const unsubInvites = onSnapshot(
      collection(db, 'staff_invites'),
      (snap) =>
        setInvites(snap.docs.map((d) => ({ ...(d.data() as StaffInviteDoc), id: d.id }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'staff_invites')
    );

    return () => {
      unsubVehicles();
      unsubStaff();
      unsubInvites();
    };
  }, [isAdmin, isDemoMode, demo.vehicles]);

  const fleetRatePreview = useMemo(() => {
    const prevDriverFee = getChauffeurDailyFeeKes(settings);
    const nextDriverFee = Math.min(100000, Math.max(0, Number(chauffeurDailyFeeKes) || 0));
    const delta = nextDriverFee - prevDriverFee;

    return fleetVehicles.map((v) => {
      const nextDailyRate = v.chauffeurAvailable
        ? v.selfDriveAvailable && (v.selfDriveRateKes ?? 0) > 0
          ? v.selfDriveRateKes + nextDriverFee
          : Math.max(0, (v.dailyRateKes || 0) + delta)
        : v.dailyRateKes;

      const rateChanged = v.chauffeurAvailable && nextDailyRate !== v.dailyRateKes;

      return {
        vehicle: v,
        nextDailyRate,
        rateChanged,
      };
    });
  }, [fleetVehicles, settings, chauffeurDailyFeeKes]);

  const impactedCount = useMemo(
    () => fleetRatePreview.filter((row) => row.rateChanged).length,
    [fleetRatePreview]
  );

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    return staffList.filter((m) => {
      if (staffRoleFilter !== 'all' && m.role !== staffRoleFilter) return false;
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      );
    });
  }, [staffList, staffSearch, staffRoleFilter]);

  const activeStaffCount = staffList.filter((m) => m.status === 'active').length;
  const adminCount = staffList.filter((m) => m.role === 'admin' && m.status === 'active').length;
  const dispatcherCount = staffList.filter(
    (m) => m.role === 'dispatcher' && m.status === 'active'
  ).length;

  function copyWithFeedback(key: string, value: string) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    });
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || isDemoMode) return;
    setSettingsSaved(false);
    setSettingsError('');
    setSyncNotice('');

    const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');
    if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 15) {
      setSettingsError('WhatsApp number must contain 10 to 15 digits (e.g., 254722403413).');
      setActiveTab('company');
      return;
    }

    setSavingSettings(true);
    const prevDriverFee = getChauffeurDailyFeeKes(settings);
    const nextDriverFee = Math.min(100000, Math.max(0, Number(chauffeurDailyFeeKes) || 0));

    try {
      await setDoc(doc(db, 'settings', 'site'), {
        companyName: companyName.trim().slice(0, 100),
        phoneDisplay: phoneDisplay.trim().slice(0, 30),
        whatsappNumber: cleanWhatsapp.slice(0, 20),
        email: email.trim().slice(0, 120),
        address: address.trim().slice(0, 200),
        mpesaPaybill: mpesaPaybill.trim().slice(0, 20),
        mpesaAccount: mpesaAccount.trim().slice(0, 30),
        vatEnabled,
        vatRatePercent: Math.min(30, Math.max(0, Number(vatRatePercent) || 0)),
        chauffeurDailyFeeKes: nextDriverFee,
        dispatchHours: dispatchHours.trim().slice(0, 100),
        kraPin: kraPin.trim().slice(0, 30),
        bankDetails: bankDetails.trim().slice(0, 200),
        bookingTermsSummary: bookingTermsSummary.trim().slice(0, 400),
        updatedAt: serverTimestamp(),
      });

      if (syncFleetOnSave) {
        const vehiclesSnap = await getDocs(collection(db, 'vehicles'));
        const batch = writeBatch(db);
        const delta = nextDriverFee - prevDriverFee;
        let chauffeurUpdated = 0;

        vehiclesSnap.docs.forEach((vDoc) => {
          const v = vDoc.data() as VehicleDoc;
          if (!v.chauffeurAvailable) return;
          const nextDailyRate =
            v.selfDriveAvailable && (v.selfDriveRateKes ?? 0) > 0
              ? v.selfDriveRateKes + nextDriverFee
              : Math.max(0, (v.dailyRateKes || 0) + delta);
          if (nextDailyRate !== v.dailyRateKes) {
            batch.update(doc(db, 'vehicles', vDoc.id), {
              dailyRateKes: nextDailyRate,
              updatedAt: serverTimestamp(),
            });
            chauffeurUpdated += 1;
          }
        });

        if (chauffeurUpdated > 0) {
          await batch.commit();
          setSyncNotice(
            `Updated chauffeur rates across ${chauffeurUpdated} fleet ${
              chauffeurUpdated === 1 ? 'vehicle' : 'vehicles'
            } using +${formatKes(nextDriverFee)}/day driver fee.`
          );
        } else {
          setSyncNotice(
            `Settings saved. All fleet chauffeur rates already match +${formatKes(nextDriverFee)}/day.`
          );
        }
      }

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 4000);
    } catch (err) {
      setSettingsError(
        err instanceof Error ? err.message : 'Unable to save settings. Check permissions.'
      );
      handleFirestoreError(err, OperationType.WRITE, 'settings/site');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleInviteStaff(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || isDemoMode) return;
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail || !inviteName.trim()) return;
    setInviteMsg('');
    setInviteError('');

    try {
      await setDoc(doc(db, 'staff_invites', cleanEmail), {
        email: cleanEmail,
        fullName: inviteName.trim().slice(0, 100),
        role: inviteRole,
        invitedBy: staffProfile?.email || 'admin',
        createdAt: serverTimestamp(),
      });
      setInviteEmail('');
      setInviteName('');
      setInviteMsg(
        `Authorized ${cleanEmail} as ${inviteRole}. Share the Staff Portal sign-in link so they can activate with Google.`
      );
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : 'Could not save staff invitation.'
      );
      handleFirestoreError(err, OperationType.WRITE, `staff_invites/${cleanEmail}`);
    }
  }

  async function handleUpdateStaffMember(
    member: StaffMemberDoc,
    updates: { role?: StaffRole; status?: StaffStatus }
  ) {
    if (!isAdmin || isDemoMode) return;
    try {
      await updateDoc(doc(db, 'staff', member.uid), {
        fullName: member.fullName,
        role: updates.role || member.role,
        status: updates.status || member.status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `staff/${member.uid}`);
    }
  }

  async function handleRemoveStaffMember(member: StaffMemberDoc) {
    if (!isAdmin || isDemoMode || member.email === BOOTSTRAP_ADMIN_EMAIL) return;
    try {
      await deleteDoc(doc(db, 'staff', member.uid));
      setConfirmRemoveUid(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `staff/${member.uid}`);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!isAdmin || isDemoMode) return;
    try {
      await deleteDoc(doc(db, 'staff_invites', inviteId));
      setConfirmRevokeId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `staff_invites/${inviteId}`);
    }
  }

  function handleExportBackupJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: {
        companyName,
        phoneDisplay,
        whatsappNumber,
        email,
        address,
        dispatchHours,
        mpesaPaybill,
        mpesaAccount,
        vatEnabled,
        vatRatePercent,
        chauffeurDailyFeeKes: Math.min(100000, Math.max(0, Number(chauffeurDailyFeeKes) || 0)),
        kraPin,
        bankDetails,
        bookingTermsSummary,
      },
      fleetCount: fleetVehicles.length,
      fleet: fleetVehicles.map((v) => ({
        id: v.id,
        name: v.name,
        registrationPlate: v.registrationPlate,
        category: v.category,
        status: v.status,
        selfDriveAvailable: v.selfDriveAvailable,
        chauffeurAvailable: v.chauffeurAvailable,
        selfDriveRateKes: v.selfDriveRateKes,
        dailyRateKes: v.dailyRateKes,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kechas-settings-fleet-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const portalLoginUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : '/admin/login';

  const previewWaDigits = whatsappNumber.replace(/\D/g, '') || SITE_CONFIG.whatsappNumber;
  const previewWaHref = `https://wa.me/${previewWaDigits}?text=${encodeURIComponent(
    `Habari ${companyName || 'Kechas Agencies'}! Testing Kisumu dispatch configuration.`
  )}`;

  const tabs: { id: SettingsTab; label: string; Icon: typeof Building2; count?: number }[] = [
    { id: 'company', label: 'Company & Dispatch', Icon: Building2 },
    { id: 'pricing', label: 'Fleet Pricing & Billing', Icon: Calculator },
    { id: 'staff', label: 'Staff & Access Control', Icon: Users, count: staffList.length },
    { id: 'policies', label: 'Invoices & Policies', Icon: FileText },
  ];

  return (
    <AdminLayout title="Settings, Pricing Rules & Staff Access" breadcrumb="Settings & Staff">
      <div className="space-y-6">
        {!isAdmin && (
          <div className="p-4 rounded-md bg-[#FFFBEB] border border-[#D97706]/30 flex items-center gap-3 text-xs sm:text-sm text-[#92400E]">
            <ShieldAlert className="w-5 h-5 shrink-0 text-[#D97706]" />
            <span>
              You are signed in as a <strong>Dispatcher</strong>. Viewing company details and rate
              rules in read-only mode. Only an Administrator can modify settings or manage staff.
            </span>
          </div>
        )}

        {/* Top Live Snapshot Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[#111827]/10 bg-white p-4 space-y-1">
            <span className="text-xs font-medium text-[#4B5563]">Dispatch Hotline &amp; Paybill</span>
            <div className="font-mono text-lg font-semibold text-[#111827] tabular-nums">
              {phoneDisplay}
            </div>
            <p className="text-xs font-mono text-[#4B5563] tabular-nums">
              Paybill {mpesaPaybill} · {mpesaAccount}
            </p>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-4 space-y-1">
            <span className="text-xs font-medium text-[#4B5563]">Chauffeur / Driver Rate</span>
            <div className="font-mono text-lg font-semibold text-[#194793] tabular-nums">
              + {formatKes(Number(chauffeurDailyFeeKes) || 0)} / day
            </div>
            <p className="text-xs text-[#4B5563]">Added on top of base daily car rate</p>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-4 space-y-1">
            <span className="text-xs font-medium text-[#4B5563]">Billing &amp; Kenya VAT</span>
            <div className="font-mono text-lg font-semibold text-[#111827] tabular-nums">
              {vatEnabled ? `${vatRatePercent}% VAT Active` : 'VAT Exempt / Off'}
            </div>
            <p className="text-xs font-mono text-[#4B5563] truncate">
              KRA PIN: {kraPin || 'Not set'}
            </p>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-4 space-y-1">
            <span className="text-xs font-medium text-[#4B5563]">Authorized Portal Team</span>
            <div className="font-mono text-lg font-semibold text-[#111827] tabular-nums">
              {isAdmin ? `${activeStaffCount} Active Staff` : 'Admin Restricted'}
            </div>
            <p className="text-xs text-[#4B5563] tabular-nums">
              {isAdmin
                ? `${adminCount} admin · ${dispatcherCount} dispatcher · ${invites.length} invites`
                : 'Contact admin to manage staff access'}
            </p>
          </div>
        </section>

        {/* Segmented Control Tab Bar */}
        <div className="border-b border-[#111827]/12 bg-white rounded-t-lg px-2 sm:px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map(({ id, label, Icon, count }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#194793] text-[#194793] font-semibold'
                      : 'border-transparent text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                  {typeof count === 'number' && isAdmin && (
                    <span className="font-mono text-[11px] text-[#4B5563] tabular-nums">
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Feedback Banners */}
        {(settingsSaved || syncNotice || settingsError) && (
          <div className="space-y-2">
            {settingsError && (
              <div
                role="alert"
                className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#C8231D]/30 text-xs sm:text-sm text-[#991B1B]"
              >
                {settingsError}
              </div>
            )}
            {(settingsSaved || syncNotice) && (
              <div className="p-3.5 rounded-md bg-[#F0FDF4] border border-[#16A34A]/25 text-xs sm:text-sm text-[#166534] flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{syncNotice || 'All configuration changes saved and published live.'}</span>
              </div>
            )}
          </div>
        )}

        {/* Settings Form Tabs (Company, Pricing, Policies) */}
        {activeTab !== 'staff' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* TAB 1: Company & Dispatch */}
            {activeTab === 'company' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 rounded-lg border border-[#111827]/10 bg-white p-6 space-y-5">
                  <div className="border-b border-[#111827]/10 pb-3">
                    <h2 className="font-serif text-xl text-[#111827]">
                      Company Identity &amp; Kisumu Dispatch Contact
                    </h2>
                    <p className="text-xs text-[#4B5563] mt-0.5">
                      Changes publish immediately to the public header, footer, WhatsApp links, and
                      KIS Airport contact cards.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1 sm:col-span-2">
                      <label htmlFor="set-company" className="text-[#4B5563]">
                        Brand / Company Name *
                      </label>
                      <input
                        id="set-company"
                        type="text"
                        required
                        disabled={!isAdmin}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] disabled:opacity-70"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="set-phone" className="text-[#4B5563]">
                        Dispatch Phone Display *
                      </label>
                      <input
                        id="set-phone"
                        type="text"
                        required
                        disabled={!isAdmin}
                        value={phoneDisplay}
                        onChange={(e) => setPhoneDisplay(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-sm text-[#111827] disabled:opacity-70"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="set-wa" className="text-[#4B5563]">
                        WhatsApp Number (254...) *
                      </label>
                      <input
                        id="set-wa"
                        type="text"
                        required
                        disabled={!isAdmin}
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="254722403413"
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-sm text-[#111827] disabled:opacity-70"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="set-email" className="text-[#4B5563]">
                        Official Email *
                      </label>
                      <input
                        id="set-email"
                        type="email"
                        required
                        disabled={!isAdmin}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] disabled:opacity-70"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="set-hours" className="text-[#4B5563]">
                        Operating &amp; Dispatch Hours
                      </label>
                      <input
                        id="set-hours"
                        type="text"
                        disabled={!isAdmin}
                        maxLength={100}
                        value={dispatchHours}
                        onChange={(e) => setDispatchHours(e.target.value)}
                        placeholder="24/7 Dispatch & KIS Airport Pickups"
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] disabled:opacity-70"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label htmlFor="set-address" className="text-[#4B5563]">
                        Kisumu Physical Office Address *
                      </label>
                      <input
                        id="set-address"
                        type="text"
                        required
                        disabled={!isAdmin}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] disabled:opacity-70"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Public Card & Diagnostics */}
                <aside className="lg:col-span-5 rounded-lg border border-[#194793]/20 bg-[#EFF3F9]/70 p-6 space-y-5">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#C8231D]">
                      Live Public Contact Card Preview
                    </p>
                    <h3 className="font-serif text-xl text-[#111827]">
                      {companyName || 'Kechas Agencies'}
                    </h3>
                    <p className="text-xs text-[#4B5563]">{address}</p>
                  </div>

                  <div className="p-4 rounded-md bg-white border border-[#111827]/10 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#4B5563]">Phone</span>
                      <span className="font-mono font-semibold text-[#111827] tabular-nums">
                        {phoneDisplay}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#4B5563]">WhatsApp Route</span>
                      <span className="font-mono text-[#194793] tabular-nums">
                        wa.me/{previewWaDigits}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#4B5563]">Email</span>
                      <span className="text-[#111827] truncate">{email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#4B5563]">Dispatch Hours</span>
                      <span className="text-[#111827] text-right">{dispatchHours}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => copyWithFeedback('phone', phoneDisplay)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md border border-[#194793]/25 bg-white text-xs font-semibold text-[#194793] hover:bg-[#F9FAFB] whitespace-nowrap"
                    >
                      {copiedKey === 'phone' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'phone' ? 'Phone Copied' : 'Copy Dispatch Phone'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyWithFeedback(
                          'paybill',
                          `Paybill: ${mpesaPaybill} | Account: ${mpesaAccount}`
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md border border-[#194793]/25 bg-white text-xs font-semibold text-[#194793] hover:bg-[#F9FAFB] whitespace-nowrap"
                    >
                      {copiedKey === 'paybill' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'paybill' ? 'Paybill Copied' : 'Copy Paybill Info'}</span>
                    </button>
                  </div>

                  <a
                    href={previewWaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Test WhatsApp Dispatch Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </aside>
              </div>
            )}

            {/* TAB 2: Fleet Pricing & Billing */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chauffeur Fee Card */}
                  <div className="rounded-lg border border-[#111827]/10 bg-white p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-[#111827]/10 pb-3">
                      <div>
                        <h2 className="font-serif text-xl text-[#111827]">
                          Chauffeur / Driver Daily Rate
                        </h2>
                        <p className="text-xs text-[#4B5563] mt-0.5">
                          Added automatically to every vehicle’s Self-Drive base rate to compute
                          With-Driver pricing.
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#194793] tabular-nums whitespace-nowrap">
                        +{formatKes(Number(chauffeurDailyFeeKes) || 0)}/d
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label htmlFor="driver-fee-input" className="text-[#4B5563]">
                          Driver Allowance (KES / Day)
                        </label>
                        <input
                          id="driver-fee-input"
                          type="number"
                          min={0}
                          max={100000}
                          step={100}
                          disabled={!isAdmin}
                          value={chauffeurDailyFeeKes}
                          onChange={(e) => setChauffeurDailyFeeKes(Number(e.target.value))}
                          className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono tabular-nums text-sm text-[#111827] disabled:opacity-70"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-[#4B5563]">Quick Presets:</span>
                        {DRIVER_FEE_PRESETS.map((amt) => {
                          const active = Number(chauffeurDailyFeeKes) === amt;
                          return (
                            <button
                              key={amt}
                              type="button"
                              disabled={!isAdmin}
                              onClick={() => setChauffeurDailyFeeKes(amt)}
                              className={`px-2.5 py-1 rounded border font-mono text-xs tabular-nums transition-colors ${
                                active
                                  ? 'bg-[#194793] text-white border-[#194793]'
                                  : 'bg-[#F9FAFB] text-[#111827] border-[#111827]/15 hover:bg-[#EFF3F9]'
                              }`}
                            >
                              {formatKes(amt)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* M-Pesa & Kenya VAT Configuration */}
                  <div className="rounded-lg border border-[#111827]/10 bg-white p-6 space-y-4">
                    <div className="border-b border-[#111827]/10 pb-3">
                      <h2 className="font-serif text-xl text-[#111827]">
                        M-Pesa Paybill &amp; Kenya VAT Configuration
                      </h2>
                      <p className="text-xs text-[#4B5563] mt-0.5">
                        Synced live across booking checkouts, receipts, and corporate tax invoices.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label htmlFor="set-paybill" className="text-[#4B5563]">
                          M-Pesa Paybill Number *
                        </label>
                        <input
                          id="set-paybill"
                          type="text"
                          required
                          disabled={!isAdmin}
                          value={mpesaPaybill}
                          onChange={(e) => setMpesaPaybill(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-sm text-[#111827] disabled:opacity-70"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="set-account" className="text-[#4B5563]">
                          M-Pesa Account Name *
                        </label>
                        <input
                          id="set-account"
                          type="text"
                          required
                          disabled={!isAdmin}
                          value={mpesaAccount}
                          onChange={(e) => setMpesaAccount(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-sm text-[#111827] disabled:opacity-70"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label htmlFor="set-vat" className="text-[#4B5563]">
                          Kenya VAT Rate (%)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="set-vat"
                            type="number"
                            min={0}
                            max={30}
                            disabled={!isAdmin || !vatEnabled}
                            value={vatRatePercent}
                            onChange={(e) => setVatRatePercent(Number(e.target.value))}
                            className="w-24 px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-sm text-[#111827] disabled:opacity-70"
                          />
                          <label className="flex items-center gap-2 text-xs text-[#111827] cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={!isAdmin}
                              checked={vatEnabled}
                              onChange={(e) => setVatEnabled(e.target.checked)}
                            />
                            <span>Enable VAT on invoices</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Fleet Rate Sync Preview */}
                <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#111827]/10 flex flex-wrap items-center justify-between gap-3 bg-[#F9FAFB]">
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg text-[#111827]">
                        Live Fleet Rate Preview ({fleetRatePreview.length} Vehicles)
                      </h3>
                      <label className="flex items-center gap-2 text-xs text-[#111827] cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isAdmin}
                          checked={syncFleetOnSave}
                          onChange={(e) => setSyncFleetOnSave(e.target.checked)}
                        />
                        <span>
                          Automatically sync updated Chauffeur Rates across all fleet vehicles on
                          save
                          {impactedCount > 0 && (
                            <strong className="text-[#194793] ml-1">
                              ({impactedCount} {impactedCount === 1 ? 'vehicle' : 'vehicles'} will
                              update)
                            </strong>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>

                  {fleetRatePreview.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[560px]">
                        <thead>
                          <tr className="border-b border-[#111827]/10 bg-white text-[11px] font-semibold text-[#4B5563]">
                            <th className="py-2.5 px-5">Vehicle &amp; Plate</th>
                            <th className="py-2.5 px-4">Base Self-Drive</th>
                            <th className="py-2.5 px-5">Chauffeur Rate (KES/d)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#111827]/8 text-xs">
                          {fleetRatePreview.map((row) => {
                            const v = row.vehicle;
                            return (
                              <tr
                                key={v.id}
                                className={row.rateChanged ? 'bg-[#EFF3F9]/45' : 'bg-white'}
                              >
                                <td className="py-2.5 px-5">
                                  <span className="font-medium text-[#111827]">{v.name}</span>
                                  <span className="ml-2 font-mono text-[11px] text-[#4B5563]">
                                    {v.registrationPlate}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-mono tabular-nums text-[#4B5563]">
                                  {v.selfDriveAvailable
                                    ? formatKes(v.selfDriveRateKes || 0)
                                    : 'Chauffeur-only'}
                                </td>
                                <td className="py-2.5 px-5 font-mono tabular-nums">
                                  {!v.chauffeurAvailable ? (
                                    <span className="text-[#4B5563]">Self-drive only</span>
                                  ) : row.rateChanged ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-[#4B5563] line-through">
                                        {formatKes(v.dailyRateKes)}
                                      </span>
                                      <ArrowRight className="w-3 h-3 text-[#194793]" />
                                      <strong className="text-[#194793]">
                                        {formatKes(row.nextDailyRate)}
                                      </strong>
                                    </span>
                                  ) : (
                                    <span className="text-[#111827]">{formatKes(v.dailyRateKes)}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Invoices, Tax & Policies */}
            {activeTab === 'policies' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 rounded-lg border border-[#111827]/10 bg-white p-6 space-y-5">
                  <div className="border-b border-[#111827]/10 pb-3">
                    <h2 className="font-serif text-xl text-[#111827]">
                      Corporate Tax, Bank Settlement &amp; Booking Terms
                    </h2>
                    <p className="text-xs text-[#4B5563] mt-0.5">
                      Printed automatically on NGO/corporate PDF invoices and shown inside customer
                      quote estimates.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="set-kra" className="text-[#4B5563]">
                          Company KRA PIN
                        </label>
                        <input
                          id="set-kra"
                          type="text"
                          disabled={!isAdmin}
                          maxLength={30}
                          value={kraPin}
                          onChange={(e) => setKraPin(e.target.value)}
                          placeholder="P051940221K"
                          className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono uppercase text-sm text-[#111827] disabled:opacity-70"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="set-bank" className="text-[#4B5563]">
                          Corporate Bank Transfer Account
                        </label>
                        <input
                          id="set-bank"
                          type="text"
                          disabled={!isAdmin}
                          maxLength={200}
                          value={bankDetails}
                          onChange={(e) => setBankDetails(e.target.value)}
                          placeholder="KCB Bank Kisumu · Acc: 1204889120"
                          className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] disabled:opacity-70"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="set-terms" className="text-[#4B5563]">
                          Standard Booking &amp; Handover Terms Summary
                        </label>
                        <span className="font-mono text-[11px] text-[#4B5563] tabular-nums">
                          {bookingTermsSummary.length} / 400
                        </span>
                      </div>
                      <textarea
                        id="set-terms"
                        rows={4}
                        maxLength={400}
                        disabled={!isAdmin}
                        value={bookingTermsSummary}
                        onChange={(e) => setBookingTermsSummary(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] disabled:opacity-70"
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Footer Preview & Backup Export */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="rounded-lg border border-[#111827]/10 bg-white p-6 space-y-3">
                    <p className="text-xs font-semibold text-[#C8231D]">
                      Printed Invoice Footer Preview
                    </p>
                    <div className="p-4 rounded-md bg-[#F9FAFB] border border-[#111827]/10 text-xs space-y-1.5 text-[#4B5563]">
                      <p className="font-semibold text-[#111827]">
                        {companyName} {kraPin ? `· KRA PIN: ${kraPin}` : ''}
                      </p>
                      <p className="font-mono text-[#194793]">
                        M-Pesa Paybill: {mpesaPaybill} · Account: {mpesaAccount}
                      </p>
                      {bankDetails && <p>{bankDetails}</p>}
                      {bookingTermsSummary && (
                        <p className="pt-1.5 border-t border-[#111827]/10 text-[11px] leading-relaxed">
                          {bookingTermsSummary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#111827]/10 bg-white p-6 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg text-[#111827]">
                        Configuration &amp; Fleet Snapshot Backup
                      </h3>
                      <p className="text-xs text-[#4B5563]">
                        Export your current pricing rules, M-Pesa billing setup, and{' '}
                        {fleetVehicles.length} fleet vehicle rates as a clean JSON archive.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportBackupJson}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#194793]/25 bg-[#EFF3F9] text-xs font-semibold text-[#194793] hover:bg-[#DCE5F2]"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download JSON Backup</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Shared Save Footer for Company, Pricing, Policies */}
            {isAdmin && (
              <div className="rounded-lg border border-[#111827]/10 bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-[#4B5563]">
                  Driver Fee:{' '}
                  <span className="font-mono font-semibold text-[#111827] tabular-nums">
                    +{formatKes(Number(chauffeurDailyFeeKes) || 0)}/d
                  </span>{' '}
                  · Paybill:{' '}
                  <span className="font-mono font-semibold text-[#111827] tabular-nums">
                    {mpesaPaybill}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672] disabled:opacity-60 whitespace-nowrap"
                >
                  {savingSettings
                    ? 'Saving & Syncing Fleet...'
                    : syncFleetOnSave
                      ? 'Save All Settings & Sync Fleet'
                      : 'Save Settings Only'}
                </button>
              </div>
            )}
          </form>
        )}

        {/* TAB 3: Staff & Access Control */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {!isAdmin ? (
              <div className="rounded-lg border border-[#111827]/10 bg-white p-8 text-center space-y-2">
                <Lock className="w-7 h-7 text-[#194793] mx-auto" />
                <h2 className="font-serif text-xl text-[#111827]">
                  Administrator Access Required
                </h2>
                <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto">
                  Staff account management, role assignments, and Google Sign-In invitations are
                  restricted to Administrator accounts.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Authorized Staff Directory */}
                  <div className="lg:col-span-7 rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#111827]/10 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="font-serif text-xl text-[#111827]">
                            Authorized Staff Accounts
                          </h2>
                          <p className="text-xs text-[#4B5563]">
                            Active Admin and Dispatcher accounts permitted to enter `/admin/*`.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyWithFeedback('loginLink', portalLoginUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#194793]/25 bg-[#EFF3F9] text-xs font-semibold text-[#194793] hover:bg-[#DCE5F2] whitespace-nowrap"
                        >
                          {copiedKey === 'loginLink' ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {copiedKey === 'loginLink' ? 'Login Link Copied' : 'Copy Staff Sign-In Link'}
                          </span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                            placeholder="Search staff by name or email..."
                            className="w-full pl-8 pr-3 py-2 rounded-md border border-[#111827]/15 bg-[#F9FAFB]"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {(['all', 'admin', 'dispatcher'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setStaffRoleFilter(r)}
                              className={`px-3 py-2 rounded-md border text-xs font-medium capitalize transition-colors ${
                                staffRoleFilter === r
                                  ? 'bg-[#194793] text-white border-[#194793]'
                                  : 'bg-[#F9FAFB] text-[#4B5563] border-[#111827]/15 hover:text-[#111827]'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-[#111827]/10">
                      {filteredStaff.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#4B5563]">
                          No matching staff accounts found.
                        </div>
                      ) : (
                        filteredStaff.map((m) => {
                          const isPrimary = m.email === BOOTSTRAP_ADMIN_EMAIL;
                          const isConfirming = confirmRemoveUid === m.uid;

                          return (
                            <div
                              key={m.uid}
                              className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-md bg-[#EFF3F9] border border-[#194793]/20 text-[#194793] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                                  {getInitials(m.fullName)}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-medium text-[#111827] truncate">
                                    {m.fullName}
                                    {isPrimary && (
                                      <span className="ml-2 text-[11px] font-semibold text-[#194793]">
                                        · Primary Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono text-[11px] text-[#4B5563] truncate">
                                    {m.email}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <select
                                  aria-label={`Role for ${m.fullName}`}
                                  value={m.role}
                                  disabled={isPrimary}
                                  onChange={(e) =>
                                    handleUpdateStaffMember(m, {
                                      role: e.target.value as StaffRole,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded border border-[#111827]/20 bg-[#F9FAFB] text-xs disabled:opacity-65"
                                >
                                  <option value="admin">admin</option>
                                  <option value="dispatcher">dispatcher</option>
                                </select>
                                <select
                                  aria-label={`Status for ${m.fullName}`}
                                  value={m.status}
                                  disabled={isPrimary}
                                  onChange={(e) =>
                                    handleUpdateStaffMember(m, {
                                      status: e.target.value as StaffStatus,
                                    })
                                  }
                                  className={`px-2.5 py-1.5 rounded border text-xs disabled:opacity-65 ${
                                    m.status === 'active'
                                      ? 'border-[#16A34A]/30 bg-[#F0FDF4] text-[#166534]'
                                      : 'border-[#C8231D]/30 bg-[#FEF2F2] text-[#991B1B]'
                                  }`}
                                >
                                  <option value="active">active</option>
                                  <option value="disabled">disabled</option>
                                </select>

                                {!isPrimary &&
                                  (isConfirming ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveStaffMember(m)}
                                        className="px-2 py-1 rounded bg-[#C8231D] text-white text-[11px] font-semibold"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmRemoveUid(null)}
                                        className="px-2 py-1 rounded border border-[#111827]/20 text-[11px] text-[#4B5563]"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmRemoveUid(m.uid)}
                                      className="p-1.5 rounded border border-[#C8231D]/25 text-[#C8231D] hover:bg-[#FEF2F2]"
                                      aria-label={`Remove ${m.email}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right: Invite Form & Pending Invitations */}
                  <div className="lg:col-span-5 space-y-5">
                    <form
                      onSubmit={handleInviteStaff}
                      className="rounded-lg border border-[#111827]/10 bg-white p-5 space-y-4"
                    >
                      <div>
                        <h2 className="font-serif text-lg text-[#111827]">
                          Invite Staff by Google Email
                        </h2>
                        <p className="text-xs text-[#4B5563]">
                          Pre-authorize a dispatcher or admin. Their role activates automatically on
                          first Google Sign-In.
                        </p>
                      </div>
                      <div className="space-y-1 text-xs">
                        <label htmlFor="inv-name" className="text-[#4B5563]">
                          Staff Full Name *
                        </label>
                        <input
                          id="inv-name"
                          type="text"
                          required
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="e.g., Grace Otieno"
                          className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <label htmlFor="inv-email" className="text-[#4B5563]">
                          Google Email Address *
                        </label>
                        <input
                          id="inv-email"
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="staff@gmail.com"
                          className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <label htmlFor="inv-role" className="text-[#4B5563]">
                          Assigned Role
                        </label>
                        <select
                          id="inv-role"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                          className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                        >
                          <option value="dispatcher">
                            dispatcher (Bookings, Fleet, Drivers, Finance)
                          </option>
                          <option value="admin">
                            admin (Full Control + Settings &amp; Staff)
                          </option>
                        </select>
                      </div>

                      {inviteError && (
                        <p role="alert" className="text-xs text-[#C8231D]">
                          {inviteError}
                        </p>
                      )}
                      {inviteMsg && (
                        <div className="p-2.5 rounded bg-[#F0FDF4] border border-[#16A34A]/25 text-xs text-[#166534]">
                          {inviteMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Authorize Staff Email</span>
                      </button>
                    </form>

                    {invites.length > 0 && (
                      <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#111827]/10 text-xs font-semibold text-[#111827]">
                          Pre-Authorized Google Emails ({invites.length})
                        </div>
                        <div className="divide-y divide-[#111827]/10 text-xs">
                          {invites.map((inv) => {
                            const confirmingRevoke = confirmRevokeId === inv.id;
                            return (
                              <div
                                key={inv.id}
                                className="px-4 py-2.5 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-[#111827] truncate">
                                    {inv.fullName}
                                  </p>
                                  <p className="font-mono text-[11px] text-[#4B5563] truncate">
                                    {inv.email} · {inv.role}
                                  </p>
                                </div>
                                {confirmingRevoke ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeInvite(inv.id)}
                                      className="px-2 py-1 rounded bg-[#C8231D] text-white text-[11px] font-semibold"
                                    >
                                      Revoke
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmRevokeId(null)}
                                      className="px-2 py-1 rounded border border-[#111827]/20 text-[11px] text-[#4B5563]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRevokeId(inv.id)}
                                    className="p-1.5 rounded border border-[#C8231D]/25 text-[#C8231D] hover:bg-[#FEF2F2] shrink-0"
                                    aria-label={`Revoke ${inv.email}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Role Permissions Matrix */}
                <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#111827]/10 bg-[#F9FAFB] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#194793]" />
                    <h3 className="font-serif text-lg text-[#111827]">
                      Portal Role Permissions Reference
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[560px]">
                      <thead>
                        <tr className="border-b border-[#111827]/10 text-[11px] font-semibold text-[#4B5563]">
                          <th className="py-2.5 px-5">Operations Module</th>
                          <th className="py-2.5 px-5">Administrator (`admin`)</th>
                          <th className="py-2.5 px-5">Dispatcher (`dispatcher`)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#111827]/8 text-xs">
                        {PERMISSIONS_MATRIX.map((row) => (
                          <tr key={row.module}>
                            <td className="py-2.5 px-5 font-medium text-[#111827]">{row.module}</td>
                            <td className="py-2.5 px-5 text-[#194793] font-medium">{row.admin}</td>
                            <td className="py-2.5 px-5 text-[#4B5563]">{row.dispatcher}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
