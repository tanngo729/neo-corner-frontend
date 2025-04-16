// src/services/admin/orderService.js
import { adminGet, adminPut, adminPost, adminDelete } from '../../utils/apiHelper';

const orderService = {
  // Lấy danh sách đơn hàng
  getOrders: async (params = {}) => {
    try {
      const response = await adminGet('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  // Lấy chi tiết đơn hàng
  getOrderDetail: async (orderId) => {
    try {
      const response = await adminGet(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting order ${orderId}:`, error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, status, note) => {
    try {
      const response = await adminPut(`/orders/${orderId}/status`, { status, note });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  },

  // Cập nhật thông tin vận chuyển
  updateShippingInfo: async (orderId, shippingData) => {
    try {
      const response = await adminPut(`/orders/${orderId}/shipping`, shippingData);
      return response.data;
    } catch (error) {
      console.error(`Error updating shipping info for order ${orderId}:`, error);
      throw error;
    }
  },

  // Cập nhật thông tin thanh toán
  updatePaymentInfo: async (orderId, paymentData) => {
    try {
      const response = await adminPut(`/orders/${orderId}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating payment info for order ${orderId}:`, error);
      throw error;
    }
  }
};

export default orderService;