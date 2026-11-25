export const INSPECTION_ITEM_IDS = [
  'exterior',
  'glass',
  'lights',
  'tyres_spare',
  'interior_ac',
  'safety_kit',
  'documents',
  'keys_fuel_card',
] as const;

export type InspectionItemId = (typeof INSPECTION_ITEM_IDS)[number];

export interface InspectionCheckpointDef {
  id: InspectionItemId;
  label: string;
  hint: string;
}

export const INSPECTION_CHECKPOINTS: InspectionCheckpointDef[] = [
  {
    id: 'exterior',
    label: 'Exterior & Bumpers',
    hint: 'Doors, panels, wipers, no fresh dents',
  },
  {
    id: 'glass',
    label: 'Windscreen & Mirrors',
    hint: 'Crack-free glass, side mirrors secure',
  },
  {
    id: 'lights',
    label: 'Lights & Indicators',
    hint: 'Headlights, brake lights, hazards OK',
  },
  {
    id: 'tyres_spare',
    label: 'Tyres & Spare Wheel',
    hint: 'Good tread + inflated spare tyre',
  },
  {
    id: 'interior_ac',
    label: 'Cabin, A/C & Belts',
    hint: 'Clean seats, cold A/C, seatbelts working',
  },
  {
    id: 'safety_kit',
    label: 'Jack, Triangle & Kit',
    hint: 'Wheel spanner, warning triangle, first aid',
  },
  {
    id: 'documents',
    label: 'Insurance & NTSA',
    hint: 'Valid stickers, road license & copy',
  },
  {
    id: 'keys_fuel_card',
    label: 'Keys & Immobilizer',
    hint: 'Main key/fob verified & handed over',
  },
];

export const FUEL_LEVELS = [
  { value: 'Empty (0/8)', shortLabel: 'E', eighths: 0 },
  { value: '1/8 Tank', shortLabel: '1/8', eighths: 1 },
  { value: '1/4 Tank', shortLabel: '1/4', eighths: 2 },
  { value: '3/8 Tank', shortLabel: '3/8', eighths: 3 },
  { value: '1/2 Tank', shortLabel: '1/2', eighths: 4 },
  { value: '5/8 Tank', shortLabel: '5/8', eighths: 5 },
  { value: '3/4 Tank', shortLabel: '3/4', eighths: 6 },
  { value: '7/8 Tank', shortLabel: '7/8', eighths: 7 },
  { value: 'Full (8/8)', shortLabel: 'Full', eighths: 8 },
] as const;

export const DEPARTURE_QUICK_NOTES = [
  'All 8 points clear & ready',
  'Clean & sanitized cabin',
  'Spare tyre, jack & triangle verified',
  'Minor pre-existing bumper scuff',
  'Ready for KIS Airport pickup',
] as const;

export const RETURN_QUICK_NOTES = [
  'No new damage; clean return',
  'Needs exterior wash & vacuum',
  'Fuel short vs departure level',
  'Minor new scratch / scuff noted',
  'Tyre puncture / wheel check needed',
] as const;

export function parseFuelEighths(label?: string): number {
  if (!label) return 8;
  const trimmed = label.trim().toLowerCase();
  const matched = FUEL_LEVELS.find(
    (f) => f.value.toLowerCase() === trimmed || f.shortLabel.toLowerCase() === trimmed
  );
  if (matched) return matched.eighths;
  if (trimmed.includes('full') || trimmed.includes('8/8')) return 8;
  if (trimmed.includes('7/8')) return 7;
  if (trimmed.includes('3/4') || trimmed.includes('6/8')) return 6;
  if (trimmed.includes('5/8')) return 5;
  if (trimmed.includes('1/2') || trimmed.includes('half') || trimmed.includes('4/8')) return 4;
  if (trimmed.includes('3/8')) return 3;
  if (trimmed.includes('1/4') || trimmed.includes('2/8')) return 2;
  if (trimmed.includes('1/8')) return 1;
  if (trimmed.includes('empty') || trimmed.includes('0/8')) return 0;
  return 8;
}

export function formatStampNow(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function sanitizeInspectionIds(ids?: string[]): InspectionItemId[] {
  if (!Array.isArray(ids)) return [];
  const allowed = new Set<string>(INSPECTION_ITEM_IDS);
  const unique: InspectionItemId[] = [];
  for (const id of ids) {
    if (allowed.has(id) && !unique.includes(id as InspectionItemId)) {
      unique.push(id as InspectionItemId);
    }
  }
  return unique.slice(0, 8);
}
