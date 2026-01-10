/**
 * Phase 1 Discovery - Persistence Layer
 * 
 * Writes discovery results to Company, Contact, and Lead records.
 * Performs basic existence checks (exact match only).
 * Links records correctly and attaches discovery metadata.
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 */

import { prisma } from '../prisma';
import type {
  DiscoveryResult,
  DiscoveryCompanyResult,
  DiscoveryContactResult,
  DiscoveryLeadResult,
  DiscoveryChannelType,
} from './types';

/**
 * Persistence Result
 */
export interface PersistenceResult {
  /** Companies created */
  companiesCreated: number;
  
  /** Companies skipped (already existed) */
  companiesSkipped: number;
  
  /** Contacts created */
  contactsCreated: number;
  
  /** Contacts skipped (already existed) */
  contactsSkipped: number;
  
  /** Leads created */
  leadsCreated: number;
  
  /** Leads skipped (already existed) */
  leadsSkipped: number;
  
  /** Errors encountered */
  errors: Array<{
    resultType: string;
    error: string;
  }>;
  
  /** Whether persistence completed successfully */
  success: boolean;
}

/**
 * Persist discovery results to database
 * 
 * Writes DiscoveryResult objects to Company, Contact, and Lead records.
 * Performs exact match existence checks before creating records.
 * Links records correctly (Contact->Company, Lead->Company/Contact).
 * Attaches discovery metadata to records.
 * 
 * @param results - Discovery results to persist
 * @returns Persistence result with counts and errors
 */
export async function persistDiscoveryResults(
  results: DiscoveryResult[]
): Promise<PersistenceResult> {
  const persistenceResult: PersistenceResult = {
    companiesCreated: 0,
    companiesSkipped: 0,
    contactsCreated: 0,
    contactsSkipped: 0,
    leadsCreated: 0,
    leadsSkipped: 0,
    errors: [],
    success: true,
  };

  // Track created IDs for linking
  const companyIdMap = new Map<string, string>(); // website/name -> id
  const contactIdMap = new Map<string, string>(); // email -> id

  try {
    // Process results: first companies, then contacts, then leads
    // This ensures we can link contacts to companies and leads to both
    
    for (const result of results) {
      try {
        if (result.type === 'company') {
          await processCompanyResult(result, persistenceResult, companyIdMap);
        } else if (result.type === 'contact') {
          await processContactResult(result, persistenceResult, contactIdMap, companyIdMap);
        } else if (result.type === 'lead') {
          await processLeadResult(result, persistenceResult, companyIdMap, contactIdMap);
        }
      } catch (error: any) {
        persistenceResult.errors.push({
          resultType: result.type,
          error: error.message || 'Unknown error',
        });
        persistenceResult.success = false;
      }
    }
  } catch (error: any) {
    persistenceResult.errors.push({
      resultType: 'general',
      error: error.message || 'Unknown error during persistence',
    });
    persistenceResult.success = false;
  }

  return persistenceResult;
}

/**
 * Process and persist a company discovery result
 */
async function processCompanyResult(
  result: DiscoveryCompanyResult,
  persistenceResult: PersistenceResult,
  companyIdMap: Map<string, string>
): Promise<void> {
  // Check if company exists (exact match by website or name)
  let existingCompany = null;
  
  if (result.website) {
    existingCompany = await prisma.company.findFirst({
      where: {
        website: result.website,
      },
    });
  }
  
  // Fallback: check by name if no website match
  if (!existingCompany) {
    existingCompany = await prisma.company.findFirst({
      where: {
        name: {
          equals: result.name,
          mode: 'insensitive',
        },
      },
    });
  }

  if (existingCompany) {
    // Company exists - skip creation but track ID for linking
    const key = result.website || result.name.toLowerCase();
    companyIdMap.set(key, existingCompany.id);
    persistenceResult.companiesSkipped++;
    return;
  }

  // Prepare discovery metadata to store in dedicated discoveryMetadata field
  const discoveryData = {
    discoverySource: result.discoveryMetadata.discoverySource,
    discoveryTimestamp: result.discoveryMetadata.discoveryTimestamp.toISOString(),
    discoveryMethod: result.discoveryMetadata.discoveryMethod || null,
    ...(result.discoveryMetadata.additionalMetadata || {}),
  };

  // Create new company record
  const companyData: any = {
    name: result.name,
    website: result.website || null,
    industry: result.industry || null,
    country: result.country || null,
    // Store discovery metadata in dedicated discoveryMetadata field
    discoveryMetadata: discoveryData,
  };

  const createdCompany = await prisma.company.create({
    data: companyData,
  });

  // Track created company ID
  const key = result.website || result.name.toLowerCase();
  companyIdMap.set(key, createdCompany.id);
  persistenceResult.companiesCreated++;
}

