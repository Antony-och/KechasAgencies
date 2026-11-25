import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { FLEET_VEHICLES } from '../data/fleet';
import { DESTINATIONS } from '../data/destinations';
import { JOURNAL_ARTICLES } from '../data/journal';
import { TESTIMONIALS } from '../data/testimonials';
import { SITE_CONFIG } from '../data/site';

function addDaysIso(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

const PLATES: Record<string, string> = {
  'toyota-land-cruiser-prado': 'KDN 412X',
  'mercedes-benz-e-class': 'KDM 881J',
  'mazda-cx-5': 'KDK 204R',
  'toyota-noah-voxy': 'KDL 345X',
  'toyota-corolla-fielder': 'KDL 245T',
  'toyota-corolla-axio': 'KDC 718G',
  'nissan-note': 'KDJ 314G',
  'mazda-demio': 'KDB 509N',
};

const SEED_STATUSES: Record<string, 'Available' | 'Booked' | 'In Maintenance'> = {
  'toyota-land-cruiser-prado': 'Booked',
  'mercedes-benz-e-class': 'Available',
  'mazda-cx-5': 'Booked',
  'toyota-noah-voxy': 'Available',
  'toyota-corolla-fielder': 'In Maintenance',
  'toyota-corolla-axio': 'Available',
  'nissan-note': 'Available',
  'mazda-demio': 'Available',
};

let activeSeedPromise: Promise<void> | null = null;

async function runSeedSection(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.warn(`Portal seed note (${label}):`, err);
  }
}

export async function seedDefaultFleetVehicles(): Promise<number> {
  const vehiclesSnap = await getDocs(query(collection(db, 'vehicles'), limit(1)));
  if (!vehiclesSnap.empty) return 0;

  await Promise.all(
    FLEET_VEHICLES.map((v, idx) =>
      setDoc(doc(db, 'vehicles', v.id), {
        id: v.id,
        name: v.name,
        category: v.category,
        categoryLabel: v.categoryLabel,
        registrationPlate: PLATES[v.id] || `KDN 10${idx}A`,
        dailyRateKes: v.dailyRateKes,
        selfDriveRateKes: v.selfDriveAvailable ? Math.max(3500, v.dailyRateKes - 1500) : 0,
        selfDriveAvailable: v.selfDriveAvailable,
        chauffeurAvailable: v.chauffeurAvailable,
        passengers: v.passengers,
        luggage: v.luggage,
        transmission: v.transmission,
        fuelType: v.fuelType,
        terrain: v.terrain,
        highlight: v.highlight,
        image: v.image,
        currentOdometerKm: 64200 + idx * 7100,
        nextServiceKm: idx === 4 ? 92800 : 69200 + idx * 7100,
        nextServiceDate: idx === 4 ? addDaysIso(3) : addDaysIso(25 + idx * 8),
        insuranceExpiryDate: idx === 2 ? addDaysIso(11) : addDaysIso(90 + idx * 15),
        ntsaExpiryDate: addDaysIso(65 + idx * 14),
        status: SEED_STATUSES[v.id] || 'Available',
        updatedAt: serverTimestamp(),
      })
    )
  );
  return FLEET_VEHICLES.length;
}

