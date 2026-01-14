/**
 * Phase 5A - Discovery Intent Types
 *
 * Strong types for code-first discovery templates (intents).
 * Each intent represents a predefined discovery strategy targeting
 * specific types of prospects.
 */

/**
 * Supported discovery channels
 */
export type DiscoveryChannel = 'google' | 'keyword';

/**
 * Country codes supported for discovery
 */
export type CountryCode = 'ZA' | 'BW' | 'NA' | 'MZ' | 'ZW' | 'KE' | 'NG' | 'GH';

/**
 * Intent categories for grouping discovery templates
 */
export type IntentCategory = 
  | 'referral' 
  | 'agency' 
  | 'buyer' 
  | 'event' 
  | 'schools' 
  | 'tenders' 
  | 'business'
  | 'custom';

/**
 * Geography configuration for targeting
 */
export interface GeographyConfig {
  /** Primary country (ISO 2-letter code) */
  primaryCountry: CountryCode;
  /** Prioritized regions/cities within the country */
  priorityRegions?: string[];
  /** Boost score for priority regions (0-1, default 0.2) */
  regionBoost?: number;
}

/**
 * Discovery intent definition
 *
 * An intent is a code-first template that configures discovery
 * for a specific type of prospect.
 */
export interface DiscoveryIntent {
  /** Unique identifier (snake_case) */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what this intent targets */
  description: string;

  /** Target countries (ISO 2-letter codes) */
  targetCountries: CountryCode[];

  /** Google-style search queries */
  seedQueries: string[];

  /** Keywords to include/match in results */
  includeKeywords: string[];

  /** Keywords to exclude from results */
  excludeKeywords: string[];

  /** Which discovery channels to use */
  channels: DiscoveryChannel[];

  /** Optional limit overrides */
  limits?: {
    /** Max leads to create */
    maxLeads?: number;
    /** Max companies to create */
    maxCompanies?: number;
    /** Max queries to run */
    maxQueries?: number;
    /** Max runtime in milliseconds */
    timeBudgetMs?: number;
  };

  /** Category for grouping intents */
  category: IntentCategory;

  /** Whether intent is active and available for use */
  active: boolean;

  /** Geography targeting configuration (optional, for Gauteng-first bias etc.) */
  geography?: GeographyConfig;
}

/**
 * User-provided overrides for an intent
 */
export interface IntentOverrides {
  /** Override target countries */
  targetCountries?: CountryCode[];

  /** Additional keywords to include */
  additionalIncludeKeywords?: string[];

  /** Additional keywords to exclude */
  additionalExcludeKeywords?: string[];

  /** Override channels */
  channels?: DiscoveryChannel[];

  /** Override limits */
  limits?: {
    maxLeads?: number;
    maxCompanies?: number;
    maxQueries?: number;
    timeBudgetMs?: number;
  };
}

/**
 * Resolved intent configuration (after applying overrides)
 */
export interface ResolvedIntentConfig {
  /** Original intent ID */
  intentId: string;

  /** Intent name (for display) */
  intentName: string;

  /** Final target countries */
  targetCountries: CountryCode[];

  /** Final seed queries (with country substitutions) */
  queries: string[];

  /** Final include keywords */
  includeKeywords: string[];

  /** Final exclude keywords */
  excludeKeywords: string[];

  /** Final channels to use */
  channels: DiscoveryChannel[];

  /** Final limits */
  limits: {
    maxLeads: number;
    maxCompanies: number;
    maxQueries: number;
    timeBudgetMs: number;
  };
}

/**
 * Request body for manual discovery run
 */
export interface ManualDiscoveryRequest {
  /** Intent ID to use */
  intentId: string;

  /** Optional overrides */
  overrides?: IntentOverrides;

  /** Whether this is a dry run */
  dryRun?: boolean;
}

/**
 * Response from manual discovery run
 */
export interface ManualDiscoveryResponse {
  success: boolean;
  runId: string;
  intentId: string;
  intentName: string;
  dryRun: boolean;
  status: 'completed' | 'completed_with_errors' | 'failed';
  stats?: {
    totalDiscovered: number;
    companiesCreated: number;
    contactsCreated: number;
    leadsCreated: number;
    durationMs: number;
    errors: Array<{ type: string; message: string }>;
  };
  error?: string;
}
