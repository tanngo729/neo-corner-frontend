import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Divider, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../contexts/AuthContext';
import './RegisterPage.scss';

const RegisterPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const { register, isAuthenticated } = useAuth();

  // Nếu đã đăng nhập, chuyển hướng về trang chủ
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (values) => {
    if (!agreement) {
      message.error('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }

    try {
      setLoading(true);
      const result = await register(values);

      if (result.success) {
        message.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        // Chuyển hướng đến trang yêu cầu xác thực email
        navigate('/verify-email-required');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-box">
        <div className="register-header">
          <h2>Đăng ký tài khoản</h2>
          <p>Tạo tài khoản để mua sắm nhanh hơn và nhận nhiều ưu đãi hơn</p>
        </div>

        <Spin spinning={loading}>
          <Form
            form={form}
            name="register_form"
            onFinish={handleSubmit}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="Họ tên"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<MailOutlined className="site-form-item-icon" />}
                placeholder="Email"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined className="site-form-item-icon" />}
                placeholder="Số điện thoại"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Mật khẩu"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="passwordConfirm"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Xác nhận mật khẩu"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item className="agreement-container">
              <Checkbox checked={agreement} onChange={e => setAgreement(e.target.checked)}>
                Tôi đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="register-form-button" block loading={loading}>
                Đăng ký
              </Button>
            </Form.Item>

            <div className="login-now">
              Bạn đã có tài khoản? <Link to="/login">Đăng nhập ngay!</Link>
            </div>

            <Divider plain>Hoặc đăng ký với</Divider>

            <div className="social-login">
              <Button icon={<span className="icon-google" />} className="google-btn">
                Google
              </Button>
              <Button icon={<span className="icon-facebook" />} className="facebook-btn">
                Facebook
              </Button>
            </div>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default RegisterPage;