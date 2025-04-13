import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Divider, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, FacebookOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../contexts/AuthContext';
import './LoginPage.scss';

const LoginPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Lấy redirect path nếu có
  const from = location.state?.from?.pathname || '/';

  // Kiểm tra nếu người dùng đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await login(values);

      if (result.success) {
        // Đăng nhập thành công, chuyển hướng
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-box">
        <div className="login-header">
          <h2>Đăng nhập</h2>
          <p>Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.</p>
        </div>

        <Spin spinning={loading}>
          <Form
            form={form}
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={handleSubmit}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="Email"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Mật khẩu"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <div className="remember-forgot-container">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>

                <Link className="login-form-forgot" to="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="login-form-button" block loading={loading}>
                Đăng nhập
              </Button>
            </Form.Item>

            <div className="register-now">
              Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay!</Link>
            </div>

            <Divider plain>Hoặc đăng nhập với</Divider>

            <div className="social-login">
              <Button icon={<GoogleOutlined />} className="google-btn">
                Google
              </Button>
              <Button icon={<FacebookOutlined />} className="facebook-btn">
                Facebook
              </Button>
            </div>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default LoginPage;