// src/pages/admin/roles/RoleListPage.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import roleService from '../../../services/admin/roleService';
import PermissionCheck from '../../../components/common/PermissionCheck';

const RoleListPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Thêm state để quản lý modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // Lấy danh sách vai trò
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoles();

      if (response.success) {
        let filteredData = response.data;

        // Lọc theo từ khóa tìm kiếm nếu có
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredData = filteredData.filter(item =>
            item.name.toLowerCase().includes(searchLower) ||
            (item.description && item.description.toLowerCase().includes(searchLower))
          );
        }

        // Lọc theo trạng thái nếu có
        if (filters.status) {
          filteredData = filteredData.filter(item => item.status === filters.status);
        }

        setRoles(filteredData);
      } else {
        message.error('Không thể tải danh sách vai trò');
      }
    } catch (error) {
      console.error('Lỗi khi tải vai trò:', error);
      message.error('Đã xảy ra lỗi khi tải danh sách vai trò');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Xử lý tìm kiếm khi nhấn Enter
  const handleSearch = () => {
    fetchRoles();
  };

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Xử lý reset bộ lọc
  const handleReset = () => {
    setFilters({
      search: '',
      status: ''
    });
    fetchRoles();
  };

  // Hàm hiển thị modal xác nhận xóa
  const showDeleteConfirm = (role) => {
    setRoleToDelete(role);
    setDeleteModalVisible(true);
  };

  // Hàm xử lý khi người dùng xác nhận xóa trong modal
  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      setDeleteModalVisible(false);
      const response = await roleService.deleteRole(roleToDelete._id);

      if (response.success) {
        message.success('Xóa vai trò thành công');
        fetchRoles();
      } else {
        message.error(response.message || 'Không thể xóa vai trò');
      }
    } catch (error) {
      console.error('Lỗi khi xóa vai trò:', error);
      message.error('Đã xảy ra lỗi khi xóa vai trò');
    }
  };

  // Hàm xử lý khi người dùng hủy xóa
  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setRoleToDelete(null);
  };

  // Định nghĩa các cột
  const columns = [
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Số quyền',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => permissions.length
    },
    {
      title: 'Vai trò mặc định',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault) => isDefault ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <div className="table-actions">
          <PermissionCheck permission="roles.edit">
            <button
              className="btn-action btn-edit"
              onClick={() => navigate(`/admin/roles/edit/${record._id}`)}
            >
              Sửa
            </button>
          </PermissionCheck>

          <PermissionCheck permission="roles.delete">
            <button
              className="btn-action btn-delete"
              onClick={() => showDeleteConfirm(record)}
            >
              Xóa
            </button>
          </PermissionCheck>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-list-page">
      <Card>
        <div className="page-header">
          <h2>Quản lý vai trò và phân quyền</h2>
          <PermissionCheck permission="roles.create">
            <button
              className="btn-add"
              onClick={() => navigate('/admin/roles/create')}
            >
              Thêm vai trò
            </button>
          </PermissionCheck>
        </div>

        <div className="page-filters">
          <input
            type="text"
            placeholder="Tìm kiếm vai trò"
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
            <option value="inactive">Vô hiệu</option>
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
          dataSource={roles}
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
          <p>Bạn có chắc chắn muốn xóa vai trò <strong>{roleToDelete?.name}</strong>?</p>
          <p>Hành động này không thể hoàn tác.</p>
        </Modal>
      </Card>
    </div>
  );
};

export default RoleListPage;