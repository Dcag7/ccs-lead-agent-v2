'use client';

import { useEffect, useState } from 'react';

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
  resultsJson?: unknown[] | null;
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

/**
 * Normalize raw results from resultsJson for display
 */
function normalizeResultsForPrint(rawResults: unknown[]): Array<{
  name?: string;
  website?: string;
  description?: string;
  email?: string;
  phone?: string;
  industry?: string;
  relevanceScore?: number;
  channel?: string;
  source?: string;
}> {
  return rawResults.map((raw: unknown) => {
    const item = raw as {
      type?: string;
      name?: string;
      website?: string;
      description?: string;
      email?: string;
      phone?: string;
      industry?: string;
      firstName?: string;
      lastName?: string;
      source?: string;
      company?: {
        name?: string;
        website?: string;
        description?: string;
        email?: string;
        phone?: string;
        industry?: string;
        discoveryMetadata?: {
          discoverySource?: string;
          additionalMetadata?: {
            relevanceScore?: number;
          };
        };
      };
      contact?: {
        name?: string;
        email?: string;
        phone?: string;
      };
      discoveryMetadata?: {
        discoverySource?: string;
        additionalMetadata?: {
          relevanceScore?: number;
          channel?: string;
        };
      };
    };
    if (item.type === 'lead') {
      const company = item.company;
      const contact = item.contact;
      return {
        name: contact?.name || company?.name,
        website: company?.website,
        description: company?.description,
        email: contact?.email || company?.email,
        phone: contact?.phone || company?.phone,
        industry: company?.industry,
        relevanceScore: company?.discoveryMetadata?.additionalMetadata?.relevanceScore,
        channel: item.source || company?.discoveryMetadata?.discoverySource,
        source: item.source || company?.discoveryMetadata?.discoverySource,
      };
    }

    const metadata = item.discoveryMetadata;
    const additionalMeta = metadata?.additionalMetadata;

    return {
      name: item.name || (item.firstName ? `${item.firstName} ${item.lastName || ''}`.trim() : undefined),
      website: item.website,
      description: item.description,
      email: item.email,
      phone: item.phone,
      industry: item.industry,
      relevanceScore: additionalMeta?.relevanceScore,
      channel: metadata?.discoverySource || additionalMeta?.channel,
      source: metadata?.discoverySource || additionalMeta?.channel,
    };
  });
}

