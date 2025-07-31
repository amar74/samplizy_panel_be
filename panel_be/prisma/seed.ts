import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

const indianFirstNames = [
  'Amit', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anjali', 'Rohit', 'Pooja', 'Suresh', 'Neha',
  'Arjun', 'Kavita', 'Manish', 'Divya', 'Rakesh', 'Shreya', 'Sanjay', 'Meera', 'Deepak', 'Ritu'
];
const indianLastNames = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Reddy', 'Nair', 'Kumar', 'Das', 'Chopra',
  'Joshi', 'Mehta', 'Jain', 'Agarwal', 'Bose', 'Rao', 'Yadav', 'Mishra', 'Pandey', 'Choudhary'
];
const indianCities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow',
  'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Patna', 'Vadodara', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad'
];
const indianStates = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh'
];
const indianCompanies = [
  'Tata', 'Reliance', 'Infosys', 'Wipro', 'Mahindra', 'Adani', 'HCL', 'L&T', 'Godrej', 'Birla'
];
const surveyThemes = [
  'Mobile Usage in India', 'Online Shopping Trends', 'Food Delivery Preferences', 'Public Transport Feedback',
  'Healthcare Awareness', 'Education Technology Adoption', 'Banking Experience', 'Travel & Tourism',
  'Electric Vehicles', 'Digital Payments', 'Fitness & Wellness', 'Cinema & OTT Platforms', 'Festivals & Traditions',
  'Smartphone Brands', 'Insurance Awareness'
];

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  // --- USERS ---
  const users = [];
  for (let i = 1; i <= 15; i++) {
    const firstName = randomFrom(indianFirstNames);
    const lastName = randomFrom(indianLastNames);
    users.push(
      await prisma.user.create({
        data: {
          email: `user${i}@demo.in`,
          password: 'hashedpassword',
          firstName,
          lastName,
          role: i === 1 ? 'admin' : i <= 3 ? 'researcher' : 'panelist',
          isActive: true,
          isEmailVerified: true,
          age: 22 + (i % 10),
          location: `${randomFrom(indianCities)}, ${randomFrom(indianStates)}`,
          language: 'hi',
          occupation: 'Engineer',
        },
      })
    );
  }

  // --- VENDORS ---
  const vendors = [];
  for (let i = 1; i <= 12; i++) {
    const firstName = randomFrom(indianFirstNames);
    const lastName = randomFrom(indianLastNames);
    vendors.push(
      await prisma.vendor.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: `vendor${i}@demo.in`,
          password: 'hashedpassword',
          company: randomFrom(indianCompanies),
          status: 'active',
        },
      })
    );
  }

  // --- PROJECTS ---
  const projects = [];
  for (let i = 1; i <= 12; i++) {
    projects.push(
      await prisma.project.create({
        data: {
          title: `Project ${i} - ${randomFrom(indianCompanies)}`,
          description: `Description for project ${i} in ${randomFrom(indianCities)}`,
          postedById: vendors[i % vendors.length].id,
          assignedToId: vendors[(i + 1) % vendors.length].id,
          status: 'open',
        },
      })
    );
  }

  // --- SURVEYS ---
  const surveys = [];
  for (let i = 1; i <= 15; i++) {
    surveys.push(
      await prisma.survey.create({
        data: {
          title: `${randomFrom(surveyThemes)} (${randomFrom(indianCities)})`,
          description: `Survey about ${randomFrom(surveyThemes).toLowerCase()} in ${randomFrom(indianStates)}`,
          clientName: randomFrom(indianCompanies),
          projectCode: `IN${1000 + i}`,
          surveyType: 'CSAT',
          language: 'hi',
          department: 'Research',
          confidentiality: 'Open',
          rewardType: 'Points',
          reward: 10 + i,
          status: i % 2 === 0 ? 'active' : 'draft',
          category: 'India',
          createdById: users[1].id,
          estimatedDuration: 5 + (i % 10),
          questions: JSON.stringify([{ id: 'q1', type: 'text', question: 'आप हमारे सर्वे के बारे में क्या सोचते हैं?' }]),
        },
      })
    );
  }

  // --- SURVEY ASSIGNMENTS ---
  for (let i = 0; i < 15; i++) {
    await prisma.surveyAssignment.create({
      data: {
        surveyId: surveys[i].id,
        userId: users[(i % users.length)].id,
        surveyStatus: 'not_started',
        assignedDate: subDays(new Date(), i),
      },
    });
  }

  // --- SURVEY RESPONSES ---
  for (let i = 0; i < 15; i++) {
    await prisma.surveyResponse.create({
      data: {
        surveyId: surveys[i].id,
        respondentId: users[(i % users.length)].id,
        responses: JSON.stringify({ q1: 'बहुत अच्छा' }),
        status: 'completed',
        startedAt: subDays(new Date(), i + 1),
        completedAt: subDays(new Date(), i),
        timeSpent: 5 + i,
        pointsEarned: 10 + i,
        isQualified: true,
      },
    });
  }

  // --- REWARDS ---
  const rewards = [];
  for (let i = 1; i <= 12; i++) {
    rewards.push(
      await prisma.reward.create({
        data: {
          name: `Amazon Gift Card ₹${100 * i}`,
          description: `Amazon India Gift Card worth ₹${100 * i}`,
          points: 100 * i,
          type: 'Gift Card',
          value: 100 * i,
        },
      })
    );
  }

  // --- REWARD REDEMPTIONS ---
  for (let i = 0; i < 12; i++) {
    await prisma.rewardRedemption.create({
      data: {
        userId: users[(i + 2) % users.length].id,
        rewardId: rewards[i].id,
        pointsSpent: 100 * (i + 1),
        status: 'completed',
      },
    });
  }

  // --- SUPPORT TICKETS ---
  for (let i = 0; i < 12; i++) {
    await prisma.supportTicket.create({
      data: {
        userId: users[(i + 3) % users.length].id,
        subject: `Support Ticket ${i}`,
        message: `यह टिकट डेमो उपयोगकर्ता ${i} द्वारा बनाया गया है।`,
        status: 'open',
        category: 'General',
        priority: 'Medium',
      },
    });
  }

  // --- USER SESSIONS ---
  for (let i = 0; i < 12; i++) {
    await prisma.userSession.create({
      data: {
        userId: users[(i + 4) % users.length].id,
        sessionToken: `token${i}`,
        userAgent: 'Mozilla/5.0',
        ipAddress: `192.168.1.${i}`,
        issuedAt: subDays(new Date(), i),
        expiresAt: addDays(new Date(), 7),
        lastUsedAt: new Date(),
        isActive: true,
      },
    });
  }

  // --- USER ACTIVITY ---
  for (let i = 0; i < 12; i++) {
    await prisma.userActivity.create({
      data: {
        userId: users[(i + 5) % users.length].id,
        type: 'login',
        description: `User logged in (डेमो ${i})`,
        createdAt: subDays(new Date(), i),
      },
    });
  }

  // --- BIDS ---
  for (let i = 0; i < 12; i++) {
    await prisma.bid.create({
      data: {
        projectId: projects[i % projects.length].id,
        vendorId: vendors[i % vendors.length].id,
        bidAmount: 1000 + i * 100,
        message: `Bid message ${i}`,
        status: 'pending',
      },
    });
  }

  // --- MESSAGES ---
  for (let i = 0; i < 12; i++) {
    await prisma.message.create({
      data: {
        senderId: vendors[i % vendors.length].id,
        receiverId: vendors[(i + 1) % vendors.length].id,
        projectId: projects[i % projects.length].id,
        message: `Message content ${i} (डेमो)`,
        timestamp: subDays(new Date(), i),
      },
    });
  }

  // --- CUSTOM VENDOR AND BIDS FOR amar74.soft@gmail.com ---
  const amarVendor = await prisma.vendor.upsert({
    where: { email: 'amar74.soft@gmail.com' },
    update: {},
    create: {
      name: 'Amar Soft',
      email: 'amar74.soft@gmail.com',
      password: 'hashedpassword',
      company: 'Samplizy Solutions',
      status: 'active',
    },
  });

  const amarProject = await prisma.project.create({
    data: {
      title: "Amar’s Demo Project",
      description: "A seeded project for Amar’s vendor account.",
      postedById: amarVendor.id,
      status: 'open',
    },
  });

  for (let i = 1; i <= 3; i++) {
    await prisma.bid.create({
      data: {
        projectId: amarProject.id,
        vendorId: amarVendor.id,
        bidAmount: 1000 + i * 250,
        message: `Seeded bid #${i} for Amar`,
        status: i === 1 ? 'pending' : i === 2 ? 'accepted' : 'rejected',
      },
    });
  }

  console.log('Indian demo data seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 