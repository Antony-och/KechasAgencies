import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlaneLanding,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { SITE_CONFIG } from '../data/site';
import { useSiteData } from '../contexts/SiteDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useDemoPortal } from '../contexts/DemoPortalContext';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { InquiryDoc, InquiryTopic, ReplyChannel } from '../lib/adminTypes';

type CopyField = 'phone' | 'email' | 'paybill' | null;

const INQUIRY_TOPICS: { id: InquiryTopic; label: string; placeholder: string }[] = [
  {
    id: 'Vehicle Hire',
    label: 'Vehicle Hire',
    placeholder:
      'Share pickup location, destination, number of passengers, and whether you prefer chauffeur-driven or self-drive...',
  },
  {
    id: 'KIS Airport Pickup',
    label: 'KIS Airport Pickup',
    placeholder:
      'Share your flight number (e.g. KQ 654), arrival time at Kisumu International Airport, luggage count, and drop-off hotel or office...',
  },
  {
    id: 'Corporate / NGO',
    label: 'Corporate / NGO',
    placeholder:
      'Share fleet quantity (e.g. 2x 4x4 Prados), target counties, contract duration, and LPO or monthly invoicing requirements...',
  },
  {
    id: 'Custom Route',
    label: 'Custom Route',
    placeholder:
      'Share your multi-day Western Kenya itinerary (e.g. Ruma National Park, Kakamega Forest, Busia Border, or Rusinga Island)...',
  },
];

const REPLY_CHANNELS: ReplyChannel[] = ['WhatsApp', 'Phone Call', 'Email'];

const GENERIC_CLASS_OPTIONS = [
  'Executive Sedan (Mercedes / VIP)',
  '4x4 Safari & Field SUV (Prado / CX-5)',
  'Family & Group Tourer (7-Seater Noah)',
  'Economy Saloon / Daily Runner',
];

const DISPATCH_STANDARDS = [
  {
    number: '01',
    title: 'KIS Airport Meet & Greet',
    body: 'Every Kisumu International Airport pickup is tracked in real time so your uniformed chauffeur awaits outside Arrivals regardless of early touchdowns or Nairobi delays.',
  },
  {
    number: '02',
    title: 'Corporate & NGO Field Contracts',
    body: 'Dedicated 4x4 Prado and double-cab availability with KRA-compliant tax invoices, ETR receipts, and monthly LPO settlement across all 10 Western Kenya counties.',
  },
  {
    number: '03',
    title: 'Same-Day Handover & Verification',
    body: 'Visiting Kisumu today? Collect keys or meet your driver at Kechas House off Airport Road with your driving licence and National ID or Passport.',
  },
];

