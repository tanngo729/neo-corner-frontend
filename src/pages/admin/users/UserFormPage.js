// src/pages/admin/users/UserFormPage.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, Space, Typography, Row, Col, message, Divider } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import userService from '../../../services/admin/userService';
import roleService from '../../../services/admin/roleService';
import EnhancedImageUpload from '../../../components/common/EnhancedImageUpload';

const { Title } = Typography;
const { Option } = Select;

const UserFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [roles, setRoles] = useState([]);
  const isEdit = !!id;

  // Lấy danh sách vai trò
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await roleService.getRoles({ status: 'active' });
        if (response.success) {
          setRoles(response.data);
        } else {
          message.error('Không thể tải danh sách vai trò');
        }
      } catch (error) {
        console.error('Lỗi khi tải vai trò:', error);
        message.error('Đã xảy ra lỗi khi tải danh sách vai trò');
      }
    };

    fetchRoles();
  }, []);

  // Lấy thông tin người dùng nếu đang chỉnh sửa
  useEffect(() => {
    if (isEdit) {
      const fetchUserDetail = async () => {
        try {
          setLoading(true);
          const response = await userService.getUser(id);

          if (response.success) {
            const userData = response.data;

            // Set form values
            form.setFieldsValue({
              username: userData.username,
              email: userData.email,
              fullName: userData.fullName,
              role: userData.role?._id,
              status: userData.status
            });

            // Set avatar preview if exists
            if (userData.avatar && userData.avatar.url) {
              setFileList([{
                uid: '-1',
                name: 'avatar.jpg',
                status: 'done',
                url: userData.avatar.url,
                isUrl: true // Flag để đánh dấu đây là URL
              }]);
            }
          } else {
            message.error('Không thể tải thông tin người dùng');
            navigate('/admin/users');
          }
        } catch (error) {
          console.error('Lỗi khi tải thông tin người dùng:', error);
          message.error('Đã xảy ra lỗi khi tải thông tin người dùng');
          navigate('/admin/users');
        } finally {
          setLoading(false);
        }
      };

      fetchUserDetail();
    }
  }, [id, isEdit, form, navigate]);

  // Xử lý submit form
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Chuẩn bị dữ liệu FormData để upload avatar
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('email', values.email);
      formData.append('fullName', values.fullName);
      formData.append('role', values.role);
      formData.append('status', values.status);

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
        response = await userService.updateUser(id, formData);
      } else {
        response = await userService.createUser(formData);
      }

      if (response.success) {
        message.success(response.message || (isEdit ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công'));
        navigate('/admin/users');
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Lỗi khi lưu người dùng:', error);
      message.error('Đã xảy ra lỗi khi lưu người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi avatar
  const handleAvatarChange = (newFileList) => {
    setFileList(newFileList);
  };

  return (
    <div className="user-form-page">
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3}>{isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</Title>
          </Col>
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/users')}
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
            status: 'active'
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="username"
                    label="Tên đăng nhập"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                      { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Nhập tên đăng nhập"
                      disabled={isEdit} // Không cho phép sửa username khi edit
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="Nhập email" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="fullName"
                label="Họ tên đầy đủ"
              >
                <Input placeholder="Nhập họ tên đầy đủ" />
              </Form.Item>

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

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="role"
                    label="Vai trò"
                    rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                  >
                    <Select placeholder="Chọn vai trò">
                      {roles.map(role => (
                        <Option key={role._id} value={role._id}>{role.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
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
                {isEdit ? 'Cập nhật' : 'Tạo người dùng'}
              </Button>
              <Button onClick={() => navigate('/admin/users')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UserFormPage;