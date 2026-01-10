/**
 * Phase 1 Discovery - Type Definitions
 * 
 * This file defines the core interfaces and types for Phase 1 Discovery MVP.
 * No implementations - only contracts.
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md and PHASE_1_Discovery_Design_Locked.md
 */

// ============================================================================
// Discovery Channel Types
// ============================================================================

/**
 * Discovery Channel Type
 * Identifies which discovery channel produced a result
 */
export type DiscoveryChannelType = 
  | 'google'           // Google Search Discovery
  | 'linkedin'         // LinkedIn Profile Discovery (GATED)
  | 'social'           // Social Platform Monitoring (GATED)
  | 'keyword';         // Industry Keyword-Based Prospecting

/**
 * Discovery Channel Status
 * Indicates whether a gated channel is enabled or disabled
 */
export type ChannelActivationStatus = 
  | 'enabled'          // Channel is active and available
  | 'disabled'         // Channel is inactive (access constraints)

/**
 * Discovery Channel Configuration
 * Configuration for a discovery channel (input contract)
 */
export interface DiscoveryChannelConfig {
  /** Channel type identifier */
  channelType: DiscoveryChannelType;
  
  /** Activation status (for gated channels) */
  activationStatus: ChannelActivationStatus;
  
  /** Channel-specific configuration (UNDEFINED structure - depends on channel) */
  channelConfig?: Record<string, unknown>;
}

/**
 * Discovery Channel Input
 * Input contract for discovery channel execution
 */
export interface DiscoveryChannelInput {
  /** Configuration for this discovery run */
  config: DiscoveryChannelConfig;
  
  /** Search queries or keywords to use (UNDEFINED format - depends on channel) */
  searchCriteria?: string | string[];
  
  /** Additional parameters (UNDEFINED - channel-specific) */
  parameters?: Record<string, unknown>;
}

/**
 * Discovery Channel Output
 * Output contract from discovery channel execution
 */
export interface DiscoveryChannelOutput {
  /** Channel that produced these results */
  channelType: DiscoveryChannelType;
  
  /** Discovered prospects (companies, contacts, or both) */
  results: DiscoveryResult[];
  
  /** Whether the channel executed successfully */
  success: boolean;
  
  /** Error message if channel failed (no activity logging - just error context) */
  error?: string;
  
  /** Channel-specific metadata (UNDEFINED structure) */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Website Signal Extraction Types
// ============================================================================

/**
 * Website Signal - Services Offered
 * Structured data about services or products
 */
export interface WebsiteSignalServices {
  /** List of services or products mentioned */
  services: string[];
  
  /** Service descriptions or categories (if available) */
  descriptions?: string[];
}

/**
 * Website Signal - Industries Served
 * Structured data about target industries
 */
export interface WebsiteSignalIndustries {
  /** List of industries or sectors mentioned */
  industries: string[];
  
  /** Industry categories or classifications (if available) */
  categories?: string[];
}

/**
 * Website Signal - Locations
 * Structured data about geographic locations
 */
export interface WebsiteSignalLocations {
  /** List of geographic locations mentioned */
  locations: string[];
  
  /** Address information (if available) */
  addresses?: string[];
  
  /** Service areas or office locations */
  serviceAreas?: string[];
}

/**
 * Website Signal - Contact Channels
 * Structured data about contact methods
 */
export interface WebsiteSignalContactChannels {
  /** Public email addresses found */
  emails: string[];
  
  /** Public phone numbers found */
  phones: string[];
  
  /** Contact form URLs or presence indicators */
  contactForms?: Array<{
    url?: string;
    presence?: boolean;
  }>;
  
  /** Other contact methods mentioned */
  other?: string[];
}

/**
 * Website Signals
 * Complete structured signals extracted from a company website
 */
export interface WebsiteSignals {
  /** Services offered by the company */
  services?: WebsiteSignalServices;
  
  /** Industries served by the company */
  industries?: WebsiteSignalIndustries;
  
  /** Geographic locations mentioned */
  locations?: WebsiteSignalLocations;
  
  /** Contact channels available */
  contactChannels?: WebsiteSignalContactChannels;
}

/**
 * Website Signal Extraction Input
 * Input contract for website signal extraction
 */
export interface WebsiteSignalExtractionInput {
  /** URL of the website to extract signals from */
  url: string;
  
  /** Company name (if known, may help extraction) */
  companyName?: string;
  
  /** Extraction parameters (UNDEFINED - depth, pages, etc.) */
  parameters?: Record<string, unknown>;
}

/**
 * Website Signal Extraction Output
 * Output contract from website signal extraction
 */
export interface WebsiteSignalExtractionOutput {
  /** Source URL that was extracted */
  sourceUrl: string;
  
  /** Extracted structured signals */
  signals: WebsiteSignals;
  
  /** Whether extraction was successful */
  success: boolean;
  
  /** Error message if extraction failed */
  error?: string;
  
  /** Extraction metadata (UNDEFINED structure) */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Discovery Result Types (Common Structure)
// ============================================================================

/**
 * Discovery Metadata
 * Metadata attached to CRM records about the discovery process
 */
export interface DiscoveryMetadata {
  /** Source channel that discovered this prospect */
  discoverySource: DiscoveryChannelType;
  
