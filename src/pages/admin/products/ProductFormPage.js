// src/pages/admin/products/ProductFormPage.js
import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, Form, Space, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductForm } from '../../../hooks/useProductForm';
import ProductFormFields from '../../../components/admin/products/ProductFormFields';
import { getCategoryList } from '../../../services/admin/categoryService';

const { Title } = Typography;

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const {
    form,
    loading,
    fileList,
    product,
    handleSubmit,
    handleImageChange,
    resetForm
  } = useProductForm(id, isEdit);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [description, setDescription] = useState('');

  // Hàm để cập nhật giá trị trường form
  const setFormFieldValue = (name, value) => {
    if (name === 'description') {
      setDescription(value);
    }
    form.setFieldsValue({ [name]: value });
  };

  // Fetch danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await getCategoryList();
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
        message.error('Không thể tải danh sách danh mục');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Xử lý khi submit form
  const onFinish = async (values) => {
    // Đảm bảo lấy đúng giá trị description
    const updatedValues = {
      ...values,
      description: description || values.description
    };

    const savedProduct = await handleSubmit(updatedValues);
    if (savedProduct) {
      navigate('/admin/products');
    }
  };

  return (
    <div className="product-form-page">
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3}>{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</Title>
          </Col>
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/products')}
            >
              Quay lại
            </Button>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: 'active',
            featured: false,
            stock: 0,
            discountPercentage: 0
          }}
        >
          <ProductFormFields
            fileList={fileList}
            onImageChange={handleImageChange}
            categories={categories}
            setFormFieldValue={setFormFieldValue}
          />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                {isEdit ? 'Cập nhật' : 'Lưu sản phẩm'}
              </Button>
              <Button onClick={() => resetForm()}>
                Đặt lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProductFormPage;