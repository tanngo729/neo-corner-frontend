import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { CheckCircleFilled, ShoppingFilled, UserOutlined } from '@ant-design/icons';
import './VerifySuccessPage.scss';

const VerifySuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="verify-success-page-container">
      <div className="verify-success-box">
        <Result
          icon={<CheckCircleFilled className="success-icon" />}
          title="Xác Thực Email Thành Công!"
          subTitle={
            <div className="success-message">
              <p>Tài khoản của bạn đã được xác thực thành công.</p>
              <p>Bạn có thể tiếp tục mua sắm hoặc cập nhật thông tin tài khoản của mình.</p>
            </div>
          }
          extra={[
            <Button
              type="primary"
              key="shop"
              icon={<ShoppingFilled />}
              onClick={() => navigate('/products')}
              className="action-button"
            >
              Mua sắm ngay
            </Button>,
            <Button
              key="profile"
              icon={<UserOutlined />}
              onClick={() => navigate('/profile')}
              className="action-button"
            >
              Cập nhật tài khoản
            </Button>,
          ]}
        />
      </div>
    </div>
  );
};

export default VerifySuccessPage;