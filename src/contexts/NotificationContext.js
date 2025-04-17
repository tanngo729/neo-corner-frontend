// src/contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { notification, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from './SocketContext';
import moment from 'moment';
import { debounce } from 'lodash';
import 'moment/locale/vi';
import clientNotificationService from '../services/client/notificationService';
import adminNotificationService from '../services/admin/notificationService';

moment.locale('vi');

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định môi trường dựa vào path hiện tại
  const isAdmin = location.pathname.startsWith('/admin');

  // Lấy thông tin người dùng từ localStorage thay vì sử dụng trực tiếp hooks
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Xác định service thông báo phù hợp với môi trường
  const notificationService = isAdmin ? adminNotificationService : clientNotificationService;

  // Mảng lưu trữ các ID thông báo đã xử lý với giới hạn kích thước để tránh rò rỉ bộ nhớ
  const processedNotifications = useRef(new Set());
  const MAX_PROCESSED_NOTIFICATIONS = 500;

  // Hàm quản lý kích thước của processedNotifications
  const addToProcessedNotifications = useCallback((id) => {
    if (processedNotifications.current.size >= MAX_PROCESSED_NOTIFICATIONS) {
      // Xóa 100 mục đầu tiên khi đạt giới hạn
      const entriesToRemove = Array.from(processedNotifications.current).slice(0, 100);
      entriesToRemove.forEach(entry => processedNotifications.current.delete(entry));
    }

    processedNotifications.current.add(id);
  }, []);

  // Hàm chuyển đổi mã trạng thái thành văn bản
  const getStatusText = useCallback((status) => {
    const statusMap = {
      'PENDING': 'Chờ xử lý',
      'AWAITING_PAYMENT': 'Chờ thanh toán',
      'PROCESSING': 'Đang xử lý',
      'SHIPPING': 'Đang vận chuyển',
      'DELIVERED': 'Đã giao hàng',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'REFUNDED': 'Đã hoàn tiền'
    };
    return statusMap[status] || status;
  }, []);

  // Phát âm thanh thông báo
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Không thể phát âm thanh:', e));
    } catch (error) {

    }
  }, []);

  // Hàm tạo khóa cho thông báo gom nhóm để kiểm tra trùng lặp
  const createNotificationKey = useCallback((notification) => {
    if (!notification) return '';
    return `${notification.type}-${notification.orderId || ''}-${notification.status || ''}`;
  }, []);

  // Kiểm tra thông báo có nên thêm vào danh sách hay không (tránh trùng lặp trong thời gian ngắn)
  const shouldAddNotification = useCallback((newNotification) => {
    if (!notifications || notifications.length < 3) return true;
    const newKey = createNotificationKey(newNotification);
    // Nếu không có orderId, luôn thêm (thông báo hệ thống)
    if (!newNotification.orderId) return true;
    const recentNotifications = notifications.slice(0, 5);
    const hasSimilar = recentNotifications.some(n => {
      const existingKey = createNotificationKey(n);
      return existingKey === newKey &&
        moment(newNotification.createdAt || new Date()).diff(moment(n.createdAt), 'seconds') < 5;
    });
    return !hasSimilar;
  }, [notifications, createNotificationKey]);

  // Lấy thông báo từ API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ limit: 20 });
      let notificationsData = [];
      if (response?.data?.data) {
        notificationsData = response.data.data;
      } else if (response?.data) {
        notificationsData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        notificationsData = response;
      }
      if (notificationsData.length > 0) {
        // Cập nhật trạng thái đã đọc từ localStorage
        const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
        const readNotificationsStr = localStorage.getItem(readNotificationsKey);
        if (readNotificationsStr) {
          try {
            const readNotifications = JSON.parse(readNotificationsStr);
            notificationsData = notificationsData.map(n => {
              if (readNotifications.includes(n._id)) {
                return { ...n, read: true };
              }
              return n;
            });
          } catch (e) {
          }
        }
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isAuthenticated, notificationService]);

  // Debounce fetchNotifications để hạn chế số lần gọi API
  const debouncedFetchNotifications = useCallback(
    debounce(() => {
      fetchNotifications();
    }, 300),
    [fetchNotifications]
  );

  // Lấy thông tin người dùng từ localStorage khi component mount
  useEffect(() => {
    const storageUserKey = isAdmin ? 'adminUser' : 'user';
    const storageTokenKey = isAdmin ? 'adminToken' : 'token';
    const savedUser = localStorage.getItem(storageUserKey);
    const savedToken = localStorage.getItem(storageTokenKey);
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [isAdmin]);

  // Lấy thông báo từ localStorage và sau đó fetch lại từ API
  useEffect(() => {
    if (!isAuthenticated) return;
    const storageKey = isAdmin ? 'adminNotifications' : 'clientNotifications';
    const countKey = isAdmin ? 'adminUnreadCount' : 'clientUnreadCount';
    try {
      const savedNotifications = localStorage.getItem(storageKey);
      const savedUnreadCount = localStorage.getItem(countKey);
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parseInt(savedUnreadCount || '0', 10));
      }
      setTimeout(() => {
        fetchNotifications();
      }, 1000);
    } catch (error) {
    }
  }, [isAdmin, isAuthenticated, fetchNotifications]);

  // Lưu thông báo vào localStorage khi có thay đổi
  useEffect(() => {
    if (notifications.length === 0) return;
    const storageKey = isAdmin ? 'adminNotifications' : 'clientNotifications';
    const countKey = isAdmin ? 'adminUnreadCount' : 'clientUnreadCount';
    localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 50)));
    localStorage.setItem(countKey, unreadCount.toString());
  }, [notifications, unreadCount, isAdmin]);

  // Cập nhật trạng thái đã đọc vào localStorage cho một thông báo
  const updateLocalStorageReadStatus = useCallback((notificationId) => {
    try {
      const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
      const existingRead = JSON.parse(localStorage.getItem(readNotificationsKey) || '[]');
      if (!existingRead.includes(notificationId)) {
        existingRead.push(notificationId);
        localStorage.setItem(readNotificationsKey, JSON.stringify(existingRead));
      }
    } catch (e) {
    }
  }, [isAdmin]);

  // Xử lý thông báo gom nhóm
  const handleGroupedNotification = useCallback((data) => {
    if (!data || !data.id) return;
    if (processedNotifications.current.has(data.id)) return;
    addToProcessedNotifications(data.id);
    const groupedNotification = {
      _id: data.id,
      title: data.title,
      description: data.description,
      type: 'grouped',
      originalType: data.originalType,
      count: data.count,
      items: data.items || [],
      createdAt: data.timestamp || new Date().toISOString(),
      read: false
    };
    if (!shouldAddNotification(groupedNotification)) return;
    setNotifications(prev => [groupedNotification, ...prev]);
    setUnreadCount(count => count + 1);
    playNotificationSound();
    notification.info({
      message: data.title,
      description: data.description,
      duration: 4
    });
  }, [playNotificationSound, shouldAddNotification, addToProcessedNotifications]);

  // Xử lý thông báo đã đọc từ thiết bị khác
  const handleRemoteNotificationRead = useCallback((data) => {
    if (!data.id) return;
    setNotifications(prev => {
      const updated = prev.map(n =>
        n._id === data.id ? { ...n, read: true } : n
      );
      return updated;
    });
    setUnreadCount(prev => {
      const hasUnreadNotification = notifications.some(n => n._id === data.id && !n.read);
      return hasUnreadNotification ? Math.max(0, prev - 1) : prev;
    });
    updateLocalStorageReadStatus(data.id);
  }, [notifications, updateLocalStorageReadStatus]);

  // Đánh dấu tất cả thông báo đã đọc
  const handleAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setUnreadCount(0);
    const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
    const notificationIds = notifications.map(n => n._id);
    localStorage.setItem(readNotificationsKey, JSON.stringify(notificationIds));
  }, [notifications, isAdmin]);

  // Xử lý xóa thông báo từ thiết bị khác
  const handleNotificationDeleted = useCallback((data) => {
    if (!data.id) return;
    const deletedNotification = notifications.find(n => n._id === data.id);
    const wasUnread = deletedNotification && !deletedNotification.read;
    setNotifications(prev => prev.filter(notification => notification._id !== data.id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  // Lắng nghe các sự kiện từ socket
  useEffect(() => {
    if (!socket || !connected) return;
    const handleStatusUpdate = (data) => {
      if (isAdmin) return;
      if (processedNotifications.current.has(data.notificationId || data.orderId)) return;
      addToProcessedNotifications(data.notificationId || data.orderId);
      notification.open({
        message: 'Cập nhật đơn hàng',
        description: `Đơn hàng #${data.orderCode} đã được cập nhật trạng thái thành ${getStatusText(data.status)}`,
        onClick: () => navigate(`/orders/${data.orderId}`),
        duration: 5
      });
      playNotificationSound();
      const newNotification = {
        _id: data.notificationId || `temp-${Date.now()}`,
        type: 'order-status-update',
        orderId: data.orderId,
        orderCode: data.orderCode,
        title: 'Cập nhật đơn hàng',
        description: `Đơn hàng #${data.orderCode} cập nhật: ${getStatusText(data.status)}`,
        status: data.status,
        createdAt: data.timestamp || new Date().toISOString(),
        read: false
      };
      if (!shouldAddNotification(newNotification)) return;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(count => count + 1);
    };

    const handleNewOrder = (data) => {
      if (!isAdmin) return;
      if (processedNotifications.current.has(data.notificationId || data.orderId)) return;
      addToProcessedNotifications(data.notificationId || data.orderId);
      notification.open({
        message: data.type === 'cancelled-by-user' ? 'Đơn hàng bị hủy' : 'Đơn hàng mới',
        description: `Mã đơn: ${data.orderCode}`,
        onClick: () => navigate(`/admin/orders/${data.orderId || data._id}`),
        duration: 5
      });
      playNotificationSound();
      const newNotification = {
        _id: data.notificationId || `temp-${Date.now()}`,
        type: data.type || 'new-order',
        orderId: data.orderId || data._id,
        orderCode: data.orderCode,
        title: data.type === 'cancelled-by-user' ? 'Đơn hàng bị hủy' : 'Đơn hàng mới',
        description: `Đơn hàng #${data.orderCode}`,
        status: data.status,
        createdAt: data.timestamp || new Date().toISOString(),
        read: false
      };
      if (!shouldAddNotification(newNotification)) return;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(count => count + 1);
      debouncedFetchNotifications();
    };

    // Đăng ký các listener cho socket
    const listeners = {
      'grouped-notification': handleGroupedNotification,
      'new-order': isAdmin ? handleNewOrder : null,
      'admin-notification': isAdmin ? handleNewOrder : null,
      'admin-notification-read': isAdmin ? handleRemoteNotificationRead : null,
      'admin-all-notifications-read': isAdmin ? handleAllNotificationsRead : null,
      'admin-notification-deleted': isAdmin ? handleNotificationDeleted : null,
      'order-status-update': !isAdmin ? handleStatusUpdate : null,
      'notification-marked-read': !isAdmin ? handleRemoteNotificationRead : null,
      'all-notifications-marked-read': !isAdmin ? handleAllNotificationsRead : null,
      'notification-deleted': !isAdmin ? handleNotificationDeleted : null
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      if (handler) {
        socket.on(event, handler);
      }
    });

    // Cleanup khi component unmount
    return () => {
      Object.entries(listeners).forEach(([event, handler]) => {
        if (handler) {
          socket.off(event, handler);
        }
      });
      processedNotifications.current.clear();
    };
  }, [
    socket, isAdmin, connected, navigate, playNotificationSound,
    debouncedFetchNotifications, shouldAddNotification,
    handleGroupedNotification, handleRemoteNotificationRead,
    handleAllNotificationsRead, handleNotificationDeleted,
    addToProcessedNotifications, getStatusText
  ]);

  // Đánh dấu một thông báo là đã đọc
  const markAsRead = useCallback(async (notificationId) => {
    try {
      setActionLoading(true);
      const notification = notifications.find(n => (n._id === notificationId || n.id === notificationId));
      if (notification && notification.read) {
        setActionLoading(false);
        return;
      }
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId || n.id === notificationId) ? { ...n, read: true } : n)
      );
      const wasUnread = notification && !notification.read;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      const userId = user?._id || user?.id;
      if (userId && socket && connected) {
        socket.emit('mark-notification-read', {
          notificationId: notificationId,
          userId: userId,
          isAdmin: isAdmin
        });
      }
      updateLocalStorageReadStatus(notificationId);
      try {
        if (isAdmin) {
          await adminNotificationService.markAsRead([notificationId]);
        } else {
          await clientNotificationService.markAsRead([notificationId]);
        }
      } catch (apiError) {
      }
    } catch (error) {
      message.error('Không thể đánh dấu thông báo đã đọc');
    } finally {
      setActionLoading(false);
    }
  }, [isAdmin, notifications, user, socket, connected, updateLocalStorageReadStatus]);

  // Đánh dấu tất cả thông báo là đã đọc
  const markAllAsRead = useCallback(async () => {
    try {
      setActionLoading(true);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      const userId = user?._id || user?.id;
      if (userId && socket && connected) {
        socket.emit('mark-all-notifications-read', {
          userId: userId,
          isAdmin: isAdmin
        });
      }
      const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
      const notificationIds = notifications.map(n => n._id);
      localStorage.setItem(readNotificationsKey, JSON.stringify(notificationIds));
      if (isAdmin) {
        const ids = notifications.filter(n => !n.read).map(n => n._id);
        if (ids.length > 0) {
          await adminNotificationService.markAsRead(ids);
        }
      } else {
        await clientNotificationService.markAllAsRead();
      }
      message.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error) {
      message.error('Không thể đánh dấu tất cả thông báo đã đọc');
      fetchNotifications();
    } finally {
      setActionLoading(false);
    }
  }, [isAdmin, notifications, user, socket, connected, fetchNotifications]);

  // Xóa một thông báo
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      setActionLoading(true);
      const notificationToDelete = notifications.find(n => n._id === notificationId);
      const wasUnread = notificationToDelete && !notificationToDelete.read;
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      try {
        const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
        let existingRead = JSON.parse(localStorage.getItem(readNotificationsKey) || '[]');
        existingRead = existingRead.filter(id => id !== notificationId);
        localStorage.setItem(readNotificationsKey, JSON.stringify(existingRead));
      } catch (e) {
      }
      if (isAdmin) {
      } else {
        await clientNotificationService.deleteNotification(notificationId);
      }
      message.success('Đã xóa thông báo');
    } catch (error) {
      message.error('Không thể xóa thông báo');
      fetchNotifications();
    } finally {
      setActionLoading(false);
    }
  }, [isAdmin, notifications, fetchNotifications]);

  // Xóa tất cả thông báo
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(isAdmin ? 'adminNotifications' : 'clientNotifications');
    localStorage.removeItem(isAdmin ? 'adminUnreadCount' : 'clientUnreadCount');
    localStorage.removeItem(isAdmin ? 'adminReadNotifications' : 'clientReadNotifications');
    message.success('Đã xóa tất cả thông báo');
  }, [isAdmin]);

  // Sắp xếp thông báo theo thời gian (mới nhất ở đầu)
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) =>
      new Date(b.createdAt || b.timestamp || Date.now()) -
      new Date(a.createdAt || a.timestamp || Date.now())
    );
  }, [notifications]);

  // Cung cấp các giá trị và hàm xử lý thông qua context
  const value = useMemo(() => ({
    notifications: sortedNotifications,
    unreadCount,
    loading,
    actionLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getStatusText,
    refreshNotifications: fetchNotifications,
    isAdmin
  }), [
    sortedNotifications,
    unreadCount,
    loading,
    actionLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getStatusText,
    fetchNotifications,
    isAdmin
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification phải được sử dụng trong NotificationProvider');
  }
  return context;
};