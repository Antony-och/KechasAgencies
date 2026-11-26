import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import ResilientImage from '../components/ResilientImage';
import { FLEET_CATEGORIES, formatKes } from '../data/fleet';
import { useSiteData } from '../contexts/SiteDataContext';

const HERO_SLIDES = [
  {
    src: '/src/assets/images/hero_kechas_lake_victoria_1795680603919.jpg',
    alt: 'Rugged Toyota Land Cruiser Prado 4x4 SUV overlooking Lake Victoria and winding Western Kenya hills at golden hour',
    caption: 'Lake Victoria Overlook · 4x4 Prado TX-L',
  },
  {
    src: '/src/assets/images/hero_kisumu_executive_arrival_1795680788545.jpg',
    alt: 'Sleek executive Mercedes-Benz sedan awaiting arrivals along palm-lined Kisumu International Airport avenue at sunrise',
    caption: 'KIS Airport Arrivals · Executive Chauffeur',
  },
  {
    src: '/src/assets/images/hero_kakamega_highland_drive_1795680790184.jpg',
    alt: 'Dark metallic 4x4 SUV climbing misty green tea hills near Kakamega Forest in Western Kenya at golden hour',
    caption: 'Kakamega & Nandi Hills · All-Terrain SUV',
  },
  {
    src: '/src/assets/images/hero_ruma_savannah_cruise_1795680790546.jpg',
    alt: 'Expedition group tourer on a scenic savannah road bordering Ruma National Park and Lambwe Valley at sunset',
    caption: 'Ruma & Homa Bay · Group Tourer',
  },
];

const SLIDE_INTERVAL_MS = 6000;
const FLEET_SECTION_BG = '/src/assets/images/fleet_section_kisumu_backdrop_1795681366250.jpg';

const TRUST_METRICS = [
  { value: '08', label: 'Vehicles Maintained In-House', accent: false },
  { value: '10', label: 'Counties Served Across Western Kenya', accent: false },
  { value: '24/7', label: 'Dispatch & Roadside Recovery', accent: true },
  { value: 'KIS', label: 'Instant Airport Pickups & M-Pesa', accent: false },
];

const HERO_PILLS = [
  'Driver & Fuel Included',
  '24/7 Roadside Command',
  'KIS Airport Pickup',
];

const REASONS = [
  {
    number: '01',
    title: 'Deep Regional Route Knowledge',
    body: 'Our chauffeurs navigate seasonal murram shortcuts toward Bondo, know exact refueling windows before Kisii, and time Ruma Park gate openings to the minute.',
  },
  {
    number: '02',
    title: '24/7 Roadside Command',
    body: 'If a tyre punctures on a remote Homa Bay track or an itinerary shifts past midnight, our Kisumu operations desk dispatches immediate backup.',
  },
  {
    number: '03',
    title: 'Seamless Airport Pickups',
    body: 'We track every flight landing at Kisumu International Airport (KIS) so your driver awaits outside Arrivals regardless of early arrivals or Nairobi delays.',
  },
  {
    number: '04',
    title: 'Pristine, Serviced Fleet',
    body: 'Every vehicle undergoes scheduled 5,000 km mechanical inspections, suspension checks, and pre-dispatch cabin sanitization before keys leave our desk.',
  },
  {
    number: '05',
    title: 'Vetted Professional Chauffeurs',
    body: 'Licensed, uniformed, and English/Swahili/Dholuo fluent drivers trained in defensive highland driving, diplomatic protocol, and field discretion.',
  },
  {
    number: '06',
    title: 'Transparent, Flexible Payment',
    body: 'Clear KES quotations upfront with zero surprise curb charges. Settle instantly via M-Pesa Paybill 247247, bank transfer, or monthly NGO/corporate invoicing.',
  },
];

