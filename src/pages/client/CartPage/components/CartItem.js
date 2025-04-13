import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, InputNumber, Popconfirm, Tooltip, Badge } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import CustomButton from '../../../../components/common/buttoncustom/CustomButton';
import '../styles/CartItem.scss';

const CartItem = ({ item, onUpdateQuantity, onRemoveItem, loading }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [localLoading, setLocalLoading] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Đánh dấu sản phẩm mới được thêm vào
  useEffect(() => {
    if (item && item._id) {
      setIsNew(true);
      const timer = setTimeout(() => {
        setIsNew(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (value) => {
    if (value === null || value === undefined) return;

    // Kiểm tra giá trị hợp lệ
    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 1) return;

    setQuantity(newQuantity);
  };

  // Xử lý khi blur khỏi input số lượng
  const handleQuantityBlur = async () => {
    if (quantity === item.quantity) return;

    // Đảm bảo không vượt quá stock
    const maxStock = item.product?.stock || 99;
    const validQuantity = Math.min(quantity, maxStock);

    if (validQuantity !== item.quantity) {
      setLocalLoading(true);
      await onUpdateQuantity(item._id, validQuantity);
      setLocalLoading(false);
    }
  };

  // Xử lý xóa sản phẩm
  const handleRemove = async () => {
    await onRemoveItem(item._id);
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount).replace('₫', 'đ');
  };

  // Tính tổng tiền cho sản phẩm
  const itemTotal = item.price * item.quantity;

  // Lấy đường dẫn ảnh an toàn
  const productImage = item.product?.mainImage?.url || item.image || '/path/to/placeholder.jpg';

  // Lấy slug sản phẩm an toàn
  const productSlug = item.product?.slug || '#';

  // Kiểm tra trạng thái sản phẩm
  const isProductUnavailable = !item.product || item.product.status !== 'active';
  const isOutOfStock = item.product && item.product.stock === 0;
  const isLowStock = item.product && item.quantity > item.product.stock;

  // Desktop/tablet layout
  if (window.innerWidth >= 576) {
    return (
      <div className={`cart-item ${isProductUnavailable ? 'unavailable' : ''} ${isNew ? 'new-item' : ''}`}>
        <Row gutter={[8, 8]} align="middle">
          {/* Ảnh sản phẩm */}
          <Col xs={4} sm={4} md={4}>
            <div className="product-image">
              <Link to={`/products/${productSlug}`}>
                <img src={productImage} alt={item.name} />
              </Link>
            </div>
          </Col>

          {/* Thông tin sản phẩm */}
          <Col xs={12} sm={12} md={12}>
            <div className="product-info">
              <Link to={`/products/${productSlug}`} className="product-name">
                {item.name}
              </Link>

              <div className="product-price">
                {formatCurrency(item.price)}
              </div>

              {isProductUnavailable && (
                <div className="product-unavailable">
                  <ExclamationCircleOutlined /> Sản phẩm không khả dụng
                </div>
              )}

              {isOutOfStock && (
                <div className="product-out-of-stock">
                  <ExclamationCircleOutlined /> Hết hàng
                </div>
              )}

              {isLowStock && !isOutOfStock && (
                <div className="product-low-stock">
                  Chỉ còn {item.product.stock} sản phẩm
                </div>
              )}
            </div>
          </Col>

          {/* Số lượng */}
          <Col xs={4} sm={4} md={4}>
            <div className="product-quantity">
              <Tooltip title={isProductUnavailable || isOutOfStock ? 'Sản phẩm không khả dụng' : null}>
                <Badge
                  count={isLowStock && !isOutOfStock ? '!' : 0}
                  color="warning"
                  offset={[-5, 0]}
                >
                  <InputNumber
                    min={1}
                    max={item.product?.stock || 99}
                    value={quantity}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    disabled={loading || localLoading || isProductUnavailable || isOutOfStock}
                    size="middle"
                    controls={{ upIcon: '+', downIcon: '-' }}
                  />
                </Badge>
              </Tooltip>
            </div>
          </Col>

          {/* Tổng tiền và nút xóa */}
          <Col xs={4} sm={4} md={4}>
            <div className="product-actions">
              <div className="product-subtotal">
                {formatCurrency(itemTotal)}
              </div>

              <Popconfirm
                title="Xóa sản phẩm"
                description="Bạn có chắc muốn xóa sản phẩm này?"
                onConfirm={handleRemove}
                okText="Xóa"
                cancelText="Hủy"
                placement="left"
              >
                <CustomButton
                  type="text"
                  icon={<DeleteOutlined />}
                  className="remove-button"
                  loading={loading}
                  danger
                />
              </Popconfirm>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  // Mobile layout - sử dụng bố cục khác hoàn toàn cho mobile
  return (
    <div className={`cart-item mobile ${isProductUnavailable ? 'unavailable' : ''} ${isNew ? 'new-item' : ''}`}>
      {/* Hàng 1: Ảnh và thông tin sản phẩm */}
      <Row className="item-row-1">
        {/* Ảnh sản phẩm */}
        <Col span={6}>
          <div className="product-image">
            <Link to={`/products/${productSlug}`}>
              <img src={productImage} alt={item.name} />
            </Link>
          </div>
        </Col>

        {/* Thông tin sản phẩm */}
        <Col span={18}>
          <div className="product-info">
            <Link to={`/products/${productSlug}`} className="product-name">
              {item.name}
            </Link>

            <div className="product-price">
              {formatCurrency(item.price)}
            </div>

            {isProductUnavailable && (
              <div className="product-unavailable">
                <ExclamationCircleOutlined /> Sản phẩm không khả dụng
              </div>
            )}

            {isOutOfStock && (
              <div className="product-out-of-stock">
                <ExclamationCircleOutlined /> Hết hàng
              </div>
            )}

            {isLowStock && !isOutOfStock && (
              <div className="product-low-stock">
                Chỉ còn {item.product.stock} sản phẩm
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Hàng 2: Số lượng và tổng tiền */}
      <Row className="item-row-2">
        {/* Số lượng */}
        <Col span={12}>
          <div className="product-quantity">
            <InputNumber
              min={1}
              max={item.product?.stock || 99}
              value={quantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              disabled={loading || localLoading || isProductUnavailable || isOutOfStock}
              size="middle"
              controls={{ upIcon: '+', downIcon: '-' }}
            />
          </div>
        </Col>

        {/* Tổng tiền và nút xóa */}
        <Col span={12}>
          <div className="product-actions">
            <div className="product-subtotal">
              {formatCurrency(itemTotal)}
            </div>

            <Popconfirm
              title="Xóa sản phẩm"
              description="Bạn có chắc muốn xóa sản phẩm này?"
              onConfirm={handleRemove}
              okText="Xóa"
              cancelText="Hủy"
              placement="left"
            >
              <CustomButton
                type="text"
                icon={<DeleteOutlined />}
                className="remove-button"
                loading={loading}
                danger
              />
            </Popconfirm>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CartItem;