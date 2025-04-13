// src/services/client/index.js

import authService from './authService';
import cartService from './cartService';
import categoryService from './categoryService';
import orderService from './orderService';
import productService from './productService';
import promotionService from './promotionService';
import wishlistService from './wishlistService';
import paymentService from './paymentService';
import checkoutService from './checkoutService';

export {
  authService,
  cartService,
  categoryService,
  orderService,
  productService,
  promotionService,
  wishlistService,
  paymentService,
  checkoutService
};

export default {
  auth: authService,
  cart: cartService,
  category: categoryService,
  order: orderService,
  product: productService,
  promotion: promotionService,
  wishlist: wishlistService,
  payment: paymentService,
  checkout: checkoutService
};