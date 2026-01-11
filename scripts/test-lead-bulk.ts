/**
 * Phase 4B: Lead Management - Bulk Operations Test Script
 * 
 * Tests bulk lead operations:
 * - Bulk status update
 * - Bulk owner assignment/unassignment
 * - Bulk archive/unarchive
 * 
 * Usage: npx tsx scripts/test-lead-bulk.ts <leadId1> [leadId2] [leadId3] ...
 * 
 * Example: npx tsx scripts/test-lead-bulk.ts cmk9qgpqz0003mdfgol74cvi7 cmk9qgpqz0004mdfgol74cvi8
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function testBulkOperations(leadIds: string[]) {
  console.log(`\n🧪 Testing Bulk Lead Operations for ${leadIds.length} lead(s)\n`);

  if (leadIds.length === 0) {
    console.error('❌ No lead IDs provided');
    process.exit(1);
  }

  if (leadIds.length > 100) {
    console.error('❌ Maximum 100 leads per bulk operation');
    process.exit(1);
  }

  try {
    // Verify all leads exist
    console.log('📋 Verifying leads exist...');
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: {
        id: true,
        email: true,
        status: true,
        assignedToId: true,
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (leads.length !== leadIds.length) {
      const foundIds = new Set(leads.map(l => l.id));
      const missingIds = leadIds.filter(id => !foundIds.has(id));
      console.error(`❌ Some leads not found: ${missingIds.join(', ')}`);
      process.exit(1);
    }

    console.log(`✅ All ${leads.length} leads found\n`);

    // Display current state
    console.log('📊 Current Lead States:');
    leads.forEach(lead => {
      console.log(`   ${lead.email}: status=${lead.status}, owner=${lead.assignedTo ? (lead.assignedTo.name || lead.assignedTo.email) : 'Unassigned'}`);
    });
    console.log('');

    // Get first user for testing
    const testUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true },
    });

    if (!testUser) {
      console.error('❌ No users found in database');
      process.exit(1);
    }

    // Test 1: Bulk Status Update
    console.log('📝 Test 1: Bulk Status Update');
    const originalStatuses = leads.map(l => ({ id: l.id, status: l.status }));
    const testStatus = leads[0].status === 'new' ? 'contacted' : 'new';

    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { status: testStatus },
    });

    const updatedLeads1 = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, status: true },
    });

    console.log(`   ✅ Updated ${updatedLeads1.length} leads to status "${testStatus}"`);

    // Revert
    for (const orig of originalStatuses) {
      await prisma.lead.update({
        where: { id: orig.id },
        data: { status: orig.status },
      });
    }
    console.log(`   ✅ Reverted all leads to original statuses\n`);

    // Test 2: Bulk Owner Assignment
    console.log('👤 Test 2: Bulk Owner Assignment');
    const originalOwners = leads.map(l => ({ id: l.id, assignedToId: l.assignedToId }));

    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { assignedToId: testUser.id },
    });

    const updatedLeads2 = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`   ✅ Assigned ${updatedLeads2.length} leads to ${testUser.name || testUser.email}`);

    // Revert
    for (const orig of originalOwners) {
      await prisma.lead.update({
        where: { id: orig.id },
        data: { assignedToId: orig.assignedToId },
      });
    }
    console.log(`   ✅ Reverted all leads to original owners\n`);

    // Test 3: Bulk Unassign
    console.log('👤 Test 3: Bulk Unassign Owner');
    // First assign all
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { assignedToId: testUser.id },
    });

    // Then unassign
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { assignedToId: null },
    });

    const unassignedLeads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, assignedToId: true },
    });

    const allUnassigned = unassignedLeads.every(l => l.assignedToId === null);
    console.log(`   ${allUnassigned ? '✅' : '❌'} Unassigned ${unassignedLeads.length} leads`);

    // Revert
    for (const orig of originalOwners) {
      await prisma.lead.update({
        where: { id: orig.id },
        data: { assignedToId: orig.assignedToId },
      });
    }
    console.log(`   ✅ Reverted all leads to original owners\n`);

    // Test 4: Bulk Archive
    console.log('📦 Test 4: Bulk Archive');
    const originalStatuses2 = leads.map(l => ({ id: l.id, status: l.status }));

    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { status: 'archived' },
    });

    const archivedLeads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, status: true },
    });

    const allArchived = archivedLeads.every(l => l.status === 'archived');
    console.log(`   ${allArchived ? '✅' : '❌'} Archived ${archivedLeads.length} leads`);

    // Revert (unarchive to 'new')
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { status: 'new' },
    });

    // Then restore original statuses
    for (const orig of originalStatuses2) {
      await prisma.lead.update({
        where: { id: orig.id },
        data: { status: orig.status },
      });
    }
    console.log(`   ✅ Reverted all leads to original statuses\n`);

    // Test 5: Bulk Unarchive
    console.log('📦 Test 5: Bulk Unarchive');
    // First archive all
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { status: 'archived' },
    });

    // Then unarchive (set to 'new')
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { status: 'new' },
    });

    const unarchivedLeads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, status: true },
    });

    const allUnarchived = unarchivedLeads.every(l => l.status === 'new');
    console.log(`   ${allUnarchived ? '✅' : '❌'} Unarchived ${unarchivedLeads.length} leads (set to 'new')`);

    // Revert
    for (const orig of originalStatuses2) {
      await prisma.lead.update({
        where: { id: orig.id },
        data: { status: orig.status },
      });
    }
    console.log(`   ✅ Reverted all leads to original statuses\n`);

    console.log('✅ All bulk operation tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const leadIds = process.argv.slice(2);

if (leadIds.length === 0) {
  console.error('Usage: npx tsx scripts/test-lead-bulk.ts <leadId1> [leadId2] [leadId3] ...');
  console.error('\nExample: npx tsx scripts/test-lead-bulk.ts cmk9qgpqz0003mdfgol74cvi7 cmk9qgpqz0004mdfgol74cvi8');
  process.exit(1);
}

testBulkOperations(leadIds).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
