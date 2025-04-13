// src/layouts/ClientLayout/components/MobileDrawer.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UserOutlined,
  HomeOutlined,
  AppstoreOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  CloseOutlined,
  RightOutlined,
  QuestionCircleOutlined,
  ContactsOutlined,
  DownOutlined,
  UpOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  IdcardOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import CustomButton from '../../../components/common/buttoncustom/CustomButton';
import { Avatar, Badge, Divider } from 'antd';
import LogoSvg from './LogoSvg';
import '../styles/MobileDrawer.scss';

const MobileDrawer = ({
  open,
  onClose,
  categories = [],
  categoryWithSubs = [],
  isAuthenticated = false,
  onLogout,
  user = null,
  notificationCount = 0,
  cartItemCount = 0
}) => {
  const drawerRef = useRef(null);

  // State để theo dõi các danh mục mở rộng
  const [expandedCategories, setExpandedCategories] = useState({});

  // State để theo dõi panel nào đang active
  const [activePanel, setActivePanel] = useState('main'); // 'main', 'categories', 'account'

  // Hiển thị tên người dùng đã đăng nhập
  const getUserDisplayName = () => {
    if (!user) return 'Khách';

    // Nếu có fullName, sử dụng fullName
    if (user.fullName) {
      return user.fullName;
    }

    // Nếu không có fullName nhưng có email, sử dụng phần trước @ của email
    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Tài khoản';
  };

  // Lấy chữ cái đầu của tên người dùng cho avatar
  const getAvatarText = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Hàm lọc và xử lý danh mục an toàn
  const getSafeCategories = () => {
    // Ưu tiên sử dụng categoryWithSubs nếu có
    if (categoryWithSubs && categoryWithSubs.length > 0) {
      return categoryWithSubs;
    }

    return categories.filter(category =>
      category &&
      (category._id || category.id) &&
      category.name
    );
  };

  // Hàm toggle mở/đóng danh mục
  const toggleCategory = (categoryId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Chuyển đổi panel
  const switchPanel = (panel) => {
    setActivePanel(panel);
  };

  // Reset trạng thái khi drawer đóng
  useEffect(() => {
    if (!open) {
      setExpandedCategories({});
      setActivePanel('main');
    }
  }, [open]);

  // Xử lý click bên ngoài drawer để đóng
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      // Ngăn scroll khi drawer mở
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [open, onClose]);

  // ESC key để đóng drawer
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [open, onClose]);

  // Xử lý đăng xuất
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      onClose();
    }
  };

  // Nếu không mở, không render gì cả
  if (!open) return null;

  return (
    <div className={`custom-drawer-overlay ${open ? 'visible' : ''}`}>
      <div
        className={`custom-drawer ${open ? 'open' : ''}`}
        ref={drawerRef}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-logo">
            <img src="/neo.jpg" alt="Neo Corner Logo" width="40" height="40" style={{ borderRadius: '50%', marginRight: '10px' }} />
            <span>NEO CORNER</span>
          </div>
          <CustomButton
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="drawer-close"
          />
        </div>

        {/* Thông tin người dùng - chỉ hiển thị nếu đã đăng nhập */}
        {isAuthenticated && (
          <div className="user-info-section">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={getUserDisplayName()} />
              ) : (
                <Avatar size={40} style={{ backgroundColor: '#e31836' }}>{getAvatarText()}</Avatar>
              )}
            </div>
            <div className="user-details">
              <h3 className="user-name">{getUserDisplayName()}</h3>
              <p className="user-email">{user?.email || 'Chưa có email'}</p>
            </div>
            <CustomButton
              type="text"
              icon={<SettingOutlined />}
              onClick={() => switchPanel('account')}
              className="user-settings-btn"
            />
          </div>
        )}

        {/* Panel Main */}
        {activePanel === 'main' && (
          <div className="drawer-body">
            {/* Thanh nhanh trên đầu với các tùy chọn quan trọng - CẬP NHẬT THEO YÊU CẦU */}
            <div className="quick-actions">
              <Link to="/" className="quick-action-item" onClick={onClose}>
                <div className="quick-action-icon">
                  <HomeOutlined />
                </div>
                <span>Trang chủ</span>
              </Link>

              <Link to="/products" className="quick-action-item" onClick={onClose}>
                <div className="quick-action-icon">
                  <ShoppingOutlined />
                </div>
                <span>Mua sắm</span>
              </Link>

              <Link to="/orders" className="quick-action-item" onClick={onClose}>
                <div className="quick-action-icon">
                  <IdcardOutlined />
                </div>
                <span>Đơn hàng</span>
              </Link>

              <Link to="/wishlist" className="quick-action-item" onClick={onClose}>
                <div className="quick-action-icon">
                  <HeartIcon />
                </div>
                <span>Yêu thích</span>
              </Link>
            </div>

            <Divider className="drawer-divider" />

            <ul className="drawer-menu">
              {/* Button để mở panel danh mục */}
              <li className="drawer-menu-item">
                <button
                  className="drawer-menu-link"
                  onClick={() => switchPanel('categories')}
                >
                  <AppstoreOutlined className="drawer-menu-icon" />
                  <span>Danh mục sản phẩm</span>
                  <RightOutlined className="drawer-menu-arrow" />
                </button>
              </li>

              {/* Các mục menu yêu cầu */}
              <li className="drawer-menu-item">
                <Link
                  to="/about"
                  className="drawer-menu-link"
                  onClick={onClose}
                >
                  <QuestionCircleOutlined className="drawer-menu-icon" />
                  <span>Giới thiệu</span>
                </Link>
              </li>

              <li className="drawer-menu-item">
                <Link
                  to="/contact"
                  className="drawer-menu-link"
                  onClick={onClose}
                >
                  <ContactsOutlined className="drawer-menu-icon" />
                  <span>Liên hệ</span>
                </Link>
              </li>

              {/* Đăng nhập/Đăng xuất */}
              {isAuthenticated ? (
                <li className="drawer-menu-item">
                  <button
                    className="drawer-menu-link drawer-logout-button"
                    onClick={handleLogout}
                  >
                    <LogoutOutlined className="drawer-menu-icon" />
                    <span>Đăng xuất</span>
                  </button>
                </li>
              ) : (
                <li className="drawer-menu-item login-highlight">
                  <Link
                    to="/login"
                    className="drawer-menu-link"
                    onClick={onClose}
                  >
                    <UserSwitchOutlined className="drawer-menu-icon" />
                    <span>Đăng nhập / Đăng ký</span>
                  </Link>
                </li>
              )}
            </ul>

            {/* Contact Information */}
            <div className="drawer-contact">
              <h5 className="contact-title">Thông tin liên hệ</h5>
              <p><PhoneOutlined className="contact-icon" /> (028) 1234 5678</p>
              <p><MailOutlined className="contact-icon" /> info@shoponline.com</p>
              <p><EnvironmentOutlined className="contact-icon" /> 123 Đường ABC, TP. HCM</p>

              <h5 className="contact-title social-title">Kết nối với chúng tôi</h5>
              <div className="social-links-mobile">
                <CustomButton type="text" icon={<FacebookOutlined />} className="social-btn" />
                <CustomButton type="text" icon={<InstagramOutlined />} className="social-btn" />
                <CustomButton type="text" icon={<TwitterOutlined />} className="social-btn" />
              </div>
            </div>
          </div>
        )}

        {/* Panel Danh mục */}
        {activePanel === 'categories' && (
          <div className="drawer-body">
            <div className="panel-header">
              <button
                className="back-button"
                onClick={() => switchPanel('main')}
              >
                <LeftOutlined /> Quay lại
              </button>
              <h3>Danh mục sản phẩm</h3>
            </div>

            <ul className="drawer-menu categories-menu">
              {getSafeCategories().map(category => (
                <React.Fragment key={`category-${category._id || category.id}`}>
                  <li className="drawer-menu-item category-parent">
                    <div className="drawer-category-header">
                      <Link
                        to={`/products?category=${category._id || category.id}`}
                        className="drawer-menu-link"
                        onClick={(e) => {
                          if (!e.defaultPrevented) onClose();
                        }}
                      >
                        <RightOutlined className="drawer-menu-icon small" />
                        <span className="category-parent-name">{category.name}</span>
                      </Link>

                      {/* Nút toggle cho danh mục cha có chứa danh mục con */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <button
                          className="toggle-subcategory-btn"
                          onClick={(e) => toggleCategory(category._id || category.id, e)}
                        >
                          {expandedCategories[category._id || category.id] ?
                            <UpOutlined /> :
                            <DownOutlined />
                          }
                        </button>
                      )}
                    </div>
                  </li>

                  {/* Hiển thị danh mục con nếu có và đang được mở rộng */}
                  {category.subcategories &&
                    category.subcategories.length > 0 &&
                    expandedCategories[category._id || category.id] && (
                      <ul className="drawer-submenu-items">
                        {category.subcategories.map(subCategory => (
                          <li
                            key={`subcategory-${subCategory._id || subCategory.id}`}
                            className="drawer-submenu-item"
                          >
                            <Link
                              to={`/products?category=${subCategory._id || subCategory.id}`}
                              className="drawer-submenu-link"
                              onClick={onClose}
                            >
                              <RightOutlined className="drawer-menu-icon smaller" />
                              <span>{subCategory.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                </React.Fragment>
              ))}
            </ul>
          </div>
        )}

        {/* Panel Tài khoản - CHỈ GIỮ 2 CHỨC NĂNG */}
        {activePanel === 'account' && isAuthenticated && (
          <div className="drawer-body">
            <div className="panel-header">
              <button
                className="back-button"
                onClick={() => switchPanel('main')}
              >
                <LeftOutlined /> Quay lại
              </button>
              <h3>Quản lý tài khoản</h3>
            </div>

            <ul className="drawer-menu account-menu">
              <li className="drawer-menu-item">
                <Link
                  to="/profile"
                  className="drawer-menu-link"
                  onClick={onClose}
                >
                  <UserOutlined className="drawer-menu-icon" />
                  <span>Thông tin cá nhân</span>
                </Link>
              </li>

              <li className="drawer-menu-item">
                <Link
                  to="/profile/change-password"
                  className="drawer-menu-link"
                  onClick={onClose}
                >
                  <LockIcon className="drawer-menu-icon" />
                  <span>Đổi mật khẩu</span>
                </Link>
              </li>

              <Divider className="drawer-divider" />

              <li className="drawer-menu-item">
                <button
                  className="drawer-menu-link drawer-logout-button"
                  onClick={handleLogout}
                >
                  <LogoutOutlined className="drawer-menu-icon" />
                  <span>Đăng xuất</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Component Left Arrow Icon 
const LeftOutlined = () => (
  <svg viewBox="64 64 896 896" focusable="false" data-icon="left" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
  </svg>
);

// Thêm các icon còn thiếu
const HeartIcon = (props) => (
  <svg viewBox="64 64 896 896" fill="currentColor" width="12px" height="12px" {...props}>
    <path d="M923 283.6a260.04 260.04 0 00-56.9-82.8 264.4 264.4 0 00-84-55.5A265.34 265.34 0 00679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 00-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9zM512 814.8S156 586.7 156 385.5C156 283.6 240.3 201 344.3 201c73.1 0 136.5 40.8 167.7 100.4C543.2 241.8 606.6 201 679.7 201c104 0 188.3 82.6 188.3 184.5 0 201.2-356 429.3-356 429.3z" />
  </svg>
);


const LockIcon = (props) => (
  <svg viewBox="64 64 896 896" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z" />
  </svg>
);

export default MobileDrawer;