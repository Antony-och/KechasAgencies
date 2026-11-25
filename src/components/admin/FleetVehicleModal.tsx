import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react';
import ResilientImage from '../ResilientImage';
import { useSiteData } from '../../contexts/SiteDataContext';
import { db } from '../../lib/firebase';
import { SiteSettingsDoc, VehicleDoc, VehicleStatus } from '../../lib/adminTypes';
import { FleetCategoryId, formatKes } from '../../data/fleet';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import {
  getChauffeurDailyFeeKes,
} from '../../lib/pricing';

export const FLEET_CATEGORY_LABELS: Record<FleetCategoryId, string> = {
  executive: 'Executive',
  '4x4-safari': '4x4 Safari',
  'family-group': 'Family & Group',
  economy: 'Economy Fleet',
};

const FLEET_IMAGE_PRESETS = [
  {
    label: 'Land Cruiser Prado 4x4',
    url: '/src/assets/images/fleet_toyota_prado_1795598678345.jpg',
  },
  {
    label: 'Mercedes-Benz E-Class',
    url: '/src/assets/images/fleet_mercedes_eclass_1795598677542.jpg',
  },
  {
    label: 'Mazda CX-5 SUV',
    url: '/src/assets/images/fleet_mazda_cx5_1795598677965.jpg',
  },
  {
    label: 'Toyota Noah / Voxy MPV',
    url: '/src/assets/images/fleet_toyota_noah_1795598678673.jpg',
  },
  {
    label: 'Toyota Sedan / Fielder',
    url: '/src/assets/images/fleet_toyota_sedan_1795598679217.jpg',
  },
  {
    label: 'Compact Hatchback',
    url: '/src/assets/images/fleet_compact_hatch_1795598680030.jpg',
  },
];

const TERRAIN_QUICK_OPTIONS = [
  'Urban Streets & Highway Tarmac',
  'All-Terrain · Murram, Safari Parks & Highland Tracks',
  'Highways, Tea Highlands & Smooth Murram',
];

type HireMode = 'both' | 'chauffeur-only' | 'self-drive-only';

interface QuickPreset {
  id: string;
  label: string;
  baseRateKes: number;
  values: Partial<VehicleDoc>;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'preset-4x4',
    label: '4x4 Safari',
    baseRateKes: 16000,
    values: {
      category: '4x4-safari',
      selfDriveRateKes: 16000,
      selfDriveAvailable: true,
      chauffeurAvailable: true,
      passengers: 7,
      luggage: 5,
      transmission: 'Automatic 4WD',
      fuelType: 'Diesel',
      terrain: 'All-Terrain · Murram, Safari Parks & Highland Tracks',
      highlight:
        'Full-time 4WD with elevated clearance and dual-zone climate control for Western Kenya field loops.',
      image: '/src/assets/images/fleet_toyota_prado_1795598678345.jpg',
    },
  },
  {
    id: 'preset-executive',
    label: 'Executive Sedan',
    baseRateKes: 14500,
    values: {
      category: 'executive',
      dailyRateKes: 16500,
      selfDriveRateKes: 0,
      selfDriveAvailable: false,
      chauffeurAvailable: true,
      passengers: 4,
      luggage: 3,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      terrain: 'Urban Tarmac & Inter-County Highways',
      highlight:
        'Chauffeur-driven executive cabin tailored for VIP KIS airport arrivals, boardrooms, and formal events.',
      image: '/src/assets/images/fleet_mercedes_eclass_1795598677542.jpg',
    },
  },
  {
    id: 'preset-mpv',
    label: 'Family & Group',
    baseRateKes: 7000,
    values: {
      category: 'family-group',
      selfDriveRateKes: 7000,
      selfDriveAvailable: true,
      chauffeurAvailable: true,
      passengers: 7,
      luggage: 6,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      terrain: 'Highways & Maintained County Roads',
      highlight:
        'Spacious 7-seater MPV with twin sliding doors and generous boot capacity for group transfers and ceremonies.',
      image: '/src/assets/images/fleet_toyota_noah_1795598678673.jpg',
    },
  },
  {
    id: 'preset-economy',
    label: 'Economy Saloon',
    baseRateKes: 3500,
    values: {
      category: 'economy',
      selfDriveRateKes: 3500,
      selfDriveAvailable: true,
      chauffeurAvailable: true,
      passengers: 5,
      luggage: 3,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      terrain: 'Urban Streets & Highway Tarmac',
      highlight:
        'Clean, fuel-efficient daily runner ideal for Kisumu errands, Maseno commutes, and inter-county tarmac.',
      image: '/src/assets/images/fleet_toyota_sedan_1795598679217.jpg',
    },
  },
];

function futureIso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function buildSlugId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 56);
  const suffix = Date.now().toString(36).slice(-4);
  return base ? `${base}-${suffix}` : `veh_${Date.now()}`;
}

async function compressUploadedPhoto(file: File): Promise<{ dataUrl: string; kb: number }> {
  const imageSrc = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Unsupported or corrupted image format.'));
    el.src = imageSrc;
  });

  const maxW = 960;
  const maxH = 720;
  let width = img.naturalWidth || maxW;
  let height = img.naturalHeight || maxH;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  width = Math.max(1, Math.round(width * ratio));
  height = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas is unavailable for photo compression.');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 260000 && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrl.length > 340000) {
    throw new Error('Image is still too large after compression. Please pick a smaller image.');
  }

  const kb = Math.max(1, Math.round((dataUrl.length * 0.75) / 1024));
  return { dataUrl, kb };
}

