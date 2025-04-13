import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, Descriptions, Image, Tag, Divider, Spin, message, Space } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById } from '../../../services/admin/productService';
import moment from 'moment';

const { Title, Text } = Typography;

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const response = await getProductById(id);

        if (response.success) {
          setProduct(response.data);
        } else {
          message.error('Không thể tải thông tin sản phẩm');
        }
      } catch (error) {
        console.error(error);
        message.error('Đã xảy ra lỗi khi tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  // Hiển thị trạng thái
  const renderStatus = (status) => {
    switch (status) {
      case 'active':
        return <Tag color="green">Hoạt động</Tag>;
      case 'inactive':
        return <Tag color="orange">Ẩn</Tag>;
      case 'draft':
      default:
        return <Tag color="gray">Nháp</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Không tìm thấy sản phẩm</Title>
        <Button type="primary" onClick={() => navigate('/admin/products')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3}>Chi tiết sản phẩm</Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/admin/products')}
              >
                Quay lại
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/admin/products/edit/${id}`)}
              >
                Chỉnh sửa
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 16 }}>
              <Image
                src={product.mainImage?.url || '/placeholder.png'}
                alt={product.name}
                style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div>
                <Title level={5}>Hình ảnh khác</Title>
                <Image.PreviewGroup>
                  <Row gutter={[8, 8]}>
                    {product.images.slice(1).map((image, index) => (
                      <Col span={8} key={index}>
                        <Image
                          src={image.url}
                          alt={`${product.name} - ${index + 2}`}
                          style={{ width: '100%', height: 80, objectFit: 'cover' }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              </div>
            )}
          </Col>

          <Col xs={24} md={16}>
            <Descriptions
              title="Thông tin sản phẩm"
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="Tên sản phẩm">{product.name}</Descriptions.Item>
              <Descriptions.Item label="Slug">{product.slug}</Descriptions.Item>
              <Descriptions.Item label="Giá bán">{product.price.toLocaleString('vi-VN')}đ</Descriptions.Item>
              <Descriptions.Item label="Giá gốc">{product.originalPrice.toLocaleString('vi-VN')}đ</Descriptions.Item>
              <Descriptions.Item label="Giảm giá">{product.discountPercentage}%</Descriptions.Item>
              <Descriptions.Item label="Số lượng kho">{product.stock}</Descriptions.Item>
              <Descriptions.Item label="Danh mục">
                {product.category ? product.category.name : 'Không có'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {renderStatus(product.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Nổi bật">
                {product.featured ? (
                  <Tag color="gold">Có</Tag>
                ) : (
                  <Tag>Không</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí">{product.position}</Descriptions.Item>
              <Descriptions.Item label="Đã bán">{product.sold}</Descriptions.Item>
              <Descriptions.Item label="Lượt xem">{product.views}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {moment(product.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {moment(product.updatedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Mô tả sản phẩm</Divider>
            <div
              className="product-description"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ProductDetailPage;