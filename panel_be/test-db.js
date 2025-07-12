const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Test finding user
    console.log('🔍 Testing user lookup...');
    const user = await prisma.user.findUnique({
      where: { id: 1 },
      select: { id: true, email: true }
    });
    
    console.log('✅ User lookup successful:', user);
    
    // Test updating user with password change token
    console.log('🔍 Testing user update...');
    const crypto = require('crypto');
    const otp = '123456';
    const passwordChangeToken = crypto.createHash('sha256').update(otp).digest('hex');
    const passwordChangeExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    const updatedUser = await prisma.user.update({
      where: { id: 1 },
      data: {
        passwordChangeToken: passwordChangeToken,
        passwordChangeExpires: passwordChangeExpires
      },
      select: { id: true, email: true, passwordChangeToken: true, passwordChangeExpires: true }
    });
    
    console.log('✅ User update successful:', updatedUser);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('❌ Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 