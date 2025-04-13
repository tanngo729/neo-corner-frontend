import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { authService } from '../services/client';
import { message } from 'antd';
import { clientInstance } from '../config/api'; // Thêm import

// Tạo context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra xác thực khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      console.log("Token khi khởi tạo:", token ? "Tồn tại" : "Không tồn tại");
      console.log("User đã lưu:", savedUser ? "Tồn tại" : "Không tồn tại");

      // BƯỚC 1: Thiết lập user từ localStorage trước
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
          console.log("Đã thiết lập người dùng từ localStorage", userData);
        } catch (e) {
          console.error("Lỗi parse user data:", e);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }

      // BƯỚC 2: Sau đó mới gọi API để cập nhật (nếu có token)
      if (token) {
        try {
          console.log("Đang lấy thông tin người dùng với token");
          // Thiết lập token trước khi gọi API
          clientInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const response = await authService.getUserProfile();
          console.log("Phản hồi từ API:", response.data);

          if (response && response.data && response.data.success) {
            setUser(response.data.data);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(response.data.data));
            console.log("Xác thực người dùng thành công");
          } else {
            console.log("API trả về lỗi, giữ trạng thái từ localStorage");
            // Không đăng xuất nếu có dữ liệu từ localStorage
          }
        } catch (error) {
          console.error('Lỗi kiểm tra xác thực:', error);

          // VẪN GIỮ TRẠNG THÁI từ localStorage nếu đã có
          if (savedUser) {
            console.log("Giữ thông tin người dùng từ localStorage mặc dù API lỗi");
            // Đã thiết lập từ localStorage ở trên, không cần làm gì thêm
          } else {
            console.log("Không có dữ liệu người dùng, tiến hành đăng xuất");
            handleLogout();
          }
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Đăng nhập
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      console.log("Đang đăng nhập với:", credentials.email);

      const response = await authService.login(credentials);
      console.log("Phản hồi đăng nhập:", response.data);

      if (response && response.data && response.data.success) {
        const { token, customer } = response.data.data;

        console.log("Đăng nhập thành công, đã nhận token:", token ? "Có" : "Không");
        console.log("Đã nhận thông tin người dùng:", customer ? "Có" : "Không");

        // QUAN TRỌNG: Thiết lập token cho tất cả request tiếp theo
        clientInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Lưu thông tin vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(customer));

        console.log("Đã lưu token và thông tin người dùng vào localStorage");

        // Kiểm tra lại để xác nhận
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        console.log("Token đã lưu trong localStorage:", savedToken ? "Có" : "Không");
        console.log("User đã lưu trong localStorage:", savedUser ? "Có" : "Không");

        setUser(customer);
        setIsAuthenticated(true);

        message.success(response.data.message || 'Đăng nhập thành công!');
        return { success: true };
      } else {
        return {
          success: false,
          message: response?.data?.message || 'Đăng nhập thất bại'
        };
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng ký
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      // Loại bỏ trường passwordConfirm nếu có
      const { passwordConfirm, ...registerData } = userData;

      const response = await authService.register(registerData);

      if (response && response.data && response.data.success) {

        message.success(response.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Đăng ký thất bại');
        return {
          success: false,
          message: response?.data?.message || 'Đăng ký thất bại'
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      let errorMsg = 'Đăng ký thất bại. Vui lòng thử lại.';

      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }

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

      if (response && response.data && response.data.success) {
        message.success(response.data.message || 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn');
        return { success: true };
      } else {
        message.info('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi');
        return { success: true }; // Vẫn trả về thành công vì lý do bảo mật
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      // API trả về thành công ngay cả khi email không tồn tại (vì lý do bảo mật)
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

      if (response && response.data && response.data.success) {
        message.success(response.data.message || 'Mật khẩu đã được đặt lại thành công');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Đặt lại mật khẩu thất bại');
        return {
          success: false,
          message: response?.data?.message || 'Đặt lại mật khẩu thất bại'
        };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      let errorMsg = 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';

      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }

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

      if (response && response.data && response.data.success) {
        message.success(response.data.message || 'Email xác thực đã được gửi lại');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Không thể gửi lại email xác thực');
        return {
          success: false,
          message: response?.data?.message || 'Không thể gửi lại email xác thực'
        };
      }
    } catch (error) {
      console.error('Resend verification email error:', error);
      let errorMsg = 'Không thể gửi lại email xác thực. Vui lòng thử lại.';

      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }

      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng xuất
  const logout = useCallback(() => {
    handleLogout();
    message.success('Đăng xuất thành công!');
    return { success: true };
  }, []);

  // Xử lý đăng xuất
  const handleLogout = () => {
    console.log("Thực hiện đăng xuất...");

    // Xóa header Authorization
    delete clientInstance.defaults.headers.common['Authorization'];

    // Xóa thông tin đăng nhập
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Cập nhật state
    setUser(null);
    setIsAuthenticated(false);

    console.log("Đăng xuất hoàn tất");
  };

  // Cập nhật thông tin người dùng
  const updateProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await authService.updateUserProfile(userData);

      if (response && response.data && response.data.success) {
        // Cập nhật user state
        setUser(prev => ({ ...prev, ...response.data.data }));

        // Cập nhật localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data.data }));

        message.success(response.data.message || 'Cập nhật thông tin thành công');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Cập nhật thông tin thất bại');
        return {
          success: false,
          message: response?.data?.message || 'Cập nhật thông tin thất bại'
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      let errorMsg = 'Cập nhật thông tin thất bại. Vui lòng thử lại.';

      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }

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

      if (response && response.data && response.data.success) {
        message.success(response.data.message || 'Đổi mật khẩu thành công');
        return { success: true };
      } else {
        message.error(response?.data?.message || 'Đổi mật khẩu thất bại');
        return {
          success: false,
          message: response?.data?.message || 'Đổi mật khẩu thất bại'
        };
      }
    } catch (error) {
      console.error('Change password error:', error);
      let errorMsg = 'Đổi mật khẩu thất bại. Vui lòng thử lại.';

      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }

      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Value cho context
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
    resendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook để sử dụng context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;