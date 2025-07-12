import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, requirePanelist } from '../middleware/auth';

const router = express.Router();

// Start a new survey response
router.post('/start', authenticateToken, requirePanelist, async (req, res) => {
  try {
    const { surveyId } = req.body;
    const respondentId = (req.user as any).userId;
    // Prevent duplicate in-progress responses
    const existing = await prisma.surveyResponse.findFirst({
      where: { surveyId, respondentId, status: 'in_progress' }
    });
    if (existing) {
      return res.status(200).json({ success: true, data: { surveyResponse: existing }, message: 'Survey already started.' });
    }
    const surveyResponse = await prisma.surveyResponse.create({
      data: {
        surveyId,
        respondentId,
        status: 'in_progress',
        responses: {},
        startedAt: new Date(),
      }
    });
    res.status(201).json({ success: true, data: { surveyResponse } });
  } catch (error) {
    console.error('Start survey error:', error);
    res.status(500).json({ success: false, message: 'Failed to start survey' });
  }
});

// Save progress (partial answers)
router.put('/:id/save', authenticateToken, requirePanelist, async (req, res) => {
  try {
    const { id } = req.params;
    const { responses } = req.body;
    const respondentId = (req.user as any).userId;
    const surveyResponse = await prisma.surveyResponse.updateMany({
      where: { id: Number(id), respondentId, status: 'in_progress' },
      data: { responses, updatedAt: new Date() }
    });
    if (surveyResponse.count === 0) {
      return res.status(404).json({ success: false, message: 'Survey response not found or not in progress' });
    }
    res.json({ success: true, message: 'Progress saved' });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to save progress' });
  }
});

// List my survey responses
router.get('/mine', authenticateToken, requirePanelist, async (req, res) => {
  try {
    console.log('GET /mine - User:', req.user);
    const respondentId = (req.user as any).userId;
    console.log('Respondent ID:', respondentId);
    
    // Test database connection first
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: respondentId }
    });
    console.log('User found:', !!user);
    
    const responses = await prisma.surveyResponse.findMany({
      where: { respondentId },
      include: { survey: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log('Found responses:', responses.length);
    res.json({ success: true, data: { responses } });
  } catch (error) {
    console.error('List survey responses error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch survey responses' });
  }
});

// Resume survey (get in-progress response)
router.get('/:id', authenticateToken, requirePanelist, async (req, res) => {
  try {
    const { id } = req.params;
    const respondentId = (req.user as any).userId;
    const surveyResponse = await prisma.surveyResponse.findFirst({
      where: { id: Number(id), respondentId }
    });
    if (!surveyResponse) {
      return res.status(404).json({ success: false, message: 'Survey response not found' });
    }
    res.json({ success: true, data: { surveyResponse } });
  } catch (error) {
    console.error('Resume survey error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch survey response' });
  }
});

// Complete survey
router.put('/:id/complete', authenticateToken, requirePanelist, async (req, res) => {
  try {
    const { id } = req.params;
    const { responses, timeSpent, isQualified, disqualificationReason } = req.body;
    const respondentId = (req.user as any).userId;
    // Fetch survey for reward
    const surveyResponse = await prisma.surveyResponse.findFirst({
      where: { id: Number(id), respondentId, status: 'in_progress' }
    });
    if (!surveyResponse) {
      return res.status(404).json({ success: false, message: 'Survey response not found or already completed' });
    }
    const survey = await prisma.survey.findUnique({ where: { id: surveyResponse.surveyId } });
    let pointsEarned = 0;
    if (isQualified !== false && survey) {
      pointsEarned = survey.reward;
      // Add points to user
      await prisma.user.update({
        where: { id: respondentId },
        data: {
          points: { increment: pointsEarned },
          totalPoints: { increment: pointsEarned }
        }
      });
    }
    await prisma.surveyResponse.update({
      where: { id: Number(id) },
      data: {
        responses,
        status: isQualified === false ? 'disqualified' : 'completed',
        completedAt: new Date(),
        timeSpent,
        pointsEarned,
        isQualified: isQualified !== false,
        disqualificationReason: isQualified === false ? disqualificationReason : null
      }
    });
    res.json({ success: true, message: 'Survey completed', data: { pointsEarned } });
  } catch (error) {
    console.error('Complete survey error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete survey' });
  }
});

export default router; 