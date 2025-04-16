// src/contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  // Xác định môi trường
  const isAdmin = location.pathname.startsWith('/admin');

  // Thay vì sử dụng hooks trực tiếp, lấy thông tin từ localStorage
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mảng lưu trữ các thông báo đã được xử lý 
  const processedNotifications = React.useRef(new Set());

  // Lấy user từ localStorage khi component được mount
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
        console.error('Lỗi khi đọc thông tin người dùng:', error);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [isAdmin]);

  // Lấy service thông báo phù hợp
  const notificationService = isAdmin ? adminNotificationService : clientNotificationService;

  // Phát âm thanh thông báo
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Không thể phát âm thanh:', e));
    } catch (error) {
      console.error('Lỗi phát âm thanh:', error);
    }
  }, []);

  // Hàm tạo khóa cho thông báo gom nhóm và kiểm tra trùng lặp
  const createNotificationKey = useCallback((notification) => {
    if (!notification) return '';
    return `${notification.type}-${notification.orderId || ''}-${notification.status || ''}`;
  }, []);

  // Lọc thông báo trùng lặp trong thời gian ngắn
  const shouldAddNotification = useCallback((newNotification) => {
    // Nếu không có thông báo hoặc có ít hơn 3 thông báo, luôn thêm vào
    if (!notifications || notifications.length < 3) return true;

    // Tạo key cho thông báo mới
    const newKey = createNotificationKey(newNotification);

    // Nếu không có orderId, luôn thêm vào (là thông báo hệ thống)
    if (!newNotification.orderId) return true;

    // Kiểm tra có thông báo tương tự gần đây không (trong 5 thông báo gần nhất)
    const recentNotifications = notifications.slice(0, 5);
    const hasSimilar = recentNotifications.some(n => {
      const existingKey = createNotificationKey(n);
      return existingKey === newKey &&
        moment(newNotification.createdAt || new Date()).diff(moment(n.createdAt), 'seconds') < 5;
    });

    return !hasSimilar;
  }, [notifications, createNotificationKey]);

  // Hàm lấy thông báo từ API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);

      const response = await notificationService.getNotifications({ limit: 20 });

      let notificationsData = [];

      // Xử lý các định dạng response khác nhau
      if (response?.data?.data) {
        // Format: { data: { data: [...] } }
        notificationsData = response.data.data;
      } else if (response?.data) {
        // Format: { data: [...] }
        notificationsData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        // Format: [...]
        notificationsData = response;
      }

      if (notificationsData.length > 0) {
        // Cập nhật trạng thái đã đọc từ localStorage
        const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
        const readNotificationsStr = localStorage.getItem(readNotificationsKey);

        if (readNotificationsStr) {
          try {
            const readNotifications = JSON.parse(readNotificationsStr);

            // Áp dụng trạng thái đã đọc vào dữ liệu mới
            notificationsData = notificationsData.map(n => {
              if (readNotifications.includes(n._id)) {
                return { ...n, read: true };
              }
              return n;
            });
          } catch (e) {
            console.error('Lỗi khi đọc thông báo đã đọc từ localStorage:', e);
          }
        }

        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isAuthenticated, notificationService]);

  // Debounce fetchNotifications để tránh gọi quá nhiều lần
  const debouncedFetchNotifications = useCallback(
    debounce(() => {
      fetchNotifications();
    }, 300),
    [fetchNotifications]
  );

  // Khởi tạo - lấy thông báo từ localStorage và API
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

      // Fetch từ API sau một khoảng thời gian ngắn để đảm bảo auth đã hoàn tất
      setTimeout(() => {
        fetchNotifications();
      }, 1000);
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    }
  }, [isAdmin, isAuthenticated, fetchNotifications]);

  // Lưu thông báo vào localStorage
  useEffect(() => {
    if (notifications.length === 0) return;

    const storageKey = isAdmin ? 'adminNotifications' : 'clientNotifications';
    const countKey = isAdmin ? 'adminUnreadCount' : 'clientUnreadCount';

    localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 50)));
    localStorage.setItem(countKey, unreadCount.toString());
  }, [notifications, unreadCount, isAdmin]);

  // Xử lý thông báo gom nhóm
  const handleGroupedNotification = useCallback((data) => {
    if (!data || !data.id) return;

    // Kiểm tra nếu đã xử lý thông báo này
    if (processedNotifications.current.has(data.id)) return;
    processedNotifications.current.add(data.id);

    // Tạo thông báo tổng hợp mới để hiển thị
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

    // Kiểm tra nếu đã có thông báo tương tự gần đây
    if (!shouldAddNotification(groupedNotification)) {
      return;
    }

    // Thêm vào danh sách thông báo
    setNotifications(prev => [groupedNotification, ...prev]);
    setUnreadCount(count => count + 1);

    // Phát âm thanh thông báo
    playNotificationSound();

    // Hiển thị thông báo
    notification.info({
      message: data.title,
      description: data.description,
      duration: 4
    });
  }, [playNotificationSound, shouldAddNotification]);

  // Xử lý thông báo đã đọc từ thiết bị khác
  const handleRemoteNotificationRead = useCallback((data) => {
    if (!data.id) return;

    // Cập nhật state
    setNotifications(prev => {
      const updated = prev.map(n =>
        n._id === data.id ? { ...n, read: true } : n
      );
      return updated;
    });

    // Cập nhật lại số lượng unread
    setUnreadCount(prev => {
      // Kiểm tra xem thông báo có tồn tại và đang ở trạng thái chưa đọc không
      const hasUnreadNotification = notifications.some(n => n._id === data.id && !n.read);
      return hasUnreadNotification ? Math.max(0, prev - 1) : prev;
    });

    // Cập nhật vào localStorage
    updateLocalStorageReadStatus(data.id);
  }, [notifications]);

  // Xử lý tất cả thông báo đã đọc
  const handleAllNotificationsRead = useCallback(() => {
    // Cập nhật state
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setUnreadCount(0);

    // Cập nhật vào localStorage
    const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
    const notificationIds = notifications.map(n => n._id);
    localStorage.setItem(readNotificationsKey, JSON.stringify(notificationIds));
  }, [notifications, isAdmin]);

  // Cập nhật trạng thái đã đọc vào localStorage
  const updateLocalStorageReadStatus = useCallback((notificationId) => {
    try {
      const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
      const existingRead = JSON.parse(localStorage.getItem(readNotificationsKey) || '[]');

      if (!existingRead.includes(notificationId)) {
        existingRead.push(notificationId);
        localStorage.setItem(readNotificationsKey, JSON.stringify(existingRead));
      }
    } catch (e) {
      console.error('Lỗi khi cập nhật trạng thái đã đọc:', e);
    }
  }, [isAdmin]);

  // Xử lý khi thông báo bị xóa từ thiết bị khác
  const handleNotificationDeleted = useCallback((data) => {
    if (!data.id) return;

    const deletedNotification = notifications.find(n => n._id === data.id);
    const wasUnread = deletedNotification && !deletedNotification.read;

    setNotifications(prev => prev.filter(notification => notification._id !== data.id));

    // Cập nhật lại số lượng unread nếu thông báo bị xóa chưa đọc
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  // Lắng nghe sự kiện socket
  useEffect(() => {
    if (!socket || !connected) return;

    const handleStatusUpdate = (data) => {
      // Nếu là trang admin thì bỏ qua
      if (isAdmin) return;

      // Kiểm tra nếu đã xử lý thông báo này
      if (processedNotifications.current.has(data.notificationId || data.orderId)) return;
      processedNotifications.current.add(data.notificationId || data.orderId);

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

      // Kiểm tra nếu đã có thông báo tương tự gần đây
      if (!shouldAddNotification(newNotification)) return;

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(count => count + 1);
    };

    const handleNewOrder = (data) => {
      if (!isAdmin) return;

      // Kiểm tra nếu đã xử lý thông báo này
      if (processedNotifications.current.has(data.notificationId || data.orderId)) return;
      processedNotifications.current.add(data.notificationId || data.orderId);

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

      // Kiểm tra nếu đã có thông báo tương tự gần đây
      if (!shouldAddNotification(newNotification)) return;

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(count => count + 1);

      // Cập nhật từ API
      debouncedFetchNotifications();
    };

    // Các listeners cho sự kiện notification
    const listeners = {
      // Chung cho cả admin và client
      'grouped-notification': handleGroupedNotification,

      // Admin specific
      'new-order': isAdmin ? handleNewOrder : null,
      'admin-notification': isAdmin ? handleNewOrder : null,
      'admin-notification-read': isAdmin ? handleRemoteNotificationRead : null,
      'admin-all-notifications-read': isAdmin ? handleAllNotificationsRead : null,
      'admin-notification-deleted': isAdmin ? handleNotificationDeleted : null,

      // Client specific
      'order-status-update': !isAdmin ? handleStatusUpdate : null,
      'notification-marked-read': !isAdmin ? handleRemoteNotificationRead : null,
      'all-notifications-marked-read': !isAdmin ? handleAllNotificationsRead : null,
      'notification-deleted': !isAdmin ? handleNotificationDeleted : null
    };

    // Register all listeners
    Object.entries(listeners).forEach(([event, handler]) => {
      if (handler) {
        socket.on(event, handler);
      }
    });

    // Cleanup
    return () => {
      Object.entries(listeners).forEach(([event, handler]) => {
        if (handler) {
          socket.off(event, handler);
        }
      });

      // Reset processed notifications when unmounting to prevent memory leaks
      processedNotifications.current.clear();
    };
  }, [
    socket, isAdmin, connected, navigate, playNotificationSound,
    debouncedFetchNotifications, shouldAddNotification,
    handleGroupedNotification, handleRemoteNotificationRead,
    handleAllNotificationsRead, handleNotificationDeleted
  ]);

  // Đánh dấu thông báo đã đọc
  const markAsRead = useCallback(async (notificationId) => {
    try {
      setActionLoading(true);

      // Kiểm tra xem thông báo này đã được đánh dấu đọc chưa
      const notification = notifications.find(n => (n._id === notificationId || n.id === notificationId));
      if (notification && notification.read) {
        setActionLoading(false);
        return; // Bỏ qua nếu đã đọc
      }

      // Cập nhật UI trước để tạo cảm giác phản hồi nhanh
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId || n.id === notificationId) ? { ...n, read: true } : n)
      );

      const wasUnread = notification && !notification.read;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Đánh dấu đã đọc qua socket (real-time) nếu có kết nối
      const userId = user?._id || user?.id;
      if (userId && socket && connected) {
        socket.emit('mark-notification-read', {
          notificationId: notificationId,
          userId: userId,
          isAdmin: isAdmin
        });
      }

      // Lưu ID thông báo đã đọc vào localStorage
      updateLocalStorageReadStatus(notificationId);

      // Đồng thời gọi API để đảm bảo dữ liệu được lưu
      try {
        if (isAdmin) {
          await adminNotificationService.markAsRead([notificationId]);
        } else {
          await clientNotificationService.markAsRead([notificationId]);
        }
      } catch (apiError) {
        console.error('Lỗi khi gọi API đánh dấu đã đọc:', apiError);
        // Không rollback UI vì đã lưu vào localStorage
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
      message.error('Không thể đánh dấu thông báo đã đọc');
    } finally {
      setActionLoading(false);
    }
  }, [isAdmin, notifications, user, socket, connected, updateLocalStorageReadStatus]);

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = useCallback(async () => {
    try {
      setActionLoading(true);

      // Cập nhật UI trước
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      // Đánh dấu tất cả đã đọc qua socket (real-time) nếu có kết nối
      const userId = user?._id || user?.id;
      if (userId && socket && connected) {
        socket.emit('mark-all-notifications-read', {
          userId: userId,
          isAdmin: isAdmin
        });
      }

      // Lưu tất cả ID thông báo vào localStorage
      const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
      const notificationIds = notifications.map(n => n._id);
      localStorage.setItem(readNotificationsKey, JSON.stringify(notificationIds));

      // Đồng thời gọi API để đảm bảo dữ liệu được lưu
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
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
      message.error('Không thể đánh dấu tất cả thông báo đã đọc');

      // Rollback UI nếu có lỗi
      fetchNotifications();
    } finally {
      setActionLoading(false);
    }
  }, [isAdmin, notifications, user, socket, connected, fetchNotifications]);

  // Xóa thông báo
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      setActionLoading(true);

      // Kiểm tra xem thông báo chưa đọc hay đã đọc
      const notificationToDelete = notifications.find(n => n._id === notificationId);
      const wasUnread = notificationToDelete && !notificationToDelete.read;

      // Cập nhật UI trước
      setNotifications(prev => prev.filter(n => n._id !== notificationId));

      // Cập nhật số lượng chưa đọc nếu cần
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Cập nhật trạng thái trong localStorage
      try {
        const readNotificationsKey = isAdmin ? 'adminReadNotifications' : 'clientReadNotifications';
        let existingRead = JSON.parse(localStorage.getItem(readNotificationsKey) || '[]');
        existingRead = existingRead.filter(id => id !== notificationId);
        localStorage.setItem(readNotificationsKey, JSON.stringify(existingRead));
      } catch (e) {
        console.error('Lỗi khi cập nhật localStorage:', e);
      }

      // Gọi API để xóa thông báo
      if (isAdmin) {
        // Admin chưa có endpoint xóa - chỉ xóa trên client
      } else {
        await clientNotificationService.deleteNotification(notificationId);
      }

      message.success('Đã xóa thông báo');
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
      message.error('Không thể xóa thông báo');

      // Rollback UI nếu có lỗi
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

  // Chuyển mã trạng thái thành văn bản
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

  // Sắp xếp thông báo theo thời gian - mới nhất đầu tiên
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) =>
      new Date(b.createdAt || b.timestamp || Date.now()) -
      new Date(a.createdAt || a.timestamp || Date.now())
    );
  }, [notifications]);

  const value = {
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
  };

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