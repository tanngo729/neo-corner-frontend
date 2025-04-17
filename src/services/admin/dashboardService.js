// src/services/admin/dashboardService.js
import axios from 'axios';
import { handleApiError } from '../../utils/apiUtils';

const API_URL = process.env.REACT_APP_API_URL || '';

// Lấy thống kê tổng quan
const getStats = async (dateRange = null) => {
  try {
    let url = `${API_URL}/admin/dashboard/stats`;

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Lấy dữ liệu biểu đồ doanh thu
const getSalesChart = async (dateRange = null) => {
  try {
    let url = `${API_URL}/admin/dashboard/sales-chart`;

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Lấy danh sách đơn hàng gần đây
const getRecentOrders = async (limit = 5) => {
  try {
    const response = await axios.get(`${API_URL}/admin/dashboard/recent-orders?limit=${limit}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Lấy danh sách sản phẩm bán chạy
const getTopProducts = async (limit = 5, dateRange = null) => {
  try {
    let url = `${API_URL}/admin/dashboard/top-products?limit=${limit}`;

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Lấy danh sách khách hàng tiềm năng
const getTopCustomers = async (limit = 5, dateRange = null) => {
  try {
    let url = `${API_URL}/admin/dashboard/top-customers?limit=${limit}`;

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Lấy dữ liệu phân bố trạng thái đơn hàng
const getOrderStatusDistribution = async (dateRange = null) => {
  try {
    let url = `${API_URL}/admin/dashboard/order-status-distribution`;

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Lấy tất cả dữ liệu dashboard một lần
const getDashboardData = async (dateRange = null) => {
  try {
    let url = `${API_URL}/admin/dashboard`;

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

const dashboardService = {
  getStats,
  getSalesChart,
  getRecentOrders,
  getTopProducts,
  getTopCustomers,
  getOrderStatusDistribution,
  getDashboardData
};

export default dashboardService;