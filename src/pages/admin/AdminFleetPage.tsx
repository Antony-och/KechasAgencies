import { FormEvent, useEffect, useState } from 'react';
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
import { Plus, RefreshCw, Wrench, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import ResilientImage from '../../components/ResilientImage';
import FleetVehicleModal, { createDefaultVehicleDraft } from '../../components/admin/FleetVehicleModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { db } from '../../lib/firebase';
import { MaintenanceLogDoc, VehicleDoc, VehicleStatus } from '../../lib/adminTypes';
import { formatKes } from '../../data/fleet';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import { seedDefaultFleetVehicles } from '../../lib/seedPortal';

export default function AdminFleetPage() {
  const { isAdmin } = useAuth();
  const { settings } = useSiteData();
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [seedingFleet, setSeedingFleet] = useState(false);
  const [logs, setLogs] = useState<MaintenanceLogDoc[]>([]);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<VehicleDoc> | null>(null);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Maintenance log modal
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintVehicleId, setMaintVehicleId] = useState('');
  const [maintDate, setMaintDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [maintOdometer, setMaintOdometer] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintParts, setMaintParts] = useState('');
  const [maintNextKm, setMaintNextKm] = useState('');
  const [maintNextDate, setMaintNextDate] = useState('');

  useEffect(() => {
    const unsubV = onSnapshot(
      collection(db, 'vehicles'),
      (snap) => {
        const rows = snap.docs.map((d) => ({ ...(d.data() as VehicleDoc), id: d.id }));
        setVehicles(rows);
        setLoadingFleet(false);
        setMaintVehicleId((prev) => prev || rows[0]?.id || '');
      },
      (err) => {
        setLoadingFleet(false);
        handleFirestoreError(err, OperationType.LIST, 'vehicles');
      }
    );

    const unsubM = onSnapshot(
      query(collection(db, 'maintenance_logs'), orderBy('serviceDate', 'desc')),
      (snap) => {
        setLogs(snap.docs.map((d) => ({ ...(d.data() as MaintenanceLogDoc), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'maintenance_logs')
    );

    return () => {
      unsubV();
      unsubM();
    };
  }, []);

  async function handleLoadDefaultFleet() {
    setSeedingFleet(true);
    try {
      await seedDefaultFleetVehicles();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'vehicles');
    } finally {
      setSeedingFleet(false);
    }
  }

  const openAddVehicle = () => {
    setIsNewVehicle(true);
    setEditingVehicle(createDefaultVehicleDraft(settings));
    setVehicleModalOpen(true);
  };

  const openEditVehicle = (v: VehicleDoc) => {
    setIsNewVehicle(false);
    setEditingVehicle(v);
    setVehicleModalOpen(true);
  };

  async function handleStatusChange(v: VehicleDoc, nextStatus: VehicleStatus) {
    try {
      await updateDoc(doc(db, 'vehicles', v.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vehicles/${v.id}`);
    }
  }

  async function handleArchiveVehicle(v: VehicleDoc) {
    try {
      await updateDoc(doc(db, 'vehicles', v.id), {
        status: v.status === 'Inactive' ? 'Available' : 'Inactive',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vehicles/${v.id}`);
    }
  }

  async function handleDeleteVehicle(id: string) {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'vehicles', id));
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vehicles/${id}`);
    }
  }

  async function handleLogMaintenance(e: FormEvent) {
    e.preventDefault();
    const v = vehicles.find((x) => x.id === maintVehicleId);
    if (!v) return;
    const logId = `maint_${Date.now()}`;
    const odo = Number(maintOdometer) || v.currentOdometerKm;
    const nextKm = Number(maintNextKm) || odo + 5000;

    try {
      await setDoc(doc(db, 'maintenance_logs', logId), {
        vehicleId: v.id,
        vehicleName: v.name,
        registrationPlate: v.registrationPlate,
        serviceDate: maintDate,
        odometerKm: odo,
        costKes: Number(maintCost) || 0,
        partsReplaced: maintParts.trim() || 'Routine service inspection',
        nextDueKm: nextKm,
        nextDueDate: maintNextDate || v.nextServiceDate,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'vehicles', v.id), {
        currentOdometerKm: odo,
        nextServiceKm: nextKm,
        nextServiceDate: maintNextDate || v.nextServiceDate,
        status: 'Available',
        updatedAt: serverTimestamp(),
      });

      setShowMaintModal(false);
      setMaintParts('');
      setMaintCost('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `maintenance_logs/${logId}`);
    }
  }

  return (
    <AdminLayout title="Fleet & Maintenance Management" breadcrumb="Fleet & Maintenance">
      <div className="space-y-8">
        {/* Actions Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-[#4B5563]">
            Manage vehicle rates, odometer intervals, insurance/NTSA expiry, and service history.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMaintModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#194793]/25 bg-white text-xs sm:text-sm font-semibold text-[#194793] hover:bg-[#EFF3F9]"
            >
              <Wrench className="w-4 h-4" />
              <span>Log Service</span>
            </button>
            <button
              type="button"
              onClick={openAddVehicle}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        {/* Fleet Table */}
        <div className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
          {loadingFleet ? (
            <div className="p-10 text-center text-sm text-[#4B5563]">
              Loading fleet inventory...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-10 text-center space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#111827]">
                  No vehicles are currently saved in the fleet database.
                </p>
                <p className="text-xs text-[#4B5563]">
                  Load the 8 standard Kechas Agencies vehicles or add a new vehicle manually to
                  sync with the public Fleet &amp; Booking pages.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={seedingFleet}
                  onClick={handleLoadDefaultFleet}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#194793]/25 bg-[#EFF3F9] text-xs sm:text-sm font-semibold text-[#194793] hover:bg-[#DCE5F2] disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${seedingFleet ? 'animate-spin' : ''}`} />
                  <span>{seedingFleet ? 'Loading Fleet...' : 'Load Standard 8-Vehicle Fleet'}</span>
                </button>
                <button
                  type="button"
                  onClick={openAddVehicle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-[#111827]/10 bg-[#F9FAFB] text-xs font-semibold text-[#4B5563]">
                    <th className="py-3 px-4">Vehicle & Plate</th>
                    <th className="py-3 px-4">Chauffeur / Self-Drive</th>
                    <th className="py-3 px-4">Odometer & Next Service</th>
                    <th className="py-3 px-4">Insurance & NTSA</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]/10 text-xs sm:text-sm">
                  {vehicles.map((v) => {
                  const kmLeft = v.nextServiceKm - v.currentOdometerKm;
                  const serviceAlert = kmLeft <= 1000;
                  return (
                    <tr key={v.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded overflow-hidden shrink-0 bg-[#E5EBF4]">
                            <ResilientImage src={v.image} alt={v.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-semibold text-[#111827]">{v.name}</div>
                            <div className="font-mono text-[11px] text-[#4B5563]">
                              {v.registrationPlate} · {v.categoryLabel}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs">
                        <div className="text-[#111827] font-medium">
                          Chauffeur: {formatKes(v.dailyRateKes)}
                        </div>
                        <div className="text-[#4B5563]">
                          {v.selfDriveAvailable
                            ? `Self-Drive: ${formatKes(v.selfDriveRateKes)}`
                            : 'Chauffeur Only'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs">
                        <div>{v.currentOdometerKm.toLocaleString()} km</div>
                        <div className={serviceAlert ? 'text-[#C8231D] font-semibold' : 'text-[#4B5563]'}>
                          Due: {v.nextServiceKm.toLocaleString()} km ({v.nextServiceDate})
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#4B5563]">
                        <div>Ins: {v.insuranceExpiryDate}</div>
                        <div>NTSA: {v.ntsaExpiryDate}</div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Availability status for ${v.name}`}
                          value={v.status}
                          onChange={(e) => handleStatusChange(v, e.target.value as VehicleStatus)}
                          className={`px-2 py-1 rounded border border-[#111827]/15 bg-white text-xs font-semibold ${
                            v.status === 'Available'
                              ? 'text-[#16A34A]'
                              : v.status === 'Booked'
                                ? 'text-[#194793]'
                                : v.status === 'In Maintenance'
                                  ? 'text-[#C8231D]'
                                  : 'text-[#6B7280]'
                          }`}
                        >
                          <option value="Available">Available</option>
                          <option value="Booked">Booked</option>
                          <option value="In Maintenance">In Maintenance</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditVehicle(v)}
                          className="px-2.5 py-1.5 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveVehicle(v)}
                          className="px-2.5 py-1.5 rounded border border-[#111827]/20 text-xs text-[#4B5563] hover:bg-[#F9FAFB]"
                        >
                          {v.status === 'Inactive' ? 'Show' : 'Hide'}
                        </button>
                        {isAdmin &&
                          (confirmDeleteId === v.id ? (
                            <span className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteVehicle(v.id)}
                                className="px-2.5 py-1.5 rounded bg-[#C8231D] text-white text-xs font-semibold hover:bg-[#A61B16]"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1.5 rounded border border-[#111827]/20 text-xs text-[#4B5563]"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(v.id)}
                              className="px-2.5 py-1.5 rounded border border-[#C8231D]/30 text-xs text-[#C8231D] hover:bg-[#FEF2F2]"
                            >
                              Delete
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Maintenance & Compliance Log */}
        <section className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#111827]/10">
            <h2 className="font-serif text-lg font-medium text-[#111827]">
              Maintenance & Service History
            </h2>
          </div>
          {logs.length === 0 ? (
            <div className="p-6 text-sm text-[#4B5563]">No maintenance logs recorded yet.</div>
          ) : (
            <div className="divide-y divide-[#111827]/10">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
                >
                  <div>
                    <div className="font-semibold text-[#111827]">
                      {log.vehicleName} ({log.registrationPlate}) —{' '}
                      <span className="font-mono text-[#4B5563]">{log.serviceDate}</span>
                    </div>
                    <p className="text-xs text-[#4B5563]">{log.partsReplaced}</p>
                  </div>
                  <div className="font-mono text-right tabular-nums">
                    <div className="font-semibold text-[#194793]">{formatKes(log.costKes)}</div>
                    <div className="text-[11px] text-[#4B5563]">
                      @ {log.odometerKm.toLocaleString()} km
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <FleetVehicleModal
        open={vehicleModalOpen}
        isNew={isNewVehicle}
        initialVehicle={editingVehicle}
        defaultShowCompliance={!isNewVehicle}
        onClose={() => {
          setVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
      />

      {/* Log Maintenance Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4">
          <form
            onSubmit={handleLogMaintenance}
            className="w-full max-w-md rounded-lg bg-white border border-[#111827]/15 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#111827]">Log Garage Service</h2>
              <button
                type="button"
                onClick={() => setShowMaintModal(false)}
                className="p-1.5 rounded border border-[#111827]/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Vehicle</label>
                <select
                  value={maintVehicleId}
                  onChange={(e) => setMaintVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationPlate})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#4B5563]">Service Date</label>
                  <input
                    type="date"
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#4B5563]">Odometer (km)</label>
                  <input
                    type="number"
                    required
                    value={maintOdometer}
                    onChange={(e) => setMaintOdometer(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#4B5563]">Garage Cost (KES)</label>
                  <input
                    type="number"
                    required
                    value={maintCost}
                    onChange={(e) => setMaintCost(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#4B5563]">Next Service Due (km)</label>
                  <input
                    type="number"
                    value={maintNextKm}
                    onChange={(e) => setMaintNextKm(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Next Service Date</label>
                <input
                  type="date"
                  value={maintNextDate}
                  onChange={(e) => setMaintNextDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB] font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Parts Replaced & Work Done *</label>
                <textarea
                  rows={2}
                  required
                  value={maintParts}
                  onChange={(e) => setMaintParts(e.target.value)}
                  placeholder="Oil filter, brake pads, wheel alignment..."
                  className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMaintModal(false)}
                className="px-4 py-2 rounded-md border border-[#111827]/20 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold"
              >
                Save Service Record
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
