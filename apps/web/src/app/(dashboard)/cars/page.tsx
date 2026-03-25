'use client';

import { useQuery } from '@tanstack/react-query';
import { carsApi, Car } from '@/lib/api';
import { Plus, Car as CarIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CarsPage() {
  const { data: cars, isLoading, error } = useQuery<Car[]>({
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

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Failed to load cars. Please try again.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Cars</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your vehicles</p>
        </div>
        <Link
          href="/cars/new"
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 lg:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
        >
          <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="hidden sm:inline">Add Car</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {cars && cars.length > 0 ? (
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
          {cars.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.id}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex lg:flex-col"
            >
              {/* Image - smaller on mobile */}
              <div className="w-24 h-24 lg:w-full lg:h-40 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
                {car.photoUrl ? (
                  <img src={car.photoUrl} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                ) : (
                  <CarIcon className="w-10 h-10 lg:w-16 lg:h-16 text-gray-500" />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 p-3 lg:p-4 flex items-center lg:block">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 lg:text-lg">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {car.mileage?.toLocaleString() || 0} miles
                  </p>
                  {car.stats && (
                    <div className="hidden lg:flex items-center gap-4 mt-3 text-sm">
                      <span className="text-gray-600">
                        {car.stats.serviceCount} services
                      </span>
                      <span className="text-gray-600">
                        ${car.stats.totalSpent.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 lg:hidden" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 lg:p-12 text-center">
          <CarIcon className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No cars yet</h3>
          <p className="text-gray-500 text-sm lg:text-base mb-6">Add your first vehicle to start tracking</p>
          <Link
            href="/cars/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Car
          </Link>
        </div>
      )}
    </div>
  );
}
