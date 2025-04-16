// src/layouts/ClientLayout/ClientLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Topbar from './components/Topbar';
import MobileDrawer from './components/MobileDrawer';
import MobileSearch from './components/MobileSearch';
import ScrollToTopButton from './components/ScrollToTopButton';
import CustomConfigProvider from '../../theme/ClientConfigProvider';
import SocketAuthComponent from '../../components/common/SocketAuthComponents';

// Services and Hooks
import { categoryService } from '../../services/client';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

// Styles
import './styles/ClientLayout.scss';

const ClientLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  // Sử dụng auth hook để lấy thông tin xác thực
  const { isAuthenticated, user, logout } = useAuth();

  // Sử dụng notification hook để lấy số thông báo chưa đọc
  const { unreadCount } = useNotification();

  // Danh mục
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Thiết lập số thông báo từ hook notification
  const notificationCount = unreadCount || 0;

  // Fetch danh mục kèm danh mục con
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoryService.getCategoryWithSubcategories();

        if (response?.data?.data && Array.isArray(response.data.data)) {
          setAllCategories(response.data.data);
        } else {
          // Dữ liệu dự phòng
          setAllCategories([
            {
              _id: '1',
              name: 'Điện thoại',
              subcategories: [
                { _id: '11', name: 'Smartphone' },
                { _id: '12', name: 'Điện thoại cổ' }
              ]
            },
            {
              _id: '2',
              name: 'Máy tính',
              subcategories: [
                { _id: '21', name: 'Laptop' },
                { _id: '22', name: 'Máy tính để bàn' }
              ]
            },
            {
              _id: '3',
              name: 'Phụ kiện',
              subcategories: []
            },
            {
              _id: '4',
              name: 'Đồng hồ',
              subcategories: []
            }
          ]);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
        // Dữ liệu dự phòng khi fetch thất bại
        setAllCategories([
          {
            _id: '1',
            name: 'Điện thoại',
            subcategories: [
              { _id: '11', name: 'Smartphone' },
              { _id: '12', name: 'Điện thoại cổ' }
            ]
          },
          {
            _id: '2',
            name: 'Máy tính',
            subcategories: [
              { _id: '21', name: 'Laptop' },
              { _id: '22', name: 'Máy tính để bàn' }
            ]
          }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Toggle mobile search
  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Items cho dropdown menu
  const userMenuItems = [
    {
      key: '1',
      label: <Link to="/profile">Tài khoản của tôi</Link>,
    },
    {
      key: '2',
      label: <Link to="/orders">Đơn hàng của tôi</Link>,
    },
    {
      key: '3',
      label: <Link to="/notifications">Thông báo</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: '4',
      label: 'Đăng xuất',
      onClick: handleLogout
    },
  ];

  // Handle search
  const handleSearch = (value) => {
    const trimmedValue = value.trim();

    if (trimmedValue) {
      // Đóng drawer tìm kiếm nếu đang mở
      setSearchVisible(false);

      navigate({
        pathname: '/search',
        search: `?${new URLSearchParams({ search: trimmedValue }).toString()}`
      });
    }
  };

  return (
    <CustomConfigProvider>
      <div className="layout">
        {/* Thêm SocketAuthComponent để xác thực socket */}
        <SocketAuthComponent />

        {/* Topbar */}
        <Topbar notificationCount={notificationCount} />

        {/* Header - updated with notification support */}
        <Header
          isAuthenticated={isAuthenticated}
          user={user}
          notificationCount={notificationCount}
          userMenuItems={userMenuItems}
          toggleDrawer={toggleDrawer}
          toggleSearch={toggleSearch}
          categories={allCategories}
          loadingCategories={loadingCategories}
          onSearch={handleSearch}
        />

        {/* Mobile Search Bar */}
        <MobileSearch
          onSearch={handleSearch}
          visible={searchVisible}
          onClose={() => setSearchVisible(false)}
        />

        {/* Mobile Menu Drawer - updated with notification support */}
        <MobileDrawer
          open={drawerOpen}
          onClose={toggleDrawer}
          categories={allCategories}
          isAuthenticated={isAuthenticated}
          notificationCount={notificationCount}
          onLogout={handleLogout}
          user={user}
        />

        {/* Main Content */}
        <div className="main-content">
          <Outlet />
        </div>

        {/* Footer */}
        <Footer />

        {/* Scroll to top button */}
        <ScrollToTopButton />
      </div>
    </CustomConfigProvider>
  );
};

export default ClientLayout;