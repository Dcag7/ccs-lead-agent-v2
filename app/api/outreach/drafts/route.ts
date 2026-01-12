/**
 * GET /api/outreach/drafts
 * 
 * List drafts with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "draft" | "approved" | "sent" | "cancelled" | "failed"
    const leadId = searchParams.get("leadId");

    const where: { status?: string; leadId?: string } = {};
    if (status) {
      where.status = status;
    }
    if (leadId) {
      where.leadId = leadId;
    }

    const drafts = await prisma.outreachDraft.findMany({
      where,
      include: {
        playbook: {
          select: {
            id: true,
            name: true,
            audienceType: true,
          },
        },
        lead: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyRel: {
              select: {
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to 100 most recent
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }
}
