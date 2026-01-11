/**
 * Release Gate: Database Verification Script
 * 
 * Verifies that key database tables exist and are accessible.
 * This is a non-destructive read-only check.
 */

import { prisma } from '../lib/prisma';

async function checkDatabase() {
  console.log('🔍 Release Gate: Database Verification\n');

  const results: { table: string; status: 'PASS' | 'FAIL'; error?: string; count?: number }[] = [];

  // Check key tables
  const tables = [
    { name: 'users', model: prisma.user },
    { name: 'companies', model: prisma.company },
    { name: 'contacts', model: prisma.contact },
    { name: 'leads', model: prisma.lead },
    { name: 'lead_notes', model: prisma.leadNote },
    { name: 'import_jobs', model: prisma.importJob },
  ];

  for (const { name, model } of tables) {
    try {
      // Use count() as a safe, non-destructive check
      const count = await model.count();
      results.push({ table: name, status: 'PASS', count });
      console.log(`✅ ${name}: Accessible (${count} records)`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push({ table: name, status: 'FAIL', error: errorMsg });
      console.error(`❌ ${name}: FAILED - ${errorMsg}`);
    }
  }

  // Check Phase 4 specific: LeadNote model
  try {
    const leadNotesCount = await prisma.leadNote.count();
    console.log(`✅ lead_notes: Accessible (${leadNotesCount} records)`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ lead_notes: FAILED - ${errorMsg}`);
    results.push({ table: 'lead_notes', status: 'FAIL', error: errorMsg });
  }

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
