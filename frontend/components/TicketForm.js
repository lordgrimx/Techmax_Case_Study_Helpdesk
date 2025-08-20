'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const priorities = [
  { value: 'düşük', label: 'Düşük' },
  { value: 'orta', label: 'Orta' },
  { value: 'yüksek', label: 'Yüksek' },
  { value: 'acil', label: 'Acil' },
];

const categories = [
  { value: 'donanım', label: 'Donanım' },
  { value: 'yazılım', label: 'Yazılım' },
  { value: 'ağ', label: 'Ağ' },
  { value: 'erişim', label: 'Erişim' },
  { value: 'diğer', label: 'Diğer' },
];

export default function TicketForm({ onSubmit, initialData, isLoading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: initialData || {
      title: '',
      description: '',
      priority: 'orta',
      category: 'diğer',
    },
  });

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Başlık */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-900 font-semibold">Başlık *</Label>
          <Input
            id="title"
            {...register('title', { 
              required: 'Başlık gereklidir',
              minLength: {
                value: 5,
                message: 'Başlık en az 5 karakter olmalıdır'
              }
            })}
            placeholder="Ticket başlığını girin..."
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          {errors.title && (
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Açıklama */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-gray-900 font-semibold">Açıklama *</Label>
          <Textarea
            id="description"
            {...register('description', { 
              required: 'Açıklama gereklidir',
              minLength: {
                value: 10,
                message: 'Açıklama en az 10 karakter olmalıdır'
              }
            })}
            placeholder="Problemi detaylı olarak açıklayın..."
            rows={5}
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
          />
          {errors.description && (
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Öncelik ve Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-gray-900 font-semibold">Öncelik</Label>
            <select
              id="priority"
              {...register('priority')}
              className="w-full bg-white border-gray-300 text-gray-900 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-900 font-semibold">Kategori</Label>
            <select
              id="category"
              {...register('category')}
              className="w-full bg-white border-gray-300 text-gray-900 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Kaydediliyor...
              </div>
            ) : (
              initialData ? 'Güncelle' : 'Ticket Oluştur'
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => reset()}
            className="flex-1 bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 py-3 px-6 rounded-lg transition-all duration-200"
          >
            Temizle
          </Button>
        </div>
      </form>
    </div>
  );
}
