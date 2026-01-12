/**
 * Phase 5A - Deployment Readiness Checklist
 *
 * Validates that all production requirements are met:
 * 1. Environment variables are set
 * 2. Database migrations are applied
 * 3. Cron configuration exists
 * 4. Kill switch works
 * 5. API endpoints respond correctly
 *
 * Usage:
 *   npx tsx scripts/phase5a-deployment-readiness.ts
 *   npx tsx scripts/phase5a-deployment-readiness.ts --test-cron  (also tests cron endpoint)
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { loadConfig } from '../lib/discovery/runner/config';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  category: string;
  check: string;
  passed: boolean;
  details: string;
  critical: boolean;
}

const checks: CheckResult[] = [];

function check(category: string, name: string, passed: boolean, details: string, critical = true) {
  checks.push({ category, check: name, passed, details, critical });
  const icon = passed ? '✅' : (critical ? '❌' : '⚠️');
  console.log(`  ${icon} ${name}`);
  if (!passed) console.log(`     → ${details}`);
}

async function main() {
  const args = process.argv.slice(2);
  const testCron = args.includes('--test-cron');

  console.log('\n' + '═'.repeat(70));
  console.log('  🚀 PHASE 5A DEPLOYMENT READINESS CHECKLIST');
  console.log('═'.repeat(70) + '\n');

  // ─────────────────────────────────────────────────────────────────────
  // 1. ENVIRONMENT VARIABLES
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 1. Environment Variables\n');

  const requiredEnvVars = [
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string' },
    { name: 'NEXTAUTH_SECRET', description: 'NextAuth.js secret key' },
    { name: 'NEXTAUTH_URL', description: 'Application URL' },
  ];

  const discoveryEnvVars = [
    { name: 'DISCOVERY_RUNNER_ENABLED', description: 'Kill switch (true/false)' },
    { name: 'CRON_JOB_SECRET', description: 'Secret for cron endpoint auth' },
    { name: 'GOOGLE_CSE_API_KEY', description: 'Google Custom Search API key' },
    { name: 'GOOGLE_CSE_ID', description: 'Google Custom Search Engine ID' },
  ];

  console.log('  Core Variables:');
  for (const { name, description } of requiredEnvVars) {
    const value = process.env[name];
    const exists = value !== undefined && value !== '';
    check('env', name, exists, `${description} - NOT SET`, true);
  }

  console.log('\n  Discovery Variables:');
  for (const { name, description } of discoveryEnvVars) {
    const value = process.env[name];
    const exists = value !== undefined && value !== '';
    check('env-discovery', name, exists, `${description} - NOT SET`, true);
  }

  // Special check for DISCOVERY_RUNNER_ENABLED value
  const runnerEnabled = process.env.DISCOVERY_RUNNER_ENABLED === 'true';
  console.log(`\n  Kill Switch Status: ${runnerEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 2. DATABASE
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 2. Database\n');

  try {
    // Check connection
    await prisma.$queryRaw`SELECT 1`;
    check('db', 'Database connection', true, 'Connected successfully');

    // Check DiscoveryRun table exists
    const runCount = await prisma.discoveryRun.count();
    check('db', 'DiscoveryRun table exists', true, `${runCount} records found`);

    // Check Company table exists
    const companyCount = await prisma.company.count();
    check('db', 'Company table exists', true, `${companyCount} records found`);

    // Check Lead table exists
    const leadCount = await prisma.lead.count();
    check('db', 'Lead table exists', true, `${leadCount} records found`);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    check('db', 'Database connection', false, `Connection failed: ${msg}`);
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 3. CRON CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 3. Cron Configuration\n');

  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  
  try {
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
    check('cron', 'vercel.json exists', true, 'File found');

    const hasCrons = vercelJson.crons && Array.isArray(vercelJson.crons);
    check('cron', 'Cron configuration exists', hasCrons, 'crons array not found in vercel.json');

    if (hasCrons) {
      const discoveryCron = vercelJson.crons.find(
        (c: { path: string }) => c.path === '/api/jobs/discovery/run'
      );
      check('cron', 'Discovery cron job configured', !!discoveryCron, 'Discovery cron not found');

      if (discoveryCron) {
        console.log(`     Schedule: ${discoveryCron.schedule}`);
        console.log(`     Path: ${discoveryCron.path}`);
      }
    }
  } catch (error) {
    check('cron', 'vercel.json exists', false, 'File not found or invalid JSON');
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 4. API ROUTES
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 4. API Routes\n');

  const apiRoutesDir = path.join(process.cwd(), 'app', 'api');

  // Check discovery API routes exist
  const discoveryRoutes = [
    'discovery/manual/run/route.ts',
    'jobs/route.ts',
  ];

  for (const route of discoveryRoutes) {
    const routePath = path.join(apiRoutesDir, route);
    const exists = fs.existsSync(routePath);
    check('api', `Route: /api/${route.replace('/route.ts', '')}`, exists, `File not found: ${routePath}`, false);
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 5. KILL SWITCH TEST
  // ─────────────────────────────────────────────────────────────────────
  console.log('📋 5. Kill Switch Test\n');

  const config = loadConfig();
  check('killswitch', 'Config loads correctly', config !== null, 'loadConfig() returned null');
  check(
    'killswitch',
    'Kill switch reflects env var',
    config.enabled === runnerEnabled,
    `Config says ${config.enabled}, env says ${runnerEnabled}`
  );

  console.log('');

  // ─────────────────────────────────────────────────────────────────────
  // 6. CRON ENDPOINT TEST (optional)
  // ─────────────────────────────────────────────────────────────────────
  if (testCron) {
    console.log('📋 6. Cron Endpoint Test\n');

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const secret = process.env.CRON_JOB_SECRET;

    if (!secret) {
      check('cron-test', 'CRON_JOB_SECRET available', false, 'Cannot test without secret');
    } else {
      try {
        console.log(`  Testing: POST ${baseUrl}/api/jobs/discovery/run`);
        
        const response = await fetch(`${baseUrl}/api/jobs/discovery/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-job-secret': secret,
          },
          body: JSON.stringify({
            dryRun: true,
            mode: 'test',
            maxCompanies: 1,
          }),
        });

        const data = await response.json();

        check(
          'cron-test',
          'Cron endpoint responds',
          response.ok || response.status === 403,
          `Status: ${response.status}`
        );

        if (response.status === 403 && data.error?.includes('disabled')) {
          console.log('  ℹ️  Runner is disabled (kill switch is off)');
          check('cron-test', 'Kill switch works', true, 'Runner correctly reports disabled');
        } else if (response.ok) {
          console.log(`  ℹ️  Run ID: ${data.runId}`);
          check('cron-test', 'Dry run completed', data.success, `Status: ${data.status}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        check('cron-test', 'Cron endpoint responds', false, `Request failed: ${msg}`);
      }
    }

    console.log('');
  }

  // ─────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────
  console.log('═'.repeat(70));
  console.log('  📊 DEPLOYMENT READINESS SUMMARY');
  console.log('═'.repeat(70) + '\n');

  const criticalPassed = checks.filter(c => c.critical && c.passed).length;
  const criticalFailed = checks.filter(c => c.critical && !c.passed).length;
  const warningCount = checks.filter(c => !c.critical && !c.passed).length;
  const totalCritical = checks.filter(c => c.critical).length;

  console.log(`  Critical Checks: ${criticalPassed}/${totalCritical} passed`);
  console.log(`  Warnings: ${warningCount}`);
  console.log('');

  // Group by category
  const categories = [...new Set(checks.map(c => c.category))];
  for (const cat of categories) {
    const catChecks = checks.filter(c => c.category === cat);
    const catPassed = catChecks.filter(c => c.passed).length;
    const catTotal = catChecks.length;
    const status = catPassed === catTotal ? '✅' : '❌';
    console.log(`  ${status} ${cat}: ${catPassed}/${catTotal}`);
  }

  console.log('');

  // Failed checks detail
  if (criticalFailed > 0) {
    console.log('  ❌ CRITICAL FAILURES:');
    checks.filter(c => c.critical && !c.passed).forEach(c => {
      console.log(`     - [${c.category}] ${c.check}: ${c.details}`);
    });
    console.log('');
  }

  const ready = criticalFailed === 0;
  console.log('═'.repeat(70));
  console.log(`  🏁 DEPLOYMENT STATUS: ${ready ? '✅ READY' : '❌ NOT READY'}`);
  if (!ready) {
    console.log('     Fix critical failures before deploying to production');
  }
  console.log('═'.repeat(70) + '\n');

  // Generate report file
  const report = {
    timestamp: new Date().toISOString(),
    ready,
    summary: {
      criticalPassed,
      criticalFailed,
      warningCount,
    },
    checks,
    environment: {
      DISCOVERY_RUNNER_ENABLED: runnerEnabled,
      nodeVersion: process.version,
    },
  };

  const reportPath = path.join(process.cwd(), 'PHASE_5A_READINESS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  📄 Report saved to: ${reportPath}\n`);

  await prisma.$disconnect();
  process.exit(criticalFailed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
