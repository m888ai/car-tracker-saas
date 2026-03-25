import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  type?: string;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage: number;
  photoUrl?: string;
  notes?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  createdAt: string;
  stats?: {
    serviceCount: number;
    totalSpent: number;
    avgCostPerService: number;
  };
}

export interface ServiceRecord {
  id: string;
  carId: string;
  category: string;
  description?: string;
  cost: number;
  mileage?: number;
  date: string;
  location?: string;
  receiptUrl?: string;
  notes?: string;
  car?: { make: string; model: string };
}

export interface Valuation {
  id: string;
  carId: string;
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  confidence: number;
  salesCount: number;
}

export interface DashboardStats {
  totalCars: number;
  totalServices: number;
  totalSpent: number;
  totalEstimatedValue: number;
  recentServices: ServiceRecord[];
}

// API calls
export const carsApi = {
  list: () => api.get<Car[]>('/api/cars').then((r) => r.data),
  get: (id: string) => api.get<Car>(`/api/cars/${id}`).then((r) => r.data),
  create: (data: Partial<Car>) => api.post<Car>('/api/cars', data).then((r) => r.data),
  update: (id: string, data: Partial<Car>) => api.patch<Car>(`/api/cars/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/cars/${id}`),
  stats: (id: string) => api.get(`/api/cars/${id}/stats`).then((r) => r.data),
};

export const servicesApi = {
  list: (carId?: string) => api.get<ServiceRecord[]>('/api/services', { params: { carId } }).then((r) => r.data),
  get: (id: string) => api.get<ServiceRecord>(`/api/services/${id}`).then((r) => r.data),
  create: (data: Partial<ServiceRecord>) => api.post<ServiceRecord>('/api/services', data).then((r) => r.data),
  update: (id: string, data: Partial<ServiceRecord>) => api.patch<ServiceRecord>(`/api/services/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/services/${id}`),
  analytics: (year?: number, carId?: string) => api.get('/api/services/analytics/spending', { params: { year, carId } }).then((r) => r.data),
};

export const valuationsApi = {
  get: (carId: string) => api.get(`/api/valuations/car/${carId}`).then((r) => r.data),
  addSale: (data: any) => api.post('/api/valuations/sales', data).then((r) => r.data),
  deleteSale: (id: string) => api.delete(`/api/valuations/sales/${id}`).then((r) => r.data),
  recalculate: (carId: string) => api.post(`/api/valuations/recalculate/${carId}`).then((r) => r.data),
};

export const usersApi = {
  me: () => api.get('/api/users/me').then((r) => r.data),
  update: (data: any) => api.patch('/api/users/me', data).then((r) => r.data),
  stats: () => api.get<DashboardStats>('/api/users/me/stats').then((r) => r.data),
};

export default api;
