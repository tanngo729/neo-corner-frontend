// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { profileService } from '../services/admin';

export const useAuth = (isAdmin = false) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  const storageKeyUser = isAdmin ? 'adminUser' : 'user';
  const storageKeyToken = isAdmin ? 'adminToken' : 'token';
  const loginPath = isAdmin ? '/admin/login' : '/login';

  // Kiểm tra đăng nhập
  useEffect(() => {
    const savedToken = localStorage.getItem(storageKeyToken);
    const savedUser = localStorage.getItem(storageKeyUser);

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
      // Sử dụng profileService thay vì authService
      const response = await profileService.getProfile();

      if (response && response.success) {
        const userData = response.data;
        setUser(userData);
        setPermissions(userData.role?.permissions || []);
        localStorage.setItem(storageKeyUser, JSON.stringify(userData));
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

  // Kiểm tra thông tin người dùng khi component mount
  useEffect(() => {
    if (token) {
      checkCurrentUser();
    }
  }, [token, checkCurrentUser]);

  // Các hàm khác giữ nguyên...
  // Hàm đăng nhập
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      console.log('Login với credentials:', credentials);

      // Xóa dữ liệu cũ trước khi đăng nhập mới
      localStorage.removeItem(storageKeyToken);
      localStorage.removeItem(storageKeyUser);

      // Giả định cấu trúc response trả về
      const response = { success: true, data: { token: 'fake-token', user: { name: 'Test User' } } };

      if (response.success) {
        const { user: userData, token: authToken } = response.data;
        console.log('User data:', userData);
        console.log('Token received:', authToken ? `${authToken.substring(0, 15)}...` : 'không có token');

        setUser(userData);
        setToken(authToken);
        setPermissions(userData.role?.permissions || []);

        // Lưu vào localStorage
        localStorage.setItem(storageKeyUser, JSON.stringify(userData));
        localStorage.setItem(storageKeyToken, authToken);

        console.log('Đã lưu token vào localStorage');
        console.log('Kiểm tra token trong localStorage:', localStorage.getItem(storageKeyToken));

        message.success('Đăng nhập thành công!');
        return true;
      } else {
        message.error(response.message || 'Đăng nhập thất bại');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error details:', error.response?.data);
      message.error('Đăng nhập thất bại: ' + (error.response?.data?.message || error.message));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Hàm đăng xuất
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setPermissions([]);

    localStorage.removeItem(storageKeyUser);
    localStorage.removeItem(storageKeyToken);

    window.location.href = loginPath;
  }, []);

  // Hàm cập nhật thông tin user
  const updateUser = useCallback((updatedData) => {
    setUser(prevUser => {
      const newUser = { ...prevUser, ...updatedData };
      localStorage.setItem(storageKeyUser, JSON.stringify(newUser));
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

  return {
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
};