/**
 * Process and persist a contact discovery result
 */
async function processContactResult(
  result: DiscoveryContactResult,
  persistenceResult: PersistenceResult,
  contactIdMap: Map<string, string>,
  companyIdMap: Map<string, string>
): Promise<void> {
  // Contact email is optional - check existence using multiple strategies
  // Dedup logic: email match OR linkedInUrl match OR (name + companyId) match
  let existingContact = null;
  
  // Step 1: Check by email if present (exact match)
  if (result.email) {
    existingContact = await prisma.contact.findFirst({
      where: {
        email: result.email,
      },
    });
  }
  
  // Step 2: Check by LinkedIn URL if no email match and LinkedIn URL present (exact match)
  if (!existingContact && result.linkedInUrl) {
    existingContact = await prisma.contact.findFirst({
      where: {
        linkedInUrl: result.linkedInUrl,
      },
    });
  }
  
  // Step 3: Check by (name + companyId) if no email/LinkedIn match (exact match)
  if (!existingContact && result.name) {
    // Find company ID first
    let companyIdForDedup: string | null = null;
    if (result.companyName) {
      const company = await prisma.company.findFirst({
        where: {
          name: {
            equals: result.companyName,
            mode: 'insensitive',
          },
        },
      });
      if (company) {
        companyIdForDedup = company.id;
      } else {
        companyIdForDedup = companyIdMap.get(result.companyName.toLowerCase()) || null;
      }
    }
    
    // Check by name + companyId (exact match on name and companyId)
    if (companyIdForDedup) {
      // Try to match by parsed name parts first
      const nameToMatch = result.name.trim();
      existingContact = await prisma.contact.findFirst({
        where: {
          AND: [
            { companyId: companyIdForDedup },
            {
              OR: [
                // Match by full name if stored as firstName + lastName
                {
                  AND: [
                    { firstName: { equals: nameToMatch.split(' ')[0] || null, mode: 'insensitive' } },
                    { lastName: { equals: nameToMatch.split(' ').slice(1).join(' ') || null, mode: 'insensitive' } },
                  ],
                },
                // Match by firstName if name starts with it
                { firstName: { equals: nameToMatch.split(' ')[0] || null, mode: 'insensitive' } },
              ],
            },
          ],
        },
      });
    }
  }

  if (existingContact) {
    // Contact exists - skip creation but track ID for linking
    const key = result.email?.toLowerCase() || result.linkedInUrl || `${result.name}-${result.companyName || ''}`;
    contactIdMap.set(key, existingContact.id);
    persistenceResult.contactsSkipped++;
    return;
  }

  // Find company ID if company name is provided
  let companyId: string | null = null;
  if (result.companyName) {
    // Try to find company by name (case-insensitive)
    const company = await prisma.company.findFirst({
      where: {
        name: {
          equals: result.companyName,
          mode: 'insensitive',
        },
      },
    });
    if (company) {
      companyId = company.id;
    } else {
      // Check if company was created earlier in this batch
      companyId = companyIdMap.get(result.companyName.toLowerCase()) || null;
    }
  }

  // Parse name into firstName/lastName
  let firstName: string | null = null;
  let lastName: string | null = null;
  
  if (result.firstName && result.lastName) {
    firstName = result.firstName;
    lastName = result.lastName;
  } else if (result.name) {
    // Best effort parsing
    const nameParts = result.name.trim().split(/\s+/);
    firstName = nameParts[0] || null;
    lastName = nameParts.slice(1).join(' ') || null;
  }

  // Prepare discovery metadata
  const discoveryData = {
    discoverySource: result.discoveryMetadata.discoverySource,
    discoveryTimestamp: result.discoveryMetadata.discoveryTimestamp.toISOString(),
    discoveryMethod: result.discoveryMetadata.discoveryMethod || null,
    ...(result.discoveryMetadata.additionalMetadata || {}),
  };

  // Create new contact record
  // Note: Contact email is now optional (schema updated)
  const contactData: any = {
    email: result.email || null,
    firstName: firstName || null,
    lastName: lastName || null,
    phone: result.phone || null,
    role: result.role || null,
    companyId: companyId,
    linkedInUrl: result.linkedInUrl || null,
    // Store discovery metadata in dedicated discoveryMetadata field
    discoveryMetadata: discoveryData,
  };

  const createdContact = await prisma.contact.create({
    data: contactData,
  });

  // Track created contact ID
  const key = result.email?.toLowerCase() || result.linkedInUrl || `${result.name}-${result.companyName || ''}`;
  contactIdMap.set(key, createdContact.id);
  persistenceResult.contactsCreated++;
}