  /** Discovery timestamp */
  discoveryTimestamp: Date;
  
  /** Discovery method or query used (if available) */
  discoveryMethod?: string;
  
  /** Additional discovery metadata (UNDEFINED structure) */
  additionalMetadata?: Record<string, unknown>;
}

/**
 * Discovery Result - Company
 * Company data discovered through any channel
 */
export interface DiscoveryCompanyResult {
  /** Type indicator */
  type: 'company';
  
  /** Company name (REQUIRED) */
  name: string;
  
  /** Website URL (if found) */
  website?: string;
  
  /** Industry classification (if found) */
  industry?: string;
  
  /** Country (if found) */
  country?: string;
  
  /** Services offered (from website signals) */
  services?: string[];
  
  /** Industries served (from website signals) */
  industriesServed?: string[];
  
  /** Locations (from website signals) */
  locations?: string[];
  
  /** Contact channels (from website signals) */
  contactChannels?: WebsiteSignalContactChannels;
  
  /** Discovery metadata */
  discoveryMetadata: DiscoveryMetadata;
}

/**
 * Discovery Result - Contact
 * Contact data discovered through any channel
 */
export interface DiscoveryContactResult {
  /** Type indicator */
  type: 'contact';
  
  /** Contact name (REQUIRED) */
  name: string;
  
  /** First name (if parsed from name) */
  firstName?: string;
  
  /** Last name (if parsed from name) */
  lastName?: string;
  
  /** Email address (if found) */
  email?: string;
  
  /** Phone number (if found) */
  phone?: string;
  
  /** Job title or role (if found) */
  role?: string;
  
  /** LinkedIn profile URL (if found) */
  linkedInUrl?: string;
  
  /** Associated company name (if relationship discovered) */
  companyName?: string;
  
  /** Discovery metadata */
  discoveryMetadata: DiscoveryMetadata;
}

/**
 * Discovery Result - Lead
 * Lead data that may combine Company and/or Contact
 */
export interface DiscoveryLeadResult {
  /** Type indicator */
  type: 'lead';
  
  /** Discovery method (e.g., "Google search", "LinkedIn profile", "keyword search") */
  source: DiscoveryChannelType;
  
  /** Discovery timestamp */
  discoveryTimestamp: Date;
  
  /** Associated company (if discovered) */
  company?: DiscoveryCompanyResult;
  
  /** Associated contact (if discovered) */
  contact?: DiscoveryContactResult;
  
  /** Additional discovery metadata (UNDEFINED structure) */
  additionalMetadata?: Record<string, unknown>;
}

/**
 * Discovery Result Union
 * Common structure that can represent Company, Contact, or Lead
 */
export type DiscoveryResult = 
  | DiscoveryCompanyResult 
  | DiscoveryContactResult 
  | DiscoveryLeadResult;

// ============================================================================
// CRM Record Mapping Types
// ============================================================================

/**
 * Discovery Metadata Fields for Company Record
 * Fields that store discovery metadata on Company records
 * 
 * Note: These fields map to Prisma schema (fields may need to be added)
 */
export interface CompanyDiscoveryFields {
  /** Discovery source (stored in field or JSON) */
  discoverySource?: DiscoveryChannelType;
  
  /** Discovery timestamp (may use createdAt, or separate field) */
  discoveryTimestamp?: Date;
  
  /** Discovery method used (may be stored in JSON metadata) */
  discoveryMethod?: string;
  
  /** Additional discovery metadata (may be stored in JSON field) */
  discoveryMetadata?: Record<string, unknown>;
}

/**
 * Discovery Metadata Fields for Contact Record
 * Fields that store discovery metadata on Contact records
 * 
 * Note: These fields map to Prisma schema (fields may need to be added)
 */
export interface ContactDiscoveryFields {
  /** Discovery source (stored in field or JSON) */
  discoverySource?: DiscoveryChannelType;
  
  /** Discovery timestamp (may use createdAt, or separate field) */
  discoveryTimestamp?: Date;
  
  /** Discovery method used (may be stored in JSON metadata) */
  discoveryMethod?: string;
  
  /** LinkedIn profile URL (if discovered via LinkedIn) */
  linkedInUrl?: string;
  
  /** Additional discovery metadata (may be stored in JSON field) */
  discoveryMetadata?: Record<string, unknown>;
}

/**
 * Discovery Metadata Fields for Lead Record
 * Fields that store discovery metadata on Lead records
 * 
 * Note: These fields map to Prisma schema (fields may need to be added)
 */
export interface LeadDiscoveryFields {
  /** Lead source (discovery method) - maps to existing 'source' field */
  source?: DiscoveryChannelType;
  
  /** Discovery timestamp (may use createdAt, or separate field) */
  discoveryTimestamp?: Date;
  
  /** Discovery method used (may be stored in JSON metadata) */
  discoveryMethod?: string;
  
  /** Additional discovery metadata (may be stored in JSON field) */
  discoveryMetadata?: Record<string, unknown>;
}
