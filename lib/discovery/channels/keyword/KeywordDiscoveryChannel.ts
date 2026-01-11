/**
 * Phase 1 Discovery - Keyword-Based Prospecting Channel Implementation
 * 
 * Day 1 Enabled Channel
 * - Uses industry keywords to find prospects
 * - Searches across discovery sources using keywords (delegates to Google discovery)
 * - Aggregates results from keyword-based searches
 * - Returns DiscoveryResult objects (no database writes)
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 */

import type { IKeywordDiscoveryChannel } from './IKeywordDiscoveryChannel';
import type {
  DiscoveryChannelInput,
  DiscoveryChannelOutput,
  DiscoveryResult,
  DiscoveryCompanyResult,
  DiscoveryMetadata,
} from '../../types';
import { GoogleDiscoveryChannel } from '../google/GoogleDiscoveryChannel';

/**
 * Keyword Discovery Channel Configuration Options
 */
export interface KeywordDiscoveryChannelOptions {
  /**
   * Whether to add "company" suffix to keywords when transforming to queries
   * Default: false (no transformation - search strategy is UNDEFINED)
   */
  addCompanySuffix?: boolean;
}

/**
 * Keyword Discovery Channel Implementation
 * 
 * Executes keyword-based discovery by delegating to Google discovery channel.
 * Aggregates and deduplicates results from multiple keyword searches.
 * Does NOT write to database - only returns results.
 */
export class KeywordDiscoveryChannel implements IKeywordDiscoveryChannel {
  private googleChannel: GoogleDiscoveryChannel | null = null;
  private options: KeywordDiscoveryChannelOptions;

  constructor(options: KeywordDiscoveryChannelOptions = {}) {
    this.options = {
      addCompanySuffix: false, // Default: no transformation
      ...options,
    };
  }

  /**
   * Get channel type identifier
   */
  getChannelType(): 'keyword' {
    return 'keyword';
  }

  /**
   * Check if channel is enabled
   * Keyword discovery is always enabled (Day 1 channel)
   * Requires Google discovery to be available for delegation
   */
  isEnabled(config: DiscoveryChannelInput['config']): boolean {
    // Check if Google discovery is available (required for delegation)
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const searchEngineId = process.env.GOOGLE_CSE_ID;
    
    return !!(apiKey && searchEngineId);
  }

