/**
 * Phase 1 Discovery - Discovery Aggregator
 * 
 * Aggregates results from multiple discovery channels.
 * Executes enabled channels sequentially and merges/deduplicates results.
 * Returns DiscoveryResult[] only - no database writes.
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 */

import type {
  DiscoveryChannelInput,
  DiscoveryResult,
} from './types';
import type { IDiscoveryChannel } from './channels/IDiscoveryChannel';
import { GoogleDiscoveryChannel } from './channels/google/GoogleDiscoveryChannel';
import { KeywordDiscoveryChannel } from './channels/keyword/KeywordDiscoveryChannel';
import type { AnalysisConfig } from './scraper';

/**
 * Discovery Aggregator Configuration
 */
export interface DiscoveryAggregatorConfig {
  /** Enabled channels to execute (Google, Keyword for MVP) */
  enabledChannels?: Array<'google' | 'keyword'>;
  
  /** Input configuration for discovery execution */
  input: DiscoveryChannelInput;

  /**
   * Configuration for content analysis (for scraping-enabled channels)
   * When provided, enables web scraping and content analysis
   */
  analysisConfig?: AnalysisConfig;

  /**
   * Whether to enable web scraping for discovered URLs
   * Default: true if analysisConfig is provided
   */
  enableScraping?: boolean;

  // Legacy options (deprecated - use analysisConfig instead)
  /** @deprecated Use analysisConfig.positiveKeywords instead */
  includeKeywords?: string[];
  /** @deprecated Use analysisConfig.negativeKeywords instead */
  excludeKeywords?: string[];
}

/**
 * Discovery Aggregator Result
 */
export interface DiscoveryAggregatorResult {
  /** Aggregated and deduplicated discovery results */
  results: DiscoveryResult[];
  
  /** Number of results from each channel */
  channelResults: Record<string, number>;
  
  /** Channel-specific errors (partial failures) */
  channelErrors?: Record<string, string>;
  
  /** Total results before deduplication */
  totalBeforeDedupe: number;
  
  /** Total results after deduplication */
  totalAfterDedupe: number;
  
  /** Whether aggregation was successful */
  success: boolean;
  
  /** Error message if aggregation failed */
  error?: string;
}

/**
 * Discovery Aggregator
 * 
 * Executes enabled discovery channels sequentially and aggregates results.
 * Does NOT write to database - only returns results.
 */
export class DiscoveryAggregator {
  /**
   * Create channel instance with optional scraping and analysis config
   */
  private createChannel(
    channelType: string,
    config: DiscoveryAggregatorConfig
  ): IDiscoveryChannel | null {
    switch (channelType) {
      case 'google':
        // Determine if scraping should be enabled
        const enableScraping = config.enableScraping ?? !!config.analysisConfig;
        
        return new GoogleDiscoveryChannel({
          enableScraping,
          analysisConfig: config.analysisConfig,
          // Legacy support
          includeKeywords: config.includeKeywords,
          excludeKeywords: config.excludeKeywords,
        });
      case 'keyword':
        return new KeywordDiscoveryChannel();
      default:
        return null;
    }
  }

