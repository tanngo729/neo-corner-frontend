import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { message } from 'antd';
import { authService, profileService } from '../services/admin';
import { adminInstance } from '../config/api';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Thêm hàm này để kiểm tra token sắp hết hạn
  const isTokenExpiring = useCallback((token) => {
    if (!token) return false;

    try {
      // Decode token (không cần verify)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { exp } = JSON.parse(jsonPayload);

      if (!exp) return false;

      // Kiểm tra nếu token sẽ hết hạn trong 24 giờ tới
      const now = Math.floor(Date.now() / 1000);
      return exp - now < 24 * 60 * 60;
    } catch (error) {
      console.error('Lỗi khi kiểm tra token expiration:', error);
      return false;
    }
  }, []);

  // Lưu token vào localStorage với thời hạn dài
  const saveTokenWithLongExpiry = useCallback((token, userData) => {
    if (!token || !userData) return;

    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(userData));

    // Lưu thêm thời gian token được tạo
    localStorage.setItem('adminTokenCreatedAt', Date.now().toString());
  }, []);

  // Khởi tạo: đọc token và thông tin user từ localStorage và thiết lập header
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setPermissions(userData.role?.permissions || []);
        // Thiết lập header Authorization cho adminInstance
        adminInstance.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (error) {
        console.error('Invalid user data in localStorage:', error);
        logout(); // Nếu dữ liệu user không hợp lệ, tiến hành đăng xuất
      }
    } else {
      // Nếu không có token hoặc user, xóa header
      delete adminInstance.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, []);

  // Hàm kiểm tra thông tin người dùng hiện tại từ server
  const checkCurrentUser = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      if (response && response.success) {
        const userData = response.data;
        setUser(userData);
        setPermissions(userData.role?.permissions || []);
        localStorage.setItem('adminUser', JSON.stringify(userData));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error checking current user:', error);
      if (error.response && error.response.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Gọi checkCurrentUser mỗi khi token thay đổi
  useEffect(() => {
    if (token) {
      checkCurrentUser();
    }
  }, [token, checkCurrentUser]);

  // Sử dụng useEffect để kiểm tra token định kỳ - ĐÃ THÊM MỚI
  useEffect(() => {
    if (!token) return;

    const checkToken = async () => {
      // Nếu token sắp hết hạn, kiểm tra xem có thể tự động làm mới không
      if (isTokenExpiring(token)) {
        try {
          console.log('Token admin sắp hết hạn, kiểm tra hồ sơ...');
          // Gọi API profile để xác minh token vẫn còn hợp lệ
          await checkCurrentUser();
        } catch (error) {
          console.error('Lỗi khi kiểm tra token admin:', error);
        }
      }
    };

    // Kiểm tra ngay khi token thay đổi
    checkToken();

    // Thiết lập kiểm tra định kỳ (mỗi 24 giờ)
    const interval = setInterval(checkToken, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, isTokenExpiring, checkCurrentUser]);

  // Hàm đăng nhập - ĐÃ CẬP NHẬT
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      console.log('Admin login với credentials:', credentials);
      // Xóa dữ liệu cũ trước khi đăng nhập mới
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      const response = await authService.login(credentials);
      console.log('Phản hồi login từ server:', response);

      if (response.success) {
        const { user: userData, token: authToken } = response.data;
        console.log('User data:', userData);
        console.log('Token received:', authToken ? `${authToken.substring(0, 15)}...` : 'không có token');

        // Cập nhật state
        setUser(userData);
        setToken(authToken);
        setPermissions(userData.role?.permissions || []);

        // Lưu vào localStorage với thời hạn dài
        saveTokenWithLongExpiry(authToken, userData);

        // Thiết lập header Authorization cho adminInstance
        adminInstance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

        message.success('Đăng nhập thành công!');
        return true;
      } else {
        message.error(response.message || 'Đăng nhập thất bại');
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      console.error('Chi tiết lỗi:', error.response?.data);
      message.error('Đăng nhập thất bại: ' + (error.response?.data?.message || error.message));
      return false;
    } finally {
      setLoading(false);
    }
  }, [saveTokenWithLongExpiry]);

  // Hàm đăng xuất
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Gọi API logout nếu cần
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Xóa thông tin đăng nhập và token
      setUser(null);
      setToken(null);
      setPermissions([]);
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
      delete adminInstance.defaults.headers.common['Authorization'];
      setLoading(false);
      message.success('Đã đăng xuất');
      // Chuyển hướng về trang login
      window.location.href = '/admin/login';
    }
  }, []);

  // Hàm cập nhật thông tin user
  const updateUser = useCallback((updatedData) => {
    setUser(prevUser => {
      const newUser = { ...prevUser, ...updatedData };
      localStorage.setItem('adminUser', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  // Hàm kiểm tra quyền: kiểm tra 1 quyền cụ thể
  const hasPermission = useCallback((requiredPermission) => {
    if (!permissions || permissions.length === 0) return false;
    // Nếu role là Admin thì mặc định có tất cả quyền
    if (user?.role?.name === 'Admin') return true;
    return permissions.includes(requiredPermission);
  }, [permissions, user]);

  // Hàm kiểm tra quyền: cần có TẤT CẢ các quyền được truyền vào
  const hasAllPermissions = useCallback((requiredPermissions = []) => {
    if (!permissions || permissions.length === 0) return false;
    if (requiredPermissions.length === 0) return true;
    if (user?.role?.name === 'Admin') return true;
    return requiredPermissions.every(permission => permissions.includes(permission));
  }, [permissions, user]);

  // Hàm kiểm tra quyền: có ít nhất một quyền trong danh sách
  const hasAnyPermission = useCallback((requiredPermissions = []) => {
    if (!permissions || permissions.length === 0) return false;
    if (requiredPermissions.length === 0) return true;
    if (user?.role?.name === 'Admin') return true;
    return requiredPermissions.some(permission => permissions.includes(permission));
  }, [permissions, user]);

  // Giá trị cho context
  const value = {
    user,
    token,
    loading,
    permissions,
    login,
    logout,
    updateUser,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAuthenticated: !!token,
    checkCurrentUser
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook sử dụng context
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;