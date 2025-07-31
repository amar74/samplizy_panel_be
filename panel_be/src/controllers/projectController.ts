import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Create a new project
export const createProject = async (req: Request, res: Response) => {
  try {
    console.log('=== CREATE PROJECT REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Vendor from request:', (req as any).vendor);
    
    const vendorId = (req as any).vendor?.vendorId;
    const { 
      title, 
      description, 
      externalLink,
      // Survey project specific fields
      category,
      targetAudience,
      sampleSize,
      cpi,
      loi,
      ir,
      currency,
      timeline,
      requirements,
      deliverables,
      surveyType,
      quotaRequirements,
      qualityChecks,
      dataFormat,
      reportingRequirements,
      specialInstructions
    } = req.body;
    
    console.log('Extracted vendorId:', vendorId);
    console.log('Extracted title:', title);
    console.log('Extracted description:', description);
    
    if (!vendorId) {
      console.log('No vendorId found - unauthorized');
      return res.status(401).json({ success: false, message: 'Unauthorized. Vendor ID missing.' });
    }
    if (!title || !description) {
      console.log('Missing title or description');
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    // Create survey project data object with default values for undefined fields
    const surveyProjectData = {
      category: category || 'General',
      targetAudience: targetAudience || 'General',
      sampleSize: sampleSize || 0,
      cpi: cpi || 0,
      loi: loi || 0,
      ir: ir || 0,
      currency: currency || 'USD',
      timeline: timeline || {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: 30
      },
      requirements: requirements || {
        ageRange: '18-65',
        gender: 'All',
        location: 'Global',
        languages: ['English'],
        deviceType: ['Desktop', 'Mobile'],
        screeningCriteria: []
      },
      deliverables: deliverables || ['Survey responses'],
      surveyType: surveyType || 'Online',
      quotaRequirements: quotaRequirements || 'Standard',
      qualityChecks: qualityChecks !== undefined ? qualityChecks : true,
      dataFormat: dataFormat || 'Excel',
      reportingRequirements: reportingRequirements || 'Standard',
      specialInstructions: specialInstructions || ''
    };

    console.log('Survey project data:', JSON.stringify(surveyProjectData, null, 2));

    // Create the enhanced description with survey data
    const enhancedDescription = description + '\n\n' + JSON.stringify(surveyProjectData, null, 2);

    console.log('About to create project in database...');
    const project = await prisma.project.create({
      data: {
        title,
        postedById: vendorId,
        externalLink: externalLink || null,
        status: 'open',
        description: enhancedDescription,
      },
    });
    
    console.log('Project created successfully with postedById:', project.postedById);
    
    res.status(201).json({ 
      success: true, 
      message: 'Survey project created successfully.', 
      data: { project } 
    });
  } catch (error: any) {
    console.error('=== ERROR CREATING PROJECT ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create project.', 
      error: error.message 
    });
  }
};

