// src/services/client/notificationService.js
import { clientGet, clientPost, clientDelete } from '../../utils/apiHelper';

const notificationService = {
  // Lấy danh sách thông báo
  getNotifications: async (params = {}) => {
    try {
      const response = await clientGet('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
      throw error;
    }
  },

  // Đếm số thông báo chưa đọc
  countUnread: async () => {
    try {
      const response = await clientGet('/notifications/unread');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi đếm thông báo chưa đọc:', error);
      throw error;
    }
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: async (notificationIds) => {
    try {
      const response = await clientPost('/notifications/read', { notificationIds });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
      throw error;
    }
  },

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async () => {
    try {
      const response = await clientPost('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
      throw error;
    }
  },

  // Xóa thông báo
  deleteNotification: async (notificationId) => {
    try {
      const response = await clientDelete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
      throw error;
    }
  }
};

export default notificationService;