/**
 * Process and persist a lead discovery result
 */
async function processLeadResult(
  result: DiscoveryLeadResult,
  persistenceResult: PersistenceResult,
  companyIdMap: Map<string, string>,
  contactIdMap: Map<string, string>
): Promise<void> {
  // Lead requires email (required field in schema)
  // Try to get email from contact first, then from company contact channels
  let email: string | null = null;
  
  if (result.contact?.email) {
    email = result.contact.email;
  } else if (result.company?.contactChannels?.emails && result.company.contactChannels.emails.length > 0) {
    // Fallback: use first email from company contact channels
    email = result.company.contactChannels.emails[0];
  }
  
  if (!email) {
    // Cannot create lead without email (required field)
    persistenceResult.errors.push({
      resultType: 'lead',
      error: 'Lead skipped: email is required (from contact or company contact channels)',
    });
    return;
  }

  // Check if lead exists (exact match by email)
  const existingLead = await prisma.lead.findFirst({
    where: {
      email: email,
    },
  });

  if (existingLead) {
    persistenceResult.leadsSkipped++;
    return;
  }

  // Find company ID if company is provided
  let companyId: string | null = null;
  if (result.company) {
    const website = result.company.website;
    const companyName = result.company.name;
    
    if (website) {
      // Try to find by website first
      const company = await prisma.company.findFirst({
        where: { website },
      });
      if (company) {
        companyId = company.id;
      } else {
        companyId = companyIdMap.get(website) || null;
      }
    }
    
    // Fallback: find by name
    if (!companyId && companyName) {
      const company = await prisma.company.findFirst({
        where: {
          name: {
            equals: companyName,
            mode: 'insensitive',
          },
        },
      });
      if (company) {
        companyId = company.id;
      } else {
        companyId = companyIdMap.get(companyName.toLowerCase()) || null;
      }
    }
  }

  // Find contact ID if contact is provided
  let contactId: string | null = null;
  if (result.contact?.email) {
    const contact = await prisma.contact.findFirst({
      where: { email: result.contact.email },
    });
    if (contact) {
      contactId = contact.id;
    } else {
      contactId = contactIdMap.get(result.contact.email.toLowerCase()) || null;
    }
  }

  // Parse name from contact or use company name
  let firstName: string | null = null;
  let lastName: string | null = null;
  let companyName: string | null = null;

  if (result.contact) {
    if (result.contact.firstName && result.contact.lastName) {
      firstName = result.contact.firstName;
      lastName = result.contact.lastName;
    } else if (result.contact.name) {
      const nameParts = result.contact.name.trim().split(/\s+/);
      firstName = nameParts[0] || null;
      lastName = nameParts.slice(1).join(' ') || null;
    }
  }

  if (result.company) {
    companyName = result.company.name;
  }

  // Prepare discovery metadata
  const discoveryData = {
    discoverySource: result.source,
    discoveryTimestamp: result.discoveryTimestamp.toISOString(),
    discoveryMethod: result.additionalMetadata?.discoveryMethod || null,
    ...(result.additionalMetadata || {}),
  };

  // Set lead source only if it's a valid discovery channel type
  // Valid discovery channel types: 'google', 'keyword', 'linkedin', 'social'
  // Do not overload source field beyond discovery channel types
  let leadSource: string | null = null;
  if (result.source && ['google', 'keyword', 'linkedin', 'social'].includes(result.source)) {
    leadSource = result.source;
  }

  // Create new lead record
  const leadData: any = {
    email: email,
    firstName: firstName || null,
    lastName: lastName || null,
    company: companyName || null, // Legacy field for backward compatibility
    phone: result.contact?.phone || result.company?.contactChannels?.phones?.[0] || null,
    country: result.company?.country || null,
    status: 'new',
    // Only set source if it's a discovery channel type and not already set
    // Note: We cannot check existing source here since we're creating new record
    // Source will only be set if it's a valid discovery channel type
    source: leadSource || null,
    companyId: companyId,
    contactId: contactId,
    // Store discovery metadata in dedicated discoveryMetadata field
    discoveryMetadata: discoveryData,
  };

  await prisma.lead.create({
    data: leadData,
  });

  persistenceResult.leadsCreated++;
}
