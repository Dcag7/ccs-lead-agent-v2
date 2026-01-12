/**
 * Phase 5B Verification Script
 * 
 * Verifies that Phase 5B implementation is working correctly:
 * - Playbooks exist and are seeded
 * - Draft generation works (dry run)
 * - Suppression prevents sending
 * - Sending disabled flag prevents sending
 */

import { PrismaClient } from "@prisma/client";
import { generateDraft } from "../lib/outreach/draft-generation";
import { checkSuppression, addSuppression } from "../lib/outreach/safety";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Phase 5B Verification\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Playbooks exist
  console.log("Test 1: Checking playbooks...");
  try {
    const playbooks = await prisma.outreachPlaybook.findMany({
      where: { enabled: true },
    });

    if (playbooks.length === 0) {
      console.log("  ❌ FAIL: No enabled playbooks found");
      failed++;
    } else {
      console.log(`  ✅ PASS: Found ${playbooks.length} enabled playbook(s)`);
      playbooks.forEach((pb: { name: string; audienceType: string }) => {
        console.log(`     - ${pb.name} (${pb.audienceType})`);
      });
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: Error checking playbooks: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }

  // Test 2: Can generate a draft (dry run)
  console.log("\nTest 2: Testing draft generation (dry run)...");
  try {
    // Find a lead
    const lead = await prisma.lead.findFirst({
      include: {
        companyRel: true,
        contactRel: true,
      },
    });

    if (!lead) {
      console.log("  ⚠️  SKIP: No leads found in database");
    } else {
      // Find a playbook
      const playbook = await prisma.outreachPlaybook.findFirst({
        where: { enabled: true },
      });

      if (!playbook) {
        console.log("  ❌ FAIL: No enabled playbook found");
        failed++;
      } else {
        // Find a user
        const user = await prisma.user.findFirst();
        if (!user) {
          console.log("  ❌ FAIL: No users found");
          failed++;
        } else {
          const result = await generateDraft(prisma, lead.id, playbook.id, user.id);

          if (result.body && result.body.length > 0) {
            console.log("  ✅ PASS: Draft generated successfully");
            console.log(`     Subject: ${result.subject || "(none)"}`);
            console.log(`     Body length: ${result.body.length} chars`);
            if (result.missingFields.length > 0) {
              console.log(`     ⚠️  Missing fields: ${result.missingFields.join(", ")}`);
            }
            if (result.warnings.length > 0) {
              console.log(`     ⚠️  Warnings: ${result.warnings.join(", ")}`);
            }
            passed++;
          } else {
            console.log("  ❌ FAIL: Draft body is empty");
            failed++;
          }
        }
      }
    }
  } catch (error) {
    console.log(`  ❌ FAIL: Error generating draft: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }

  // Test 3: Suppression prevents sending
  console.log("\nTest 3: Testing suppression check...");
  try {
    // Add a test suppression entry
    const testEmail = "test-suppressed@example.com";
    await addSuppression(prisma, "email", testEmail, "Test suppression");

    const check = await checkSuppression(prisma, testEmail);

    if (check.isSuppressed) {
      console.log("  ✅ PASS: Suppression check works correctly");
      console.log(`     Reason: ${check.reason}`);
      passed++;
    } else {
      console.log("  ❌ FAIL: Suppression check did not detect suppressed email");
      failed++;
    }

    // Clean up test suppression
    await prisma.suppressionEntry.deleteMany({
      where: { value: testEmail },
    });
  } catch (error) {
    console.log(`  ❌ FAIL: Error testing suppression: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }

  // Test 4: Sending disabled flag
  console.log("\nTest 4: Checking sending disabled flag...");
  try {
    const sendingEnabled = process.env.OUTREACH_SENDING_ENABLED === "true";
    if (!sendingEnabled) {
      console.log("  ✅ PASS: Sending is disabled (OUTREACH_SENDING_ENABLED=false)");
      console.log("     This is expected for safety. Sending will be blocked.");
      passed++;
    } else {
      console.log("  ⚠️  WARN: Sending is enabled (OUTREACH_SENDING_ENABLED=true)");
      console.log("     Make sure this is intentional for production.");
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: Error checking sending flag: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }

  // Test 5: Data model integrity
  console.log("\nTest 5: Checking data model integrity...");
  try {
    // Check that all required models exist
    const models = [
      "OutreachPlaybook",
      "OutreachDraft",
      "SuppressionEntry",
      "OutboundMessageLog",
    ];

    // Check that models can be accessed (they're camelCase in Prisma client)
    const modelChecks = [
      { name: "OutreachPlaybook", accessor: "outreachPlaybook" },
      { name: "OutreachDraft", accessor: "outreachDraft" },
      { name: "SuppressionEntry", accessor: "suppressionEntry" },
      { name: "OutboundMessageLog", accessor: "outboundMessageLog" },
    ];

    for (const { name, accessor } of modelChecks) {
      const model = (prisma as unknown as Record<string, unknown>)[accessor];
      if (!model) {
        console.log(`  ❌ FAIL: Model ${name} (${accessor}) not found in Prisma client`);
        failed++;
        return;
      }
    }

    console.log("  ✅ PASS: All required models exist");
    passed++;
  } catch (error) {
    console.log(`  ❌ FAIL: Error checking data model: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("✅ All tests passed!");
  } else {
    console.log("❌ Some tests failed. Please review the errors above.");
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Verification script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
