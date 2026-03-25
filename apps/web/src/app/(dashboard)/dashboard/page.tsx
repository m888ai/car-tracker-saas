'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi, DashboardStats } from '@/lib/api';
import { Car, Wrench, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: usersApi.stats,
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
        Failed to load dashboard. Please try again.
      </div>
    );
  }

  const statCards = [
    { label: 'Cars', value: stats?.totalCars || 0, icon: Car, color: 'bg-blue-500' },
    { label: 'Services', value: stats?.totalServices || 0, icon: Wrench, color: 'bg-green-500' },
    { label: 'Spent', value: `$${(stats?.totalSpent || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-orange-500' },
    { label: 'Value', value: `$${(stats?.totalEstimatedValue || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your vehicles</p>
      </div>

      {/* Stats Grid - 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} p-2 lg:p-3 rounded-lg`}>
                <stat.icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">{stat.label}</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Mobile prominent */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:hidden">
        <Link
          href="/cars/new"
          className="flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-xl font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Car
        </Link>
        <Link
          href="/services/new"
          className="flex items-center justify-center gap-2 bg-green-600 text-white p-4 rounded-xl font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </Link>
      </div>

      {/* Recent Services */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Services</h2>
          <Link href="/services" className="text-blue-600 text-sm hover:underline">
            View All
          </Link>
        </div>
        {stats?.recentServices && stats.recentServices.length > 0 ? (
          <div className="space-y-3">
            {stats.recentServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{service.category}</p>
                  <p className="text-xs text-gray-500">
                    {service.car?.make} {service.car?.model} • {format(new Date(service.date), 'MMM d')}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 ml-4">${service.cost.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No services recorded yet</p>
            <Link
              href="/services/new"
              className="inline-block mt-3 text-blue-600 text-sm font-medium"
            >
              Add your first service →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions - Desktop */}
      <div className="hidden lg:grid grid-cols-2 gap-6">
        <Link
          href="/cars/new"
          className="flex items-center justify-center gap-3 p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <Car className="w-8 h-8 text-blue-600" />
          <span className="font-medium text-blue-600 text-lg">Add New Car</span>
        </Link>
        <Link
          href="/services/new"
          className="flex items-center justify-center gap-3 p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
        >
          <Wrench className="w-8 h-8 text-green-600" />
          <span className="font-medium text-green-600 text-lg">Log Service</span>
        </Link>
      </div>
    </div>
  );
}
