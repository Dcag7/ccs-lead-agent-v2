/**
 * Build ScoreInput from database Lead record
 * 
 * Loads Lead + related Company + Contact from Prisma
 * and maps to ScoreInput format for scoring engine.
 */

import { prisma } from '@/lib/prisma';
import type { ScoreInput } from './types';

/**
 * Build ScoreInput from leadId
 * 
 * @param leadId - Lead ID to load
 * @returns ScoreInput ready for scoring engine
 * @throws Error if lead not found
 */
export async function buildScoreInput(leadId: string): Promise<ScoreInput> {
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

  // Map to ScoreInput format
  const scoreInput: ScoreInput = {
    lead: {
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      businessSource: lead.businessSource,
      status: lead.status,
      country: lead.country,
      discoveryMetadata: lead.discoveryMetadata,
    },
    company: lead.companyRel
      ? {
          name: lead.companyRel.name,
          website: lead.companyRel.website,
          country: lead.companyRel.country,
          size: lead.companyRel.size,
          enrichmentData: lead.companyRel.enrichmentData,
          discoveryMetadata: lead.companyRel.discoveryMetadata,
        }
      : null,
    contact: lead.contactRel
      ? {
          email: lead.contactRel.email,
          phone: lead.contactRel.phone,
          role: lead.contactRel.role,
          linkedInUrl: lead.contactRel.linkedInUrl,
          discoveryMetadata: lead.contactRel.discoveryMetadata,
        }
      : null,
  };

  return scoreInput;
}
