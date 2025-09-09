// src/services/client/bannerService.js
import { clientInstance } from '../../config/api';

export const getActiveBanners = async (params = {}) => {
  const res = await clientInstance.get('/banners/active', { params });
  return res.data;
};

export default { getActiveBanners };

