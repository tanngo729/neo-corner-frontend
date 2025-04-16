// src/components/common/SocketAuthComponent.js
import React, { useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useLocation } from 'react-router-dom';

const SocketAuthComponent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { authenticateSocket, connected, reconnect } = useSocket();

  // Lấy thông tin người dùng từ localStorage
  useEffect(() => {
    if (!connected) return;

    const storageUserKey = isAdminRoute ? 'adminUser' : 'user';
    const storageTokenKey = isAdminRoute ? 'adminToken' : 'token';

    const savedUser = localStorage.getItem(storageUserKey);
    const savedToken = localStorage.getItem(storageTokenKey);

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        const userId = userData._id || userData.id;

        if (userId) {
          console.log(`[SocketAuth] Xác thực ${isAdminRoute ? 'admin' : 'khách hàng'}:`, userId);
          authenticateSocket(userId, isAdminRoute);
        }
      } catch (error) {
        console.error('Lỗi khi đọc thông tin người dùng:', error);
      }
    }
  }, [connected, isAdminRoute, authenticateSocket]);

  // Xử lý kết nối lại khi mất kết nối
  useEffect(() => {
    let reconnectInterval;

    // Kiểm tra nếu có token, tức là đã đăng nhập
    const token = localStorage.getItem(isAdminRoute ? 'adminToken' : 'token');

    if (!connected && token) {
      console.log('[SocketAuth] Thiết lập cơ chế tự kết nối lại sau 10 giây');
      reconnectInterval = setInterval(() => {
        console.log('[SocketAuth] Đang thử kết nối lại...');
        reconnect();
      }, 10000);
    }

    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, [connected, isAdminRoute, reconnect]);

  return null;
};

export default SocketAuthComponent;