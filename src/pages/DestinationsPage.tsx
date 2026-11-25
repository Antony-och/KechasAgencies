import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Clock, MapPin } from 'lucide-react';
import ResilientImage from '../components/ResilientImage';
import { useSiteData } from '../contexts/SiteDataContext';

export default function DestinationsPage() {
  const { destinations } = useSiteData();
  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">
            Destinations & corridors
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-[#111827]">
            Route intelligence across ten Western Kenya counties.
          </h1>
          <p className="text-base leading-relaxed text-[#4B5563]">
            Practical distances, road surface notes, and vehicle recommendations compiled from our
            daily dispatches out of Kisumu.
          </p>
        </div>

        <div className="space-y-10">
          {destinations.map((dest) => (
            <article
              key={dest.slug}
              id={dest.slug}
              className="scroll-mt-24 rounded-lg border border-[#111827]/10 bg-white overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-5 min-h-[260px] bg-[#E5EBF4]">
                  <ResilientImage
                    src={dest.image}
                    alt={`${dest.name} — ${dest.county}`}
                    className="w-full h-full object-cover"
                    fallbackLabel={dest.name}
                  />
                </div>

                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4B5563]">
                      <span className="inline-flex items-center gap-1.5 text-[#194793] font-semibold">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        {dest.county}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                        {dest.distanceFromKisumu}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {dest.driveTime}
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl text-[#111827]">{dest.name}</h2>
                    <p className="text-sm sm:text-base leading-relaxed text-[#4B5563]">
                      {dest.summary}
                    </p>

                    <div className="p-4 rounded-md bg-[#F9FAFB] border border-[#111827]/8 space-y-1.5">
                      <p className="text-xs font-semibold text-[#111827]">
                        Road Surface & Seasonality
                      </p>
                      <p className="text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                        {dest.roadConditions}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#111827]">Dispatch Notes</p>
                      <ul className="space-y-1 text-xs sm:text-sm text-[#4B5563]">
                        {dest.localTips.map((tip) => (
                          <li key={tip}>· {tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#111827]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs sm:text-sm">
                      <span className="text-[#4B5563]">Recommended Vehicle: </span>
                      <span className="font-semibold text-[#111827]">
                        {dest.recommendedVehicle}
                      </span>
                    </div>
                    <Link
                      to={`/book?vehicle=${dest.recommendedVehicleId}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672] transition-colors whitespace-nowrap"
                    >
                      <span>Quote This Route</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
