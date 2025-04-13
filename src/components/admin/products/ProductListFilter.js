import React from 'react';
import { Row, Col, Input, Select, Button, Popconfirm } from 'antd';
import { SearchOutlined, ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const ProductListFilter = ({
  filters,
  onSearch,
  onStatusChange,
  onReset,
  onBatchDelete,
  selectedCount = 0
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={8} lg={8} xl={8}>
        <Search
          placeholder="Tìm kiếm sản phẩm..."
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={onSearch}
          value={filters.search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={4}>
        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: '100%' }}
          allowClear
          value={filters.status}
          onChange={onStatusChange}
        >
          <Option value="active">Hoạt động</Option>
          <Option value="inactive">Ẩn</Option>
          <Option value="draft">Nháp</Option>
        </Select>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={4}>
        <Button icon={<ReloadOutlined />} onClick={onReset}>
          Đặt lại
        </Button>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4} xl={4}>
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa các sản phẩm đã chọn?"
          onConfirm={onBatchDelete}
          okText="Xóa"
          cancelText="Hủy"
          disabled={selectedCount === 0}
          icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={selectedCount === 0}
          >
            Xóa đã chọn ({selectedCount})
          </Button>
        </Popconfirm>
      </Col>
    </Row>
  );
};

export default ProductListFilter;