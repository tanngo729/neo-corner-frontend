// components/common/notification/NotificationDropdown.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge, Empty, List, Typography, Button, Tag, message, Popover } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';
import moment from 'moment';
import 'moment/locale/vi';
import './NotificationDropdown.scss';

const { Text } = Typography;

moment.locale('vi');

// Tách component NotificationItem để tối ưu render
const NotificationItem = React.memo(({ notification, onDelete, onClick, getStatusText }) => {
  // Render thông báo phù hợp với loại
  const renderNotificationContent = () => {
    // Xử lý thông báo gom nhóm
    if (notification.type === 'grouped') {
      return (
        <div className="notification-content">
          <Text strong>{notification.title}</Text>
          <div className="notification-desc">{notification.description}</div>

          {/* Hiển thị danh sách các mục con */}
          {notification.items && notification.items.length > 0 && (
            <div className="notification-sublist">
              {notification.items.slice(0, 3).map((item, index) => (
                <div key={index} className="notification-subitem">
                  #{item.orderCode}
                </div>
              ))}
              {notification.items.length > 3 && (
                <div className="notification-more">
                  +{notification.items.length - 3} thông báo khác
                </div>
              )}
            </div>
          )}

          <div className="notification-time">
            {moment(notification.createdAt).fromNow()}
          </div>
        </div>
      );
    }

    // Xử lý các loại thông báo thông thường
    return (
      <div className="notification-content">
        <div className="notification-title">
          <Text strong>{notification.title}</Text>
          {notification.status && (
            <Tag color={getNotificationStatusColor(notification.status)}>
              {getStatusText(notification.status)}
            </Tag>
          )}
        </div>
        <div className="notification-desc">{notification.description}</div>
        <div className="notification-time">
          {moment(notification.createdAt).fromNow()}
        </div>
      </div>
    );
  };

  // Xác định màu sắc cho trạng thái
  const getNotificationStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'processing';
      case 'AWAITING_PAYMENT': return 'warning';
      case 'PROCESSING': return 'blue';
      case 'SHIPPING': return 'cyan';
      case 'DELIVERED': return 'green';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'REFUNDED': return 'volcano';
      default: return 'default';
    }
  };

  return (
    <List.Item
      className={`notification-item ${notification.read ? '' : 'unread'}`}
      onClick={() => onClick(notification)}
      actions={[
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => onDelete(e, notification)}
        />
      ]}
    >
      {renderNotificationContent()}
    </List.Item>
  );
});

