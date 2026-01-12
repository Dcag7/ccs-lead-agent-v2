/**
 * POST /api/outreach/send
 * 
 * Send an approved draft (with safety checks)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkSuppression, checkRateLimit, checkCooldown } from "@/lib/outreach/safety";

// Email sending will be implemented with a provider (SMTP/Resend/SendGrid)
// For MVP, we'll create a placeholder that can be extended
async function sendEmail(
  to: string,
  subject: string | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Check if sending is enabled
  const sendingEnabled = process.env.OUTREACH_SENDING_ENABLED === "true";
  if (!sendingEnabled) {
    return {
      success: false,
      error: "Email sending is disabled (OUTREACH_SENDING_ENABLED=false). This is a safety feature.",
    };
  }

  const provider = process.env.OUTREACH_EMAIL_PROVIDER || "smtp";

  // For MVP, we'll just log and return success if enabled
  // In production, integrate with actual email provider
  console.log(`[EMAIL SEND] To: ${to}, Subject: ${subject || "(no subject)"}, Provider: ${provider}`);

  // TODO: Implement actual email sending based on provider
  // For now, return a mock success
  return {
    success: true,
    messageId: `mock-${Date.now()}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    // Get user details for from address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { draftId } = body;

    if (!draftId || typeof draftId !== "string") {
      return NextResponse.json({ error: "draftId is required and must be a string" }, { status: 400 });
    }

    // Fetch draft
    const draft = await prisma.outreachDraft.findUnique({
      where: { id: draftId },
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

    // Safety checks
    if (draft.status !== "approved") {
      return NextResponse.json(
        { error: `Draft must be approved before sending. Current status: ${draft.status}` },
        { status: 400 }
      );
    }

    // Check suppression
    const suppressionCheck = await checkSuppression(
      prisma,
      draft.lead.email,
      draft.lead.companyRel?.name || null
    );

    if (suppressionCheck.isSuppressed) {
      // Update draft status to failed
      await prisma.outreachDraft.update({
        where: { id: draftId },
        data: { status: "failed" },
      });

      return NextResponse.json(
        {
          error: "Cannot send: recipient is suppressed",
          reason: suppressionCheck.reason,
          suppressionType: suppressionCheck.suppressionType,
        },
        { status: 400 }
      );
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(prisma, userId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          reason: rateLimitCheck.reason,
          limits: rateLimitCheck.limits,
        },
        { status: 429 }
      );
    }

    // Check cooldown
    const cooldownCheck = await checkCooldown(prisma, draft.leadId);
    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        {
          error: "Cooldown period not met",
          reason: cooldownCheck.reason,
          lastContact: cooldownCheck.lastContact,
        },
        { status: 400 }
      );
    }

    // Send email
    const sendResult = await sendEmail(
      draft.lead.email,
      draft.subject || null
    );

    if (!sendResult.success) {
      // Update draft status to failed
      await prisma.outreachDraft.update({
        where: { id: draftId },
        data: { status: "failed" },
      });

      // Log failure
      await prisma.outboundMessageLog.create({
        data: {
          leadId: draft.leadId,
          channel: draft.channel,
          to: draft.lead.email,
          subject: draft.subject || null,
          bodyPreview: draft.body.substring(0, 200),
          status: "failed",
          error: sendResult.error || "Unknown error",
        },
      });

      return NextResponse.json(
        {
          error: "Failed to send email",
          details: sendResult.error,
        },
        { status: 500 }
      );
    }

    // Update draft status to sent
    await prisma.outreachDraft.update({
      where: { id: draftId },
      data: { status: "sent" },
    });

    // Log successful send
    await prisma.outboundMessageLog.create({
      data: {
        leadId: draft.leadId,
        channel: draft.channel,
        providerMessageId: sendResult.messageId || null,
        to: draft.lead.email,
        subject: draft.subject || null,
        bodyPreview: draft.body.substring(0, 200),
        status: "sent",
      },
    });

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      draft: {
        id: draft.id,
        status: "sent",
      },
    });
  } catch (error) {
    console.error("Error sending draft:", error);
    return NextResponse.json(
      { error: "Failed to send draft", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
