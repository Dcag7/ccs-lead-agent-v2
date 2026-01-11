/**
 * Release Gate: Database Verification Script
 * 
 * Verifies that key database tables exist and are accessible.
 * This is a non-destructive read-only check.
 */

import { prisma } from '../lib/prisma';

type CheckResult = { table: string; status: 'PASS' | 'FAIL'; error?: string; count?: number };

async function checkTable(
  name: string,
  countFn: () => Promise<number>,
  results: CheckResult[]
): Promise<void> {
  try {
    const count = await countFn();
    results.push({ table: name, status: 'PASS', count });
    console.log(`✅ ${name}: Accessible (${count} records)`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.push({ table: name, status: 'FAIL', error: errorMsg });
    console.error(`❌ ${name}: FAILED - ${errorMsg}`);
  }
}

async function checkDatabase() {
  console.log('🔍 Release Gate: Database Verification\n');

  const results: CheckResult[] = [];

  // Check key tables - each checked explicitly for type safety
  await checkTable('users', () => prisma.user.count(), results);
  await checkTable('companies', () => prisma.company.count(), results);
  await checkTable('contacts', () => prisma.contact.count(), results);
  await checkTable('leads', () => prisma.lead.count(), results);
  await checkTable('lead_notes', () => prisma.leadNote.count(), results);
  await checkTable('import_jobs', () => prisma.importJob.count(), results);

  // Check Phase 4 specific: Lead assignedToId relationship
  try {
    const leadsWithOwner = await prisma.lead.count({
      where: { assignedToId: { not: null } },
    });
    const totalLeads = await prisma.lead.count();
    console.log(`✅ Lead ownership: ${leadsWithOwner}/${totalLeads} leads have owners`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Lead ownership check: FAILED - ${errorMsg}`);
  }

  // Summary
  console.log('\n📊 Summary:');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.error('\n❌ Database check FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ Database check PASSED');
    process.exit(0);
  }
}

checkDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
