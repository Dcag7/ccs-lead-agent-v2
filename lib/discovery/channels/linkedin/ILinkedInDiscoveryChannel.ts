/**
 * Phase 1 Discovery - LinkedIn Profile Discovery Channel Interface
 * 
 * Interface for LinkedIn Profile Discovery (CORE Channel - GATED)
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
 * LinkedIn Discovery Channel Interface
 * 
 * CORE Channel - GATED by UNDEFINED access constraints
 * - Activation Status: Gated (must not block build if disabled)
 * - If disabled: Phase 1 continues with other channels
 * 
 * Function:
 * - Discover LinkedIn profiles for companies and contacts
 * - Extract LinkedIn profile information
 * 
 * Note: 
 * - LinkedIn access type is UNDEFINED (API vs scraping)
 * - Access credentials/permissions are UNDEFINED
 * - Must gracefully degrade if access unavailable
 */
export interface ILinkedInDiscoveryChannel extends IDiscoveryChannel {
  /**
   * Execute LinkedIn profile discovery
   * 
   * Input:
   * - Discovery criteria (company names, contact names, etc.)
   * - Search parameters (UNDEFINED - depends on LinkedIn access method)
   * 
   * Output:
   * - Company LinkedIn profiles discovered
   * - Contact LinkedIn profiles discovered
   * - Profile information extracted
   * 
   * Behavior:
   * - If channel is disabled (activationStatus: 'disabled'), returns empty results
   * - Does not throw errors that would block other channels
   * 
   * @param input - LinkedIn discovery channel input
   * @returns Discovery results with LinkedIn profiles (or empty if disabled)
   */
  discover(input: DiscoveryChannelInput): Promise<DiscoveryChannelOutput>;
  
  /**
   * Get LinkedIn-specific channel configuration
   * 
   * @returns Channel type 'linkedin'
   */
  getChannelType(): 'linkedin';
  
  /**
   * Check if LinkedIn channel is enabled
   * 
   * Note: Activation is gated by UNDEFINED access constraints
   * - Checks activation status from config
   * - Verifies access credentials/permissions (UNDEFINED implementation)
   * 
   * @param config - Channel configuration
   * @returns True if LinkedIn is enabled and access is available
   */
  isEnabled(config: DiscoveryChannelInput['config']): boolean;
}
