import React from 'react';
import { Card, Typography, Row, Col, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProductList } from '../../../hooks/useProductList';
import ProductTable from '../../../components/admin/products/ProductTable';
import ProductListFilter from '../../../components/admin/products/ProductListFilter';

const { Title } = Typography;

const ProductListPage = () => {
  const navigate = useNavigate();
  const {
    products,
    loading,
    pagination,
    filters,
    sort,
    selectedRowKeys,
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
  } = useProductList();

  return (
    <div className="product-list-page">
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3}>Quản lý sản phẩm</Title>
          </Col>
          <Col>
            <button
              className="btn-add"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/products/create')}
            >
              Thêm sản phẩm
            </button>
          </Col>
        </Row>

        <ProductListFilter
          filters={filters}
          onSearch={handleSearch}
          onStatusChange={(value) => handleFilterChange('status', value)}
          onReset={handleReset}
          onBatchDelete={handleBatchDelete}
          selectedCount={selectedRowKeys.length}
        />

        <ProductTable
          products={products}
          loading={loading}
          pagination={pagination}
          sort={sort}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
          onTableChange={handleTableChange}
          onDeleteProduct={handleDeleteProduct}
          onStatusChange={handleStatusUpdate}
          onFeaturedToggle={handleFeaturedToggle}
          onPositionChange={handlePositionChange}
        />
      </Card>
    </div>
  );
};

export default ProductListPage;