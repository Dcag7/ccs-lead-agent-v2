'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_NOTE_LENGTH } from '@/lib/lead-management/types';

interface NoteUser {
  id: string;
  name: string | null;
  email: string;
}

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: NoteUser;
}

interface LeadNotesProps {
  leadId: string;
  notes: Note[];
  currentUserId?: string | null;
}

export default function LeadNotes({ leadId, notes: initialNotes, currentUserId }: LeadNotesProps) {
  const router = useRouter();
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    if (newNoteContent.trim().length > MAX_NOTE_LENGTH) {
      setError(`Note content exceeds ${MAX_NOTE_LENGTH} characters`);
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add note');
      }

      setNewNoteContent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
    setError(null);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editingContent.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    if (editingContent.trim().length > MAX_NOTE_LENGTH) {
      setError(`Note content exceeds ${MAX_NOTE_LENGTH} characters`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update note');
      }

      setEditingNoteId(null);
      setEditingContent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete note');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const canEditNote = (note: Note) => {
    // Only allow editing if currentUserId matches note.userId
    // The API will also enforce this, but we can hide UI for better UX
    return currentUserId === note.user.id;
  };

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Notes</h4>

      {/* Add Note Form */}
      <div className="mb-4">
        <textarea
          value={newNoteContent}
          onChange={(e) => {
            setNewNoteContent(e.target.value);
            setError(null);
          }}
          placeholder="Add a note..."
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {newNoteContent.length}/{MAX_NOTE_LENGTH} characters
          </span>
          <button
            onClick={handleAddNote}
            disabled={isAdding || !newNoteContent.trim()}
            className="px-4 py-2 bg-[#1B7A7A] text-white text-sm rounded-md hover:bg-[#155555] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {initialNotes.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No notes yet. Add your first note above.</p>
        ) : (
          initialNotes.map((note) => (
            <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {editingNoteId === note.id ? (
                <div>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    maxLength={MAX_NOTE_LENGTH}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {editingContent.length}/{MAX_NOTE_LENGTH} characters
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={isSaving || !editingContent.trim()}
                        className="px-3 py-1 bg-[#1B7A7A] text-white text-sm rounded-md hover:bg-[#155555] disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {note.user.name || note.user.email}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
                    </div>
                    {canEditNote(note) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
