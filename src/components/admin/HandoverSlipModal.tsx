import { Printer, X } from 'lucide-react';
import { BookingDoc } from '../../lib/adminTypes';
import { INSPECTION_CHECKPOINTS, InspectionItemId, parseFuelEighths } from '../../lib/inspection';
import { useSiteData } from '../../contexts/SiteDataContext';

interface HandoverSlipModalProps {
  open: boolean;
  booking: BookingDoc | null;
  odometerOut: string;
  fuelOut: string;
  conditionOut: string;
  handoverPassed: InspectionItemId[];
  handoverFlagged: InspectionItemId[];
  odometerIn: string;
  fuelIn: string;
  damageNotes: string;
  returnPassed: InspectionItemId[];
  returnFlagged: InspectionItemId[];
  onClose: () => void;
}

export default function HandoverSlipModal({
  open,
  booking,
  odometerOut,
  fuelOut,
  conditionOut,
  handoverPassed,
  handoverFlagged,
  odometerIn,
  fuelIn,
  damageNotes,
  returnPassed,
  returnFlagged,
  onClose,
}: HandoverSlipModalProps) {
  const { settings } = useSiteData();
  if (!open || !booking) return null;

  const outKm = odometerOut.trim() ? Number(odometerOut) : null;
  const inKm = odometerIn.trim() ? Number(odometerIn) : null;
  const drivenKm =
    outKm !== null && inKm !== null && !Number.isNaN(outKm) && !Number.isNaN(inKm)
      ? inKm - outKm
      : null;

  const fuelDelta =
    fuelOut && fuelIn ? parseFuelEighths(fuelIn) - parseFuelEighths(fuelOut) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/60 p-4 print:static print:bg-white print:p-0">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg bg-white border border-[#111827]/15 p-6 sm:p-8 space-y-6 print:max-h-none print:overflow-visible print:border-0 print:p-0">
        {/* Non-print modal controls */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#111827]/10 print:hidden">
          <div>
            <h2 className="font-serif text-xl text-[#111827]">
              Vehicle Handover & Return Inspection Sheet
            </h2>
            <p className="text-xs text-[#4B5563]">
              Print or save as PDF for client/driver signature at dispatch and return.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close print sheet"
              className="p-2 rounded-md border border-[#111827]/15 text-[#4B5563] hover:text-[#111827]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 text-xs text-[#111827]">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#111827]/15">
            <div>
              <h1 className="font-serif text-2xl font-medium text-[#194793]">
                {settings.companyName}
              </h1>
              <p className="text-[#4B5563]">{settings.address}</p>
              <p className="font-mono text-[11px] text-[#4B5563]">
                {settings.phoneDisplay} · {settings.email}
              </p>
            </div>
            <div className="text-right font-mono tabular-nums">
              <div className="text-sm font-semibold text-[#C8231D]">{booking.bookingRef}</div>
              <div className="text-[11px] text-[#4B5563]">Status: {booking.status}</div>
              <div className="text-[11px] text-[#4B5563]">Service: {booking.serviceType}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-[#F9FAFB] border border-[#111827]/10">
            <div className="space-y-1">
              <p className="font-semibold text-[#4B5563]">Client & Route</p>
              <p className="text-sm font-semibold text-[#111827]">{booking.clientName}</p>
              <p className="font-mono text-[#4B5563]">{booking.clientPhone}</p>
              <p>
                {booking.pickupLocation} → {booking.destination}
              </p>
              <p className="font-mono tabular-nums text-[#4B5563]">
                {booking.pickupDate} {booking.pickupTime} → {booking.returnDate} {booking.returnTime}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-[#4B5563]">Assigned Vehicle & Driver</p>
              <p className="text-sm font-semibold text-[#111827]">{booking.vehicleName}</p>
              <p className="font-mono text-[#194793] font-semibold">
                Plate: {booking.registrationPlate || 'TBD'}
              </p>
              <p>
                Chauffeur: {booking.driverName || 'Self-Drive / Unassigned'}
                {booking.driverPhone ? ` (${booking.driverPhone})` : ''}
              </p>
            </div>
          </div>

          {/* Odometer & Fuel Table */}
          <table className="w-full text-left border-collapse border border-[#111827]/15">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#111827]/15 text-[#4B5563] font-semibold">
                <th className="py-2 px-3">Reading</th>
                <th className="py-2 px-3">Departure Handover</th>
                <th className="py-2 px-3">Return Check-In</th>
                <th className="py-2 px-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111827]/10 font-mono tabular-nums">
              <tr>
                <td className="py-2 px-3 font-sans font-medium">Odometer</td>
                <td className="py-2 px-3">{outKm !== null ? `${outKm.toLocaleString()} km` : '—'}</td>
                <td className="py-2 px-3">{inKm !== null ? `${inKm.toLocaleString()} km` : '—'}</td>
                <td className="py-2 px-3 text-right font-semibold">
                  {drivenKm !== null ? `${drivenKm >= 0 ? '+' : ''}${drivenKm.toLocaleString()} km` : '—'}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium">Fuel Level</td>
                <td className="py-2 px-3">{fuelOut || '—'}</td>
                <td className="py-2 px-3">{fuelIn || '—'}</td>
                <td className="py-2 px-3 text-right font-semibold">
                  {fuelDelta !== null
                    ? fuelDelta === 0
                      ? 'Matched'
                      : `${fuelDelta > 0 ? '+' : ''}${fuelDelta}/8`
                    : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 8-Point Matrix */}
          <table className="w-full text-left border-collapse border border-[#111827]/15">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#111827]/15 text-[#4B5563] font-semibold">
                <th className="py-2 px-3">Inspection Checkpoint</th>
                <th className="py-2 px-3">Departure Out</th>
                <th className="py-2 px-3">Return In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111827]/10">
              {INSPECTION_CHECKPOINTS.map((cp) => {
                const outStatus = handoverFlagged.includes(cp.id)
                  ? 'ISSUE FLAGGED'
                  : handoverPassed.includes(cp.id)
                    ? 'PASS'
                    : 'Not Checked';
                const inStatus = returnFlagged.includes(cp.id)
                  ? 'ISSUE FLAGGED'
                  : returnPassed.includes(cp.id)
                    ? 'PASS'
                    : 'Not Checked';

                return (
                  <tr key={cp.id}>
                    <td className="py-1.5 px-3 font-medium">
                      {cp.label}{' '}
                      <span className="text-[11px] font-normal text-[#4B5563]">— {cp.hint}</span>
                    </td>
                    <td
                      className={`py-1.5 px-3 font-mono font-semibold ${
                        outStatus === 'ISSUE FLAGGED'
                          ? 'text-[#C8231D]'
                          : outStatus === 'PASS'
                            ? 'text-[#16A34A]'
                            : 'text-[#6B7280]'
                      }`}
                    >
                      {outStatus}
                    </td>
                    <td
                      className={`py-1.5 px-3 font-mono font-semibold ${
                        inStatus === 'ISSUE FLAGGED'
                          ? 'text-[#C8231D]'
                          : inStatus === 'PASS'
                            ? 'text-[#16A34A]'
                            : 'text-[#6B7280]'
                      }`}
                    >
                      {inStatus}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded border border-[#111827]/15 space-y-1">
              <p className="font-semibold text-[#4B5563]">Departure Condition Notes</p>
              <p>{conditionOut || 'No remarks recorded.'}</p>
            </div>
            <div className="p-3 rounded border border-[#111827]/15 space-y-1">
              <p className="font-semibold text-[#4B5563]">Return / Incident Notes</p>
              <p>{damageNotes || 'No remarks recorded.'}</p>
            </div>
          </div>

          {/* Sign-off Lines */}
          <div className="grid grid-cols-2 gap-8 pt-6">
            <div className="space-y-6">
              <div className="border-b border-[#111827]/40 h-8" />
              <div className="text-[11px] text-[#4B5563]">
                Client / Driver Signature & Date (Handover Out)
              </div>
            </div>
            <div className="space-y-6">
              <div className="border-b border-[#111827]/40 h-8" />
              <div className="text-[11px] text-[#4B5563]">
                Kechas Dispatch Officer Signature & Date (Return Check-In)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
