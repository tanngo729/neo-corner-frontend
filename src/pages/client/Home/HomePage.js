// src/pages/client/HomePage/HomePage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Empty, Skeleton, message } from 'antd';
import {
  RightOutlined,
  ShoppingOutlined,
  GiftOutlined,
  CarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCube, EffectFlip } from 'swiper/modules';

import ProductCard from '../../../components/client/ProductCard/ProductCard';
import CustomButton from '../../../components/common/buttoncustom/CustomButton';

import {
  productService,
  promotionService
} from '../../../services/client';

import { useCart } from '../../../contexts/CartContext';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cube';
import 'swiper/css/effect-flip';
import './HomePage.scss';

const HomePage = () => {
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState({
    featured: true,
    newArrivals: true,
    popular: true,
    promotions: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchFeatured = async () => {
          try {
            const response = await productService.getFeaturedProducts(8);

            if (response?.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
              setFeaturedFoods(response.data.data);
            } else {
              console.log('Không có dữ liệu sản phẩm nổi bật');
              setFeaturedFoods([]);
            }
          } catch (error) {
            console.error('Lỗi khi lấy sản phẩm nổi bật:', error);
            setFeaturedFoods([]);
          } finally {
            setLoading(prev => ({ ...prev, featured: false }));
          }
        };

        const fetchNewArrivals = async () => {
          try {
            const response = await productService.getProducts({
              limit: 8,
              sort: 'createdAt',
              order: 'desc'
            });

            if (response?.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
              setNewArrivals(response.data.data);
            } else {
              console.log('Không có dữ liệu sản phẩm mới');
              setNewArrivals([]);
            }
          } catch (error) {
            console.error('Lỗi khi lấy sản phẩm mới:', error);
            setNewArrivals([]);
          } finally {
            setLoading(prev => ({ ...prev, newArrivals: false }));
          }
        };

        const fetchPromotions = async () => {
          try {
            const response = await promotionService.getActivePromotions();
            if (response?.data?.data && Array.isArray(response.data.data)) {
              setPromotions(response.data.data);
            } else {
              setPromotions([]);
            }
          } catch (error) {
            console.error('Lỗi khi lấy khuyến mãi:', error);
            setPromotions([]);
          } finally {
            setLoading(prev => ({ ...prev, promotions: false }));
          }
        };

        await Promise.all([
          fetchFeatured(),
          fetchNewArrivals(),
          fetchPromotions()
        ]);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        setLoading({
          featured: false,
          newArrivals: false,
          popular: false,
          promotions: false
        });
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      const result = await addToCart(product._id, 1);

      if (result && result.success) {
        return { success: true };
      } else {
        message.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại sau!');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      message.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại sau!');
      return { success: false };
    }
  };

  const handleAddToWishlist = (product) => {
    message.success(`Đã thêm ${product.name} vào danh sách yêu thích!`);
    return Promise.resolve({ success: true });
  };

  const renderProductSlider = (products, title, link, loading, imageHeight = 220, icon = null) => {
    return (
      <section className="product-section section">
        <div className="container">
          <div className="section-header">
            <h2>
              {icon && <span className="section-icon">{icon}</span>}
              {title}
            </h2>
            <Link to={link} className="view-all">
              Xem tất cả <RightOutlined />
            </Link>
          </div>

          {loading ? (
            <div className="skeleton-container">
              <Row gutter={[16, 24]}>
                {[1, 2, 3, 4].map(item => (
                  <Col xs={12} sm={12} md={8} lg={6} key={item}>
                    <Card className="food-card-skeleton">
                      <Skeleton.Image active style={{ width: '100%', height: 160 }} />
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : products.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={16}
              navigation
              pagination={{ clickable: true }}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                  spaceBetween: 10
                },
                576: {
                  slidesPerView: 2,
                  spaceBetween: 16
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 16
                },
                992: {
                  slidesPerView: 4,
                  spaceBetween: 16
                },
                1200: {
                  slidesPerView: 4,
                  spaceBetween: 16
                }
              }}
              className="product-swiper"
            >
              {products.map(product => (
                <SwiperSlide
                  key={product._id}
                  style={{ display: 'flex', height: 'auto' }}
                >
                  <div style={{ width: '100%', height: '100%' }}>
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onAddToWishlist={handleAddToWishlist}
                      imageHeight={imageHeight}
                      onProductClick={() => navigate(`/products/${product.slug}`)}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <Empty description={`Không có ${title.toLowerCase()}`} />
          )}
        </div>
      </section>
    );
  };

  const heroBanners = [
    {
      id: 1,
      image: "https://placehold.co/1200x500/e31836/fff?text=Thực+Đơn+Đa+Dạng",
      title: "Thực Đơn Đa Dạng",
      description: "Hàng trăm món ăn hấp dẫn từ khắp nơi trên thế giới",
      buttonText: "Khám phá ngay",
      buttonLink: "/menu",
      icon: <ShoppingOutlined className="banner-icon" />
    },
    {
      id: 2,
      image: "https://placehold.co/1200x500/e31836/fff?text=Giảm+30%+Đơn+Đầu+Tiên",
      title: "Giảm 30% Cho Đơn Đầu Tiên",
      description: "Sử dụng mã: WELCOME30 khi thanh toán",
      buttonText: "Đặt món ngay",
      buttonLink: "/featured",
      icon: <GiftOutlined className="banner-icon" />
    },
    {
      id: 3,
      image: "https://placehold.co/1200x500/e31836/fff?text=Freeship+5km",
      title: "Miễn Phí Vận Chuyển",
      description: "Cho đơn hàng từ 150.000đ trong bán kính 5km",
      buttonText: "Xem thêm",
      buttonLink: "/promotion",
      icon: <CarOutlined className="banner-icon" />
    }
  ];

  return (
    <div className="homepage">
      <section className="hero-section">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectCube]}
          effect="cube"
          cubeEffect={{
            shadow: true,
            slideShadows: true,
            shadowOffset: 20,
            shadowScale: 0.94,
          }}
          slidesPerView={1}
          navigation
          pagination={{
            clickable: true,
            dynamicBullets: true
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false
          }}
          loop={true}
          className="hero-carousel"
        >
          {heroBanners.map(banner => (
            <SwiperSlide key={banner.id}>
              <div className="carousel-item modern-banner" style={{ backgroundImage: `url('${banner.image}')` }}>
                <div className="carousel-content">
                  <div className="banner-icon-container">
                    {banner.icon}
                  </div>
                  <h2>{banner.title}</h2>
                  <p>{banner.description}</p>
                  <CustomButton
                    type="secondary"
                    size="large"
                    onClick={() => navigate(banner.buttonLink)}
                  >
                    {banner.buttonText}
                  </CustomButton>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section className="features-section section">
        <div className="container">
          <div className="features-grid">
            <Row gutter={[20, 20]}>
              <Col xs={24} sm={12} md={8}>
                <div className="feature-box">
                  <div className="feature-icon">
                    <ShoppingOutlined />
                  </div>
                  <h3>Thực Đơn Phong Phú</h3>
                  <p>Hàng trăm món ăn đa dạng phục vụ mọi khẩu vị</p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="feature-box">
                  <div className="feature-icon">
                    <CarOutlined />
                  </div>
                  <h3>Giao Hàng Nhanh</h3>
                  <p>Cam kết giao trong 30 phút hoặc được miễn phí</p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="feature-box">
                  <div className="feature-icon">
                    <GiftOutlined />
                  </div>
                  <h3>Khuyến Mãi Hấp Dẫn</h3>
                  <p>Ưu đãi hàng tuần và tích điểm thành viên</p>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </section>

      {renderProductSlider(
        featuredFoods,
        "Món Ăn Nổi Bật",
        "/featured",
        loading.featured,
        220,
        <FireOutlined />
      )}

      <section className="promotion-section section">
        <div className="container">
          <div className="section-header">
            <h2>
              <span className="section-icon"><GiftOutlined /></span>
              Ưu Đãi Đặc Biệt
            </h2>
          </div>

          {loading.promotions ? (
            <div className="skeleton-container">
              <Row gutter={[16, 16]}>
                {[1, 2].map(item => (
                  <Col xs={24} sm={12} key={item}>
                    <Skeleton.Image active style={{ width: '100%', height: 180 }} />
                  </Col>
                ))}
              </Row>
            </div>
          ) : promotions.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination, EffectFlip]}
              effect="flip"
              slidesPerView={1}
              spaceBetween={16}
              navigation
              pagination={{ clickable: true }}
              breakpoints={{
                768: { slidesPerView: 2, effect: 'slide' }
              }}
              className="promotions-swiper"
            >
              {promotions.map(promo => (
                <SwiperSlide key={promo.id || promo._id}>
                  <div className="promo-card">
                    <div className="promo-card-img">
                      <img src={promo.image?.url || promo.image} alt={promo.title} />
                    </div>
                    <div className="promo-card-content">
                      <h3>{promo.title}</h3>
                      <p>{promo.description}</p>
                      <div className="promo-card-code">
                        <span>Mã: {promo.code}</span>
                        <small>Hết hạn: {promo.expiry}</small>
                      </div>
                      <CustomButton type="secondary">Áp dụng ngay</CustomButton>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <Empty description="Không có khuyến mãi nào" />
          )}
        </div>
      </section>

      {renderProductSlider(
        newArrivals,
        "Món Ăn Mới",
        "/new-foods",
        loading.newArrivals,
        220
      )}

      <section className="cta-banner">
        <div className="container">
          <div className="cta-content">
            <div className="cta-icon">
              <GiftOutlined />
            </div>
            <h2>Đặt hàng ngay hôm nay!</h2>
            <p>Giảm 10% cho đơn hàng đầu tiên khi đăng ký thành viên</p>
            <div className="cta-buttons">
              <CustomButton type="secondary" size="large" className="cta-button">Đặt hàng ngay</CustomButton>
              <CustomButton type="outline-secondary" size="large" className="cta-button">Đăng ký thành viên</CustomButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;