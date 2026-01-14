/**
 * Phase 1 Discovery - Google Search Discovery Channel Implementation
 * 
 * Day 1 Enabled Channel
 * - Executes Google searches using configured search queries
 * - Scrapes discovered websites to extract company information
 * - Analyzes content to determine relevance to discovery intent
 * - Returns DiscoveryResult objects (no database writes)
 * 
 * Enhanced with web scraping for better accuracy.
 */

import type { IGoogleDiscoveryChannel } from './IGoogleDiscoveryChannel';
import type {
  DiscoveryChannelInput,
  DiscoveryChannelOutput,
  DiscoveryResult,
  DiscoveryCompanyResult,
  DiscoveryMetadata,
} from '../../types';
import { webScraper, contentAnalyzer, type AnalysisConfig } from '../../scraper';
import { isConfigured, getConfigOrThrow } from '../../../discovery/google/googleConfig';

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
   * Default: true
   */
  filterNonCompanyWebsites?: boolean;

  /**
   * Whether to scrape and analyze websites for relevance
   * Default: true (recommended for better accuracy)
   */
  enableScraping?: boolean;

  /**
   * Configuration for content analysis (when scraping is enabled)
   */
  analysisConfig?: AnalysisConfig;

  /**
   * Timeout for scraping individual sites (ms)
   * Default: 8000
   */
  scrapeTimeout?: number;

  /**
   * Maximum number of sites to scrape per query
   * Default: 10
   */
  maxSitesToScrape?: number;

  // Legacy options (kept for backward compatibility but deprecated)
  /** @deprecated Use analysisConfig.positiveKeywords instead */
  includeKeywords?: string[];
  /** @deprecated Use analysisConfig.negativeKeywords instead */
  excludeKeywords?: string[];
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
      filterNonCompanyWebsites: true, // Filter out social media, etc.
      enableScraping: true, // Enable scraping for better results
      scrapeTimeout: 8000,
      maxSitesToScrape: 10,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isEnabled(_config: DiscoveryChannelInput['config']): boolean {
    // Google is a Day 1 enabled channel - always active
    // Only check if Google CSE is configured
    return isConfigured();
  }

  /**
   * Execute Google search discovery
   * 
   * Input: Search queries from input.searchCriteria
   * Output: DiscoveryResult objects with companies found via Google search
   * 
   * HARD FAILURE: If Google is not configured, returns error immediately.
   * Discovery runs will be marked as completed_with_errors.
   */
  async discover(input: DiscoveryChannelInput): Promise<DiscoveryChannelOutput> {
    // Check if channel is enabled (Google CSE configured)
    // HARD FAILURE: Do not silently return empty results
    if (!this.isEnabled(input.config)) {
      const errorMessage = 'Google Custom Search is not configured';
      return {
        channelType: 'google',
        results: [],
        success: false,
        error: errorMessage,
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
        // Check for cancellation between query batches
        if (input.cancelCheck && await input.cancelCheck()) {
          throw new Error('Discovery cancelled by user request');
        }
        
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
    } catch (error: unknown) {
      // Return error but don't throw (graceful degradation)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during Google discovery';
      return {
        channelType: 'google',
        results: [],
        success: false,
        error: errorMessage,
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
    // Use centralized config validation (will throw if not configured)
    const config = getConfigOrThrow();
    const apiKey = config.apiKey;
    const searchEngineId = config.cseId;

    // Build search query - don't add "company" as it may limit results
    const searchQuery = query.trim();

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

    console.log(`[GoogleDiscovery] Query "${searchQuery}" returned ${items.length} results`);

    // Step 1: Filter out obvious non-company URLs
    const filteredItems = this.options.filterNonCompanyWebsites
      ? items.filter(item => this.isLikelyCompanyUrl(item.link))
      : items;

    console.log(`[GoogleDiscovery] After URL filtering: ${filteredItems.length} results`);

    // Step 2: Scrape and analyze if enabled
    if (this.options.enableScraping && this.options.analysisConfig) {
      return this.scrapeAndAnalyze(filteredItems, query);
    }

    // Fallback: Convert results without scraping
    return this.convertToResults(filteredItems, query);
  }

  /**
   * Scrape websites and analyze content for relevance
   */
  private async scrapeAndAnalyze(
    items: Array<{ title: string; link: string; snippet: string; displayLink?: string }>,
    query: string
  ): Promise<DiscoveryCompanyResult[]> {
    const results: DiscoveryCompanyResult[] = [];
    const maxSites = this.options.maxSitesToScrape || 10;
    const timeout = this.options.scrapeTimeout || 8000;
    const analysisConfig = this.options.analysisConfig!;

    // Limit sites to scrape
    const sitesToScrape = items.slice(0, maxSites);
    console.log(`[GoogleDiscovery] Scraping ${sitesToScrape.length} sites...`);

    // Scrape in parallel (with concurrency of 3)
    const scrapedContent = await webScraper.scrapeMany(
      sitesToScrape.map(item => item.link),
      { timeout, concurrency: 3 }
    );

    // Analyze each scraped site
    for (let i = 0; i < scrapedContent.length; i++) {
      const content = scrapedContent[i];
      const item = sitesToScrape[i];

      // Analyze content
      const relevance = contentAnalyzer.analyze(content, analysisConfig);
      
      console.log(`[GoogleDiscovery] ${item.displayLink}: score=${relevance.score}, relevant=${relevance.isRelevant}`);

      // Only include relevant companies
      if (relevance.isRelevant) {
        const discoveryMetadata: DiscoveryMetadata = {
          discoverySource: 'google',
          discoveryTimestamp: new Date(),
          discoveryMethod: query,
          additionalMetadata: {
            searchResultTitle: item.title,
            searchResultSnippet: item.snippet,
            displayLink: item.displayLink,
            // Include scraping results
            scrapedTitle: content.title,
            scrapedDescription: content.description,
            relevanceScore: relevance.score,
            relevanceReasons: relevance.reasons,
            detectedIndustry: relevance.detectedIndustry,
            confidence: relevance.confidence,
            hasContact: !!content.contact,
            hasLinkedIn: !!content.socialLinks?.linkedin,
          },
        };

        // Use scraped company name if available, fallback to title extraction
        const companyName = content.companyName || 
                          this.extractCompanyName(item.title, item.snippet);

        const companyResult: DiscoveryCompanyResult = {
          type: 'company',
          name: companyName,
          website: item.link,
          description: content.description,
          discoveryMetadata,
        };

        // Add contact info if found
        if (content.contact?.email) {
          companyResult.email = content.contact.email;
        }
        if (content.contact?.phone) {
          companyResult.phone = content.contact.phone;
        }

        results.push(companyResult);
      }
    }

    console.log(`[GoogleDiscovery] Found ${results.length} relevant companies after analysis`);
    return results;
  }

  /**
   * Convert items to results without scraping (fallback)
   */
  private convertToResults(
    items: Array<{ title: string; link: string; snippet: string; displayLink?: string }>,
    query: string
  ): DiscoveryCompanyResult[] {
    const results: DiscoveryCompanyResult[] = [];

    for (const item of items) {
      // Legacy keyword filtering (if configured)
      if (!this.passesKeywordFilter(item.title, item.snippet)) {
        continue;
      }

      const companyName = this.extractCompanyName(item.title, item.snippet);

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

      const companyResult: DiscoveryCompanyResult = {
        type: 'company',
        name: companyName,
        website: item.link,
        discoveryMetadata,
      };

      results.push(companyResult);
    }

    return results;
  }

  /**
   * Check if URL is likely a company website (quick filter)
   */
  private isLikelyCompanyUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Exclude common non-company domains
      const excludedDomains = [
        'facebook.com', 'linkedin.com', 'twitter.com', 'x.com',
        'instagram.com', 'youtube.com', 'tiktok.com',
        'wikipedia.org', 'wiktionary.org',
        'indeed.com', 'glassdoor.com', 'linkedin.com/jobs',
        'yelp.com', 'yellowpages.com', 'whitepages.com',
        'pinterest.com', 'reddit.com', 'quora.com',
        'amazon.com', 'ebay.com', 'alibaba.com',
      ];

      for (const domain of excludedDomains) {
        if (hostname.includes(domain)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a result passes keyword filtering
   * Returns true if:
   * - No includeKeywords configured OR at least one includeKeyword matches
   * - No excludeKeywords configured OR no excludeKeywords match
   */
  private passesKeywordFilter(title: string, snippet?: string): boolean {
    const text = `${title} ${snippet || ''}`.toLowerCase();

    // Check exclude keywords first (if any match, reject)
    if (this.options.excludeKeywords && this.options.excludeKeywords.length > 0) {
      for (const keyword of this.options.excludeKeywords) {
        if (text.includes(keyword.toLowerCase())) {
          return false;
        }
      }
    }

    // Check include keywords (if configured, at least one must match)
    if (this.options.includeKeywords && this.options.includeKeywords.length > 0) {
      let hasMatch = false;
      for (const keyword of this.options.includeKeywords) {
        if (text.includes(keyword.toLowerCase())) {
          hasMatch = true;
          break;
        }
      }
      if (!hasMatch) {
        return false;
      }
    }

    return true;
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
