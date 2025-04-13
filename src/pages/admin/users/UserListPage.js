// src/pages/admin/users/UserListPage.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Avatar, Space, Modal } from 'antd';
import { UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/admin/userService';
import moment from 'moment';
import PermissionCheck from '../../../components/common/PermissionCheck';

const UserListPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });
  const [roles, setRoles] = useState([]);

  // Thêm state để quản lý modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Lấy danh sách vai trò
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await userService.getRoles();
        if (response.success) {
          setRoles(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách vai trò:', error);
      }
    };

    fetchRoles();
  }, []);

  // Lấy danh sách người dùng
  const fetchUsers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pageSize,
        ...filters
      };

      const response = await userService.getUsers(params);

      if (response.success) {
        setUsers(response.data);
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      } else {
        message.error('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Lỗi khi tải người dùng:', error);
      message.error('Đã xảy ra lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu khi component mount hoặc filter thay đổi
  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, [filters]);

  // Xử lý phân trang
  const handleTableChange = (pagination) => {
    fetchUsers(pagination.current, pagination.pageSize);
  };

  // Xử lý filter
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  // Xử lý tìm kiếm khi nhấn Enter
  const handleSearch = () => {
    fetchUsers(1, pagination.pageSize);
  };

  // Xử lý reset filter
  const handleReset = () => {
    setFilters({
      search: '',
      role: '',
      status: ''
    });
  };

  // Hàm hiển thị modal xác nhận xóa
  const showDeleteConfirm = (user) => {
    setUserToDelete(user);
    setDeleteModalVisible(true);
  };

  // Hàm xử lý khi người dùng xác nhận xóa trong modal
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleteModalVisible(false);
      const response = await userService.deleteUser(userToDelete._id);

      if (response.success) {
        message.success('Xóa người dùng thành công');
        fetchUsers(pagination.current, pagination.pageSize);
      } else {
        message.error(response.message || 'Không thể xóa người dùng');
      }
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error);
      message.error('Đã xảy ra lỗi khi xóa người dùng');
    }
  };

  // Hàm xử lý khi người dùng hủy xóa
  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setUserToDelete(null);
  };

  // Render status tag
  const renderStatusTag = (status) => {
    let color;
    let text;

    switch (status) {
      case 'active':
        color = 'green';
        text = 'Hoạt động';
        break;
      case 'inactive':
        color = 'orange';
        text = 'Vô hiệu';
        break;
      case 'banned':
        color = 'red';
        text = 'Bị khóa';
        break;
      default:
        color = 'default';
        text = status;
    }

    return <Tag color={color}>{text}</Tag>;
  };

  // Cột bảng
  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar?.url}
            icon={!record.avatar?.url && <UserOutlined />}
            size="large"
          />
          <div>
            <div><strong>{record.fullName || record.username}</strong></div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => role?.name || 'Không có'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag
    },
    {
      title: 'Đăng nhập lần cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (lastLogin) => lastLogin ? moment(lastLogin).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => moment(createdAt).format('DD/MM/YYYY')
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <div className="table-actions">
          <PermissionCheck permission="users.edit">
            <button
              className="btn-action btn-edit"
              onClick={() => navigate(`/admin/users/edit/${record._id}`)}
            >
              Sửa
            </button>
          </PermissionCheck>

          <PermissionCheck permission="users.delete">
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
          <h2>Quản lý người dùng</h2>
          <PermissionCheck permission="users.create">
            <button
              className="btn-add"
              onClick={() => navigate('/admin/users/create')}
            >
              Thêm người dùng
            </button>
          </PermissionCheck>
        </div>

        <div className="page-filters">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="filter-search"
          />

          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả vai trò</option>
            {roles.map(role => (
              <option key={role._id} value={role._id}>{role.name}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Vô hiệu</option>
            <option value="banned">Bị khóa</option>
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
          dataSource={users}
          rowKey="_id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
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
          <p>Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.fullName || userToDelete?.username}</strong>?</p>
          <p>Hành động này không thể hoàn tác.</p>
        </Modal>
      </Card>
    </div>
  );
};

export default UserListPage;