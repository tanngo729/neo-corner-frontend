// App.js
import React, { lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import { ThemeProvider } from './contexts/ThemeContext';
import { setupInterceptors } from './utils/apiHelper';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './App.css';
import './styles/theme.css';

const AppRoutes = lazy(() => import('./routes'));

const LoadingFallback = () => (
  <div className="app-loading">
    <div className="loading-spinner"></div>
  </div>
);

// Tách nội dung admin và client riêng biệt
const AdminContent = () => (
  <AdminAuthProvider>
    <NotificationProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AppRoutes />
      </Suspense>
    </NotificationProvider>
  </AdminAuthProvider>
);

const ClientContent = () => (
  <AuthProvider>
    <CartProvider>
      <NotificationProvider>
        <Suspense fallback={<LoadingFallback />}>
          <AppRoutes />
        </Suspense>
      </NotificationProvider>
    </CartProvider>
  </AuthProvider>
);

// Component nội dung
const AppContent = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Thiết lập interceptors một lần khi component mount
  React.useEffect(() => {
    setupInterceptors();
  }, []);

  return isAdminRoute ? <AdminContent /> : <ClientContent />;
};

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ConfigProvider locale={viVN}>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </ConfigProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;