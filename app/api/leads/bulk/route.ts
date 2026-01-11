/**
 * PATCH /api/leads/bulk
 * 
 * Bulk update leads (status, owner assignment)
 * Max 100 leads per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  validateBulkUpdateRequest,
  validateBulkStatus,
  buildBulkUpdateData,
} from '@/lib/lead-management/bulk';

export async function PATCH(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const dryRun = body.dryRun === true;
    
    let validatedRequest;
    try {
      validatedRequest = validateBulkUpdateRequest(body);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error instanceof Error ? error.message : 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { leadIds, updates } = validatedRequest;

    // Validate status if provided
    try {
      validateBulkStatus(updates.status);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid status',
          details: error instanceof Error ? error.message : 'Invalid status value',
        },
        { status: 400 }
      );
    }

    // Validate assignedToId if provided (must be valid user ID or null)
    if (updates.assignedToId !== undefined && updates.assignedToId !== null) {
      const user = await prisma.user.findUnique({
        where: { id: updates.assignedToId },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found', details: `User ID ${updates.assignedToId} does not exist` },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData = buildBulkUpdateData(updates);

    // Dry-run mode: validate but don't write
    if (dryRun) {
      // Verify all leads exist (read-only check)
      const existingLeads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        select: { id: true },
      });

      const existingIds = new Set(existingLeads.map(l => l.id));
      const missingIds = leadIds.filter(id => !existingIds.has(id));
      const errors = missingIds.map(id => ({ leadId: id, error: 'Lead not found' }));

      return NextResponse.json(
        {
          success: true,
          updated: 0,
          total: leadIds.length,
          dryRun: true,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: 200 }
      );
    }

    // Perform bulk update in transaction
    // Track errors per lead ID
    const errors: Array<{ leadId: string; error: string }> = [];
    let updatedCount = 0;

    try {
      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Process each lead individually to track errors
        for (const leadId of leadIds) {
          try {
            // Verify lead exists
            const lead = await tx.lead.findUnique({
              where: { id: leadId },
              select: { id: true },
            });

            if (!lead) {
              errors.push({ leadId, error: 'Lead not found' });
              continue;
            }

            // Update lead
            await tx.lead.update({
              where: { id: leadId },
              data: updateData,
            });

            updatedCount++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ leadId, error: errorMessage });
          }
        }
      });
    } catch (error) {
      // Transaction-level error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          error: 'Bulk update failed',
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    // Return result
    return NextResponse.json(
      {
        success: true,
        updated: updatedCount,
        total: leadIds.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in bulk lead update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to process bulk update',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
