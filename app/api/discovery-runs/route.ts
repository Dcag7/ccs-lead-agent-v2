/**
 * API route for fetching discovery runs
 * 
 * GET /api/discovery-runs?showArchived=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showArchived = searchParams.get('showArchived') === 'true';

    const runs = await prisma.discoveryRun.findMany({
      where: showArchived ? {} : { archivedAt: null },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    // Serialize dates
    const serializedRuns = runs.map((run) => ({
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
