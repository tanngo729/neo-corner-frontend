// src/services/client/orderService.js
import { clientInstance } from '../../config/api';

const orderService = {
  // Tạo đơn hàng mới
  createOrder: (orderData) => {
    return clientInstance.post('/client/orders', orderData);
  },

  // Lấy lịch sử đơn hàng của người dùng
  getUserOrders: (params = {}) => {
    return clientInstance.get('/client/orders/user', { params });
  },

  // Lấy chi tiết đơn hàng
  getOrderDetail: (orderId) => {
    return clientInstance.get(`/client/orders/${orderId}`);
  },

  // Hủy đơn hàng
  cancelOrder: (orderId) => {
    return clientInstance.post(`/client/orders/${orderId}/cancel`);
  },

  // Xác nhận đã nhận hàng
  confirmReceipt: (orderId) => {
    return clientInstance.post(`/client/orders/${orderId}/confirm-receipt`);
  },

  // Theo dõi đơn hàng (không cần đăng nhập)
  trackOrder: (orderCode) => {
    return clientInstance.get(`/client/orders/track/${orderCode}`);
  }
};

export default orderService;