/**
 * Phase 2: Enrichment - Company Enricher Interface
 * 
 * Interface for company enrichment modules.
 * Each enricher is responsible for enriching company data from a specific source.
 */

import type { CompanyEnrichmentInput, EnrichmentOptions, EnrichmentResult } from './types';

/**
 * Company Enricher Interface
 * 
 * Defines the contract for enrichment modules:
 * - WebsiteEnricher: Extracts data from company website
 * - GoogleCseEnricher: Extracts data from Google Custom Search Engine
 * - Future: LinkedInEnricher, CrunchbaseEnricher, etc.
 */
export interface ICompanyEnricher {
  /**
   * Get the unique name/identifier for this enricher
   * Examples: "website", "googleCse", "linkedin"
   * 
   * @returns Enricher name
   */
  getName(): string;

  /**
   * Enrich a company using this enricher
   * 
   * @param company - Company record (minimal fields: id, name, website?, country?)
   * @param options - Enrichment options (forceRefresh, etc.)
   * @returns Enrichment result for this source
   */
  enrich(
    company: CompanyEnrichmentInput
  ): Promise<EnrichmentResult>;
}
