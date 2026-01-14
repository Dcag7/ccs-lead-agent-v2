'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DiscoveryRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  mode: string;
  dryRun: boolean;
  triggeredBy: string | null;
  intentName?: string | null;
  cancelRequestedAt?: string | null;
  stats: {
    companiesCreated?: number;
    contactsCreated?: number;
    leadsCreated?: number;
    durationMs?: number;
    totalAfterDedupe?: number;
  } | null;
  error: string | null;
  createdCompaniesCount: number;
  createdContactsCount: number;
  createdLeadsCount: number;
  skippedCount: number;
  errorCount: number;
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status, dryRun }: { status: string; dryRun?: boolean }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    completed_with_errors: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}
    >
      {status}
      {dryRun && <span className="ml-1 text-gray-500">(preview)</span>}
    </span>
  );
}

export default function DiscoveryRunsClient({
  initialRuns,
}: {
  initialRuns: DiscoveryRun[];
}) {
  const [runs, setRuns] = useState<DiscoveryRun[]>(initialRuns);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleStopRun = async (runId: string) => {
    setCancellingId(runId);
    try {
      const res = await fetch(`/api/discovery/runs/${runId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        // Refresh the list
        handleRefresh();
      }
    } catch {
      // Ignore errors
    } finally {
      setCancellingId(null);
    }
  };

  // Auto-refresh if there are running jobs
  useEffect(() => {
    const hasRunning = runs.some(
      (r) => r.status === 'running' || r.status === 'pending'
    );
    if (!hasRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/discovery-runs');
        if (res.ok) {
          const data = await res.json();
          setRuns(data.runs);
        }
      } catch {
        // Ignore refresh errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [runs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/discovery-runs');
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs);
      }
    } catch {
      // Ignore
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          Showing last {runs.length} discovery runs
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No discovery runs yet.
          <br />
          <span className="text-sm">
            Runs will appear here once the daily cron job executes or a manual
            run is triggered.
          </span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intent / Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {runs.map((run) => {
                const resultCount = run.dryRun 
                  ? (run.stats?.totalAfterDedupe ?? 0)
                  : run.createdCompaniesCount;
                return (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={run.status} dryRun={run.dryRun} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">
                        {run.intentName || run.mode}
                      </div>
                      {run.triggeredBy && (
                        <div className="text-xs text-gray-400">
                          via {run.triggeredBy}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(run.startedAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDuration(run.stats?.durationMs)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {run.dryRun ? (
                        <span className="text-amber-600">
                          {run.stats?.totalAfterDedupe ?? 0} discovered
                        </span>
                      ) : (
                        <>
                          <span className="text-green-600">
                            {run.createdCompaniesCount} companies
                          </span>
                          {(run.createdContactsCount > 0 || run.createdLeadsCount > 0) && (
                            <div className="text-blue-600 text-xs">
                              {run.createdContactsCount} contacts, {run.createdLeadsCount} leads
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {run.errorCount > 0 ? (
                        <span
                          className="text-sm text-red-600 cursor-help"
                          title={run.error || 'Errors occurred'}
                        >
                          {run.errorCount}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {resultCount > 0 && (
                          <Link
                            href={`/dashboard/discovery/runs/${run.id}`}
                            className="text-teal-600 hover:text-teal-800 font-medium"
                          >
                            View {resultCount} {run.dryRun ? 'discovered' : 'companies'}
                          </Link>
                        )}
                        {resultCount === 0 && run.status !== 'running' && run.status !== 'pending' && (
                          <span className="text-gray-400">No results</span>
                        )}
                        {(run.status === 'running' || run.status === 'pending') && !run.cancelRequestedAt && (
                          <button
                            onClick={() => handleStopRun(run.id)}
                            disabled={cancellingId === run.id}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          >
                            {cancellingId === run.id ? 'Stopping...' : 'Stop'}
                          </button>
                        )}
                        {run.cancelRequestedAt && run.status === 'running' && (
                          <span className="text-amber-600 text-xs">Stopping...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
