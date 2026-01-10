/**
 * Phase 1 Discovery - Keyword-Based Prospecting Channel Interface
 * 
 * Interface for Industry Keyword-Based Prospecting (Day 1 Enabled Channel)
 * Defines input/output contract only - no implementation.
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 */

import type { IDiscoveryChannel } from '../IDiscoveryChannel';
import type {
  DiscoveryChannelInput,
  DiscoveryChannelOutput,
} from '../../types';

/**
 * Keyword Discovery Channel Interface
 * 
 * Day 1 Enabled Channel
 * - Uses industry keywords to find prospects
 * - Searches across discovery sources using keywords
 * - Aggregates results from keyword-based searches
 * 
 * Note:
 * - Keyword source is UNDEFINED (static list, config file, database)
 * - Keyword examples and categories are UNDEFINED
 * - Search strategy is UNDEFINED (exact match, variations, combinations)
 */
export interface IKeywordDiscoveryChannel extends IDiscoveryChannel {
  /**
   * Execute keyword-based discovery
   * 
   * Input:
   * - Industry keywords (source UNDEFINED)
   * - Search parameters (UNDEFINED - search strategy, scope)
   * 
   * Output:
   * - Prospects found via keyword searches
   * - Results aggregated from multiple keyword searches
   * - Unique prospects identified across keyword searches
   * 
   * @param input - Keyword discovery channel input
   * @returns Discovery results from keyword-based searches
   */
  discover(input: DiscoveryChannelInput): Promise<DiscoveryChannelOutput>;
  
  /**
   * Get keyword-specific channel configuration
   * 
   * @returns Channel type 'keyword'
   */
  getChannelType(): 'keyword';
  
  /**
   * Load keywords for prospecting
   * 
   * Note: Keyword source is UNDEFINED
   * - Could be from static list, configuration file, database, UI
   * - Keyword examples and categories are UNDEFINED
   * 
   * @returns Array of keywords to use for discovery
   */
  loadKeywords(): Promise<string[]>;
}
