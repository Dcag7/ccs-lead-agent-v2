import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// IMPORTANT: This endpoint should be protected or removed in production
// For now, we'll add a simple secret key check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;

    // Simple protection - only run if secret matches
    // This prevents unauthorized password resets
    if (secret !== process.env.ADMIN_RESET_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔧 Starting admin user reset...");

    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected");

    // Check if admin user exists
    const adminEmail = "dumi@ccsapparel.africa";
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    console.log(
      existingUser
        ? `✅ Admin user found: ${existingUser.email}`
        : "⚠️  Admin user not found, will create"
    );

    // Hash the password
    const password = "Dcs_BD7@";
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed");

    // Upsert the admin user
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        name: "Dumi",
        role: "admin"
      },
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: "Dumi",
        role: "admin"
      }
    });

    console.log("✅ Admin user upserted:", adminUser.email);

    // Verify the password works
    const isValid = await bcrypt.compare(password, adminUser.password);
    console.log("✅ Password verification:", isValid ? "PASS" : "FAIL");

    // Get all users count
    const userCount = await prisma.user.count();

    return NextResponse.json({
      success: true,
      message: "Admin user reset successfully",
      data: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        passwordVerified: isValid,
        totalUsers: userCount
      }
    });
  } catch (error) {
    console.error("❌ Error resetting admin user:", error);
    
    return NextResponse.json(
      {
        error: "Failed to reset admin user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to check database status (without requiring secret)
export async function GET() {
  try {
    await prisma.$connect();
    
    const adminEmail = "dumi@ccsapparel.africa";
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    const userCount = await prisma.user.count();

    return NextResponse.json({
      success: true,
      databaseConnected: true,
      adminUserExists: !!adminUser,
      adminUser: adminUser || null,
      totalUsers: userCount
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        databaseConnected: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
