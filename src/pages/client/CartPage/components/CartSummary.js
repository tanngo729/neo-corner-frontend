import React, { useState } from 'react';
import { Row, Col, Input, Form, Divider, Tooltip } from 'antd';
import {
  WalletOutlined,
  TagOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import CustomButton from '../../../../components/common/buttoncustom/CustomButton';
import '../styles/CartSummary.scss';

const CartSummary = ({ cart, onApplyCoupon, onRemoveCoupon, onCheckout, loading }) => {
  const [couponCode, setCouponCode] = useState('');
  const [form] = Form.useForm();

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount).replace('₫', 'đ');
  };

  // Xử lý áp dụng mã giảm giá
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    onApplyCoupon(couponCode.trim());
  };

  // Xử lý remove mã giảm giá
  const handleRemoveCoupon = () => {
    setCouponCode('');
    form.resetFields(['couponCode']);
    onRemoveCoupon();
  };

  // Kiểm tra xem có sản phẩm không khả dụng hoặc không đủ số lượng hay không
  const hasUnavailableItems = cart?.items?.some(item =>
    !item.product || item.product.status !== 'active' || item.product.stock < item.quantity
  );

  // Tính tổng số lượng sản phẩm
  const totalQuantity = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <div className="cart-summary">
      <div className="card-header">
        <h2>Tóm tắt đơn hàng</h2>
      </div>

      <div className="summary-content">
        <div className="summary-line">
          <span>Tạm tính ({totalQuantity} sản phẩm):</span>
          <span>{formatCurrency(cart.subtotal || 0)}</span>
        </div>

        {/* Hiển thị phí vận chuyển nếu có */}
        {cart.shipping > 0 && (
          <div className="summary-line">
            <span>
              Phí vận chuyển:
              <Tooltip title="Phí vận chuyển có thể thay đổi tùy địa điểm giao hàng">
                <InfoCircleOutlined style={{ marginLeft: '5px', fontSize: '12px' }} />
              </Tooltip>
            </span>
            <span>{formatCurrency(cart.shipping)}</span>
          </div>
        )}

        {cart.couponDiscount > 0 && (
          <div className="summary-line discount">
            <span>Giảm giá:</span>
            <span>-{formatCurrency(cart.couponDiscount)}</span>
          </div>
        )}

        <Divider />

        <div className="summary-line total">
          <span>Tổng cộng:</span>
          <span>{formatCurrency(cart.total || 0)}</span>
        </div>

        <div className="coupon-section">
          <Form form={form} layout="vertical" onFinish={handleApplyCoupon}>
            <Form.Item
              name="couponCode"
              label="Mã giảm giá"
              className="coupon-form-item"
            >
              {cart.couponCode ? (
                <div className="active-coupon">
                  <div>
                    <CheckCircleOutlined /> Mã <strong>{cart.couponCode}</strong> đã được áp dụng
                  </div>
                  <CustomButton
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleRemoveCoupon}
                    disabled={loading}
                    danger
                  />
                </div>
              ) : (
                <div className="coupon-input-container">
                  <Input
                    disabled={loading}
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    prefix={<TagOutlined />}
                    className="coupon-input"
                  />
                  <CustomButton
                    type="primary"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || loading}
                    className="apply-button"
                  >
                    Áp dụng
                  </CustomButton>
                </div>
              )}
            </Form.Item>
          </Form>
        </div>

        <div className="checkout-section">
          <CustomButton
            type="primary"
            size="large"
            icon={<WalletOutlined />}
            onClick={onCheckout}
            disabled={loading || cart.items.length === 0 || hasUnavailableItems}
            block
          >
            Tiến hành thanh toán
          </CustomButton>

          {hasUnavailableItems && (
            <div className="checkout-warning">
              Một số sản phẩm không còn khả dụng hoặc không đủ số lượng. Vui lòng cập nhật giỏ hàng trước khi thanh toán.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSummary;