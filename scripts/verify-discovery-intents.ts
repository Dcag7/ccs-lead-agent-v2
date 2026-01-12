/**
 * Phase 5A - Verify Discovery Intents
 *
 * Validates that all required intents exist and have correct configuration:
 * - Required intents: agencies_all, schools_all, tenders_uniforms_merch,
 *   businesses_sme_ceo_and_corporate_marketing, events_exhibitions_sa
 * - Global negative keywords are applied
 * - Tender queries include site:etenders.gov.za
 * - Limits are within safety bounds
 *
 * Usage:
 *   npx tsx scripts/verify-discovery-intents.ts
 */

import 'dotenv/config';
import {
  getIntentById,
  GLOBAL_NEGATIVE_KEYWORDS,
} from '../lib/discovery/intents';

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
  console.log('  🔍 DISCOVERY INTENTS VERIFICATION');
  console.log('═'.repeat(70) + '\n');

  // ─────────────────────────────────────────────────────────────────────
  // 1. REQUIRED INTENTS EXIST
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 1. Required Intents\n');

  const requiredIntents = [
    'agencies_all',
    'schools_all',
    'tenders_uniforms_merch',
    'businesses_sme_ceo_and_corporate_marketing',
    'events_exhibitions_sa',
  ];

  for (const intentId of requiredIntents) {
    await test(
      `Intent "${intentId}" exists`,
      () => getIntentById(intentId) !== undefined,
      `Intent ${intentId} should be defined in catalog`
    )();

    await test(
      `Intent "${intentId}" is active`,
      () => {
        const intent = getIntentById(intentId);
        return intent?.active === true;
      },
      `Intent ${intentId} should be active`
    )();
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 2. INTENT CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 2. Intent Configuration\n');

  for (const intentId of requiredIntents) {
    const intent = getIntentById(intentId);
    if (!intent) continue;

    await test(
      `${intentId} has seed queries`,
      () => intent.seedQueries.length > 0,
      `Intent should have at least one seed query`
    )();

    await test(
      `${intentId} has include keywords`,
      () => intent.includeKeywords.length > 0,
      `Intent should have include keywords`
    )();

    await test(
      `${intentId} has exclude keywords`,
      () => intent.excludeKeywords.length > 0,
      `Intent should have exclude keywords`
    )();

    await test(
      `${intentId} targets South Africa`,
      () => intent.targetCountries.includes('ZA'),
      `Intent should target ZA (South Africa)`
    )();

    await test(
      `${intentId} has channels configured`,
      () => intent.channels.length > 0,
      `Intent should have at least one channel`
    )();

    await test(
      `${intentId} has limits configured`,
      () => intent.limits !== undefined,
      `Intent should have limits configured`
    )();

    // Check limits are within safety bounds
    if (intent.limits) {
      await test(
        `${intentId} maxCompanies <= 20`,
        () => (intent.limits?.maxCompanies ?? 0) <= 20,
        `maxCompanies should be <= 20, got ${intent.limits.maxCompanies}`
      )();

      await test(
        `${intentId} maxLeads <= 30`,
        () => (intent.limits?.maxLeads ?? 0) <= 30,
        `maxLeads should be <= 30, got ${intent.limits.maxLeads}`
      )();

      await test(
        `${intentId} maxQueries <= 5`,
        () => (intent.limits?.maxQueries ?? 0) <= 5,
        `maxQueries should be <= 5, got ${intent.limits.maxQueries}`
      )();
    }
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 3. GLOBAL NEGATIVE KEYWORDS
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 3. Global Negative Keywords\n');

  await test(
    'Global negative keywords are defined',
    () => GLOBAL_NEGATIVE_KEYWORDS.length > 0,
    `Should have global negative keywords, got ${GLOBAL_NEGATIVE_KEYWORDS.length}`
  )();

  // Check for required negative keywords
  const requiredNegativeKeywords = [
    'jobs',
    'vacancies',
    'internship',
    'careers',
    'hiring',
    'retail',
    'ecommerce',
  ];

  for (const keyword of requiredNegativeKeywords) {
    await test(
      `Global negative keywords include "${keyword}"`,
      () => {
        const lowerKeywords = GLOBAL_NEGATIVE_KEYWORDS.map((k) => k.toLowerCase());
        return lowerKeywords.some((k) => k.includes(keyword.toLowerCase()));
      },
      `Global negative keywords should include "${keyword}" or a variant`
    )();
  }

  // Verify all intents apply global negative keywords
  for (const intentId of requiredIntents) {
    const intent = getIntentById(intentId);
    if (!intent) continue;

    await test(
      `${intentId} applies global negative keywords`,
      () => {
        // Check if any global negative keywords are in excludeKeywords
        const excludeLower = intent.excludeKeywords.map((k) => k.toLowerCase());
        const globalLower = GLOBAL_NEGATIVE_KEYWORDS.map((k) => k.toLowerCase());
        // At least one global keyword should be present
        return globalLower.some((gk) =>
          excludeLower.some((ek) => ek.includes(gk) || gk.includes(ek))
        );
      },
      `Intent should include global negative keywords in excludeKeywords`
    )();
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 4. TENDER SITE CONSTRAINT
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 4. Tender Site Constraint\n');

  const tenderIntent = getIntentById('tenders_uniforms_merch');
  if (tenderIntent) {
    await test(
      'Tender intent has site:etenders.gov.za queries',
      () => {
        const hasSiteQuery = tenderIntent.seedQueries.some((q) =>
          q.toLowerCase().includes('site:etenders.gov.za')
        );
        return hasSiteQuery;
      },
      'Tender intent should include site:etenders.gov.za in seed queries'
    )();

    await test(
      'Tender intent includes uniform/workwear/apparel keywords',
      () => {
        const queries = tenderIntent.seedQueries.join(' ').toLowerCase();
        const hasUniform = queries.includes('uniform') || queries.includes('workwear') || 
                          queries.includes('apparel') || queries.includes('merchandise');
        return hasUniform;
      },
      'Tender intent queries should include uniform/workwear/apparel/merchandise keywords'
    )();
  } else {
    results.push({
      name: 'Tender intent exists',
      passed: false,
      details: 'tenders_uniforms_merch intent not found',
    });
    console.log('  ❌ Tender intent exists');
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 5. EVENTS INTENT
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 5. Events Intent Configuration\n');

  const eventsIntent = getIntentById('events_exhibitions_sa');
  if (eventsIntent) {
    await test(
      'Events intent targets exhibitors/organizers/sponsors',
      () => {
        const queries = eventsIntent.seedQueries.join(' ').toLowerCase();
        const keywords = eventsIntent.includeKeywords.map((k) => k.toLowerCase());
        const hasTarget = queries.includes('exhibitor') || queries.includes('sponsor') ||
                         queries.includes('organizer') || keywords.includes('exhibitor') ||
                         keywords.includes('sponsor') || keywords.includes('organizer');
        return hasTarget;
      },
      'Events intent should target exhibitors, organizers, or sponsors'
    )();

    await test(
      'Events intent includes branded merchandise keywords',
      () => {
        const queries = eventsIntent.seedQueries.join(' ').toLowerCase();
        const keywords = eventsIntent.includeKeywords.map((k) => k.toLowerCase());
        const hasMerch = queries.includes('branded') || queries.includes('merchandise') ||
                        queries.includes('promotional') || keywords.includes('branded') ||
                        keywords.includes('merchandise') || keywords.includes('promotional');
        return hasMerch;
      },
      'Events intent should include branded merchandise/promotional keywords'
    )();
  } else {
    results.push({
      name: 'Events intent exists',
      passed: false,
      details: 'events_exhibitions_sa intent not found',
    });
    console.log('  ❌ Events intent exists');
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────
  console.log('═'.repeat(70));
  console.log('  📊 SUMMARY');
  console.log('═'.repeat(70) + '\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`  Tests Passed: ${passed}/${total}`);
  console.log(`  Tests Failed: ${failed}/${total}`);
  console.log(`  Pass Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('  ❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`     - ${r.name}: ${r.error || r.details}`);
      });
    console.log('');
  }

  const overallStatus = failed === 0 ? 'PASS' : 'FAIL';
  console.log('═'.repeat(70));
  console.log(`  🏁 INTENT VERIFICATION: ${overallStatus}`);
  console.log('═'.repeat(70) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
