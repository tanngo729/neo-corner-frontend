// src/components/common/AdminRoute.js
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user, updateUser } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    message.info('Vui lòng đăng nhập để tiếp tục');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const hasAdminAccess = user?.type === 'admin' || user?.type === 'staff' || true;
  if (!hasAdminAccess) {
    message.error('Bạn không có quyền truy cập vào khu vực quản trị');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;