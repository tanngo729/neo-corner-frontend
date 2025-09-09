import React from 'react';
import { Select } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import '../styles/ProductSort.scss';
const { Option } = Select;

const ProductSort = ({ sort, order, onSortChange }) => {
  // Handling sort change
  const handleSortChange = (value) => {
    const [newSort, newOrder] = value.split('-');
    onSortChange(newSort, newOrder);
  };

  // Current value of sort-order
  const currentValue = `${sort}-${order}`;

  return (
    <div className="product-sort">
      <span className="sort-label">Sắp xếp theo:</span>
      <Select
        value={currentValue}
        onChange={handleSortChange}
        className="sort-select"
        popupClassName="sort-dropdown"
        suffixIcon={order === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
      >
        <Option value="createdAt-desc">Mới nhất</Option>
        <Option value="createdAt-asc">Cũ nhất</Option>
        <Option value="price-asc">
          <SortAscendingOutlined /> Giá: Thấp đến cao
        </Option>
        <Option value="price-desc">
          <SortDescendingOutlined /> Giá: Cao đến thấp
        </Option>
        <Option value="name-asc">Tên: A-Z</Option>
        <Option value="name-desc">Tên: Z-A</Option>
        <Option value="sold-desc">Bán chạy nhất</Option>
        <Option value="views-desc">Xem nhiều nhất</Option>
      </Select>
    </div>
  );
};

export default ProductSort;