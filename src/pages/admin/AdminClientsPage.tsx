import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { Edit2, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { BookingDoc, ClientAccountDoc, ClientAccountType } from '../../lib/adminTypes';
import { formatKes } from '../../data/fleet';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import { useAuth } from '../../contexts/AuthContext';

const CLIENT_TYPES: ('All' | ClientAccountType)[] = [
  'All',
  'Corporate / NGO',
  'Individual / Diaspora',
  'Tourist',
];

export default function AdminClientsPage() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState<ClientAccountDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [typeFilter, setTypeFilter] = useState<'All' | ClientAccountType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

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

  useEffect(() => {
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

    return () => {
      unsubC();
      unsubB();
    };
  }, []);

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
    const payload: Record<string, unknown> = {
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
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingClient) {
        await updateDoc(doc(db, 'clients', id), payload);
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
    try {
      await deleteDoc(doc(db, 'clients', c.id));
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
              <table className="w-full text-left border-collapse min-w-[880px] text-xs sm:text-sm">
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
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#111827]">{c.name}</div>
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
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{c.totalTrips}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#111827] tabular-nums">
                        {formatKes(c.totalSpendKes)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4">
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
