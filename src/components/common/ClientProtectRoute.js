import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const ClientProtectedRoute = ({ children, requireVerified = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
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

  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu route yêu cầu email đã xác thực, kiểm tra thêm điều kiện này
  if (requireVerified && user && !user.isVerified) {
    return <Navigate to="/verify-email-required" state={{ from: location }} replace />;
  }

  return children;
};

export default ClientProtectedRoute;