import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Spin, Result } from 'antd';
import { LockOutlined, SafetyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { authService } from '../../../../services/client';
import './ResetPasswordPage.scss';

const ResetPasswordPage = () => {
  const [form] = Form.useForm();
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Kiểm tra token có tồn tại không
  useEffect(() => {
    if (!token) {
      message.error('Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại.');
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Gọi API đặt lại mật khẩu
      const response = await authService.resetPassword(token, values.password);

      if (response && response.data && response.data.success) {
        message.success('Mật khẩu đã được đặt lại thành công!');
        setSuccess(true);
      } else {
        message.error(response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Reset password error:', error);

      if (error.response && error.response.data) {
        message.error(error.response.data.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      } else {
        message.error('Lỗi hệ thống, vui lòng thử lại sau');
      }

      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password-page-container">
        <div className="reset-password-box">
          <Result
            status="success"
            title="Mật khẩu đã được đặt lại thành công!"
            subTitle="Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ."
            extra={[
              <Button type="primary" key="login" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>,
              <Button key="home" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page-container">
        <div className="reset-password-box">
          <Result
            status="error"
            title="Token không hợp lệ hoặc đã hết hạn"
            subTitle="Vui lòng yêu cầu đặt lại mật khẩu mới."
            extra={[
              <Button type="primary" key="forgot" onClick={() => navigate('/forgot-password')}>
                Yêu cầu lại
              </Button>,
              <Button key="login" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page-container">
      <div className="reset-password-box">
        <div className="reset-password-header">
          <h2>Đặt lại mật khẩu</h2>
          <p>Vui lòng nhập mật khẩu mới của bạn</p>
        </div>

        <Spin spinning={loading}>
          <Form
            form={form}
            name="reset_password_form"
            onFinish={handleSubmit}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Mật khẩu mới"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
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
                prefix={<SafetyOutlined className="site-form-item-icon" />}
                placeholder="Xác nhận mật khẩu mới"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="reset-password-form-button" block loading={loading}>
                Đặt lại mật khẩu
              </Button>
            </Form.Item>

            <div className="back-to-login">
              <Link to="/login">
                <ArrowLeftOutlined /> Quay lại đăng nhập
              </Link>
            </div>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default ResetPasswordPage;