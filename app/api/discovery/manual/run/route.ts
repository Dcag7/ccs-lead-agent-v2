/**
 * Phase 5A - Manual Discovery Run API
 *
 * POST /api/discovery/manual/run
 *
 * Allows admin users to manually trigger discovery runs using intents.
 * Requires authentication + admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { discoveryRunner } from '@/lib/discovery/runner';
import {
  applyIntentById,
  validateIntentId,
  getActiveIntents,
} from '@/lib/discovery/intents';
import type {
  ManualDiscoveryRequest,
  ManualDiscoveryResponse,
} from '@/lib/discovery/intents/types';

/**
 * Error response type
 */
interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * GET - List available intents
 */
export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check for admin role
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    );
  }

  // Return available intents
  const intents = getActiveIntents().map((intent) => ({
    id: intent.id,
    name: intent.name,
    description: intent.description,
    category: intent.category,
    targetCountries: intent.targetCountries,
    channels: intent.channels,
    limits: intent.limits,
  }));

  return NextResponse.json({
    success: true,
    intents,
    runnerEnabled: discoveryRunner.isEnabled(),
  });
}

/**
 * POST - Run discovery with an intent
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ManualDiscoveryResponse | ErrorResponse>> {
  // 1. Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Check for admin role
  const userId = (session.user as { id?: string }).id;
  const userRole = (session.user as { role?: string }).role;

  if (userRole !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    );
  }

  // 3. Check if discovery is enabled
  if (!discoveryRunner.isEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Discovery runner is disabled. Set DISCOVERY_RUNNER_ENABLED=true to enable.',
      },
      { status: 403 }
    );
  }

  // 4. Parse request body
  let body: ManualDiscoveryRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { intentId, overrides, dryRun = false } = body;

  // 5. Validate intent ID
  if (!intentId) {
    return NextResponse.json(
      { success: false, error: 'intentId is required' },
      { status: 400 }
    );
  }

  const validation = validateIntentId(intentId);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error || 'Invalid intent' },
      { status: 400 }
    );
  }

  // 6. Apply intent with overrides
  const resolvedConfig = applyIntentById(intentId, overrides);
  if (!resolvedConfig) {
    return NextResponse.json(
      { success: false, error: `Failed to resolve intent: ${intentId}` },
      { status: 500 }
    );
  }

  // 7. Log the run
  console.log(
    JSON.stringify({
      event: 'manual_discovery_started',
      intentId,
      intentName: resolvedConfig.intentName,
      userId,
      dryRun,
      queriesCount: resolvedConfig.queries.length,
      channels: resolvedConfig.channels,
      timestamp: new Date().toISOString(),
    })
  );

  // 8. Execute discovery run
  try {
    const result = await discoveryRunner.run({
      dryRun,
      mode: 'manual',
      triggeredBy: 'manual',
      triggeredById: userId,
      intentId: resolvedConfig.intentId,
      intentName: resolvedConfig.intentName,
      queries: resolvedConfig.queries,
      channels: resolvedConfig.channels,
      maxCompanies: resolvedConfig.limits.maxCompanies,
      maxLeads: resolvedConfig.limits.maxLeads,
      timeBudgetMs: resolvedConfig.limits.timeBudgetMs,
      // Snapshot intent config for run record
      intentConfig: {
        intentId: resolvedConfig.intentId,
        intentName: resolvedConfig.intentName,
        targetCountries: resolvedConfig.targetCountries,
        queriesCount: resolvedConfig.queries.length,
        includeKeywordsCount: resolvedConfig.includeKeywords.length,
        excludeKeywordsCount: resolvedConfig.excludeKeywords.length,
      },
    });

    console.log(
      JSON.stringify({
        event: 'manual_discovery_completed',
        intentId,
        runId: result.runId,
        success: result.success,
        durationMs: result.stats.durationMs,
        companiesCreated: result.stats.companiesCreated,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({
      success: result.success,
      runId: result.runId,
      intentId: resolvedConfig.intentId,
      intentName: resolvedConfig.intentName,
      dryRun,
      status: result.status,
      stats: {
        totalDiscovered: result.stats.totalDiscovered,
        companiesCreated: result.stats.companiesCreated,
        contactsCreated: result.stats.contactsCreated,
        leadsCreated: result.stats.leadsCreated,
        durationMs: result.stats.durationMs,
        errors: result.stats.errors,
      },
      error: result.error,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    console.error(
      JSON.stringify({
        event: 'manual_discovery_error',
        intentId,
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