export function createDefaultVehicleDraft(
  settingsOrFee?: Partial<SiteSettingsDoc> | number
): Partial<VehicleDoc> {
  const resolvedSettings: Partial<SiteSettingsDoc> =
    typeof settingsOrFee === 'number'
      ? { chauffeurDailyFeeKes: settingsOrFee }
      : settingsOrFee || {};
  const driverFeeKes = getChauffeurDailyFeeKes(resolvedSettings);
  const baseSelfDrive = 3500;

  return {
    name: '',
    category: 'economy',
    categoryLabel: 'Economy Fleet',
    registrationPlate: '',
    dailyRateKes: baseSelfDrive + driverFeeKes,
    selfDriveRateKes: baseSelfDrive,
    selfDriveAvailable: true,
    chauffeurAvailable: true,
    passengers: 5,
    luggage: 3,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    terrain: 'Urban Streets & Highway Tarmac',
    highlight: 'Clean, regularly serviced Kisumu fleet vehicle ready for regional dispatch.',
    image: '/src/assets/images/fleet_toyota_sedan_1795598679217.jpg',
    currentOdometerKm: 50000,
    nextServiceKm: 55000,
    nextServiceDate: futureIso(180),
    insuranceExpiryDate: futureIso(365),
    ntsaExpiryDate: futureIso(365),
    status: 'Available',
  };
}

interface FleetVehicleModalProps {
  open: boolean;
  isNew: boolean;
  initialVehicle: Partial<VehicleDoc> | null;
  defaultShowCompliance?: boolean;
  onClose: () => void;
  onSaved?: (vehicleId: string) => void;
}

const CAROUSEL_SLIDES = [
  { id: 0, label: '1. Photo & Upload', Icon: ImageIcon },
  { id: 1, label: '2. Specs & Terrain', Icon: SlidersHorizontal },
  { id: 2, label: '3. Copy', Icon: FileText },
] as const;

