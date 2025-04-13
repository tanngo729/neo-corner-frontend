// src/pages/admin/customers/CustomerFormPage.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, Space, Typography, Row, Col, message, Divider } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import customerService from '../../../services/admin/customerService';
import EnhancedImageUpload from '../../../components/common/EnhancedImageUpload';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CustomerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const isEdit = !!id;

  // Lấy thông tin khách hàng nếu đang chỉnh sửa
  useEffect(() => {
    if (isEdit) {
      const fetchCustomerDetail = async () => {
        try {
          setLoading(true);
          const response = await customerService.getCustomer(id);

          if (response.success) {
            const customerData = response.data;

            // Set form values
            form.setFieldsValue({
              email: customerData.email,
              fullName: customerData.fullName,
              phone: customerData.phone,
              'address.street': customerData.address?.street,
              'address.city': customerData.address?.city,
              'address.district': customerData.address?.district,
              'address.ward': customerData.address?.ward,
              'address.zipCode': customerData.address?.zipCode,
              status: customerData.status,
              isVerified: customerData.isVerified
            });

            // Set avatar preview if exists
            if (customerData.avatar && customerData.avatar.url) {
              setFileList([{
                uid: '-1',
                name: 'avatar.jpg',
                status: 'done',
                url: customerData.avatar.url,
                isUrl: true // Flag để đánh dấu đây là URL
              }]);
            }
          } else {
            message.error('Không thể tải thông tin khách hàng');
            navigate('/admin/customers');
          }
        } catch (error) {
          console.error('Lỗi khi tải thông tin khách hàng:', error);
          message.error('Đã xảy ra lỗi khi tải thông tin khách hàng');
          navigate('/admin/customers');
        } finally {
          setLoading(false);
        }
      };

      fetchCustomerDetail();
    }
  }, [id, isEdit, form, navigate]);

  // Xử lý submit form
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Chuẩn bị dữ liệu FormData để upload avatar
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('fullName', values.fullName);
      formData.append('phone', values.phone || '');

      // Xử lý địa chỉ
      const address = {
        street: values['address.street'] || '',
        city: values['address.city'] || '',
        district: values['address.district'] || '',
        ward: values['address.ward'] || '',
        zipCode: values['address.zipCode'] || ''
      };
      formData.append('address', JSON.stringify(address));

      formData.append('status', values.status);
      formData.append('isVerified', values.isVerified);

      // Thêm mật khẩu nếu đang tạo mới hoặc đã nhập
      if (!isEdit || values.password) {
        formData.append('password', values.password);
      }

      // Xử lý avatar
      if (fileList.length > 0) {
        const avatar = fileList[0];
        if (avatar.isUrl) {
          formData.append('avatarUrl', avatar.url);
        } else if (avatar.originFileObj) {
          formData.append('avatar', avatar.originFileObj);
        }
      }

      let response;
      if (isEdit) {
        response = await customerService.updateCustomer(id, formData);
      } else {
        response = await customerService.createCustomer(formData);
      }

      if (response.success) {
        message.success(response.message || (isEdit ? 'Cập nhật khách hàng thành công' : 'Tạo khách hàng thành công'));
        navigate('/admin/customers');
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Lỗi khi lưu khách hàng:', error);
      message.error('Đã xảy ra lỗi khi lưu khách hàng');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi avatar
  const handleAvatarChange = (newFileList) => {
    setFileList(newFileList);
  };

  return (
    <div className="customer-form-page">
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3}>{isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</Title>
          </Col>
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/customers')}
            >
              Quay lại
            </Button>
          </Col>
        </Row>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            isVerified: false,
            'address.street': '',
            'address.city': '',
            'address.district': '',
            'address.ward': '',
            'address.zipCode': ''
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="Nhập email" disabled={isEdit} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="fullName"
                    label="Họ tên đầy đủ"
                    rules={[
                      { required: true, message: 'Vui lòng nhập họ tên' }
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Nhập họ tên đầy đủ" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="password"
                    label={isEdit ? "Mật khẩu mới (để trống nếu không thay đổi)" : "Mật khẩu"}
                    rules={[
                      { required: !isEdit, message: 'Vui lòng nhập mật khẩu' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder={isEdit ? "Nhập mật khẩu mới" : "Nhập mật khẩu"}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={5}>Thông tin địa chỉ</Title>
              <Form.Item
                name="address.street"
                label="Địa chỉ"
              >
                <Input prefix={<HomeOutlined />} placeholder="Nhập địa chỉ" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="address.city"
                    label="Tỉnh/Thành phố"
                  >
                    <Input placeholder="Nhập tỉnh/thành phố" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="address.district"
                    label="Quận/Huyện"
                  >
                    <Input placeholder="Nhập quận/huyện" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="address.ward"
                    label="Phường/Xã"
                  >
                    <Input placeholder="Nhập phường/xã" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="address.zipCode"
                    label="Mã bưu điện"
                  >
                    <Input placeholder="Nhập mã bưu điện" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                  >
                    <Select placeholder="Chọn trạng thái">
                      <Option value="active">Hoạt động</Option>
                      <Option value="inactive">Vô hiệu</Option>
                      <Option value="banned">Khóa</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="isVerified"
                    label="Xác thực email"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Đã xác thực"
                      unCheckedChildren="Chưa xác thực"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Avatar"
                name="avatar"
                tooltip="Hỗ trợ upload file ảnh hoặc nhập URL. Kích thước tối đa 2MB."
              >
                <EnhancedImageUpload
                  fileList={fileList}
                  onChange={handleAvatarChange}
                  maxCount={1}
                  listType="picture-card"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                {isEdit ? 'Cập nhật' : 'Tạo khách hàng'}
              </Button>
              <Button onClick={() => navigate('/admin/customers')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CustomerFormPage;