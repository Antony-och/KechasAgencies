import { AlertTriangle, Check, CheckCheck, Fuel, Gauge, Printer, RotateCcw } from 'lucide-react';
import { BookingDoc, VehicleDoc } from '../../lib/adminTypes';
import {
  DEPARTURE_QUICK_NOTES,
  FUEL_LEVELS,
  INSPECTION_CHECKPOINTS,
  INSPECTION_ITEM_IDS,
  InspectionItemId,
  parseFuelEighths,
  RETURN_QUICK_NOTES,
} from '../../lib/inspection';

export type InspectionTab = 'handover' | 'return' | 'compare';

interface BookingInspectionPanelProps {
  booking: BookingDoc;
  assignedVehicle?: VehicleDoc;
  activeTab: InspectionTab;
  onTabChange: (tab: InspectionTab) => void;
  odometerOut: string;
  setOdometerOut: (val: string) => void;
  fuelOut: string;
  setFuelOut: (val: string) => void;
  conditionOut: string;
  setConditionOut: (val: string) => void;
  handoverPassed: InspectionItemId[];
  setHandoverPassed: (ids: InspectionItemId[]) => void;
  handoverFlagged: InspectionItemId[];
  setHandoverFlagged: (ids: InspectionItemId[]) => void;
  odometerIn: string;
  setOdometerIn: (val: string) => void;
  fuelIn: string;
  setFuelIn: (val: string) => void;
  damageNotes: string;
  setDamageNotes: (val: string) => void;
  returnPassed: InspectionItemId[];
  setReturnPassed: (ids: InspectionItemId[]) => void;
  returnFlagged: InspectionItemId[];
  setReturnFlagged: (ids: InspectionItemId[]) => void;
  onOpenPrintSlip: () => void;
}

