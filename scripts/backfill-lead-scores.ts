/**
 * Manual Backfill Lead Scores Script
 * Phase 3: Backfill scoring for leads that haven't been scored yet
 * 
 * Usage:
 *   npx tsx scripts/backfill-lead-scores.ts [--limit=50] [--whereBusinessSource=referral] [--dryRun]
 * 
 * Examples:
 *   npx tsx scripts/backfill-lead-scores.ts --limit=10 --dryRun
 *   npx tsx scripts/backfill-lead-scores.ts --limit=100 --whereBusinessSource=referral
 *   npx tsx scripts/backfill-lead-scores.ts --limit=50
 */

import { prisma } from '../lib/prisma';
import { persistLeadScore } from '../lib/scoring/persistLeadScore';

interface ScriptOptions {
  limit: number;
  whereBusinessSource?: string;
  dryRun: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  
  const options: ScriptOptions = {
    limit: 50, // default
    dryRun: false,
  };

  for (const arg of args) {
    if (arg === '--dryRun' || arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      const value = arg.split('=')[1];
      const limit = parseInt(value, 10);
      if (!isNaN(limit) && limit > 0) {
        options.limit = limit;
      } else {
        console.error(`Warning: Invalid limit value "${value}", using default 50`);
      }
    } else if (arg.startsWith('--whereBusinessSource=')) {
      const value = arg.split('=')[1];
      if (value) {
        options.whereBusinessSource = value.trim();
      }
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  console.log('='.repeat(60));
  console.log('Phase 3: Manual Backfill Lead Scores');
  console.log('='.repeat(60));
  console.log(`Limit: ${options.limit}`);
  console.log(`Dry Run: ${options.dryRun ? 'YES' : 'NO'}`);
  if (options.whereBusinessSource) {
    console.log(`Filter Business Source: ${options.whereBusinessSource}`);
  }
  console.log('');

  try {
    // Build where clause: leads missing scoredAt OR score=0
    const where: {
      OR: Array<{ scoredAt: null } | { score: number }>;
      status?: { not: string };
      businessSource?: string;
    } = {
      OR: [
        { scoredAt: null },
        { score: 0 },
      ],
      status: { not: 'archived' }, // Skip archived leads
    };

    if (options.whereBusinessSource) {
      where.businessSource = options.whereBusinessSource;
    }

    // Fetch leads that need scoring
    console.log('Fetching leads that need scoring...');
    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
        email: true,
        score: true,
        scoredAt: true,
        businessSource: true,
        source: true,
      },
      take: options.limit,
      orderBy: {
        createdAt: 'desc', // Process newer leads first
      },
    });

    console.log(`Found ${leads.length} lead(s) to score`);
    console.log('');

    if (leads.length === 0) {
      console.log('No leads need scoring. Exiting.');
      await prisma.$disconnect();
      return;
    }

    // Process each lead
    let scored = 0;
    let skipped = 0;
    const errors: Array<{ leadId: string; email: string; error: string }> = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const progress = `[${i + 1}/${leads.length}]`;

      try {
        if (options.dryRun) {
          console.log(`${progress} DRY RUN: Would score lead ${lead.id} (${lead.email})`);
          skipped++;
        } else {
          console.log(`${progress} Scoring lead ${lead.id} (${lead.email})...`);
          
          await persistLeadScore(lead.id);
          
          scored++;
          console.log(`  ✅ Scored successfully`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`  ❌ Error: ${errorMessage}`);
        errors.push({
          leadId: lead.id,
          email: lead.email,
          error: errorMessage,
        });
      }
    }

    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Total leads processed: ${leads.length}`);
    if (options.dryRun) {
      console.log(`Would score: ${skipped}`);
      console.log(`Errors: ${errors.length}`);
    } else {
      console.log(`Scored: ${scored}`);
      console.log(`Skipped: ${skipped}`);
      console.log(`Errors: ${errors.length}`);
    }

    if (errors.length > 0) {
      console.log('');
      console.log('Errors:');
      errors.forEach((err) => {
        console.log(`  - ${err.email} (${err.leadId}): ${err.error}`);
      });
    }

    console.log('');
    console.log('='.repeat(60));
    console.log(options.dryRun ? '✅ Dry run completed' : '✅ Backfill completed');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('');
    console.error('Fatal Error:');
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ${errorMessage}`);
    console.error('');
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
