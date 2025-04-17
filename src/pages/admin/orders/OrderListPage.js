// src/pages/admin/orders/OrderListPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Table, Tag, message, Button, Space, DatePicker, Input, Select, Tooltip, Badge, Popover, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WifiOutlined,
  ApiOutlined,
  SyncOutlined
} from '@ant-design/icons';
import orderService from '../../../services/admin/orderService';
import moment from 'moment';
import './OrderListPage.scss';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSocket } from '../../../contexts/SocketContext';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderListPage = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { socket, connected } = useSocket();
  const { getStatusText } = useNotification();

  // Use refs to access latest state in event handlers without recreating them
  const paginationRef = useRef({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const filtersRef = useRef({
    search: '',
    status: '',
    dateRange: null,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socketTesting, setSocketTesting] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    socketChecks: 0,
    lastResponse: null,
    reconnectAttempts: 0,
    notifications: []
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: null,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Update refs when state changes
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Lấy danh sách đơn hàng
  const fetchOrders = useCallback(async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);

      // Xây dựng tham số truy vấn - use current state from refs
      const currentFilters = filtersRef.current;

      const params = {
        page,
        limit: pageSize,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder
      };

      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.dateRange && currentFilters.dateRange[0] && currentFilters.dateRange[1]) {
        params.startDate = currentFilters.dateRange[0].startOf('day').toISOString();
        params.endDate = currentFilters.dateRange[1].endOf('day').toISOString();
      }

      const response = await orderService.getOrders(params);

      if (response.success) {
        setOrders(response.data);
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      } else {
        message.error('Không thể lấy danh sách đơn hàng');
      }
    } catch (error) {

      message.error('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    // Handler for new orders
    const handleNewOrder = (data) => {

      const currentPagination = paginationRef.current;
      fetchOrders(currentPagination.current, currentPagination.pageSize);
      if (data.type === 'new-order') {
        message.info(`Đơn hàng mới #${data.orderCode} vừa được tạo!`);
      } else if (data.type === 'cancelled-by-user') {
        message.warning(`Đơn hàng #${data.orderCode} đã bị khách hàng hủy!`);
      }


      setDebugInfo(prev => ({
        ...prev,
        notifications: [...prev.notifications.slice(-9), {
          type: 'new-order',
          timestamp: new Date(),
          data
        }]
      }));
    };

    // Handler for order status updates - ADDED THIS HANDLER
    const handleOrderStatusUpdate = (data) => {

      const currentPagination = paginationRef.current;
      fetchOrders(currentPagination.current, currentPagination.pageSize);

      message.info(`Đơn hàng #${data.orderCode} đã được cập nhật trạng thái!`);

      setDebugInfo(prev => ({
        ...prev,
        notifications: [...prev.notifications.slice(-9), {
          type: 'status-update',
          timestamp: new Date(),
          data
        }]
      }));
    };

    // Lắng nghe phản hồi kiểm tra kết nối
    const handleConnectionVerified = (data) => {
      message.success('Kết nối socket hoạt động!');
      setSocketTesting(false);
      setDebugInfo(prev => ({
        ...prev,
        socketChecks: prev.socketChecks + 1,
        lastResponse: data
      }));
    };

    // Lắng nghe thông báo debug
    const handleDebugNotification = (data) => {
      setDebugInfo(prev => ({
        ...prev,
        notifications: [...prev.notifications.slice(-9), {
          type: data.type,
          timestamp: new Date(),
          data
        }]
      }));
    };

    // Register all needed event listeners
    socket.on('new-order', handleNewOrder);
    socket.on('order-status-update', handleOrderStatusUpdate); // NEW LISTENER
    socket.on('connection-verified', handleConnectionVerified);
    socket.on('debug-notification', handleDebugNotification);

    // Additional events to listen for
    socket.on('admin-notification', handleNewOrder);
    socket.on('cancelled-by-user', handleOrderStatusUpdate);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-update', handleOrderStatusUpdate);
      socket.off('connection-verified', handleConnectionVerified);
      socket.off('debug-notification', handleDebugNotification);
      socket.off('admin-notification', handleNewOrder);
      socket.off('cancelled-by-user', handleOrderStatusUpdate);
    };
  }, [socket, connected, fetchOrders]);

  useEffect(() => {
    fetchOrders(1, pagination.pageSize);
  }, [filters, fetchOrders]);

  // Kiểm tra kết nối socket
  const testSocketConnection = useCallback(() => {
    setSocketTesting(true);
    if (socket) {
      socket.emit('check-connection', {
        page: 'admin-orders',
        timestamp: new Date(),
        userId: user?._id
      });
      message.loading('Đang kiểm tra kết nối socket...', 2);

      // Nếu chưa kết nối, thử kết nối lại
      if (!connected) {
        try {
          socket.connect();
          setDebugInfo(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
          }));
        } catch (error) {
        }
      }

      // Thiết lập timeout để bỏ trạng thái testing
      setTimeout(() => {
        if (setSocketTesting) setSocketTesting(false);
      }, 5000);
    } else {
      message.error('Socket không khả dụng');
      setSocketTesting(false);
    }
  }, [socket, connected, user]);

  // Gửi thông báo broadcast để kiểm tra
  const sendTestBroadcast = useCallback(() => {
    if (socket && connected) {
      socket.emit('admin-broadcast-test', {
        message: 'Kiểm tra broadcast từ admin',
        timestamp: new Date(),
        adminId: user?._id
      });
      message.info('Đã gửi thông báo broadcast thử nghiệm');
    } else {
      message.error('Không thể gửi broadcast: Socket chưa kết nối');
    }
  }, [socket, connected, user]);

  // Xử lý phân trang
  const handleTableChange = useCallback((pagination, filters, sorter) => {
    // Cập nhật thông tin sắp xếp nếu có thay đổi
    if (sorter && sorter.field && sorter.order) {
      const sortBy = sorter.field;
      const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';

      setFilters(prev => ({
        ...prev,
        sortBy,
        sortOrder
      }));
    } else {
      // Nếu chỉ thay đổi trang
      fetchOrders(pagination.current, pagination.pageSize);
    }
  }, [fetchOrders]);

  // Cập nhật filter
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));

    // Reset trang về 1 khi thay đổi filter
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, []);

  // Reset filter
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      dateRange: null,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  }, []);

  // Rest of your component code remains the same...
  // Only keeping what's necessary to show the changes

  // Chuyển đến trang chi tiết đơn hàng
  const viewOrderDetail = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Render trạng thái đơn hàng
  const renderOrderStatus = (status) => {
    let color = 'default';
    let icon = null;

    switch (status) {
      case 'PENDING':
        color = 'processing';
        icon = <ExclamationCircleOutlined />;
        break;
      case 'AWAITING_PAYMENT':
        color = 'warning';
        icon = <ExclamationCircleOutlined />;
        break;
      case 'PROCESSING':
        color = 'processing';
        icon = <ReloadOutlined spin />;
        break;
      case 'SHIPPING':
        color = 'blue';
        icon = <CarOutlined />;
        break;
      case 'DELIVERED':
        color = 'cyan';
        icon = <CheckCircleOutlined />;
        break;
      case 'COMPLETED':
        color = 'success';
        icon = <CheckCircleOutlined />;
        break;
      case 'CANCELLED':
        color = 'error';
        icon = <CloseCircleOutlined />;
        break;
      case 'REFUNDED':
        color = 'volcano';
        icon = <CheckCircleOutlined />;
        break;
      default:
        color = 'default';
    }

    return (
      <Tag color={color} icon={icon}>
        {getStatusText(status)}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (text, record) => (
        <Button type="link" onClick={() => viewOrderDetail(record._id)}>
          {text}
        </Button>
      )
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div>
            <strong>{record.shippingAddress?.fullName || ''}</strong>
          </div>
          <div style={{ fontSize: '12px' }}>
            {record.shippingAddress?.phone || ''}
          </div>
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      render: (text) => formatCurrency(text)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderOrderStatus
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      render: (_, record) => (
        <div>
          {record.paymentMethod === 'COD' ? (
            <Tag color="volcano">COD</Tag>
          ) : record.paymentMethod === 'BANK_TRANSFER' ? (
            <Tag color="blue">Chuyển khoản</Tag>
          ) : record.paymentMethod === 'MOMO' ? (
            <Tag color="purple">MoMo</Tag>
          ) : record.paymentMethod === 'VNPAY' ? (
            <Tag color="cyan">VNPay</Tag>
          ) : (
            <Tag>{record.paymentMethod}</Tag>
          )}
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            {record.payment?.status === 'PENDING' ? (
              <Tag color="orange" size="small">Chờ thanh toán</Tag>
            ) : record.payment?.status === 'COMPLETED' ? (
              <Tag color="green" size="small">Đã thanh toán</Tag>
            ) : record.payment?.status === 'AWAITING' ? (
              <Tag color="blue" size="small">Đang chờ</Tag>
            ) : (
              <Tag size="small">{record.payment?.status || 'N/A'}</Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => viewOrderDetail(record._id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Nội dung popover debug
  const socketDebugContent = (
    <div style={{ maxWidth: '400px' }}>
      <p><strong>Socket ID:</strong> {socket?.id || 'Không có'}</p>
      <p><strong>Kết nối:</strong> {connected ? 'Đã kết nối' : 'Chưa kết nối'}</p>
      <p><strong>Số lần kiểm tra:</strong> {debugInfo.socketChecks}</p>
      <p><strong>Lần kết nối lại:</strong> {debugInfo.reconnectAttempts}</p>
      {debugInfo.lastResponse && (
        <div>
          <p><strong>Phản hồi gần nhất:</strong></p>
          <pre style={{ maxHeight: '100px', overflow: 'auto', background: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
            {JSON.stringify(debugInfo.lastResponse, null, 2)}
          </pre>
        </div>
      )}
      {debugInfo.notifications.length > 0 && (
        <div>
          <p><strong>Thông báo gần đây:</strong></p>
          <div style={{ maxHeight: '150px', overflow: 'auto', background: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
            {debugInfo.notifications.map((notif, index) => (
              <div key={index} style={{ marginBottom: '4px', fontSize: '12px' }}>
                <strong>{moment(notif.timestamp).format('HH:mm:ss')}</strong>: {notif.type}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: '10px' }}>
        <Button size="small" type="primary" onClick={sendTestBroadcast}>
          Gửi thông báo thử nghiệm
        </Button>
      </div>
    </div>
  );

  return (
    <div className="admin-orders-page">
      <Card>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Quản lý đơn hàng</h2>

          <div className="socket-status" style={{ display: 'flex', alignItems: 'center' }}>
            <Popover
              content={socketDebugContent}
              title="Thông tin kết nối Socket"
              trigger="click"
              placement="bottomRight"
            >
              {connected ? (
                <Badge status="success" text="Đã kết nối real-time" />
              ) : (
                <Badge status="error" text="Chưa kết nối real-time" />
              )}
            </Popover>

            <Button
              type="primary"
              size="small"
              icon={<WifiOutlined />}
              loading={socketTesting}
              onClick={testSocketConnection}
              style={{ marginLeft: 8 }}
            >
              Kiểm tra kết nối
            </Button>
          </div>
        </div>

        {!connected && (
          <Alert
            message="Kết nối real-time đang gặp vấn đề"
            description="Bạn có thể không nhận được thông báo đơn hàng mới theo thời gian thực."
            type="warning"
            showIcon
            action={
              <Button type="primary" size="small" onClick={testSocketConnection}>
                Thử kết nối lại
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <div className="order-filters">
          <div className="filter-row">
            <Input
              placeholder="Tìm theo mã đơn hàng, tên, SĐT..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              prefix={<SearchOutlined />}
              className="search-input"
              allowClear
            />

            <Select
              placeholder="Trạng thái đơn hàng"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              className="status-filter"
              allowClear
            >
              <Option value="PENDING">Chờ xử lý</Option>
              <Option value="AWAITING_PAYMENT">Chờ thanh toán</Option>
              <Option value="PROCESSING">Đang xử lý</Option>
              <Option value="SHIPPING">Đang vận chuyển</Option>
              <Option value="DELIVERED">Đã giao hàng</Option>
              <Option value="COMPLETED">Hoàn thành</Option>
              <Option value="CANCELLED">Đã hủy</Option>
              <Option value="REFUNDED">Đã hoàn tiền</Option>
            </Select>

            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              format="DD/MM/YYYY"
              className="date-filter"
            />

            <Tooltip title="Đặt lại bộ lọc">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                className="reset-filter-btn"
              />
            </Tooltip>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          className="orders-table"
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default OrderListPage;