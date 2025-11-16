
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for lead update
const updateLeadSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  status: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  source: z.string().optional(),
});

// GET /api/leads/[id] - Get a single lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: lead 
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = updateLeadSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // If email is being updated, check for conflicts
    if (data.email && data.email !== existingLead.email) {
      const emailConflict = await prisma.lead.findFirst({
        where: { 
          email: data.email,
          id: { not: params.id }
        },
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Another lead with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Update lead
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: lead,
      message: 'Lead updated successfully' 
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Soft delete (archive) a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to 'archived'
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        status: 'archived',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: lead,
      message: 'Lead archived successfully' 
    });
  } catch (error) {
    console.error('Error archiving lead:', error);
    return NextResponse.json(
      { error: 'Failed to archive lead' },
      { status: 500 }
    );
  }
}
