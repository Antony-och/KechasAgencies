import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock,
  Compass,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import ResilientImage from '../components/ResilientImage';
import { DestinationCategory, DestinationGuide } from '../data/destinations';
import { useSiteData } from '../contexts/SiteDataContext';

type DestinationFilter = 'All' | DestinationCategory;

const FILTER_OPTIONS: DestinationFilter[] = [
  'All',
  'Safari & Nature',
  'Lakeside & Islands',
  'Highlands & Tea',
  'Border & Fieldwork',
];

function resolveCategory(dest: DestinationGuide): DestinationCategory {
  if (dest.category) return dest.category;
  const hay = `${dest.name} ${dest.county} ${dest.summary}`.toLowerCase();
  if (hay.includes('park') || hay.includes('forest')) return 'Safari & Nature';
  if (hay.includes('lake') || hay.includes('island') || hay.includes('mbita')) {
    return 'Lakeside & Islands';
  }
  if (hay.includes('tea') || hay.includes('highland') || hay.includes('elgon')) {
    return 'Highlands & Tea';
  }
  return 'Border & Fieldwork';
}

export default function DestinationsPage() {
  const { destinations, buildWhatsAppHref } = useSiteData();
  const [activeFilter, setActiveFilter] = useState<DestinationFilter>('All');

  const visibleDestinations =
    activeFilter === 'All'
      ? destinations
      : destinations.filter((dest) => resolveCategory(dest) === activeFilter);

  return (
    <div>
      {/* 1. Page Header, Interactive Filter & Redesigned Destination Cards */}
      <section className="py-12 lg:py-16 bg-[#F9FAFB]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Clean Editorial Page Heading + Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#111827]/10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-bold uppercase tracking-[0.16em] text-[#D61C1C]">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>DESTINATIONS & CORRIDORS · WESTERN KENYA</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl leading-tight text-[#111827]">
                Route intelligence across ten Western Kenya counties.
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-[#4B5563]">
                {destinations.length} curated corridors from Kisumu CBD and KIS Airport—every route
                includes verified road conditions, dispatch notes, and best-fit vehicle pairing.
              </p>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter destinations">
              {FILTER_OPTIONS.map((option) => {
                const count =
                  option === 'All'
                    ? destinations.length
                    : destinations.filter((d) => resolveCategory(d) === option).length;
                const isActive = activeFilter === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setActiveFilter(option)}
                    className={`px-3.5 py-2 min-h-[40px] rounded-md text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#1B479B] text-white border-[#1B479B] border-b-2 border-b-[#D61C1C]'
                        : 'bg-white text-[#4B5563] border-[#111827]/15 hover:text-[#111827] hover:border-[#1B479B]/40'
                    }`}
                  >
                    {option} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Redesigned Destination Showcase Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {visibleDestinations.map((dest, idx) => {
              const category = resolveCategory(dest);
              const routeIndex = String(
                destinations.findIndex((d) => d.slug === dest.slug) + 1 || idx + 1
              ).padStart(2, '0');

              return (
                <article
                  key={dest.slug}
                  id={dest.slug}
                  className="group scroll-mt-24 rounded-xl border border-[#123270]/15 bg-white overflow-hidden shadow-md shadow-[#0B1D42]/8 hover:shadow-xl hover:shadow-[#0B1D42]/14 transition-shadow duration-200 flex flex-col"
                >
                  {/* Full-Bleed Photographic Header with Directional Blue/Navy Gradient */}
                  <div className="relative min-h-[250px] sm:min-h-[270px] bg-[#0E2452] overflow-hidden flex flex-col justify-between p-6">
                    <div aria-hidden="true" className="absolute inset-0 bg-[#123270]">
                      <ResilientImage
                        src={dest.image}
                        alt={`${dest.name} — ${dest.county}`}
                        className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        fallbackLabel={dest.name}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(11, 29, 68, 0.72) 0%, rgba(18, 50, 112, 0.22) 40%, rgba(11, 29, 68, 0.92) 100%)',
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(96deg, rgba(11, 29, 68, 0.78) 0%, rgba(18, 50, 112, 0.35) 55%, rgba(18, 50, 112, 0.08) 100%)',
                        }}
                      />
                    </div>

                    {/* Top Header Chips */}
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF6B63]">
                        <span className="font-mono text-white/75 tabular-nums">{routeIndex}</span>
                        <span aria-hidden="true" className="text-white/40">·</span>
                        <span>{category}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-white tabular-nums px-2.5 py-1 rounded bg-[#0B1E45]/80 backdrop-blur-sm border border-white/20">
                        <Clock className="w-3 h-3 text-[#FF6B63]" aria-hidden="true" />
                        <span>{dest.driveTime}</span>
                      </span>
                    </div>

                    {/* Bottom Card Title & County Overlay */}
                    <div className="relative z-10 space-y-2 pt-8">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#F8FAFC]/90">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                          <MapPin className="w-3.5 h-3.5 text-[#D61C1C]" aria-hidden="true" />
                          {dest.county}
                        </span>
                        <span aria-hidden="true" className="text-white/40">·</span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <Compass className="w-3.5 h-3.5 text-[#FF6B63]" aria-hidden="true" />
                          {dest.distanceFromKisumu}
                        </span>
                      </div>

                      <h3 className="font-serif text-2xl sm:text-[1.75rem] font-semibold leading-tight text-white">
                        {dest.name}
                      </h3>
                      <div
                        aria-hidden="true"
                        className="w-9 h-[3px] bg-[#D61C1C] rounded-full transition-all duration-200 group-hover:w-16"
                      />
                    </div>
                  </div>

                  {/* Structured Card Body */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                      <p className="text-sm sm:text-[15px] leading-relaxed text-[#374151]">
                        {dest.summary}
                      </p>

                      {/* Road Surface Callout */}
                      <div className="p-4 rounded-lg bg-[#F4F7FC] border border-[#1B479B]/15 border-l-[3px] border-l-[#1B479B] space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#123270]">
                          Road Surface & Seasonality
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                          {dest.roadConditions}
                        </p>
                      </div>

                      {/* Dispatch Notes */}
                      {dest.localTips.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                            Kisumu Dispatch Notes
                          </p>
                          <ul className="space-y-1.5">
                            {dest.localTips.map((tip) => (
                              <li
                                key={tip}
                                className="flex items-start gap-2.5 text-xs sm:text-sm text-[#4B5563] leading-relaxed"
                              >
                                <Check
                                  className="w-4 h-4 shrink-0 text-[#D61C1C] mt-0.5"
                                  aria-hidden="true"
                                />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer Pairing & Actions */}
                    <div className="pt-5 border-t border-[#111827]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                          Recommended Vehicle
                        </p>
                        <p className="text-sm font-semibold text-[#111827]">
                          {dest.recommendedVehicle}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <a
                          href={buildWhatsAppHref(
                            `Hello Kechas Agencies, I would like a quote and route schedule for ${dest.name} (${dest.county}) with a ${dest.recommendedVehicle}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Chat on WhatsApp about ${dest.name}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[40px] rounded-md bg-white hover:bg-[#F3F6FB] border border-[#123270]/25 text-[#123270] text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#1B479B]" aria-hidden="true" />
                          <span>Ask Dispatch</span>
                        </a>

                        <Link
                          to={`/book?vehicle=${dest.recommendedVehicleId}`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-xs sm:text-sm font-semibold border border-[#123270] border-b-[3px] border-b-[#D61C1C] transition-colors whitespace-nowrap"
                        >
                          <span>Quote This Route</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Multi-County Custom Itinerary Banner */}
      <section className="py-12 lg:py-16 bg-[#123270] text-white border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B63]">
              <ShieldCheck className="w-4 h-4 text-[#D61C1C]" aria-hidden="true" />
              <span>MULTI-COUNTY & CUSTOM ITINERARIES</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl leading-snug text-white">
              Planning a multi-stop fieldwork loop or Western Kenya safari?
            </h2>
            <p className="text-sm sm:text-base text-[#F8FAFC]/85 leading-relaxed">
              Share your county sequence, pickup date, and passenger headcount. Our Kisumu operations
              desk will map fuel stops, overnight allowances, and replacement cover into one transparent KES quote.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 shrink-0">
            <Link
              to="/book"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-white/20 border-b-[3px] border-b-[#D61C1C] transition-colors whitespace-nowrap"
            >
              <span>Build Custom Quote</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <a
              href={buildWhatsAppHref(
                'Hello Kechas Agencies, I would like help planning a multi-county itinerary in Western Kenya.'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
              <span>WhatsApp Route Desk</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
