/**
 * Bulk Company Enrichment Script
 * Phase 2: Enrichment MVP
 * 
 * Enriches multiple companies in batch with basic throttling and idempotency.
 * 
 * Usage:
 *   tsx scripts/bulk-enrich-companies.ts [options]
 * 
 * Options:
 *   --limit <n>          Maximum number of companies to enrich (default: 25)
 *   --forceRefresh       Force refresh even if already enriched (default: false)
 *   --delayMs <ms>       Delay between companies in milliseconds (default: 500)
 *   --onlyMissing        Only enrich companies that haven't been successfully enriched (default: true)
 * 
 * Examples:
 *   # Enrich up to 25 companies that haven't been enriched yet
 *   tsx scripts/bulk-enrich-companies.ts
 * 
 *   # Enrich up to 50 companies with 1 second delay
 *   tsx scripts/bulk-enrich-companies.ts --limit 50 --delayMs 1000
 * 
 *   # Force refresh 10 companies (even if already enriched)
 *   tsx scripts/bulk-enrich-companies.ts --limit 10 --forceRefresh --onlyMissing false
 * 
 *   # Enrich all companies that need enrichment
 *   tsx scripts/bulk-enrich-companies.ts --limit 1000 --onlyMissing true
 */

import { CompanyEnrichmentRunner } from '../lib/enrichment/CompanyEnrichmentRunner';
import { prisma } from '../lib/prisma';

interface ScriptOptions {
  limit: number;
  forceRefresh: boolean;
  delayMs: number;
  onlyMissing: boolean;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    limit: 25,
    forceRefresh: false,
    delayMs: 500,
    onlyMissing: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--limit':
        if (i + 1 < args.length) {
          options.limit = parseInt(args[i + 1], 10);
          if (isNaN(options.limit) || options.limit < 1) {
            console.error('Error: --limit must be a positive number');
            process.exit(1);
          }
          i++;
        } else {
          console.error('Error: --limit requires a value');
          process.exit(1);
        }
        break;
      case '--forceRefresh':
        options.forceRefresh = true;
        break;
      case '--delayMs':
        if (i + 1 < args.length) {
          options.delayMs = parseInt(args[i + 1], 10);
          if (isNaN(options.delayMs) || options.delayMs < 0) {
            console.error('Error: --delayMs must be a non-negative number');
            process.exit(1);
          }
          i++;
        } else {
          console.error('Error: --delayMs requires a value');
          process.exit(1);
        }
        break;
      case '--onlyMissing':
        if (i + 1 < args.length) {
          const value = args[i + 1].toLowerCase();
          options.onlyMissing = value === 'true' || value === '1';
          i++;
        } else {
          options.onlyMissing = true;
        }
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Error: Unknown option ${arg}`);
          console.error('Usage: tsx scripts/bulk-enrich-companies.ts [--limit <n>] [--forceRefresh] [--delayMs <ms>] [--onlyMissing <true|false>]');
          process.exit(1);
        }
    }
  }

  return options;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = parseArgs();

  console.log('='.repeat(60));
  console.log('Bulk Company Enrichment Script');
  console.log('='.repeat(60));
  console.log(`Limit: ${options.limit}`);
  console.log(`Force Refresh: ${options.forceRefresh}`);
  console.log(`Delay: ${options.delayMs}ms`);
  console.log(`Only Missing: ${options.onlyMissing}`);
  console.log('');

  try {
    // Query companies based on onlyMissing flag
    let companies;
    if (options.onlyMissing && !options.forceRefresh) {
      // Only enrich companies that haven't been successfully enriched
      companies = await prisma.company.findMany({
        where: {
          OR: [
            { enrichmentStatus: null },
            { enrichmentStatus: 'never' },
            { enrichmentStatus: 'failed' },
            { enrichmentLastRun: null },
            { enrichmentStatus: { not: 'success' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: options.limit,
        select: {
          id: true,
          name: true,
          website: true,
          country: true,
          enrichmentStatus: true,
          enrichmentLastRun: true,
        },
      });
    } else {
      // Enrich all companies (up to limit)
      companies = await prisma.company.findMany({
        orderBy: { updatedAt: 'desc' },
        take: options.limit,
        select: {
          id: true,
          name: true,
          website: true,
          country: true,
          enrichmentStatus: true,
          enrichmentLastRun: true,
        },
      });
    }

    console.log(`Found ${companies.length} companies to enrich`);
    console.log('');

    if (companies.length === 0) {
      console.log('No companies to enrich. Exiting.');
      return;
    }

    const runner = new CompanyEnrichmentRunner();

    // Statistics
    let attempted = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    // Enrich each company
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      attempted++;

      console.log(`[${i + 1}/${companies.length}] Enriching: ${company.name} (${company.id})`);

      // Check if we should skip (idempotency check)
      if (
        !options.forceRefresh &&
        options.onlyMissing &&
        company.enrichmentStatus === 'success' &&
        company.enrichmentLastRun
      ) {
        console.log(`  → Skipped: Already successfully enriched`);
        skipped++;
        console.log('');
        continue;
      }

      try {
        const summary = await runner.enrichCompany(company.id, {
          forceRefresh: options.forceRefresh,
        });

        if (summary.status === 'success') {
          succeeded++;
          console.log(
            `  → Success: ${summary.sourcesSucceeded.length}/${summary.sourcesRun.length} sources succeeded`
          );
        } else {
          failed++;
          console.log(
            `  → Failed: ${summary.sourcesFailed.length}/${summary.sourcesRun.length} sources failed`
          );
        }

        // Log source details
        if (summary.sourcesSucceeded.length > 0) {
          console.log(`    Succeeded: ${summary.sourcesSucceeded.join(', ')}`);
        }
        if (summary.sourcesFailed.length > 0) {
          console.log(`    Failed: ${summary.sourcesFailed.join(', ')}`);
        }
      } catch (error: unknown) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  → Error: ${errorMessage}`);
      }

      console.log('');

      // Wait between companies (except for the last one)
      if (i < companies.length - 1 && options.delayMs > 0) {
        await sleep(options.delayMs);
      }
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('Enrichment Summary');
    console.log('='.repeat(60));
    console.log(`Total Attempted: ${attempted}`);
    console.log(`Succeeded: ${succeeded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log('='.repeat(60));
  } catch (error: unknown) {
    console.error('');
    console.error('Fatal error during bulk enrichment:');
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
