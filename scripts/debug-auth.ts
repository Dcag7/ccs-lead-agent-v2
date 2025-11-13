import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function debugAuth() {
  console.log("===========================================");
  console.log("🔍 CCS Lead Agent - Authentication Diagnostics");
  console.log("===========================================\n");

  try {
    // Test 1: Database Connection
    console.log("Test 1: Database Connection");
    console.log("----------------------------");
    await prisma.$connect();
    console.log("✅ Database connection successful\n");

    // Test 2: Check if admin user exists
    console.log("Test 2: Check Admin User");
    console.log("----------------------------");
    const adminEmail = "dumi@ccsapparel.africa";
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (adminUser) {
      console.log("✅ Admin user found in database");
      console.log("   Email:", adminUser.email);
      console.log("   Name:", adminUser.name);
      console.log("   Role:", adminUser.role);
      console.log("   Password Hash:", adminUser.password.substring(0, 20) + "...");
    } else {
      console.log("❌ Admin user NOT found in database");
      console.log("   This is the problem! User needs to be created.\n");
    }

    // Test 3: Test password hashing
    console.log("\nTest 3: Password Hash Verification");
    console.log("----------------------------");
    const testPassword = "Dcs_BD7@";
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log("New hash generated:", newHash.substring(0, 20) + "...");
    
    if (adminUser) {
      const isMatch = await bcrypt.compare(testPassword, adminUser.password);
      console.log("Password match test:", isMatch ? "✅ PASS" : "❌ FAIL");
      
      if (!isMatch) {
        console.log("\n⚠️  PASSWORD MISMATCH DETECTED!");
        console.log("The password hash in the database doesn't match the expected password.");
        console.log("This is why login is failing.\n");
      }
    }

    // Test 4: List all users
    console.log("\nTest 4: All Users in Database");
    console.log("----------------------------");
    const allUsers = await prisma.user.findMany();
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role})`);
    });

    // Fix: Recreate admin user with correct password
    console.log("\n\n===========================================");
    console.log("🔧 FIXING AUTHENTICATION");
    console.log("===========================================\n");
    
    const correctPassword = "Dcs_BD7@";
    const correctHash = await bcrypt.hash(correctPassword, 10);
    
    const fixedUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: correctHash,
        name: "Dumi",
        role: "admin"
      },
      create: {
        email: adminEmail,
        password: correctHash,
        name: "Dumi",
        role: "admin"
      }
    });

    console.log("✅ Admin user created/updated successfully!");
    console.log("   Email:", fixedUser.email);
    console.log("   Password: Dcs_BD7@");
    console.log("   Role:", fixedUser.role);

    // Verify the fix worked
    console.log("\nVerifying fix...");
    const verifyMatch = await bcrypt.compare(correctPassword, fixedUser.password);
    console.log("Password verification:", verifyMatch ? "✅ SUCCESS" : "❌ FAILED");

    if (verifyMatch) {
      console.log("\n\n===========================================");
      console.log("🎉 AUTHENTICATION FIXED!");
      console.log("===========================================");
      console.log("\nYou can now login with:");
      console.log("  Email: dumi@ccsapparel.africa");
      console.log("  Password: Dcs_BD7@");
      console.log("\n✨ Please try logging in again on Vercel.");
      console.log("===========================================\n");
    }

  } catch (error) {
    console.error("\n❌ ERROR OCCURRED:");
    console.error(error);
    
    if (error instanceof Error) {
      if (error.message.includes("Can't reach database server")) {
        console.log("\n⚠️  DATABASE CONNECTION ERROR");
        console.log("Please check:");
        console.log("  1. DATABASE_URL environment variable is set correctly");
        console.log("  2. Neon database is running and accessible");
        console.log("  3. Network connection is working");
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();
