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

        // Cập nhật state
        setUser(userData);
        setToken(authToken);
        setPermissions(userData.role?.permissions || []);

        // Lưu vào localStorage
        localStorage.setItem('adminUser', JSON.stringify(userData));
        localStorage.setItem('adminToken', authToken);

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
