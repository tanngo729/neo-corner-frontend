// src/pages/admin/orders/OrderDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Table, Tag, Space, Button, Modal, Form,
  Select, Input, Timeline, Divider, Row, Col, message, Badge
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CarOutlined, StopOutlined,
  ExclamationCircleOutlined, PrinterOutlined
} from '@ant-design/icons';
import moment from 'moment';
import orderService from '../../../services/admin/orderService';
import { useNotification } from '../../../contexts/NotificationContext';
import './OrderDetailPage.scss';

const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStatusText } = useNotification();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Lấy thông tin chi tiết đơn hàng
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderDetail(id);

      if (response.success) {
        setOrder(response.data);
      } else {
        message.error('Không thể lấy thông tin đơn hàng');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // Mở modal cập nhật trạng thái
  const showStatusUpdateModal = () => {
    form.setFieldsValue({
      status: order.status,
      note: ''
    });
    setStatusModalVisible(true);
  };

  // Xử lý cập nhật trạng thái
  const handleStatusUpdate = async (values) => {
    try {
      setLoading(true);
      const response = await orderService.updateOrderStatus(id, values.status, values.note);

      if (response.success) {
        message.success('Cập nhật trạng thái đơn hàng thành công');
        setOrder(response.data);
        setStatusModalVisible(false);
      } else {
        message.error(response.message || 'Không thể cập nhật trạng thái đơn hàng');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi khi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xác nhận hủy đơn hàng
  const showCancelConfirm = () => {
    confirm({
      title: 'Xác nhận hủy đơn hàng',
      icon: <ExclamationCircleOutlined style={{ color: 'red' }} />,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy đơn hàng này?</p>
          <p>Hành động này không thể hoàn tác.</p>
          <Form layout="vertical">
            <Form.Item
              label="Lý do hủy đơn"
              name="cancelReason"
              rules={[{ required: true, message: 'Vui lòng nhập lý do hủy đơn' }]}
            >
              <TextArea rows={3} id="cancelReason" />
            </Form.Item>
          </Form>
        </div>
      ),
      okText: 'Hủy đơn hàng',
      okType: 'danger',
      cancelText: 'Đóng',
      onOk: async () => {
        const reasonEl = document.getElementById('cancelReason');
        const cancelReason = reasonEl ? reasonEl.value : 'Hủy bởi quản trị viên';

        if (!cancelReason) {
          message.error('Vui lòng nhập lý do hủy đơn');
          return;
        }

        try {
          setLoading(true);
          const response = await orderService.updateOrderStatus(id, 'CANCELLED', cancelReason);

          if (response.success) {
            message.success('Hủy đơn hàng thành công');
            setOrder(response.data);
          } else {
            message.error(response.message || 'Không thể hủy đơn hàng');
          }
        } catch (error) {
          message.error('Đã xảy ra lỗi khi hủy đơn hàng');
        } finally {
          setLoading(false);
        }
      }
    });
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

  // Danh sách cột cho bảng sản phẩm - Đã sửa để hiển thị đầy đủ thông tin
  const productColumns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: '45%', // Tăng chiều rộng cho cột sản phẩm
      render: (_, record) => (
        <Space>
          {record.image && (
            <img
              src={record.image}
              alt={record.name}
              style={{
                width: 50,
                height: 50,
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #f0f0f0'
              }}
            />
          )}
          <span style={{ wordBreak: 'break-word' }}>{record.name}</span>
        </Space>
      )
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: '18%',
      align: 'right', // Canh phải cho dễ đọc
      render: price => formatCurrency(price)
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '15%',
      align: 'right' // Canh phải cho dễ đọc
    },
    {
      title: 'Thành tiền',
      key: 'total',
      width: '22%',
      align: 'right', // Canh phải cho dễ đọc
      render: (_, record) => formatCurrency(record.price * record.quantity)
    }
  ];

  if (!order && !loading) {
    return (
      <div className="order-not-found">
        <h2>Không tìm thấy đơn hàng</h2>
        <Button type="primary" onClick={() => navigate('/admin/orders')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <Card loading={loading} bodyStyle={{ padding: '24px' }}>
        <div className="page-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Space>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/orders')}
            >
              Quay lại
            </Button>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
              Chi tiết đơn hàng #{order?.orderCode}
            </h2>
          </Space>

          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              In đơn hàng
            </Button>

            {order && !['CANCELLED', 'COMPLETED', 'REFUNDED'].includes(order.status) && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={showStatusUpdateModal}
              >
                Cập nhật trạng thái
              </Button>
            )}

            {order && !['CANCELLED', 'COMPLETED', 'REFUNDED'].includes(order.status) && (
              <Button
                danger
                onClick={showCancelConfirm}
              >
                Hủy đơn hàng
              </Button>
            )}
          </Space>
        </div>

        {order && (
          <>
            <Row gutter={24}>
              <Col xs={24} lg={16}>
                <Card
                  title="Thông tin đơn hàng"
                  className="order-info-card"
                  bordered={false}
                  style={{ marginBottom: '20px' }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Row gutter={[16, 16]}>
                    {/* Order Code */}
                    <Col xs={24} sm={12}>
                      <div className="info-item">
                        <div className="info-label">Mã đơn hàng</div>
                        <div className="info-content">
                          <span style={{ fontWeight: 'bold' }}>{order.orderCode}</span>
                        </div>
                      </div>
                    </Col>

                    {/* Order Date */}
                    <Col xs={24} sm={12}>
                      <div className="info-item">
                        <div className="info-label">Ngày đặt hàng</div>
                        <div className="info-content">
                          {moment(order.createdAt).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    </Col>

                    {/* Order Status */}
                    <Col xs={24} sm={12}>
                      <div className="info-item">
                        <div className="info-label">Trạng thái</div>
                        <div className="info-content">
                          {renderOrderStatus(order.status)}
                        </div>
                      </div>
                    </Col>

                    {/* Payment Method */}
                    <Col xs={24} sm={12}>
                      <div className="info-item">
                        <div className="info-label">Phương thức thanh toán</div>
                        <div className="info-content">
                          {order.paymentMethod === 'COD' ? (
                            <Tag color="volcano">Thanh toán khi nhận hàng (COD)</Tag>
                          ) : order.paymentMethod === 'BANK_TRANSFER' ? (
                            <Tag color="blue">Chuyển khoản ngân hàng</Tag>
                          ) : order.paymentMethod === 'MOMO' ? (
                            <Tag color="purple">Ví MoMo</Tag>
                          ) : order.paymentMethod === 'VNPAY' ? (
                            <Tag color="cyan">VNPay</Tag>
                          ) : (
                            <Tag>{order.paymentMethod}</Tag>
                          )}
                        </div>
                      </div>
                    </Col>

                    {/* Payment Status */}
                    <Col xs={24}>
                      <div className="info-item">
                        <div className="info-label">Trạng thái thanh toán</div>
                        <div className="info-content">
                          <div>
                            {order.payment?.status === 'PENDING' ? (
                              <Tag color="orange">Chờ thanh toán</Tag>
                            ) : order.payment?.status === 'COMPLETED' ? (
                              <Tag color="green">Đã thanh toán</Tag>
                            ) : order.payment?.status === 'AWAITING' ? (
                              <Tag color="blue">Đang chờ</Tag>
                            ) : (
                              <Tag>{order.payment?.status || 'N/A'}</Tag>
                            )}
                          </div>
                          {order.payment?.paidAt && (
                            <div style={{ marginTop: '8px', fontSize: '13px' }}>
                              Thời gian thanh toán: {moment(order.payment.paidAt).format('DD/MM/YYYY HH:mm')}
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>

                    {/* Order Notes (if exists) */}
                    {order.notes && (
                      <Col xs={24}>
                        <div className="info-item">
                          <div className="info-label">Ghi chú đơn hàng</div>
                          <div className="info-content">{order.notes}</div>
                        </div>
                      </Col>
                    )}

                    {/* Cancel Reason (if canceled) */}
                    {order.status === 'CANCELLED' && (
                      <Col xs={24}>
                        <div className="info-item">
                          <div className="info-label">Lý do hủy</div>
                          <div className="info-content" style={{ color: 'red' }}>
                            {order.cancelReason || 'Không có lý do'}
                            {order.cancelledAt && (
                              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                Thời gian hủy: {moment(order.cancelledAt).format('DD/MM/YYYY HH:mm')}
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card>

                <Card
                  title="Sản phẩm đặt mua"
                  className="order-products-card"
                  bordered={false}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div style={{ overflow: 'auto' }}>
                    <Table
                      dataSource={order.items}
                      columns={productColumns}
                      pagination={false}
                      rowKey={(record) => record.product}
                      bordered
                      tableLayout="auto"
                      style={{ minWidth: '600px' }}
                      summary={() => (
                        <Table.Summary fixed>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}>
                              <strong>Tổng tiền sản phẩm</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                              <strong>{formatCurrency(order.subtotal)}</strong>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}>
                              Phí vận chuyển
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                              {formatCurrency(order.shippingFee)}
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                          {order.discount > 0 && (
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0} colSpan={3}>
                                Giảm giá
                                {order.couponCode && (
                                  <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                    (Mã: {order.couponCode})
                                  </span>
                                )}
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1} align="right" style={{ color: 'red' }}>
                                -{formatCurrency(order.discount)}
                              </Table.Summary.Cell>
                            </Table.Summary.Row>
                          )}
                          <Table.Summary.Row>
                            <Table.Summary.Cell
                              index={0}
                              colSpan={3}
                              style={{ backgroundColor: '#f0f7ff' }}
                            >
                              <strong>Tổng thanh toán</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell
                              index={1}
                              align="right"
                              style={{ backgroundColor: '#f0f7ff' }}
                            >
                              <strong style={{ color: '#e31836', fontSize: '16px' }}>
                                {formatCurrency(order.total)}
                              </strong>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </Table.Summary>
                      )}
                    />
                  </div>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card
                  title="Thông tin người nhận"
                  className="customer-info-card"
                  bordered={false}
                  style={{ marginBottom: '20px' }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'inline-block', width: '120px' }}>Họ tên:</strong>
                    {order.shippingAddress?.fullName}
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'inline-block', width: '120px' }}>Số điện thoại:</strong>
                    {order.shippingAddress?.phone}
                  </p>
                  {order.shippingAddress?.email && (
                    <p style={{ marginBottom: '12px' }}>
                      <strong style={{ display: 'inline-block', width: '120px' }}>Email:</strong>
                      {order.shippingAddress?.email}
                    </p>
                  )}
                  <p style={{ marginBottom: '12px', wordBreak: 'break-word' }}>
                    <strong style={{ display: 'inline-block', width: '120px' }}>Địa chỉ:</strong>
                    {order.shippingAddress?.street}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.city}
                  </p>
                  {order.shippingAddress?.notes && (
                    <p style={{ marginBottom: '12px', wordBreak: 'break-word' }}>
                      <strong style={{ display: 'inline-block', width: '120px' }}>Ghi chú giao hàng:</strong>
                      {order.shippingAddress?.notes}
                    </p>
                  )}
                </Card>

                <Card
                  title="Lịch sử đơn hàng"
                  className="order-history-card"
                  bordered={false}
                  style={{ marginTop: '20px' }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Timeline>
                    <Timeline.Item>
                      <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Đã tạo đơn hàng</p>
                      <p style={{ margin: '0 0 4px' }}>{moment(order.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                    </Timeline.Item>

                    {order.status === 'AWAITING_PAYMENT' && (
                      <Timeline.Item color="orange">
                        <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Chờ thanh toán</p>
                        <p style={{ margin: '0 0 4px' }}>{moment(order.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                      </Timeline.Item>
                    )}

                    {(order.status === 'PROCESSING' || order.status === 'SHIPPING' || order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                      <Timeline.Item color="blue">
                        <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Đang xử lý</p>
                        <p style={{ margin: '0 0 4px' }}>{moment(order.updatedAt).format('DD/MM/YYYY HH:mm')}</p>
                      </Timeline.Item>
                    )}

                    {(order.status === 'SHIPPING' || order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                      <Timeline.Item color="blue">
                        <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Đang vận chuyển</p>
                        <p style={{ margin: '0 0 4px' }}>{order.deliveryInfo?.shippedAt ? moment(order.deliveryInfo.shippedAt).format('DD/MM/YYYY HH:mm') : moment(order.updatedAt).format('DD/MM/YYYY HH:mm')}</p>
                      </Timeline.Item>
                    )}

                    {order.status === 'COMPLETED' && (
                      <Timeline.Item color="green">
                        <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Hoàn thành</p>
                        <p style={{ margin: '0 0 4px' }}>{moment(order.updatedAt).format('DD/MM/YYYY HH:mm')}</p>
                      </Timeline.Item>
                    )}

                    {order.status === 'CANCELLED' && (
                      <Timeline.Item color="red">
                        <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Đã hủy</p>
                        <p style={{ margin: '0 0 4px' }}>{order.cancelledAt ? moment(order.cancelledAt).format('DD/MM/YYYY HH:mm') : moment(order.updatedAt).format('DD/MM/YYYY HH:mm')}</p>
                        <p style={{ margin: '0 0 4px', wordBreak: 'break-word' }}>Lý do: {order.cancelReason || 'Không có lý do'}</p>
                      </Timeline.Item>
                    )}
                  </Timeline>
                </Card>

                {order.adminNotes && order.adminNotes.length > 0 && (
                  <Card
                    title="Ghi chú nội bộ"
                    className="admin-notes-card"
                    bordered={false}
                    style={{ marginTop: '20px' }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Timeline>
                      {order.adminNotes.map((note, index) => (
                        <Timeline.Item key={index}>
                          <p style={{ margin: '0 0 4px', wordBreak: 'break-word' }}>{note.content}</p>
                          <p style={{ margin: '0 0 4px', fontSize: '12px' }}>
                            {moment(note.createdAt).format('DD/MM/YYYY HH:mm')}
                          </p>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </Card>
                )}
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* Modal cập nhật trạng thái */}
      <Modal
        title="Cập nhật trạng thái đơn hàng"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        bodyStyle={{ padding: '20px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStatusUpdate}
        >
          <Form.Item
            name="status"
            label="Trạng thái đơn hàng"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="PROCESSING">Đang xử lý</Option>
              <Option value="SHIPPING">Đang vận chuyển</Option>
              <Option value="COMPLETED">Hoàn thành</Option>
              <Option value="CANCELLED">Đã hủy</Option>
              <Option value="REFUNDED">Đã hoàn tiền</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <TextArea rows={4} placeholder="Nhập ghi chú về việc cập nhật này (không bắt buộc)" />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setStatusModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;