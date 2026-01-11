/**
 * PATCH /api/leads/[id]/owner
 * 
 * Assign or unassign lead owner
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateOwnerSchema = z.object({
  assignedToId: z.string().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateOwnerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { assignedToId } = validationResult.data;

    // If assignedToId is provided, verify user exists
    if (assignedToId !== null) {
      const user = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Update lead owner
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { assignedToId },
      select: {
        id: true,
        assignedToId: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        lead: updatedLead,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating lead owner:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to update lead owner', details: errorMessage },
      { status: 500 }
    );
  }
}
