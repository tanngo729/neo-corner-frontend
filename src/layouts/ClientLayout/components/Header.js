// src/layouts/ClientLayout/components/Header.js
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MenuOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SearchOutlined,
  BellOutlined,
  HomeOutlined,
  AppstoreOutlined,
  DownOutlined
} from '@ant-design/icons';
import LogoSvg from './LogoSvg';
import CustomButton from '../../../components/common/buttoncustom/CustomButton';
import SearchInput from '../../../components/client/search/SearchInput';
import MiniCart from '../../../components/client/cart/MiniCart';
import { useCart } from '../../../contexts/CartContext';
import '../styles/Header.scss';
import '../styles/UserDropdown.scss';

const Header = forwardRef(({
  isSticky = false,
  isAuthenticated = false,
  user = null,
  userMenuItems = [],
  toggleDrawer,
  toggleSearch,
  categories = [],
  loadingCategories = false,
  onSearch
}, ref) => {
  // Lấy cartItemCount và badgeUpdated từ CartContext
  const { cartItemCount, badgeUpdated } = useCart();

  const location = useLocation();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [miniCartVisible, setMiniCartVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const userDropdownRef = useRef(null);
  const cartRef = useRef(null);
  const notificationRef = useRef(null);

  // Kiểm tra nếu đang ở mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Xử lý click bên ngoài dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setMiniCartVisible(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Kiểm tra menu nào đang active
  const isActiveMenu = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }

    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }

    return false;
  };

  // Xử lý tìm kiếm
  const handleSearch = (value) => {
    const trimmedValue = value.trim();

    if (trimmedValue) {
      // Đóng drawer tìm kiếm nếu đang mở
      if (toggleSearch) {
        toggleSearch(false);
      }

      if (onSearch) {
        onSearch(trimmedValue);
      } else {
        navigate({
          pathname: '/search',
          search: `?search=${encodeURIComponent(trimmedValue)}`
        });
      }
    }
  };

  // Lọc danh mục hợp lệ
  const getSafeCategories = () => {
    return categories.filter(category =>
      category && (category._id || category.id) && category.name
    );
  };

  // Hiển thị tên người dùng đã đăng nhập
  const getUserDisplayName = () => {
    if (!user) return '';

    // Nếu có fullName, sử dụng fullName
    if (user.fullName) {
      // Lấy phần tên (từ cuối cùng trong fullName)
      const nameParts = user.fullName.split(' ');
      return nameParts[nameParts.length - 1];
    }

    // Nếu không có fullName nhưng có email, sử dụng phần trước @ của email
    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Tài khoản';
  };

  return (
    <header className={`client-header ${isSticky ? 'sticky' : ''}`} ref={ref}>
      <div className="container">
        <div className="header-row">
          {/* Mobile Menu Button */}
          <div className="mobile-menu-btn">
            <CustomButton
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleDrawer}
              className="menu-trigger"
            />
          </div>

          {/* Logo */}
          <div className="logo-container">
            <Link to="/" className="logo-link">
              <LogoSvg />
              <span>NEO CORNER</span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="header-search-wrapper">
            <SearchInput
              customStyle={true}
              placeholder="Tìm kiếm sản phẩm..."
              onSearch={handleSearch}
              className="custom-search"
            />
          </div>

          {/* Mobile Search Button */}
          <div className="mobile-search-btn">
            <CustomButton
              type="text"
              icon={<SearchOutlined />}
              onClick={toggleSearch}
              className="search-trigger"
            />
          </div>

          {/* Actions */}
          <div className="header-actions">
            {/* Notification Button - New Addition */}
            <div className="action-badge" ref={notificationRef}>
              <CustomButton
                type="text"
                icon={<BellOutlined />}
                className="action-btn"
                onClick={() => setNotificationVisible(!notificationVisible)}
              />
              {/* Optional: Add notification count badge here */}
            </div>

            {/* Cart Button */}
            <div className="action-badge" ref={cartRef}>
              {isAuthenticated ? (
                isMobile ? (
                  // Mobile: Link trực tiếp đến trang cart
                  <Link to="/cart">
                    <CustomButton
                      type="text"
                      icon={<ShoppingCartOutlined />}
                      className="action-btn"
                    />
                    {cartItemCount > 0 && (
                      <span className={`badge-count ${badgeUpdated ? 'updated' : ''}`}>
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                ) : (
                  // Desktop: MiniCart popup
                  <div className="cart-wrapper">
                    <CustomButton
                      type="text"
                      icon={<ShoppingCartOutlined />}
                      className="action-btn"
                      onClick={() => setMiniCartVisible(!miniCartVisible)}
                    />
                    {cartItemCount > 0 && (
                      <span className={`badge-count ${badgeUpdated ? 'updated' : ''}`}>
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                    <MiniCart
                      visible={miniCartVisible}
                      onMouseLeave={() => setMiniCartVisible(false)}
                      staticMode={false}
                    />
                  </div>
                )
              ) : (
                <Link to="/login">
                  <CustomButton
                    type="text"
                    icon={<ShoppingCartOutlined />}
                    className="action-btn"
                  />
                </Link>
              )}
            </div>

            {/* User dropdown - chỉ hiển thị trên desktop */}
            {!isMobile && isAuthenticated ? (
              <div
                className="client-user-dropdown"
                ref={userDropdownRef}
              >
                <CustomButton
                  type="text"
                  className={`avatar-btn ${userDropdownOpen ? 'active' : ''}`}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <div className="user-avatar">
                    <UserOutlined />
                  </div>
                  <span className="user-name">{getUserDisplayName()}</span>
                </CustomButton>
                {userDropdownOpen && (
                  <div className="dropdown-menu">
                    {userMenuItems.map((item) => {
                      if (item.type === 'divider') {
                        return <div key={`divider-${Math.random()}`} className="dropdown-divider"></div>;
                      }
                      if (item.onClick) {
                        return (
                          <button
                            key={item.key}
                            className="dropdown-item"
                            onClick={(e) => {
                              item.onClick(e);
                              setUserDropdownOpen(false);
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      }
                      return (
                        <div key={item.key} className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : !isMobile && !isAuthenticated ? (
              <Link to="/login" className="login-btn-wrapper">
                <CustomButton type="secondary" className="login-btn" size="middle">Đăng nhập</CustomButton>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="main-nav">
        <div className="container">
          <nav className="custom-menu">
            <ul className="menu-list">
              <li className={`menu-item ${isActiveMenu('/') ? 'active' : ''}`}>
                <Link to="/" className="menu-link">
                  <HomeOutlined className="menu-icon" />
                  <span>Trang chủ</span>
                </Link>
              </li>
              <li className={`menu-item ${isActiveMenu('/products') ? 'active' : ''}`}>
                <Link to="/products" className="menu-link">
                  <AppstoreOutlined className="menu-icon" />
                  <span>Tất cả sản phẩm</span>
                </Link>
              </li>

              {/* Dropdown menu cho danh mục sản phẩm */}
              <li className={`menu-item dropdown`}>
                <div className="menu-link">
                  <span>Danh mục</span>
                  <DownOutlined className="dropdown-icon" />
                </div>
                <ul className="dropdown-menu">
                  {!loadingCategories && getSafeCategories().map(category => (
                    <li key={category._id || category.id} className="dropdown-item parent-item">
                      <Link
                        to={`/products?category=${category._id || category.id}`}
                        className="dropdown-link parent-link"
                      >
                        <span className="category-name">{category.name}</span>
                      </Link>

                      {/* Danh mục con - chỉ hiển thị nếu có */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <ul className="subcategory-list">
                          {category.subcategories.map(subCategory => (
                            <li key={subCategory._id || subCategory.id} className="subcategory-item">
                              <Link
                                to={`/products?category=${subCategory._id || subCategory.id}`}
                                className="dropdown-link subcategory-link"
                              >
                                {subCategory.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </li>

              {/* Các mục menu khác */}
              <li className={`menu-item ${isActiveMenu('/about') ? 'active' : ''}`}>
                <Link to="/about" className="menu-link">
                  <span>Giới thiệu</span>
                </Link>
              </li>
              <li className={`menu-item ${isActiveMenu('/contact') ? 'active' : ''}`}>
                <Link to="/contact" className="menu-link">
                  <span>Liên hệ</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
});

export default Header;