import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Breadcrumb,
  Typography,
  Divider,
  Button,
  InputNumber,
  Tabs,
  Rate,
  Skeleton,
  message,
  Image,
  Tag,
  Card
} from 'antd';
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { clientInstance } from '../../../config/api';
import CustomButton from '../../../components/common/buttoncustom/CustomButton';
import ProductCard from '../../../components/client/ProductCard/ProductCard';
import AddToCartButton from '../../../components/client/product/AddToCartButton';
import { useCart } from '../../../contexts/CartContext';
import './ProductDetailPage.scss';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    addToCart: false,
    addToWishlist: false
  });


  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {

        const response = await clientInstance.get(`/products/${slug}`);
        const productData = response.data.data;
        setProduct(productData);
        setSelectedImage(productData.mainImage?.url || (productData.images && productData.images.length > 0 ? productData.images[0].url : null));


        if (productData._id && productData.category) {
          const relatedResponse = await clientInstance.get('/products/related', {
            params: {
              productId: productData._id,
              categoryId: productData.category._id,
              limit: 4
            }
          });
          setRelatedProducts(relatedResponse.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        message.error('Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProductDetails();
    }
  }, [slug]);


  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };


  const calculateDiscount = (originalPrice, price) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  const handleQuantityChange = (value) => {
    setQuantity(value);
  };

  const handleAddToCartSuccess = () => {
  };

  const handleToggleWishlist = async () => {
    setLoadingStates(prev => ({ ...prev, addToWishlist: true }));
    try {
      setIsWishlisted(!isWishlisted);
      message.success(
        isWishlisted
          ? `Đã gỡ "${product.name}" khỏi danh sách yêu thích`
          : `Đã thêm "${product.name}" vào danh sách yêu thích!`
      );
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      message.error('Không thể thực hiện thao tác với danh sách yêu thích');
    } finally {
      setLoadingStates(prev => ({ ...prev, addToWishlist: false }));
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleProductCardClick = (product) => {
    navigate(`/products/${product.slug}`);
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <Skeleton active paragraph={{ rows: 1 }} />
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Skeleton.Image className="main-image-skeleton" />
            <Row gutter={[8, 8]} className="mt-2">
              {[1, 2, 3, 4].map(i => (
                <Col span={6} key={i}>
                  <Skeleton.Image className="thumbnail-skeleton" />
                </Col>
              ))}
            </Row>
          </Col>
          <Col xs={24} md={12}>
            <Skeleton active paragraph={{ rows: 10 }} />
          </Col>
        </Row>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="product-not-found">
          <Title level={3}>Không tìm thấy sản phẩm</Title>
          <Button type="primary" onClick={() => navigate('/products')}>
            Quay lại trang sản phẩm
          </Button>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount(product.originalPrice, product.price);

  return (
    <div className="product-detail-container">
      {/* Breadcrumb */}
      <Breadcrumb className="product-breadcrumb">
        <Breadcrumb.Item href="/">Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
        {product.category && (
          <Breadcrumb.Item href={`/products?category=${product.category._id}`}>
            {product.category.name}
          </Breadcrumb.Item>
        )}
        <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[24, 24]} className="product-details-row">
        {/* Product Images */}
        <Col xs={24} md={12} className="product-images-col">
          <div className="product-main-image">
            <Image
              src={selectedImage || product.mainImage?.url || 'https://placehold.co/600x400/f0f0f0/808080?text=No+Image'}
              alt={product.name}
              fallback="https://placehold.co/600x400/f0f0f0/808080?text=No+Image"
              preview={{
                maskClassName: 'product-image-preview-mask',
                mask: <div className="image-preview-mask-content">Xem ảnh lớn</div>
              }}
            />
            {discount > 0 && (
              <div className="discount-badge">-{discount}%</div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 0 && (
            <Row gutter={[8, 8]} className="product-thumbnail-images">
              {[product.mainImage, ...product.images].filter(Boolean).map((image, index) => (
                <Col span={6} key={index}>
                  <div
                    className={`product-thumbnail ${selectedImage === image.url ? 'active' : ''}`}
                    onClick={() => handleImageClick(image.url)}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} - hình ${index + 1}`}
                      loading="lazy"
                    />
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* Product Info */}
        <Col xs={24} md={12} className="product-info-col">
          <Title level={2} className="product-name">{product.name}</Title>

          <div className="product-stats">
            {product.sold > 0 && (
              <Text className="product-sold">Đã bán: {product.sold}</Text>
            )}
            <div className="product-rating">
              <Rate disabled defaultValue={4} allowHalf />
              <Text className="rating-count">(50 đánh giá)</Text>
            </div>
          </div>

          <div className="product-price-section">
            <div className="product-price-container">
              <Text className="current-price">{formatPrice(product.price)}</Text>
              {discount > 0 && (
                <Text className="original-price">{formatPrice(product.originalPrice)}</Text>
              )}
              {discount > 0 && (
                <Tag color="red" className="discount-tag">-{discount}%</Tag>
              )}
            </div>
          </div>

          <Divider className="product-divider" />

          <div className="product-availability">
            <Text strong>Tình trạng: </Text>
            {product.stock > 0 ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Còn hàng ({product.stock})
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="error">
                Hết hàng
              </Tag>
            )}
          </div>

          {product.category && (
            <div className="product-category-info">
              <Text strong>Danh mục: </Text>
              <Tag color="blue">{product.category.name}</Tag>
            </div>
          )}

          <Divider className="product-divider" />

          <div className="product-actions">
            <div className="add-to-cart-wrapper" style={{ flex: '1 1 auto', minWidth: '200px' }}>
              <AddToCartButton
                productId={product._id}
                stock={product.stock}
                showQuantity={true}
                size="large"
                buttonText="Thêm vào giỏ hàng"
                onSuccess={handleAddToCartSuccess}
                disabled={product.stock <= 0}
              />
            </div>

            <CustomButton
              type={isWishlisted ? "primary" : "default"}
              ghost={isWishlisted}
              size="large"
              icon={isWishlisted ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleToggleWishlist}
              loading={loadingStates.addToWishlist}
              className="wishlist-btn"
            />

            <CustomButton
              type="default"
              size="large"
              icon={<ShareAltOutlined />}
              className="share-btn"
            />
          </div>
        </Col>
      </Row>

      {/* Product Details Tabs */}
      <div className="product-details-tabs">
        <Tabs defaultActiveKey="description">
          <TabPane tab="Mô tả sản phẩm" key="description">
            <Card className="product-description-card">
              <div
                className="product-description"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </Card>
          </TabPane>
          <TabPane tab="Thông tin chi tiết" key="specifications">
            <Card className="product-specifications-card">
              <p>Đang cập nhật thông tin chi tiết...</p>
            </Card>
          </TabPane>
          <TabPane tab="Đánh giá (50)" key="reviews">
            <Card className="product-reviews-card">
              <p>Đang cập nhật đánh giá...</p>
            </Card>
          </TabPane>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <Title level={3} className="section-title">Sản phẩm liên quan</Title>
          <Row gutter={[16, 24]}>
            {relatedProducts.map(relatedProduct => (
              <Col xs={12} sm={8} md={6} key={relatedProduct._id}>
                <ProductCard
                  product={relatedProduct}
                  onProductClick={() => handleProductCardClick(relatedProduct)}
                  imageHeight={200}
                />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;