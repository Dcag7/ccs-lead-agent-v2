/**
 * Phase 1 Discovery - Google Search Discovery Channel Interface
 * 
 * Interface for Google Search Discovery (Day 1 Enabled Channel)
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
 * Google Discovery Channel Interface
 * 
 * Day 1 Enabled Channel
 * - Executes Google searches using configured search queries
 * - Parses search results for company websites and contact information
 * - Extracts URLs, company names, brief descriptions
 */
export interface IGoogleDiscoveryChannel extends IDiscoveryChannel {
  /**
   * Execute Google search discovery
   * 
   * Input:
   * - Search queries (from config or input)
   * - Search parameters (UNDEFINED - depends on Google API/scraping approach)
   * 
   * Output:
   * - Company results from search results
   * - Website URLs discovered
   * - Company names and brief descriptions
   * 
   * @param input - Google discovery channel input
   * @returns Discovery results with companies found via Google search
   */
  discover(input: DiscoveryChannelInput): Promise<DiscoveryChannelOutput>;
  
  /**
   * Get Google-specific channel configuration
   * 
   * Note: Google search configuration is UNDEFINED in MVP
   * (API vs scraping, quota limits, authentication method)
   * 
   * @returns Channel type 'google'
   */
  getChannelType(): 'google';
}
