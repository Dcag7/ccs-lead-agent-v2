import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for lead update (all fields optional)
const leadUpdateSchema = z.object({
  email: z.string().email("Valid email is required").optional(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  status: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  source: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
});

// GET /api/leads/[id] - Get single lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        companyRel: true,
        contactRel: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead }, { status: 200 });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = leadUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Verify company exists if companyId provided
    if (updateData.companyId !== undefined && updateData.companyId !== null) {
      const company = await prisma.company.findUnique({
        where: { id: updateData.companyId },
      });
      
      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    }

    // Verify contact exists if contactId provided
    if (updateData.contactId !== undefined && updateData.contactId !== null) {
      const contact = await prisma.contact.findUnique({
        where: { id: updateData.contactId },
      });
      
      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }
    }

    // Update lead
    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        companyRel: true,
        contactRel: true,
      },
    });

    return NextResponse.json({ lead }, { status: 200 });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Archive lead (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting status to "archived"
    await prisma.lead.update({
      where: { id },
      data: { status: "archived" },
    });

    return NextResponse.json(
      { message: "Lead archived successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving lead:", error);
    return NextResponse.json(
      { error: "Failed to archive lead" },
      { status: 500 }
    );
  }
}
