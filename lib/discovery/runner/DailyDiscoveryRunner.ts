/**
 * Phase 5A - Daily Discovery Runner
 *
 * Autonomous discovery runner that:
 * - Executes discovery via existing DiscoveryAggregator
 * - Persists results via existing persistDiscoveryResults
 * - Tracks runs in DiscoveryRun model
 * - Enforces time budgets and limits
 * - Supports dry-run mode
 */

import { prisma } from '../../prisma';
import { DiscoveryAggregator } from '../DiscoveryAggregator';
import { persistDiscoveryResults } from '../persistDiscoveryResults';
import type { DiscoveryChannelInput } from '../types';
import { loadConfig, getDiscoveryQueries, TimeBudget } from './config';
import type {
  DiscoveryRunnerConfig,
  RunOptions,
  RunResult,
  DiscoveryRunStats,
} from './types';

export class DailyDiscoveryRunner {
  private config: DiscoveryRunnerConfig;
  private aggregator: DiscoveryAggregator;

  constructor() {
    this.config = loadConfig();
    this.aggregator = new DiscoveryAggregator();
  }

  /**
   * Check if runner is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Execute a discovery run
   */
  async run(options: RunOptions = {}): Promise<RunResult> {
    const startTime = Date.now();
    const dryRun = options.dryRun ?? false;
    const mode = options.mode ?? 'daily';
    const triggeredBy = options.triggeredBy ?? 'unknown';
    const maxCompanies = options.maxCompanies ?? this.config.maxCompaniesPerRun;

    // Create run record
    const run = await this.createRunRecord({ dryRun, mode, triggeredBy });

    try {
      // Update status to running
      await this.updateRunStatus(run.id, 'running');

      // Create time budget
      const timeBudget = new TimeBudget(this.config.maxRuntimeSeconds);

      // Get queries to execute
      const queries = getDiscoveryQueries(this.config.maxQueries);

      // Execute discovery across all queries
      const discoveryResults = await this.executeDiscovery(
        queries,
        timeBudget,
        maxCompanies
      );

      // Persist results (unless dry run)
      const persistResult = dryRun
        ? this.simulatePersistence(discoveryResults.results.length)
        : await persistDiscoveryResults(discoveryResults.results);

      // Build stats
      const stats: DiscoveryRunStats = {
        channelResults: discoveryResults.channelResults,
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
        config: {
          maxCompanies,
          maxQueries: this.config.maxQueries,
          maxRuntimeSeconds: this.config.maxRuntimeSeconds,
          channels: this.config.enabledChannels,
        },
      };

      // Update run record with results
      await this.completeRun(run.id, stats);

      return {
        success: true,
        runId: run.id,
        status: 'completed',
        dryRun,
        stats,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Mark run as failed
      await this.failRun(run.id, errorMessage);

      return {
        success: false,
        runId: run.id,
        status: 'failed',
        dryRun,
        stats: {
          channelResults: {},
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
          config: {
            maxCompanies,
            maxQueries: this.config.maxQueries,
            maxRuntimeSeconds: this.config.maxRuntimeSeconds,
            channels: this.config.enabledChannels,
          },
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Execute discovery across all queries
   */
  private async executeDiscovery(
    queries: string[],
    timeBudget: TimeBudget,
    maxCompanies: number
  ) {
    // For MVP, we run a single aggregated discovery with all queries combined
    // Future enhancement: iterate through queries with budget checks

    // Build input for aggregator
    const input: DiscoveryChannelInput = {
      config: {
        channelType: 'google', // Primary channel
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

    // Execute discovery
    const result = await this.aggregator.execute({
      enabledChannels: this.config.enabledChannels,
      input,
    });

    // Check for errors
    if (!result.success) {
      console.error('[DiscoveryRunner] Discovery failed:', result.error);
    }

    return result;
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
  }) {
    return prisma.discoveryRun.create({
      data: {
        status: 'pending',
        mode: options.mode,
        dryRun: options.dryRun,
        triggeredBy: options.triggeredBy,
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
   * Mark run as completed with stats
   */
  private async completeRun(runId: string, stats: DiscoveryRunStats) {
    return prisma.discoveryRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        stats: stats as object,
        createdCompaniesCount: stats.companiesCreated,
        createdContactsCount: stats.contactsCreated,
        createdLeadsCount: stats.leadsCreated,
        skippedCount:
          stats.companiesSkipped +
          stats.contactsSkipped +
          stats.leadsSkipped,
        errorCount: stats.errors.length,
      },
    });
  }

  /**
   * Mark run as failed
   */
  private async failRun(runId: string, error: string) {
    return prisma.discoveryRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        error,
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
