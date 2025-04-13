// src/services/client/productService.js
import { clientInstance } from '../../config/api';

const productService = {
  // Lấy danh sách sản phẩm với các tùy chọn lọc và phân trang
  getProducts: (params = {}) => {
    const queryParams = { ...params };

    // Xử lý an toàn cho từ khóa tìm kiếm
    if (queryParams.search !== undefined) {
      // Trim và loại bỏ khoảng trắng thừa
      const trimmedSearch = queryParams.search.trim();

      // Chỉ giữ lại từ khóa nếu nó không rỗng
      if (trimmedSearch) {
        queryParams.search = trimmedSearch;
      } else {
        delete queryParams.search;
      }
    }

    // Xử lý minPrice
    if (queryParams.minPrice !== undefined && queryParams.minPrice !== '') {
      const minPrice = parseInt(queryParams.minPrice, 10);
      if (!isNaN(minPrice)) {
        queryParams.minPrice = minPrice;
      } else {
        delete queryParams.minPrice;
      }
    }

    // Xử lý maxPrice
    if (queryParams.maxPrice !== undefined && queryParams.maxPrice !== '') {
      const maxPrice = parseInt(queryParams.maxPrice, 10);
      if (!isNaN(maxPrice)) {
        queryParams.maxPrice = maxPrice;
      } else {
        delete queryParams.maxPrice;
      }
    }

    // Đảm bảo page là số nguyên hợp lệ
    if (queryParams.page !== undefined) {
      const page = parseInt(queryParams.page, 10);
      if (!isNaN(page) && page > 0) {
        queryParams.page = page;
      } else {
        queryParams.page = 1;
      }
    }

    // Đảm bảo limit là số nguyên hợp lệ
    if (queryParams.limit !== undefined) {
      const limit = parseInt(queryParams.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        queryParams.limit = limit;
      } else {
        queryParams.limit = 12;
      }
    }

    // Đảm bảo category không rỗng
    if (queryParams.category !== undefined &&
      (queryParams.category === '' ||
        queryParams.category === 'undefined' ||
        queryParams.category === 'null')) {
      delete queryParams.category;
    }

    // Đảm bảo sort và order hợp lệ
    const validSortFields = ['createdAt', 'price', 'sold', 'views', 'name'];
    const validOrderFields = ['asc', 'desc'];

    if (queryParams.sort && !validSortFields.includes(queryParams.sort)) {
      queryParams.sort = 'createdAt';
    }

    if (queryParams.order && !validOrderFields.includes(queryParams.order)) {
      queryParams.order = 'desc';
    }

    // Tạo một promise để xử lý request
    return new Promise((resolve, reject) => {
      console.log('Searching with params:', queryParams);

      clientInstance.get('/products', { params: queryParams })
        .then(response => {
          console.log('Search response:', response);
          resolve(response);
        })
        .catch(error => {
          console.error('Lỗi khi lấy sản phẩm:', error);
          reject(error);
        });
    });
  },

  // Các method khác giữ nguyên
  getProductsByCategory: (categoryId, otherParams = {}) => {
    if (!categoryId) {
      return productService.getProducts(otherParams);
    }

    const queryParams = {
      ...otherParams,
      category: categoryId,
      includeSubcategories: 'true'
    };

    return new Promise((resolve, reject) => {
      clientInstance.get('/products', { params: queryParams })
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          console.error(`Lỗi khi lấy sản phẩm theo danh mục ${categoryId}:`, error);
          reject(error);
        });
    });
  },

  getProductBySlug: (slug) => {
    return clientInstance.get(`/products/${slug}`);
  },

  getFeaturedProducts: (limit = 6) => {
    return clientInstance.get('/products/featured', { params: { limit } });
  },

  getRelatedProducts: (productId, categoryId, limit = 4) => {
    return clientInstance.get('/products/related', {
      params: { productId, categoryId, limit }
    });
  },

  searchSuggestions: (q, limit = 5) => {
    return clientInstance.get('/products/search-suggestions', {
      params: { q, limit }
    });
  }
};

export default productService;