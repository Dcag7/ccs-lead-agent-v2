import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for company update
const companyUpdateSchema = z.object({
  name: z.string().min(1, "Company name is required").optional(),
  website: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
});

// GET /api/companies/[id] - Get single company by ID
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
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: { createdAt: "desc" },
        },
        leads: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            contacts: true,
            leads: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ company }, { status: 200 });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Update company
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
    const body = await request.json();
    
    // Validate request body
    const validationResult = companyUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Update company
    const company = await prisma.company.update({
      where: { id },
      data: validationResult.data,
    });

    return NextResponse.json({ company }, { status: 200 });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Delete company
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
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contacts: true,
            leads: true,
          },
        },
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Check if company has related records
    if (existingCompany._count.contacts > 0 || existingCompany._count.leads > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete company with related contacts or leads",
          details: {
            contacts: existingCompany._count.contacts,
            leads: existingCompany._count.leads,
          }
        },
        { status: 400 }
      );
    }

    // Delete company
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Company deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
