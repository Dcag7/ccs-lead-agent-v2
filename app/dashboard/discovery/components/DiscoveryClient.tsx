'use client';

import { useState, useEffect, useCallback } from 'react';

interface DiscoveryIntent {
  id: string;
  name: string;
  description: string;
  category: string;
  targetCountries: string[];
  channels: string[];
  limits?: {
    maxCompanies?: number;
    maxQueries?: number;
    timeBudgetMs?: number;
  };
}

interface DiscoveryRun {
  id: string;
  status: string;
  mode: string;
  dryRun: boolean;
  intentId: string | null;
  intentName: string | null;
  triggeredBy: string | null;
  startedAt: string;
  finishedAt: string | null;
  createdCompaniesCount: number;
  createdContactsCount: number;
  createdLeadsCount: number;
  skippedCount: number;
  errorCount: number;
  stats: Record<string, unknown> | null;
  error: string | null;
}

interface Props {
  initialRuns: DiscoveryRun[];
}

export default function DiscoveryClient({ initialRuns }: Props) {
  const [intents, setIntents] = useState<DiscoveryIntent[]>([]);
  const [selectedIntentId, setSelectedIntentId] = useState<string>('');
  const [runs, setRuns] = useState<DiscoveryRun[]>(initialRuns);
  const [selectedRun, setSelectedRun] = useState<DiscoveryRun | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIntents, setIsLoadingIntents] = useState(true);
  const [runnerEnabled, setRunnerEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load intents on mount
  useEffect(() => {
    async function loadIntents() {
      try {
        const res = await fetch('/api/discovery/manual/run');
        const data = await res.json();
        if (data.success) {
          setIntents(data.intents);
          setRunnerEnabled(data.runnerEnabled);
          if (data.intents.length > 0) {
            setSelectedIntentId(data.intents[0].id);
          }
        } else {
          setError(data.error || 'Failed to load intents');
        }
      } catch {
        setError('Failed to load intents');
      } finally {
        setIsLoadingIntents(false);
      }
    }
    loadIntents();
  }, []);

  const refreshRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/discovery-runs');
      const data = await res.json();
      if (data.runs) {
        setRuns(data.runs);
      }
    } catch (err) {
      console.error('Failed to refresh runs:', err);
    }
  }, []);

  const runDiscovery = async (dryRun: boolean) => {
    if (!selectedIntentId) {
      setError('Please select an intent');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/discovery/manual/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: selectedIntentId,
          dryRun,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const selectedIntent = intents.find((i) => i.id === selectedIntentId);
        setSuccess(
          `${dryRun ? 'Dry run' : 'Discovery run'} completed: ${
            data.stats?.companiesCreated ?? 0
          } companies created using "${selectedIntent?.name || selectedIntentId}"`
        );
        await refreshRuns();
      } else {
        setError(data.error || 'Discovery run failed');
      }
    } catch {
      setError('Failed to run discovery');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedIntent = intents.find((i) => i.id === selectedIntentId);

  const formatDuration = (startedAt: string, finishedAt: string | null) => {
    if (!finishedAt) return '-';
    const durationMs =
      new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string, dryRun: boolean) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    const statusClasses: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
        {dryRun && <span className="ml-1 text-gray-500">(dry run)</span>}
      </span>
    );
  };

  if (isLoadingIntents) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-gray-600">Loading intents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Runner Status */}
      {!runnerEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-yellow-800">
              Discovery runner is disabled. Set{' '}
              <code className="bg-yellow-100 px-1 rounded">
                DISCOVERY_RUNNER_ENABLED=true
              </code>{' '}
              to enable.
            </span>
          </div>
        </div>
      )}

      {/* Run Discovery Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Run Discovery
        </h2>

        {/* Intent Selector */}
        <div className="mb-4">
          <label
            htmlFor="intent"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select Intent Template
          </label>
          <select
            id="intent"
            value={selectedIntentId}
            onChange={(e) => setSelectedIntentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            disabled={isLoading}
          >
            {intents.map((intent) => (
              <option key={intent.id} value={intent.id}>
                {intent.name}
              </option>
            ))}
          </select>
        </div>

        {/* Intent Details */}
        {selectedIntent && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              {selectedIntent.description}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>
                <strong>Countries:</strong>{' '}
                {selectedIntent.targetCountries.join(', ')}
              </span>
              <span>
                <strong>Channels:</strong>{' '}
                {selectedIntent.channels.join(', ')}
              </span>
              {selectedIntent.limits?.maxCompanies && (
                <span>
                  <strong>Max Companies:</strong>{' '}
                  {selectedIntent.limits.maxCompanies}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => runDiscovery(true)}
            disabled={isLoading || !runnerEnabled}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Running...' : 'Dry Run'}
          </button>
          <button
            onClick={() => runDiscovery(false)}
            disabled={isLoading || !runnerEnabled}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Runs</h2>
          <button
            onClick={refreshRuns}
            className="text-sm text-teal-600 hover:text-teal-800"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Intent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Started
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Errors
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {runs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No discovery runs yet
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {getStatusBadge(run.status, run.dryRun)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {run.intentName || run.mode}
                      </div>
                      {run.triggeredBy && (
                        <div className="text-xs text-gray-500">
                          via {run.triggeredBy}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(run.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDuration(run.startedAt, run.finishedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-green-600">
                        {run.createdCompaniesCount} companies
                      </div>
                      <div className="text-xs text-gray-500">
                        {run.createdContactsCount} contacts,{' '}
                        {run.createdLeadsCount} leads
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {run.errorCount > 0 ? (
                        <span className="text-red-600">{run.errorCount}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRun(run)}
                        className="text-sm text-teal-600 hover:text-teal-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Detail Modal */}
      {selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Run Details
              </h3>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <dl className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Run ID</dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {selectedRun.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd>{getStatusBadge(selectedRun.status, selectedRun.dryRun)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Intent</dt>
                  <dd className="text-sm text-gray-900">
                    {selectedRun.intentName || selectedRun.mode}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Triggered By
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {selectedRun.triggeredBy || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Started</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(selectedRun.startedAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDuration(selectedRun.startedAt, selectedRun.finishedAt)}
                  </dd>
                </div>
              </dl>

              {selectedRun.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Error
                  </h4>
                  <p className="text-sm text-red-700">{selectedRun.error}</p>
                </div>
              )}

              {selectedRun.stats && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Stats (JSON)
                  </h4>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedRun.stats, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
