'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserIcon, 
  MailIcon, 
  PhoneIcon, 
  BuildingIcon, 
  SaveIcon,
  CameraIcon,
  EditIcon,
  ShieldIcon,
  CalendarIcon,
  BadgeCheckIcon,
  KeyIcon,
  HistoryIcon
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    profile_image: ''
  });

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          full_name: userData.full_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          department: userData.department || '',
          profile_image: userData.profile_image || ''
        });
      } else {
        // Token geçersizse login'e yönlendir
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profile_image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'supervisor': 'bg-blue-100 text-blue-800 border-blue-200',
      'agent': 'bg-green-100 text-green-800 border-green-200',
      'customer': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role?.toLowerCase()] || colors.customer;
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        // Başarı mesajı gösterilebilir
      } else {
        console.error('Failed to update profile');
        // Hata mesajı gösterilebilir
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Hata mesajı gösterilebilir
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="h-24 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative">
          {/* Background Gradient */}
          <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            {/* Decorative Elements */}
            <div className="absolute top-4 right-4">
              <div className="w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            </div>
            <div className="absolute bottom-4 left-4">
              <div className="w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Profile Info Overlay */}
          <div className="absolute -bottom-16 left-8 flex items-end space-x-6">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-white shadow-xl border-4 border-white overflow-hidden">
                {user.profile_image || formData.profile_image ? (
                  <Image 
                    src={formData.profile_image || user.profile_image} 
                    alt="Profile" 
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {getInitials(user.full_name)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Camera Icon for Upload */}
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <CameraIcon className="w-8 h-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-white mb-2">{user.full_name}</h1>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role_name || user.role)}`}>
                  <BadgeCheckIcon className="w-4 h-4 inline mr-1" />
                  {user.role_name || user.role}
                </span>
                <span className="text-blue-100 text-sm">@{user.username}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-6 right-6">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)} 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
              >
                <EditIcon className="w-4 h-4 mr-2" />
                Profili Düzenle
              </Button>
            ) : (
              <div className="space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  İptal
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-20">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-blue-100/50">
              <CardHeader className="border-b border-gray-100/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Kişisel Bilgiler</h3>
                    <p className="text-sm text-gray-500">Profil bilgilerinizi güncelleyin</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                      Ad Soyad
                    </Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Adınızı ve soyadınızı girin"
                      />
                    ) : (
                      <div className="h-12 bg-gray-50/50 border border-gray-200 rounded-md px-3 flex items-center">
                        <span className="text-gray-900 font-medium">{user.full_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                      <MailIcon className="w-4 h-4 mr-2 text-gray-400" />
                      E-posta Adresi
                    </Label>
                    <div className="h-12 bg-gray-50/30 border border-gray-200 rounded-md px-3 flex items-center">
                      <span className="text-gray-600">{user.email}</span>
                      <span className="ml-auto text-xs text-gray-400">Değiştirilemez</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                      Telefon Numarası
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Telefon numaranızı girin"
                      />
                    ) : (
                      <div className="h-12 bg-gray-50/50 border border-gray-200 rounded-md px-3 flex items-center">
                        <span className="text-gray-900 font-medium">
                          {user.phone || 'Telefon numarası belirtilmemiş'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-semibold text-gray-700 flex items-center">
                      <BuildingIcon className="w-4 h-4 mr-2 text-gray-400" />
                      Departman
                    </Label>
                    <div className="h-12 bg-gray-50/30 border border-gray-200 rounded-md px-3 flex items-center">
                      <span className="text-gray-600">
                        {user.department || 'Departman belirtilmemiş'}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">Yönetici tarafından atanır</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Overview */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-blue-100/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Hesap Özeti</h3>
                    <p className="text-sm text-gray-500">Aktivite ve istatistikleriniz</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Aktif Ticket</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Çözülen Ticket</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Ortalama Süre</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <div className="text-2xl font-bold text-orange-600">100%</div>
                    <div className="text-sm text-gray-600">Memnuniyet</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Account Status */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-blue-100/50">
              <CardHeader className="border-b border-gray-100/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <ShieldIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Hesap Durumu</h3>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Hesap Durumu</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Kullanıcı ID</span>
                    <span className="text-sm text-gray-900 font-mono">#{user.id}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Üyelik Tarihi</span>
                    <span className="text-sm text-gray-900">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl shadow-blue-100/50">
              <CardHeader className="border-b border-blue-200/50">
                <CardTitle className="flex items-center space-x-3 text-blue-900">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <KeyIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Güvenlik & Gizlilik</h3>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white/50 border-blue-300 text-blue-700 hover:bg-blue-100 h-12"
                >
                  <KeyIcon className="w-4 h-4 mr-3" />
                  Şifre Değiştir
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white/50 border-blue-300 text-blue-700 hover:bg-blue-100 h-12"
                >
                  <HistoryIcon className="w-4 h-4 mr-3" />
                  Oturum Geçmişi
                </Button>
                
                <div className="pt-4 border-t border-blue-200/50">
                  <div className="text-xs text-blue-600 bg-blue-100/50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <ShieldIcon className="w-3 h-3" />
                      <span className="font-medium">Güvenlik İpucu</span>
                    </div>
                    <p>Güçlü şifre kullanın ve düzenli olarak güncelleyin.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
