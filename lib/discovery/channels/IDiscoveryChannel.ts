/**
 * Phase 1 Discovery - Discovery Channel Interface
 * 
 * Core interface contract for all discovery channels.
 * Defines input/output contract only - no implementation.
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 */

import type {
  DiscoveryChannelInput,
  DiscoveryChannelOutput,
} from '../types';

/**
 * Discovery Channel Interface
 * 
 * All discovery channels must implement this contract:
 * - Google Search Discovery (Day 1 Enabled)
 * - LinkedIn Profile Discovery (CORE - GATED)
 * - Social Platform Monitoring (CORE - GATED)
 * - Industry Keyword-Based Prospecting (Day 1 Enabled)
 */
export interface IDiscoveryChannel {
  /**
   * Execute discovery channel
   * 
   * @param input - Discovery channel input configuration
   * @returns Discovery channel output with results
   */
  discover(input: DiscoveryChannelInput): Promise<DiscoveryChannelOutput>;
  
  /**
   * Get channel type identifier
   * 
   * @returns Channel type string
   */
  getChannelType(): string;
  
  /**
   * Check if channel is enabled/available
   * 
   * @param config - Channel configuration
   * @returns True if channel can execute, false otherwise
   */
  isEnabled(config: DiscoveryChannelInput['config']): boolean;
}
