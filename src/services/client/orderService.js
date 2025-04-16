// src/services/client/orderService.js
import { clientGet, clientPost, clientPut } from '../../utils/apiHelper';

const orderService = {
  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    try {
      const response = await clientPost('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Lấy danh sách đơn hàng của người dùng
  getMyOrders: async (params = {}) => {
    try {
      const response = await clientGet('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  // Lấy chi tiết đơn hàng
  getOrderDetail: async (orderId) => {
    try {
      const response = await clientGet(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting order ${orderId}:`, error);
      throw error;
    }
  },

  // Hủy đơn hàng
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await clientPut(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  },

  // Kiểm tra đơn hàng bằng mã đơn hàng và số điện thoại
  checkOrderByNumber: async (orderCode, phone) => {
    try {
      const response = await clientPost('/orders/check', { orderCode, phone });
      return response.data;
    } catch (error) {
      console.error('Error checking order:', error);
      throw error;
    }
  }
};

export default orderService;