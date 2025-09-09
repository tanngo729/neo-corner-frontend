// src/routes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Thêm Providers cho namespacing CSS
import ClientConfigProvider from './theme/ClientConfigProvider';
import AdminConfigProvider from './theme/AdminConfigProvider';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';

// Route protectors
import AdminRoute from './components/common/AdminRoute';
import AdminProtectRoute from './components/common/AdminProtectRoute';
import ClientProtectedRoute from './components/common/ClientProtectRoute';
import PermissionCheck from './components/common/PermissionCheck';

// Admin pages
import LoginPage from './pages/admin/auth/AdminLoginPage';
import DashboardPage from './pages/admin/dashboard/DashboardPage'; // Add Dashboard import
import ProductListPage from './pages/admin/products/ProductListPage';
import ProductFormPage from './pages/admin/products/ProductFormPage';
import ProductDetailPage from './pages/admin/products/ProductDetailPage';
import CategoryListPage from './pages/admin/categories/CategoryListPage';
import CategoryFormPage from './pages/admin/categories/CategoryFormPage';
import RoleListPage from './pages/admin/roles/RoleListPage';
import RoleFormPage from './pages/admin/roles/RoleFormPage';
import UserListPage from './pages/admin/users/UserListPage';
import UserFormPage from './pages/admin/users/UserFormPage';
import CustomerListPage from './pages/admin/customers/CustomerListPage';
import CustomerFormPage from './pages/admin/customers/CustomerFormPage';
import ProfilePage from './pages/admin/profile/ProfilePage';
import SystemSettingsPage from './pages/admin/settings/SystemSettingsPage';
import OrderListPage from './pages/admin/orders/OrderListPage';
import OrderDetailPage from './pages/admin/orders/OrderDetailPage';
import BannerListPage from './pages/admin/banners/BannerListPage';
import BannerFormPage from './pages/admin/banners/BannerFormPage';

