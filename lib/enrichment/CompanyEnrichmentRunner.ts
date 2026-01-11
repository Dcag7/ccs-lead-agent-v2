/**
 * Phase 2: Enrichment - Company Enrichment Runner
 * 
 * Orchestrates multiple enrichers and merges results.
 * Implements merge strategy: preserves existing enrichmentData unless forceRefresh is true.
 */

import { prisma } from '@/lib/prisma';
import type { ICompanyEnricher } from './ICompanyEnricher';
import type {
  CompanyEnrichmentInput,
  EnrichmentData,
  EnrichmentResult,
  EnrichmentSummary,
  GoogleCseEnrichmentResult,
  WebsiteEnrichmentResult,
} from './types';
import { WebsiteEnricher } from './modules/WebsiteEnricher';
import { GoogleCseEnricher } from './modules/GoogleCseEnricher';
import { extractContactCandidates } from './contacts/extractContactCandidates';
import { persistContactsAndLeads } from './contacts/persistContactsAndLeads';

/**
 * Company Enrichment Runner
 * 
 * Orchestrates enrichment process:
 * 1. Loads company from database
 * 2. Initializes enrichers (WebsiteEnricher if website exists, GoogleCseEnricher always)
 * 3. Runs enrichers in parallel
 * 4. Merges results with existing enrichmentData
 * 5. Updates database (enrichmentData, enrichmentStatus, enrichmentLastRun)
 */
export class CompanyEnrichmentRunner {
  private enrichers: ICompanyEnricher[];

  constructor() {
    this.enrichers = [new WebsiteEnricher(), new GoogleCseEnricher()];
  }

