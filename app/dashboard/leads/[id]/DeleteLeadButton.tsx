
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/leads');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to archive lead');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error archiving lead:', error);
      alert('Failed to archive lead');
      setIsDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50"
        >
          {isDeleting ? 'Archiving...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition font-medium text-sm"
    >
      Archive Lead
    </button>
  );
}
