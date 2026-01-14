/**
 * Test Manual Discovery - Agencies Intent
 * 
 * Runs a manual discovery test using the agencies_all intent.
 * Tests Google CSE configuration and discovery functionality.
 * 
 * Usage:
 *   npx tsx scripts/test-agencies-discovery.ts
 */

import 'dotenv/config';
import { discoveryRunner } from '../lib/discovery/runner';
import { applyIntentById, getIntentById } from '../lib/discovery/intents';
import { getAnalysisConfigForIntent } from '../lib/discovery/intents';

async function main() {
  console.log('=== Manual Discovery Test - Agencies Intent ===\n');

  const intentId = 'agencies_all';

  // Step 1: Validate intent exists
  console.log('Step 1: Validating intent...');
  const intent = getIntentById(intentId);
  if (!intent) {
    console.error(`❌ Intent "${intentId}" not found`);
    process.exit(1);
  }
  console.log(`  ✅ Intent found: ${intent.name}`);
  console.log(`  Description: ${intent.description}`);
  console.log(`  Channels: ${intent.channels.join(', ')}`);
  console.log('');

  // Step 2: Apply intent
  console.log('Step 2: Applying intent configuration...');
  const resolvedConfig = applyIntentById(intentId);
  if (!resolvedConfig) {
    console.error(`❌ Failed to resolve intent: ${intentId}`);
    process.exit(1);
  }
  console.log(`  ✅ Intent resolved`);
  console.log(`  Queries: ${resolvedConfig.queries.length}`);
  console.log(`  Max Companies: ${resolvedConfig.limits.maxCompanies}`);
  console.log(`  Max Leads: ${resolvedConfig.limits.maxLeads}`);
  console.log('');

  // Step 3: Get analysis config
  console.log('Step 3: Loading analysis configuration...');
  const analysisConfig = getAnalysisConfigForIntent(intent);
  if (analysisConfig) {
    console.log(`  ✅ Analysis config loaded`);
    console.log(`  Positive keywords: ${analysisConfig.positiveKeywords.length}`);
    console.log(`  Negative keywords: ${analysisConfig.negativeKeywords.length}`);
    console.log(`  Target business types: ${analysisConfig.targetBusinessTypes.length}`);
  } else {
    console.log('  ⚠️  No analysis config (scraping will use fallback)');
  }
  console.log('');

  // Step 4: Run discovery (dry run first)
  console.log('Step 4: Running discovery (DRY RUN)...');
  console.log('  This will test the discovery without creating database records\n');

  try {
    const dryRunResult = await discoveryRunner.run({
      dryRun: true,
      mode: 'manual',
      triggeredBy: 'test-script',
      triggeredById: 'test-user',
      intentId: resolvedConfig.intentId,
      intentName: resolvedConfig.intentName,
      queries: resolvedConfig.queries,
      channels: resolvedConfig.channels,
      maxCompanies: resolvedConfig.limits.maxCompanies,
      maxLeads: resolvedConfig.limits.maxLeads,
      timeBudgetMs: resolvedConfig.limits.timeBudgetMs,
      enableScraping: true,
      analysisConfig,
      includeKeywords: resolvedConfig.includeKeywords,
      excludeKeywords: resolvedConfig.excludeKeywords,
      intentConfig: {
        intentId: resolvedConfig.intentId,
        intentName: resolvedConfig.intentName,
        targetCountries: resolvedConfig.targetCountries,
        queriesCount: resolvedConfig.queries.length,
        includeKeywordsCount: resolvedConfig.includeKeywords.length,
        excludeKeywordsCount: resolvedConfig.excludeKeywords.length,
      },
    });

    console.log('✅ Dry run completed');
    console.log('');
    console.log('Results:');
    console.log(`  Status: ${dryRunResult.status}`);
    console.log(`  Success: ${dryRunResult.success}`);
    console.log(`  Run ID: ${dryRunResult.runId}`);
    console.log('');
    console.log('Stats:');
    console.log(`  Total Discovered: ${dryRunResult.stats.totalDiscovered}`);
    console.log(`  After Dedupe: ${dryRunResult.stats.totalAfterDedupe}`);
    console.log(`  Companies (would be created): ${dryRunResult.stats.companiesCreated}`);
    console.log(`  Contacts (would be created): ${dryRunResult.stats.contactsCreated}`);
    console.log(`  Leads (would be created): ${dryRunResult.stats.leadsCreated}`);
    console.log(`  Duration: ${(dryRunResult.stats.durationMs / 1000).toFixed(1)}s`);
    console.log('');

    if (dryRunResult.stats.channelResults) {
      console.log('Channel Results:');
      Object.entries(dryRunResult.stats.channelResults).forEach(([channel, count]) => {
        console.log(`  ${channel}: ${count} results`);
      });
      console.log('');
    }

    if (dryRunResult.stats.channelErrors && Object.keys(dryRunResult.stats.channelErrors).length > 0) {
      console.log('⚠️  Channel Errors:');
      Object.entries(dryRunResult.stats.channelErrors).forEach(([channel, error]) => {
        console.log(`  ${channel}: ${error}`);
      });
      console.log('');
    }

    if (dryRunResult.error) {
      console.log(`⚠️  Error: ${dryRunResult.error}`);
      console.log('');
    }

    if (dryRunResult.status === 'completed_with_errors') {
      console.log('⚠️  WARNING: Run completed with errors (likely Google CSE not configured)');
      console.log('');
    }

    console.log('✅ Discovery test completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review the results above');
    console.log('  2. If results look good, run without --dry-run to create records');
    console.log('  3. Tune relevance thresholds if needed');
    console.log('  4. Optimize queries per intent');
    console.log('  5. Monitor quota usage');
  } catch (error) {
    console.error('❌ Discovery test failed:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
