const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@panelsam.com'
      }
    });

    if (existingAdmin) {
      // Update existing user to admin role
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'admin' }
      });
      console.log('✅ Updated existing user to admin role:', existingAdmin.email);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@panelsam.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          isActive: true,
          isEmailVerified: true,
          countryCode: '+1',
          language: 'en'
        }
      });
      
      console.log('✅ Created admin user:', adminUser.email);
      console.log('📧 Email: admin@panelsam.com');
      console.log('🔑 Password: admin123');
    }

    // Also update any existing user with email 'demo@example.com' to admin role
    const demoUser = await prisma.user.findFirst({
      where: {
        email: 'demo@example.com'
      }
    });

    if (demoUser) {
      await prisma.user.update({
        where: { id: demoUser.id },
        data: { role: 'admin' }
      });
      console.log('✅ Updated demo user to admin role:', demoUser.email);
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 