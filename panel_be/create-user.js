const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Amar12345', 12);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        firstName: 'Amarnath',
        lastName: 'Rana',
        email: 'info@samplizy.com',
        password: hashedPassword,
        contactNumber: '9876543210',
        countryCode: '+1',
        location: 'New York, USA',
        language: 'English',
        occupation: 'Business Owner',
        age: 30,
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      }
    });

    console.log('=== User Created Successfully ===');
    console.log(`User ID: ${user.id}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Email Verified: ${user.isEmailVerified}`);
    console.log(`Created: ${user.createdAt.toLocaleString()}`);
    
    console.log('\n=== Login Credentials ===');
    console.log('Email: info@samplizy.com');
    console.log('Password: Amar12345');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('Error: User with this email already exists!');
    } else {
      console.error('Error creating user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createUser(); 