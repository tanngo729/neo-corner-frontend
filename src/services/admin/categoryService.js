// src/services/admin/categoryService.js
import { adminInstance } from '../../config/api';

// Lấy danh sách danh mục
export const getCategoryList = async (params) => {
  try {
    const response = await adminInstance.get('/categories', { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    throw error;
  }
};

// Lấy chi tiết danh mục
export const getCategory = async (id) => {
  try {
    const response = await adminInstance.get(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết danh mục:', error);
    throw error;
  }
};

// Tạo danh mục mới
export const createCategory = async (categoryData) => {
  try {
    // Đã sử dụng FormData trong component
    const response = await adminInstance.post('/categories', categoryData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error);
    throw error;
  }
};

// Cập nhật danh mục
export const updateCategory = async (id, categoryData) => {
  try {
    // Đã sử dụng FormData trong component
    const response = await adminInstance.put(`/categories/${id}`, categoryData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật danh mục:', error);
    throw error;
  }
};

// Xóa danh mục
export const deleteCategory = async (id) => {
  try {
    const response = await adminInstance.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa danh mục:', error);
    throw error;
  }
};

// Cập nhật trạng thái danh mục
export const updateCategoryStatus = async (id, status) => {
  try {
    const response = await adminInstance.put(`/categories/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái danh mục:', error);
    throw error;
  }
};

// Export default
const categoryService = {
  getCategoryList,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus
};

export default categoryService;