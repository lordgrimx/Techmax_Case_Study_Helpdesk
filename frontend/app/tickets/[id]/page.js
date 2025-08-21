'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import TicketComments from '@/components/TicketComments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { 
  EditIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  AlertTriangleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  FileIcon,
  UploadIcon,
  RotateCcwIcon,
  LockIcon
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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

const fetchTicket = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch ticket');
  }

  return response.json();
};

const updateTicketStatus = async ({ id, status }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update ticket status');
  }

  return response.json();
};

// Yeni API fonksiyonları
const escalateTicket = async ({ id, escalated_to_id, escalation_reason }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${id}/escalate`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ escalated_to_id, escalation_reason }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Escalate API Error:', errorData);
    throw new Error('Failed to escalate ticket');
  }

  return response.json();
};

const resolveTicket = async ({ id, resolution }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${id}/resolve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      resolution,
      status: "çözüldü"  // Backend'in beklediği enum değeri
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Resolve API Error:', errorData);
    throw new Error('Failed to resolve ticket');
  }

  return response.json();
};

const closeTicket = async ({ id, closing_note }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${id}/close`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ closing_note }),
  });

  if (!response.ok) {
    throw new Error('Failed to close ticket');
  }

  return response.json();
};

const reopenTicket = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${id}/reopen`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to reopen ticket');
  }

  return response.json();
};

const uploadAttachments = async ({ id, files }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${id}/attachments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload files');
  }

  return response.json();
};

const statusColors = {
  'açık': 'bg-red-50 text-red-700 border-red-200',
  'devam_ediyor': 'bg-blue-50 text-blue-700 border-blue-200',
  'beklemede': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'çözüldü': 'bg-green-50 text-green-700 border-green-200',
  'kapatıldı': 'bg-gray-50 text-gray-700 border-gray-200',
};

const priorityColors = {
  'düşük': 'bg-green-50 text-green-700 border-green-200',
  'orta': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'yüksek': 'bg-orange-50 text-orange-700 border-orange-200',
  'acil': 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons = {
  'açık': AlertCircleIcon,
  'devam_ediyor': PlayCircleIcon,
  'beklemede': PauseCircleIcon,
  'çözüldü': CheckCircleIcon,
  'kapatıldı': XCircleIcon,
};

export default function TicketDetailPage({ params }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ticketId, setTicketId] = useState(null);
  
  // Yeni state'ler
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [resolution, setResolution] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTicketId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => fetchTicket(ticketId),
    enabled: !!ticketId,
    retry: false,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: updateTicketStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  // Yeni mutation'lar
  const escalateMutation = useMutation({
    mutationFn: escalateTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setShowEscalateModal(false);
      setEscalationReason('');
    },
    onError: (error) => {
      console.error('Escalation error:', error);
      alert('Yükseltme sırasında hata oluştu: ' + error.message);
    }
  });

  const resolveMutation = useMutation({
    mutationFn: resolveTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setShowResolveModal(false);
      setResolution('');
    },
    onError: (error) => {
      console.error('Resolution error:', error);
      alert('Çözüm sırasında hata oluştu: ' + error.message);
    }
  });

  const closeMutation = useMutation({
    mutationFn: closeTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setShowCloseModal(false);
      setClosingNote('');
    },
    onError: (error) => {
      console.error('Close error:', error);
      alert('Kapatma sırasında hata oluştu: ' + error.message);
    }
  });

  const reopenMutation = useMutation({
    mutationFn: reopenTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadAttachments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setShowUploadModal(false);
      setSelectedFiles([]);
    },
  });

  useEffect(() => {
    if (error?.message === 'No token found' || error?.message === 'Unauthorized') {
      router.push('/login');
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-2/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-40 bg-gray-300 rounded-xl"></div>
                <div className="h-32 bg-gray-300 rounded-xl"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-gray-300 rounded-xl"></div>
                <div className="h-32 bg-gray-300 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="w-5 h-5" />
              <span className="font-medium">Hata</span>
            </div>
            <p className="mt-2">Ticket yüklenirken hata oluştu: {error.message}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <AlertCircleIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-700">Ticket bulunamadı.</p>
            <Button onClick={() => router.push('/tickets')} className="mt-4">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Ticket Listesine Dön
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const StatusIcon = statusIcons[ticket.status] || AlertCircleIcon;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/tickets')}
              className="text-gray-700 hover:text-gray-400"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <p className="text-sm text-gray-700">Ticket #{ticket.id}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Dosya Yükleme */}
            <Button
              onClick={() => setShowUploadModal(true)}
              size="sm"
              variant="outline"
              className="text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-250"
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              Dosya Ekle
            </Button>

            {/* Yükseltme - Agent ve üstü */}
            {(currentUser?.is_agent || currentUser?.is_supervisor || currentUser?.is_system_admin) && 
             ticket.status !== 'kapatıldı' && (
              <Button
                onClick={() => setShowEscalateModal(true)}
                size="sm"
                variant="outline"
                className="text-orange-700 bg-gray-100 border-orange-300 hover:bg-orange-50"
              >
                <ArrowUpIcon className="w-4 h-4 mr-2" />
                Yükselt
              </Button>
            )}

            {/* Çözme - Agent ve üstü */}
            {(currentUser?.is_agent || currentUser?.is_supervisor || currentUser?.is_system_admin) && 
             ticket.status !== 'çözüldü' && ticket.status !== 'kapatıldı' && (
              <Button
                onClick={() => setShowResolveModal(true)}
                size="sm"
                variant="outline"
                className="text-green-700 bg-gray-100 border-green-300 hover:bg-green-50"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Çöz
              </Button>
            )}

            {/* Kapatma - Supervisor ve Admin */}
            {(currentUser?.is_supervisor || currentUser?.is_system_admin) && 
             ticket.status === 'çözüldü' && (
              <Button
                onClick={() => setShowCloseModal(true)}
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                <LockIcon className="w-4 h-4 mr-2" />
                Kapat
              </Button>
            )}

            {/* Yeniden Açma - Agent ve üstü */}
            {(currentUser?.is_agent || currentUser?.is_supervisor || currentUser?.is_system_admin) && 
             (ticket.status === 'çözüldü' || ticket.status === 'kapatıldı') && (
              <Button
                onClick={() => reopenMutation.mutate(ticketId)}
                size="sm"
                variant="outline"
                className="text-blue-700 border-blue-300 hover:bg-blue-50"
                disabled={reopenMutation.isPending}
              >
                <RotateCcwIcon className="w-4 h-4 mr-2" />
                Yeniden Aç
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white shadow-sm border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TagIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className='text-gray-700'>Açıklama</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </CardContent>
            </Card>

            {ticket.resolution && (
              <Card className="bg-green-50 border-green-200 shadow-sm">
                <CardHeader className="border-b border-green-200">
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span>Çözüm</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-green-800 leading-relaxed whitespace-pre-wrap">{ticket.resolution}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <TicketComments ticketId={ticket.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card className="bg-white shadow-sm border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg text-gray-700">Ticket Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Durum</label>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[ticket.status]}`}>
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Öncelik</label>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${priorityColors[ticket.priority]}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Kategori</label>
                    <p className="mt-2 text-sm font-medium text-gray-900">{ticket.category}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Oluşturan</label>
                    <div className="mt-2 flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{ticket.created_by?.full_name}</span>
                    </div>
                  </div>

                  {ticket.assigned_to && (
                    <div>
                      <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Atanan</label>
                      <div className="mt-2 flex items-center space-x-2">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{ticket.assigned_to.full_name}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Oluşturulma Tarihi</label>
                    <div className="mt-2 flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-900">
                        {new Date(ticket.created_at).toLocaleString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Son Güncelleme</label>
                    <div className="mt-2 flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-900">
                        {new Date(ticket.updated_at).toLocaleString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {currentUser && ['Agent', 'Supervisor', 'Admin'].includes(currentUser.role?.name) && (
              <Card className="bg-white shadow-sm border-0 shadow-lg">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg">İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {ticket.status === 'açık' && (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        onClick={() => statusMutation.mutate({ id: ticket.id, status: 'devam_ediyor' })}
                        disabled={statusMutation.isPending}
                      >
                        <PlayCircleIcon className="w-4 h-4 mr-2" />
                        İşleme Al
                      </Button>
                    )}
                    
                    {ticket.status === 'devam_ediyor' && (
                      <>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700" 
                          onClick={() => statusMutation.mutate({ id: ticket.id, status: 'çözüldü' })}
                          disabled={statusMutation.isPending}
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Çözüldü Olarak İşaretle
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50" 
                          onClick={() => statusMutation.mutate({ id: ticket.id, status: 'beklemede' })}
                          disabled={statusMutation.isPending}
                        >
                          <PauseCircleIcon className="w-4 h-4 mr-2" />
                          Beklemeye Al
                        </Button>
                      </>
                    )}
                    
                    {ticket.status === 'beklemede' && (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        onClick={() => statusMutation.mutate({ id: ticket.id, status: 'devam_ediyor' })}
                        disabled={statusMutation.isPending}
                      >
                        <PlayCircleIcon className="w-4 h-4 mr-2" />
                        İşleme Devam Et
                      </Button>
                    )}
                    
                    {ticket.status === 'çözüldü' && ['Supervisor', 'Admin'].includes(currentUser.role?.name) && (
                      <Button 
                        className="w-full bg-gray-600 hover:bg-gray-700" 
                        onClick={() => statusMutation.mutate({ id: ticket.id, status: 'kapatıldı' })}
                        disabled={statusMutation.isPending}
                      >
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        Ticket&apos;ı Kapat
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Escalation Modal */}
      <Modal isOpen={showEscalateModal} onClose={() => setShowEscalateModal(false)} title="Ticket Yükselt">
        <div className="space-y-4">
          <div>
            <Label htmlFor="escalation-reason">Yükseltme Nedeni</Label>
            <Textarea
              id="escalation-reason"
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Ticket'ı neden yükseltiyorsunuz?"
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEscalateModal(false)}>
              İptal
            </Button>
            <Button
              onClick={() => {
                console.log('Escalating ticket:', {
                  id: ticketId,
                  escalated_to_id: currentUser?.id, // Geçici olarak current user'a yükseltiyor
                  escalation_reason: escalationReason
                });
                escalateMutation.mutate({
                  id: ticketId,
                  escalated_to_id: currentUser?.id, // Geçici olarak current user'a yükseltiyor
                  escalation_reason: escalationReason
                });
              }}
              disabled={!escalationReason.trim() || escalateMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {escalateMutation.isPending ? 'Yükseltiliyor...' : 'Yükselt'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolution Modal */}
      <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} title="Ticket Çöz">
        <div className="space-y-4">
          <div>
            <Label htmlFor="resolution">Çözüm Açıklaması</Label>
            <Textarea
              id="resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Ticket nasıl çözüldü? Detaylı açıklama yazın..."
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowResolveModal(false)}>
              İptal
            </Button>
            <Button
              onClick={() => {
                console.log('Resolving ticket:', {
                  id: ticketId,
                  resolution: resolution
                });
                resolveMutation.mutate({
                  id: ticketId,
                  resolution: resolution
                });
              }}
              disabled={!resolution.trim() || resolveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {resolveMutation.isPending ? 'Çözülüyor...' : 'Çöz'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Ticket Kapat">
        <div className="space-y-4">
          <div>
            <Label htmlFor="closing-note">Kapatma Notu (İsteğe bağlı)</Label>
            <Textarea
              id="closing-note"
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              placeholder="Ticket kapatılırken ek not eklemek isterseniz..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCloseModal(false)}>
              İptal
            </Button>
            <Button
              onClick={() => closeMutation.mutate({
                id: ticketId,
                closing_note: closingNote
              })}
              disabled={closeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {closeMutation.isPending ? 'Kapatılıyor...' : 'Kapat'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Dosya Yükle">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Dosya Seç</Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              className="mt-1"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maksimum dosya boyutu: 5MB. Desteklenen formatlar: PDF, DOC, DOCX, TXT, JPG, PNG, GIF
            </p>
          </div>
          {selectedFiles.length > 0 && (
            <div>
              <Label>Seçilen Dosyalar:</Label>
              <ul className="mt-1 text-sm text-gray-600">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <FileIcon className="w-4 h-4" />
                    <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              İptal
            </Button>
            <Button
              onClick={() => uploadMutation.mutate({
                id: ticketId,
                files: selectedFiles
              })}
              disabled={selectedFiles.length === 0 || uploadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploadMutation.isPending ? 'Yükleniyor...' : 'Yükle'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
