// src/services/client/promotionService.js
import { clientInstance } from '../../config/api';

// Vì API route cho promotions chưa tồn tại, tạo một service giả lập
const promotionService = {
  // Lấy danh sách khuyến mãi đang hoạt động
  getActivePromotions: () => {
    // Vì chưa có API thực tế, trả về một Promise với dữ liệu giả lập
    return Promise.resolve({
      data: {
        success: true,
        data: [
          {
            id: 1,
            title: 'Giảm 30% tất cả Pizza',
            description: 'Áp dụng vào thứ 3 hàng tuần',
            image: 'https://placehold.co/600x250/f6d365/fff?text=Giảm+30%+Pizza',
            code: 'PIZZA30',
            expiry: '30/04/2025'
          },
          {
            id: 2,
            title: 'Mua 1 tặng 1 món tráng miệng',
            description: 'Cho đơn từ 200.000đ',
            image: 'https://placehold.co/600x250/fda085/fff?text=Mua+1+Tặng+1',
            code: 'DESSERT11',
            expiry: '15/05/2025'
          }
        ],
        message: 'Lấy danh sách khuyến mãi thành công'
      }
    });

    // Khi có API thực tế, sẽ thay bằng:
    // return clientInstance.get('/promotions/active');
  },

  // Lấy khuyến mãi theo ID
  getPromotionById: (id) => {
    // Giả lập dữ liệu
    return Promise.resolve({
      data: {
        success: true,
        data: {
          id: id,
          title: id === 1 ? 'Giảm 30% tất cả Pizza' : 'Mua 1 tặng 1 món tráng miệng',
          description: id === 1 ? 'Áp dụng vào thứ 3 hàng tuần' : 'Cho đơn từ 200.000đ',
          image: id === 1 ? 'https://placehold.co/600x250/f6d365/fff?text=Giảm+30%+Pizza' : 'https://placehold.co/600x250/fda085/fff?text=Mua+1+Tặng+1',
          code: id === 1 ? 'PIZZA30' : 'DESSERT11',
          expiry: '30/04/2025',
          minOrderValue: id === 1 ? 0 : 200000,
          maxDiscount: id === 1 ? 50000 : null,
          discountType: id === 1 ? 'percentage' : 'buyXgetY',
          discountValue: id === 1 ? 30 : null
        },
        message: 'Lấy thông tin khuyến mãi thành công'
      }
    });

    // Khi có API thực tế, sẽ thay bằng:
    // return clientInstance.get(`/promotions/${id}`);
  },

  // Kiểm tra mã khuyến mãi có hợp lệ không
  validateCoupon: (couponCode) => {
    // Giả lập dữ liệu
    const isValid = ['PIZZA30', 'DESSERT11'].includes(couponCode);

    return Promise.resolve({
      data: {
        success: true,
        data: {
          valid: isValid,
          message: isValid ? 'Mã khuyến mãi hợp lệ' : 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn',
          discount: isValid ? (couponCode === 'PIZZA30' ? 30 : null) : null,
          discountType: isValid ? (couponCode === 'PIZZA30' ? 'percentage' : 'buyXgetY') : null,
          minOrderValue: isValid ? (couponCode === 'PIZZA30' ? 0 : 200000) : null,
          maxDiscount: isValid ? (couponCode === 'PIZZA30' ? 50000 : null) : null
        },
        message: isValid ? 'Mã khuyến mãi hợp lệ' : 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn'
      }
    });

  }
};

export default promotionService;