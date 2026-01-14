'use client';

import { useState } from 'react';
import RunHistoryTable from '@/app/dashboard/discovery/components/RunHistoryTable';

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
  archivedAt?: string | null;
  stats: Record<string, unknown> | null;
  error: string | null;
  createdCompaniesCount: number;
  createdContactsCount: number;
  createdLeadsCount: number;
  skippedCount: number;
  errorCount: number;
}

export default function ArchivedRunsClient({
  initialRuns,
}: {
  initialRuns: DiscoveryRun[];
}) {
  const [runs, setRuns] = useState<DiscoveryRun[]>(initialRuns);

  const handleRefresh = async () => {
    try {
      const res = await fetch('/api/discovery-runs?scope=archived');
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs);
      }
    } catch {
      // Ignore
    }
  };

  const handleBulkUnarchive = async (runIds: string[]) => {
    try {
      const res = await fetch('/api/discovery/runs/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unarchive', runIds }),
      });
      if (res.ok) {
        await handleRefresh();
      }
    } catch {
      // Ignore errors
    }
  };

  const handleBulkDelete = async (runIds: string[]) => {
    try {
      const res = await fetch('/api/discovery/runs/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', runIds }),
      });
      if (res.ok) {
        await handleRefresh();
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

  return (
    <div>
      <RunHistoryTable
        runs={mappedRuns}
        onRefresh={handleRefresh}
        showArchived={true}
        onBulkUnarchive={handleBulkUnarchive}
        onBulkDelete={handleBulkDelete}
        onPrint={handlePrint}
        allowDelete={true}
      />
    </div>
  );
}
