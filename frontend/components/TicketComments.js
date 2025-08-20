'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquareIcon, 
  SendIcon, 
  UserIcon, 
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon
} from 'lucide-react';

// API Functions
const fetchTicketComments = async (ticketId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`http://localhost:8000/api/v1/tickets/${ticketId}/comments`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }

  return response.json();
};

const createComment = async ({ ticketId, content, isInternal }) => {
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
    body: JSON.stringify({ content, is_internal: isInternal }),
  });

  if (!response.ok) {
    throw new Error('Failed to create comment');
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
    throw new Error('Failed to fetch user');
  }

  return response.json();
};

export default function TicketComments({ ticketId }) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current user to check role
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  // Fetch comments
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['ticketComments', ticketId],
    queryFn: () => fetchTicketComments(ticketId),
    enabled: !!ticketId,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketComments', ticketId] });
      setNewComment('');
      setIsInternal(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate({
        ticketId,
        content: newComment.trim(),
        isInternal,
      });
    }
  };

  // Check if user can see internal comments (Agent, Supervisor, Admin)
  const canSeeInternalComments = currentUser && ['Agent', 'Supervisor', 'Admin'].includes(currentUser.role?.name);
  
  // Check if user can create internal comments
  const canCreateInternalComments = canSeeInternalComments;

  // Filter comments based on user role
  const visibleComments = comments?.filter(comment => {
    if (comment.is_internal && !canSeeInternalComments) {
      return false;
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border-0 shadow-lg">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquareIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span>Yorumlar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-0 shadow-lg">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquareIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span>Yorumlar</span>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {visibleComments.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Comments List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {visibleComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquareIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Henüz yorum yok</p>
              <p className="text-sm">İlk yorumu siz yazın!</p>
            </div>
          ) : (
            visibleComments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${
                  comment.is_internal 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{comment.user?.full_name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <ClockIcon className="w-3 h-3" />
                        <span>
                          {new Date(comment.created_at).toLocaleString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {comment.is_internal && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                      <LockIcon className="w-3 h-3 mr-1" />
                      Dahili Not
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        {(currentUser && ['Agent', 'Supervisor', 'Admin', 'Customer'].includes(currentUser.role?.name)) && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-100 pt-6">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yorumunuzu yazın..."
              className="min-h-20 resize-none"
              disabled={createCommentMutation.isPending}
            />
            
            {canCreateInternalComments && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isInternal"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isInternal" className="text-sm text-gray-700 flex items-center space-x-1">
                  {isInternal ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  <span>Dahili not (sadece personel görebilir)</span>
                </label>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || createCommentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <SendIcon className="w-4 h-4 mr-2" />
                {createCommentMutation.isPending ? 'Gönderiliyor...' : 'Yorum Gönder'}
              </Button>
            </div>
          </form>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">Yorumlar yüklenirken hata oluştu: {error.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