export function ensurePortalSeeded(isAdminUser: boolean): Promise<void> {
  if (activeSeedPromise) return activeSeedPromise;

  activeSeedPromise = (async () => {
    // 1. Site settings (admin only; uses getDoc on settings/site because rules disallow listing /settings)
    if (isAdminUser) {
      await runSeedSection('settings', async () => {
        const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
        if (!settingsSnap.exists()) {
          await setDoc(doc(db, 'settings', 'site'), {
            companyName: SITE_CONFIG.brandName,
            phoneDisplay: SITE_CONFIG.phoneDisplay,
            whatsappNumber: SITE_CONFIG.whatsappNumber,
            email: SITE_CONFIG.email,
            address: SITE_CONFIG.address,
            mpesaPaybill: SITE_CONFIG.mpesa.paybill,
            mpesaAccount: SITE_CONFIG.mpesa.account,
            vatEnabled: true,
            vatRatePercent: 16,
            chauffeurDailyFeeKes: 2000,
            dispatchHours: SITE_CONFIG.dispatchHours,
            kraPin: 'P051940221K',
            bankDetails: 'KCB Bank Kisumu · Acc: 1204889120 · Kisumu Main',
            bookingTermsSummary:
              'Chauffeur rates include driver allowance and comprehensive insurance. Self-drive requires a valid driving licence and National ID or Passport.',
            updatedAt: serverTimestamp(),
          });
        }
      });
    }

    // 2. Vehicles (seeded first so fleet is always populated cleanly)
    await runSeedSection('vehicles', async () => {
      await seedDefaultFleetVehicles();
    });

    // 3. Drivers
    await runSeedSection('drivers', async () => {
      const driversSnap = await getDocs(query(collection(db, 'drivers'), limit(1)));
      if (driversSnap.empty) {
        const seedDrivers = [
          {
            id: 'drv_wycliffe',
            fullName: 'Wycliffe Odhiambo',
            phone: '+254 722 814 209',
            nationalId: '28491032',
            licenseNumber: 'DL-KE-884210',
            licenseExpiryDate: addDaysIso(240),
            assignedVehicleId: 'toyota-land-cruiser-prado',
            assignedVehicleName: 'Toyota Land Cruiser Prado (KDN 412X)',
            specialties: 'Ruma / Homa Bay, Migori Fieldwork, NGO Audits',
            status: 'On Trip',
            tripCount: 148,
          },
          {
            id: 'drv_samuel',
            fullName: 'Samuel Kiprono',
            phone: '+254 712 409 331',
            nationalId: '30112458',
            licenseNumber: 'DL-KE-912044',
            licenseExpiryDate: addDaysIso(310),
            assignedVehicleId: 'mercedes-benz-e-class',
            assignedVehicleName: 'Mercedes-Benz E-Class (KDM 881J)',
            specialties: 'VIP / Executive, KIS Arrivals, Diplomatic Protocol',
            status: 'Available',
            tripCount: 112,
          },
          {
            id: 'drv_peter',
            fullName: 'Peter Otieno',
            phone: '+254 733 590 112',
            nationalId: '26904417',
            licenseNumber: 'DL-KE-771923',
            licenseExpiryDate: addDaysIso(185),
            assignedVehicleId: 'mazda-cx-5',
            assignedVehicleName: 'Mazda CX-5 (KDK 204R)',
            specialties: 'Kakamega Forest, Kisii Highlands, Tea Belt',
            status: 'On Trip',
            tripCount: 96,
          },
          {
            id: 'drv_maurice',
            fullName: 'Maurice Wafula',
            phone: '+254 720 662 418',
            nationalId: '31445092',
            licenseNumber: 'DL-KE-940115',
            licenseExpiryDate: addDaysIso(270),
            assignedVehicleId: 'toyota-noah-voxy',
            assignedVehicleName: 'Toyota Noah / Voxy (KDL 345X)',
            specialties: 'Busia Border, Bungoma, Family & Wedding Convoys',
            status: 'Available',
            tripCount: 84,
          },
          {
            id: 'drv_kennedy',
            fullName: 'Kennedy Barasa',
            phone: '+254 718 330 742',
            nationalId: '29551804',
            licenseNumber: 'DL-KE-803319',
            licenseExpiryDate: addDaysIso(140),
            assignedVehicleId: 'toyota-corolla-axio',
            assignedVehicleName: 'Toyota Corolla Axio (KDC 718G)',
            specialties: 'Kisumu CBD, Maseno, Siaya & Bondo',
            status: 'Available',
            tripCount: 73,
          },
        ];

        await Promise.all(
          seedDrivers.map(({ id, ...driverData }) =>
            setDoc(doc(db, 'drivers', id), {
              ...driverData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
    });

    // 4. Bookings
    await runSeedSection('bookings', async () => {
      const bookingsSnap = await getDocs(query(collection(db, 'bookings'), limit(1)));
      if (bookingsSnap.empty) {
        const today = addDaysIso(0);
        const seedBookings = [
          {
            id: 'bk_1001',
            bookingRef: 'KCH-2026-4101',
            serviceType: 'chauffeur',
            vehicleId: 'toyota-land-cruiser-prado',
            vehicleName: 'Toyota Land Cruiser Prado',
            registrationPlate: 'KDN 412X',
            driverId: 'drv_wycliffe',
            driverName: 'Wycliffe Odhiambo',
            driverPhone: '+254 722 814 209',
            pickupLocation: 'Kisumu International Airport (KIS)',
            destination: 'Migori / Isebania',
            pickupDate: today,
            pickupTime: '06:45',
            returnDate: addDaysIso(2),
            returnTime: '18:00',
            rentalDays: 3,
            flightNumber: 'KQ 650',
            notes: 'NGO maternal health clinic audit across Rongo and Awendo',
            clientName: 'Dr. Beatrice Omondi',
            clientPhone: '+254 722 901 440',
            clientEmail: 'bomondi@lakebasinhealth.org',
            quotedAmountKes: 54000,
            amountPaidKes: 27000,
            paymentStatus: 'Deposit Paid',
            status: 'Active',
            source: 'Online',
            odometerOut: 64120,
            fuelOut: 'Full (8/8)',
            conditionOut: 'Clean exterior, spare tyre & tow kit verified',
          },
          {
            id: 'bk_1002',
            bookingRef: 'KCH-2026-4102',
            serviceType: 'airport-transfer',
            vehicleId: 'mercedes-benz-e-class',
            vehicleName: 'Mercedes-Benz E-Class',
            registrationPlate: 'KDM 881J',
            driverId: 'drv_samuel',
            driverName: 'Samuel Kiprono',
            driverPhone: '+254 712 409 331',
            pickupLocation: 'Kisumu International Airport (KIS)',
            destination: 'Milimani / Acacia Premier Hotel',
            pickupDate: today,
            pickupTime: '14:15',
            returnDate: today,
            returnTime: '15:30',
            rentalDays: 1,
            flightNumber: 'JM 8612',
            notes: 'VIP board arrival — meet at Arrivals forecourt',
            clientName: 'Hon. David Nyambane',
            clientPhone: '+254 733 215 890',
            clientEmail: 'dnyambane@kisii-agribusiness.co.ke',
            quotedAmountKes: 5500,
            amountPaidKes: 5500,
            paymentStatus: 'Paid in Full',
            status: 'Confirmed',
            source: 'WhatsApp',
          },
          {
            id: 'bk_1003',
            bookingRef: 'KCH-2026-4103',
            serviceType: 'chauffeur',
            vehicleId: 'mazda-cx-5',
            vehicleName: 'Mazda CX-5',
            registrationPlate: 'KDK 204R',
            driverId: 'drv_peter',
            driverName: 'Peter Otieno',
            driverPhone: '+254 733 590 112',
            pickupLocation: 'Kisumu CBD — Kechas House',
            destination: 'Kakamega / Forest Reserve',
            pickupDate: addDaysIso(-1),
            pickupTime: '07:30',
            returnDate: today,
            returnTime: '17:30',
            rentalDays: 2,
            notes: 'Returning to Kisumu CBD before dusk',
            clientName: 'Henrik Lindqvist',
            clientPhone: '+254 711 540 223',
            clientEmail: 'henrik.lindqvist@nordicmail.se',
            quotedAmountKes: 19000,
            amountPaidKes: 19000,
            paymentStatus: 'Paid in Full',
            status: 'Active',
            source: 'Online',
            odometerOut: 78340,
            fuelOut: 'Full (8/8)',
            conditionOut: 'No scratches, roof rails clear',
          },
          {
            id: 'bk_1004',
            bookingRef: 'KCH-2026-4104',
            serviceType: 'chauffeur',
            vehicleId: 'toyota-noah-voxy',
            vehicleName: 'Toyota Noah / Voxy',
            registrationPlate: 'KDL 345X',
            pickupLocation: 'Kisumu International Airport (KIS)',
            destination: 'Kisumu (CBD / Maseno / Dunga)',
            pickupDate: addDaysIso(1),
            pickupTime: '10:00',
            returnDate: addDaysIso(3),
            returnTime: '16:00',
            rentalDays: 3,
            flightNumber: 'KQ 654',
            notes: 'Family diaspora arrival for Maseno ceremony',
            clientName: 'Kevin Ochieng',
            clientPhone: '+254 721 889 014',
            clientEmail: 'kevin.ochieng@gmail.com',
            quotedAmountKes: 25500,
            amountPaidKes: 0,
            paymentStatus: 'Unpaid',
            status: 'Pending',
            source: 'Online',
          },
          {
            id: 'bk_1005',
            bookingRef: 'KCH-2026-4105',
            serviceType: 'self-drive',
            vehicleId: 'toyota-corolla-axio',
            vehicleName: 'Toyota Corolla Axio',
            registrationPlate: 'KDC 718G',
            pickupLocation: 'Kisumu CBD — Kechas House',
            destination: 'Busia / Malaba',
            pickupDate: addDaysIso(2),
            pickupTime: '08:00',
            returnDate: addDaysIso(4),
            returnTime: '17:00',
            rentalDays: 3,
            notes: 'Self-drive client — verify original DL at handover',
            clientName: 'Mercyline Nekesa',
            clientPhone: '+254 724 318 776',
            clientEmail: 'mnekesa@westernlogistics.co.ke',
            quotedAmountKes: 13500,
            amountPaidKes: 0,
            paymentStatus: 'Unpaid',
            status: 'Pending',
            source: 'Phone',
          },
        ];

        await Promise.all(
          seedBookings.map(({ id, ...bookingData }) =>
            setDoc(doc(db, 'bookings', id), {
              ...bookingData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
    });

    // 5. Transactions
    await runSeedSection('transactions', async () => {
      const txSnap = await getDocs(query(collection(db, 'transactions'), limit(1)));
      if (txSnap.empty) {
        const seedTx = [
          {
            id: 'tx_2001',
            bookingId: 'bk_1001',
            bookingRef: 'KCH-2026-4101',
            clientName: 'Dr. Beatrice Omondi (Lake Basin Health Initiative)',
            clientType: 'Corporate / NGO',
            method: 'Corporate/NGO Monthly Invoice',
            mpesaCode: 'INV-2026-118',
            amountKes: 27000,
            notes: '50% fieldwork mobilization deposit',
            paidAt: addDaysIso(0),
            recordedByEmail: 'antonyonyi75@gmail.com',
          },
          {
            id: 'tx_2002',
            bookingId: 'bk_1002',
            bookingRef: 'KCH-2026-4102',
            clientName: 'Hon. David Nyambane',
            clientType: 'Individual / Diaspora',
            method: 'M-Pesa Paybill/STK',
            mpesaCode: 'SJK892LMP1',
            amountKes: 5500,
            notes: 'KIS VIP pickup settled via Paybill 247247',
            paidAt: addDaysIso(0),
            recordedByEmail: 'antonyonyi75@gmail.com',
          },
          {
            id: 'tx_2003',
            bookingId: 'bk_1003',
            bookingRef: 'KCH-2026-4103',
            clientName: 'Henrik Lindqvist',
            clientType: 'Tourist',
            method: 'M-Pesa Paybill/STK',
            mpesaCode: 'SJK774QRT9',
            amountKes: 19000,
            notes: '2-day Kakamega Forest hire settled in full',
            paidAt: addDaysIso(-1),
            recordedByEmail: 'antonyonyi75@gmail.com',
          },
        ];

        await Promise.all(
          seedTx.map(({ id, ...txData }) =>
            setDoc(doc(db, 'transactions', id), {
              ...txData,
              createdAt: serverTimestamp(),
            })
          )
        );
      }
    });

    // 6. Clients CRM
    await runSeedSection('clients', async () => {
      const clientsSnap = await getDocs(query(collection(db, 'clients'), limit(1)));
      if (clientsSnap.empty) {
        const seedClients = [
          {
            id: 'cli_lakebasin',
            name: 'Dr. Beatrice Omondi',
            phone: '+254 722 901 440',
            email: 'bomondi@lakebasinhealth.org',
            accountType: 'Corporate / NGO',
            idOrPassport: '24518902',
            kraPin: 'P051442918K',
            organization: 'Lake Basin Health Initiative',
            totalTrips: 9,
            totalSpendKes: 324000,
            notes: 'Monthly consolidated VAT billing; prefers Toyota Land Cruiser Prado.',
          },
          {
            id: 'cli_henrik',
            name: 'Henrik Lindqvist',
            phone: '+254 711 540 223',
            email: 'henrik.lindqvist@nordicmail.se',
            accountType: 'Tourist',
            idOrPassport: 'SE-99412084',
            kraPin: '',
            organization: '',
            totalTrips: 2,
            totalSpendKes: 55000,
            notes: 'Visits Kisumu annually for Kakamega & Ruma birding.',
          },
          {
            id: 'cli_kevin',
            name: 'Kevin Ochieng',
            phone: '+254 721 889 014',
            email: 'kevin.ochieng@gmail.com',
            accountType: 'Individual / Diaspora',
            idOrPassport: '27881409',
            kraPin: '',
            organization: '',
            totalTrips: 3,
            totalSpendKes: 74500,
            notes: 'Books family Noahs & E-Class for Maseno ceremonies.',
          },
          {
            id: 'cli_mercyline',
            name: 'Mercyline Nekesa',
            phone: '+254 724 318 776',
            email: 'mnekesa@westernlogistics.co.ke',
            accountType: 'Corporate / NGO',
            idOrPassport: '29110342',
            kraPin: 'P051883012Z',
            organization: 'Western Agro-Logistics Ltd',
            totalTrips: 5,
            totalSpendKes: 92500,
            notes: 'Frequent Busia border & Bungoma runs; verified DL on file.',
          },
        ];

        await Promise.all(
          seedClients.map(({ id, ...clientData }) =>
            setDoc(doc(db, 'clients', id), {
              ...clientData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
    });

    // 7. Maintenance Logs
    await runSeedSection('maintenance_logs', async () => {
      const maintSnap = await getDocs(query(collection(db, 'maintenance_logs'), limit(1)));
      if (maintSnap.empty) {
        await setDoc(doc(db, 'maintenance_logs', 'maint_1'), {
          vehicleId: 'toyota-corolla-fielder',
          vehicleName: 'Toyota Corolla Fielder',
          registrationPlate: 'KDL 245T',
          serviceDate: addDaysIso(0),
          odometerKm: 92600,
          costKes: 14500,
          partsReplaced: 'Engine oil 5W-30, oil & air filters, front brake pads',
          notes: 'Scheduled 5,000 km Kisumu workshop service',
          nextDueKm: 97600,
          nextDueDate: addDaysIso(60),
          createdAt: serverTimestamp(),
        });
      }
    });

    // 8. CMS: Journal, Destinations, Testimonials
    await runSeedSection('journal', async () => {
      const journalSnap = await getDocs(query(collection(db, 'journal'), limit(1)));
      if (journalSnap.empty) {
        await Promise.all(
          JOURNAL_ARTICLES.map((art) =>
            setDoc(doc(db, 'journal', art.slug), {
              slug: art.slug,
              title: art.title,
              category: art.category,
              publishedAt: art.publishedAt,
              readTime: art.readTime,
              image: art.image,
              excerpt: art.excerpt,
              body: art.sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n'),
              recommendedRouteSlug: art.recommendedRouteSlug,
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
    });

    await runSeedSection('destinations', async () => {
      const destSnap = await getDocs(query(collection(db, 'destinations'), limit(1)));
      if (destSnap.empty) {
        await Promise.all(
          DESTINATIONS.map((dest) =>
            setDoc(doc(db, 'destinations', dest.slug), {
              slug: dest.slug,
              name: dest.name,
              county: dest.county,
              distanceFromKisumu: dest.distanceFromKisumu,
              driveTime: dest.driveTime,
              recommendedVehicle: dest.recommendedVehicle,
              recommendedVehicleId: dest.recommendedVehicleId,
              image: dest.image,
              summary: dest.summary,
              roadConditions: dest.roadConditions,
              localTipsText: dest.localTips.join('\n'),
              featuredOnHome: dest.featuredOnHome,
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
    });

    await runSeedSection('testimonials', async () => {
      const testSnap = await getDocs(query(collection(db, 'testimonials'), limit(1)));
      if (testSnap.empty) {
        await Promise.all(
          TESTIMONIALS.map((t) =>
            setDoc(doc(db, 'testimonials', t.id), {
              quote: t.quote,
              clientName: t.clientName,
              role: t.role,
              context: t.context,
              route: t.route,
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
    });
  })().finally(() => {
    activeSeedPromise = null;
  });

  return activeSeedPromise;
}
