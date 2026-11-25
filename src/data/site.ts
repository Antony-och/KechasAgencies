export const SITE_CONFIG = {
  brandName: 'Kechas Agencies',
  tagline: 'Transport · Car Hire · Kisumu',
  logoSrc: '/assets/aistudio/98dcfd06e_Gemini_Generated_Image_hrpm1hrpm1hrpm1h_1536b12c.jpg',
  phoneDisplay: '0722 403 413',
  phoneHref: 'tel:+254722403413',
  phoneIntl: '+254 722 403 413',
  whatsappNumber: '254722403413',
  defaultWhatsappMessage:
    'Habari Kechas Agencies! I would like to inquire about hiring a vehicle in Kisumu. Please share availability and rates.',
  email: 'kenchasagencies@gmail.com',
  address: 'Kechas House, off Airport Road, Kisumu CBD',
  airportDesk: 'Kisumu International Airport (KIS) — Arrivals Forecourt',
  dispatchHours: '24/7 Dispatch & Roadside Command',
  officeHours: 'Mon – Sun · 6:00 AM – 9:00 PM (24/7 for scheduled flights & field emergencies)',
  mpesa: {
    paybill: '247247',
    account: 'KECHAS',
  },
  countiesServed: [
    'Kisumu',
    'Siaya',
    'Kakamega',
    'Bungoma',
    'Busia',
    'Homa Bay',
    'Migori',
    'Vihiga',
    'Nyamira',
    'Kisii',
  ],
};

export function buildWhatsAppUrl(customMessage?: string): string {
  const text = encodeURIComponent(customMessage || SITE_CONFIG.defaultWhatsappMessage);
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${text}`;
}
