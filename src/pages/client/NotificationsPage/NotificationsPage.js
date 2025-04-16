// src/pages/client/NotificationsPage/NotificationsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  List, Typography, Tag, Divider, Button, Empty, Spin, message,
  Tabs, Tooltip, Popconfirm, Switch, Badge, Space
} from 'antd';
import {
  BellOutlined, CheckCircleOutlined, DeleteOutlined, ReloadOutlined,
  HistoryOutlined, FilterOutlined, InboxOutlined, SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../../services/client/notificationService';
import moment from 'moment';
import 'moment/locale/vi';
import './NotificationsPage.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

moment.locale('vi');

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [loadingAction, setLoadingAction] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const navigate = useNavigate();

  // Tính toán số lượng thông báo theo trạng thái
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  // Lấy danh sách thông báo
  const fetchNotifications = useCallback(async (pageToLoad = 1, filter = activeTab) => {
    try {
      setLoading(true);
      const params = { page: pageToLoad, limit: 10 };

      // Thêm bộ lọc nếu không phải tab "tất cả"
      if (filter === 'unread') params.read = false;
      if (filter === 'read') params.read = true;

      const response = await notificationService.getNotifications(params);

      if (response.success) {
        if (pageToLoad === 1) {
          setNotifications(response.data);
        } else {
          setNotifications(prev => [...prev, ...response.data]);
        }

        setPage(pageToLoad);
        setHasMore(response.data.length === 10);
      } else {
        message.error(response.message || 'Không thể tải thông báo');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
      message.error('Không thể tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Tải thêm thông báo (khi nhấn nút "Xem thêm")
  const loadMore = () => {
    if (loading || !hasMore) return;
    fetchNotifications(page + 1);
  };

  // Đánh dấu tất cả thông báo đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      setLoadingAction(true);
      const response = await notificationService.markAllAsRead();

      if (response.success) {
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        message.success('Đã đánh dấu tất cả thông báo là đã đọc');
      } else {
        message.error(response.message || 'Không thể đánh dấu đã đọc');
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
      message.error('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Làm mới danh sách thông báo
  const refreshNotifications = async () => {
    setPage(1);
    await fetchNotifications(1);
    message.success('Đã làm mới danh sách thông báo');
  };

  // Đánh dấu một thông báo đã đọc và xử lý khi nhấp vào
  const handleNotificationClick = async (notification) => {
    try {
      // Đánh dấu là đã đọc nếu chưa đọc
      if (!notification.read) {
        await notificationService.markAsRead([notification._id]);

        // Cập nhật UI
        setNotifications(prev =>
          prev.map(item =>
            item._id === notification._id ? { ...item, read: true } : item
          )
        );
      }

      // Điều hướng dựa trên loại thông báo
      if (notification.type === 'order-status-update' && notification.orderId) {
        navigate(`/orders/${notification.orderId}`);
      } else if (notification.type === 'new-order' && notification.orderId) {
        navigate(`/orders/${notification.orderId}`);
      } else if (notification.orderId) {
        navigate(`/orders/${notification.orderId}`);
      }
    } catch (error) {
      console.error('Lỗi xử lý thông báo:', error);
      message.error('Không thể xử lý thông báo. Vui lòng thử lại.');
    }
  };

  // Xóa một thông báo
  const handleDeleteNotification = async (e, notification) => {
    e.stopPropagation();
    try {
      setLoadingAction(true);
      const response = await notificationService.deleteNotification(notification._id);

      if (response.success) {
        setNotifications(prev => prev.filter(item => item._id !== notification._id));
        message.success('Đã xóa thông báo');
      } else {
        message.error(response.message || 'Không thể xóa thông báo');
      }
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
      message.error('Không thể xóa thông báo. Vui lòng thử lại.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Xử lý thay đổi tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    fetchNotifications(1, tab);
  };

  // Hiển thị trạng thái theo màu
  const getStatusTag = (status) => {
    const statusMap = {
      'PENDING': { color: 'processing', text: 'Chờ xử lý' },
      'AWAITING_PAYMENT': { color: 'warning', text: 'Chờ thanh toán' },
      'PROCESSING': { color: 'blue', text: 'Đang xử lý' },
      'SHIPPING': { color: 'cyan', text: 'Đang vận chuyển' },
      'DELIVERED': { color: 'green', text: 'Đã giao hàng' },
      'COMPLETED': { color: 'success', text: 'Hoàn thành' },
      'CANCELLED': { color: 'error', text: 'Đã hủy' },
      'REFUNDED': { color: 'volcano', text: 'Đã hoàn tiền' }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // Khi chế độ "Tự làm mới" được bật
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('Tự động làm mới thông báo...');
        fetchNotifications(1, activeTab);
      }, 30000); // 30 giây làm mới một lần
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchNotifications, activeTab]);

  // Tải thông báo khi component được tạo
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sắp xếp thông báo theo thời gian - mới nhất đầu tiên hoặc cũ nhất đầu tiên
  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortNewest ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="notifications-page">
      <div className="notification-header">
        <div className="title-section">
          <Title level={2}>
            <BellOutlined /> Thông báo của tôi
          </Title>
          <div className="notification-stats">
            <Badge count={unreadCount} showZero style={{ backgroundColor: unreadCount ? '#1890ff' : '#ccc' }}>
              <Text>Chưa đọc</Text>
            </Badge>
            <Badge count={notifications.length} showZero style={{ backgroundColor: '#52c41a' }}>
              <Text>Tổng cộng</Text>
            </Badge>
          </div>
        </div>

        <Space>
          <Tooltip title={sortNewest ? "Đang sắp xếp mới nhất trước" : "Đang sắp xếp cũ nhất trước"}>
            <Button
              icon={sortNewest ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
              onClick={() => setSortNewest(!sortNewest)}
            >
              {sortNewest ? "Mới nhất trước" : "Cũ nhất trước"}
            </Button>
          </Tooltip>

          <Button
            type="primary"
            onClick={handleMarkAllAsRead}
            icon={<CheckCircleOutlined />}
            disabled={unreadCount === 0}
            loading={loadingAction}
          >
            Đánh dấu tất cả đã đọc
          </Button>

          <Button
            onClick={refreshNotifications}
            icon={<ReloadOutlined />}
            loading={loading}
          >
            Làm mới
          </Button>

          <Tooltip title="Tự động làm mới thông báo mỗi 30 giây">
            <Switch
              checkedChildren="Tự làm mới: Bật"
              unCheckedChildren="Tự làm mới: Tắt"
              checked={autoRefresh}
              onChange={setAutoRefresh}
            />
          </Tooltip>
        </Space>
      </div>

      <Divider />

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane
          tab={
            <span>
              <InboxOutlined /> Tất cả ({notifications.length})
            </span>
          }
          key="all"
        />
        <TabPane
          tab={
            <span>
              <Badge dot={unreadCount > 0}>
                <HistoryOutlined /> Chưa đọc ({unreadCount})
              </Badge>
            </span>
          }
          key="unread"
        />
        <TabPane
          tab={
            <span>
              <CheckCircleOutlined /> Đã đọc ({readCount})
            </span>
          }
          key="read"
        />
      </Tabs>

      <Spin spinning={loading && page === 1}>
        {notifications.length === 0 ? (
          <Empty
            description="Bạn chưa có thông báo nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={sortedNotifications}
              renderItem={(notification) => (
                <List.Item
                  key={notification._id}
                  className={`notification-item ${notification.read ? '' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                  actions={[
                    <Popconfirm
                      title="Bạn có chắc muốn xóa thông báo này?"
                      onConfirm={(e) => handleDeleteNotification(e, notification)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className="notification-title">
                        <Text strong>{notification.title}</Text>
                        {notification.status && getStatusTag(notification.status)}
                        {!notification.read && <Badge status="processing" />}
                      </div>
                    }
                    description={
                      <div>
                        <div className="notification-desc">{notification.description}</div>
                        <div className="notification-time">
                          {moment(notification.createdAt).fromNow()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {hasMore && (
              <div className="load-more">
                <Button
                  onClick={loadMore}
                  loading={loading && page > 1}
                  disabled={!hasMore}
                >
                  Tải thêm thông báo
                </Button>
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

export default NotificationsPage;