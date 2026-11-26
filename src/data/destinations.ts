export type DestinationCategory =
  | 'Safari & Nature'
  | 'Lakeside & Islands'
  | 'Highlands & Tea'
  | 'Border & Fieldwork';

export interface DestinationGuide {
  slug: string;
  name: string;
  county: string;
  category?: DestinationCategory;
  distanceFromKisumu: string;
  driveTime: string;
  recommendedVehicle: string;
  recommendedVehicleId: string;
  image: string;
  summary: string;
  roadConditions: string;
  localTips: string[];
  featuredOnHome: boolean;
}

export const DESTINATIONS: DestinationGuide[] = [
  {
    slug: 'ruma-national-park',
    name: 'Ruma National Park',
    county: 'Homa Bay County',
    category: 'Safari & Nature',
    distanceFromKisumu: '140 km via Katito & Kendu Bay',
    driveTime: '≈ 2.5 hrs',
    recommendedVehicle: 'Toyota Land Cruiser Prado',
    recommendedVehicleId: 'toyota-land-cruiser-prado',
    image: '/src/assets/images/dest_ruma_savannah_1795598679417.jpg',
    summary:
      'Kenya’s last remaining sanctuary for the rare Roan antelope, nestled in the Lambwe Valley beneath the dramatic Kanyamwa Escarpment.',
    roadConditions:
      'Tarmac through Katito, Kendu Bay, and Homa Bay town; final approach into Kamato Gate and internal game tracks transition to black-cotton and red laterite murram that demand high-clearance 4WD, especially after afternoon rains.',
    localTips: [
      'Depart Kisumu CBD by 6:00 AM to reach Kamato Gate as wildlife grazes in cool morning light.',
      'Refuel in Homa Bay town before turning into Lambwe Valley.',
      'Pair the return leg with a lakeside fish lunch at Kendu Bay or Mbita causeway.',
    ],
    featuredOnHome: true,
  },
  {
    slug: 'kakamega-forest',
    name: 'Kakamega Forest Reserve',
    county: 'Kakamega County',
    category: 'Safari & Nature',
    distanceFromKisumu: '58 km via Kisumu–Kakamega Hwy',
    driveTime: '≈ 1.5 hrs',
    recommendedVehicle: 'Mazda CX-5 or Land Cruiser Prado',
    recommendedVehicleId: 'mazda-cx-5',
    image: '/src/assets/images/dest_kakamega_canopy_1795598680259.jpg',
    summary:
      'Kenya’s only tropical rainforest remnant of the ancient Guineo-Congolian belt—celebrated for colobus monkeys, crowned eagles, and dawn canopy trails.',
    roadConditions:
      'Smooth paved A1 highway past Chavakali and Khayega, followed by graded earthen access lanes into Buyangu Hill or Isecheno Forest Station. Crossover AWD or 4x4 ensures poise when rainforest showers dampen the clay.',
    localTips: [
      'Specify Isecheno (KFS south gate) for giant fig trees or Buyangu (KWS north gate) for the sunrise viewpoint.',
      'Carry rain gear year-round; afternoon showers clear quickly into crisp golden light.',
      'Our chauffeurs coordinate directly with certified forest birding guides on arrival.',
    ],
    featuredOnHome: true,
  },
  {
    slug: 'lake-victoria-circuit',
    name: 'Lake Victoria & Kisumu Circuit',
    county: 'Kisumu County',
    category: 'Lakeside & Islands',
    distanceFromKisumu: '10 – 40 km loop',
    driveTime: '15 – 45 min',
    recommendedVehicle: 'Toyota Noah or Mercedes-Benz E-Class',
    recommendedVehicleId: 'toyota-noah-voxy',
    image: '/src/assets/images/dest_lake_victoria_1795598707039.jpg',
    summary:
      'A curated lakeside circuit linking Kit Mikayi’s towering granite monoliths, Kisumu Impala Sanctuary, Kiboko Bay, and sunset dining along Dunga Pier.',
    roadConditions:
      'Well-maintained urban tarmac across Milimani and Airport Road, with a short compacted gravel spur into Kit Mikayi off the Bondo highway.',
    localTips: [
      'Schedule Kit Mikayi for 4:00 PM light before returning along the lakeshore to Dunga for sunset.',
      'Ideal half-day itinerary between morning meetings and evening flights out of KIS.',
      'Chauffeur waits seamlessly while your group explores boardwalks and boat rides.',
    ],
    featuredOnHome: true,
  },
  {
    slug: 'rusinga-mfangano-islands',
    name: 'Rusinga & Mfangano Islands',
    county: 'Homa Bay County',
    category: 'Lakeside & Islands',
    distanceFromKisumu: '155 km via Kendu Bay & Mbita',
    driveTime: '≈ 3 hrs',
    recommendedVehicle: 'Toyota Land Cruiser Prado',
    recommendedVehicleId: 'toyota-land-cruiser-prado',
    image: '/src/assets/images/dest_rusinga_mbita_islands_1795682137338.jpg',
    summary:
      'Drive straight across the scenic Mbita Causeway onto Rusinga’s golden-hour volcanic shores, fossil heritage ridges, and boat launches for Mfangano Island.',
    roadConditions:
      'Newly surfaced tarmac from Kisumu through Homa Bay and across Mbita Causeway onto Rusinga ring road; resort approach tracks and island lookout trails reward SUV ground clearance.',
    localTips: [
      'Time your Mbita Causeway crossing for late afternoon when Lake Victoria turns copper-gold.',
      'Coordinate secure lakeside parking in Mbita or Rusinga Lodge when hopping a boat to Mfangano rock-art caves.',
      'Pre-order fresh tilapia lunch stops near Takawiri or Rusinga fishing bays.',
    ],
    featuredOnHome: true,
  },
  {
    slug: 'mt-elgon-highlands',
    name: 'Mt. Elgon & Kitale Highlands',
    county: 'Bungoma & Trans Nzoia',
    category: 'Highlands & Tea',
    distanceFromKisumu: '160 – 205 km via Webuye & Kimilili',
    driveTime: '≈ 3.5 hrs',
    recommendedVehicle: 'Toyota Land Cruiser Prado',
    recommendedVehicleId: 'toyota-land-cruiser-prado',
    image: '/src/assets/images/dest_mt_elgon_highlands_1795682137529.jpg',
    summary:
      'Volcanic elephant salt caves at Kitum, bamboo highland switchbacks, and crisp alpine views linking Bungoma’s Cheptais foothills to Mt. Elgon National Park.',
    roadConditions:
      'Paved A1 highway through Kakamega and Webuye toward Kimilili or Kitale; national park access tracks and Endebess forest ascents require genuine 4x4 low-range capability in wet months.',
    localTips: [
      'Pack warm layers—night and dawn temperatures at Chorlim Gate drop briskly below 10°C.',
      'Carry bright headlamps if touring Kitum and Makingeny underground caves with KWS rangers.',
      'Combine with Saiwa Swamp National Park outside Kitale for a 2-day Western highlands loop.',
    ],
    featuredOnHome: true,
  },
  {
    slug: 'kericho-nandi-tea-hills',
    name: 'Kericho Tea Estates & Nandi Hills',
    county: 'Kericho & Nandi Counties',
    category: 'Highlands & Tea',
    distanceFromKisumu: '85 – 110 km via Awasi & Muhoroni',
    driveTime: '≈ 1.5 – 2 hrs',
    recommendedVehicle: 'Mazda CX-5',
    recommendedVehicleId: 'mazda-cx-5',
    image: '/src/assets/images/dest_kericho_tea_hills_1795682139290.jpg',
    summary:
      'Sweeping emerald tea plantations, misty highland hairpins, and Chagaik Arboretum trails rising steadily above the Kano Plains from Kisumu.',
    roadConditions:
      'Smooth paved C35 / B1 escarpment climb out of Awasi and Chemilil with sweeping highland bends and frequent valley fog in early mornings.',
    localTips: [
      'Leave Kisumu by 7:30 AM for clear views across the Nandi Escarpment before afternoon clouds build.',
      'Stop at historic tea estate tasting rooms or Chagaik Dam boardwalks along the Kericho–Nakuru road.',
      'Ideal executive day retreat or cool-climate weekend transfer straight from KIS Airport.',
    ],
    featuredOnHome: true,
  },
  {
    slug: 'ndere-island-got-ramogi',
    name: 'Ndere Island & Got Ramogi Sanctuary',
    county: 'Kisumu & Siaya Counties',
    category: 'Lakeside & Islands',
    distanceFromKisumu: '48 – 95 km via Kombewa & Bondo',
    driveTime: '≈ 1 – 1.75 hrs',
    recommendedVehicle: 'Toyota Noah or Mazda CX-5',
    recommendedVehicleId: 'mazda-cx-5',
    image: '/src/assets/images/dest_ndere_got_ramogi_1795682138587.jpg',
    summary:
      'Unspoiled Lake Victoria birding island paired with the sacred indigenous forest ridge of Got Ramogi and the vast Yala Swamp papyrus ecosystem.',
    roadConditions:
      'Fast tarmac west from Kisumu through Kombewa and Bondo toward Usenge; final lakeshore landing spurs to Kaloka Beach and Got Ramogi trailhead are compacted gravel.',
    localTips: [
      'Boat charters to Ndere Island National Park launch cleanly from Kaloka Beach—our drivers coordinate boat wait times.',
      'Got Ramogi’s hilltop forest trail offers sweeping 360-degree views across Yala Swamp and Uganda’s islands.',
      'Bring binoculars for fish eagles, papyrus gonoleks, and sitatunga sightings along the wetlands.',
    ],
    featuredOnHome: false,
  },
  {
    slug: 'busia-border-corridor',
    name: 'Busia & Malaba Border Corridor',
    county: 'Busia & Bungoma Counties',
    category: 'Border & Fieldwork',
    distanceFromKisumu: '115 – 145 km via Luanda & Bumala',
    driveTime: '≈ 2 – 2.5 hrs',
    recommendedVehicle: 'Toyota Corolla Fielder or Mazda CX-5',
    recommendedVehicleId: 'toyota-corolla-fielder',
    image: '/src/assets/images/fleet_toyota_sedan_1795598679217.jpg',
    summary:
      'Vital commercial and cross-border logistics corridor serving customs clearing teams, agro-processors, and development agencies across Siaya, Busia, and Bungoma.',
    roadConditions:
      'Continuous tarmac trunk highway with heavy freight truck traffic near Korinda and Malaba. Disciplined overtaking and punctual early departures save up to 45 minutes.',
    localTips: [
      'Ideal for single-day return trips when booked with a Kechas chauffeur familiar with weighbridge bypass timings.',
      'Ample estate luggage bay in the Fielder for documentation boxes and field kits.',
    ],
    featuredOnHome: false,
  },
  {
    slug: 'migori-isabania-corridor',
    name: 'Migori & Isebania Field Corridor',
    county: 'Migori County',
    category: 'Border & Fieldwork',
    distanceFromKisumu: '165 – 190 km via Sondu & Rongo',
    driveTime: '≈ 3 hrs',
    recommendedVehicle: 'Toyota Land Cruiser Prado',
    recommendedVehicleId: 'toyota-land-cruiser-prado',
    image: '/src/assets/images/fleet_toyota_prado_1795598678345.jpg',
    summary:
      'Southern Nyanza trunk route serving health NGOs, agricultural research teams, and cross-border delegations heading toward Awendo, Migori, and Isebania.',
    roadConditions:
      'Fast highway tarmac between Ahero, Sondu, Kisii, and Rongo, branching onto rural murram feeder roads around Uriri, Nyatike, and Kuria.',
    localTips: [
      'Pre-book full-day or multi-day Prado support for off-tarmac sub-county clinics.',
      'Confirmed fuel stops at Katito and Rongo keep multi-site schedules on time.',
    ],
    featuredOnHome: false,
  },
  {
    slug: 'kisii-nyamira-highlands',
    name: 'Kisii & Nyamira Highlands',
    county: 'Kisii & Nyamira Counties',
    category: 'Highlands & Tea',
    distanceFromKisumu: '110 – 130 km via Katito & Oyugis',
    driveTime: '≈ 2 – 2.5 hrs',
    recommendedVehicle: 'Mazda CX-5',
    recommendedVehicleId: 'mazda-cx-5',
    image: '/src/assets/images/fleet_mazda_cx5_1795598677965.jpg',
    summary:
      'Verdant soapstone ridges, smallholder tea estates, and high-altitude market towns linking Nyabondo escarpment with Keroka, Nyamira, and Kisii town.',
    roadConditions:
      'Steep winding highland ascents with cool morning mist and frequent speed bumps through market centres. Strong torque and responsive braking make the CX-5 or Prado ideal.',
    localTips: [
      'Plan departures before 7:00 AM to clear Oyugis and Kisii town market congestion.',
      'Afternoon mist settles rapidly above 1,800m—our fleet runs inspected fog lamps and fresh wipers.',
    ],
    featuredOnHome: false,
  },
];
