// src/components/client/checkout/OrderSummary.js
import React from 'react';
import { Card, Divider } from 'antd';
import './OrderSummary.scss';

const OrderSummary = ({ cart, shippingFee = 0, orderTotal = 0 }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount).replace('₫', 'đ');
  };

  // Calculate total if not provided
  const calculateTotal = () => {
    if (orderTotal > 0) return orderTotal;
    const subtotal = cart?.subtotal || 0;
    const discount = cart?.couponDiscount || 0;
    return subtotal + shippingFee - discount;
  };

  // Calculate total quantity
  const totalQuantity = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <Card className="order-summary">
      <h3 className="summary-title">Thông tin đơn hàng</h3>

      <div className="items-container">
        {cart?.items?.map((item, index) => (
          <div key={index} className="cart-item">
            <div className="item-info">
              <span className="item-quantity">{item.quantity}x</span>
              <span className="item-name">{item.name}</span>
            </div>
            <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      <div className="summary-totals">
        <div className="total-row">
          <span>Tạm tính ({totalQuantity} sản phẩm):</span>
          <span>{formatCurrency(cart?.subtotal || 0)}</span>
        </div>

        {shippingFee > 0 && (
          <div className="total-row">
            <span>Phí vận chuyển:</span>
            <span>{formatCurrency(shippingFee)}</span>
          </div>
        )}

        {cart?.couponDiscount > 0 && (
          <div className="total-row discount">
            <span>Giảm giá:</span>
            <span>-{formatCurrency(cart?.couponDiscount || 0)}</span>
          </div>
        )}

        <div className="total-row grand-total">
          <span>Tổng cộng:</span>
          <span>{formatCurrency(calculateTotal())}</span>
        </div>
      </div>
    </Card>
  );
};

export default OrderSummary;