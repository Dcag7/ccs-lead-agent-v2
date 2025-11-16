'use client';

/**
 * Company Enrichment Client Component
 * Phase 6: External Company Enrichment v1
 * 
 * Provides UI for manual on-demand company enrichment using Google CSE.
 * 
 * FUTURE EXTENSIONS:
 * - Auto-refresh when enrichment completes (polling or WebSocket)
 * - Visual diff showing what data changed
 * - Manual approval/rejection of auto-filled data
 * - Enrichment history timeline
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnrichmentData {
  source?: string;
  timestamp?: string;
  websiteFromGoogle?: string | null;
  snippet?: string | null;
  inferredIndustry?: string | null;
  error?: string;
  rawResults?: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
  metadata?: {
    totalResults?: string;
    searchTime?: number;
  };
}

interface Company {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  country?: string | null;
  enrichmentStatus?: string | null;
  enrichmentLastRun?: Date | null;
  enrichmentData?: EnrichmentData | null;
}

interface Props {
  company: Company;
}

export default function CompanyEnrichment({ company }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        body: JSON.stringify({ companyId: company.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Enrichment failed');
      }

      setSuccessMessage('Company enriched successfully!');
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during enrichment');
    } finally {
      setLoading(false);
    }
  };

  const enrichmentData = company.enrichmentData as EnrichmentData | null;
  const hasBeenEnriched = company.enrichmentStatus && company.enrichmentStatus !== 'never';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">External Enrichment</h2>
          <p className="text-sm text-gray-600 mt-1">
            Enrich company data using Google Custom Search
          </p>
        </div>
        <button
          onClick={handleEnrich}
          disabled={loading}
          className={`px-4 py-2 rounded-md font-medium text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Enriching...' : '🔍 Enrich from Google'}
        </button>
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
      <div className="mb-4">
        <div className="flex items-center gap-2">
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
          <p className="text-sm text-gray-600 mt-1">
            Last run: {new Date(company.enrichmentLastRun).toLocaleString()}
          </p>
        )}
      </div>

      {/* Enrichment Data Display */}
      {hasBeenEnriched && enrichmentData && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Error Message from Enrichment */}
          {enrichmentData.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{enrichmentData.error}</p>
            </div>
          )}

          {/* Website from Google */}
          {enrichmentData.websiteFromGoogle && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Website from Google
              </h3>
              <a
                href={enrichmentData.websiteFromGoogle}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm break-all"
              >
                {enrichmentData.websiteFromGoogle}
              </a>
              {!company.website && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Auto-filled in company profile
                </p>
              )}
            </div>
          )}

          {/* Inferred Industry */}
          {enrichmentData.inferredIndustry && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Inferred Industry
              </h3>
              <p className="text-sm text-gray-900">{enrichmentData.inferredIndustry}</p>
              {!company.industry && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Auto-filled in company profile
                </p>
              )}
            </div>
          )}

          {/* Snippet/Description */}
          {enrichmentData.snippet && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-900 italic">{enrichmentData.snippet}</p>
            </div>
          )}

          {/* Raw Search Results */}
          {enrichmentData.rawResults && enrichmentData.rawResults.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Search Results ({enrichmentData.rawResults.length})
              </h3>
              <div className="space-y-2">
                {enrichmentData.rawResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-50 rounded border border-gray-200"
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
                    <p className="text-xs text-gray-400 mt-1 break-all">{result.link}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {enrichmentData.metadata && (
            <div className="text-xs text-gray-500">
              {enrichmentData.metadata.totalResults && (
                <p>Total Results: {enrichmentData.metadata.totalResults}</p>
              )}
              {enrichmentData.metadata.searchTime && (
                <p>Search Time: {enrichmentData.metadata.searchTime}s</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Never Enriched Message */}
      {!hasBeenEnriched && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            This company has not been enriched yet. Click the "Enrich from Google" button
            above to fetch external data and automatically fill missing information.
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Enrichment will search Google for company information
              and may automatically fill the website and industry fields if they are empty.
            </p>
          </div>
        </div>
      )}

      {/* FUTURE EXTENSION: Visual indicator for scheduled enrichment */}
      {/* FUTURE EXTENSION: Show enrichment impact on lead scores */}
    </div>
  );
}
