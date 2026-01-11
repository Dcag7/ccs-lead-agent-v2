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

/**
 * Discovery Aggregator Configuration
 */
export interface DiscoveryAggregatorConfig {
  /** Enabled channels to execute (Google, Keyword for MVP) */
  enabledChannels?: Array<'google' | 'keyword'>;
  
  /** Input configuration for discovery execution */
  input: DiscoveryChannelInput;
}

/**
 * Discovery Aggregator Result
 */
export interface DiscoveryAggregatorResult {
  /** Aggregated and deduplicated discovery results */
  results: DiscoveryResult[];
  
  /** Number of results from each channel */
  channelResults: Record<string, number>;
  
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
  private channels: Map<string, IDiscoveryChannel>;

  constructor() {
    // Initialize channels
    this.channels = new Map();
    this.channels.set('google', new GoogleDiscoveryChannel());
    this.channels.set('keyword', new KeywordDiscoveryChannel());
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

      for (const channelType of channelsToExecute) {
        const channel = this.channels.get(channelType);
        
        if (!channel) {
          // Skip unknown channels
          continue;
        }

        // Check if channel is enabled
        if (!channel.isEnabled(config.input.config)) {
          channelResults[channelType] = 0;
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
          }
        } catch (error: unknown) {
          // Graceful degradation - continue with other channels
          channelResults[channelType] = 0;
          // Note: We don't throw - we continue with other channels
        }
      }

      // Deduplicate results across channels
      const uniqueResults = this.deduplicateAcrossChannels(allResults);

      return {
        results: uniqueResults,
        channelResults,
        totalBeforeDedupe: allResults.length,
        totalAfterDedupe: uniqueResults.length,
        success: true,
      };
    } catch (error: unknown) {
      return {
        results: [],
        channelResults: {},
        totalBeforeDedupe: 0,
        totalAfterDedupe: 0,
        success: false,
        error: error.message || 'Unknown error occurred during discovery aggregation',
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
    return Array.from(this.channels.keys());
  }
}
