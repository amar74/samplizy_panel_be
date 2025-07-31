import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Generate JWT token for vendor
function generateToken(vendor: any) {
  return jwt.sign(
    { vendorId: vendor.id, email: vendor.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export const registerVendor = async (req: Request, res: Response) => {
  try {
    const { name, email, password, company, phone, website, industry } = req.body;
    
    if (!name || !email || !password || !company) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, password, and company are required.' 
      });
    }

    // Check if vendor already exists
    const existing = await prisma.vendor.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor with this email already exists.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP for email verification
    const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationToken = crypto.createHash('sha256').update(otp).digest('hex');
    const emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create vendor with basic profile
    const vendor = await prisma.vendor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company,
        status: 'pending_verification',
        profile: {
          phone: phone || null,
          website: website || null,
          industry: industry || null
        },
        emailVerificationToken,
        emailVerificationExpires
      },
    });

    // TODO: Send OTP via email (for now, return it in response)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Demo OTP for vendor ${vendor.email}: 123456`);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Vendor registration successful. Please check your email for OTP verification.',
      data: {
        vendorId: vendor.id,
        email: vendor.email,
        otp: process.env.NODE_ENV === 'development' ? '123456' : undefined // Demo OTP for development
      }
    });
  } catch (error: any) {
    console.error('Vendor registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed.', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const verifyVendorOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required.' 
      });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const vendor = await prisma.vendor.findFirst({
      where: {
        email,
        emailVerificationToken: hashedOtp,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!vendor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark email as verified and update status
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        status: 'active',
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    // Generate token
    const token = generateToken(vendor);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        vendor: {
          id: vendor.id,
          name: vendor.name,
          email: vendor.email,
          company: vendor.company,
          status: 'active'
        },
        token
      }
    });
  } catch (error: any) {
    console.error('Vendor OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
};

export const loginVendor = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    
    const vendor = await prisma.vendor.findUnique({ where: { email } });
    if (!vendor) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if vendor is active
    if (vendor.status !== 'active') {
      return res.status(401).json({ 
        success: false, 
        message: vendor.status === 'pending_verification' 
          ? 'Please verify your email first' 
          : 'Account is deactivated' 
      });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(vendor);
    res.json({ 
      success: true, 
      message: 'Login successful.', 
      data: { 
        vendor: { 
          id: vendor.id, 
          name: vendor.name, 
          email: vendor.email, 
          company: vendor.company, 
          status: vendor.status 
        }, 
        token 
      } 
    });
  } catch (error: any) {
    console.error('Vendor login error:', error);
    res.status(500).json({ success: false, message: 'Login failed.', error: error.message });
  }
};

export const getVendorProfile = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    
    const vendor = await prisma.vendor.findUnique({ 
      where: { id: vendorId }, 
      select: { 
        password: false, 
        emailVerificationToken: false,
        emailVerificationExpires: false,
        id: true, 
        name: true, 
        email: true, 
        company: true, 
        profile: true, 
        status: true, 
        redirectStatus: true, 
        externalLink: true,
        // Business & Tax Information
        yearsInBusiness: true,
        numberOfEmployees: true,
        annualRevenue: true,
        // Required Documents
        panelBook: true,
        panelRegistrationDetails: true,
        businessInformation: true,
        otherDocuments: true,
        // Services and Description
        servicesOffered: true,
        previousProjects: true,
        whyPartnerWithUs: true,
        createdAt: true, 
        updatedAt: true 
      } 
    });
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // Check if profile is complete
    const isProfileComplete = checkProfileCompletion(vendor);
    
    res.json({ 
      success: true, 
      data: { 
        vendor,
        isProfileComplete
      } 
    });
  } catch (error: any) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.', error: error.message });
  }
};

