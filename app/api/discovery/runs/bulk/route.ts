/**
 * API: Bulk actions on discovery runs
 * PATCH /api/discovery/runs/bulk
 * 
 * Supports: archive, unarchive, delete
 * Delete only allowed for archived runs (safety check)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role?.toLowerCase();
  if (userRole !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  const userId = (session.user as { id?: string }).id;

  try {
    const body = await request.json();
    const { action, runIds } = body;

    if (!action || !Array.isArray(runIds) || runIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: action and runIds array required' },
        { status: 400 }
      );
    }

    if (!['archive', 'unarchive', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be: archive, unarchive, or delete' },
        { status: 400 }
      );
    }

    // Verify all runs exist
    const runs = await prisma.discoveryRun.findMany({
      where: { id: { in: runIds } },
      select: { id: true, archivedAt: true },
    });

    if (runs.length !== runIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some runs not found' },
        { status: 404 }
      );
    }

    // Safety check: delete only allowed for archived runs
    if (action === 'delete') {
      const notArchived = runs.filter(r => !r.archivedAt);
      if (notArchived.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Delete only allowed for archived runs' },
          { status: 400 }
        );
      }
    }

    // Perform bulk action
    if (action === 'archive') {
      await prisma.discoveryRun.updateMany({
        where: {
          id: { in: runIds },
          archivedAt: null, // Only archive if not already archived
        },
        data: {
          archivedAt: new Date(),
          archivedById: userId || null,
        },
      });
    } else if (action === 'unarchive') {
      await prisma.discoveryRun.updateMany({
        where: {
          id: { in: runIds },
          archivedAt: { not: null }, // Only unarchive if archived
        },
        data: {
          archivedAt: null,
          archivedById: null,
        },
      });
    } else if (action === 'delete') {
      await prisma.discoveryRun.deleteMany({
        where: {
          id: { in: runIds },
          archivedAt: { not: null }, // Double-check: only delete archived
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${runs.length} run(s)`,
      count: runs.length,
    });
  } catch (error) {
    console.error('Bulk action failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
