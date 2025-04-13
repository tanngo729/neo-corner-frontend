// src/services/client/checkoutService.js
import { clientInstance } from '../../config/api';

const checkoutService = {
  getShippingMethods: () => {
    return clientInstance.get('/checkout/shipping-methods');
  },

  getPaymentMethods: () => {
    return clientInstance.get('/checkout/payment-methods');
  },


  calculateShippingFee: (data) => {
    return clientInstance.post('/checkout/calculate-shipping', data);
  },

  getCheckoutInfo: () => {
    return clientInstance.get('/checkout/info');
  },

  createOrder: (orderData) => {
    return clientInstance.post('/checkout/process', orderData);
  }
};

export default checkoutService;