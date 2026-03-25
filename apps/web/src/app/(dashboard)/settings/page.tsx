'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.me,
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 py-3 border-b">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Display Name</p>
              <p className="font-medium text-gray-900">{profile?.name || user?.displayName || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-b">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-b">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium text-gray-900">
                {profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM d, yyyy') : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{profile?._count?.cars || 0}</p>
              <p className="text-sm text-gray-600">Vehicles</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Total Services</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
