'use client';

import { useRouter } from 'next/navigation';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { EyeIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, PlusIcon, MessageCircleIcon } from 'lucide-react';

const statusColors = {
  'açık': 'bg-red-100 text-red-800',
  'devam_ediyor': 'bg-yellow-100 text-yellow-800',
  'beklemede': 'bg-blue-100 text-blue-800',
  'çözüldü': 'bg-green-100 text-green-800',
  'kapatıldı': 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  'düşük': 'bg-green-100 text-green-800',
  'orta': 'bg-yellow-100 text-yellow-800',
  'yüksek': 'bg-orange-100 text-orange-800',
  'acil': 'bg-red-100 text-red-800',
};

const statusIcons = {
  'açık': AlertCircleIcon,
  'devam_ediyor': ClockIcon,
  'beklemede': ClockIcon,
  'çözüldü': CheckCircleIcon,
  'kapatıldı': CheckCircleIcon,
};

export default function TicketList({ tickets, isLoading, onCreateTicket, error, currentUser, onAddComment }) {
  const router = useRouter();

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircleIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bir hata oluştu</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Tekrar Dene
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="mt-6 flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz ticket bulunmuyor</h3>
        <p className="text-gray-500 mb-6">İlk destek talebinizi oluşturmak için aşağıdaki butona tıklayın.</p>
        <Button 
          onClick={onCreateTicket}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          İlk Ticket&apos;ınızı Oluşturun
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket) => {
          const StatusIcon = statusIcons[ticket.status] || AlertCircleIcon;
          
          return (
            <div key={ticket.id} className="group bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                  {ticket.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${statusColors[ticket.status]}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {ticket.status}
                </span>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  #{ticket.id}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm line-clamp-3 mb-6 leading-relaxed">
                {ticket.description}
              </p>

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <p className="font-medium text-gray-700">{ticket.created_by?.full_name}</p>
                  <p>{new Date(ticket.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="flex gap-2">
                  {/* Yorum butonu - sadece role_id 2,3,4 olanlar görebilir */}
                  {currentUser && [2, 3, 4].includes(currentUser.role_id) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 text-green-700 hover:bg-gradient-to-r hover:from-green-600 hover:to-blue-600 hover:text-white hover:border-green-600 transition-all duration-200 font-medium"
                      onClick={() => onAddComment(ticket.id)}
                    >
                      <MessageCircleIcon className="w-4 h-4 mr-1" />
                      Yorum
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white hover:border-blue-600 transition-all duration-200 font-medium"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Görüntüle
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