// Client pages
import HomePage from './pages/client/Home/HomePage';
import ProductsPage from './pages/client/Products/ProductsPage';
import SearchPage from './pages/client/search/SearchPage';
import ProductDetailClientPage from './pages/client/ProductDetail/ProductDetailPage';
import CartPage from './pages/client/CartPage/CartPage';
import CheckoutPage from './pages/client/Checkout/CheckoutPage';
import PaymentResultPage from './pages/client/PaymentResult/PaymentResultPage';
import ClientLoginPage from './pages/client/Auth/LoginPage/LoginPage';
import RegisterPage from './pages/client/Auth/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/client/Auth/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/client/Auth/ResetPasswordPage/ResetPasswordPage';
import VerifySuccessPage from './pages/client/Auth/VerifySuccessPage/VerifySuccessPage';
import VerifyEmailRequiredPage from './pages/client/Auth/VerifyEmailRequiredPage/VerifyEmailRequiredPage';
import VerifyEmailPage from './pages/client/Auth/VerifyEmailPage/VerifyEmailPage';
import ClientOrdersPage from './pages/client/orders/OrdersPage';
import ClientOrderDetailPage from './pages/client/orders/OrderDetailPage';
import NotFoundPage from './pages/client/404/NotFoundPage';
import NotificationsPage from './pages/client/NotificationsPage/NotificationsPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ADMIN ROUTES */}
      {/* Public admin routes - với AdminConfigProvider */}
      <Route path="/admin/login" element={
        <AdminConfigProvider>
          <LoginPage />
        </AdminConfigProvider>
      } />

      {/* Protected admin routes - AdminLayout đã có AdminConfigProvider */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }>
        {/* Changed index route to Dashboard */}
        <Route index element={<DashboardPage />} />

        {/* Routes sản phẩm */}
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/create" element={
          <PermissionCheck permission="products.create">
            <ProductFormPage />
          </PermissionCheck>
        } />
        <Route path="products/edit/:id" element={
          <PermissionCheck permission="products.edit">
            <ProductFormPage />
          </PermissionCheck>
        } />
        <Route path="products/:id" element={<ProductDetailPage />} />

        {/* Routes danh mục */}
        <Route path="categories" element={<CategoryListPage />} />
        <Route path="categories/create" element={
          <PermissionCheck permission="categories.create">
            <CategoryFormPage />
          </PermissionCheck>
        } />
        <Route path="categories/edit/:id" element={
          <PermissionCheck permission="categories.edit">
            <CategoryFormPage />
          </PermissionCheck>
        } />

        {/* Routes đơn hàng - Thêm mới */}
        <Route path="orders" element={
          <PermissionCheck permission="orders.view">
            <OrderListPage />
          </PermissionCheck>
        } />
        <Route path="orders/:id" element={
          <PermissionCheck permission="orders.view">
            <OrderDetailPage />
          </PermissionCheck>
        } />

        {/* Routes vai trò */}
        <Route path="roles" element={
          <PermissionCheck permission="roles.view">
            <RoleListPage />
          </PermissionCheck>
        } />
        <Route path="roles/create" element={
          <PermissionCheck permission="roles.create">
            <RoleFormPage />
          </PermissionCheck>
        } />
        <Route path="roles/edit/:id" element={
          <PermissionCheck permission="roles.edit">
            <RoleFormPage />
          </PermissionCheck>
        } />

        {/* Routes người dùng (admin) */}
        <Route path="users" element={
          <PermissionCheck permission="users.view">
            <UserListPage />
          </PermissionCheck>
        } />
        <Route path="users/create" element={
          <PermissionCheck permission="users.create">
            <UserFormPage />
          </PermissionCheck>
        } />
        <Route path="users/edit/:id" element={
          <PermissionCheck permission="users.edit">
            <UserFormPage />
          </PermissionCheck>
        } />

        {/* Routes khách hàng */}
        <Route path="customers" element={
          <PermissionCheck permission="customers.view">
            <CustomerListPage />
          </PermissionCheck>
        } />
        <Route path="customers/create" element={
          <PermissionCheck permission="customers.create">
            <CustomerFormPage />
          </PermissionCheck>
        } />
        <Route path="customers/edit/:id" element={
          <PermissionCheck permission="customers.edit">
            <CustomerFormPage />
          </PermissionCheck>
        } />

        {/* Routes banner */}
        <Route path="banners" element={
          <PermissionCheck permission="settings.view">
            <BannerListPage />
          </PermissionCheck>
        } />
        <Route path="banners/create" element={
          <PermissionCheck permission="settings.edit">
            <BannerFormPage />
          </PermissionCheck>
        } />
        <Route path="banners/edit/:id" element={
          <PermissionCheck permission="settings.edit">
            <BannerFormPage />
          </PermissionCheck>
        } />

        {/* Cài đặt hệ thống */}
        <Route path="settings" element={
          <PermissionCheck permission="settings.view">
            <SystemSettingsPage />
          </PermissionCheck>
        } />

        {/* Trang cá nhân */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* CLIENT ROUTES - Bọc trong ClientConfigProvider */}
      <Route path="/" element={
        <ClientConfigProvider>
          <ClientLayout />
        </ClientConfigProvider>
      }>
        {/* Public client routes */}
        <Route index element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailClientPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<ClientLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-success" element={<VerifySuccessPage />} />
        <Route path="/verify-email-required" element={<VerifyEmailRequiredPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

        {/* Route cho thanh toán */}
        <Route path="/payment/result/:orderCode" element={<PaymentResultPage />} />
        <Route path="/payment/result" element={<PaymentResultPage />} />

        {/* Route chuyển hướng từ cổng thanh toán */}
        <Route path="/payment/vnpay-return" element={<Navigate to="/payment/result" replace={true} />} />
        <Route path="/payment/momo-return" element={<Navigate to="/payment/result" replace={true} />} />

        {/* Protected client routes */}
        <Route path="/cart" element={
          <ClientProtectedRoute>
            <CartPage />
          </ClientProtectedRoute>
        } />

        {/* Routes yêu cầu xác thực email */}
        <Route path="/checkout" element={
          <ClientProtectedRoute requireVerified={true}>
            <CheckoutPage />
          </ClientProtectedRoute>
        } />

        {/* Routes quản lý đơn hàng client - Thêm mới */}
        <Route path="/orders" element={
          <ClientProtectedRoute>
            <ClientOrdersPage />
          </ClientProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ClientProtectedRoute>
            <ClientOrderDetailPage />
          </ClientProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ClientProtectedRoute>
            <NotificationsPage />
          </ClientProtectedRoute>
        } />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
