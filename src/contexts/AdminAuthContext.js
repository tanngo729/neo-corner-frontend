// src/contexts/AdminAuthContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { message } from 'antd';
import { authService, profileService } from '../services/admin';

// Tạo context
const AdminAuthContext = createContext();

// Provider component
export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Kiểm tra đăng nhập khi component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setPermissions(userData.role?.permissions || []);
      } catch (error) {
        console.error('Invalid user data in localStorage');
        logout();
      }
    }

    setLoading(false);
  }, []);

  // Kiểm tra thông tin người dùng hiện tại từ server
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
        // Nếu có lỗi, đăng xuất
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

  // Kiểm tra thông tin người dùng khi token thay đổi
  useEffect(() => {
    if (token) {
      checkCurrentUser();
    }
  }, [token, checkCurrentUser]);

  // Hàm đăng nhập
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

        setUser(userData);
        setToken(authToken);
        setPermissions(userData.role?.permissions || []);

        // Lưu vào localStorage
        localStorage.setItem('adminUser', JSON.stringify(userData));
        localStorage.setItem('adminToken', authToken);

        console.log('Đã lưu token vào localStorage');
        console.log('Kiểm tra token trong localStorage:', localStorage.getItem('adminToken'));

        message.success('Đăng nhập thành công!');
        return true;
      } else {
        message.error(response.message || 'Đăng nhập thất bại');
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      console.error('Admin login error details:', error.response?.data);
      message.error('Đăng nhập thất bại: ' + (error.response?.data?.message || error.message));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Hàm đăng xuất
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Gọi API logout nếu cần
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Luôn thực hiện các bước sau dù API thành công hay thất bại
      setUser(null);
      setToken(null);
      setPermissions([]);
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
      setLoading(false);
      message.success('Đã đăng xuất');
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

  // Hàm kiểm tra quyền
  const hasPermission = useCallback((requiredPermission) => {
    if (!permissions || permissions.length === 0) return false;

    // Admin có tất cả quyền
    if (user?.role?.name === 'Admin') return true;

    return permissions.includes(requiredPermission);
  }, [permissions, user]);

  // Hàm kiểm tra nhiều quyền (cần có tất cả)
  const hasAllPermissions = useCallback((requiredPermissions = []) => {
    if (!permissions || permissions.length === 0) return false;
    if (requiredPermissions.length === 0) return true;

    // Admin có tất cả quyền
    if (user?.role?.name === 'Admin') return true;

    return requiredPermissions.every(permission => permissions.includes(permission));
  }, [permissions, user]);

  // Hàm kiểm tra có ít nhất một quyền
  const hasAnyPermission = useCallback((requiredPermissions = []) => {
    if (!permissions || permissions.length === 0) return false;
    if (requiredPermissions.length === 0) return true;

    // Admin có tất cả quyền
    if (user?.role?.name === 'Admin') return true;

    return requiredPermissions.some(permission => permissions.includes(permission));
  }, [permissions, user]);

  // Value cho context
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

// Custom hook để sử dụng context
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;