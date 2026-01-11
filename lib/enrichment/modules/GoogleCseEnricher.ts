/**
 * Phase 2: Enrichment - Google CSE Enricher Module
 * 
 * Enriches company data using Google Custom Search Engine.
 * Reuses existing lib/googleSearch.ts utilities.
 */

import type { ICompanyEnricher } from '../ICompanyEnricher';
import type {
  CompanyEnrichmentInput,
  EnrichmentResult,
} from '../types';
import {
  searchCompany,
  isLikelyCompanyWebsite,
  inferIndustryFromSnippet,
} from '@/lib/googleSearch';

/**
 * Google CSE Enricher
 * 
 * Enriches company data by searching Google Custom Search Engine.
 * - Reuses existing searchCompany() utility
 * - Validates and extracts website URLs
 * - Infers industry from search snippets
 * - Handles configuration errors gracefully
 */
export class GoogleCseEnricher implements ICompanyEnricher {
  getName(): string {
    return 'googleCse';
  }

  async enrich(
    company: CompanyEnrichmentInput
  ): Promise<EnrichmentResult> {
    const timestamp = new Date().toISOString();

    try {
      // Build search query
      let searchQuery = company.name;
      if (company.country) {
        searchQuery += ` ${company.country}`;
      }

      // Perform Google CSE search (reuses existing utility)
      const searchResult = await searchCompany(company.name, company.country || undefined);

      // Check if Google CSE is configured
      if (!searchResult.configured) {
        return {
          source: this.getName(),
          timestamp,
          success: false,
          data: {
            configured: false,
            query: searchQuery,
          },
          error: searchResult.error || 'Google CSE not configured',
        };
      }

      // Check if search was successful
      if (!searchResult.success) {
        return {
          source: this.getName(),
          timestamp,
          success: false,
          data: {
            configured: true,
            query: searchQuery,
          },
          error: searchResult.error || 'Google CSE search failed',
        };
      }

      // Extract data from search results
      const primaryUrl = searchResult.primaryUrl;
      const snippet = searchResult.snippet;
      const rawItems = searchResult.rawItems || [];

      // Validate primary URL (filter out non-company websites)
      const websiteFound =
        primaryUrl && isLikelyCompanyWebsite(primaryUrl) ? true : false;

      // Infer industry from snippet (if available)
      const inferredIndustry = snippet ? inferIndustryFromSnippet(snippet) : undefined;

      // Build enrichment result (will be converted to GoogleCseEnrichmentResult by runner)
      return {
        source: this.getName(),
        timestamp,
        success: true,
        data: {
          configured: true,
          query: searchQuery,
          primaryUrl,
          snippet,
          rawResults: rawItems.map((item) => ({
            title: item.title || '',
            link: item.link || '',
            snippet: item.snippet || '',
            displayLink: item.displayLink,
          })),
          metadata: searchResult.metadata
            ? {
                totalResults: searchResult.metadata.totalResults,
                searchTime: searchResult.metadata.searchTime,
                formattedSearchTime: searchResult.metadata.formattedSearchTime,
              }
            : undefined,
          inferredIndustry: inferredIndustry || undefined,
          websiteFound,
        },
      };
    } catch (error: unknown) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during Google CSE enrichment';
      return {
        source: this.getName(),
        timestamp,
        success: false,
        data: {
          configured: true,
          query: company.name + (company.country ? ` ${company.country}` : ''),
        },
        error: errorMessage,
      };
    }
  }
}
