// src/pages/client/PaymentResult/PaymentResultPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Result, Button, Card, Descriptions, Divider, List, Tag, Spin, Alert, Typography, Steps
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, ShoppingOutlined,
  GiftOutlined, CarOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { paymentService } from '../../../services/client';
import './PaymentResultPage.scss';

const { Step } = Steps;
const { Title, Text } = Typography;

const PaymentResultPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pollingTimeoutId, setPollingTimeoutId] = useState(null);

  // Lấy tham số từ URL
  const orderCode = searchParams.get('orderCode');
  const status = searchParams.get('status');
  const errorMessage = searchParams.get('message');
  const resultCode = searchParams.get('resultCode');
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');

  // Kiểm tra trạng thái thanh toán từ URL
  const isSuccessFromUrl = useMemo(() => {
    return resultCode === '0' || vnp_ResponseCode === '00' || status === 'success';
  }, [resultCode, vnp_ResponseCode, status]);

  // Format tiền tệ
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount).replace('₫', 'đ');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Hàm kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async (orderCode) => {
    try {
      const response = await paymentService.checkPaymentStatus(orderCode);

      if (!response?.data?.success) return false;

      const paymentData = response.data.data;

      // Nếu đã thanh toán hoặc đơn hàng đã xử lý, lấy thông tin chi tiết
      if (paymentData.paymentStatus === 'COMPLETED' ||
        ['PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED'].includes(paymentData.status)) {

        const resultResponse = await paymentService.getPaymentResult(orderCode);
        if (resultResponse?.data?.success) {
          setPaymentResult(resultResponse.data.data);
          return true;
        }
      }

      // Đã thử kiểm tra đủ số lần hoặc không phải thanh toán online
      if (retryCount >= 5 ||
        !['MOMO', 'VNPAY'].includes(paymentData.paymentMethod) ||
        !['AWAITING', 'PENDING'].includes(paymentData.paymentStatus)) {

        const resultResponse = await paymentService.getPaymentResult(orderCode);
        if (resultResponse?.data?.success) {
          setPaymentResult(resultResponse.data.data);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái thanh toán:', error);
      return false;
    }
  };

  // Xử lý việc thử lại thanh toán
  const handleRetryPayment = async (orderCode, paymentMethod) => {
    try {
      setLoading(true);
      const response = await (paymentMethod === 'MOMO'
        ? paymentService.createMomoPayment({ orderCode })
        : paymentService.createVnpayPayment({ orderCode }));

      if (response?.data?.success) {
        window.location.href = response.data.data.paymentUrl;
      } else {
        setError('Không thể tạo lại URL thanh toán');
        setLoading(false);
      }
    } catch (error) {
      console.error('Lỗi khi thử lại thanh toán:', error);
      setError('Không thể tạo lại URL thanh toán');
      setLoading(false);
    }
  };

  // Xử lý đổi phương thức thanh toán
  const handleChangePaymentMethod = async (orderCode, newPaymentMethod) => {
    try {
      setLoading(true);
      const response = await paymentService.retryPayment(orderCode, newPaymentMethod);

      if (response?.data?.success) {
        if (newPaymentMethod === 'COD' || newPaymentMethod === 'BANK_TRANSFER') {
          window.location.reload(); // Tải lại với phương thức mới
        } else {
          handleRetryPayment(orderCode, newPaymentMethod);
        }
      } else {
        setError('Không thể đổi phương thức thanh toán');
        setLoading(false);
      }
    } catch (error) {
      setError('Không thể đổi phương thức thanh toán');
      setLoading(false);
    }
  };

  // Lấy dữ liệu thanh toán từ API và URL
  useEffect(() => {
    const fetchPaymentResult = async () => {
      setLoading(true);
      try {
        // Trích xuất mã đơn hàng từ nhiều nguồn
        let finalOrderCode = orderCode;

        if (!finalOrderCode) {
          // Từ VNPAY
          const vnp_TxnRef = searchParams.get('vnp_TxnRef');
          const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');

          // Từ MOMO
          const extraData = searchParams.get('extraData');
          const orderInfo = searchParams.get('orderInfo');

          if (vnp_TxnRef) {
            finalOrderCode = vnp_TxnRef;
          } else if (extraData) {
            try {
              const decodedData = JSON.parse(atob(extraData));
              if (decodedData.orderCode) finalOrderCode = decodedData.orderCode;
            } catch (e) { }
          } else if (vnp_OrderInfo && vnp_OrderInfo.includes('DH')) {
            const match = vnp_OrderInfo.match(/DH\d+/);
            if (match) finalOrderCode = match[0];
          } else if (orderInfo && orderInfo.includes('DH')) {
            const match = orderInfo.match(/DH\d+/);
            if (match) finalOrderCode = match[0];
          }
        }

        if (!finalOrderCode) {
          setError('Không thể xác định mã đơn hàng');
          setLoading(false);
          return;
        }

        const completed = await checkPaymentStatus(finalOrderCode);

        if (!completed) {
          // Tiếp tục kiểm tra sau 2 giây
          const timeoutId = setTimeout(() => {
            setRetryCount(prevCount => prevCount + 1);
          }, 2000);

          setPollingTimeoutId(timeoutId);
        }
      } catch (error) {
        setError('Không thể xử lý kết quả thanh toán. Vui lòng liên hệ hỗ trợ.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentResult();

    return () => {
      if (pollingTimeoutId) clearTimeout(pollingTimeoutId);
    };
  }, [searchParams, retryCount]);

  // Hiển thị thông tin thanh toán chuyển khoản
  const renderPaymentMethodInfo = () => {
    const { paymentMethodDetails, order } = paymentResult || {};

    if (!order || order.paymentMethod !== 'BANK_TRANSFER' || !paymentMethodDetails) return null;

    return (
      <Card className="bank-transfer-info">
        <Title level={5}>Thông tin chuyển khoản</Title>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Ngân hàng">{paymentMethodDetails.bankName}</Descriptions.Item>
          <Descriptions.Item label="Số tài khoản"><Text copyable>{paymentMethodDetails.accountNumber}</Text></Descriptions.Item>
          <Descriptions.Item label="Chủ tài khoản">{paymentMethodDetails.accountName}</Descriptions.Item>
          <Descriptions.Item label="Chi nhánh">{paymentMethodDetails.branch || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Nội dung chuyển khoản">
            <Text copyable strong>{paymentMethodDetails.transferContent}</Text>
          </Descriptions.Item>
        </Descriptions>
        <Alert
          message="Lưu ý khi chuyển khoản"
          description="Vui lòng ghi đúng nội dung chuyển khoản để đơn hàng được xử lý nhanh chóng."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    );
  };

  // Xác định trạng thái thanh toán
  const getPaymentStatus = () => {
    // Nếu có kết quả từ URL, ưu tiên sử dụng
    if (isSuccessFromUrl) return 'success';
    if (status === 'error') return 'failed';

    // Nếu không có kết quả hoặc đang chờ kết quả từ API
    const { order } = paymentResult || {};
    if (!order) return 'pending';

    if (order.payment.status === 'COMPLETED') return 'success';
    if (order.payment.status === 'FAILED') return 'failed';
    if (order.payment.status === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER') return 'pending_bank';
    if (order.payment.status === 'PENDING' && order.paymentMethod === 'COD') return 'cod';

    return 'pending';
  };

  // Hiển thị trạng thái đơn hàng
  const renderOrderStatus = () => {
    const { order } = paymentResult || {};
    if (!order) return null;

    let currentStep = 0;
    switch (order.status) {
      case 'PROCESSING': currentStep = 1; break;
      case 'SHIPPING': currentStep = 2; break;
      case 'DELIVERED': case 'COMPLETED': currentStep = 3; break;
      case 'CANCELLED': currentStep = -1; break;
      default: currentStep = 0;
    }

    return (
      <div className="order-status-steps">
        <h3>Trạng thái đơn hàng</h3>
        {order.status === 'CANCELLED' ? (
          <Alert
            message="Đơn hàng đã bị hủy"
            description={order.cancelReason || 'Đơn hàng này đã bị hủy'}
            type="error"
            showIcon
          />
        ) : (
          <Steps current={currentStep} size="small">
            <Step title="Đã đặt hàng" description={formatDate(order.createdAt)} icon={<ShoppingOutlined />} />
            <Step title="Đang xử lý" icon={<GiftOutlined />} />
            <Step title="Đang giao hàng" icon={<CarOutlined />} />
            <Step title="Đã giao hàng" icon={<CheckCircleOutlined />} />
          </Steps>
        )}
      </div>
    );
  };

  // Hiển thị kết quả dựa trên trạng thái
  const renderResultContent = () => {
    const paymentStatus = getPaymentStatus();
    const { order } = paymentResult || {};
    if (!order && paymentStatus !== 'success' && paymentStatus !== 'failed') {
      return (
        <Result
          icon={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
          title="Đang xử lý thanh toán"
          subTitle="Đơn hàng của bạn đang được xử lý. Vui lòng chờ trong giây lát."
          extra={[
            <Button key="shop" type="primary" onClick={() => navigate('/products')}>
              Tiếp tục mua sắm
            </Button>
          ]}
        />
      );
    }

    // Hiển thị nút thử lại thanh toán nếu cần
    const renderRetryButton = () => {
      if (!order) return null;
      if ((order.paymentMethod === 'MOMO' || order.paymentMethod === 'VNPAY') &&
        (order.payment.status === 'AWAITING' || order.payment.status === 'PENDING')) {
        return (
          <Button
            type="primary"
            onClick={() => handleRetryPayment(order.orderCode, order.paymentMethod)}
            style={{ marginRight: 8 }}
          >
            Thử lại thanh toán
          </Button>
        );
      }
      return null;
    };

    switch (paymentStatus) {
      case 'success':
        return (
          <Result
            status="success"
            title="Thanh toán thành công!"
            subTitle={`Cảm ơn bạn đã mua hàng. Đơn hàng ${order ? `#${order.orderCode}` : ''} đã được thanh toán thành công và đang được xử lý.`}
            extra={[
              <Button key="orders" onClick={() => navigate('/orders')}>Xem đơn hàng của tôi</Button>,
              <Button type="primary" key="shop" onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
            ]}
          />
        );

      case 'failed':
        return (
          <Result
            status="error"
            title="Thanh toán không thành công"
            subTitle={errorMessage || 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'}
            extra={[
              renderRetryButton(),
              <Button key="orders" onClick={() => navigate('/orders')}>Xem đơn hàng</Button>,
              <Button key="shop" onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
            ]}
          />
        );

      case 'pending_bank':
        return (
          <Result
            icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            title="Chờ thanh toán chuyển khoản"
            subTitle={`Đơn hàng #${order.orderCode} đã được tạo thành công. Vui lòng hoàn tất thanh toán bằng cách chuyển khoản.`}
            extra={[
              <Button
                key="change_payment"
                onClick={() => handleChangePaymentMethod(order.orderCode, 'COD')}
                style={{ marginRight: 8 }}
              >
                Đổi thanh toán COD
              </Button>,
              <Button key="orders" onClick={() => navigate('/orders')}>Xem đơn hàng của tôi</Button>,
              <Button type="primary" key="shop" onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
            ]}
          />
        );

      case 'cod':
        return (
          <Result
            status="success"
            title="Đặt hàng thành công!"
            subTitle={`Đơn hàng #${order.orderCode} đã được tạo thành công. Bạn sẽ thanh toán khi nhận hàng.`}
            extra={[
              <Button key="orders" onClick={() => navigate('/orders')}>Xem đơn hàng của tôi</Button>,
              <Button type="primary" key="shop" onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
            ]}
          />
        );

      default: // pending
        return (
          <Result
            icon={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
            title="Đang xử lý thanh toán"
            subTitle={`Đơn hàng ${order ? `#${order.orderCode}` : ''} đang được xử lý. Vui lòng chờ trong giây lát.`}
            extra={[
              renderRetryButton(),
              <Button key="orders" onClick={() => navigate('/orders')}>Xem đơn hàng của tôi</Button>,
              <Button type="primary" key="shop" onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
            ]}
          />
        );
    }
  };

  // Hiển thị trạng thái loading
  if (loading && retryCount === 0) {
    return (
      <div className="payment-result-page loading">
        <Spin size="large" />
        <p>Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  if (loading && retryCount > 0) {
    return (
      <div className="payment-result-page loading">
        <Spin size="large" />
        <p>Đang kiểm tra trạng thái thanh toán... ({retryCount}/5)</p>
        <p className="check-status-note">Vui lòng đợi, chúng tôi đang xác nhận giao dịch của bạn</p>
      </div>
    );
  }

  if (error && !paymentResult) {
    return (
      <div className="payment-result-page">
        <Result
          status="warning"
          title="Không thể tải thông tin thanh toán"
          subTitle={error}
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/')}>Về trang chủ</Button>
          ]}
        />
      </div>
    );
  }

  // Hiển thị trang kết quả thanh toán đầy đủ
  return (
    <div className="payment-result-page">
      <div className="result-container">
        {/* Kết quả thanh toán */}
        <div className="result-content">
          {renderResultContent()}
        </div>

        {/* Thông tin thanh toán chuyển khoản (nếu có) */}
        {renderPaymentMethodInfo()}

        {/* Thông báo lỗi (nếu có) */}
        {error && (
          <Alert
            message="Có lỗi xảy ra"
            description={error}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Thông tin đơn hàng */}
        {paymentResult?.order && (
          <div className="order-details">
            <Card title="Thông tin đơn hàng" className="order-card">
              {renderOrderStatus()}

              <Divider />

              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Mã đơn hàng">
                  <Text strong>{paymentResult.order.orderCode}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đặt hàng">
                  {formatDate(paymentResult.order.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Phương thức thanh toán">
                  {(() => {
                    switch (paymentResult.order.paymentMethod) {
                      case 'COD': return 'Thanh toán khi nhận hàng (COD)';
                      case 'MOMO': return 'Ví điện tử MoMo';
                      case 'VNPAY': return 'Thanh toán VNPAY';
                      case 'BANK_TRANSFER': return 'Chuyển khoản ngân hàng';
                      default: return paymentResult.order.paymentMethod;
                    }
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái thanh toán">
                  {(() => {
                    const status = paymentResult.order.payment.status;
                    switch (status) {
                      case 'COMPLETED':
                        return <Tag color="success" icon={<CheckCircleOutlined />}>Đã thanh toán</Tag>;
                      case 'PENDING':
                      case 'AWAITING':
                        return <Tag color="warning" icon={<ExclamationCircleOutlined />}>Chờ thanh toán</Tag>;
                      case 'FAILED':
                        return <Tag color="error" icon={<CloseCircleOutlined />}>Thanh toán thất bại</Tag>;
                      default:
                        return <Tag color="default">{status}</Tag>;
                    }
                  })()}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div className="order-items">
                <h4>Sản phẩm trong đơn hàng</h4>
                <List
                  itemLayout="horizontal"
                  dataSource={paymentResult.order.items || []}
                  renderItem={item => (
                    <List.Item key={item.product}>
                      <List.Item.Meta
                        avatar={item.image && <img src={item.image} alt={item.name} className="item-image" />}
                        title={item.name}
                        description={`${item.quantity} x ${formatCurrency(item.price)}`}
                      />
                      <div className="item-total">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </List.Item>
                  )}
                />
              </div>

              <Divider />

              <div className="order-totals">
                <div className="total-row">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(paymentResult.order.subtotal)}</span>
                </div>

                {paymentResult.order.shippingFee > 0 && (
                  <div className="total-row">
                    <span>Phí vận chuyển:</span>
                    <span>{formatCurrency(paymentResult.order.shippingFee)}</span>
                  </div>
                )}

                {paymentResult.order.codFee > 0 && (
                  <div className="total-row">
                    <span>Phí COD:</span>
                    <span>{formatCurrency(paymentResult.order.codFee)}</span>
                  </div>
                )}

                {paymentResult.order.discount > 0 && (
                  <div className="total-row discount">
                    <span>Giảm giá{paymentResult.order.couponCode ? ` (${paymentResult.order.couponCode})` : ''}:</span>
                    <span>-{formatCurrency(paymentResult.order.discount)}</span>
                  </div>
                )}

                <div className="total-row grand-total">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(paymentResult.order.total)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;