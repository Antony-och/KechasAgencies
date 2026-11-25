export type FleetCategoryId = 'executive' | '4x4-safari' | 'family-group' | 'economy';

export interface FleetCategorySummary {
  id: FleetCategoryId;
  title: string;
  modelsLabel: string;
  summary: string;
  image: string;
}

export interface Vehicle {
  id: string;
  name: string;
  category: FleetCategoryId;
  categoryLabel: string;
  registrationPlate?: string;
  image: string;
  passengers: number;
  luggage: number;
  transmission: 'Automatic' | 'Automatic 4WD';
  fuelType: 'Petrol' | 'Diesel';
  terrain: string;
  chauffeurAvailable: boolean;
  selfDriveAvailable: boolean;
  dailyRateKes: number;
  selfDriveRateKes?: number;
  status?: 'Available' | 'Booked' | 'In Maintenance' | 'Inactive';
  highlight: string;
  idealFor: string[];
}

export const FLEET_CATEGORIES: FleetCategorySummary[] = [
  {
    id: 'executive',
    title: 'Executive',
    modelsLabel: 'Mercedes-Benz E-Class · Mazda CX-5',
    summary:
      'Refined cabins, quiet suspension, and uniformed chauffeurs tailored for boardrooms, diplomatic visits, weddings, and VIP airport arrivals.',
    image: '/src/assets/images/fleet_mercedes_eclass_1795598677542.jpg',
  },
  {
    id: '4x4-safari',
    title: '4x4 Safari',
    modelsLabel: 'Toyota Land Cruiser Prado',
    summary:
      'High-clearance 4WD engineered for red laterite tracks, Ruma National Park loops, rainy-season fieldwork, and 7-passenger regional expeditions.',
    image: '/src/assets/images/fleet_toyota_prado_1795598678345.jpg',
  },
  {
    id: 'family-group',
    title: 'Family & Group',
    modelsLabel: 'Toyota Noah / Voxy',
    summary:
      'Dual sliding doors, flexible 7-seat configuration, and generous luggage capacity for family reunions, ceremonies, and KIS group arrivals.',
    image: '/src/assets/images/fleet_toyota_noah_1795598678673.jpg',
  },
  {
    id: 'economy',
    title: 'Economy Fleet',
    modelsLabel: 'Toyota Axio · Fielder · Nissan Note · Mazda Demio',
    summary:
      'Dependable, fuel-efficient daily runners ideal for Kisumu urban errands, inter-county tarmac commutes, and budget-conscious fieldwork.',
    image: '/src/assets/images/fleet_toyota_sedan_1795598679217.jpg',
  },
];

