import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CarFront,
  Check,
  Clock,
  MessageCircle,
  PlaneLanding,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoPortal } from '../../contexts/DemoPortalContext';
import { db } from '../../lib/firebase';
import {
  BookingDoc,
  DriverDoc,
  InquiryDoc,
  TransactionDoc,
  VehicleDoc,
} from '../../lib/adminTypes';
import { FleetCategoryId, formatKes } from '../../data/fleet';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';

type DispatchFeedTab = 'today' | 'upcoming' | 'active' | 'pending' | 'inquiries';
type TimelineWindow = 7 | 14;

function getLocalIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateList(
  days: number
): { iso: string; dayLabel: string; numLabel: string; isToday: boolean }[] {
  const list: { iso: string; dayLabel: string; numLabel: string; isToday: boolean }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = getLocalIsoDate(i);
    list.push({
      iso,
      dayLabel: d.toLocaleDateString('en-KE', { weekday: 'short' }).slice(0, 2),
      numLabel: String(d.getDate()),
      isToday: i === 0,
    });
  }
  return list;
}

function daysUntil(dateStr?: string): number {
  if (!dateStr) return 999;
  const target = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(target.getTime())) return 999;
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function shortBookingCode(ref: string): string {
  const parts = ref.split('-');
  return `#${parts[parts.length - 1] || ref}`;
}

function cleanWhatsAppDigits(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  return digits;
}

