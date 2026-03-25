'use client';

import { useQuery } from '@tanstack/react-query';
import { carsApi, Car } from '@/lib/api';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ValuationsPage() {
  const { data: cars, isLoading } = useQuery<Car[]>({
    queryKey: ['cars'],
    queryFn: carsApi.list,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Valuations</h1>
        <p className="text-gray-600 mt-1">Track your vehicles' estimated values</p>
      </div>

      {cars && cars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.id}?tab=valuation`}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {car.year} {car.make} {car.model}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {car.mileage?.toLocaleString() || 0} miles
              </p>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">View Valuation</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles to value</h3>
          <p className="text-gray-600 mb-6">Add a car first to track its value</p>
          <Link
            href="/cars/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Car
          </Link>
        </div>
      )}
    </div>
  );
}
