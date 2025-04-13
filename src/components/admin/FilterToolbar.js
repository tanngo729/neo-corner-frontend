// src/components/admin/FilterToolbar.js
import React from 'react';
import { Row, Col, Input, Select, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const FilterToolbar = ({
  filters,
  onFilterChange,
  onSearch,
  onReset,
  statusOptions = [],
  roleOptions = [],
  showRoleFilter = false,
  searchPlaceholder = "Tìm kiếm..."
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={8}>
        <Input
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          onPressEnter={onSearch}
          allowClear
        />
      </Col>

      {showRoleFilter && (
        <Col xs={24} sm={6}>
          <Select
            placeholder="Lọc theo vai trò"
            style={{ width: '100%' }}
            value={filters.role}
            onChange={(value) => onFilterChange('role', value)}
            allowClear
          >
            {roleOptions.map(role => (
              <Option key={role.value} value={role.value}>{role.label}</Option>
            ))}
          </Select>
        </Col>
      )}

      <Col xs={24} sm={showRoleFilter ? 6 : 8}>
        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: '100%' }}
          value={filters.status}
          onChange={(value) => onFilterChange('status', value)}
          allowClear
        >
          {statusOptions.map(status => (
            <Option key={status.value} value={status.value}>{status.label}</Option>
          ))}
        </Select>
      </Col>

      <Col xs={24} sm={4}>
        <Button
          icon={<ReloadOutlined />}
          onClick={onReset}
          style={{ width: '100%' }}
        >
          Đặt lại
        </Button>
      </Col>
    </Row>
  );
};

export default FilterToolbar;