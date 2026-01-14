/**
 * API route for fetching discovery runs
 * 
 * GET /api/discovery-runs?scope=manual|automated|archived|all&showArchived=true|false
 * 
 * Scope filtering:
 * - manual: triggeredBy === 'manual' OR mode === 'manual'
 * - automated: triggeredBy === 'cron' OR mode === 'daily'
 * - archived: archivedAt != null
 * - all: no scope filter (default)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Classify a run as manual, automated, or other
 */
function classifyRunSource(triggeredBy: string | null, mode: string): 'manual' | 'automated' | 'other' {
  // Manual: triggeredBy === 'manual' OR mode === 'manual' OR triggeredBy contains 'manual-ui'
  if (
    triggeredBy === 'manual' ||
    mode === 'manual' ||
    (triggeredBy && triggeredBy.includes('manual-ui'))
  ) {
    return 'manual';
  }
  
  // Automated: triggeredBy === 'cron' OR mode === 'daily' OR triggeredBy contains 'jobs/discovery'
  if (
    triggeredBy === 'cron' ||
    mode === 'daily' ||
    (triggeredBy && triggeredBy.includes('jobs/discovery'))
  ) {
    return 'automated';
  }
  
  return 'other';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scope = searchParams.get('scope') || 'all'; // manual | automated | archived | all
    const showArchived = searchParams.get('showArchived') === 'true';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Build where clause
    const where: Prisma.DiscoveryRunWhereInput = {};

    // Handle archived scope
    if (scope === 'archived') {
      where.archivedAt = { not: null };
    } else if (scope === 'manual' || scope === 'automated') {
      // For manual/automated, exclude archived by default unless explicitly included
      if (!includeArchived && !showArchived) {
        where.archivedAt = null;
      }
      
      // Add source classification filter
      // We'll filter in memory since Prisma doesn't support complex string matching easily
      // For now, use simple filters
      if (scope === 'manual') {
        where.OR = [
          { triggeredBy: 'manual' },
          { mode: 'manual' },
          { triggeredBy: { contains: 'manual-ui' } },
        ];
      } else if (scope === 'automated') {
        where.OR = [
          { triggeredBy: 'cron' },
          { mode: 'daily' },
          { triggeredBy: { contains: 'jobs/discovery' } },
        ];
      }
    } else {
      // scope === 'all' - exclude archived by default unless showArchived or includeArchived
      if (!showArchived && !includeArchived) {
        where.archivedAt = null;
      }
    }

    const runs = await prisma.discoveryRun.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 100, // Increased limit for filtering
    });

    // Filter by source classification if needed (for more complex matching)
    let filteredRuns = runs;
    if (scope === 'manual' || scope === 'automated') {
      filteredRuns = runs.filter((run) => {
        const source = classifyRunSource(run.triggeredBy, run.mode);
        return source === scope;
      });
    }

    // Serialize dates
    const serializedRuns = filteredRuns.map((run) => ({
      ...run,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
      archivedAt: run.archivedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ runs: serializedRuns });
  } catch (error) {
    console.error('Failed to fetch discovery runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovery runs' },
      { status: 500 }
    );
  }
}
