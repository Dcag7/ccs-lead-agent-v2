'use client';

import { useState, useEffect } from 'react';

interface DiscoveryRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  mode: string;
  dryRun: boolean;
  triggeredBy: string | null;
  stats: {
    companiesCreated?: number;
    contactsCreated?: number;
    leadsCreated?: number;
    durationMs?: number;
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    running: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}
    >
      {status}
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
                  Started
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skipped
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={run.status} />
                    {run.dryRun && (
                      <span className="ml-2 text-xs text-gray-400">
                        (dry run)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(run.startedAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {formatDuration(run.stats?.durationMs)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {run.mode}
                    {run.triggeredBy && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({run.triggeredBy})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="text-green-600">
                      {run.createdCompaniesCount} companies
                    </span>
                    <br />
                    <span className="text-blue-600 text-xs">
                      {run.createdContactsCount} contacts,{' '}
                      {run.createdLeadsCount} leads
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {run.skippedCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {run.errorCount > 0 ? (
                      <span
                        className="text-sm text-red-600 cursor-help"
                        title={run.error || 'Errors occurred'}
                      >
                        {run.errorCount} error{run.errorCount !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
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