interface SubmittedInquiry {
  reference: string;
  topic: InquiryTopic;
  name: string;
  organization: string;
  phone: string;
  email: string;
  travelDate: string;
  vehicleClass: string;
  replyVia: ReplyChannel;
  message: string;
}

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const { settings, vehicles, buildWhatsAppHref } = useSiteData();
  const { isDemoMode } = useAuth();
  const demo = useDemoPortal();

  const phoneDigits = settings.whatsappNumber.replace(/\D/g, '');
  const telHref = phoneDigits ? `tel:+${phoneDigits}` : SITE_CONFIG.phoneHref;
  const todayIso = new Date().toISOString().split('T')[0];

  const [topic, setTopic] = useState<InquiryTopic>('Vehicle Hire');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleClass, setVehicleClass] = useState('Any Suitable Vehicle');
  const [travelDate, setTravelDate] = useState('');
  const [replyVia, setReplyVia] = useState<ReplyChannel>('WhatsApp');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedInquiry | null>(null);
  const [copiedField, setCopiedField] = useState<CopyField>(null);

  useEffect(() => {
    const paramTopic = searchParams.get('topic') as InquiryTopic | null;
    if (
      paramTopic &&
      ['Vehicle Hire', 'KIS Airport Pickup', 'Corporate / NGO', 'Custom Route'].includes(
        paramTopic
      )
    ) {
      setTopic(paramTopic);
    }
    const paramVehicle = searchParams.get('vehicle');
    if (paramVehicle) {
      const matched = vehicles.find((v) => v.id === paramVehicle || v.name === paramVehicle);
      if (matched) setVehicleClass(matched.name);
    }
  }, [searchParams, vehicles]);

  const vehicleSelectOptions = useMemo(() => {
    const dynamic = vehicles.map((v) => ({
      value: v.name.slice(0, 120),
      label: `${v.name} — ${
        v.status === 'Booked'
          ? 'On Active Dispatch'
          : v.status === 'In Maintenance'
            ? 'In Workshop Service'
            : 'Available'
      }`,
    }));
    return [
      { value: 'Any Suitable Vehicle', label: 'Any Suitable Vehicle (Dispatch Recommends)' },
      ...dynamic,
      ...GENERIC_CLASS_OPTIONS.map((opt) => ({ value: opt, label: opt })),
    ];
  }, [vehicles]);

  const activeTopicConfig =
    INQUIRY_TOPICS.find((item) => item.id === topic) || INQUIRY_TOPICS[0];

  async function handleCopy(field: Exclude<CopyField, null>, value: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2000);
    } catch {
      setCopiedField(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const cleanName = name.trim().slice(0, 120);
    const cleanOrg = organization.trim().slice(0, 120);
    const cleanPhone = phone.trim().slice(0, 30);
    const cleanEmail = email.trim().slice(0, 120);
    const cleanVehicleClass = (vehicleClass || 'Any Suitable Vehicle').slice(0, 120);
    const cleanTravelDate = travelDate.trim().slice(0, 20);
    const cleanMessage = message.trim().slice(0, 1000);

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if ((replyVia === 'WhatsApp' || replyVia === 'Phone Call') && !cleanPhone) {
      setError(`Please provide a phone or WhatsApp number so we can reply via ${replyVia}.`);
      return;
    }

    if (replyVia === 'Email' && !cleanEmail) {
      setError('Please provide an email address for email replies.');
      return;
    }

    if (!cleanPhone && !cleanEmail) {
      setError('Please provide a phone number or email address so Kisumu Dispatch can reply.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!cleanMessage || cleanMessage.length < 8) {
      setError('Please include a brief note about your route, dates, or requirements.');
      return;
    }

    const reference = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const inquiryId = `inq_${Date.now()}`;

    setSubmitting(true);
    try {
      if (isDemoMode) {
        const demoInquiry: InquiryDoc = {
          id: inquiryId,
          reference,
          topic,
          name: cleanName,
          organization: cleanOrg || undefined,
          phone: cleanPhone || undefined,
          email: cleanEmail || undefined,
          vehicleClass: cleanVehicleClass,
          travelDate: cleanTravelDate || undefined,
          replyVia,
          message: cleanMessage,
          status: 'New',
        };
        demo.setInquiries((prev) => [demoInquiry, ...prev]);
      } else {
        const payload: Record<string, unknown> = {
          reference,
          topic,
          name: cleanName,
          vehicleClass: cleanVehicleClass,
          replyVia,
          message: cleanMessage,
          status: 'New',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (cleanOrg) payload.organization = cleanOrg;
        if (cleanPhone) payload.phone = cleanPhone;
        if (cleanEmail) payload.email = cleanEmail;
        if (cleanTravelDate) payload.travelDate = cleanTravelDate;

        await setDoc(doc(db, 'inquiries', inquiryId), payload);
      }

      setSubmitted({
        reference,
        topic,
        name: cleanName,
        organization: cleanOrg,
        phone: cleanPhone,
        email: cleanEmail,
        travelDate: cleanTravelDate,
        vehicleClass: cleanVehicleClass,
        replyVia,
        message: cleanMessage,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `inquiries/${inquiryId}`);
    } finally {
      setSubmitting(false);
    }
  }

  function buildInquiryWhatsAppHref(inq: SubmittedInquiry): string {
    const lines = [
      `Habari Kechas Dispatch (${inq.reference})`,
      `Topic: ${inq.topic}`,
      `Name: ${inq.name}${inq.organization ? ` (${inq.organization})` : ''}`,
      inq.phone ? `Phone: ${inq.phone}` : '',
      inq.email ? `Email: ${inq.email}` : '',
      `Vehicle Class: ${inq.vehicleClass}`,
      inq.travelDate ? `Target Date: ${inq.travelDate}` : '',
      `Preferred Reply: ${inq.replyVia}`,
      `Details: ${inq.message}`,
    ]
      .filter(Boolean)
      .join('\n');
    return buildWhatsAppHref(lines);
  }

  function handleResetForm() {
    setSubmitted(null);
    setMessage('');
    setError('');
  }

  return (
    <div className="bg-[#F9FAFB]">
      <section className="bg-gradient-to-br from-[#0B1E45] via-[#0E2447] to-[#123270] text-white border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-bold uppercase tracking-[0.16em] text-[#FF6B63]">
              <MapPin className="w-4 h-4 shrink-0 text-[#D61C1C]" aria-hidden="true" />
              <span>KISUMU CENTRAL DISPATCH · CBD &amp; KIS AIRPORT</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight text-white">
              Speak directly with{' '}
              <span className="underline decoration-[#D61C1C] decoration-[3px] underline-offset-[7px]">
                Kisumu Dispatch
              </span>
              .
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#E2E8F0] max-w-2xl">
              No call-centre queues or automated ticketing loops. Reach our Kisumu operations team
              directly for instant vehicle availability, KIS airport arrivals, or NGO field fleet
              quotes.
            </p>
          </div>

          <div className="pt-7 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                24/7 Dispatch Line
              </p>
              <a
                href={telHref}
                className="inline-flex items-center gap-2 font-mono text-lg sm:text-xl font-semibold text-white hover:text-[#FF6B63] transition-colors tabular-nums"
              >
                <Phone className="w-4 h-4 text-[#D61C1C] shrink-0" aria-hidden="true" />
                <span>{settings.phoneDisplay}</span>
              </a>
              <p className="font-mono text-xs text-[#CBD5E1] tabular-nums">
                {SITE_CONFIG.phoneIntl} · Voice &amp; Emergency
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                WhatsApp Operations Desk
              </p>
              <a
                href={buildWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-lg sm:text-xl font-semibold text-white hover:text-[#FF6B63] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#FF6B63] shrink-0" aria-hidden="true" />
                <span>Start WhatsApp Chat</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>
              <p className="text-xs text-[#CBD5E1]">
                Direct fleet photos, driver pin &amp; live quotes under 10 min
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                CBD &amp; Airport Hubs
              </p>
              <p className="text-sm sm:text-base font-semibold text-white">{settings.address}</p>
              <p className="text-xs text-[#CBD5E1] flex items-center gap-1.5">
                <PlaneLanding className="w-3.5 h-3.5 text-[#FF6B63] shrink-0" aria-hidden="true" />
                <span>{SITE_CONFIG.airportDesk}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <aside className="lg:col-span-5 rounded-xl border border-[#111827]/12 bg-white divide-y divide-[#111827]/10 flex flex-col justify-between shadow-sm">
            <div className="p-6 sm:p-7 space-y-5">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D61C1C]">
                  DIRECT CHANNELS
                </p>
                <h2 className="font-serif text-2xl font-medium text-[#111827]">
                  Kisumu Office &amp; Dispatch
                </h2>
              </div>

              <div className="divide-y divide-[#111827]/10">
                <div className="py-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Phone className="w-4 h-4 text-[#C8231D] shrink-0 mt-1" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#4B5563]">Reservations &amp; Roadside</p>
                      <a
                        href={telHref}
                        className="font-mono text-base font-semibold text-[#111827] hover:text-[#194793] tabular-nums block"
                      >
                        {settings.phoneDisplay}
                      </a>
                      <p className="font-mono text-xs text-[#4B5563] tabular-nums">
                        {SITE_CONFIG.phoneIntl}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('phone', settings.phoneDisplay)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md border border-[#111827]/15 text-xs font-semibold text-[#111827] hover:bg-[#EFF3F9] hover:border-[#194793]/30 transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedField === 'phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#4B5563]" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="py-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Mail className="w-4 h-4 text-[#194793] shrink-0 mt-1" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#4B5563]">Corporate &amp; NGO Desk</p>
                      <a
                        href={`mailto:${settings.email}`}
                        className="text-sm font-semibold text-[#111827] hover:text-[#194793] break-all"
                      >
                        {settings.email}
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('email', settings.email)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md border border-[#111827]/15 text-xs font-semibold text-[#111827] hover:bg-[#EFF3F9] hover:border-[#194793]/30 transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedField === 'email' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#4B5563]" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="py-3.5 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#194793] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4B5563]">Operating Hours</p>
                    <p className="text-sm font-medium text-[#111827] mt-0.5">
                      {settings.dispatchHours || SITE_CONFIG.officeHours}
                    </p>
                    <p className="text-xs text-[#4B5563] mt-0.5">
                      {SITE_CONFIG.officeHours}
                    </p>
                  </div>
                </div>

                <div className="pt-3.5 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#194793] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4B5563]">Head Office &amp; KIS Desk</p>
                    <p className="text-sm font-semibold text-[#111827] mt-0.5">
                      {settings.address}
                    </p>
                    <p className="text-xs text-[#4B5563] mt-0.5">{SITE_CONFIG.airportDesk}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-3 bg-[#F9FAFB]/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#111827]">
                    M-Pesa Corporate &amp; Instant Paybill
                  </p>
                  <p className="font-mono text-sm font-semibold text-[#194793] tabular-nums mt-0.5">
                    Paybill: {settings.mpesaPaybill} · Account: {settings.mpesaAccount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('paybill', settings.mpesaPaybill)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md border border-[#111827]/15 bg-white text-xs font-semibold text-[#111827] hover:bg-[#EFF3F9] transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedField === 'paybill' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#4B5563]" aria-hidden="true" />
                      <span>Copy Paybill</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                LPO billing, bank EFT, and ETR tax invoices are issued on request for corporate
                and NGO accounts.
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#111827]">
                  Ten Counties Served from Kisumu
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                  {SITE_CONFIG.countiesServed.join(' · ')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href={buildWhatsAppHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-xs sm:text-sm font-semibold border border-[#123270] border-b-[3px] border-b-[#D61C1C] transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>WhatsApp Dispatch</span>
                </a>
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-md border border-[#194793]/30 bg-white text-[#194793] hover:bg-[#EFF3F9] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Calculate Quote</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-7 rounded-xl border border-[#111827]/12 bg-white p-6 sm:p-8 lg:p-10 shadow-sm flex flex-col justify-between">
            {submitted ? (
              <div className="space-y-6 my-auto">
                <div className="space-y-2 pb-5 border-b border-[#111827]/10">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#16A34A]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>DISPATCH INQUIRY LOGGED · {submitted.reference}</span>
                  </div>
                  <h2 className="font-serif text-3xl font-medium text-[#111827]">
                    Thank you, {submitted.name}.
                  </h2>
                  <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                    Your <span className="font-medium text-[#111827]">{submitted.topic}</span>{' '}
                    inquiry is ready. For the fastest turnaround via{' '}
                    <span className="font-medium text-[#111827]">{submitted.replyVia}</span>, send
                    this summary straight to Kisumu Dispatch on WhatsApp or call{' '}
                    <a
                      href={telHref}
                      className="font-mono font-semibold text-[#194793] underline tabular-nums"
                    >
                      {settings.phoneDisplay}
                    </a>
                    .
                  </p>
                </div>

                <dl className="divide-y divide-[#111827]/10 text-sm">
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <dt className="text-xs font-medium text-[#4B5563]">Inquiry Reference</dt>
                    <dd className="font-mono font-semibold text-[#194793] tabular-nums">
                      {submitted.reference}
                    </dd>
                  </div>
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <dt className="text-xs font-medium text-[#4B5563]">Topic &amp; Vehicle</dt>
                    <dd className="font-medium text-[#111827] text-right">
                      {submitted.topic} · {submitted.vehicleClass}
                    </dd>
                  </div>
                  {submitted.organization && (
                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <dt className="text-xs font-medium text-[#4B5563]">Organization</dt>
                      <dd className="font-medium text-[#111827]">{submitted.organization}</dd>
                    </div>
                  )}
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <dt className="text-xs font-medium text-[#4B5563]">
                      Target Date &amp; Preferred Reply
                    </dt>
                    <dd className="font-mono text-xs sm:text-sm text-[#111827] tabular-nums">
                      {submitted.travelDate || 'Flexible dates'} · Reply via {submitted.replyVia}
                    </dd>
                  </div>
                  <div className="py-3 space-y-1">
                    <dt className="text-xs font-medium text-[#4B5563]">Inquiry Summary</dt>
                    <dd className="text-sm text-[#111827] leading-relaxed">{submitted.message}</dd>
                  </div>
                </dl>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href={buildInquiryWhatsAppHref(submitted)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-[#123270] border-b-[3px] border-b-[#D61C1C] transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Send via WhatsApp Now</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-3 min-h-[44px] rounded-md border border-[#111827]/20 text-sm font-medium text-[#111827] hover:bg-[#EFF3F9] transition-colors whitespace-nowrap shrink-0"
                  >
                    Send Another Inquiry
                  </button>
                  <Link
                    to="/book"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#194793] hover:underline whitespace-nowrap"
                  >
                    <span>Open Booking Calculator</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="space-y-2 pb-5 border-b border-[#111827]/10">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D61C1C]">
                    QUICK INQUIRY DESK
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#111827]">
                    Ask about availability, airport pickups, or NGO contracts.
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4B5563]">
                    Complete the brief below—you can also hand it off straight to Kisumu Dispatch
                    via WhatsApp immediately upon submission.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-[#111827]">
                    Inquiry Topic
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INQUIRY_TOPICS.map((item) => {
                      const active = topic === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTopic(item.id)}
                          aria-pressed={active}
                          className={`px-3 py-2.5 min-h-[42px] rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-[#1B479B] text-white border-[#1B479B]'
                              : 'bg-[#F9FAFB] text-[#111827] border-[#111827]/15 hover:bg-[#EFF3F9] hover:border-[#194793]/35'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-[#111827]">
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Grace Akinyi"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-org" className="block text-xs font-semibold text-[#111827]">
                      Organization / NGO <span className="font-normal text-[#4B5563]">(Optional)</span>
                    </label>
                    <input
                      id="contact-org"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Company, NGO, or Private"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="block text-xs font-semibold text-[#111827]">
                      Phone / WhatsApp {replyVia !== 'Email' ? '*' : ''}
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm font-mono tabular-nums text-[#111827] focus:outline-none focus:border-[#194793] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-[#111827]">
                      Email Address {replyVia === 'Email' ? '*' : ''}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@organization.org"
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-vehicle"
                      className="block text-xs font-semibold text-[#111827]"
                    >
                      Vehicle Category
                    </label>
                    <select
                      id="contact-vehicle"
                      value={vehicleClass}
                      onChange={(e) => setVehicleClass(e.target.value)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793] focus:bg-white"
                    >
                      {vehicleSelectOptions.map((opt) => (
                        <option key={opt.label} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-date" className="block text-xs font-semibold text-[#111827]">
                      Estimated Travel Date{' '}
                      <span className="font-normal text-[#4B5563]">(Optional)</span>
                    </label>
                    <input
                      id="contact-date"
                      type="date"
                      min={todayIso}
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm font-mono tabular-nums text-[#111827] focus:outline-none focus:border-[#194793] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-[#111827]">
                    Preferred Reply Channel
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {REPLY_CHANNELS.map((channel) => {
                      const active = replyVia === channel;
                      return (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => setReplyVia(channel)}
                          aria-pressed={active}
                          className={`px-3 py-2 min-h-[40px] rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-[#0E2447] text-white border-[#0E2447]'
                              : 'bg-[#F9FAFB] text-[#4B5563] border-[#111827]/15 hover:text-[#111827] hover:bg-[#EFF3F9]'
                          }`}
                        >
                          {channel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-[#111827]">
                    Trip Details, Route &amp; Questions *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={activeTopicConfig.placeholder}
                    className="w-full px-3.5 py-3 rounded-md border border-[#111827]/20 bg-[#F9FAFB] text-sm text-[#111827] focus:outline-none focus:border-[#194793] focus:bg-white"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="px-4 py-3 rounded-md bg-[#FEF2F2] border border-[#C8231D]/30 text-xs sm:text-sm text-[#991B1B] font-medium"
                  >
                    {error}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-md bg-[#1B479B] hover:bg-[#15397E] text-white text-sm font-semibold border border-[#123270] border-b-[3px] border-b-[#D61C1C] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{submitting ? 'Sending to Dispatch...' : 'Send Quick Inquiry'}</span>
                  </button>

                  <p className="inline-flex items-center gap-1.5 text-xs text-[#4B5563]">
                    <ShieldCheck className="w-4 h-4 text-[#194793] shrink-0" aria-hidden="true" />
                    <span>Direct to Kisumu Operations · No broker fees</span>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[#111827]/10 bg-white py-14 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs sm:text-sm font-semibold text-[#C8231D]">
              Before You Travel
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium leading-tight text-[#111827]">
              Clear procedures from airport arrivals to field missions.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
            {DISPATCH_STANDARDS.map((item) => (
              <div key={item.number} className="pt-5 border-t border-[#194793]/20 space-y-2.5">
                <div className="font-mono text-xs font-medium text-[#C8231D] tabular-nums">
                  {item.number}
                </div>
                <h3 className="font-serif text-xl font-medium text-[#111827]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#4B5563]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
