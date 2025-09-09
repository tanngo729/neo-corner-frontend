// src/services/admin/dashboardService.js
import { adminInstance } from '../../config/api';


// Lấy thống kê tổng quan
const getStats = async (dateRange = null) => {
  try {
    let url = '/dashboard/stats';

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await adminInstance.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy dữ liệu biểu đồ doanh thu
const getSalesChart = async (dateRange = null) => {
  try {
    let url = '/dashboard/sales-chart';

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await adminInstance.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách đơn hàng gần đây
const getRecentOrders = async (limit = 5) => {
  try {
    const response = await adminInstance.get(`/dashboard/recent-orders?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách sản phẩm bán chạy
const getTopProducts = async (limit = 5, dateRange = null) => {
  try {
    let url = `/dashboard/top-products?limit=${limit}`;

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await adminInstance.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách khách hàng tiềm năng
const getTopCustomers = async (limit = 5, dateRange = null) => {
  try {
    let url = `/dashboard/top-customers?limit=${limit}`;

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await adminInstance.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy dữ liệu phân bố trạng thái đơn hàng
const getOrderStatusDistribution = async (dateRange = null) => {
  try {
    let url = '/dashboard/order-status-distribution';

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await adminInstance.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy tất cả dữ liệu dashboard một lần
const getDashboardData = async (dateRange = null) => {
  try {
    let url = '/dashboard';

    // Thêm tham số ngày nếu có
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await adminInstance.get(url);
    return response.data;
  } catch (error) {
    throw error;
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