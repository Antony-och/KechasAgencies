import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import ResilientImage from '../components/ResilientImage';
import { FLEET_VEHICLES, formatKes } from '../data/fleet';
import { useSiteData } from '../contexts/SiteDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useDemoPortal } from '../contexts/DemoPortalContext';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { BookingDoc } from '../lib/adminTypes';

type ServiceMode = 'chauffeur' | 'self-drive' | 'airport-transfer';

const QUICK_PICKUPS = [
  { id: 'kis', label: 'KIS Airport', full: 'Kisumu International Airport (KIS)' },
  { id: 'cbd', label: 'Kisumu CBD', full: 'Kisumu CBD — Kechas House' },
  { id: 'hotel', label: 'Hotel / Milimani', full: 'Milimani / Hotel Pickup (Kisumu)' },
  { id: 'custom', label: 'Other Address', full: 'Custom Pickup Address' },
] as const;

const TOP_ROUTES = [
  'Kisumu (CBD / Maseno / Dunga)',
  'Homa Bay / Ruma National Park',
  'Kakamega / Forest Reserve',
  'Siaya / Bondo',
  'Migori / Isebania',
  'Busia / Malaba',
  'Kisii / Nyamira',
  'Bungoma / Webuye',
  'Vihiga / Mbale',
];

const DURATION_PRESETS = [1, 2, 3, 5, 7];

function isValidKenyanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, '');
  return /^(\+?254|0)(7\d{8}|1\d{8})$/.test(cleaned);
}

