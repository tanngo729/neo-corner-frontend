// src/services/client/paymentService.js
import { clientGet, clientPost } from '../../utils/apiHelper';

const paymentService = {
  // Lấy danh sách phương thức thanh toán
  getPaymentMethods: () => {
    return clientGet('/payment/methods');
  },

  // Tạo thanh toán MOMO
  createMomoPayment: (data) => {
    return clientPost('/payment/momo', data);
  },

  // Tạo thanh toán VNPAY
  createVnpayPayment: (data) => {
    return clientPost('/payment/vnpay', data);
  },

  // Lấy kết quả thanh toán theo mã đơn hàng
  getPaymentResult: (orderCode) => {
    return clientGet(`/payment/result/${orderCode}`);
  },

  // Kiểm tra trạng thái thanh toán
  checkPaymentStatus: (orderCode) => {
    return clientGet(`/payment/status/${orderCode}`, {
      cache: false,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },

  // Thử lại thanh toán cho đơn hàng đã tạo
  retryPayment: (orderCode, paymentMethod) => {
    return clientPost('/payment/retry', { orderCode, paymentMethod });
  }
};

export default paymentService;