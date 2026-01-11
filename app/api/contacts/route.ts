import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Validation schema for contact
const contactSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
});

// GET /api/contacts - List all contacts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search") || "";
    const companyId = searchParams.get("companyId") || "";

    // Build where clause
    const where: Prisma.ContactWhereInput = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (companyId) {
      where.companyId = companyId;
    }

    // Fetch contacts with related data
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        company: true,
        _count: {
          select: {
            leads: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({ contacts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = contactSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, role, companyId } = validationResult.data;

    // If companyId is provided, verify it exists
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        email,
        phone: phone || null,
        role: role || null,
        companyId: companyId || null,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
