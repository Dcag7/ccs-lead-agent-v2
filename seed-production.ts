import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

// Production DATABASE_URL
const DATABASE_URL = 'postgresql://neondb_owner:npg_LylZ2UXRmfq4@ep-bitter-mode-agugkcbt-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Starting production database seed...\n');

  const adminEmail = 'dumi@ccsapparel.africa';
  const adminPassword = 'Dcs_BD7@';
  const adminName = 'Dumi Tshabalala';

  try {
    // Hash the password using bcryptjs (same as in NextAuth)
    console.log('🔐 Hashing password with bcryptjs...');
    const hashedPassword = await bcryptjs.hash(adminPassword, 10);
    console.log(`✅ Password hashed successfully`);
    console.log(`   Hash: ${hashedPassword.substring(0, 20)}...`);

    // Check if admin user exists
    console.log(`\n🔍 Checking if user exists: ${adminEmail}`);
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log('✅ User exists, updating password...');
      
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          name: adminName,
          role: 'ADMIN',
        },
      });

      console.log('✅ Admin user updated successfully!');
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Name: ${updatedUser.name}`);
      console.log(`   Role: ${updatedUser.role}`);
    } else {
      console.log('👤 User does not exist, creating new admin user...');
      
      const newUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: 'ADMIN',
        },
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
    }

    // Verify password hash works
    console.log('\n🔐 Verifying password hash...');
    const isValid = await bcryptjs.compare(adminPassword, hashedPassword);
    if (isValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }

    // Count total users
    const userCount = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${userCount}`);

    console.log('\n✨ Production database seeding completed successfully!\n');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🚀 You can now login to your Vercel app with these credentials!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
