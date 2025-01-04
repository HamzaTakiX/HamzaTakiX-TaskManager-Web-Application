'use client'

import { create } from 'zustand'
import axios from '../_utils/axiosConfig';

const useNotifications = create((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  // Fetch notifications from the server
  fetchNotifications: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.get('/notifications');
      if (response.data.state) {
        set({ notifications: response.data.notifications });
      }
    } catch (error) {
      set({ error: 'Failed to fetch notifications' });
      console.error('Error fetching notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Add a new notification
  addNotification: async (notification) => {
    try {
      if (!notification.title || !notification.message || !notification.type) {
        throw new Error('Missing required notification fields');
      }
      
      // Add task action type and details
      const notificationData = {
        ...notification,
        actionType: notification.actionType || 'general',
        taskId: notification.taskId,
        previousState: notification.previousState,
        newState: notification.newState,
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.post('/notifications', notificationData);
      
      if (response.data.state) {
        set((state) => ({
          notifications: [response.data.notification, ...state.notifications]
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding notification:', error.response?.data?.message || error.message);
      set((state) => ({ error: error.response?.data?.message || error.message }));
      return false;
    }
  },

  // Mark a single notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await axios.patch(`/notifications/${notificationId}/read`, {});
      
      if (response.data.state) {
        set((state) => ({
          notifications: state.notifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await axios.patch('/notifications/read-all', {});
      
      if (response.data.state) {
        set((state) => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            read: true
          }))
        }));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  // Clear a single notification
  clearNotification: async (notificationId) => {
    try {
      const response = await axios.delete(`/notifications/${notificationId}`);
      
      if (response.data.state) {
        set((state) => ({
          notifications: state.notifications.filter(notification => notification._id !== notificationId)
        }));
      }
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      const response = await axios.delete('/notifications');
      
      if (response.data.state) {
        set({ notifications: [] });
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }
}));

export default useNotifications;
