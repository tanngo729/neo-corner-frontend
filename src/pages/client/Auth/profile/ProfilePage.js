import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Avatar,
  Row,
  Col,
  Tabs,
  Form,
  Input,
  Button,
  Divider,
  message
} from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../contexts/AuthContext';
import './ProfilePage.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProfilePage = () => {
  const { user, updateProfile, changePassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Kiểm tra đăng nhập
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Initial form values
  React.useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        district: user.address?.district || '',
        ward: user.address?.ward || '',
        zipCode: user.address?.zipCode || '',
      });
    }
  }, [user, profileForm]);

  const handleProfileUpdate = async (values) => {
    try {
      setLoading(true);

      // Format dữ liệu địa chỉ
      const addressData = {
        street: values.street,
        city: values.city,
        district: values.district,
        ward: values.ward,
        zipCode: values.zipCode,
      };

      // Dữ liệu gửi lên server
      const updateData = {
        fullName: values.fullName,
        phone: values.phone,
        address: addressData
      };

      // Gọi API cập nhật
      const result = await updateProfile(updateData);

      if (result.success) {
        message.success('Cập nhật thông tin thành công');
      }
    } catch (error) {
      console.error('Lỗi cập nhật thông tin:', error);
      message.error('Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      setPasswordLoading(true);

      const passwordData = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      };

      const result = await changePassword(passwordData);

      if (result.success) {
        message.success('Đổi mật khẩu thành công');
        passwordForm.resetFields();
      }
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      message.error('Đổi mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text>Đang tải thông tin...</Text>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={6}>
            <Card className="profile-card">
              <div className="profile-header">
                <Avatar size={80} icon={<UserOutlined />} />
                <Title level={4}>{user.fullName || 'Người dùng'}</Title>
                <Text type="secondary">{user.email}</Text>

                <div className="verify-status">
                  {user.isVerified ? (
                    <Text type="success">Email đã xác thực</Text>
                  ) : (
                    <Text type="warning">Email chưa xác thực</Text>
                  )}
                </div>
              </div>

              <Divider />

              <div className="profile-menu">
                <div className="menu-item active">
                  <UserOutlined /> Thông tin tài khoản
                </div>
                <div className="menu-item">
                  <LockOutlined /> Bảo mật
                </div>
                <div className="menu-item">
                  <HomeOutlined /> Địa chỉ
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={18}>
            <Card className="profile-content">
              <Tabs defaultActiveKey="1">
                <TabPane tab="Thông tin cá nhân" key="1">
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleProfileUpdate}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="fullName"
                          label="Họ tên"
                          rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                        >
                          <Input prefix={<UserOutlined />} placeholder="Họ tên" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          name="email"
                          label="Email"
                        >
                          <Input
                            prefix={<MailOutlined />}
                            disabled
                            placeholder="Email"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          name="phone"
                          label="Số điện thoại"
                          rules={[
                            { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' }
                          ]}
                        >
                          <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">Địa chỉ</Divider>

                    <Row gutter={16}>
                      <Col xs={24} md={24}>
                        <Form.Item
                          name="street"
                          label="Địa chỉ"
                        >
                          <Input prefix={<HomeOutlined />} placeholder="Số nhà, tên đường" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={8}>
                        <Form.Item
                          name="ward"
                          label="Phường/Xã"
                        >
                          <Input placeholder="Phường/Xã" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={8}>
                        <Form.Item
                          name="district"
                          label="Quận/Huyện"
                        >
                          <Input placeholder="Quận/Huyện" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={8}>
                        <Form.Item
                          name="city"
                          label="Tỉnh/Thành phố"
                        >
                          <Input placeholder="Tỉnh/Thành phố" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                      >
                        Cập nhật thông tin
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>

                <TabPane tab="Đổi mật khẩu" key="2">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handlePasswordChange}
                  >
                    <Form.Item
                      name="currentPassword"
                      label="Mật khẩu hiện tại"
                      rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Mật khẩu hiện tại"
                      />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label="Mật khẩu mới"
                      rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Mật khẩu mới"
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label="Xác nhận mật khẩu mới"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Xác nhận mật khẩu mới"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={passwordLoading}
                      >
                        Đổi mật khẩu
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProfilePage;