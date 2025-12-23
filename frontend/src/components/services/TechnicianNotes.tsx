import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Trash2, Clock, User } from 'lucide-react';
import { serviceApi, ServiceNote } from '@/services/serviceApi';
import { serviceKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface TechnicianNotesProps {
  serviceId: string;
  notes?: ServiceNote[];
}

export default function TechnicianNotes({ serviceId, notes: propNotes }: TechnicianNotesProps) {
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Only fetch if notes not provided via props (reduces API calls when parent has data)
  const { data: fetchedNotes = [], isLoading } = useQuery({
    queryKey: serviceKeys.notes(serviceId),
    queryFn: () => serviceApi.getNotes(serviceId),
    enabled: !propNotes,
  });

  // Use prop data if available, otherwise use fetched data
  const notes = propNotes || fetchedNotes;

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (note: string) => serviceApi.addNote(serviceId, note),
    onSuccess: () => {
      // Invalidate both notes query and main service query (notes are included in service response)
      queryClient.invalidateQueries({ queryKey: serviceKeys.notes(serviceId) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(serviceId) });
      setNewNote('');
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add note');
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => serviceApi.deleteNote(serviceId, noteId),
    onSuccess: () => {
      // Invalidate both notes query and main service query (notes are included in service response)
      queryClient.invalidateQueries({ queryKey: serviceKeys.notes(serviceId) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(serviceId) });
      toast.success('Note deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete note');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  };

  const canDelete = (note: ServiceNote) => {
    if (!user) return false;
    return (
      note.createdBy === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'MANAGER' ||
      user.role === 'SUPER_ADMIN'
    );
  };

  const canAddNote = user?.role === 'TECHNICIAN' || user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        Technician Notes
      </h3>

      {/* Add Note Form */}
      {canAddNote && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={!newNote.trim() || addNoteMutation.isPending}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {isLoading && !propNotes ? (
          <div className="text-center py-4 text-gray-500 text-sm">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">No notes yet</div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-100"
            >
              {/* Note Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <User className="w-3 h-3" />
                    <span className="font-medium">{note.user.name}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(note.createdAt)}</span>
                  </div>
                </div>
                {canDelete(note) && (
                  <button
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    disabled={deleteNoteMutation.isPending}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Note Content */}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
