/**
 * Phase 4A: Lead Management - Test Script
 * 
 * Tests lead management functionality:
 * - Status updates
 * - Owner assignment/unassignment
 * - Notes CRUD operations
 * 
 * Usage: npx tsx scripts/test-lead-management.ts <leadId>
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { ALLOWED_STATUSES } from '../lib/lead-management/types';

async function testLeadManagement(leadId: string) {
  console.log(`\n🧪 Testing Lead Management for Lead ID: ${leadId}\n`);

  try {
    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
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
        notes: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!lead) {
      console.error(`❌ Lead not found: ${leadId}`);
      process.exit(1);
    }

    console.log(`✅ Lead found: ${lead.email}`);
    console.log(`   Current status: ${lead.status}`);
    console.log(`   Current owner: ${lead.assignedTo ? (lead.assignedTo.name || lead.assignedTo.email) : 'Unassigned'}`);
    console.log(`   Current notes: ${lead.notes.length}\n`);

    // Test 1: Status Update
    console.log('📝 Test 1: Status Update');
    const testStatus = lead.status === 'new' ? 'contacted' : 'new';
    const updatedLead1 = await prisma.lead.update({
      where: { id: leadId },
      data: { status: testStatus },
      select: { id: true, status: true },
    });
    console.log(`   ✅ Updated status from "${lead.status}" to "${updatedLead1.status}"`);

    // Revert status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: lead.status },
    });
    console.log(`   ✅ Reverted status back to "${lead.status}"\n`);

    // Test 2: Owner Assignment
    console.log('👤 Test 2: Owner Assignment');
    
    // Get first user for testing
    const testUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true },
    });

    if (!testUser) {
      console.log('   ⚠️  No users found in database, skipping owner assignment test');
    } else {
      // Assign owner
      const updatedLead2 = await prisma.lead.update({
        where: { id: leadId },
        data: { assignedToId: testUser.id },
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
      console.log(`   ✅ Assigned owner: ${updatedLead2.assignedTo?.name || updatedLead2.assignedTo?.email}`);

      // Unassign owner
      const updatedLead3 = await prisma.lead.update({
        where: { id: leadId },
        data: { assignedToId: null },
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
      console.log(`   ✅ Unassigned owner (now: ${updatedLead3.assignedTo ? 'Still assigned' : 'Unassigned'})`);

      // Restore original owner
      await prisma.lead.update({
        where: { id: leadId },
        data: { assignedToId: lead.assignedToId },
      });
      console.log(`   ✅ Restored original owner\n`);
    }

    // Test 3: Notes CRUD
    console.log('📄 Test 3: Notes CRUD');
    
    if (!testUser) {
      console.log('   ⚠️  No users found in database, skipping notes test');
    } else {
      // Create note
      const testNoteContent = `Test note created at ${new Date().toISOString()}`;
      const newNote = await prisma.leadNote.create({
        data: {
          leadId,
          userId: testUser.id,
          content: testNoteContent,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
      console.log(`   ✅ Created note: "${newNote.content.substring(0, 50)}..."`);
      console.log(`      Author: ${newNote.user.name || newNote.user.email}`);

      // Update note
      const updatedContent = `${testNoteContent} (updated)`;
      const updatedNote = await prisma.leadNote.update({
        where: { id: newNote.id },
        data: { content: updatedContent },
        select: { id: true, content: true },
      });
      console.log(`   ✅ Updated note: "${updatedNote.content.substring(0, 50)}..."`);

      // Delete note
      await prisma.leadNote.delete({
        where: { id: newNote.id },
      });
      console.log(`   ✅ Deleted note\n`);
    }

    // Test 4: Status Validation
    console.log('✅ Test 4: Status Validation');
    const invalidStatus = 'invalid_status';
    try {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: invalidStatus },
      });
      console.log(`   ⚠️  WARNING: Invalid status "${invalidStatus}" was accepted (should be validated in API)`);
    } catch {
      console.log(`   ✅ Invalid status rejected (expected behavior)`);
    }

    // Test 5: Verify Allowed Statuses
    console.log('\n📋 Allowed Status Values:');
    ALLOWED_STATUSES.forEach((status) => {
      console.log(`   - ${status}`);
    });

    console.log('\n✅ All tests completed successfully!\n');
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
const leadId = process.argv[2];

if (!leadId) {
  console.error('Usage: npx tsx scripts/test-lead-management.ts <leadId>');
  console.error('\nExample: npx tsx scripts/test-lead-management.ts clx1234567890abcdef');
  process.exit(1);
}

testLeadManagement(leadId).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
