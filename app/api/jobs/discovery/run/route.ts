/**
 * Phase 5A - Discovery Job API Route
 *
 * POST /api/jobs/discovery/run
 *
 * Secured endpoint for triggering discovery runs.
 * Can be called by Vercel Cron or manually with correct secret.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  discoveryRunner,
  type DiscoveryJobRequest,
  type DiscoveryJobResponse,
  type DiscoveryJobErrorResponse,
} from '@/lib/discovery/runner';

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

  // 4. Execute discovery run
  try {
    console.log(
      JSON.stringify({
        event: 'discovery_job_started',
        triggeredBy,
        dryRun: body.dryRun ?? false,
        mode: body.mode ?? 'daily',
        timestamp: new Date().toISOString(),
      })
    );

    const result = await discoveryRunner.run({
      dryRun: body.dryRun ?? false,
      mode: body.mode ?? 'daily',
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
