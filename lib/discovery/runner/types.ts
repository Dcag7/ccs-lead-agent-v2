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
  /** Maximum discovery queries per run */
  maxQueries: number;
  /** Maximum runtime in seconds */
  maxRuntimeSeconds: number;
  /** Enabled discovery channels */
  enabledChannels: Array<'google' | 'keyword'>;
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
  /** What triggered this run */
  triggeredBy?: string;
}

/**
 * Statistics for a discovery run (stored in stats JSON field)
 */
export interface DiscoveryRunStats {
  /** Results per channel */
  channelResults: Record<string, number>;
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
  /** Errors encountered */
  errors: Array<{ type: string; message: string }>;
  /** Total run duration in milliseconds */
  durationMs: number;
  /** Configuration used for this run */
  config: {
    maxCompanies: number;
    maxQueries: number;
    maxRuntimeSeconds: number;
    channels: string[];
  };
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
  status: 'completed' | 'failed';
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
