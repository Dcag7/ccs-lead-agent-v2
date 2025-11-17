import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for contact update
const contactUpdateSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
});

// GET /api/contacts/[id] - Get single contact by ID
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
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        leads: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contact }, { status: 200 });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update contact
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
    const validationResult = contactUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // If companyId is provided, verify it exists
    if (validationResult.data.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: validationResult.data.companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: { id },
      data: validationResult.data,
      include: {
        company: true,
      },
    });

    return NextResponse.json({ contact }, { status: 200 });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete contact
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
    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Check if contact has related leads
    if (existingContact._count.leads > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete contact with related leads",
          details: {
            leads: existingContact._count.leads,
          }
        },
        { status: 400 }
      );
    }

    // Delete contact
    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Contact deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
