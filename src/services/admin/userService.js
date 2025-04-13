// src/services/admin/userService.js
import { adminInstance } from '../../config/api';

// Lấy danh sách người dùng
export const getUsers = async (params) => {
  try {
    const response = await adminInstance.get('/users', { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    throw error;
  }
};

// Lấy chi tiết người dùng
export const getUser = async (id) => {
  try {
    const response = await adminInstance.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết người dùng:', error);
    throw error;
  }
};

// Tạo người dùng mới
export const createUser = async (userData) => {
  try {
    // Sử dụng FormData nếu có upload file
    const isFormData = userData instanceof FormData;
    const config = isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};

    const response = await adminInstance.post('/users', userData, config);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo người dùng:', error);
    throw error;
  }
};

// Cập nhật người dùng
export const updateUser = async (id, userData) => {
  try {
    // Sử dụng FormData nếu có upload file
    const isFormData = userData instanceof FormData;
    const config = isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};

    const response = await adminInstance.put(`/users/${id}`, userData, config);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error);
    throw error;
  }
};

// Xóa người dùng
export const deleteUser = async (id) => {
  try {
    const response = await adminInstance.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    throw error;
  }
};

// Export mặc định
const userService = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};

export default userService;