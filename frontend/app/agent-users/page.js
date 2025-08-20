'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsersIcon, SearchIcon, MailIcon, PhoneIcon, BuildingIcon } from 'lucide-react';

const fetchCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch('http://localhost:8000/api/v1/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch user');
  }

  return response.json();
};

const fetchAgentUsers = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch('http://localhost:8000/api/v1/users/agents-customers', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Unauthorized');
    }
    if (response.status === 403) {
      throw new Error('Access denied');
    }
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

export default function AgentUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Fetch current user
  const { data: currentUser, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  // Fetch agent users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['agentUsers'],
    queryFn: fetchAgentUsers,
    retry: false,
    enabled: !!currentUser, // Sadece current user yüklendikten sonra çalışsın
  });

  // Redirect kontrolü
  useEffect(() => {
    if (userError?.message === 'No token found' || userError?.message === 'Unauthorized') {
      router.push('/login');
    }
    if (error?.message === 'No token found' || error?.message === 'Unauthorized') {
      router.push('/login');
    }
    if (error?.message === 'Access denied') {
      router.push('/tickets'); // Erişim reddedilirse tickets sayfasına yönlendir
    }
  }, [userError, error, router]);

  // Erişim kontrolü - sadece role_id 3 olanlar erişebilir
  if (currentUser && ![3].includes(currentUser.role_id)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600 mb-6">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <Button onClick={() => router.push('/tickets')}>
            Ana Sayfaya Dön
          </Button>
        </div>
      </Layout>
    );
  }

  // Filter users based on search term
  const filteredUsers = users?.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Agent Kullanıcıları
              </h1>
              <p className="text-gray-600 text-lg">
                Sistem agent kullanıcılarını görüntüleyebilirsiniz
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-lg">
              <UsersIcon className="w-5 h-5 mr-2" />
              {filteredUsers.length} kullanıcı
            </div>
          </div>

          {/* Search Section */}
          <div className="mt-8">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-700 z-10"/>
              <Input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-700 text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && error.message !== 'No token found' && error.message !== 'Unauthorized' && error.message !== 'Access denied' && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Kullanıcılar yüklenirken hata oluştu: {error.message}
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Kullanıcı bulunamadı' : 'Henüz agent kullanıcısı yok'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Arama kriterlerinize uygun kullanıcı bulunamadı.' : 'Sistem henüz agent kullanıcısı bulunmuyor.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="bg-white/60 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    {/* User Header */}
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Agent
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MailIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      
                      {user.department && (
                        <div className="flex items-center text-sm text-gray-600">
                          <BuildingIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{user.department}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Kayıt: {new Date(user.created_at).toLocaleDateString('tr-TR')}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Aktif' : 'Pasif'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
