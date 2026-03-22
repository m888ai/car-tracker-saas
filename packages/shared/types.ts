// Shared types between web, mobile, and API

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  plan: 'FREE' | 'PRO' | 'BUSINESS';
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  nickname?: string;
  color?: string;
  vin?: string;
  licensePlate?: string;
  currentMileage?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRecord {
  id: string;
  carId: string;
  date: string;
  type: ServiceType;
  customType?: string;
  description: string;
  mileage?: number;
  cost: number;
  vendor?: string;
  location?: string;
  notes?: string;
  receiptUrl?: string;
  photos?: string[];
  reminderMiles?: number;
  reminderDate?: string;
  createdAt: string;
}

export type ServiceType =
  | 'OIL_CHANGE'
  | 'TIRES'
  | 'BRAKES'
  | 'BATTERY'
  | 'TRANSMISSION'
  | 'INSPECTION'
  | 'REGISTRATION'
  | 'INSURANCE'
  | 'WASH_DETAIL'
  | 'REPAIR'
  | 'MAINTENANCE'
  | 'UPGRADE'
  | 'FUEL'
  | 'OTHER';

export const SERVICE_TYPE_INFO: Record<ServiceType, { label: string; icon: string }> = {
  OIL_CHANGE: { label: 'Oil Change', icon: '🛢️' },
  TIRES: { label: 'Tires', icon: '🛞' },
  BRAKES: { label: 'Brakes', icon: '🛑' },
  BATTERY: { label: 'Battery', icon: '🔋' },
  TRANSMISSION: { label: 'Transmission', icon: '⚙️' },
  INSPECTION: { label: 'Inspection', icon: '📋' },
  REGISTRATION: { label: 'Registration', icon: '📄' },
  INSURANCE: { label: 'Insurance', icon: '🛡️' },
  WASH_DETAIL: { label: 'Wash/Detail', icon: '🧼' },
  REPAIR: { label: 'Repair', icon: '🔧' },
  MAINTENANCE: { label: 'Maintenance', icon: '🔩' },
  UPGRADE: { label: 'Upgrade', icon: '⬆️' },
  FUEL: { label: 'Fuel', icon: '⛽' },
  OTHER: { label: 'Other', icon: '📝' },
};

export interface ComparableSale {
  id: string;
  carId: string;
  source: string;
  sourceName: string;
  sourceUrl?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  saleDate: string;
  mileage?: number;
  condition?: string;
  transmission?: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  createdAt: string;
}

export interface ValuationEstimate {
  low: number;
  mid: number;
  high: number;
  confidence: 'low' | 'medium' | 'high';
  basedOn: number;
}

export interface SpendingSummary {
  year: number;
  total: number;
  byCategory: Record<string, number>;
  byCar: { carId: string; name: string; total: number }[];
  byMonth: { month: string; total: number }[];
}
