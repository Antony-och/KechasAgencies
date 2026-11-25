export interface JournalArticle {
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  readTime: string;
  image: string;
  excerpt: string;
  sections: {
    heading: string;
    body: string;
  }[];
  recommendedRouteSlug: string;
}

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: 'rainy-season-field-trip-homa-bay-migori',
    title: 'Preparing for a Rainy-Season Field Trip to Homa Bay & Migori',
    category: 'Field Logistics',
    publishedAt: 'November 2026',
    readTime: '4 min read',
    image: '/src/assets/images/dest_ruma_savannah_1795598679417.jpg',
    excerpt:
      'From black-cotton feeder roads past Kendu Bay to timing fuel stops before Rongo, practical guidance for NGO and research teams heading south of the Winam Gulf.',
    sections: [
      {
        heading: 'Why vehicle clearance matters south of Katito',
        body: 'During the long and short rains across Homa Bay and Migori, the primary trunk tarmac remains dependable, yet the final five kilometres into community health centres, lakeside landing beaches, or Lambwe Valley stations often turn slick within an hour. Selecting a full-time 4x4 Land Cruiser Prado instead of a low-clearance saloon prevents schedule slippage and eliminates recovery delays.',
      },
      {
        heading: 'Timing departures and fuel reserves',
        body: 'Most tropical showers in the Lake Basin build over the hills after 2:00 PM. Dispatching from Kisumu CBD at 6:00 AM gives field teams dry morning traction on unpaved spurs and allows return transit before evening glare. Our drivers top off diesel reserves in Katito or Homa Bay before entering rural loops where high-grade fuel availability can be irregular.',
      },
      {
        heading: 'Pre-trip checklist with Kechas Dispatch',
        body: 'Every fieldwork booking includes verified recovery tow gear, full-size spare tyres, first-aid kits, and 24/7 WhatsApp coordination with our Kisumu operations desk—plus itemized VAT invoices for NGO finance teams.',
      },
    ],
    recommendedRouteSlug: 'migori-isabania-corridor',
  },
  {
    slug: 'kisumu-international-airport-arrivals-guide',
    title: 'What to Expect at Kisumu International Airport Arrivals',
    category: 'Airport Transfers',
    publishedAt: 'October 2026',
    readTime: '3 min read',
    image: '/src/assets/images/hero_prado_western_kenya_1795598677955.jpg',
    excerpt:
      'How flight-tracked meet-and-greet pickups work at KIS, typical transfer times to Milimani, CBD hotels, and Maseno, and avoiding last-minute curb confusion.',
    sections: [
      {
        heading: 'Flight tracking and zero waiting fees for delays',
        body: 'Morning and evening flights from Wilson Airport and JKIA into Kisumu International Airport (KIS) occasionally shift by twenty to forty minutes due to Nairobi air traffic or Lake Basin weather. When you share your flight number at booking, our dispatch desk monitors live landing times so your chauffeur enters the forecourt precisely as baggage reclaim begins.',
      },
      {
        heading: 'From Arrivals to Kisumu CBD and Milimani in 15 minutes',
        body: 'Leaving the airport onto Airport Road places you minutes from Kisumu CBD, Milimani diplomatic residences, Acacia Premier, Sovereign Hotel, and Grand Royal Swiss. For onward regional travel directly from KIS—such as Kakamega, Siaya, or Bondo—your vehicle arrives fueled and briefed for the full inter-county route.',
      },
      {
        heading: 'Transparent flat rates and instant M-Pesa settlement',
        body: 'Airport transfers carry fixed KES rates by vehicle class with zero hidden parking surcharges. Corporate guests can settle via M-Pesa Paybill 247247 (Account: KECHAS) or monthly corporate billing.',
      },
    ],
    recommendedRouteSlug: 'lake-victoria-circuit',
  },
  {
    slug: 'best-day-trips-within-two-hours-of-kisumu',
    title: 'Best Day Trips Within 2 Hours of Kisumu',
    category: 'Regional Travel',
    publishedAt: 'September 2026',
    readTime: '5 min read',
    image: '/src/assets/images/dest_kakamega_canopy_1795598680259.jpg',
    excerpt:
      'Three distinct day itineraries—from emerald rainforest trails in Kakamega to granite sacred boulders at Kit Mikayi and Ndere Island boat crossings.',
    sections: [
      {
        heading: '1. Kakamega Forest Reserve (1.5 – 2 hrs north)',
        body: 'Swap lakeside warmth for cool canopy shade beneath centuries-old indigenous hardwoods. Arrive by 7:30 AM at Buyangu or Isecheno Station for guided primate and birding walks, then return via Chavakali with fresh highland produce along the road.',
      },
      {
        heading: '2. Kit Mikayi & Ndere Island Circuit (45 min west)',
        body: 'Head west along the Bondo road to walk among the towering 40-metre weeping rock formations of Kit Mikayi, before continuing to Kaloka landing beach for a quiet boat crossing onto Ndere Island National Park.',
      },
      {
        heading: '3. Kiboko Bay, Impala Sanctuary & Dunga Sunset (15 – 30 min)',
        body: 'Ideal for guests with a single free afternoon between meetings: spot Rothschild giraffes and lakeside impalas inside Kisumu Impala Sanctuary, followed by whole tilapia grilled beside the papyrus reeds at Dunga.',
      },
    ],
    recommendedRouteSlug: 'kakamega-forest',
  },
];
