/**
 * Phase 5A - Discovery Runner Types
 *
 * Type definitions for the autonomous daily discovery runner.
 */

/**
 * Configuration for discovery runner
 */
export interface DiscoveryRunnerConfig {
  /** Master enable switch */
  enabled: boolean;
  /** Maximum companies to create per run */
  maxCompaniesPerRun: number;
  /** Maximum leads to create per run */
  maxLeadsPerRun: number;
  /** Maximum discovery queries per run */
  maxQueries: number;
  /** Maximum pages per query (for pagination) */
  maxPagesPerQuery: number;
  /** Maximum runtime in seconds */
  maxRuntimeSeconds: number;
  /** Enabled discovery channels */
  enabledChannels: Array<'google' | 'keyword'>;
}

/**
 * Limits used for a specific run (stored in DB)
 */
export interface RunLimitsUsed {
  maxCompanies: number;
  maxLeads: number;
  maxQueries: number;
  maxPagesPerQuery: number;
  maxRuntimeSeconds: number;
  channels: string[];
}

/**
 * Intent configuration snapshot (stored in DB)
 */
export interface IntentConfigSnapshot {
  intentId: string;
  intentName: string;
  targetCountries: string[];
  queriesCount: number;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  includeKeywordsCount: number;
  excludeKeywordsCount: number;
  category?: string;
}

/**
 * Options for a discovery run
 */
export interface RunOptions {
  /** If true, no database writes will be made */
  dryRun?: boolean;
  /** Run mode */
  mode?: 'daily' | 'manual' | 'test';
  /** Override max companies limit */
  maxCompanies?: number;
  /** Override max leads limit */
  maxLeads?: number;
  /** What triggered this run */
  triggeredBy?: string;
  /** User ID if manually triggered */
  triggeredById?: string;
  /** Intent ID for manual runs */
  intentId?: string;
  /** Intent name for display */
  intentName?: string;
  /** Custom queries (from intent) */
  queries?: string[];
  /** Custom channels (from intent) */
  channels?: Array<'google' | 'keyword'>;
  /** Max runtime in milliseconds (from intent) */
  timeBudgetMs?: number;
  /** Intent configuration snapshot for recording */
  intentConfig?: IntentConfigSnapshot;
  /** Keywords that MUST appear in results (for filtering) - deprecated, use analysisConfig */
  includeKeywords?: string[];
  /** Keywords that MUST NOT appear in results (for filtering) - deprecated, use analysisConfig */
  excludeKeywords?: string[];
  /** Configuration for web scraping and content analysis */
  analysisConfig?: {
    positiveKeywords: string[];
    negativeKeywords: string[];
    targetBusinessTypes: string[];
    relevanceThreshold?: number;
  };
  /** Whether to enable web scraping (default: true if analysisConfig provided) */
  enableScraping?: boolean;
}

/**
 * Statistics for a discovery run (stored in stats JSON field)
 */
export interface DiscoveryRunStats {
  /** Results per channel */
  channelResults: Record<string, number>;
  /** Channel-specific errors (partial failures) */
  channelErrors: Record<string, string>;
  /** Total results discovered before deduplication */
  totalDiscovered: number;
  /** Total results after deduplication */
  totalAfterDedupe: number;
  /** Companies created */
  companiesCreated: number;
  /** Companies skipped (already existed) */
  companiesSkipped: number;
  /** Contacts created */
  contactsCreated: number;
  /** Contacts skipped (already existed) */
  contactsSkipped: number;
  /** Leads created */
  leadsCreated: number;
  /** Leads skipped (already existed) */
  leadsSkipped: number;
  /** Errors encountered during persistence */
  errors: Array<{ type: string; message: string }>;
  /** Total run duration in milliseconds */
  durationMs: number;
  /** Whether run was stopped early due to limits */
  stoppedEarly: boolean;
  /** Reason for stopping early */
  stoppedReason?: 'time_budget' | 'company_limit' | 'lead_limit' | 'cancelled';
  /** Limits used for this run */
  limitsUsed: RunLimitsUsed;
  /** Intent configuration (if applicable) */
  intentConfig?: IntentConfigSnapshot | Record<string, unknown>;
}

/**
 * Result of a discovery run
 */
export interface RunResult {
  /** Whether the run completed successfully */
  success: boolean;
  /** ID of the DiscoveryRun record */
  runId: string;
  /** Final status */
  status: 'completed' | 'completed_with_errors' | 'failed' | 'cancelled';
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Run statistics */
  stats: DiscoveryRunStats;
  /** Error message if failed */
  error?: string;
}

/**
 * API request body for discovery job
 */
export interface DiscoveryJobRequest {
  /** If true, no database writes */
  dryRun?: boolean;
  /** Run mode */
  mode?: 'daily' | 'manual' | 'test';
  /** Override max companies */
  maxCompanies?: number;
  /** Specific intent ID to run (for single-intent runs) */
  intentId?: string;
}

/**
 * API response for discovery job (success)
 */
export interface DiscoveryJobResponse {
  success: true;
  runId: string;
  status: 'completed';
  dryRun: boolean;
  stats: DiscoveryRunStats;
}

/**
 * API response for discovery job (error)
 */
export interface DiscoveryJobErrorResponse {
  success: false;
  error: string;
  runId?: string;
}
