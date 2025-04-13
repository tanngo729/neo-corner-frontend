// src/components/client/checkout/PaymentMethodSelector.js
import React, { useState, useEffect } from 'react';
import { Radio, Card, Skeleton, Tooltip, Alert } from 'antd';
import {
  CreditCardOutlined,
  DollarOutlined,
  BankOutlined,
  WalletOutlined,
  InfoCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { checkoutService, paymentService } from '../../../services/client';
import './PaymentMethodSelector.scss';

const PaymentMethodSelector = ({
  selectedMethod,
  onChange,
  loading: externalLoading = false,
  error: externalError = null
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch phương thức thanh toán từ API
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        // Thử lấy từ checkout service trước
        let response = await checkoutService.getPaymentMethods();

        // Nếu không thành công, thử lấy từ payment service
        if (!response?.data?.success || !response?.data?.data || response?.data?.data.length === 0) {
          response = await paymentService.getPaymentMethods();
        }

        if (response?.data?.success && response?.data?.data && response?.data?.data.length > 0) {
          setPaymentMethods(response.data.data);
        } else {
          // Nếu không có phương thức nào từ API, dùng phương thức mặc định
          setPaymentMethods([
            {
              code: "COD",
              name: "Thanh toán khi nhận hàng",
              description: "Thanh toán bằng tiền mặt khi nhận hàng",
              icon: "cod"
            },
            {
              code: "BANK_TRANSFER",
              name: "Chuyển khoản ngân hàng",
              description: "Thanh toán qua chuyển khoản ngân hàng",
              icon: "bank"
            }
          ]);
        }
      } catch (error) {
        console.error('Lỗi khi lấy phương thức thanh toán:', error);
        setError('Không thể tải phương thức thanh toán, đang sử dụng phương thức mặc định');

        // Vẫn sử dụng phương thức mặc định ngay cả khi có lỗi
        setPaymentMethods([
          {
            code: "COD",
            name: "Thanh toán khi nhận hàng",
            description: "Thanh toán bằng tiền mặt khi nhận hàng",
            icon: "cod"
          },
          {
            code: "BANK_TRANSFER",
            name: "Chuyển khoản ngân hàng",
            description: "Thanh toán qua chuyển khoản ngân hàng",
            icon: "bank"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Tự động chọn phương thức đầu tiên khi component được render
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethod) {
      onChange(paymentMethods[0].code);
    }
  }, [paymentMethods, selectedMethod, onChange]);

  // Helper để lấy icon cho mỗi phương thức thanh toán
  const getPaymentIcon = (code) => {
    switch (code) {
      case 'COD':
        return <DollarOutlined className="payment-icon cod" />;
      case 'MOMO':
        return <img src="/payment-icons/momo.png" alt="MoMo" className="payment-logo momo" onError={(e) => e.target.src = "/placeholder-icon.png"} />;
      case 'VNPAY':
        return <img src="/payment-icons/vnpay.png" alt="VNPay" className="payment-logo vnpay" onError={(e) => e.target.src = "/placeholder-icon.png"} />;
      case 'BANK_TRANSFER':
        return <BankOutlined className="payment-icon bank" />;
      default:
        return <CreditCardOutlined className="payment-icon" />;
    }
  };

  if (externalLoading || loading) {
    return (
      <Skeleton active paragraph={{ rows: 3 }} />
    );
  }

  const displayError = externalError || error;

  if (paymentMethods.length === 0) {
    return (
      <div className="payment-method-selector">
        <h3 className="section-title">Phương thức thanh toán</h3>
        <Alert
          message="Không có phương thức thanh toán"
          description="Hiện tại không có phương thức thanh toán nào khả dụng. Vui lòng thử lại sau."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="payment-method-selector">
      <h3 className="section-title">Phương thức thanh toán</h3>

      {displayError && (
        <Alert
          message="Lưu ý"
          description={displayError}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Radio.Group
        onChange={(e) => onChange(e.target.value)}
        value={selectedMethod}
        className="payment-methods-group"
      >
        {paymentMethods.map(method => (
          <Card
            key={method.code}
            hoverable
            className={`payment-method-card ${selectedMethod === method.code ? 'selected' : ''}`}
          >
            <Radio value={method.code}>
              <div className="payment-method-content">
                <div className="payment-logo">
                  {getPaymentIcon(method.code)}
                </div>
                <div className="payment-info">
                  <div className="payment-name">
                    {method.name}
                    {method.code === 'COD' && (
                      <Tooltip title="Phí thu hộ sẽ được tính thêm">
                        <InfoCircleOutlined className="info-icon" />
                      </Tooltip>
                    )}
                  </div>
                  <div className="payment-description">{method.description}</div>
                </div>
              </div>
            </Radio>
          </Card>
        ))}
      </Radio.Group>

      {/* Thông tin thêm cho phương thức thanh toán đã chọn */}
      {selectedMethod === 'COD' && (
        <div className="payment-method-info cod">
          <WalletOutlined className="info-icon" />
          <span>Bạn sẽ thanh toán khi nhận hàng. Có thể áp dụng phí thu hộ.</span>
        </div>
      )}

      {selectedMethod === 'BANK_TRANSFER' && (
        <div className="payment-method-info bank">
          <BankOutlined className="info-icon" />
          <span>Bạn sẽ được cung cấp thông tin tài khoản ngân hàng sau khi đặt hàng.</span>
        </div>
      )}

      {selectedMethod === 'MOMO' && (
        <div className="payment-method-info momo">
          <img
            src="/payment-icons/momo-small.png"
            alt="MoMo"
            className="info-icon-img"
            onError={(e) => e.target.src = "/placeholder-icon.png"}
          />
          <span>Bạn sẽ được chuyển đến cổng thanh toán MoMo để hoàn tất giao dịch.</span>
        </div>
      )}

      {selectedMethod === 'VNPAY' && (
        <div className="payment-method-info vnpay">
          <img
            src="/payment-icons/vnpay-small.png"
            alt="VNPay"
            className="info-icon-img"
            onError={(e) => e.target.src = "/placeholder-icon.png"}
          />
          <span>Bạn sẽ được chuyển đến cổng thanh toán VNPAY để hoàn tất giao dịch.</span>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;