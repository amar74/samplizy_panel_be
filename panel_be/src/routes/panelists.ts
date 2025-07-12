import express from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticateToken, requirePanelist, requireResearcher } from '../middleware/auth';

const router = express.Router();

// Get panelist dashboard data
router.get('/dashboard', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNumber: true,
        countryCode: true,
        location: true,
        language: true,
        occupation: true,
        age: true,
        gender: true,
        education: true,
        income: true,
        maritalStatus: true,
        householdSize: true,
        children: true,
        address: true,
        employmentStatus: true,
        annualHouseholdIncome: true,
        languagesSpoken: true,
        deviceOwnership: true,
        internetAccess: true,
        socialMediaPlatforms: true,
        preferredSurveyLength: true,
        topicsOfInterest: true,
        preferredDeviceForSurveys: true,
        receiveNotifications: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get available surveys count
    const availableSurveysCount = await prisma.survey.count({
      where: {
        status: 'active'
      }
    });

    // Get user's completed surveys count (placeholder - would need a SurveyResponse model)
    const completedSurveysCount = 0; // TODO: Implement when SurveyResponse model is created

    // Calculate profile completion percentage (improved)
    const profileFields = [
      user.firstName,
      user.lastName,
      user.email,
      user.contactNumber,
      user.countryCode,
      user.location,
      user.language,
      user.occupation,
      user.age,
      user.gender,
      user.education,
      user.income,
      user.maritalStatus,
      user.householdSize,
      user.children,
      user.address,
      user.employmentStatus,
      user.annualHouseholdIncome,
      // Arrays: count as filled if length > 0
      Array.isArray(user.languagesSpoken) && user.languagesSpoken.length > 0 ? 'filled' : '',
      Array.isArray(user.deviceOwnership) && user.deviceOwnership.length > 0 ? 'filled' : '',
      user.internetAccess,
      Array.isArray(user.socialMediaPlatforms) && user.socialMediaPlatforms.length > 0 ? 'filled' : '',
      user.preferredSurveyLength,
      Array.isArray(user.topicsOfInterest) && user.topicsOfInterest.length > 0 ? 'filled' : '',
      user.preferredDeviceForSurveys,
      typeof user.receiveNotifications === 'boolean' ? 'filled' : ''
    ];
    const completedFields = profileFields.filter(field => field !== undefined && field !== null && field !== '').length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    // Get recent available surveys
    const recentSurveys = await prisma.survey.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        estimatedDuration: true,
        reward: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Mock recent activity data (TODO: Implement when activity tracking is added)
    const recentActivity = [
      {
        id: '1',
        type: 'survey_completed' as const,
        title: 'Completed Survey',
        description: 'Consumer Preferences Survey',
        timestamp: new Date().toISOString(),
        value: 50
      },
      {
        id: '2',
        type: 'reward_earned' as const,
        title: 'Reward Earned',
        description: 'Points added to your account',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        value: 75
      },
      {
        id: '3',
        type: 'profile_updated' as const,
        title: 'Profile Updated',
        description: 'Updated demographic information',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Calculate total rewards (placeholder)
    const totalRewards = 450; // TODO: Calculate from actual reward history

    res.json({
      success: true,
      data: {
        stats: {
          availableSurveys: availableSurveysCount,
          completedSurveys: completedSurveysCount,
          profileCompletion,
          totalRewards
        },
        recentSurveys,
        recentActivity
      }
    });

  } catch (error: any) {
    console.error('Get panelist dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get panelist profile
router.get('/profile', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNumber: true,
        countryCode: true,
        location: true,
        language: true,
        occupation: true,
        age: true,
        gender: true,
        education: true,
        income: true,
        maritalStatus: true,
        householdSize: true,
        children: true,
        // Extended Demographics
        address: true,
        employmentStatus: true,
        annualHouseholdIncome: true,
        languagesSpoken: true,
        religion: true,
        ethnicity: true,
        // Tech & Device Info
        deviceOwnership: true,
        internetAccess: true,
        socialMediaPlatforms: true,
        // Survey Preferences
        preferredSurveyLength: true,
        topicsOfInterest: true,
        preferredDeviceForSurveys: true,
        receiveNotifications: true,
        // Status & Verification
        emailVerified: true,
        accountActive: true,
        fraudFlagged: true,
        profileCompletion: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        totalPoints: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error: any) {
    console.error('Get panelist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update panelist profile
router.put('/profile', authenticateToken, requirePanelist, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
  body('contactNumber').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Please enter a valid phone number'),
  body('countryCode').optional().trim(),
  body('location').optional().trim(),
  body('language').optional().trim(),
  body('occupation').optional().trim(),
  body('age').optional().custom((value) => {
    if (value !== undefined && value !== null && value !== '') {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 120) {
        throw new Error('Age must be between 1 and 120');
      }
    }
    return true;
  }),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
  body('education').optional().isIn(['high_school', 'bachelor', 'master', 'phd', 'other']).withMessage('Invalid education level'),
  body('income').optional().isIn(['low', 'medium', 'high', 'prefer_not_to_say']).withMessage('Invalid income level'),
  body('maritalStatus').optional().isIn(['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say']).withMessage('Invalid marital status'),
  body('householdSize').optional().custom((value) => {
    if (value !== undefined && value !== null && value !== '') {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 20) {
        throw new Error('Household size must be between 1 and 20');
      }
    }
    return true;
  }),
  body('children').optional().custom((value) => {
    if (value !== undefined && value !== null && value !== '') {
      const num = parseInt(value);
      if (isNaN(num) || num < 0 || num > 10) {
        throw new Error('Number of children must be between 0 and 10');
      }
    }
    return true;
  }),
  // Extended Demographics
  body('address').optional().trim(),
  body('employmentStatus').optional().isIn(['employed', 'student', 'retired', 'unemployed', 'self_employed']).withMessage('Invalid employment status'),
  body('annualHouseholdIncome').optional().isIn(['under_25k', '25k_50k', '50k_75k', '75k_100k', '100k_150k', 'over_150k', 'prefer_not_to_say']).withMessage('Invalid income bracket'),
  body('languagesSpoken').optional().custom((value) => {
    if (value && !Array.isArray(value)) {
      throw new Error('Languages spoken must be an array');
    }
    return true;
  }),
  body('religion').optional().trim(),
  body('ethnicity').optional().trim(),
  // Tech & Device Info
  body('deviceOwnership').optional().custom((value) => {
    if (value && !Array.isArray(value)) {
      throw new Error('Device ownership must be an array');
    }
    return true;
  }),
  body('internetAccess').optional().isIn(['broadband', 'mobile', 'none']).withMessage('Invalid internet access type'),
  body('socialMediaPlatforms').optional().custom((value) => {
    if (value && !Array.isArray(value)) {
      throw new Error('Social media platforms must be an array');
    }
    return true;
  }),
  // Survey Preferences
  body('preferredSurveyLength').optional().isIn(['short', 'medium', 'long']).withMessage('Invalid survey length preference'),
  body('topicsOfInterest').optional().custom((value) => {
    if (value && !Array.isArray(value)) {
      throw new Error('Topics of interest must be an array');
    }
    return true;
  }),
  body('preferredDeviceForSurveys').optional().isIn(['mobile', 'desktop', 'no_preference']).withMessage('Invalid device preference'),
  body('receiveNotifications').optional().isBoolean().withMessage('Receive notifications must be a boolean')
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = (req.user as any).userId;
    const updateData = { ...req.body };

    // Convert string numbers to integers
    if (updateData.age && typeof updateData.age === 'string') {
      updateData.age = parseInt(updateData.age);
    }
    if (updateData.householdSize && typeof updateData.householdSize === 'string') {
      updateData.householdSize = parseInt(updateData.householdSize);
    }
    if (updateData.children && typeof updateData.children === 'string') {
      updateData.children = parseInt(updateData.children);
    }

    // Remove fields that shouldn't be updated via this endpoint
    delete updateData.email;
    delete updateData.password;
    delete updateData.role;
    delete updateData.isActive;
    delete updateData.isEmailVerified;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNumber: true,
        countryCode: true,
        location: true,
        language: true,
        occupation: true,
        age: true,
        gender: true,
        education: true,
        income: true,
        maritalStatus: true,
        householdSize: true,
        children: true,
        // Extended Demographics
        address: true,
        employmentStatus: true,
        annualHouseholdIncome: true,
        languagesSpoken: true,
        religion: true,
        ethnicity: true,
        // Tech & Device Info
        deviceOwnership: true,
        internetAccess: true,
        socialMediaPlatforms: true,
        // Survey Preferences
        preferredSurveyLength: true,
        topicsOfInterest: true,
        preferredDeviceForSurveys: true,
        receiveNotifications: true,
        // Status & Verification
        emailVerified: true,
        accountActive: true,
        fraudFlagged: true,
        profileCompletion: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        totalPoints: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error: any) {
    console.error('Update panelist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Get panelist survey history (completed surveys)
router.get('/survey-history', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch completed survey responses for this panelist
    const [responses, total] = await Promise.all([
      prisma.surveyResponse.findMany({
        where: {
          respondentId: userId,
          status: 'completed',
        },
        include: {
          survey: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              reward: true,
              estimatedDuration: true,
              createdAt: true,
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.surveyResponse.count({
        where: {
          respondentId: userId,
          status: 'completed',
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        history: responses.map(r => ({
          id: r.id,
          survey: r.survey,
          completedAt: r.completedAt,
          timeSpent: r.timeSpent,
          pointsEarned: r.pointsEarned
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Get panelist survey history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey history'
    });
  }
});

// Get panelist statistics (for researchers/admins)
router.get('/stats/:panelistId', authenticateToken, requireResearcher, async (req: express.Request, res: express.Response) => {
  try {
    const panelist = await prisma.user.findUnique({
      where: { id: parseInt(req.params.panelistId) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    if (!panelist || panelist.role !== 'panelist') {
      return res.status(404).json({
        success: false,
        message: 'Panelist not found'
      });
    }

    // TODO: Get actual statistics when SurveyResponse model is implemented
    const stats = {
      totalSurveysCompleted: 0,
      totalPointsEarned: 0,
      averageCompletionTime: 0,
      completionRate: 0,
      lastActivity: panelist.createdAt,
      memberSince: panelist.createdAt
    };

    res.json({
      success: true,
      data: {
        panelist,
        stats
      }
    });

  } catch (error: any) {
    console.error('Get panelist stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch panelist statistics'
    });
  }
});

// Get all panelists (for researchers/admins)
router.get('/all', authenticateToken, requireResearcher, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term cannot be empty'),
  query('country').optional().trim().isLength({ min: 1 }).withMessage('Country cannot be empty'),
  query('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender')
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { search, country, gender } = req.query;

    // Build filter
    const where: any = { role: 'panelist' };
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (country) {
      where.location = { contains: country as string, mode: 'insensitive' };
    }

    // Get panelists with pagination
    const panelists = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count
    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: {
        panelists,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Get panelists error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch panelists'
    });
  }
});

// Get panelist demographics (for researchers/admins)
router.get('/demographics', authenticateToken, requireResearcher, async (req: express.Request, res: express.Response) => {
  try {
    const panelists = await prisma.user.findMany({
      where: { role: 'panelist' },
      select: {
        isEmailVerified: true,
        isActive: true,
        location: true
      }
    });

    const totalPanelists = panelists.length;
    const verifiedUsers = panelists.filter(p => p.isEmailVerified).length;
    const activeUsers = panelists.filter(p => p.isActive).length;

    // Group by location (simplified)
    const locationStats = panelists.reduce((acc: any, panelist) => {
      const location = panelist.location || 'Not specified';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalPanelists,
        verifiedUsers,
        activeUsers,
        locationDistribution: locationStats
      }
    });

  } catch (error: any) {
    console.error('Get demographics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demographics'
    });
  }
});

// Panelist monthly analytics (mock data for now)
router.get('/analytics/monthly', authenticateToken, requirePanelist, async (req, res) => {
  try {
    // TODO: Replace with real DB queries when SurveyResponse and RewardRedemption models are available
    // Generate last 6 months labels
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    // Mock data
    const pointsPerMonth = months.map((month, i) => ({ month, points: 100 + i * 20 }));
    const surveysPerMonth = months.map((month, i) => ({ month, surveys: 2 + i }));
    const rewardsPerMonth = months.map((month, i) => ({ month, rewards: 1 + (i % 2) }));
    res.json({
      success: true,
      data: {
        pointsPerMonth,
        surveysPerMonth,
        rewardsPerMonth
      }
    });
  } catch (error) {
    console.error('Panelist monthly analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly analytics' });
  }
});

// List all active sessions/devices for the logged-in panelist
router.get('/devices', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        issuedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        isActive: true
      }
    });
    res.json({ success: true, data: { sessions } });
  } catch (error: any) {
    console.error('List devices error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch devices' });
  }
});

// Revoke/logout a specific session/device
router.post('/devices/logout', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }
    // Only allow user to revoke their own session
    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId, isActive: true }
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error: any) {
    console.error('Logout device error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke session' });
  }
});

