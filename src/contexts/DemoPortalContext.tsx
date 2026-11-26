import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';
import {
  BookingDoc,
  ClientAccountDoc,
  DestinationDoc,
  DriverDoc,
  InquiryDoc,
  MaintenanceLogDoc,
  TestimonialDoc,
  TransactionDoc,
  VehicleDoc,
} from '../lib/adminTypes';
import { createInitialDemoPortalState, DemoPortalState } from '../data/demoPortalData';

interface DemoPortalContextValue {
  vehicles: VehicleDoc[];
  setVehicles: Dispatch<SetStateAction<VehicleDoc[]>>;
  drivers: DriverDoc[];
  setDrivers: Dispatch<SetStateAction<DriverDoc[]>>;
  bookings: BookingDoc[];
  setBookings: Dispatch<SetStateAction<BookingDoc[]>>;
  transactions: TransactionDoc[];
  setTransactions: Dispatch<SetStateAction<TransactionDoc[]>>;
  clients: ClientAccountDoc[];
  setClients: Dispatch<SetStateAction<ClientAccountDoc[]>>;
  maintenanceLogs: MaintenanceLogDoc[];
  setMaintenanceLogs: Dispatch<SetStateAction<MaintenanceLogDoc[]>>;
  destinations: DestinationDoc[];
  setDestinations: Dispatch<SetStateAction<DestinationDoc[]>>;
  testimonials: TestimonialDoc[];
  setTestimonials: Dispatch<SetStateAction<TestimonialDoc[]>>;
  inquiries: InquiryDoc[];
  setInquiries: Dispatch<SetStateAction<InquiryDoc[]>>;
  resetDemoData: () => void;
}

const DemoPortalContext = createContext<DemoPortalContextValue | null>(null);

export function DemoPortalProvider({ children }: { children: ReactNode }) {
  const [initial] = useState<DemoPortalState>(() => createInitialDemoPortalState());
  const [vehicles, setVehicles] = useState<VehicleDoc[]>(initial.vehicles);
  const [drivers, setDrivers] = useState<DriverDoc[]>(initial.drivers);
  const [bookings, setBookings] = useState<BookingDoc[]>(initial.bookings);
  const [transactions, setTransactions] = useState<TransactionDoc[]>(initial.transactions);
  const [clients, setClients] = useState<ClientAccountDoc[]>(initial.clients);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLogDoc[]>(
    initial.maintenanceLogs
  );
  const [destinations, setDestinations] = useState<DestinationDoc[]>(initial.destinations);
  const [testimonials, setTestimonials] = useState<TestimonialDoc[]>(initial.testimonials);
  const [inquiries, setInquiries] = useState<InquiryDoc[]>(initial.inquiries);

  function resetDemoData() {
    const fresh = createInitialDemoPortalState();
    setVehicles(fresh.vehicles);
    setDrivers(fresh.drivers);
    setBookings(fresh.bookings);
    setTransactions(fresh.transactions);
    setClients(fresh.clients);
    setMaintenanceLogs(fresh.maintenanceLogs);
    setDestinations(fresh.destinations);
    setTestimonials(fresh.testimonials);
    setInquiries(fresh.inquiries);
  }

  return (
    <DemoPortalContext.Provider
      value={{
        vehicles,
        setVehicles,
        drivers,
        setDrivers,
        bookings,
        setBookings,
        transactions,
        setTransactions,
        clients,
        setClients,
        maintenanceLogs,
        setMaintenanceLogs,
        destinations,
        setDestinations,
        testimonials,
        setTestimonials,
        inquiries,
        setInquiries,
        resetDemoData,
      }}
    >
      {children}
    </DemoPortalContext.Provider>
  );
}

export function useDemoPortal() {
  const ctx = useContext(DemoPortalContext);
  if (!ctx) throw new Error('useDemoPortal must be used inside DemoPortalProvider');
  return ctx;
}
