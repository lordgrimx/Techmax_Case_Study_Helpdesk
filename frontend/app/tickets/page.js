'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import TicketList from '@/components/TicketList';
import TicketForm from '@/components/TicketForm';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CommentModal from '@/components/CommentModal';

const fetchTickets = async (searchTerm = '') => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const url = searchTerm 
    ? `http://localhost:8000/api/v1/tickets?search=${encodeURIComponent(searchTerm)}`
    : 'http://localhost:8000/api/v1/tickets';

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
    throw new Error('Failed to fetch tickets');
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

const createTicket = async (ticketData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch('http://localhost:8000/api/v1/tickets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticketData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to create ticket');
  }

  return response.json();
};

const updateTicket = async ({ ticketId, ticketData }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${ticketId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticketData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to update ticket');
  }

  return response.json();
};

export default function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['tickets', debouncedSearchTerm],
    queryFn: () => fetchTickets(debouncedSearchTerm),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsModalOpen(false);
      setEditingTicket(null);
    },
    onError: (error) => {
      if (error.message === 'No token found' || error.message === 'Unauthorized') {
        router.push('/login');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsModalOpen(false);
      setEditingTicket(null);
    },
    onError: (error) => {
      if (error.message === 'No token found' || error.message === 'Unauthorized') {
        router.push('/login');
      }
    },
  });

  useEffect(() => {
    if (error?.message === 'No token found' || error?.message === 'Unauthorized') {
      router.push('/login');
    }
  }, [error, router]);

  const handleCreateTicket = (data) => {
    if (editingTicket) {
      updateMutation.mutate({ ticketId: editingTicket.id, ticketData: data });
    } else {
      mutation.mutate(data);
    }
  };

  const handleAddComment = (ticketId) => {
    setSelectedTicketId(ticketId);
    setIsCommentModalOpen(true);
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTicket(null);
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedTicketId(null);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                {currentUser?.role?.name === 'Customer' ? 'Destek Taleplerim' : 'Destek Talepleri'}
              </h1>
              <p className="text-gray-600 text-lg">
                {currentUser?.role?.name === 'Customer' 
                  ? 'Oluşturduğunuz destek taleplerini buradan takip edebilirsiniz'
                  : 'Tüm destek taleplerini buradan yönetebilirsiniz'
                }
              </p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Yeni Ticket
            </Button>
          </div>

          {/* Search Section */}
          <div className="mt-8">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-700 z-10"/>
              <Input
                type="text"
                placeholder="Ticket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-700 text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && error.message !== 'No token found' && error.message !== 'Unauthorized' && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Tickets yüklenirken hata oluştu: {error.message}
            </div>
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <TicketList 
            tickets={tickets} 
            isLoading={isLoading}
            error={error}
            currentUser={currentUser}
            onCreateTicket={() => setIsModalOpen(true)}
            onAddComment={handleAddComment}
            onEditTicket={handleEditTicket}
          />
        </div>
      </div>

      {/* Modal for New/Edit Ticket */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingTicket ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {editingTicket ? 'Ticket Düzenle' : 'Yeni Destek Talebi'}
            </h2>
            <p className="text-gray-600 text-lg">
              {editingTicket ? 'Mevcut ticket bilgilerini güncelleyin' : 'Yaşadığınız sorunu detaylı bir şekilde açıklayın'}
            </p>
          </div>

          {(mutation.error || updateMutation.error) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Ticket {editingTicket ? 'güncellenirken' : 'oluşturulurken'} hata oluştu: {(mutation.error || updateMutation.error)?.message}
              </div>
            </div>
          )}

          <TicketForm 
            onSubmit={handleCreateTicket} 
            isLoading={mutation.isPending || updateMutation.isPending}
            initialData={editingTicket}
          />
        </div>
      </Modal>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={handleCloseCommentModal}
        ticketId={selectedTicketId}
        currentUser={currentUser}
      />
    </Layout>
  );
}