// GDPR: Export all user data as JSON
router.get('/data-export', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    // Fetch all user data
    const [user, surveyResponses, activities, rewardRedemptions, supportTickets] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true, contactNumber: true, countryCode: true, location: true, language: true, occupation: true, age: true, gender: true, education: true, income: true, maritalStatus: true, householdSize: true, children: true, address: true, employmentStatus: true, annualHouseholdIncome: true, languagesSpoken: true, religion: true, ethnicity: true, deviceOwnership: true, internetAccess: true, socialMediaPlatforms: true, preferredSurveyLength: true, topicsOfInterest: true, preferredDeviceForSurveys: true, receiveNotifications: true, isEmailVerified: true, isActive: true, createdAt: true, updatedAt: true }
      }),
      prisma.surveyResponse.findMany({ where: { respondentId: userId } }),
      prisma.userActivity.findMany({ where: { userId } }),
      prisma.rewardRedemption.findMany({ where: { userId } }),
      prisma.supportTicket.findMany({ where: { userId } })
    ]);
    const exportData = { user, surveyResponses, activities, rewardRedemptions, supportTickets };
    res.setHeader('Content-Disposition', 'attachment; filename="panelist_data_export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (error: any) {
    console.error('Data export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

// GDPR: Delete user account and all related data (cascade)
router.post('/request-delete', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    const { confirm } = req.body;
    if (!confirm) {
      return res.status(400).json({ success: false, message: 'Confirmation required to delete account.' });
    }
    // Delete user and cascade (prisma onDelete: Cascade)
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, message: 'Account and all related data deleted successfully.' });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

// Get detailed profile completion status
router.get('/profile-completion', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNumber: true,
        countryCode: true,
        location: true,
        language: true,
        occupation: true,
        age: true,
        gender: true,
        education: true,
        income: true,
        maritalStatus: true,
        householdSize: true,
        children: true,
        address: true,
        employmentStatus: true,
        annualHouseholdIncome: true,
        languagesSpoken: true,
        religion: true,
        ethnicity: true,
        deviceOwnership: true,
        internetAccess: true,
        socialMediaPlatforms: true,
        preferredSurveyLength: true,
        topicsOfInterest: true,
        preferredDeviceForSurveys: true,
        receiveNotifications: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Define profile sections with their fields
    const profileSections = {
      basicInfo: {
        title: 'Basic Information',
        fields: [
          { key: 'firstName', label: 'First Name', value: user.firstName, required: true, type: 'string' },
          { key: 'lastName', label: 'Last Name', value: user.lastName, required: true, type: 'string' },
          { key: 'email', label: 'Email', value: user.email, required: true, readonly: true, type: 'string' },
          { key: 'contactNumber', label: 'Phone Number', value: user.contactNumber, required: false, type: 'string' },
          { key: 'countryCode', label: 'Country Code', value: user.countryCode, required: false, type: 'string' }
        ]
      },
      demographics: {
        title: 'Demographics',
        fields: [
          { key: 'age', label: 'Age', value: user.age, required: false, type: 'number' },
          { key: 'gender', label: 'Gender', value: user.gender, required: false, type: 'string' },
          { key: 'education', label: 'Education Level', value: user.education, required: false, type: 'string' },
          { key: 'income', label: 'Income Level', value: user.income, required: false, type: 'string' },
          { key: 'maritalStatus', label: 'Marital Status', value: user.maritalStatus, required: false, type: 'string' },
          { key: 'householdSize', label: 'Household Size', value: user.householdSize, required: false, type: 'number' },
          { key: 'children', label: 'Number of Children', value: user.children, required: false, type: 'number' }
        ]
      },
      location: {
        title: 'Location & Language',
        fields: [
          { key: 'location', label: 'Location', value: user.location, required: false, type: 'string' },
          { key: 'address', label: 'Address', value: user.address, required: false, type: 'string' },
          { key: 'language', label: 'Primary Language', value: user.language, required: false, type: 'string' },
          { key: 'languagesSpoken', label: 'Languages Spoken', value: user.languagesSpoken, required: false, type: 'array' }
        ]
      },
      employment: {
        title: 'Employment & Income',
        fields: [
          { key: 'occupation', label: 'Occupation', value: user.occupation, required: false, type: 'string' },
          { key: 'employmentStatus', label: 'Employment Status', value: user.employmentStatus, required: false, type: 'string' },
          { key: 'annualHouseholdIncome', label: 'Annual Household Income', value: user.annualHouseholdIncome, required: false, type: 'string' }
        ]
      },
      tech: {
        title: 'Technology & Devices',
        fields: [
          { key: 'deviceOwnership', label: 'Devices Owned', value: user.deviceOwnership, required: false, type: 'array' },
          { key: 'internetAccess', label: 'Internet Access', value: user.internetAccess, required: false, type: 'string' },
          { key: 'socialMediaPlatforms', label: 'Social Media Platforms', value: user.socialMediaPlatforms, required: false, type: 'array' }
        ]
      },
      preferences: {
        title: 'Survey Preferences',
        fields: [
          { key: 'preferredSurveyLength', label: 'Preferred Survey Length', value: user.preferredSurveyLength, required: false, type: 'string' },
          { key: 'topicsOfInterest', label: 'Topics of Interest', value: user.topicsOfInterest, required: false, type: 'array' },
          { key: 'preferredDeviceForSurveys', label: 'Preferred Device for Surveys', value: user.preferredDeviceForSurveys, required: false, type: 'string' },
          { key: 'receiveNotifications', label: 'Receive Notifications', value: user.receiveNotifications, required: false, type: 'boolean' }
        ]
      }
    };

    // Calculate completion for each section
    const sectionsWithCompletion = Object.entries(profileSections).map(([key, section]) => {
      const totalFields = section.fields.length;
      const completedFields = section.fields.filter(field => {
        if (field.type === 'array') {
          return Array.isArray(field.value) && field.value.length > 0;
        }
        if (field.type === 'boolean') {
          return typeof field.value === 'boolean';
        }
        return field.value !== undefined && field.value !== null && field.value !== '';
      }).length;
      
      const completionPercentage = Math.round((completedFields / totalFields) * 100);
      const missingFields = section.fields.filter(field => {
        if (field.type === 'array') {
          return !Array.isArray(field.value) || field.value.length === 0;
        }
        if (field.type === 'boolean') {
          return typeof field.value !== 'boolean';
        }
        return field.value === undefined || field.value === null || field.value === '';
      }).map(field => field.label);

      return {
        key,
        title: section.title,
        completionPercentage,
        completedFields,
        totalFields,
        missingFields,
        fields: section.fields
      };
    });

    // Calculate overall completion
    const totalFields = sectionsWithCompletion.reduce((sum, section) => sum + section.totalFields, 0);
    const totalCompletedFields = sectionsWithCompletion.reduce((sum, section) => sum + section.completedFields, 0);
    const overallCompletion = Math.round((totalCompletedFields / totalFields) * 100);

    // Determine profile strength
    let profileStrength = 'weak';
    if (overallCompletion >= 80) profileStrength = 'strong';
    else if (overallCompletion >= 50) profileStrength = 'medium';

    res.json({
      success: true,
      data: {
        overallCompletion,
        profileStrength,
        totalFields,
        totalCompletedFields,
        sections: sectionsWithCompletion
      }
    });

  } catch (error: any) {
    console.error('Get profile completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile completion'
    });
  }
});

export default router; 