'use client';

/**
 * Company Enrichment Client Component
 * Phase 2: Enrichment MVP
 * 
 * Provides UI for manual on-demand company enrichment.
 * Supports WebsiteEnricher + GoogleCseEnricher.
 * 
 * FUTURE EXTENSIONS:
 * - Auto-refresh when enrichment completes (polling or WebSocket)
 * - Visual diff showing what data changed
 * - Enrichment history timeline
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EnrichmentData } from '@/lib/enrichment/types';

interface Company {
  id: string;
  name: string;
  website?: string | null;
  enrichmentStatus?: string | null;
  enrichmentLastRun?: Date | string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrichmentData?: any; // JsonValue from Prisma
}

interface Props {
  company: Company;
}

export default function CompanyEnrichment({ company }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(false);

  const handleEnrich = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/enrichment/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: company.id,
          forceRefresh,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Enrichment failed');
      }

      setSuccessMessage('Company enriched successfully!');
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during enrichment';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const enrichmentData = company.enrichmentData as unknown as EnrichmentData | null;
  const hasBeenEnriched = company.enrichmentStatus && company.enrichmentStatus !== 'never';

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'Never';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Use consistent format to avoid hydration mismatch
      // Format: "Jan 11, 2026, 2:51 PM" (consistent across server/client)
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      };
      return dateObj.toLocaleString('en-US', options);
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Company Enrichment</h2>
          <p className="text-sm text-gray-600 mt-1">
            Enrich company data from website and Google Custom Search
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={handleEnrich}
            disabled={loading}
            className={`px-4 py-2 rounded-md font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Enriching...' : 'Run Enrichment'}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={forceRefresh}
              onChange={(e) => setForceRefresh(e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>Force refresh</span>
          </label>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>Success:</strong> {successMessage}
          </p>
        </div>
      )}

      {/* Enrichment Status */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          {!hasBeenEnriched ? (
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
              Never Enriched
            </span>
          ) : company.enrichmentStatus === 'pending' ? (
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
              Pending
            </span>
          ) : company.enrichmentStatus === 'success' ? (
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Success
            </span>
          ) : (
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
              Failed
            </span>
          )}
        </div>

        {company.enrichmentLastRun && (
          <p className="text-sm text-gray-600">
            Last run: {formatDate(company.enrichmentLastRun)}
          </p>
        )}
      </div>

      {/* Enrichment Data Display */}
      {hasBeenEnriched && enrichmentData && (
        <div className="space-y-4">
          {/* Errors */}
          {enrichmentData.errors && enrichmentData.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-900 mb-2">Errors</h3>
              <ul className="space-y-1">
                {enrichmentData.errors.map((err, index) => (
                  <li key={index} className="text-sm text-red-800">
                    <strong>{err.source}:</strong> {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Website Enrichment */}
          {enrichmentData.sources?.website && (
            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Website Enrichment</h3>
              {enrichmentData.sources.website.success ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">URL:</span>
                    <a
                      href={enrichmentData.sources.website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm ml-2 break-all"
                    >
                      {enrichmentData.sources.website.url}
                    </a>
                  </div>
                  {enrichmentData.sources.website.data && (
                    <>
                      {enrichmentData.sources.website.data.title && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">Title:</span>
                          <p className="text-sm text-gray-900 ml-2">
                            {enrichmentData.sources.website.data.title}
                          </p>
                        </div>
                      )}
                      {enrichmentData.sources.website.data.description && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">Description:</span>
                          <p className="text-sm text-gray-900 ml-2">
                            {enrichmentData.sources.website.data.description}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-4 text-xs">
                        <span className="text-gray-600">
                          Accessible: {enrichmentData.sources.website.data.accessible ? 'Yes' : 'No'}
                        </span>
                        {enrichmentData.sources.website.data.statusCode && (
                          <span className="text-gray-600">
                            Status: {enrichmentData.sources.website.data.statusCode}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Failed: {enrichmentData.sources.website.error || 'Unknown error'}
                </div>
              )}
            </div>
          )}

          {/* Google CSE Enrichment */}
          {enrichmentData.sources?.googleCse && (
            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Google CSE Enrichment</h3>
              {enrichmentData.sources.googleCse.success ? (
                <div className="space-y-3">
                  {enrichmentData.sources.googleCse.data && (
                    <>
                      {enrichmentData.sources.googleCse.data.primaryUrl && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">Primary URL:</span>
                          <a
                            href={enrichmentData.sources.googleCse.data.primaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm ml-2 break-all"
                          >
                            {enrichmentData.sources.googleCse.data.primaryUrl}
                          </a>
                        </div>
                      )}
                      {enrichmentData.sources.googleCse.data.snippet && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">Snippet:</span>
                          <p className="text-sm text-gray-900 ml-2 italic">
                            {enrichmentData.sources.googleCse.data.snippet}
                          </p>
                        </div>
                      )}
                      {enrichmentData.sources.googleCse.data.inferredIndustry && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">Inferred Industry:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {enrichmentData.sources.googleCse.data.inferredIndustry}
                          </span>
                        </div>
                      )}
                      {enrichmentData.sources.googleCse.data.rawResults &&
                        enrichmentData.sources.googleCse.data.rawResults.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">
                              Search Results ({enrichmentData.sources.googleCse.data.rawResults.length}):
                            </span>
                            <div className="mt-2 space-y-2">
                              {enrichmentData.sources.googleCse.data.rawResults
                                .slice(0, 3)
                                .map((result, index) => (
                                  <div
                                    key={index}
                                    className="p-2 bg-white rounded border border-gray-200"
                                  >
                                    <a
                                      href={result.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium block"
                                    >
                                      {result.title}
                                    </a>
                                    <p className="text-xs text-gray-600 mt-1">{result.snippet}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      {enrichmentData.sources.googleCse.data.metadata && (
                        <div className="text-xs text-gray-500">
                          {enrichmentData.sources.googleCse.data.metadata.totalResults && (
                            <span>Total Results: {enrichmentData.sources.googleCse.data.metadata.totalResults}</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Failed: {enrichmentData.sources.googleCse.error || 'Unknown error'}
                  {!enrichmentData.sources.googleCse.configured && ' (Google CSE not configured)'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Never Enriched Message */}
      {!hasBeenEnriched && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            This company has not been enriched yet. Click the &quot;Run Enrichment&quot; button above
            to fetch data from the company website and Google Custom Search.
          </p>
        </div>
      )}
    </div>
  );
}
