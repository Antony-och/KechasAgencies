import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  Edit2,
  Eye,
  FileCheck2,
  Fuel,
  Gauge,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import {
  BookingDoc,
  ClientAccountDoc,
  ClientAccountType,
  TransactionDoc,
} from '../../lib/adminTypes';
import { formatKes } from '../../data/fleet';
import { INSPECTION_CHECKPOINTS, parseFuelEighths } from '../../lib/inspection';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoPortal } from '../../contexts/DemoPortalContext';

const CLIENT_TYPES: ('All' | ClientAccountType)[] = [
  'All',
  'Corporate / NGO',
  'Individual / Diaspora',
  'Tourist',
];

function normalizePhoneTail(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-9);
}

function getClientBookings(client: ClientAccountDoc, allBookings: BookingDoc[]): BookingDoc[] {
  const clientPhoneTail = normalizePhoneTail(client.phone);
  const clientEmail = (client.email || '').trim().toLowerCase();
  const clientName = client.name.trim().toLowerCase();

  return allBookings
    .filter((b) => {
      const bPhoneTail = normalizePhoneTail(b.clientPhone);
      if (clientPhoneTail && bPhoneTail && clientPhoneTail === bPhoneTail) return true;
      const bEmail = (b.clientEmail || '').trim().toLowerCase();
      if (clientEmail && bEmail && clientEmail === bEmail) return true;
      if (!clientPhoneTail && !clientEmail && b.clientName.trim().toLowerCase() === clientName) {
        return true;
      }
      return false;
    })
    .sort((a, b) => (b.pickupDate || '').localeCompare(a.pickupDate || ''));
}

function bookingStatusBadgeClass(status: BookingDoc['status']): string {
  if (status === 'Completed') return 'bg-[#F0FDF4] text-[#15803D] border-[#16A34A]/25';
  if (status === 'Active') return 'bg-[#EFF3F9] text-[#1B479B] border-[#1B479B]/25';
  if (status === 'Confirmed') return 'bg-[#ECFDF5] text-[#047857] border-[#10B981]/25';
  if (status === 'Pending') return 'bg-[#FEF3C7] text-[#92400E] border-[#D97706]/30';
  return 'bg-[#FEF2F2] text-[#B91C1C] border-[#D61C1C]/25';
}

function formatServiceTypeLabel(serviceType: BookingDoc['serviceType']): string {
  if (serviceType === 'airport-transfer') return 'KIS Airport Transfer';
  if (serviceType === 'self-drive') return 'Self-Drive Hire';
  return 'Chauffeur-Driven';
}