export default function PrintViewClient({ runs }: Props) {
  // Use client-side only date to avoid hydration mismatch
  const [generatedDate, setGeneratedDate] = useState<string>('');

  useEffect(() => {
    // Set the date only on client to avoid hydration mismatch
    setGeneratedDate(formatDate(new Date().toISOString()));
    // Trigger print dialog when component mounts
    window.print();
  }, []);

  // Calculate total results across all runs
  const totalResults = runs.reduce((sum, run) => {
    const results = run.resultsJson && Array.isArray(run.resultsJson) ? run.resultsJson.length : 0;
    return sum + results;
  }, 0);

  return (
    <div className="print-container">
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.75cm;
            size: landscape;
          }
          body {
            background: white;
            font-size: 10pt;
          }
          /* Hide all dashboard chrome */
          nav,
          aside,
          header,
          .sidebar,
          .no-print,
          button {
            display: none !important;
          }
          .print-container {
            max-width: 100%;
            padding: 0;
            margin: 0;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          .results-table th {
            background: #f3f4f6;
            font-weight: 600;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #d1d5db;
          }
          .results-table td {
            padding: 5px 8px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
          }
          .results-table tr:nth-child(even) {
            background: #f9fafb;
          }
          .description-cell {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .run-header {
            page-break-before: auto;
            margin-top: 16px;
          }
          .run-header:first-child {
            margin-top: 0;
          }
          tr {
            page-break-inside: avoid;
          }
          .report-header {
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #111827;
          }
          .run-summary {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 8px;
            font-size: 9pt;
          }
        }
        @media screen {
          .print-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 1.5rem;
            background: white;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .results-table th {
            background: #f3f4f6;
            font-weight: 600;
            text-align: left;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
          }
          .results-table td {
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
          }
          .results-table tr:nth-child(even) {
            background: #f9fafb;
          }
          .results-table tr:hover {
            background: #f0fdf4;
          }
          .description-cell {
            max-width: 350px;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Screen-only action buttons */}
        <div className="mb-6 no-print flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
          >
            Print Report
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>

        {/* Report Header */}
        <div className="report-header">
          <h1 className="text-2xl font-bold text-gray-900">
            Discovery Results Report
          </h1>
          <div className="text-sm text-gray-600 mt-1">
            Generated: {generatedDate || '—'} • {runs.length} run{runs.length !== 1 ? 's' : ''} • {totalResults} total result{totalResults !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Runs with Results */}
        {runs.map((run, runIndex) => {
          const normalizedResults = run.resultsJson && Array.isArray(run.resultsJson) && run.resultsJson.length > 0
            ? normalizeResultsForPrint(run.resultsJson)
            : [];

          return (
            <div key={run.id} className={`run-section ${runIndex > 0 ? 'run-header' : ''}`}>
              {/* Run Summary (compact) */}
              <div className="mb-3 pb-2 border-b border-gray-300">
                <h2 className="text-lg font-semibold text-gray-900">
                  {run.intentName || run.mode}{run.dryRun ? ' (Preview)' : ''}
                </h2>
                <div className="run-summary text-sm text-gray-600">
                  <span><strong>Date:</strong> {formatDate(run.startedAt)}</span>
                  <span><strong>Duration:</strong> {formatDuration(run.startedAt, run.finishedAt)}</span>
                  <span><strong>Status:</strong> {run.status}</span>
                  {run.dryRun ? (
                    <span><strong>Discovered:</strong> {normalizedResults.length}</span>
                  ) : (
                    <>
                      <span><strong>Companies:</strong> {run.createdCompaniesCount}</span>
                      <span><strong>Contacts:</strong> {run.createdContactsCount}</span>
                      <span><strong>Leads:</strong> {run.createdLeadsCount}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Results Table (the main focus) */}
              {normalizedResults.length > 0 ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Score</th>
                      <th style={{ width: '180px' }}>Company</th>
                      <th style={{ width: '200px' }}>Website</th>
                      <th>Description</th>
                      <th style={{ width: '120px' }}>Contact</th>
                      <th style={{ width: '80px' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedResults.map((result, idx) => (
                      <tr key={idx}>
                        <td className="text-center font-medium">
                          {result.relevanceScore !== undefined ? Math.round(result.relevanceScore) : '-'}
                        </td>
                        <td>
                          <div className="font-medium text-gray-900">{result.name || '-'}</div>
                          {result.industry && (
                            <div className="text-xs text-gray-500 mt-0.5">{result.industry}</div>
                          )}
                        </td>
                        <td className="text-gray-700 text-sm">
                          {result.website || '-'}
                        </td>
                        <td className="description-cell text-gray-700 text-sm">
                          {result.description || '-'}
                        </td>
                        <td className="text-sm">
                          {result.email && <div className="text-gray-700">{result.email}</div>}
                          {result.phone && <div className="text-gray-500 text-xs">{result.phone}</div>}
                          {!result.email && !result.phone && <span className="text-gray-400">-</span>}
                        </td>
                        <td className="text-gray-600 text-sm capitalize">
                          {result.source || result.channel || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded border border-gray-200">
                  <p className="font-medium">No discovery results available for this run.</p>
                  <p className="text-sm mt-1">
                    {run.createdCompaniesCount > 0 
                      ? 'Results data may not have been stored for this run.'
                      : 'This run did not discover any companies.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          Discovery Results Report • CCS Lead Agent
        </div>
      </div>
    </div>
  );
}
