import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Users
  getMe: () => request('/api/users/me'),

  // Cars
  getCars: () => request('/api/cars'),
  getCar: (id: string) => request(`/api/cars/${id}`),
  createCar: (data: any) => request('/api/cars', { method: 'POST', body: JSON.stringify(data) }),
  updateCar: (id: string, data: any) => request(`/api/cars/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCar: (id: string) => request(`/api/cars/${id}`, { method: 'DELETE' }),
  getCarStats: (id: string) => request(`/api/cars/${id}/stats`),

  // Services
  getServices: (carId?: string) => request(`/api/services${carId ? `?carId=${carId}` : ''}`),
  createService: (data: any) => request('/api/services', { method: 'POST', body: JSON.stringify(data) }),
  deleteService: (id: string) => request(`/api/services/${id}`, { method: 'DELETE' }),
  getSpending: (year?: number) => request(`/api/services/spending${year ? `?year=${year}` : ''}`),

  // Valuations
  getValuation: (carId: string) => request(`/api/valuations/cars/${carId}`),
  addComparableSale: (data: any) => request('/api/valuations/sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteComparableSale: (id: string) => request(`/api/valuations/sales/${id}`, { method: 'DELETE' }),
};
