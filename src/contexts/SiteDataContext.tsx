import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FLEET_VEHICLES, Vehicle } from '../data/fleet';
import { DESTINATIONS, DestinationGuide } from '../data/destinations';
import { TESTIMONIALS, Testimonial } from '../data/testimonials';
import { SITE_CONFIG } from '../data/site';
import {
  DestinationDoc,
  SiteSettingsDoc,
  TestimonialDoc,
  VehicleDoc,
} from '../lib/adminTypes';
import { useAuth } from './AuthContext';
import { useDemoPortal } from './DemoPortalContext';

interface SiteDataContextValue {
  settings: SiteSettingsDoc;
  vehicles: Vehicle[];
  destinations: DestinationGuide[];
  testimonials: Testimonial[];
  isFleetSynced: boolean;
  buildWhatsAppHref: (customMessage?: string) => string;
}

const DEFAULT_SETTINGS: SiteSettingsDoc = {
  companyName: SITE_CONFIG.brandName,
  phoneDisplay: SITE_CONFIG.phoneDisplay,
  whatsappNumber: SITE_CONFIG.whatsappNumber,
  email: SITE_CONFIG.email,
  address: SITE_CONFIG.address,
  mpesaPaybill: SITE_CONFIG.mpesa.paybill,
  mpesaAccount: SITE_CONFIG.mpesa.account,
  vatEnabled: true,
  vatRatePercent: 16,
  chauffeurDailyFeeKes: 2000,
  dispatchHours: SITE_CONFIG.dispatchHours,
  kraPin: 'P051940221K',
  bankDetails: 'KCB Bank Kisumu · Acc: 1204889120 · Kisumu Main',
  bookingTermsSummary:
    'Chauffeur rates include driver allowance and comprehensive insurance. Self-drive requires a valid driving licence and National ID or Passport.',
};

function makeFallbackVehicles(): Vehicle[] {
  return FLEET_VEHICLES.map((v) => ({
    ...v,
    selfDriveRateKes: v.selfDriveAvailable ? Math.max(3500, v.dailyRateKes - 1500) : 0,
    status: 'Available' as const,
  }));
}

function mapVehicleDocs(docs: VehicleDoc[]): Vehicle[] {
  return docs
    .filter((v) => v.status !== 'Inactive')
    .map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      categoryLabel: v.categoryLabel,
      registrationPlate: v.registrationPlate,
      image: v.image,
      passengers: v.passengers,
      luggage: v.luggage,
      transmission: v.transmission === 'Automatic 4WD' ? 'Automatic 4WD' : 'Automatic',
      fuelType: v.fuelType === 'Diesel' ? 'Diesel' : 'Petrol',
      terrain: v.terrain,
      chauffeurAvailable: v.chauffeurAvailable,
      selfDriveAvailable: v.selfDriveAvailable,
      dailyRateKes: v.dailyRateKes,
      selfDriveRateKes: v.selfDriveRateKes,
      status: v.status,
      highlight: v.highlight,
      idealFor: [v.registrationPlate],
    }));
}

