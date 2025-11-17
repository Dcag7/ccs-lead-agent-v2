import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for company
const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
});

// GET /api/companies - List all companies
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
    const industry = searchParams.get("industry") || "";
    const country = searchParams.get("country") || "";

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (industry) {
      where.industry = industry;
    }
    
    if (country) {
      where.country = country;
    }

    // Fetch companies with related data
    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            contacts: true,
            leads: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({ companies }, { status: 200 });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create new company
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
    const validationResult = companySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, website, industry, country, size } = validationResult.data;

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        website: website || null,
        industry: industry || null,
        country: country || null,
        size: size || null,
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
