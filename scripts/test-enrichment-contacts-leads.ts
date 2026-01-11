/**
 * Test Enrichment Contacts + Leads Script
 * Phase 2B: Contacts + Leads Extraction
 * 
 * Tests Phase 2B extraction and persistence after enrichment.
 * 
 * Usage:
 *   tsx scripts/test-enrichment-contacts-leads.ts <companyId> [forceRefresh]
 * 
 * Example:
 *   tsx scripts/test-enrichment-contacts-leads.ts clxxx123456 true
 */

import { CompanyEnrichmentRunner } from '../lib/enrichment/CompanyEnrichmentRunner';
import { prisma } from '../lib/prisma';
import type { EnrichmentData } from '../lib/enrichment/types';

async function main() {
  // Get company ID from command line arguments
  const companyId = process.argv[2];
  const forceRefresh = process.argv[3] === 'true' || process.argv[3] === '1';

  if (!companyId) {
    console.error('Error: Company ID is required.');
    console.error('Usage: tsx scripts/test-enrichment-contacts-leads.ts <companyId> [forceRefresh]');
    console.error('Example: tsx scripts/test-enrichment-contacts-leads.ts clxxx123456 true');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Phase 2B: Contacts + Leads Extraction Test');
  console.log('='.repeat(60));
  console.log(`Company ID: ${companyId}`);
  console.log(`Force Refresh: ${forceRefresh}`);
  console.log('');

  try {
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        website: true,
        country: true,
        enrichmentStatus: true,
        enrichmentLastRun: true,
        enrichmentData: true,
      },
    });

    if (!company) {
      console.error(`Error: Company not found with ID: ${companyId}`);
      process.exit(1);
    }

    console.log('Company Information:');
    console.log(`  Name: ${company.name}`);
    console.log(`  Website: ${company.website || '(not set)'}`);
    console.log(`  Country: ${company.country || '(not set)'}`);
    console.log(`  Current Enrichment Status: ${company.enrichmentStatus || 'never'}`);
    console.log(
      `  Last Enrichment Run: ${company.enrichmentLastRun?.toISOString() || 'never'}`
    );
    console.log('');

    // Check existing contacts and leads
    const existingContacts = await prisma.contact.count({
      where: { companyId },
    });
    const existingLeads = await prisma.lead.count({
      where: { companyId },
    });

    console.log('Existing Records:');
    console.log(`  Contacts: ${existingContacts}`);
    console.log(`  Leads: ${existingLeads}`);
    console.log('');

    // Run enrichment (includes Phase 2B)
    console.log('Running enrichment (Phase 2A + Phase 2B)...');
    console.log('');

    const runner = new CompanyEnrichmentRunner();
    const summary = await runner.enrichCompany(companyId, {
      forceRefresh,
    });

    // Display Phase 2A summary
    console.log('='.repeat(60));
    console.log('Phase 2A: Enrichment Summary');
    console.log('='.repeat(60));
    console.log(`  Status: ${summary.status}`);
    console.log(`  Sources Run: ${summary.sourcesRun.join(', ') || 'none'}`);
    console.log(`  Sources Succeeded: ${summary.sourcesSucceeded.join(', ') || 'none'}`);
    console.log(`  Sources Failed: ${summary.sourcesFailed.join(', ') || 'none'}`);
    console.log(`  Timestamp: ${summary.timestamp}`);
    console.log('');

    // Display Phase 2B summary
    if (summary.contactsLeadsSummary) {
      const contactsLeads = summary.contactsLeadsSummary;
      console.log('='.repeat(60));
      console.log('Phase 2B: Contacts + Leads Summary');
      console.log('='.repeat(60));
      console.log(`  Extracted Candidates: ${contactsLeads.extractedCandidatesCount}`);
      console.log(`  Contacts Created: ${contactsLeads.contactsCreated}`);
      console.log(`  Contacts Existing: ${contactsLeads.contactsExisting}`);
      console.log(`  Contacts Updated: ${contactsLeads.contactsUpdated}`);
      console.log(`  Leads Created: ${contactsLeads.leadsCreated}`);
      console.log(`  Leads Existing: ${contactsLeads.leadsExisting}`);
      console.log('');
    } else {
      console.log('='.repeat(60));
      console.log('Phase 2B: Contacts + Leads Summary');
      console.log('='.repeat(60));
      console.log('  No contacts/leads summary available');
      console.log('');
    }

    // Fetch updated counts
    const updatedContacts = await prisma.contact.count({
      where: { companyId },
    });
    const updatedLeads = await prisma.lead.count({
      where: { companyId },
    });

    console.log('='.repeat(60));
    console.log('Updated Records');
    console.log('='.repeat(60));
    console.log(`  Contacts: ${updatedContacts} (was ${existingContacts})`);
    console.log(`  Leads: ${updatedLeads} (was ${existingLeads})`);
    console.log('');

    // Display contacts
    const contacts = await prisma.contact.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (contacts.length > 0) {
      console.log('='.repeat(60));
      console.log(`Recent Contacts (showing ${contacts.length} of ${updatedContacts})`);
      console.log('='.repeat(60));
      contacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.email || '(no email)'}`);
        if (contact.phone) {
          console.log(`   Phone: ${contact.phone}`);
        }
        console.log(`   ID: ${contact.id}`);
        console.log(`   Created: ${contact.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Display leads
    const leads = await prisma.lead.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (leads.length > 0) {
      console.log('='.repeat(60));
      console.log(`Recent Leads (showing ${leads.length} of ${updatedLeads})`);
      console.log('='.repeat(60));
      leads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.email}`);
        console.log(`   Status: ${lead.status}`);
        console.log(`   Contact ID: ${lead.contactId || '(none)'}`);
        console.log(`   ID: ${lead.id}`);
        console.log(`   Created: ${lead.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Display enrichment data structure
    const updatedCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { enrichmentData: true },
    });

    if (updatedCompany?.enrichmentData) {
      const enrichmentData = updatedCompany.enrichmentData as unknown as EnrichmentData;
      console.log('='.repeat(60));
      console.log('Enrichment Data Structure');
      console.log('='.repeat(60));
      console.log(`  Version: ${enrichmentData.version}`);
      console.log(`  Timestamp: ${enrichmentData.timestamp}`);
      console.log(`  Sources: ${Object.keys(enrichmentData.sources || {}).join(', ') || 'none'}`);
      if (enrichmentData.sources?.website) {
        console.log(`  Website: ${enrichmentData.sources.website.success ? 'success' : 'failed'}`);
      }
      if (enrichmentData.sources?.googleCse) {
        console.log(
          `  Google CSE: ${enrichmentData.sources.googleCse.success ? 'success' : 'failed'}`
        );
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('Test completed successfully!');
    console.log('='.repeat(60));
  } catch (error: unknown) {
    console.error('');
    console.error('Error during enrichment:');
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
