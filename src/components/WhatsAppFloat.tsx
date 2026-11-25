import { MessageCircle } from 'lucide-react';
import { useSiteData } from '../contexts/SiteDataContext';

export default function WhatsAppFloat() {
  const { settings, buildWhatsAppHref } = useSiteData();
  return (
    <a
      href={buildWhatsAppHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${settings.companyName} on WhatsApp`}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[#194793] text-white shadow-md border border-white/15 hover:bg-[#133672] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#194793]"
    >
      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">WhatsApp</span>
    </a>
  );
}
