/**
 * Phase 1 Discovery - Website Signal Extraction Interface
 * 
 * Interface for extracting structured signals from company websites.
 * Defines input/output contract only - no implementation.
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 * 
 * Focus: Structured data extraction only (not raw content storage)
 */

import type {
  WebsiteSignalExtractionInput,
  WebsiteSignalExtractionOutput,
  WebsiteSignals,
} from '../types';

/**
 * Website Signal Extractor Interface
 * 
 * Extracts structured signals from company websites:
 * 1. Services Offered
 * 2. Industries Served
 * 3. Locations
 * 4. Contact Channels (email, phone, contact forms)
 * 
 * Note:
 * - Raw website content storage is UNDEFINED (only structured signals extracted)
 * - Crawl depth is UNDEFINED (homepage only vs multiple pages)
 * - Full-site crawling approach is UNDEFINED
 */
export interface IWebsiteSignalExtractor {
  /**
   * Extract structured signals from a company website
   * 
   * Input:
   * - Website URL
   * - Company name (optional, may help extraction)
   * - Extraction parameters (UNDEFINED - depth, pages, etc.)
   * 
   * Output:
   * - Structured signals (services, industries, locations, contact channels)
   * - Success status
   * - Error information (if extraction failed)
   * 
   * @param input - Website signal extraction input
   * @returns Structured signals extracted from the website
   */
  extractSignals(input: WebsiteSignalExtractionInput): Promise<WebsiteSignalExtractionOutput>;
  
  /**
   * Extract services offered from website content
   * 
   * @param signals - Raw extracted signals (if already extracted)
   * @returns Structured services data
   */
  extractServices(signals: WebsiteSignals): WebsiteSignals['services'];
  
  /**
   * Extract industries served from website content
   * 
   * @param signals - Raw extracted signals (if already extracted)
   * @returns Structured industries data
   */
  extractIndustries(signals: WebsiteSignals): WebsiteSignals['industries'];
  
  /**
   * Extract locations from website content
   * 
   * @param signals - Raw extracted signals (if already extracted)
   * @returns Structured locations data
   */
  extractLocations(signals: WebsiteSignals): WebsiteSignals['locations'];
  
  /**
   * Extract contact channels from website content
   * 
   * @param signals - Raw extracted signals (if already extracted)
   * @returns Structured contact channels data
   */
  extractContactChannels(signals: WebsiteSignals): WebsiteSignals['contactChannels'];
}
