// src/services/admin/logService.js
import { adminInstance } from '../../config/api';

// Lấy danh sách logs (từ endpoint của settings)
export const getActivityLogs = async (params) => {
  try {
    const response = await adminInstance.get('/settings/logs', { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy logs:', error);
    throw error;
  }
};

export default {
  getActivityLogs
};