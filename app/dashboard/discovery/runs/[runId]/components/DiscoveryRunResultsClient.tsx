'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface DiscoveryResult {
  type: 'company' | 'contact' | 'lead';
  name?: string;
  companyName?: string;
  website?: string;
  url?: string;
  email?: string;
  phone?: string;
  description?: string;
  relevanceScore?: number;
  discoverySource?: string;
  discoveryMetadata?: {
    discoverySource?: string;
    channel?: string;
    [key: string]: any;
  };
}

interface RunStats {
  totalDiscovered?: number;
  totalAfterDedupe?: number;
  companiesCreated?: number;
  contactsCreated?: number;
  leadsCreated?: number;
  channelResults?: Record<string, number>;
  intentConfig?: {
    intentId?: string;
    intentName?: string;
    targetCountries?: string[];
    queriesCount?: number;
    includeKeywords?: string[];
    excludeKeywords?: string[];
  };
  limitsUsed?: {
    maxCompanies?: number;
    maxLeads?: number;
    maxQueries?: number;
    maxRuntimeSeconds?: number;
    channels?: string[];
  };
}

interface Props {
  run: {
    id: string;
    status: string;
    dryRun: boolean;
    intentId: string | null;
    intentName: string | null;
    startedAt: string;
    finishedAt: string | null;
    stats: RunStats;
  };
  results: DiscoveryResult[];
}

export default function DiscoveryRunResultsClient({ run, results }: Props) {
  const router = useRouter();
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);

  // Filters
  const [minScore, setMinScore] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [hasEmail, setHasEmail] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...results];

    // Filter by score threshold
    if (minScore) {
      const threshold = parseFloat(minScore);
      filtered = filtered.filter((r) => {
        const score = r.relevanceScore ?? 0;
        return score >= threshold;
      });
    }

    // Filter by channel
    if (selectedChannel) {
      filtered = filtered.filter((r) => {
        const channel = r.discoveryMetadata?.channel || r.discoverySource || '';
        return channel.toLowerCase().includes(selectedChannel.toLowerCase());
      });
    }

    // Filter by hasEmail
    if (hasEmail !== null) {
      filtered = filtered.filter((r) => {
        const hasEmailValue = !!(r.email || (r.type === 'lead' && r.email));
        return hasEmailValue === hasEmail;
      });
    }

    // Sort
    filtered.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

      if (sortBy === 'score') {
        aValue = a.relevanceScore ?? 0;
        bValue = b.relevanceScore ?? 0;
      } else {
        aValue = (a.name || a.companyName || '').toLowerCase();
        bValue = (b.name || b.companyName || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [results, minScore, selectedChannel, hasEmail, sortBy, sortOrder]);

  // Get unique channels for filter
  const channels = useMemo(() => {
    const channelSet = new Set<string>();
    results.forEach((r) => {
      const channel = r.discoveryMetadata?.channel || r.discoverySource || 'unknown';
      if (channel) channelSet.add(channel);
    });
    return Array.from(channelSet).sort();
  }, [results]);

  const handleRerunAsReal = async () => {
    if (!run.intentId) {
      setRerunError('Cannot re-run: no intent ID found');
      return;
    }

    setIsRerunning(true);
    setRerunError(null);

    try {
      const res = await fetch('/api/discovery/manual/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: run.intentId,
          dryRun: false,
          overrides: run.stats.limitsUsed
            ? {
                limits: {
                  maxCompanies: run.stats.limitsUsed.maxCompanies,
                  maxLeads: run.stats.limitsUsed.maxLeads,
                  maxQueries: run.stats.limitsUsed.maxQueries,
                  timeBudgetMs: run.stats.limitsUsed.maxRuntimeSeconds
                    ? run.stats.limitsUsed.maxRuntimeSeconds * 1000
                    : undefined,
                },
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to the new run's results page
        router.push(`/dashboard/discovery/runs/${data.runId}`);
      } else {
        setRerunError(data.error || 'Failed to re-run discovery');
      }
    } catch (error) {
      setRerunError(error instanceof Error ? error.message : 'Failed to re-run discovery');
    } finally {
      setIsRerunning(false);
      setShowRerunConfirm(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Run Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(run.status)}`}
              >
                {run.status}
                {run.dryRun && ' (dry run)'}
              </span>
              {run.intentName && (
                <span className="text-sm text-gray-600">{run.intentName}</span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Started: {new Date(run.startedAt).toLocaleString()}
              {run.finishedAt && (
                <> • Finished: {new Date(run.finishedAt).toLocaleString()}</>
              )}
            </p>
          </div>
          {run.dryRun && run.intentId && (
            <button
              onClick={() => setShowRerunConfirm(true)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Re-run as Real Run
            </button>
          )}
        </div>

        {/* Intent Config Summary */}
        {run.stats.intentConfig && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Intent Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Countries:</span>{' '}
                <span className="font-medium">
                  {run.stats.intentConfig.targetCountries?.join(', ') || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Queries:</span>{' '}
                <span className="font-medium">{run.stats.intentConfig.queriesCount || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Include Keywords:</span>{' '}
                <span className="font-medium">
                  {run.stats.intentConfig.includeKeywords?.length || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Exclude Keywords:</span>{' '}
                <span className="font-medium">
                  {run.stats.intentConfig.excludeKeywords?.length || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Channel Breakdown */}
        {run.stats.channelResults && Object.keys(run.stats.channelResults).length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Channel Breakdown</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(run.stats.channelResults).map(([channel, count]) => (
                <div key={channel} className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                  <span className="text-xs text-gray-500 capitalize">{channel}:</span>{' '}
                  <span className="font-semibold text-gray-900">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Min Score
            </label>
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Channel
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All Channels</option>
              {channels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Has Email
            </label>
            <select
              value={hasEmail === null ? '' : hasEmail ? 'yes' : 'no'}
              onChange={(e) =>
                setHasEmail(e.target.value === '' ? null : e.target.value === 'yes')
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="score">Score</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredAndSortedResults.length} of {results.length} results
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name / Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Website
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email / Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No results found
                  </td>
                </tr>
              ) : (
                filteredAndSortedResults.map((result, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                        {result.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {result.name || result.companyName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {result.website || result.url ? (
                        <a
                          href={result.website || result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 hover:underline"
                        >
                          {result.website || result.url}
                          <svg
                            className="inline-block w-3 h-3 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                      {result.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.email && (
                        <div>
                          <a
                            href={`mailto:${result.email}`}
                            className="text-teal-600 hover:text-teal-800"
                          >
                            {result.email}
                          </a>
                        </div>
                      )}
                      {result.phone && (
                        <div className="text-gray-500">{result.phone}</div>
                      )}
                      {!result.email && !result.phone && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {result.relevanceScore !== undefined ? (
                        <span className="font-medium text-gray-900">
                          {result.relevanceScore.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {result.discoveryMetadata?.channel ||
                        result.discoverySource ||
                        'unknown'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Re-run Confirmation Modal */}
      {showRerunConfirm && (
        <div className="fixed inset-0 bg-gray-600/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Re-run as Real Run
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will create companies and leads in the database using the same intent and
              limits as this dry run. Are you sure you want to continue?
            </p>
            {rerunError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {rerunError}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRerunConfirm(false);
                  setRerunError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isRerunning}
              >
                Cancel
              </button>
              <button
                onClick={handleRerunAsReal}
                disabled={isRerunning}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRerunning ? 'Running...' : 'Confirm & Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