export const FLEET_VEHICLES: Vehicle[] = [
  {
    id: 'toyota-land-cruiser-prado',
    name: 'Toyota Land Cruiser Prado',
    category: '4x4-safari',
    categoryLabel: '4x4 Safari',
    image: '/src/assets/images/fleet_toyota_prado_1795598678345.jpg',
    passengers: 7,
    luggage: 5,
    transmission: 'Automatic 4WD',
    fuelType: 'Diesel',
    terrain: 'All-Terrain · Murram, Safari Parks & Highland Tracks',
    chauffeurAvailable: true,
    selfDriveAvailable: true,
    dailyRateKes: 18000,
    highlight:
      'Full-time 4WD with dual-range transfer case, elevated ground clearance, and dual-zone climate control for long Western Kenya field loops.',
    idealFor: ['Ruma National Park', 'NGO & Donor Fieldwork', 'Rainy-Season County Roads'],
  },
  {
    id: 'mercedes-benz-e-class',
    name: 'Mercedes-Benz E-Class',
    category: 'executive',
    categoryLabel: 'Executive',
    image: '/src/assets/images/fleet_mercedes_eclass_1795598677542.jpg',
    passengers: 4,
    luggage: 3,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    terrain: 'Urban Tarmac & Inter-County Highways',
    chauffeurAvailable: true,
    selfDriveAvailable: false,
    dailyRateKes: 16500,
    highlight:
      'Chauffeur-driven flagship sedan with leather appointments, rear privacy shading, and whisper-quiet highway composure.',
    idealFor: ['VIP Airport Pickups', 'Executive Boardrooms', 'Weddings & Formal Convoys'],
  },
  {
    id: 'mazda-cx-5',
    name: 'Mazda CX-5',
    category: 'executive',
    categoryLabel: 'Executive',
    image: '/src/assets/images/fleet_mazda_cx5_1795598677965.jpg',
    passengers: 5,
    luggage: 4,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    terrain: 'Highways, Tea Highlands & Smooth Murram',
    chauffeurAvailable: true,
    selfDriveAvailable: true,
    dailyRateKes: 9500,
    highlight:
      'Balanced executive crossover pairing refined cabin comfort with confident clearance for Kakamega Forest and Kisii highland ascents.',
    idealFor: ['Kakamega Forest Reserve', 'Corporate Regional Visits', 'Comfortable Self-Drive'],
  },
  {
    id: 'toyota-noah-voxy',
    name: 'Toyota Noah / Voxy',
    category: 'family-group',
    categoryLabel: 'Family & Group',
    image: '/src/assets/images/fleet_toyota_noah_1795598678673.jpg',
    passengers: 7,
    luggage: 6,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    terrain: 'Highways & Maintained County Roads',
    chauffeurAvailable: true,
    selfDriveAvailable: true,
    dailyRateKes: 8500,
    highlight:
      'Spacious 7-seater MPV with twin power sliding doors, walk-through cabin aisle, and deep boot capacity for group suitcases.',
    idealFor: ['KIS Airport Group Transfers', 'Family Ceremonies', 'Lake Victoria Circuit'],
  },
  {
    id: 'toyota-corolla-fielder',
    name: 'Toyota Corolla Fielder',
    category: 'economy',
    categoryLabel: 'Economy Fleet',
    image: '/src/assets/images/fleet_toyota_sedan_1795598679217.jpg',
    passengers: 5,
    luggage: 4,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    terrain: 'Urban Roads & Inter-County Tarmac',
    chauffeurAvailable: true,
    selfDriveAvailable: true,
    dailyRateKes: 5000,
    highlight:
      'Reliable estate wagon offering flat-folding rear cargo space and impressive fuel economy across Kisumu, Siaya, and Kakamega corridors.',
    idealFor: ['Project Equipment Runs', 'Multi-Day County Errands', 'Busia & Bungoma Tarmac'],
  },
  {
    id: 'toyota-corolla-axio',
    name: 'Toyota Corolla Axio',
    category: 'economy',
    categoryLabel: 'Economy Fleet',
    image: '/src/assets/images/fleet_toyota_sedan_1795598679217.jpg',
    passengers: 5,
    luggage: 3,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    terrain: 'Urban Streets & Highway Tarmac',
    chauffeurAvailable: true,
    selfDriveAvailable: true,
    dailyRateKes: 4500,
    highlight:
      'Crisp, air-conditioned saloon trusted for daily business appointments, Maseno commutes, and seamless solo airport pickups.',
    idealFor: ['Kisumu CBD Meetings', 'Maseno & Bondo Day Trips', 'Daily Self-Drive'],
  },
  {
    id: 'nissan-note',
    name: 'Nissan Note',
    category: 'economy',
    categoryLabel: 'Economy Fleet',
    image: '/src/assets/images/fleet_compact_hatch_1795598680030.jpg',
    passengers: 5,
    luggage: 2,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    terrain: 'Urban & Peri-Urban Tarmac',
    chauffeurAvailable: true,
    selfDriveAvailable: true,
    dailyRateKes: 4000,
    highlight:
      'Nimble compact hatchback with surprisingly generous rear legroom and light fuel consumption for Kisumu town circulation.',
    idealFor: ['Kisumu Urban Errands', 'Short Solo Transfers', 'Budget Daily Hire'],
  },
  {
    id: 'mazda-demio',
    name: 'Mazda Demio',
    category: 'economy',
    categoryLabel: 'Economy Fleet',
    image: '/src/assets/images/fleet_compact_hatch_1795598680030.jpg',
    passengers: 5,
    luggage: 2,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    terrain: 'Urban & Paved County Centres',
    chauffeurAvailable: true,
    selfDriveAvailable: true,
    dailyRateKes: 4000,
    highlight:
      'Clean, responsive compact hatch ideal for navigating Milimani, Nyalenda, and lakeside dining stops with effortless parking.',
    idealFor: ['City Appointments', 'Weekend Lake Visits', 'Solo Commuters'],
  },
];

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`;
}
