/**
 * Phase 5A - Discovery Runner Test Script
 *
 * Tests the discovery runner locally (not through the API).
 * Can run in dry-run mode (no DB writes) or real mode.
 *
 * Usage:
 *   npx tsx scripts/test-discovery-runner.ts --dry-run
 *   npx tsx scripts/test-discovery-runner.ts --real
 *   npx tsx scripts/test-discovery-runner.ts --api --dry-run
 */

import { config } from 'dotenv';
config();

import { DailyDiscoveryRunner } from '../lib/discovery/runner/DailyDiscoveryRunner';
import { loadConfig } from '../lib/discovery/runner/config';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || !args.includes('--real');
  const useApi = args.includes('--api');

  console.log('\n🔍 Phase 5A Discovery Runner Test');
  console.log('═'.repeat(50));
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no DB writes)' : 'REAL (will write to DB)'}`);
  console.log(`Method: ${useApi ? 'API call' : 'Direct runner'}`);
  console.log('═'.repeat(50) + '\n');

  // Load and display config
  const runnerConfig = loadConfig();
  console.log('📋 Configuration:');
  console.log(`   Enabled: ${runnerConfig.enabled}`);
  console.log(`   Max Companies: ${runnerConfig.maxCompaniesPerRun}`);
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
      await runViaApi(isDryRun);
    } else {
      await runDirect(isDryRun);
    }
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

async function runDirect(isDryRun: boolean) {
  console.log('🚀 Starting discovery run (direct)...\n');

  const runner = new DailyDiscoveryRunner();
  const result = await runner.run({
    dryRun: isDryRun,
    mode: 'test',
    triggeredBy: 'test-script',
    maxCompanies: 10, // Limit for testing
  });

  displayResult(result);
}

async function runViaApi(isDryRun: boolean) {
  console.log('🚀 Starting discovery run (via API)...\n');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const secret = process.env.CRON_JOB_SECRET;

  if (!secret) {
    console.error('❌ CRON_JOB_SECRET not set in environment');
    process.exit(1);
  }

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
    errors: Array<{ type: string; message: string }>;
  };
}) {
  console.log('═'.repeat(50));
  console.log('📊 RESULTS');
  console.log('═'.repeat(50));

  console.log(`\n✅ Run ID: ${result.runId}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Dry Run: ${result.dryRun}`);
  console.log(`   Success: ${result.success}`);

  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  console.log('\n📈 Statistics:');
  console.log(`   Discovered: ${result.stats.totalDiscovered} total → ${result.stats.totalAfterDedupe} after dedupe`);
  console.log(`   Duration: ${(result.stats.durationMs / 1000).toFixed(2)}s`);

  console.log('\n📦 Created Records:');
  console.log(`   Companies: ${result.stats.companiesCreated} created, ${result.stats.companiesSkipped} skipped`);
  console.log(`   Contacts: ${result.stats.contactsCreated} created, ${result.stats.contactsSkipped} skipped`);
  console.log(`   Leads: ${result.stats.leadsCreated} created, ${result.stats.leadsSkipped} skipped`);

  if (result.stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${result.stats.errors.length}):`);
    result.stats.errors.slice(0, 5).forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.type}] ${err.message}`);
    });
    if (result.stats.errors.length > 5) {
      console.log(`   ... and ${result.stats.errors.length - 5} more`);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(result.success ? '✅ Test completed successfully!' : '❌ Test completed with errors');
  console.log('═'.repeat(50) + '\n');
}

main().catch(console.error);
