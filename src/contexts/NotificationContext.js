// src/contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notification } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from './SocketContext';
import moment from 'moment';
import 'moment/locale/vi';
import clientNotificationService from '../services/client/notificationService';
import adminNotificationService from '../services/admin/notificationService';

moment.locale('vi');

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định môi trường
  const isAdmin = location.pathname.startsWith('/admin');
  console.log(`[Notification] Path: ${location.pathname}, isAdmin: ${isAdmin}`);

  // Thay vì sử dụng hooks trực tiếp, lấy thông tin từ localStorage
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Thêm log state
  useEffect(() => {
    console.log(`[Notification] State: authenticated=${isAuthenticated}, socket=${!!socket}, connected=${connected}`);
    if (user) console.log(`[Notification] User ID: ${user._id || user.id}`);
  }, [isAuthenticated, socket, connected, user]);

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
        console.log(`[Notification] Đã lấy thông tin người dùng từ localStorage: ${userData._id || userData.id}`);
      } catch (error) {
        console.error('Lỗi khi đọc thông tin người dùng:', error);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      console.log(`[Notification] Không có thông tin người dùng trong localStorage`);
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

  // Hàm lấy thông báo từ API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[Notification] Không fetch API vì chưa xác thực');
      return;
    }

    try {
      setLoading(true);
      console.log('[Notification] Đang fetch thông báo...');

      const response = await notificationService.getNotifications({ limit: 20 });
      console.log('[Notification] API response:', response);

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

      console.log('[Notification] Đã nhận:', notificationsData.length, 'thông báo');

      if (notificationsData.length > 0) {
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isAuthenticated, notificationService]);

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
        console.log(`[Notification] Đã tải ${parsed.length} thông báo từ localStorage`);
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
    console.log(`[Notification] Đã lưu ${notifications.length} thông báo vào localStorage`);
  }, [notifications, unreadCount, isAdmin]);

  // Debug - đăng ký tất cả các sự kiện socket
  useEffect(() => {
    if (!socket) return;

    const handleAnyEvent = (eventName, ...args) => {
      console.log(`[Notification] Socket event "${eventName}":`, args[0]);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, [socket]);

  // Lắng nghe sự kiện socket
  useEffect(() => {
    if (!socket) {
      console.log('[Notification] Socket chưa khởi tạo, không thể lắng nghe sự kiện');
      return;
    }

    console.log(`[Notification] Đang thiết lập lắng nghe sự kiện socket (isAdmin: ${isAdmin})`);

    // Xử lý đơn hàng mới (cho admin)
    const handleNewOrder = (data) => {
      console.log('[Notification] Nhận sự kiện new-order:', data);
      if (!isAdmin) {
        console.log('[Notification] Bỏ qua vì không phải admin');
        return;
      }

      if (!data || !data.orderCode) {
        console.log('[Notification] Dữ liệu không hợp lệ');
        return;
      }

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

      console.log('[Notification] Thêm thông báo mới:', newNotification);
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(count => count + 1);

      // Cập nhật từ API
      fetchNotifications();
    };

    // Xử lý cập nhật trạng thái đơn hàng (cho khách hàng)
    const handleOrderStatusUpdate = (data) => {
      console.log('[Notification] Nhận sự kiện order-status-update:', data);
      if (isAdmin) {
        console.log('[Notification] Bỏ qua vì là admin');
        return;
      }

      if (!data || !data.orderCode) {
        console.log('[Notification] Dữ liệu không hợp lệ');
        return;
      }

      notification.open({
        message: 'Đơn hàng cập nhật',
        description: `Đơn hàng #${data.orderCode} đã được cập nhật trạng thái thành ${getStatusText(data.status)}`,
        onClick: () => navigate(`/orders/${data.orderId}`),
        duration: 5
      });

      playNotificationSound();

      const newNotification = {
        id: Date.now(),
        title: 'Cập nhật đơn hàng',
        description: `Đơn hàng #${data.orderCode} cập nhật: ${getStatusText(data.status)}`,
        time: new Date(),
        orderId: data.orderId,
        orderCode: data.orderCode,
        type: 'order-status-update',
        status: data.status,
        read: false
      };

      console.log('[Notification] Thêm thông báo mới:', newNotification);
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(count => count + 1);
    };

    // Xử lý broadcast (cho cả admin và client)
    const handleBroadcast = (data) => {
      console.log('[Notification] Nhận sự kiện broadcast:', data);
      if (data.type === 'new-order' && isAdmin) {
        handleNewOrder(data);
      }
    };

    // Đăng ký lắng nghe sự kiện phù hợp
    if (isAdmin) {
      console.log('[Notification] Đăng ký lắng nghe sự kiện admin');
      socket.on('new-order', handleNewOrder);
      socket.on('admin-notification', handleNewOrder);
    } else {
      console.log('[Notification] Đăng ký lắng nghe sự kiện khách hàng');
      socket.on('order-status-update', handleOrderStatusUpdate);
      socket.on('order-status-broadcast', (data) => {
        console.log('[Notification] Nhận order-status-broadcast:', data);
        handleOrderStatusUpdate(data);
      });
    }

    // Đăng ký broadcast cho cả hai loại người dùng
    socket.on('broadcast', handleBroadcast);

    return () => {
      if (isAdmin) {
        socket.off('new-order', handleNewOrder);
        socket.off('admin-notification', handleNewOrder);
      } else {
        socket.off('order-status-update', handleOrderStatusUpdate);
        socket.off('order-status-broadcast');
      }
      socket.off('broadcast', handleBroadcast);
    };
  }, [socket, isAdmin, navigate, playNotificationSound, fetchNotifications]);

  // Thêm useEffect theo dõi isAuthenticated để tự động làm mới thông báo (cho khách hàng)
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      console.log('[Notification] Người dùng vừa đăng nhập, đang tải thông báo...');
      fetchNotifications();

      // Kiểm tra thông báo mới mỗi 30 giây
      const autoRefreshInterval = setInterval(() => {
        console.log('[Notification] Tự động làm mới thông báo...');
        fetchNotifications();
      }, 30000);

      return () => {
        clearInterval(autoRefreshInterval);
      };
    }
  }, [isAuthenticated, isAdmin, fetchNotifications]);

  // Hàm chủ động kiểm tra thông báo mới nhất
  const [lastCheckTime, setLastCheckTime] = useState(new Date().toISOString());
  const checkForNewNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[Notification] Không kiểm tra thông báo vì chưa đăng nhập');
      return [];
    }

    try {
      // Lấy thông báo mới nhất (chỉ 5 thông báo)
      const response = await notificationService.getNotifications({
        limit: 5,
        after: lastCheckTime // Chỉ lấy thông báo mới so với thời điểm kiểm tra cuối
      });

      if (response.success && response.data && response.data.length > 0) {
        // Thêm thông báo mới vào đầu danh sách
        setNotifications(prev => {
          // Lọc các thông báo trùng lặp
          const existingIds = prev.map(n => n._id || n.id);
          const newNotifications = response.data.filter(n => !existingIds.includes(n._id || n.id));

          if (newNotifications.length > 0) {
            console.log(`[Notification] Tìm thấy ${newNotifications.length} thông báo mới`);
            // Cập nhật số thông báo chưa đọc
            setUnreadCount(prevCount => prevCount + newNotifications.length);
            // Phát âm thanh thông báo
            playNotificationSound();
            // Cập nhật lastCheckTime
            setLastCheckTime(new Date().toISOString());
            return [...newNotifications, ...prev];
          }
          return prev;
        });
      }

      return response.data || [];
    } catch (error) {
      console.error('Lỗi khi kiểm tra thông báo mới:', error);
      return [];
    }
  }, [isAuthenticated, notificationService, lastCheckTime, playNotificationSound]);

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

  // Đánh dấu thông báo đã đọc
  const markAsRead = useCallback(async (notificationId) => {
    try {
      setLoading(true);
      if (isAdmin) {
        await adminNotificationService.markAsRead([notificationId]);
      } else {
        await clientNotificationService.markAsRead([notificationId]);
      }
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId || n.id === notificationId) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const ids = notifications.filter(n => !n.read).map(n => n._id);
        if (ids.length > 0) {
          await adminNotificationService.markAsRead(ids);
        }
      } else {
        await clientNotificationService.markAllAsRead();
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, notifications]);

  // Xóa tất cả thông báo
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(isAdmin ? 'adminNotifications' : 'clientNotifications');
    localStorage.removeItem(isAdmin ? 'adminUnreadCount' : 'clientUnreadCount');
  }, [isAdmin]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    getStatusText,
    refreshNotifications: fetchNotifications,
    checkForNewNotifications,
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
