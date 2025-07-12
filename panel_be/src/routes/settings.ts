import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticateToken, requireAdmin, requirePanelist } from '../middleware/auth';

const router = express.Router();

// ===== ADMIN SETTINGS =====

// Get system settings (admin only)
router.get('/system', authenticateToken, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    // For now, return default system settings
    // In a real app, these would be stored in a database
    const systemSettings = {
      siteName: 'Panel Sam',
      siteDescription: 'Professional Survey Panel Platform',
      contactEmail: 'admin@samplizy.com',
      supportEmail: 'support@samplizy.com',
      maxFileSize: 5242880, // 5MB
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      surveyRewardRange: { min: 10, max: 1000 },
      maxSurveysPerDay: 10,
      emailNotifications: true,
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true,
      twoFactorAuthEnabled: false,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      rateLimitWindow: 900000, // 15 minutes
      rateLimitMaxRequests: 100
    };

    res.json({
      success: true,
      data: { settings: systemSettings }
    });

  } catch (error: any) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
});

// Update system settings (admin only)
router.put('/system', authenticateToken, requireAdmin, [
  body('siteName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Site name must be between 1 and 100 characters'),
  body('siteDescription').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Site description must be between 1 and 500 characters'),
  body('contactEmail').optional().isEmail().withMessage('Valid contact email is required'),
  body('supportEmail').optional().isEmail().withMessage('Valid support email is required'),
  body('maxFileSize').optional().isInt({ min: 1024, max: 10485760 }).withMessage('Max file size must be between 1KB and 10MB'),
  body('surveyRewardRange.min').optional().isInt({ min: 1 }).withMessage('Minimum reward must be at least 1'),
  body('surveyRewardRange.max').optional().isInt({ min: 1 }).withMessage('Maximum reward must be at least 1'),
  body('maxSurveysPerDay').optional().isInt({ min: 1, max: 100 }).withMessage('Max surveys per day must be between 1 and 100'),
  body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be a boolean'),
  body('maintenanceMode').optional().isBoolean().withMessage('Maintenance mode must be a boolean'),
  body('registrationEnabled').optional().isBoolean().withMessage('Registration enabled must be a boolean'),
  body('emailVerificationRequired').optional().isBoolean().withMessage('Email verification required must be a boolean'),
  body('twoFactorAuthEnabled').optional().isBoolean().withMessage('Two-factor auth enabled must be a boolean')
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

    // In a real app, these settings would be saved to a database
    // For now, just return success
    console.log('System settings updated:', req.body);

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });

  } catch (error: any) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
});

// ===== PANELIST SETTINGS =====

// Get user settings (panelist)
router.get('/user', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        receiveNotifications: true,
        language: true,
        preferredSurveyLength: true,
        preferredDeviceForSurveys: true,
        topicsOfInterest: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's active sessions
    const activeSessions = await prisma.userSession.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        issuedAt: true,
        lastUsedAt: true
      },
      orderBy: { lastUsedAt: 'desc' }
    });

    const userSettings = {
      notifications: {
        email: user.receiveNotifications,
        survey: user.receiveNotifications,
        marketing: false // Default to false for privacy
      },
      preferences: {
        language: user.language || 'en',
        surveyLength: user.preferredSurveyLength || 'medium',
        device: user.preferredDeviceForSurveys || 'no_preference',
        topics: user.topicsOfInterest || []
      },
      security: {
        activeSessions: activeSessions.length,
        lastLogin: user.lastLoginAt,
        twoFactorEnabled: false // Default to false for now
      },
      privacy: {
        profileVisibility: 'private', // Default to private
        dataSharing: false, // Default to false for privacy
        analytics: true // Default to true for platform improvement
      }
    };

    res.json({
      success: true,
      data: { settings: userSettings, activeSessions }
    });

  } catch (error: any) {
    console.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user settings'
    });
  }
});

// Update user settings (panelist)
router.put('/user', authenticateToken, requirePanelist, [
  body('notifications.email').optional().isBoolean().withMessage('Email notifications must be a boolean'),
  body('notifications.survey').optional().isBoolean().withMessage('Survey notifications must be a boolean'),
  body('notifications.marketing').optional().isBoolean().withMessage('Marketing notifications must be a boolean'),
  body('preferences.language').optional().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']).withMessage('Invalid language'),
  body('preferences.surveyLength').optional().isIn(['short', 'medium', 'long']).withMessage('Invalid survey length preference'),
  body('preferences.device').optional().isIn(['mobile', 'desktop', 'no_preference']).withMessage('Invalid device preference'),
  body('preferences.topics').optional().isArray().withMessage('Topics must be an array'),
  body('privacy.profileVisibility').optional().isIn(['public', 'private', 'panelists_only']).withMessage('Invalid profile visibility'),
  body('privacy.dataSharing').optional().isBoolean().withMessage('Data sharing must be a boolean'),
  body('privacy.analytics').optional().isBoolean().withMessage('Analytics must be a boolean')
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
    const { notifications, preferences, privacy } = req.body;

    // Update user preferences
    const updateData: any = {};

    if (notifications) {
      updateData.receiveNotifications = notifications.email || notifications.survey;
    }

    if (preferences) {
      if (preferences.language) updateData.language = preferences.language;
      if (preferences.surveyLength) updateData.preferredSurveyLength = preferences.surveyLength;
      if (preferences.device) updateData.preferredDeviceForSurveys = preferences.device;
      if (preferences.topics) updateData.topicsOfInterest = preferences.topics;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        receiveNotifications: true,
        language: true,
        preferredSurveyLength: true,
        preferredDeviceForSurveys: true,
        topicsOfInterest: true
      }
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { user: updatedUser }
    });

  } catch (error: any) {
    console.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings'
    });
  }
});

