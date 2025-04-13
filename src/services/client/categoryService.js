// src/services/client/categoryService.js 
import { clientInstance } from '../../config/api';

const categoryService = {
  // Lấy tất cả danh mục
  getCategories: (params = {}) => {
    const safeParams = {
      ...params,
      parent: params.parent || 'null'
    };

    return clientInstance.get('/categories', {
      params: safeParams
    }).catch(error => {
      console.error('Lỗi khi lấy danh mục:', error);
      return {
        data: {
          data: [
            { _id: '1', name: 'Điện thoại' },
            { _id: '2', name: 'Máy tính' },
            { _id: '3', name: 'Phụ kiện' },
            { _id: '4', name: 'Đồng hồ' }
          ]
        }
      };
    });
  },

  // Lấy danh mục phổ biến
  getPopularCategories: (limit = 6) => {
    return clientInstance.get('/categories/popular', {
      params: { limit }
    }).catch(error => {
      console.error('Lỗi khi lấy danh mục phổ biến:', error);
      return {
        data: {
          data: [
            { _id: '1', name: 'Điện thoại', productCount: 10 },
            { _id: '2', name: 'Máy tính', productCount: 8 },
            { _id: '3', name: 'Phụ kiện', productCount: 15 },
            { _id: '4', name: 'Đồng hồ', productCount: 5 }
          ]
        }
      };
    });
  },

  // Lấy danh mục kèm danh mục con
  getCategoryWithSubcategories: () => {
    return clientInstance.get('/categories/with-subcategories')
      .catch(error => {
        console.error('Lỗi khi lấy danh mục và danh mục con:', error);
        // Dữ liệu dự phòng nếu có lỗi
        return {
          data: {
            data: [
              {
                _id: '1',
                name: 'Điện thoại',
                subcategories: [
                  { _id: '11', name: 'Smartphone' },
                  { _id: '12', name: 'Điện thoại cổ' }
                ]
              },
              {
                _id: '2',
                name: 'Máy tính',
                subcategories: [
                  { _id: '21', name: 'Laptop' },
                  { _id: '22', name: 'Máy tính để bàn' }
                ]
              },
              {
                _id: '3',
                name: 'Phụ kiện',
                subcategories: []
              },
              {
                _id: '4',
                name: 'Đồng hồ',
                subcategories: []
              }
            ]
          }
        };
      });
  },

  // Thêm hàm mới để lấy danh mục con của một danh mục
  getSubcategories: (categoryId) => {
    if (!categoryId) {
      return Promise.reject(new Error('ID danh mục không được cung cấp'));
    }

    return clientInstance.get(`/categories/${categoryId}/subcategories`)
      .catch(error => {
        console.error(`Lỗi khi lấy danh mục con của ${categoryId}:`, error);
        return {
          data: {
            data: []
          }
        };
      });
  },

  // Thêm hàm helper để kiểm tra xem danh mục có phải là danh mục con hay không
  isSubcategory: async (categoryId) => {
    try {
      const response = await categoryService.getCategoryWithSubcategories();
      if (response?.data?.data) {
        // Kiểm tra trong tất cả danh mục cha
        for (const parent of response.data.data) {
          if (parent.subcategories && parent.subcategories.length > 0) {
            const found = parent.subcategories.some(sub =>
              sub._id === categoryId || sub.id === categoryId
            );
            if (found) {
              return {
                isSubcategory: true,
                parentId: parent._id || parent.id,
                parentName: parent.name
              };
            }
          }
        }
      }
      return { isSubcategory: false };
    } catch (error) {
      console.error('Lỗi khi kiểm tra danh mục con:', error);
      return { isSubcategory: false };
    }
  }
};

export default categoryService;