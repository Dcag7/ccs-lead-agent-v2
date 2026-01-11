'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface LeadOwnerManagerProps {
  leadId: string;
  currentAssignedToId: string | null;
  currentAssignedTo: User | null;
  users: User[];
  currentUserId: string | null;
}

export default function LeadOwnerManager({
  leadId,
  currentAssignedToId,
  currentAssignedTo,
  users,
  currentUserId,
}: LeadOwnerManagerProps) {
  const router = useRouter();
  const [assignedToId, setAssignedToId] = useState(currentAssignedToId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOwnerChange = async (newAssignedToId: string) => {
    const value = newAssignedToId === '' ? null : newAssignedToId;
    
    if (value === currentAssignedToId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/owner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update owner');
      }

      setAssignedToId(value || '');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update owner');
      // Revert on error
      setAssignedToId(currentAssignedToId || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!currentUserId) {
      setError('Could not determine current user');
      return;
    }
    await handleOwnerChange(currentUserId);
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Owner</h4>
      <div className="flex gap-2">
        <select
          value={assignedToId}
          onChange={(e) => handleOwnerChange(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>
        {currentUserId && (
          <button
            onClick={handleAssignToMe}
            disabled={isLoading}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign to Me
          </button>
        )}
      </div>
      {currentAssignedTo && (
        <p className="mt-1 text-sm text-gray-600">
          Currently assigned to: {currentAssignedTo.name || currentAssignedTo.email}
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {isLoading && (
        <p className="mt-1 text-sm text-gray-500">Updating...</p>
      )}
    </div>
  );
}
