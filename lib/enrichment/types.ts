/**
 * Phase 2: Enrichment - Types
 * 
 * Defines EnrichmentData v1 structure and related types.
 * All enrichment results are stored in Company.enrichmentData JSON field.
 */

/**
 * Main enrichment data structure stored in Company.enrichmentData
 */
export interface EnrichmentData {
  version: '1.0';
  timestamp: string; // ISO 8601
  sources: {
    website?: WebsiteEnrichmentResult;
    googleCse?: GoogleCseEnrichmentResult;
  };
  metadata: {
    enrichmentRunId: string; // Unique ID for this run
    forceRefresh: boolean; // Whether this run forced refresh
    previousVersion?: string; // Previous version timestamp (for merge tracking)
  };
  errors?: Array<{
    source: 'website' | 'googleCse';
    error: string;
    timestamp: string;
  }>;
}

/**
 * Website enrichment result
 * Extracted from Company.website field
 */
export interface WebsiteEnrichmentResult {
  source: 'website';
  timestamp: string;
  url: string;
  success: boolean;
  data?: {
    title?: string;
    description?: string;
    accessible: boolean;
    statusCode?: number;
    contentType?: string;
  };
  error?: string;
}

/**
 * Google CSE enrichment result
 * Uses existing lib/googleSearch.ts utilities
 */
export interface GoogleCseEnrichmentResult {
  source: 'googleCse';
  timestamp: string;
  success: boolean;
  configured: boolean;
  query: string; // Actual search query used
  data?: {
    primaryUrl?: string;
    snippet?: string;
    rawResults?: Array<{
      title: string;
      link: string;
      snippet: string;
      displayLink?: string;
    }>;
    metadata?: {
      totalResults?: string;
      searchTime?: number;
      formattedSearchTime?: string;
    };
    inferredIndustry?: string;
    websiteFound?: boolean;
  };
  error?: string;
}

/**
 * Individual enrichment result from an enricher
 * Used internally by CompanyEnrichmentRunner
 */
export interface EnrichmentResult {
  source: string;
  success: boolean;
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // Source-specific data (varies by enricher)
  error?: string;
  configured?: boolean; // For Google CSE specifically
}

/**
 * Company input for enrichment
 * Minimal fields needed from Company model
 */
export interface CompanyEnrichmentInput {
  id: string;
  name: string;
  website?: string | null;
  country?: string | null;
}

/**
 * Enrichment options
 */
export interface EnrichmentOptions {
  forceRefresh?: boolean; // Default: false
}

/**
 * Enrichment summary returned by API
 */
export interface EnrichmentSummary {
  status: 'success' | 'failed';
  sourcesRun: string[];
  sourcesSucceeded: string[];
  sourcesFailed: string[];
  timestamp: string;
  contactsLeadsSummary?: ContactsLeadsSummary;
}

/**
 * Contacts and Leads persistence summary
 */
export interface ContactsLeadsSummary {
  extractedCandidatesCount: number;
  contactsCreated: number;
  contactsExisting: number;
  contactsUpdated: number;
  leadsCreated: number;
  leadsExisting: number;
}
