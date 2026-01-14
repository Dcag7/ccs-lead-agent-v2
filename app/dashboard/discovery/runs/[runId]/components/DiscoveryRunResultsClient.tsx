'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Raw result as stored in resultsJson (matches lib/discovery/types.ts)
 */
interface RawDiscoveryResult {
  type: 'company' | 'contact' | 'lead';
  name?: string;
  website?: string;
  description?: string;
  email?: string;
  phone?: string;
  industry?: string;
  country?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  linkedInUrl?: string;
  source?: string;
  discoveryTimestamp?: string;
  company?: RawDiscoveryResult;
  contact?: RawDiscoveryResult;
  additionalMetadata?: Record<string, unknown>;
  discoveryMetadata?: {
    discoverySource?: string;
    discoveryTimestamp?: string;
    discoveryMethod?: string;
    additionalMetadata?: {
      relevanceScore?: number;
      relevanceReasons?: string[];
      detectedIndustry?: string;
      confidence?: string;
      channel?: string;
      scrapedDescription?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

/**
 * Normalized result for UI display
 */
interface DiscoveryResult {
  id: string;
  type: 'company' | 'contact' | 'lead';
  name?: string;
  companyName?: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
  relevanceScore?: number;
  discoverySource?: string;
  channel?: string;
  industry?: string;
  relevanceReasons?: string[];
  confidence?: string;
}

/**
 * Normalize raw results from storage to flat UI structure
 */
function normalizeResults(rawResults: RawDiscoveryResult[]): DiscoveryResult[] {
  return rawResults.map((raw, idx) => {
    if (raw.type === 'lead') {
      const company = raw.company;
      const contact = raw.contact;
      return {
        id: `result-${idx}`,
        type: 'lead' as const,
        name: contact?.name || contact?.firstName 
          ? `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim()
          : company?.name,
        companyName: company?.name,
        website: company?.website,
        email: contact?.email || company?.email,
        phone: contact?.phone || company?.phone,
        description: company?.description,
        industry: company?.industry,
        relevanceScore: company?.discoveryMetadata?.additionalMetadata?.relevanceScore as number | undefined,
        relevanceReasons: company?.discoveryMetadata?.additionalMetadata?.relevanceReasons as string[] | undefined,
        confidence: company?.discoveryMetadata?.additionalMetadata?.confidence as string | undefined,
        discoverySource: raw.source || company?.discoveryMetadata?.discoverySource,
        channel: raw.source || company?.discoveryMetadata?.discoverySource,
      };
    }

    const metadata = raw.discoveryMetadata;
    const additionalMeta = metadata?.additionalMetadata;

    return {
      id: `result-${idx}`,
      type: raw.type,
      name: raw.name || (raw.firstName ? `${raw.firstName} ${raw.lastName || ''}`.trim() : undefined),
      companyName: raw.companyName,
      website: raw.website,
      email: raw.email,
      phone: raw.phone,
      description: raw.description,
      industry: raw.industry,
      relevanceScore: additionalMeta?.relevanceScore as number | undefined,
      relevanceReasons: additionalMeta?.relevanceReasons as string[] | undefined,
      confidence: additionalMeta?.confidence as string | undefined,
      discoverySource: metadata?.discoverySource,
      channel: metadata?.discoverySource || additionalMeta?.channel,
    };
  });
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
    category?: string;
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
    createdCompaniesCount?: number;
    createdLeadsCount?: number;
  };
  results: RawDiscoveryResult[];
}

export default function DiscoveryRunResultsClient({ run, results: rawResults }: Props) {
  const results = useMemo(() => normalizeResults(rawResults), [rawResults]);
  const router = useRouter();
  
  // Modal states
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DiscoveryResult | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Filters - defaults: minScore=0, channel=all, hasEmail=all, sort by score desc
  const [minScore, setMinScore] = useState<string>('0');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [hasEmail, setHasEmail] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...results];

    // Filter by minScore (default 0, so only filter if explicitly set higher)
    if (minScore && minScore !== '0') {
      const threshold = parseFloat(minScore);
      if (!isNaN(threshold)) {
        filtered = filtered.filter((r) => (r.relevanceScore ?? 0) >= threshold);
      }
    }

    if (selectedChannel) {
      filtered = filtered.filter((r) => {
        const channel = r.channel || r.discoverySource || '';
        return channel.toLowerCase().includes(selectedChannel.toLowerCase());
      });
    }

    if (hasEmail !== null) {
      filtered = filtered.filter((r) => !!r.email === hasEmail);
    }

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

  const channels = useMemo(() => {
    const channelSet = new Set<string>();
    results.forEach((r) => {
      const channel = r.channel || r.discoverySource || 'unknown';
      if (channel) channelSet.add(channel);
    });
    return Array.from(channelSet).sort();
  }, [results]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedResults.map(r => r.id)));
    }
  };

  const selectedResults = filteredAndSortedResults.filter(r => selectedIds.has(r.id));

  // Create companies from selected
  const handleCreateCompanies = async () => {
    if (selectedResults.length === 0) return;

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch('/api/discovery/create-from-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: run.id,
          results: selectedResults.map(r => ({
            name: r.name || r.companyName,
            website: r.website,
            email: r.email,
            phone: r.phone,
            description: r.description,
            industry: r.industry,
            relevanceScore: r.relevanceScore,
            channel: r.channel,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCreateSuccess(`Created ${data.companiesCreated} companies (${data.companiesSkipped} skipped as duplicates)`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        setCreateError(data.error || 'Failed to create companies');
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create companies');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRerunAsReal = async () => {
    setIsRerunning(true);
    setRerunError(null);

    try {
      // Materialize the existing run (convert dry-run to real run)
      const res = await fetch(`/api/discovery/runs/${run.id}/materialize`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      // Check content-type before parsing
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        console.error(`[Materialize] Response failed: status=${res.status}, content-type=${contentType}`);
        if (!contentType?.includes('application/json')) {
          const text = await res.text();
          console.error(`[Materialize] Non-JSON response: ${text.substring(0, 200)}`);
          setRerunError('Server returned non-JSON (likely auth redirect). Please refresh and sign in.');
          return;
        }
      }

      if (!contentType?.includes('application/json')) {
        const text = await res.text();
        console.error(`[Materialize] Non-JSON response: ${text.substring(0, 200)}`);
        setRerunError('Server returned non-JSON (likely auth redirect). Please refresh and sign in.');
        return;
      }

      const data = await res.json();

      if (data.success) {
        // Refresh the page to show updated run status
        router.refresh();
        setShowRerunConfirm(false);
      } else {
        setRerunError(data.error || 'Failed to materialize discovery run');
      }
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        setRerunError('Server returned invalid JSON. Please refresh and try again.');
      } else {
        setRerunError(error instanceof Error ? error.message : 'Failed to materialize discovery run');
      }
      console.error('[Materialize] Error:', error);
    } finally {
      setIsRerunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'completed_with_errors': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const includeKeywords = (run.stats.intentConfig?.includeKeywords as string[]) || [];
  const excludeKeywords = (run.stats.intentConfig?.excludeKeywords as string[]) || [];

  return (
    <div className="space-y-6">
      {/* Run Summary - Consolidated Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(run.status)}`}>
                {run.status}
                {run.dryRun && ' (preview)'}
              </span>
              {run.intentName && (
                <span className="text-sm text-gray-700">{run.intentName}</span>
              )}
            </div>
            <p className="text-sm text-gray-700">
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
              Run as Real (Create Records)
            </button>
          )}
        </div>

        {run.stats.intentConfig && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {/* One-line intent meta with · separators */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-700">
              {run.stats.intentConfig.targetCountries && run.stats.intentConfig.targetCountries.length > 0 && (
                <span className="whitespace-nowrap">
                  <span className="font-medium text-gray-900">Countries:</span>{' '}
                  {run.stats.intentConfig.targetCountries.join(', ')}
                </span>
              )}
              {run.stats.intentConfig.category && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-medium text-gray-900">Category:</span>{' '}
                    {run.stats.intentConfig.category}
                  </span>
                </>
              )}
              {run.stats.limitsUsed?.channels && run.stats.limitsUsed.channels.length > 0 && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-medium text-gray-900">Channels:</span>{' '}
                    {run.stats.limitsUsed.channels.join(', ')}
                  </span>
                </>
              )}
              {run.stats.limitsUsed?.maxCompanies !== undefined && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-medium text-gray-900">Max Companies:</span>{' '}
                    {run.stats.limitsUsed.maxCompanies}
                  </span>
                </>
              )}
              {run.stats.limitsUsed?.maxLeads !== undefined && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-medium text-gray-900">Max Leads:</span>{' '}
                    {run.stats.limitsUsed.maxLeads}
                  </span>
                </>
              )}
              {run.stats.limitsUsed?.maxQueries !== undefined && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-medium text-gray-900">Max Queries:</span>{' '}
                    {run.stats.limitsUsed.maxQueries}
                  </span>
                </>
              )}
            </div>
            
            {/* Include Keywords as Chips */}
            {includeKeywords.length > 0 && (
              <div className="mt-3">
                <dt className="text-sm font-medium text-gray-700 mb-2">Include Keywords</dt>
                <dd className="flex flex-wrap gap-2">
                  {includeKeywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </dd>
              </div>
            )}

            {/* Exclude Keywords as Chips */}
            {excludeKeywords.length > 0 && (
              <div className="mt-3">
                <dt className="text-sm font-medium text-gray-700 mb-2">Exclude Keywords</dt>
                <dd className="flex flex-wrap gap-2">
                  {excludeKeywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </div>
        )}

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

      {/* Action Bar */}
      {run.dryRun && filteredAndSortedResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedIds.size} of {filteredAndSortedResults.length} selected
              </span>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleCreateCompanies}
                  disabled={isCreating}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {isCreating ? 'Creating...' : `Create ${selectedIds.size} Companies`}
                </button>
              )}
            </div>
            {(createError || createSuccess) && (
              <div className={`text-sm ${createError ? 'text-red-600' : 'text-green-600'}`}>
                {createError || createSuccess}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Score</label>
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All Channels</option>
              {channels.map((ch) => (<option key={ch} value={ch}>{ch}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Has Email</label>
            <select
              value={hasEmail === null ? '' : hasEmail ? 'yes' : 'no'}
              onChange={(e) => setHasEmail(e.target.value === '' ? null : e.target.value === 'yes')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
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
                {run.dryRun && (
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredAndSortedResults.length && filteredAndSortedResults.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[250px]">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Website</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-64">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedResults.length === 0 ? (
                <tr>
                  <td colSpan={run.dryRun ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                    No results found
                  </td>
                </tr>
              ) : (
                filteredAndSortedResults.map((result) => (
                  <tr key={result.id} className={`hover:bg-gray-50 ${selectedIds.has(result.id) ? 'bg-teal-50' : ''}`}>
                    {run.dryRun && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(result.id)}
                          onChange={() => toggleSelection(result.id)}
                          className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {result.relevanceScore !== undefined ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${getScoreColor(result.relevanceScore)}`}>
                          {Math.round(result.relevanceScore)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{result.name || result.companyName || '-'}</div>
                      {result.industry && (
                        <div className="text-xs text-gray-500 mt-0.5">{result.industry}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {result.website ? (
                        <a
                          href={result.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 hover:underline truncate block max-w-[180px]"
                          title={result.website}
                        >
                          {result.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.description ? (
                        <div className="max-w-[16rem]">
                          <div className="line-clamp-2" title={result.description}>
                            {result.description}
                          </div>
                          {result.description.length > 100 && (
                            <button
                              onClick={() => setSelectedDetail(result)}
                              className="text-teal-600 hover:text-teal-800 text-xs mt-1 font-medium"
                            >
                              View full
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {result.email && (
                        <div className="truncate max-w-[180px]">
                          <a href={`mailto:${result.email}`} className="text-teal-600 hover:text-teal-800" title={result.email}>
                            {result.email}
                          </a>
                        </div>
                      )}
                      {result.phone && (
                        <div className="text-gray-500 text-xs mt-0.5">{result.phone}</div>
                      )}
                      {!result.email && !result.phone && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {result.channel || result.discoverySource || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => setSelectedDetail(result)}
                        className="text-teal-600 hover:text-teal-800 font-medium"
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

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-gray-600/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDetail.name || selectedDetail.companyName || 'Company Details'}
              </h3>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedDetail.relevanceScore !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Relevance Score:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(selectedDetail.relevanceScore)}`}>
                    {Math.round(selectedDetail.relevanceScore)}
                  </span>
                  {selectedDetail.confidence && (
                    <span className="text-sm text-gray-500">({selectedDetail.confidence} confidence)</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="mt-1">
                    {selectedDetail.website ? (
                      <a href={selectedDetail.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                        {selectedDetail.website}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Industry</dt>
                  <dd className="mt-1 text-gray-900">{selectedDetail.industry || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1">
                    {selectedDetail.email ? (
                      <a href={`mailto:${selectedDetail.email}`} className="text-teal-600 hover:underline">
                        {selectedDetail.email}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-gray-900">{selectedDetail.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Source</dt>
                  <dd className="mt-1 text-gray-900 capitalize">{selectedDetail.channel || selectedDetail.discoverySource || '-'}</dd>
                </div>
              </div>

              {selectedDetail.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Description</dt>
                  <dd className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{selectedDetail.description}</dd>
                </div>
              )}

              {selectedDetail.relevanceReasons && selectedDetail.relevanceReasons.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Relevance Reasons</dt>
                  <dd className="flex flex-wrap gap-2">
                    {selectedDetail.relevanceReasons.map((reason, idx) => (
                      <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                        {reason}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              {run.dryRun && !selectedIds.has(selectedDetail.id) && (
                <button
                  onClick={() => {
                    toggleSelection(selectedDetail.id);
                    setSelectedDetail(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  Select for Creation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Re-run Confirmation Modal */}
      {showRerunConfirm && (
        <div className="fixed inset-0 bg-gray-600/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Run as Real (Create Records)</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will create Company, Contact, and Lead records from the existing discovery results. The same run will be updated (no new run will be created). Continue?
            </p>
            {rerunError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{rerunError}</div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowRerunConfirm(false); setRerunError(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isRerunning}
              >
                Cancel
              </button>
              <button
                onClick={handleRerunAsReal}
                disabled={isRerunning}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
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
