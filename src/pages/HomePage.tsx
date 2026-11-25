import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Phone } from 'lucide-react';
import ResilientImage from '../components/ResilientImage';
import { FLEET_CATEGORIES, formatKes } from '../data/fleet';
import { useSiteData } from '../contexts/SiteDataContext';

const HERO_IMAGE = '/src/assets/images/hero_prado_western_kenya_1795598677955.jpg';

const TRUST_METRICS = [
  { value: '08', label: 'Vehicles maintained in-house' },
  { value: '10', label: 'Counties served across Western Kenya' },
  { value: '24/7', label: 'Dispatch & roadside recovery' },
  { value: 'KIS', label: 'Instant airport pickups & M-Pesa billing' },
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
  const featuredDestinations = destinations.filter((d) => d.featuredOnHome);
  const dynamicMetrics = TRUST_METRICS.map((m, idx) =>
    idx === 0 ? { ...m, value: String(vehicles.length).padStart(2, '0') } : m
  );

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="border-b border-[#111827]/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#C8231D]">
                  Kisumu · Western Kenya
                </p>
                <h1 className="font-serif text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.08] tracking-tight text-[#111827]">
                  Command the roads of Western Kenya.
                </h1>
                <p className="text-base sm:text-lg leading-relaxed text-[#4B5563] max-w-xl">
                  From Kisumu International to the heart of the Kakamega Forest — the region’s most
                  reliable fleet, driven by chauffeurs who know every route.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3.5">
                  <Link
                    to="/book"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] transition-colors duration-150 whitespace-nowrap"
                  >
                    <span>Reserve Your Vehicle</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <a
                    href={buildWhatsAppHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md border border-[#194793]/25 bg-white text-[#111827] text-sm font-medium hover:bg-[#EFF3F9] transition-colors duration-150 whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 text-[#194793]" aria-hidden="true" />
                    <span>Chat via WhatsApp</span>
                  </a>
                </div>
                <p className="text-xs sm:text-sm text-[#4B5563]">
                  Karibu — quoted rates include driver, fuel and insurance
                </p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-lg overflow-hidden border border-[#111827]/10 bg-[#E5EBF4]">
                <ResilientImage
                  src={HERO_IMAGE}
                  alt="Toyota Land Cruiser Prado overlooking Lake Victoria shoreline near Kisumu at golden hour"
                  className="w-full h-full object-cover"
                  fallbackLabel="Kechas Agencies · Land Cruiser Prado"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Metrics & Trust Strip */}
      <section aria-label="Operational highlights" className="bg-[#EFF3F9] border-b border-[#111827]/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {dynamicMetrics.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="font-serif text-3xl sm:text-4xl font-medium text-[#194793] tabular-nums">
                  {item.value}
                </div>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Who We Are (Local Mastery) */}
      <section className="py-16 lg:py-24 border-b border-[#111827]/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">Who we are</p>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-[#111827]">
                A transport partner born on these roads — not imported to them.
              </h2>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <p className="text-base sm:text-lg leading-relaxed text-[#4B5563]">
                Operating out of Kisumu CBD with a dedicated arrivals presence at KIS, Kechas
                Agencies bridges urban executive hospitality and rugged county mobility. Knowing
                which murram shortcuts toward Bondo stay firm after rain, where to refuel cleanly
                before climbing into Kisii, and how early to clear Ruma National Park gates is
                second nature to our dispatch team.
              </p>
              <p className="text-base leading-relaxed text-[#4B5563]">
                Every vehicle in our eight-car fleet follows a strict preventative maintenance
                calendar—meaning zero breakdowns on multi-county NGO audits, diplomatic delegations,
                or family journeys across Nyanza and Western.
              </p>

              <div className="pt-4 border-t border-[#111827]/10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-[#4B5563]">Head Office</p>
                  <p className="text-sm font-semibold text-[#111827] mt-1">Kisumu CBD</p>
                </div>
                <div>
                  <p className="text-xs text-[#4B5563]">Airport Desk</p>
                  <p className="text-sm font-semibold text-[#111827] mt-1">KIS, on arrival</p>
                </div>
                <div>
                  <p className="text-xs text-[#4B5563]">Payment</p>
                  <p className="text-sm font-semibold text-[#111827] mt-1">
                    M-Pesa · Bank · Invoice
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fleet Overview */}
      <section className="py-16 lg:py-24 border-b border-[#111827]/10 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">The fleet</p>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-[#111827]">
                {vehicles.length} maintained vehicles. Four ways to travel.
              </h2>
            </div>
            <Link
              to="/fleet"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#194793] hover:text-[#133672] transition-colors whitespace-nowrap"
            >
              <span>Inspect full fleet & live availability</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FLEET_CATEGORIES.map((category) => {
              const catVehicles = vehicles.filter((v) => v.category === category.id);
              const minRate =
                catVehicles.length > 0
                  ? Math.min(...catVehicles.map((v) => v.dailyRateKes))
                  : null;
              const liveModels =
                catVehicles.length > 0
                  ? catVehicles.map((v) => v.name).join(' · ')
                  : category.modelsLabel;
              const coverImage = catVehicles[0]?.image || category.image;

              return (
                <Link
                  key={category.id}
                  to={`/fleet#${category.id}`}
                  className="group block rounded-lg border border-[#111827]/10 bg-[#F9FAFB] overflow-hidden hover:border-[#194793]/40 transition-colors duration-150"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#E5EBF4]">
                    <ResilientImage
                      src={coverImage}
                      alt={`${category.title} — ${liveModels}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      fallbackLabel={category.title}
                    />
                  </div>
                  <div className="p-6 sm:p-7 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-[#C8231D] truncate">{liveModels}</p>
                      {minRate !== null && (
                        <span className="font-mono text-xs font-semibold text-[#194793] tabular-nums shrink-0">
                          From {formatKes(minRate)}/d
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-serif text-2xl text-[#111827] group-hover:text-[#194793] transition-colors">
                        {category.title} ({catVehicles.length})
                      </h3>
                      <ArrowRight
                        className="w-4 h-4 text-[#4B5563] group-hover:text-[#194793] group-hover:translate-x-0.5 transition-all shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-sm leading-relaxed text-[#4B5563]">{category.summary}</p>
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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">Regional routes</p>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-[#111827]">
                Three journeys worth the early start.
              </h2>
            </div>
            <Link
              to="/destinations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#194793] hover:text-[#133672] transition-colors whitespace-nowrap"
            >
              <span>All Western Kenya route guides</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredDestinations.map((dest) => (
              <Link
                key={dest.slug}
                to={`/destinations#${dest.slug}`}
                className="group flex flex-col rounded-lg border border-[#111827]/10 bg-[#F9FAFB] overflow-hidden hover:border-[#194793]/40 transition-colors"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[#E5EBF4]">
                  <ResilientImage
                    src={dest.image}
                    alt={`${dest.name} in ${dest.county}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    fallbackLabel={dest.name}
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <p className="text-xs text-[#4B5563]">
                      {dest.county} · {dest.driveTime}
                    </p>
                    <h3 className="font-serif text-2xl text-[#111827] group-hover:text-[#194793] transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#4B5563]">{dest.summary}</p>
                  </div>
                  <div className="pt-4 border-t border-[#111827]/10 text-xs text-[#111827]">
                    <span className="text-[#4B5563]">Recommended: </span>
                    <span className="font-semibold">{dest.recommendedVehicle}</span>
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
