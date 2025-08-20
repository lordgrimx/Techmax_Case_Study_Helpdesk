'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  UsersIcon, 
  SearchIcon, 
  EditIcon, 
  TrashIcon, 
  PlusIcon,
  UserCheckIcon,
  UserXIcon,
  SettingsIcon
} from 'lucide-react';

// API Functions
const fetchUsers = async (searchTerm = '') => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const url = searchTerm 
    ? `http://localhost:8000/api/v1/users?search=${encodeURIComponent(searchTerm)}`
    : 'http://localhost:8000/api/v1/users';

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

const fetchRoles = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch('http://localhost:8000/api/v1/roles', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }

  return response.json();
};

const updateUserRole = async (userId, roleId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role_id: roleId }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to update user role');
  }

  return response.json();
};

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

const UserCard = ({ user, roles, onRoleUpdate, isUpdating }) => {
  const [selectedRoleId, setSelectedRoleId] = useState(user.role_id || '');

  // user.role_id değiştiğinde selectedRoleId'yi güncelle
  useEffect(() => {
    setSelectedRoleId(user.role_id || '');
  }, [user.role_id]);

  const handleRoleChange = (newRoleId) => {
    if (newRoleId && newRoleId !== user.role_id.toString()) {
      setSelectedRoleId(newRoleId);
      onRoleUpdate(user.id, parseInt(newRoleId));
    }
  };

  const getRoleName = (roleId) => {
    const role = roles?.find(r => r.id === roleId);
    return role ? role.name : 'Rol Atanmamış';
  };

  const getRoleColor = (roleId) => {
    const roleColors = {
      1: 'bg-blue-100 text-blue-800',   // Customer
      2: 'bg-green-100 text-green-800', // Agent
      3: 'bg-orange-100 text-orange-800', // Supervisor
      4: 'bg-purple-100 text-purple-800', // Admin
    };
    return roleColors[roleId] || 'bg-gray-100 text-gray-600';
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 bg-white border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{user.full_name}</h3>
            <p className="text-gray-700 truncate">{user.email}</p>
            <p className="text-sm text-gray-600 truncate">@{user.username}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getRoleColor(user.role_id)}`}>
            {getRoleName(user.role_id)}
          </span>
          <div className="flex items-center">
            {user.is_active ? (
              <div className="flex items-center text-green-600">
                <UserCheckIcon className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">Aktif</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <UserXIcon className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">Pasif</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-600 font-medium">Telefon:</span>
          <p className="text-gray-800 mt-1 break-words">
            {user.phone || <span className="text-gray-500 italic">Girilmemiş</span>}
          </p>
        </div>
        <div>
          <span className="text-gray-600 font-medium">Departman:</span>
          <p className="text-gray-800 mt-1 break-words">
            {user.department || <span className="text-gray-500 italic">Girilmemiş</span>}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rol Değiştir:
        </label>
        <div className="flex items-center space-x-2">
          <select
            value={selectedRoleId}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={isUpdating}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-700 bg-white"
          >
            {roles?.map((role) => (
              <option key={role.id} value={role.id} className="text-gray-700">
                {role.name}
              </option>
            ))}
          </select>
          {isUpdating && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 flex-shrink-0"></div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Kayıt Tarihi: {new Date(user.created_at).toLocaleDateString('tr-TR')}
        </p>
      </div>
    </Card>
  );
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [updatingUsers, setUpdatingUsers] = useState(new Set());
  const router = useRouter();
  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch current user for authorization
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  // Check if user has admin access
  useEffect(() => {
    if (currentUser && currentUser.role_id !== 4) {
      router.push('/tickets');
    }
  }, [currentUser, router]);

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', debouncedSearchTerm],
    queryFn: () => fetchUsers(debouncedSearchTerm),
    retry: false,
    enabled: currentUser?.role_id === 4,
  });

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    retry: false,
    enabled: currentUser?.role_id === 4,
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }) => updateUserRole(userId, roleId),
    onMutate: ({ userId }) => {
      setUpdatingUsers(prev => new Set([...prev, userId]));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
    },
    onSettled: (data, error, variables) => {
      // variables.userId kullanarak doğru user ID'yi al
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.userId);
        return newSet;
      });
    },
  });

  const handleRoleUpdate = (userId, roleId) => {
    updateRoleMutation.mutate({ userId, roleId });
  };

  if (currentUser?.role_id !== 4) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserXIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erişim Reddedildi</h3>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Kullanıcı Yönetimi
              </h1>
              <p className="text-gray-600 text-lg">
                Tüm kullanıcıları görüntüleyin ve rollerini yönetin
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <SettingsIcon className="w-4 h-4" />
              <span>Admin Paneli</span>
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
        {usersError && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Kullanıcılar yüklenirken hata oluştu: {usersError.message}
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          {usersLoading ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="h-3 bg-gray-300 rounded w-full"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="h-8 bg-gray-300 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Kullanıcı bulunamadı</h3>
              <p className="text-gray-500">Arama kriterlerinize uygun kullanıcı bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  roles={roles}
                  onRoleUpdate={handleRoleUpdate}
                  isUpdating={updatingUsers.has(user.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
