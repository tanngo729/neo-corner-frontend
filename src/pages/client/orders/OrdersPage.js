// src/pages/client/orders/OrdersPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card, Table, Tag, Tabs, Empty, Alert, Input,
  Button, Tooltip, Skeleton, Space, Badge, message, Popover
} from 'antd';
import {
  SearchOutlined, FilterOutlined, ReloadOutlined,
  ExclamationCircleOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CarOutlined, StopOutlined,
  WifiOutlined, ApiOutlined
} from '@ant-design/icons';
import moment from 'moment';
import orderService from '../../../services/client/orderService';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import { useNotification } from '../../../contexts/NotificationContext';
import './OrdersPage.scss';

const { TabPane } = Tabs;

// Tách OrdersTable thành component riêng biệt với React.memo
const OrdersTable = React.memo(({ orders, columns, loading, pagination, onChange }) => {
  if (loading) {
    return (
      <div className="loading-orders">
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="empty-orders">
        <Empty description="Không có đơn hàng nào" />
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={orders}
      rowKey="_id"
      pagination={pagination}
      onChange={onChange}
      className="orders-table"
    />
  );
});

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected, checkConnection } = useSocket();
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
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketTesting, setSocketTesting] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    socketChecks: 0,
    lastResponse: null,
    reconnectAttempts: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
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
  const fetchOrders = useCallback(async (page = 1, pageSize = 10, status = null) => {
    try {
      setLoading(true);

      // Use current filters from ref
      const currentFilters = filtersRef.current;
      const statusToUse = status !== null ? status : currentFilters.status;

      const params = {
        page,
        limit: pageSize,
        status: statusToUse
      };

      if (currentFilters.search) {
        params.search = currentFilters.search;
      }

      console.log('[Client OrdersPage] Fetching orders with params:', params);
      const response = await orderService.getMyOrders(params);

      if (response.success) {
        setOrders(response.data);
        setPagination({
          current: response.pagination?.page || 1,
          pageSize: response.pagination?.limit || 10,
          total: response.pagination?.total || 0
        });
      } else {
        setOrders([]);
        setPagination({
          current: 1,
          pageSize: 10,
          total: 0
        });
      }
    } catch (error) {
      console.error('[Client OrdersPage] Lỗi khi lấy danh sách đơn hàng:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as we use refs

  // Lắng nghe sự kiện cập nhật trạng thái đơn hàng từ socket
  useEffect(() => {
    if (!socket || !connected) return;

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
      console.log('[Client OrdersPage] Đã nhận thông báo debug:', data);
      message.info(`Đã nhận thông báo debug: ${data.type}`);
    };

    // QUAN TRỌNG: Sự kiện cập nhật trạng thái đơn hàng
    const handleStatusUpdate = (data) => {
      console.log('[Client OrdersPage] Nhận thông báo cập nhật đơn hàng:', data);
      message.info(`Đơn hàng #${data.orderCode} đã được cập nhật trạng thái!`);

      // Get current pagination and filters from refs
      const currentPagination = paginationRef.current;
      const currentFilters = filtersRef.current;

      // CẢI TIẾN: Cập nhật lại danh sách đơn hàng ngay lập tức
      fetchOrders(currentPagination.current, currentPagination.pageSize, currentFilters.status);
    };

    socket.on('order-status-update', handleStatusUpdate);
    socket.on('connection-verified', handleConnectionVerified);
    socket.on('debug-notification', handleDebugNotification);

    console.log('[Client OrdersPage] Socket event listeners registered');

    return () => {
      socket.off('order-status-update', handleStatusUpdate);
      socket.off('connection-verified', handleConnectionVerified);
      socket.off('debug-notification', handleDebugNotification);

      console.log('[Client OrdersPage] Socket event listeners removed');
    };
  }, [socket, connected, fetchOrders]); // Rebuild this event handler only when these dependencies change

  // Tải dữ liệu khi component mount hoặc filter thay đổi
  useEffect(() => {
    console.log('[Client OrdersPage] Filter changed, fetching orders');
    fetchOrders(1, 10, filters.status);
  }, [filters.status, fetchOrders]);

  // Kiểm tra kết nối socket
  const testSocketConnection = useCallback(() => {
    setSocketTesting(true);
    if (socket) {
      // Gửi yêu cầu kiểm tra kết nối
      socket.emit('check-connection', {
        page: 'client-orders',
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
          console.log('[Client OrdersPage] Đang cố gắng kết nối lại socket...');
        } catch (error) {
          console.error('[Client OrdersPage] Lỗi khi cố gắng kết nối lại socket:', error);
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

  // Xử lý phân trang
  const handleTableChange = useCallback((pagination) => {
    fetchOrders(pagination.current, pagination.pageSize, filtersRef.current.status);
  }, [fetchOrders]);

  // Xử lý khi thay đổi tab
  const handleTabChange = useCallback((activeKey) => {
    setFilters(prev => ({
      ...prev,
      status: activeKey === 'all' ? '' : activeKey
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, []);

  // Xử lý tìm kiếm
  const handleSearch = useCallback((value) => {
    setFilters(prev => ({
      ...prev,
      search: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));

    // Use updated refs
    const currentPagination = paginationRef.current;
    fetchOrders(1, currentPagination.pageSize, filtersRef.current.status);
  }, [fetchOrders]);

  // Xử lý hủy đơn hàng
  const handleCancelOrder = useCallback(async (orderId) => {
    try {
      const reason = prompt('Vui lòng nhập lý do hủy đơn hàng:');

      if (reason === null) return; // Người dùng đã nhấn Cancel

      const response = await orderService.cancelOrder(orderId, reason || 'Khách hàng hủy đơn');

      if (response.success) {
        message.success('Đã hủy đơn hàng thành công');
        // Cập nhật lại danh sách - use refs for latest state
        const currentPagination = paginationRef.current;
        const currentFilters = filtersRef.current;
        fetchOrders(currentPagination.current, currentPagination.pageSize, currentFilters.status);
      }
    } catch (error) {
      console.error('[Client OrdersPage] Lỗi khi hủy đơn hàng:', error);
      message.error('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
    }
  }, [fetchOrders]);

  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Render trạng thái đơn hàng
  const renderOrderStatus = useCallback((status) => {
    let color = 'default';
    let icon = null;

    switch (status) {
      case 'PENDING':
        color = 'processing';
        icon = <ClockCircleOutlined />;
        break;
      case 'AWAITING_PAYMENT':
        color = 'warning';
        icon = <ClockCircleOutlined />;
        break;
      case 'PROCESSING':
        color = 'processing';
        icon = <CheckCircleOutlined />;
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
        icon = <StopOutlined />;
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
  }, [getStatusText]);

  // Xác định xem đơn hàng có thể hủy không
  const canCancelOrder = useCallback((order) => {
    return ['PENDING', 'AWAITING_PAYMENT', 'PROCESSING'].includes(order.status);
  }, []);

  const columns = useMemo(() => [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (text, record) => (
        <Link to={`/orders/${record._id}`}>
          {text}
        </Link>
      )
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm')
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
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => navigate(`/orders/${record._id}`)}
          >
            Chi tiết
          </Button>

          {canCancelOrder(record) && (
            <Button
              type="default"
              danger
              size="small"
              onClick={() => handleCancelOrder(record._id)}
            >
              Hủy đơn
            </Button>
          )}
        </Space>
      )
    }
  ], [renderOrderStatus, navigate, canCancelOrder, handleCancelOrder, formatCurrency]);

  // Nội dung popover debug
  const socketDebugContent = useMemo(() => (
    <div>
      <p><strong>Socket ID:</strong> {socket?.id || 'Không có'}</p>
      <p><strong>Kết nối:</strong> {connected ? 'Đã kết nối' : 'Chưa kết nối'}</p>
      <p><strong>Số lần kiểm tra:</strong> {debugInfo.socketChecks}</p>
      <p><strong>Lần kết nối lại:</strong> {debugInfo.reconnectAttempts}</p>
      {debugInfo.lastResponse && (
        <div>
          <p><strong>Phản hồi gần nhất:</strong></p>
          <pre style={{ maxHeight: '100px', overflow: 'auto' }}>
            {JSON.stringify(debugInfo.lastResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  ), [socket, connected, debugInfo]);

  return (
    <div className="client-orders-page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 className="page-title">Đơn hàng của tôi</h1>

          <div className="socket-status" style={{ display: 'flex', alignItems: 'center' }}>
            <Popover
              content={socketDebugContent}
              title="Thông tin kết nối Socket"
              trigger="click"
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

        <div className="orders-filter">
          <Input.Search
            placeholder="Tìm kiếm theo mã đơn hàng..."
            onSearch={handleSearch}
            enterButton
            allowClear
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              const currentPagination = paginationRef.current;
              const currentFilters = filtersRef.current;
              fetchOrders(currentPagination.current, currentPagination.pageSize, currentFilters.status);
            }}
            className="reload-btn"
          />
        </div>

        <Tabs
          defaultActiveKey="all"
          onChange={handleTabChange}
          className="orders-tabs"
          type="card"
        >
          <TabPane tab="Tất cả đơn hàng" key="all">
            <OrdersTable
              orders={orders}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
            />
          </TabPane>
          <TabPane tab="Chờ xử lý" key="PENDING">
            <OrdersTable
              orders={orders}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
            />
          </TabPane>
          <TabPane tab="Đang giao" key="SHIPPING">
            <OrdersTable
              orders={orders}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
            />
          </TabPane>
          <TabPane tab="Hoàn thành" key="COMPLETED">
            <OrdersTable
              orders={orders}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
            />
          </TabPane>
          <TabPane tab="Đã hủy" key="CANCELLED">
            <OrdersTable
              orders={orders}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
            />
          </TabPane>
        </Tabs>

        {!connected && (
          <Alert
            message="Kết nối real-time đang gặp vấn đề"
            description={
              <div>
                <p>Bạn có thể không nhận được các cập nhật trạng thái đơn hàng theo thời gian thực.</p>
                <Button type="primary" onClick={testSocketConnection}>
                  Thử kết nối lại
                </Button>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    </div>
  );
};

export default OrdersPage;