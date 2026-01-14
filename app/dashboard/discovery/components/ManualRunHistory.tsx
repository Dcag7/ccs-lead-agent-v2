'use client';

import { useState, useEffect } from 'react';
import RunHistoryTable from './RunHistoryTable';

interface DiscoveryRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  mode: string;
  dryRun: boolean;
  triggeredBy: string | null;
  intentId?: string | null;
  intentName?: string | null;
  cancelRequestedAt?: string | null;
  archivedAt?: string | null;
  stats: Record<string, unknown> | null;
  error: string | null;
  createdCompaniesCount: number;
  createdContactsCount: number;
  createdLeadsCount: number;
  skippedCount: number;
  errorCount: number;
}

export default function ManualRunHistory() {
  const [runs, setRuns] = useState<DiscoveryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadRuns();
  }, [showArchived]);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery-runs?scope=manual&includeArchived=${showArchived}`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadRuns();
  };

  const handleToggleArchived = async () => {
    setShowArchived(!showArchived);
  };

  const handleArchive = async (runId: string) => {
    try {
      const res = await fetch(`/api/discovery/runs/${runId}/archive`, {
        method: 'PATCH',
      });
      if (res.ok) {
        await loadRuns();
      }
    } catch {
      // Ignore errors
    }
  };

  const handleUnarchive = async (runId: string) => {
    try {
      const res = await fetch(`/api/discovery/runs/${runId}/unarchive`, {
        method: 'PATCH',
      });
      if (res.ok) {
        await loadRuns();
      }
    } catch {
      // Ignore errors
    }
  };

  const handleBulkArchive = async (runIds: string[]) => {
    try {
      const res = await fetch('/api/discovery/runs/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', runIds }),
      });
      if (res.ok) {
        await loadRuns();
      }
    } catch {
      // Ignore errors
    }
  };

  const handlePrint = (runIds: string[]) => {
    const ids = runIds.join(',');
    window.open(`/dashboard/discovery/print?ids=${ids}`, '_blank');
  };

  // Map runs to the format expected by RunHistoryTable
  const mappedRuns = runs.map((run) => ({
    id: run.id,
    status: run.status,
    mode: run.mode,
    dryRun: run.dryRun,
    intentId: run.intentId ?? null,
    intentName: run.intentName ?? null,
    triggeredBy: run.triggeredBy,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    createdCompaniesCount: run.createdCompaniesCount,
    createdContactsCount: run.createdContactsCount,
    createdLeadsCount: run.createdLeadsCount,
    skippedCount: run.skippedCount,
    errorCount: run.errorCount,
    stats: run.stats,
    error: run.error,
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <span className="ml-3 text-gray-600">Loading run history...</span>
        </div>
      </div>
    );
  }

  return (
    <RunHistoryTable
      runs={mappedRuns}
      onRefresh={handleRefresh}
      showArchived={showArchived}
      onToggleArchived={handleToggleArchived}
      onArchive={handleArchive}
      onUnarchive={handleUnarchive}
      onBulkArchive={handleBulkArchive}
      onPrint={handlePrint}
    />
  );
}
