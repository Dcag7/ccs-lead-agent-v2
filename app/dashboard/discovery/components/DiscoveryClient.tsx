'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface DiscoveryIntent {
  id: string;
  name: string;
  description: string;
  category: string;
  targetCountries: string[];
  channels: string[];
  limits?: {
    maxCompanies?: number;
    maxLeads?: number;
    maxQueries?: number;
    timeBudgetMs?: number;
  };
  geography?: {
    primaryCountry: string;
    priorityRegions?: string[];
    regionBoost?: number;
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

// Stats structure from the discovery run
interface RunStats {
  totalDiscovered?: number;
  totalAfterDedupe?: number;
  companiesCreated?: number;
  companiesSkipped?: number;
  contactsCreated?: number;
  contactsSkipped?: number;
  leadsCreated?: number;
  leadsSkipped?: number;
  durationMs?: number;
  stoppedEarly?: boolean;
  stoppedReason?: string;
  channelResults?: Record<string, number>;
  channelErrors?: Record<string, string>;
  errors?: Array<{ type: string; message: string }>;
  limitsUsed?: {
    maxCompanies?: number;
    maxLeads?: number;
    maxQueries?: number;
    maxRuntimeSeconds?: number;
    maxPagesPerQuery?: number;
    channels?: string[];
  };
  intentConfig?: {
    intentId?: string;
    intentName?: string;
    queriesCount?: number;
    targetCountries?: string[];
    includeKeywordsCount?: number;
    excludeKeywordsCount?: number;
  };
}

function RunDetailsModal({
  run,
  onClose,
}: {
  run: DiscoveryRun;
  onClose: () => void;
}) {
  const stats = run.stats as RunStats | null;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'completed_with_errors':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const companiesCreated = stats?.companiesCreated ?? run.createdCompaniesCount ?? 0;
  const leadsCreated = stats?.leadsCreated ?? run.createdLeadsCount ?? 0;

  return (
    <div className="fixed inset-0 bg-gray-600/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Discovery Run Details
            </h3>
            <p className="text-xs text-gray-500 font-mono">{run.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-5">
          {/* Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
              <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(run.status)}`}>
                {run.status}
                {run.dryRun && ' (dry run)'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Duration</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats?.durationMs ? formatDuration(stats.durationMs) : '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Triggered By</p>
              <p className="text-sm font-medium text-gray-900">{run.triggeredBy || 'unknown'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Started</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(run.startedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Results Summary */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Results Summary</h4>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.companiesCreated ?? run.createdCompaniesCount ?? 0}
                  </p>
                  <p className="text-xs text-green-700">Companies Created</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.contactsCreated ?? run.createdContactsCount ?? 0}
                  </p>
                  <p className="text-xs text-blue-700">Contacts Created</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {stats?.leadsCreated ?? run.createdLeadsCount ?? 0}
                  </p>
                  <p className="text-xs text-purple-700">Leads Created</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {stats?.totalDiscovered ?? 0}
                  </p>
                  <p className="text-xs text-gray-600">Total Discovered</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {stats?.totalAfterDedupe ?? 0}
                  </p>
                  <p className="text-xs text-gray-600">After Dedupe</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {(stats?.companiesSkipped ?? 0) + (stats?.contactsSkipped ?? 0) + (stats?.leadsSkipped ?? 0)}
                  </p>
                  <p className="text-xs text-yellow-700">Total Skipped</p>
                </div>
              </div>

              {stats?.stoppedEarly && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Run Stopped Early</p>
                    <p className="text-sm text-yellow-700">
                      Reason: {stats.stoppedReason === 'company_limit' ? 'Company limit reached' : 
                               stats.stoppedReason === 'time_limit' ? 'Time limit reached' :
                               stats.stoppedReason || 'Unknown'}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {(companiesCreated > 0 || leadsCreated > 0) && !run.dryRun && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                  {companiesCreated > 0 && (
                    <Link
                      href="/dashboard/companies"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      View {companiesCreated} Companies
                    </Link>
                  )}
                  {leadsCreated > 0 && (
                    <Link
                      href="/dashboard/leads"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      View {leadsCreated} Leads
                    </Link>
                  )}
                  <p className="w-full text-xs text-gray-500 mt-1">
                    View newly discovered records to score and qualify them
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Intent Configuration */}
          {stats?.intentConfig && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Intent Configuration</h4>
              </div>
              <div className="p-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Intent</dt>
                    <dd className="font-medium text-gray-900">{stats.intentConfig.intentName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Intent ID</dt>
                    <dd className="font-mono text-gray-900">{stats.intentConfig.intentId}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Countries</dt>
                    <dd className="font-medium text-gray-900">
                      {stats.intentConfig.targetCountries?.join(', ') || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Queries</dt>
                    <dd className="font-medium text-gray-900">{stats.intentConfig.queriesCount || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Include Keywords</dt>
                    <dd className="font-medium text-gray-900">{stats.intentConfig.includeKeywordsCount || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Exclude Keywords</dt>
                    <dd className="font-medium text-gray-900">{stats.intentConfig.excludeKeywordsCount || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Channel Results */}
          {stats?.channelResults && Object.keys(stats.channelResults).length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Channel Results</h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(stats.channelResults).map(([channel, count]) => (
                    <div key={channel} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-gray-700">{count}</p>
                      <p className="text-xs text-gray-500 capitalize">{channel}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Limits Used */}
          {stats?.limitsUsed && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Limits Applied</h4>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {stats.limitsUsed.maxCompanies && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      Max Companies: <strong>{stats.limitsUsed.maxCompanies}</strong>
                    </span>
                  )}
                  {stats.limitsUsed.maxLeads && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      Max Leads: <strong>{stats.limitsUsed.maxLeads}</strong>
                    </span>
                  )}
                  {stats.limitsUsed.maxQueries && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      Max Queries: <strong>{stats.limitsUsed.maxQueries}</strong>
                    </span>
                  )}
                  {stats.limitsUsed.maxRuntimeSeconds && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      Max Runtime: <strong>{stats.limitsUsed.maxRuntimeSeconds}s</strong>
                    </span>
                  )}
                  {stats.limitsUsed.channels && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      Channels: <strong>{stats.limitsUsed.channels.join(', ')}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {run.error && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-red-800">Error</h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-red-600">{run.error}</p>
              </div>
            </div>
          )}

          {stats?.errors && stats.errors.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-red-800">Run Errors ({stats.errors.length})</h4>
              </div>
              <div className="p-4 space-y-2">
                {stats.errors.map((err, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium text-red-700">[{err.type}]</span>{' '}
                    <span className="text-gray-700">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.channelErrors && Object.keys(stats.channelErrors).length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-orange-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-orange-800">Channel Errors</h4>
              </div>
              <div className="p-4 space-y-2">
                {Object.entries(stats.channelErrors).map(([channel, error]) => (
                  <div key={channel} className="p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium text-orange-700 capitalize">{channel}:</span>{' '}
                    <span className="text-gray-700">{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Safety caps for manual runs
const SAFETY_CAPS = {
  maxCompanies: 20,
  maxLeads: 30,
  maxQueries: 5,
};

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
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  
  // Limit overrides (optional)
  const [showOverrides, setShowOverrides] = useState(false);
  const [overrideMaxCompanies, setOverrideMaxCompanies] = useState<number | undefined>(undefined);
  const [overrideMaxLeads, setOverrideMaxLeads] = useState<number | undefined>(undefined);
  const [overrideMaxQueries, setOverrideMaxQueries] = useState<number | undefined>(undefined);

  // Load intents and Google config status on mount
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

    async function checkGoogleConfig() {
      try {
        const res = await fetch('/api/health/google');
        const data = await res.json();
        setGoogleConfigured(data.configured || false);
      } catch {
        setGoogleConfigured(false);
      }
    }

    loadIntents();
    checkGoogleConfig();
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

    // Build overrides object if any values are set
    const overrides: {
      limits?: {
        maxCompanies?: number;
        maxLeads?: number;
        maxQueries?: number;
      };
    } = {};
    
    if (overrideMaxCompanies || overrideMaxLeads || overrideMaxQueries) {
      overrides.limits = {};
      if (overrideMaxCompanies) {
        overrides.limits.maxCompanies = Math.min(overrideMaxCompanies, SAFETY_CAPS.maxCompanies);
      }
      if (overrideMaxLeads) {
        overrides.limits.maxLeads = Math.min(overrideMaxLeads, SAFETY_CAPS.maxLeads);
      }
      if (overrideMaxQueries) {
        overrides.limits.maxQueries = Math.min(overrideMaxQueries, SAFETY_CAPS.maxQueries);
      }
    }

    try {
      const res = await fetch('/api/discovery/manual/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: selectedIntentId,
          dryRun,
          overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
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
      completed_with_errors: 'bg-yellow-100 text-yellow-800',
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

      {/* Google Configuration Warning */}
      {googleConfigured === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5"
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
            <div>
              <p className="text-red-800 font-medium">
                Google Discovery is disabled
              </p>
              <p className="text-red-700 text-sm mt-1">
                Configure <code className="bg-red-100 px-1 rounded">GOOGLE_CSE_API_KEY</code> and{' '}
                <code className="bg-red-100 px-1 rounded">GOOGLE_CSE_ID</code> environment variables to enable Google discovery.
              </p>
            </div>
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
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <p className="text-sm text-gray-600">
              {selectedIntent.description}
            </p>
            
            {/* Gauteng-first note */}
            {selectedIntent.geography?.priorityRegions && (
              <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-xs text-blue-700">
                  <strong>Gauteng-first:</strong> Results from Johannesburg, Pretoria, and Gauteng are prioritized (boosted scoring), but other South African regions are not excluded.
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>
                <strong>Countries:</strong>{' '}
                {selectedIntent.targetCountries.join(', ')}
              </span>
              <span>
                <strong>Category:</strong>{' '}
                {selectedIntent.category}
              </span>
              <span>
                <strong>Channels:</strong>{' '}
                {selectedIntent.channels.join(', ')}
              </span>
            </div>
            
            {/* Default limits */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              {selectedIntent.limits?.maxCompanies && (
                <span>
                  <strong>Max Companies:</strong>{' '}
                  {selectedIntent.limits.maxCompanies}
                </span>
              )}
              {selectedIntent.limits?.maxLeads && (
                <span>
                  <strong>Max Leads:</strong>{' '}
                  {selectedIntent.limits.maxLeads}
                </span>
              )}
              {selectedIntent.limits?.maxQueries && (
                <span>
                  <strong>Max Queries:</strong>{' '}
                  {selectedIntent.limits.maxQueries}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Override Options */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowOverrides(!showOverrides)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showOverrides ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced Options (Override Limits)
          </button>
          
          {showOverrides && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-3">
                Override default limits for this run. Safety caps apply: max {SAFETY_CAPS.maxCompanies} companies, {SAFETY_CAPS.maxLeads} leads, {SAFETY_CAPS.maxQueries} queries.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="maxCompanies" className="block text-xs font-medium text-gray-700 mb-1">
                    Max Companies
                  </label>
                  <input
                    type="number"
                    id="maxCompanies"
                    min={1}
                    max={SAFETY_CAPS.maxCompanies}
                    placeholder={String(selectedIntent?.limits?.maxCompanies || 10)}
                    value={overrideMaxCompanies || ''}
                    onChange={(e) => setOverrideMaxCompanies(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="maxLeads" className="block text-xs font-medium text-gray-700 mb-1">
                    Max Leads
                  </label>
                  <input
                    type="number"
                    id="maxLeads"
                    min={1}
                    max={SAFETY_CAPS.maxLeads}
                    placeholder={String(selectedIntent?.limits?.maxLeads || 10)}
                    value={overrideMaxLeads || ''}
                    onChange={(e) => setOverrideMaxLeads(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="maxQueries" className="block text-xs font-medium text-gray-700 mb-1">
                    Max Queries
                  </label>
                  <input
                    type="number"
                    id="maxQueries"
                    min={1}
                    max={SAFETY_CAPS.maxQueries}
                    placeholder={String(selectedIntent?.limits?.maxQueries || 3)}
                    value={overrideMaxQueries || ''}
                    onChange={(e) => setOverrideMaxQueries(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

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
            disabled={isLoading || !runnerEnabled || googleConfigured === false}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={googleConfigured === false ? 'Google Discovery is not configured' : undefined}
          >
            {isLoading ? 'Running...' : 'Dry Run'}
          </button>
          <button
            onClick={() => runDiscovery(false)}
            disabled={isLoading || !runnerEnabled || googleConfigured === false}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={googleConfigured === false ? 'Google Discovery is not configured' : undefined}
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
        <RunDetailsModal run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}
    </div>
  );
}
