import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticateToken, requirePanelist } from '../middleware/auth';

const router = express.Router();

// Create a new support ticket
router.post('/support-tickets', authenticateToken, requirePanelist, [
  body('category').isIn(['General', 'Technical', 'Account', 'Payment']).withMessage('Invalid category'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
  body('subject').trim().isLength({ min: 5, max: 100 }).withMessage('Subject must be 5-100 characters'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters')
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
    const { category, priority, subject, message } = req.body;
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        category,
        priority,
        subject,
        message,
        status: 'open'
      }
    });
    res.status(201).json({
      success: true,
      message: 'Support ticket created',
      data: { ticket }
    });
  } catch (error: any) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket'
    });
  }
});

// List all tickets for the logged-in panelist
router.get('/support-tickets', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({
      success: true,
      data: { tickets }
    });
  } catch (error: any) {
    console.error('List support tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets'
    });
  }
});

// Get details of a specific ticket (if owned by the panelist)
router.get('/support-tickets/:id', authenticateToken, requirePanelist, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req.user as any).userId;
    const ticketId = parseInt(req.params.id);
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, userId }
    });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }
    res.json({
      success: true,
      data: { ticket }
    });
  } catch (error: any) {
    console.error('Get support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support ticket'
    });
  }
});

export default router; 