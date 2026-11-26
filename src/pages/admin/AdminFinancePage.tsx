import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Plus, Printer, Receipt, Search, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import {
  BookingDoc,
  PaymentMethod,
  PaymentStatus,
  TransactionDoc,
} from '../../lib/adminTypes';
import { formatKes } from '../../data/fleet';
import { SITE_CONFIG } from '../../data/site';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoPortal } from '../../contexts/DemoPortalContext';
import { useSiteData } from '../../contexts/SiteDataContext';

const METHODS: PaymentMethod[] = [
  'M-Pesa Paybill/STK',
  'Bank Transfer',
  'Cash',
  'Corporate/NGO Monthly Invoice',
];

export default function AdminFinancePage() {
  const { staffProfile, isAdmin, isDemoMode } = useAuth();
  const demo = useDemoPortal();
  const { settings } = useSiteData();
  const [transactions, setTransactions] = useState<TransactionDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');

  // Record Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payBookingId, setPayBookingId] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('M-Pesa Paybill/STK');
  const [payMpesaCode, setPayMpesaCode] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payClientType, setPayClientType] = useState('Individual / Diaspora');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  // Invoice / Receipt Preview Modal
  const [invoiceBooking, setInvoiceBooking] = useState<BookingDoc | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setTransactions(
        [...demo.transactions].sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''))
      );
      setBookings(
        [...demo.bookings].sort((a, b) => (b.pickupDate || '').localeCompare(a.pickupDate || ''))
      );
      return;
    }

    const unsubT = onSnapshot(
      query(collection(db, 'transactions'), orderBy('paidAt', 'desc')),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ ...(d.data() as TransactionDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
    );

    const unsubB = onSnapshot(
      query(collection(db, 'bookings'), orderBy('pickupDate', 'desc')),
      (snap) => {
        setBookings(snap.docs.map((d) => ({ ...(d.data() as BookingDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
    );

    return () => {
      unsubT();
      unsubB();
    };
  }, [isDemoMode, demo.transactions, demo.bookings]);

  useEffect(() => {
    if (!payBookingId && bookings.length > 0) {
      const unpaid = bookings.find(
        (b) => b.quotedAmountKes > b.amountPaidKes && b.status !== 'Cancelled'
      );
      const defaultBk = unpaid || bookings[0];
      setPayBookingId(defaultBk.id);
      const remaining = Math.max(0, defaultBk.quotedAmountKes - defaultBk.amountPaidKes);
      setPayAmount(remaining > 0 ? String(remaining) : String(defaultBk.quotedAmountKes));
    }
  }, [bookings, payBookingId]);

  const totals = useMemo(() => {
    const collected = transactions.reduce((acc, t) => acc + (t.amountKes || 0), 0);
    const mpesaTotal = transactions
      .filter((t) => t.method === 'M-Pesa Paybill/STK')
      .reduce((acc, t) => acc + (t.amountKes || 0), 0);
    const outstanding = bookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((acc, b) => acc + Math.max(0, (b.quotedAmountKes || 0) - (b.amountPaidKes || 0)), 0);
    const corporateTotal = transactions
      .filter((t) => t.method === 'Corporate/NGO Monthly Invoice')
      .reduce((acc, t) => acc + (t.amountKes || 0), 0);
    return { collected, mpesaTotal, outstanding, corporateTotal };
  }, [transactions, bookings]);

  const filteredTx = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      if (methodFilter !== 'All' && t.method !== methodFilter) return false;
      if (!q) return true;
      return (
        t.bookingRef.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        (t.mpesaCode || '').toLowerCase().includes(q)
      );
    });
  }, [transactions, methodFilter, searchQuery]);

  const outstandingBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status !== 'Cancelled' && (b.quotedAmountKes || 0) > (b.amountPaidKes || 0)
      ),
    [bookings]
  );

  function handleSelectBookingForPayment(bookingId: string) {
    setPayBookingId(bookingId);
    const bk = bookings.find((b) => b.id === bookingId);
    if (bk) {
      const remaining = Math.max(0, bk.quotedAmountKes - bk.amountPaidKes);
      setPayAmount(remaining > 0 ? String(remaining) : String(bk.quotedAmountKes));
    }
  }

  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    setPayError('');
    const bk = bookings.find((b) => b.id === payBookingId);
    if (!bk) {
      setPayError('Please choose a valid booking.');
      return;
    }
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      setPayError('Enter a valid KES payment amount greater than 0.');
      return;
    }
    if ((bk.status === 'Completed' || bk.status === 'Cancelled') && !isAdmin) {
      setPayError('Only an Administrator can post payments against Closed or Cancelled bookings.');
      return;
    }

    setSavingPay(true);
    const txId = `tx_${Date.now()}`;
    const newPaidTotal = (bk.amountPaidKes || 0) + amt;
    const newPayStatus: PaymentStatus =
      newPaidTotal >= bk.quotedAmountKes
        ? 'Paid in Full'
        : newPaidTotal > 0
          ? 'Deposit Paid'
          : 'Unpaid';

    if (isDemoMode) {
      const demoTx: TransactionDoc = {
        id: txId,
        bookingId: bk.id,
        bookingRef: bk.bookingRef,
        clientName: bk.clientName,
        clientType: payClientType,
        method: payMethod,
        mpesaCode: payMpesaCode.trim(),
        amountKes: amt,
        notes: payNotes.trim(),
        paidAt: payDate,
        recordedByEmail: staffProfile?.email || 'dispatcher-demo@kechasagencies.co.ke',
      };
      demo.setTransactions((prev) => [demoTx, ...prev]);
      demo.setBookings((prev) =>
        prev.map((item) =>
          item.id === bk.id
            ? { ...item, amountPaidKes: newPaidTotal, paymentStatus: newPayStatus }
            : item
        )
      );
      setShowPayModal(false);
      setPayMpesaCode('');
      setPayNotes('');
      setSavingPay(false);
      return;
    }

    try {
      const txPayload: Record<string, unknown> = {
        bookingId: bk.id,
        bookingRef: bk.bookingRef,
        clientName: bk.clientName,
        clientType: payClientType,
        method: payMethod,
        mpesaCode: payMpesaCode.trim(),
        amountKes: amt,
        notes: payNotes.trim(),
        paidAt: payDate,
        recordedByEmail: staffProfile?.email || 'dispatch@kechas.co.ke',
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'transactions', txId), txPayload);

      await updateDoc(doc(db, 'bookings', bk.id), {
        amountPaidKes: newPaidTotal,
        paymentStatus: newPayStatus,
        updatedAt: serverTimestamp(),
      });

      setShowPayModal(false);
      setPayMpesaCode('');
      setPayNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${txId}`);
    } finally {
      setSavingPay(false);
    }
  }

  function openInvoiceForBookingId(bookingId: string) {
    const bk = bookings.find((b) => b.id === bookingId);
    if (bk) setInvoiceBooking(bk);
  }

  const vatRate = settings.vatEnabled ? settings.vatRatePercent : 0;

  return (
    <AdminLayout title="Payments, M-Pesa & Corporate Invoicing" breadcrumb="Finance">
      <div className="space-y-6 print:hidden">
        {/* KPI Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[#111827]/10 bg-white p-5 space-y-1.5">
            <span className="text-xs font-medium text-[#4B5563]">Total Collected</span>
            <div className="font-serif text-2xl font-medium text-[#16A34A] tabular-nums">
              {formatKes(totals.collected)}
            </div>
            <p className="text-xs text-[#4B5563]">{transactions.length} settled transactions</p>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-5 space-y-1.5">
            <span className="text-xs font-medium text-[#4B5563]">Outstanding Receivables</span>
            <div className="font-serif text-2xl font-medium text-[#C8231D] tabular-nums">
              {formatKes(totals.outstanding)}
            </div>
            <p className="text-xs text-[#4B5563]">
              Across {outstandingBookings.length} active/confirmed bookings
            </p>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-5 space-y-1.5">
            <span className="text-xs font-medium text-[#4B5563]">M-Pesa Paybill ({settings.mpesaPaybill})</span>
            <div className="font-serif text-2xl font-medium text-[#194793] tabular-nums">
              {formatKes(totals.mpesaTotal)}
            </div>
            <p className="text-xs text-[#4B5563]">Account: {settings.mpesaAccount}</p>
          </div>

          <div className="rounded-lg border border-[#111827]/10 bg-white p-5 space-y-1.5">
            <span className="text-xs font-medium text-[#4B5563]">Corporate / NGO Invoiced</span>
            <div className="font-serif text-2xl font-medium text-[#111827] tabular-nums">
              {formatKes(totals.corporateTotal)}
            </div>
            <p className="text-xs text-[#4B5563]">
              VAT Rate: {settings.vatEnabled ? `${settings.vatRatePercent}%` : 'Disabled'}
            </p>
          </div>
        </section>

        {/* Outstanding Balances Strip */}
        {outstandingBookings.length > 0 && (
          <section className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#111827]/10 flex items-center justify-between bg-[#F9FAFB]">
              <h2 className="font-serif text-lg text-[#111827]">
                Bookings Awaiting Payment / Invoice Settlement
              </h2>
              <span className="font-mono text-xs text-[#C8231D] font-semibold">
                {outstandingBookings.length} open balances
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[780px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#111827]/10 text-xs text-[#4B5563]">
                    <th className="py-2.5 px-4">Booking Ref</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Vehicle & Dates</th>
                    <th className="py-2.5 px-4 text-right">Quoted</th>
                    <th className="py-2.5 px-4 text-right">Balance Due</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]/10">
                  {outstandingBookings.map((b) => {
                    const balance = Math.max(0, b.quotedAmountKes - b.amountPaidKes);
                    return (
                      <tr key={b.id} className="hover:bg-[#F9FAFB]">
                        <td className="py-2.5 px-4 font-mono font-semibold text-[#194793]">
                          {b.bookingRef}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-[#111827]">{b.clientName}</div>
                          <div className="font-mono text-[11px] text-[#4B5563]">{b.clientPhone}</div>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-[#4B5563]">
                          {b.vehicleName} · {b.pickupDate} ({b.rentalDays}d)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {formatKes(b.quotedAmountKes)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#C8231D] tabular-nums">
                          {formatKes(balance)}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInvoiceBooking(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#111827]/15 text-xs font-medium text-[#111827] hover:bg-[#EFF3F9]"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectBookingForPayment(b.id);
                              setShowPayModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
                          >
                            <span>Post Payment</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFF3F9] rounded-lg border border-[#111827]/10">
            {(['All', ...METHODS] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  methodFilter === m
                    ? 'bg-[#194793] text-white'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search M-Pesa code, ref, client..."
                className="w-full pl-9 pr-3 py-2 rounded-md border border-[#111827]/20 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#194793]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPayModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
          {filteredTx.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#4B5563]">
              No payment records match your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[840px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#111827]/10 bg-[#F9FAFB] text-xs font-semibold text-[#4B5563]">
                    <th className="py-3 px-4">Paid Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Method & Reference</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]/10">
                  {filteredTx.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4 font-mono text-xs tabular-nums">{t.paidAt}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#194793]">
                        {t.bookingRef}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#111827]">{t.clientName}</div>
                        {t.notes && <div className="text-[11px] text-[#4B5563]">{t.notes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#111827] font-medium">{t.method}</div>
                        {t.mpesaCode && (
                          <div className="font-mono text-[11px] text-[#4B5563]">{t.mpesaCode}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4B5563]">{t.recordedByEmail}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#16A34A] tabular-nums">
                        {formatKes(t.amountKes)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openInvoiceForBookingId(t.bookingId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4 print:hidden">
          <form
            onSubmit={handleRecordPayment}
            className="w-full max-w-lg rounded-lg bg-white border border-[#111827]/15 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#111827]">Record Payment / Settlement</h2>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="p-1.5 rounded border border-[#111827]/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Linked Booking *</label>
              <select
                value={payBookingId}
                onChange={(e) => handleSelectBookingForPayment(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingRef} — {b.clientName} (Quote: {formatKes(b.quotedAmountKes)}, Paid:{' '}
                    {formatKes(b.amountPaidKes)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">M-Pesa Code / Ref</label>
                <input
                  type="text"
                  value={payMpesaCode}
                  onChange={(e) => setPayMpesaCode(e.target.value.toUpperCase())}
                  placeholder="SJK892LMP1"
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Amount Received (KES) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Payment Date</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Client Segment</label>
              <select
                value={payClientType}
                onChange={(e) => setPayClientType(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              >
                <option value="Individual / Diaspora">Individual / Diaspora</option>
                <option value="Corporate / NGO">Corporate / NGO</option>
                <option value="Tourist">Tourist</option>
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Notes</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="e.g., 50% deposit cleared via Paybill 247247"
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              />
            </div>

            {payError && <p className="text-xs text-[#C8231D]">{payError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 rounded-md border border-[#111827]/20 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPay}
                className="px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
              >
                {savingPay ? 'Recording...' : 'Save Payment & Update Booking'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Invoice / Official Receipt Modal */}
      {invoiceBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4 print:static print:bg-white print:p-0">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-[#111827]/15 shadow-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-0">
            <div className="px-6 py-4 border-b border-[#111827]/10 flex items-center justify-between print:hidden">
              <h2 className="font-serif text-lg text-[#111827]">
                Official Invoice & Receipt — {invoiceBooking.bookingRef}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceBooking(null)}
                  className="p-2 rounded border border-[#111827]/15"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8 text-sm text-[#111827]">
              {/* Header */}
              <div className="flex items-start justify-between gap-6 border-b border-[#111827]/15 pb-6">
                <div className="flex items-center gap-3.5">
                  <span className="w-14 h-14 rounded-full overflow-hidden border border-[#194793]/30 shrink-0 bg-[#194793]">
                    <img
                      src={SITE_CONFIG.logoSrc}
                      alt={settings.companyName}
                      className="w-full h-full object-cover scale-[1.04]"
                    />
                  </span>
                  <div>
                    <div className="font-serif text-2xl font-medium text-[#111827]">
                      {settings.companyName}
                    </div>
                    <p className="text-xs text-[#4B5563]">{settings.address}</p>
                    <p className="text-xs font-mono text-[#4B5563]">
                      Tel: {settings.phoneDisplay} · {settings.email}
                      {settings.kraPin ? ` · KRA PIN: ${settings.kraPin}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#C8231D] uppercase tracking-wider">
                    {invoiceBooking.amountPaidKes >= invoiceBooking.quotedAmountKes
                      ? 'Official Paid Receipt'
                      : 'Tax Invoice / Statement'}
                  </p>
                  <p className="font-mono text-lg font-semibold text-[#194793] mt-1">
                    {invoiceBooking.bookingRef}
                  </p>
                  <p className="text-xs font-mono text-[#4B5563] mt-0.5">
                    Issued: {new Date().toISOString().split('T')[0]}
                  </p>
                </div>
              </div>

              {/* Client & Trip Info */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-[#4B5563]">Billed To</p>
                  <p className="text-sm font-semibold text-[#111827]">{invoiceBooking.clientName}</p>
                  <p className="font-mono text-[#4B5563]">{invoiceBooking.clientPhone}</p>
                  {invoiceBooking.clientEmail && (
                    <p className="text-[#4B5563]">{invoiceBooking.clientEmail}</p>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-semibold text-[#4B5563]">Trip Summary</p>
                  <p className="font-medium text-[#111827]">
                    {invoiceBooking.vehicleName}{' '}
                    {invoiceBooking.registrationPlate
                      ? `(${invoiceBooking.registrationPlate})`
                      : ''}
                  </p>
                  <p className="text-[#4B5563]">
                    {invoiceBooking.pickupLocation} → {invoiceBooking.destination}
                  </p>
                  <p className="font-mono text-[#4B5563] tabular-nums">
                    {invoiceBooking.pickupDate} to {invoiceBooking.returnDate} (
                    {invoiceBooking.rentalDays}d)
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-y border-[#111827]/15 bg-[#F9FAFB] text-[#4B5563]">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Qty / Days</th>
                    <th className="py-2.5 px-3 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]/10">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#111827]">
                        {invoiceBooking.serviceType === 'airport-transfer'
                          ? 'Kisumu International (KIS) Airport Transfer'
                          : `${invoiceBooking.serviceType === 'chauffeur' ? 'Chauffeur-Driven' : 'Self-Drive'} Hire — ${invoiceBooking.vehicleName}`}
                      </div>
                      <div className="text-[#4B5563]">
                        Route: {invoiceBooking.pickupLocation} → {invoiceBooking.destination}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums">
                      {invoiceBooking.rentalDays}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium tabular-nums">
                      {formatKes(
                        vatRate > 0
                          ? Math.round(invoiceBooking.quotedAmountKes / (1 + vatRate / 100))
                          : invoiceBooking.quotedAmountKes
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2 border-t border-[#111827]/15">
                <div className="text-xs space-y-1 text-[#4B5563] max-w-xs">
                  <p className="font-semibold text-[#111827]">M-Pesa &amp; Bank Settlement</p>
                  <p className="font-mono">
                    Paybill: {settings.mpesaPaybill} · Account: {settings.mpesaAccount} (
                    {invoiceBooking.bookingRef})
                  </p>
                  {settings.bankDetails && <p>{settings.bankDetails}</p>}
                  <p>Payment Status: {invoiceBooking.paymentStatus}</p>
                  {settings.bookingTermsSummary && (
                    <p className="pt-1 text-[11px] leading-relaxed">{settings.bookingTermsSummary}</p>
                  )}
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs font-mono tabular-nums">
                  {vatRate > 0 && (
                    <div className="flex justify-between text-[#4B5563]">
                      <span>VAT ({vatRate}% inclusive)</span>
                      <span>
                        {formatKes(
                          invoiceBooking.quotedAmountKes -
                            Math.round(invoiceBooking.quotedAmountKes / (1 + vatRate / 100))
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-[#111827]">
                    <span>Total Billed</span>
                    <span>{formatKes(invoiceBooking.quotedAmountKes)}</span>
                  </div>
                  <div className="flex justify-between text-[#16A34A]">
                    <span>Amount Paid</span>
                    <span>{formatKes(invoiceBooking.amountPaidKes)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-[#111827]/15 text-sm font-semibold text-[#194793]">
                    <span>Balance Due</span>
                    <span>
                      {formatKes(
                        Math.max(0, invoiceBooking.quotedAmountKes - invoiceBooking.amountPaidKes)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
