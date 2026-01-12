/**
 * Phase 5B: Safety Guardrails
 * 
 * Suppression checks, rate limiting, and opt-out handling
 */

import { PrismaClient } from "@prisma/client";

export interface SuppressionCheckResult {
  isSuppressed: boolean;
  reason?: string;
  suppressionType?: "email" | "domain" | "company";
}

/**
 * Check if an email/domain/company is suppressed
 */
export async function checkSuppression(
  prisma: PrismaClient,
  email: string,
  companyName?: string | null
): Promise<SuppressionCheckResult> {
  const emailLower = email.toLowerCase();
  const domain = emailLower.split("@")[1];

  // Check email
  const emailSuppression = await prisma.suppressionEntry.findFirst({
    where: {
      type: "email",
      value: emailLower,
    },
  });

  if (emailSuppression) {
    return {
      isSuppressed: true,
      reason: emailSuppression.reason || "Email is in suppression list",
      suppressionType: "email",
    };
  }

  // Check domain
  const domainSuppression = await prisma.suppressionEntry.findFirst({
    where: {
      type: "domain",
      value: domain,
    },
  });

  if (domainSuppression) {
    return {
      isSuppressed: true,
      reason: domainSuppression.reason || "Domain is in suppression list",
      suppressionType: "domain",
    };
  }

  // Check company (if provided)
  if (companyName) {
    const companyLower = companyName.toLowerCase().trim();
    const companySuppression = await prisma.suppressionEntry.findFirst({
      where: {
        type: "company",
        value: companyLower,
      },
    });

    if (companySuppression) {
      return {
        isSuppressed: true,
        reason: companySuppression.reason || "Company is in suppression list",
        suppressionType: "company",
      };
    }
  }

  return { isSuppressed: false };
}

/**
 * Add an entry to the suppression list
 */
export async function addSuppression(
  prisma: PrismaClient,
  type: "email" | "domain" | "company",
  value: string,
  reason?: string
): Promise<void> {
  const normalizedValue = value.toLowerCase().trim();

  await prisma.suppressionEntry.upsert({
    where: {
      type_value: {
        type,
        value: normalizedValue,
      },
    },
    update: {
      reason: reason || null,
    },
    create: {
      type,
      value: normalizedValue,
      reason: reason || null,
    },
  });
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxPerDay: number;
  maxPerHour: number;
  maxPerMinute: number;
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxPerDay: parseInt(process.env.OUTREACH_RATE_LIMIT_DAY || "20", 10),
  maxPerHour: parseInt(process.env.OUTREACH_RATE_LIMIT_HOUR || "5", 10),
  maxPerMinute: parseInt(process.env.OUTREACH_RATE_LIMIT_MINUTE || "2", 10),
};

/**
 * Check if sending would exceed rate limits
 */
export async function checkRateLimit(
  prisma: PrismaClient,
  userId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): Promise<{ allowed: boolean; reason?: string; limits: { day: number; hour: number; minute: number } }> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const minuteAgo = new Date(now.getTime() - 60 * 1000);

  // Count messages sent by this user in each time window
  const [dayCount, hourCount, minuteCount] = await Promise.all([
    prisma.outboundMessageLog.count({
      where: {
        createdAt: { gte: dayAgo },
        // Note: We don't have userId in OutboundMessageLog yet
        // For now, we'll count all messages (global rate limit)
        // TODO: Add userId to OutboundMessageLog or track per user differently
      },
    }),
    prisma.outboundMessageLog.count({
      where: {
        createdAt: { gte: hourAgo },
      },
    }),
    prisma.outboundMessageLog.count({
      where: {
        createdAt: { gte: minuteAgo },
      },
    }),
  ]);

  const limits = {
    day: dayCount,
    hour: hourCount,
    minute: minuteCount,
  };

  if (dayCount >= config.maxPerDay) {
    return {
      allowed: false,
      reason: `Daily rate limit exceeded (${dayCount}/${config.maxPerDay})`,
      limits,
    };
  }

  if (hourCount >= config.maxPerHour) {
    return {
      allowed: false,
      reason: `Hourly rate limit exceeded (${hourCount}/${config.maxPerHour})`,
      limits,
    };
  }

  if (minuteCount >= config.maxPerMinute) {
    return {
      allowed: false,
      reason: `Per-minute rate limit exceeded (${minuteCount}/${config.maxPerMinute})`,
      limits,
    };
  }

  return { allowed: true, limits };
}

/**
 * Check if lead has been contacted recently (cooldown period)
 */
export async function checkCooldown(
  prisma: PrismaClient,
  leadId: string,
  cooldownDays: number = 7
): Promise<{ allowed: boolean; lastContact?: Date; reason?: string }> {
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

  const lastMessage = await prisma.outboundMessageLog.findFirst({
    where: {
      leadId,
      status: "sent",
      createdAt: { gte: cooldownDate },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (lastMessage) {
    return {
      allowed: false,
      lastContact: lastMessage.createdAt,
      reason: `Lead was contacted ${Math.ceil(
        (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )} days ago. Cooldown period is ${cooldownDays} days.`,
    };
  }

  return { allowed: true };
}
