import express from 'express';
import { authenticateToken, requirePanelist } from '../middleware/auth';

const router = express.Router();

// Panelist monthly analytics (mock data for now)
router.get('/panelist/monthly', authenticateToken, requirePanelist, async (req, res) => {
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

export default router; 