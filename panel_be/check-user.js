const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Checking if user ID 1 exists...');
    
    const user = await prisma.user.findUnique({
      where: { id: 1 },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (user) {
      console.log('✅ User found:', user);
    } else {
      console.log('❌ User not found, creating one...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const newUser = await prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@samplizy.com',
          password: hashedPassword,
          role: 'admin',
          isEmailVerified: true,
          isActive: true
        }
      });
      
      console.log('✅ User created:', newUser);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 