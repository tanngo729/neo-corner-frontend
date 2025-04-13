import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Result, Spin } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { authService } from '../../../../services/client';
import CustomButton from '../../../../components/common/buttoncustom/CustomButton';
import './VerifyEmailPage.scss';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmail(token);

        if (response && response.data && response.data.success) {
          navigate('/verify-success');
        } else {
          setError('Không thể xác thực email. Vui lòng thử lại.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setError(error.response?.data?.message || 'Lỗi xác thực email');
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="verify-email-loading">
        <Spin size="large" tip="Đang xác thực email của bạn..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="verify-email-container">
        <Result
          status="error"
          icon={<CloseCircleFilled className="error-icon" />}
          title="Xác thực email thất bại"
          subTitle={error}
          extra={[
            <CustomButton
              key="register"
              type="outline-danger"
              onClick={() => navigate('/register')}
            >
              Đăng ký lại
            </CustomButton>,
            <CustomButton
              key="home"
              type="primary"
              onClick={() => navigate('/')}
            >
              Về trang chủ
            </CustomButton>
          ]}
        />
      </div>
    );
  }

  return null;
};

export default VerifyEmailPage;