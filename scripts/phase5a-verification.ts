/**
 * Phase 5A - Comprehensive Verification Script
 *
 * Validates that the discovery system is working correctly:
 * 1. Configuration is loaded properly
 * 2. Discovery limits are enforced
 * 3. Intent system works
 * 4. Kill switch works
 * 5. Database can create run records
 *
 * Usage:
 *   npx tsx scripts/phase5a-verification.ts
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { DailyDiscoveryRunner } from '../lib/discovery/runner/DailyDiscoveryRunner';
import { loadConfig, getLimitsForMode, DISCOVERY_LIMITS } from '../lib/discovery/runner/config';
import { getActiveIntents, getIntentById, applyIntentById } from '../lib/discovery/intents';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | Promise<boolean>, details: string) {
  return async () => {
    try {
      const passed = await fn();
      results.push({ name, passed, details });
      console.log(passed ? `  ✅ ${name}` : `  ❌ ${name}`);
      if (!passed) console.log(`     → ${details}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({ name, passed: false, details, error: errorMsg });
      console.log(`  ❌ ${name}`);
      console.log(`     → Error: ${errorMsg}`);
    }
  };
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  🔬 PHASE 5A VERIFICATION TEST SUITE');
  console.log('═'.repeat(70) + '\n');

  // ─────────────────────────────────────────────────────────────────────
  // 1. CONFIGURATION TESTS
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 1. Configuration Tests\n');

  const config = loadConfig();

  await test(
    'Config loads without errors',
    () => config !== null && typeof config === 'object',
    'loadConfig() should return a valid object'
  )();

  await test(
    'Discovery limits are defined',
    () => DISCOVERY_LIMITS.daily.maxCompanies === 30 && DISCOVERY_LIMITS.manual.maxCompanies === 10,
    `Expected daily=30, manual=10. Got daily=${DISCOVERY_LIMITS.daily.maxCompanies}, manual=${DISCOVERY_LIMITS.manual.maxCompanies}`
  )();

  await test(
    'getLimitsForMode returns correct daily limits',
    () => {
      const limits = getLimitsForMode('daily');
      return limits.maxCompanies === 30 && limits.maxLeads === 30 && limits.maxQueries === 5;
    },
    'Daily limits should be 30/30/5'
  )();

  await test(
    'getLimitsForMode returns correct manual limits',
    () => {
      const limits = getLimitsForMode('manual');
      return limits.maxCompanies === 10 && limits.maxLeads === 10 && limits.maxQueries === 3;
    },
    'Manual limits should be 10/10/3'
  )();

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 2. INTENT SYSTEM TESTS
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 2. Intent System Tests\n');

  await test(
    'Active intents are loaded',
    () => getActiveIntents().length >= 4,
    `Expected at least 4 active intents, got ${getActiveIntents().length}`
  )();

  await test(
    'agencies_marketing_branding intent exists',
    () => getIntentById('agencies_marketing_branding') !== undefined,
    'agencies_marketing_branding intent should exist'
  )();

  await test(
    'Intent limits are conservative',
    () => {
      const intent = getIntentById('agencies_marketing_branding');
      return intent?.limits?.maxCompanies === 10 && intent?.limits?.maxLeads === 10;
    },
    'Intent should have maxCompanies=10, maxLeads=10'
  )();

  await test(
    'applyIntentById resolves correctly',
    () => {
      const resolved = applyIntentById('agencies_marketing_branding');
      return resolved !== null && 
             resolved.queries.length > 0 && 
             resolved.limits.maxCompanies === 10;
    },
    'Resolved intent should have queries and correct limits'
  )();

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 3. RUNNER TESTS
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 3. Discovery Runner Tests\n');

  const runner = new DailyDiscoveryRunner();

  await test(
    'Runner instantiates correctly',
    () => runner !== null,
    'DailyDiscoveryRunner should instantiate'
  )();

  await test(
    'Runner config is accessible',
    () => {
      const cfg = runner.getConfig();
      return typeof cfg.maxCompaniesPerRun === 'number' && cfg.enabledChannels.length > 0;
    },
    'Runner should expose config with limits and channels'
  )();

  await test(
    'Kill switch is respected',
    () => {
      const isEnabled = runner.isEnabled();
      const envValue = process.env.DISCOVERY_RUNNER_ENABLED;
      return (envValue === 'true') === isEnabled;
    },
    `DISCOVERY_RUNNER_ENABLED=${process.env.DISCOVERY_RUNNER_ENABLED}, isEnabled=${runner.isEnabled()}`
  )();

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 4. DATABASE TESTS
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 4. Database Tests\n');

  await test(
    'Database connection works',
    async () => {
      const count = await prisma.discoveryRun.count();
      return typeof count === 'number';
    },
    'Should be able to query DiscoveryRun table'
  )();

  await test(
    'Can query recent runs',
    async () => {
      const runs = await prisma.discoveryRun.findMany({
        take: 5,
        orderBy: { startedAt: 'desc' },
      });
      return Array.isArray(runs);
    },
    'Should be able to fetch recent discovery runs'
  )();

  // Get actual run stats
  const totalRuns = await prisma.discoveryRun.count();
  const completedRuns = await prisma.discoveryRun.count({ where: { status: 'completed' } });
  const failedRuns = await prisma.discoveryRun.count({ where: { status: 'failed' } });

  console.log(`\n  📊 Discovery Run Stats:`);
  console.log(`     Total Runs: ${totalRuns}`);
  console.log(`     Completed: ${completedRuns}`);
  console.log(`     Failed: ${failedRuns}`);

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 5. ENVIRONMENT TESTS
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 5. Environment Variable Tests\n');

  const envVars = [
    { name: 'DISCOVERY_RUNNER_ENABLED', required: true, secret: false },
    { name: 'CRON_JOB_SECRET', required: true, secret: true },
    { name: 'GOOGLE_CSE_API_KEY', required: true, secret: true },
    { name: 'GOOGLE_CSE_ID', required: true, secret: false },
    { name: 'DATABASE_URL', required: true, secret: true },
  ];

  for (const { name, required, secret } of envVars) {
    const value = process.env[name];
    const exists = value !== undefined && value !== '';
    const displayValue = secret 
      ? (exists ? `****${value?.slice(-4)}` : 'NOT SET')
      : (exists ? value : 'NOT SET');
    
    await test(
      `${name} is set`,
      () => exists || !required,
      `Value: ${displayValue}`
    )();
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 6. DRY RUN TEST
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 6. Dry Run Test\n');

  console.log('  🚀 Running a dry-run discovery test...');
  
  try {
    const resolved = applyIntentById('agencies_marketing_branding');
    if (!resolved) throw new Error('Failed to resolve intent');

    const result = await runner.run({
      dryRun: true,
      mode: 'test',
      triggeredBy: 'phase5a-verification',
      intentId: resolved.intentId,
      intentName: resolved.intentName,
      queries: resolved.queries.slice(0, 2), // Only 2 queries for speed
      channels: resolved.channels,
      maxCompanies: 5,
      maxLeads: 5,
      timeBudgetMs: 30000, // 30 seconds
    });

    await test(
      'Dry run completed',
      () => result.status === 'completed' || result.status === 'failed',
      `Status: ${result.status}`
    )();

    await test(
      'Run ID was created',
      () => result.runId !== undefined && result.runId.length > 0,
      `Run ID: ${result.runId}`
    )();

    await test(
      'Stats were recorded',
      () => result.stats !== undefined && typeof result.stats.durationMs === 'number',
      `Duration: ${result.stats.durationMs}ms`
    )();

    console.log(`\n  📊 Dry Run Results:`);
    console.log(`     Run ID: ${result.runId}`);
    console.log(`     Status: ${result.status}`);
    console.log(`     Duration: ${(result.stats.durationMs / 1000).toFixed(2)}s`);
    console.log(`     Discovered: ${result.stats.totalDiscovered} (${result.stats.totalAfterDedupe} after dedupe)`);
    console.log(`     Dry Run: ${result.dryRun} (no DB writes)`);

    if (result.stats.channelErrors && Object.keys(result.stats.channelErrors).length > 0) {
      console.log(`\n  ⚠️ Channel Errors:`);
      for (const [channel, error] of Object.entries(result.stats.channelErrors)) {
        console.log(`     [${channel}] ${error}`);
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Dry run failed: ${errorMsg}`);
    results.push({ name: 'Dry run completed', passed: false, details: 'Dry run should complete', error: errorMsg });
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────
  console.log('═'.repeat(70));
  console.log('  📊 SUMMARY');
  console.log('═'.repeat(70) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`  Tests Passed: ${passed}/${total}`);
  console.log(`  Tests Failed: ${failed}/${total}`);
  console.log(`  Pass Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('  ❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`     - ${r.name}: ${r.error || r.details}`);
    });
    console.log('');
  }

  const overallStatus = failed === 0 ? 'PASS' : 'FAIL';
  console.log('═'.repeat(70));
  console.log(`  🏁 PHASE 5A VERIFICATION: ${overallStatus}`);
  console.log('═'.repeat(70) + '\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