export const updateVendorProfile = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    
    const { 
      name, 
      company, 
      profile,
      // Business & Tax Information
      yearsInBusiness,
      numberOfEmployees,
      annualRevenue,
      // Required Documents
      panelBook,
      panelRegistrationDetails,
      businessInformation,
      otherDocuments,
      // Services and Description
      servicesOffered,
      previousProjects,
      whyPartnerWithUs,
      // Vendor Redirect
      redirectStatus,
      externalLink
    } = req.body;
    
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company }),
        ...(profile !== undefined && { profile }),
        ...(yearsInBusiness !== undefined && { yearsInBusiness }),
        ...(numberOfEmployees !== undefined && { numberOfEmployees }),
        ...(annualRevenue !== undefined && { annualRevenue }),
        ...(panelBook !== undefined && { panelBook }),
        ...(panelRegistrationDetails !== undefined && { panelRegistrationDetails }),
        ...(businessInformation !== undefined && { businessInformation }),
        ...(otherDocuments !== undefined && { otherDocuments }),
        ...(servicesOffered !== undefined && { servicesOffered }),
        ...(previousProjects !== undefined && { previousProjects }),
        ...(whyPartnerWithUs !== undefined && { whyPartnerWithUs }),
        ...(redirectStatus !== undefined && { redirectStatus }),
        ...(externalLink !== undefined && { externalLink }),
      },
      select: { 
        password: false, 
        emailVerificationToken: false,
        emailVerificationExpires: false,
        id: true, 
        name: true, 
        email: true, 
        company: true, 
        profile: true, 
        status: true, 
        redirectStatus: true, 
        externalLink: true,
        // Business & Tax Information
        yearsInBusiness: true,
        numberOfEmployees: true,
        annualRevenue: true,
        // Required Documents
        panelBook: true,
        panelRegistrationDetails: true,
        businessInformation: true,
        otherDocuments: true,
        // Services and Description
        servicesOffered: true,
        previousProjects: true,
        whyPartnerWithUs: true,
        createdAt: true, 
        updatedAt: true 
      }
    });

    // Check if profile is complete after update
    const isProfileComplete = checkProfileCompletion(vendor);

    res.json({ 
      success: true, 
      message: 'Profile updated successfully.', 
      data: { 
        vendor,
        isProfileComplete
      } 
    });
  } catch (error: any) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: error.message });
  }
};

// Helper function to check if vendor profile is complete
function checkProfileCompletion(vendor: any): boolean {
  const requiredFields = [
    vendor.name,
    vendor.company,
    // Original required fields
    vendor.profile?.phone,
    vendor.profile?.address,
    vendor.profile?.city,
    vendor.profile?.industry,
    vendor.profile?.description,
    // Business & Tax Information (required)
    vendor.yearsInBusiness,
    vendor.numberOfEmployees,
    vendor.annualRevenue,
    // Required Documents (required)
    vendor.panelBook,
    vendor.panelRegistrationDetails,
    vendor.businessInformation,
    // Services and Description (required)
    vendor.servicesOffered,
    vendor.whyPartnerWithUs
  ];

  return requiredFields.every(field => {
    if (typeof field === 'string') {
      return field && field.trim() !== '';
    }
    if (typeof field === 'number') {
      return field !== null && field !== undefined;
    }
    return field !== null && field !== undefined;
  });
}

// Get vendor dashboard analytics
export const getVendorAnalytics = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Get counts
    const totalProjects = await prisma.project.count({
      where: { postedById: vendorId }
    });

    const activeProjects = await prisma.project.count({
      where: { 
        postedById: vendorId,
        status: 'open'
      }
    });

    const totalBids = await prisma.bid.count({
      where: { vendorId }
    });

    const acceptedBids = await prisma.bid.count({
      where: { 
        vendorId,
        status: 'accepted'
      }
    });

    const totalMessages = await prisma.message.count({
      where: {
        OR: [
          { senderId: vendorId },
          { receiverId: vendorId }
        ]
      }
    });

    // Get recent activity
    const recentProjects = await prisma.project.findMany({
      where: { postedById: vendorId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        bids: {
          select: { id: true }
        }
      }
    });

    const recentBids = await prisma.bid.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        project: {
          select: { id: true, title: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        analytics: {
          totalProjects,
          activeProjects,
          totalBids,
          acceptedBids,
          totalMessages,
          successRate: totalBids > 0 ? (acceptedBids / totalBids * 100).toFixed(1) : 0
        },
        recentActivity: {
          projects: recentProjects,
          bids: recentBids
        }
      }
    });
  } catch (error: any) {
    console.error('Get vendor analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.', error: error.message });
  }
};

// Get vendor community feed
export const getVendorCommunityFeed = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Get recent projects from all vendors (excluding own)
    const recentProjects = await prisma.project.findMany({
      where: {
        postedById: { not: vendorId },
        status: 'open'
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        postedBy: {
          select: { id: true, name: true, company: true }
        },
        bids: {
          select: { id: true }
        }
      }
    });

    // Get recent bids on own projects
    const recentBidsOnMyProjects = await prisma.bid.findMany({
      where: {
        project: {
          postedById: vendorId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        vendor: {
          select: { id: true, name: true, company: true }
        },
        project: {
          select: { id: true, title: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        communityFeed: {
          recentProjects,
          recentBidsOnMyProjects
        }
      }
    });
  } catch (error: any) {
    console.error('Get vendor community feed error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch community feed.', error: error.message });
  }
};

export const getVendorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        company: true,
        profile: true,
        status: true,
        createdAt: true
      }
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    res.json({ success: true, data: { vendor } });
  } catch (error: any) {
    console.error('Get vendor by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor.', error: error.message });
  }
}; 