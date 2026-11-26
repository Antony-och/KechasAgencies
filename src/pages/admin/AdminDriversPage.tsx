import { FormEvent, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { Plus, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoPortal } from '../../contexts/DemoPortalContext';
import { db } from '../../lib/firebase';
import { DriverDoc, DriverStatus, VehicleDoc } from '../../lib/adminTypes';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';

export default function AdminDriversPage() {
  const { isAdmin, isDemoMode } = useAuth();
  const demo = useDemoPortal();
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [editing, setEditing] = useState<Partial<DriverDoc> | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setDrivers(demo.drivers);
      setVehicles(demo.vehicles);
      return;
    }

    const unsubD = onSnapshot(
      collection(db, 'drivers'),
      (snap) => {
        setDrivers(snap.docs.map((d) => ({ ...(d.data() as DriverDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'drivers')
    );

    const unsubV = onSnapshot(
      collection(db, 'vehicles'),
      (snap) => {
        setVehicles(snap.docs.map((d) => ({ ...(d.data() as VehicleDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'vehicles')
    );

    return () => {
      unsubD();
      unsubV();
    };
  }, [isDemoMode, demo.drivers, demo.vehicles]);

  const openNew = () => {
    setIsNew(true);
    setEditing({
      id: `drv_${Date.now()}`,
      fullName: '',
      phone: '+254 ',
      nationalId: '',
      licenseNumber: '',
      licenseExpiryDate: '2027-06-30',
      assignedVehicleId: '',
      assignedVehicleName: '',
      specialties: 'Kisumu CBD, KIS Arrivals',
      status: 'Available',
      tripCount: 0,
    });
  };

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!editing || !editing.id || !editing.fullName) return;
    const assignedVeh = vehicles.find((v) => v.id === editing.assignedVehicleId);

    if (isDemoMode) {
      const nextDriver: DriverDoc = {
        id: editing.id,
        fullName: editing.fullName.trim(),
        phone: (editing.phone || '').trim(),
        nationalId: (editing.nationalId || '').trim(),
        licenseNumber: (editing.licenseNumber || '').trim(),
        licenseExpiryDate: editing.licenseExpiryDate || '2027-06-30',
        assignedVehicleId: assignedVeh ? assignedVeh.id : '',
        assignedVehicleName: assignedVeh
          ? `${assignedVeh.name} (${assignedVeh.registrationPlate})`
          : '',
        specialties: (editing.specialties || 'Western Kenya').trim(),
        status: (editing.status || 'Available') as DriverStatus,
        tripCount: Number(editing.tripCount) || 0,
      };
      demo.setDrivers((prev) => {
        const exists = prev.some((d) => d.id === nextDriver.id);
        return exists
          ? prev.map((d) => (d.id === nextDriver.id ? nextDriver : d))
          : [nextDriver, ...prev];
      });
      setEditing(null);
      return;
    }

    const payload: Record<string, unknown> = {
      fullName: editing.fullName.trim(),
      phone: (editing.phone || '').trim(),
      nationalId: (editing.nationalId || '').trim(),
      licenseNumber: (editing.licenseNumber || '').trim(),
      licenseExpiryDate: editing.licenseExpiryDate || '2027-06-30',
      assignedVehicleId: assignedVeh ? assignedVeh.id : '',
      assignedVehicleName: assignedVeh ? `${assignedVeh.name} (${assignedVeh.registrationPlate})` : '',
      specialties: (editing.specialties || 'Western Kenya').trim(),
      status: (editing.status || 'Available') as DriverStatus,
      tripCount: Number(editing.tripCount) || 0,
      createdAt: editing.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'drivers', editing.id), payload);
      setEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `drivers/${editing.id}`);
    }
  }

  async function handleDelete(id: string) {
    if (!isAdmin) return;
    if (isDemoMode) {
      demo.setDrivers((prev) => prev.filter((d) => d.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, 'drivers', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `drivers/${id}`);
    }
  }

  return (
    <AdminLayout title="Chauffeurs & Drivers Directory" breadcrumb="Chauffeurs">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-[#4B5563]">
            Track vetted Kisumu chauffeurs, driving license expiry, route specialties, and live
            trip availability.
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chauffeur</span>
            </button>
          )}
        </div>

        <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[880px]">
              <thead>
                <tr className="border-b border-[#111827]/10 bg-[#F9FAFB] text-xs font-semibold text-[#4B5563]">
                  <th className="py-3 px-4">Driver & Phone</th>
                  <th className="py-3 px-4">
                    {isAdmin ? 'National ID & DL Expiry' : 'Verification & DL Expiry'}
                  </th>
                  <th className="py-3 px-4">Assigned Vehicle</th>
                  <th className="py-3 px-4">Route Specialties</th>
                  <th className="py-3 px-4 text-right">Trips</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111827]/10 text-xs sm:text-sm">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#111827]">{d.fullName}</div>
                      <div className="font-mono text-[11px] text-[#4B5563]">{d.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#4B5563]">
                      <div>
                        {isAdmin
                          ? `ID: ${d.nationalId}`
                          : d.nationalId && d.nationalId.length >= 4
                            ? `ID: ••••${d.nationalId.slice(-4)}`
                            : 'ID Verified'}
                      </div>
                      <div>
                        {d.licenseNumber} · Exp: {d.licenseExpiryDate}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#111827]">
                      {d.assignedVehicleName || 'Pool / Floating'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4B5563] max-w-[220px]">
                      {d.specialties}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium">
                      {d.tripCount}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          d.status === 'Available'
                            ? 'text-[#16A34A]'
                            : d.status === 'On Trip'
                              ? 'text-[#194793]'
                              : 'text-[#6B7280]'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setEditing(d);
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="px-2.5 py-1.5 rounded border border-[#C8231D]/30 text-xs text-[#C8231D] hover:bg-[#FEF2F2]"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-lg bg-white border border-[#111827]/15 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#111827]">
                {isNew ? 'Add Chauffeur' : `Edit ${editing.fullName}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
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
                  value={editing.fullName || ''}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Phone (+254) *</label>
                <input
                  type="tel"
                  required
                  value={editing.phone || ''}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-[#4B5563]">National ID *</label>
                  <input
                    type="text"
                    required
                    value={editing.nationalId || ''}
                    onChange={(e) => setEditing({ ...editing, nationalId: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[#4B5563]">Driving License # *</label>
                <input
                  type="text"
                  required
                  value={editing.licenseNumber || ''}
                  onChange={(e) => setEditing({ ...editing, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">DL Expiry Date</label>
                <input
                  type="date"
                  value={editing.licenseExpiryDate || ''}
                  onChange={(e) => setEditing({ ...editing, licenseExpiryDate: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Availability Status</label>
                <select
                  value={editing.status || 'Available'}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as DriverStatus })
                  }
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Primary Assigned Vehicle</label>
              <select
                value={editing.assignedVehicleId || ''}
                onChange={(e) => setEditing({ ...editing, assignedVehicleId: e.target.value })}
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              >
                <option value="">Pool / Unassigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationPlate})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Regional Route Specialties *</label>
              <input
                type="text"
                required
                value={editing.specialties || ''}
                onChange={(e) => setEditing({ ...editing, specialties: e.target.value })}
                placeholder="e.g. Ruma / Homa Bay, Busia Border, VIP Executive"
                className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-md border border-[#111827]/20 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold"
              >
                Save Driver
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
