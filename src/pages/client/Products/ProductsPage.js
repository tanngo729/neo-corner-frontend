import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Row, Col, Breadcrumb, Pagination, Empty, Spin, Typography, Tag, Button } from 'antd';
import { HomeOutlined, AppstoreOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons';
import ProductList from './components/ProductList';
import ProductFilter from './components/ProductFilter';
import ProductSort from './components/ProductSort';
import { productService, categoryService } from '../../../services/client';
import './styles/ProductsPage.scss';

const { Title } = Typography;

const ProductsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Thêm state để kiểm soát hiển thị filter trên mobile
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Cập nhật để sử dụng useCallback để tránh việc tạo lại hàm mỗi lần render
  const getQueryParams = useCallback(() => {
    const queryParams = new URLSearchParams(location.search);
    return {
      page: parseInt(queryParams.get('page')) || 1,
      limit: parseInt(queryParams.get('limit')) || 12,
      category: queryParams.get('category') || '',
      search: queryParams.get('search') || '',
      minPrice: queryParams.get('minPrice') || '',
      maxPrice: queryParams.get('maxPrice') || '',
      sort: queryParams.get('sort') || 'createdAt',
      order: queryParams.get('order') || 'desc'
    };
  }, [location.search]);

  // Lấy params ban đầu
  const initialParams = getQueryParams();

  // States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]); // Thêm state cho danh mục con
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [parentCategory, setParentCategory] = useState(null); // Thêm state cho danh mục cha
  const [pagination, setPagination] = useState({
    current: initialParams.page,
    pageSize: initialParams.limit,
    total: 0
  });

  // Lấy filter từ URL
  const [filters, setFilters] = useState({
    category: initialParams.category,
    search: initialParams.search,
    minPrice: initialParams.minPrice,
    maxPrice: initialParams.maxPrice,
    sort: initialParams.sort,
    order: initialParams.order
  });

  // Lấy thông tin danh mục nếu có
  const [currentCategory, setCurrentCategory] = useState(null);

  // Toggle hiển thị filter trên mobile
  const toggleMobileFilter = () => {
    setShowMobileFilter(!showMobileFilter);
  };

  // Sử dụng useCallback cho fetchProducts - ĐÃ CẬP NHẬT
  const fetchProducts = useCallback(async (params) => {
    setLoading(true);
    try {
      let response;

      // Nếu có category, sử dụng hàm getProductsByCategory để lấy cả sản phẩm thuộc danh mục con
      if (params.category) {
        const categoryId = params.category;
        const otherParams = { ...params };
        delete otherParams.category; // Xóa để tránh trùng lặp

        response = await productService.getProductsByCategory(categoryId, otherParams);
      } else {
        // Nếu không có category, sử dụng API thông thường
        response = await productService.getProducts(params);
      }

      if (response?.data?.success) {
        setProducts(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0
        }));
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sản phẩm khi filters hoặc pagination thay đổi
  useEffect(() => {
    // Tạo object params từ state filters và pagination
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      sort: filters.sort,
      order: filters.order
    };

    // Thêm các filter khác nếu có
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;

    // Đảm bảo chỉ gửi minPrice và maxPrice khi có giá trị
    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      params.minPrice = filters.minPrice;
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      params.maxPrice = filters.maxPrice;
    }

    fetchProducts(params);
  }, [filters, pagination.current, pagination.pageSize, fetchProducts]);

  // Fetch danh mục kèm danh mục con
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        // Gọi API lấy danh mục kèm danh mục con thay vì getCategories
        const response = await categoryService.getCategoryWithSubcategories();
        if (response?.data?.success) {
          setCategories(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Cập nhật khi URL thay đổi (ví dụ: khi click vào menu)
  useEffect(() => {
    const params = getQueryParams();

    // Cập nhật filters
    setFilters({
      category: params.category,
      search: params.search,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      sort: params.sort,
      order: params.order
    });

    // Cập nhật pagination
    setPagination(prev => ({
      ...prev,
      current: params.page,
      pageSize: params.limit
    }));
  }, [location.search, getQueryParams]);

  // Fetch thông tin danh mục hiện tại và cập nhật danh mục con (nếu có)
  useEffect(() => {
    const fetchCurrentCategory = async () => {
      if (!filters.category) {
        setCurrentCategory(null);
        setParentCategory(null);
        setSubcategories([]);
        return;
      }

      try {
        // Lấy categories kèm subcategories
        const response = await categoryService.getCategoryWithSubcategories();
        if (response?.data?.success && response.data.data) {
          // Tìm trong categories chính (danh mục cha)
          const parentCat = response.data.data.find(c => c._id === filters.category);

          if (parentCat) {
            // Trường hợp 1: Đang xem danh mục cha
            setCurrentCategory(parentCat);
            setParentCategory(null);
            setSubcategories(parentCat.subcategories || []);
            return;
          }

          // Trường hợp 2: Đang xem danh mục con
          for (const parent of response.data.data) {
            if (parent.subcategories && parent.subcategories.length > 0) {
              const subCat = parent.subcategories.find(sc => sc._id === filters.category);
              if (subCat) {
                setCurrentCategory(subCat);
                setParentCategory(parent);
                setSubcategories([]); // Danh mục con không có subcategories
                return;
              }
            }
          }

          // Trường hợp 3: Không tìm thấy danh mục
          setCurrentCategory({
            _id: filters.category,
            name: 'Danh mục sản phẩm',
            description: ''
          });
          setParentCategory(null);
          setSubcategories([]);
        }
      } catch (error) {
        console.error('Error fetching current category:', error);
        setCurrentCategory({
          _id: filters.category,
          name: 'Danh mục sản phẩm',
          description: ''
        });
        setParentCategory(null);
        setSubcategories([]);
      }
    };

    fetchCurrentCategory();
  }, [filters.category]);

  // Cập nhật URL khi filters hoặc pagination thay đổi
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.sort !== 'createdAt') params.append('sort', filters.sort);
    if (filters.order !== 'desc') params.append('order', filters.order);
    if (pagination.current !== 1) params.append('page', pagination.current);
    if (pagination.pageSize !== 12) params.append('limit', pagination.pageSize);

    navigate({
      pathname: location.pathname,
      search: params.toString()
    }, { replace: true });
  }, [filters, pagination.current, pagination.pageSize, navigate, location.pathname]);

  // Cập nhật filter
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    // Reset về trang 1 khi filter thay đổi
    setPagination({ ...pagination, current: 1 });
  };

  // Cập nhật sắp xếp
  const handleSortChange = (sort, order) => {
    setFilters({ ...filters, sort, order });
  };

  // Cập nhật phân trang
  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  // Chuyển đổi qua danh mục con
  const handleSubcategoryClick = (subcategoryId) => {
    handleFilterChange({ category: subcategoryId });
  };

  return (
    <div className="products-page">
      <div className="container">
        {/* Breadcrumb - Đã cập nhật để hiển thị cả danh mục cha khi xem danh mục con */}
        <Breadcrumb className="products-breadcrumb">
          <Breadcrumb.Item href="/">
            <HomeOutlined /> Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/products">
            <AppstoreOutlined /> Sản phẩm
          </Breadcrumb.Item>
          {parentCategory && (
            <Breadcrumb.Item href={`/products?category=${parentCategory._id}`}>
              {parentCategory.name}
            </Breadcrumb.Item>
          )}
          {currentCategory && (
            <Breadcrumb.Item>{currentCategory.name}</Breadcrumb.Item>
          )}
        </Breadcrumb>

        {/* Tiêu đề trang */}
        <div className="page-header">
          <Title level={2}>
            {currentCategory ? currentCategory.name : 'Tất cả sản phẩm'}
            {parentCategory && (
              <span className="parent-category"> - {parentCategory.name}</span>
            )}
          </Title>
          {currentCategory && currentCategory.description && (
            <p className="category-description">{currentCategory.description}</p>
          )}

          {/* Hiển thị danh mục con khi đang xem danh mục cha */}
          {subcategories && subcategories.length > 0 && (
            <div className="subcategories-container">
              <div className="subcategories-title">Danh mục con:</div>
              <div className="subcategories-list">
                {subcategories.map(subcat => (
                  <Tag
                    key={subcat._id}
                    className={`subcategory-tag ${filters.category === subcat._id ? 'active' : ''}`}
                    onClick={() => handleSubcategoryClick(subcat._id)}
                  >
                    {subcat.name}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile filter toggle button */}
        <div className="mobile-filter-toggle">
          <Button
            type="primary"
            icon={showMobileFilter ? <CloseOutlined /> : <FilterOutlined />}
            onClick={toggleMobileFilter}
          >
            {showMobileFilter ? 'Đóng bộ lọc' : 'Hiện bộ lọc'}
          </Button>
        </div>

        <Row gutter={[24, 24]}>
          {/* Sidebar filter - thêm class để kiểm soát hiển thị trên mobile */}
          <Col
            xs={24}
            sm={24}
            md={6}
            lg={6}
            className={`filter-column ${showMobileFilter ? 'filter-mobile-visible' : 'filter-mobile-hidden'}`}
          >
            <ProductFilter
              categories={categories}
              categoryLoading={categoryLoading}
              filters={filters}
              onFilterChange={handleFilterChange}
              subcategories={subcategories}
              currentCategory={currentCategory}
              parentCategory={parentCategory}
            />
          </Col>

          {/* Product listing */}
          <Col xs={24} sm={24} md={18} lg={18}>
            {/* Sorting and result count */}
            <div className="products-header">
              <div className="result-count">
                {!loading && (
                  <span>Hiển thị {products.length} / {pagination.total} sản phẩm</span>
                )}
              </div>
              <ProductSort
                sort={filters.sort}
                order={filters.order}
                onSortChange={handleSortChange}
              />
            </div>

            {/* Products grid */}
            <div className="products-container">
              {loading ? (
                <div className="loading-container">
                  <Spin size="large" />
                </div>
              ) : products.length > 0 ? (
                <ProductList products={products} />
              ) : (
                <Empty
                  description="Không tìm thấy sản phẩm nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="pagination-container">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  pageSizeOptions={['12', '24', '36', '48']}
                />
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProductsPage;