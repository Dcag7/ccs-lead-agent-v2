/**
 * Phase 5A - Discovery Job API Route
 *
 * POST /api/jobs/discovery/run
 *
 * Secured endpoint for triggering discovery runs.
 * Can be called by Vercel Cron or manually with correct secret.
 * 
 * Daily runs execute multiple intents sequentially with per-intent limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  discoveryRunner,
  type DiscoveryJobRequest,
  type DiscoveryJobResponse,
  type DiscoveryJobErrorResponse,
} from '@/lib/discovery/runner';
import {
  getDailyIntentIds,
  getDailyPerIntentLimits,
} from '@/lib/discovery/runner/config';
import {
  getIntentById,
  applyIntentById,
  getAnalysisConfigForIntent,
} from '@/lib/discovery/intents';

/**
 * Verify request authentication
 * Accepts either Vercel Cron header or custom secret header
 */
function isAuthorized(request: NextRequest): boolean {
  // Check for Vercel Cron header (automatically set by Vercel)
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  if (isVercelCron) {
    return true;
  }

  // Check for custom secret header
  const secretHeader = request.headers.get('x-job-secret');
  const expectedSecret = process.env.CRON_JOB_SECRET;

  if (!expectedSecret) {
    console.error('[DiscoveryJob] CRON_JOB_SECRET not configured');
    return false;
  }

  return secretHeader === expectedSecret;
}

/**
 * Run discovery for a single intent
 */
async function runIntentDiscovery(
  intentId: string,
  dryRun: boolean,
  triggeredBy: string,
  perIntentLimits: ReturnType<typeof getDailyPerIntentLimits>
) {
  const intent = getIntentById(intentId);
  if (!intent) {
    console.warn(`[DiscoveryJob] Intent not found: ${intentId}`);
    return null;
  }

  if (!intent.active) {
    console.warn(`[DiscoveryJob] Intent is inactive: ${intentId}`);
    return null;
  }

  const resolved = applyIntentById(intentId);
  if (!resolved) {
    console.warn(`[DiscoveryJob] Failed to resolve intent: ${intentId}`);
    return null;
  }

  const analysisConfig = getAnalysisConfigForIntent(intent);

  console.log(
    JSON.stringify({
      event: 'discovery_intent_started',
      intentId,
      intentName: resolved.intentName,
      queriesCount: Math.min(resolved.queries.length, perIntentLimits.maxQueries),
      dryRun,
      timestamp: new Date().toISOString(),
    })
  );

  const result = await discoveryRunner.run({
    dryRun,
    mode: 'daily',
    triggeredBy,
    intentId: resolved.intentId,
    intentName: resolved.intentName,
    queries: resolved.queries.slice(0, perIntentLimits.maxQueries),
    channels: resolved.channels,
    maxCompanies: perIntentLimits.maxCompanies,
    maxLeads: perIntentLimits.maxLeads,
    timeBudgetMs: 60000, // 60 seconds per intent
    enableScraping: true,
    analysisConfig,
    includeKeywords: resolved.includeKeywords,
    excludeKeywords: resolved.excludeKeywords,
    intentConfig: {
      intentId: resolved.intentId,
      intentName: resolved.intentName,
      targetCountries: resolved.targetCountries,
      queriesCount: resolved.queries.length,
      includeKeywordsCount: resolved.includeKeywords.length,
      excludeKeywordsCount: resolved.excludeKeywords.length,
    },
  });

  console.log(
    JSON.stringify({
      event: 'discovery_intent_completed',
      intentId,
      runId: result.runId,
      success: result.success,
      companiesCreated: result.stats.companiesCreated,
      leadsCreated: result.stats.leadsCreated,
      durationMs: result.stats.durationMs,
      timestamp: new Date().toISOString(),
    })
  );

  return result;
}

