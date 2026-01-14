/**
 * Phase 5A - Daily Discovery Runner
 *
 * Autonomous discovery runner with safety guardrails:
 * - Kill switch via DISCOVERY_RUNNER_ENABLED
 * - Time budget enforcement with graceful stop
 * - Max limits (companies, leads, queries)
 * - Dry-run mode (no DB writes)
 * - Full run tracking with stats, limits, intent config
 * - Safe channel error handling (partial failures)
 */

import { prisma } from '../../prisma';
import { DiscoveryAggregator } from '../DiscoveryAggregator';
import { persistDiscoveryResults } from '../persistDiscoveryResults';
import type { DiscoveryChannelInput } from '../types';
import { loadConfig, getDiscoveryQueries, TimeBudget, getLimitsForMode } from './config';
import type {
  DiscoveryRunnerConfig,
  RunOptions,
  RunResult,
  DiscoveryRunStats,
  RunLimitsUsed,
  IntentConfigSnapshot,
} from './types';

export class DailyDiscoveryRunner {
  private config: DiscoveryRunnerConfig;
  private aggregator: DiscoveryAggregator;

  constructor() {
    this.config = loadConfig();
    this.aggregator = new DiscoveryAggregator();
  }

  /**
   * Check if runner is enabled (kill switch)
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current configuration (for visibility)
   */
  getConfig(): DiscoveryRunnerConfig {
    return { ...this.config };
  }