function addDaysToIso(baseIso: string, days: number): string {
  const base = new Date(`${baseIso}T12:00:00`);
  if (Number.isNaN(base.getTime())) return baseIso;
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export default function BookPage() {
  const [searchParams] = useSearchParams();
  const { vehicles, settings, destinations, buildWhatsAppHref } = useSiteData();
  const { isDemoMode } = useAuth();
  const demo = useDemoPortal();

  const routeOptions = useMemo(() => {
    const set = new Set(TOP_ROUTES);
    destinations.forEach((d) => set.add(`${d.name} (${d.county})`));
    return Array.from(set);
  }, [destinations]);

  const initialVehicle = useMemo(() => {
    const paramVehicle = searchParams.get('vehicle');
    const found = vehicles.find((v) => v.id === paramVehicle);
    return found ? found.id : (vehicles[0] || FLEET_VEHICLES[0]).id;
  }, [searchParams, vehicles]);

  const initialService = useMemo<ServiceMode>(() => {
    const paramService = searchParams.get('service');
    if (
      paramService === 'chauffeur' ||
      paramService === 'self-drive' ||
      paramService === 'airport-transfer'
    ) {
      return paramService;
    }
    return 'chauffeur';
  }, [searchParams]);

  const [serviceType, setServiceType] = useState<ServiceMode>(initialService);
  const [vehicleId, setVehicleId] = useState<string>(initialVehicle);

  const [pickupChoice, setPickupChoice] = useState<(typeof QUICK_PICKUPS)[number]['id']>('kis');
  const [customPickup, setCustomPickup] = useState<string>('');
  const [destination, setDestination] = useState<string>(TOP_ROUTES[0]);

  const [pickupDate, setPickupDate] = useState<string>(getTodayIso);
  const [returnDate, setReturnDate] = useState<string>(() => addDaysToIso(getTodayIso(), 2));
  const [pickupTime, setPickupTime] = useState<string>('08:00');
  const [returnTime, setReturnTime] = useState<string>('17:00');

  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showExtras, setShowExtras] = useState<boolean>(false);

  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [copiedMpesa, setCopiedMpesa] = useState<boolean>(false);

  useEffect(() => {
    const paramVehicle = searchParams.get('vehicle');
    if (paramVehicle && vehicles.some((v) => v.id === paramVehicle)) {
      setVehicleId(paramVehicle);
    }
    const paramService = searchParams.get('service');
    if (
      paramService === 'chauffeur' ||
      paramService === 'self-drive' ||
      paramService === 'airport-transfer'
    ) {
      setServiceType(paramService);
    }
  }, [searchParams, vehicles]);

  const selectedVehicle =
    vehicles.find((v) => v.id === vehicleId) || vehicles[0] || FLEET_VEHICLES[0];

  // Auto-resolve service mode incompatibility gracefully
  const handleServiceChange = (mode: ServiceMode) => {
    setServiceType(mode);
    setFormError('');
    if (mode === 'self-drive' && !selectedVehicle.selfDriveAvailable) {
      const alt = vehicles.find((v) => v.selfDriveAvailable);
      if (alt) setVehicleId(alt.id);
    }
    if (mode === 'chauffeur' && !selectedVehicle.chauffeurAvailable) {
      const alt = vehicles.find((v) => v.chauffeurAvailable);
      if (alt) setVehicleId(alt.id);
    }
  };

  const handleDurationPreset = (days: number) => {
    setReturnDate(addDaysToIso(pickupDate, days));
  };

  const handlePickupDateChange = (newDate: string) => {
    const currentDays = rentalDays;
    setPickupDate(newDate);
    if (newDate > returnDate) {
      setReturnDate(addDaysToIso(newDate, currentDays));
    }
  };

  const rentalDays = useMemo(() => {
    if (serviceType === 'airport-transfer') return 1;
    const start = new Date(`${pickupDate}T00:00:00`);
    const end = new Date(`${returnDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [pickupDate, returnDate, serviceType]);

  const dateInvalid = useMemo(() => {
    if (serviceType === 'airport-transfer') return false;
    return returnDate < pickupDate;
  }, [pickupDate, returnDate, serviceType]);

  const activeDailyRate = useMemo(() => {
    if (
      serviceType === 'self-drive' &&
      selectedVehicle.selfDriveRateKes &&
      selectedVehicle.selfDriveRateKes > 0
    ) {
      return selectedVehicle.selfDriveRateKes;
    }
    return selectedVehicle.dailyRateKes;
  }, [selectedVehicle, serviceType]);

  const estimatedTotalKes = useMemo(() => {
    if (serviceType === 'airport-transfer') {
      return selectedVehicle.dailyRateKes;
    }
    return activeDailyRate * rentalDays;
  }, [selectedVehicle, activeDailyRate, rentalDays, serviceType]);

  const resolvedPickup = useMemo(() => {
    const item = QUICK_PICKUPS.find((p) => p.id === pickupChoice);
    if (pickupChoice === 'custom') {
      return customPickup.trim() || 'Custom Kisumu Pickup';
    }
    return item ? item.full : QUICK_PICKUPS[0].full;
  }, [pickupChoice, customPickup]);

  const serviceLabel =
    serviceType === 'chauffeur'
      ? 'Chauffeur-Driven'
      : serviceType === 'self-drive'
        ? 'Self-Drive'
        : 'KIS Airport Transfer';

  const whatsappQuoteMessage = [
    `Habari Kechas Agencies! I would like to reserve a vehicle:`,
    `• Service: ${serviceLabel}`,
    `• Vehicle: ${selectedVehicle.name}`,
    `• Pickup: ${resolvedPickup} on ${pickupDate} at ${pickupTime}`,
    serviceType === 'airport-transfer'
      ? `• Drop-off: ${destination}`
      : `• Destination: ${destination}\n• Return: ${returnDate} at ${returnTime} (${rentalDays} ${rentalDays === 1 ? 'day' : 'days'})`,
    `• Estimated Total: ${formatKes(estimatedTotalKes)}`,
    fullName.trim() ? `• Name: ${fullName.trim()}` : '',
    phone.trim() ? `• Phone: ${phone.trim()}` : '',
    notes.trim() ? `• Notes: ${notes.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    if (serviceType === 'self-drive' && !selectedVehicle.selfDriveAvailable) {
      setFormError(
        `${selectedVehicle.name} is chauffeur-driven only. Please select another vehicle or switch to Chauffeur-Driven.`
      );
      return;
    }
    if (dateInvalid) {
      setFormError('Return date cannot be earlier than your pickup date.');
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Please enter your name so we can hold the vehicle for you.');
      return;
    }
    if (!isValidKenyanPhone(phone)) {
      setFormError(
        'Please enter a valid Kenyan mobile number (e.g., 0722 403 413 or +254 722 403 413).'
      );
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address or leave it blank.');
      return;
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newRef = `KCH-${new Date().getFullYear()}-${randomCode}`;
    const bookingDocId = `bk_${Date.now()}`;

    setSubmitting(true);
    try {
      const cleanReturnDate = (serviceType === 'airport-transfer' ? pickupDate : returnDate).slice(
        0,
        20
      );
      const cleanRentalDays = Math.min(365, Math.max(1, rentalDays));
      const cleanQuoted = Math.max(0, Number(estimatedTotalKes) || 0);

      if (isDemoMode) {
        const demoRecord: BookingDoc = {
          id: bookingDocId,
          bookingRef: newRef,
          serviceType,
          vehicleId: selectedVehicle.id.slice(0, 80),
          vehicleName: selectedVehicle.name.slice(0, 100),
          registrationPlate: (selectedVehicle.registrationPlate || '').slice(0, 20),
          pickupLocation: resolvedPickup.slice(0, 200),
          destination: destination.slice(0, 200),
          pickupDate: pickupDate.slice(0, 20),
          pickupTime: pickupTime.slice(0, 20),
          returnDate: cleanReturnDate,
          returnTime: returnTime.slice(0, 20),
          rentalDays: cleanRentalDays,
          flightNumber: '',
          notes: notes.trim().slice(0, 500),
          clientName: fullName.trim().slice(0, 120),
          clientPhone: phone.trim().slice(0, 30),
          clientEmail: email.trim().slice(0, 120),
          quotedAmountKes: cleanQuoted,
          amountPaidKes: 0,
          paymentStatus: 'Unpaid',
          status: 'Pending',
          source: 'Online',
        };
        demo.setBookings((prev) => [demoRecord, ...prev]);
        setBookingRef(newRef);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const payload: Record<string, unknown> = {
        bookingRef: newRef,
        serviceType,
        vehicleId: selectedVehicle.id.slice(0, 80),
        vehicleName: selectedVehicle.name.slice(0, 100),
        registrationPlate: (selectedVehicle.registrationPlate || '').slice(0, 20),
        pickupLocation: resolvedPickup.slice(0, 200),
        destination: destination.slice(0, 200),
        pickupDate: pickupDate.slice(0, 20),
        pickupTime: pickupTime.slice(0, 20),
        returnDate: cleanReturnDate,
        returnTime: returnTime.slice(0, 20),
        rentalDays: cleanRentalDays,
        flightNumber: '',
        notes: notes.trim().slice(0, 500),
        clientName: fullName.trim().slice(0, 120),
        clientPhone: phone.trim().slice(0, 30),
        clientEmail: email.trim().slice(0, 120),
        quotedAmountKes: cleanQuoted,
        amountPaidKes: 0,
        paymentStatus: 'Unpaid',
        status: 'Pending',
        source: 'Online',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'bookings', bookingDocId), payload);
      setBookingRef(newRef);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `bookings/${bookingDocId}`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyPaybill() {
    const text = `Paybill: ${settings.mpesaPaybill} | Account: ${settings.mpesaAccount}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedMpesa(true);
        setTimeout(() => setCopiedMpesa(false), 2500);
      });
    }
  }

  return (
    <div className="py-10 lg:py-14">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2.5 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">
            Express Reservation & Quote
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl leading-tight text-[#111827]">
            Reserve in under a minute.
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-[#4B5563]">
            Tap your service, vehicle, and dates below for an instant KES quote—then confirm
            online or dispatch directly via WhatsApp.
          </p>
        </div>

        {bookingRef ? (
          <div className="rounded-lg border border-[#194793]/30 bg-white p-6 sm:p-10 space-y-6 max-w-3xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#194793] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#C8231D]">Reservation Logged</p>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#111827]">
                  Booking Reference: <span className="font-mono text-[#194793]">{bookingRef}</span>
                </h2>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              Asante, <span className="font-semibold text-[#111827]">{fullName}</span>. Our Kisumu
              dispatch desk has prepared your hold for the{' '}
              <span className="font-semibold text-[#111827]">{selectedVehicle.name}</span> (
              {serviceLabel}).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-md bg-[#F9FAFB] border border-[#111827]/10 text-sm">
              <div>
                <p className="text-xs text-[#4B5563]">Pickup</p>
                <p className="font-medium text-[#111827] mt-0.5">
                  {resolvedPickup} · {pickupDate} at {pickupTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#4B5563]">Destination</p>
                <p className="font-medium text-[#111827] mt-0.5">{destination}</p>
              </div>
              <div>
                <p className="text-xs text-[#4B5563]">Duration & Rate</p>
                <p className="font-mono font-medium text-[#111827] mt-0.5 tabular-nums">
                  {serviceType === 'airport-transfer'
                    ? `Airport Pickup Rate (${formatKes(selectedVehicle.dailyRateKes)})`
                    : `${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} × ${formatKes(activeDailyRate)}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#4B5563]">Estimated Total</p>
                <p className="font-mono text-base font-semibold text-[#194793] mt-0.5 tabular-nums">
                  {formatKes(estimatedTotalKes)}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-md bg-[#EFF3F9] border border-[#194793]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#111827]">
                  M-Pesa Paybill Settlement
                </p>
                <p className="text-sm font-mono tabular-nums text-[#194793] font-semibold">
                  Paybill: {settings.mpesaPaybill} · Account: {settings.mpesaAccount} ({bookingRef})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyPaybill}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#194793]/25 bg-white text-xs font-semibold text-[#194793] hover:bg-[#F9FAFB] whitespace-nowrap shrink-0"
              >
                {copiedMpesa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMpesa ? 'Copied' : 'Copy Paybill'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={buildWhatsAppHref(`${whatsappQuoteMessage}\n• Reference: ${bookingRef}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Reference to WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setBookingRef(null)}
                className="px-5 py-3 rounded-md border border-[#111827]/20 text-sm font-medium text-[#111827] hover:bg-[#EFF3F9] transition-colors"
              >
                Modify or New Quote
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Express Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="lg:col-span-7 rounded-lg border border-[#111827]/10 bg-white p-5 sm:p-7 space-y-6"
            >
              {/* Step 1: Service Type */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111827]">
                    1. How would you like to travel?
                  </span>
                  <span className="text-xs text-[#4B5563]">One tap</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'chauffeur', label: 'With Driver', sub: 'Chauffeur-Driven' },
                      { id: 'self-drive', label: 'Self-Drive', sub: 'Valid DL required' },
                      { id: 'airport-transfer', label: 'KIS Pickup', sub: 'Airport flat rate' },
                    ] as const
                  ).map((mode) => {
                    const active = serviceType === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleServiceChange(mode.id)}
                        className={`px-3 py-2.5 rounded-md border text-left transition-colors min-h-[52px] ${
                          active
                            ? 'bg-[#194793] text-white border-[#194793]'
                            : 'bg-[#F9FAFB] text-[#111827] border-[#111827]/15 hover:bg-[#EFF3F9]'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                          {mode.label}
                        </div>
                        <div
                          className={`text-[11px] truncate ${
                            active ? 'text-[#DBEAFE]' : 'text-[#4B5563]'
                          }`}
                        >
                          {mode.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Quick Visual Vehicle Picker */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111827]">
                    2. Pick your vehicle
                  </span>
                  <Link to="/fleet" className="text-xs text-[#194793] hover:underline">
                    Full specs
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {vehicles.map((v) => {
                    const disabled =
                      (serviceType === 'self-drive' && !v.selfDriveAvailable) ||
                      (serviceType === 'chauffeur' && !v.chauffeurAvailable);
                    const active = v.id === selectedVehicle.id;
                    const displayRate =
                      serviceType === 'airport-transfer'
                        ? v.dailyRateKes
                        : serviceType === 'self-drive' && v.selfDriveRateKes && v.selfDriveRateKes > 0
                          ? v.selfDriveRateKes
                          : v.dailyRateKes;
                    const statusSuffix =
                      v.status === 'Booked'
                        ? ' · Out on trip'
                        : v.status === 'In Maintenance'
                          ? ' · In service'
                          : '';

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setVehicleId(v.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-md border text-left transition-colors min-h-[64px] ${
                          disabled
                            ? 'opacity-45 cursor-not-allowed bg-[#F9FAFB] border-[#111827]/10'
                            : active
                              ? 'border-[#194793] bg-[#EFF3F9] ring-1 ring-[#194793]'
                              : 'border-[#111827]/15 bg-[#F9FAFB] hover:bg-[#EFF3F9]/60'
                        }`}
                      >
                        <div className="w-14 h-11 rounded overflow-hidden shrink-0 bg-[#E5EBF4]">
                          <ResilientImage
                            src={v.image}
                            alt={v.name}
                            className="w-full h-full object-cover"
                            fallbackLabel={v.name}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">
                            {v.name}
                          </div>
                          <div className="text-[11px] text-[#4B5563] tabular-nums truncate">
                            {disabled
                              ? serviceType === 'self-drive'
                                ? 'Chauffeur only'
                                : 'Self-drive only'
                              : `${v.passengers} seats · ${formatKes(displayRate)}${
                                  serviceType === 'airport-transfer' ? '' : '/d'
                                }${statusSuffix}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Route & Quick Pickup */}
              <div className="space-y-4 pt-2 border-t border-[#111827]/10">
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-[#111827]">
                    3. Pickup point
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {QUICK_PICKUPS.map((p) => {
                      const active = pickupChoice === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPickupChoice(p.id)}
                          className={`px-3 py-2.5 rounded-md text-xs font-medium border transition-colors min-h-[42px] whitespace-nowrap ${
                            active
                              ? 'bg-[#194793] text-white border-[#194793]'
                              : 'bg-[#F9FAFB] text-[#111827] border-[#111827]/15 hover:bg-[#EFF3F9]'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  {pickupChoice === 'custom' && (
                    <input
                      type="text"
                      aria-label="Custom pickup location"
                      value={customPickup}
                      onChange={(e) => setCustomPickup(e.target.value)}
                      placeholder="Enter Kisumu hotel, estate, or landmark..."
                      className="w-full mt-2 px-3.5 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="dest-select"
                    className="block text-xs font-semibold text-[#111827]"
                  >
                    Destination County / Corridor
                  </label>
                  <select
                    id="dest-select"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                  >
                    {routeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 4: Fast Dates & Duration Presets */}
              <div className="space-y-3 pt-2 border-t border-[#111827]/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#111827]">
                    4. {serviceType === 'airport-transfer' ? 'Arrival date & time' : 'Dates & duration'}
                  </span>
                  {serviceType !== 'airport-transfer' && (
                    <div className="flex items-center gap-1.5">
                      {DURATION_PRESETS.map((d) => {
                        const isPresetActive = rentalDays === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleDurationPreset(d)}
                            className={`px-2.5 py-1 rounded text-xs font-mono tabular-nums border transition-colors ${
                              isPresetActive
                                ? 'bg-[#194793] text-white border-[#194793]'
                                : 'bg-[#F9FAFB] text-[#4B5563] border-[#111827]/15 hover:text-[#111827]'
                            }`}
                          >
                            {d}d
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label htmlFor="pickup-date" className="block text-[11px] text-[#4B5563]">
                      Pickup Date
                    </label>
                    <input
                      id="pickup-date"
                      type="date"
                      value={pickupDate}
                      min={getTodayIso()}
                      onChange={(e) => handlePickupDateChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm font-mono text-[#111827] focus:outline-none focus:border-[#194793]"
                    />
                  </div>

                  {serviceType === 'airport-transfer' ? (
                    <div className="space-y-1">
                      <label htmlFor="pickup-time-transfer" className="block text-[11px] text-[#4B5563]">
                        Flight Arrival / Pickup Time
                      </label>
                      <input
                        id="pickup-time-transfer"
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm font-mono text-[#111827] focus:outline-none focus:border-[#194793]"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label htmlFor="return-date" className="block text-[11px] text-[#4B5563]">
                        Return Date ({rentalDays} {rentalDays === 1 ? 'day' : 'days'})
                      </label>
                      <input
                        id="return-date"
                        type="date"
                        value={returnDate}
                        min={pickupDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm font-mono text-[#111827] focus:outline-none focus:border-[#194793]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Step 5: Minimal Required Contact Details */}
              <div className="space-y-4 pt-3 border-t border-[#111827]/10">
                <span className="block text-xs font-semibold text-[#111827]">
                  5. Who is traveling?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label htmlFor="client-name" className="block text-xs text-[#4B5563]">
                      Full Name *
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Grace Atieno"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="client-phone" className="block text-xs text-[#4B5563]">
                      Kenyan Phone / WhatsApp *
                    </label>
                    <input
                      id="client-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0722 403 413"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm font-mono text-[#111827] focus:outline-none focus:border-[#194793]"
                    />
                  </div>
                </div>

                {/* Collapsible Optional Extras */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowExtras((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#194793] hover:underline"
                  >
                    {showExtras ? (
                      <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>
                      {showExtras
                        ? 'Hide optional details'
                        : 'Add flight number, pickup time, VAT email, or notes (optional)'}
                    </span>
                  </button>

                  {showExtras && (
                    <div className="mt-3 space-y-3 p-4 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
                      {serviceType !== 'airport-transfer' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="opt-pickup-time" className="block text-[11px] text-[#4B5563]">
                              Pickup Time
                            </label>
                            <input
                              id="opt-pickup-time"
                              type="time"
                              value={pickupTime}
                              onChange={(e) => setPickupTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white text-sm font-mono text-[#111827]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="opt-return-time" className="block text-[11px] text-[#4B5563]">
                              Return Time
                            </label>
                            <input
                              id="opt-return-time"
                              type="time"
                              value={returnTime}
                              onChange={(e) => setReturnTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white text-sm font-mono text-[#111827]"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label htmlFor="client-email" className="block text-[11px] text-[#4B5563]">
                          Email (for VAT / NGO invoice copy)
                        </label>
                        <input
                          id="client-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@organization.org"
                          className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white text-sm text-[#111827]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="client-notes" className="block text-[11px] text-[#4B5563]">
                          Flight Number or Special Requests
                        </label>
                        <input
                          id="client-notes"
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g., KQ 654 landing 07:45 AM, child seat"
                          className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white text-sm text-[#111827]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#C8231D]/30 text-xs sm:text-sm text-[#991B1B]"
                >
                  {formError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center px-5 py-3.5 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] disabled:opacity-60 transition-colors min-h-[46px]"
                >
                  {submitting ? 'Logging Reservation...' : 'Confirm Online Request'}
                </button>
                <a
                  href={buildWhatsAppHref(whatsappQuoteMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md border border-[#194793]/25 bg-[#F9FAFB] text-[#111827] text-sm font-semibold hover:bg-[#EFF3F9] transition-colors min-h-[46px]"
                >
                  <MessageCircle className="w-4 h-4 text-[#194793]" aria-hidden="true" />
                  <span>Send Quote to WhatsApp</span>
                </a>
              </div>
            </form>

            {/* Right Live Quote Summary Panel */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 rounded-lg border border-[#194793]/20 bg-[#EFF3F9] p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-[#111827]/10">
                <div className="w-20 h-16 rounded-md overflow-hidden shrink-0 bg-[#DCE5F2] border border-[#111827]/10">
                  <ResilientImage
                    src={selectedVehicle.image}
                    alt={selectedVehicle.name}
                    className="w-full h-full object-cover"
                    fallbackLabel={selectedVehicle.name}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#C8231D]">Live Estimated Quote</p>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#111827] truncate">
                    {selectedVehicle.name}
                  </h2>
                  <p className="text-xs text-[#4B5563]">
                    {selectedVehicle.passengers} Pax · {selectedVehicle.luggage} Bags ·{' '}
                    {selectedVehicle.transmission}
                  </p>
                </div>
              </div>

              {(selectedVehicle.status === 'Booked' ||
                selectedVehicle.status === 'In Maintenance') && (
                <div className="p-3.5 rounded-md bg-white border border-[#D97706]/40 text-xs text-[#92400E] leading-relaxed">
                  {selectedVehicle.status === 'Booked'
                    ? 'Live Dispatch Note: This vehicle is currently out on an active trip. Submit your dates and Kisumu Dispatch will confirm turnaround timing or pair an equivalent unit in this class.'
                    : 'Live Dispatch Note: This vehicle is undergoing scheduled workshop service. Submit your request and Dispatch will confirm release timing or assign a backup vehicle.'}
                </div>
              )}

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#4B5563]">Service</span>
                  <span className="font-medium text-[#111827]">{serviceLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#4B5563]">Pickup</span>
                  <span className="font-medium text-[#111827] text-right truncate max-w-[200px]">
                    {resolvedPickup}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#4B5563]">
                    {serviceType === 'airport-transfer' ? 'Airport Pickup Rate' : 'Daily Rate'}
                  </span>
                  <span className="font-mono tabular-nums text-[#111827]">
                    {formatKes(
                      serviceType === 'airport-transfer'
                        ? selectedVehicle.dailyRateKes
                        : activeDailyRate
                    )}
                  </span>
                </div>
                {serviceType !== 'airport-transfer' && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#4B5563]">Duration</span>
                    <span className="font-mono tabular-nums text-[#111827]">
                      {rentalDays} {rentalDays === 1 ? 'day' : 'days'} ({pickupDate} → {returnDate})
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#111827]/15 flex items-baseline justify-between gap-4">
                <span className="text-sm font-semibold text-[#111827]">Estimated Total</span>
                <span className="font-mono text-2xl font-semibold text-[#194793] tabular-nums">
                  {formatKes(estimatedTotalKes)}
                </span>
              </div>

              {/* Inclusions Breakdown */}
              <div className="p-4 rounded-md bg-white border border-[#111827]/10 space-y-2 text-xs text-[#4B5563]">
                <div className="flex items-center gap-2 font-semibold text-[#111827]">
                  <ShieldCheck className="w-4 h-4 text-[#194793]" aria-hidden="true" />
                  <span>Included in your estimate</span>
                </div>
                {serviceType === 'chauffeur' && (
                  <p className="leading-relaxed">
                    Vehicle hire, vetted regional chauffeur, comprehensive insurance, and standard
                    Kisumu corridor fuel allowance.
                  </p>
                )}
                {serviceType === 'self-drive' && (
                  <p className="leading-relaxed">
                    Comprehensive insurance and 24/7 Kisumu roadside backup. Fuel is full-to-full;
                    valid DL and ID/Passport required at handover.
                  </p>
                )}
                {serviceType === 'airport-transfer' && (
                  <p className="leading-relaxed">
                    Flight-tracked KIS Arrivals meet-and-greet, airport parking, fuel, driver, and
                    direct Kisumu CBD / Milimani drop-off.
                  </p>
                )}
                {settings.bookingTermsSummary && (
                  <p className="pt-2 border-t border-[#111827]/10 text-[11px] leading-relaxed text-[#4B5563]">
                    {settings.bookingTermsSummary}
                  </p>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-[#4B5563]">
                <span className="font-mono tabular-nums text-[#111827]">
                  Paybill: {settings.mpesaPaybill} · Acc: {settings.mpesaAccount}
                </span>
                <a
                  href={`tel:+${settings.whatsappNumber.replace(/\D/g, '')}`}
                  className="inline-flex items-center gap-1 font-semibold text-[#C8231D] hover:underline whitespace-nowrap"
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="font-mono tabular-nums">{settings.phoneDisplay}</span>
                </a>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
