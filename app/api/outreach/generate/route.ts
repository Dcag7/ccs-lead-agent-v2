/**
 * POST /api/outreach/generate
 * 
 * Generate an outreach draft for a lead using a playbook
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDraft } from "@/lib/outreach/draft-generation";

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { leadId, playbookId, additionalContext } = body;

    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json({ error: "leadId is required and must be a string" }, { status: 400 });
    }

    if (!playbookId || typeof playbookId !== "string") {
      return NextResponse.json({ error: "playbookId is required and must be a string" }, { status: 400 });
    }

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Verify playbook exists and is enabled
    const playbook = await prisma.outreachPlaybook.findUnique({
      where: { id: playbookId },
      select: { id: true, enabled: true },
    });

    if (!playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    if (!playbook.enabled) {
      return NextResponse.json({ error: "Playbook is disabled" }, { status: 400 });
    }

    // Generate draft
    const draftResult = await generateDraft(prisma, leadId, playbookId, userId, additionalContext);

    // Create draft record
    const draft = await prisma.outreachDraft.create({
      data: {
        leadId,
        playbookId,
        channel: "email",
        subject: draftResult.subject,
        body: draftResult.body,
        status: "draft",
        metadataJson: {
          missingFields: draftResult.missingFields,
          warnings: draftResult.warnings,
          additionalContext: additionalContext || null,
        },
        createdByUserId: userId,
      },
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
          },
        },
      },
    });

    return NextResponse.json({
      draft: {
        id: draft.id,
        leadId: draft.leadId,
        playbookId: draft.playbookId,
        playbook: draft.playbook,
        channel: draft.channel,
        subject: draft.subject,
        body: draft.body,
        status: draft.status,
        metadata: draft.metadataJson,
        createdAt: draft.createdAt,
      },
      warnings: draftResult.warnings,
      missingFields: draftResult.missingFields,
    });
  } catch (error) {
    console.error("Error generating draft:", error);
    return NextResponse.json(
      { error: "Failed to generate draft", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