  /**
   * Execute discovery across enabled channels
   * 
   * Executes channels sequentially (no orchestration framework).
   * Merges results and deduplicates across channels.
   * 
   * @param config - Aggregator configuration with enabled channels and input
   * @returns Aggregated and deduplicated discovery results
   */
  async execute(config: DiscoveryAggregatorConfig): Promise<DiscoveryAggregatorResult> {
    try {
      // Determine which channels to execute
      const channelsToExecute = config.enabledChannels || ['google', 'keyword'];
      
      // Execute channels sequentially
      const allResults: DiscoveryResult[] = [];
      const channelResults: Record<string, number> = {};
      const channelErrors: Record<string, string> = {};

      for (const channelType of channelsToExecute) {
        // Create channel with scraping and analysis config
        const channel = this.createChannel(channelType, config);
        
        if (!channel) {
          // Skip unknown channels
          continue;
        }

        // Check if channel is enabled
        if (!channel.isEnabled(config.input.config)) {
          channelResults[channelType] = 0;
          // For Google channel, record configuration error
          if (channelType === 'google') {
            channelErrors[channelType] = 'Google Custom Search is not configured';
          }
          continue;
        }

        try {
          // Execute channel discovery
          const output = await channel.discover(config.input);
          
          if (output.success && output.results.length > 0) {
            allResults.push(...output.results);
            channelResults[channelType] = output.results.length;
          } else {
            channelResults[channelType] = 0;
            // Record error if channel failed (e.g., Google not configured)
            if (output.error) {
              channelErrors[channelType] = output.error;
            }
          }
        } catch (error) {
          // Graceful degradation - continue with other channels
          channelResults[channelType] = 0;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          channelErrors[channelType] = errorMessage;
          // Note: We don't throw - we continue with other channels
        }
      }

      // Deduplicate results across channels
      const uniqueResults = this.deduplicateAcrossChannels(allResults);

      return {
        results: uniqueResults,
        channelResults,
        channelErrors: Object.keys(channelErrors).length > 0 ? channelErrors : undefined,
        totalBeforeDedupe: allResults.length,
        totalAfterDedupe: uniqueResults.length,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during discovery aggregation';
      return {
        results: [],
        channelResults: {},
        channelErrors: undefined,
        totalBeforeDedupe: 0,
        totalAfterDedupe: 0,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Deduplicate results across channels
   * 
   * Basic exact deduplication by website URL (for companies) or name (fallback).
   * UNDEFINED: Advanced deduplication algorithms beyond exact matching.
   * 
   * @param results - Results from all channels
   * @returns Deduplicated results
   */
  private deduplicateAcrossChannels(results: DiscoveryResult[]): DiscoveryResult[] {
    const seen = new Set<string>();
    const unique: DiscoveryResult[] = [];

    for (const result of results) {
      if (result.type === 'company') {
        // Deduplicate companies by website URL (exact match)
        const website = result.website;
        if (website) {
          const websiteKey = website.toLowerCase().trim();
          if (!seen.has(`website:${websiteKey}`)) {
            seen.add(`website:${websiteKey}`);
            unique.push(result);
          }
        } else {
          // Fallback: deduplicate by company name (exact match)
          const nameKey = result.name.toLowerCase().trim();
          const nameLookup = `name:${nameKey}`;
          if (!seen.has(nameLookup)) {
            seen.add(nameLookup);
            unique.push(result);
          }
        }
      } else if (result.type === 'contact') {
        // Deduplicate contacts by email if available, otherwise by name
        if (result.email) {
          const emailKey = result.email.toLowerCase().trim();
          if (!seen.has(`email:${emailKey}`)) {
            seen.add(`email:${emailKey}`);
            unique.push(result);
          }
        } else {
          const nameKey = (result.name || `${result.firstName || ''} ${result.lastName || ''}`.trim()).toLowerCase();
          if (nameKey && !seen.has(`contact:${nameKey}`)) {
            seen.add(`contact:${nameKey}`);
            unique.push(result);
          }
        }
      } else {
        // For leads, deduplicate by associated contact email or company website
        if (result.contact?.email) {
          const emailKey = result.contact.email.toLowerCase().trim();
          if (!seen.has(`lead:${emailKey}`)) {
            seen.add(`lead:${emailKey}`);
            unique.push(result);
          }
        } else if (result.company?.website) {
          const websiteKey = result.company.website.toLowerCase().trim();
          if (!seen.has(`lead:company:${websiteKey}`)) {
            seen.add(`lead:company:${websiteKey}`);
            unique.push(result);
          }
        } else {
          // Keep all leads for now if no email or company website
          unique.push(result);
        }
      }
    }

    return unique;
  }

  /**
   * Get available channels
   * 
   * @returns Array of available channel types
   */
  getAvailableChannels(): string[] {
    return ['google', 'keyword'];
  }
}
