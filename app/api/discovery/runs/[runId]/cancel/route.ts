/**
 * API: Cancel a running discovery run
 * POST /api/discovery/runs/[runId]/cancel
 * 
 * Sets cancelRequestedAt on the run if it's currently running.
 * The runner checks this flag between major steps and will gracefully stop.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
  const userId = (session.user as { id?: string }).id;

  // Find the run
  const run = await prisma.discoveryRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return NextResponse.json({ success: false, error: 'Discovery run not found' }, { status: 404 });
  }

  // Check if cancellable
  if (run.status !== 'running' && run.status !== 'pending') {
    return NextResponse.json({
      success: false,
      error: `Cannot cancel run with status "${run.status}". Only running or pending runs can be cancelled.`,
    }, { status: 400 });
  }

  // Check if already cancelled
  if (run.cancelRequestedAt) {
    return NextResponse.json({
      success: false,
      error: 'Cancel already requested for this run',
    }, { status: 400 });
  }

  // Request cancellation
  await prisma.discoveryRun.update({
    where: { id: runId },
    data: {
      cancelRequestedAt: new Date(),
      cancelRequestedBy: userId,
    },
  });

  console.log(
    JSON.stringify({
      event: 'discovery_run_cancel_requested',
      runId,
      requestedBy: userId,
      timestamp: new Date().toISOString(),
    })
  );

  return NextResponse.json({
    success: true,
    message: 'Cancel requested. The run will stop at the next checkpoint.',
  });
}
