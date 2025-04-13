// src/pages/admin/settings/tabs/ActivityLogTab.js
import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Select, Input, Button, Row, Col, Tag, Typography, Tooltip, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getActivityLogs } from '../../../../services/admin/logService';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ActivityLogTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    entity: '',
    action: '',
    startDate: null,
    endDate: null,
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch logs khi trang tải hoặc khi bộ lọc thay đổi
  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        entity: filters.entity,
        action: filters.action,
        search: filters.search,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()
      };

      const response = await getActivityLogs(params);

      if (response.success) {
        setLogs(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total
        }));
      }
    } catch (error) {
      console.error('Lỗi khi tải logs:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleReset = () => {
    setFilters({
      entity: '',
      action: '',
      startDate: null,
      endDate: null,
      search: ''
    });
  };

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({
      ...prev,
      startDate: dates ? dates[0] : null,
      endDate: dates ? dates[1] : null
    }));
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Người dùng',
      dataIndex: 'user',
      key: 'user',
      render: (user) => user?.username || 'N/A'
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        let color = 'blue';
        if (action === 'create') color = 'green';
        if (action === 'delete') color = 'red';

        return <Tag color={color}>{getActionText(action)}</Tag>;
      }
    },
    {
      title: 'Đối tượng',
      dataIndex: 'entity',
      key: 'entity',
      render: (entity) => getEntityText(entity)
    },
    {
      title: 'Tên',
      dataIndex: 'entityName',
      key: 'entityName',
      ellipsis: true
    },
    {
      title: 'Chi tiết',
      dataIndex: 'details',
      key: 'details',
      render: (details) => {
        if (!details || Object.keys(details).length === 0) return 'Không có';

        return (
          <Tooltip title={<pre>{JSON.stringify(details, null, 2)}</pre>}>
            <Button type="link">Xem chi tiết</Button>
          </Tooltip>
        );
      }
    }
  ];

  // Hàm helper
  const getActionText = (action) => {
    switch (action) {
      case 'create': return 'Tạo mới';
      case 'update': return 'Cập nhật';
      case 'delete': return 'Xóa';
      default: return action;
    }
  };

  const getEntityText = (entity) => {
    switch (entity) {
      case 'product': return 'Sản phẩm';
      case 'category': return 'Danh mục';
      case 'user': return 'Người dùng';
      case 'role': return 'Vai trò';
      case 'order': return 'Đơn hàng';
      case 'setting': return 'Cài đặt';
      default: return entity;
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Input
              placeholder="Tìm kiếm theo tên..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Loại đối tượng"
              style={{ width: '100%' }}
              value={filters.entity}
              onChange={(value) => handleFilterChange('entity', value)}
              allowClear
            >
              <Option value="product">Sản phẩm</Option>
              <Option value="category">Danh mục</Option>
              <Option value="user">Người dùng</Option>
              <Option value="role">Vai trò</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Hành động"
              style={{ width: '100%' }}
              value={filters.action}
              onChange={(value) => handleFilterChange('action', value)}
              allowClear
            >
              <Option value="create">Tạo mới</Option>
              <Option value="update">Cập nhật</Option>
              <Option value="delete">Xóa</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={[filters.startDate, filters.endDate]}
              onChange={handleDateRangeChange}
            />
          </Col>
          <Col span={2}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              Đặt lại
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={(newPagination) => setPagination(newPagination)}
        />
      </Space>
    </div>
  );
};

export default ActivityLogTab;