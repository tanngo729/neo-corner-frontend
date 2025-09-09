// src/components/client/search/SearchInput.js
import React, { useState, useEffect, useRef } from 'react';
import { Input, AutoComplete, Spin, Empty, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../../services/client';
import CustomButton from '../../common/buttoncustom/CustomButton';
import './SearchInput.scss';

const { Text } = Typography;

/**
 * Component ô tìm kiếm có gợi ý kết quả
 * @param {Object} props
 * @param {string} props.className - Class CSS tùy chỉnh
 * @param {string} props.placeholder - Placeholder cho ô tìm kiếm
 * @param {string} props.defaultValue - Giá trị mặc định
 * @param {Function} props.onSearch - Callback khi submit tìm kiếm
 * @param {Function} props.onChange - Callback khi thay đổi giá trị
 * @param {boolean} props.customStyle - Sử dụng style tùy chỉnh thay vì Input.Search
 */
const SearchInput = React.forwardRef(({
  className = '',
  placeholder = 'Tìm kiếm sản phẩm...',
  defaultValue = '',
  onSearch,
  onChange,
  customStyle = false
}, ref) => {
  const [value, setValue] = useState(defaultValue || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();
  // Thêm ref cho input trong chế độ customStyle
  const inputRef = useRef(null);

  // Expose focus method và ref cho component cha
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      const inputElement = inputRef.current?.querySelector('input');
      if (inputElement) {
        inputElement.focus();
      }
    },
    inputRef
  }));

  // Cập nhật giá trị khi defaultValue thay đổi từ props
  useEffect(() => {
    if (defaultValue !== undefined) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  // Xử lý thay đổi giá trị tìm kiếm với debounce
  const handleSearch = (searchText) => {
    setValue(searchText);

    // Gọi callback onChange nếu có
    if (onChange) {
      onChange({ target: { value: searchText } });
    }

    // Clear timeout trước đó
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Không tìm kiếm nếu chuỗi quá ngắn
    if (!searchText || searchText.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Set timeout mới để debounce request
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchText);
    }, 300);

    setDebounceTimeout(timeoutId);
  };

  // Hàm gọi API tìm kiếm gợi ý
  const fetchSuggestions = async (searchText) => {
    setLoading(true);
    try {
      const response = await productService.searchSuggestions(searchText);

      if (response?.data?.success) {
        const data = response.data.data || [];

        // Chuyển đổi dữ liệu cho AutoComplete
        const options = data.map(product => ({
          value: product.name,
          label: (
            <div className="suggestion-item">
              <img
                src={product.mainImage?.url || 'https://placehold.co/50x50/f0f0f0/808080?text=NA'}
                alt={product.name}
                className="suggestion-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/50x50/f0f0f0/808080?text=NA';
                }}
              />
              <Space direction="vertical" size={0}>
                <Text className="suggestion-title">{product.name}</Text>
                <Text className="suggestion-price">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </Text>
              </Space>
            </div>
          ),
          key: product._id,
          product
        }));

        setSuggestions(options);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm gợi ý:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi chọn một gợi ý
  const handleSelect = (value, option) => {
    if (option && option.product) {
      // Nếu chọn từ suggestion, sử dụng tên sản phẩm đã chọn
      handleSubmit(option.product.name);
    }
  };

  // Xử lý khi nhấn Enter hoặc nút tìm kiếm
  const handleSubmit = (searchValue) => {
    const searchText = searchValue || value;
    const trimmedText = searchText.trim();

    if (trimmedText) {
      console.log("Tìm kiếm với từ khóa:", trimmedText);

      if (onSearch) {
        // Đảm bảo truyền giá trị đã được trim
        onSearch(trimmedText);
      } else {
        // Nếu không có hàm onSearch được cung cấp, chuyển hướng đến trang search
        navigate({
          pathname: '/search',
          search: `?search=${encodeURIComponent(trimmedText)}`
        });
      }
    }
  };

  // Nội dung dropdown khi không có gợi ý
  const notFoundContent = loading ? (
    <div className="suggestion-loading">
      <Spin size="small" />
      <Text>Đang tìm kiếm...</Text>
    </div>
  ) : (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="Không tìm thấy sản phẩm"
      className="suggestion-empty"
    />
  );

  // Custom search component theo design mới
  if (customStyle) {
    return (
      <div className={`search-input-wrapper custom-style ${className}`} ref={inputRef}>
        <AutoComplete
          className="search-autocomplete-custom"
          options={suggestions}
          onSearch={handleSearch}
          onSelect={handleSelect}
          notFoundContent={notFoundContent}
          value={value}
          onChange={setValue}
          popupClassName="search-dropdown"
          popupMatchSelectWidth={false}
        >
          <div className="custom-search">
            <input
              type="text"
              placeholder={placeholder}
              className="search-input"
              value={value}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(value);
                  e.preventDefault();
                }
              }}
            />
            <CustomButton
              type="secondary"
              icon={<SearchOutlined />}
              className="search-button"
              onClick={() => handleSubmit(value)}
            />
          </div>
        </AutoComplete>
      </div>
    );
  }

  return (
    <div className={`search-input-wrapper ${className}`}>
      <AutoComplete
        className="search-autocomplete"
        options={suggestions}
        onSearch={handleSearch}
        onSelect={handleSelect}
        notFoundContent={notFoundContent}
        value={value}
        onChange={setValue}
        popupClassName="search-dropdown"
        popupMatchSelectWidth={false}
      >
        <Input.Search
          placeholder={placeholder}
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSubmit}
          className="search-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(value);
            }
          }}
        />
      </AutoComplete>
    </div>
  );
});

export default SearchInput;