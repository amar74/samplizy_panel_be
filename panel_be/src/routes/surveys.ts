import express from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticateToken, requireResearcher, requirePanelist } from '../middleware/auth';

const router = express.Router();

// Get all surveys (with filtering and pagination)
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['draft', 'active', 'paused', 'completed']).withMessage('Invalid status'),
  query('category').optional().trim().isLength({ min: 1 }).withMessage('Category cannot be empty'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term cannot be empty'),
  query('createdBy').optional().isInt().withMessage('Invalid user ID')
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
    const { status, category, search, createdBy } = req.query;

    // Build filter
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (createdBy) where.createdById = parseInt(createdBy as string);
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // If user is not admin, only show surveys they created or active surveys
    if ((req.user as any).role !== 'admin') {
      where.OR = [
        { createdById: (req.user as any).userId },
        { status: 'active' }
      ];
    }

    // Get surveys with pagination
    const surveys = await prisma.survey.findMany({
      where,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count
    const total = await prisma.survey.count({ where });

    res.json({
      success: true,
      data: {
        surveys,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Get surveys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surveys'
    });
  }
});

// Get survey by ID
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const survey = await prisma.survey.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Check if user has access to this survey
    if ((req.user as any).role !== 'admin' && 
        survey.createdById !== (req.user as any).userId && 
        survey.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { survey }
    });

  } catch (error: any) {
    console.error('Get survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey'
    });
  }
});

// Create new survey
router.post('/', authenticateToken, requireResearcher, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description is required and must be less than 1000 characters'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.id')
    .notEmpty()
    .withMessage('Question ID is required'),
  body('questions.*.type')
    .isIn(['text', 'number', 'email', 'tel', 'url', 'date', 'time', 'datetime-local', 'month', 'week', 'select', 'textarea', 'radio', 'checkbox', 'range', 'file'])
    .withMessage('Invalid question type'),
  body('questions.*.question')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Question text is required'),
  body('category')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Category is required'),
  body('estimatedDuration')
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be at least 1 minute'),
  body('reward')
    .isInt({ min: 0 })
    .withMessage('Reward is required and must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed'])
    .withMessage('Invalid status')
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

    const surveyData = {
      ...req.body,
      questions: JSON.stringify(req.body.questions), // Convert array to JSON string
      createdById: (req.user as any).userId,
      status: req.body.status || 'draft'
    };

    const survey = await prisma.survey.create({
      data: surveyData,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      data: { survey }
    });

  } catch (error: any) {
    console.error('Create survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create survey'
    });
  }
});

// Update survey
router.put('/:id', authenticateToken, requireResearcher, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed'])
    .withMessage('Invalid status')
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

    const survey = await prisma.survey.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Check if user can edit this survey
    if ((req.user as any).role !== 'admin' && survey.createdById !== (req.user as any).userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Survey updated successfully',
      data: { survey: updatedSurvey }
    });

  } catch (error: any) {
    console.error('Update survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update survey'
    });
  }
});

// Delete survey
router.delete('/:id', authenticateToken, requireResearcher, async (req: express.Request, res: express.Response) => {
  try {
    const survey = await prisma.survey.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Check if user can delete this survey
    if ((req.user as any).role !== 'admin' && survey.createdById !== (req.user as any).userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await prisma.survey.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Survey deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete survey'
    });
  }
});

// Get available surveys for panelists
router.get('/available/panelist', authenticateToken, requirePanelist, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  query('category').optional().trim().isLength({ min: 1 }).withMessage('Category cannot be empty')
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
    const { category } = req.query;

    // Build filter for available surveys
    const where: any = {
      status: 'active'
    };

    if (category) where.category = category;

    // Check target audience criteria
    const user = await prisma.user.findUnique({
      where: { id: (req.user as any).userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userAge = user.age;
    const userLocation = user.location;

    // Add target audience filters (simplified for now)
    // TODO: Implement proper target audience filtering when targetAudience field is properly structured

    // Get available surveys
    const surveys = await prisma.survey.findMany({
      where,
      include: {
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
      skip,
      take: limit
    });

    const total = await prisma.survey.count({ where });

    res.json({
      success: true,
      data: {
        surveys,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Get available surveys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available surveys'
    });
  }
});

// Get survey statistics
router.get('/stats/overview', authenticateToken, requireResearcher, async (req: express.Request, res: express.Response) => {
  try {
    const totalSurveys = await prisma.survey.count();
    const activeSurveys = await prisma.survey.count({ where: { status: 'active' } });
    const draftSurveys = await prisma.survey.count({ where: { status: 'draft' } });
    const completedSurveys = await prisma.survey.count({ where: { status: 'completed' } });

    const surveysByCategory = await prisma.survey.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    const recentSurveys = await prisma.survey.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        category: true,
        createdAt: true,
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

    res.json({
      success: true,
      data: {
        totalSurveys,
        activeSurveys,
        draftSurveys,
        completedSurveys,
        surveysByCategory,
        recentSurveys
      }
    });

  } catch (error: any) {
    console.error('Get survey stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey statistics'
    });
  }
});

export default router; 