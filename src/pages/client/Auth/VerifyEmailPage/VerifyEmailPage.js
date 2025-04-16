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

        // Log toàn bộ response để debug
        console.log('Verify Email Full Response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        });

        // Kiểm tra nhiều điều kiện
        if (response.data && response.data.success) {
          // Nếu API trả về redirectUrl
          navigate('/verify-success');
          return;
        }

        // Nếu không thành công, hiển thị lỗi
        setError(response.data?.message || 'Không thể xác thực email');
        setLoading(false);
      } catch (error) {
        console.error('Email Verification Detailed Error:', error);

        // Log chi tiết lỗi
        if (error.response) {
          console.log('Error Response:', {
            data: error.response.data,
            status: error.response.status,
            headers: error.response.headers
          });
        }

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