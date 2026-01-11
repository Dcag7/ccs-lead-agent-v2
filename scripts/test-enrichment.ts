/**
 * Test Enrichment Script
 * 
 * Manual test script to run enrichment on a single company by ID.
 * 
 * Usage:
 *   tsx scripts/test-enrichment.ts <companyId> [forceRefresh]
 * 
 * Example:
 *   tsx scripts/test-enrichment.ts clxxx123456 true
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
    console.error('Usage: tsx scripts/test-enrichment.ts <companyId> [forceRefresh]');
    console.error('Example: tsx scripts/test-enrichment.ts clxxx123456 true');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Phase 2: Enrichment Test Script');
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

    // Load existing enrichment data if any
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { enrichmentData: true },
    });

    if (existingCompany?.enrichmentData) {
      const existingData = existingCompany.enrichmentData as unknown as EnrichmentData;
      console.log('Existing Enrichment Data:');
      console.log(`  Version: ${existingData.version}`);
      console.log(`  Timestamp: ${existingData.timestamp}`);
      console.log(`  Sources: ${Object.keys(existingData.sources || {}).join(', ') || 'none'}`);
      console.log(`  Errors: ${existingData.errors?.length || 0}`);
      console.log('');
    }

    // Run enrichment
    console.log('Running enrichment...');
    console.log('');

    const runner = new CompanyEnrichmentRunner();
    const summary = await runner.enrichCompany(companyId, {
      forceRefresh,
    });

    // Fetch updated company
    const updatedCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!updatedCompany) {
      console.error('Error: Company not found after enrichment.');
      process.exit(1);
    }

    // Display results
    console.log('='.repeat(60));
    console.log('Enrichment Summary:');
    console.log('='.repeat(60));
    console.log(`  Status: ${summary.status}`);
    console.log(`  Sources Run: ${summary.sourcesRun.join(', ') || 'none'}`);
    console.log(`  Sources Succeeded: ${summary.sourcesSucceeded.join(', ') || 'none'}`);
    console.log(`  Sources Failed: ${summary.sourcesFailed.join(', ') || 'none'}`);
    console.log(`  Timestamp: ${summary.timestamp}`);
    console.log('');

    // Display enrichment data
    const enrichmentData = updatedCompany.enrichmentData as unknown as EnrichmentData | null;
    if (enrichmentData) {
      console.log('Enrichment Data:');
      console.log(`  Version: ${enrichmentData.version}`);
      console.log(`  Timestamp: ${enrichmentData.timestamp}`);
      console.log(`  Run ID: ${enrichmentData.metadata.enrichmentRunId}`);
      console.log(`  Force Refresh: ${enrichmentData.metadata.forceRefresh}`);
      if (enrichmentData.metadata.previousVersion) {
        console.log(`  Previous Version: ${enrichmentData.metadata.previousVersion}`);
      }
      console.log('');

      // Website enrichment result
      if (enrichmentData.sources.website) {
        const website = enrichmentData.sources.website;
        console.log('Website Enrichment:');
        console.log(`  URL: ${website.url}`);
        console.log(`  Success: ${website.success}`);
        if (website.data) {
          console.log(`  Title: ${website.data.title || '(not found)'}`);
          console.log(`  Description: ${website.data.description || '(not found)'}`);
          console.log(`  Accessible: ${website.data.accessible}`);
          console.log(`  Status Code: ${website.data.statusCode || 'N/A'}`);
        }
        if (website.error) {
          console.log(`  Error: ${website.error}`);
        }
        console.log('');
      }

      // Google CSE enrichment result
      if (enrichmentData.sources.googleCse) {
        const googleCse = enrichmentData.sources.googleCse;
        console.log('Google CSE Enrichment:');
        console.log(`  Query: ${googleCse.query}`);
        console.log(`  Success: ${googleCse.success}`);
        console.log(`  Configured: ${googleCse.configured}`);
        if (googleCse.data) {
          console.log(`  Primary URL: ${googleCse.data.primaryUrl || '(not found)'}`);
          console.log(`  Snippet: ${googleCse.data.snippet?.substring(0, 100) || '(not found)'}...`);
          console.log(`  Website Found: ${googleCse.data.websiteFound || false}`);
          console.log(`  Inferred Industry: ${googleCse.data.inferredIndustry || '(not found)'}`);
          console.log(`  Raw Results: ${googleCse.data.rawResults?.length || 0} items`);
        }
        if (googleCse.error) {
          console.log(`  Error: ${googleCse.error}`);
        }
        console.log('');
      }

      // Errors
      if (enrichmentData.errors && enrichmentData.errors.length > 0) {
        console.log('Errors:');
        enrichmentData.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. [${error.source}] ${error.error}`);
          console.log(`     Timestamp: ${error.timestamp}`);
        });
        console.log('');
      }
    }

    // Display updated status
    console.log('Updated Company Status:');
    console.log(`  Enrichment Status: ${updatedCompany.enrichmentStatus || 'never'}`);
    console.log(
      `  Last Run: ${updatedCompany.enrichmentLastRun?.toISOString() || 'never'}`
    );
    console.log('');

    console.log('='.repeat(60));
    console.log('Enrichment test completed successfully!');
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
