'use client';

import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import { DollarSign } from 'lucide-react';

export default function SpendingPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['spending-analytics'],
    queryFn: () => servicesApi.analytics(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Spending Analytics</h1>
        <p className="text-gray-600 mt-1">Track your vehicle expenses over time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600">Total Spent ({analytics?.year})</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${(analytics?.totalSpent || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600">Total Services</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{analytics?.serviceCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600">Avg per Service</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${analytics?.serviceCount > 0 ? Math.round(analytics.totalSpent / analytics.serviceCount).toLocaleString() : 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending</h2>
          <div className="space-y-3">
            {analytics?.monthly?.map((m: { month: number; total: number }) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="w-12 text-sm text-gray-600">{months[m.month - 1]}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{
                      width: `${analytics.totalSpent > 0 ? (m.total / analytics.totalSpent) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-20 text-right text-sm font-medium text-gray-900">
                  ${m.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By Category</h2>
          {analytics?.byCategory && Object.keys(analytics.byCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.byCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-gray-700 capitalize">{category.replace('_', ' ')}</span>
                    <span className="font-semibold text-gray-900">${(amount as number).toLocaleString()}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No spending data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
