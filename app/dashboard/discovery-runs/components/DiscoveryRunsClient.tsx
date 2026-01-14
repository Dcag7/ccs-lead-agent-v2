'use client';

import { useState, useEffect } from 'react';
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

export default function DiscoveryRunsClient({
  initialRuns,
}: {
  initialRuns: DiscoveryRun[];
}) {
  const [runs, setRuns] = useState<DiscoveryRun[]>(initialRuns);
  const [showArchived, setShowArchived] = useState(false);

  // Auto-refresh if there are running jobs
  useEffect(() => {
    const hasRunning = runs.some(
      (r) => r.status === 'running' || r.status === 'pending'
    );
    if (!hasRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/discovery-runs?showArchived=${showArchived}`);
        if (res.ok) {
          const data = await res.json();
          setRuns(data.runs);
        }
      } catch {
        // Ignore refresh errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [runs, showArchived]);

  const handleRefresh = async () => {
    try {
      const res = await fetch(`/api/discovery-runs?showArchived=${showArchived}`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs);
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleArchived = async () => {
    const newShowArchived = !showArchived;
    setShowArchived(newShowArchived);
    try {
      const res = await fetch(`/api/discovery-runs?showArchived=${newShowArchived}`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs);
      }
    } catch {
      // Ignore
    }
  };

  const handleArchive = async (runId: string) => {
    try {
      const res = await fetch(`/api/discovery/runs/${runId}/archive`, {
        method: 'PATCH',
      });
      if (res.ok) {
        await handleRefresh();
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
        await handleRefresh();
      }
    } catch {
      // Ignore errors
    }
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
        showArchived={showArchived}
        onToggleArchived={handleToggleArchived}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <h4 className="font-medium text-gray-700 mb-2">Configuration</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Schedule:</strong> Daily at 06:00 UTC (08:00 SAST)
          </li>
          <li>
            <strong>Enable switch:</strong>{' '}
            <code className="bg-gray-200 px-1 rounded">
              DISCOVERY_RUNNER_ENABLED
            </code>
          </li>
          <li>
            <strong>Max companies per run:</strong>{' '}
            <code className="bg-gray-200 px-1 rounded">
              DISCOVERY_MAX_COMPANIES_PER_RUN
            </code>{' '}
            (default: 50)
          </li>
        </ul>
      </div>
    </div>
  );
}
