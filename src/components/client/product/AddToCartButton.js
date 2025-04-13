// src/components/client/product/AddToCartButton.js
import React, { useState } from 'react';
import { Button, message, InputNumber, Space } from 'antd';
import { ShoppingCartOutlined, LoadingOutlined } from '@ant-design/icons';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddToCartButton = ({
  productId,
  stock = 0,
  disabled = false,
  showQuantity = true,
  size = 'large',
  buttonText = "Thêm vào giỏ hàng",
  onSuccess = () => { },
  // Thêm một prop mới để kiểm soát việc hiển thị thông báo
  showMessage = true,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (value) => {
    if (value === null || isNaN(value)) return;
    // Giới hạn số lượng không vượt quá stock
    setQuantity(Math.min(value, stock));
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      message.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      navigate('/login');
      return;
    }

    if (disabled || stock <= 0) {
      message.error('Sản phẩm đã hết hàng');
      return;
    }

    try {
      setLoading(true);
      const result = await addToCart(productId, quantity);

      if (result && result.success) {
        // Chỉ hiển thị thông báo nếu showMessage = true
        if (showMessage) {
          message.success('Đã thêm sản phẩm vào giỏ hàng');
        }

        // Gọi callback onSuccess nếu có
        onSuccess();
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      message.error('Không thể thêm sản phẩm vào giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  if (!showQuantity) {
    return (
      <Button
        type="primary"
        icon={loading ? <LoadingOutlined /> : <ShoppingCartOutlined />}
        size={size}
        onClick={handleAddToCart}
        disabled={disabled || stock <= 0 || loading}
      >
        {buttonText}
      </Button>
    );
  }

  return (
    <Space>
      <InputNumber
        min={1}
        max={stock}
        value={quantity}
        onChange={handleQuantityChange}
        disabled={disabled || stock <= 0 || loading}
        size={size === 'large' ? 'middle' : 'small'}
      />
      <Button
        type="primary"
        icon={loading ? <LoadingOutlined /> : <ShoppingCartOutlined />}
        onClick={handleAddToCart}
        disabled={disabled || stock <= 0 || loading}
        size={size}
      >
        {buttonText}
      </Button>
    </Space>
  );
};

export default AddToCartButton;