// src/services/admin/roleService.js
import { adminInstance } from '../../config/api';

// Lấy danh sách vai trò
export const getRoles = async (params) => {
  try {
    const response = await adminInstance.get('/roles', { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vai trò:', error);
    throw error;
  }
};

// Lấy chi tiết vai trò
export const getRole = async (id) => {
  try {
    const response = await adminInstance.get(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết vai trò:', error);
    throw error;
  }
};

// Tạo vai trò mới
export const createRole = async (roleData) => {
  try {
    const response = await adminInstance.post('/roles', roleData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo vai trò:', error);
    throw error;
  }
};

// Cập nhật vai trò
export const updateRole = async (id, roleData) => {
  try {
    const response = await adminInstance.put(`/roles/${id}`, roleData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật vai trò:', error);
    throw error;
  }
};

// Xóa vai trò
export const deleteRole = async (id) => {
  try {
    const response = await adminInstance.delete(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa vai trò:', error);
    throw error;
  }
};

// Lấy danh sách tất cả quyền trong hệ thống
export const getAllPermissions = async () => {
  try {
    const response = await adminInstance.get('/roles/permissions');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách quyền:', error);
    throw error;
  }
};

// Export mặc định
const roleService = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions
};

export default roleService;