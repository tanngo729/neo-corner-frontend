// src/contexts/CartContext.js - Sửa lại để đồng bộ tốt hơn với server
import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { message } from 'antd';
import { cartService } from '../services/client';
import { useAuth } from './AuthContext';
import { clearApiCache, invalidateCache } from '../utils/apiHelper'; // Thêm import này

// Tạo context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [badgeUpdated, setBadgeUpdated] = useState(false);

  const cartItemCountRef = useRef(cartItemCount);


  useEffect(() => {
    cartItemCountRef.current = cartItemCount;
  }, [cartItemCount]);


  const updateCartAndBadgeCount = useCallback((cartData) => {
    setCart(cartData);


    const newCount = cartData?.totalItems ||
      (cartData?.items ? cartData.items.reduce((sum, item) => sum + item.quantity, 0) : 0);

    // Luôn cập nhật cartItemCount
    setCartItemCount(newCount);


    if (newCount !== cartItemCountRef.current) {

      setBadgeUpdated(false);

      setTimeout(() => {
        setBadgeUpdated(true);

        setTimeout(() => setBadgeUpdated(false), 1000);
      }, 50);
    }
  }, []);

  // Fetch giỏ hàng
  const fetchCart = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) {
      setCart(null);
      setCartItemCount(0);
      return null;
    }

    try {
      if (showLoading) setLoading(true);


      const response = await cartService.getCart({
        cache: false,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response && response.data && response.data.success) {
        const cartData = response.data.data;
        updateCartAndBadgeCount(cartData);
        return cartData;
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng:', error);
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated, updateCartAndBadgeCount]);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      message.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return { success: false };
    }

    try {
      setLoading(true);
      // Vô hiệu hóa cache trước khi gọi API
      invalidateCache('/cart');

      const response = await cartService.addToCart(productId, quantity);

      if (response && response.data && response.data.success) {
        // Cập nhật giỏ hàng và badge trực tiếp từ response
        updateCartAndBadgeCount(response.data.data);

        // Vô hiệu hóa cache sau khi thêm thành công
        invalidateCache('/cart');

        return { success: true, data: response.data.data };
      } else {
        message.error(response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      const errorMsg = error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, updateCartAndBadgeCount]);

  // Cập nhật số lượng sản phẩm
  const updateCartItem = useCallback(async (itemId, quantity) => {
    try {
      setLoading(true);
      // Vô hiệu hóa cache trước khi gọi API
      invalidateCache('/cart');

      const response = await cartService.updateCartItem(itemId, quantity);

      if (response && response.data && response.data.success) {
        // Cập nhật giỏ hàng và badge trực tiếp từ response
        updateCartAndBadgeCount(response.data.data);

        // Vô hiệu hóa cache sau khi cập nhật thành công
        invalidateCache('/cart');

        return { success: true, data: response.data.data };
      } else {
        message.error(response?.data?.message || 'Không thể cập nhật số lượng');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng:', error);
      const errorMsg = error.response?.data?.message || 'Không thể cập nhật số lượng';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [updateCartAndBadgeCount]);

  // Xóa sản phẩm khỏi giỏ hàng
  const removeCartItem = useCallback(async (itemId) => {
    try {
      setLoading(true);
      // Vô hiệu hóa cache trước khi gọi API
      invalidateCache('/cart');

      const response = await cartService.removeCartItem(itemId);

      if (response && response.data && response.data.success) {
        // Cập nhật giỏ hàng và badge trực tiếp từ response
        updateCartAndBadgeCount(response.data.data);

        // Vô hiệu hóa cache sau khi xóa thành công
        invalidateCache('/cart');

        return { success: true, data: response.data.data };
      } else {
        message.error(response?.data?.message || 'Không thể xóa sản phẩm');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      message.error('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [updateCartAndBadgeCount]);

  // Xóa toàn bộ giỏ hàng
  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      // Vô hiệu hóa cache trước khi gọi API
      invalidateCache('/cart');

      const response = await cartService.clearCart();

      if (response && response.data && response.data.success) {
        // Cập nhật giỏ hàng và badge trực tiếp từ response
        updateCartAndBadgeCount(response.data.data);

        // Vô hiệu hóa cache sau khi xóa thành công
        invalidateCache('/cart');

        return { success: true, data: response.data.data };
      } else {
        message.error(response?.data?.message || 'Không thể xóa giỏ hàng');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi xóa giỏ hàng:', error);
      message.error('Không thể xóa giỏ hàng. Vui lòng thử lại sau.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [updateCartAndBadgeCount]);

  // Áp dụng mã giảm giá
  const applyCoupon = useCallback(async (couponCode) => {
    try {
      setLoading(true);
      // Vô hiệu hóa cache trước khi gọi API
      invalidateCache('/cart');

      const response = await cartService.applyCoupon(couponCode);

      if (response && response.data && response.data.success) {
        // Cập nhật giỏ hàng và badge trực tiếp từ response
        updateCartAndBadgeCount(response.data.data);

        // Vô hiệu hóa cache sau khi áp dụng thành công
        invalidateCache('/cart');

        return { success: true, data: response.data.data };
      } else {
        message.error(response?.data?.message || 'Mã giảm giá không hợp lệ');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi áp dụng mã giảm giá:', error);
      const errorMsg = error.response?.data?.message || 'Mã giảm giá không hợp lệ';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [updateCartAndBadgeCount]);

  // Hủy mã giảm giá
  const removeCoupon = useCallback(async () => {
    try {
      setLoading(true);
      // Vô hiệu hóa cache trước khi gọi API
      invalidateCache('/cart');

      const response = await cartService.removeCoupon();

      if (response && response.data && response.data.success) {
        // Cập nhật giỏ hàng và badge trực tiếp từ response
        updateCartAndBadgeCount(response.data.data);

        // Vô hiệu hóa cache sau khi hủy thành công
        invalidateCache('/cart');

        return { success: true, data: response.data.data };
      } else {
        message.error(response?.data?.message || 'Không thể hủy mã giảm giá');
        return { success: false };
      }
    } catch (error) {
      console.error('Lỗi khi hủy mã giảm giá:', error);
      message.error('Không thể hủy mã giảm giá. Vui lòng thử lại sau.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [updateCartAndBadgeCount]);

  // Lấy giỏ hàng khi người dùng đăng nhập hoặc trạng thái auth thay đổi
  useEffect(() => {
    if (isAuthenticated) {
      // Vô hiệu hóa cache trước khi fetch
      invalidateCache('/cart');
      fetchCart();
    } else {
      setCart(null);
      setCartItemCount(0);
    }
  }, [isAuthenticated, fetchCart]);

  // Value cho context
  const value = {
    cart,
    loading,
    cartItemCount,
    badgeUpdated, // Thêm trạng thái này để components có thể biết khi badge được cập nhật
    fetchCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    applyCoupon,
    removeCoupon
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook để sử dụng context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;