export default function FleetVehicleModal({
  open,
  isNew,
  initialVehicle,
  defaultShowCompliance = false,
  onClose,
  onSaved,
}: FleetVehicleModalProps) {
  const { settings } = useSiteData();
  const driverFeeKes = getChauffeurDailyFeeKes(settings);

  const [form, setForm] = useState<Partial<VehicleDoc>>(() =>
    createDefaultVehicleDraft(settings)
  );
  const [activePresetId, setActivePresetId] = useState<string>('');
  const [carouselSlide, setCarouselSlide] = useState<0 | 1 | 2>(0);
  const [showCompliance, setShowCompliance] = useState(defaultShowCompliance);
  const [showCustomUrl, setShowCustomUrl] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadMeta, setUploadMeta] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const defaults = createDefaultVehicleDraft(settings);
    const base = initialVehicle ? { ...defaults, ...initialVehicle } : defaults;
    setForm(base);
    setFormError('');
    setPhotoError('');
    setUploadMeta('');
    setCarouselSlide(0);
    setShowCompliance(defaultShowCompliance || !isNew);
    const isPresetPhoto = FLEET_IMAGE_PRESETS.some((p) => p.url === base.image);
    const isUploadedDataUri = Boolean(base.image?.startsWith('data:image/'));
    setShowCustomUrl(!isPresetPhoto && !isUploadedDataUri && Boolean(base.image));
    setActivePresetId('');
  }, [open, initialVehicle, isNew, defaultShowCompliance, settings]);

  if (!open) return null;

  const cat = (form.category || 'economy') as FleetCategoryId;
  const status = (form.status || 'Available') as VehicleStatus;
  const isVisibleOnSite = status !== 'Inactive';

  const hireMode: HireMode =
    form.chauffeurAvailable && form.selfDriveAvailable
      ? 'both'
      : form.chauffeurAvailable
        ? 'chauffeur-only'
        : 'self-drive-only';

  const isUploadedPhoto = Boolean(form.image?.startsWith('data:image/'));
  const carouselPhotos = isUploadedPhoto
    ? [{ label: 'Uploaded Photo', url: form.image || '' }, ...FLEET_IMAGE_PRESETS]
    : FLEET_IMAGE_PRESETS;
  const activePhotoIndex = Math.max(
    0,
    carouselPhotos.findIndex((p) => p.url === form.image)
  );
  const currentCarouselPhoto = carouselPhotos[activePhotoIndex] || carouselPhotos[0];

  function applyQuickPreset(preset: QuickPreset) {
    setActivePresetId(preset.id);
    setShowCustomUrl(false);
    setUploadMeta('');
    setPhotoError('');
    const presetSelfRate = preset.values.selfDriveAvailable
      ? preset.values.selfDriveRateKes ?? preset.baseRateKes
      : 0;
    const computedDailyRate = preset.values.selfDriveAvailable
      ? presetSelfRate + driverFeeKes
      : preset.baseRateKes + driverFeeKes;
    setForm((prev) => ({
      ...prev,
      ...preset.values,
      dailyRateKes: computedDailyRate,
      categoryLabel:
        FLEET_CATEGORY_LABELS[(preset.values.category || 'economy') as FleetCategoryId],
    }));
  }

  function handleHireModeChange(mode: HireMode) {
    setForm((prev) => {
      const baseSelf =
        (prev.selfDriveRateKes ?? 0) > 0
          ? Number(prev.selfDriveRateKes)
          : Math.max(3000, (Number(prev.dailyRateKes) || 5000) - driverFeeKes);

      if (mode === 'both') {
        return {
          ...prev,
          chauffeurAvailable: true,
          selfDriveAvailable: true,
          selfDriveRateKes: baseSelf,
          dailyRateKes: baseSelf + driverFeeKes,
        };
      }
      if (mode === 'chauffeur-only') {
        return {
          ...prev,
          chauffeurAvailable: true,
          selfDriveAvailable: false,
          selfDriveRateKes: 0,
          dailyRateKes: Math.max(Number(prev.dailyRateKes) || 0, baseSelf + driverFeeKes),
        };
      }
      return {
        ...prev,
        chauffeurAvailable: false,
        selfDriveAvailable: true,
        selfDriveRateKes: baseSelf,
      };
    });
  }

  function handleSelfDriveRateChange(rawVal: string) {
    const baseRate = Math.max(0, Number(rawVal) || 0);
    setForm((prev) => {
      const next: Partial<VehicleDoc> = {
        ...prev,
        selfDriveRateKes: baseRate,
      };
      if (prev.chauffeurAvailable) {
        next.dailyRateKes = baseRate + driverFeeKes;
      }
      return next;
    });
  }

  function syncChauffeurFromDriverFee() {
    const baseSelf = Number(form.selfDriveRateKes) || 0;
    setForm((prev) => ({
      ...prev,
      dailyRateKes: baseSelf + driverFeeKes,
    }));
  }

  function stepPhotoCarousel(direction: -1 | 1) {
    const nextIdx =
      (activePhotoIndex + direction + carouselPhotos.length) % carouselPhotos.length;
    setShowCustomUrl(false);
    setForm((prev) => ({ ...prev, image: carouselPhotos[nextIdx].url }));
  }

  async function processPhotoFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose a valid image file (JPG, PNG, or WebP).');
      return;
    }
    setPhotoError('');
    setUploadingPhoto(true);
    try {
      const { dataUrl, kb } = await compressUploadedPhoto(file);
      setForm((prev) => ({ ...prev, image: dataUrl }));
      setShowCustomUrl(false);
      setUploadMeta(`Uploaded ${file.name} (${kb} KB)`);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to process photo.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void processPhotoFile(file);
    }
  }

  function handlePhotoDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processPhotoFile(file);
    }
  }

  function generateHighlightCopy() {
    const seats = Number(form.passengers) || 5;
    const tx = form.transmission || 'Automatic';
    const terrainText = form.terrain || 'Kisumu & Western Kenya routes';
    const copy = `${seats}-seater ${tx} vehicle kept in peak mechanical order for ${terrainText.toLowerCase()}.`;
    setForm((prev) => ({ ...prev, highlight: copy.slice(0, 500) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const cleanName = (form.name || '').trim().slice(0, 100);
    const cleanPlate = (form.registrationPlate || '').trim().toUpperCase().slice(0, 20);

    if (!cleanName) {
      setFormError('Please enter the vehicle model name (e.g., Toyota Land Cruiser Prado).');
      return;
    }
    if (!cleanPlate) {
      setFormError('Please enter the registration plate (e.g., KDP 412X).');
      return;
    }

    const docId = isNew
      ? buildSlugId(cleanName)
      : (form.id || buildSlugId(cleanName)).slice(0, 80);

    const odo = Math.max(0, Number(form.currentOdometerKm) || 0);
    const nextSvcKm = Math.max(0, Number(form.nextServiceKm) || odo + 5000);
    const cleanSelfRate = form.selfDriveAvailable
      ? Math.max(0, Number(form.selfDriveRateKes) || 0)
      : 0;
    const cleanChauffeurRate = form.chauffeurAvailable
      ? Math.max(0, Number(form.dailyRateKes) || 0)
      : cleanSelfRate;

    const payload = {
      id: docId,
      name: cleanName,
      category: cat,
      categoryLabel: FLEET_CATEGORY_LABELS[cat],
      registrationPlate: cleanPlate,
      dailyRateKes: cleanChauffeurRate,
      selfDriveRateKes: cleanSelfRate,
      selfDriveAvailable: Boolean(form.selfDriveAvailable),
      chauffeurAvailable: Boolean(form.chauffeurAvailable),
      passengers: Math.min(30, Math.max(1, Number(form.passengers) || 5)),
      luggage: Math.min(30, Math.max(0, Number(form.luggage) || 3)),
      transmission: (form.transmission || 'Automatic').slice(0, 40),
      fuelType: (form.fuelType || 'Petrol').slice(0, 20),
      terrain: (form.terrain || 'Urban Streets & Highway Tarmac').trim().slice(0, 160),
      highlight: (
        form.highlight ||
        'Clean, well-maintained Kechas Agencies vehicle ready for regional dispatch.'
      )
        .trim()
        .slice(0, 500),
      image: (
        form.image || '/src/assets/images/fleet_toyota_sedan_1795598679217.jpg'
      )
        .trim()
        .slice(0, 350000),
      currentOdometerKm: odo,
      nextServiceKm: nextSvcKm,
      nextServiceDate: (form.nextServiceDate || futureIso(180)).slice(0, 20),
      insuranceExpiryDate: (form.insuranceExpiryDate || futureIso(365)).slice(0, 20),
      ntsaExpiryDate: (form.ntsaExpiryDate || futureIso(365)).slice(0, 20),
      status,
      updatedAt: serverTimestamp(),
    };

    setSaving(true);
    try {
      await setDoc(doc(db, 'vehicles', docId), payload);
      onSaved?.(docId);
      onClose();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save vehicle. Check your permissions.'
      );
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${docId}`);
    } finally {
      setSaving(false);
    }
  }

  const previewRate = Number(form.dailyRateKes) || 0;
  const previewSelfRate = Number(form.selfDriveRateKes) || 0;
  const chauffeurMatchesFormula =
    form.chauffeurAvailable &&
    form.selfDriveAvailable &&
    previewRate === previewSelfRate + driverFeeKes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fleet-modal-title"
    >
      <div className="w-full max-w-5xl rounded-lg bg-white border border-[#111827]/15 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Sticky Top Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[#111827]/10 flex items-center justify-between gap-4 bg-white shrink-0">
          <div>
            <p className="text-xs font-semibold text-[#C8231D]">
              {isNew ? 'Quick Vehicle Setup' : `Editing · ${form.registrationPlate || 'Vehicle'}`}
            </p>
            <h2 id="fleet-modal-title" className="font-serif text-xl sm:text-2xl text-[#111827]">
              {isNew ? 'Add Fleet Vehicle' : form.name || 'Edit Fleet Vehicle'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close vehicle modal"
            className="p-2 rounded-md border border-[#111827]/15 text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Two-Column Body */}
        <form id="fleet-vehicle-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Streamlined Form */}
            <div className="lg:col-span-7 p-5 sm:p-7 space-y-6">
              {/* 1-Click Presets (New Vehicle only) */}
              {isNew && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#111827]">
                      Quick-Fill Template (1 Click)
                    </span>
                    <span className="text-[11px] text-[#4B5563]">
                      Uses +{formatKes(driverFeeKes)}/d driver fee
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {QUICK_PRESETS.map((preset) => {
                      const active = activePresetId === preset.id;
                      const presetDisplayRate = preset.baseRateKes + driverFeeKes;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyQuickPreset(preset)}
                          className={`px-3 py-2 rounded-md border text-left transition-colors ${
                            active
                              ? 'bg-[#194793] text-white border-[#194793]'
                              : 'bg-[#F9FAFB] text-[#111827] border-[#111827]/15 hover:bg-[#EFF3F9]'
                          }`}
                        >
                          <div className="text-xs font-semibold truncate">{preset.label}</div>
                          <div
                            className={`text-[11px] font-mono tabular-nums ${
                              active ? 'text-[#DBEAFE]' : 'text-[#4B5563]'
                            }`}
                          >
                            {formatKes(presetDisplayRate)}/d
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 1: Vehicle Essentials */}
              <div className="space-y-3.5">
                <span className="block text-xs font-semibold text-[#111827]">
                  1. Vehicle Identity &amp; Public Visibility
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2 space-y-1">
                    <label htmlFor="veh-name" className="text-[#4B5563]">
                      Model Name *
                    </label>
                    <input
                      id="veh-name"
                      type="text"
                      required
                      autoFocus={isNew}
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Toyota Land Cruiser Prado"
                      className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="veh-plate" className="text-[#4B5563]">
                      Reg. Plate *
                    </label>
                    <input
                      id="veh-plate"
                      type="text"
                      required
                      value={form.registrationPlate || ''}
                      onChange={(e) => setForm({ ...form, registrationPlate: e.target.value })}
                      placeholder="KDP 412X"
                      className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm font-mono uppercase text-[#111827] focus:outline-none focus:border-[#194793]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="block text-[#4B5563]">Category</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'executive', label: 'Executive' },
                          { id: '4x4-safari', label: '4x4 Safari' },
                          { id: 'family-group', label: 'Family & Group' },
                          { id: 'economy', label: 'Economy' },
                        ] as const
                      ).map((opt) => {
                        const active = cat === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                category: opt.id,
                                categoryLabel: FLEET_CATEGORY_LABELS[opt.id],
                              })
                            }
                            className={`px-2.5 py-2 rounded-md border text-xs font-medium whitespace-nowrap transition-colors ${
                              active
                                ? 'bg-[#194793] text-white border-[#194793]'
                                : 'bg-[#F9FAFB] text-[#111827] border-[#111827]/15 hover:bg-[#EFF3F9]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[#4B5563]">Status &amp; Website Visibility</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'Available', label: 'Available' },
                          { id: 'Booked', label: 'Booked' },
                          { id: 'In Maintenance', label: 'Maintenance' },
                          { id: 'Inactive', label: 'Hidden (Off)' },
                        ] as const
                      ).map((st) => {
                        const active = status === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setForm({ ...form, status: st.id })}
                            className={`px-2.5 py-2 rounded-md border text-xs font-medium whitespace-nowrap transition-colors ${
                              active
                                ? st.id === 'Inactive'
                                  ? 'bg-[#111827] text-white border-[#111827]'
                                  : st.id === 'In Maintenance'
                                    ? 'bg-[#C8231D] text-white border-[#C8231D]'
                                    : 'bg-[#194793] text-white border-[#194793]'
                                : 'bg-[#F9FAFB] text-[#111827] border-[#111827]/15 hover:bg-[#EFF3F9]'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Improved Rates & Hire Modes (KES) */}
              <div className="space-y-3.5 pt-4 border-t border-[#111827]/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#111827]">
                    2. Rates &amp; Hire Modes (KES)
                  </span>
                  <Link
                    to="/admin/settings"
                    onClick={onClose}
                    className="text-[11px] font-medium text-[#194793] hover:underline font-mono tabular-nums"
                  >
                    Driver fee: +{formatKes(driverFeeKes)}/d · Edit in Settings
                  </Link>
                </div>

                {/* 1-Tap Hire Mode Segmented Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'both', label: 'Chauffeur + Self-Drive' },
                      { id: 'chauffeur-only', label: 'Chauffeur Only' },
                      { id: 'self-drive-only', label: 'Self-Drive Only' },
                    ] as const
                  ).map((mode) => {
                    const active = hireMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleHireModeChange(mode.id)}
                        className={`px-2.5 py-2 rounded-md border text-xs font-medium text-center transition-colors ${
                          active
                            ? 'bg-[#194793] text-white border-[#194793]'
                            : 'bg-[#F9FAFB] text-[#111827] border-[#111827]/15 hover:bg-[#EFF3F9]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Pricing Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {form.selfDriveAvailable && (
                    <div className="space-y-1">
                      <label htmlFor="veh-rate-sd" className="text-[#4B5563]">
                        Self-Drive / Day *
                      </label>
                      <input
                        id="veh-rate-sd"
                        type="number"
                        min={0}
                        required
                        value={form.selfDriveRateKes ?? 0}
                        onChange={(e) => handleSelfDriveRateChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono tabular-nums text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                      />
                    </div>
                  )}

                  {form.chauffeurAvailable && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <label htmlFor="veh-rate-chauf" className="text-[#4B5563]">
                          With Driver / Day *
                        </label>
                        {form.selfDriveAvailable && !chauffeurMatchesFormula && (
                          <button
                            type="button"
                            onClick={syncChauffeurFromDriverFee}
                            className="text-[10px] font-semibold text-[#194793] hover:underline"
                          >
                            Auto
                          </button>
                        )}
                      </div>
                      <input
                        id="veh-rate-chauf"
                        type="number"
                        min={0}
                        required
                        value={form.dailyRateKes ?? 0}
                        onChange={(e) =>
                          setForm({ ...form, dailyRateKes: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono tabular-nums text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                      />
                    </div>
                  )}
                </div>

                {/* Live Formula Strip */}
                {form.chauffeurAvailable && (
                  <div className="px-3 py-2 rounded-md bg-[#EFF3F9] border border-[#194793]/15 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-[#111827]">
                    {form.selfDriveAvailable ? (
                      <span>
                        Driver Fee: Base {formatKes(previewSelfRate)} +{' '}
                        {formatKes(driverFeeKes)} ={' '}
                        <strong className="text-[#194793]">{formatKes(previewRate)}/d</strong>
                      </span>
                    ) : (
                      <span>
                        Chauffeur-only daily rate (includes {formatKes(driverFeeKes)}/day driver
                        fee)
                      </span>
                    )}
                    {form.selfDriveAvailable && !chauffeurMatchesFormula && (
                      <button
                        type="button"
                        onClick={syncChauffeurFromDriverFee}
                        className="font-sans font-semibold text-[#194793] hover:underline"
                      >
                        Reset to Base + {formatKes(driverFeeKes)}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: Storefront Photo, Specs & Copy Carousel */}
              <div className="space-y-3 pt-4 border-t border-[#111827]/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#111827]">
                    3. Storefront Photo, Specs &amp; Copy
                  </span>

                  {/* Carousel Arrow Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCarouselSlide((prev) => ((prev + 2) % 3) as 0 | 1 | 2)
                      }
                      aria-label="Previous section slide"
                      className="p-1.5 rounded-md border border-[#111827]/15 bg-[#F9FAFB] text-[#111827] hover:bg-[#EFF3F9]"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono tabular-nums text-[#4B5563] px-1">
                      {carouselSlide + 1} / 3
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCarouselSlide((prev) => ((prev + 1) % 3) as 0 | 1 | 2)
                      }
                      aria-label="Next section slide"
                      className="p-1.5 rounded-md border border-[#111827]/15 bg-[#F9FAFB] text-[#111827] hover:bg-[#EFF3F9]"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Carousel Card Container */}
                <div className="rounded-lg border border-[#111827]/12 bg-[#F9FAFB]/70 overflow-hidden">
                  {/* Slide Tabs */}
                  <div className="grid grid-cols-3 border-b border-[#111827]/10 bg-white">
                    {CAROUSEL_SLIDES.map(({ id, label, Icon }) => {
                      const active = carouselSlide === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCarouselSlide(id)}
                          className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] sm:text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                            active
                              ? 'border-[#194793] text-[#194793] bg-[#EFF3F9]/50 font-semibold'
                              : 'border-transparent text-[#4B5563] hover:text-[#111827]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Horizontal Sliding Viewport */}
                  <div className="overflow-hidden">
                    <div
                      className={`flex transition-transform duration-300 ease-out ${
                        carouselSlide === 0
                          ? 'translate-x-0'
                          : carouselSlide === 1
                            ? '-translate-x-full'
                            : '-translate-x-[200%]'
                      }`}
                    >
                      {/* SLIDE 0: Photo Carousel + Custom Photo Upload */}
                      <div className="w-full shrink-0 p-4 space-y-3.5">
                        {/* Featured Photo Carousel Stage */}
                        <div className="relative rounded-md border border-[#111827]/12 bg-white overflow-hidden">
                          <div className="aspect-[16/9] max-h-44 w-full bg-[#E5EBF4] overflow-hidden">
                            <ResilientImage
                              src={currentCarouselPhoto.url}
                              alt={currentCarouselPhoto.label}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => stepPhotoCarousel(-1)}
                            aria-label="Previous fleet photo"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#111827]/15 text-[#111827] flex items-center justify-center shadow-sm hover:bg-white"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => stepPhotoCarousel(1)}
                            aria-label="Next fleet photo"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#111827]/15 text-[#111827] flex items-center justify-center shadow-sm hover:bg-white"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <div className="px-3 py-1.5 bg-white border-t border-[#111827]/10 flex items-center justify-between text-[11px]">
                            <span className="font-medium text-[#111827] truncate">
                              {currentCarouselPhoto.label}
                            </span>
                            <span className="font-mono text-[#4B5563] tabular-nums">
                              Photo {activePhotoIndex + 1} / {carouselPhotos.length}
                            </span>
                          </div>
                        </div>

                        {/* Horizontal Thumbnail Strip */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {carouselPhotos.map((preset) => {
                            const selected = form.image === preset.url;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, image: preset.url });
                                  setShowCustomUrl(false);
                                }}
                                className={`relative w-16 h-12 rounded overflow-hidden border shrink-0 transition-all ${
                                  selected
                                    ? 'border-[#194793] ring-2 ring-[#194793]/35'
                                    : 'border-[#111827]/15 opacity-80 hover:opacity-100'
                                }`}
                                title={preset.label}
                              >
                                <ResilientImage
                                  src={preset.url}
                                  alt={preset.label}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Upload Own Photo Dropzone + Custom URL Toggle */}
                        <div className="space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/*"
                            onChange={handleFileInputChange}
                            className="hidden"
                          />
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handlePhotoDrop}
                            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border border-dashed border-[#194793]/40 bg-white"
                          >
                            <button
                              type="button"
                              disabled={uploadingPhoto}
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#EFF3F9] border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#DCE5F2] disabled:opacity-60"
                            >
                              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>
                                {uploadingPhoto ? 'Optimizing photo...' : 'Upload Your Own Photo'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowCustomUrl((v) => !v)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4B5563] hover:text-[#194793]"
                            >
                              <LinkIcon className="w-3 h-3" aria-hidden="true" />
                              <span>{showCustomUrl ? 'Hide URL field' : 'Or paste image URL'}</span>
                            </button>
                          </div>

                          {(uploadMeta || isUploadedPhoto) && (
                            <div className="flex items-center justify-between text-[11px] text-[#16A34A] font-medium px-1">
                              <span className="inline-flex items-center gap-1 truncate">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {uploadMeta || 'Custom uploaded photo active'}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadMeta('');
                                  setForm({ ...form, image: FLEET_IMAGE_PRESETS[0].url });
                                }}
                                className="text-[#4B5563] hover:text-[#C8231D] shrink-0 ml-2"
                              >
                                Reset
                              </button>
                            </div>
                          )}

                          {photoError && (
                            <p className="text-[11px] text-[#C8231D] font-medium">{photoError}</p>
                          )}

                          {showCustomUrl && (
                            <div className="space-y-1 text-xs pt-1">
                              <label htmlFor="veh-img-url" className="text-[#4B5563]">
                                Custom Image URL
                              </label>
                              <input
                                id="veh-img-url"
                                type="text"
                                value={isUploadedPhoto ? '' : form.image || ''}
                                onChange={(e) => {
                                  setUploadMeta('');
                                  setForm({ ...form, image: e.target.value });
                                }}
                                placeholder="https://... or /src/assets/images/..."
                                className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SLIDE 1: Specs & Recommended Terrain */}
                      <div className="w-full shrink-0 p-4 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="space-y-1">
                            <label htmlFor="veh-seats" className="text-[#4B5563]">
                              Seats
                            </label>
                            <input
                              id="veh-seats"
                              type="number"
                              min={1}
                              max={30}
                              value={form.passengers ?? 5}
                              onChange={(e) =>
                                setForm({ ...form, passengers: Number(e.target.value) })
                              }
                              className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white font-mono tabular-nums"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="veh-bags" className="text-[#4B5563]">
                              Suitcases
                            </label>
                            <input
                              id="veh-bags"
                              type="number"
                              min={0}
                              max={30}
                              value={form.luggage ?? 3}
                              onChange={(e) => setForm({ ...form, luggage: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white font-mono tabular-nums"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="veh-tx" className="text-[#4B5563]">
                              Transmission
                            </label>
                            <select
                              id="veh-tx"
                              value={form.transmission || 'Automatic'}
                              onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                              className="w-full px-2.5 py-2 rounded-md border border-[#111827]/20 bg-white"
                            >
                              <option value="Automatic">Automatic</option>
                              <option value="Automatic 4WD">Automatic 4WD</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="veh-fuel" className="text-[#4B5563]">
                              Fuel
                            </label>
                            <select
                              id="veh-fuel"
                              value={form.fuelType || 'Petrol'}
                              onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                              className="w-full px-2.5 py-2 rounded-md border border-[#111827]/20 bg-white"
                            >
                              <option value="Petrol">Petrol</option>
                              <option value="Diesel">Diesel</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <label htmlFor="veh-terrain" className="block text-[#4B5563]">
                            Recommended Terrain
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {TERRAIN_QUICK_OPTIONS.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setForm({ ...form, terrain: t })}
                                className={`px-2.5 py-1 rounded border text-[11px] transition-colors ${
                                  form.terrain === t
                                    ? 'bg-[#194793] text-white border-[#194793]'
                                    : 'bg-white text-[#4B5563] border-[#111827]/15 hover:text-[#111827]'
                                }`}
                              >
                                {t.split('·')[0].trim()}
                              </button>
                            ))}
                          </div>
                          <input
                            id="veh-terrain"
                            type="text"
                            value={form.terrain || ''}
                            onChange={(e) => setForm({ ...form, terrain: e.target.value })}
                            placeholder="e.g., All-Terrain · Murram & Highway Tarmac"
                            className="w-full px-3 py-2 rounded-md border border-[#111827]/20 bg-white"
                          />
                        </div>
                      </div>

                      {/* SLIDE 2: Storefront Copy */}
                      <div className="w-full shrink-0 p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="veh-highlight" className="font-medium text-[#111827]">
                            Public Storefront Description (shown on /fleet)
                          </label>
                          <button
                            type="button"
                            onClick={generateHighlightCopy}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#194793] hover:underline"
                          >
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                            <span>Auto-fill copy</span>
                          </button>
                        </div>
                        <textarea
                          id="veh-highlight"
                          rows={4}
                          maxLength={500}
                          value={form.highlight || ''}
                          onChange={(e) => setForm({ ...form, highlight: e.target.value })}
                          placeholder="Describe comfort, legroom, luggage space, and ideal Western Kenya corridors..."
                          className="w-full px-3 py-2.5 rounded-md border border-[#111827]/20 bg-white text-xs sm:text-sm"
                        />
                        <div className="flex items-center justify-between text-[11px] text-[#4B5563] font-mono tabular-nums">
                          <span>Shown directly on customer Fleet cards</span>
                          <span>{(form.highlight || '').length} / 500</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carousel Bottom Controls */}
                  <div className="px-4 py-2.5 bg-white border-t border-[#111827]/10 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      disabled={carouselSlide === 0}
                      onClick={() =>
                        setCarouselSlide((prev) => Math.max(0, prev - 1) as 0 | 1 | 2)
                      }
                      className="inline-flex items-center gap-1 text-[#4B5563] hover:text-[#111827] disabled:opacity-35"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((dot) => (
                        <button
                          key={dot}
                          type="button"
                          aria-label={`Go to slide ${dot + 1}`}
                          onClick={() => setCarouselSlide(dot as 0 | 1 | 2)}
                          className={`h-2 rounded-full transition-all ${
                            carouselSlide === dot ? 'w-5 bg-[#194793]' : 'w-2 bg-[#111827]/20'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCarouselSlide((prev) => ((prev + 1) % 3) as 0 | 1 | 2)
                      }
                      className="inline-flex items-center gap-1 font-semibold text-[#194793] hover:underline"
                    >
                      <span>
                        {carouselSlide === 0
                          ? 'Next: Specs'
                          : carouselSlide === 1
                            ? 'Next: Copy'
                            : 'Back to Photo'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 4: Collapsible Compliance & Odometer */}
              <div className="pt-4 border-t border-[#111827]/10">
                <button
                  type="button"
                  onClick={() => setShowCompliance((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 text-left text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#111827]">
                      4. Odometer, Service &amp; Compliance Dates
                    </span>
                    {!showCompliance && (
                      <span className="ml-2 font-mono text-[11px] text-[#4B5563] tabular-nums">
                        ({(Number(form.currentOdometerKm) || 0).toLocaleString()} km · Ins:{' '}
                        {form.insuranceExpiryDate})
                      </span>
                    )}
                  </div>
                  {showCompliance ? (
                    <ChevronUp className="w-4 h-4 text-[#4B5563]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#4B5563]" />
                  )}
                </button>

                {showCompliance && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="space-y-1">
                      <label htmlFor="veh-odo" className="text-[#4B5563]">
                        Odometer (km)
                      </label>
                      <input
                        id="veh-odo"
                        type="number"
                        min={0}
                        value={form.currentOdometerKm ?? 0}
                        onChange={(e) =>
                          setForm({ ...form, currentOdometerKm: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono tabular-nums"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="veh-svc-km" className="text-[#4B5563]">
                        Next Service (km)
                      </label>
                      <input
                        id="veh-svc-km"
                        type="number"
                        min={0}
                        value={form.nextServiceKm ?? 0}
                        onChange={(e) =>
                          setForm({ ...form, nextServiceKm: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono tabular-nums"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="veh-svc-date" className="text-[#4B5563]">
                        Service Date
                      </label>
                      <input
                        id="veh-svc-date"
                        type="date"
                        value={form.nextServiceDate || ''}
                        onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })}
                        className="w-full px-2 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="veh-ins-date" className="text-[#4B5563]">
                        Insurance Exp
                      </label>
                      <input
                        id="veh-ins-date"
                        type="date"
                        value={form.insuranceExpiryDate || ''}
                        onChange={(e) =>
                          setForm({ ...form, insuranceExpiryDate: e.target.value })
                        }
                        className="w-full px-2 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="veh-ntsa-date" className="text-[#4B5563]">
                        NTSA Expiry
                      </label>
                      <input
                        id="veh-ntsa-date"
                        type="date"
                        value={form.ntsaExpiryDate || ''}
                        onChange={(e) => setForm({ ...form, ntsaExpiryDate: e.target.value })}
                        className="w-full px-2 py-2 rounded-md border border-[#111827]/20 bg-[#F9FAFB] font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-md bg-[#FEF2F2] border border-[#C8231D]/30 text-xs text-[#991B1B]"
                >
                  {formError}
                </div>
              )}
            </div>

            {/* Right: Live Public Website Card Preview */}
            <aside className="lg:col-span-5 bg-[#EFF3F9]/60 border-t lg:border-t-0 lg:border-l border-[#111827]/10 p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#111827]">
                  Live Website Card Preview
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    isVisibleOnSite ? 'text-[#16A34A]' : 'text-[#4B5563]'
                  }`}
                >
                  {isVisibleOnSite ? (
                    <>
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Visible on Site</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Hidden from Site</span>
                    </>
                  )}
                </span>
              </div>

              <div className="rounded-lg border border-[#111827]/12 bg-white overflow-hidden">
                <div className="aspect-[4/3] bg-[#E5EBF4] overflow-hidden">
                  <ResilientImage
                    src={form.image || ''}
                    alt={form.name || 'Vehicle preview'}
                    className="w-full h-full object-cover"
                    fallbackLabel={form.name || 'New Fleet Vehicle'}
                  />
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[11px] font-semibold text-[#C8231D] truncate">
                        {FLEET_CATEGORY_LABELS[cat]} · {form.transmission || 'Automatic'} ·{' '}
                        {form.fuelType || 'Petrol'}
                      </p>
                      <h3 className="font-serif text-xl text-[#111827] truncate">
                        {form.name?.trim() || 'Model Name'}
                      </h3>
                      <p className="text-[11px] font-mono text-[#4B5563]">
                        {form.registrationPlate?.trim().toUpperCase() || 'PLATE'} · {status}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {form.chauffeurAvailable ? (
                        <>
                          <div className="font-mono text-base font-semibold text-[#194793] tabular-nums">
                            {formatKes(previewRate)}
                          </div>
                          <div className="text-[11px] text-[#4B5563]">chauffeur / day</div>
                          {form.selfDriveAvailable && previewSelfRate > 0 && (
                            <div className="text-[11px] font-mono text-[#111827] tabular-nums">
                              SD: {formatKes(previewSelfRate)}/d
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-mono text-base font-semibold text-[#194793] tabular-nums">
                            {formatKes(previewSelfRate)}
                          </div>
                          <div className="text-[11px] text-[#4B5563]">self-drive / day</div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[#4B5563] line-clamp-3">
                    {form.highlight?.trim() ||
                      'Public highlight description shown to customers on the Fleet page.'}
                  </p>

                  <div className="pt-3 border-t border-[#111827]/10 flex items-center justify-between text-xs text-[#111827] tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#194793]" aria-hidden="true" />
                      {Number(form.passengers) || 5} Pax
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#194793]" aria-hidden="true" />
                      {Number(form.luggage) || 3} Bags
                    </span>
                    <span className="text-[#4B5563]">
                      {form.chauffeurAvailable && form.selfDriveAvailable
                        ? 'Chauffeur · Self-Drive'
                        : form.chauffeurAvailable
                          ? 'Chauffeur-Driven'
                          : 'Self-Drive'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#4B5563] leading-relaxed">
                Changes saved here publish immediately to the public Fleet page, Home fleet counts,
                and the online Quote &amp; Booking calculator.
              </p>
            </aside>
          </div>
        </form>

        {/* Sticky Footer Actions */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-[#111827]/10 bg-[#F9FAFB] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#111827]/20 bg-white text-xs sm:text-sm font-medium text-[#111827] hover:bg-[#EFF3F9]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="fleet-vehicle-form"
            disabled={saving}
            className="px-5 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672] disabled:opacity-60 whitespace-nowrap"
          >
            {saving ? 'Saving Vehicle...' : isNew ? 'Publish Vehicle to Fleet' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
