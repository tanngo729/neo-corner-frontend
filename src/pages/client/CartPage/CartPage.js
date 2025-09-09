import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, message, Spin, Empty, Modal } from 'antd';
import {
  ShoppingCartOutlined,
  ShoppingOutlined,
  DeleteOutlined,
  WalletOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import CustomButton from '../../../components/common/buttoncustom/CustomButton';
import CartItemList from './components/CartItemList';
import CartSummary from './components/CartSummary';
import { useCart } from '../../../contexts/CartContext';
import './styles/CartPage.scss';

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    fetchCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [updating, setUpdating] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // Fetch giỏ hàng khi component mount và thêm hiệu ứng fade-in
  useEffect(() => {
    fetchCart();
    // Thêm hiệu ứng fade-in sau khi mounted
    setTimeout(() => {
      setFadeIn(true);
    }, 100);
  }, [fetchCart]);

  // Xử lý cập nhật số lượng sản phẩm
  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      setUpdating(true);
      await updateCartItem(itemId, quantity);
      message.success('Cập nhật số lượng thành công');
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng:', error);
      const errorMsg = error.response?.data?.message || 'Lỗi khi cập nhật số lượng';
      message.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý xóa sản phẩm
  const handleRemoveItem = async (itemId) => {
    try {
      setUpdating(true);
      await removeCartItem(itemId);
      message.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      message.error('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý xóa toàn bộ giỏ hàng
  const handleClearCart = () => {
    Modal.confirm({
      title: 'Xóa giỏ hàng',
      content: 'Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?',
      okText: 'Xóa tất cả',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setUpdating(true);
          await clearCart();
          message.success('Đã xóa toàn bộ giỏ hàng');
        } catch (error) {
          console.error('Lỗi khi xóa giỏ hàng:', error);
          message.error('Không thể xóa giỏ hàng. Vui lòng thử lại sau.');
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  // Xử lý áp dụng mã giảm giá
  const handleApplyCoupon = async (couponCode) => {
    try {
      setUpdating(true);
      await applyCoupon(couponCode);
      message.success('Áp dụng mã giảm giá thành công');
    } catch (error) {
      console.error('Lỗi khi áp dụng mã giảm giá:', error);
      const errorMsg = error.response?.data?.message || 'Mã giảm giá không hợp lệ';
      message.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý hủy mã giảm giá
  const handleRemoveCoupon = async () => {
    try {
      setUpdating(true);
      await removeCoupon();
      message.success('Đã hủy mã giảm giá');
    } catch (error) {
      console.error('Lỗi khi hủy mã giảm giá:', error);
      message.error('Không thể hủy mã giảm giá. Vui lòng thử lại sau.');
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý chuyển đến trang thanh toán
  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Hiển thị loading
  if (loading && !updating) {
    return (
      <div className="page-container cart-page">
        <div className="loading-container">
          <Spin size="large" />
          <p>Đang tải giỏ hàng của bạn...</p>
        </div>
      </div>
    );
  }

  // Hiển thị giỏ hàng trống
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className={`page-container cart-page ${fadeIn ? 'fade-in' : ''}`}>
        <div className="cart-empty">
          <ShoppingCartOutlined className="cart-icon" />
          <h2>Giỏ hàng trống</h2>
          <p>Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
          <Link to="/products">
            <CustomButton type="primary" icon={<ShoppingOutlined />} size="large">
              Tiếp tục mua sắm
            </CustomButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-container cart-page ${fadeIn ? 'fade-in' : ''}`}>
      <div className="cart-header">
        <h1>Giỏ hàng của bạn</h1>
        <p>({cart.totalItems || cart.items.reduce((n, i) => n + i.quantity, 0)} sản phẩm)</p>
      </div>

      {/* Giảm gutter xuống để các phần tử không quá cách xa nhau trên mobile */}
      <Row gutter={[12, 12]} className="cart-content">
        <Col xs={24} sm={24} md={24} lg={16}>
          <div className="cart-items-container">
            <div className="card-header">
              <h2>Sản phẩm</h2>
              <CustomButton
                type="text"
                icon={<DeleteOutlined />}
                onClick={handleClearCart}
                disabled={updating}
                danger
              >
                Xóa tất cả
              </CustomButton>
            </div>
            <CartItemList
              items={cart.items}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              loading={updating}
            />
          </div>
        </Col>
        <Col xs={24} sm={24} md={24} lg={8}>
          <CartSummary
            cart={cart}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            onCheckout={handleCheckout}
            loading={updating}
          />
        </Col>
      </Row>

      <div className="continue-shopping">
        <Link to="/products">
          <CustomButton type="default" icon={<ShoppingOutlined />}>
            Tiếp tục mua sắm
          </CustomButton>
        </Link>
      </div>
    </div>
  );
};

export default CartPage;
