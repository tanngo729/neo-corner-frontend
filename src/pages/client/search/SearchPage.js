// src/pages/client/search/SearchPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Row, Col, Select, Slider, Divider, Empty, Pagination, Spin, Button, Card, Typography, message } from 'antd';
import { FilterOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { productService, categoryService } from '../../../services/client';
import { useCart } from '../../../contexts/CartContext'; // Thêm import useCart hook
import ProductCard from '../../../components/client/ProductCard/ProductCard';
import SearchInput from '../../../components/client/search/SearchInput';
import './SearchPage.scss';

const { Title, Text } = Typography;
const { Option } = Select;

const SearchPage = () => {
  // Sử dụng useCart hook để lấy addToCart từ CartContext
  const { addToCart } = useCart();

  // Các state cần thiết
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({
    page: 1,
    limit: 12,
    search: '',
    category: '',
    sort: 'createdAt',
    order: 'desc',
    minPrice: '',
    maxPrice: ''
  });
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const fetchInProgress = useRef(false);
  const isInitialRender = useRef(true);
  const paramsRef = useRef(params);

  // Lấy query params từ URL
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // Fetch sản phẩm theo params
  const fetchProducts = useCallback(async (paramToUse) => {
    // Nếu đang có request, không gửi request mới
    if (fetchInProgress.current) {
      return;
    }

    fetchInProgress.current = true;
    setLoading(true);

    try {
      const response = await productService.getProducts(paramToUse);
      if (response && response.data) {
        const responseData = response.data;
        if (responseData.success && responseData.data) {
          setProducts(responseData.data || []);
          if (responseData.pagination) {
            setTotalProducts(responseData.pagination.total || 0);
          } else if (responseData.total) {
            setTotalProducts(responseData.total || 0);
          }
        } else {
          setProducts([]);
          setTotalProducts(0);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, []);

  // Fetch danh mục - chỉ gọi một lần
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        if (response && response.data && response.data.success) {
          setCategories(response.data.data || []);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Xử lý URL params khi location thay đổi
  useEffect(() => {
    // Lấy tham số từ URL
    const searchParam = queryParams.get('search') || '';
    const categoryParam = queryParams.get('category') || '';
    const sortParam = queryParams.get('sort') || 'createdAt';
    const orderParam = queryParams.get('order') || 'desc';
    const pageParam = queryParams.get('page');
    const minPriceParam = queryParams.get('minPrice') || '';
    const maxPriceParam = queryParams.get('maxPrice') || '';

    // Parse page param an toàn
    let pageValue = 1;
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        pageValue = parsedPage;
      }
    }

    // Tạo params mới
    const newParams = {
      page: pageValue,
      limit: 12,
      search: searchParam,
      category: categoryParam,
      sort: sortParam,
      order: orderParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam
    };

    // Cập nhật state
    setParams(newParams);
    paramsRef.current = newParams;

    // Xử lý giá trị khoảng giá
    if (minPriceParam || maxPriceParam) {
      const minPrice = minPriceParam ? parseInt(minPriceParam, 10) : 0;
      const maxPrice = maxPriceParam ? parseInt(maxPriceParam, 10) : 10000000;
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        setPriceRange([minPrice, maxPrice]);
      }
    } else {
      setPriceRange([0, 10000000]);
    }

    // Fetch dữ liệu sau khi cập nhật state (sử dụng tham số mới trực tiếp)
    fetchProducts(newParams);
  }, [location.search, fetchProducts]);

  // ĐỂ Ý: Không còn hiệu ứng phụ nào khác gây ra cập nhật URL!

  // Hàm cập nhật URL và chuyển hướng
  const updateURL = useCallback((newParams) => {
    // Tạo params mới từ params hiện tại và newParams
    const updatedParams = { ...paramsRef.current, ...newParams };

    // Reset về trang 1 nếu các tham số tìm kiếm thay đổi
    if (!newParams.hasOwnProperty('page')) {
      updatedParams.page = 1;
    }

    // Tạo URL search string mới
    const searchParams = new URLSearchParams();
    Object.entries(updatedParams).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        searchParams.set(key, value);
      }
    });

    // Chuyển hướng đến URL mới
    navigate({
      pathname: '/search',
      search: `?${searchParams.toString()}`
    }, { replace: true });
  }, [navigate]);

  // Xử lý thay đổi trang
  const handlePageChange = useCallback((page) => {
    updateURL({ page });
  }, [updateURL]);

  // Xử lý thay đổi khoảng giá
  const handlePriceChange = useCallback((value) => {
    setPriceRange(value);
  }, []);

  // Áp dụng khoảng giá
  const applyPriceRange = useCallback(() => {
    updateURL({
      minPrice: priceRange[0],
      maxPrice: priceRange[1]
    });
  }, [priceRange, updateURL]);

  // Xử lý thay đổi từ khóa tìm kiếm
  const handleSearchInputChange = useCallback((e) => {
    const { value } = e.target;
    if (value === '') {
      updateURL({ search: '' });
    }
  }, [updateURL]);

  // Xử lý tìm kiếm khi nhấn Enter
  const handleSearch = useCallback((value) => {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      updateURL({ search: trimmedValue });
    }
  }, [updateURL]);

  // Xử lý reset bộ lọc
  const resetFilters = useCallback(() => {
    updateURL({
      search: paramsRef.current.search, // Giữ từ khóa tìm kiếm
      category: '',
      sort: 'createdAt',
      order: 'desc',
      minPrice: '',
      maxPrice: ''
    });
    setPriceRange([0, 10000000]);
  }, [updateURL]);

  // Định dạng giá tiền
  const formatPrice = useCallback((value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }, []);

  // Xử lý thêm vào giỏ hàng - Sử dụng addToCart từ CartContext
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

  // Xử lý thêm vào yêu thích
  const handleAddToWishlist = (product) => {
    message.success(`Đã thêm ${product.name} vào danh sách yêu thích!`);
    return Promise.resolve({ success: true });
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={24}>
            <Title level={3} className="search-title">
              {params.search ? `Kết quả tìm kiếm cho "${params.search}"` : 'Tất cả sản phẩm'}
            </Title>
            <Text className="search-count">Tìm thấy {totalProducts} sản phẩm</Text>
          </Col>

          {/* Thanh tìm kiếm và sắp xếp */}
          <Col xs={24} lg={24}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={12}>
                <SearchInput
                  defaultValue={params.search}
                  placeholder="Tìm kiếm sản phẩm..."
                  onSearch={handleSearch}
                  onChange={handleSearchInputChange}
                />
              </Col>
              <Col xs={12} md={6}>
                <Select
                  style={{ width: '100%' }}
                  value={`${params.sort}-${params.order}`}
                  onChange={(value) => {
                    const [sort, order] = value.split('-');
                    updateURL({ sort, order });
                  }}
                  size="large"
                  placeholder="Sắp xếp theo"
                  prefix={<SortAscendingOutlined />}
                >
                  <Option value="createdAt-desc">Mới nhất</Option>
                  <Option value="price-asc">Giá tăng dần</Option>
                  <Option value="price-desc">Giá giảm dần</Option>
                  <Option value="sold-desc">Bán chạy nhất</Option>
                  <Option value="views-desc">Phổ biến nhất</Option>
                </Select>
              </Col>
              <Col xs={12} md={6}>
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  size="large"
                  onClick={() => {
                    setFiltersVisible(!filtersVisible);
                  }}
                  block
                >
                  Bộ lọc
                </Button>
              </Col>
            </Row>
          </Col>

          {/* Bộ lọc */}
          {filtersVisible && (
            <Col xs={24}>
              <Card className="filter-card">
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <div className="filter-section">
                      <Title level={5}>Danh mục</Title>
                      <Select
                        style={{ width: '100%' }}
                        value={params.category || undefined}
                        onChange={(value) => {
                          updateURL({ category: value });
                        }}
                        placeholder="Chọn danh mục"
                        allowClear
                      >
                        {categories.map((category) => (
                          <Option key={category._id} value={category._id}>
                            {category.name}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="filter-section">
                      <Title level={5}>Khoảng giá</Title>
                      <Slider
                        range
                        min={0}
                        max={10000000}
                        step={100000}
                        value={priceRange}
                        onChange={handlePriceChange}
                        tipFormatter={formatPrice}
                      />
                      <div className="price-range-labels">
                        <Text>{formatPrice(priceRange[0])}</Text>
                        <Text>{formatPrice(priceRange[1])}</Text>
                      </div>
                      <Button type="primary" onClick={applyPriceRange} style={{ marginTop: '10px' }}>
                        Áp dụng
                      </Button>
                    </div>
                  </Col>
                  <Col xs={24}>
                    <Button onClick={resetFilters}>Xóa bộ lọc</Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          )}

          <Divider />

          {/* Kết quả tìm kiếm */}
          <Col xs={24}>
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : products.length > 0 ? (
              <>
                <Row gutter={[16, 24]} className="products-grid">
                  {products.map((product) => (
                    <Col xs={12} sm={8} md={6} lg={6} key={product._id} className="product-column">
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleAddToWishlist}
                        imageHeight={220}
                        onProductClick={() => navigate(`/products/${product.slug}`)}
                      />
                    </Col>
                  ))}
                </Row>
                {totalProducts > params.limit && (
                  <div className="pagination-container">
                    <Pagination
                      current={params.page}
                      pageSize={params.limit}
                      total={totalProducts}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      pageSizeOptions={['12', '24', '36', '48']}
                    />
                  </div>
                )}
              </>
            ) : (
              <Empty
                description="Không tìm thấy sản phẩm nào phù hợp"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="empty-result"
              />
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SearchPage;