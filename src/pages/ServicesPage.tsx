import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useSiteData } from '../contexts/SiteDataContext';

interface ServiceSection {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  bookingParam: string;
  ctaLabel: string;
}

const SERVICES: ServiceSection[] = [
  {
    id: 'chauffeur',
    number: '01',
    title: 'Chauffeur-Driven Hire',
    subtitle: 'Uniformed regional drivers · Fuel & insurance coordination',
    description:
      'Travel across Kisumu and all ten Western Kenya counties without worrying about parking, weighbridge congestion, or unfamiliar murram forks. Our drivers know the terrain intimately and keep strict arrival schedules.',
    bullets: [
      'Fluent in English, Kiswahili, and Dholuo for smooth local coordination',
      '12-hour standard daily operating window with flexible early/late extensions',
      'Comprehensive passenger liability insurance and 24/7 dispatch backup',
    ],
    bookingParam: 'chauffeur',
    ctaLabel: 'Book Chauffeur Hire',
  },
  {
    id: 'self-drive',
    number: '02',
    title: 'Self-Drive Car Hire',
    subtitle: 'Independent mobility · Transparent refundable deposit',
    description:
      'For returning residents, visiting professionals, and travelers who prefer driving themselves across the Lake Basin. Available on our Toyota Prado, Mazda CX-5, Toyota Noah, and Economy fleet.',
    bullets: [
      'Requirements: Valid Kenyan or International Driving Licence (minimum 2 years)',
      'Original National ID or Passport copy verified at handover in Kisumu',
      'Refundable security deposit (KES 10,000 – 35,000 depending on vehicle class) released on return',
    ],
    bookingParam: 'self-drive',
    ctaLabel: 'Book Self-Drive',
  },
  {
    id: 'airport',
    number: '03',
    title: 'Kisumu International Airport (KIS) Transfers',
    subtitle: 'Flight-tracked pickups · Direct CBD, Milimani & county transfers',
    description:
      'Skip curbside negotiations after landing at KIS. We track your Kenya Airways, Jambojet, or Safarilink flight in real time and position your driver outside Arrivals ten minutes before touchdown.',
    bullets: [
      'Fixed KES flat rates to Kisumu CBD, Milimani, Dunga, and Maseno',
      'Zero extra charges for flight schedule delays',
      'Seamless onward connection directly to Kakamega, Siaya, Homa Bay, or Busia',
    ],
    bookingParam: 'airport-transfer',
    ctaLabel: 'Schedule KIS Transfer',
  },
  {
    id: 'corporate',
    number: '04',
    title: 'Corporate & NGO Fieldwork Transport',
    subtitle: 'Monthly invoicing · Multi-vehicle field logistics',
    description:
      'Designed for development agencies, medical research teams, county contractors, and agribusiness delegations operating across Nyanza and Western Kenya.',
    bullets: [
      'Dedicated account coordinator and consolidated monthly VAT invoicing',
      'Pre-equipped 4x4 Prado units for off-tarmac clinic and community visits',
      'Immediate replacement vehicle guarantee if any unit requires servicing',
    ],
    bookingParam: 'chauffeur',
    ctaLabel: 'Request Corporate Booking',
  },
  {
    id: 'events',
    number: '05',
    title: 'Weddings & Events Convoy Hire',
    subtitle: 'Coordinated bridal sedans & guest MPVs',
    description:
      'From traditional ceremonies in Maseno, Bondo, or Gem to lakeside receptions in Kisumu, we assemble matched Mercedes-Benz E-Class sedans and Toyota Noah vans with synchronized timing.',
    bullets: [
      'Matched pearl-white or metallic silver presentation vehicles',
      'Lead-car coordination for multi-stop church, homestead, and reception venues',
      'Dedicated standby driver throughout the celebration',
    ],
    bookingParam: 'chauffeur',
    ctaLabel: 'Plan Event Convoy',
  },
];

export default function ServicesPage() {
  const { settings, buildWhatsAppHref } = useSiteData();
  const telHref = `tel:+${settings.whatsappNumber.replace(/\D/g, '')}`;
  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">Services</p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-[#111827]">
            Mobility structured around how Western Kenya works.
          </h1>
          <p className="text-base leading-relaxed text-[#4B5563]">
            Whether you need a single punctual airport pickup at KIS or a month-long NGO fieldwork
            fleet across Migori and Busia, every service runs out of our Kisumu dispatch desk.
          </p>
        </div>

        {/* Anchor Quick Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-[#111827]/10 py-4 text-xs sm:text-sm">
          {SERVICES.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-[#4B5563] hover:text-[#194793] font-medium transition-colors whitespace-nowrap"
            >
              {s.number}. {s.title}
            </a>
          ))}
        </div>

        {/* Service Sections */}
        <div className="space-y-10">
          {SERVICES.map((service) => (
            <section
              key={service.id}
              id={service.id}
              className="scroll-mt-24 rounded-lg border border-[#111827]/10 bg-white p-6 sm:p-8 lg:p-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-3">
                  <div className="font-mono text-xs font-medium text-[#C8231D] tabular-nums">
                    {service.number}
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#111827]">
                    {service.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-[#194793]">
                    {service.subtitle}
                  </p>
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <p className="text-sm sm:text-base leading-relaxed text-[#4B5563]">
                    {service.description}
                  </p>
                  <ul className="space-y-2.5">
                    {service.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2.5 text-sm text-[#111827]"
                      >
                        <Check
                          className="w-4 h-4 text-[#194793] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to={`/book?service=${service.bookingParam}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] transition-colors whitespace-nowrap"
                    >
                      <span>{service.ctaLabel}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <a
                      href={buildWhatsAppHref(
                        `Habari ${settings.companyName}! I would like to inquire about ${service.title}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-[#194793]/25 text-sm font-medium text-[#111827] hover:bg-[#EFF3F9] transition-colors whitespace-nowrap"
                    >
                      Ask on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Corporate Note */}
        <div className="rounded-lg bg-[#EFF3F9] border border-[#194793]/15 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl text-[#111827]">
              Need a custom multi-vehicle tender or NGO rate card?
            </h2>
            <p className="text-sm text-[#4B5563]">
              Reach our Kisumu desk directly on{' '}
              <a href={telHref} className="font-mono text-[#111827] underline">
                {settings.phoneDisplay}
              </a>{' '}
              or email{' '}
              <a href={`mailto:${settings.email}`} className="text-[#194793] underline">
                {settings.email}
              </a>
              .
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-[#194793] text-white text-sm font-medium hover:bg-[#133672] transition-colors whitespace-nowrap shrink-0"
          >
            Contact Corporate Desk
          </Link>
        </div>
      </div>
    </div>
  );
}
