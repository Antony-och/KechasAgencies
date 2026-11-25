export interface DestinationGuide {
  slug: string;
  name: string;
  county: string;
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
    distanceFromKisumu: '140 km via Katito & Kendu Bay',
    driveTime: '≈ 2.5 hrs from Kisumu',
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
    distanceFromKisumu: '58 km via Kisumu–Kakamega Highway',
    driveTime: '≈ 1.5 – 2 hrs from Kisumu',
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
    distanceFromKisumu: '10 – 40 km loop',
    driveTime: '15 – 45 min from CBD',
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
    slug: 'busia-border-corridor',
    name: 'Busia & Malaba Border Corridor',
    county: 'Busia & Bungoma Counties',
    distanceFromKisumu: '115 – 145 km via Luanda & Bumala',
    driveTime: '≈ 2 – 2.5 hrs from Kisumu',
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
    distanceFromKisumu: '165 – 190 km via Sondu & Rongo',
    driveTime: '≈ 3 hrs from Kisumu',
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
    distanceFromKisumu: '110 – 130 km via Katito & Oyugis',
    driveTime: '≈ 2 – 2.5 hrs from Kisumu',
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
