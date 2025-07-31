import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Send a message to another vendor for a project
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).vendor?.vendorId;
    const { id: projectId } = req.params;
    const { receiverId, message } = req.body;
    if (!senderId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    if (!receiverId || !message) {
      return res.status(400).json({ success: false, message: 'Receiver and message are required.' });
    }
    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    // Only allow poster, assignee, or bidders to send messages
    if (project.postedById !== senderId && project.assignedToId !== senderId) {
      // Check if sender is a bidder
      const bid = await prisma.bid.findFirst({
        where: { projectId: Number(projectId), vendorId: senderId }
      });
      if (!bid) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }
    const msg = await prisma.message.create({
      data: {
        senderId,
        receiverId: Number(receiverId),
        projectId: Number(projectId),
        message,
      }
    });
    res.status(201).json({ success: true, message: 'Message sent.', data: { msg } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to send message.', error: error.message });
  }
};

// List all messages for a project
export const getProjectMessages = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    const { id: projectId } = req.params;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    // Only allow poster, assignee, or bidders to view messages
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.postedById !== vendorId && project.assignedToId !== vendorId) {
      // Check if vendor is a bidder
      const bid = await prisma.bid.findFirst({
        where: { projectId: Number(projectId), vendorId }
      });
      if (!bid) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }
    const messages = await prisma.message.findMany({
      where: { projectId: Number(projectId) },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, company: true }
        },
        receiver: {
          select: { id: true, name: true, company: true }
        }
      }
    });
    res.json({ success: true, data: { messages } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.', error: error.message });
  }
};

// Get all messages for the authenticated vendor (inbox)
export const getMyMessages = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: vendorId },
          { receiverId: vendorId }
        ]
      },
      orderBy: { timestamp: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, company: true }
        },
        receiver: {
          select: { id: true, name: true, company: true }
        },
        project: {
          select: { id: true, title: true }
        }
      }
    });
    res.json({ success: true, data: { messages } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.', error: error.message });
  }
}; 