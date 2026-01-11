/**
 * Phase 5A - Discovery Runner Test Script
 *
 * Tests the discovery runner locally (not through the API).
 * Can run in dry-run mode (no DB writes) or real mode.
 * Supports intent-based runs.
 *
 * Usage:
 *   npx tsx scripts/test-discovery-runner.ts --dry-run
 *   npx tsx scripts/test-discovery-runner.ts --real
 *   npx tsx scripts/test-discovery-runner.ts --api --dry-run
 *   npx tsx scripts/test-discovery-runner.ts --intent referral_ecosystem_prospects --dry-run
 *   npx tsx scripts/test-discovery-runner.ts --list-intents
 */

import { config } from 'dotenv';
config();

import { DailyDiscoveryRunner } from '../lib/discovery/runner/DailyDiscoveryRunner';
import { loadConfig } from '../lib/discovery/runner/config';
import {
  getActiveIntents,
  getIntentById,
  applyIntentById,
} from '../lib/discovery/intents';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || !args.includes('--real');
  const useApi = args.includes('--api');
  const listIntents = args.includes('--list-intents');
  const intentIndex = args.indexOf('--intent');
  const intentId = intentIndex !== -1 ? args[intentIndex + 1] : undefined;

  // List intents and exit
  if (listIntents) {
    console.log('\n📋 Available Discovery Intents:');
    console.log('═'.repeat(60));
    getActiveIntents().forEach((intent) => {
      console.log(`\n  ${intent.id}`);
      console.log(`  Name: ${intent.name}`);
      console.log(`  Description: ${intent.description}`);
      console.log(`  Countries: ${intent.targetCountries.join(', ')}`);
      console.log(`  Channels: ${intent.channels.join(', ')}`);
    });
    console.log('\n' + '═'.repeat(60));
    console.log('Usage: npx tsx scripts/test-discovery-runner.ts --intent <intent_id> --dry-run\n');
    return;
  }

  console.log('\n🔍 Phase 5A Discovery Runner Test');
  console.log('═'.repeat(60));
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no DB writes)' : 'REAL (will write to DB)'}`);
  console.log(`Method: ${useApi ? 'API call' : 'Direct runner'}`);
  if (intentId) {
    console.log(`Intent: ${intentId}`);
  }
  console.log('═'.repeat(60) + '\n');

  // Load and display config
  const runnerConfig = loadConfig();
  console.log('📋 Configuration:');
  console.log(`   Enabled: ${runnerConfig.enabled}`);
  console.log(`   Max Companies: ${runnerConfig.maxCompaniesPerRun}`);
  console.log(`   Max Leads: ${runnerConfig.maxLeadsPerRun}`);
  console.log(`   Max Queries: ${runnerConfig.maxQueries}`);
  console.log(`   Max Runtime: ${runnerConfig.maxRuntimeSeconds}s`);
  console.log(`   Channels: ${runnerConfig.enabledChannels.join(', ')}`);
  console.log('');

  if (!runnerConfig.enabled) {
    console.log('⚠️  Discovery runner is DISABLED (DISCOVERY_RUNNER_ENABLED != true)');
    console.log('   Set DISCOVERY_RUNNER_ENABLED=true in .env to enable');
    console.log('');
    console.log('   Running anyway for testing...');
    console.log('');
  }

  try {
    if (useApi) {
      await runViaApi(isDryRun, intentId);
    } else {
      await runDirect(isDryRun, intentId);
    }
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

async function runDirect(isDryRun: boolean, intentId?: string) {
  console.log('🚀 Starting discovery run (direct)...\n');

  const runner = new DailyDiscoveryRunner();

  // If intent specified, apply it
  if (intentId) {
    const intent = getIntentById(intentId);
    if (!intent) {
      console.error(`❌ Intent "${intentId}" not found`);
      console.log('\nAvailable intents:');
      getActiveIntents().forEach((i) => console.log(`  - ${i.id}`));
      process.exit(1);
    }

    const resolved = applyIntentById(intentId);
    if (!resolved) {
      console.error(`❌ Failed to resolve intent "${intentId}"`);
      process.exit(1);
    }

    console.log(`📌 Using intent: ${intent.name}`);
    console.log(`   Queries: ${resolved.queries.length}`);
    console.log(`   Countries: ${resolved.targetCountries.join(', ')}`);
    console.log(`   Max Companies: ${resolved.limits.maxCompanies}`);
    console.log('');

    const result = await runner.run({
      dryRun: isDryRun,
      mode: 'test',
      triggeredBy: 'test-script',
      intentId: resolved.intentId,
      intentName: resolved.intentName,
      queries: resolved.queries.slice(0, 5), // Limit for testing
      channels: resolved.channels,
      maxCompanies: Math.min(resolved.limits.maxCompanies, 10), // Limit for testing
      maxLeads: Math.min(resolved.limits.maxLeads, 20),
      timeBudgetMs: 60000, // 60 second budget for testing
      intentConfig: {
        intentId: resolved.intentId,
        intentName: resolved.intentName,
        targetCountries: resolved.targetCountries,
        queriesCount: resolved.queries.length,
        includeKeywordsCount: resolved.includeKeywords.length,
        excludeKeywordsCount: resolved.excludeKeywords.length,
      },
    });

    displayResult(result);
  } else {
    // Default run without intent
    const result = await runner.run({
      dryRun: isDryRun,
      mode: 'test',
      triggeredBy: 'test-script',
      maxCompanies: 10, // Limit for testing
    });

    displayResult(result);
  }
}

async function runViaApi(isDryRun: boolean, intentId?: string) {
  console.log('🚀 Starting discovery run (via API)...\n');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const secret = process.env.CRON_JOB_SECRET;

  if (!secret) {
    console.error('❌ CRON_JOB_SECRET not set in environment');
    process.exit(1);
  }

  // If using intent, use manual API; otherwise use cron API
  if (intentId) {
    console.log(`📌 Using intent: ${intentId}`);
    console.log('   Using manual discovery API...\n');

    // Note: This requires session auth, not just secret
    // For testing, we'd need to use the cron route instead
    console.log('⚠️  Manual API requires session authentication.');
    console.log('   Use the web UI at /dashboard/discovery for manual runs.');
    console.log('   Or test without --api flag for direct runner test.\n');

    // Fall back to cron route
    const response = await fetch(`${baseUrl}/api/jobs/discovery/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-job-secret': secret,
      },
      body: JSON.stringify({
        dryRun: isDryRun,
        mode: 'test',
        maxCompanies: 10,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ API returned ${response.status}:`, result);
      process.exit(1);
    }

    displayResult(result);
  } else {
    const response = await fetch(`${baseUrl}/api/jobs/discovery/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-job-secret': secret,
      },
      body: JSON.stringify({
        dryRun: isDryRun,
        mode: 'test',
        maxCompanies: 10,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ API returned ${response.status}:`, result);
      process.exit(1);
    }

    displayResult(result);
  }
}

