import React, { useState, useEffect } from 'react';
import { Card, Typography, List, Checkbox, Button, Slider, Spin, Empty } from 'antd';
import { ReloadOutlined, FilterOutlined, DollarOutlined } from '@ant-design/icons';
import '../styles/ProductFilter.scss';

const { Title } = Typography;

const ProductFilter = ({
  categories,
  categoryLoading,
  filters,
  onFilterChange,
  subcategories = [], // Thêm props mới
  currentCategory = null,
  parentCategory = null
}) => {
  // Local state cho price range
  const [priceRange, setPriceRange] = useState([
    filters.minPrice ? parseInt(filters.minPrice) : 0,
    filters.maxPrice ? parseInt(filters.maxPrice) : 200000
  ]);

  // Update price range when filters change externally
  useEffect(() => {
    setPriceRange([
      filters.minPrice ? parseInt(filters.minPrice) : 0,
      filters.maxPrice ? parseInt(filters.maxPrice) : 200000
    ]);
  }, [filters.minPrice, filters.maxPrice]);

  // Xử lý khi thay đổi danh mục
  const handleCategoryChange = (categoryId) => {
    onFilterChange({
      category: filters.category === categoryId ? '' : categoryId
    });
  };

  // Xử lý khi thay đổi giá
  const handlePriceChange = (value) => {
    setPriceRange(value);
  };

  // Áp dụng khoảng giá
  const applyPriceRange = () => {
    // Luôn chuyển đổi thành số nguyên và gửi khi nhấn nút
    const minPrice = priceRange[0];
    const maxPrice = priceRange[1];

    console.log('Applying price range:', minPrice, maxPrice);

    // Gửi giá trị luôn khi nhấn nút, không cần so sánh
    onFilterChange({
      minPrice: minPrice,
      maxPrice: maxPrice
    });
  };

  // Reset tất cả filter
  const handleResetFilters = () => {
    onFilterChange({
      category: '',
      minPrice: '',
      maxPrice: ''
    });
    setPriceRange([0, 1000000]);
  };

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Kiểm tra xem danh mục có danh mục con hay không
  const hasSubcategories = (category) => {
    return category.subcategories && category.subcategories.length > 0;
  };

  // Check if any filters are active (excluding search)
  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice;

  // Render danh mục với danh mục con
  const renderCategories = () => {
    if (categoryLoading) {
      return (
        <div className="loading-container">
          <Spin size="small" />
        </div>
      );
    }

    if (!categories || categories.length === 0) {
      return (
        <Empty description="Không có danh mục nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      );
    }

    return (
      <List
        dataSource={categories}
        renderItem={category => (
          <React.Fragment key={category._id}>
            <List.Item
              onClick={() => handleCategoryChange(category._id)}
              className={`category-item ${filters.category === category._id ? 'active' : ''}`}
            >
              <Checkbox checked={filters.category === category._id}>
                <span className="category-name">{category.name}</span>
                {category.productCount !== undefined && (
                  <span className="product-count">({category.productCount})</span>
                )}
              </Checkbox>
            </List.Item>

            {/* Hiển thị danh mục con nếu có và category là danh mục đang được chọn hoặc là cha của danh mục đang chọn */}
            {hasSubcategories(category) && (filters.category === category._id ||
              category.subcategories.some(sub => sub._id === filters.category)) && (
                <div className="subcategories-in-filter">
                  {category.subcategories.map(subcat => (
                    <List.Item
                      key={subcat._id}
                      onClick={() => handleCategoryChange(subcat._id)}
                      className={`subcategory-item ${filters.category === subcat._id ? 'active' : ''}`}
                    >
                      <Checkbox checked={filters.category === subcat._id}>
                        {subcat.name}
                      </Checkbox>
                    </List.Item>
                  ))}
                </div>
              )}
          </React.Fragment>
        )}
      />
    );
  };

  return (
    <div className="product-filter">
      {/* Danh mục */}
      <Card className="filter-card">
        <Title level={5}>
          <FilterOutlined /> Danh mục sản phẩm
        </Title>
        {renderCategories()}
      </Card>

      {/* Khoảng giá */}
      <Card className="filter-card">
        <Title level={5}>
          <DollarOutlined /> Khoảng giá
        </Title>
        <div className="price-slider">
          <Slider
            range
            min={0}
            max={200000}
            step={5000}
            value={priceRange}
            onChange={handlePriceChange}
            tipFormatter={value => formatPrice(value)}
          />
          <div className="price-range-display">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
          <Button
            type="primary"
            onClick={applyPriceRange}
            block
            className="apply-price-btn"
          >
            Áp dụng khoảng giá
          </Button>
        </div>
      </Card>

      {/* Reset filter */}
      {hasActiveFilters && (
        <div className="reset-filter">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetFilters}
            type="dashed"
            block
          >
            Bỏ tất cả bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductFilter;