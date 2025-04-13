import React from 'react';
import {
  Table, Button, Space, Tag, Switch, Popconfirm, Tooltip, InputNumber
} from 'antd';
import {
  EditOutlined, DeleteOutlined, EyeOutlined,
  ExclamationCircleOutlined, StarOutlined, StarFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ProductTable = ({
  products,
  loading,
  pagination,
  sort,
  selectedRowKeys,
  onSelectChange,
  onTableChange,
  onDeleteProduct,
  onStatusChange,
  onFeaturedToggle,
  onPositionChange
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Vị trí',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      render: (text, record) => (
        <InputNumber
          min={0}
          value={text}
          onChange={(value) => onPositionChange(record._id, value)}
          size="small"
          style={{ width: '60px' }}
        />
      ),
      sorter: true,
      sortOrder: sort.field === 'position' ? sort.order : undefined
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'mainImage',
      key: 'mainImage',
      width: 100,
      render: (mainImage) => (
        <img
          src={mainImage?.url || '/placeholder.png'}
          alt="Sản phẩm"
          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
        />
      )
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      sorter: true,
      sortOrder: sort.field === 'name' ? sort.order : undefined
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => `${price.toLocaleString('vi-VN')}đ`,
      sorter: true,
      sortOrder: sort.field === 'price' ? sort.order : undefined
    },
    {
      title: 'Kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      sorter: true,
      sortOrder: sort.field === 'stock' ? sort.order : undefined
    },
    {
      title: 'Nổi bật',
      dataIndex: 'featured',
      key: 'featured',
      width: 90,
      render: (featured, record) => (
        <Switch
          checked={featured}
          onChange={(checked) => onFeaturedToggle(record._id, checked)}
          checkedChildren={<StarFilled />}
          unCheckedChildren={<StarOutlined />}
        />
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        let color;
        let text;

        switch (status) {
          case 'active':
            color = 'green';
            text = 'Hoạt động';
            break;
          case 'inactive':
            color = 'orange';
            text = 'Ẩn';
            break;
          case 'draft':
          default:
            color = 'gray';
            text = 'Nháp';
        }

        return (
          <Tag
            color={color}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              // Rotate between statuses: active -> inactive -> draft -> active
              const nextStatus = status === 'active' ? 'inactive' :
                status === 'inactive' ? 'draft' : 'active';
              onStatusChange(record._id, nextStatus);
            }}
          >
            {text}
          </Tag>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/products/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/products/edit/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa sản phẩm này?"
              onConfirm={() => onDeleteProduct(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Cấu hình row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE
    ]
  };

  return (
    <Table
      rowSelection={rowSelection}
      columns={columns}
      dataSource={products}
      rowKey="_id"
      pagination={pagination}
      loading={loading}
      onChange={onTableChange}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default ProductTable;