import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Mail, MapPin, Phone } from 'lucide-react';
import ResilientImage from '../components/ResilientImage';
import { formatKes } from '../data/fleet';
import { useSiteData } from '../contexts/SiteDataContext';

type ServiceFilter = 'all' | 'personal' | 'corporate';

interface ServiceSection {
  id: string;
  number: string;
  group: 'personal' | 'corporate';
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  bookingParam: 'chauffeur' | 'self-drive' | 'airport-transfer';
  ctaLabel: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
}

const SERVICES_HERO_BG = '/src/assets/images/hero_kisumu_executive_arrival_1795680788545.jpg';

const SERVICES: ServiceSection[] = [
  {
    id: 'chauffeur',
    number: '01',
    group: 'personal',
    title: 'Chauffeur-Driven Hire',
    subtitle: 'Uniformed regional drivers · Comprehensive cover & route mastery',
    description:
      'Travel across Kisumu and all ten Western Kenya counties without worrying about parking, weighbridge congestion, or unfamiliar murram forks. Our vetted drivers know the terrain intimately and keep strict arrival schedules.',
    bullets: [
      'Fluent in English, Kiswahili, and Dholuo for seamless county coordination',
      '12-hour standard daily operating window with flexible early or late extensions',
      'Comprehensive passenger liability cover and 24/7 Kisumu roadside backup',
    ],
    bookingParam: 'chauffeur',
    ctaLabel: 'Book Chauffeur Hire',
    image: '/src/assets/images/about_kechas_chauffeur_dispatch_1795681169503.jpg',
    imageAlt:
      'Uniformed Kechas Agencies chauffeur greeting beside a pearl-white Land Cruiser Prado in Kisumu',
    imagePosition: 'object-[72%_24%]',
  },
  {
    id: 'self-drive',
    number: '02',
    group: 'personal',
    title: 'Self-Drive Car Hire',
    subtitle: 'Independent mobility · Vetted handover in Kisumu CBD',
    description:
      'For returning diaspora, visiting professionals, and travelers who prefer driving themselves across the Lake Basin. Available on our Toyota Prado, Mazda CX-5, Toyota Noah, and dependable Economy fleet.',
    bullets: [
      'Valid Kenyan or International Driving Licence (minimum 2 years driving experience)',
      'Original National ID or Passport verified quickly at our Kisumu handover desk',
      'Full pre-departure inspection checklist and 24/7 mechanical support across Western Kenya',
    ],
    bookingParam: 'self-drive',
    ctaLabel: 'Book Self-Drive',
    image: '/src/assets/images/hero_kakamega_highland_drive_1795680790184.jpg',
    imageAlt: 'All-terrain crossover SUV driving along misty Western Kenya tea ridges at sunrise',
    imagePosition: 'object-[76%_52%]',
  },
  {
    id: 'airport',
    number: '03',
    group: 'personal',
    title: 'Kisumu International Airport (KIS) Transfers',
    subtitle: 'Flight-tracked Arrivals · Direct CBD, Milimani & county connections',
    description:
      'Skip curbside negotiations after landing at KIS. We monitor your Kenya Airways, Jambojet, or Safarilink arrival in real time and position your driver outside Arrivals before touchdown.',
    bullets: [
      'Transparent KES rates to Kisumu CBD, Milimani, Dunga, and Maseno',
      'Zero extra charges if Nairobi or Mombasa departures run behind schedule',
      'Seamless onward connection directly to Kakamega, Siaya, Homa Bay, or Busia',
    ],
    bookingParam: 'airport-transfer',
    ctaLabel: 'Schedule KIS Transfer',
    image: '/src/assets/images/hero_kisumu_executive_arrival_1795680788545.jpg',
    imageAlt: 'Executive sedan ready along the palm-lined Kisumu International Airport avenue',
    imagePosition: 'object-[78%_55%]',
  },
  {
    id: 'corporate',
    number: '04',
    group: 'corporate',
    title: 'Corporate & NGO Fieldwork Transport',
    subtitle: 'Consolidated VAT invoicing · Multi-vehicle county logistics',
    description:
      'Engineered for development agencies, medical research teams, county contractors, and executive delegations operating across Nyanza and Western Kenya—combining boardroom polish with murram capability.',
    bullets: [
      'Dedicated Kisumu account coordinator and consolidated monthly VAT invoicing',
      'Pre-inspected 4x4 Prado units ready for off-tarmac clinic and project visits',
      'Immediate replacement vehicle guarantee if any unit requires scheduled servicing',
    ],
    bookingParam: 'chauffeur',
    ctaLabel: 'Request Corporate Booking',
    image: '/src/assets/images/hero_kechas_lake_victoria_1795680603919.jpg',
    imageAlt: 'Toyota Land Cruiser Prado overlooking Lake Victoria hills for regional fieldwork',
    imagePosition: 'object-[78%_58%]',
  },
  {
    id: 'events',
    number: '05',
    group: 'corporate',
    title: 'Weddings & Events Convoy Hire',
    subtitle: 'Matched executive sedans & 7-seat guest MPVs',
    description:
      'From traditional ceremonies in Maseno, Bondo, or Gem to lakeside receptions in Kisumu, we assemble matched Mercedes-Benz E-Class sedans and Toyota Noah vans with synchronized lead-car timing.',
    bullets: [
      'Matched pearl-white or obsidian-black presentation vehicles detailed before dispatch',
      'Lead-car timing coordination across church, homestead, and lakeside reception venues',
      'Dedicated standby chauffeur team throughout the celebration',
    ],
    bookingParam: 'chauffeur',
    ctaLabel: 'Plan Event Convoy',
    image: '/src/assets/images/fleet_mercedes_eclass_1795598677542.jpg',
    imageAlt: 'Executive Mercedes-Benz sedan prepared for VIP events and wedding convoys',
    imagePosition: 'object-[74%_55%]',
  },
];

