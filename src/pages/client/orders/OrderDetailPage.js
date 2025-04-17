// src/pages/client/orders/OrderDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Table, Tag, Steps, Divider, Button,
  Row, Col, Typography, Space, Image, Skeleton, Alert, Badge
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CarOutlined, StopOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import orderService from '../../../services/client/orderService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSocket } from '../../../contexts/SocketContext';
import './OrderDetailPage.scss';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStatusText } = useNotification();
  const { socket, connected } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Lấy thông tin chi tiết đơn hàng
  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[Client OrderDetailPage] Fetching order details for ID: ${id}`);
      const response = await orderService.getOrderDetail(id);

      if (response.success) {
        setOrder(response.data);
        setLastUpdate(new Date());
        console.log('[Client OrderDetailPage] Order details loaded successfully');
      } else {
        setError('Không thể lấy thông tin đơn hàng');
        console.error('[Client OrderDetailPage] Failed to get order details:', response.message);
      }
    } catch (error) {
      console.error('[Client OrderDetailPage] Error fetching order details:', error);
      setError('Đã xảy ra lỗi khi tải dữ liệu đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load order data on initial mount
  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // Lắng nghe sự kiện cập nhật trạng thái đơn hàng từ socket
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('[Client OrderDetailPage] Setting up socket event listeners');

    const handleStatusUpdate = (data) => {
      console.log('[Client OrderDetailPage] Order status update received:', data);

      // Only refresh if this update is for the current order
      if (data.orderId === id) {
        console.log('[Client OrderDetailPage] Updating current order view');
        fetchOrderDetail();
      }
    };

    socket.on('order-status-update', handleStatusUpdate);

    // Clean up event listener on unmount
    return () => {
      console.log('[Client OrderDetailPage] Removing socket event listeners');
      socket.off('order-status-update', handleStatusUpdate);
    };
  }, [socket, connected, id, fetchOrderDetail]);

  // Xử lý hủy đơn hàng
  const handleCancelOrder = async () => {
    try {
      const reason = prompt('Vui lòng nhập lý do hủy đơn hàng:');

      if (reason === null) return; // Người dùng đã nhấn Cancel

      const response = await orderService.cancelOrder(id, reason || 'Khách hàng hủy đơn');

      if (response.success) {
        // Cập nhật lại thông tin đơn hàng
        fetchOrderDetail();
      }
    } catch (error) {
      console.error('[Client OrderDetailPage] Error canceling order:', error);
    }
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
  };

  // Xác định xem đơn hàng có thể hủy không
  const canCancelOrder = (order) => {
    return order && ['PENDING', 'AWAITING_PAYMENT', 'PROCESSING'].includes(order.status);
  };

  // Lấy chỉ số hiện tại của tiến trình đơn hàng
  const getCurrentStep = (status) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'AWAITING_PAYMENT':
        return 0;
      case 'PROCESSING':
        return 1;
      case 'SHIPPING':
        return 2;
      case 'DELIVERED':
      case 'COMPLETED':
        return 3;
      case 'CANCELLED':
      case 'REFUNDED':
        return -1; // Không áp dụng
      default:
        return 0;
    }
  };

  // Cột bảng sản phẩm
  const productColumns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => (
        <Space>
          {record.image && (
            <Image
              src={record.image}
              alt={record.name}
              width={50}
              height={50}
              style={{ objectFit: 'cover' }}
              fallback="data:image/png;base64,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"
            />
          )}
          <div>
            <Text strong>{record.name}</Text>
            <div>
              <Text type="secondary">SL: {record.quantity}</Text>
            </div>
          </div>
        </Space>
      ),
      width: '50%'
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: price => formatCurrency(price)
    },
    {
      title: 'Thành tiền',
      key: 'total',
      render: (_, record) => formatCurrency(record.price * record.quantity)
    }
  ];

  if (loading) {
    return (
      <div className="container">
        <div className="order-detail-page">
          <div className="page-header">
            <Space>
              <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/orders')}
              >
                Quay lại
              </Button>
              <h2>Đang tải thông tin đơn hàng...</h2>
            </Space>
          </div>
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container">
        <div className="order-detail-page">
          <Alert
            message="Lỗi"
            description={error || "Không thể tải thông tin đơn hàng"}
            type="error"
            showIcon
            action={
              <Button type="primary" onClick={() => navigate('/orders')}>
                Quay lại
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="order-detail-page">
        <div className="page-header">
          <Space>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/orders')}
            >
              Quay lại
            </Button>
            <Title level={4}>Chi tiết đơn hàng #{order.orderCode}</Title>
          </Space>

          <div className="order-status-badge">
            {connected ? (
              <Badge status="success" text="Kết nối real-time đang hoạt động" />
            ) : (
              <Badge status="error" text="Làm mới trang để cập nhật" />
            )}
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#888' }}>
              Cập nhật cuối: {moment(lastUpdate).format('HH:mm:ss')}
            </div>
          </div>
        </div>

        {order.status === 'CANCELLED' && (
          <Alert
            message="Đơn hàng đã bị hủy"
            description={`Lý do: ${order.cancelReason || 'Không có lý do'}`}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        {order.status === 'AWAITING_PAYMENT' && order.paymentMethod !== 'COD' && (
          <Alert
            message="Chờ thanh toán"
            description="Vui lòng hoàn tất thanh toán để đơn hàng được xử lý"
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
            action={
              <Button type="primary">
                Thanh toán ngay
              </Button>
            }
          />
        )}

        {/* Tiến trình đơn hàng */}
        {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
          <Card className="order-progress-card" title="Trạng thái đơn hàng">
            <Steps
              current={getCurrentStep(order.status)}
              status={order.status === 'CANCELLED' ? 'error' : 'process'}
            >
              <Step title="Đặt hàng" description="Đã xác nhận" />
              <Step title="Đang xử lý" description="Đang chuẩn bị" />
              <Step title="Vận chuyển" description="Đang giao hàng" />
              <Step title="Hoàn thành" description="Đã giao hàng" />
            </Steps>
          </Card>
        )}

        <Row gutter={[24, 24]} className="order-info-row">
          <Col xs={24} md={16}>
            {/* Thông tin đơn hàng */}
            <Card title="Thông tin đơn hàng" className="order-info-card">
              <Descriptions
                bordered
                column={{ xs: 1, sm: 2 }}
                size="small"
              >
                <Descriptions.Item label="Mã đơn hàng">
                  {order.orderCode}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đặt hàng">
                  {moment(order.createdAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {renderOrderStatus(order.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Phương thức thanh toán">
                  {order.paymentMethod === 'COD' ? (
                    <Tag color="volcano">Thanh toán khi nhận hàng</Tag>
                  ) : order.paymentMethod === 'BANK_TRANSFER' ? (
                    <Tag color="blue">Chuyển khoản ngân hàng</Tag>
                  ) : order.paymentMethod === 'MOMO' ? (
                    <Tag color="purple">Ví MoMo</Tag>
                  ) : order.paymentMethod === 'VNPAY' ? (
                    <Tag color="cyan">VNPay</Tag>
                  ) : (
                    <Tag>{order.paymentMethod}</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>

              {order.notes && (
                <div className="order-notes">
                  <Text strong>Ghi chú đơn hàng:</Text>
                  <Paragraph>{order.notes}</Paragraph>
                </div>
              )}

              {canCancelOrder(order) && (
                <div className="order-actions">
                  <Button danger onClick={handleCancelOrder}>
                    Hủy đơn hàng
                  </Button>
                  <Text type="secondary">
                    Bạn chỉ có thể hủy đơn hàng khi đơn hàng chưa được vận chuyển
                  </Text>
                </div>
              )}
            </Card>

            {/* Danh sách sản phẩm */}
            <Card
              title="Sản phẩm đã đặt"
              className="order-products-card"
              style={{ marginTop: '20px' }}
            >
              <Table
                dataSource={order.items}
                columns={productColumns}
                pagination={false}
                rowKey={(record) => record.product}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <strong>Tổng tiền sản phẩm</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{formatCurrency(order.subtotal)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        Phí vận chuyển
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        {formatCurrency(order.shippingFee)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    {order.discount > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}>
                          Giảm giá
                          {order.couponCode && (
                            <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                              (Mã: {order.couponCode})
                            </span>
                          )}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} style={{ color: 'red' }}>
                          -{formatCurrency(order.discount)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <strong>Tổng thanh toán</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong style={{ color: '#e31836', fontSize: '16px' }}>
                          {formatCurrency(order.total)}
                        </strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            {/* Thông tin địa chỉ giao hàng */}
            <Card title="Thông tin giao hàng" className="shipping-info-card">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Người nhận">
                  <strong>{order.shippingAddress?.fullName}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {order.shippingAddress?.phone}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ giao hàng">
                  {order.shippingAddress?.street}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.city}
                </Descriptions.Item>
                {order.shippingAddress?.email && (
                  <Descriptions.Item label="Email">
                    {order.shippingAddress.email}
                  </Descriptions.Item>
                )}
                {order.shippingAddress?.notes && (
                  <Descriptions.Item label="Ghi chú giao hàng">
                    {order.shippingAddress.notes}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Quá trình đơn hàng */}
            <Card
              title="Lịch sử đơn hàng"
              className="order-timeline-card"
              style={{ marginTop: '20px' }}
            >
              <Steps direction="vertical" size="small" current={-1}>
                <Step
                  title="Đặt hàng thành công"
                  description={moment(order.createdAt).format('DD/MM/YYYY HH:mm')}
                  status="finish"
                />

                {order.status === 'AWAITING_PAYMENT' && (
                  <Step
                    title="Chờ thanh toán"
                    description="Vui lòng hoàn tất thanh toán"
                    status="wait"
                  />
                )}

                {['PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
                  <Step
                    title="Đang xử lý"
                    description="Đơn hàng đang được chuẩn bị"
                    status="finish"
                  />
                )}

                {['SHIPPING', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
                  <Step
                    title="Đang vận chuyển"
                    description={order.deliveryInfo?.shippedAt
                      ? `Bắt đầu giao: ${moment(order.deliveryInfo.shippedAt).format('DD/MM/YYYY')}`
                      : "Đơn hàng đang được giao đến bạn"
                    }
                    status="finish"
                  />
                )}

                {['DELIVERED', 'COMPLETED'].includes(order.status) && (
                  <Step
                    title="Đã giao hàng"
                    description={order.deliveryInfo?.deliveredAt
                      ? `Ngày giao: ${moment(order.deliveryInfo.deliveredAt).format('DD/MM/YYYY')}`
                      : "Đơn hàng đã được giao thành công"
                    }
                    status="finish"
                  />
                )}

                {order.status === 'COMPLETED' && (
                  <Step
                    title="Hoàn thành"
                    description="Cảm ơn bạn đã mua hàng!"
                    status="finish"
                  />
                )}

                {order.status === 'CANCELLED' && (
                  <Step
                    title="Đơn hàng đã hủy"
                    description={`${order.cancelReason || 'Không có lý do'} (${moment(order.cancelledAt || order.updatedAt).format('DD/MM/YYYY HH:mm')})`}
                    status="error"
                  />
                )}

                {order.status === 'REFUNDED' && (
                  <Step
                    title="Đã hoàn tiền"
                    description={`Đơn hàng đã được hoàn tiền (${moment(order.updatedAt).format('DD/MM/YYYY HH:mm')})`}
                    status="finish"
                  />
                )}
              </Steps>
            </Card>

            {/* Thông tin thêm hoặc hỗ trợ */}
            <Card
              title="Hỗ trợ"
              className="support-card"
              style={{ marginTop: '20px' }}
            >
              <p>Nếu bạn cần hỗ trợ về đơn hàng này, vui lòng liên hệ:</p>
              <p><strong>Hotline:</strong> 1900 xxxx</p>
              <p><strong>Email:</strong> support@neocorner.com</p>
              <Divider />
              <Button type="primary" block>
                Liên hệ hỗ trợ
              </Button>
            </Card>
          </Col>
        </Row>

        {/* Bottom actions */}
        <div className="order-detail-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => navigate('/orders')}>
            Quay lại danh sách đơn hàng
          </Button>

          <Space>
            {order.status === 'DELIVERED' && (
              <Button type="primary">
                Xác nhận đã nhận hàng
              </Button>
            )}
            {['DELIVERED', 'COMPLETED'].includes(order.status) && (
              <Button>
                Đánh giá sản phẩm
              </Button>
            )}
            <Button type="primary" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;