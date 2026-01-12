/**
 * Phase 5A - Test Discovery Runner
 *
 * Tests the discovery runner functionality:
 * - Lists all available intents
 * - Runs a single intent with --dry-run mode
 * - Validates runner configuration
 *
 * Usage:
 *   npx tsx scripts/test-discovery-runner.ts
 *   npx tsx scripts/test-discovery-runner.ts --intent agencies_all
 *   npx tsx scripts/test-discovery-runner.ts --intent agencies_all --dry-run
 */

import 'dotenv/config';
import { DailyDiscoveryRunner } from '../lib/discovery/runner/DailyDiscoveryRunner';
import {
  getActiveIntents,
  getIntentById,
  applyIntentById,
  getAnalysisConfigForIntent,
} from '../lib/discovery/intents';
import { getLimitsForMode } from '../lib/discovery/runner/config';

async function main() {
  const args = process.argv.slice(2);
  const intentArg = args.find((arg) => arg.startsWith('--intent='))?.split('=')[1];
  const intentId = intentArg || args[args.indexOf('--intent') + 1];
  const dryRun = args.includes('--dry-run') || args.includes('--dryrun');

  console.log('\n' + '═'.repeat(70));
  console.log('  🧪 DISCOVERY RUNNER TEST');
  console.log('═'.repeat(70) + '\n');

  // ─────────────────────────────────────────────────────────────────────
  // 1. LIST INTENTS
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 Available Intents\n');

  const intents = getActiveIntents();
  console.log(`  Found ${intents.length} active intent(s):\n`);

  for (const intent of intents) {
    console.log(`  • ${intent.id}`);
    console.log(`    Name: ${intent.name}`);
    console.log(`    Category: ${intent.category}`);
    console.log(`    Countries: ${intent.targetCountries.join(', ')}`);
    console.log(`    Queries: ${intent.seedQueries.length}`);
    console.log(`    Limits: ${intent.limits?.maxCompanies ?? 'N/A'} companies, ${intent.limits?.maxLeads ?? 'N/A'} leads, ${intent.limits?.maxQueries ?? 'N/A'} queries`);
    console.log('');
  }

  // ─────────────────────────────────────────────────────────────────────
  // 2. RUNNER CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 Runner Configuration\n');

  const runner = new DailyDiscoveryRunner();
  const config = runner.getConfig();

  console.log(`  Enabled: ${runner.isEnabled() ? '✅' : '❌'}`);
  console.log(`  Max Companies Per Run: ${config.maxCompaniesPerRun}`);
  console.log(`  Max Leads Per Run: ${config.maxLeadsPerRun}`);
  console.log(`  Max Queries: ${config.maxQueries}`);
  console.log(`  Max Runtime: ${config.maxRuntimeSeconds}s`);
  console.log(`  Channels: ${config.enabledChannels.join(', ')}`);
  console.log('');

  // Check limits
  const manualLimits = getLimitsForMode('manual');
  console.log(`  Manual Mode Limits:`);
  console.log(`    Max Companies: ${manualLimits.maxCompanies}`);
  console.log(`    Max Leads: ${manualLimits.maxLeads}`);
  console.log(`    Max Queries: ${manualLimits.maxQueries}`);
  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 3. RUN INTENT (if specified)
  // ─────────────────────────────────────────────────────────────────────
  if (intentId) {
    console.log('📋 Running Intent Discovery\n');

    const intent = getIntentById(intentId);
    if (!intent) {
      console.error(`  ❌ Intent "${intentId}" not found`);
      console.log('\n  Available intents:');
      intents.forEach((i) => console.log(`    - ${i.id}`));
      process.exit(1);
    }

    if (!intent.active) {
      console.error(`  ❌ Intent "${intentId}" is not active`);
      process.exit(1);
    }

    console.log(`  Intent: ${intent.name} (${intent.id})`);
    console.log(`  Mode: ${dryRun ? 'DRY RUN (no DB writes)' : 'LIVE (will write to DB)'}`);
    console.log('');

    // Resolve intent configuration
    const resolved = applyIntentById(intentId);
    if (!resolved) {
      console.error(`  ❌ Failed to resolve intent: ${intentId}`);
      process.exit(1);
    }

    const analysisConfig = getAnalysisConfigForIntent(intent);

    console.log(`  Queries: ${resolved.queries.length} (using first ${Math.min(resolved.queries.length, resolved.limits.maxQueries)})`);
    console.log(`  Channels: ${resolved.channels.join(', ')}`);
    console.log(`  Limits: ${resolved.limits.maxCompanies} companies, ${resolved.limits.maxLeads} leads, ${resolved.limits.maxQueries} queries`);
    console.log(`  Time Budget: ${(resolved.limits.timeBudgetMs / 1000).toFixed(0)}s`);
    console.log('');

    console.log('  🚀 Starting discovery run...\n');

    try {
      const result = await runner.run({
        dryRun,
        mode: 'test',
        triggeredBy: 'test-discovery-runner',
        intentId: resolved.intentId,
        intentName: resolved.intentName,
        queries: resolved.queries.slice(0, resolved.limits.maxQueries),
        channels: resolved.channels,
        maxCompanies: resolved.limits.maxCompanies,
        maxLeads: resolved.limits.maxLeads,
        timeBudgetMs: resolved.limits.timeBudgetMs,
        enableScraping: true,
        analysisConfig,
        includeKeywords: resolved.includeKeywords,
        excludeKeywords: resolved.excludeKeywords,
        intentConfig: {
          intentId: resolved.intentId,
          intentName: resolved.intentName,
          targetCountries: resolved.targetCountries,
          queriesCount: resolved.queries.length,
          includeKeywordsCount: resolved.includeKeywords.length,
          excludeKeywordsCount: resolved.excludeKeywords.length,
        },
      });

      console.log('  📊 Results:\n');
      console.log(`    Run ID: ${result.runId}`);
      console.log(`    Status: ${result.status}`);
      console.log(`    Success: ${result.success ? '✅' : '❌'}`);
      console.log(`    Dry Run: ${result.dryRun ? 'Yes' : 'No'}`);
      console.log(`    Duration: ${(result.stats.durationMs / 1000).toFixed(2)}s`);
      console.log(`    Total Discovered: ${result.stats.totalDiscovered}`);
      console.log(`    After Dedupe: ${result.stats.totalAfterDedupe}`);
      console.log(`    Companies Created: ${result.stats.companiesCreated}`);
      console.log(`    Contacts Created: ${result.stats.contactsCreated}`);
      console.log(`    Leads Created: ${result.stats.leadsCreated}`);
      console.log('');

      if (Object.keys(result.stats.channelResults).length > 0) {
        console.log('    Channel Results:');
        for (const [channel, count] of Object.entries(result.stats.channelResults)) {
          console.log(`      ${channel}: ${count}`);
        }
        console.log('');
      }

      if (Object.keys(result.stats.channelErrors).length > 0) {
        console.log('    ⚠️  Channel Errors:');
        for (const [channel, error] of Object.entries(result.stats.channelErrors)) {
          console.log(`      ${channel}: ${error}`);
        }
        console.log('');
      }

      if (result.stats.errors && result.stats.errors.length > 0) {
        console.log('    ❌ Errors:');
        result.stats.errors.forEach((err) => {
          console.log(`      [${err.type}] ${err.message}`);
        });
        console.log('');
      }

      if (result.stats.stoppedEarly) {
        console.log(`    ⚠️  Run stopped early: ${result.stats.stoppedReason || 'unknown'}`);
        console.log('');
      }

      if (result.error) {
        console.log(`    ❌ Error: ${result.error}`);
        console.log('');
      }

      console.log('═'.repeat(70));
      console.log(`  🏁 TEST ${result.success ? 'PASSED' : 'FAILED'}`);
      console.log('═'.repeat(70) + '\n');

      process.exit(result.success ? 0 : 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Discovery run failed: ${errorMessage}`);
      console.error(error);
      process.exit(1);
    }
  } else {
    console.log('💡 Tip: Run a specific intent with:');
    console.log('   npx tsx scripts/test-discovery-runner.ts --intent <intent-id> --dry-run\n');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