  /**
   * Execute keyword-based discovery
   * 
   * Input: Keywords from input.searchCriteria (string or string[])
   * Output: DiscoveryResult objects aggregated from keyword-based searches
   * 
   * Strategy: Delegates to GoogleDiscoveryChannel with keyword-derived queries
   */
  async discover(input: DiscoveryChannelInput): Promise<DiscoveryChannelOutput> {
    // Check if channel is enabled (Google CSE must be configured for delegation)
    if (!this.isEnabled(input.config)) {
      return {
        channelType: 'keyword',
        results: [],
        success: false,
        error: 'Google Custom Search not configured. Keyword discovery requires Google discovery to be available.',
      };
    }

    try {
      // Extract keywords from input
      const keywords = this.extractKeywords(input);
      
      if (keywords.length === 0) {
        return {
          channelType: 'keyword',
          results: [],
          success: true,
          metadata: {
            message: 'No keywords provided',
          },
        };
      }

      // Initialize Google channel if not already done
      if (!this.googleChannel) {
        this.googleChannel = new GoogleDiscoveryChannel();
      }

      // Transform keywords into search queries
      // UNDEFINED: Search strategy (exact match, variations, combinations)
      // MVP: Use keywords directly as search queries
      const searchQueries = this.transformKeywordsToQueries(keywords);

      // Execute searches for all keyword-derived queries
      const allResults: DiscoveryResult[] = [];
      
      for (const query of searchQueries) {
        // Delegate to Google discovery channel
        const googleInput: DiscoveryChannelInput = {
          config: {
            channelType: 'google',
            activationStatus: 'enabled',
          },
          searchCriteria: query,
        };

        const googleOutput = await this.googleChannel.discover(googleInput);
        
        if (googleOutput.success && googleOutput.results.length > 0) {
          // Update discovery metadata to reflect keyword source
          const updatedResults = googleOutput.results.map((result) => 
            this.updateDiscoveryMetadata(result, keywords)
          );
          allResults.push(...updatedResults);
        }
      }

      // Aggregate and deduplicate results
      const uniqueResults = this.deduplicateResults(allResults);

      return {
        channelType: 'keyword',
        results: uniqueResults,
        success: true,
        metadata: {
          keywordsUsed: keywords.length,
          queriesExecuted: searchQueries.length,
          resultsFound: uniqueResults.length,
        },
      };
    } catch (error: unknown) {
      // Return error but don't throw (graceful degradation)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during keyword discovery';
      return {
        channelType: 'keyword',
        results: [],
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Load keywords for prospecting
   * 
   * Note: Keyword source is UNDEFINED
   * For MVP: Keywords come from input.searchCriteria
   * Future: Could load from static list, config file, database, UI
   * 
   * @returns Array of keywords to use for discovery
   */
  async loadKeywords(): Promise<string[]> {
    // UNDEFINED: Keyword source
    // MVP: Keywords are provided via input.searchCriteria
    // This method is kept for interface compliance but returns empty array
    // Actual keywords are extracted from input in discover() method
    return [];
  }

  /**
   * Extract keywords from input
   * Supports string or array of strings
   */
  private extractKeywords(input: DiscoveryChannelInput): string[] {
    if (!input.searchCriteria) {
      return [];
    }

    if (typeof input.searchCriteria === 'string') {
      return [input.searchCriteria.trim()].filter(k => k.length > 0);
    }

    if (Array.isArray(input.searchCriteria)) {
      return input.searchCriteria
        .filter((k): k is string => typeof k === 'string')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    return [];
  }

  /**
   * Transform keywords into search queries
   * 
   * UNDEFINED: Search strategy (exact match, variations, combinations)
   * MVP: Use keywords directly as search queries (no transformation by default)
   * Optional: Can add "company" suffix if configured
   */
  private transformKeywordsToQueries(keywords: string[]): string[] {
    if (!this.options.addCompanySuffix) {
      // No transformation - return keywords as-is
      return keywords.map(keyword => keyword.trim()).filter(k => k.length > 0);
    }

    // Optional transformation: add "company" suffix if enabled
    return keywords.map(keyword => {
      const trimmed = keyword.trim();
      if (trimmed.toLowerCase().includes('company')) {
        return trimmed;
      }
      return `${trimmed} company`;
    });
  }

  /**
   * Update discovery metadata to reflect keyword source
   * Changes discoverySource to 'keyword' and preserves upstream source info
   */
  private updateDiscoveryMetadata(
    result: DiscoveryResult,
    keywords: string[]
  ): DiscoveryResult {
    // Handle company results
    if (result.type === 'company') {
      const updatedMetadata: DiscoveryMetadata = {
        discoverySource: 'keyword',
        discoveryTimestamp: result.discoveryMetadata.discoveryTimestamp,
        discoveryMethod: `Keywords: ${keywords.join(', ')}`,
        additionalMetadata: {
          ...result.discoveryMetadata.additionalMetadata,
          upstreamSource: result.discoveryMetadata.discoverySource, // Preserve original channel
          upstreamQuery: result.discoveryMetadata.discoveryMethod, // Preserve original query/method
        },
      };

      return {
        ...result,
        discoveryMetadata: updatedMetadata,
      };
    }

    // Handle contact results
    if (result.type === 'contact') {
      const updatedMetadata: DiscoveryMetadata = {
        discoverySource: 'keyword',
        discoveryTimestamp: result.discoveryMetadata.discoveryTimestamp,
        discoveryMethod: `Keywords: ${keywords.join(', ')}`,
        additionalMetadata: {
          ...result.discoveryMetadata.additionalMetadata,
          upstreamSource: result.discoveryMetadata.discoverySource, // Preserve original channel
          upstreamQuery: result.discoveryMetadata.discoveryMethod, // Preserve original query/method
        },
      };

      return {
        ...result,
        discoveryMetadata: updatedMetadata,
      };
    }

    // For lead results, pass through unchanged (they contain nested company/contact with their own metadata)
    // Note: Lead results don't have direct discoveryMetadata, so we don't update them
    return result;
  }

  /**
   * Deduplicate results based on website URL (for companies)
   * Basic exact deduplication - prevents same company appearing multiple times
   * 
   * UNDEFINED: Deduplication algorithm beyond basic URL matching
   * MVP: Simple exact match on website URL
   */
  private deduplicateResults(results: DiscoveryResult[]): DiscoveryResult[] {
    const seen = new Set<string>();
    const unique: DiscoveryResult[] = [];

    for (const result of results) {
      if (result.type === 'company') {
        const website = result.website;
        if (website && !seen.has(website)) {
          seen.add(website);
          unique.push(result);
        } else if (!website) {
          // Keep results without website URL (may be different companies)
          // Use name as fallback for deduplication
          const nameKey = result.name.toLowerCase().trim();
          if (!seen.has(`name:${nameKey}`)) {
            seen.add(`name:${nameKey}`);
            unique.push(result);
          }
        }
      } else {
        // Non-company results: simple deduplication by name/email if available
        // Keep all results for now (no dedup logic for contacts/leads yet)
        unique.push(result);
      }
    }

    return unique;
  }
}