export default function AdminClientsPage() {
  const { isAdmin, isDemoMode } = useAuth();
  const demo = useDemoPortal();
  const [clients, setClients] = useState<ClientAccountDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [transactions, setTransactions] = useState<TransactionDoc[]>([]);
  const [typeFilter, setTypeFilter] = useState<'All' | ClientAccountType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Add/Edit Client Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientAccountDoc | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+254 ');
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState<ClientAccountType>('Individual / Diaspora');
  const [idOrPassport, setIdOrPassport] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [organization, setOrganization] = useState('');
  const [totalTrips, setTotalTrips] = useState(1);
  const [totalSpendKes, setTotalSpendKes] = useState(0);
  const [notes, setNotes] = useState('');

  // Client Profile & Trip Audit Detail Modal
  const [inspectingClient, setInspectingClient] = useState<ClientAccountDoc | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (showModal) {
        setShowModal(false);
      } else if (inspectingClient) {
        setInspectingClient(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, inspectingClient]);

  useEffect(() => {
    if (isDemoMode) {
      setClients([...demo.clients].sort((a, b) => a.name.localeCompare(b.name)));
      setBookings(demo.bookings);
      setTransactions(demo.transactions);
      return;
    }

    const unsubC = onSnapshot(
      query(collection(db, 'clients'), orderBy('name', 'asc')),
      (snap) => {
        setClients(snap.docs.map((d) => ({ ...(d.data() as ClientAccountDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'clients')
    );

    const unsubB = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        setBookings(snap.docs.map((d) => ({ ...(d.data() as BookingDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
    );

    const unsubT = onSnapshot(
      collection(db, 'transactions'),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ ...(d.data() as TransactionDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
    );

    return () => {
      unsubC();
      unsubB();
      unsubT();
    };
  }, [isDemoMode, demo.clients, demo.bookings, demo.transactions]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clients.filter((c) => {
      if (typeFilter !== 'All' && c.accountType !== typeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.organization || '').toLowerCase().includes(q) ||
        (c.kraPin || '').toLowerCase().includes(q)
      );
    });
  }, [clients, typeFilter, searchQuery]);

  const inspectedTrips = useMemo(() => {
    if (!inspectingClient) return [];
    return getClientBookings(inspectingClient, bookings);
  }, [inspectingClient, bookings]);

  const selectedTrip = useMemo(() => {
    if (inspectedTrips.length === 0) return null;
    if (selectedTripId) {
      const found = inspectedTrips.find((t) => t.id === selectedTripId);
      if (found) return found;
    }
    return inspectedTrips[0];
  }, [inspectedTrips, selectedTripId]);

  const selectedTripTransactions = useMemo(() => {
    if (!selectedTrip) return [];
    return transactions
      .filter(
        (tx) => tx.bookingId === selectedTrip.id || tx.bookingRef === selectedTrip.bookingRef
      )
      .sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''));
  }, [selectedTrip, transactions]);

  const inspectedSummary = useMemo(() => {
    let billed = 0;
    let paid = 0;
    for (const t of inspectedTrips) {
      if (t.status === 'Cancelled') continue;
      billed += t.quotedAmountKes || 0;
      paid += t.amountPaidKes || 0;
    }
    return {
      tripCount: inspectedTrips.length,
      billed,
      paid,
      balance: Math.max(0, billed - paid),
    };
  }, [inspectedTrips]);

  function openClientInspector(client: ClientAccountDoc) {
    setInspectingClient(client);
    const trips = getClientBookings(client, bookings);
    setSelectedTripId(trips[0]?.id ?? null);
  }

  function openAdd() {
    setEditingClient(null);
    setName('');
    setPhone('+254 ');
    setEmail('');
    setAccountType('Individual / Diaspora');
    setIdOrPassport('');
    setKraPin('');
    setOrganization('');
    setTotalTrips(1);
    setTotalSpendKes(0);
    setNotes('');
    setShowModal(true);
  }

  function openEdit(c: ClientAccountDoc) {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAccountType(c.accountType);
    setIdOrPassport(c.idOrPassport || '');
    setKraPin(c.kraPin || '');
    setOrganization(c.organization || '');
    setTotalTrips(c.totalTrips || 0);
    setTotalSpendKes(c.totalSpendKes || 0);
    setNotes(c.notes || '');
    setShowModal(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const id = editingClient ? editingClient.id : `cli_${Date.now()}`;
    const clientFields: Omit<ClientAccountDoc, 'id'> = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      accountType,
      idOrPassport: idOrPassport.trim(),
      kraPin: kraPin.trim().toUpperCase(),
      organization: organization.trim(),
      totalTrips: Number(totalTrips) || 0,
      totalSpendKes: Number(totalSpendKes) || 0,
      notes: notes.trim(),
    };

    if (isDemoMode) {
      const updatedClient: ClientAccountDoc = { id, ...clientFields };
      demo.setClients((prev) =>
        editingClient
          ? prev.map((item) => (item.id === id ? updatedClient : item))
          : [...prev, updatedClient]
      );
      if (editingClient && inspectingClient && inspectingClient.id === id) {
        setInspectingClient(updatedClient);
      }
      setShowModal(false);
      return;
    }

    const payload: Record<string, unknown> = {
      ...clientFields,
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingClient) {
        await updateDoc(doc(db, 'clients', id), payload);
        if (inspectingClient && inspectingClient.id === id) {
          setInspectingClient({
            ...inspectingClient,
            ...(payload as Partial<ClientAccountDoc>),
          });
        }
      } else {
        await setDoc(doc(db, 'clients', id), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      setShowModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `clients/${id}`);
    }
  }

  async function handleDelete(c: ClientAccountDoc) {
    if (!isAdmin) return;
    if (isDemoMode) {
      demo.setClients((prev) => prev.filter((item) => item.id !== c.id));
      if (inspectingClient?.id === c.id) {
        setInspectingClient(null);
      }
      return;
    }
    try {
      await deleteDoc(doc(db, 'clients', c.id));
      if (inspectingClient?.id === c.id) {
        setInspectingClient(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clients/${c.id}`);
    }
  }

  async function handleSyncFromBookings() {
    setSyncing(true);
    try {
      const existingPhones = new Set(
        clients.map((c) => c.phone.replace(/\D/g, '').slice(-9))
      );
      const byPhone = new Map<string, BookingDoc[]>();
      for (const b of bookings) {
        const key = b.clientPhone.replace(/\D/g, '').slice(-9);
        if (!key || existingPhones.has(key)) continue;
        const list = byPhone.get(key) || [];
        list.push(b);
        byPhone.set(key, list);
      }

      if (isDemoMode) {
        const syncedClients: ClientAccountDoc[] = Array.from(byPhone.entries()).map(
          ([key, list]) => {
            const sample = list[0];
            const spend = list.reduce((acc, x) => acc + (x.quotedAmountKes || 0), 0);
            return {
              id: `cli_sync_${key}`,
              name: sample.clientName,
              phone: sample.clientPhone,
              email: sample.clientEmail || '',
              accountType: 'Individual / Diaspora',
              idOrPassport: '',
              kraPin: '',
              organization: '',
              totalTrips: list.length,
              totalSpendKes: spend,
              notes: `Imported automatically from booking ${sample.bookingRef}`,
            };
          }
        );
        if (syncedClients.length > 0) {
          demo.setClients((prev) => [...prev, ...syncedClients]);
        }
        return;
      }

      await Promise.all(
        Array.from(byPhone.entries()).map(([key, list]) => {
          const sample = list[0];
          const spend = list.reduce((acc, x) => acc + (x.quotedAmountKes || 0), 0);
          return setDoc(doc(db, 'clients', `cli_sync_${key}`), {
            name: sample.clientName,
            phone: sample.clientPhone,
            email: sample.clientEmail || '',
            accountType: 'Individual / Diaspora',
            idOrPassport: '',
            kraPin: '',
            organization: '',
            totalTrips: list.length,
            totalSpendKes: spend,
            notes: `Imported automatically from booking ${sample.bookingRef}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'clients');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AdminLayout title="Clients & Corporate / NGO Accounts" breadcrumb="Clients CRM">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFF3F9] rounded-lg border border-[#111827]/10">
            {CLIENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  typeFilter === t
                    ? 'bg-[#194793] text-white'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search client, NGO, KRA PIN..."
                className="w-full pl-9 pr-3 py-2 rounded-md border border-[#111827]/20 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#194793]"
              />
            </div>
            <button
              type="button"
              disabled={syncing}
              onClick={handleSyncFromBookings}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#194793]/25 bg-white text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9] whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync from Bookings</span>
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#4B5563]">
              No matching client records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#111827]/10 bg-[#F9FAFB] text-xs font-semibold text-[#4B5563]">
                    <th className="py-3 px-4">Client & Organization</th>
                    <th className="py-3 px-4">Segment</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">ID / KRA PIN</th>
                    <th className="py-3 px-4 text-right">Trips</th>
                    <th className="py-3 px-4 text-right">Lifetime Spend</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]/10">
                  {filteredClients.map((c) => {
                    const matchedCount = getClientBookings(c, bookings).length;
                    const displayTrips = Math.max(c.totalTrips || 0, matchedCount);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openClientInspector(c)}
                        className="hover:bg-[#EFF3F9]/55 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111827] hover:text-[#194793]">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-[#4B5563]">
                            {c.organization || c.notes || 'Private Account'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-[#194793]">
                          {c.accountType}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs">{c.phone}</div>
                          {c.email && <div className="text-[11px] text-[#4B5563]">{c.email}</div>}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-[#4B5563]">
                          <div>{c.idOrPassport ? `ID: ${c.idOrPassport}` : '—'}</div>
                          {c.kraPin && <div className="text-[11px]">KRA: {c.kraPin}</div>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          <span>{displayTrips}</span>
                          {matchedCount > 0 && (
                            <span className="block text-[10px] text-[#194793] font-sans">
                              {matchedCount} logged
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#111827] tabular-nums">
                          {formatKes(c.totalSpendKes)}
                        </td>
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openClientInspector(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#123270]/20 bg-[#F4F7FC] text-xs font-semibold text-[#123270] hover:bg-[#DCE5F2]"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Trips & Audit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
                              aria-label={`Delete ${c.name}`}
                              className="p-1.5 rounded border border-[#C8231D]/25 text-[#C8231D] hover:bg-[#FEF2F2]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Client Profile, Previous Trips & Per-Trip Audit Modal */}
      {inspectingClient && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Client record and trip audit for ${inspectingClient.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1E45]/60 backdrop-blur-xs p-3 sm:p-5"
          onClick={() => setInspectingClient(null)}
        >
          <div
            className="w-full max-w-6xl rounded-xl bg-white border border-[#123270]/20 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header (Royal Blue / Deep Navy) */}
            <div className="bg-gradient-to-r from-[#0B1E45] via-[#123270] to-[#1B479B] text-white px-5 py-4 sm:px-7 sm:py-5 border-b-2 border-b-[#D61C1C] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-bold uppercase tracking-[0.14em] text-[#FF6B63]">
                    {inspectingClient.accountType}
                  </span>
                  {inspectingClient.organization && (
                    <>
                      <span aria-hidden="true" className="text-white/40">·</span>
                      <span className="inline-flex items-center gap-1 text-[#F8FAFC]/90 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-[#FF6B63]" aria-hidden="true" />
                        {inspectingClient.organization}
                      </span>
                    </>
                  )}
                  {inspectingClient.kraPin && (
                    <>
                      <span aria-hidden="true" className="text-white/40">·</span>
                      <span className="font-mono text-[#F8FAFC]/85">
                        KRA: {inspectingClient.kraPin}
                      </span>
                    </>
                  )}
                </div>

                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white truncate">
                  {inspectingClient.name}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#F8FAFC]/85">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-[#FF6B63]" aria-hidden="true" />
                    {inspectingClient.phone}
                  </span>
                  {inspectingClient.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#FF6B63]" aria-hidden="true" />
                      {inspectingClient.email}
                    </span>
                  )}
                  {inspectingClient.idOrPassport && (
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <User className="w-3.5 h-3.5 text-[#FF6B63]" aria-hidden="true" />
                      ID/Passport: {inspectingClient.idOrPassport}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => openEdit(inspectingClient)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-semibold text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingClient(null)}
                  aria-label="Close client details"
                  className="p-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Client Financial & Notes Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#111827]/10 bg-[#F8FAFC] divide-x divide-y sm:divide-y-0 divide-[#111827]/10 shrink-0">
              <div className="px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Matched Trips
                </p>
                <p className="font-mono text-lg font-semibold text-[#111827] tabular-nums">
                  {inspectedSummary.tripCount}
                </p>
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Billed (Trips)
                </p>
                <p className="font-mono text-lg font-semibold text-[#111827] tabular-nums">
                  {formatKes(inspectedSummary.billed || inspectingClient.totalSpendKes)}
                </p>
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Collected
                </p>
                <p className="font-mono text-lg font-semibold text-[#16A34A] tabular-nums">
                  {formatKes(inspectedSummary.paid)}
                </p>
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Outstanding
                </p>
                <p
                  className={`font-mono text-lg font-semibold tabular-nums ${
                    inspectedSummary.balance > 0 ? 'text-[#D61C1C]' : 'text-[#111827]'
                  }`}
                >
                  {formatKes(inspectedSummary.balance)}
                </p>
              </div>
            </div>

            {inspectingClient.notes && (
              <div className="px-5 py-2.5 bg-[#EFF3F9]/70 border-b border-[#1B479B]/15 text-xs text-[#123270] shrink-0">
                <span className="font-semibold">Account Notes: </span>
                <span>{inspectingClient.notes}</span>
              </div>
            )}

            {/* Modal Main Body: Left Trip Selector + Right Per-Trip Audit */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left 5 cols: Previous & Active Trips List */}
              <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#111827]/10 overflow-y-auto bg-[#F9FAFB]">
                <div className="px-5 py-3.5 border-b border-[#111827]/10 bg-white sticky top-0 z-10 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#123270]">
                    Previous & Active Trips ({inspectedTrips.length})
                  </h3>
                  <span className="text-[11px] text-[#6B7280]">Select a trip to inspect audit</span>
                </div>

                {inspectedTrips.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-sm font-medium text-[#111827]">
                      No bookings linked to {inspectingClient.phone} yet.
                    </p>
                    <p className="text-xs text-[#4B5563] leading-relaxed">
                      Trips booked under this phone number or email will automatically appear here
                      with full departure, return, and M-Pesa payment audits.
                    </p>
                    <Link
                      to="/admin/bookings?new=1"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#1B479B] text-white text-xs font-semibold hover:bg-[#15397E]"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Create Booking</span>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[#111827]/10">
                    {inspectedTrips.map((trip) => {
                      const isSelected = selectedTrip?.id === trip.id;
                      const hasHandoverAudit = Boolean(
                        trip.handoverCompletedAt ||
                          trip.odometerOut !== undefined ||
                          (trip.handoverPassedItems?.length ?? 0) > 0
                      );
                      const hasReturnAudit = Boolean(
                        trip.returnCompletedAt ||
                          trip.odometerIn !== undefined ||
                          (trip.returnPassedItems?.length ?? 0) > 0
                      );
                      const hasAnyFlag =
                        (trip.handoverFlaggedItems?.length ?? 0) > 0 ||
                        (trip.returnFlaggedItems?.length ?? 0) > 0;

                      return (
                        <button
                          key={trip.id}
                          type="button"
                          onClick={() => setSelectedTripId(trip.id)}
                          className={`w-full text-left px-5 py-4 transition-colors border-l-4 ${
                            isSelected
                              ? 'bg-white border-l-[#1B479B] shadow-xs'
                              : 'bg-transparent border-l-transparent hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-[#1B479B]">
                              {trip.bookingRef}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${bookingStatusBadgeClass(
                                trip.status
                              )}`}
                            >
                              {trip.status}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-[#111827] mt-1.5 truncate">
                            {trip.vehicleName}
                            {trip.registrationPlate ? ` (${trip.registrationPlate})` : ''}
                          </p>

                          <p className="text-xs text-[#4B5563] mt-0.5 truncate">
                            {trip.pickupLocation} → {trip.destination}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="font-mono text-[#374151] tabular-nums">
                              {trip.pickupDate} → {trip.returnDate} ({trip.rentalDays}d)
                            </span>
                            <span className="font-mono font-semibold text-[#111827] tabular-nums">
                              {formatKes(trip.quotedAmountKes)}
                            </span>
                          </div>

                          {/* Audit Readiness Summary Pill Row */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-medium ${
                                hasHandoverAudit
                                  ? 'bg-[#EFF3F9] text-[#123270]'
                                  : 'bg-[#F3F4F6] text-[#6B7280]'
                              }`}
                            >
                              {hasHandoverAudit ? 'Out Logged' : 'Out Pending'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-medium ${
                                hasReturnAudit
                                  ? 'bg-[#F0FDF4] text-[#15803D]'
                                  : 'bg-[#F3F4F6] text-[#6B7280]'
                              }`}
                            >
                              {hasReturnAudit ? 'Return Logged' : 'Return Pending'}
                            </span>
                            {hasAnyFlag && (
                              <span className="px-1.5 py-0.5 rounded font-semibold bg-[#FEF2F2] text-[#D61C1C]">
                                Flagged Item
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right 7 cols: Selected Trip Details & Complete Audit Trail */}
              <div className="lg:col-span-7 overflow-y-auto p-5 sm:p-6 space-y-6 bg-white">
                {!selectedTrip ? (
                  <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-sm text-[#4B5563] space-y-2">
                    <ClipboardCheck className="w-8 h-8 text-[#9CA3AF]" aria-hidden="true" />
                    <p>Select a trip from the list to inspect handover, return, and billing audits.</p>
                  </div>
                ) : (
                  <>
                    {/* Trip Summary Header */}
                    <div className="rounded-lg border border-[#123270]/15 bg-[#F8FAFC] p-4 sm:p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-[#1B479B]">
                              {selectedTrip.bookingRef}
                            </span>
                            <span aria-hidden="true" className="text-[#9CA3AF]">·</span>
                            <span className="font-semibold text-[#111827]">
                              {formatServiceTypeLabel(selectedTrip.serviceType)}
                            </span>
                            <span aria-hidden="true" className="text-[#9CA3AF]">·</span>
                            <span className="text-[#4B5563]">Source: {selectedTrip.source}</span>
                          </div>
                          <h4 className="font-serif text-xl font-semibold text-[#111827]">
                            {selectedTrip.vehicleName}{' '}
                            {selectedTrip.registrationPlate && (
                              <span className="font-mono text-sm font-normal text-[#4B5563]">
                                ({selectedTrip.registrationPlate})
                              </span>
                            )}
                          </h4>
                        </div>

                        <Link
                          to={`/admin/bookings?ref=${encodeURIComponent(selectedTrip.bookingRef)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-xs font-semibold whitespace-nowrap"
                        >
                          <span>Open in Bookings Desk</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#111827]/10">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-[#D61C1C] shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <p className="text-[#6B7280]">Route</p>
                            <p className="font-medium text-[#111827]">
                              {selectedTrip.pickupLocation} → {selectedTrip.destination}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-[#1B479B] shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <p className="text-[#6B7280]">Schedule ({selectedTrip.rentalDays} days)</p>
                            <p className="font-mono font-medium text-[#111827] tabular-nums">
                              {selectedTrip.pickupDate} {selectedTrip.pickupTime} →{' '}
                              {selectedTrip.returnDate} {selectedTrip.returnTime}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CarFront className="w-4 h-4 text-[#1B479B] shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <p className="text-[#6B7280]">Assigned Chauffeur</p>
                            <p className="font-medium text-[#111827]">
                              {selectedTrip.driverName
                                ? `${selectedTrip.driverName}${
                                    selectedTrip.driverPhone ? ` (${selectedTrip.driverPhone})` : ''
                                  }`
                                : selectedTrip.serviceType === 'self-drive'
                                  ? 'Self-Drive Client Handover'
                                  : 'Unassigned'}
                            </p>
                          </div>
                        </div>

                        {selectedTrip.flightNumber && (
                          <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#1B479B] shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                              <p className="text-[#6B7280]">Flight Reference</p>
                              <p className="font-mono font-medium text-[#111827]">
                                {selectedTrip.flightNumber}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedTrip.notes && (
                        <p className="text-xs text-[#4B5563] bg-white p-2.5 rounded border border-[#111827]/10">
                          <span className="font-semibold text-[#111827]">Booking Notes: </span>
                          {selectedTrip.notes}
                        </p>
                      )}
                    </div>

                    {/* Audit 1: Pre-Trip Handover Audit */}
                    <div className="rounded-lg border border-[#111827]/12 overflow-hidden">
                      <div className="px-4 py-3 bg-[#EFF3F9] border-b border-[#111827]/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-[#1B479B]" aria-hidden="true" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[#123270]">
                            1. Pre-Trip Handover Audit
                          </h5>
                        </div>
                        <span className="font-mono text-[11px] text-[#4B5563]">
                          {selectedTrip.handoverCompletedAt
                            ? `Signed ${selectedTrip.handoverCompletedAt}${
                                selectedTrip.handoverCompletedBy
                                  ? ` by ${selectedTrip.handoverCompletedBy}`
                                  : ''
                              }`
                            : 'Not yet signed out'}
                        </span>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
                            <p className="text-[#6B7280] flex items-center gap-1">
                              <Gauge className="w-3.5 h-3.5 text-[#1B479B]" aria-hidden="true" />
                              <span>Odometer Out</span>
                            </p>
                            <p className="font-mono text-sm font-semibold text-[#111827] mt-1 tabular-nums">
                              {selectedTrip.odometerOut !== undefined
                                ? `${selectedTrip.odometerOut.toLocaleString()} km`
                                : '—'}
                            </p>
                          </div>

                          <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
                            <p className="text-[#6B7280] flex items-center gap-1">
                              <Fuel className="w-3.5 h-3.5 text-[#1B479B]" aria-hidden="true" />
                              <span>Fuel Out</span>
                            </p>
                            <p className="font-mono text-sm font-semibold text-[#111827] mt-1">
                              {selectedTrip.fuelOut || '—'}
                            </p>
                          </div>

                          <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
                            <p className="text-[#6B7280]">Departure Notes</p>
                            <p className="text-xs font-medium text-[#111827] mt-1">
                              {selectedTrip.conditionOut || 'No remarks'}
                            </p>
                          </div>
                        </div>

                        {/* 8-Point Departure Checklist */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                            8-Point Departure Inspection
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {INSPECTION_CHECKPOINTS.map((cp) => {
                              const passed = selectedTrip.handoverPassedItems?.includes(cp.id);
                              const flagged = selectedTrip.handoverFlaggedItems?.includes(cp.id);
                              return (
                                <div
                                  key={cp.id}
                                  className={`px-2.5 py-2 rounded-md border text-[11px] flex items-center gap-1.5 ${
                                    flagged
                                      ? 'bg-[#FEF2F2] border-[#D61C1C]/30 text-[#991B1B] font-semibold'
                                      : passed
                                        ? 'bg-[#F0FDF4] border-[#16A34A]/25 text-[#15803D] font-medium'
                                        : 'bg-[#F9FAFB] border-[#111827]/10 text-[#6B7280]'
                                  }`}
                                >
                                  {flagged ? (
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#D61C1C]" aria-hidden="true" />
                                  ) : passed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" aria-hidden="true" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-[#D1D5DB] shrink-0" aria-hidden="true" />
                                  )}
                                  <span className="truncate">{cp.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audit 2: Post-Trip Return Audit */}
                    <div className="rounded-lg border border-[#111827]/12 overflow-hidden">
                      <div className="px-4 py-3 bg-[#F4F7FC] border-b border-[#111827]/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[#123270]">
                            2. Post-Trip Return & Mileage Audit
                          </h5>
                        </div>
                        <span className="font-mono text-[11px] text-[#4B5563]">
                          {selectedTrip.returnCompletedAt
                            ? `Closed ${selectedTrip.returnCompletedAt}${
                                selectedTrip.returnCompletedBy
                                  ? ` by ${selectedTrip.returnCompletedBy}`
                                  : ''
                              }`
                            : 'Return check pending'}
                        </span>
                      </div>

                      <div className="p-4 space-y-4">
                        {(() => {
                          const distanceDriven =
                            selectedTrip.odometerIn !== undefined &&
                            selectedTrip.odometerOut !== undefined &&
                            selectedTrip.odometerIn >= selectedTrip.odometerOut
                              ? selectedTrip.odometerIn - selectedTrip.odometerOut
                              : null;
                          const fuelDelta =
                            selectedTrip.fuelOut && selectedTrip.fuelIn
                              ? parseFuelEighths(selectedTrip.fuelIn) -
                                parseFuelEighths(selectedTrip.fuelOut)
                              : null;

                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
                                <p className="text-[#6B7280] flex items-center gap-1">
                                  <Gauge className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                                  <span>Odometer In / Distance</span>
                                </p>
                                <p className="font-mono text-sm font-semibold text-[#111827] mt-1 tabular-nums">
                                  {selectedTrip.odometerIn !== undefined
                                    ? `${selectedTrip.odometerIn.toLocaleString()} km`
                                    : '—'}
                                </p>
                                {distanceDriven !== null && (
                                  <p className="font-mono text-[11px] text-[#1B479B] font-semibold mt-0.5 tabular-nums">
                                    Driven: {distanceDriven.toLocaleString()} km
                                  </p>
                                )}
                              </div>

                              <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
                                <p className="text-[#6B7280] flex items-center gap-1">
                                  <Fuel className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                                  <span>Fuel In</span>
                                </p>
                                <p className="font-mono text-sm font-semibold text-[#111827] mt-1">
                                  {selectedTrip.fuelIn || '—'}
                                </p>
                                {fuelDelta !== null && fuelDelta < 0 && (
                                  <p className="font-mono text-[11px] text-[#D61C1C] font-semibold mt-0.5">
                                    Short by {Math.abs(fuelDelta)}/8 tank
                                  </p>
                                )}
                              </div>

                              <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
                                <p className="text-[#6B7280]">Damage / Return Notes</p>
                                <p className="text-xs font-medium text-[#111827] mt-1">
                                  {selectedTrip.damageNotes || 'No damage reported'}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 8-Point Return Checklist */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                            8-Point Return Inspection
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {INSPECTION_CHECKPOINTS.map((cp) => {
                              const passed = selectedTrip.returnPassedItems?.includes(cp.id);
                              const flagged = selectedTrip.returnFlaggedItems?.includes(cp.id);
                              return (
                                <div
                                  key={cp.id}
                                  className={`px-2.5 py-2 rounded-md border text-[11px] flex items-center gap-1.5 ${
                                    flagged
                                      ? 'bg-[#FEF2F2] border-[#D61C1C]/30 text-[#991B1B] font-semibold'
                                      : passed
                                        ? 'bg-[#F0FDF4] border-[#16A34A]/25 text-[#15803D] font-medium'
                                        : 'bg-[#F9FAFB] border-[#111827]/10 text-[#6B7280]'
                                  }`}
                                >
                                  {flagged ? (
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#D61C1C]" aria-hidden="true" />
                                  ) : passed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" aria-hidden="true" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-[#D1D5DB] shrink-0" aria-hidden="true" />
                                  )}
                                  <span className="truncate">{cp.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audit 3: Payment & M-Pesa Ledger Audit */}
                    <div className="rounded-lg border border-[#111827]/12 overflow-hidden">
                      <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#111827]/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-[#1B479B]" aria-hidden="true" />
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[#123270]">
                            3. Financial & Payment Audit
                          </h5>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#111827] tabular-nums">
                          {selectedTrip.paymentStatus} · Paid {formatKes(selectedTrip.amountPaidKes)} /{' '}
                          {formatKes(selectedTrip.quotedAmountKes)}
                        </span>
                      </div>

                      {selectedTripTransactions.length === 0 ? (
                        <div className="p-4 text-xs text-[#4B5563]">
                          No itemized payment transactions logged for {selectedTrip.bookingRef} yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-[#111827]/10">
                          {selectedTripTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-[#111827]">{tx.method}</span>
                                  {tx.mpesaCode && (
                                    <span className="font-mono px-1.5 py-0.5 rounded bg-[#EFF3F9] text-[#123270] font-semibold">
                                      {tx.mpesaCode}
                                    </span>
                                  )}
                                  <span className="font-mono text-[#6B7280] tabular-nums">
                                    {tx.paidAt}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#4B5563]">
                                  Recorded by <span className="font-mono">{tx.recordedByEmail}</span>
                                  {tx.notes ? ` · ${tx.notes}` : ''}
                                </p>
                              </div>
                              <span className="font-mono text-sm font-semibold text-[#16A34A] tabular-nums shrink-0">
                                +{formatKes(tx.amountKes)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/50 p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-lg bg-white border border-[#111827]/15 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#111827]">
                {editingClient ? `Edit ${editingClient.name}` : 'Add Client / Corporate Account'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded border border-[#111827]/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Phone (+254) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Account Segment</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as ClientAccountType)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                >
                  <option value="Individual / Diaspora">Individual / Diaspora</option>
                  <option value="Corporate / NGO">Corporate / NGO</option>
                  <option value="Tourist">Tourist</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Organization / NGO Name</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Optional for private travelers"
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">National ID / Passport</label>
                <input
                  type="text"
                  value={idOrPassport}
                  onChange={(e) => setIdOrPassport(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">KRA PIN (for VAT)</label>
                <input
                  type="text"
                  value={kraPin}
                  onChange={(e) => setKraPin(e.target.value)}
                  placeholder="P051..."
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Total Trips</label>
                <input
                  type="number"
                  min={0}
                  value={totalTrips}
                  onChange={(e) => setTotalTrips(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Lifetime Spend (KES)</label>
                <input
                  type="number"
                  min={0}
                  value={totalSpendKes}
                  onChange={(e) => setTotalSpendKes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Internal Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-[#111827]/20 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
              >
                Save Client Record
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