export default function AdminOverviewPage() {
  const { isAdmin, isDemoMode, staffProfile } = useAuth();
  const demo = useDemoPortal();
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [inquiries, setInquiries] = useState<InquiryDoc[]>([]);
  const [transactions, setTransactions] = useState<TransactionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [feedTab, setFeedTab] = useState<DispatchFeedTab>('today');
  const [feedSearch, setFeedSearch] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [markingInquiryId, setMarkingInquiryId] = useState<string | null>(null);
  const [timelineDays, setTimelineDays] = useState<TimelineWindow>(14);
  const [categoryFilter, setCategoryFilter] = useState<'all' | FleetCategoryId>('all');
  const [timelineQuery, setTimelineQuery] = useState('');

  useEffect(() => {
    if (isDemoMode) {
      setBookings(demo.bookings);
      setVehicles(demo.vehicles);
      setDrivers(demo.drivers);
      setInquiries(demo.inquiries);
      setTransactions(demo.transactions);
      setLoading(false);
      return;
    }

    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        setBookings(snap.docs.map((d) => ({ ...(d.data() as BookingDoc), id: d.id })));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
    );

    const unsubVehicles = onSnapshot(
      collection(db, 'vehicles'),
      (snap) => {
        setVehicles(snap.docs.map((d) => ({ ...(d.data() as VehicleDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'vehicles')
    );

    const unsubDrivers = onSnapshot(
      collection(db, 'drivers'),
      (snap) => {
        setDrivers(snap.docs.map((d) => ({ ...(d.data() as DriverDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'drivers')
    );

    const unsubInquiries = onSnapshot(
      collection(db, 'inquiries'),
      (snap) => {
        setInquiries(snap.docs.map((d) => ({ ...(d.data() as InquiryDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries')
    );

    if (!isAdmin) {
      setTransactions([]);
      return () => {
        unsubBookings();
        unsubVehicles();
        unsubDrivers();
        unsubInquiries();
      };
    }

    const unsubTransactions = onSnapshot(
      collection(db, 'transactions'),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ ...(d.data() as TransactionDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
    );

    return () => {
      unsubBookings();
      unsubVehicles();
      unsubDrivers();
      unsubInquiries();
      unsubTransactions();
    };
  }, [
    isAdmin,
    isDemoMode,
    demo.bookings,
    demo.vehicles,
    demo.drivers,
    demo.inquiries,
    demo.transactions,
  ]);

  const todayIso = getLocalIsoDate(0);
  const next7Iso = getLocalIsoDate(7);
  const currentMonthPrefix = todayIso.slice(0, 7);
  const currentMonthLabel = new Date().toLocaleDateString('en-KE', {
    month: 'short',
    year: 'numeric',
  });
  const todayReadable = new Date().toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => getDateList(timelineDays), [timelineDays]);

  const fleetCounts = useMemo(() => {
    const operational = vehicles.filter((v) => v.status !== 'Inactive');
    const outOnRoad = operational.filter(
      (v) =>
        v.status === 'Booked' ||
        bookings.some((b) => b.vehicleId === v.id && b.status === 'Active')
    ).length;
    const inWorkshop = operational.filter((v) => v.status === 'In Maintenance').length;
    const readyNow = Math.max(0, operational.length - outOnRoad - inWorkshop);
    const utilizationPct =
      operational.length > 0 ? Math.round((outOnRoad / operational.length) * 100) : 0;
    return {
      totalOperational: operational.length,
      outOnRoad,
      inWorkshop,
      readyNow,
      utilizationPct,
    };
  }, [vehicles, bookings]);

  const pendingBookings = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'Pending')
      .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate));
  }, [bookings]);

  const activeTrips = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'Active')
      .sort((a, b) => a.returnDate.localeCompare(b.returnDate));
  }, [bookings]);

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter(
        (b) =>
          b.status !== 'Cancelled' &&
          b.status !== 'Completed' &&
          b.pickupDate > todayIso &&
          b.pickupDate <= next7Iso
      )
      .sort(
        (a, b) =>
          a.pickupDate.localeCompare(b.pickupDate) ||
          (a.pickupTime || '').localeCompare(b.pickupTime || '')
      );
  }, [bookings, todayIso, next7Iso]);

  const financeSummary = useMemo(() => {
    let monthlyCollected = 0;
    let totalCollected = 0;
    let outstanding = 0;
    let unpaidCount = 0;

    for (const tx of transactions) {
      totalCollected += tx.amountKes || 0;
      if ((tx.paidAt || '').startsWith(currentMonthPrefix)) {
        monthlyCollected += tx.amountKes || 0;
      }
    }

    if (transactions.length === 0) {
      for (const b of bookings) {
        if (b.status === 'Cancelled') continue;
        totalCollected += b.amountPaidKes || 0;
        if ((b.pickupDate || '').startsWith(currentMonthPrefix)) {
          monthlyCollected += b.amountPaidKes || 0;
        }
      }
    }

    for (const b of bookings) {
      if (b.status === 'Cancelled') continue;
      const bal = Math.max(0, (b.quotedAmountKes || 0) - (b.amountPaidKes || 0));
      if (bal > 0) {
        outstanding += bal;
        unpaidCount += 1;
      }
    }

    const totalReceivable = monthlyCollected + outstanding;
    const collectionRatioPct =
      totalReceivable > 0 ? Math.round((monthlyCollected / totalReceivable) * 100) : 100;

    return {
      monthlyCollected,
      totalCollected,
      outstanding,
      unpaidCount,
      collectionRatioPct,
    };
  }, [bookings, transactions, currentMonthPrefix]);

  const complianceAlerts = useMemo(() => {
    const items: {
      id: string;
      kind: 'vehicle' | 'driver';
      title: string;
      subtitle: string;
      reason: string;
      urgent: boolean;
      linkTo: string;
    }[] = [];

    for (const v of vehicles) {
      if (v.status === 'Inactive') continue;
      const kmLeft = (v.nextServiceKm || 0) - (v.currentOdometerKm || 0);
      const serviceDays = daysUntil(v.nextServiceDate);
      const insDays = daysUntil(v.insuranceExpiryDate);
      const ntsaDays = daysUntil(v.ntsaExpiryDate);

      if (v.status === 'In Maintenance') {
        items.push({
          id: `veh-maint-${v.id}`,
          kind: 'vehicle',
          title: v.name,
          subtitle: v.registrationPlate,
          reason: 'Currently in workshop maintenance',
          urgent: true,
          linkTo: '/admin/fleet',
        });
      } else if (insDays <= 21) {
        items.push({
          id: `veh-ins-${v.id}`,
          kind: 'vehicle',
          title: v.name,
          subtitle: v.registrationPlate,
          reason:
            insDays <= 0
              ? `Insurance expired (${v.insuranceExpiryDate})`
              : `Insurance expires in ${insDays}d (${v.insuranceExpiryDate})`,
          urgent: insDays <= 7,
          linkTo: '/admin/fleet',
        });
      } else if (ntsaDays <= 21) {
        items.push({
          id: `veh-ntsa-${v.id}`,
          kind: 'vehicle',
          title: v.name,
          subtitle: v.registrationPlate,
          reason:
            ntsaDays <= 0
              ? `NTSA inspection expired (${v.ntsaExpiryDate})`
              : `NTSA due in ${ntsaDays}d (${v.ntsaExpiryDate})`,
          urgent: ntsaDays <= 7,
          linkTo: '/admin/fleet',
        });
      } else if (kmLeft <= 1000 || serviceDays <= 14) {
        items.push({
          id: `veh-svc-${v.id}`,
          kind: 'vehicle',
          title: v.name,
          subtitle: v.registrationPlate,
          reason:
            kmLeft <= 0
              ? `Service overdue by ${Math.abs(kmLeft).toLocaleString()} km`
              : `Service due in ${kmLeft.toLocaleString()} km (${v.nextServiceDate})`,
          urgent: kmLeft <= 250 || serviceDays <= 3,
          linkTo: '/admin/fleet',
        });
      }
    }

    for (const d of drivers) {
      const dlDays = daysUntil(d.licenseExpiryDate);
      if (dlDays <= 30) {
        items.push({
          id: `drv-dl-${d.id}`,
          kind: 'driver',
          title: d.fullName,
          subtitle: d.phone,
          reason:
            dlDays <= 0
              ? `Driving license expired (${d.licenseExpiryDate})`
              : `DL expires in ${dlDays}d (${d.licenseExpiryDate})`,
          urgent: dlDays <= 7,
          linkTo: '/admin/drivers',
        });
      }
    }

    return items.sort((a, b) => Number(b.urgent) - Number(a.urgent));
  }, [vehicles, drivers]);

  const todaysFeed = useMemo(() => {
    const events: {
      id: string;
      bookingId: string;
      bookingRef: string;
      kind: 'Pickup' | 'Return';
      time: string;
      clientName: string;
      clientPhone: string;
      vehicleName: string;
      registrationPlate?: string;
      driverName?: string;
      location: string;
      isAirport: boolean;
      flightNumber?: string;
      status: string;
      balanceKes: number;
    }[] = [];

    for (const b of bookings) {
      if (b.status === 'Cancelled') continue;
      const balanceKes = Math.max(0, (b.quotedAmountKes || 0) - (b.amountPaidKes || 0));

      if (b.pickupDate === todayIso) {
        events.push({
          id: `${b.id}-pickup`,
          bookingId: b.id,
          bookingRef: b.bookingRef,
          kind: 'Pickup',
          time: b.pickupTime || '08:00',
          clientName: b.clientName,
          clientPhone: b.clientPhone,
          vehicleName: b.vehicleName,
          registrationPlate: b.registrationPlate,
          driverName: b.driverName,
          location: `${b.pickupLocation} → ${b.destination}`,
          isAirport:
            b.pickupLocation.toLowerCase().includes('airport') ||
            b.pickupLocation.toLowerCase().includes('kis') ||
            b.serviceType === 'airport-transfer',
          flightNumber: b.flightNumber,
          status: b.status,
          balanceKes,
        });
      }

      if (b.returnDate === todayIso && b.pickupDate !== todayIso) {
        events.push({
          id: `${b.id}-return`,
          bookingId: b.id,
          bookingRef: b.bookingRef,
          kind: 'Return',
          time: b.returnTime || '17:00',
          clientName: b.clientName,
          clientPhone: b.clientPhone,
          vehicleName: b.vehicleName,
          registrationPlate: b.registrationPlate,
          driverName: b.driverName,
          location: `Return from ${b.destination}`,
          isAirport: false,
          status: b.status,
          balanceKes,
        });
      }
    }
    return events.sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, todayIso]);

  const normalizedFeedQuery = feedSearch.trim().toLowerCase();

  const filteredTodayFeed = useMemo(() => {
    if (!normalizedFeedQuery) return todaysFeed;
    return todaysFeed.filter((ev) =>
      `${ev.bookingRef} ${ev.clientName} ${ev.vehicleName} ${ev.registrationPlate || ''} ${ev.location} ${ev.driverName || ''}`
        .toLowerCase()
        .includes(normalizedFeedQuery)
    );
  }, [todaysFeed, normalizedFeedQuery]);

  const filteredUpcomingBookings = useMemo(() => {
    if (!normalizedFeedQuery) return upcomingBookings;
    return upcomingBookings.filter((b) =>
      `${b.bookingRef} ${b.clientName} ${b.vehicleName} ${b.registrationPlate || ''} ${b.pickupLocation} ${b.destination}`
        .toLowerCase()
        .includes(normalizedFeedQuery)
    );
  }, [upcomingBookings, normalizedFeedQuery]);

  const filteredActiveTrips = useMemo(() => {
    if (!normalizedFeedQuery) return activeTrips;
    return activeTrips.filter((b) =>
      `${b.bookingRef} ${b.clientName} ${b.vehicleName} ${b.registrationPlate || ''} ${b.destination} ${b.driverName || ''}`
        .toLowerCase()
        .includes(normalizedFeedQuery)
    );
  }, [activeTrips, normalizedFeedQuery]);

  const filteredPendingBookings = useMemo(() => {
    if (!normalizedFeedQuery) return pendingBookings;
    return pendingBookings.filter((b) =>
      `${b.bookingRef} ${b.clientName} ${b.vehicleName} ${b.pickupLocation} ${b.destination}`
        .toLowerCase()
        .includes(normalizedFeedQuery)
    );
  }, [pendingBookings, normalizedFeedQuery]);

  const openInquiries = useMemo(() => {
    return inquiries
      .filter((inq) => inq.status === 'New' || inq.status === 'Contacted')
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'New' ? -1 : 1;
        return b.reference.localeCompare(a.reference);
      });
  }, [inquiries]);

  const filteredOpenInquiries = useMemo(() => {
    if (!normalizedFeedQuery) return openInquiries;
    return openInquiries.filter((inq) =>
      `${inq.reference} ${inq.name} ${inq.organization || ''} ${inq.topic} ${inq.vehicleClass} ${inq.message}`
        .toLowerCase()
        .includes(normalizedFeedQuery)
    );
  }, [openInquiries, normalizedFeedQuery]);

  const driverStats = useMemo(() => {
    const available = drivers.filter((d) => d.status === 'Available');
    const onTrip = drivers.filter((d) => d.status === 'On Trip');
    const offDuty = drivers.filter((d) => d.status === 'Off Duty');
    return { available, onTrip, offDuty };
  }, [drivers]);

  const filteredTimelineVehicles = useMemo(() => {
    const q = timelineQuery.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (v.status === 'Inactive') return false;
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (q && !`${v.name} ${v.registrationPlate}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [vehicles, categoryFilter, timelineQuery]);

  function getSlotBooking(vehicleId: string, dateIso: string): BookingDoc | undefined {
    return bookings.find(
      (b) =>
        b.vehicleId === vehicleId &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed' &&
        b.pickupDate <= dateIso &&
        b.returnDate >= dateIso
    );
  }

  async function handleQuickConfirm(bk: BookingDoc) {
    setConfirmingId(bk.id);
    try {
      if (isDemoMode) {
        demo.setBookings((prev) =>
          prev.map((item) => (item.id === bk.id ? { ...item, status: 'Confirmed' } : item))
        );
        return;
      }
      await updateDoc(doc(db, 'bookings', bk.id), {
        status: 'Confirmed',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bk.id}`);
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleMarkInquiryContacted(inq: InquiryDoc) {
    setMarkingInquiryId(inq.id);
    const handler = (staffProfile?.fullName || staffProfile?.email || 'Kisumu Dispatch').slice(
      0,
      120
    );
    try {
      if (isDemoMode) {
        demo.setInquiries((prev) =>
          prev.map((item) =>
            item.id === inq.id ? { ...item, status: 'Contacted', handledBy: handler } : item
          )
        );
        return;
      }
      await updateDoc(doc(db, 'inquiries', inq.id), {
        status: 'Contacted',
        handledBy: handler,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `inquiries/${inq.id}`);
    } finally {
      setMarkingInquiryId(null);
    }
  }

  const pendingValueKes = useMemo(
    () => pendingBookings.reduce((sum, b) => sum + (b.quotedAmountKes || 0), 0),
    [pendingBookings]
  );

  const urgentAlertCount = complianceAlerts.filter((a) => a.urgent).length;

  return (
    <AdminLayout
      title={isAdmin ? 'Operations Overview' : 'Dispatch Desk Overview'}
      breadcrumb="Overview"
    >
      <div className="space-y-5 min-w-0">
        {/* 1. Shift Command Header — Sharp Square Geometry */}
        <section
          aria-label="Shift context and quick dispatch actions"
          className="rounded-none bg-gradient-to-r from-[#0B1E45] via-[#123270] to-[#1B479B] text-white border border-[#123270] border-l-4 border-l-[#D61C1C] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-white tabular-nums px-2 py-0.5 rounded-none bg-white/10 border border-white/15">
                {todayReadable}
              </span>
              <span className="font-bold uppercase tracking-[0.14em] text-[#FF6B63]">
                KISUMU CENTRAL DISPATCH
              </span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[#86EFAC] tabular-nums">
                <span className="w-2 h-2 rounded-none bg-[#16A34A]" aria-hidden="true" />
                {fleetCounts.readyNow} ready now
              </span>
            </div>

            <h2 className="font-serif text-lg sm:text-xl font-semibold text-white leading-snug">
              Live fleet movements, KIS arrivals &amp; regional readiness
            </h2>
            <p className="text-xs text-[#F8FAFC]/80">
              {todaysFeed.length} scheduled today · {upcomingBookings.length} upcoming in 7 days ·{' '}
              {driverStats.available.length} chauffeurs standing by · {openInquiries.length} open
              inquiries
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/admin/fleet"
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-none border border-white/25 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5 text-[#FF6B63]" aria-hidden="true" />
              <span>Fleet &amp; Service</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin/finance"
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-none border border-white/25 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors whitespace-nowrap"
              >
                <Receipt className="w-3.5 h-3.5 text-[#86EFAC]" aria-hidden="true" />
                <span>Record Payment</span>
              </Link>
            )}
            <Link
              to="/admin/bookings?new=1"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-none bg-white text-[#123270] hover:bg-[#F1F5F9] text-xs font-bold border-b-[3px] border-b-[#D61C1C] transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#D61C1C]" aria-hidden="true" />
              <span>New Booking</span>
            </Link>
          </div>
        </section>

        {/* 2. Executive KPI Cards — Square Architectural Tiles */}
        <section
          aria-label="Key operations metrics"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {/* KPI 1: Fleet Utilization */}
          <div className="rounded-none border border-[#111827]/12 border-t-[3px] border-t-[#1B479B] bg-white p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                  Fleet Utilization
                </p>
                <div className="font-mono text-xl 2xl:text-2xl font-semibold text-[#111827] tabular-nums">
                  {loading ? '—' : `${fleetCounts.outOnRoad}/${fleetCounts.totalOperational}`}
                  <span className="text-xs font-sans font-medium text-[#4B5563] ml-1.5">
                    on road
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-[#1B479B] bg-[#EFF3F9] px-2 py-1 rounded-none border border-[#1B479B]/20 tabular-nums shrink-0">
                {loading ? '—' : `${fleetCounts.utilizationPct}%`}
              </span>
            </div>

            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-none bg-[#E5E7EB] overflow-hidden">
                <div
                  className="h-full bg-[#1B479B] rounded-none transition-all duration-300"
                  style={{ width: `${fleetCounts.utilizationPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#4B5563] font-mono tabular-nums">
                <span className="text-[#16A34A] font-medium">{fleetCounts.readyNow} ready</span>
                <span>{fleetCounts.inWorkshop} service</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Pending Approvals */}
          <div className="rounded-none border border-[#111827]/12 border-t-[3px] border-t-[#D61C1C] bg-white p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                  Pending Approvals
                </p>
                <div
                  className={`font-mono text-xl 2xl:text-2xl font-semibold tabular-nums ${
                    pendingBookings.length > 0 ? 'text-[#D61C1C]' : 'text-[#111827]'
                  }`}
                >
                  {loading ? '—' : pendingBookings.length}
                </div>
              </div>
              <span className="w-8 h-8 rounded-none bg-[#FEF2F2] border border-[#D61C1C]/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#D61C1C]" aria-hidden="true" />
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#111827]/8 text-xs">
              <span className="font-mono text-[#4B5563] tabular-nums truncate">
                {isAdmin
                  ? pendingValueKes > 0
                    ? formatKes(pendingValueKes)
                    : 'Queue clear'
                  : pendingBookings.length > 0
                    ? `${pendingBookings.length} awaiting dispatch`
                    : 'Queue clear'}
              </span>
              <Link
                to="/admin/bookings?status=Pending"
                className="inline-flex items-center gap-1 font-semibold text-[#1B479B] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Review</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* KPI 3: Monthly Revenue (Admin) or Active Schedule (Dispatcher) */}
          {isAdmin ? (
            <div className="rounded-none border border-[#111827]/12 border-t-[3px] border-t-[#16A34A] bg-white p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] truncate">
                    Collected ({currentMonthLabel})
                  </p>
                  <div className="font-mono text-lg sm:text-xl font-semibold text-[#111827] tabular-nums">
                    {loading ? '—' : formatKes(financeSummary.monthlyCollected)}
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-2 py-1 rounded-none border border-[#16A34A]/20 tabular-nums shrink-0">
                  {loading ? '—' : `${financeSummary.collectionRatioPct}%`}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#111827]/8 text-xs">
                <span className="font-mono text-[#D97706] font-medium tabular-nums truncate">
                  Due: {formatKes(financeSummary.outstanding)}
                </span>
                <Link
                  to="/admin/finance"
                  className="inline-flex items-center gap-1 font-semibold text-[#1B479B] hover:underline whitespace-nowrap shrink-0"
                >
                  <span>Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-none border border-[#111827]/12 border-t-[3px] border-t-[#16A34A] bg-white p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] truncate">
                    Today&apos;s Dispatches
                  </p>
                  <div className="font-mono text-xl 2xl:text-2xl font-semibold text-[#111827] tabular-nums">
                    {loading ? '—' : todaysFeed.length}
                    <span className="text-xs font-sans font-medium text-[#4B5563] ml-1.5">
                      movements
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-2 py-1 rounded-none border border-[#16A34A]/20 tabular-nums shrink-0">
                  {loading ? '—' : `${activeTrips.length} active`}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#111827]/8 text-xs">
                <span className="font-mono text-[#4B5563] tabular-nums truncate">
                  {upcomingBookings.length} scheduled next 7d
                </span>
                <Link
                  to="/admin/bookings"
                  className="inline-flex items-center gap-1 font-semibold text-[#1B479B] hover:underline whitespace-nowrap shrink-0"
                >
                  <span>Desk</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}

          {/* KPI 4: Compliance Watch */}
          <div className="rounded-none border border-[#111827]/12 border-t-[3px] border-t-[#D97706] bg-white p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                  Compliance Watch
                </p>
                <div
                  className={`font-mono text-xl 2xl:text-2xl font-semibold tabular-nums ${
                    urgentAlertCount > 0 ? 'text-[#D61C1C]' : 'text-[#111827]'
                  }`}
                >
                  {loading ? '—' : complianceAlerts.length}
                </div>
              </div>
              <span
                className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 border ${
                  urgentAlertCount > 0
                    ? 'bg-[#FEF2F2] border-[#D61C1C]/20 text-[#D61C1C]'
                    : 'bg-[#FFFBEB] border-[#D97706]/25 text-[#D97706]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#111827]/8 text-xs">
              <span className="font-mono text-[#4B5563] tabular-nums truncate">
                {urgentAlertCount} urgent · {drivers.length} drivers
              </span>
              <Link
                to="/admin/fleet"
                className="inline-flex items-center gap-1 font-semibold text-[#1B479B] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Inspect</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Middle Split: Live Dispatch Desk + Right Watchlist (Square Cards) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 8 cols: Live Dispatch Desk */}
          <div className="lg:col-span-8 rounded-none border border-[#111827]/12 bg-white overflow-hidden min-w-0">
            <div className="px-4 sm:px-5 py-4 border-b border-[#111827]/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarCheck2 className="w-4 h-4 text-[#1B479B] shrink-0" aria-hidden="true" />
                  <h2 className="font-serif text-base sm:text-lg font-medium text-[#111827] truncate">
                    Live Dispatch & Airport Pickups
                  </h2>
                </div>

                {/* Queue Search */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <Search
                    className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    placeholder="Filter ref, client, plate..."
                    aria-label="Filter dispatch feed"
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-none border border-[#111827]/15 bg-[#F9FAFB] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#1B479B] focus:bg-white"
                  />
                  {feedSearch && (
                    <button
                      type="button"
                      onClick={() => setFeedSearch('')}
                      aria-label="Clear dispatch filter"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Segmented Dispatch Queue Tabs */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-none bg-[#EFF3F9] border border-[#111827]/10 w-full sm:w-fit">
                {(
                  [
                    { id: 'today', label: 'Today', count: todaysFeed.length, urgent: false },
                    { id: 'upcoming', label: 'Next 7d', count: upcomingBookings.length, urgent: false },
                    { id: 'active', label: 'On Road', count: activeTrips.length, urgent: false },
                    { id: 'pending', label: 'Pending', count: pendingBookings.length, urgent: true },
                    {
                      id: 'inquiries',
                      label: 'Inquiries',
                      count: openInquiries.length,
                      urgent: openInquiries.some((i) => i.status === 'New'),
                    },
                  ] as const
                ).map((tab) => {
                  const isActive = feedTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFeedTab(tab.id)}
                      className={`px-2.5 py-1.5 rounded-none text-xs font-semibold transition-colors whitespace-nowrap font-sans ${
                        isActive
                          ? tab.urgent
                            ? 'bg-[#D61C1C] text-white'
                            : 'bg-[#1B479B] text-white'
                          : 'text-[#4B5563] hover:text-[#111827]'
                      }`}
                    >
                      {tab.label}{' '}
                      <span className="font-mono tabular-nums opacity-90">({tab.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((row) => (
                  <div
                    key={row}
                    className="h-14 rounded-none bg-[#F9FAFB] border border-[#111827]/8 animate-pulse"
                  />
                ))}
              </div>
            ) : feedTab === 'today' ? (
              filteredTodayFeed.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-medium text-[#111827]">
                    {normalizedFeedQuery
                      ? `No today dispatches match "${feedSearch}".`
                      : `No pickups or returns scheduled for today (${todayIso}).`}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      to="/admin/bookings?new=1"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-[#1B479B] text-white text-xs font-semibold hover:bg-[#15397E]"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Log Walk-In / WhatsApp Booking</span>
                    </Link>
                    {upcomingBookings.length > 0 && !normalizedFeedQuery && (
                      <button
                        type="button"
                        onClick={() => setFeedTab('upcoming')}
                        className="text-xs font-semibold text-[#1B479B] hover:underline"
                      >
                        View {upcomingBookings.length} upcoming pickup(s) →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#111827]/10">
                  {filteredTodayFeed.map((ev) => (
                    <div
                      key={ev.id}
                      className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-[#1B479B] tabular-nums">
                            {ev.time}
                          </span>
                          <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-none text-[11px] font-semibold ${
                              ev.kind === 'Pickup'
                                ? 'bg-[#EFF3F9] text-[#123270]'
                                : 'bg-[#F3F4F6] text-[#374151]'
                            }`}
                          >
                            {ev.kind}
                          </span>
                          {ev.isAirport && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#D61C1C]">
                              <PlaneLanding className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>
                                KIS Arrival{ev.flightNumber ? ` (${ev.flightNumber})` : ''}
                              </span>
                            </span>
                          )}
                          <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                          <span className="font-mono text-[#4B5563]">{ev.bookingRef}</span>
                          <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                          <span className="font-medium text-[#4B5563]">{ev.status}</span>
                        </div>

                        <p className="text-sm font-semibold text-[#111827] truncate">
                          {ev.clientName} ({ev.clientPhone}) — {ev.vehicleName}{' '}
                          {ev.registrationPlate ? `(${ev.registrationPlate})` : ''}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                          <span className="truncate">{ev.location}</span>
                          {ev.driverName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Driver: {ev.driverName}</span>
                            </>
                          )}
                          {isAdmin && ev.balanceKes > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-[#D97706] font-medium tabular-nums">
                                Bal: {formatKes(ev.balanceKes)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/admin/bookings?ref=${encodeURIComponent(ev.bookingRef)}&tab=${
                            ev.kind === 'Return' ? 'return' : 'handover'
                          }`}
                          className="px-3 py-1.5 rounded-none border border-[#1B479B]/25 text-xs font-semibold text-[#1B479B] hover:bg-[#EFF3F9] whitespace-nowrap"
                        >
                          {ev.kind === 'Return' ? 'Return Check' : 'Handover'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : feedTab === 'upcoming' ? (
              filteredUpcomingBookings.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#4B5563]">
                  {normalizedFeedQuery
                    ? `No upcoming bookings match "${feedSearch}".`
                    : 'No scheduled pickups in the next 7 days.'}
                </div>
              ) : (
                <div className="divide-y divide-[#111827]/10">
                  {filteredUpcomingBookings.map((b) => {
                    const bal = Math.max(0, (b.quotedAmountKes || 0) - (b.amountPaidKes || 0));
                    return (
                      <div
                        key={b.id}
                        className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-semibold text-[#1B479B] tabular-nums">
                              {b.pickupDate} · {b.pickupTime || '08:00'}
                            </span>
                            <span aria-hidden="true" className="text-[#9CA3AF]">·</span>
                            <span className="font-mono text-[#4B5563]">{b.bookingRef}</span>
                            <span aria-hidden="true" className="text-[#9CA3AF]">·</span>
                            <span
                              className={`font-semibold ${
                                b.status === 'Pending' ? 'text-[#D61C1C]' : 'text-[#16A34A]'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#111827] truncate">
                            {b.clientName} ({b.clientPhone}) — {b.vehicleName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                            <span className="truncate">
                              {b.pickupLocation} → {b.destination}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{b.driverName || 'Unassigned'}</span>
                            {isAdmin && bal > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-[#D97706] tabular-nums">
                                  Bal: {formatKes(bal)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <Link
                          to={`/admin/bookings?ref=${encodeURIComponent(b.bookingRef)}&tab=handover`}
                          className="px-3 py-1.5 rounded-none border border-[#1B479B]/25 text-xs font-semibold text-[#1B479B] hover:bg-[#EFF3F9] whitespace-nowrap shrink-0"
                        >
                          Prepare Dispatch
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )
            ) : feedTab === 'active' ? (
              filteredActiveTrips.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#4B5563]">
                  {normalizedFeedQuery
                    ? `No active trips match "${feedSearch}".`
                    : 'No vehicles are currently out on active trips.'}
                </div>
              ) : (
                <div className="divide-y divide-[#111827]/10">
                  {filteredActiveTrips.map((b) => {
                    const isOverdue = b.returnDate < todayIso;
                    const bal = Math.max(0, (b.quotedAmountKes || 0) - (b.amountPaidKes || 0));
                    return (
                      <div
                        key={b.id}
                        className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-semibold text-[#1B479B]">
                              {b.bookingRef}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-mono tabular-nums font-semibold ${
                                isOverdue ? 'text-[#D61C1C]' : 'text-[#111827]'
                              }`}
                            >
                              {isOverdue
                                ? `Overdue (Due ${b.returnDate})`
                                : `Due back ${b.returnDate} ${b.returnTime}`}
                            </span>
                            {b.odometerOut !== undefined && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-[#4B5563] tabular-nums">
                                  Out: {b.odometerOut.toLocaleString()} km
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-[#111827] truncate">
                            {b.vehicleName} ({b.registrationPlate || 'No plate'}) — {b.clientName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                            <span>{b.destination}</span>
                            <span aria-hidden="true">·</span>
                            <span>{b.driverName || 'Self-Drive'}</span>
                            {isAdmin && bal > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-[#D97706] tabular-nums">
                                  Bal: {formatKes(bal)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <Link
                          to={`/admin/bookings?ref=${encodeURIComponent(b.bookingRef)}&tab=return`}
                          className="px-3 py-1.5 rounded-none bg-[#EFF3F9] border border-[#1B479B]/25 text-xs font-semibold text-[#1B479B] hover:bg-[#DCE5F2] whitespace-nowrap shrink-0"
                        >
                          Return Check
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )
            ) : feedTab === 'pending' ? (
              filteredPendingBookings.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#4B5563]">
                  {normalizedFeedQuery
                    ? `No pending requests match "${feedSearch}".`
                    : 'No pending booking requests right now.'}
                </div>
              ) : (
                <div className="divide-y divide-[#111827]/10">
                  {filteredPendingBookings.map((b) => (
                    <div
                      key={b.id}
                      className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-[#D61C1C]">
                            {b.bookingRef}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[#111827] tabular-nums">
                            {b.pickupDate} → {b.returnDate} ({b.rentalDays}d)
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#4B5563]">{b.source}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#111827] truncate">
                          {b.clientName} ({b.clientPhone}) — {b.vehicleName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                          <span className="truncate">
                            {b.pickupLocation} → {b.destination}
                          </span>
                          <span aria-hidden="true">·</span>
                          {isAdmin ? (
                            <span className="font-mono font-semibold text-[#1B479B] tabular-nums">
                              {formatKes(b.quotedAmountKes)}
                            </span>
                          ) : (
                            <span className="font-medium text-[#1B479B] capitalize">
                              {b.serviceType} · {b.paymentStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={confirmingId === b.id}
                          onClick={() => handleQuickConfirm(b)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] disabled:opacity-60 whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{confirmingId === b.id ? 'Confirming...' : 'Confirm'}</span>
                        </button>
                        <Link
                          to={`/admin/bookings?ref=${encodeURIComponent(b.bookingRef)}&tab=handover`}
                          className="px-3 py-1.5 rounded-none border border-[#1B479B]/25 text-xs font-semibold text-[#1B479B] hover:bg-[#EFF3F9] whitespace-nowrap"
                        >
                          Handover
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filteredOpenInquiries.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-[#111827]">
                  {normalizedFeedQuery
                    ? `No inquiries match "${feedSearch}".`
                    : 'No open quick inquiries from the Contact Desk.'}
                </p>
                <Link
                  to="/admin/bookings?tab=inquiries"
                  className="inline-block text-xs font-semibold text-[#1B479B] hover:underline"
                >
                  Open full Inquiries Inbox →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#111827]/10">
                {filteredOpenInquiries.map((inq) => {
                  const waDigits = cleanWhatsAppDigits(inq.phone);
                  const waHref = waDigits
                    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
                        `Habari ${inq.name}, following up from Kisumu Dispatch on your Kechas Agencies inquiry (${inq.reference}) for ${inq.vehicleClass}.`
                      )}`
                    : '';
                  return (
                    <div
                      key={inq.id}
                      className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`font-mono font-semibold ${
                              inq.status === 'New' ? 'text-[#D61C1C]' : 'text-[#1B479B]'
                            }`}
                          >
                            {inq.reference}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#111827]">{inq.topic}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[#4B5563] tabular-nums">
                            {inq.travelDate || 'Flexible dates'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#4B5563]">Reply via {inq.replyVia}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#111827] truncate">
                          {inq.name}
                          {inq.organization ? ` (${inq.organization})` : ''} — {inq.vehicleClass}
                        </p>
                        <p className="text-xs text-[#4B5563] line-clamp-2">{inq.message}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {waHref && (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-none border border-[#16A34A]/30 bg-[#F0FDF4] text-xs font-semibold text-[#15803D] hover:bg-[#DCFCE7] whitespace-nowrap"
                          >
                            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {inq.status === 'New' && (
                          <button
                            type="button"
                            disabled={markingInquiryId === inq.id}
                            onClick={() => handleMarkInquiryContacted(inq)}
                            className="px-2.5 py-1.5 rounded-none border border-[#111827]/20 text-xs font-semibold text-[#111827] hover:bg-[#EFF3F9] disabled:opacity-60 whitespace-nowrap"
                          >
                            {markingInquiryId === inq.id ? 'Saving...' : 'Mark Contacted'}
                          </button>
                        )}
                        <Link
                          to={`/admin/bookings?inquiryId=${encodeURIComponent(inq.id)}`}
                          className="px-3 py-1.5 rounded-none bg-[#1B479B] text-white text-xs font-semibold hover:bg-[#15397E] whitespace-nowrap"
                        >
                          Convert to Booking
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 4 cols: Compliance Watchlist + Chauffeur Readiness */}
          <div className="lg:col-span-4 space-y-5 min-w-0">
            {/* Alerts Panel */}
            <div className="rounded-none border border-[#111827]/12 bg-white overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#111827]/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-[#D61C1C] shrink-0" aria-hidden="true" />
                  <h2 className="font-serif text-base sm:text-lg font-medium text-[#111827] truncate">
                    Compliance & Service
                  </h2>
                </div>
                <span className="font-mono text-xs font-semibold text-[#4B5563] tabular-nums shrink-0">
                  {complianceAlerts.length}
                </span>
              </div>
              {complianceAlerts.length === 0 ? (
                <div className="p-5 text-xs sm:text-sm text-[#4B5563]">
                  All vehicles and driver licenses are within valid service and compliance windows.
                </div>
              ) : (
                <div className="divide-y divide-[#111827]/10 max-h-64 overflow-y-auto">
                  {complianceAlerts.map((item) => (
                    <Link
                      key={item.id}
                      to={item.linkTo}
                      className={`block px-4 sm:px-5 py-3 space-y-0.5 hover:bg-[#F9FAFB] border-l-[3px] ${
                        item.urgent ? 'border-l-[#D61C1C]' : 'border-l-[#D97706]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#111827] truncate">
                          {item.title}
                        </span>
                        <span className="font-mono text-xs text-[#4B5563] shrink-0">
                          {item.subtitle}
                        </span>
                      </div>
                      <p
                        className={`text-xs font-medium ${
                          item.urgent ? 'text-[#D61C1C]' : 'text-[#D97706]'
                        }`}
                      >
                        {item.reason}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Chauffeurs Live Roster Pulse */}
            <div className="rounded-none border border-[#111827]/12 bg-white overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-[#111827]/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-4 h-4 text-[#1B479B] shrink-0" aria-hidden="true" />
                  <h2 className="font-serif text-base sm:text-lg font-medium text-[#111827] truncate">
                    Chauffeur Roster
                  </h2>
                </div>
                <Link
                  to="/admin/drivers"
                  className="text-xs font-semibold text-[#1B479B] hover:underline whitespace-nowrap shrink-0"
                >
                  Directory →
                </Link>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
                  <div className="p-2.5 rounded-none bg-[#F0FDF4] border border-[#16A34A]/25">
                    <div className="text-lg font-semibold text-[#16A34A]">
                      {driverStats.available.length}
                    </div>
                    <div className="font-sans text-[11px] font-medium text-[#374151]">Available</div>
                  </div>
                  <div className="p-2.5 rounded-none bg-[#EFF3F9] border border-[#1B479B]/20">
                    <div className="text-lg font-semibold text-[#1B479B]">
                      {driverStats.onTrip.length}
                    </div>
                    <div className="font-sans text-[11px] font-medium text-[#374151]">On Trip</div>
                  </div>
                  <div className="p-2.5 rounded-none bg-[#F9FAFB] border border-[#111827]/12">
                    <div className="text-lg font-semibold text-[#4B5563]">
                      {driverStats.offDuty.length}
                    </div>
                    <div className="font-sans text-[11px] font-medium text-[#374151]">Off Duty</div>
                  </div>
                </div>

                {driverStats.available.length > 0 ? (
                  <div className="space-y-1.5 pt-2 border-t border-[#111827]/10">
                    <p className="text-xs font-semibold text-[#4B5563]">Ready for dispatch:</p>
                    <div className="divide-y divide-[#111827]/8">
                      {driverStats.available.slice(0, 4).map((drv) => (
                        <div
                          key={drv.id}
                          className="py-1.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-medium text-[#111827] truncate">
                            {drv.fullName}
                          </span>
                          <span className="font-mono text-[11px] text-[#4B5563] shrink-0">
                            {drv.phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#4B5563]">
                    No chauffeurs currently marked Available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Interactive Fleet Availability Timeline — Fitted cleanly with Square Cells */}
        <section className="rounded-none border border-[#111827]/12 bg-white overflow-hidden min-w-0">
          <div className="px-4 sm:px-5 py-4 border-b border-[#111827]/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <CarFront className="w-4 h-4 text-[#1B479B] mt-1 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 className="font-serif text-base sm:text-lg font-medium text-[#111827]">
                    {timelineDays}-Day Fleet Availability Timeline
                  </h2>
                  <p className="text-xs text-[#4B5563]">
                    Click any open slot to log a booking, or click a reference to inspect.
                  </p>
                </div>
              </div>

              {/* 7 vs 14 Day Window Toggle + Search */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="relative w-44">
                  <Search
                    className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={timelineQuery}
                    onChange={(e) => setTimelineQuery(e.target.value)}
                    placeholder="Vehicle or plate..."
                    aria-label="Filter timeline vehicles"
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-none border border-[#111827]/15 bg-[#F9FAFB] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#1B479B] focus:bg-white"
                  />
                  {timelineQuery && (
                    <button
                      type="button"
                      onClick={() => setTimelineQuery('')}
                      aria-label="Clear timeline search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 p-1 rounded-none bg-[#EFF3F9] border border-[#111827]/10">
                  <button
                    type="button"
                    onClick={() => setTimelineDays(7)}
                    className={`px-2.5 py-1 rounded-none text-xs font-semibold transition-colors whitespace-nowrap ${
                      timelineDays === 7
                        ? 'bg-[#1B479B] text-white'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineDays(14)}
                    className={`px-2.5 py-1 rounded-none text-xs font-semibold transition-colors whitespace-nowrap ${
                      timelineDays === 14
                        ? 'bg-[#1B479B] text-white'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    14 Days
                  </button>
                </div>
              </div>
            </div>

            {/* Category Tabs + Color Key */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-none bg-[#F9FAFB] border border-[#111827]/10 w-fit">
                {(
                  [
                    { id: 'all', label: 'All Fleet' },
                    { id: 'executive', label: 'Executive' },
                    { id: '4x4-safari', label: '4x4 Safari' },
                    { id: 'family-group', label: 'Family' },
                    { id: 'economy', label: 'Economy' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-none text-xs font-medium transition-colors whitespace-nowrap ${
                      categoryFilter === cat.id
                        ? 'bg-[#1B479B] text-white font-semibold'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#4B5563]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-none bg-[#E5E7EB] border border-[#D1D5DB]" aria-hidden="true" />
                  <span>Open</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#1B479B]">
                  <span className="w-2.5 h-2.5 rounded-none bg-[#1B479B]" aria-hidden="true" />
                  <span>Confirmed / Active</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#D97706]">
                  <span className="w-2.5 h-2.5 rounded-none bg-[#F59E0B]" aria-hidden="true" />
                  <span>Pending</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#D61C1C]">
                  <span className="w-2.5 h-2.5 rounded-none bg-[#D61C1C]" aria-hidden="true" />
                  <span>Maintenance</span>
                </span>
              </div>
            </div>
          </div>

          {filteredTimelineVehicles.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#4B5563]">
              No active vehicles match the current category or filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#111827]/10 bg-[#F9FAFB] text-[11px] font-semibold text-[#4B5563]">
                    <th className="py-2.5 px-3 sm:px-4 w-40 sm:w-48 sticky left-0 bg-[#F9FAFB] z-10 border-r border-[#111827]/10">
                      Vehicle & Plate
                    </th>
                    {calendarDays.map((day) => (
                      <th
                        key={day.iso}
                        className={`py-2 px-0.5 text-center font-mono tabular-nums min-w-[40px] ${
                          day.isToday
                            ? 'text-[#1B479B] bg-[#EFF3F9] border-b-2 border-b-[#D61C1C]'
                            : ''
                        }`}
                      >
                        <div className="font-sans text-[10px] font-medium">{day.dayLabel}</div>
                        <div className="text-[11px] font-semibold">{day.numLabel}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]/10 text-xs">
                  {filteredTimelineVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-[#F9FAFB]/70">
                      <td className="py-2 px-3 sm:px-4 sticky left-0 bg-white z-10 border-r border-[#111827]/10 max-w-[160px] sm:max-w-[192px]">
                        <div className="font-semibold text-[#111827] truncate">{v.name}</div>
                        <div className="font-mono text-[10px] text-[#4B5563] truncate">
                          {v.registrationPlate} ·{' '}
                          <span
                            className={
                              v.status === 'In Maintenance'
                                ? 'text-[#D61C1C] font-semibold'
                                : v.status === 'Booked'
                                  ? 'text-[#1B479B] font-semibold'
                                  : 'text-[#16A34A] font-semibold'
                            }
                          >
                            {v.status}
                          </span>
                        </div>
                      </td>
                      {calendarDays.map((day) => {
                        if (v.status === 'In Maintenance' && day.isToday) {
                          return (
                            <td key={day.iso} className="p-0.5 text-center">
                              <Link
                                to="/admin/fleet"
                                title="Vehicle currently in maintenance"
                                className="block py-1.5 px-0.5 rounded-none bg-[#FEF2F2] border border-[#D61C1C]/30 text-[10px] font-semibold text-[#D61C1C] hover:bg-[#FEE2E2]"
                              >
                                Svc
                              </Link>
                            </td>
                          );
                        }
                        const slot = getSlotBooking(v.id, day.iso);
                        if (!slot) {
                          return (
                            <td key={day.iso} className="p-0.5 text-center">
                              <Link
                                to={`/admin/bookings?new=1&vehicleId=${encodeURIComponent(
                                  v.id
                                )}&date=${day.iso}`}
                                title={`Book ${v.name} on ${day.iso}`}
                                className="block py-1.5 px-0.5 rounded-none bg-[#F9FAFB] border border-transparent text-[10px] text-[#9CA3AF] hover:bg-[#EFF3F9] hover:border-[#1B479B]/20 hover:text-[#1B479B] transition-colors"
                              >
                                —
                              </Link>
                            </td>
                          );
                        }
                        const isPending = slot.status === 'Pending';
                        return (
                          <td
                            key={day.iso}
                            className="p-0.5 text-center"
                            title={`${slot.bookingRef} · ${slot.clientName} (${slot.status})`}
                          >
                            <Link
                              to={`/admin/bookings?ref=${encodeURIComponent(slot.bookingRef)}`}
                              className={`block py-1.5 px-0.5 rounded-none text-[10px] font-mono font-semibold truncate tabular-nums transition-colors ${
                                isPending
                                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#D97706]/30 hover:bg-[#FDE68A]'
                                  : 'bg-[#EFF3F9] text-[#1B479B] border border-[#1B479B]/25 hover:bg-[#DCE5F2]'
                              }`}
                            >
                              {shortBookingCode(slot.bookingRef)}
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
