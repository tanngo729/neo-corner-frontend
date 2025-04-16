import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { authService } from '../services/client';
import { message } from 'antd';
import { clientInstance } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Xử lý đăng xuất: Xóa token, xóa header và cập nhật state
  const handleLogout = useCallback(() => {
    // Xóa header Authorization
    delete clientInstance.defaults.headers.common['Authorization'];
    // Xóa thông tin đăng nhập trong localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Cập nhật state
    setUser(null);
    setIsAuthenticated(false);
    console.log("Đăng xuất hoàn tất");
  }, []);

  // Hàm kiểm tra xác thực: Đọc token, user từ localStorage và gọi API xác thực
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    // Nếu có token, thiết lập header cho các request sau
    if (token) {
      clientInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete clientInstance.defaults.headers.common['Authorization'];
    }

    // BƯỚC 1: Thiết lập thông tin người dùng từ localStorage nếu có
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log("Thiết lập người dùng từ localStorage:", parsedUser);
      } catch (error) {
        console.error("Lỗi parse user data:", error);
        handleLogout();
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    // BƯỚC 2: Gọi API để cập nhật thông tin người dùng nếu có token
    if (token) {
      try {
        console.log("Đang lấy thông tin người dùng từ API với token");
        const response = await authService.getUserProfile();
        if (response?.data?.success) {
          const freshUser = response.data.data;
          setUser(freshUser);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(freshUser));
          console.log("Cập nhật thông tin người dùng từ API:", freshUser);
        } else {
          console.log("API không trả về dữ liệu hợp lệ, giữ trạng thái từ localStorage");
        }
      } catch (error) {
        console.error('Lỗi kiểm tra xác thực:', error);
        if (error.response?.status === 401) {
          handleLogout();
        }
      }
    }
    setLoading(false);
  }, [handleLogout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Đăng nhập
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      console.log("Đang đăng nhập với:", credentials.email);
      const response = await authService.login(credentials);

      if (response?.data?.success) {
        const { token, customer } = response.data.data;
        // Thiết lập header cho các request sau
        clientInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Lưu token và thông tin người dùng vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(customer));
        // Cập nhật state
        setUser(customer);
        setIsAuthenticated(true);
        message.success(response.data.message || 'Đăng nhập thành công!');
        return { success: true };
      }

      return { success: false, message: response?.data?.message || 'Đăng nhập thất bại' };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return { success: false, message: error.response?.data?.message || 'Đăng nhập thất bại' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng ký
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      // Loại bỏ trường passwordConfirm nếu có
      const { passwordConfirm, ...data } = userData;
      const response = await authService.register(data);

      if (response?.data?.success) {
        message.success(response.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Đăng ký thất bại');
        return { success: false, message: response?.data?.message || 'Đăng ký thất bại' };
      }
    } catch (error) {
      console.error('Register error:', error);
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Quên mật khẩu
  const forgotPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      const response = await authService.requestPasswordReset(email);
      if (response?.data?.success) {
        message.success(response.data.message || 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn');
        return { success: true };
      } else {
        message.info('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi');
        return { success: true }; // Trả về success vì lý do bảo mật
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      message.info('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi');
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đặt lại mật khẩu
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      setLoading(true);
      const response = await authService.resetPassword(token, newPassword);
      if (response?.data?.success) {
        message.success(response.data.message || 'Mật khẩu đã được đặt lại thành công');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Đặt lại mật khẩu thất bại');
        return { success: false, message: response?.data?.message || 'Đặt lại mật khẩu thất bại' };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMsg = error.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Gửi lại email xác thực
  const resendVerificationEmail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.resendVerificationEmail();
      if (response?.data?.success) {
        message.success(response.data.message || 'Email xác thực đã được gửi lại');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Không thể gửi lại email xác thực');
        return { success: false, message: response?.data?.message || 'Không thể gửi lại email xác thực' };
      }
    } catch (error) {
      console.error('Resend verification email error:', error);
      const errorMsg = error.response?.data?.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại.';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật thông tin người dùng
  const updateProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await authService.updateUserProfile(userData);
      if (response?.data?.success) {
        const updatedUser = response.data.data;
        // Cập nhật state người dùng
        setUser(prev => ({ ...prev, ...updatedUser }));
        // Cập nhật localStorage
        const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {};
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedUser }));
        message.success(response.data.message || 'Cập nhật thông tin thành công');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Cập nhật thông tin thất bại');
        return { success: false, message: response?.data?.message || 'Cập nhật thông tin thất bại' };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMsg = error.response?.data?.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đổi mật khẩu
  const changePassword = useCallback(async (passwordData) => {
    try {
      setLoading(true);
      const response = await authService.changePassword(passwordData);
      if (response?.data?.success) {
        message.success(response.data.message || 'Đổi mật khẩu thành công');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Đổi mật khẩu thất bại');
        return { success: false, message: response?.data?.message || 'Đổi mật khẩu thất bại' };
      }
    } catch (error) {
      console.error('Change password error:', error);
      const errorMsg = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng xuất công khai
  const logout = useCallback(() => {
    handleLogout();
    message.success('Đăng xuất thành công!');
    return { success: true };
  }, [handleLogout]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook sử dụng context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
