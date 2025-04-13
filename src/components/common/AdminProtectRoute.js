import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminProtectedRoute = ({ children, requiredPermissions = [] }) => {
  const { isAuthenticated, loading, hasAllPermissions } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '70vh'
      }}>
        <Spin size="large" tip="Đang kiểm tra đăng nhập..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Chuyển hướng đến trang đăng nhập admin với thông tin về trang đã cố gắng truy cập
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền nếu có yêu cầu
  if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return children;
};

export default AdminProtectedRoute;