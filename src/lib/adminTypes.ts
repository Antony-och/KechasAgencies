import { FleetCategoryId } from '../data/fleet';

export type StaffRole = 'admin' | 'dispatcher';
export type StaffStatus = 'active' | 'disabled';

export interface SiteSettingsDoc {
  companyName: string;
  phoneDisplay: string;
  whatsappNumber: string;
  email: string;
  address: string;
  mpesaPaybill: string;
  mpesaAccount: string;
  vatEnabled: boolean;
  vatRatePercent: number;
  chauffeurDailyFeeKes?: number;
  dispatchHours?: string;
  kraPin?: string;
  bankDetails?: string;
  bookingTermsSummary?: string;
  updatedAt?: unknown;
}

export interface StaffMemberDoc {
  uid: string;
  email: string;
  fullName: string;
  role: StaffRole;
  status: StaffStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StaffInviteDoc {
  id: string;
  email: string;
  fullName: string;
  role: StaffRole;
  invitedBy: string;
  createdAt?: unknown;
}

export type VehicleStatus = 'Available' | 'Booked' | 'In Maintenance' | 'Inactive';

export interface VehicleDoc {
  id: string;
  name: string;
  category: FleetCategoryId;
  categoryLabel: string;
  registrationPlate: string;
  dailyRateKes: number;
  selfDriveRateKes: number;
  selfDriveAvailable: boolean;
  chauffeurAvailable: boolean;
  passengers: number;
  luggage: number;
  transmission: string;
  fuelType: string;
  terrain: string;
  highlight: string;
  image: string;
  currentOdometerKm: number;
  nextServiceKm: number;
  nextServiceDate: string;
  insuranceExpiryDate: string;
  ntsaExpiryDate: string;
  status: VehicleStatus;
  updatedAt?: unknown;
}

export interface MaintenanceLogDoc {
  id: string;
  vehicleId: string;
  vehicleName: string;
  registrationPlate: string;
  serviceDate: string;
  odometerKm: number;
  costKes: number;
  partsReplaced: string;
  notes?: string;
  nextDueKm?: number;
  nextDueDate?: string;
  createdAt?: unknown;
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty';

export interface DriverDoc {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  assignedVehicleId?: string;
  assignedVehicleName?: string;
  specialties: string;
  status: DriverStatus;
  tripCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Deposit Paid' | 'Paid in Full';
export type BookingSource = 'Online' | 'WhatsApp' | 'Walk-In' | 'Phone';

export interface BookingDoc {
  id: string;
  bookingRef: string;
  serviceType: 'chauffeur' | 'self-drive' | 'airport-transfer';
  vehicleId: string;
  vehicleName: string;
  registrationPlate?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  rentalDays: number;
  flightNumber?: string;
  notes?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  quotedAmountKes: number;
  amountPaidKes: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  source: BookingSource;
  odometerOut?: number;
  fuelOut?: string;
  conditionOut?: string;
  handoverPassedItems?: string[];
  handoverFlaggedItems?: string[];
  handoverCompletedBy?: string;
  handoverCompletedAt?: string;
  odometerIn?: number;
  fuelIn?: string;
  damageNotes?: string;
  returnPassedItems?: string[];
  returnFlaggedItems?: string[];
  returnCompletedBy?: string;
  returnCompletedAt?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type PaymentMethod =
  | 'M-Pesa Paybill/STK'
  | 'Bank Transfer'
  | 'Cash'
  | 'Corporate/NGO Monthly Invoice';

export interface TransactionDoc {
  id: string;
  bookingId: string;
  bookingRef: string;
  clientName: string;
  clientType?: string;
  method: PaymentMethod;
  mpesaCode?: string;
  amountKes: number;
  notes?: string;
  paidAt: string;
  recordedByEmail: string;
  createdAt?: unknown;
}

export type ClientAccountType = 'Individual / Diaspora' | 'Tourist' | 'Corporate / NGO';

export interface ClientAccountDoc {
  id: string;
  name: string;
  phone: string;
  email?: string;
  accountType: ClientAccountType;
  idOrPassport?: string;
  kraPin?: string;
  organization?: string;
  totalTrips: number;
  totalSpendKes: number;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface JournalPostDoc {
  id: string;
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  readTime: string;
  image: string;
  excerpt: string;
  body: string;
  recommendedRouteSlug?: string;
  updatedAt?: unknown;
}

export interface DestinationDoc {
  id: string;
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
  localTipsText?: string;
  featuredOnHome: boolean;
  updatedAt?: unknown;
}

export interface TestimonialDoc {
  id: string;
  quote: string;
  clientName: string;
  role: string;
  context: string;
  route: string;
  updatedAt?: unknown;
}

export type InquiryTopic = 'Vehicle Hire' | 'KIS Airport Pickup' | 'Corporate / NGO' | 'Custom Route';
export type ReplyChannel = 'WhatsApp' | 'Phone Call' | 'Email';
export type InquiryStatus = 'New' | 'Contacted' | 'Converted' | 'Archived';

export interface InquiryDoc {
  id: string;
  reference: string;
  topic: InquiryTopic;
  name: string;
  organization?: string;
  phone?: string;
  email?: string;
  vehicleClass: string;
  travelDate?: string;
  replyVia: ReplyChannel;
  message: string;
  status: InquiryStatus;
  bookingRef?: string;
  handledBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
