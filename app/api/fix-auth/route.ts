import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

interface FixAuthStep {
  step: number;
  action: string;
  status: string;
  message?: string;
  error?: string;
  count?: number;
  users?: Array<{ id: string; email: string; name: string | null; role: string; createdAt: Date }>;
}

interface FixAuthResults {
  timestamp: string;
  steps: FixAuthStep[];
  success: boolean;
}

export async function GET() {
  try {
    const results: FixAuthResults = {
      timestamp: new Date().toISOString(),
      steps: [],
      success: false,
    };

    // Step 1: Test database connection
    results.steps.push({
      step: 1,
      action: 'Testing database connection',
      status: 'attempting',
    });

    try {
      // Test connection by running a simple query
      await prisma.user.count();
      results.steps[0].status = 'success';
      results.steps[0].message = 'Database connected successfully';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.steps[0].status = 'failed';
      results.steps[0].error = errorMessage;
      return NextResponse.json(results, { status: 500 });
    }

    // Step 2: Check current users
    results.steps.push({
      step: 2,
      action: 'Checking existing users',
      status: 'attempting',
    });

    try {
      const existingUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      results.steps[1].status = 'success';
      results.steps[1].count = existingUsers.length;
      results.steps[1].users = existingUsers;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.steps[1].status = 'failed';
      results.steps[1].error = errorMessage;
      return NextResponse.json(results, { status: 500 });
    }

    // Step 3: Create/Update admin user
    results.steps.push({
      step: 3,
      action: 'Creating/Updating admin user',
      status: 'attempting',
    });

    const adminEmail = 'dumi@ccsapparel.africa';
    const adminPassword = 'Dcs_BD7@';

    try {
      // Hash the password using bcryptjs with 10 rounds
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Upsert the admin user
      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          password: hashedPassword,
          name: 'Dumi',
          role: 'admin',
        },
        create: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Dumi',
          role: 'admin',
        },
      });

      results.steps[2].status = 'success';
      results.steps[2].message = 'Admin user created/updated successfully';
      results.steps[2].userId = adminUser.id;
      results.steps[2].email = adminUser.email;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.steps[2].status = 'failed';
      results.steps[2].error = errorMessage;
      return NextResponse.json(results, { status: 500 });
    }

    // Step 4: Verify password hash
    results.steps.push({
      step: 4,
      action: 'Verifying password hash',
      status: 'attempting',
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (user) {
        const passwordMatch = await bcrypt.compare(adminPassword, user.password);
        results.steps[3].status = 'success';
        results.steps[3].passwordMatch = passwordMatch;
        results.steps[3].message = passwordMatch
          ? 'Password verification successful! You can now login.'
          : 'WARNING: Password verification failed!';
      } else {
        results.steps[3].status = 'failed';
        results.steps[3].message = 'User not found after creation';
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.steps[3].status = 'failed';
      results.steps[3].error = errorMessage;
      return NextResponse.json(results, { status: 500 });
    }

    // Final success
    results.success = true;
    results.message = '✅ Database seeded successfully! You can now login with: dumi@ccsapparel.africa / Dcs_BD7@';
    results.nextSteps = [
      '1. Go to your app homepage',
      '2. Click "Sign In"',
      '3. Login with: dumi@ccsapparel.africa / Dcs_BD7@',
      '4. After successful login, DELETE this /app/api/fix-auth folder for security',
    ];

    return NextResponse.json(results, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error occurred',
        message: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  } finally {
    // Don't disconnect in serverless - Prisma manages connection pool
  }
}
