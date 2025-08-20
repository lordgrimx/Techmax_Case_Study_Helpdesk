'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MessageCircleIcon, SendIcon, XIcon } from 'lucide-react';

const addComment = async (ticketId, commentData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${ticketId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commentData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to add comment');
  }

  return response.json();
};

export default function CommentModal({ isOpen, onClose, ticketId, currentUser }) {
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (commentData) => addComment(ticketId, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticketComments', ticketId] });
      setComment('');
      setIsInternal(false);
      onClose();
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
    },
  });

  // Role kontrolü - sadece role_id 2,3,4 olanlar erişebilir
  const canAddComment = currentUser && [2, 3, 4].includes(currentUser.role_id);

  if (!canAddComment) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    mutation.mutate({
      content: comment.trim(),
      is_internal: isInternal
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Yorum Ekle</h2>
              <p className="text-gray-600">Ticket #{ticketId} için yorum ekleyin</p>
            </div>
          </div>
          
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yorumunuz
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ticket ile ilgili yorumunuzu buraya yazın..."
              rows={4}
              className="w-full resize-none bg-white"
              required
            />
          </div>

          {/* Internal Note Checkbox - Sadece agent ve üstü roller için */}
          {currentUser?.role_id >= 2 && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isInternal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isInternal" className="ml-2 block text-sm text-gray-700">
                Internal Not (Sadece çalışanlar görebilir)
              </label>
            </div>
          )}

          {/* Error Message */}
          {mutation.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Yorum eklenirken hata oluştu: {mutation.error.message}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={!comment.trim() || mutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {mutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ekleniyor...
                </>
              ) : (
                <>
                  <SendIcon className="w-4 h-4 mr-2" />
                  Yorum Ekle
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
