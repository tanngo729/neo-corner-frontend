import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Spin, List, Avatar } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import CustomButton from '../../common/buttoncustom/CustomButton';
import { useCart } from '../../../contexts/CartContext';
import './MiniCart.scss';

const MiniCart = ({ visible, onMouseLeave, staticMode = false }) => {
  const { cart, loading, removeCartItem, fetchCart } = useCart();
  const [localLoading, setLocalLoading] = useState(false);

  // Fetch giỏ hàng khi component hiển thị hoặc bất cứ khi nào visible thay đổi
  useEffect(() => {
    if (visible) {
      console.log('MiniCart: Đang fetch giỏ hàng do visible thay đổi');
      fetchCart(false); // Tham số false tức là không hiển thị loading global
    }
  }, [visible, fetchCart]);

  // Thêm các trường hợp phải fetch lại khi có sự kiện từ component cha/con
  useEffect(() => {
    // Lắng nghe sự kiện cart-updated từ các component khác
    const handleCartUpdated = () => {
      console.log('MiniCart: Nhận sự kiện cart-updated, đang fetch lại giỏ hàng');
      if (visible) {
        fetchCart(false);
      }
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
    };
  }, [visible, fetchCart]);

  // Xử lý xóa sản phẩm
  const handleRemoveItem = async (itemId, e) => {
    e.stopPropagation(); // Ngăn chặn event bubbling
    e.preventDefault(); // Ngăn chặn chuyển hướng link

    try {
      setLocalLoading(true);
      const result = await removeCartItem(itemId);
      if (result.success) {
        // Cập nhật giao diện ngay lập tức khi xóa thành công
        // fetchCart đã được gọi trong removeCartItem rồi
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount).replace('₫', 'đ');
  };

  if (!visible) return null;

  return (
    <div className={`mini-cart visible`} onMouseLeave={onMouseLeave}>
      <div className="mini-cart-header">
        <h3>Giỏ hàng của bạn</h3>
        {cart && cart.items && (
          <span className="item-count">{cart.totalItems || cart.items.length} sản phẩm</span>
        )}
      </div>

      <div className="mini-cart-content">
        {loading || localLoading ? (
          <div className="mini-cart-loading">
            <Spin size="small" />
            <span>Đang tải...</span>
          </div>
        ) : !cart || !cart.items || cart.items.length === 0 ? (
          <div className="mini-cart-empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Giỏ hàng trống"
              imageStyle={{ height: 40 }}
            />
          </div>
        ) : (
          <List
            className="mini-cart-list"
            itemLayout="horizontal"
            dataSource={cart.items.slice(0, 4)} // Giới hạn chỉ hiển thị 4 sản phẩm đầu
            renderItem={(item) => (
              <List.Item
                actions={[
                  <DeleteOutlined
                    className="remove-icon"
                    onClick={(e) => handleRemoveItem(item._id, e)}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Link to={`/products/${item.product?.slug || '#'}`}>
                      <Avatar
                        src={item.product?.mainImage?.url || item.image || '/path/to/placeholder.jpg'}
                        shape="square"
                        size="large"
                      />
                    </Link>
                  }
                  title={
                    <Link to={`/products/${item.product?.slug || '#'}`}>
                      {item.name}
                    </Link>
                  }
                  description={
                    <div className="item-details">
                      <span className="item-price">{formatCurrency(item.price)}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}

        {cart && cart.items && cart.items.length > 4 && (
          <div className="more-items">
            + {cart.items.length - 4} sản phẩm khác
          </div>
        )}
      </div>

      {cart && cart.items && cart.items.length > 0 && (
        <div className="mini-cart-footer">
          <div className="cart-total">
            <span>Tổng cộng:</span>
            <span className="total-amount">{formatCurrency(cart.total || 0)}</span>
          </div>
          <div className="cart-actions">
            <Link to="/cart">
              <CustomButton type="outline-primary" block className="view-cart-btn">
                Xem giỏ hàng
              </CustomButton>
            </Link>
            <Link to="/checkout">
              <CustomButton type="primary" block className="checkout-btn">
                Thanh toán
              </CustomButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniCart;
