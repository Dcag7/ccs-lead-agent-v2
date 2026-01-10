/**
 * Phase 1 Discovery - Social Platform Monitoring Channel Interface
 * 
 * Interface for Social Platform Monitoring (CORE Channel - GATED)
 * Defines input/output contract only - no implementation.
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 * 
 * IMPORTANT: This is a GATED channel - Phase 1 must function if disabled
 */

import type { IDiscoveryChannel } from '../IDiscoveryChannel';
import type {
  DiscoveryChannelInput,
  DiscoveryChannelOutput,
} from '../../types';

/**
 * Social Platform Discovery Channel Interface
 * 
 * CORE Channel - GATED by UNDEFINED access constraints
 * - Activation Status: Gated (must not block build if disabled)
 * - If disabled: Phase 1 continues with other channels
 * 
 * Function:
 * - Monitor social platforms for prospect activity and mentions
 * - Search for mentions, posts, or profiles matching discovery criteria
 * 
 * Note:
 * - Which specific platforms to monitor is UNDEFINED
 * - Platform access methods are UNDEFINED
 * - Access credentials are UNDEFINED
 * - Must gracefully degrade if access unavailable
 */
export interface ISocialDiscoveryChannel extends IDiscoveryChannel {
  /**
   * Execute social platform monitoring
   * 
   * Input:
   * - Discovery criteria (keywords, company names, etc.)
   * - Platform identifiers (UNDEFINED - which platforms)
   * - Search parameters (UNDEFINED - depends on platform APIs)
   * 
   * Output:
   * - Companies mentioned on social platforms
   * - Contacts active on social platforms
   * - Social activity relevant to prospects
   * 
   * Behavior:
   * - If channel is disabled (activationStatus: 'disabled'), returns empty results
   * - Does not throw errors that would block other channels
   * 
   * @param input - Social discovery channel input
   * @returns Discovery results from social platforms (or empty if disabled)
   */
  discover(input: DiscoveryChannelInput): Promise<DiscoveryChannelOutput>;
  
  /**
   * Get social-specific channel configuration
   * 
   * @returns Channel type 'social'
   */
  getChannelType(): 'social';
  
  /**
   * Check if social platform channel is enabled
   * 
   * Note: Activation is gated by UNDEFINED access constraints
   * - Checks activation status from config
   * - Verifies platform access (UNDEFINED - which platforms, how to access)
   * 
   * @param config - Channel configuration
   * @returns True if social monitoring is enabled and platforms are accessible
   */
  isEnabled(config: DiscoveryChannelInput['config']): boolean;
}
