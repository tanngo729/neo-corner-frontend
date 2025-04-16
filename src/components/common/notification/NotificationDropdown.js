// components/common/notification/NotificationDropdown.js
import React, { useState, useEffect, useRef } from 'react';
import { Badge, Empty, List, Typography, Button, Tag, message, Popover } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';
import moment from 'moment';
import 'moment/locale/vi';
import './NotificationDropdown.scss';

const { Text } = Typography;

moment.locale('vi');

const NotificationDropdown = ({ isAdminProp }) => {
  const {
    notifications = [],
    unreadCount = 0,
    markAllAsRead,
    markAsRead,
    clearAllNotifications,
    getStatusText,
    refreshNotifications,
    isAdmin: contextIsAdmin,
    loading
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
  const handleNotificationClick = async (notification) => {
    try {
      console.log(`[NotificationDropdown] Click vào thông báo:`, notification);

      // Luôn sử dụng _id - phía backend sử dụng _id từ MongoDB
      const notificationId = notification._id;

      if (!notificationId) {
        console.error('[NotificationDropdown] Thiếu ID thông báo:', notification);
        return;
      }

      // Đánh dấu đã đọc
      await markAsRead(notificationId);

      // Chuyển hướng đến trang chi tiết đơn hàng nếu có
      if (notification.orderId) {
        const route = isAdmin
          ? `/admin/orders/${notification.orderId}`
          : `/orders/${notification.orderId}`;

        console.log(`[NotificationDropdown] Chuyển hướng đến:`, route);
        navigate(route);
      }

      setVisible(false);
    } catch (error) {
      console.error('[NotificationDropdown] Lỗi khi xử lý thông báo:', error);
      message.error('Không thể xử lý thông báo. Vui lòng thử lại.');
    }
  };

  // Xử lý "Đánh dấu đã đọc tất cả"
  const handleMarkAllAsRead = async (e) => {
    try {
      e.stopPropagation();
      console.log(`[NotificationDropdown] Đánh dấu tất cả đã đọc`);
      await markAllAsRead();
      message.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error) {
      console.error('[NotificationDropdown] Lỗi khi đánh dấu đã đọc:', error);
      message.error('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    }
  };

  // Xử lý refresh thông báo
  const handleRefresh = async (e) => {
    try {
      e.stopPropagation();
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
  };

  // Nội dung của Popover
  const notificationContent = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <Button
          type="text"
          size="small"
          onClick={handleMarkAllAsRead}
          icon={<CheckOutlined />}
          disabled={unreadCount === 0}
        >
          Đánh dấu đã đọc
        </Button>

        <Button
          type="text"
          size="small"
          onClick={handleRefresh}
          icon={<ReloadOutlined spin={refreshing || loading} />}
          title="Làm mới thông báo"
        >
          Làm mới
        </Button>

        <Button
          type="text"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            clearAllNotifications();
            message.success('Đã xóa tất cả thông báo');
          }}
          icon={<DeleteOutlined />}
          disabled={notifications.length === 0}
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
              <List.Item
                className={`notification-item ${notification.read ? '' : 'unread'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-content">
                  <Text strong>{notification.title}</Text>
                  <div className="notification-desc">{notification.description}</div>
                  <div className="notification-time">
                    {moment(notification.createdAt).fromNow()}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

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
};

export const AdminNotificationDropdown = (props) => {
  return <NotificationDropdown isAdminProp={true} {...props} />;
};

export default NotificationDropdown;