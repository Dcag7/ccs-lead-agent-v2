/**
 * Phase 1 Discovery - Google Search Discovery Channel Implementation
 * 
 * Day 1 Enabled Channel
 * - Executes Google searches using configured search queries
 * - Parses search results for company websites and contact information
 * - Extracts URLs, company names, brief descriptions
 * - Returns DiscoveryResult objects (no database writes)
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 */

import type { IGoogleDiscoveryChannel } from './IGoogleDiscoveryChannel';
import type {
  DiscoveryChannelInput,
  DiscoveryChannelOutput,
  DiscoveryResult,
  DiscoveryCompanyResult,
  DiscoveryMetadata,
  ChannelActivationStatus,
} from '../../types';

/**
 * Google CSE API Response Structure
 */
interface GoogleCSEResponse {
  searchInformation?: {
    totalResults?: string;
    searchTime?: number;
    formattedSearchTime?: string;
  };
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink?: string;
    formattedUrl?: string;
  }>;
}

/**
 * Google Discovery Channel Configuration Options
 */
export interface GoogleDiscoveryChannelOptions {
  /**
   * Whether to filter out non-company websites (social media, directories, etc.)
   * Default: false (no filtering)
   */
  filterNonCompanyWebsites?: boolean;
}

/**
 * Google Discovery Channel Implementation
 * 
 * Executes Google searches and returns DiscoveryResult objects.
 * Does NOT write to database - only returns results.
 */
export class GoogleDiscoveryChannel implements IGoogleDiscoveryChannel {
  private options: GoogleDiscoveryChannelOptions;

  constructor(options: GoogleDiscoveryChannelOptions = {}) {
    this.options = {
      filterNonCompanyWebsites: false, // Default: no filtering
      ...options,
    };
  }
  /**
   * Get channel type identifier
   */
  getChannelType(): 'google' {
    return 'google';
  }

  /**
   * Check if channel is enabled
   * Google discovery is always enabled (Day 1 channel)
   */
  isEnabled(config: DiscoveryChannelInput['config']): boolean {
    // Google is a Day 1 enabled channel - always active
    // Only check if Google CSE is configured
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const searchEngineId = process.env.GOOGLE_CSE_ID;
    
    return !!(apiKey && searchEngineId);
  }

  /**
   * Execute Google search discovery
   * 
   * Input: Search queries from input.searchCriteria
   * Output: DiscoveryResult objects with companies found via Google search
   */
  async discover(input: DiscoveryChannelInput): Promise<DiscoveryChannelOutput> {
    // Check if channel is enabled (Google CSE configured)
    if (!this.isEnabled(input.config)) {
      return {
        channelType: 'google',
        results: [],
        success: false,
        error: 'Google Custom Search not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID environment variables.',
      };
    }

    try {
      // Extract search queries from input
      const searchQueries = this.extractSearchQueries(input);
      
      if (searchQueries.length === 0) {
        return {
          channelType: 'google',
          results: [],
          success: true,
          metadata: {
            message: 'No search queries provided',
          },
        };
      }

      // Execute searches for all queries and aggregate results
      const allResults: DiscoveryResult[] = [];
      
      for (const query of searchQueries) {
        const queryResults = await this.executeSearch(query);
        allResults.push(...queryResults);
      }

      // Remove duplicates based on website URL (basic deduplication)
      const uniqueResults = this.deduplicateResults(allResults);

      return {
        channelType: 'google',
        results: uniqueResults,
        success: true,
        metadata: {
          queriesExecuted: searchQueries.length,
          resultsFound: uniqueResults.length,
        },
      };
    } catch (error: any) {
      // Return error but don't throw (graceful degradation)
      return {
        channelType: 'google',
        results: [],
        success: false,
        error: error.message || 'Unknown error occurred during Google discovery',
      };
    }
  }

  /**
   * Extract search queries from input
   * Supports string or array of strings
   */
  private extractSearchQueries(input: DiscoveryChannelInput): string[] {
    if (!input.searchCriteria) {
      return [];
    }

    if (typeof input.searchCriteria === 'string') {
      return [input.searchCriteria];
    }

    if (Array.isArray(input.searchCriteria)) {
      return input.searchCriteria.filter((q): q is string => typeof q === 'string');
    }

    return [];
  }

  /**
   * Execute a single Google search query
   * Returns DiscoveryResult objects (Company results)
   */
  private async executeSearch(query: string): Promise<DiscoveryCompanyResult[]> {
    const apiKey = process.env.GOOGLE_CSE_API_KEY!;
    const searchEngineId = process.env.GOOGLE_CSE_ID!;

    // Build search query (add "company" suffix if not present)
    let searchQuery = query.trim();
    if (!searchQuery.toLowerCase().includes('company')) {
      searchQuery = `${searchQuery} company`;
    }

    // Construct Google CSE API URL
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', searchEngineId);
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('num', '10'); // Get more results for discovery

    // Make API request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google CSE API error: ${response.status} - ${errorText}`);
    }

    const data: GoogleCSEResponse = await response.json();
    const items = data.items || [];

    // Convert Google search results to DiscoveryResult objects
    const results: DiscoveryCompanyResult[] = [];

    for (const item of items) {
      // Optional: Filter out non-company websites (if enabled)
      if (this.options.filterNonCompanyWebsites) {
        const { isLikelyCompanyWebsite } = await import('../../../googleSearch');
        if (!isLikelyCompanyWebsite(item.link)) {
          continue;
        }
      }

      // Extract company name from title (best effort)
      const companyName = this.extractCompanyName(item.title, item.snippet);

      // Create discovery metadata
      const discoveryMetadata: DiscoveryMetadata = {
        discoverySource: 'google',
        discoveryTimestamp: new Date(),
        discoveryMethod: query,
        additionalMetadata: {
          searchResultTitle: item.title,
          searchResultSnippet: item.snippet,
          displayLink: item.displayLink,
        },
      };

      // Create DiscoveryCompanyResult
      // Note: Industry inference removed per requirements - no inferred industry output
      const companyResult: DiscoveryCompanyResult = {
        type: 'company',
        name: companyName,
        website: item.link,
        // industry field removed - no inference from snippets
        discoveryMetadata,
      };

      results.push(companyResult);
    }

    return results;
  }

  /**
   * Extract company name from search result title or snippet
   * Best effort parsing
   */
  private extractCompanyName(title: string, snippet?: string): string {
    // Try to extract from title first
    // Remove common suffixes like " - Home", " | Company", etc.
    let name = title
      .replace(/\s*[-|]\s*.*$/, '') // Remove after dash or pipe
      .replace(/\s*—\s*.*$/, '') // Remove after em dash
      .replace(/\s+Company.*$/i, '') // Remove "Company" suffix
      .replace(/\s+Inc\.?.*$/i, '') // Remove "Inc." suffix
      .replace(/\s+LLC\.?.*$/i, '') // Remove "LLC" suffix
      .trim();

    // If title extraction didn't work well, try snippet
    if (!name || name.length < 2) {
      name = snippet || title;
      // Extract first meaningful phrase from snippet
      const firstSentence = name.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 2) {
        name = firstSentence.trim();
      }
    }

    // Fallback to original title if nothing extracted
    return name || title;
  }

  /**
   * Deduplicate results based on website URL
   * Basic deduplication - prevents same company appearing multiple times
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
          unique.push(result);
        }
      } else {
        // Non-company results are always added (no dedup logic yet)
        unique.push(result);
      }
    }

    return unique;
  }
}
