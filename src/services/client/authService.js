// src/services/client/authService.js
import { clientInstance } from '../../config/api';

const authService = {
  // Đăng nhập
  login: (credentials) => {
    return clientInstance.post('/auth/login', credentials);
  },

  // Đăng ký
  register: (userData) => {
    // Đảm bảo không gửi passwordConfirm lên server
    const { passwordConfirm, ...registerData } = userData;
    return clientInstance.post('/auth/register', registerData);
  },

  // Lấy thông tin người dùng
  getUserProfile: () => {
    return clientInstance.get('/auth/me');
  },

  // Cập nhật thông tin người dùng
  updateUserProfile: (userData) => {
    return clientInstance.patch('/auth/update-profile', userData);
  },

  // Đổi mật khẩu
  changePassword: (passwordData) => {
    return clientInstance.patch('/auth/change-password', passwordData);
  },

  // Đăng xuất - chỉ xóa token ở client
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve({ success: true });
  },

  // Yêu cầu đặt lại mật khẩu
  requestPasswordReset: (email) => {
    return clientInstance.post('/auth/forgot-password', { email });
  },

  // Đặt lại mật khẩu
  resetPassword: (token, password) => {
    return clientInstance.post('/auth/reset-password', { token, password });
  },

  // Gửi lại email xác thực
  resendVerificationEmail: () => {
    return clientInstance.post('/auth/resend-verification');
  },

  verifyResetToken: (token) => {
    return clientInstance.post('/auth/verify-reset-token', { token });
  },
  verifyEmail: (token) => {
    return clientInstance.get(`/auth/verify-email/${token}`, {
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      }
    });
  },
};

export default authService;