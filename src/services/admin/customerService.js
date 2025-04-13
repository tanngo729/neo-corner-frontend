// src/services/admin/customerService.js
import { adminInstance } from '../../config/api';

// Lấy danh sách khách hàng
export const getCustomers = async (params) => {
  try {
    const response = await adminInstance.get('/customers', { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách hàng:', error);
    throw error;
  }
};

// Lấy chi tiết khách hàng
export const getCustomer = async (id) => {
  try {
    const response = await adminInstance.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết khách hàng:', error);
    throw error;
  }
};

// Tạo khách hàng mới
export const createCustomer = async (customerData) => {
  try {
    // Sử dụng FormData nếu có upload file
    const isFormData = customerData instanceof FormData;
    const config = isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};

    const response = await adminInstance.post('/customers', customerData, config);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo khách hàng:', error);
    throw error;
  }
};

// Cập nhật khách hàng
export const updateCustomer = async (id, customerData) => {
  try {
    // Sử dụng FormData nếu có upload file
    const isFormData = customerData instanceof FormData;
    const config = isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};

    const response = await adminInstance.put(`/customers/${id}`, customerData, config);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật khách hàng:', error);
    throw error;
  }
};

// Xóa khách hàng
export const deleteCustomer = async (id) => {
  try {
    const response = await adminInstance.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa khách hàng:', error);
    throw error;
  }
};

// Cập nhật trạng thái khách hàng
export const updateCustomerStatus = async (id, status) => {
  try {
    const response = await adminInstance.patch(`/customers/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái khách hàng:', error);
    throw error;
  }
};

// Đặt lại mật khẩu khách hàng
export const resetCustomerPassword = async (id, newPassword) => {
  try {
    const response = await adminInstance.patch(`/customers/${id}/reset-password`, { newPassword });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đặt lại mật khẩu khách hàng:', error);
    throw error;
  }
};

// Cập nhật trạng thái xác thực email
export const updateVerificationStatus = async (id, isVerified) => {
  try {
    const response = await adminInstance.patch(`/customers/${id}/verification`, { isVerified });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái xác thực:', error);
    throw error;
  }
};

// Export mặc định
const customerService = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,
  resetCustomerPassword,
  updateVerificationStatus
};

export default customerService;