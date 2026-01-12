/**
 * GET /api/outreach/drafts/[id] - Get draft
 * PUT /api/outreach/drafts/[id] - Update draft (edit subject/body)
 * DELETE /api/outreach/drafts/[id] - Cancel/delete draft
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const draft = await prisma.outreachDraft.findUnique({
      where: { id },
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
                id: true,
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
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { subject, body: bodyText } = body;

    // Validate
    if (bodyText === undefined || bodyText === null) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }

    if (typeof bodyText !== "string" || bodyText.trim().length === 0) {
      return NextResponse.json({ error: "body must be a non-empty string" }, { status: 400 });
    }

    // Check if draft exists and is editable
    const existingDraft = await prisma.outreachDraft.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existingDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existingDraft.status === "sent") {
      return NextResponse.json({ error: "Cannot edit a sent draft" }, { status: 400 });
    }

    // Update draft
    const draft = await prisma.outreachDraft.update({
      where: { id },
      data: {
        subject: subject !== undefined ? (subject === null || subject === "" ? null : subject) : undefined,
        body: bodyText,
        // Reset to draft if it was approved (user is editing)
        status: existingDraft.status === "approved" ? "draft" : existingDraft.status,
      },
      include: {
        playbook: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if draft exists
    const existingDraft = await prisma.outreachDraft.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existingDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existingDraft.status === "sent") {
      return NextResponse.json({ error: "Cannot delete a sent draft" }, { status: 400 });
    }

    // Delete or mark as cancelled
    await prisma.outreachDraft.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