function mergeDestinationDocs(docs: DestinationDoc[]): DestinationGuide[] {
  const bySlug = new Map<string, DestinationGuide>();
  docs.forEach((raw) => {
    const staticMatch = DESTINATIONS.find((item) => item.slug === raw.slug);
    bySlug.set(raw.slug, {
      slug: raw.slug,
      name: raw.name,
      county: raw.county,
      category: staticMatch?.category,
      distanceFromKisumu: raw.distanceFromKisumu,
      driveTime: raw.driveTime,
      recommendedVehicle: raw.recommendedVehicle,
      recommendedVehicleId: raw.recommendedVehicleId,
      image: raw.image,
      summary: raw.summary,
      roadConditions: raw.roadConditions,
      localTips: (raw.localTipsText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      featuredOnHome: raw.featuredOnHome,
    });
  });

  const merged: DestinationGuide[] = DESTINATIONS.map(
    (fallback) => bySlug.get(fallback.slug) ?? fallback
  );
  bySlug.forEach((docItem, slug) => {
    if (!DESTINATIONS.some((item) => item.slug === slug)) {
      merged.push(docItem);
    }
  });
  return merged;
}

const SiteDataContext = createContext<SiteDataContextValue>({
  settings: DEFAULT_SETTINGS,
  vehicles: makeFallbackVehicles(),
  destinations: DESTINATIONS,
  testimonials: TESTIMONIALS,
  isFleetSynced: false,
  buildWhatsAppHref: (msg?: string) =>
    `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
      msg || SITE_CONFIG.defaultWhatsappMessage
    )}`,
});

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useAuth();
  const demo = useDemoPortal();

  const [settings, setSettings] = useState<SiteSettingsDoc>(DEFAULT_SETTINGS);
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>(makeFallbackVehicles);
  const [liveDestinations, setLiveDestinations] = useState<DestinationGuide[]>(DESTINATIONS);
  const [liveTestimonials, setLiveTestimonials] = useState<Testimonial[]>(TESTIMONIALS);
  const [liveFleetSynced, setLiveFleetSynced] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'site'),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as SiteSettingsDoc) });
        }
      },
      () => {
        // Fallback silently to default settings on transient error
      }
    );

    let hasSyncedVehicles = false;
    const unsubVehicles = onSnapshot(
      collection(db, 'vehicles'),
      (snap) => {
        if (!snap.empty || hasSyncedVehicles) {
          hasSyncedVehicles = true;
          setLiveVehicles(
            mapVehicleDocs(snap.docs.map((d) => ({ ...(d.data() as VehicleDoc), id: d.id })))
          );
          setLiveFleetSynced(true);
        }
      },
      () => {}
    );

    const unsubDestinations = onSnapshot(
      collection(db, 'destinations'),
      (snap) => {
        if (!snap.empty) {
          setLiveDestinations(
            mergeDestinationDocs(snap.docs.map((d) => ({ ...(d.data() as DestinationDoc), id: d.id })))
          );
        }
      },
      () => {}
    );

    const unsubTestimonials = onSnapshot(
      collection(db, 'testimonials'),
      (snap) => {
        if (!snap.empty) {
          const mapped: Testimonial[] = snap.docs.map((d) => {
            const raw = d.data() as TestimonialDoc;
            return {
              id: d.id,
              quote: raw.quote,
              clientName: raw.clientName,
              role: raw.role,
              context: raw.context,
              route: raw.route,
            };
          });
          setLiveTestimonials(mapped);
        }
      },
      () => {}
    );

    return () => {
      unsubSettings();
      unsubVehicles();
      unsubDestinations();
      unsubTestimonials();
    };
  }, []);

  const vehicles = useMemo(
    () => (isDemoMode ? mapVehicleDocs(demo.vehicles) : liveVehicles),
    [isDemoMode, demo.vehicles, liveVehicles]
  );

  const destinations = useMemo(
    () => (isDemoMode ? mergeDestinationDocs(demo.destinations) : liveDestinations),
    [isDemoMode, demo.destinations, liveDestinations]
  );

  const testimonials = useMemo(
    () =>
      isDemoMode
        ? demo.testimonials.map((t) => ({
            id: t.id,
            quote: t.quote,
            clientName: t.clientName,
            role: t.role,
            context: t.context,
            route: t.route,
          }))
        : liveTestimonials,
    [isDemoMode, demo.testimonials, liveTestimonials]
  );

  const isFleetSynced = isDemoMode ? true : liveFleetSynced;

  const buildWhatsAppHref = (customMessage?: string) => {
    const digits = settings.whatsappNumber.replace(/\D/g, '') || SITE_CONFIG.whatsappNumber;
    const text = encodeURIComponent(customMessage || SITE_CONFIG.defaultWhatsappMessage);
    return `https://wa.me/${digits}?text=${text}`;
  };

  return (
    <SiteDataContext.Provider
      value={{
        settings,
        vehicles,
        destinations,
        testimonials,
        isFleetSynced,
        buildWhatsAppHref,
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
