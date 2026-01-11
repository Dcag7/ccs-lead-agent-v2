/**
 * Phase 2B: Contacts + Leads Persistence
 * 
 * Idempotent persistence of Contacts and Leads from enrichment candidates.
 * Ensures no duplicates on re-run.
 */

import { prisma } from '@/lib/prisma';
import type { ContactCandidate } from './extractContactCandidates';
import type { ContactsLeadsSummary } from '../types';

/**
 * Persist contacts and leads from enrichment candidates
 * 
 * Idempotent: Re-running will not create duplicates.
 * 
 * @param companyId - Company ID
 * @param companyName - Company name (for Lead.company field)
 * @param companyCountry - Company country (for Lead.country field)
 * @param candidates - Contact candidates extracted from enrichment data
 * @returns Persistence summary
 */
export async function persistContactsAndLeads(
  companyId: string,
  companyName: string,
  companyCountry: string | null,
  candidates: ContactCandidate[]
): Promise<ContactsLeadsSummary> {
  const summary: ContactsLeadsSummary = {
    extractedCandidatesCount: candidates.length,
    contactsCreated: 0,
    contactsExisting: 0,
    contactsUpdated: 0,
    leadsCreated: 0,
    leadsExisting: 0,
  };

  if (candidates.length === 0) {
    return summary;
  }

  const timestamp = new Date().toISOString();

  // Process each candidate
  for (const candidate of candidates) {
    const normalizedEmail = normalizeEmail(candidate.email);

    // Find or create Contact
    let contact = await prisma.contact.findFirst({
      where: {
        companyId,
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (!contact) {
      // Create new Contact
      const discoveryMetadata = {
        source: 'enrichment',
        enrichmentSource: candidate.source,
        extractedAt: timestamp,
        rawEvidence: candidate.rawEvidence || null,
      };

      contact = await prisma.contact.create({
        data: {
          email: normalizedEmail,
          phone: candidate.phone || null,
          companyId,
          discoveryMetadata: discoveryMetadata as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      });

      summary.contactsCreated++;
    } else {
      // Contact exists - update phone if missing
      summary.contactsExisting++;

      if (!contact.phone && candidate.phone) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { phone: candidate.phone },
        });

        summary.contactsUpdated++;
      }
    }

    // Find or create Lead
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          { contactId: contact.id, email: normalizedEmail },
          { companyId, email: normalizedEmail },
        ],
      },
    });

    if (!existingLead) {
      // Create new Lead
      const discoveryMetadata = {
        source: 'enrichment',
        enrichmentSource: candidate.source,
        extractedAt: timestamp,
        contactSource: 'enrichment',
      };

      await prisma.lead.create({
        data: {
          email: normalizedEmail,
          phone: contact.phone || null,
          country: companyCountry || null,
          company: companyName, // Backward compatibility field
          status: 'new',
          score: 0,
          source: null, // Not a discovery channel type - store in discoveryMetadata
          companyId,
          contactId: contact.id,
          discoveryMetadata: discoveryMetadata as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      });

      summary.leadsCreated++;
    } else {
      // Lead exists - skip (do not update)
      summary.leadsExisting++;
    }
  }

  return summary;
}

/**
 * Normalize email address (lowercase, trim)
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
