import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { SITE_CONFIG } from '../data/site';
import { useSiteData } from '../contexts/SiteDataContext';

export default function Footer() {
  const { settings, vehicles, buildWhatsAppHref } = useSiteData();
  const phoneDigits = settings.whatsappNumber.replace(/\D/g, '');
  const telHref = phoneDigits ? `tel:+${phoneDigits}` : SITE_CONFIG.phoneHref;
  const whatsappUrl = buildWhatsAppHref();

  return (
    <footer className="bg-[#0E2447] text-white border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/15">
          {/* Brand Summary & Logo */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <span className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white/25 bg-[#194793]">
                <img
                  src={SITE_CONFIG.logoSrc}
                  alt="Kechas Agencies official emblem"
                  className="w-full h-full object-cover scale-[1.04]"
                />
              </span>
              <div>
                <div className="font-serif text-2xl font-medium tracking-tight text-white">
                  {settings.companyName}
                </div>
                <p className="text-xs text-[#CBD5E1] mt-0.5">{SITE_CONFIG.tagline}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[#CBD5E1] max-w-md">
              Kisumu’s dependable regional car hire, executive chauffeur, and Kisumu International
              Airport (KIS) transfer partner—serving corporate delegations, NGO field teams, and
              private travelers across Western Kenya.
            </p>
            <div className="pt-1">
              <p className="text-xs font-medium text-white mb-1.5">Ten Counties Served</p>
              <p className="text-xs leading-relaxed text-[#94A3B8]">
                {SITE_CONFIG.countiesServed.join(' · ')}
              </p>
            </div>
            <div className="inline-block border border-white/20 bg-white/5 rounded-md px-4 py-3 mt-2">
              <p className="text-xs text-[#CBD5E1]">M-Pesa Corporate & Instant Settlement</p>
              <p className="text-sm font-mono tabular-nums text-white mt-0.5">
                Paybill: {settings.mpesaPaybill} · Account: {settings.mpesaAccount}
              </p>
            </div>
          </div>

          {/* Explore Column */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-serif text-base font-medium text-white">Explore</h3>
            <ul className="space-y-2.5 text-sm text-[#CBD5E1]">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/fleet" className="hover:text-white transition-colors">
                  Our Fleet ({vehicles.length})
                </Link>
              </li>
              <li>
                <Link to="/destinations" className="hover:text-white transition-colors">
                  Regional Routes
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About & Safety
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Field Journal
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors">
                  Staff Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Column */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-serif text-base font-medium text-white">Services</h3>
            <ul className="space-y-2.5 text-sm text-[#CBD5E1]">
              <li>
                <Link to="/services#chauffeur" className="hover:text-white transition-colors">
                  Chauffeur-Driven Hire
                </Link>
              </li>
              <li>
                <Link to="/services#self-drive" className="hover:text-white transition-colors">
                  Self-Drive Hire
                </Link>
              </li>
              <li>
                <Link to="/services#airport" className="hover:text-white transition-colors">
                  KIS Airport Transfers
                </Link>
              </li>
              <li>
                <Link to="/services#corporate" className="hover:text-white transition-colors">
                  Corporate & NGO Fieldwork
                </Link>
              </li>
              <li>
                <Link to="/services#events" className="hover:text-white transition-colors">
                  Weddings & Convoys
                </Link>
              </li>
            </ul>
          </div>

          {/* Reservations & Kisumu Office */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-serif text-base font-medium text-white">Reservations</h3>
            <ul className="space-y-3 text-sm text-[#CBD5E1]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#F87171] shrink-0" aria-hidden="true" />
                <a
                  href={telHref}
                  className="font-mono tabular-nums hover:text-white transition-colors"
                >
                  {settings.phoneDisplay} ({SITE_CONFIG.phoneIntl})
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#F87171] shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{settings.dispatchHours || SITE_CONFIG.dispatchHours}</span>
              </li>
            </ul>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/book"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-white text-[#0E2447] text-xs font-semibold hover:bg-[#EFF3F9] transition-colors whitespace-nowrap"
              >
                Calculate Quote
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-white/25 text-xs font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                WhatsApp Desk
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>
            © {new Date().getFullYear()} {settings.companyName}. Transport, car hire, construction
            and general supplies · Kisumu, Kenya.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/contact" className="hover:text-white transition-colors">
              Office & Directions
            </Link>
            <Link to="/book" className="hover:text-white transition-colors">
              Reserve Online
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
