/**
 * Phase 5A - Discovery Intent Verification Script
 *
 * Verifies that the discovery intent templates are correctly configured:
 * - Limits enforced
 * - Global negative keywords applied
 * - Gauteng bias is active
 * - Tender intent queries include site:etenders.gov.za
 * - All required intents exist and are active
 *
 * Usage:
 *   npx tsx scripts/verify-discovery-intents.ts
 */

import { config } from 'dotenv';
config();

import {
  getActiveIntents,
  getIntentById,
  GAUTENG_PRIORITY_REGIONS,
  getAnalysisConfigForIntent,
} from '../lib/discovery/intents';
import { getDailyIntentIds, getDailyPerIntentLimits } from '../lib/discovery/runner/config';

interface VerificationResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

const results: VerificationResult[] = [];

function verify(name: string, check: () => { passed: boolean; message: string; details?: string[] }) {
  try {
    const result = check();
    results.push({ name, ...result });
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function main() {
  console.log('\n🔍 Phase 5A Discovery Intent Verification');
  console.log('═'.repeat(70));
  console.log('Checking that all intent templates are correctly configured...\n');

  // 1. Verify required intents exist and are active
  verify('Required intents exist', () => {
    const requiredIntents = [
      'agencies_all',
      'schools_all',
      'tenders_uniforms_merch',
      'businesses_sme_ceo_and_corporate_marketing',
      'events_exhibitions_sa',
    ];
    const missing: string[] = [];
    const inactive: string[] = [];

    for (const id of requiredIntents) {
      const intent = getIntentById(id);
      if (!intent) {
        missing.push(id);
      } else if (!intent.active) {
        inactive.push(id);
      }
    }

    if (missing.length > 0 || inactive.length > 0) {
      return {
        passed: false,
        message: 'Some required intents are missing or inactive',
        details: [
          ...missing.map(id => `Missing: ${id}`),
          ...inactive.map(id => `Inactive: ${id}`),
        ],
      };
    }

    return {
      passed: true,
      message: `All ${requiredIntents.length} required intents exist and are active`,
      details: requiredIntents,
    };
  });

  // 2. Verify limits are enforced (conservative caps)
  verify('Limits are enforced (conservative caps)', () => {
    const activeIntents = getActiveIntents();
    const violations: string[] = [];

    const MAX_COMPANIES = 20;
    const MAX_LEADS = 30;
    const MAX_QUERIES = 10;

    for (const intent of activeIntents) {
      if ((intent.limits?.maxCompanies || 10) > MAX_COMPANIES) {
        violations.push(`${intent.id}: maxCompanies ${intent.limits?.maxCompanies} > ${MAX_COMPANIES}`);
      }
      if ((intent.limits?.maxLeads || 10) > MAX_LEADS) {
        violations.push(`${intent.id}: maxLeads ${intent.limits?.maxLeads} > ${MAX_LEADS}`);
      }
      if ((intent.limits?.maxQueries || 3) > MAX_QUERIES) {
        violations.push(`${intent.id}: maxQueries ${intent.limits?.maxQueries} > ${MAX_QUERIES}`);
      }
    }

    if (violations.length > 0) {
      return {
        passed: false,
        message: 'Some intents exceed conservative limits',
        details: violations,
      };
    }

    return {
      passed: true,
      message: `All ${activeIntents.length} active intents have conservative limits`,
    };
  });

  // 3. Verify global negative keywords are applied to all intents
  verify('Global negative keywords applied', () => {
    const requiredNegatives = ['jobs', 'vacancies', 'internship', 'careers', 'retail store'];
    const intentsWithIssues: string[] = [];

    const activeIntents = getActiveIntents();
    for (const intent of activeIntents) {
      const missing = requiredNegatives.filter(kw => 
        !intent.excludeKeywords.some(ek => ek.toLowerCase().includes(kw.toLowerCase()))
      );
      if (missing.length > 0) {
        intentsWithIssues.push(`${intent.id}: missing [${missing.join(', ')}]`);
      }
    }

    if (intentsWithIssues.length > 0) {
      return {
        passed: false,
        message: 'Some intents are missing global negative keywords',
        details: intentsWithIssues,
      };
    }

    return {
      passed: true,
      message: `Global negative keywords applied to all ${activeIntents.length} active intents`,
      details: [`Sample negatives: ${requiredNegatives.slice(0, 3).join(', ')}...`],
    };
  });

  // 4. Verify Gauteng bias is active for CCS-aligned intents
  verify('Gauteng-first bias is active', () => {
    const gautengIntents = [
      'agencies_all',
      'schools_all',
      'tenders_uniforms_merch',
      'businesses_sme_ceo_and_corporate_marketing',
      'events_exhibitions_sa',
    ];
    const issues: string[] = [];

    for (const id of gautengIntents) {
      const intent = getIntentById(id);
      if (!intent) continue;

      // Check geography config
      if (!intent.geography) {
        issues.push(`${id}: No geography config`);
        continue;
      }

      if (intent.geography.primaryCountry !== 'ZA') {
        issues.push(`${id}: Primary country is ${intent.geography.primaryCountry}, expected ZA`);
      }

      if (!intent.geography.priorityRegions || intent.geography.priorityRegions.length === 0) {
        issues.push(`${id}: No priority regions defined`);
      }

      // Check analysis config includes Gauteng boost
      const analysisConfig = getAnalysisConfigForIntent(intent);
      if (!analysisConfig.geographyBoost) {
        issues.push(`${id}: No geography boost in analysis config`);
      }
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: 'Gauteng bias not properly configured',
        details: issues,
      };
    }

    return {
      passed: true,
      message: `Gauteng-first bias active for ${gautengIntents.length} CCS-aligned intents`,
      details: [`Priority regions: ${GAUTENG_PRIORITY_REGIONS.slice(0, 5).join(', ')}...`],
    };
  });

  // 5. Verify tender intent queries include site:etenders.gov.za
  verify('Tender intent uses etenders.gov.za', () => {
    const tenderIntent = getIntentById('tenders_uniforms_merch');
    if (!tenderIntent) {
      return {
        passed: false,
        message: 'Tender intent not found',
      };
    }

    const etenderQueries = tenderIntent.seedQueries.filter(q => 
      q.toLowerCase().includes('site:etenders.gov.za')
    );

    if (etenderQueries.length === 0) {
      return {
        passed: false,
        message: 'No site:etenders.gov.za queries found',
        details: tenderIntent.seedQueries.slice(0, 3),
      };
    }

    // Check that tender-relevant terms are in the queries
    const tenderTerms = ['uniform', 'corporate clothing', 'ppe', 'promotional items', 'workwear'];
    const foundTerms = tenderTerms.filter(term => 
      etenderQueries.some(q => q.toLowerCase().includes(term.toLowerCase()))
    );

    return {
      passed: true,
      message: `${etenderQueries.length} queries use site:etenders.gov.za`,
      details: [
        `Sample queries: ${etenderQueries.slice(0, 2).join(' | ')}`,
        `Tender terms covered: ${foundTerms.join(', ')}`,
      ],
    };
  });

  // 6. Verify daily intents are configured
  verify('Daily intents configured', () => {
    const dailyIntentIds = getDailyIntentIds();
    const perIntentLimits = getDailyPerIntentLimits();

    if (dailyIntentIds.length === 0) {
      return {
        passed: false,
        message: 'No daily intents configured',
      };
    }

    // Check all daily intents exist and are active
    const issues: string[] = [];
    for (const id of dailyIntentIds) {
      const intent = getIntentById(id);
      if (!intent) {
        issues.push(`${id}: Not found`);
      } else if (!intent.active) {
        issues.push(`${id}: Inactive`);
      }
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: 'Some daily intents have issues',
        details: issues,
      };
    }

    return {
      passed: true,
      message: `${dailyIntentIds.length} daily intents configured`,
      details: [
        `Intents: ${dailyIntentIds.join(', ')}`,
        `Per-intent limits: ${perIntentLimits.maxCompanies} companies, ${perIntentLimits.maxLeads} leads, ${perIntentLimits.maxQueries} queries`,
      ],
    };
  });

  // 7. Verify tender positive keywords
  verify('Tender intent has correct positive keywords', () => {
    const tenderIntent = getIntentById('tenders_uniforms_merch');
    if (!tenderIntent) {
      return {
        passed: false,
        message: 'Tender intent not found',
      };
    }

    const requiredKeywords = ['tender', 'rfq', 'bid', 'uniform', 'ppe', 'procurement'];
    const found = requiredKeywords.filter(kw => 
      tenderIntent.includeKeywords.some(ik => ik.toLowerCase().includes(kw.toLowerCase()))
    );

    if (found.length < requiredKeywords.length / 2) {
      return {
        passed: false,
        message: 'Missing required tender keywords',
        details: [`Found: ${found.join(', ')}`, `Expected: ${requiredKeywords.join(', ')}`],
      };
    }

    return {
      passed: true,
      message: `${found.length}/${requiredKeywords.length} required tender keywords present`,
      details: [`Keywords: ${found.join(', ')}`],
    };
  });

  // 8. Verify analysis config generation
  verify('Analysis config generation works', () => {
    const issues: string[] = [];
    const intentsToCheck = [
      'agencies_all',
      'tenders_uniforms_merch',
      'businesses_sme_ceo_and_corporate_marketing',
    ];

    for (const id of intentsToCheck) {
      const intent = getIntentById(id);
      if (!intent) continue;

      const config = getAnalysisConfigForIntent(intent);

      if (!config.positiveKeywords || config.positiveKeywords.length === 0) {
        issues.push(`${id}: No positive keywords`);
      }
      if (!config.negativeKeywords || config.negativeKeywords.length === 0) {
        issues.push(`${id}: No negative keywords`);
      }
      if (!config.targetBusinessTypes || config.targetBusinessTypes.length === 0) {
        issues.push(`${id}: No target business types`);
      }
      if (config.relevanceThreshold === undefined) {
        issues.push(`${id}: No relevance threshold`);
      }
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: 'Analysis config generation has issues',
        details: issues,
      };
    }

    return {
      passed: true,
      message: `Analysis config generates correctly for ${intentsToCheck.length} intents`,
    };
  });

  // Print results
  console.log('═'.repeat(70));
  console.log('VERIFICATION RESULTS');
  console.log('═'.repeat(70));

  let passedCount = 0;
  let failedCount = 0;

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`\n${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      result.details.forEach(d => console.log(`   → ${d}`));
    }

    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log(`\n   Passed: ${passedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Total:  ${results.length}`);

  if (failedCount > 0) {
    console.log('\n❌ VERIFICATION FAILED - Please fix the issues above before deploying.\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL VERIFICATIONS PASSED - Discovery intents are correctly configured.\n');
    process.exit(0);
  }
}

main();
