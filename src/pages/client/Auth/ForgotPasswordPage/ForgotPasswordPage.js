import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, message, Spin, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { authService } from '../../../../services/client';
import './ForgotPasswordPage.scss';

const ForgotPasswordPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setEmail(values.email);

      const response = await authService.requestPasswordReset(values.email);

      if (response && response.data && response.data.success) {
        message.success('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn');
        setSuccess(true);
      } else {
        message.error(response?.data?.message || 'Yêu cầu đặt lại mật khẩu thất bại, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Forgot password error:', error);

      // API trả về thông báo thành công ngay cả khi email không tồn tại (vì lý do bảo mật)
      // nên ở đây ta vẫn hiển thị thành công
      if (error.response && error.response.status === 200) {
        message.success('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn (nếu tồn tại)');
        setSuccess(true);
      } else {
        message.error('Lỗi hệ thống, vui lòng thử lại sau');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-page-container">
        <div className="forgot-password-box">
          <Result
            status="success"
            title="Yêu cầu đặt lại mật khẩu đã được gửi!"
            subTitle={
              <div className="success-message">
                <p>Chúng tôi đã gửi email đến <strong>{email}</strong> với hướng dẫn để đặt lại mật khẩu của bạn.</p>
                <p>Vui lòng kiểm tra hộp thư đến (và thư mục spam) để tiếp tục.</p>
              </div>
            }
            extra={[
              <Button type="primary" key="login" onClick={() => window.location.href = '/login'}>
                Quay lại đăng nhập
              </Button>,
              <Button key="home" onClick={() => window.location.href = '/'}>
                Về trang chủ
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page-container">
      <div className="forgot-password-box">
        <div className="forgot-password-header">
          <h2>Quên mật khẩu?</h2>
          <p>Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu</p>
        </div>

        <Spin spinning={loading}>
          <Form
            form={form}
            name="forgot_password_form"
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
                prefix={<MailOutlined className="site-form-item-icon" />}
                placeholder="Email"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="forgot-password-form-button" block loading={loading}>
                Gửi yêu cầu
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

export default ForgotPasswordPage;