function displayResult(result: {
  success: boolean;
  runId: string;
  dryRun: boolean;
  status: string;
  error?: string;
  stats: {
    totalDiscovered: number;
    totalAfterDedupe: number;
    companiesCreated: number;
    companiesSkipped: number;
    contactsCreated: number;
    contactsSkipped: number;
    leadsCreated: number;
    leadsSkipped: number;
    durationMs: number;
    stoppedEarly?: boolean;
    stoppedReason?: string;
    channelErrors?: Record<string, string>;
    errors: Array<{ type: string; message: string }>;
    limitsUsed?: {
      maxCompanies: number;
      maxLeads: number;
      maxQueries: number;
      maxRuntimeSeconds: number;
      channels: string[];
    };
  };
}) {
  console.log('═'.repeat(60));
  console.log('📊 RESULTS');
  console.log('═'.repeat(60));

  console.log(`\n✅ Run ID: ${result.runId}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Dry Run: ${result.dryRun}`);
  console.log(`   Success: ${result.success}`);

  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  if (result.stats.stoppedEarly) {
    console.log(`   ⚠️ Stopped Early: ${result.stats.stoppedReason}`);
  }

  console.log('\n📈 Statistics:');
  console.log(`   Discovered: ${result.stats.totalDiscovered} total → ${result.stats.totalAfterDedupe} after dedupe`);
  console.log(`   Duration: ${(result.stats.durationMs / 1000).toFixed(2)}s`);

  console.log('\n📦 Created Records:');
  console.log(`   Companies: ${result.stats.companiesCreated} created, ${result.stats.companiesSkipped} skipped`);
  console.log(`   Contacts: ${result.stats.contactsCreated} created, ${result.stats.contactsSkipped} skipped`);
  console.log(`   Leads: ${result.stats.leadsCreated} created, ${result.stats.leadsSkipped} skipped`);

  if (result.stats.limitsUsed) {
    console.log('\n⚙️ Limits Used:');
    console.log(`   Max Companies: ${result.stats.limitsUsed.maxCompanies}`);
    console.log(`   Max Leads: ${result.stats.limitsUsed.maxLeads}`);
    console.log(`   Max Runtime: ${result.stats.limitsUsed.maxRuntimeSeconds}s`);
    console.log(`   Channels: ${result.stats.limitsUsed.channels.join(', ')}`);
  }

  // Channel errors (partial failures)
  if (result.stats.channelErrors && Object.keys(result.stats.channelErrors).length > 0) {
    console.log(`\n⚠️ Channel Errors (partial failures):`);
    Object.entries(result.stats.channelErrors).forEach(([channel, error]) => {
      console.log(`   [${channel}] ${error}`);
    });
  }

  if (result.stats.errors.length > 0) {
    console.log(`\n⚠️ Errors (${result.stats.errors.length}):`);
    result.stats.errors.slice(0, 5).forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.type}] ${err.message}`);
    });
    if (result.stats.errors.length > 5) {
      console.log(`   ... and ${result.stats.errors.length - 5} more`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(result.success ? '✅ Test completed successfully!' : '❌ Test completed with errors');
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
