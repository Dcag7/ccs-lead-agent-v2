/**
 * API route for fetching discovery runs
 * 
 * GET /api/discovery-runs
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const runs = await prisma.discoveryRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    // Serialize dates
    const serializedRuns = runs.map((run) => ({
      ...run,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
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
