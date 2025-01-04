import express from 'express';
import Notification from '../models/notification.model.js';
import { authenticateToken } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all notifications for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json({ state: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ state: false, message: 'Error fetching notifications' });
  }
});

// Add a new notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const notification = new Notification({
      userId: req.user.userId,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'info',
      timestamp: new Date(),
      read: false
    });
    
    console.log('Creating notification:', {
      userId: req.user.userId,
      title: req.body.title,
      type: req.body.type
    });
    
    const savedNotification = await notification.save();
    res.json({ 
      state: true, 
      notification: {
        _id: savedNotification._id,
        title: savedNotification.title,
        message: savedNotification.message,
        type: savedNotification.type,
        read: savedNotification.read,
        timestamp: savedNotification.timestamp
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      state: false, 
      message: 'Error creating notification',
      error: error.message 
    });
  }
});

// Mark a notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ state: false, message: 'Notification not found' });
    }
    res.json({ state: true, notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ state: false, message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );
    res.json({ state: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ state: false, message: 'Error updating notifications' });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!notification) {
      return res.status(404).json({ state: false, message: 'Notification not found' });
    }
    res.json({ state: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ state: false, message: 'Error deleting notification' });
  }
});

// Clear all notifications
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.userId });
    res.json({ state: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ state: false, message: 'Error clearing notifications' });
  }
});

export default router;
