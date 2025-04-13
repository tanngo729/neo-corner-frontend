import React, { useState, useEffect } from 'react';
import { message, Tooltip, Rate, Tag } from 'antd';
import {
  ShoppingCartOutlined,
  HeartOutlined,
  EyeOutlined,
  HeartFilled,
  CloseCircleOutlined
} from '@ant-design/icons';
import CustomButton from '../../common/buttoncustom/CustomButton';
import { useCart } from '../../../contexts/CartContext';
import './ProductCard.scss';

const ProductCard = ({
  product,
  onAddToCart,
  onAddToWishlist,
  onProductClick,
  imageHeight = 250,
  showViewButton = true,
  isWishlisted: initialWishlistState = false
}) => {
  const [isWishlisted, setIsWishlisted] = useState(initialWishlistState);
  const [loading, setLoading] = useState({
    cart: false,
    wishlist: false
  });
  const [isMobile, setIsMobile] = useState(false);

  const { addToCart, fetchCart } = useCart();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 576);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  const calculateDiscount = (originalPrice, price) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };


  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const isOutOfStock = !product || !product.stock || product.stock <= 0;


  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      message.error('Sản phẩm đã hết hàng');
      return;
    }

    setLoading(prev => ({ ...prev, cart: true }));

    try {
      if (onAddToCart) {
        const result = await onAddToCart(product);
        if (result && result.success) {
          message.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
          window.dispatchEvent(new CustomEvent('cart-updated'));
        }
      } else {
        const result = await addToCart(product._id, 1);
        if (result && result.success) {
          message.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
          await fetchCart();
          window.dispatchEvent(new CustomEvent('cart-updated'));
        }
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      message.error('Không thể thêm sản phẩm vào giỏ hàng');
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  };

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(prev => ({ ...prev, wishlist: true }));

    try {
      if (onAddToWishlist) {
        await onAddToWishlist(product);
        setIsWishlisted(!isWishlisted);

        message.success(
          isWishlisted
            ? `Đã gỡ "${product.name}" khỏi danh sách yêu thích`
            : `Đã thêm "${product.name}" vào danh sách yêu thích!`
        );
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào yêu thích:', error);
      message.error('Không thể thao tác với danh sách yêu thích');
    } finally {
      setLoading(prev => ({ ...prev, wishlist: false }));
    }
  };

  const handleProductClick = (e) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleViewDetails = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleProductClick();
  };

  if (!product) return null;

  const discount = calculateDiscount(product.originalPrice, product.price);
  const ratingValue = product.rating || 0;
  const ratingCount = product.ratingCount || product.sold || 0;
  const hasRating = ratingValue > 0 || ratingCount > 0;

  return (
    <div className="product-card-wrapper">
      <div
        className="product-card"
        onClick={handleProductClick}
      >
        <div
          className="product-card-image-container"
          style={isMobile ? { height: '150px' } : { height: `${imageHeight}px` }}
        >
          <img
            src={product.mainImage?.url || 'https://placehold.co/400x400/f0f0f0/808080?text=No+Image'}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />

          <div className="product-badges">
            {discount > 0 && (
              <span className="discount-badge">
                -{discount}%
              </span>
            )}
            {product.isNew && (
              <span className="new-badge">
                Mới
              </span>
            )}
            {isOutOfStock && (
              <span className="out-of-stock-badge">
                Hết hàng
              </span>
            )}
          </div>

          {isOutOfStock && (
            <div className="out-of-stock-overlay">
              <CloseCircleOutlined />
              <span>Hết hàng</span>
            </div>
          )}

          {!isMobile && (
            <div className="product-actions">
              <Tooltip title={isOutOfStock ? "Sản phẩm đã hết hàng" : "Thêm vào giỏ hàng"}>
                <CustomButton
                  type="primary"
                  className={`action-btn cart-btn ${isOutOfStock ? 'disabled' : ''}`}
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  loading={loading.cart}
                  disabled={isOutOfStock}
                  aria-label="Thêm vào giỏ hàng"
                />
              </Tooltip>

              <Tooltip title={isWishlisted ? "Bỏ yêu thích" : "Yêu thích"}>
                <CustomButton
                  type="text"
                  className={`action-btn wishlist-btn ${isWishlisted ? 'is-wishlisted' : ''}`}
                  icon={isWishlisted ? <HeartFilled /> : <HeartOutlined />}
                  onClick={handleAddToWishlist}
                  loading={loading.wishlist}
                  aria-label={isWishlisted ? "Bỏ yêu thích" : "Yêu thích"}
                />
              </Tooltip>

              {showViewButton && (
                <Tooltip title="Xem chi tiết">
                  <CustomButton
                    type="text"
                    className="action-btn view-btn"
                    icon={<EyeOutlined />}
                    onClick={handleViewDetails}
                    aria-label="Xem chi tiết"
                  />
                </Tooltip>
              )}
            </div>
          )}
        </div>

        <div className="product-card-content">
          {product.category?.name && (
            <div className="product-category">
              {product.category.name}
            </div>
          )}

          <h3 className="product-title">
            {product.name}
          </h3>

          {hasRating && (
            <div className="product-rating">
              <Rate
                disabled
                value={ratingValue}
                allowHalf
                count={5}
              />
              <span className="rating-count">
                ({ratingCount})
              </span>
            </div>
          )}

          <div className="product-price">
            <span className="current-price">
              {formatPrice(product.price)}
            </span>
            {discount > 0 && (
              <span className="original-price">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {isOutOfStock && (
            <div className="product-stock-status out-of-stock">
              <CloseCircleOutlined /> Hết hàng
            </div>
          )}

          {isMobile && (
            <div className="mobile-actions">
              <CustomButton
                type="primary"
                block
                className="mobile-cart-btn"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                loading={loading.cart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
              </CustomButton>

              <CustomButton
                type="default"
                className="mobile-wishlist-btn"
                icon={isWishlisted ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleAddToWishlist}
                loading={loading.wishlist}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;