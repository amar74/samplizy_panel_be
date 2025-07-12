import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: number, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// Register
router.post('/register', [
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('contactNumber').optional().trim(),
  body('countryCode').optional().trim(),
  body('location').optional().trim(),
  body('language').optional().trim(),
  body('occupation').optional().trim(),
  body('age').optional().isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('referralCode').optional().trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      firstName, lastName, email, contactNumber, countryCode, 
      location, language, occupation, age, referralCode, password 
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP for email verification
    const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationToken = crypto.createHash('sha256').update(otp).digest('hex');
    const emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        contactNumber,
        countryCode: countryCode || '+1',
        location,
        language: language || 'en',
        occupation,
        age: age ? parseInt(age) : null,
        referralCode: referralCode || null,
        password: hashedPassword,
        emailVerificationToken,
        emailVerificationExpires
      }
    });

    // TODO: Send OTP via email (for now, return it in response)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Demo OTP for ${user.email}: 123456`);
    }
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for OTP verification.',
      data: {
        userId: user.id,
        email: user.email,
        otp: process.env.NODE_ENV === 'development' ? '123456' : undefined // Demo OTP for development
      }
    });
    return;
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    return;
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        email,
        emailVerificationToken: hashedOtp,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: true
        },
        token
      }
    });
    return;
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
    return;
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Session/device info
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const issuedAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create UserSession
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: token,
        userAgent: String(userAgent),
        ipAddress: String(ipAddress),
        issuedAt,
        expiresAt,
        lastUsedAt: issuedAt,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
    return;
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    return;
  }
});

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset OTP has been sent.'
      });
    }

    // Generate OTP for password reset
    const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpires: resetPasswordExpires
      }
    });

    // TODO: Send OTP via email (for now, return it in response)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Demo Password Reset OTP for ${email}: 123456`);
    }
    res.json({
      success: true,
      message: 'Password reset OTP sent to your email',
      data: {
        otp: process.env.NODE_ENV === 'development' ? '123456' : undefined // Demo OTP for development
      }
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

// Reset Password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, newPassword } = req.body;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetPasswordToken: hashedOtp,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
    return;
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }
});

// ===== PASSWORD CHANGE WITH OTP VERIFICATION =====

// Request password change OTP (authenticated user)
router.post('/request-password-change-otp', async (req: Request, res: Response) => {
  try {
    console.log('🔍 OTP Request - Headers:', req.headers);
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    console.log('✅ Token verified, userId:', decoded.userId);
    
    console.log('🔍 Finding user...');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user.email);

    // Generate OTP for password change
    const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const passwordChangeToken = crypto.createHash('sha256').update(otp).digest('hex');
    const passwordChangeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('🔍 Updating user with password change token...');
    // Update user with password change token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordChangeToken: passwordChangeToken,
        passwordChangeExpires: passwordChangeExpires
      }
    });

    console.log('✅ User updated successfully');

    // TODO: Send OTP via email (for now, return it in response)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Demo Password Change OTP for ${user.email}: 123456`);
    }

    res.json({
      success: true,
      message: 'Password change OTP sent to your email',
      data: {
        otp: process.env.NODE_ENV === 'development' ? '123456' : undefined // Demo OTP for development
      }
    });

  } catch (error: any) {
    console.error('❌ Request password change OTP error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to send password change OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify password change OTP and change password
router.post('/change-password-with-otp', [
  body('currentPassword').isString().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const { currentPassword, newPassword, otp } = req.body;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Get user with valid password change token
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        passwordChangeToken: hashedOtp,
        passwordChangeExpires: {
          gt: new Date()
        }
      },
      select: { id: true, password: true }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear password change token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangeToken: null,
        passwordChangeExpires: null
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error: any) {
    console.error('Change password with OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

export default router; 