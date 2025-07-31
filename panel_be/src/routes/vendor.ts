import express, { Request, Response, NextFunction } from 'express';
import { 
  registerVendor, 
  loginVendor, 
  getVendorProfile, 
  updateVendorProfile,
  getVendorAnalytics,
  getVendorCommunityFeed,
  getVendorById,
  verifyVendorOtp
} from '../controllers/vendorController';
import { 
  createProject, 
  getMyProjects, 
  getAvailableProjects,
  getProject, 
  updateProject, 
  deleteProject, 
  assignProject 
} from '../controllers/projectController';
import { 
  placeBid, 
  getProjectBids, 
  updateBid, 
  deleteBid, 
  getMyBids 
} from '../controllers/bidController';
import { 
  sendMessage, 
  getProjectMessages,
  getMyMessages
} from '../controllers/messageController';
import jwt, { JwtPayload } from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Simple vendor JWT authentication middleware
function authenticateVendorToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && 'vendorId' in decoded && 'email' in decoded) {
      (req as any).vendor = decoded as JwtPayload & { vendorId: number; email: string; };
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Invalid token payload' });
    }
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
}

// Public routes
router.post('/register', registerVendor);
router.post('/verify-otp', verifyVendorOtp);
router.post('/login', loginVendor);

// Test endpoint (temporary)
router.get('/test-auth', authenticateVendorToken, (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Authentication working', 
    vendor: (req as any).vendor 
  });
});

// Protected routes
router.get('/profile', authenticateVendorToken, getVendorProfile);
router.put('/profile', authenticateVendorToken, updateVendorProfile);

// Dashboard analytics and community
router.get('/analytics', authenticateVendorToken, getVendorAnalytics);
router.get('/community-feed', authenticateVendorToken, getVendorCommunityFeed);

// Vendor profiles (public)
router.get('/vendors/:id', getVendorById);

// Project management routes (all protected)
router.post('/projects', authenticateVendorToken, createProject);
router.get('/projects', authenticateVendorToken, getMyProjects);
router.get('/projects/available', authenticateVendorToken, getAvailableProjects); // Marketplace
router.get('/projects/:id', authenticateVendorToken, getProject);
router.put('/projects/:id', authenticateVendorToken, updateProject);
router.delete('/projects/:id', authenticateVendorToken, deleteProject);

// Project assignment route (protected)
router.patch('/projects/:id/assign', authenticateVendorToken, assignProject);

// Bid management routes (all protected)
router.get('/bids', authenticateVendorToken, getMyBids);
router.post('/projects/:id/bids', authenticateVendorToken, placeBid);
router.get('/projects/:id/bids', authenticateVendorToken, getProjectBids);
router.put('/bids/:bidId', authenticateVendorToken, updateBid);
router.delete('/bids/:bidId', authenticateVendorToken, deleteBid);

// Chat (message) routes (all protected)
router.get('/messages', authenticateVendorToken, getMyMessages); // Inbox
router.post('/projects/:id/messages', authenticateVendorToken, sendMessage);
router.get('/projects/:id/messages', authenticateVendorToken, getProjectMessages);

export default router; 