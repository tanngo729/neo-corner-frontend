// src/layouts/ClientLayout/components/MobileSearch.js 
import React, { useRef, useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../components/common/buttoncustom/CustomButton';
import SearchInput from '../../../components/client/search/SearchInput';
import '../styles/MobileSearch.scss';

const MobileSearch = ({ onSearch, visible, onClose }) => {
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Xử lý click bên ngoài để đóng search drawer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (visible && searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus vào input khi drawer mở
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  // ESC key để đóng drawer
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && visible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [visible, onClose]);

  // Xử lý search và đóng drawer - Đã cập nhật
  const handleMobileSearch = (value) => {
    const trimmedValue = value.trim();

    if (trimmedValue) {
      // Sử dụng hàm onSearch nếu được truyền
      if (onSearch) {
        onSearch(trimmedValue);
      } else {
        navigate({
          pathname: '/search',
          search: `?search=${encodeURIComponent(trimmedValue)}`
        });
      }

      // Đóng drawer
      onClose();
    }
  };

  return (
    <>
      {/* Mobile search drawer */}
      <div className={`custom-search-drawer ${visible ? 'visible' : ''}`}>
        <div className="custom-search-drawer-content" ref={searchRef}>
          <div className="search-drawer-header">
            <span>Tìm kiếm</span>
            <CustomButton
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              className="drawer-close"
            />
          </div>

          <div className="search-drawer-body">
            <SearchInput
              ref={inputRef}
              placeholder="Tìm kiếm sản phẩm..."
              onSearch={handleMobileSearch}
              className="mobile-search-input"
            />
          </div>
        </div>
      </div>

      {/* Tablet search bar (fixed position) */}
      <div className="tablet-search">
        <div className="container">
          <SearchInput
            placeholder="Tìm kiếm sản phẩm..."
            onSearch={onSearch}
            className="tablet-search-input"
          />
        </div>
      </div>
    </>
  );
};

export default MobileSearch;
