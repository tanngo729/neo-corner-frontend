// src/services/admin/notificationService.js
import { adminGet, adminPut } from '../../utils/apiHelper';

const notificationService = {
  getNotifications: async (params = {}) => {
    try {
      const response = await adminGet('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  markAsRead: async (ids) => {
    try {
      const response = await adminPut('/notifications/read', { ids });
      return response.data;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }
};

export default notificationService;