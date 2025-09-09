// src/services/client/promotionService.js
import { clientInstance } from '../../config/api';

// API-driven promotions (no hardcoded mock data)
const promotionService = {
  // Get active promotions for client homepage
  getActivePromotions: (params = {}) => clientInstance.get('/promotions/active', { params }),

  // Get promotion detail by id (ensure backend route exists for client if used)
  getPromotionById: (id) => clientInstance.get(`/promotions/${id}`),
};

export default promotionService;

