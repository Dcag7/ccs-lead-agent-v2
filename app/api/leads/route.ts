import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for lead
const leadSchema = z.object({
  email: z.string().email("Valid email is required"),
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

// GET /api/leads - List all leads
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
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const companyId = searchParams.get("companyId") || "";
    const includeArchived = searchParams.get("includeArchived") === "true";

    // Build where clause
    const where: any = {};
    
    // Exclude archived leads by default
    if (!includeArchived) {
      where.status = { not: "archived" };
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (source) {
      where.source = { contains: source, mode: "insensitive" };
    }
    
    if (minScore !== null && minScore !== undefined) {
      where.score = { ...where.score, gte: parseInt(minScore) };
    }
    
    if (maxScore !== null && maxScore !== undefined) {
      where.score = { ...where.score, lte: parseInt(maxScore) };
    }
    
    if (companyId) {
      where.companyId = companyId;
    }

    // Fetch leads with related data
    const leads = await prisma.lead.findMany({
      where,
      include: {
        companyRel: true,
        contactRel: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create new lead
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
    const validationResult = leadSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      country, 
      status, 
      score, 
      source, 
      companyId, 
      contactId 
    } = validationResult.data;

    // Verify company exists if companyId provided
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

    // Verify contact exists if contactId provided
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      
      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        country: country || null,
        status: status || "new",
        score: score !== undefined ? score : 0,
        source: source || null,
        companyId: companyId || null,
        contactId: contactId || null,
      },
      include: {
        companyRel: true,
        contactRel: true,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
