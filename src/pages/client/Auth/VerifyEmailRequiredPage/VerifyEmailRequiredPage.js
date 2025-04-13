import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Result, Alert, message, Spin } from 'antd';
import { MailOutlined, ReloadOutlined } from '@ant-design/icons';
import { authService } from '../../../../services/client';
import { useAuth } from '../../../../contexts/AuthContext';
import './VerifyEmailRequiredPage.scss';

const VerifyEmailRequiredPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const response = await authService.resendVerificationEmail();

      if (response && response.data && response.data.success) {
        message.success('Email xác thực đã được gửi lại thành công!');
        setResendSuccess(true);
      } else {
        message.error(response?.data?.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);

      if (error.response && error.response.status === 400 && error.response.data.message.includes('đã được xác thực')) {
        message.info('Email của bạn đã được xác thực!');
        setTimeout(() => navigate('/'), 2000);
      } else {
        message.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-required-container">
      <div className="verify-email-required-box">
        <Spin spinning={loading}>
          <Result
            icon={<MailOutlined className="email-icon" />}
            title="Xác thực email của bạn"
            subTitle={
              <div className="email-message">
                <p>Chúng tôi đã gửi email xác thực đến <strong>{user?.email}</strong></p>
                <p>Vui lòng kiểm tra hộp thư đến (và thư mục spam) và nhấp vào liên kết xác thực để kích hoạt tài khoản của bạn.</p>
              </div>
            }
            extra={
              <>
                {resendSuccess && (
                  <Alert
                    message="Email xác thực đã được gửi lại!"
                    description="Vui lòng kiểm tra hộp thư đến và thư mục spam của bạn."
                    type="success"
                    showIcon
                    style={{ marginBottom: 20 }}
                  />
                )}

                <div className="action-buttons">
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleResendVerification}
                    loading={loading}
                    className="resend-button"
                  >
                    Gửi lại email xác thực
                  </Button>

                  <Button onClick={() => navigate('/')}>
                    Về trang chủ
                  </Button>
                </div>
              </>
            }
          />
        </Spin>
      </div>
    </div>
  );
};

export default VerifyEmailRequiredPage;