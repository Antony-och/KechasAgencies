import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FLEET_VEHICLES, Vehicle } from '../data/fleet';
import { DESTINATIONS, DestinationGuide } from '../data/destinations';
import { JOURNAL_ARTICLES, JournalArticle } from '../data/journal';
import { TESTIMONIALS, Testimonial } from '../data/testimonials';
import { SITE_CONFIG } from '../data/site';
import {
  DestinationDoc,
  JournalPostDoc,
  SiteSettingsDoc,
  TestimonialDoc,
  VehicleDoc,
} from '../lib/adminTypes';

interface SiteDataContextValue {
  settings: SiteSettingsDoc;
  vehicles: Vehicle[];
  destinations: DestinationGuide[];
  journal: JournalArticle[];
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

const SiteDataContext = createContext<SiteDataContextValue>({
  settings: DEFAULT_SETTINGS,
  vehicles: makeFallbackVehicles(),
  destinations: DESTINATIONS,
  journal: JOURNAL_ARTICLES,
  testimonials: TESTIMONIALS,
  isFleetSynced: false,
  buildWhatsAppHref: (msg?: string) =>
    `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
      msg || SITE_CONFIG.defaultWhatsappMessage
    )}`,
});

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsDoc>(DEFAULT_SETTINGS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(makeFallbackVehicles);
  const [destinations, setDestinations] = useState<DestinationGuide[]>(DESTINATIONS);
  const [journal, setJournal] = useState<JournalArticle[]>(JOURNAL_ARTICLES);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(TESTIMONIALS);
  const [isFleetSynced, setIsFleetSynced] = useState(false);

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
          const mapped: Vehicle[] = snap.docs
            .map((d) => ({ ...(d.data() as VehicleDoc), id: d.id }))
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
              transmission:
                v.transmission === 'Automatic 4WD' ? 'Automatic 4WD' : 'Automatic',
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
          setVehicles(mapped);
          setIsFleetSynced(true);
        }
      },
      () => {}
    );

    const unsubDestinations = onSnapshot(
      collection(db, 'destinations'),
      (snap) => {
        if (!snap.empty) {
          const mapped: DestinationGuide[] = snap.docs.map((d) => {
            const raw = d.data() as DestinationDoc;
            return {
              slug: raw.slug,
              name: raw.name,
              county: raw.county,
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
            };
          });
          setDestinations(mapped);
        }
      },
      () => {}
    );

    const unsubJournal = onSnapshot(
      collection(db, 'journal'),
      (snap) => {
        if (!snap.empty) {
          const mapped: JournalArticle[] = snap.docs.map((d) => {
            const raw = d.data() as JournalPostDoc;
            const paragraphs = raw.body
              .split('\n\n')
              .map((p) => p.trim())
              .filter(Boolean);
            return {
              slug: raw.slug,
              title: raw.title,
              category: raw.category,
              publishedAt: raw.publishedAt,
              readTime: raw.readTime,
              image: raw.image,
              excerpt: raw.excerpt,
              sections: paragraphs.map((p, idx) => {
                const lines = p.split('\n');
                if (lines.length > 1 && lines[0].length <= 90) {
                  return {
                    heading: lines[0].trim(),
                    body: lines.slice(1).join('\n').trim(),
                  };
                }
                return {
                  heading: `Dispatch Note ${idx + 1}`,
                  body: p,
                };
              }),
              recommendedRouteSlug: raw.recommendedRouteSlug || 'lake-victoria-circuit',
            };
          });
          setJournal(mapped);
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
          setTestimonials(mapped);
        }
      },
      () => {}
    );

    return () => {
      unsubSettings();
      unsubVehicles();
      unsubDestinations();
      unsubJournal();
      unsubTestimonials();
    };
  }, []);

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
        journal,
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
