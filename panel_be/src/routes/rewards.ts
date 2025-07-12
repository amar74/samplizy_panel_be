import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all rewards (Admin only)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const rewards = await prisma.reward.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { rewards }
    });
  } catch (error: any) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards'
    });
  }
});

// Get rewards for panelist
router.get('/panelist', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const rewards = await prisma.reward.findMany({
      where: {
        isActive: true
      },
      orderBy: { points: 'asc' }
    });

    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });

    res.json({
      success: true,
      data: { 
        rewards,
        userPoints: user?.points || 0
      }
    });
  } catch (error: any) {
    console.error('Get panelist rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards'
    });
  }
});

// Create new reward (Admin only)
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }).withMessage('Reward name is required'),
  body('description').optional().trim(),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive number'),
  body('type').isIn(['gift_card', 'cash', 'product', 'other']).withMessage('Invalid reward type'),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, points, type, value, isActive = true } = req.body;

    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        points,
        type,
        value: value || null,
        isActive
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reward created successfully',
      data: { reward }
    });
  } catch (error: any) {
    console.error('Create reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reward'
    });
  }
});

// Update reward (Admin only)
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Reward name cannot be empty'),
  body('description').optional().trim(),
  body('points').optional().isInt({ min: 1 }).withMessage('Points must be a positive number'),
  body('type').optional().isIn(['gift_card', 'cash', 'product', 'other']).withMessage('Invalid reward type'),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const reward = await prisma.reward.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Reward updated successfully',
      data: { reward }
    });
  } catch (error: any) {
    console.error('Update reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reward'
    });
  }
});

// Delete reward (Admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;

    await prisma.reward.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reward'
    });
  }
});

// Redeem reward (Panelist only)
router.post('/redeem/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user and reward
    const [user, reward] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId }
      }),
      prisma.reward.findUnique({
        where: { id: parseInt(id) }
      })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (!reward.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Reward is not available'
      });
    }

    if (user.points < reward.points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    // Create redemption record
    const redemption = await prisma.rewardRedemption.create({
      data: {
        userId: user.id,
        rewardId: reward.id,
        pointsSpent: reward.points,
        status: 'pending'
      }
    });

    // Deduct points from user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        points: user.points - reward.points
      }
    });

    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      data: { 
        redemption,
        newPoints: user.points - reward.points
      }
    });
  } catch (error: any) {
    console.error('Redeem reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem reward'
    });
  }
});

// Get user's redemption history
router.get('/redemptions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const redemptions = await prisma.rewardRedemption.findMany({
      where: { userId },
      include: {
        reward: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { redemptions }
    });
  } catch (error: any) {
    console.error('Get redemptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch redemptions'
    });
  }
});

// Update redemption status (Admin only)
router.put('/redemptions/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'approved', 'rejected', 'completed']).withMessage('Invalid status')
], async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const redemption = await prisma.rewardRedemption.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Redemption status updated successfully',
      data: { redemption }
    });
  } catch (error: any) {
    console.error('Update redemption status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update redemption status'
    });
  }
});

// Analytics overview (Admin only)
router.get('/analytics/overview', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Total rewards
    const totalRewards = await prisma.reward.count();
    // Total redemptions
    const totalRedemptions = await prisma.rewardRedemption.count();
    // Redemptions by status
    const redemptionsByStatus = await prisma.rewardRedemption.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    // Recent redemptions
    const recentRedemptions = await prisma.rewardRedemption.findMany({
      include: { user: true, reward: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      data: {
        totalRewards,
        totalRedemptions,
        redemptionsByStatus,
        recentRedemptions
      }
    });
  } catch (error: any) {
    console.error('Get rewards analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards analytics'
    });
  }
});

// Panelist analytics (Panelist only)
router.get('/analytics/panelist', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    if (req.user?.role !== 'panelist') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Panelist only.'
      });
    }
    // Get user points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });
    // Total redemptions
    const totalRedemptions = await prisma.rewardRedemption.count({ where: { userId } });
    // Redemptions by status
    const redemptionsByStatus = await prisma.rewardRedemption.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true }
    });
    // Recent redemptions
    const recentRedemptions = await prisma.rewardRedemption.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    res.json({
      success: true,
      data: {
        points: user?.points || 0,
        totalRedemptions,
        redemptionsByStatus,
        recentRedemptions
      }
    });
  } catch (error: any) {
    console.error('Get panelist analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch panelist analytics'
    });
  }
});

export default router; 