export default function ServicesPage() {
  const { settings, vehicles, buildWhatsAppHref } = useSiteData();
  const [filter, setFilter] = useState<ServiceFilter>('all');
  const [heroBgError, setHeroBgError] = useState(false);

  const telHref = `tel:+${settings.whatsappNumber.replace(/\D/g, '')}`;

  const chauffeurMinRate = (() => {
    const eligible = vehicles.filter((v) => v.chauffeurAvailable);
    return eligible.length > 0 ? Math.min(...eligible.map((v) => v.dailyRateKes)) : null;
  })();

  const selfDriveEligible = vehicles.filter((v) => v.selfDriveAvailable);
  const selfDriveMinRate = (() => {
    const rates = selfDriveEligible
      .map((v) => (v.selfDriveRateKes && v.selfDriveRateKes > 0 ? v.selfDriveRateKes : v.dailyRateKes))
      .filter((r) => r > 0);
    return rates.length > 0 ? Math.min(...rates) : null;
  })();

  const visibleServices =
    filter === 'all' ? SERVICES : SERVICES.filter((s) => s.group === filter);

  function getServiceLiveSummary(service: ServiceSection): string {
    if (service.id === 'chauffeur') {
      const ratePart = chauffeurMinRate !== null ? `From ${formatKes(chauffeurMinRate)}/day` : 'Custom daily rates';
      return `${ratePart} · ${vehicles.filter((v) => v.chauffeurAvailable).length} chauffeur-ready vehicles`;
    }
    if (service.id === 'self-drive') {
      const ratePart = selfDriveMinRate !== null ? `From ${formatKes(selfDriveMinRate)}/day` : 'Daily self-drive rates';
      return `${ratePart} · ${selfDriveEligible.length} self-drive eligible vehicles`;
    }
    if (service.id === 'airport') {
      return `KIS Arrivals Desk · Live flight tracking · Instant M-Pesa (${settings.mpesaPaybill})`;
    }
    if (service.id === 'corporate') {
      return `${settings.vatEnabled ? `${settings.vatRatePercent}% VAT invoicing ready` : 'Corporate billing'} · 10 Western Kenya counties`;
    }
    return `Executive & 7-seat group fleet · Coordinated Kisumu dispatch`;
  }

  return (
    <div>
      {/* 1. Full-Bleed Services Hero with Directional Gradient Fade */}
      <section
        aria-label="Kechas Agencies Services"
        className="relative w-full overflow-hidden bg-[#123270] text-white"
      >
        {/* Background Photo & Directional Gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#123270] via-[#1B479B] to-[#0B1E45]"
        >
          {!heroBgError && (
            <img
              src={SERVICES_HERO_BG}
              alt=""
              referrerPolicy="no-referrer"
              fetchPriority="high"
              onError={() => setHeroBgError(true)}
              className="w-full h-full object-cover object-[76%_50%]"
            />
          )}

          {/* Mobile & Tablet: Deepened downward Royal/Cobalt Blue scrim */}
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(12, 33, 75, 0.94) 0%, rgba(27, 71, 155, 0.84) 50%, rgba(12, 33, 75, 0.96) 100%)',
            }}
          />

          {/* Desktop: Directional left-to-right Royal/Cobalt Blue fade */}
          <div
            className="hidden lg:block absolute inset-0"
            style={{
              background:
                'linear-gradient(96deg, rgba(11, 29, 68, 0.97) 0%, rgba(18, 50, 112, 0.90) 38%, rgba(27, 71, 155, 0.56) 66%, rgba(18, 50, 112, 0.18) 100%)',
            }}
          />

          <div
            className="hidden lg:block absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(11, 29, 68, 0.35) 0%, rgba(11, 29, 68, 0) 35%, rgba(11, 29, 68, 0.84) 100%)',
            }}
          />
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-20 lg:pb-14">
          <div className="max-w-[660px] space-y-5">
            <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-bold uppercase tracking-[0.18em] text-[#FF5A52]">
              <MapPin className="w-4 h-4 shrink-0 text-[#D61C1C]" aria-hidden="true" />
              <span>SERVICES · KISUMU & WESTERN KENYA</span>
            </div>

            <h1 className="font-serif text-[clamp(2.25rem,4.2vw,3.65rem)] font-semibold leading-[1.08] tracking-tight text-white">
              Mobility structured around{' '}
              <span className="underline decoration-[#D61C1C] decoration-[3.5px] underline-offset-[8px]">
                how Western Kenya works
              </span>
              .
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-[#F8FAFC]/95 max-w-xl">
              Whether you need a flight-tracked pickup at KIS or a month-long NGO fieldwork fleet
              across Migori and Busia, every service runs directly from our Kisumu dispatch desk.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                to="/book"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-white/15 border-b-[3px] border-b-[#D61C1C] shadow-lg shadow-[#0B1D42]/40 transition-colors whitespace-nowrap"
              >
                <span>Reserve Your Service</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>
              <a
                href={telHref}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-md bg-[#0E2452]/65 hover:bg-[#0E2452]/85 backdrop-blur-md border border-white/30 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4 text-[#FF5A52]" aria-hidden="true" />
                <span className="font-mono tabular-nums">{settings.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Anchored Service Category Carousel */}
        <nav
          aria-label="Service categories"
          className="group relative z-10 w-full border-t border-white/15 bg-[#0B1E45]/90 backdrop-blur-md overflow-hidden"
        >
          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="flex w-max py-3.5 animate-services-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-2">
              {[0, 1].map((copyIdx) => (
                <div
                  key={copyIdx}
                  aria-hidden={copyIdx === 1}
                  className={`flex items-center gap-8 pr-8 shrink-0 ${
                    copyIdx === 1 ? 'motion-reduce:hidden' : 'motion-reduce:flex-wrap'
                  }`}
                >
                  {SERVICES.map((s) => (
                    <a
                      key={`${copyIdx}-${s.id}`}
                      href={`#${s.id}`}
                      tabIndex={copyIdx === 1 ? -1 : undefined}
                      onClick={() => setFilter('all')}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#F8FAFC]/85 hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-sm"
                    >
                      <span className="font-mono text-xs font-semibold text-[#FF5A52] tabular-nums">
                        {s.number}
                      </span>
                      <span>{s.title}</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>

            {/* Subtle Edge Fade Masks */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0B1E45] to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0B1E45] to-transparent"
            />
          </div>
        </nav>
      </section>

      {/* 2. Interactive Filter & Full-Bleed Service Showcases */}
      <section className="py-12 lg:py-16 bg-[#F9FAFB]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Filter Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#111827]/10">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#111827]">
                Five dedicated dispatch modes
              </h2>
              <p className="text-sm text-[#4B5563]">
                Select any service below to calculate your rate or coordinate directly on WhatsApp.
              </p>
            </div>

            <div
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#EFF3F9] border border-[#111827]/10 self-start sm:self-auto"
              role="group"
              aria-label="Filter services by audience"
            >
              {(
                [
                  { id: 'all', label: 'All Services (5)' },
                  { id: 'personal', label: 'Personal & Airport' },
                  { id: 'corporate', label: 'Corporate & Events' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    filter === tab.id
                      ? 'bg-[#1B479B] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Full-Bleed Service Showcase Modules */}
          <div className="space-y-8">
            {visibleServices.map((service) => (
              <article
                key={service.id}
                id={service.id}
                className="scroll-mt-24 relative rounded-2xl overflow-hidden border border-white/15 bg-[#123270] text-white shadow-xl shadow-[#081533]/20"
              >
                {/* Full-Bleed Photo & Directional Gradient Fade */}
                <div aria-hidden="true" className="absolute inset-0 bg-[#123270]">
                  <ResilientImage
                    src={service.image}
                    alt={service.imageAlt}
                    className={`w-full h-full object-cover ${service.imagePosition}`}
                    fallbackLabel={service.title}
                  />

                  {/* Mobile & Tablet: Deepened downward Royal/Cobalt Blue fade */}
                  <div
                    className="absolute inset-0 lg:hidden"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(11, 29, 68, 0.92) 0%, rgba(27, 71, 155, 0.84) 50%, rgba(11, 29, 68, 0.96) 100%)',
                    }}
                  />

                  {/* Desktop: Directional left-to-right fade so photography pops on the right */}
                  <div
                    className="hidden lg:block absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(96deg, rgba(11, 29, 68, 0.97) 0%, rgba(18, 50, 112, 0.92) 44%, rgba(27, 71, 155, 0.54) 72%, rgba(18, 50, 112, 0.16) 100%)',
                    }}
                  />

                  <div
                    className="hidden lg:block absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(11, 29, 68, 0.25) 0%, rgba(11, 29, 68, 0.06) 45%, rgba(11, 29, 68, 0.78) 100%)',
                    }}
                  />
                </div>

                {/* Left-Aligned Service Details */}
                <div className="relative z-10 p-6 sm:p-9 lg:p-11 max-w-[680px] space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold">
                      <span className="font-mono text-[#FF5A52] tabular-nums">
                        {service.number}
                      </span>
                      <span aria-hidden="true" className="text-white/40">
                        ·
                      </span>
                      <span className="text-[#F8FAFC]/85">{service.subtitle}</span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl lg:text-[2.1rem] font-semibold leading-tight text-white">
                      {service.title}
                    </h3>

                    <div className="w-10 h-[3px] bg-[#D61C1C] rounded-full" aria-hidden="true" />
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed text-[#F8FAFC]/90">
                    {service.description}
                  </p>

                  <ul className="space-y-2.5">
                    {service.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2.5 text-sm text-[#F8FAFC]/95"
                      >
                        <Check
                          className="w-4 h-4 text-[#FF6B63] shrink-0 mt-0.5"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-white/15 space-y-4">
                    <p className="font-mono text-xs text-[#F8FAFC]/85 tabular-nums">
                      {getServiceLiveSummary(service)}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/book?service=${service.bookingParam}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-white/15 border-b-[3px] border-b-[#D61C1C] transition-colors whitespace-nowrap"
                      >
                        <span>{service.ctaLabel}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </Link>
                      <a
                        href={buildWhatsAppHref(
                          `Habari ${settings.companyName}! I would like to inquire about ${service.title}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-md bg-[#0B1E45]/70 hover:bg-[#0B1E45]/90 backdrop-blur-md border border-white/30 text-sm font-semibold text-white transition-colors whitespace-nowrap"
                      >
                        Ask on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* 3. Corporate & Tender Desk Callout */}
          <div className="rounded-2xl bg-[#123270] text-white border border-[#1B479B]/40 p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2.5 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF5A52]">
                Institutional & NGO Desk
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white leading-tight">
                Need a custom multi-vehicle tender or monthly NGO rate card?
              </h2>
              <p className="text-sm text-[#F8FAFC]/85 leading-relaxed">
                Reach our Kisumu operations desk directly on{' '}
                <a
                  href={telHref}
                  className="font-mono text-white underline decoration-[#D61C1C] underline-offset-4"
                >
                  {settings.phoneDisplay}
                </a>{' '}
                or email{' '}
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex items-center gap-1 text-white underline decoration-white/50 underline-offset-4"
                >
                  <Mail className="w-3.5 h-3.5 inline" aria-hidden="true" />
                  <span>{settings.email}</span>
                </a>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/contact?topic=Corporate+%2F+NGO"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[46px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-white/15 border-b-[3px] border-b-[#D61C1C] transition-colors whitespace-nowrap"
              >
                <span>Contact Corporate Desk</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>
              <Link
                to="/fleet"
                className="inline-flex items-center justify-center px-5 py-3.5 min-h-[46px] rounded-md bg-white/10 hover:bg-white/15 border border-white/25 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Inspect Fleet
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
