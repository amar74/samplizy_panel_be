const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    console.log('=== Existing Users in Database ===');
    if (users.length === 0) {
      console.log('No users found in database.');
      console.log('\nTo create a test user, register through the application.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email Verified: ${user.isEmailVerified}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      });
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 