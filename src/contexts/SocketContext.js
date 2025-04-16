// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Tạo socket một lần duy nhất
  useEffect(() => {
    // Nếu đã có socket và vẫn connected, không tạo mới
    if (socketRef.current?.connected) {
      setConnected(true);
      return;
    }

    console.log('[Socket] Khởi tạo socket mới với URL:', apiUrl);

    // Tạo socket với cấu hình tối ưu
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
      autoConnect: true
    });

    const socket = socketRef.current;

    // Xử lý các sự kiện cơ bản
    socket.on('connect', () => {
      if (!isMountedRef.current) return;
      console.log('[Socket] Đã kết nối:', socket.id);
      setConnected(true);
      setLastEventTime(new Date());

      // Hủy bỏ timer reconnect nếu đang chạy
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    });

    socket.on('disconnect', (reason) => {
      if (!isMountedRef.current) return;
      console.log('[Socket] Ngắt kết nối, lý do:', reason);
      setConnected(false);

      // Tự động thử kết nối lại
      startReconnectTimer();
    });

    socket.on('connect_error', (error) => {
      if (!isMountedRef.current) return;
      console.error('[Socket] Lỗi kết nối:', error.message);
      setConnected(false);

      // Tự động thử kết nối lại
      startReconnectTimer();
    });

    // Debug - ghi log tất cả sự kiện nhận được
    socket.onAny((event, ...args) => {
      setLastEventTime(new Date());
      console.log(`[Socket] Nhận sự kiện "${event}":`, args[0]);
    });

    // Sự kiện mới - thông báo gom nhóm
    socket.on('grouped-notification', (data) => {
      console.log('[Socket] Nhận thông báo gom nhóm:', data);
      setLastEventTime(new Date());
    });

    // Sự kiện mới - thông báo đã đọc bởi admin khác
    socket.on('admin-notification-read', (data) => {
      console.log('[Socket] Thông báo đã được đọc bởi admin khác:', data);
      setLastEventTime(new Date());
    });

    // Sự kiện mới - tất cả thông báo đã đọc
    socket.on('admin-all-notifications-read', (data) => {
      console.log('[Socket] Tất cả thông báo đã được đọc bởi admin:', data);
      setLastEventTime(new Date());
    });

    // Sự kiện mới - thông báo đã bị xóa
    socket.on('admin-notification-deleted', (data) => {
      console.log('[Socket] Thông báo đã bị xóa:', data);
      setLastEventTime(new Date());
    });

    // Sự kiện mới - khách hàng: thông báo đã đọc
    socket.on('notification-marked-read', (data) => {
      console.log('[Socket] Thông báo đã được đọc:', data);
      setLastEventTime(new Date());
    });

    // Sự kiện mới - khách hàng: tất cả thông báo đã đọc
    socket.on('all-notifications-marked-read', (data) => {
      console.log('[Socket] Tất cả thông báo đã được đọc:', data);
      setLastEventTime(new Date());
    });

    // Sự kiện mới - khách hàng: thông báo đã bị xóa
    socket.on('notification-deleted', (data) => {
      console.log('[Socket] Thông báo đã bị xóa:', data);
      setLastEventTime(new Date());
    });

    return () => {
      isMountedRef.current = false;
      // Hủy bỏ timer reconnect khi unmount
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
      }
      // KHÔNG đóng socket khi unmount
    };
  }, [apiUrl]);

  // Hàm bắt đầu timer kết nối lại
  const startReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) return;

    reconnectTimerRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
        return;
      }

      console.log('[Socket] Đang thử kết nối lại...');
      reconnect();
    }, 10000);
  }, []);

  // Xác thực socket
  const authenticateSocket = useCallback((userId, isAdmin = false) => {
    if (!socketRef.current || !userId) {
      console.error('[Socket] Không thể xác thực - socket hoặc userId không tồn tại');
      return false;
    }

    try {
      const eventName = isAdmin ? 'admin-login' : 'customer-login';
      console.log(`[Socket] Đang xác thực ${isAdmin ? 'admin' : 'khách hàng'} với ID:`, userId);

      const socket = socketRef.current;
      if (!socket.connected) {
        console.log('[Socket] Socket chưa kết nối, đang kết nối lại...');
        socket.connect();
      }

      // Thêm thêm thông tin cho debugging
      const authData = {
        userId,
        role: isAdmin ? 'admin' : 'customer',
        timestamp: new Date().toISOString(),
        clientInfo: {
          url: window.location.href
        }
      };

      socket.emit(eventName, userId, authData);
      return true;
    } catch (error) {
      console.error('[Socket] Lỗi xác thực:', error);
      return false;
    }
  }, []);

  // Kiểm tra kết nối
  const checkConnection = useCallback(() => {
    if (!socketRef.current) return false;

    try {
      const socket = socketRef.current;
      const checkData = {
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        status: socket.connected ? 'connected' : 'disconnected'
      };

      socket.emit('check-connection', checkData);

      // Nếu đã ngắt kết nối, thử kết nối lại
      if (!socket.connected) {
        socket.connect();
      }

      return true;
    } catch (error) {
      console.error('[Socket] Lỗi kiểm tra kết nối:', error);
      return false;
    }
  }, []);

  // Kết nối lại
  const reconnect = useCallback(() => {
    if (!socketRef.current) return false;

    try {
      const socket = socketRef.current;
      console.log('[Socket] Đang thử kết nối lại...');

      if (socket.connected) {
        socket.disconnect();
      }

      setTimeout(() => {
        socket.connect();
      }, 500);

      return true;
    } catch (error) {
      console.error('[Socket] Lỗi khi thử kết nối lại:', error);
      return false;
    }
  }, []);

  // Emit event
  const emitEvent = useCallback((eventName, data) => {
    if (!socketRef.current) return false;

    try {
      socketRef.current.emit(eventName, data);
      return true;
    } catch (error) {
      console.error(`[Socket] Lỗi khi emit event ${eventName}:`, error);
      return false;
    }
  }, []);

  // Đánh dấu thông báo đã đọc qua socket
  const markNotificationRead = useCallback((notificationId, userId, isAdmin = false) => {
    if (!socketRef.current || !connected) {
      console.log('[Socket] Không thể đánh dấu đã đọc - socket chưa kết nối');
      return false;
    }

    try {
      socketRef.current.emit('mark-notification-read', {
        notificationId,
        userId,
        isAdmin
      });
      console.log(`[Socket] Đã gửi yêu cầu đánh dấu đã đọc thông báo ${notificationId}`);
      return true;
    } catch (error) {
      console.error('[Socket] Lỗi khi đánh dấu thông báo đã đọc:', error);
      return false;
    }
  }, [connected]);

  // Đánh dấu tất cả thông báo đã đọc qua socket
  const markAllNotificationsRead = useCallback((userId, isAdmin = false) => {
    if (!socketRef.current || !connected) {
      console.log('[Socket] Không thể đánh dấu tất cả đã đọc - socket chưa kết nối');
      return false;
    }

    try {
      socketRef.current.emit('mark-all-notifications-read', {
        userId,
        isAdmin
      });
      console.log(`[Socket] Đã gửi yêu cầu đánh dấu tất cả thông báo đã đọc`);
      return true;
    } catch (error) {
      console.error('[Socket] Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
      return false;
    }
  }, [connected]);

  const value = {
    socket: socketRef.current,
    connected,
    authenticateSocket,
    checkConnection,
    reconnect,
    emitEvent,
    lastEventTime,
    markNotificationRead,
    markAllNotificationsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket phải được sử dụng trong SocketProvider');
  }
  return context;
};