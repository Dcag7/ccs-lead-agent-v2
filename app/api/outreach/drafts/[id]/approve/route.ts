/**
 * POST /api/outreach/drafts/[id]/approve
 * 
 * Approve a draft (moves to approved queue)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    const { id } = await params;

    // Check if draft exists
    const draft = await prisma.outreachDraft.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            email: true,
            companyRel: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (draft.status === "sent") {
      return NextResponse.json({ error: "Draft is already sent" }, { status: 400 });
    }

    if (draft.status === "cancelled") {
      return NextResponse.json({ error: "Draft is cancelled" }, { status: 400 });
    }

    // Update to approved
    const approvedDraft = await prisma.outreachDraft.update({
      where: { id },
      data: {
        status: "approved",
        approvedByUserId: userId,
      },
      include: {
        playbook: {
          select: {
            id: true,
            name: true,
          },
        },
        lead: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ draft: approvedDraft });
  } catch (error) {
    console.error("Error approving draft:", error);
    return NextResponse.json({ error: "Failed to approve draft" }, { status: 500 });
  }
}
