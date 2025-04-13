import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, message, Row, Col, Typography } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import categoryService from '../../../services/admin/categoryService';
import EnhancedImageUpload from '../../../components/common/EnhancedImageUpload';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CategoryFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [categories, setCategories] = useState([]);
  const isEdit = !!id;

  // Lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategoryList();
        if (response.success) {
          setCategories(response.data.filter(cat => cat._id !== id)); // Loại bỏ category hiện tại để tránh chọn chính nó làm parent
        }
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
      }
    };

    fetchCategories();
  }, [id]);

  // Lấy thông tin danh mục nếu đang chỉnh sửa
  useEffect(() => {
    if (isEdit) {
      const fetchCategory = async () => {
        try {
          setLoading(true);
          const response = await categoryService.getCategory(id);

          if (response.success) {
            const category = response.data;

            // Set form values
            form.setFieldsValue({
              name: category.name,
              parent: category.parent ? category.parent._id : null,
              description: category.description,
              status: category.status,
            });

            // Set image preview if exists
            if (category.image && category.image.url) {
              setFileList([{
                uid: '-1',
                name: 'image.jpg',
                status: 'done',
                url: category.image.url,
                isUrl: true // Flag để đánh dấu đây là URL
              }]);
            }
          } else {
            message.error('Không thể tải thông tin danh mục');
          }
        } catch (error) {
          console.error('Lỗi khi tải thông tin danh mục:', error);
          message.error('Đã xảy ra lỗi khi tải thông tin danh mục');
        } finally {
          setLoading(false);
        }
      };

      fetchCategory();
    }
  }, [isEdit, id, form]);

  // Xử lý thay đổi hình ảnh
  const handleImageChange = (info) => {
    console.log('CategoryFormPage - handleImageChange:', info);

    if (!info) {
      console.error('Thông tin không hợp lệ');
      return;
    }

    // Xử lý dữ liệu từ EnhancedImageUpload
    if (info.fileList) {
      setFileList(info.fileList);
    } else if (Array.isArray(info)) {
      setFileList(info);
    } else if (info.file) {
      // Trường hợp chỉ có một file
      setFileList([info.file]);
    } else if (typeof info === 'object') {
      // Trường hợp khác
      setFileList([info]);
    } else {
      setFileList([]);
    }
  };

  // Xử lý submit form
  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log('Gửi form với fileList:', fileList);

      // Chuẩn bị dữ liệu
      const formData = new FormData();

      // Thêm các trường thông thường
      formData.append('name', values.name);
      if (values.description) formData.append('description', values.description);
      if (values.parent) formData.append('parent', values.parent);
      formData.append('status', values.status);

      // Xử lý hình ảnh
      if (fileList && fileList.length > 0) {
        const imageItem = fileList[0];

        console.log('Dữ liệu hình ảnh sẽ upload:', imageItem);

        if (imageItem.isUrl) {
          // Nếu là URL
          formData.append('imageUrl', imageItem.url);
          console.log('Đang gửi imageUrl:', imageItem.url);
        } else if (imageItem.originFileObj) {
          // Nếu là file upload
          formData.append('image', imageItem.originFileObj);
          console.log('Đang gửi file image:', {
            name: imageItem.originFileObj.name,
            type: imageItem.originFileObj.type,
            size: imageItem.originFileObj.size
          });
        } else if (imageItem instanceof File) {
          // Nếu là File object trực tiếp
          formData.append('image', imageItem);
          console.log('Đang gửi File object:', {
            name: imageItem.name,
            type: imageItem.type,
            size: imageItem.size
          });
        } else if (imageItem.url) {
          // Backup cho trường hợp có URL nhưng không có flag isUrl
          formData.append('imageUrl', imageItem.url);
          console.log('Đang gửi imageUrl (backup):', imageItem.url);
        }
      }

      // Log form data để debug
      for (let pair of formData.entries()) {
        if (pair[0] === 'image') {
          console.log(pair[0], 'File object:', pair[1] instanceof File, {
            name: pair[1].name,
            type: pair[1].type,
            size: pair[1].size
          });
        } else {
          console.log('FormData entry:', pair[0], pair[1]);
        }
      }

      let response;
      if (isEdit) {
        response = await categoryService.updateCategory(id, formData);
      } else {
        response = await categoryService.createCategory(formData);
      }

      if (response.success) {
        message.success(response.message || (isEdit ? 'Cập nhật danh mục thành công' : 'Tạo danh mục thành công'));
        navigate('/admin/categories');
      } else {
        message.error(response.message || 'Có lỗi xảy ra. Vui lòng thử lại');
      }
    } catch (error) {
      console.error('Lỗi khi lưu danh mục:', error);
      message.error('Đã xảy ra lỗi khi lưu danh mục');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-form-page">
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3}>{isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</Title>
          </Col>
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/categories')}
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
            parent: null
          }}
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item
            name="parent"
            label="Danh mục cha"
          >
            <Select placeholder="Chọn danh mục cha (nếu có)">
              <Option value={null}>Không có</Option>
              {categories.map(category => (
                <Option key={category._id} value={category._id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} placeholder="Nhập mô tả danh mục" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Ẩn</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Hình ảnh"
            name="image"
            tooltip="Hỗ trợ upload file ảnh hoặc nhập URL"
          >
            <EnhancedImageUpload
              fileList={fileList}
              onChange={handleImageChange}
              maxCount={1}
              listType="picture-card"
              name="image"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {isEdit ? 'Cập nhật' : 'Lưu danh mục'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CategoryFormPage;