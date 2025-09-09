// src/services/admin/bannerService.js
import { adminInstance } from '../../config/api';

export const getBanners = async (params) => {
  const res = await adminInstance.get('/banners', { params });
  return res.data;
};

export const getBannerById = async (id) => {
  const res = await adminInstance.get(`/banners/${id}`);
  return res.data;
};

export const createBanner = async (data) => {
  const res = await adminInstance.post('/banners', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const updateBanner = async (id, data) => {
  const res = await adminInstance.put(`/banners/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const deleteBanner = async (id) => {
  const res = await adminInstance.delete(`/banners/${id}`);
  return res.data;
};

export const reorderBanners = async (positions) => {
  const res = await adminInstance.post('/banners/reorder', { positions });
  return res.data;
};

export default {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
};

