// src/pages/admin/dashboard/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Table, Typography, DatePicker,
  Spin, Alert, Tag, Button, Progress, Empty
} from 'antd';
import {
  ShoppingOutlined, UserOutlined, DollarOutlined, FileTextOutlined,
  ArrowUpOutlined, ArrowDownOutlined, EyeOutlined, ReloadOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CarOutlined, StopOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useSocket } from '../../../contexts/SocketContext';
import { useNotification } from '../../../contexts/NotificationContext';
import dashboardService from '../../../services/admin/dashboardService';
import './DashboardPage.scss';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { connected } = useSocket();
  const { getStatusText } = useNotification();

  // State for loading statuses and data
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // State for date range filter
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days').startOf('day'),
    moment().endOf('day')
  ]);

  // State for dashboard data
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      setChartLoading(true);
      setOrdersLoading(true);

      // Fetch all dashboard data using real API calls
      const [statsResponse, recentOrdersResponse, topProductsResponse, topCustomersResponse, salesChartResponse, statusDistributionResponse] = await Promise.all([
        dashboardService.getStats(dateRange),
        dashboardService.getRecentOrders(5),
        dashboardService.getTopProducts(5, dateRange),
        dashboardService.getTopCustomers(5, dateRange),
        dashboardService.getSalesChart(dateRange),
        dashboardService.getOrderStatusDistribution(dateRange)
      ]);

      // Update states with real data
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      setStatsLoading(false);

      if (recentOrdersResponse.success) {
        setRecentOrders(recentOrdersResponse.data);
      }
      setOrdersLoading(false);

      if (topProductsResponse.success) {
        setTopProducts(topProductsResponse.data);
      }

      if (topCustomersResponse.success) {
        setTopCustomers(topCustomersResponse.data);
      }

      if (salesChartResponse.success) {
        setSalesData(salesChartResponse.data);
      }

      if (statusDistributionResponse.success) {
        setStatusDistribution(statusDistributionResponse.data);
      }

      setChartLoading(false);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
      setStatsLoading(false);
      setChartLoading(false);
      setOrdersLoading(false);
    }
  }, [dateRange]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket event handlers for real-time updates
  useEffect(() => {
    // These would be implemented to update dashboard in real-time
    // Example: socket.on('new-order', handleNewOrder);

    // Make sure to clean up event listeners
    return () => {
      // Example: socket.off('new-order', handleNewOrder);
    };
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Render order status
  const renderOrderStatus = (status) => {
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
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Navigate to order detail
  const viewOrderDetail = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };


  // Columns for tables
  const recentOrderColumns = [
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
          <div>{record.shippingAddress?.fullName || ''}</div>
          <small>{record.shippingAddress?.phone || ''}</small>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderOrderStatus
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      render: (text) => formatCurrency(text)
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm')
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewOrderDetail(record._id)}
        />
      )
    }
  ];

  const topProductsColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Đã bán',
      dataIndex: 'sold',
      key: 'sold',
      render: (text) => <span>{text} sản phẩm</span>
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (text) => formatCurrency(text)
    }
  ];

  const topCustomersColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'orders',
      key: 'orders',
    },
    {
      title: 'Chi tiêu',
      dataIndex: 'spent',
      key: 'spent',
      render: (text) => formatCurrency(text)
    }
  ];

  return (
    <div className="admin-dashboard-page">
      {/* Page Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <Title level={2}>Dashboard</Title>
          <Text>Xin chào! Dưới đây là tổng quan về cửa hàng của bạn</Text>
        </div>
        <div className="header-right">
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchDashboardData}
            loading={loading}
          >
            Cập nhật
          </Button>
        </div>
      </div>

      {!connected && (
        <Alert
          message="Kết nối realtime đang gặp vấn đề"
          description="Bạn có thể không nhận được thông báo theo thời gian thực. Dữ liệu dashboard vẫn được cập nhật khi bạn tải lại trang."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Statistics Overview */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Tổng đơn hàng"
              value={stats.totalOrders}
              prefix={<FileTextOutlined />}
              loading={statsLoading}
              suffix={
                <Tag color="blue">
                  {stats.pendingOrders} đang chờ
                </Tag>
              }
            />
            <div className="stat-footer">
              <Button type="link" onClick={() => navigate('/admin/orders')}>
                Xem đơn hàng
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Doanh thu"
              value={stats.totalRevenue}
              precision={0}
              formatter={(value) => `₫${(value / 1000000).toFixed(2)}M`}
              prefix={<DollarOutlined />}
              loading={statsLoading}
              valueStyle={{ color: '#3f8600' }}
              suffix={
                <Tag color="green">
                  <ArrowUpOutlined /> 12.5%
                </Tag>
              }
            />
            <div className="stat-footer">
              <Text type="secondary">So với tháng trước</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Khách hàng"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
              loading={statsLoading}
              suffix={
                <Tag color="green">
                  <ArrowUpOutlined /> 8.2%
                </Tag>
              }
            />
            <div className="stat-footer">
              <Button type="link" onClick={() => navigate('/admin/customers')}>
                Xem khách hàng
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Sản phẩm"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
              loading={statsLoading}
              suffix={
                <Tag color="orange">
                  <ArrowDownOutlined /> 5%
                </Tag>
              }
            />
            <div className="stat-footer">
              <Button type="link" onClick={() => navigate('/admin/products')}>
                Xem sản phẩm
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Order Status Overview */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Trạng thái đơn hàng" className="status-overview-card">
            <Spin spinning={statsLoading}>
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={6}>
                  <div className="status-item">
                    <div className="status-header">
                      <ClockCircleOutlined className="status-icon pending" />
                      <span className="status-title">Chờ xử lý</span>
                    </div>
                    <div className="status-value">{stats.pendingOrders}</div>
                    <Progress
                      percent={Math.round((stats.pendingOrders / stats.totalOrders) * 100)}
                      showInfo={false}
                      strokeColor="#1890ff"
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="status-item">
                    <div className="status-header">
                      <ReloadOutlined className="status-icon processing" />
                      <span className="status-title">Đang xử lý</span>
                    </div>
                    <div className="status-value">{stats.processingOrders}</div>
                    <Progress
                      percent={Math.round((stats.processingOrders / stats.totalOrders) * 100)}
                      showInfo={false}
                      strokeColor="#52c41a"
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="status-item">
                    <div className="status-header">
                      <CheckCircleOutlined className="status-icon completed" />
                      <span className="status-title">Hoàn thành</span>
                    </div>
                    <div className="status-value">{stats.completedOrders}</div>
                    <Progress
                      percent={Math.round((stats.completedOrders / stats.totalOrders) * 100)}
                      showInfo={false}
                      strokeColor="#52c41a"
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="status-item">
                    <div className="status-header">
                      <CloseCircleOutlined className="status-icon cancelled" />
                      <span className="status-title">Đã hủy</span>
                    </div>
                    <div className="status-value">{stats.cancelledOrders}</div>
                    <Progress
                      percent={Math.round((stats.cancelledOrders / stats.totalOrders) * 100)}
                      showInfo={false}
                      strokeColor="#f5222d"
                    />
                  </div>
                </Col>
              </Row>
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Charts & Tables */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Revenue Chart */}
        <Col xs={24} lg={16}>
          <Card title="Doanh thu theo ngày" className="chart-card">
            <Spin spinning={chartLoading}>
              {salesData.length > 0 ? (
                <div className="simple-chart-container">
                  <div className="simple-chart-header">
                    <div className="simple-chart-legend">
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#1890ff' }}></div>
                        <span>Doanh thu</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#52c41a' }}></div>
                        <span>Đơn hàng</span>
                      </div>
                    </div>
                  </div>
                  <div className="simple-chart">
                    <Table
                      dataSource={salesData.slice(-7)} // Hiển thị 7 ngày gần nhất
                      pagination={false}
                      size="small"
                    >
                      <Table.Column
                        title="Ngày"
                        dataIndex="date"
                        key="date"
                        render={text => moment(text).format('DD/MM/YYYY')}
                      />
                      <Table.Column
                        title="Doanh thu"
                        dataIndex="value"
                        key="value"
                        render={value => formatCurrency(value)}
                        sorter={(a, b) => a.value - b.value}
                      />
                      <Table.Column
                        title="Đơn hàng"
                        dataIndex="orders"
                        key="orders"
                        sorter={(a, b) => a.orders - b.orders}
                      />
                    </Table>
                    <div className="view-all-link">
                      <Button type="link" onClick={() => navigate('/admin/orders')}>
                        Xem tất cả đơn hàng
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Empty description="Không có dữ liệu doanh thu" />
              )}
            </Spin>
          </Card>
        </Col>

        {/* Status Distribution */}
        <Col xs={24} lg={8}>
          <Card title="Phân bố trạng thái đơn hàng" className="chart-card">
            <Spin spinning={chartLoading}>
              {statusDistribution.length > 0 ? (
                <div className="status-distribution">
                  {statusDistribution.map((status, index) => (
                    <div key={index} className="status-bar">
                      <div className="status-info">
                        <span className="status-label">{getStatusText(status.status)}</span>
                        <span className="status-value">{status.value}</span>
                      </div>
                      <Progress
                        percent={Math.round((status.value / stats.totalOrders) * 100)}
                        showInfo={false}
                        strokeColor={status.color}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="Không có dữ liệu trạng thái" />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title="Đơn hàng gần đây"
            extra={
              <Button type="link" onClick={() => navigate('/admin/orders')}>
                Xem tất cả
              </Button>
            }
            className="recent-orders-card"
          >
            <Table
              columns={recentOrderColumns}
              dataSource={recentOrders}
              rowKey="_id"
              pagination={false}
              loading={ordersLoading}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Top Products & Customers */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Sản phẩm bán chạy"
            extra={
              <Button type="link" onClick={() => navigate('/admin/products')}>
                Xem tất cả
              </Button>
            }
            className="top-products-card"
          >
            <Table
              columns={topProductsColumns}
              dataSource={topProducts}
              rowKey="id"
              pagination={false}
              loading={chartLoading}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Khách hàng tiềm năng"
            extra={
              <Button type="link" onClick={() => navigate('/admin/customers')}>
                Xem tất cả
              </Button>
            }
            className="top-customers-card"
          >
            <Table
              columns={topCustomersColumns}
              dataSource={topCustomers}
              rowKey="id"
              pagination={false}
              loading={chartLoading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;