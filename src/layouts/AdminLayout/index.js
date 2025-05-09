// src/layouts/AdminLayout/index.js
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import {
  MenuUnfoldOutlined, MenuFoldOutlined, DashboardOutlined,
  ShoppingOutlined, AppstoreOutlined, UserOutlined,
  TagsOutlined, SettingOutlined, LogoutOutlined,
  KeyOutlined, CustomerServiceOutlined
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import AdminConfigProvider from '../../theme/AdminConfigProvider';
import { AdminNotificationDropdown } from '../../components/common/notification/NotificationDropdown';
import { useSocket } from '../../contexts/SocketContext';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(true);
  const { theme: themeMode, toggleTheme } = useTheme();
  const isDarkMode = themeMode === 'dark';

  // Lấy thông tin socket từ context
  const { socket, connected, authenticateSocket } = useSocket();

  // Cải thiện xác thực socket: Gửi xác thực khi đã có kết nối và có thông tin người dùng
  useEffect(() => {
    if (connected && user && user._id) {
      console.log('Đang xác thực admin socket:', user._id);
      authenticateSocket(user._id, true);

      // Gửi sự kiện kiểm tra trạng thái kết nối của socket
      socket.emit('check-connection', {
        page: 'admin-dashboard',
        adminId: user._id,
        timestamp: new Date().toISOString()
      });
    }
  }, [connected, user, authenticateSocket, socket]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);

      // Tự động thu gọn menu khi trên mobile
      if (mobile && !collapsed) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Khởi tạo khi mount

    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // Load preferences từ localStorage
  useEffect(() => {
    try {
      const preferencesString = localStorage.getItem('userPreferences');
      if (preferencesString) {
        const preferences = JSON.parse(preferencesString);

        // Chỉ áp dụng compact menu khi không ở chế độ mobile
        if (!isMobile && preferences.compactMenu !== undefined) {
          setCollapsed(preferences.compactMenu);
        }
      }
    } catch (error) {
      console.error('Error reading preferences:', error);
    }
  }, [isMobile]);

  // Theo dõi sự thay đổi của preference
  const prevCompactMenu = React.useRef(collapsed);

  useEffect(() => {
    const handlePreferenceChange = (event) => {
      const { compactMenu } = event.detail;
      if (!isMobile && compactMenu !== undefined && compactMenu !== prevCompactMenu.current) {
        prevCompactMenu.current = compactMenu;
        setCollapsed(compactMenu);
      }
    };

    window.addEventListener('preferenceChange', handlePreferenceChange);
    return () => window.removeEventListener('preferenceChange', handlePreferenceChange);
  }, [isMobile, collapsed]);

  // Toggle collapsed của sidebar
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);

    // Cập nhật lại localStorage nếu không ở mobile
    if (!isMobile) {
      try {
        const preferencesString = localStorage.getItem('userPreferences');
        const preferences = preferencesString
          ? JSON.parse(preferencesString)
          : {};

        preferences.compactMenu = newCollapsed;
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Error saving menu state:', error);
      }
    }
  };

  // Các menu item với kiểm tra quyền truy cập
  const getMenuItems = () => {
    const isAdmin = user?.role?.name === 'Admin' || user?.role?.name === 'Super Admin';
    const items = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/admin">Dashboard</Link>,
      },
      {
        key: 'products',
        icon: <ShoppingOutlined />,
        label: <Link to="/admin/products">Sản phẩm</Link>,
        permission: 'products.view'
      },
      {
        key: 'categories',
        icon: <AppstoreOutlined />,
        label: <Link to="/admin/categories">Danh mục</Link>,
        permission: 'categories.view'
      },
      {
        key: 'orders',
        icon: <TagsOutlined />,
        label: <Link to="/admin/orders">Đơn hàng</Link>,
        permission: 'orders.view'
      },
      // Menu quản lý tài khoản với submenu
      {
        key: 'accounts',
        icon: <UserOutlined />,
        label: 'Quản lý tài khoản',
        permission: 'customers.view', // Hiển thị nếu người dùng có quyền này
        children: [
          {
            key: 'customers',
            icon: <CustomerServiceOutlined />,
            label: <Link to="/admin/customers">Khách hàng</Link>,
            permission: 'customers.view'
          },
          {
            key: 'users',
            icon: <UserOutlined />,
            label: <Link to="/admin/users">Quản trị viên</Link>,
            permission: 'users.view'
          }
        ]
      },
      {
        key: 'roles',
        icon: <KeyOutlined />,
        label: <Link to="/admin/roles">Vai trò & Phân quyền</Link>,
        permission: 'roles.view'
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: <Link to="/admin/settings">Cài đặt</Link>,
        permission: 'settings.view'
      },
    ];

    // Lọc các menu item theo quyền của người dùng
    return items.filter(item => {
      if (!item.permission || isAdmin) {
        return true;
      }
      return user?.role?.permissions?.includes(item.permission);
    });
  };

  // Xác định menu item đang được chọn dựa trên URL
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/admin') return ['dashboard'];

    // Trường hợp profile không chọn sidebar item nào
    if (path.includes('/admin/profile')) return [];

    const match = path.match(/\/admin\/([^\/]*)/);
    return match && match[1] ? [match[1]] : ['dashboard'];
  };

  // Dropdown menu cho người dùng
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/admin/profile')}>
        Trang cá nhân
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <AdminConfigProvider isDarkMode={isDarkMode}>
      <Layout className={`admin-layout ${isDarkMode ? 'dark-theme' : ''} theme-transition`}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className={`admin-sider ${collapsed ? 'collapsed' : ''}`}
          theme={isDarkMode ? 'dark' : 'light'}
          width={250}
          collapsedWidth={80}
        >
          <div className="logo">
            <h1>{collapsed ? 'N' : 'NEO'}</h1>
          </div>
          <Menu
            theme={isDarkMode ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={getSelectedKey()}
            items={getMenuItems()}
            onClick={({ key }) => {
              // Điều hướng trực tiếp thay vì dùng function handleMenuClick
              if (key === 'dashboard') {
                navigate('/admin');
              } else {
                navigate(`/admin/${key}`);
              }
            }}
          />
        </Sider>
        <Layout className={`site-layout ${collapsed ? 'collapsed' : ''}`}>
          <Header className="admin-header">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              className="trigger-button"
              aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            />
            <div className="admin-header-right">
              <Space>
                {/* Sử dụng AdminNotificationDropdown */}
                <AdminNotificationDropdown />
                <Dropdown overlay={userMenu} trigger={['click']}>
                  <div className="user-dropdown" aria-label="User menu">
                    <Avatar icon={<UserOutlined />} src={user?.avatar?.url} />
                    {!isMobile && <span className="user-name">{user?.fullName || 'Admin'}</span>}
                  </div>
                </Dropdown>
              </Space>
            </div>
          </Header>
          <Content className="admin-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </AdminConfigProvider>
  );
};

export default AdminLayout;