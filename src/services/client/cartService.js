// src/services/client/cartService.js
import { clientInstance } from '../../config/api';

// Helper để tạo config đảm bảo không cache
const noCache = {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  cache: false
};

const cartService = {
  // Lấy giỏ hàng
  getCart: (config = {}) => {
    // Kết hợp config người dùng với noCache
    const configWithNoCache = { ...noCache, ...config };
    return clientInstance.get('/cart', configWithNoCache);
  },

  // Thêm sản phẩm vào giỏ hàng
  addToCart: (productId, quantity = 1) => {
    return clientInstance.post('/cart/items', { productId, quantity }, noCache);
  },

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  updateCartItem: (itemId, quantity) => {
    return clientInstance.put(`/cart/items/${itemId}`, { quantity }, noCache);
  },

  // Xóa sản phẩm khỏi giỏ hàng
  removeCartItem: (itemId) => {
    return clientInstance.delete(`/cart/items/${itemId}`, noCache);
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: () => {
    return clientInstance.delete('/cart', noCache);
  },

  // Áp dụng mã giảm giá
  applyCoupon: (couponCode) => {
    return clientInstance.post('/cart/apply-coupon', { couponCode }, noCache);
  },

  // Hủy mã giảm giá
  removeCoupon: () => {
    return clientInstance.delete('/cart/coupon', noCache);
  }
};

export default cartService;