function FuelSelector({
  label,
  value,
  onChange,
  comparisonTarget,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  comparisonTarget?: string;
}) {
  const currentEighths = parseFuelEighths(value);
  const fillPercent = Math.round((currentEighths / 8) * 100);
  const targetEighths = comparisonTarget ? parseFuelEighths(comparisonTarget) : null;
  const fuelDelta = targetEighths !== null ? currentEighths - targetEighths : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111827]">
          <Fuel className="w-3.5 h-3.5 text-[#194793]" aria-hidden="true" />
          <span>{label}</span>
        </span>
        <span className="font-mono text-xs font-semibold text-[#194793] tabular-nums">
          {value || 'Full (8/8)'}
        </span>
      </div>

      <div className="grid grid-cols-9 gap-1 p-1 rounded-md bg-[#F9FAFB] border border-[#111827]/15">
        {FUEL_LEVELS.map((lvl) => {
          const isSelected = currentEighths === lvl.eighths;
          return (
            <button
              key={lvl.value}
              type="button"
              onClick={() => onChange(lvl.value)}
              title={lvl.value}
              className={`min-h-[36px] rounded text-[11px] font-mono font-semibold transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-[#194793] text-white'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#111827]'
              }`}
            >
              {lvl.shortLabel}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[#E5EBF4] overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              currentEighths <= 2
                ? 'bg-[#C8231D]'
                : currentEighths <= 4
                  ? 'bg-[#D97706]'
                  : 'bg-[#16A34A]'
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        {fuelDelta !== null && (
          <span
            className={`font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap ${
              fuelDelta < 0 ? 'text-[#C8231D]' : 'text-[#16A34A]'
            }`}
          >
            {fuelDelta === 0
              ? 'Matches departure'
              : fuelDelta > 0
                ? `+${fuelDelta}/8 surplus`
                : `Short ${Math.abs(fuelDelta)}/8 tank`}
          </span>
        )}
      </div>
    </div>
  );
}

function CheckpointMatrix({
  passed,
  flagged,
  onTogglePass,
  onToggleFlag,
}: {
  passed: InspectionItemId[];
  flagged: InspectionItemId[];
  onTogglePass: (id: InspectionItemId) => void;
  onToggleFlag: (id: InspectionItemId) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {INSPECTION_CHECKPOINTS.map((item) => {
        const isPass = passed.includes(item.id);
        const isFlag = flagged.includes(item.id);

        return (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border transition-colors ${
              isFlag
                ? 'border-[#C8231D]/45 bg-[#FEF2F2]'
                : isPass
                  ? 'border-[#16A34A]/40 bg-[#F0FDF4]'
                  : 'border-[#111827]/12 bg-white hover:bg-[#F9FAFB]'
            }`}
          >
            <button
              type="button"
              onClick={() => onTogglePass(item.id)}
              className="flex-1 text-left min-w-0 py-0.5"
            >
              <div className="text-xs font-semibold text-[#111827] truncate">{item.label}</div>
              <div className="text-[11px] text-[#4B5563] truncate">{item.hint}</div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onTogglePass(item.id)}
                aria-label={`Mark ${item.label} OK`}
                className={`min-h-[34px] px-2.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                  isPass
                    ? 'bg-[#16A34A] text-white'
                    : 'border border-[#111827]/15 bg-white text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Check className="w-3 h-3" aria-hidden="true" />
                <span>OK</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleFlag(item.id)}
                aria-label={`Flag issue on ${item.label}`}
                className={`min-h-[34px] px-2 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                  isFlag
                    ? 'bg-[#C8231D] text-white'
                    : 'border border-[#111827]/15 bg-white text-[#4B5563] hover:text-[#C8231D]'
                }`}
              >
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                <span>Flag</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BookingInspectionPanel({
  booking,
  assignedVehicle,
  activeTab,
  onTabChange,
  odometerOut,
  setOdometerOut,
  fuelOut,
  setFuelOut,
  conditionOut,
  setConditionOut,
  handoverPassed,
  setHandoverPassed,
  handoverFlagged,
  setHandoverFlagged,
  odometerIn,
  setOdometerIn,
  fuelIn,
  setFuelIn,
  damageNotes,
  setDamageNotes,
  returnPassed,
  setReturnPassed,
  returnFlagged,
  setReturnFlagged,
  onOpenPrintSlip,
}: BookingInspectionPanelProps) {
  const odoOutNum = odometerOut.trim() ? Number(odometerOut) : null;
  const odoInNum = odometerIn.trim() ? Number(odometerIn) : null;
  const tripDistanceKm =
    odoOutNum !== null && odoInNum !== null && !Number.isNaN(odoOutNum) && !Number.isNaN(odoInNum)
      ? odoInNum - odoOutNum
      : null;

  function toggleCheckpoint(
    id: InspectionItemId,
    mode: 'pass' | 'flag',
    passedList: InspectionItemId[],
    flaggedList: InspectionItemId[],
    setPassed: (ids: InspectionItemId[]) => void,
    setFlagged: (ids: InspectionItemId[]) => void
  ) {
    if (mode === 'pass') {
      if (passedList.includes(id)) {
        setPassed(passedList.filter((x) => x !== id));
      } else {
        setPassed([...passedList, id]);
        setFlagged(flaggedList.filter((x) => x !== id));
      }
    } else {
      if (flaggedList.includes(id)) {
        setFlagged(flaggedList.filter((x) => x !== id));
      } else {
        setFlagged([...flaggedList, id]);
        setPassed(passedList.filter((x) => x !== id));
      }
    }
  }

  function handleFastPassHandover() {
    if (!odometerOut.trim() && assignedVehicle?.currentOdometerKm) {
      setOdometerOut(String(assignedVehicle.currentOdometerKm));
    }
    if (!fuelOut.trim()) {
      setFuelOut('Full (8/8)');
    }
    setHandoverPassed([...INSPECTION_ITEM_IDS]);
    setHandoverFlagged([]);
    if (!conditionOut.trim()) {
      setConditionOut('All 8 points clear & ready');
    }
  }

  function handleFastPassReturn() {
    setReturnPassed([...INSPECTION_ITEM_IDS]);
    setReturnFlagged([]);
    if (!fuelIn.trim()) {
      setFuelIn(fuelOut || 'Full (8/8)');
    }
    if (!damageNotes.trim()) {
      setDamageNotes('No new damage; clean return');
    }
  }

  function appendQuickNote(current: string, setter: (v: string) => void, phrase: string) {
    const clean = current.trim();
    if (!clean) {
      setter(phrase);
      return;
    }
    if (clean.toLowerCase().includes(phrase.toLowerCase())) return;
    setter(`${clean}; ${phrase}`);
  }

  function insertFlaggedSummary(
    flaggedIds: InspectionItemId[],
    current: string,
    setter: (v: string) => void
  ) {
    if (flaggedIds.length === 0) return;
    const labels = flaggedIds
      .map((id) => INSPECTION_CHECKPOINTS.find((c) => c.id === id)?.label || id)
      .join(', ');
    appendQuickNote(current, setter, `Issues flagged: ${labels}`);
  }

  const handoverSummaryText =
    handoverFlagged.length > 0
      ? `${handoverPassed.length}/8 OK · ${handoverFlagged.length} Flagged`
      : `${handoverPassed.length}/8 Clear`;

  const returnSummaryText =
    returnFlagged.length > 0
      ? `${returnPassed.length}/8 OK · ${returnFlagged.length} Flagged`
      : `${returnPassed.length}/8 Clear`;

  return (
    <div className="space-y-4 pt-4 border-t border-[#111827]/10">
      {/* Header + Print Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            Handover & Return Inspection Checklists
          </h3>
          <p className="text-xs text-[#4B5563]">
            One-tap checkpoints, odometer prefill, and 8-step fuel gauge for fast dispatch.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPrintSlip}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#111827]/20 bg-white text-xs font-semibold text-[#111827] hover:bg-[#F9FAFB] whitespace-nowrap shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-[#194793]" aria-hidden="true" />
          <span>Print Inspection Slip</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#EFF3F9] border border-[#111827]/10">
        <button
          type="button"
          onClick={() => onTabChange('handover')}
          className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap truncate ${
            activeTab === 'handover'
              ? 'bg-[#194793] text-white'
              : 'text-[#4B5563] hover:text-[#111827]'
          }`}
        >
          1. Departure Out ({handoverSummaryText})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('return')}
          className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap truncate ${
            activeTab === 'return'
              ? 'bg-[#111827] text-white'
              : 'text-[#4B5563] hover:text-[#111827]'
          }`}
        >
          2. Return Check ({returnSummaryText})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('compare')}
          className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap truncate ${
            activeTab === 'compare'
              ? 'bg-white text-[#111827] shadow-xs'
              : 'text-[#4B5563] hover:text-[#111827]'
          }`}
        >
          3. Compare Audit
        </button>
      </div>

      {/* TAB 1: DEPARTURE HANDOVER */}
      {activeTab === 'handover' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md bg-[#EFF3F9] border border-[#194793]/15">
            <div className="text-xs text-[#111827]">
              <span className="font-semibold text-[#194793]">Fast Departure:</span> Prefill
              odometer, mark all 8 items OK, and record standard clearance in one click.
            </div>
            <div className="flex items-center gap-2">
              {handoverPassed.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setHandoverPassed([]);
                    setHandoverFlagged([]);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#111827]/15 bg-white text-[11px] font-medium text-[#4B5563] hover:text-[#111827] whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleFastPassHandover}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4" aria-hidden="true" />
                <span>Mark All Clear (Fast Pass)</span>
              </button>
            </div>
          </div>

          {/* Odometer & Fuel */}
          <div className="grid grid-cols-1 gap-4 p-4 rounded-md bg-white border border-[#111827]/12">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="handover-odo-out"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111827]"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#194793]" aria-hidden="true" />
                  <span>Departure Odometer (km)</span>
                </label>
                {assignedVehicle && assignedVehicle.currentOdometerKm > 0 && (
                  <button
                    type="button"
                    onClick={() => setOdometerOut(String(assignedVehicle.currentOdometerKm))}
                    className="font-mono text-[11px] font-semibold text-[#194793] hover:underline tabular-nums"
                  >
                    Use vehicle current: {assignedVehicle.currentOdometerKm.toLocaleString()} km
                  </button>
                )}
              </div>
              <input
                id="handover-odo-out"
                type="number"
                min={0}
                placeholder={
                  assignedVehicle
                    ? `e.g. ${assignedVehicle.currentOdometerKm}`
                    : 'Enter odometer km'
                }
                value={odometerOut}
                onChange={(e) => setOdometerOut(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-sm tabular-nums focus:outline-none focus:border-[#194793]"
              />
            </div>

            <FuelSelector
              label="Departure Fuel Gauge"
              value={fuelOut}
              onChange={setFuelOut}
            />
          </div>

          {/* 8-Point Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#111827]">
                8-Point Pre-Dispatch Readiness ({handoverPassed.length}/8 Verified)
              </span>
              {handoverFlagged.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    insertFlaggedSummary(handoverFlagged, conditionOut, setConditionOut)
                  }
                  className="text-[11px] font-semibold text-[#C8231D] hover:underline"
                >
                  Copy {handoverFlagged.length} flagged item(s) to notes
                </button>
              )}
            </div>
            <CheckpointMatrix
              passed={handoverPassed}
              flagged={handoverFlagged}
              onTogglePass={(id) =>
                toggleCheckpoint(
                  id,
                  'pass',
                  handoverPassed,
                  handoverFlagged,
                  setHandoverPassed,
                  setHandoverFlagged
                )
              }
              onToggleFlag={(id) =>
                toggleCheckpoint(
                  id,
                  'flag',
                  handoverPassed,
                  handoverFlagged,
                  setHandoverPassed,
                  setHandoverFlagged
                )
              }
            />
          </div>

          {/* Condition Notes + 1-Tap Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="handover-condition-out" className="text-xs font-semibold text-[#111827]">
                Departure Condition Notes
              </label>
              {conditionOut.trim() && (
                <button
                  type="button"
                  onClick={() => setConditionOut('')}
                  className="text-[11px] text-[#4B5563] hover:text-[#111827]"
                >
                  Clear notes
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTURE_QUICK_NOTES.map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => appendQuickNote(conditionOut, setConditionOut, note)}
                  className="px-2.5 py-1 rounded border border-[#111827]/15 bg-[#F9FAFB] text-[11px] font-medium text-[#111827] hover:border-[#194793] hover:text-[#194793]"
                >
                  + {note}
                </button>
              ))}
            </div>
            <textarea
              id="handover-condition-out"
              rows={2}
              maxLength={300}
              placeholder="Tap quick notes above or type pre-existing marks / accessory notes..."
              value={conditionOut}
              onChange={(e) => setConditionOut(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#194793]"
            />
            {booking.handoverCompletedAt && (
              <p className="text-[11px] font-mono text-[#4B5563] tabular-nums">
                Last handover saved: {booking.handoverCompletedAt}
                {booking.handoverCompletedBy ? ` by ${booking.handoverCompletedBy}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RETURN CHECK-IN */}
      {activeTab === 'return' && (
        <div className="space-y-4">
          {/* Departure Baseline Reminder */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-md bg-[#F9FAFB] border border-[#111827]/10 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-[#4B5563]">
              <span className="font-semibold text-[#111827]">Departure Baseline:</span>
              <span className="font-mono tabular-nums">
                {odoOutNum !== null ? `${odoOutNum.toLocaleString()} km` : 'No out odo'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{fuelOut || 'Fuel not set'}</span>
              <span aria-hidden="true">·</span>
              <span>{handoverPassed.length}/8 Clear</span>
            </div>

            <button
              type="button"
              onClick={handleFastPassReturn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>All Clear (Fast Return)</span>
            </button>
          </div>

          {/* Odometer In + Trip Distance */}
          <div className="grid grid-cols-1 gap-4 p-4 rounded-md bg-white border border-[#111827]/12">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="return-odo-in"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111827]"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#111827]" aria-hidden="true" />
                  <span>Return Odometer (km)</span>
                </label>

                {tripDistanceKm !== null && (
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums ${
                      tripDistanceKm < 0 ? 'text-[#C8231D]' : 'text-[#16A34A]'
                    }`}
                  >
                    {tripDistanceKm < 0
                      ? `Lower than Out by ${Math.abs(tripDistanceKm).toLocaleString()} km`
                      : `Trip Distance: +${tripDistanceKm.toLocaleString()} km`}
                  </span>
                )}
              </div>

              <input
                id="return-odo-in"
                type="number"
                min={0}
                placeholder={
                  odoOutNum !== null ? `Must be >= ${odoOutNum}` : 'Enter return odometer km'
                }
                value={odometerIn}
                onChange={(e) => setOdometerIn(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-sm tabular-nums focus:outline-none focus:border-[#194793]"
              />

              {odoOutNum !== null && odoOutNum > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-[#4B5563]">Quick add from Out:</span>
                  {[25, 80, 150, 300].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => setOdometerIn(String(odoOutNum + delta))}
                      className="px-2 py-1 rounded border border-[#111827]/15 bg-[#F9FAFB] font-mono text-[#111827] hover:border-[#194793] hover:text-[#194793] tabular-nums"
                    >
                      +{delta} km
                    </button>
                  ))}
                </div>
              )}
            </div>

            <FuelSelector
              label="Return Fuel Gauge"
              value={fuelIn}
              onChange={setFuelIn}
              comparisonTarget={fuelOut}
            />
          </div>

          {/* 8-Point Return Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#111827]">
                8-Point Return Check ({returnPassed.length}/8 Verified)
              </span>
              {returnFlagged.length > 0 && (
                <button
                  type="button"
                  onClick={() => insertFlaggedSummary(returnFlagged, damageNotes, setDamageNotes)}
                  className="text-[11px] font-semibold text-[#C8231D] hover:underline"
                >
                  Copy {returnFlagged.length} flagged item(s) to notes
                </button>
              )}
            </div>
            <CheckpointMatrix
              passed={returnPassed}
              flagged={returnFlagged}
              onTogglePass={(id) =>
                toggleCheckpoint(
                  id,
                  'pass',
                  returnPassed,
                  returnFlagged,
                  setReturnPassed,
                  setReturnFlagged
                )
              }
              onToggleFlag={(id) =>
                toggleCheckpoint(
                  id,
                  'flag',
                  returnPassed,
                  returnFlagged,
                  setReturnPassed,
                  setReturnFlagged
                )
              }
            />
          </div>

          {/* Damage / Incident Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="return-damage-notes" className="text-xs font-semibold text-[#111827]">
                Return Condition & Incident Notes
              </label>
              {damageNotes.trim() && (
                <button
                  type="button"
                  onClick={() => setDamageNotes('')}
                  className="text-[11px] text-[#4B5563] hover:text-[#111827]"
                >
                  Clear notes
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RETURN_QUICK_NOTES.map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => appendQuickNote(damageNotes, setDamageNotes, note)}
                  className="px-2.5 py-1 rounded border border-[#111827]/15 bg-[#F9FAFB] text-[11px] font-medium text-[#111827] hover:border-[#194793] hover:text-[#194793]"
                >
                  + {note}
                </button>
              ))}
            </div>
            <textarea
              id="return-damage-notes"
              rows={2}
              maxLength={300}
              placeholder="Tap quick notes above or log scratches, missing kit, or fuel variance..."
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#194793]"
            />
            {booking.returnCompletedAt && (
              <p className="text-[11px] font-mono text-[#4B5563] tabular-nums">
                Last return saved: {booking.returnCompletedAt}
                {booking.returnCompletedBy ? ` by ${booking.returnCompletedBy}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COMPARE AUDIT */}
      {activeTab === 'compare' && (
        <div className="rounded-md border border-[#111827]/12 bg-white overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#111827]/10 text-[#4B5563] font-semibold">
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3">Departure Out</th>
                <th className="py-2.5 px-3">Return In</th>
                <th className="py-2.5 px-3 text-right">Delta / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111827]/10">
              <tr>
                <td className="py-2.5 px-3 font-medium text-[#111827]">Odometer</td>
                <td className="py-2.5 px-3 font-mono tabular-nums">
                  {odoOutNum !== null ? `${odoOutNum.toLocaleString()} km` : '—'}
                </td>
                <td className="py-2.5 px-3 font-mono tabular-nums">
                  {odoInNum !== null ? `${odoInNum.toLocaleString()} km` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[#194793]">
                  {tripDistanceKm !== null
                    ? `${tripDistanceKm >= 0 ? '+' : ''}${tripDistanceKm.toLocaleString()} km`
                    : 'Pending return'}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-[#111827]">Fuel Level</td>
                <td className="py-2.5 px-3 font-mono tabular-nums">{fuelOut || '—'}</td>
                <td className="py-2.5 px-3 font-mono tabular-nums">{fuelIn || '—'}</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                  {fuelOut && fuelIn
                    ? (() => {
                        const diff = parseFuelEighths(fuelIn) - parseFuelEighths(fuelOut);
                        return diff === 0 ? (
                          <span className="text-[#16A34A]">Matched</span>
                        ) : diff > 0 ? (
                          <span className="text-[#16A34A]">+{diff}/8</span>
                        ) : (
                          <span className="text-[#C8231D]">{diff}/8 short</span>
                        );
                      })()
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-[#111827]">8-Point Checklist</td>
                <td className="py-2.5 px-3 font-mono tabular-nums">
                  {handoverPassed.length}/8 OK
                  {handoverFlagged.length > 0 ? ` (${handoverFlagged.length} flag)` : ''}
                </td>
                <td className="py-2.5 px-3 font-mono tabular-nums">
                  {returnPassed.length}/8 OK
                  {returnFlagged.length > 0 ? ` (${returnFlagged.length} flag)` : ''}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold">
                  {returnFlagged.length > 0 ? (
                    <span className="text-[#C8231D]">{returnFlagged.length} issue(s)</span>
                  ) : returnPassed.length === 8 ? (
                    <span className="text-[#16A34A]">All clear</span>
                  ) : (
                    <span className="text-[#4B5563]">In progress</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-[#111827]">Condition Notes</td>
                <td className="py-2.5 px-3 text-[#4B5563]">{conditionOut || '—'}</td>
                <td className="py-2.5 px-3 text-[#4B5563]">{damageNotes || '—'}</td>
                <td className="py-2.5 px-3 text-right text-[#4B5563]">Logged</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-[#111827]">Sign-Off Stamp</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-[#4B5563] tabular-nums">
                  {booking.handoverCompletedAt || 'Not saved yet'}
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-[#4B5563] tabular-nums">
                  {booking.returnCompletedAt || 'Not saved yet'}
                </td>
                <td className="py-2.5 px-3 text-right text-[11px] text-[#4B5563]">
                  {booking.returnCompletedBy || booking.handoverCompletedBy || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
