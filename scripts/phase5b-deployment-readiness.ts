/**
 * Phase 5B Deployment Readiness Check
 * 
 * Verifies that the system is ready for Phase 5B deployment:
 * - Environment variables are present (but never prints secrets)
 * - Prisma schema is valid
 * - Routes exist
 * - Database migrations are applied
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

const REQUIRED_ENV_VARS: EnvVar[] = [
  {
    name: "DATABASE_URL",
    required: true,
    description: "PostgreSQL database connection string",
  },
  {
    name: "OUTREACH_SENDING_ENABLED",
    required: false,
    description: "Enable/disable email sending (default: false)",
  },
  {
    name: "OUTREACH_EMAIL_PROVIDER",
    required: false,
    description: "Email provider: smtp|resend|sendgrid (optional if sending disabled)",
  },
  {
    name: "OUTREACH_RATE_LIMIT_DAY",
    required: false,
    description: "Max emails per day (default: 20)",
  },
  {
    name: "OUTREACH_RATE_LIMIT_HOUR",
    required: false,
    description: "Max emails per hour (default: 5)",
  },
  {
    name: "OUTREACH_RATE_LIMIT_MINUTE",
    required: false,
    description: "Max emails per minute (default: 2)",
  },
];

async function main() {
  console.log("🚀 Phase 5B Deployment Readiness Check\n");

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // Check 1: Environment variables
  console.log("Check 1: Environment variables...");
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];
    if (envVar.required && !value) {
      console.log(`  ❌ FAIL: ${envVar.name} is required but not set`);
      console.log(`     ${envVar.description}`);
      failed++;
    } else if (!envVar.required && !value) {
      console.log(`  ⚠️  WARN: ${envVar.name} is not set (optional)`);
      console.log(`     ${envVar.description}`);
      warnings++;
    } else {
      console.log(`  ✅ PASS: ${envVar.name} is set`);
      passed++;
    }
  }

  // Check 2: Prisma schema validation
  console.log("\nCheck 2: Prisma schema validation...");
  try {
    execSync("npx prisma validate", { stdio: "pipe" });
    console.log("  ✅ PASS: Prisma schema is valid");
    passed++;
  } catch {
    console.log("  ❌ FAIL: Prisma schema validation failed");
    console.log(`     Run: npx prisma validate`);
    failed++;
  }

  // Check 3: Database connection
  console.log("\nCheck 3: Database connection...");
  try {
    await prisma.$connect();
    console.log("  ✅ PASS: Database connection successful");
    passed++;
  } catch (error) {
    console.log(`  ❌ FAIL: Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }

  // Check 4: Required tables exist
  console.log("\nCheck 4: Required database tables...");
  try {
    const tables = [
      "outreach_playbooks",
      "outreach_drafts",
      "suppression_entries",
      "outbound_message_logs",
    ];

    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
        console.log(`  ✅ PASS: Table ${table} exists`);
        passed++;
      } catch {
        console.log(`  ❌ FAIL: Table ${table} does not exist or is not accessible`);
        console.log(`     Run: npx prisma migrate dev`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`  ❌ FAIL: Error checking tables: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }

  // Check 5: API routes exist
  console.log("\nCheck 5: API routes...");
  const apiRoutes = [
    "app/api/outreach/generate/route.ts",
    "app/api/outreach/playbooks/route.ts",
    "app/api/outreach/drafts/route.ts",
    "app/api/outreach/drafts/[id]/route.ts",
    "app/api/outreach/drafts/[id]/approve/route.ts",
    "app/api/outreach/send/route.ts",
  ];

  for (const route of apiRoutes) {
    const routePath = path.join(process.cwd(), route);
    if (fs.existsSync(routePath)) {
      console.log(`  ✅ PASS: ${route} exists`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${route} does not exist`);
      failed++;
    }
  }

  // Check 6: UI components exist
  console.log("\nCheck 6: UI components...");
  const uiComponents = [
    "app/dashboard/outreach/page.tsx",
    "app/dashboard/outreach/components/OutreachQueueClient.tsx",
    "app/dashboard/outreach/[id]/page.tsx",
    "app/dashboard/outreach/[id]/components/DraftEditorClient.tsx",
    "app/dashboard/leads/[id]/components/OutreachSection.tsx",
  ];

  for (const component of uiComponents) {
    const componentPath = path.join(process.cwd(), component);
    if (fs.existsSync(componentPath)) {
      console.log(`  ✅ PASS: ${component} exists`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${component} does not exist`);
      failed++;
    }
  }

  // Check 7: Playbooks are seeded
  console.log("\nCheck 7: Playbooks seeding...");
  try {
    const playbookCount = await prisma.outreachPlaybook.count({
      where: { enabled: true },
    });

    if (playbookCount >= 5) {
      console.log(`  ✅ PASS: ${playbookCount} enabled playbook(s) found`);
      passed++;
    } else {
      console.log(`  ⚠️  WARN: Only ${playbookCount} enabled playbook(s) found (expected at least 5)`);
      console.log(`     Run: npm run prisma:seed`);
      warnings++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: Error checking playbooks: ${error instanceof Error ? error.message : "Unknown error"}`);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  if (failed === 0) {
    if (warnings > 0) {
      console.log("⚠️  Deployment ready with warnings. Review warnings above.");
    } else {
      console.log("✅ System is ready for Phase 5B deployment!");
    }
  } else {
    console.log("❌ Deployment not ready. Please fix the errors above.");
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Deployment readiness check error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
