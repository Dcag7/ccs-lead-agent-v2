'use client';

import { useEffect } from 'react';

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
  runs: DiscoveryRun[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) return '-';
  const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${Math.floor(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
}

function getTriggeredByLabel(triggeredBy: string | null) {
  if (!triggeredBy) return 'unknown';
  if (triggeredBy === 'manual') return 'Manual';
  if (triggeredBy === 'cron') return 'Automated';
  if (triggeredBy === 'test-script') return 'Test';
  if (triggeredBy.includes('manual-ui')) return 'Manual';
  if (triggeredBy.includes('jobs/discovery')) return 'Automated';
  return triggeredBy;
}

export default function PrintViewClient({ runs }: Props) {
  useEffect(() => {
    // Trigger print dialog when component mounts
    window.print();
  }, []);

  return (
    <div className="print-container">
      <style jsx global>{`
        @media print {
          @page {
            margin: 1cm;
          }
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100%;
            padding: 0;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
          }
        }
        @media screen {
          .print-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: white;
          }
        }
      `}</style>

      <div className="print-container">
        <div className="mb-6 no-print">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discovery Run Report
          </h1>
          <p className="text-gray-600">
            Generated: {new Date().toLocaleString()}
          </p>
          <p className="text-gray-600">
            Total Runs: {runs.length}
          </p>
        </div>

        <div className="space-y-6">
          {runs.map((run) => {
            const stats = run.stats as {
              durationMs?: number;
              totalDiscovered?: number;
              totalAfterDedupe?: number;
              companiesCreated?: number;
              channelResults?: Record<string, number>;
              intentConfig?: {
                intentName?: string;
                targetCountries?: string[];
                includeKeywords?: string[];
                excludeKeywords?: string[];
              };
            } | null;

            return (
              <div key={run.id} className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {run.intentName || run.mode} {run.dryRun && '(Preview)'}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>{' '}
                      <span className="font-medium">{run.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Triggered By:</span>{' '}
                      <span className="font-medium">{getTriggeredByLabel(run.triggeredBy)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Started:</span>{' '}
                      <span className="font-medium">{formatDate(run.startedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>{' '}
                      <span className="font-medium">{formatDuration(run.startedAt, run.finishedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {run.dryRun ? (
                      <>
                        <div>
                          <span className="text-gray-500">Discovered:</span>{' '}
                          <span className="font-medium">{stats?.totalAfterDedupe ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Before Dedupe:</span>{' '}
                          <span className="font-medium">{stats?.totalDiscovered ?? 0}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-gray-500">Companies:</span>{' '}
                          <span className="font-medium">{run.createdCompaniesCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Contacts:</span>{' '}
                          <span className="font-medium">{run.createdContactsCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Leads:</span>{' '}
                          <span className="font-medium">{run.createdLeadsCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Skipped:</span>{' '}
                          <span className="font-medium">{run.skippedCount}</span>
                        </div>
                      </>
                    )}
                    {run.errorCount > 0 && (
                      <div>
                        <span className="text-gray-500">Errors:</span>{' '}
                        <span className="font-medium text-red-600">{run.errorCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {stats?.channelResults && Object.keys(stats.channelResults).length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Channel Breakdown</h3>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(stats.channelResults).map(([channel, count]) => (
                        <div key={channel} className="text-sm">
                          <span className="text-gray-500 capitalize">{channel}:</span>{' '}
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats?.intentConfig && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Configuration</h3>
                    <div className="text-sm space-y-1">
                      {stats.intentConfig.targetCountries && (
                        <div>
                          <span className="text-gray-500">Countries:</span>{' '}
                          <span className="font-medium">{stats.intentConfig.targetCountries.join(', ')}</span>
                        </div>
                      )}
                      {stats.intentConfig.includeKeywords && stats.intentConfig.includeKeywords.length > 0 && (
                        <div>
                          <span className="text-gray-500">Include Keywords:</span>{' '}
                          <span className="font-medium">{stats.intentConfig.includeKeywords.join(', ')}</span>
                        </div>
                      )}
                      {stats.intentConfig.excludeKeywords && stats.intentConfig.excludeKeywords.length > 0 && (
                        <div>
                          <span className="text-gray-500">Exclude Keywords:</span>{' '}
                          <span className="font-medium">{stats.intentConfig.excludeKeywords.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