// Get all projects posted by the vendor
export const getMyProjects = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const projects = await prisma.project.findMany({
      where: { postedById: vendorId },
      orderBy: { createdAt: 'desc' },
      include: {
        bids: {
          include: {
            vendor: {
              select: { id: true, name: true, company: true }
            }
          }
        },
        assignedTo: {
          select: { id: true, name: true, company: true }
        }
      }
    });

    // Transform projects to include survey project data
    const surveyProjects = projects.map(project => {
      let surveyData = {};
      let originalDescription = project.description;
      
      // Try to extract survey data from description
      try {
        const lines = project.description.split('\n');
        const jsonStartIndex = lines.findIndex(line => line.trim().startsWith('{'));
        if (jsonStartIndex !== -1) {
          const jsonString = lines.slice(jsonStartIndex).join('\n');
          surveyData = JSON.parse(jsonString);
          originalDescription = lines.slice(0, jsonStartIndex).join('\n').trim();
        }
      } catch (error) {
        // If parsing fails, keep original description
        console.log('Failed to parse survey data from project description');
      }

      // Transform to SurveyProject format
      return {
        id: project.id,
        title: project.title,
        description: originalDescription,
        status: project.status as 'open' | 'in_progress' | 'completed' | 'closed' | 'draft',
        category: (surveyData as any).category || 'General',
        targetAudience: (surveyData as any).targetAudience || 'General',
        sampleSize: (surveyData as any).sampleSize || 0,
        cpi: (surveyData as any).cpi || 0,
        loi: (surveyData as any).loi || 0,
        ir: (surveyData as any).ir || 0,
        currentBids: project.bids.length,
        currency: (surveyData as any).currency || 'USD',
        timeline: (surveyData as any).timeline || {
          startDate: project.createdAt.toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedDuration: 30
        },
        requirements: (surveyData as any).requirements || {
          ageRange: '18-65',
          gender: 'All',
          location: 'Global',
          languages: ['English'],
          deviceType: ['Desktop', 'Mobile'],
          screeningCriteria: []
        },
        deliverables: (surveyData as any).deliverables || ['Survey responses'],
        surveyType: (surveyData as any).surveyType || 'Online',
        quotaRequirements: (surveyData as any).quotaRequirements || 'Standard',
        qualityChecks: (surveyData as any).qualityChecks || true,
        dataFormat: (surveyData as any).dataFormat || 'Excel',
        reportingRequirements: (surveyData as any).reportingRequirements || 'Standard',
        specialInstructions: (surveyData as any).specialInstructions || '',
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        bids: project.bids.map(bid => ({
          id: bid.id,
          bidAmount: bid.bidAmount,
          vendorName: bid.vendor.name,
          status: bid.status
        }))
      };
    });

    res.json({ success: true, data: surveyProjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch projects.', error: error.message });
  }
};

// Get all available projects (marketplace)
export const getAvailableProjects = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const projects = await prisma.project.findMany({
      where: { 
        status: 'open',
        postedById: { not: vendorId } // Exclude own projects
      },
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: {
          select: { id: true, name: true, company: true }
        },
        bids: {
          where: { vendorId },
          select: { id: true, bidAmount: true, status: true }
        }
      }
    });
    res.json({ success: true, data: { projects } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch available projects.', error: error.message });
  }
};

