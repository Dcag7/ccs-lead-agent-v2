/**
 * Phase 5B: Draft Generation Service
 * 
 * Generates outreach drafts using deterministic template substitution
 */

import { PrismaClient } from "@prisma/client";

export interface VariableContext {
  contact?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  };
  company?: {
    name?: string | null;
    industry?: string | null;
    website?: string | null;
    country?: string | null;
    size?: string | null;
  };
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  eventContext?: string;
  exhibitorRole?: string;
  [key: string]: unknown;
}

export interface DraftGenerationResult {
  subject: string | null;
  body: string;
  missingFields: string[];
  warnings: string[];
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(
  template: string,
  context: VariableContext
): { result: string; missingFields: string[] } {
  const missingFields: string[] = [];
  let result = template;

  // Match {{variable.path}} patterns
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = Array.from(template.matchAll(variableRegex));

  for (const match of matches) {
    const fullMatch = match[0]; // e.g., "{{contact.firstName}}"
    const variablePath = match[1].trim(); // e.g., "contact.firstName"

    // Resolve nested path (e.g., "contact.firstName" -> context.contact?.firstName)
    const value = resolveVariablePath(variablePath, context);

    if (value === undefined || value === null || value === "") {
      missingFields.push(variablePath);
      // Leave placeholder if missing (user can edit)
      result = result.replace(fullMatch, `[MISSING: ${variablePath}]`);
    } else {
      result = result.replace(fullMatch, String(value));
    }
  }

  return { result, missingFields };
}

/**
 * Resolve a dot-notation path in the context object
 */
function resolveVariablePath(path: string, context: VariableContext): string | null | undefined {
  const parts = path.split(".");
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  if (typeof current === 'string' || current === null) {
    return current;
  }
  return undefined;
}

/**
 * Build variable context from Lead, Company, Contact, and User data
 */
export async function buildVariableContext(
  prisma: PrismaClient,
  leadId: string,
  userId: string,
  additionalContext?: Record<string, any>
): Promise<VariableContext> {
  // Fetch lead with relations
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      companyRel: true,
      contactRel: true,
    },
  });

  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  // Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
    },
  });

  const context: VariableContext = {
    contact: {
      firstName: lead.firstName || lead.contactRel?.firstName || null,
      lastName: lead.lastName || lead.contactRel?.lastName || null,
      email: lead.email || lead.contactRel?.email || null,
      phone: lead.phone || lead.contactRel?.phone || null,
      role: lead.contactRel?.role || null,
    },
    company: {
      name: lead.companyRel?.name || lead.company || null,
      industry: lead.companyRel?.industry || null,
      website: lead.companyRel?.website || null,
      country: lead.companyRel?.country || lead.country || null,
      size: lead.companyRel?.size || null,
    },
    user: {
      name: user?.name || null,
      email: user?.email || null,
      phone: null, // User phone not in schema yet
    },
  };

  // Merge additional context (e.g., eventContext, exhibitorRole)
  if (additionalContext) {
    Object.assign(context, additionalContext);
  }

  return context;
}

/**
 * Generate a draft from a playbook template
 */
export async function generateDraft(
  prisma: PrismaClient,
  leadId: string,
  playbookId: string,
  userId: string,
  additionalContext?: Record<string, unknown>
): Promise<DraftGenerationResult> {
  // Fetch playbook
  const playbook = await prisma.outreachPlaybook.findUnique({
    where: { id: playbookId },
  });

  if (!playbook) {
    throw new Error(`Playbook not found: ${playbookId}`);
  }

  if (!playbook.enabled) {
    throw new Error(`Playbook is disabled: ${playbookId}`);
  }

  // Build variable context
  const context = await buildVariableContext(prisma, leadId, userId, additionalContext);

  // Generate subject
  let subject: string | null = null;
  let subjectMissingFields: string[] = [];
  if (playbook.subjectTemplate) {
    const subjectResult = replaceVariables(playbook.subjectTemplate, context);
    subject = subjectResult.result;
    subjectMissingFields = subjectResult.missingFields;
  }

  // Generate body
  const bodyResult = replaceVariables(playbook.bodyTemplate, context);
  const body = bodyResult.result;
  const allMissingFields = [...new Set([...subjectMissingFields, ...bodyResult.missingFields])];

  // Generate warnings
  const warnings: string[] = [];
  if (allMissingFields.length > 0) {
    warnings.push(
      `Missing template variables: ${allMissingFields.join(", ")}. Please review and edit the draft.`
    );
  }

  // Check if email is suppressed (will be checked again before sending)
  const email = context.contact?.email;
  if (email) {
    const domain = email.split("@")[1];
    const isSuppressed = await prisma.suppressionEntry.findFirst({
      where: {
        OR: [
          { type: "email", value: email.toLowerCase() },
          { type: "domain", value: domain.toLowerCase() },
        ],
      },
    });

    if (isSuppressed) {
      warnings.push(`Recipient email or domain is in suppression list. Draft created but sending will be blocked.`);
    }
  }

  return {
    subject,
    body,
    missingFields: allMissingFields,
    warnings,
  };
}
