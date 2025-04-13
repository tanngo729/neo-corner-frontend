// src/pages/client/NotFoundPage.js
import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.scss';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn đang tìm kiếm không tồn tại."
        extra={
          <div className="not-found-actions">
            <Button type="primary" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
            <Button onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default NotFoundPage;