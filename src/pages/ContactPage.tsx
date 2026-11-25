import { FormEvent, useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { SITE_CONFIG } from '../data/site';
import { useSiteData } from '../contexts/SiteDataContext';

export default function ContactPage() {
  const { settings, buildWhatsAppHref } = useSiteData();
  const telHref = `tel:+${settings.whatsappNumber.replace(/\D/g, '')}`;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError('Please provide a phone number or email address so we can reply.');
      return;
    }
    if (!message.trim() || message.trim().length < 8) {
      setError('Please include a brief note about your inquiry.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">Contact & Kisumu Desk</p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-[#111827]">
            Speak directly with Kisumu Dispatch.
          </h1>
          <p className="text-base leading-relaxed text-[#4B5563]">
            No call-centre queues. Reach our Kisumu CBD office directly by phone, WhatsApp, or visit
            us off Airport Road minutes from Kisumu International Airport.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details & Kisumu Location Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-lg border border-[#111827]/10 bg-white p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#C8231D] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4B5563]">24/7 Dispatch & Reservations</p>
                    <a
                      href={telHref}
                      className="font-mono text-lg font-medium text-[#111827] hover:text-[#194793] tabular-nums"
                    >
                      {settings.phoneDisplay} ({SITE_CONFIG.phoneIntl})
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#194793] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4B5563]">Corporate & NGO Email</p>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-sm font-medium text-[#111827] hover:text-[#194793] break-all"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#194793] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4B5563]">Operating Hours</p>
                    <p className="text-sm text-[#111827]">
                      {settings.dispatchHours || SITE_CONFIG.officeHours}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#194793] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4B5563]">Head Office</p>
                    <p className="text-sm font-medium text-[#111827]">{settings.address}</p>
                    <p className="text-xs text-[#4B5563] mt-1">
                      Airport Desk: {SITE_CONFIG.airportDesk}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#111827]/10 space-y-3">
                <p className="text-xs font-mono tabular-nums text-[#111827]">
                  M-Pesa Paybill: {settings.mpesaPaybill} · Account: {settings.mpesaAccount}
                </p>
                <a
                  href={buildWhatsAppHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Message on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Inquiry Form */}
          <div className="lg:col-span-7 rounded-lg border border-[#111827]/10 bg-white p-6 sm:p-8">
            {sent ? (
              <div className="py-8 space-y-4">
                <div className="flex items-center gap-2.5 text-[#194793]">
                  <CheckCircle2 className="w-6 h-6" />
                  <h2 className="font-serif text-2xl text-[#111827]">Inquiry Received</h2>
                </div>
                <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                  Thank you, <span className="font-medium text-[#111827]">{name}</span>. Our Kisumu
                  team will respond shortly. For urgent same-day dispatch, please call{' '}
                  <a href={telHref} className="font-mono text-[#194793] underline">
                    {settings.phoneDisplay}
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setMessage('');
                  }}
                  className="px-4 py-2.5 rounded-md border border-[#111827]/20 text-sm font-medium text-[#111827] hover:bg-[#EFF3F9]"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="space-y-1">
                  <h2 className="font-serif text-2xl text-[#111827]">Quick Inquiry</h2>
                  <p className="text-xs sm:text-sm text-[#4B5563]">
                    Questions about corporate monthly contracts, long-term rates, or custom county
                    itineraries? Write to us below.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="block text-xs font-medium text-[#111827]">
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="block text-xs font-medium text-[#111827]">
                      Phone Number
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm font-mono text-[#111827] focus:outline-none focus:border-[#194793]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="block text-xs font-medium text-[#111827]">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="block text-xs font-medium text-[#111827]">
                    How can we help? *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your dates, route, or corporate requirements..."
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793]"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs sm:text-sm text-[#C8231D] font-medium">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672] transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