const NotificationDropdown = React.memo(({ isAdminProp }) => {
  const {
    notifications = [],
    unreadCount = 0,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    getStatusText,
    refreshNotifications,
    isAdmin: contextIsAdmin,
    loading,
    actionLoading
  } = useNotification();

  // Sử dụng isAdmin từ prop nếu được cung cấp, nếu không lấy từ context
  const isAdmin = isAdminProp !== undefined ? isAdminProp : contextIsAdmin;

  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Tự động refresh thông báo khi component mount
  useEffect(() => {
    console.log(`[NotificationDropdown] ${isAdmin ? 'Admin' : 'Client'} - Component mounted`);
    if (refreshNotifications) {
      refreshNotifications();
    }
  }, [refreshNotifications, isAdmin]);

  // Xử lý khi nhấp vào thông báo
  const handleNotificationClick = useCallback(async (notification) => {
    try {
      console.log(`[NotificationDropdown] Click vào thông báo:`, notification);

      // Luôn sử dụng _id - phía backend sử dụng _id từ MongoDB
      const notificationId = notification._id;

      if (!notificationId) {
        console.error('[NotificationDropdown] Thiếu ID thông báo:', notification);
        return;
      }

      // Đánh dấu là đã đọc nếu chưa đọc
      if (!notification.read) {
        await markAsRead(notificationId);
      }

      // Xử lý khác nhau cho thông báo gom nhóm
      if (notification.type === 'grouped') {
        // Mở trang danh sách đơn hàng với bộ lọc phù hợp nếu có
        const route = isAdmin ? '/admin/orders' : '/orders';
        navigate(route);
      }
      // Điều hướng dựa trên loại thông báo thông thường
      else if (notification.type === 'order-status-update' && notification.orderId) {
        navigate(isAdmin ? `/admin/orders/${notification.orderId}` : `/orders/${notification.orderId}`);
      } else if (notification.type === 'new-order' && notification.orderId) {
        navigate(isAdmin ? `/admin/orders/${notification.orderId}` : `/orders/${notification.orderId}`);
      } else if (notification.type === 'cancelled-by-user' && notification.orderId) {
        navigate(isAdmin ? `/admin/orders/${notification.orderId}` : `/orders/${notification.orderId}`);
      } else if (notification.orderId) {
        navigate(isAdmin ? `/admin/orders/${notification.orderId}` : `/orders/${notification.orderId}`);
      }

      setVisible(false);
    } catch (error) {
      console.error('[NotificationDropdown] Lỗi khi xử lý thông báo:', error);
      message.error('Không thể xử lý thông báo. Vui lòng thử lại.');
    }
  }, [markAsRead, navigate, isAdmin]);

  // Xử lý "Đánh dấu đã đọc tất cả"
  const handleMarkAllAsRead = useCallback(async (e) => {
    try {
      e.stopPropagation();
      console.log(`[NotificationDropdown] Đánh dấu tất cả đã đọc`);
      await markAllAsRead();
    } catch (error) {
      console.error('[NotificationDropdown] Lỗi khi đánh dấu đã đọc:', error);
      message.error('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    }
  }, [markAllAsRead]);

  // Xử lý refresh thông báo
  const handleRefresh = useCallback(async (e) => {
    try {
      e.stopPropagation();
      if (refreshing || loading) return; // Tránh gọi API nhiều lần

      setRefreshing(true);
      console.log(`[NotificationDropdown] Đang làm mới thông báo...`);

      if (refreshNotifications) {
        await refreshNotifications();
        message.success('Đã làm mới thông báo');
      }
    } catch (error) {
      console.error('[NotificationDropdown] Lỗi khi làm mới thông báo:', error);
      message.error('Không thể làm mới thông báo. Vui lòng thử lại.');
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refreshNotifications, refreshing, loading]);

  // Hàm xử lý việc xóa một thông báo
  const handleDeleteNotification = useCallback(async (e, notification) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification._id);
    } catch (error) {
      console.error('[NotificationDropdown] Lỗi khi xóa thông báo:', error);
      message.error('Không thể xóa thông báo. Vui lòng thử lại.');
    }
  }, [deleteNotification]);

  // Nội dung của Popover với useMemo để tránh render lại không cần thiết
  const notificationContent = useMemo(() => (
    <div className="notification-dropdown">
      <div className="notification-header">
        <Button
          type="text"
          size="small"
          onClick={handleMarkAllAsRead}
          icon={<CheckOutlined />}
          disabled={unreadCount === 0 || actionLoading}
          loading={actionLoading}
        >
          Đánh dấu đã đọc
        </Button>

        <Button
          type="text"
          size="small"
          onClick={handleRefresh}
          icon={<ReloadOutlined spin={refreshing || loading} />}
          title="Làm mới thông báo"
          disabled={loading || refreshing}
        >
          Làm mới
        </Button>

        <Button
          type="text"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            clearAllNotifications();
          }}
          icon={<DeleteOutlined />}
          disabled={notifications.length === 0 || actionLoading}
          danger
        >
          Xóa tất cả
        </Button>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có thông báo"
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onDelete={handleDeleteNotification}
                onClick={handleNotificationClick}
                getStatusText={getStatusText}
              />
            )}
          />
        )}
      </div>
    </div>
  ), [
    notifications,
    unreadCount,
    actionLoading,
    loading,
    refreshing,
    handleMarkAllAsRead,
    handleRefresh,
    handleDeleteNotification,
    handleNotificationClick,
    clearAllNotifications,
    getStatusText
  ]);

  return (
    <div className="notification-dropdown-container">
      <Popover
        content={notificationContent}
        trigger="click"
        open={visible}
        onOpenChange={setVisible}
        placement="bottomRight"
        overlayClassName="notification-popover"
        arrow={false}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
        onVisibleChange={(newVisible) => {
          setVisible(newVisible);
          if (newVisible && refreshNotifications) {
            refreshNotifications();
          }
        }}
      >
        <Badge count={unreadCount} size="small" offset={[-2, 4]}>
          <Button
            type="text"
            className="notification-icon-button"
            icon={<BellOutlined style={{ fontSize: '20px' }} />}
          />
        </Badge>
      </Popover>
    </div>
  );
});

export const AdminNotificationDropdown = (props) => {
  return <NotificationDropdown isAdminProp={true} {...props} />;
};

export default NotificationDropdown;