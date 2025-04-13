import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { getProducts, deleteProduct, batchDeleteProducts, updateProductStatus, updateProductFeatured, updateProductPosition } from '../services/admin/productService';

export const useProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [sort, setSort] = useState({
    field: 'position',
    order: 'descend'  // Đã đổi từ 'ascend' thành 'descend'
  });

  // Lấy danh sách sản phẩm
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search,
        status: filters.status,
        sort: sort.field,
        order: sort.order === 'ascend' ? 'asc' : 'desc'
      };

      const response = await getProducts(params);

      if (response.success) {
        setProducts(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total
        }));
      } else {
        message.error('Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters, sort]);

  // Lấy dữ liệu khi component mount và khi dependencies thay đổi
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Xử lý tìm kiếm
  const handleSearch = useCallback((value) => {
    setFilters(prev => ({
      ...prev,
      search: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, []);

  // Xử lý thay đổi trạng thái lọc
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, []);

  // Xử lý reset bộ lọc
  const handleReset = useCallback(() => {
    setFilters({
      search: '',
      status: ''
    });
    setSort({
      field: 'position',
      order: 'descend'
    });
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, []);

  // Xử lý thay đổi bảng (phân trang, sắp xếp)
  const handleTableChange = useCallback((newPagination, filters, sorter) => {
    setPagination({
      ...newPagination
    });

    // Xử lý sắp xếp
    if (sorter && sorter.field) {
      // Nếu đang nhấp vào cùng một cột và không có order (hoặc không xác định), 
      // có thể là do cột đã ở trạng thái descend, ta cần đặt lại thành ascend
      if (sorter.field === sort.field && !sorter.order) {
        setSort({
          field: sorter.field,
          order: 'ascend'
        });
      } else {
        // Ngược lại, sử dụng order được cung cấp, hoặc mặc định là descend
        setSort({
          field: sorter.field,
          order: sorter.order || 'descend'
        });
      }
    } else {
      // Nếu không có sorter, reset về mặc định sắp xếp theo vị trí giảm dần
      setSort({
        field: 'position',
        order: 'descend'
      });
    }
  }, [sort]);

  // Xử lý chọn row
  const onSelectChange = useCallback((newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  }, []);

  // Xử lý xóa sản phẩm
  const handleDeleteProduct = useCallback(async (id) => {
    try {
      const response = await deleteProduct(id);

      if (response.success) {
        message.success(response.message);
        fetchProducts();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }, [fetchProducts]);

  // Xử lý xóa nhiều sản phẩm
  const handleBatchDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      const response = await batchDeleteProducts(selectedRowKeys);

      if (response.success) {
        message.success(response.message);
        setSelectedRowKeys([]);
        fetchProducts();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }, [selectedRowKeys, fetchProducts]);

  // Xử lý thay đổi trạng thái sản phẩm
  const handleStatusUpdate = useCallback(async (id, status) => {
    try {
      const response = await updateProductStatus(id, status);

      if (response.success) {
        message.success(response.message);
        fetchProducts();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }, [fetchProducts]);

  // Xử lý chuyển đổi nổi bật
  const handleFeaturedToggle = useCallback(async (id, featured) => {
    try {
      const response = await updateProductFeatured(id, featured);

      if (response.success) {
        message.success(response.message);
        fetchProducts();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }, [fetchProducts]);

  // Xử lý thay đổi vị trí
  const handlePositionChange = useCallback(async (id, position) => {
    try {
      const response = await updateProductPosition(id, position);

      if (response.success) {
        message.success(response.message);
        fetchProducts();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  }, [fetchProducts]);

  return {
    products,
    loading,
    pagination,
    filters,
    sort,
    selectedRowKeys,
    fetchProducts,
    handleSearch,
    handleFilterChange,
    handleReset,
    handleTableChange,
    onSelectChange,
    handleDeleteProduct,
    handleBatchDelete,
    handleStatusUpdate,
    handleFeaturedToggle,
    handlePositionChange
  };
};