/**
 * API: Unarchive a discovery run
 * PATCH /api/discovery/runs/[runId]/unarchive
 * 
 * Unarchives a discovery run (clears archivedAt timestamp).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role?.toLowerCase();
  if (userRole !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  const { runId } = await context.params;

  // Find the run
  const run = await prisma.discoveryRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return NextResponse.json({ success: false, error: 'Discovery run not found' }, { status: 404 });
  }

  // Check if not archived
  if (!run.archivedAt) {
    return NextResponse.json({
      success: false,
      error: 'Run is not archived',
    }, { status: 400 });
  }

  // Unarchive the run
  await prisma.discoveryRun.update({
    where: { id: runId },
    data: {
      archivedAt: null,
      archivedById: null,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Run unarchived successfully',
  });
}
