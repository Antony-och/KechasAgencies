import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  collection,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { CheckCircle2, ClipboardCheck, Inbox, MessageCircle, Plus, Search, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import BookingInspectionPanel, { InspectionTab } from '../../components/admin/BookingInspectionPanel';
import HandoverSlipModal from '../../components/admin/HandoverSlipModal';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoPortal } from '../../contexts/DemoPortalContext';
import { db } from '../../lib/firebase';
import {
  BookingDoc,
  BookingSource,
  BookingStatus,
  DriverDoc,
  InquiryDoc,
  InquiryStatus,
  VehicleDoc,
} from '../../lib/adminTypes';
import { formatKes } from '../../data/fleet';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import {
  formatStampNow,
  InspectionItemId,
  sanitizeInspectionIds,
} from '../../lib/inspection';

const STATUS_FILTERS: ('All' | BookingStatus)[] = [
  'All',
  'Pending',
  'Confirmed',
  'Active',
  'Completed',
  'Cancelled',
];

function cleanWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.startsWith('254')) return digits;
  return digits;
}

export default function AdminBookingsPage() {
  const { staffProfile, isAdmin, isDemoMode } = useAuth();
  const demo = useDemoPortal();
  const [searchParams, setSearchParams] = useSearchParams();
  const handledDeepLinkRef = useRef<string | null>(null);

  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [inquiries, setInquiries] = useState<InquiryDoc[]>([]);
  const [portalView, setPortalView] = useState<'bookings' | 'inquiries'>('bookings');
  const [inquiryFilter, setInquiryFilter] = useState<'Open' | 'All' | InquiryStatus>('Open');
  const [statusFilter, setStatusFilter] = useState<'All' | BookingStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingDoc | null>(null);
  const [convertingInquiryId, setConvertingInquiryId] = useState<string | null>(null);

  // Assignment & fast checklist state inside detail drawer
  const [assignVehicleId, setAssignVehicleId] = useState('');
  const [assignDriverId, setAssignDriverId] = useState('');
  const [inspectionTab, setInspectionTab] = useState<InspectionTab>('handover');
  const [odometerOut, setOdometerOut] = useState('');
  const [fuelOut, setFuelOut] = useState('Full (8/8)');
  const [conditionOut, setConditionOut] = useState('');
  const [handoverPassed, setHandoverPassed] = useState<InspectionItemId[]>([]);
  const [handoverFlagged, setHandoverFlagged] = useState<InspectionItemId[]>([]);
  const [odometerIn, setOdometerIn] = useState('');
  const [fuelIn, setFuelIn] = useState('Full (8/8)');
  const [damageNotes, setDamageNotes] = useState('');
  const [returnPassed, setReturnPassed] = useState<InspectionItemId[]>([]);
  const [returnFlagged, setReturnFlagged] = useState<InspectionItemId[]>([]);
  const [savingDrawer, setSavingDrawer] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  // Manual New Booking Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSource, setNewSource] = useState<BookingSource>('WhatsApp');
  const [newService, setNewService] = useState<'chauffeur' | 'self-drive' | 'airport-transfer'>('chauffeur');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('+254 ');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newPickup, setNewPickup] = useState('Kisumu International Airport (KIS)');
  const [newDest, setNewDest] = useState('Kisumu CBD');
  const [newPickupDate, setNewPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newReturnDate, setNewReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newFlight, setNewFlight] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newError, setNewError] = useState('');

  useEffect(() => {
    if (isDemoMode) {
      const sorted = [...demo.bookings].sort((a, b) =>
        (b.pickupDate || '').localeCompare(a.pickupDate || '')
      );
      setBookings(sorted);
      setSelectedBooking((prev) => (prev ? sorted.find((r) => r.id === prev.id) || null : null));
      setVehicles(demo.vehicles);
      setNewVehicleId((prev) => prev || demo.vehicles[0]?.id || '');
      setDrivers(demo.drivers);
      setInquiries(demo.inquiries);
      return;
    }

    const unsubB = onSnapshot(
      query(collection(db, 'bookings'), orderBy('pickupDate', 'desc')),
      (snap) => {
        const rows = snap.docs.map((d) => ({ ...(d.data() as BookingDoc), id: d.id }));
        setBookings(rows);
        setSelectedBooking((prev) => (prev ? rows.find((r) => r.id === prev.id) || null : null));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
    );

    const unsubV = onSnapshot(
      collection(db, 'vehicles'),
      (snap) => {
        const vRows = snap.docs.map((d) => ({ ...(d.data() as VehicleDoc), id: d.id }));
        setVehicles(vRows);
        setNewVehicleId((prev) => prev || vRows[0]?.id || '');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'vehicles')
    );

    const unsubD = onSnapshot(
      collection(db, 'drivers'),
      (snap) => {
        setDrivers(snap.docs.map((d) => ({ ...(d.data() as DriverDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'drivers')
    );

    const unsubI = onSnapshot(
      collection(db, 'inquiries'),
      (snap) => {
        setInquiries(snap.docs.map((d) => ({ ...(d.data() as InquiryDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries')
    );

    return () => {
      unsubB();
      unsubV();
      unsubD();
      unsubI();
    };
  }, [isDemoMode, demo.bookings, demo.vehicles, demo.drivers, demo.inquiries]);

  const openDetail = (bk: BookingDoc, preferredTab?: InspectionTab) => {
    const matchedVehicle = vehicles.find((v) => v.id === bk.vehicleId);
    const defaultTab: InspectionTab =
      preferredTab ||
      (bk.status === 'Active'
        ? 'return'
        : bk.status === 'Completed'
          ? 'compare'
          : 'handover');

    setSelectedBooking(bk);
    setInspectionTab(defaultTab);
    setAssignVehicleId(bk.vehicleId);
    setAssignDriverId(bk.driverId || '');
    setOdometerOut(
      bk.odometerOut !== undefined
        ? String(bk.odometerOut)
        : matchedVehicle?.currentOdometerKm
          ? String(matchedVehicle.currentOdometerKm)
          : ''
    );
    setFuelOut(bk.fuelOut || 'Full (8/8)');
    setConditionOut(bk.conditionOut || '');
    setHandoverPassed(sanitizeInspectionIds(bk.handoverPassedItems));
    setHandoverFlagged(sanitizeInspectionIds(bk.handoverFlaggedItems));
    setOdometerIn(bk.odometerIn !== undefined ? String(bk.odometerIn) : '');
    setFuelIn(bk.fuelIn || bk.fuelOut || 'Full (8/8)');
    setDamageNotes(bk.damageNotes || '');
    setReturnPassed(sanitizeInspectionIds(bk.returnPassedItems));
    setReturnFlagged(sanitizeInspectionIds(bk.returnFlaggedItems));
    setSaveNotice('');
  };

  const startConvertInquiry = (inq: InquiryDoc) => {
    const matchedVeh = vehicles.find(
      (v) =>
        v.name.toLowerCase() === inq.vehicleClass.toLowerCase() ||
        inq.vehicleClass.toLowerCase().includes(v.name.toLowerCase())
    );
    const todayStr = new Date().toISOString().split('T')[0];
    setConvertingInquiryId(inq.id);
    setNewSource('Online');
    setNewService(inq.topic === 'KIS Airport Pickup' ? 'airport-transfer' : 'chauffeur');
    setNewVehicleId(matchedVeh?.id || vehicles[0]?.id || '');
    setNewClientName(inq.name);
    setNewClientPhone(inq.phone || '+254 ');
    setNewClientEmail(inq.email || '');
    setNewPickup(
      inq.topic === 'KIS Airport Pickup' ? 'Kisumu International Airport (KIS)' : 'Kisumu CBD'
    );
    setNewPickupDate(inq.travelDate || todayStr);
    setNewReturnDate(inq.travelDate || todayStr);
    setNewNotes(`[${inq.reference} · ${inq.topic}] ${inq.message}`.slice(0, 500));
    setNewError('');
    setShowNewModal(true);
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'inquiries') {
      setPortalView('inquiries');
      setSearchParams({}, { replace: true });
      return;
    }

    const inquiryParam = searchParams.get('inquiryId');
    if (inquiryParam && inquiries.length > 0 && vehicles.length > 0) {
      const key = `inq:${inquiryParam}`;
      if (handledDeepLinkRef.current !== key) {
        const targetInq = inquiries.find((i) => i.id === inquiryParam || i.reference === inquiryParam);
        if (targetInq) {
          handledDeepLinkRef.current = key;
          setPortalView('inquiries');
          startConvertInquiry(targetInq);
          setSearchParams({}, { replace: true });
          return;
        }
      }
    }

    const statusParam = searchParams.get('status') as BookingStatus | null;
    if (statusParam && STATUS_FILTERS.includes(statusParam)) {
      setPortalView('bookings');
      setStatusFilter(statusParam);
      setSearchParams({}, { replace: true });
      return;
    }

    const isNewParam = searchParams.get('new');
    if (isNewParam === '1') {
      const vehParam = searchParams.get('vehicleId');
      const dateParam = searchParams.get('date');
      if (vehParam) setNewVehicleId(vehParam);
      if (dateParam) {
        setNewPickupDate(dateParam);
        setNewReturnDate(dateParam);
      }
      setConvertingInquiryId(null);
      setShowNewModal(true);
      setSearchParams({}, { replace: true });
      return;
    }

    const refParam = searchParams.get('ref');
    if (!refParam || bookings.length === 0) return;
    const key = `${refParam}:${tabParam || ''}`;
    if (handledDeepLinkRef.current === key) return;
    const target = bookings.find(
      (b) => b.bookingRef.toLowerCase() === refParam.toLowerCase() || b.id === refParam
    );
    if (target) {
      handledDeepLinkRef.current = key;
      setPortalView('bookings');
      openDetail(
        target,
        tabParam === 'handover' || tabParam === 'return' || tabParam === 'compare'
          ? (tabParam as InspectionTab)
          : undefined
      );
      setSearchParams({}, { replace: true });
    }
  }, [bookings, vehicles, inquiries, searchParams, setSearchParams]);

  const openInquiriesCount = useMemo(
    () => inquiries.filter((i) => i.status === 'New' || i.status === 'Contacted').length,
    [inquiries]
  );

  const filteredInquiries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inquiries
      .filter((i) => {
        if (inquiryFilter === 'Open') {
          if (i.status !== 'New' && i.status !== 'Contacted') return false;
        } else if (inquiryFilter !== 'All' && i.status !== inquiryFilter) {
          return false;
        }
        if (!q) return true;
        return `${i.reference} ${i.name} ${i.organization || ''} ${i.phone || ''} ${i.email || ''} ${i.topic} ${i.vehicleClass} ${i.message}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.reference.localeCompare(a.reference));
  }, [inquiries, inquiryFilter, searchQuery]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.bookingRef.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.clientPhone.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q)
      );
    });
  }, [bookings, statusFilter, searchQuery]);

  async function handleSaveAssignmentAndStatus(nextStatus?: BookingStatus) {
    if (!selectedBooking) return;
    setSavingDrawer(true);
    setSaveNotice('');
    try {
      const chosenVehicle = vehicles.find((v) => v.id === assignVehicleId);
      const chosenDriver = drivers.find((d) => d.id === assignDriverId);
      const finalStatus = nextStatus || selectedBooking.status;
      const inspectorName = (staffProfile?.fullName || staffProfile?.email || 'Dispatch').slice(
        0,
        120
      );
      const stampNow = formatStampNow().slice(0, 40);

      const cleanOdoOut = odometerOut.trim() ? Math.max(0, Math.round(Number(odometerOut))) : null;
      const cleanOdoIn = odometerIn.trim() ? Math.max(0, Math.round(Number(odometerIn))) : null;
      const cleanHandoverPassed = sanitizeInspectionIds(handoverPassed);
      const cleanHandoverFlagged = sanitizeInspectionIds(handoverFlagged);
      const cleanReturnPassed = sanitizeInspectionIds(returnPassed);
      const cleanReturnFlagged = sanitizeInspectionIds(returnFlagged);

      const bookingPatch: Record<string, unknown> = {
        vehicleId: (chosenVehicle ? chosenVehicle.id : selectedBooking.vehicleId).slice(0, 80),
        vehicleName: (chosenVehicle ? chosenVehicle.name : selectedBooking.vehicleName).slice(
          0,
          100
        ),
        registrationPlate: (chosenVehicle
          ? chosenVehicle.registrationPlate
          : selectedBooking.registrationPlate || ''
        ).slice(0, 20),
        status: finalStatus,
        updatedAt: serverTimestamp(),
      };

      if (chosenDriver) {
        bookingPatch.driverId = chosenDriver.id.slice(0, 80);
        bookingPatch.driverName = chosenDriver.fullName.slice(0, 100);
        bookingPatch.driverPhone = chosenDriver.phone.slice(0, 30);
      } else {
        bookingPatch.driverId = deleteField();
        bookingPatch.driverName = deleteField();
        bookingPatch.driverPhone = deleteField();
      }

      if (cleanOdoOut !== null && Number.isFinite(cleanOdoOut)) {
        bookingPatch.odometerOut = cleanOdoOut;
      } else {
        bookingPatch.odometerOut = deleteField();
      }
      bookingPatch.fuelOut = fuelOut.trim() ? fuelOut.trim().slice(0, 40) : deleteField();
      bookingPatch.conditionOut = conditionOut.trim()
        ? conditionOut.trim().slice(0, 300)
        : deleteField();

      bookingPatch.handoverPassedItems =
        cleanHandoverPassed.length > 0 ? cleanHandoverPassed : deleteField();
      bookingPatch.handoverFlaggedItems =
        cleanHandoverFlagged.length > 0 ? cleanHandoverFlagged : deleteField();

      if (
        (nextStatus === 'Active' ||
          inspectionTab === 'handover' ||
          cleanHandoverPassed.length > 0 ||
          cleanOdoOut !== null) &&
        (cleanHandoverPassed.length > 0 || cleanOdoOut !== null || nextStatus === 'Active')
      ) {
        bookingPatch.handoverCompletedBy = inspectorName;
        bookingPatch.handoverCompletedAt = stampNow;
      }

      if (cleanOdoIn !== null && Number.isFinite(cleanOdoIn)) {
        bookingPatch.odometerIn = cleanOdoIn;
      } else {
        bookingPatch.odometerIn = deleteField();
      }
      bookingPatch.fuelIn = fuelIn.trim() ? fuelIn.trim().slice(0, 40) : deleteField();
      bookingPatch.damageNotes = damageNotes.trim()
        ? damageNotes.trim().slice(0, 300)
        : deleteField();

      bookingPatch.returnPassedItems =
        cleanReturnPassed.length > 0 ? cleanReturnPassed : deleteField();
      bookingPatch.returnFlaggedItems =
        cleanReturnFlagged.length > 0 ? cleanReturnFlagged : deleteField();

      if (
        (nextStatus === 'Completed' ||
          inspectionTab === 'return' ||
          cleanReturnPassed.length > 0 ||
          cleanOdoIn !== null) &&
        (cleanReturnPassed.length > 0 || cleanOdoIn !== null || nextStatus === 'Completed')
      ) {
        bookingPatch.returnCompletedBy = inspectorName;
        bookingPatch.returnCompletedAt = stampNow;
      }

      if (isDemoMode) {
        const handoverStampNeeded =
          (nextStatus === 'Active' ||
            inspectionTab === 'handover' ||
            cleanHandoverPassed.length > 0 ||
            cleanOdoOut !== null) &&
          (cleanHandoverPassed.length > 0 || cleanOdoOut !== null || nextStatus === 'Active');

        const returnStampNeeded =
          (nextStatus === 'Completed' ||
            inspectionTab === 'return' ||
            cleanReturnPassed.length > 0 ||
            cleanOdoIn !== null) &&
          (cleanReturnPassed.length > 0 || cleanOdoIn !== null || nextStatus === 'Completed');

        const updatedBooking: BookingDoc = {
          ...selectedBooking,
          vehicleId: (chosenVehicle ? chosenVehicle.id : selectedBooking.vehicleId).slice(0, 80),
          vehicleName: (chosenVehicle ? chosenVehicle.name : selectedBooking.vehicleName).slice(
            0,
            100
          ),
          registrationPlate: (chosenVehicle
            ? chosenVehicle.registrationPlate
            : selectedBooking.registrationPlate || ''
          ).slice(0, 20),
          status: finalStatus,
          driverId: chosenDriver ? chosenDriver.id.slice(0, 80) : undefined,
          driverName: chosenDriver ? chosenDriver.fullName.slice(0, 100) : undefined,
          driverPhone: chosenDriver ? chosenDriver.phone.slice(0, 30) : undefined,
          odometerOut: cleanOdoOut !== null && Number.isFinite(cleanOdoOut) ? cleanOdoOut : undefined,
          fuelOut: fuelOut.trim() ? fuelOut.trim().slice(0, 40) : undefined,
          conditionOut: conditionOut.trim() ? conditionOut.trim().slice(0, 300) : undefined,
          handoverPassedItems: cleanHandoverPassed.length > 0 ? cleanHandoverPassed : undefined,
          handoverFlaggedItems: cleanHandoverFlagged.length > 0 ? cleanHandoverFlagged : undefined,
          handoverCompletedBy: handoverStampNeeded
            ? inspectorName
            : selectedBooking.handoverCompletedBy,
          handoverCompletedAt: handoverStampNeeded
            ? stampNow
            : selectedBooking.handoverCompletedAt,
          odometerIn: cleanOdoIn !== null && Number.isFinite(cleanOdoIn) ? cleanOdoIn : undefined,
          fuelIn: fuelIn.trim() ? fuelIn.trim().slice(0, 40) : undefined,
          damageNotes: damageNotes.trim() ? damageNotes.trim().slice(0, 300) : undefined,
          returnPassedItems: cleanReturnPassed.length > 0 ? cleanReturnPassed : undefined,
          returnFlaggedItems: cleanReturnFlagged.length > 0 ? cleanReturnFlagged : undefined,
          returnCompletedBy: returnStampNeeded ? inspectorName : selectedBooking.returnCompletedBy,
          returnCompletedAt: returnStampNeeded ? stampNow : selectedBooking.returnCompletedAt,
        };

        demo.setBookings((prev) =>
          prev.map((item) => (item.id === selectedBooking.id ? updatedBooking : item))
        );

        if (chosenVehicle && (finalStatus === 'Active' || finalStatus === 'Completed')) {
          demo.setVehicles((prev) =>
            prev.map((vItem) =>
              vItem.id === chosenVehicle.id
                ? {
                    ...vItem,
                    status: finalStatus === 'Active' ? 'Booked' : 'Available',
                    currentOdometerKm:
                      finalStatus === 'Completed' &&
                      cleanOdoIn !== null &&
                      Number.isFinite(cleanOdoIn)
                        ? cleanOdoIn
                        : Math.max(0, Number(chosenVehicle.currentOdometerKm) || 0),
                  }
                : vItem
            )
          );
        }

        if (chosenDriver && (finalStatus === 'Active' || finalStatus === 'Completed')) {
          demo.setDrivers((prev) =>
            prev.map((dItem) =>
              dItem.id === chosenDriver.id
                ? {
                    ...dItem,
                    status: finalStatus === 'Active' ? 'On Trip' : 'Available',
                    tripCount:
                      finalStatus === 'Completed'
                        ? (Number(chosenDriver.tripCount) || 0) + 1
                        : Number(chosenDriver.tripCount) || 0,
                  }
                : dItem
            )
          );
        }

        if (nextStatus === 'Active') {
          setInspectionTab('return');
          setSaveNotice('Vehicle dispatched and departure checklist logged.');
        } else if (nextStatus === 'Completed') {
          setInspectionTab('compare');
          setSaveNotice('Return inspection saved and trip closed.');
        } else {
          setSaveNotice('Inspection checklist and assignment saved.');
        }
        return;
      }

      try {
        await updateDoc(doc(db, 'bookings', selectedBooking.id), bookingPatch);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${selectedBooking.id}`);
      }

      // Sync vehicle and driver statuses on Dispatch / Complete
      if (chosenVehicle && (finalStatus === 'Active' || finalStatus === 'Completed')) {
        try {
          const vehiclePatch: Record<string, unknown> = {
            status: finalStatus === 'Active' ? 'Booked' : 'Available',
            currentOdometerKm:
              finalStatus === 'Completed' && cleanOdoIn !== null && Number.isFinite(cleanOdoIn)
                ? cleanOdoIn
                : Math.max(0, Number(chosenVehicle.currentOdometerKm) || 0),
            updatedAt: serverTimestamp(),
          };
          if (chosenVehicle.selfDriveRateKes === undefined) {
            vehiclePatch.selfDriveRateKes = 0;
          }
          await updateDoc(doc(db, 'vehicles', chosenVehicle.id), vehiclePatch);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `vehicles/${chosenVehicle.id}`);
        }
      }

      if (chosenDriver && (finalStatus === 'Active' || finalStatus === 'Completed')) {
        try {
          await updateDoc(doc(db, 'drivers', chosenDriver.id), {
            status: finalStatus === 'Active' ? 'On Trip' : 'Available',
            tripCount:
              finalStatus === 'Completed'
                ? (Number(chosenDriver.tripCount) || 0) + 1
                : Number(chosenDriver.tripCount) || 0,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `drivers/${chosenDriver.id}`);
        }
      }

      if (nextStatus === 'Active') {
        setInspectionTab('return');
        setSaveNotice('Vehicle dispatched and departure checklist logged.');
      } else if (nextStatus === 'Completed') {
        setInspectionTab('compare');
        setSaveNotice('Return inspection saved and trip closed.');
      } else {
        setSaveNotice('Inspection checklist and assignment saved.');
      }
    } finally {
      setSavingDrawer(false);
    }
  }

  async function handleCreateManualBooking(e: FormEvent) {
    e.preventDefault();
    setNewError('');
    if (!newClientName.trim() || !newClientPhone.trim()) {
      setNewError('Client name and phone number are required.');
      return;
    }
    const v = vehicles.find((x) => x.id === newVehicleId) || vehicles[0];
    if (!v) return;

    const start = new Date(`${newPickupDate}T00:00:00`);
    const end = new Date(`${newReturnDate}T00:00:00`);
    const rawDays =
      newService === 'airport-transfer'
        ? 1
        : Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const days = Math.min(365, Math.max(1, Number.isFinite(rawDays) ? rawDays : 1));
    const quotedRaw =
      newService === 'airport-transfer'
        ? v.dailyRateKes
        : (newService === 'self-drive' && v.selfDriveRateKes ? v.selfDriveRateKes : v.dailyRateKes) *
          days;
    const quoted = Math.max(0, Number(quotedRaw) || 0);

    const id = `bk_${Date.now()}`;
    const bookingRef = `KCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: BookingDoc = {
      id,
      bookingRef,
      serviceType: newService,
      vehicleId: v.id.slice(0, 80),
      vehicleName: v.name.slice(0, 100),
      registrationPlate: (v.registrationPlate || '').slice(0, 20),
      pickupLocation: (newPickup.trim() || 'Kisumu CBD').slice(0, 200),
      destination: (newDest.trim() || 'Kisumu').slice(0, 200),
      pickupDate: newPickupDate.slice(0, 20),
      pickupTime: '08:00',
      returnDate: (newService === 'airport-transfer' ? newPickupDate : newReturnDate).slice(0, 20),
      returnTime: '17:00',
      rentalDays: days,
      flightNumber: newFlight.trim().slice(0, 40),
      notes: newNotes.trim().slice(0, 500),
      clientName: newClientName.trim().slice(0, 120),
      clientPhone: newClientPhone.trim().slice(0, 30),
      clientEmail: newClientEmail.trim().slice(0, 120),
      quotedAmountKes: quoted,
      amountPaidKes: 0,
      paymentStatus: 'Unpaid',
      status: 'Confirmed',
      source: newSource,
    };

    const handlerName = (staffProfile?.fullName || staffProfile?.email || 'Kisumu Dispatch').slice(
      0,
      120
    );

    if (isDemoMode) {
      demo.setBookings((prev) => [newRecord, ...prev]);
      if (convertingInquiryId) {
        demo.setInquiries((prev) =>
          prev.map((item) =>
            item.id === convertingInquiryId
              ? {
                  ...item,
                  status: 'Converted',
                  bookingRef: newRecord.bookingRef,
                  handledBy: handlerName,
                }
              : item
          )
        );
        setConvertingInquiryId(null);
        setPortalView('bookings');
      }
      setShowNewModal(false);
      setNewClientName('');
      setNewClientPhone('+254 ');
      setNewClientEmail('');
      setNewFlight('');
      setNewNotes('');
      return;
    }

    try {
      await setDoc(doc(db, 'bookings', id), {
        bookingRef: newRecord.bookingRef,
        serviceType: newRecord.serviceType,
        vehicleId: newRecord.vehicleId,
        vehicleName: newRecord.vehicleName,
        registrationPlate: newRecord.registrationPlate,
        pickupLocation: newRecord.pickupLocation,
        destination: newRecord.destination,
        pickupDate: newRecord.pickupDate,
        pickupTime: newRecord.pickupTime,
        returnDate: newRecord.returnDate,
        returnTime: newRecord.returnTime,
        rentalDays: newRecord.rentalDays,
        flightNumber: newRecord.flightNumber,
        notes: newRecord.notes,
        clientName: newRecord.clientName,
        clientPhone: newRecord.clientPhone,
        clientEmail: newRecord.clientEmail,
        quotedAmountKes: newRecord.quotedAmountKes,
        amountPaidKes: 0,
        paymentStatus: 'Unpaid',
        status: 'Confirmed',
        source: newSource,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (convertingInquiryId) {
        try {
          await updateDoc(doc(db, 'inquiries', convertingInquiryId), {
            status: 'Converted',
            bookingRef: newRecord.bookingRef,
            handledBy: handlerName,
            updatedAt: serverTimestamp(),
          });
        } catch (inqErr) {
          handleFirestoreError(inqErr, OperationType.UPDATE, `inquiries/${convertingInquiryId}`);
        }
        setConvertingInquiryId(null);
        setPortalView('bookings');
      }

      setShowNewModal(false);
      setNewClientName('');
      setNewClientPhone('+254 ');
      setNewClientEmail('');
      setNewFlight('');
      setNewNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `bookings/${id}`);
    }
  }

  async function handleUpdateInquiryStatus(inq: InquiryDoc, nextStatus: InquiryStatus) {
    const handlerName = (staffProfile?.fullName || staffProfile?.email || 'Kisumu Dispatch').slice(
      0,
      120
    );
    if (isDemoMode) {
      demo.setInquiries((prev) =>
        prev.map((item) =>
          item.id === inq.id ? { ...item, status: nextStatus, handledBy: handlerName } : item
        )
      );
      return;
    }
    try {
      await updateDoc(doc(db, 'inquiries', inq.id), {
        status: nextStatus,
        handledBy: handlerName,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `inquiries/${inq.id}`);
    }
  }

  function buildCustomerWhatsAppHref(bk: BookingDoc): string {
    const phone = cleanWhatsAppPhone(bk.clientPhone);
    const lines = [
      `Habari ${bk.clientName},`,
      `Your Kechas Agencies booking (${bk.bookingRef}) is ${bk.status.toUpperCase()}.`,
      `• Vehicle: ${bk.vehicleName}${bk.registrationPlate ? ` (${bk.registrationPlate})` : ''}`,
      bk.driverName
        ? `• Chauffeur: ${bk.driverName}${bk.driverPhone ? ` · ${bk.driverPhone}` : ''}`
        : '',
      `• Pickup: ${bk.pickupLocation} on ${bk.pickupDate} at ${bk.pickupTime}`,
      `• Destination: ${bk.destination}`,
      isAdmin
        ? `• Quoted Total: ${formatKes(bk.quotedAmountKes)} (Balance: ${formatKes(
            Math.max(0, bk.quotedAmountKes - bk.amountPaidKes)
          )})`
        : '',
      `Karibu! Questions: 0722 403 413.`,
    ]
      .filter(Boolean)
      .join('\n');
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`;
  }

  return (
    <AdminLayout
      title={isAdmin ? 'Bookings & Reservations Manager' : 'Dispatch Queue & Trip Assignments'}
      breadcrumb="Bookings"
    >
      <div className={`space-y-6 ${showPrintSlip ? 'print:hidden' : ''}`}>
        {/* Top Mode Switcher: Bookings Queue vs Contact Inquiries */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#111827]/10 pb-4">
          <div className="flex items-center gap-1 p-1 bg-[#EFF3F9] rounded-lg border border-[#111827]/10">
            <button
              type="button"
              onClick={() => setPortalView('bookings')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                portalView === 'bookings'
                  ? 'bg-[#194793] text-white'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
              <span>Bookings Queue ({bookings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setPortalView('inquiries')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                portalView === 'inquiries'
                  ? 'bg-[#194793] text-white'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <Inbox className="w-4 h-4" aria-hidden="true" />
              <span>Contact Inquiries ({openInquiriesCount} open)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setConvertingInquiryId(null);
              setShowNewModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {portalView === 'bookings' ? (
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFF3F9] rounded-lg border border-[#111827]/10">
              {STATUS_FILTERS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-[#194793] text-white'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFF3F9] rounded-lg border border-[#111827]/10">
              {(['Open', 'New', 'Contacted', 'Converted', 'Archived', 'All'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setInquiryFilter(st)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                      inquiryFilter === st
                        ? 'bg-[#194793] text-white'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          )}

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                portalView === 'bookings'
                  ? 'Search ref, client, +254...'
                  : 'Search inquiry ref, client, org...'
              }
              className="w-full pl-9 pr-3 py-2 rounded-md border border-[#111827]/20 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#194793]"
            />
          </div>
        </div>

        {portalView === 'inquiries' ? (
          <div className="rounded-lg border border-[#111827]/10 bg-white divide-y divide-[#111827]/10">
            {filteredInquiries.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm font-medium text-[#111827]">No matching inquiries found.</p>
                <p className="text-xs text-[#4B5563]">
                  Quick Inquiries submitted on the public Contact page appear here immediately.
                </p>
              </div>
            ) : (
              filteredInquiries.map((inq) => {
                const digits = inq.phone ? cleanWhatsAppPhone(inq.phone) : '';
                const waHref = digits
                  ? `https://wa.me/${digits}?text=${encodeURIComponent(
                      `Habari ${inq.name}, following up from Kechas Agencies Kisumu Dispatch on your ${inq.topic} inquiry (${inq.reference}).`
                    )}`
                  : '';
                const isArchivedLocked = inq.status === 'Archived' && !isAdmin;
                return (
                  <div
                    key={inq.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F9FAFB]"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-[#194793]">
                          {inq.reference}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            inq.status === 'New'
                              ? 'text-[#D61C1C]'
                              : inq.status === 'Contacted'
                                ? 'text-[#194793]'
                                : inq.status === 'Converted'
                                  ? 'text-[#16A34A]'
                                  : 'text-[#6B7280]'
                          }`}
                        >
                          {inq.status}
                        </span>
                        {inq.bookingRef && (
                          <span className="font-mono text-[#16A34A]">
                            → Booking {inq.bookingRef}
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#111827]">{inq.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[#4B5563] tabular-nums">
                          {inq.travelDate || 'Flexible dates'}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-[#111827]">
                        {inq.name}
                        {inq.organization ? ` (${inq.organization})` : ''} ·{' '}
                        <span className="font-normal text-[#4B5563]">
                          {[inq.phone, inq.email].filter(Boolean).join(' · ')}
                        </span>
                      </p>

                      <p className="text-xs text-[#4B5563]">
                        Requested: <span className="font-medium text-[#111827]">{inq.vehicleClass}</span>{' '}
                        · Reply via <span className="font-medium text-[#111827]">{inq.replyVia}</span>
                        {inq.handledBy ? ` · Handled by ${inq.handledBy}` : ''}
                      </p>

                      <p className="text-xs sm:text-sm text-[#111827] bg-[#F9FAFB] border border-[#111827]/10 rounded p-3">
                        {inq.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {waHref && (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#16A34A]/30 bg-[#F0FDF4] text-xs font-semibold text-[#15803D] hover:bg-[#DCFCE7] whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {inq.status === 'New' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateInquiryStatus(inq, 'Contacted')}
                          className="px-3 py-2 rounded-md border border-[#111827]/20 text-xs font-semibold text-[#111827] hover:bg-[#EFF3F9] whitespace-nowrap"
                        >
                          Mark Contacted
                        </button>
                      )}
                      {inq.status !== 'Converted' && !isArchivedLocked && (
                        <button
                          type="button"
                          onClick={() => startConvertInquiry(inq)}
                          className="px-3.5 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672] whitespace-nowrap"
                        >
                          Convert to Booking
                        </button>
                      )}
                      {inq.status !== 'Archived' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateInquiryStatus(inq, 'Archived')}
                          className="px-3 py-2 rounded-md border border-[#111827]/15 text-xs text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB] whitespace-nowrap"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
        /* Bookings Table */
        <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm font-medium text-[#111827]">No matching bookings found.</p>
              <p className="text-xs text-[#4B5563]">
                Try clearing filters or log a walk-in/WhatsApp reservation above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#111827]/10 bg-[#F9FAFB] text-xs font-semibold text-[#4B5563]">
                    <th className="py-3 px-4">Ref / Source</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Vehicle & Driver</th>
                    <th className="py-3 px-4">Route & Dates</th>
                    <th className={`py-3 px-4 ${isAdmin ? 'text-right' : ''}`}>
                      {isAdmin ? 'Quoted / Paid' : 'Service & Clearance'}
                    </th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]/10 text-xs sm:text-sm">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-[#194793]">{b.bookingRef}</div>
                        <div className="text-[11px] text-[#4B5563]">{b.source}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#111827]">{b.clientName}</div>
                        <div className="font-mono text-[11px] text-[#4B5563]">{b.clientPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#111827]">{b.vehicleName}</div>
                        <div className="text-[11px] text-[#4B5563]">
                          {b.registrationPlate || 'Unassigned'} · {b.driverName || 'No driver yet'}
                        </div>
                        {b.odometerOut !== undefined && (
                          <div className="font-mono text-[11px] text-[#194793] tabular-nums">
                            Out: {b.odometerOut.toLocaleString()} km
                            {b.fuelOut ? ` · ${b.fuelOut}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#111827] truncate max-w-[220px]">
                          {b.pickupLocation} → {b.destination}
                        </div>
                        <div className="font-mono text-[11px] text-[#4B5563] tabular-nums">
                          {b.pickupDate} → {b.returnDate} ({b.rentalDays}d)
                        </div>
                      </td>
                      {isAdmin ? (
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          <div className="font-semibold text-[#111827]">
                            {formatKes(b.quotedAmountKes)}
                          </div>
                          <div className="text-[11px] text-[#4B5563]">
                            Paid: {formatKes(b.amountPaidKes)}
                          </div>
                        </td>
                      ) : (
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#111827] capitalize">
                            {b.serviceType.replace('-', ' ')}
                          </div>
                          <div className="text-[11px] text-[#4B5563]">{b.paymentStatus}</div>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            b.status === 'Pending'
                              ? 'text-[#D97706]'
                              : b.status === 'Active' || b.status === 'Confirmed'
                                ? 'text-[#194793]'
                                : b.status === 'Completed'
                                  ? 'text-[#16A34A]'
                                  : 'text-[#C8231D]'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {b.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() =>
                              openDetail(
                                b,
                                b.status === 'Active'
                                  ? 'return'
                                  : b.status === 'Completed'
                                    ? 'compare'
                                    : 'handover'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#EFF3F9] border border-[#194793]/20 text-xs font-semibold text-[#194793] hover:bg-[#DCE5F2]"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {b.status === 'Active'
                                ? 'Return Check'
                                : b.status === 'Completed'
                                  ? 'Audit'
                                  : 'Handover'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openDetail(b)}
                          className="px-3 py-1.5 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedBooking && (
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-[#111827]/40 ${
            showPrintSlip ? 'print:hidden' : ''
          }`}
        >
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-xl border-l border-[#111827]/10 p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#111827]/10">
              <div>
                <p className="font-mono text-xs font-semibold text-[#C8231D]">
                  {selectedBooking.bookingRef} · {selectedBooking.status}
                </p>
                <h2 className="font-serif text-2xl text-[#111827]">
                  {selectedBooking.clientName}
                </h2>
                <p className="font-mono text-xs text-[#4B5563] mt-0.5">
                  {selectedBooking.clientPhone}
                  {selectedBooking.clientEmail ? ` · ${selectedBooking.clientEmail}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                aria-label="Close drawer"
                className="p-2 rounded-md border border-[#111827]/15 hover:bg-[#F9FAFB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Route Summary */}
            <div className="p-4 rounded-md bg-[#F9FAFB] border border-[#111827]/10 space-y-2 text-xs sm:text-sm">
              <div>
                <span className="text-[#4B5563]">Route: </span>
                <span className="font-medium text-[#111827]">
                  {selectedBooking.pickupLocation} → {selectedBooking.destination}
                </span>
              </div>
              <div className="font-mono tabular-nums">
                <span className="text-[#4B5563]">Schedule: </span>
                <span>
                  {selectedBooking.pickupDate} {selectedBooking.pickupTime} →{' '}
                  {selectedBooking.returnDate} {selectedBooking.returnTime} (
                  {selectedBooking.rentalDays}d)
                </span>
              </div>
              <div>
                <span className="text-[#4B5563]">Service: </span>
                <span className="capitalize font-medium">{selectedBooking.serviceType}</span>
                {selectedBooking.flightNumber && (
                  <span className="ml-2 font-mono text-[#C8231D]">
                    · Flight {selectedBooking.flightNumber}
                  </span>
                )}
              </div>
              {isAdmin ? (
                <div className="font-mono tabular-nums">
                  <span className="text-[#4B5563]">Quote: </span>
                  <span className="font-semibold text-[#194793]">
                    {formatKes(selectedBooking.quotedAmountKes)}
                  </span>
                  <span className="text-[#4B5563]">
                    {' '}
                    · Paid: {formatKes(selectedBooking.amountPaidKes)} ({selectedBooking.paymentStatus})
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-[#4B5563]">Payment Clearance: </span>
                  <span className="font-semibold text-[#194793]">
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
              )}
              {selectedBooking.notes && (
                <p className="text-xs text-[#4B5563] pt-1">Notes: {selectedBooking.notes}</p>
              )}
            </div>

            {/* Assign Vehicle & Chauffeur */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-[#111827]">
                Vehicle & Chauffeur Assignment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#4B5563]">Assigned Vehicle</label>
                  <select
                    value={assignVehicleId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setAssignVehicleId(nextId);
                      const v = vehicles.find((x) => x.id === nextId);
                      if (v?.currentOdometerKm && !selectedBooking.odometerOut) {
                        setOdometerOut(String(v.currentOdometerKm));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-xs sm:text-sm"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.registrationPlate}) — {v.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#4B5563]">
                    Assigned Chauffeur {selectedBooking.serviceType === 'self-drive' ? '(Optional)' : ''}
                  </label>
                  <select
                    value={assignDriverId}
                    onChange={(e) => setAssignDriverId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-xs sm:text-sm"
                  >
                    <option value="">-- Unassigned --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fast Handover & Return Inspection Checklists */}
            <BookingInspectionPanel
              booking={selectedBooking}
              assignedVehicle={vehicles.find((v) => v.id === assignVehicleId)}
              activeTab={inspectionTab}
              onTabChange={setInspectionTab}
              odometerOut={odometerOut}
              setOdometerOut={setOdometerOut}
              fuelOut={fuelOut}
              setFuelOut={setFuelOut}
              conditionOut={conditionOut}
              setConditionOut={setConditionOut}
              handoverPassed={handoverPassed}
              setHandoverPassed={setHandoverPassed}
              handoverFlagged={handoverFlagged}
              setHandoverFlagged={setHandoverFlagged}
              odometerIn={odometerIn}
              setOdometerIn={setOdometerIn}
              fuelIn={fuelIn}
              setFuelIn={setFuelIn}
              damageNotes={damageNotes}
              setDamageNotes={setDamageNotes}
              returnPassed={returnPassed}
              setReturnPassed={setReturnPassed}
              returnFlagged={returnFlagged}
              setReturnFlagged={setReturnFlagged}
              onOpenPrintSlip={() => setShowPrintSlip(true)}
            />

            {saveNotice && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[#F0FDF4] border border-[#16A34A]/30 text-xs font-medium text-[#15803D]">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{saveNotice}</span>
              </div>
            )}

            {/* Workflow Actions */}
            <div className="space-y-3 pt-3 border-t border-[#111827]/10">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingDrawer}
                  onClick={() => handleSaveAssignmentAndStatus()}
                  className="px-4 py-2.5 rounded-md border border-[#194793]/30 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9] disabled:opacity-60"
                >
                  {savingDrawer ? 'Saving...' : 'Save Checklist & Assignment'}
                </button>
                {selectedBooking.status === 'Pending' && (
                  <button
                    type="button"
                    disabled={savingDrawer}
                    onClick={() => handleSaveAssignmentAndStatus('Confirmed')}
                    className="px-4 py-2.5 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672] disabled:opacity-60"
                  >
                    Confirm Booking
                  </button>
                )}
                {(selectedBooking.status === 'Pending' ||
                  selectedBooking.status === 'Confirmed') && (
                  <button
                    type="button"
                    disabled={savingDrawer}
                    onClick={() => handleSaveAssignmentAndStatus('Active')}
                    className="px-4 py-2.5 rounded-md bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] disabled:opacity-60"
                  >
                    Save Handover & Dispatch Vehicle
                  </button>
                )}
                {selectedBooking.status === 'Active' && (
                  <button
                    type="button"
                    disabled={savingDrawer}
                    onClick={() => handleSaveAssignmentAndStatus('Completed')}
                    className="px-4 py-2.5 rounded-md bg-[#111827] text-white text-xs font-semibold hover:bg-[#1F2937] disabled:opacity-60"
                  >
                    Complete Return & Close Trip
                  </button>
                )}
                {selectedBooking.status !== 'Completed' &&
                  selectedBooking.status !== 'Cancelled' && (
                    <button
                      type="button"
                      disabled={savingDrawer}
                      onClick={() => handleSaveAssignmentAndStatus('Cancelled')}
                      className="px-4 py-2.5 rounded-md border border-[#C8231D]/30 text-xs font-semibold text-[#C8231D] hover:bg-[#FEF2F2] disabled:opacity-60"
                    >
                      Cancel Booking
                    </button>
                  )}
              </div>

              <a
                href={buildCustomerWhatsAppHref(selectedBooking)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#EFF3F9] border border-[#194793]/25 text-xs sm:text-sm font-semibold text-[#194793] hover:bg-[#DCE5F2]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>1-Click WhatsApp Customer Update (Plate + Driver)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <HandoverSlipModal
        open={showPrintSlip}
        booking={selectedBooking}
        odometerOut={odometerOut}
        fuelOut={fuelOut}
        conditionOut={conditionOut}
        handoverPassed={handoverPassed}
        handoverFlagged={handoverFlagged}
        odometerIn={odometerIn}
        fuelIn={fuelIn}
        damageNotes={damageNotes}
        returnPassed={returnPassed}
        returnFlagged={returnFlagged}
        onClose={() => setShowPrintSlip(false)}
      />

      {/* Manual New Booking Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4">
          <form
            onSubmit={handleCreateManualBooking}
            className="w-full max-w-lg rounded-lg bg-white border border-[#111827]/15 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#111827]">Log Walk-In / WhatsApp Booking</h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded border border-[#111827]/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Booking Source</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as BookingSource)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Phone">Phone Call</option>
                  <option value="Walk-In">Walk-In (Kisumu CBD)</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Service Type</label>
                <select
                  value={newService}
                  onChange={(e) =>
                    setNewService(
                      e.target.value as 'chauffeur' | 'self-drive' | 'airport-transfer'
                    )
                  }
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                >
                  <option value="chauffeur">Chauffeur-Driven</option>
                  <option value="self-drive">Self-Drive</option>
                  <option value="airport-transfer">KIS Airport Transfer</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Vehicle</label>
              <select
                value={newVehicleId}
                onChange={(e) => setNewVehicleId(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationPlate}) —{' '}
                    {isAdmin ? `${formatKes(v.dailyRateKes)}/day` : v.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Phone (+254) *</label>
                <input
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Pickup Location</label>
                <input
                  type="text"
                  value={newPickup}
                  onChange={(e) => setNewPickup(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Destination</label>
                <input
                  type="text"
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Pickup Date</label>
                <input
                  type="date"
                  value={newPickupDate}
                  onChange={(e) => setNewPickupDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Return Date</label>
                <input
                  type="date"
                  value={newReturnDate}
                  min={newPickupDate}
                  onChange={(e) => setNewReturnDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Flight # (Optional)</label>
                <input
                  type="text"
                  value={newFlight}
                  onChange={(e) => setNewFlight(e.target.value)}
                  placeholder="KQ 654"
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Email (Optional)</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Notes</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              />
            </div>

            {newError && <p className="text-xs text-[#C8231D]">{newError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-md border border-[#111827]/20 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
              >
                Create Confirmed Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
