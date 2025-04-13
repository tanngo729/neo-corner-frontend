// src/services/admin/productService.js
import { adminInstance } from '../../config/api';

// Lấy danh sách sản phẩm với phân trang, lọc, sắp xếp (getProducts trong backend)
export const getProducts = async (params) => {
  try {
    const response = await adminInstance.get('/products', { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    throw error;
  }
};

// Lấy chi tiết sản phẩm theo ID (getProductById trong backend)
export const getProductById = async (id) => {
  try {
    const response = await adminInstance.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    throw error;
  }
};

// Tạo sản phẩm mới (createProduct trong backend)
export const createProduct = async (productData) => {
  try {
    const response = await adminInstance.post('/products', productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    throw error;
  }
};

// Cập nhật sản phẩm (updateProduct trong backend)
export const updateProduct = async (id, productData) => {
  try {
    const response = await adminInstance.put(`/products/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    throw error;
  }
};

// Xóa sản phẩm (deleteProduct trong backend)
export const deleteProduct = async (id) => {
  try {
    const response = await adminInstance.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    throw error;
  }
};

// Xóa nhiều sản phẩm (batchDeleteProducts trong backend)
export const batchDeleteProducts = async (ids) => {
  try {
    const response = await adminInstance.delete('/products', {
      data: { ids }
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa nhiều sản phẩm:', error);
    throw error;
  }
};

// Cập nhật trạng thái sản phẩm (updateProductStatus trong backend)
export const updateProductStatus = async (id, status) => {
  try {
    const response = await adminInstance.put(`/products/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái sản phẩm:', error);
    throw error;
  }
};

// Cập nhật vị trí sản phẩm (updateProductPosition trong backend)
export const updateProductPosition = async (id, position) => {
  try {
    const response = await adminInstance.put(`/products/${id}/position`, { position });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật vị trí sản phẩm:', error);
    throw error;
  }
};

// Cập nhật thuộc tính featured (updateProductFeatured trong backend)
export const updateProductFeatured = async (id, featured) => {
  try {
    const response = await adminInstance.put(`/products/${id}/featured`, { featured });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật thuộc tính nổi bật:', error);
    throw error;
  }
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  batchDeleteProducts,
  updateProductStatus,
  updateProductPosition,
  updateProductFeatured
};