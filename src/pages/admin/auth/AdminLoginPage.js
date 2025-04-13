import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, Spin, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import './AdminLoginPage.scss';

const AdminLoginPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAdminAuth();
  const [loginError, setLoginError] = useState('');
  const [submitCount, setSubmitCount] = useState(0);

  // Tham chiếu tới form container DOM element (không phải Form instance)
  const formContainerRef = useRef(null);

  // Lấy redirect path nếu có
  const from = location.state?.from?.pathname || '/admin';

  // Kiểm tra nếu người dùng đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Tắt tính năng autofill của Chrome
  useEffect(() => {
    try {
      // Đảm bảo formContainerRef đã được gán giá trị
      if (!formContainerRef.current) return;

      // Tìm phần tử form DOM thực tế trong container
      const formElement = formContainerRef.current.querySelector('form');

      if (formElement) {
        // Thiết lập autocomplete=off cho form
        formElement.setAttribute('autocomplete', 'off');

        // Tìm các input và thiết lập autocomplete=off
        const inputs = formElement.querySelectorAll('input');
        inputs.forEach(input => {
          input.setAttribute('autocomplete', 'off');
        });

        // Thêm trường input ẩn để đánh lừa Chrome
        const hiddenInputElement = document.createElement('input');
        hiddenInputElement.type = 'text';
        hiddenInputElement.style.display = 'none';
        hiddenInputElement.name = 'chrome-prevent-autofill';
        hiddenInputElement.setAttribute('autocomplete', 'username');
        formElement.appendChild(hiddenInputElement);

        // Cleanup function
        return () => {
          if (formElement && hiddenInputElement && formElement.contains(hiddenInputElement)) {
            formElement.removeChild(hiddenInputElement);
          }
        };
      }
    } catch (error) {
      console.error('Error setting form attributes:', error);
    }
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoginError(''); // Xóa thông báo lỗi trước đó
      setSubmitCount(prev => prev + 1);

      // Disable form autofill khi submit thành công - cần DOM thực tế
      try {
        if (formContainerRef.current) {
          const formElement = formContainerRef.current.querySelector('form');
          if (formElement) {
            const inputs = formElement.querySelectorAll('input');
            inputs.forEach(input => {
              if (input.type !== 'hidden') {
                input.setAttribute('readonly', true);
                setTimeout(() => {
                  input.removeAttribute('readonly');
                }, 100);
              }
            });
          }
        }
      } catch (e) {
        console.error('Error handling form inputs:', e);
      }

      // Rename email field to username for backend compatibility
      const loginData = {
        username: values.username,
        password: values.password,
        remember: values.remember
      };

      const success = await login(loginData);

      if (success) {
        message.success('Đăng nhập thành công!');
        // Chuyển hướng sau khi đăng nhập thành công
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      // Hiển thị lỗi trong component thay vì message toàn cục
      setLoginError(
        error.response?.data?.message ||
        'Đăng nhập thất bại. Tên đăng nhập hoặc mật khẩu không đúng.'
      );
    }
  };

  return (
    <div className="admin-login-container">
      <Card className="admin-login-card">
        <div className="admin-login-header">
          <h1>Quản trị hệ thống</h1>
          <h3>Đăng nhập</h3>
        </div>

        <Spin spinning={loading}>
          {loginError && (
            <Alert
              message="Lỗi đăng nhập"
              description={loginError}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
              closable
              onClose={() => setLoginError('')}
            />
          )}

          {/* Form container div - dùng để truy cập DOM thực tế */}
          <div ref={formContainerRef}>
            <Form
              form={form}
              name="admin_login"
              initialValues={{ remember: true }}
              onFinish={handleSubmit}
              size="large"
              key={`login-form-${submitCount}`} // Force re-render form to avoid autofill
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập hoặc email!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Tên đăng nhập hoặc Email"
                  autoComplete="off" // Tắt autofill của Chrome
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu"
                  autoComplete="off" // Tắt autofill của Chrome
                />
              </Form.Item>

              <Form.Item>
                <div className="admin-login-options">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                  </Form.Item>

                  <a className="admin-login-forgot" href="/admin/forgot-password">
                    Quên mật khẩu?
                  </a>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="admin-login-button"
                  block
                  loading={loading}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Spin>
      </Card>
    </div>
  );
};

export default AdminLoginPage;