export default function HomePage() {
  const { destinations, testimonials, settings, vehicles, buildWhatsAppHref } = useSiteData();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHoveringHero, setIsHoveringHero] = useState(false);
  const [failedSlides, setFailedSlides] = useState<Record<number, boolean>>({});
  const [fleetBgError, setFleetBgError] = useState(false);
  const featuredDestinations = destinations.filter((d) => d.featuredOnHome);
  const dynamicMetrics = TRUST_METRICS.map((m, idx) =>
    idx === 0 ? { ...m, value: String(vehicles.length || 8).padStart(2, '0') } : m
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (isHoveringHero) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isHoveringHero]);

  return (
    <div>
      {/* 1. Full-Bleed Hero Section with Background Slideshow & Integrated Bottom Metrics Bar */}
      <section
        aria-label="Kechas Agencies Western Kenya Car Hire"
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
        className="relative w-full overflow-hidden bg-[#123270] text-white min-h-[620px] lg:min-h-[680px] flex flex-col justify-between"
      >
        {/* Edge-to-Edge Crossfading Slideshow + Deep Navy Fallback Canvas */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#123270] via-[#1B479B] to-[#0D2352]"
        >
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === activeSlide;
            if (failedSlides[idx]) return null;
            return (
              <img
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                referrerPolicy="no-referrer"
                fetchPriority={idx === 0 ? 'high' : 'auto'}
                onError={() => setFailedSlides((prev) => ({ ...prev, [idx]: true }))}
                className={`absolute inset-0 w-full h-full object-cover object-[74%_62%] sm:object-[72%_58%] lg:object-[80%_55%] transition-[opacity,transform] duration-1000 ease-out will-change-transform ${
                  isActive ? 'opacity-100 scale-100 z-[1]' : 'opacity-0 scale-[1.03] z-0'
                }`}
              />
            );
          })}

          {/* Mobile & Tablet: Deepened downward Royal/Cobalt Blue gradient for full-frame legibility */}
          <div
            className="absolute inset-0 z-[2] lg:hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(12, 33, 75, 0.94) 0%, rgba(27, 71, 155, 0.84) 48%, rgba(12, 33, 75, 0.96) 100%)',
            }}
          />

          {/* Desktop: Directional horizontal fade from Deep Navy / Royal Blue left to vivid vehicle/lake right */}
          <div
            className="hidden lg:block absolute inset-0 z-[2]"
            style={{
              background:
                'linear-gradient(96deg, rgba(12, 33, 75, 0.97) 0%, rgba(18, 50, 112, 0.92) 22%, rgba(27, 71, 155, 0.78) 40%, rgba(27, 71, 155, 0.36) 60%, rgba(18, 50, 112, 0.1) 78%, rgba(18, 50, 112, 0.0) 100%)',
            }}
          />

          {/* Subtle vertical edge scrim on desktop so top header transition and bottom bar anchor cleanly */}
          <div
            className="hidden lg:block absolute inset-0 z-[2]"
            style={{
              background:
                'linear-gradient(180deg, rgba(18, 50, 112, 0.38) 0%, rgba(18, 50, 112, 0) 26%, rgba(18, 50, 112, 0) 68%, rgba(18, 50, 112, 0.84) 100%)',
            }}
          />
        </div>

        {/* 2. Left-Aligned Hero Content Container */}
        <div className="relative z-10 w-full flex-1 flex items-center">
          <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-20 lg:pb-14">
            <div className="max-w-[620px]">
              {/* Eyebrow Row */}
              <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-bold uppercase tracking-[0.18em] text-[#D61C1C]">
                <MapPin className="w-4 h-4 shrink-0 text-[#D61C1C]" aria-hidden="true" />
                <span>KISUMU · WESTERN KENYA</span>
              </div>

              {/* Display Headline */}
              <h1 className="mt-4 font-serif text-[clamp(2.3rem,4.4vw,3.85rem)] font-semibold leading-[1.06] tracking-tight text-white">
                More Than a Ride.{' '}
                <span className="underline decoration-[#D61C1C] decoration-[3.5px] underline-offset-[8px]">
                  A Better Way to Travel
                </span>
                .
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#F8FAFC] max-w-xl">
                From Kisumu International to the heart of the Kakamega Forest — the region’s most
                reliable fleet, driven by chauffeurs who know every route.
              </p>

              {/* Trust Feature Pills */}
              <ul
                className="mt-6 flex flex-wrap items-center gap-2.5"
                aria-label="Service highlights"
              >
                {HERO_PILLS.map((feature) => (
                  <li
                    key={feature}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B479B]/55 backdrop-blur-md border border-white/25 text-xs font-medium text-[#F8FAFC] whitespace-nowrap"
                  >
                    <Check
                      className="w-3.5 h-3.5 text-white shrink-0"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button Row */}
              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-white/15 border-b-[3px] border-b-[#D61C1C] shadow-lg shadow-[#0B1D42]/40 transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>Reserve Your Vehicle</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>

                <a
                  href={buildWhatsAppHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 min-h-[48px] rounded-md bg-[#0E2452]/65 hover:bg-[#0E2452]/85 backdrop-blur-md border border-white/35 text-white text-sm font-semibold transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 shrink-0 text-white"
                    aria-hidden="true"
                  >
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                  </svg>
                  <span>Chat via WhatsApp</span>
                </a>
              </div>

              {/* Rate Transparency Micro-Copy */}
              <p className="mt-4 text-xs sm:text-sm text-[#F8FAFC]/90">
                <span className="font-semibold text-[#FF5A52]">Karibu</span>
                <span> — quoted rates include driver, fuel and insurance</span>
              </p>
            </div>
          </div>
        </div>

        {/* 3. Integrated Bottom Glass Metrics Bar */}
        <div
          aria-label="Operational highlights"
          className="relative z-10 w-full border-t border-white/15 bg-[#0B1E45]/80 backdrop-blur-md"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-0">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {dynamicMetrics.map((item, idx) => {
                const borderClasses =
                  idx === 0
                    ? 'pr-4 pb-4 lg:py-5 lg:pl-0 lg:pr-6 border-b border-r border-white/15 lg:border-b-0'
                    : idx === 1
                      ? 'pl-4 pb-4 lg:py-5 lg:px-6 border-b border-white/15 lg:border-b-0 lg:border-r'
                      : idx === 2
                        ? 'pr-4 pt-4 lg:py-5 lg:px-6 border-r border-white/15'
                        : 'pl-4 pt-4 lg:py-5 lg:pl-6 lg:pr-0';

                return (
                  <div key={item.label} className={`${borderClasses} flex flex-col justify-center space-y-1`}>
                    <div
                      className={`font-serif text-2xl sm:text-3xl lg:text-[2rem] font-semibold leading-none tracking-tight tabular-nums ${
                        item.accent ? 'text-[#D61C1C]' : 'text-white'
                      }`}
                    >
                      {item.value}
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#F8FAFC]/85 leading-snug">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Who We Are (Editorial Story & Dispatch Mastery) */}
      <section className="py-16 lg:py-24 border-b border-[#111827]/10 bg-[#F9FAFB]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            {/* Visual Column: Documentary Chauffeur & Fleet Photo */}
            <div className="lg:col-span-5">
              <div className="relative h-80 sm:h-[420px] lg:h-full lg:min-h-[460px] rounded-xl overflow-hidden border border-[#111827]/10 bg-[#E5EBF4]">
                <ResilientImage
                  src="/src/assets/images/about_kechas_chauffeur_dispatch_1795681169503.jpg"
                  alt="Kechas Agencies executive chauffeur greeting beside a pearl-white Toyota Land Cruiser Prado along Lake Victoria in Kisumu"
                  className="w-full h-full object-cover object-[58%_25%]"
                  fallbackLabel="Kechas Agencies · Kisumu Chauffeur Dispatch"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#123270]/92 via-[#123270]/55 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white space-y-1.5">
                  <div className="w-8 h-[3px] bg-[#D61C1C] rounded-full" aria-hidden="true" />
                  <p className="font-serif text-lg sm:text-xl font-medium leading-snug">
                    Kisumu CBD to KIS Arrivals
                  </p>
                  <p className="text-xs text-[#F8FAFC]/85">
                    10 Western Kenya counties served daily · Direct operations desk
                  </p>
                </div>
              </div>
            </div>

            {/* Editorial Narrative & Operational Commitments */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#D61C1C]">
                  Who we are
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] leading-[1.12] tracking-tight text-[#111827]">
                  A transport partner born on these roads — not imported to them.
                </h2>
                <p className="text-base sm:text-lg leading-relaxed text-[#4B5563]">
                  Operating out of {settings.address} with an arrivals presence at Kisumu
                  International Airport (KIS), Kechas Agencies bridges executive hospitality and
                  rugged county mobility. Knowing which murram shortcuts toward Bondo hold firm
                  after rain, where to refuel cleanly before climbing into Kisii, and how early to
                  clear Ruma National Park gates is second nature to our dispatch team.
                </p>
              </div>

              {/* Three Scannable Operational Commitments */}
              <div className="divide-y divide-[#111827]/10 border-t border-b border-[#111827]/10">
                {[
                  {
                    num: '01.',
                    title: 'In-House 5,000 km Maintenance',
                    detail: `Every vehicle in our ${vehicles.length || 8}-car fleet follows a logged preventative calendar before keys leave our yard.`,
                  },
                  {
                    num: '02.',
                    title: 'Vetted Multilingual Chauffeurs',
                    detail:
                      'Uniformed, PSV-endorsed drivers fluent in English, Swahili, and Dholuo with deep Nyanza and Western county knowledge.',
                  },
                  {
                    num: '03.',
                    title: 'Transparent KES Billing',
                    detail: `Upfront quotations settled easily via M-Pesa Paybill ${settings.mpesaPaybill}, bank transfer, or monthly NGO and corporate invoicing.`,
                  },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-baseline"
                  >
                    <div className="sm:col-span-5 flex items-baseline gap-2.5">
                      <span className="font-mono text-xs font-semibold text-[#D61C1C] tabular-nums shrink-0">
                        {item.num}
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-medium text-[#111827]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="sm:col-span-7 text-sm leading-relaxed text-[#4B5563]">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Clean Metadata & Editorial CTA Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#4B5563]">
                  <span>
                    <strong className="font-semibold text-[#111827]">Head Office:</strong> Kisumu CBD
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-semibold text-[#111827]">Airport Desk:</strong> KIS
                    Arrivals
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-semibold text-[#111827]">Paybill:</strong>{' '}
                    <span className="font-mono tabular-nums">{settings.mpesaPaybill}</span>
                  </span>
                </div>

                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B479B] hover:text-[#123270] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Our story & safety standards</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fleet Overview (Full-Bleed Background & Directional Gradient Fade) */}
      <section
        aria-label="Fleet Overview"
        className="relative w-full overflow-hidden bg-[#123270] text-white py-16 lg:py-24 border-b border-white/10"
      >
        {/* Full-Bleed Section Background + Deep Navy Fallback */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#123270] via-[#1B479B] to-[#0B1E45]"
        >
          {!fleetBgError && (
            <img
              src={FLEET_SECTION_BG}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setFleetBgError(true)}
              className="w-full h-full object-cover object-[76%_38%] opacity-70"
            />
          )}

          {/* Mobile & Tablet: Deepened downward Royal/Cobalt Blue gradient across full frame */}
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(12, 33, 75, 0.95) 0%, rgba(27, 71, 155, 0.86) 45%, rgba(12, 33, 75, 0.97) 100%)',
            }}
          />

          {/* Desktop: Directional horizontal fade from Deep Navy / Royal Blue left to twilight fleet right */}
          <div
            className="hidden lg:block absolute inset-0"
            style={{
              background:
                'linear-gradient(100deg, rgba(12, 33, 75, 0.96) 0%, rgba(18, 50, 112, 0.90) 36%, rgba(27, 71, 155, 0.72) 66%, rgba(18, 50, 112, 0.52) 100%)',
            }}
          />

          {/* Vertical framing scrim to anchor header and bottom row smoothly */}
          <div
            className="hidden lg:block absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(12, 33, 75, 0.78) 0%, rgba(18, 50, 112, 0.35) 38%, rgba(12, 33, 75, 0.92) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-[#FF5A52]">
                The fleet
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-semibold leading-[1.12] tracking-tight text-white">
                {vehicles.length} maintained vehicles.{' '}
                <span className="underline decoration-[#D61C1C] decoration-[3px] underline-offset-[7px]">
                  Four ways to travel
                </span>
                .
              </h2>
              <p className="text-sm sm:text-base text-[#F8FAFC]/85 max-w-xl leading-relaxed">
                Every category is serviced in-house in Kisumu and ready for chauffeur-driven
                dispatch, airport arrivals, or vetted self-drive hire across Western Kenya.
              </p>
            </div>

            <Link
              to="/fleet"
              className="inline-flex items-center justify-center gap-2.5 px-5 py-3 min-h-[44px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-white/20 border-b-[3px] border-b-[#D61C1C] shadow-lg shadow-[#081533]/40 transition-colors duration-150 whitespace-nowrap shrink-0 self-start md:self-auto"
            >
              <span>Inspect full fleet & live availability</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>

          {/* Full-Bleed Directional-Gradient Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {FLEET_CATEGORIES.map((category) => {
              const catVehicles = vehicles.filter((v) => v.category === category.id);
              const readyCount = catVehicles.filter(
                (v) => !v.status || v.status === 'Available'
              ).length;
              const minRate =
                catVehicles.length > 0
                  ? Math.min(...catVehicles.map((v) => v.dailyRateKes))
                  : null;
              const maxPassengers =
                catVehicles.length > 0
                  ? Math.max(...catVehicles.map((v) => v.passengers))
                  : null;
              const supportsSelfDrive = catVehicles.some((v) => v.selfDriveAvailable);
              const liveModels =
                catVehicles.length > 0
                  ? catVehicles.map((v) => v.name).join(' · ')
                  : category.modelsLabel;
              const coverImage = catVehicles[0]?.image || category.image;

              return (
                <Link
                  key={category.id}
                  to={`/fleet#${category.id}`}
                  className="group relative min-h-[340px] sm:min-h-[360px] rounded-xl overflow-hidden border border-white/20 hover:border-white/50 bg-[#0E2452] flex flex-col justify-between shadow-xl shadow-[#081533]/45 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {/* Edge-to-Edge Card Vehicle Photograph */}
                  <div aria-hidden="true" className="absolute inset-0 bg-[#123270]">
                    <ResilientImage
                      src={coverImage}
                      alt={`${category.title} — ${liveModels}`}
                      className="w-full h-full object-cover object-[74%_55%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      fallbackLabel={category.title}
                    />

                    {/* Mobile: Deepened downward Royal/Cobalt Blue gradient */}
                    <div
                      className="absolute inset-0 sm:hidden"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(11, 29, 68, 0.90) 0%, rgba(27, 71, 155, 0.74) 48%, rgba(11, 29, 68, 0.96) 100%)',
                      }}
                    />

                    {/* Tablet & Desktop: Directional horizontal fade from Royal Blue left to clear vehicle right */}
                    <div
                      className="hidden sm:block absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(96deg, rgba(11, 29, 68, 0.96) 0%, rgba(18, 50, 112, 0.90) 40%, rgba(27, 71, 155, 0.48) 68%, rgba(18, 50, 112, 0.14) 100%)',
                      }}
                    />

                    {/* Subtle vertical card scrim for top-right rate badge and bottom spec row legibility */}
                    <div
                      className="hidden sm:block absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(11, 29, 68, 0.35) 0%, rgba(11, 29, 68, 0.08) 42%, rgba(11, 29, 68, 0.92) 100%)',
                      }}
                    />
                  </div>

                  {/* Card Foreground Copy */}
                  <div className="relative z-10 p-6 sm:p-7 flex-1 flex flex-col justify-between gap-8">
                    {/* Top Row: Model Lineup & Tabular Rate */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold tracking-wide text-[#FF6B63] truncate max-w-[66%]">
                        {liveModels}
                      </p>
                      {minRate !== null && (
                        <span className="font-mono text-xs font-semibold text-white tabular-nums shrink-0 px-2.5 py-1 rounded bg-[#0B1E45]/80 backdrop-blur-sm border border-white/20">
                          From {formatKes(minRate)}/d
                        </span>
                      )}
                    </div>

                    {/* Middle & Bottom Content */}
                    <div className="space-y-5">
                      <div className="max-w-[92%] sm:max-w-[78%] space-y-2.5">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <h3 className="font-serif text-2xl sm:text-[1.85rem] font-semibold leading-tight text-white">
                            {category.title}
                          </h3>
                          <span className="font-mono text-xs text-[#F8FAFC]/80 tabular-nums">
                            ({catVehicles.length})
                          </span>
                        </div>
                        <div
                          aria-hidden="true"
                          className="w-8 h-[3px] bg-[#D61C1C] rounded-full transition-all duration-200 group-hover:w-14"
                        />
                        <p className="text-sm leading-relaxed text-[#F8FAFC]/90">
                          {category.summary}
                        </p>
                      </div>

                      {/* Bottom Spec & Action Strip */}
                      <div className="pt-4 border-t border-white/15 flex items-center justify-between gap-4">
                        <p className="text-xs text-[#F8FAFC]/85 truncate">
                          {maxPassengers ? `Up to ${maxPassengers} seats` : 'Multi-passenger'}
                          <span aria-hidden="true"> · </span>
                          <span className="tabular-nums">{readyCount} ready</span>
                          <span aria-hidden="true"> · </span>
                          <span>{supportsSelfDrive ? 'Chauffeur & Self-Drive' : 'Chauffeur Only'}</span>
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white shrink-0 whitespace-nowrap">
                          <span>View fleet</span>
                          <ArrowRight
                            className="w-4 h-4 text-[#FF6B63] group-hover:translate-x-1 transition-transform duration-150"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us */}
      <section className="py-16 lg:py-24 border-b border-[#111827]/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">Why Kechas Agencies</p>
            <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-[#111827]">
              Six reasons our clients stop shopping around.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
            {REASONS.map((reason) => (
              <div key={reason.number} className="pt-5 border-t border-[#194793]/20 space-y-2.5">
                <div className="font-mono text-xs font-medium text-[#C8231D] tabular-nums">
                  {reason.number}
                </div>
                <h3 className="font-serif text-xl text-[#111827]">{reason.title}</h3>
                <p className="text-sm leading-relaxed text-[#4B5563]">{reason.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Regional Routes & Destinations */}
      <section className="py-16 lg:py-24 border-b border-[#111827]/10 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 lg:space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-bold uppercase tracking-[0.16em] text-[#D61C1C]">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>REGIONAL ROUTES & CORRIDORS</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-[#111827]">
                Six journeys across the Lake Basin & Highlands.
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                From Ruma’s savannah valleys and Rusinga’s golden causeway to misty Mt. Elgon switchbacks—every route paired with the right vehicle.
              </p>
            </div>
            <Link
              to="/destinations"
              className="inline-flex items-center justify-center gap-2.5 px-5 py-3 min-h-[44px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-[#123270] border-b-[3px] border-b-[#D61C1C] transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
            >
              <span>All {destinations.length} Western Kenya route guides</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
            {featuredDestinations.map((dest) => (
              <Link
                key={dest.slug}
                to={`/destinations#${dest.slug}`}
                className="group relative min-h-[370px] sm:min-h-[390px] rounded-xl overflow-hidden border border-[#123270]/15 hover:border-[#1B479B]/60 bg-[#0E2452] flex flex-col justify-between shadow-lg shadow-[#0B1D42]/12 hover:shadow-xl hover:shadow-[#0B1D42]/22 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B479B]"
              >
                {/* Full-Bleed Destination Photograph & Directional Gradient Scrim */}
                <div aria-hidden="true" className="absolute inset-0 bg-[#123270]">
                  <ResilientImage
                    src={dest.image}
                    alt={`${dest.name} in ${dest.county}`}
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                    fallbackLabel={dest.name}
                  />

                  {/* Top-to-Bottom Deep Navy / Royal Blue Scrim for Crisp Typography */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(11, 29, 68, 0.72) 0%, rgba(18, 50, 112, 0.18) 38%, rgba(11, 29, 68, 0.76) 66%, rgba(9, 23, 54, 0.96) 100%)',
                    }}
                  />

                  {/* Left-to-Right Directional Blue Wash */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(96deg, rgba(11, 29, 68, 0.65) 0%, rgba(18, 50, 112, 0.25) 50%, rgba(18, 50, 112, 0.04) 100%)',
                    }}
                  />
                </div>

                {/* Foreground Content */}
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between gap-8">
                  {/* Top Meta Row: County & Drive Time */}
                  <div className="flex items-start justify-between gap-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#FF6B63] truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#D61C1C]" aria-hidden="true" />
                      <span className="truncate">{dest.county}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-white tabular-nums shrink-0 px-2.5 py-1 rounded bg-[#0B1E45]/80 backdrop-blur-sm border border-white/20">
                      <Clock className="w-3 h-3 text-[#FF6B63]" aria-hidden="true" />
                      <span>{dest.driveTime}</span>
                    </span>
                  </div>

                  {/* Bottom Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-mono text-[11px] text-[#F8FAFC]/80 tracking-wide">
                        {dest.distanceFromKisumu}
                      </p>
                      <h3 className="font-serif text-2xl font-semibold leading-snug text-white">
                        {dest.name}
                      </h3>
                      <div
                        aria-hidden="true"
                        className="w-8 h-[3px] bg-[#D61C1C] rounded-full transition-all duration-200 group-hover:w-14"
                      />
                      <p className="text-xs sm:text-sm leading-relaxed text-[#F8FAFC]/90 line-clamp-3">
                        {dest.summary}
                      </p>
                    </div>

                    {/* Footer Strip */}
                    <div className="pt-3.5 border-t border-white/15 flex items-center justify-between gap-3">
                      <p className="text-xs text-[#F8FAFC]/85 truncate">
                        <span className="text-[#F8FAFC]/65">Best fit: </span>
                        <span className="font-semibold text-white">{dest.recommendedVehicle}</span>
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white shrink-0 whitespace-nowrap">
                        <span>Guide</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 text-[#FF6B63] group-hover:translate-x-1 transition-transform duration-150"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Client Testimonials */}
      <section className="py-16 lg:py-24 border-b border-[#111827]/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">In their words</p>
            <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-[#111827]">
              Trusted across field missions, family milestones, and arrivals.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <article
                key={t.id}
                className="flex flex-col justify-between p-6 sm:p-7 rounded-lg border border-[#111827]/10 bg-white space-y-6"
              >
                <blockquote className="text-sm sm:text-base leading-relaxed text-[#111827]">
                  “{t.quote}”
                </blockquote>
                <div className="pt-4 border-t border-[#111827]/10 space-y-1">
                  <p className="font-serif text-base font-medium text-[#111827]">{t.clientName}</p>
                  <p className="text-xs text-[#4B5563]">
                    {t.role} · {t.context}
                  </p>
                  <p className="text-xs font-semibold text-[#194793] pt-1">{t.route}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final Conversion Banner */}
      <section className="bg-[#194793] text-white py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-white">
                Your vehicle is ready. The road is waiting.
              </h2>
              <p className="text-sm sm:text-base text-[#E2E8F0] max-w-xl">
                Confirm availability in minutes via our live quote calculator, direct phone line, or
                WhatsApp dispatch desk in Kisumu.
              </p>
              <p className="text-xs font-mono tabular-nums text-[#CBD5E1]">
                M-Pesa Paybill: {settings.mpesaPaybill} · Account: {settings.mpesaAccount}
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-3">
              <Link
                to="/book"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#C8231D] text-white text-sm font-semibold hover:bg-[#A61B16] transition-colors whitespace-nowrap"
              >
                <span>Reserve Online</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <a
                href={`tel:+${settings.whatsappNumber.replace(/\D/g, '')}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md bg-white text-[#194793] text-sm font-semibold hover:bg-[#EFF3F9] transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span className="font-mono tabular-nums">{settings.phoneDisplay}</span>
              </a>
              <a
                href={buildWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md border border-white/35 text-sm font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
