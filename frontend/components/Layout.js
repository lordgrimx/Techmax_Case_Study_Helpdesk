'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { TicketIcon, UserIcon, LogOutIcon, MenuIcon, XIcon, UsersIcon, SettingsIcon, BarChart3Icon } from 'lucide-react';

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      throw new Error('Failed to fetch user');
    }

    return response.json();
  };

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
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
        } else {
          // Token geçersizse temizle
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  // Role-based navigation
  const getNavigationItems = () => {
    const baseNav = [
      { name: 'Tickets', href: '/tickets', icon: TicketIcon },
    ];

    // currentUser veya user'dan role bilgisini al
    const userRoleId = currentUser?.role_id || user?.role_id;
    const userRole = currentUser?.role_name || user?.role_name;

    if (!userRoleId && !userRole) return baseNav;

    // role_id 3 olanlar için Agent Users sayfası
    if (userRoleId === 3) {
      return [
        ...baseNav,
        { name: 'Agent Kullanıcıları', href: '/agent-users', icon: UsersIcon },
      ];
    }

    // role_id 4 (Admin) olanlar için
    if (userRoleId === 4 || userRole === 'admin') {
      return [
        ...baseNav,
        { name: 'Kullanıcılar', href: '/users', icon: UsersIcon },
        { name: 'Agent Kullanıcıları', href: '/agent-users', icon: UsersIcon },
      ];
    }

    // role_id 2 (Agent) olanlar için
    if (userRoleId === 2 || userRole === 'agent') {
      return baseNav; // Sadece tickets
    }

    if (userRole === 'supervisor') {
      return [
        ...baseNav,
        { name: 'Raporlar', href: '/reports', icon: BarChart3Icon },
      ];
    }

    return baseNav;
  };

  const navigation = getNavigationItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/tickets" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Yardım Masası
                </span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Yükleniyor...</span>
                </div>
              ) : user ? (
                <>
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                    <span>Hoş geldin, {user.full_name}</span>
                    {(currentUser?.role_name || user?.role_name) && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {currentUser?.role_id === 4 ? 'ADMIN' : (currentUser?.role_name || user?.role_name)}
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={handleProfile}
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profil
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    Çıkış
                  </Button>
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Giriş yapılmamış
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