// Get a single project by ID (if posted by or assigned to vendor)
export const getProject = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { id } = req.params;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        postedBy: {
          select: { id: true, name: true, company: true }
        },
        assignedTo: {
          select: { id: true, name: true, company: true }
        },
        bids: {
          include: {
            vendor: {
              select: { id: true, name: true, company: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.postedById !== vendorId && project.assignedToId !== vendorId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Transform to SurveyProject format
    let surveyData = {};
    let originalDescription = project.description;
    
    // Try to extract survey data from description
    try {
      const lines = project.description.split('\n');
      const jsonStartIndex = lines.findIndex(line => line.trim().startsWith('{'));
      if (jsonStartIndex !== -1) {
        const jsonString = lines.slice(jsonStartIndex).join('\n');
        surveyData = JSON.parse(jsonString);
        originalDescription = lines.slice(0, jsonStartIndex).join('\n').trim();
      }
    } catch (error) {
      // If parsing fails, keep original description
      console.log('Failed to parse survey data from project description');
    }

    const surveyProject = {
      id: project.id,
      title: project.title,
      description: originalDescription,
      status: project.status as 'open' | 'in_progress' | 'completed' | 'closed' | 'draft',
      category: (surveyData as any).category || 'General',
      targetAudience: (surveyData as any).targetAudience || 'General',
      sampleSize: (surveyData as any).sampleSize || 0,
      cpi: (surveyData as any).cpi || 0,
      loi: (surveyData as any).loi || 0,
      ir: (surveyData as any).ir || 0,
      currentBids: project.bids.length,
      currency: (surveyData as any).currency || 'USD',
      timeline: (surveyData as any).timeline || {
        startDate: project.createdAt.toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: 30
      },
      requirements: (surveyData as any).requirements || {
        ageRange: '18-65',
        gender: 'All',
        location: 'Global',
        languages: ['English'],
        deviceType: ['Desktop', 'Mobile'],
        screeningCriteria: []
      },
      deliverables: (surveyData as any).deliverables || ['Survey responses'],
      surveyType: (surveyData as any).surveyType || 'Online',
      quotaRequirements: (surveyData as any).quotaRequirements || 'Standard',
      qualityChecks: (surveyData as any).qualityChecks || true,
      dataFormat: (surveyData as any).dataFormat || 'Excel',
      reportingRequirements: (surveyData as any).reportingRequirements || 'Standard',
      specialInstructions: (surveyData as any).specialInstructions || '',
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      bids: project.bids.map(bid => ({
        id: bid.id,
        bidAmount: bid.bidAmount,
        vendorName: bid.vendor.name,
        status: bid.status
      }))
    };

    res.json({ success: true, data: surveyProject });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch project.', error: error.message });
  }
};

// Update a project (only by poster)
export const updateProject = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { id } = req.params;
    const { 
      title, 
      description, 
      status, 
      redirectStatus, 
      externalLink, 
      assignedToId,
      // Survey project specific fields
      category,
      targetAudience,
      sampleSize,
      cpi,
      loi,
      ir,
      currency,
      timeline,
      requirements,
      deliverables,
      surveyType,
      quotaRequirements,
      qualityChecks,
      dataFormat,
      reportingRequirements,
      specialInstructions
    } = req.body;
    
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    
    const project = await prisma.project.findUnique({
      where: { id: Number(id) }
    });
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    
    if (project.postedById !== vendorId) {
      return res.status(403).json({ success: false, message: 'Only the poster can update this project.' });
    }

    // Extract original description (remove survey data JSON)
    let originalDescription = project.description;
    try {
      const lines = project.description.split('\n');
      const jsonStartIndex = lines.findIndex(line => line.trim().startsWith('{'));
      if (jsonStartIndex !== -1) {
        originalDescription = lines.slice(0, jsonStartIndex).join('\n').trim();
      }
    } catch (error) {
      // Keep original description if parsing fails
    }

    // Create updated survey project data
    const surveyProjectData = {
      category,
      targetAudience,
      sampleSize,
      cpi,
      loi,
      ir,
      currency,
      timeline,
      requirements,
      deliverables,
      surveyType,
      quotaRequirements,
      qualityChecks,
      dataFormat,
      reportingRequirements,
      specialInstructions
    };

    // Combine description with survey data
    const updatedDescription = (description || originalDescription) + '\n\n' + JSON.stringify(surveyProjectData, null, 2);

    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: updatedDescription }),
        ...(status !== undefined && { status }),
        ...(redirectStatus !== undefined && { redirectStatus }),
        ...(externalLink !== undefined && { externalLink }),
        ...(assignedToId !== undefined && { assignedToId }),
      },
    });
    
    res.json({ success: true, message: 'Survey project updated successfully.', data: { project: updatedProject } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update project.', error: error.message });
  }
};

// Delete a project (only by poster)
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { id } = req.params;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const project = await prisma.project.findUnique({
      where: { id: Number(id) }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.postedById !== vendorId) {
      return res.status(403).json({ success: false, message: 'Only the poster can delete this project.' });
    }
    await prisma.project.delete({
      where: { id: Number(id) }
    });
    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete project.', error: error.message });
  }
};

// Assign a project to a vendor (only by poster)
export const assignProject = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { id } = req.params;
    const { assignedToId } = req.body;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    if (!assignedToId) {
      return res.status(400).json({ success: false, message: 'assignedToId (vendorId) is required.' });
    }
    const project = await prisma.project.findUnique({
      where: { id: Number(id) }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.postedById !== vendorId) {
      return res.status(403).json({ success: false, message: 'Only the poster can assign this project.' });
    }
    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        assignedToId,
        status: 'assigned',
      },
    });
    res.json({ success: true, message: 'Project assigned successfully.', data: { project: updatedProject } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to assign project.', error: error.message });
  }
}; 