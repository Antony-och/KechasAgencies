import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Wrench, UserCheck } from 'lucide-react';
import ResilientImage from '../components/ResilientImage';
import { SITE_CONFIG } from '../data/site';
import { useSiteData } from '../contexts/SiteDataContext';

const PILLARS = [
  {
    icon: Wrench,
    title: 'Preventative 5,000 km Maintenance',
    body: 'Every vehicle in our eight-car fleet is serviced on strict mileage intervals—not after a warning light appears. Tyres, brake pads, suspension bushings, and air conditioning are logged before every multi-county dispatch.',
  },
  {
    icon: UserCheck,
    title: 'Vetted Regional Chauffeurs',
    body: 'Our drivers hold valid PSV/commercial endorsements, clean police clearance certificates, and years of road time between Kisumu, Migori, Kakamega, and Busia. Discretion, punctuality, and calm defensive driving are non-negotiable.',
  },
  {
    icon: ShieldCheck,
    title: 'Full Insurance & 24/7 Backup',
    body: 'All hires carry comprehensive cover, emergency recovery triangles, heavy-duty tow ropes on 4x4 units, and direct access to our Kisumu CBD operations desk day and night.',
  },
];

export default function AboutPage() {
  const { vehicles, settings } = useSiteData();
  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Story Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 space-y-5 flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">About {settings.companyName}</p>
            <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-[#111827]">
              Built in Kisumu for the realities of Western Kenya roads.
            </h1>
            <p className="text-base leading-relaxed text-[#4B5563]">
              {settings.companyName} began with a straightforward observation: travelers landing at Kisumu
              International Airport and organizations running field operations across Nyanza and
              Western deserved a transport partner that treated punctuality, vehicle hygiene, and
              route preparation as core disciplines.
            </p>
            <p className="text-base leading-relaxed text-[#4B5563]">
              Alongside our core transport, car hire, and general logistics operations, we
              deliberately manage a focused {vehicles.length}-vehicle fleet directly out of {settings.address}—giving us total control over servicing, driver briefings,
              and instant airport readiness.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="h-72 sm:h-96 lg:h-full min-h-[320px] rounded-lg overflow-hidden border border-[#111827]/10 bg-[#E5EBF4]">
              <ResilientImage
                src="/src/assets/images/dest_lake_victoria_1795598707039.jpg"
                alt="Lake Victoria shoreline near Kisumu at sunset"
                className="w-full h-full object-cover"
                fallbackLabel="Kisumu · Lake Victoria"
              />
            </div>
          </div>
        </section>

        {/* Operational Standards */}
        <section className="space-y-8 pt-4 border-t border-[#111827]/10">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">Standards & safety</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#111827]">
              How we keep a {vehicles.length}-car fleet dependable year-round.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 sm:p-7 rounded-lg border border-[#111827]/10 bg-white space-y-3"
                >
                  <Icon className="w-5 h-5 text-[#194793]" aria-hidden="true" />
                  <h3 className="font-serif text-xl text-[#111827]">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-[#4B5563]">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Regional Footprint */}
        <section className="rounded-lg bg-[#EFF3F9] border border-[#194793]/15 p-6 sm:p-10 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#111827]">
                Ten Counties. One Dispatch Desk.
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                From Kisumu CBD and KIS Arrivals we dispatch daily across{' '}
                {SITE_CONFIG.countiesServed.join(', ')}.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-3">
              <Link
                to="/fleet"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-[#194793]/25 bg-white text-sm font-medium text-[#111827] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
              >
                Explore the Fleet
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] transition-colors whitespace-nowrap"
              >
                <span>Reserve a Vehicle</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
