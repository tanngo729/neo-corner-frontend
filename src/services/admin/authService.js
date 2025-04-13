// src/services/admin/authService.js
import { adminInstance } from '../../config/api';

// Đăng nhập admin
const login = async (credentials) => {
  try {
    console.log('Đang gửi yêu cầu đăng nhập với:', { ...credentials, password: '******' });
    const response = await adminInstance.post('/auth/login', credentials);
    console.log('Phản hồi đăng nhập:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi chi tiết khi đăng nhập:', error.response?.data || error.message);
    throw error;
  }
};

// Đăng xuất
const logout = async () => {
  try {
    const response = await adminInstance.post('/auth/logout');

    // Dù API thành công hay thất bại, vẫn xóa token và user khỏi localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    return response.data;
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);

    // Đảm bảo xóa token và user khỏi localStorage ngay cả khi API lỗi
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    throw error;
  }
};

// Export default
const authService = {
  login,
  logout
};

export default authService;