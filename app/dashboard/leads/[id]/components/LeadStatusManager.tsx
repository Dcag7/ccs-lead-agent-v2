'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALLOWED_STATUSES } from '@/lib/lead-management/types';

interface LeadStatusManagerProps {
  leadId: string;
  currentStatus: string;
}

export default function LeadStatusManager({ leadId, currentStatus }: LeadStatusManagerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setStatus(newStatus);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isLoading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {ALLOWED_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {isLoading && (
        <p className="mt-1 text-sm text-gray-500">Updating...</p>
      )}
    </div>
  );
}