  /**
   * Execute a discovery run with full safety guardrails
   */
  async run(options: RunOptions = {}): Promise<RunResult> {
    const startTime = Date.now();

    // Extract options with defaults
    const dryRun = options.dryRun ?? false;
    const mode = options.mode ?? 'daily';
    const triggeredBy = options.triggeredBy ?? 'unknown';
    const triggeredById = options.triggeredById;
    const intentId = options.intentId;
    const intentName = options.intentName;
    const intentConfig = options.intentConfig;
    const includeKeywords = options.includeKeywords;
    const excludeKeywords = options.excludeKeywords;
    const analysisConfig = options.analysisConfig;
    const enableScraping = options.enableScraping ?? !!analysisConfig;

    // Get mode-specific limits (manual = 10, daily = 30)
    const modeLimits = getLimitsForMode(mode);

    // Resolve limits (options > mode defaults > config defaults)
    // Priority: explicit options > mode-specific limits > config defaults
    const maxCompanies = options.maxCompanies ?? modeLimits.maxCompanies;
    const maxLeads = options.maxLeads ?? modeLimits.maxLeads;
    const maxQueries = options.queries?.length 
      ? Math.min(options.queries.length, modeLimits.maxQueries)
      : modeLimits.maxQueries;
    const maxPagesPerQuery = this.config.maxPagesPerQuery;
    const timeBudgetSeconds = options.timeBudgetMs
      ? Math.ceil(options.timeBudgetMs / 1000)
      : this.config.maxRuntimeSeconds;

    // Resolve channels
    const channelsToUse =
      options.channels && options.channels.length > 0
        ? options.channels
        : this.config.enabledChannels;

    // Build limits used snapshot
    const limitsUsed: RunLimitsUsed = {
      maxCompanies,
      maxLeads,
      maxQueries,
      maxPagesPerQuery,
      maxRuntimeSeconds: timeBudgetSeconds,
      channels: channelsToUse,
    };

    // Create run record first (for tracking even if we fail early)
    const run = await this.createRunRecord({
      dryRun,
      mode,
      triggeredBy,
      triggeredById,
      intentId,
      intentName,
    });

    let stoppedEarly = false;
    let stoppedReason: DiscoveryRunStats['stoppedReason'];
    const channelErrors: Record<string, string> = {};

    try {
      // Update status to running
      await this.updateRunStatus(run.id, 'running');

      // Check for cancel before starting
      if (await this.isCancelRequested(run.id)) {
        return this.handleCancellation(run.id, startTime, limitsUsed, intentConfig, channelErrors);
      }

      // Create time budget tracker
      const timeBudget = new TimeBudget(timeBudgetSeconds);

      // Get queries to execute
      const queries =
        options.queries && options.queries.length > 0
          ? options.queries.slice(0, maxQueries)
          : getDiscoveryQueries(maxQueries);

      // Execute discovery with safe channel handling (with scraping if configured)
      // Pass cancel check function for periodic cancellation checks
      let discoveryResults: {
        results: import('../types').DiscoveryResult[];
        channelResults: Record<string, number>;
        totalBeforeDedupe: number;
        totalAfterDedupe: number;
        success: boolean;
        error?: string;
        channelErrors?: Record<string, string>;
      } | undefined;
      
      try {
        discoveryResults = await this.executeDiscoverySafe(
          queries,
          timeBudget,
          maxCompanies,
          channelsToUse,
          channelErrors,
          includeKeywords,
          excludeKeywords,
          analysisConfig,
          enableScraping,
          run.id // Pass runId for cancel checks
        );
      } catch (error) {
        // Check if this is a cancellation error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('cancelled')) {
          // Save partial results if any were collected before cancellation
          const partialResults = discoveryResults ? this.capResultsForStorage(
            discoveryResults.results,
            maxCompanies,
            maxLeads
          ) : undefined;
          return this.handleCancellation(
            run.id, 
            startTime, 
            limitsUsed, 
            intentConfig, 
            channelErrors,
            discoveryResults,
            partialResults
          );
        }
        // Re-throw other errors
        throw error;
      }

      // Check for cancel after discovery
      if (await this.isCancelRequested(run.id)) {
        // Save partial results before cancelling
        const partialResults = this.capResultsForStorage(
          discoveryResults.results,
          maxCompanies,
          maxLeads
        );
        return this.handleCancellation(
          run.id, 
          startTime, 
          limitsUsed, 
          intentConfig, 
          channelErrors,
          discoveryResults,
          partialResults
        );
      }

      // Merge channel errors from aggregator result
      if (discoveryResults.channelErrors) {
        Object.assign(channelErrors, discoveryResults.channelErrors);
      }

      // Check if we stopped due to time budget
      if (timeBudget.isExpired()) {
        stoppedEarly = true;
        stoppedReason = 'time_budget';
        console.log(
          `[DiscoveryRunner] Run ${run.id} stopped early: time budget exceeded`
        );
      }

      // Persist results (unless dry run)
      const persistResult = dryRun
        ? this.simulatePersistence(discoveryResults.results.length)
        : await this.persistWithLimits(
            discoveryResults.results,
            maxCompanies,
            maxLeads,
            (reason) => {
              stoppedEarly = true;
              stoppedReason = reason;
            }
          );

      // Cap results to limits for storage (safe JSON, no secrets)
      // NOTE: resultsJson is saved for BOTH dry-run and real-run to enable UI display
      // This allows users to view discovered results even when no records were created
      const resultsToStore = this.capResultsForStorage(
        discoveryResults.results,
        maxCompanies,
        maxLeads
      );

      // Build comprehensive stats
      const stats: DiscoveryRunStats = {
        channelResults: discoveryResults.channelResults,
        channelErrors,
        totalDiscovered: discoveryResults.totalBeforeDedupe,
        totalAfterDedupe: discoveryResults.totalAfterDedupe,
        companiesCreated: persistResult.companiesCreated,
        companiesSkipped: persistResult.companiesSkipped,
        contactsCreated: persistResult.contactsCreated,
        contactsSkipped: persistResult.contactsSkipped,
        leadsCreated: persistResult.leadsCreated,
        leadsSkipped: persistResult.leadsSkipped,
        errors: persistResult.errors.map((e) => ({
          type: e.resultType,
          message: e.error,
        })),
        durationMs: Date.now() - startTime,
        stoppedEarly,
        stoppedReason,
        limitsUsed,
        intentConfig,
      };

      // Determine final status
      // If Google channel failed (not configured), mark as completed_with_errors
      const hasGoogleError = channelErrors.google !== undefined;
      const hasChannelErrors = Object.keys(channelErrors).length > 0;
      const finalStatus = hasGoogleError 
        ? 'completed_with_errors' 
        : hasChannelErrors 
          ? 'completed' 
          : 'completed';

      // Update run record with results
      await this.completeRun(run.id, stats, finalStatus, resultsToStore);

      return {
        success: true,
        runId: run.id,
        status: finalStatus as 'completed' | 'completed_with_errors',
        dryRun,
        stats,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      console.error(`[DiscoveryRunner] Run ${run.id} failed:`, errorMessage);

      // Build failure stats
      const failureStats: DiscoveryRunStats = {
        channelResults: {},
        channelErrors,
        totalDiscovered: 0,
        totalAfterDedupe: 0,
        companiesCreated: 0,
        companiesSkipped: 0,
        contactsCreated: 0,
        contactsSkipped: 0,
        leadsCreated: 0,
        leadsSkipped: 0,
        errors: [{ type: 'fatal', message: errorMessage }],
        durationMs: Date.now() - startTime,
        stoppedEarly: false,
        limitsUsed,
        intentConfig,
      };

      // Mark run as failed (no results to store on failure)
      await this.failRun(run.id, errorMessage, failureStats);

      return {
        success: false,
        runId: run.id,
        status: 'failed',
        dryRun,
        stats: failureStats,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if cancel has been requested for a run
   */
  private async isCancelRequested(runId: string): Promise<boolean> {
    const run = await prisma.discoveryRun.findUnique({
      where: { id: runId },
      select: { cancelRequestedAt: true },
    });
    return !!run?.cancelRequestedAt;
  }

  /**
   * Handle graceful cancellation of a run
   */
  private async handleCancellation(
    runId: string,
    startTime: number,
    limitsUsed: RunLimitsUsed,
    intentConfig?: IntentConfigSnapshot,
    channelErrors: Record<string, string> = {},
    partialDiscoveryResults?: {
      results: import('../types').DiscoveryResult[];
      channelResults: Record<string, number>;
      totalBeforeDedupe: number;
      totalAfterDedupe: number;
    },
    partialResultsToStore?: import('../types').DiscoveryResult[]
  ): Promise<RunResult> {
    console.log(`[DiscoveryRunner] Run ${runId} cancelled by user request`);

    const stats: DiscoveryRunStats = {
      channelResults: partialDiscoveryResults?.channelResults || {},
      channelErrors,
      totalDiscovered: partialDiscoveryResults?.totalBeforeDedupe || 0,
      totalAfterDedupe: partialDiscoveryResults?.totalAfterDedupe || 0,
      companiesCreated: 0,
      companiesSkipped: 0,
      contactsCreated: 0,
      contactsSkipped: 0,
      leadsCreated: 0,
      leadsSkipped: 0,
      errors: [{ type: 'cancelled', message: 'Run cancelled by user request' }],
      durationMs: Date.now() - startTime,
      stoppedEarly: true,
      stoppedReason: 'cancelled',
      limitsUsed,
      intentConfig,
    };

    await prisma.discoveryRun.update({
      where: { id: runId },
      data: {
        status: 'cancelled',
        finishedAt: new Date(),
        stats: stats as object,
        resultsJson: partialResultsToStore ? (partialResultsToStore as object) : undefined,
        errorCount: 1,
      },
    });

    return {
      success: false,
      runId,
      status: 'cancelled',
      dryRun: false,
      stats,
      error: 'Run cancelled by user request',
    };
  }

  /**
   * Execute discovery with safe channel error handling
   * If a channel fails, continue with others and record the error
   */
  private async executeDiscoverySafe(
    queries: string[],
    timeBudget: TimeBudget,
    maxCompanies: number,
    channels: Array<'google' | 'keyword'>,
    channelErrors: Record<string, string>,
    includeKeywords?: string[],
    excludeKeywords?: string[],
    analysisConfig?: {
      positiveKeywords: string[];
      negativeKeywords: string[];
      targetBusinessTypes: string[];
      relevanceThreshold?: number;
    },
    enableScraping?: boolean,
    runId?: string
  ) {
    // Check time budget before starting
    if (timeBudget.isExpired()) {
      return {
        results: [],
        channelResults: {},
        totalBeforeDedupe: 0,
        totalAfterDedupe: 0,
        success: false,
        error: 'Time budget expired before discovery started',
      };
    }

    // Build input for aggregator
    const input: DiscoveryChannelInput = {
      config: {
        channelType: 'google',
        activationStatus: 'enabled',
        channelConfig: {
          maxResults: maxCompanies,
        },
      },
      searchCriteria: queries,
      parameters: {
        maxResults: maxCompanies,
        timeout: timeBudget.remainingMs(),
      },
    };

    try {
      // Check for cancel before starting discovery
      if (runId && await this.isCancelRequested(runId)) {
        throw new Error('Discovery cancelled by user request');
      }

      // Execute discovery with scraping and content analysis
      const result = await this.aggregator.execute({
        enabledChannels: channels,
        input,
        // Pass analysis config for scraping-enabled discovery
        analysisConfig,
        enableScraping,
        // Legacy support
        includeKeywords,
        excludeKeywords,
        // Pass cancel check function for periodic checks
        cancelCheck: runId ? async () => await this.isCancelRequested(runId) : undefined,
      });

      // Record any channel-specific errors from aggregator
      if (result.error) {
        // Check if it's a cancellation error
        if (result.error.includes('cancelled')) {
          throw new Error('Discovery cancelled by user request');
        }
        // If there's a general error but we still got results, it's a partial failure
        channelErrors['aggregator'] = result.error;
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      
      // Check if this is a cancellation error
      if (errorMessage.includes('cancelled')) {
        throw error; // Re-throw to be handled by caller
      }
      
      channelErrors['discovery'] = errorMessage;

      // Return empty result on total failure
      return {
        results: [],
        channelResults: {},
        totalBeforeDedupe: 0,
        totalAfterDedupe: 0,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Persist results with limit enforcement
   * Stops early if company or lead limits are reached
   */
  private async persistWithLimits(
    results: import('../types').DiscoveryResult[],
    maxCompanies: number,
    maxLeads: number,
    onStopEarly: (reason: 'company_limit' | 'lead_limit') => void
  ) {
    // For MVP, use existing persistDiscoveryResults
    // TODO: Add incremental persistence with limit checking in Phase 5B
    const persistResult = await persistDiscoveryResults(results);

    // Check if we hit limits (for logging, not stopping mid-persist in MVP)
    if (persistResult.companiesCreated >= maxCompanies) {
      onStopEarly('company_limit');
    } else if (persistResult.leadsCreated >= maxLeads) {
      onStopEarly('lead_limit');
    }

    return persistResult;
  }

  /**
   * Simulate persistence for dry run (no DB writes)
   */
  private simulatePersistence(resultCount: number) {
    return {
      companiesCreated: 0,
      companiesSkipped: resultCount,
      contactsCreated: 0,
      contactsSkipped: 0,
      leadsCreated: 0,
      leadsSkipped: 0,
      errors: [] as Array<{ resultType: string; error: string }>,
      success: true,
    };
  }

  /**
   * Create a new run record
   */
  private async createRunRecord(options: {
    dryRun: boolean;
    mode: string;
    triggeredBy: string;
    triggeredById?: string;
    intentId?: string;
    intentName?: string;
  }) {
    return prisma.discoveryRun.create({
      data: {
        status: 'pending',
        mode: options.mode,
        dryRun: options.dryRun,
        triggeredBy: options.triggeredBy,
        triggeredById: options.triggeredById,
        intentId: options.intentId,
        intentName: options.intentName,
      },
    });
  }

  /**
   * Update run status
   */
  private async updateRunStatus(runId: string, status: string) {
    return prisma.discoveryRun.update({
      where: { id: runId },
      data: { status },
    });
  }

  /**
   * Cap results for storage (respects maxCompanies/maxLeads limits)
   * Returns safe JSON-serializable results (no secrets)
   */
  private capResultsForStorage(
    results: import('../types').DiscoveryResult[],
    maxCompanies: number,
    maxLeads: number
  ): import('../types').DiscoveryResult[] {
    let companyCount = 0;
    let leadCount = 0;
    const capped: import('../types').DiscoveryResult[] = [];

    for (const result of results) {
      if (result.type === 'company') {
        if (companyCount >= maxCompanies) continue;
        companyCount++;
      } else if (result.type === 'lead') {
        if (leadCount >= maxLeads) continue;
        leadCount++;
      }
      // Always include contacts (they're linked to companies/leads)
      capped.push(result);
    }

    return capped;
  }

  /**
   * Mark run as completed with stats
   * NOTE: resultsJson is saved for both dry-run and real-run to enable UI display
   */
  private async completeRun(
    runId: string,
    stats: DiscoveryRunStats,
    status: string = 'completed',
    resultsJson?: import('../types').DiscoveryResult[]
  ) {
    return prisma.discoveryRun.update({
      where: { id: runId },
      data: {
        status,
        finishedAt: new Date(),
        stats: stats as object,
        // Always save resultsJson for UI display (both dry-run and real-run)
        // resultsJson contains capped results for display, even if no records were created
        resultsJson: resultsJson ? (resultsJson as object) : undefined,
        createdCompaniesCount: stats.companiesCreated,
        createdContactsCount: stats.contactsCreated,
        createdLeadsCount: stats.leadsCreated,
        skippedCount:
          stats.companiesSkipped +
          stats.contactsSkipped +
          stats.leadsSkipped,
        errorCount: stats.errors.length + Object.keys(stats.channelErrors).length,
      },
    });
  }

  /**
   * Mark run as failed
   */
  private async failRun(
    runId: string,
    error: string,
    stats?: DiscoveryRunStats
  ) {
    return prisma.discoveryRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        error,
        stats: stats ? (stats as object) : undefined,
        errorCount: 1,
      },
    });
  }

  /**
   * Get recent runs for observability
   */
  async getRecentRuns(limit = 20) {
    return prisma.discoveryRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}

// Export singleton instance
export const discoveryRunner = new DailyDiscoveryRunner();
