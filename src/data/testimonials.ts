export interface Testimonial {
  id: string;
  quote: string;
  clientName: string;
  role: string;
  context: string;
  route: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'ngo-migori',
    quote:
      'Our field audit team landed at Kisumu at 6:45 AM and needed to reach three sub-county clinics in Migori before dusk. The Prado was waiting outside Arrivals with water, cold A/C, and a chauffeur who knew every murram shortcut after Rongo without once checking a map.',
    clientName: 'Dr. Beatrice Omondi',
    role: 'Regional Program Coordinator',
    context: 'Lake Basin Health Initiative · NGO Fieldwork',
    route: 'Kisumu → Migori',
  },
  {
    id: 'ruma-travelers',
    quote:
      'We booked Kechas for a weekend loop into Ruma National Park after heavy rains. Our driver timed the Kamato Gate opening to perfection, spotted Roan antelope within twenty minutes, and had us back at Dunga Hill Camp before sunset.',
    clientName: 'Henrik & Clara Lindqvist',
    role: 'Visiting Travelers',
    context: 'Stockholm · 3-Day Western Kenya Safari',
    route: 'Kisumu → Ruma National Park',
  },
  {
    id: 'wedding-maseno',
    quote:
      'Coordinating diaspora relatives flying into KIS for my sister’s traditional ceremony in Maseno felt effortless. One Mercedes E-Class for the bridal party and two Toyota Noahs ran on strict clockwork all weekend, settled cleanly via M-Pesa Paybill.',
    clientName: 'Kevin Ochieng',
    role: 'Family Logistics Lead',
    context: 'Diaspora & Wedding Convoy',
    route: 'Kisumu CBD → Maseno',
  },
];
