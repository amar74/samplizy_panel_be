import express from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticateToken, requirePanelist, requireResearcher, requireAdmin } from '../middleware/auth';

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

    res.json({
      success: true,
      data: { user }
    });

  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Admin: Get panelist by ID (for admin panel)
router.get('/admin/:id', authenticateToken, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const panelistId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: panelistId },
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
        updatedAt: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Panelist not found'
      });
    }

    // Only allow access to panelists
    if (user.role !== 'panelist') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only panelist profiles can be viewed.'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error: any) {
    console.error('Get panelist by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch panelist data'
    });
  }
});

// Get survey history for panelist
router.get('/survey-history', authenticateToken, requireResearcher, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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
    const userId = (req.user as any).userId;

    // For now, return mock data since SurveyResponse model doesn't exist yet
    // TODO: Implement when SurveyResponse model is created
    const mockResponses = [
      {
        id: 1,
        survey: {
          id: 1,
          title: 'Consumer Preferences Survey',
          category: 'Market Research'
        },
        status: 'completed',
        startedAt: '2024-03-15T10:00:00Z',
        completedAt: '2024-03-15T10:15:00Z',
        timeSpent: 15,
        pointsEarned: 50,
        isQualified: true
      },
      {
        id: 2,
        survey: {
          id: 2,
          title: 'Product Feedback Survey',
          category: 'Product Research'
        },
        status: 'completed',
        startedAt: '2024-03-14T14:30:00Z',
        completedAt: '2024-03-14T14:45:00Z',
        timeSpent: 15,
        pointsEarned: 75,
        isQualified: true
      },
      {
        id: 3,
        survey: {
          id: 3,
          title: 'Brand Awareness Survey',
          category: 'Brand Research'
        },
        status: 'abandoned',
        startedAt: '2024-03-13T09:00:00Z',
        completedAt: null,
        timeSpent: 5,
        pointsEarned: 0,
        isQualified: false
      }
    ];

    const total = mockResponses.length;
    const pages = Math.ceil(total / limit);
    const responses = mockResponses.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        responses,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    });

  } catch (error: any) {
    console.error('Get survey history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey history'
    });
  }
});

export default router; 