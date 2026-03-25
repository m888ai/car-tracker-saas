'use client';

import { useQuery } from '@tanstack/react-query';
import { servicesApi, ServiceRecord } from '@/lib/api';
import { Plus, Wrench } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const categoryEmojis: Record<string, string> = {
  oil_change: '🛢️',
  tires: '🛞',
  brakes: '🛑',
  battery: '🔋',
  transmission: '⚙️',
  engine: '🔧',
  suspension: '🚗',
  electrical: '⚡',
  ac_heating: '❄️',
  inspection: '📋',
  wash_detail: '🧼',
  other: '🔩',
};

export default function ServicesPage() {
  const { data: services, isLoading, error } = useQuery<ServiceRecord[]>({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
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
        Failed to load services. Please try again.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Track all your vehicle maintenance</p>
        </div>
        <Link
          href="/services/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </Link>
      </div>

      {services && services.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mileage</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoryEmojis[service.category] || '🔧'}</span>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{service.category.replace('_', ' ')}</p>
                        {service.description && (
                          <p className="text-sm text-gray-500">{service.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {service.car?.make} {service.car?.model}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {format(new Date(service.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {service.mileage?.toLocaleString() || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ${service.cost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your vehicle maintenance</p>
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Service
          </Link>
        </div>
      )}
    </div>
  );
}