  /**
   * Enrich a company by ID
   * 
   * @param companyId - Company ID
   * @param options - Enrichment options (forceRefresh)
   * @returns Enrichment summary
   */
  async enrichCompany(
    companyId: string,
    options?: { forceRefresh?: boolean }
  ): Promise<EnrichmentSummary> {
    // Load company from database
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    // Update status to pending
    await prisma.company.update({
      where: { id: companyId },
      data: { enrichmentStatus: 'pending' },
    });

    try {
      // Prepare company input for enrichers
      const companyInput: CompanyEnrichmentInput = {
        id: company.id,
        name: company.name,
        website: company.website,
        country: company.country || undefined,
      };

      // Load existing enrichment data
      const existingEnrichmentData =
        (company.enrichmentData as EnrichmentData | null) || null;

      // Determine which enrichers to run
      const enrichersToRun = this.selectEnrichers(companyInput);

      // Run enrichers in parallel
      const results = await Promise.allSettled(
        enrichersToRun.map((enricher) => enricher.enrich(companyInput))
      );

      // Process results (handle both fulfilled and rejected promises)
      const enrichmentResults: EnrichmentResult[] = [];
      const errors: EnrichmentData['errors'] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          enrichmentResults.push(result.value);
          if (!result.value.success && result.value.error) {
            errors.push({
              source: result.value.source as 'website' | 'googleCse',
              error: result.value.error,
              timestamp: result.value.timestamp,
            });
          }
        } else {
          // Handle promise rejection
          const enricherName = enrichersToRun[i].getName();
          const errorMsg = result.reason?.message || 'Unknown error';
          errors.push({
            source: enricherName as 'website' | 'googleCse',
            error: errorMsg,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Merge results with existing enrichment data
      const mergedEnrichmentData = this.mergeEnrichmentData(
        existingEnrichmentData,
        enrichmentResults,
        options?.forceRefresh || false
      );

      // Determine overall status (success if at least one enricher succeeded)
      const overallStatus =
        enrichmentResults.some((r) => r.success) ||
        (existingEnrichmentData && !options?.forceRefresh)
          ? 'success'
          : 'failed';

      // Update database (cast to Prisma.JsonValue for type compatibility)
      await prisma.company.update({
        where: { id: companyId },
        data: {
          enrichmentStatus: overallStatus,
          enrichmentLastRun: new Date(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          enrichmentData: mergedEnrichmentData as any,
        },
      });

      // Phase 2B: Extract contacts and leads from enrichment data
      let contactsLeadsSummary;
      try {
        // Load updated company with enrichment data
        const updatedCompany = await prisma.company.findUnique({
          where: { id: companyId },
          select: {
            name: true,
            country: true,
            enrichmentData: true,
          },
        });

        if (updatedCompany && updatedCompany.enrichmentData) {
          // Extract contact candidates
          const candidates = extractContactCandidates(
            updatedCompany.enrichmentData as unknown as EnrichmentData
          );

          // Persist contacts and leads
          contactsLeadsSummary = await persistContactsAndLeads(
            companyId,
            updatedCompany.name,
            updatedCompany.country,
            candidates
          );
        }
      } catch (contactsError) {
        // Log error but don't fail enrichment if contacts/leads extraction fails
        console.error('Error extracting contacts/leads from enrichment:', contactsError);
        // Continue without contacts/leads summary
      }

      // Build summary
      const summary: EnrichmentSummary = {
        status: overallStatus,
        sourcesRun: enrichmentResults.map((r) => r.source),
        sourcesSucceeded: enrichmentResults.filter((r) => r.success).map((r) => r.source),
        sourcesFailed: enrichmentResults.filter((r) => !r.success).map((r) => r.source),
        timestamp: new Date().toISOString(),
        contactsLeadsSummary,
      };

      return summary;
    } catch (error: unknown) {
      // Update status to failed (cast to Prisma.JsonValue for type compatibility)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during enrichment';
      await prisma.company.update({
        where: { id: companyId },
        data: {
          enrichmentStatus: 'failed',
          enrichmentLastRun: new Date(),
          enrichmentData: {
            version: '1.0',
            timestamp: new Date().toISOString(),
            sources: {},
            metadata: {
              enrichmentRunId: this.generateRunId(),
              forceRefresh: options?.forceRefresh || false,
            },
            errors: [
              {
                source: 'system' as 'website' | 'googleCse',
                error: errorMessage,
                timestamp: new Date().toISOString(),
              },
            ],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
      });

      throw error;
    }
  }

  /**
   * Select which enrichers to run based on company data
   * - WebsiteEnricher: Only if Company.website exists
   * - GoogleCseEnricher: Always
   */
  private selectEnrichers(company: CompanyEnrichmentInput): ICompanyEnricher[] {
    const selected: ICompanyEnricher[] = [];

    // WebsiteEnricher: Only if website exists
    if (company.website) {
      const websiteEnricher = this.enrichers.find((e) => e.getName() === 'website');
      if (websiteEnricher) {
        selected.push(websiteEnricher);
      }
    }

    // GoogleCseEnricher: Always
    const googleCseEnricher = this.enrichers.find((e) => e.getName() === 'googleCse');
    if (googleCseEnricher) {
      selected.push(googleCseEnricher);
    }

    return selected;
  }

  /**
   * Merge new enrichment results with existing enrichment data
   * 
   * @param existing - Existing enrichment data (null if first run)
   * @param newResults - New enrichment results from enrichers
   * @param forceRefresh - Whether to force refresh (replace existing data)
   * @returns Merged enrichment data
   */
  private mergeEnrichmentData(
    existing: EnrichmentData | null,
    newResults: EnrichmentResult[],
    forceRefresh: boolean
  ): EnrichmentData {
    const timestamp = new Date().toISOString();
    const runId = this.generateRunId();

    if (forceRefresh || !existing) {
      // Full replace: Create new enrichmentData from new results
      return this.buildEnrichmentData(newResults, timestamp, runId, forceRefresh);
    }

    // Merge: Preserve existing source data, only update if new data exists
    const merged: EnrichmentData = {
      version: '1.0',
      timestamp,
      sources: {
        ...existing.sources,
      },
      metadata: {
        enrichmentRunId: runId,
        forceRefresh: false,
        previousVersion: existing.timestamp,
      },
      errors: [...(existing.errors || [])],
    };

    // Update sources with new results
    for (const result of newResults) {
      if (result.source === 'website') {
        merged.sources.website = this.buildWebsiteResult(result);
      } else if (result.source === 'googleCse') {
        merged.sources.googleCse = this.buildGoogleCseResult(result);
      }
    }

    // Add new errors
    const newErrors = newResults
      .filter((r) => !r.success && r.error)
      .map((r) => ({
        source: r.source as 'website' | 'googleCse',
        error: r.error!,
        timestamp: r.timestamp,
      }));

    if (newErrors.length > 0) {
      merged.errors = [...(merged.errors || []), ...newErrors];
    }

    return merged;
  }

  /**
   * Build enrichment data from results (used for forceRefresh or first run)
   */
  private buildEnrichmentData(
    results: EnrichmentResult[],
    timestamp: string,
    runId: string,
    forceRefresh: boolean
  ): EnrichmentData {
    const data: EnrichmentData = {
      version: '1.0',
      timestamp,
      sources: {},
      metadata: {
        enrichmentRunId: runId,
        forceRefresh,
      },
    };

    // Build source results
    for (const result of results) {
      if (result.source === 'website') {
        data.sources.website = this.buildWebsiteResult(result);
      } else if (result.source === 'googleCse') {
        data.sources.googleCse = this.buildGoogleCseResult(result);
      }
    }

    // Collect errors
    const errors = results
      .filter((r) => !r.success && r.error)
      .map((r) => ({
        source: r.source as 'website' | 'googleCse',
        error: r.error!,
        timestamp: r.timestamp,
      }));

    if (errors.length > 0) {
      data.errors = errors;
    }

    return data;
  }

  /**
   * Convert EnrichmentResult to WebsiteEnrichmentResult
   */
  private buildWebsiteResult(result: EnrichmentResult): WebsiteEnrichmentResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (result.data || {}) as any;
    return {
      source: 'website',
      timestamp: result.timestamp,
      url: data.url || '',
      success: result.success,
      data: {
        title: data.title,
        description: data.description,
        accessible: data.accessible ?? false,
        statusCode: data.statusCode,
        contentType: data.contentType,
      },
      error: result.error,
    };
  }

  /**
   * Convert EnrichmentResult to GoogleCseEnrichmentResult
   */
  private buildGoogleCseResult(result: EnrichmentResult): GoogleCseEnrichmentResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (result.data || {}) as any;

    return {
      source: 'googleCse',
      timestamp: result.timestamp,
      success: result.success,
      configured: data.configured ?? true,
      query: data.query || '',
      data: data.primaryUrl
        ? {
            primaryUrl: data.primaryUrl,
            snippet: data.snippet,
            rawResults: data.rawResults,
            metadata: data.metadata,
            inferredIndustry: data.inferredIndustry,
            websiteFound: data.websiteFound,
          }
        : undefined,
      error: result.error,
    };
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
