// src/pages/admin/categories/CategoryListPage.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import categoryService from '../../../services/admin/categoryService';

const CategoryListPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Thêm state để quản lý modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategoryList({ status: filters.status });
      if (response.success) {
        // Lọc danh sách nếu có từ khóa tìm kiếm
        let filteredData = response.data;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredData = filteredData.filter(item =>
            item.name.toLowerCase().includes(searchLower)
          );
        }
        setCategories(filteredData);
      } else {
        message.error('Không thể tải danh sách danh mục');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
      message.error('Đã xảy ra lỗi khi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filters.status]);

  // Xử lý tìm kiếm
  const handleSearch = () => {
    fetchCategories();
  };

  // Xử lý reset bộ lọc
  const handleReset = () => {
    setFilters({
      search: '',
      status: ''
    });
  };

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Hàm hiển thị modal xác nhận xóa
  const showDeleteConfirm = (category) => {
    setCategoryToDelete(category);
    setDeleteModalVisible(true);
  };

  // Hàm xử lý khi người dùng xác nhận xóa trong modal
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleteModalVisible(false);
      const response = await categoryService.deleteCategory(categoryToDelete._id);
      if (response.success) {
        message.success('Xóa danh mục thành công');
        fetchCategories();
      } else {
        message.error(response.message || 'Không thể xóa danh mục');
      }
    } catch (error) {
      console.error('Lỗi khi xóa danh mục:', error);
      message.error('Đã xảy ra lỗi khi xóa danh mục');
    }
  };

  // Hàm xử lý khi người dùng hủy xóa
  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setCategoryToDelete(null);
  };

  // Xử lý cập nhật trạng thái
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await categoryService.updateCategoryStatus(id, newStatus);
      if (response.success) {
        message.success('Cập nhật trạng thái thành công');
        fetchCategories();
      } else {
        message.error(response.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      message.error('Đã xảy ra lỗi khi cập nhật trạng thái');
    }
  };

  // Định nghĩa các cột
  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (image) => (
        <img
          src={image?.url || '/placeholder.png'}
          alt="Danh mục"
          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }}
        />
      )
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Danh mục cha',
      dataIndex: 'parent',
      key: 'parent',
      render: (parent) => parent ? parent.name : 'Không có'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag
          color={status === 'active' ? 'green' : 'orange'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusChange(record._id, status === 'active' ? 'inactive' : 'active')}
        >
          {status === 'active' ? 'Hoạt động' : 'Ẩn'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <div className="table-actions">
          <button
            className="btn-action btn-edit"
            onClick={() => navigate(`/admin/categories/edit/${record._id}`)}
          >
            Sửa
          </button>
          <button
            className="btn-action btn-delete"
            onClick={() => showDeleteConfirm(record)}
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-list-page">
      <Card>
        <div className="page-header">
          <h2>Quản lý danh mục</h2>
          <button
            className="btn-add"
            onClick={() => navigate('/admin/categories/create')}
          >
            Thêm danh mục
          </button>
        </div>

        <div className="page-filters">
          <input
            type="text"
            placeholder="Tìm kiếm danh mục"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="filter-search"
          />

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ẩn</option>
          </select>

          <button
            className="btn-reset"
            onClick={handleReset}
          >
            Đặt lại
          </button>
        </div>

        <Table
          columns={columns}
          dataSource={categories}
          rowKey="_id"
          loading={loading}
          className="admin-table"
        />

        {/* Modal xác nhận xóa */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
              <span>Xác nhận xóa</span>
            </div>
          }
          open={deleteModalVisible}
          onOk={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <p>Bạn có chắc chắn muốn xóa danh mục <strong>{categoryToDelete?.name}</strong>?</p>
          <p>Hành động này không thể hoàn tác.</p>
        </Modal>
      </Card>
    </div>
  );
};

export default CategoryListPage;