// Get security settings (panelist)
router.get('/security', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;

    // Get active sessions
    const activeSessions = await prisma.userSession.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        issuedAt: true,
        lastUsedAt: true
      },
      orderBy: { lastUsedAt: 'desc' }
    });

    // Get login history (last 10 logins)
    const loginHistory = await prisma.userSession.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        issuedAt: true,
        lastUsedAt: true
      },
      orderBy: { lastUsedAt: 'desc' },
      take: 10
    });

    const securitySettings = {
      twoFactorEnabled: false, // Default to false for now
      passwordLastChanged: null, // Would need to track this
      activeSessions: activeSessions.length,
      loginHistory: loginHistory.length,
      failedLoginAttempts: 0, // Would need to track this
      accountLocked: false // Would need to track this
    };

    res.json({
      success: true,
      data: { 
        settings: securitySettings,
        activeSessions,
        loginHistory
      }
    });

  } catch (error: any) {
    console.error('Get security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security settings'
    });
  }
});

// Update security settings (panelist)
router.put('/security', authenticateToken, requirePanelist, [
  body('currentPassword').isString().withMessage('Current password is required'),
  body('newPassword').optional().isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('twoFactorEnabled').optional().isBoolean().withMessage('Two-factor enabled must be a boolean')
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
    const { currentPassword, newPassword, twoFactorEnabled } = req.body;

    // Get current user to verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
    }

    res.json({
      success: true,
      message: 'Security settings updated successfully'
    });

  } catch (error: any) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings'
    });
  }
});

// Logout all sessions except current (panelist)
router.post('/security/logout-all', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    const currentSessionToken = req.headers.authorization?.split(' ')[1];

    // Deactivate all sessions except current
    await prisma.userSession.updateMany({
      where: {
        userId,
        sessionToken: { not: currentSessionToken },
        isActive: true
      },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'All other sessions logged out successfully'
    });

  } catch (error: any) {
    console.error('Logout all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout all sessions'
    });
  }
});

// Logout specific session (panelist)
router.post('/security/logout-session/:sessionId', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    const sessionId = parseInt(req.params.sessionId);

    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Session logged out successfully'
    });

  } catch (error: any) {
    console.error('Logout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout session'
    });
  }
});

// Get privacy settings (panelist)
router.get('/privacy', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        receiveNotifications: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const privacySettings = {
      profileVisibility: 'private', // Default to private
      dataSharing: false, // Default to false for privacy
      analytics: true, // Default to true for platform improvement
      marketingEmails: false, // Default to false
      surveyNotifications: user.receiveNotifications,
      thirdPartySharing: false, // Default to false
      dataRetention: 'account_deletion', // Default to delete on account deletion
      gdprConsent: true, // Default to true
      cookieConsent: true // Default to true
    };

    res.json({
      success: true,
      data: { settings: privacySettings }
    });

  } catch (error: any) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy settings'
    });
  }
});

// Update privacy settings (panelist)
router.put('/privacy', authenticateToken, requirePanelist, [
  body('profileVisibility').optional().isIn(['public', 'private', 'panelists_only']).withMessage('Invalid profile visibility'),
  body('dataSharing').optional().isBoolean().withMessage('Data sharing must be a boolean'),
  body('analytics').optional().isBoolean().withMessage('Analytics must be a boolean'),
  body('marketingEmails').optional().isBoolean().withMessage('Marketing emails must be a boolean'),
  body('surveyNotifications').optional().isBoolean().withMessage('Survey notifications must be a boolean'),
  body('thirdPartySharing').optional().isBoolean().withMessage('Third party sharing must be a boolean'),
  body('dataRetention').optional().isIn(['account_deletion', '30_days', '90_days', '1_year']).withMessage('Invalid data retention period'),
  body('gdprConsent').optional().isBoolean().withMessage('GDPR consent must be a boolean'),
  body('cookieConsent').optional().isBoolean().withMessage('Cookie consent must be a boolean')
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
    const { surveyNotifications } = req.body;

    // Update user notification preferences
    if (typeof surveyNotifications === 'boolean') {
      await prisma.user.update({
        where: { id: userId },
        data: { receiveNotifications: surveyNotifications }
      });
    }

    res.json({
      success: true,
      message: 'Privacy settings updated successfully'
    });

  } catch (error: any) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  }
});

// Request data export (GDPR)
router.post('/privacy/export-data', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;

    // Get all user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        surveyResponses: {
          include: {
            survey: true
          }
        },
        activities: true,
        rewardRedemptions: true,
        supportTickets: true,
        userSessions: true
      }
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive data
    const exportData = {
      ...userData,
      password: undefined,
      emailVerificationToken: undefined,
      resetPasswordToken: undefined
    };

    res.json({
      success: true,
      message: 'Data export generated successfully',
      data: { exportData }
    });

  } catch (error: any) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
});

// Request account deletion (GDPR)
router.post('/privacy/delete-account', authenticateToken, requirePanelist, [
  body('reason').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Reason must be between 1 and 500 characters'),
  body('confirm').isBoolean().withMessage('Confirmation is required')
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
    const { reason, confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: 'Account deletion must be confirmed'
      });
    }

    // In a real app, you might want to schedule deletion after a grace period
    // For now, we'll just deactivate the account
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        accountActive: false
      }
    });

    res.json({
      success: true,
      message: 'Account deletion request submitted successfully'
    });

  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit account deletion request'
    });
  }
});

export default router; 