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
  Check,
  PlaneLanding,
  Plus,
  Receipt,
  Users,
  Wrench,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import {
  BookingDoc,
  DriverDoc,
  TransactionDoc,
  VehicleDoc,
} from '../../lib/adminTypes';
import { FleetCategoryId, formatKes } from '../../data/fleet';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';

type DispatchFeedTab = 'today' | 'active' | 'pending';
type TimelineWindow = 7 | 14;

function getLocalIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateList(days: number): { iso: string; dayLabel: string; numLabel: string; isToday: boolean }[] {
  const list: { iso: string; dayLabel: string; numLabel: string; isToday: boolean }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = getLocalIsoDate(i);
    list.push({
      iso,
      dayLabel: d.toLocaleDateString('en-KE', { weekday: 'short' }),
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

export default function AdminOverviewPage() {
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [transactions, setTransactions] = useState<TransactionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [feedTab, setFeedTab] = useState<DispatchFeedTab>('today');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [timelineDays, setTimelineDays] = useState<TimelineWindow>(14);
  const [categoryFilter, setCategoryFilter] = useState<'all' | FleetCategoryId>('all');

  useEffect(() => {
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
      unsubTransactions();
    };
  }, []);

  const todayIso = getLocalIsoDate(0);
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
    return {
      totalOperational: operational.length,
      outOnRoad,
      inWorkshop,
      readyNow,
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

    // Fallback if transactions haven't been logged individually vs paid bookings
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

    return { monthlyCollected, totalCollected, outstanding, unpaidCount };
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

  const driverStats = useMemo(() => {
    const available = drivers.filter((d) => d.status === 'Available');
    const onTrip = drivers.filter((d) => d.status === 'On Trip');
    const offDuty = drivers.filter((d) => d.status === 'Off Duty');
    return { available, onTrip, offDuty };
  }, [drivers]);

  const filteredTimelineVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.status === 'Inactive') return false;
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      return true;
    });
  }, [vehicles, categoryFilter]);

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
      const payload: Record<string, unknown> = {
        ...bk,
        status: 'Confirmed',
        updatedAt: serverTimestamp(),
      };
      delete payload.id;
      await updateDoc(doc(db, 'bookings', bk.id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bk.id}`);
    } finally {
      setConfirmingId(null);
    }
  }

  const pendingValueKes = useMemo(
    () => pendingBookings.reduce((sum, b) => sum + (b.quotedAmountKes || 0), 0),
    [pendingBookings]
  );

  return (
    <AdminLayout title="Operations Overview" breadcrumb="Overview">
      <div className="space-y-6">
        {/* Top Operational Command Strip */}
        <section
          aria-label="Shift context and quick dispatch actions"
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#111827]/10"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
              <span className="font-mono font-semibold text-[#111827] tabular-nums">
                {todayReadable}
              </span>
              <span aria-hidden="true">·</span>
              <span>Kisumu Central Dispatch</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#16A34A] font-medium tabular-nums">
                {fleetCounts.readyNow} vehicles ready now
              </span>
            </div>
            <p className="text-sm text-[#4B5563]">
              Monitor active hires, airport arrivals, compliance expiries, and fleet availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/admin/fleet"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#111827]/15 bg-white text-xs font-semibold text-[#111827] hover:bg-[#F9FAFB] whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5 text-[#4B5563]" aria-hidden="true" />
              <span>Fleet & Service</span>
            </Link>
            <Link
              to="/admin/finance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#194793]/25 bg-white text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9] whitespace-nowrap"
            >
              <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Record Payment</span>
            </Link>
            <Link
              to="/admin/bookings?new=1"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Booking</span>
            </Link>
          </div>
        </section>

        {/* 4 Executive KPI Cards */}
        <section
          aria-label="Key operations metrics"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <div className="rounded-lg border border-[#111827]/10 bg-white p-5 flex flex-col justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#4B5563]">Active Trips / Vehicles Out</p>
              <div className="font-serif text-3xl font-medium text-[#194793] tabular-nums mt-1">
                {loading
                  ? '—'
                  : `${fleetCounts.outOnRoad} / ${fleetCounts.totalOperational} Active`}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[#4B5563] pt-2 border-t border-[#111827]/8 font-mono tabular-nums">
              <span>{fleetCounts.readyNow} ready</span>
              <span>{fleetCounts.inWorkshop} in service</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-5 flex flex-col justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#4B5563]">Pending Booking Requests</p>
              <div
                className={`font-serif text-3xl font-medium tabular-nums mt-1 ${
                  pendingBookings.length > 0 ? 'text-[#C8231D]' : 'text-[#111827]'
                }`}
              >
                {loading ? '—' : pendingBookings.length}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#111827]/8 text-xs">
              <span className="font-mono text-[#4B5563] tabular-nums truncate">
                {pendingValueKes > 0 ? formatKes(pendingValueKes) : 'Queue clear'}
              </span>
              <Link
                to="/admin/bookings?status=Pending"
                className="inline-flex items-center gap-1 font-semibold text-[#194793] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Review</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-5 flex flex-col justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#4B5563]">
                Collected ({currentMonthLabel}) vs. Outstanding
              </p>
              <div className="font-mono text-2xl font-semibold text-[#111827] tabular-nums mt-1.5">
                {loading ? '—' : formatKes(financeSummary.monthlyCollected)}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#111827]/8 text-xs">
              <span className="font-mono text-[#D97706] font-medium tabular-nums truncate">
                Due: {formatKes(financeSummary.outstanding)}
              </span>
              <Link
                to="/admin/finance"
                className="inline-flex items-center gap-1 font-semibold text-[#194793] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Ledger</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-5 flex flex-col justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#4B5563]">
                Maintenance & Compliance Alerts
              </p>
              <div
                className={`font-serif text-3xl font-medium tabular-nums mt-1 ${
                  complianceAlerts.some((a) => a.urgent) ? 'text-[#C8231D]' : 'text-[#111827]'
                }`}
              >
                {loading ? '—' : complianceAlerts.length}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#111827]/8 text-xs">
              <span className="text-[#4B5563] tabular-nums">
                {complianceAlerts.filter((a) => a.urgent).length} urgent
              </span>
              <Link
                to="/admin/fleet"
                className="inline-flex items-center gap-1 font-semibold text-[#194793] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Inspect</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Middle Split: Live Dispatch Desk + Right Watchlist */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 cols: Live Dispatch Desk */}
          <div className="lg:col-span-8 rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#111827]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-[#194793]" aria-hidden="true" />
                <h2 className="font-serif text-lg font-medium text-[#111827]">
                  Live Dispatch & Airport Pickups
                </h2>
              </div>

              {/* Interactive Queue Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-md bg-[#EFF3F9] border border-[#111827]/10">
                <button
                  type="button"
                  onClick={() => setFeedTab('today')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    feedTab === 'today'
                      ? 'bg-[#194793] text-white'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  Today ({todaysFeed.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedTab('active')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    feedTab === 'active'
                      ? 'bg-[#194793] text-white'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  On Road ({activeTrips.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedTab('pending')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    feedTab === 'pending'
                      ? 'bg-[#C8231D] text-white'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  Pending ({pendingBookings.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="h-14 rounded bg-[#F9FAFB] border border-[#111827]/8 animate-pulse"
                  />
                ))}
              </div>
            ) : feedTab === 'today' ? (
              todaysFeed.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-medium text-[#111827]">
                    No pickups or returns scheduled for today ({todayIso}).
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      to="/admin/bookings?new=1"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Log Walk-In / WhatsApp Booking</span>
                    </Link>
                    {activeTrips.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFeedTab('active')}
                        className="text-xs font-semibold text-[#194793] hover:underline"
                      >
                        View {activeTrips.length} active trip(s) on road →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#111827]/10">
                  {todaysFeed.map((ev) => (
                    <div
                      key={ev.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-[#194793] tabular-nums">
                            {ev.time}
                          </span>
                          <span className="text-[#4B5563]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-semibold text-[#111827]">{ev.kind}</span>
                          {ev.isAirport && (
                            <>
                              <span className="text-[#4B5563]" aria-hidden="true">
                                ·
                              </span>
                              <span className="inline-flex items-center gap-1 font-semibold text-[#C8231D]">
                                <PlaneLanding className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>
                                  KIS Arrival{ev.flightNumber ? ` (${ev.flightNumber})` : ''}
                                </span>
                              </span>
                            </>
                          )}
                          <span className="text-[#4B5563]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono text-[#4B5563]">{ev.bookingRef}</span>
                          <span className="text-[#4B5563]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-medium text-[#4B5563]">{ev.status}</span>
                        </div>

                        <p className="text-sm font-medium text-[#111827] truncate">
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
                          {ev.balanceKes > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-[#D97706] tabular-nums">
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
                          className="px-3 py-1.5 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9] whitespace-nowrap"
                        >
                          {ev.kind === 'Return' ? 'Return Check' : 'Handover'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : feedTab === 'active' ? (
              activeTrips.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#4B5563]">
                  No vehicles are currently out on active trips.
                </div>
              ) : (
                <div className="divide-y divide-[#111827]/10">
                  {activeTrips.map((b) => {
                    const isOverdue = b.returnDate < todayIso;
                    const bal = Math.max(0, (b.quotedAmountKes || 0) - (b.amountPaidKes || 0));
                    return (
                      <div
                        key={b.id}
                        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-semibold text-[#194793]">
                              {b.bookingRef}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-mono tabular-nums font-semibold ${
                                isOverdue ? 'text-[#C8231D]' : 'text-[#111827]'
                              }`}
                            >
                              {isOverdue ? `Overdue (Due ${b.returnDate})` : `Due back ${b.returnDate} ${b.returnTime}`}
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
                          <p className="text-sm font-medium text-[#111827] truncate">
                            {b.vehicleName} ({b.registrationPlate || 'No plate'}) — {b.clientName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                            <span>{b.destination}</span>
                            <span aria-hidden="true">·</span>
                            <span>{b.driverName || 'Self-Drive'}</span>
                            {bal > 0 && (
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
                          className="px-3 py-1.5 rounded bg-[#EFF3F9] border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#DCE5F2] whitespace-nowrap shrink-0"
                        >
                          Return Check
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )
            ) : pendingBookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#4B5563]">
                No pending booking requests right now.
              </div>
            ) : (
              <div className="divide-y divide-[#111827]/10">
                {pendingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB]"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-[#C8231D]">
                          {b.bookingRef}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[#111827] tabular-nums">
                          {b.pickupDate} → {b.returnDate} ({b.rentalDays}d)
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#4B5563]">{b.source}</span>
                      </div>
                      <p className="text-sm font-medium text-[#111827] truncate">
                        {b.clientName} ({b.clientPhone}) — {b.vehicleName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                        <span className="truncate">
                          {b.pickupLocation} → {b.destination}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-[#194793] tabular-nums">
                          {formatKes(b.quotedAmountKes)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={confirmingId === b.id}
                        onClick={() => handleQuickConfirm(b)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] disabled:opacity-60 whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{confirmingId === b.id ? 'Confirming...' : 'Confirm'}</span>
                      </button>
                      <Link
                        to={`/admin/bookings?ref=${encodeURIComponent(b.bookingRef)}&tab=handover`}
                        className="px-3 py-1.5 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9] whitespace-nowrap"
                      >
                        Handover
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right 4 cols: Compliance Watchlist + Chauffeur Readiness */}
          <div className="lg:col-span-4 space-y-6">
            {/* Alerts Panel */}
            <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#111827]/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#C8231D]" aria-hidden="true" />
                  <h2 className="font-serif text-lg font-medium text-[#111827]">
                    Compliance & Service Alerts
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#4B5563] tabular-nums">
                  {complianceAlerts.length}
                </span>
              </div>
              {complianceAlerts.length === 0 ? (
                <div className="p-5 text-xs sm:text-sm text-[#4B5563]">
                  All vehicles and driver licenses are within valid service and compliance windows.
                </div>
              ) : (
                <div className="divide-y divide-[#111827]/10 max-h-72 overflow-y-auto">
                  {complianceAlerts.map((item) => (
                    <Link
                      key={item.id}
                      to={item.linkTo}
                      className="block px-5 py-3 space-y-0.5 hover:bg-[#F9FAFB]"
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
                          item.urgent ? 'text-[#C8231D]' : 'text-[#D97706]'
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
            <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#111827]/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#194793]" aria-hidden="true" />
                  <h2 className="font-serif text-lg font-medium text-[#111827]">
                    Chauffeur Availability
                  </h2>
                </div>
                <Link
                  to="/admin/drivers"
                  className="text-xs font-semibold text-[#194793] hover:underline whitespace-nowrap"
                >
                  Directory →
                </Link>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
                  <div className="p-2.5 rounded bg-[#F0FDF4] border border-[#16A34A]/25">
                    <div className="text-lg font-semibold text-[#16A34A]">
                      {driverStats.available.length}
                    </div>
                    <div className="font-sans text-[11px] text-[#4B5563]">Available</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#EFF3F9] border border-[#194793]/20">
                    <div className="text-lg font-semibold text-[#194793]">
                      {driverStats.onTrip.length}
                    </div>
                    <div className="font-sans text-[11px] text-[#4B5563]">On Trip</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#F9FAFB] border border-[#111827]/10">
                    <div className="text-lg font-semibold text-[#4B5563]">
                      {driverStats.offDuty.length}
                    </div>
                    <div className="font-sans text-[11px] text-[#4B5563]">Off Duty</div>
                  </div>
                </div>

                {driverStats.available.length > 0 ? (
                  <div className="space-y-1.5 pt-2 border-t border-[#111827]/10">
                    <p className="text-xs font-medium text-[#4B5563]">Ready for dispatch:</p>
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

        {/* Interactive Fleet Availability Timeline */}
        <section className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#111827]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#111827]">
                {timelineDays}-Day Fleet Availability Timeline
              </h2>
              <p className="text-xs text-[#4B5563]">
                Click any open cell to create a booking on that date, or click a booked ref to inspect.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
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
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      categoryFilter === cat.id
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 7 vs 14 Day Window Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-md bg-[#EFF3F9] border border-[#111827]/10">
                <button
                  type="button"
                  onClick={() => setTimelineDays(7)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    timelineDays === 7
                      ? 'bg-[#194793] text-white'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineDays(14)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    timelineDays === 14
                      ? 'bg-[#194793] text-white'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  14 Days
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 border-b border-[#111827]/10 bg-[#F9FAFB]/70 flex flex-wrap items-center gap-5 text-xs text-[#4B5563]">
            <span>Available (Click to Book)</span>
            <span className="font-semibold text-[#194793]">Confirmed / Active Trip</span>
            <span className="font-semibold text-[#D97706]">Pending Hold</span>
            <span className="font-semibold text-[#C8231D]">In Maintenance</span>
          </div>

          {filteredTimelineVehicles.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#4B5563]">
              No active vehicles match the selected category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#111827]/10 bg-[#F9FAFB] text-[11px] font-semibold text-[#4B5563]">
                    <th className="py-3 px-4 w-56 sticky left-0 bg-[#F9FAFB] z-10 border-r border-[#111827]/10">
                      Vehicle & Plate
                    </th>
                    {calendarDays.map((day) => (
                      <th
                        key={day.iso}
                        className={`py-2.5 px-1.5 text-center font-mono tabular-nums min-w-[54px] ${
                          day.isToday ? 'text-[#194793] bg-[#EFF3F9]' : ''
                        }`}
                      >
                        <div className="font-sans text-[10px] font-medium">{day.dayLabel}</div>
                        <div className="text-xs font-semibold">{day.numLabel}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]/10 text-xs">
                  {filteredTimelineVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-[#F9FAFB]/60">
                      <td className="py-2.5 px-4 sticky left-0 bg-white z-10 border-r border-[#111827]/10">
                        <div className="font-semibold text-[#111827] truncate max-w-[190px]">
                          {v.name}
                        </div>
                        <div className="font-mono text-[11px] text-[#4B5563]">
                          {v.registrationPlate} ·{' '}
                          <span
                            className={
                              v.status === 'In Maintenance'
                                ? 'text-[#C8231D]'
                                : v.status === 'Booked'
                                  ? 'text-[#194793]'
                                  : 'text-[#16A34A]'
                            }
                          >
                            {v.status}
                          </span>
                        </div>
                      </td>
                      {calendarDays.map((day) => {
                        if (v.status === 'In Maintenance' && day.isToday) {
                          return (
                            <td key={day.iso} className="p-1 text-center">
                              <Link
                                to="/admin/fleet"
                                title="Vehicle currently in maintenance"
                                className="block py-1.5 px-1 rounded bg-[#FEF2F2] border border-[#C8231D]/30 text-[10px] font-semibold text-[#C8231D] hover:bg-[#FEE2E2]"
                              >
                                Service
                              </Link>
                            </td>
                          );
                        }
                        const slot = getSlotBooking(v.id, day.iso);
                        if (!slot) {
                          return (
                            <td key={day.iso} className="p-1 text-center">
                              <Link
                                to={`/admin/bookings?new=1&vehicleId=${encodeURIComponent(
                                  v.id
                                )}&date=${day.iso}`}
                                title={`Book ${v.name} on ${day.iso}`}
                                className="block py-1.5 px-1 rounded bg-[#F9FAFB] text-[10px] text-[#9CA3AF] hover:bg-[#EFF3F9] hover:text-[#194793] transition-colors"
                              >
                                Open
                              </Link>
                            </td>
                          );
                        }
                        const isPending = slot.status === 'Pending';
                        return (
                          <td
                            key={day.iso}
                            className="p-1 text-center"
                            title={`${slot.bookingRef} · ${slot.clientName} (${slot.status})`}
                          >
                            <Link
                              to={`/admin/bookings?ref=${encodeURIComponent(slot.bookingRef)}`}
                              className={`block py-1.5 px-1 rounded text-[10px] font-mono font-semibold truncate tabular-nums transition-colors ${
                                isPending
                                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#D97706]/30 hover:bg-[#FDE68A]'
                                  : 'bg-[#EFF3F9] text-[#194793] border border-[#194793]/25 hover:bg-[#DCE5F2]'
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
