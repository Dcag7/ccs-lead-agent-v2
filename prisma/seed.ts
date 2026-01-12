
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedPlaybooksByName } from "../lib/outreach/playbooks";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash password with bcryptjs (same as what NextAuth uses)
  const hashedPassword = await bcrypt.hash("Dcs_BD7@", 10);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "dumi@ccsapparel.africa" },
    update: {
      password: hashedPassword,
      name: "Dumi",
      role: "admin"
    },
    create: {
      email: "dumi@ccsapparel.africa",
      password: hashedPassword,
      name: "Dumi",
      role: "admin"
    }
  });

  console.log("✅ Admin user created/updated:", adminUser.email);

  // Create a test user
  const testHashedPassword = await bcrypt.hash("Test123!", 10);
  const testUser = await prisma.user.upsert({
    where: { email: "test@ccsapparel.africa" },
    update: {
      password: testHashedPassword,
      name: "Test User",
      role: "user"
    },
    create: {
      email: "test@ccsapparel.africa",
      password: testHashedPassword,
      name: "Test User",
      role: "user"
    }
  });

  console.log("✅ Test user created/updated:", testUser.email);

  // Phase 5B: Seed outreach playbooks
  await seedPlaybooksByName(prisma);

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