/**
 * POST handler for discovery job
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<DiscoveryJobResponse | DiscoveryJobErrorResponse>> {
  // 1. Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Check if discovery is enabled
  if (!discoveryRunner.isEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Discovery runner is disabled. Set DISCOVERY_RUNNER_ENABLED=true to enable.',
      },
      { status: 403 }
    );
  }

  // 3. Parse request body
  let body: DiscoveryJobRequest = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    // Empty body is fine, use defaults
  }

  // Determine trigger source
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const triggeredBy = isVercelCron ? 'cron' : 'manual';
  const mode = body.mode ?? 'daily';
  const dryRun = body.dryRun ?? false;

  // 4. Execute discovery run(s)
  try {
    console.log(
      JSON.stringify({
        event: 'discovery_job_started',
        triggeredBy,
        dryRun,
        mode,
        timestamp: new Date().toISOString(),
      })
    );

    // For daily mode, run multiple intents
    if (mode === 'daily' && !body.intentId) {
      const intentIds = getDailyIntentIds();
      const perIntentLimits = getDailyPerIntentLimits();

      console.log(
        JSON.stringify({
          event: 'discovery_daily_multi_intent',
          intentCount: intentIds.length,
          intents: intentIds,
          perIntentLimits,
          timestamp: new Date().toISOString(),
        })
      );

      // Aggregate stats across all intents
      const aggregatedStats = {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        totalCompaniesCreated: 0,
        totalContactsCreated: 0,
        totalLeadsCreated: 0,
        totalDiscovered: 0,
        totalDurationMs: 0,
        runIds: [] as string[],
        errors: [] as string[],
      };

      // Run each intent sequentially
      for (const intentId of intentIds) {
        try {
          const result = await runIntentDiscovery(
            intentId,
            dryRun,
            triggeredBy,
            perIntentLimits
          );

          if (result) {
            aggregatedStats.totalRuns++;
            aggregatedStats.runIds.push(result.runId);
            aggregatedStats.totalDurationMs += result.stats.durationMs;
            aggregatedStats.totalDiscovered += result.stats.totalDiscovered;

            if (result.success) {
              aggregatedStats.successfulRuns++;
              aggregatedStats.totalCompaniesCreated += result.stats.companiesCreated;
              aggregatedStats.totalContactsCreated += result.stats.contactsCreated;
              aggregatedStats.totalLeadsCreated += result.stats.leadsCreated;
            } else {
              aggregatedStats.failedRuns++;
              if (result.error) {
                aggregatedStats.errors.push(`${intentId}: ${result.error}`);
              }
            }
          }
        } catch (error) {
          aggregatedStats.failedRuns++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          aggregatedStats.errors.push(`${intentId}: ${errorMessage}`);
          console.error(`[DiscoveryJob] Intent ${intentId} failed:`, errorMessage);
        }
      }

      console.log(
        JSON.stringify({
          event: 'discovery_job_completed',
          mode: 'daily_multi_intent',
          totalRuns: aggregatedStats.totalRuns,
          successfulRuns: aggregatedStats.successfulRuns,
          failedRuns: aggregatedStats.failedRuns,
          totalCompaniesCreated: aggregatedStats.totalCompaniesCreated,
          totalLeadsCreated: aggregatedStats.totalLeadsCreated,
          totalDurationMs: aggregatedStats.totalDurationMs,
          timestamp: new Date().toISOString(),
        })
      );

      // Return aggregated results
      const allSuccess = aggregatedStats.failedRuns === 0;
      
      if (allSuccess) {
        return NextResponse.json({
          success: true as const,
          runId: aggregatedStats.runIds.join(','),
          status: 'completed' as const,
          dryRun,
          stats: {
            totalDiscovered: aggregatedStats.totalDiscovered,
            totalAfterDedupe: 0,
            companiesCreated: aggregatedStats.totalCompaniesCreated,
            companiesSkipped: 0,
            contactsCreated: aggregatedStats.totalContactsCreated,
            contactsSkipped: 0,
            leadsCreated: aggregatedStats.totalLeadsCreated,
            leadsSkipped: 0,
            durationMs: aggregatedStats.totalDurationMs,
            errors: aggregatedStats.errors.map((e) => ({ type: 'intent_error', message: e })),
            stoppedEarly: false,
            channelResults: {},
            channelErrors: {},
            limitsUsed: {
              maxCompanies: getDailyPerIntentLimits().maxCompanies,
              maxLeads: getDailyPerIntentLimits().maxLeads,
              maxQueries: getDailyPerIntentLimits().maxQueries,
              maxPagesPerQuery: 2,
              maxRuntimeSeconds: 60,
              channels: ['google', 'keyword'],
            },
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `${aggregatedStats.failedRuns} of ${aggregatedStats.totalRuns} intents failed: ${aggregatedStats.errors.slice(0, 3).join('; ')}`,
            runId: aggregatedStats.runIds.join(','),
          },
          { status: 500 }
        );
      }
    }

    // Single intent or non-daily mode: run as before
    const result = await discoveryRunner.run({
      dryRun,
      mode,
      maxCompanies: body.maxCompanies,
      triggeredBy,
    });

    console.log(
      JSON.stringify({
        event: 'discovery_job_completed',
        runId: result.runId,
        success: result.success,
        status: result.status,
        durationMs: result.stats.durationMs,
        companiesCreated: result.stats.companiesCreated,
        leadsCreated: result.stats.leadsCreated,
        timestamp: new Date().toISOString(),
      })
    );

    if (result.success) {
      return NextResponse.json({
        success: true as const,
        runId: result.runId,
        status: 'completed' as const,
        dryRun: result.dryRun,
        stats: result.stats,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Discovery run failed',
          runId: result.runId,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    console.error(
      JSON.stringify({
        event: 'discovery_job_error',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Reject non-POST methods
 */
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
