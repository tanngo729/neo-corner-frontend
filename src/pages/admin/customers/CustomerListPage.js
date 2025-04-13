// src/pages/admin/customers/CustomerListPage.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Avatar, Space, Modal, Tooltip, Switch } from 'antd';
import { UserOutlined, ExclamationCircleOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import customerService from '../../../services/admin/customerService';
import moment from 'moment';
import PermissionCheck from '../../../components/common/PermissionCheck';

const CustomerListPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    isVerified: ''
  });

  // States cho modal
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState({
    visible: false,
    customerId: null,
    newPassword: ''
  });
  const [verificationLoading, setVerificationLoading] = useState({});

  // Lấy danh sách khách hàng
  const fetchCustomers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);

      // Tạo đối tượng params cơ bản
      const params = {
        page,
        limit: pageSize,
        search: filters.search,
        status: filters.status,
      };

      // Chỉ thêm tham số isVerified khi nó có giá trị cụ thể
      if (filters.isVerified !== '') {
        params.isVerified = filters.isVerified;
      }

      const response = await customerService.getCustomers(params);

      if (response.success) {
        setCustomers(response.data);
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      } else {
        message.error('Không thể tải danh sách khách hàng');
      }
    } catch (error) {
      console.error('Lỗi khi tải khách hàng:', error);
      message.error('Đã xảy ra lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu khi component mount hoặc filter thay đổi
  useEffect(() => {
    fetchCustomers(pagination.current, pagination.pageSize);
  }, [filters]);

  // Xử lý phân trang
  const handleTableChange = (pagination) => {
    fetchCustomers(pagination.current, pagination.pageSize);
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
    fetchCustomers(1, pagination.pageSize);
  };

  // Xử lý reset filter
  const handleReset = () => {
    setFilters({
      search: '',
      status: '',
      isVerified: ''
    });
  };

  // Hàm xử lý xóa khách hàng
  const showDeleteConfirm = (customer) => {
    setCustomerToDelete(customer);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      setDeleteModalVisible(false);
      const response = await customerService.deleteCustomer(customerToDelete._id);

      if (response.success) {
        message.success('Xóa khách hàng thành công');
        fetchCustomers(pagination.current, pagination.pageSize);
      } else {
        message.error(response.message || 'Không thể xóa khách hàng');
      }
    } catch (error) {
      console.error('Lỗi khi xóa khách hàng:', error);
      message.error('Đã xảy ra lỗi khi xóa khách hàng');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setCustomerToDelete(null);
  };

  // Xử lý đặt lại mật khẩu
  const showResetPasswordModal = (customerId) => {
    setResetPasswordModal({
      visible: true,
      customerId,
      newPassword: generateRandomPassword(10)
    });
  };

  const handleResetPasswordConfirm = async () => {
    try {
      const response = await customerService.resetCustomerPassword(
        resetPasswordModal.customerId,
        resetPasswordModal.newPassword
      );

      if (response.success) {
        message.success('Đặt lại mật khẩu thành công');
        setResetPasswordModal({ visible: false, customerId: null, newPassword: '' });
      } else {
        message.error(response.message || 'Không thể đặt lại mật khẩu');
      }
    } catch (error) {
      console.error('Lỗi khi đặt lại mật khẩu:', error);
      message.error('Đã xảy ra lỗi khi đặt lại mật khẩu');
    }
  };

  const handleResetPasswordCancel = () => {
    setResetPasswordModal({ visible: false, customerId: null, newPassword: '' });
  };

  // Xử lý cập nhật trạng thái xác thực email
  const handleVerificationChange = async (checked, customerId) => {
    try {
      setVerificationLoading(prev => ({ ...prev, [customerId]: true }));

      const response = await customerService.updateVerificationStatus(customerId, checked);

      if (response.success) {
        message.success(`Đã ${checked ? 'xác thực' : 'hủy xác thực'} email khách hàng`);

        // Cập nhật lại trạng thái trên giao diện
        setCustomers(prevCustomers =>
          prevCustomers.map(customer =>
            customer._id === customerId ? { ...customer, isVerified: checked } : customer
          )
        );
      } else {
        message.error(response.message || 'Không thể cập nhật trạng thái xác thực');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái xác thực:', error);
      message.error('Đã xảy ra lỗi khi cập nhật trạng thái xác thực');
    } finally {
      setVerificationLoading(prev => ({ ...prev, [customerId]: false }));
    }
  };

  // Tạo mật khẩu ngẫu nhiên
  const generateRandomPassword = (length) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar?.url}
            icon={!record.avatar?.url && <UserOutlined />}
            size="large"
          />
          <div>
            <div>
              <strong>{record.fullName}</strong>
              {record.isVerified && (
                <Tooltip title="Email đã xác thực">
                  <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                </Tooltip>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'Chưa cập nhật'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag
    },
    {
      title: 'Xác thực Email',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (isVerified, record) => (
        <PermissionCheck permission="customers.edit">
          <Switch
            checked={isVerified}
            onChange={(checked) => handleVerificationChange(checked, record._id)}
            loading={verificationLoading[record._id]}
            checkedChildren="Rồi"
            unCheckedChildren="Chưa"
          />
        </PermissionCheck>
      )
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
          <PermissionCheck permission="customers.edit">
            <button
              className="btn-action btn-edit"
              onClick={() => navigate(`/admin/customers/edit/${record._id}`)}
            >
              Sửa
            </button>
          </PermissionCheck>

          <PermissionCheck permission="customers.edit">
            <Tooltip title="Đặt lại mật khẩu">
              <button
                className="btn-action btn-reset-pw"
                onClick={() => showResetPasswordModal(record._id)}
              >
                <KeyOutlined /> Đặt MK
              </button>
            </Tooltip>
          </PermissionCheck>

          <PermissionCheck permission="customers.delete">
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
          <h2>Quản lý khách hàng</h2>
          <PermissionCheck permission="customers.create">
            <button
              className="btn-add"
              onClick={() => navigate('/admin/customers/create')}
            >
              Thêm khách hàng
            </button>
          </PermissionCheck>
        </div>

        <div className="page-filters">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
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
            <option value="banned">Bị khóa</option>
          </select>

          <select
            value={filters.isVerified}
            onChange={(e) => handleFilterChange('isVerified', e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái xác thực</option>
            <option value="true">Đã xác thực</option>
            <option value="false">Chưa xác thực</option>
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
          dataSource={customers}
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
          <p>Bạn có chắc chắn muốn xóa khách hàng <strong>{customerToDelete?.fullName}</strong>?</p>
          <p>Hành động này không thể hoàn tác.</p>
        </Modal>

        {/* Modal đặt lại mật khẩu */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KeyOutlined style={{ marginRight: '8px' }} />
              <span>Đặt lại mật khẩu</span>
            </div>
          }
          open={resetPasswordModal.visible}
          onOk={handleResetPasswordConfirm}
          onCancel={handleResetPasswordCancel}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <p>Mật khẩu mới đã được tạo ngẫu nhiên:</p>
          <div style={{
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '16px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {resetPasswordModal.newPassword}
          </div>
          <p>Lưu ý: Hãy lưu lại mật khẩu này để cung cấp cho khách hàng. Mật khẩu sẽ không được hiển thị lại sau khi đóng cửa sổ này.</p>
        </Modal>
      </Card>
    </div>
  );
};

export default CustomerListPage;