import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import { setupInterceptors } from './utils/apiHelper';
import { clientInstance } from './config/api';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext'; // Thêm import CartProvider
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { useTheme } from './hooks/useTheme';
import ClientConfigProvider from './theme/ClientConfigProvider';
import AdminConfigProvider from './theme/AdminConfigProvider';
import './App.css';
import './styles/theme.css';

const AppRoutes = lazy(() => import('./routes'));

const LoadingFallback = () => (
  <div className="app-loading">
    <div className="loading-spinner"></div>
  </div>
);

const AppContent = () => {
  const { isDarkMode } = useTheme();
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Khởi tạo preferences từ localStorage khi component mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        const { fontSize, darkMode, compactMenu } = JSON.parse(savedPreferences);

        // Áp dụng dark mode
        if (darkMode) {
          document.documentElement.classList.add('dark-theme');
        } else {
          document.documentElement.classList.remove('dark-theme');
        }

        // Áp dụng font size
        if (fontSize) {
          // Xóa tất cả các class cỡ chữ hiện tại
          document.documentElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');

          // Thêm class mới
          document.documentElement.classList.add(`font-size-${fontSize}`);

          // Áp dụng font size từ constants
          const FONT_SIZES = {
            SMALL: {
              BASE: '13px',
              SM: '12px',
              LG: '14px',
              XL: '16px',
              XXL: '18px'
            },
            MEDIUM: {
              BASE: '14px',
              SM: '13px',
              LG: '16px',
              XL: '18px',
              XXL: '20px'
            },
            LARGE: {
              BASE: '16px',
              SM: '14px',
              LG: '18px',
              XL: '20px',
              XXL: '24px'
            }
          };

          const sizeKey = fontSize.toUpperCase();
          if (FONT_SIZES[sizeKey]) {
            document.documentElement.style.setProperty('--font-size-base', FONT_SIZES[sizeKey].BASE);
            document.documentElement.style.setProperty('--font-size-sm', FONT_SIZES[sizeKey].SM);
            document.documentElement.style.setProperty('--font-size-lg', FONT_SIZES[sizeKey].LG);
            document.documentElement.style.setProperty('--font-size-xl', FONT_SIZES[sizeKey].XL);
            document.documentElement.style.setProperty('--font-size-xxl', FONT_SIZES[sizeKey].XXL);

            // Áp dụng cỡ chữ cho body
            document.body.style.fontSize = FONT_SIZES[sizeKey].BASE;
          }
        }

        // Áp dụng compact menu
        if (compactMenu) {
          setTimeout(() => {
            const appLayout = document.querySelector('.app-layout');
            if (appLayout) {
              appLayout.classList.add('compact-menu');
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error initializing preferences:', error);
    }
  }, []);

  if (isAdminRoute) {
    return (
      <AdminConfigProvider isDarkMode={isDarkMode} locale={viVN}>
        <AdminAuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </AdminAuthProvider>
      </AdminConfigProvider>
    );
  }

  return (
    <ClientConfigProvider locale={viVN}>
      <AuthProvider>
        <CartProvider> {/* Thêm CartProvider bao bọc các route client */}
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </ClientConfigProvider>
  );
};

const App = () => {
  useEffect(() => {
    // Thiết lập token trước khi thiết lập interceptors
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');

    if (token) {
      clientInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log("Thiết lập token từ localStorage cho clientInstance");
    }

    if (adminToken) {
      clientInstance.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      console.log("Thiết lập adminToken từ localStorage");
    }

    // Sau đó thiết lập interceptors
    setupInterceptors();
  }, []);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;