import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Place a bid on a project
export const placeBid = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { id: projectId } = req.params;
    const { bidAmount, message } = req.body;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    if (!bidAmount) {
      return res.status(400).json({ success: false, message: 'Bid amount is required.' });
    }
    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    // Prevent self-bidding
    if (project.postedById === vendorId) {
      return res.status(403).json({ success: false, message: 'Cannot bid on your own project.' });
    }
    // Prevent duplicate bid
    const existingBid = await prisma.bid.findFirst({
      where: { projectId: Number(projectId), vendorId }
    });
    if (existingBid) {
      return res.status(400).json({ success: false, message: 'You have already placed a bid on this project.' });
    }
    const bid = await prisma.bid.create({
      data: {
        projectId: Number(projectId),
        vendorId,
        bidAmount: Number(bidAmount),
        message,
        status: 'pending'
      }
    });
    res.status(201).json({ success: true, message: 'Bid placed successfully.', data: { bid } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to place bid.', error: error.message });
  }
};

// List all bids for a project
export const getProjectBids = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { id: projectId } = req.params;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    // Only poster or assignee can view bids
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.postedById !== vendorId && project.assignedToId !== vendorId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const bids = await prisma.bid.findMany({
      where: { projectId: Number(projectId) },
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: { id: true, name: true, company: true }
        }
      }
    });
    res.json({ success: true, data: { bids } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch bids.', error: error.message });
  }
};

// Update a bid (only by bidder)
export const updateBid = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { bidId } = req.params;
    const { bidAmount, message, status } = req.body;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const bid = await prisma.bid.findUnique({
      where: { id: Number(bidId) }
    });
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found.' });
    }
    if (bid.vendorId !== vendorId) {
      return res.status(403).json({ success: false, message: 'Only the bidder can update this bid.' });
    }
    const updatedBid = await prisma.bid.update({
      where: { id: Number(bidId) },
      data: {
        ...(bidAmount !== undefined && { bidAmount: Number(bidAmount) }),
        ...(message !== undefined && { message }),
        ...(status !== undefined && { status }),
      }
    });
    res.json({ success: true, message: 'Bid updated successfully.', data: { bid: updatedBid } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update bid.', error: error.message });
  }
};

// Delete a bid (only by bidder)
export const deleteBid = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { bidId } = req.params;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const bid = await prisma.bid.findUnique({
      where: { id: Number(bidId) }
    });
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found.' });
    }
    if (bid.vendorId !== vendorId) {
      return res.status(403).json({ success: false, message: 'Only the bidder can delete this bid.' });
    }
    await prisma.bid.delete({
      where: { id: Number(bidId) }
    });
    res.json({ success: true, message: 'Bid deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete bid.', error: error.message });
  }
};

// Get all bids for the authenticated vendor
export const getMyBids = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const bids = await prisma.bid.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: {
            postedBy: {
              select: { id: true, name: true, company: true }
            }
          }
        }
      }
    });
    res.json({ success: true, data: { bids } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch bids.', error: error.message });
  }
}; 