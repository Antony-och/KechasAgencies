import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Briefcase, Users } from 'lucide-react';
import ResilientImage from '../components/ResilientImage';
import { FleetCategoryId, formatKes } from '../data/fleet';
import { useSiteData } from '../contexts/SiteDataContext';

type FilterOption = 'all' | 'ready' | FleetCategoryId;

const FILTER_TABS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Ready Now' },
  { id: 'executive', label: 'Executive' },
  { id: '4x4-safari', label: '4x4 Safari' },
  { id: 'family-group', label: 'Family & Group' },
  { id: 'economy', label: 'Economy' },
];

export default function FleetPage() {
  const location = useLocation();
  const { vehicles } = useSiteData();
  const [activeCategory, setActiveCategory] = useState<FilterOption>('all');

  useEffect(() => {
    const hash = location.hash.replace('#', '') as FilterOption;
    if (['ready', 'executive', '4x4-safari', 'family-group', 'economy'].includes(hash)) {
      setActiveCategory(hash);
    }
  }, [location.hash]);

  const availableCount = vehicles.filter((v) => !v.status || v.status === 'Available').length;
  const bookedCount = vehicles.filter((v) => v.status === 'Booked').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'In Maintenance').length;

  const visibleVehicles =
    activeCategory === 'all'
      ? vehicles
      : activeCategory === 'ready'
        ? vehicles.filter((v) => !v.status || v.status === 'Available')
        : vehicles.filter((v) => v.category === activeCategory);

  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#C8231D] tabular-nums">
            Live Dispatch Board · {availableCount} Ready · {bookedCount} On Active Trip ·{' '}
            {maintenanceCount} In Workshop
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-[#111827]">
            {vehicles.length} vehicles maintained for Western Kenya.
          </h1>
          <p className="text-base leading-relaxed text-[#4B5563]">
            Every rate and availability status is synced live with our Kisumu dispatch desk in
            Kenyan Shillings (KES). Select a vehicle to pre-populate our quote calculator.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          id={activeCategory !== 'all' ? activeCategory : undefined}
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#EFF3F9] rounded-lg w-fit border border-[#111827]/10"
          role="tablist"
          aria-label="Filter fleet by vehicle category"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            const count =
              tab.id === 'all'
                ? vehicles.length
                : tab.id === 'ready'
                  ? availableCount
                  : vehicles.filter((v) => v.category === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                  isActive
                    ? 'bg-[#194793] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {`${tab.label} (${count})`}
              </button>
            );
          })}
        </div>

        {/* Anchor markers for direct category links */}
        <div className="sr-only" aria-hidden="true">
          <span id="executive" />
          <span id="4x4-safari" />
          <span id="family-group" />
          <span id="economy" />
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {visibleVehicles.map((vehicle) => {
            const statusText =
              vehicle.status === 'Booked'
                ? 'On Active Dispatch — Reserve Ahead'
                : vehicle.status === 'In Maintenance'
                  ? 'Scheduled Workshop Service'
                  : 'Available for Dispatch';
            const statusColor =
              vehicle.status === 'Booked'
                ? 'text-[#194793]'
                : vehicle.status === 'In Maintenance'
                  ? 'text-[#C8231D]'
                  : 'text-[#16A34A]';

            return (
              <article
                key={vehicle.id}
                className="flex flex-col justify-between rounded-lg border border-[#111827]/10 bg-white overflow-hidden"
              >
                <div>
                  <div className="aspect-[4/3] overflow-hidden bg-[#E5EBF4]">
                    <ResilientImage
                      src={vehicle.image}
                      alt={`${vehicle.name} — ${vehicle.categoryLabel}`}
                      className="w-full h-full object-cover"
                      fallbackLabel={vehicle.name}
                    />
                  </div>

                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#C8231D]">
                          {vehicle.categoryLabel} · {vehicle.transmission} · {vehicle.fuelType}
                        </p>
                        <h2 className="font-serif text-2xl text-[#111827]">{vehicle.name}</h2>
                        <p className={`text-xs font-semibold ${statusColor}`}>{statusText}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {vehicle.chauffeurAvailable ? (
                          <>
                            <div className="font-mono text-lg font-semibold text-[#194793] tabular-nums">
                              {formatKes(vehicle.dailyRateKes)}
                            </div>
                            <div className="text-xs text-[#4B5563]">chauffeur / day</div>
                            {vehicle.selfDriveAvailable &&
                              vehicle.selfDriveRateKes &&
                              vehicle.selfDriveRateKes > 0 && (
                                <div className="text-[11px] font-mono text-[#111827] mt-0.5 tabular-nums">
                                  Self-drive: {formatKes(vehicle.selfDriveRateKes)}/d
                                </div>
                              )}
                          </>
                        ) : (
                          <>
                            <div className="font-mono text-lg font-semibold text-[#194793] tabular-nums">
                              {formatKes(vehicle.selfDriveRateKes || vehicle.dailyRateKes)}
                            </div>
                            <div className="text-xs text-[#4B5563]">self-drive / day</div>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-[#4B5563]">{vehicle.highlight}</p>

                    {/* Spec Strip */}
                    <div className="pt-4 border-t border-[#111827]/10 grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs sm:text-sm text-[#111827]">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#194793] shrink-0" aria-hidden="true" />
                        <span className="tabular-nums">{vehicle.passengers} Passengers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#194793] shrink-0" aria-hidden="true" />
                        <span className="tabular-nums">{vehicle.luggage} Suitcases</span>
                      </div>
                      <div className="col-span-2 text-xs text-[#4B5563]">
                        Terrain: <span className="text-[#111827] font-medium">{vehicle.terrain}</span>
                      </div>
                      <div className="col-span-2 text-xs text-[#4B5563]">
                        Options:{' '}
                        <span className="text-[#111827] font-medium">
                          {vehicle.chauffeurAvailable && vehicle.selfDriveAvailable
                            ? 'Chauffeur-Driven · Self-Drive Eligible'
                            : vehicle.chauffeurAvailable
                              ? 'Chauffeur-Driven Only'
                              : 'Self-Drive Only'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 sm:px-7 py-4 bg-[#F9FAFB] border-t border-[#111827]/10 flex items-center justify-between gap-4">
                  <div className="text-xs text-[#4B5563]">
                    {vehicle.chauffeurAvailable && vehicle.selfDriveAvailable
                      ? 'Chauffeur · Self-Drive'
                      : vehicle.chauffeurAvailable
                        ? 'Chauffeur-Driven'
                        : 'Self-Drive'}
                  </div>
                  <Link
                    to={`/book?vehicle=${vehicle.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672] transition-colors whitespace-nowrap"
                  >
                    <span>Reserve This Vehicle</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
