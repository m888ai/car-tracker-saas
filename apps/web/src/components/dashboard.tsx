'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Car, Plus, Settings, DollarSign, Wrench } from 'lucide-react';

export function Dashboard() {
  const { user, signOut } = useAuth();
  
  const { data: cars, isLoading } = useQuery({
    queryKey: ['cars'],
    queryFn: () => api.getCars(),
  });

  const { data: spending } = useQuery({
    queryKey: ['spending'],
    queryFn: () => api.getSpending(),
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <h1 className="text-xl font-bold">Car Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {spending && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 text-white rounded-2xl p-6">
              <div className="text-sm text-gray-400">Total Spent</div>
              <div className="text-3xl font-bold mt-1">
                ${spending.total?.toLocaleString() || 0}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-sm text-gray-500">This Year</div>
              <div className="text-2xl font-bold mt-1">
                ${spending.total?.toLocaleString() || 0}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-sm text-gray-500">Vehicles</div>
              <div className="text-2xl font-bold mt-1">
                {(cars as any[])?.length || 0}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition">
            <Plus size={20} />
            Add Vehicle
          </button>
          <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 transition">
            <Wrench size={20} />
            Add Service
          </button>
        </div>

        {/* Vehicles */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">My Vehicles</h2>
          
          {isLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
              Loading...
            </div>
          ) : (cars as any[])?.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
              <Car className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No vehicles yet</p>
              <button className="mt-4 text-blue-500 hover:underline">
                Add your first car
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(cars as any[])?.map((car: any) => (
                <div
                  key={car.id}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                      🚗
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {car.year} {car.make} {car.model}
                      </h3>
                      {car.nickname && (
                        <p className="text-blue-500 text-sm">{car.nickname}</p>
                      )}
                      {car.currentMileage && (
                        <p className="text-gray-500 text-sm mt-1">
                          {car.currentMileage.toLocaleString()} miles
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
