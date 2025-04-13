import React, { useState, useEffect } from 'react';
import { Radio, Card, Skeleton, Alert, Space, Tag } from 'antd';
import { CarOutlined, ClockCircleOutlined, EnvironmentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { checkoutService } from '../../../services/client';
import './ShippingMethodSelector.scss';

const ShippingMethodSelector = ({
  selectedMethod,
  onChange,
  loading: externalLoading = false,
  error: externalError = null,
  deliveryAddress = null
}) => {
  const [shippingMethods, setShippingMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount).replace('₫', 'đ');
  };

  // Fetch phương thức vận chuyển từ API
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        setLoading(true);
        const response = await checkoutService.getShippingMethods();
        if (response?.data?.success && response?.data?.data) {
          if (response.data.data.length === 0) {
            // Nếu không có phương thức nào, sử dụng mặc định
            setShippingMethods([{
              code: "FAST_DELIVERY",
              name: "Giao hàng nhanh Kontum",
              description: "Giao hàng trong 15-35 phút quanh khu vực thành phố Kontum",
              baseFee: 15000,
              estimatedDeliveryMinutes: 35
            }]);
          } else {
            setShippingMethods(response.data.data);
          }
        } else {
          setShippingMethods([{
            code: "FAST_DELIVERY",
            name: "Giao hàng nhanh Kontum",
            description: "Giao hàng trong 15-35 phút quanh khu vực thành phố Kontum",
            baseFee: 15000,
            estimatedDeliveryMinutes: 35
          }]);
        }
      } catch (error) {
        console.error('Lỗi khi lấy phương thức vận chuyển:', error);
        setError('Không thể tải phương thức vận chuyển, đang sử dụng phương thức mặc định');
        setShippingMethods([{
          code: "FAST_DELIVERY",
          name: "Giao hàng nhanh Kontum",
          description: "Giao hàng trong 15-35 phút quanh khu vực thành phố Kontum",
          baseFee: 15000,
          estimatedDeliveryMinutes: 35
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchShippingMethods();
  }, []);

  // Tự động chọn phương thức đầu tiên nếu chưa có lựa chọn
  useEffect(() => {
    if (shippingMethods.length > 0 && !selectedMethod) {
      onChange(shippingMethods[0].code);
    }
  }, [shippingMethods, selectedMethod, onChange]);

  // Tính thời gian giao hàng dự kiến
  const getEstimatedDeliveryTime = (method) => {
    const now = new Date();
    let minutes = method.estimatedDeliveryMinutes || 35;

    const deliveryTime = new Date(now.getTime() + minutes * 60000);
    const hours = deliveryTime.getHours();
    const mins = deliveryTime.getMinutes();
    return `${hours}:${mins < 10 ? '0' + mins : mins}`;
  };

  if (externalLoading || loading) {
    return <Skeleton active paragraph={{ rows: 2 }} />;
  }

  const displayError = externalError || error;

  return (
    <div className="shipping-method-selector">
      <h3 className="section-title">
        Phương thức vận chuyển
        <span className="kontum-notice">
          <InfoCircleOutlined /> Chỉ phục vụ khu vực tỉnh Kon Tum
        </span>
      </h3>

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
        className="shipping-methods-group"
      >
        {shippingMethods.map(method => (
          <Card
            key={method.code}
            hoverable
            className={`shipping-method-card ${selectedMethod === method.code ? 'selected' : ''}`}
          >
            <Radio value={method.code}>
              <div className="shipping-method-content">
                <div className="shipping-logo">
                  <CarOutlined className="shipping-icon" />
                </div>
                <div className="shipping-info">
                  <div className="shipping-name">{method.name}</div>
                  <div className="shipping-detail">
                    <Space>
                      <span className="delivery-time">
                        <ClockCircleOutlined /> {method.estimatedDeliveryDays ? `${method.estimatedDeliveryDays} ngày` : '15-35 phút'}
                      </span>
                      {method.estimatedDeliveryDays ? (
                        <Tag color="blue">Giao tiêu chuẩn</Tag>
                      ) : (
                        <Tag color="green">Giao ngay</Tag>
                      )}
                    </Space>
                    <span className="shipping-fee">
                      {method.baseFee > 0 ? formatCurrency(method.baseFee) : 'Miễn phí'}
                    </span>
                  </div>
                  <div className="shipping-description">{method.description}</div>

                  {deliveryAddress && (
                    <div className="delivery-address">
                      <EnvironmentOutlined /> {deliveryAddress}
                    </div>
                  )}

                  {!method.estimatedDeliveryDays && (
                    <div className="estimated-delivery">
                      <strong>Giao hàng dự kiến:</strong> Trước {getEstimatedDeliveryTime(method)}
                    </div>
                  )}
                </div>
              </div>
            </Radio>
          </Card>
        ))}
      </Radio.Group>
    </div>
  );
};

export default ShippingMethodSelector;