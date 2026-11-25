import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, MessageCircle, Phone, X } from 'lucide-react';
import { SITE_CONFIG } from '../data/site';
import { useSiteData } from '../contexts/SiteDataContext';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/services', label: 'Services' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Journal' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { settings, buildWhatsAppHref } = useSiteData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const phoneDigits = settings.whatsappNumber.replace(/\D/g, '');
  const telHref = phoneDigits ? `tel:+${phoneDigits}` : SITE_CONFIG.phoneHref;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-40 bg-[#F9FAFB]/95 backdrop-blur-sm border-b border-[#111827]/10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 lg:gap-8">
        {/* Zone 1: Brand Logo + Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#111827] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#194793]"
        >
          <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[#194793]/25 bg-[#194793] shadow-xs">
            <img
              src={SITE_CONFIG.logoSrc}
              alt="Kechas Agencies official emblem"
              className="w-full h-full object-cover scale-[1.04]"
            />
          </span>
          <span className="font-serif text-lg sm:text-xl font-medium tracking-tight">
            {settings.companyName}
          </span>
        </Link>

        {/* Zone 2: Primary Text Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-5 xl:gap-7"
        >
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `text-sm whitespace-nowrap shrink-0 py-1 border-b transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#194793] ${
                  isActive
                    ? 'text-[#194793] font-semibold border-[#C8231D]'
                    : 'text-[#4B5563] font-medium border-transparent hover:text-[#111827] hover:border-[#194793]/40'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Direct Phone + Primary CTA */}
        <div className="hidden lg:flex items-center gap-5 shrink-0">
          <a
            href={telHref}
            className="inline-flex items-center gap-1.5 text-sm font-mono tabular-nums text-[#111827] hover:text-[#C8231D] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#194793]"
          >
            <Phone className="w-3.5 h-3.5 text-[#C8231D]" aria-hidden="true" />
            <span>{settings.phoneDisplay}</span>
          </a>
          <Link
            to="/book"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#194793] hover:bg-[#133672] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#194793]"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-3 shrink-0">
          <Link
            to="/book"
            className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold text-white bg-[#194793] hover:bg-[#133672] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Book Now
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="w-11 h-11 inline-flex items-center justify-center rounded-md border border-[#111827]/15 text-[#111827] hover:bg-[#EFF3F9] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#111827]/10 bg-[#F9FAFB] px-4 py-5 space-y-5">
          <div className="text-xs text-[#4B5563] font-medium">
            {SITE_CONFIG.tagline} · {SITE_CONFIG.dispatchHours}
          </div>
          <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    isActive
                      ? 'bg-[#194793] text-white'
                      : 'text-[#111827] bg-[#EFF3F9]/80 hover:bg-[#EFF3F9]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#111827]/10 flex flex-col sm:flex-row gap-3">
            <a
              href={telHref}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md border border-[#111827]/20 text-sm font-medium text-[#111827] hover:bg-[#EFF3F9] min-h-[44px]"
            >
              <Phone className="w-4 h-4 text-[#C8231D]" />
              <span className="font-mono tabular-nums">{settings.phoneDisplay}</span>
            </a>
            <a
              href={buildWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#194793] text-white text-sm font-medium hover:bg-[#133672] min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Dispatch</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
