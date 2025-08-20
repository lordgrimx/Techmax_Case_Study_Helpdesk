'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const departments = [
  'Bilgi İşlem',
  'İnsan Kaynakları',
  'Muhasebe',
  'Pazarlama',
  'Satış',
  'Üretim',
  'Kalite Kontrol',
  'Lojistik',
  'Diğer'
];

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          full_name: data.full_name,
          password: data.password,
          phone: data.phone || null,
          department: data.department || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Kayıt başarılı, giriş sayfasına yönlendir
        router.push('/login?message=Kayıt başarılı, giriş yapabilirsiniz');
      } else {
        const errorData = await response.json();
        setError('root', { message: errorData.detail || 'Kayıt işlemi başarısız' });
      }
    } catch (error) {
      setError('root', { message: 'Bağlantı hatası' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[50rem] h-[50rem] bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-3xl" />
      </div>
      
      <Card className="relative w-full max-w-4xl bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Hesap Oluşturun</CardTitle>
          <CardDescription className="text-blue-100 text-lg">
            Yardım masası sistemine katılın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white font-medium">Ad Soyad *</Label>
                <Input
                  id="full_name"
                  type="text"
                  {...register('full_name', { 
                    required: 'Ad soyad gereklidir',
                    minLength: {
                      value: 2,
                      message: 'En az 2 karakter olmalıdır'
                    }
                  })}
                  placeholder="Adınızı ve soyadınızı girin"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
                />
                {errors.full_name && (
                  <p className="text-sm text-red-300">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white font-medium">Kullanıcı Adı *</Label>
                <Input
                  id="username"
                  type="text"
                  {...register('username', { 
                    required: 'Kullanıcı adı gereklidir',
                    minLength: {
                      value: 3,
                      message: 'En az 3 karakter olmalıdır'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Sadece harf, rakam ve _ kullanabilirsiniz'
                    }
                  })}
                  placeholder="Kullanıcı adınızı girin"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
                />
                {errors.username && (
                  <p className="text-sm text-red-300">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">E-posta *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { 
                  required: 'E-posta gereklidir',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Geçerli bir e-posta adresi girin'
                  }
                })}
                placeholder="E-posta adresinizi girin"
                className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
              />
              {errors.email && (
                <p className="text-sm text-red-300">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Şifre *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'Şifre gereklidir',
                    minLength: {
                      value: 6,
                      message: 'Şifre en az 6 karakter olmalıdır'
                    }
                  })}
                  placeholder="Şifrenizi girin"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
                />
                {errors.password && (
                  <p className="text-sm text-red-300">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-white font-medium">Şifre Tekrar *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  {...register('confirm_password', { 
                    required: 'Şifre tekrarı gereklidir',
                    validate: value =>
                      value === password || 'Şifreler eşleşmiyor'
                  })}
                  placeholder="Şifrenizi tekrar girin"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
                />
                {errors.confirm_password && (
                  <p className="text-sm text-red-300">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white font-medium">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9+\-\s()]*$/,
                      message: 'Geçerli bir telefon numarası girin'
                    }
                  })}
                  placeholder="Telefon numaranızı girin"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
                />
                {errors.phone && (
                  <p className="text-sm text-red-300">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-white font-medium">Departman</Label>
                <select
                  id="department"
                  {...register('department')}
                  className="flex h-10 w-full rounded-md border bg-white/10 border-white/20 text-white px-3 py-2 text-sm focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
                >
                  <option value="" className="text-gray-900">Departman seçin</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="text-gray-900">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errors.root && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm">
                {errors.root.message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Hesap oluşturuluyor...
                </div>
              ) : (
                'Hesap Oluştur'
              )}
            </Button>

            <div className="text-center">
              <span className="text-blue-200">Zaten hesabınız var mı? </span>
              <Link href="/login" className="text-blue-300 hover:text-white font-medium underline underline-offset-4 hover:underline-offset-2 transition-all duration-200">
                Giriş yapın
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
