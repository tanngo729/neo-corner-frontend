// src/layouts/ClientLayout/components/Topbar.js - Updated
import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { PhoneOutlined, MailOutlined, CarOutlined, HeartOutlined } from '@ant-design/icons';
import CustomButton from '../../../components/common/buttoncustom/CustomButton';
import '../styles/Topbar.scss';

const Topbar = forwardRef(({ wishlistCount = 0, className = '' }, ref) => {
  return (
    <div className={`topbar ${className}`} ref={ref}>
      <div className="container topbar-container">
        <div className="topbar-left">
          <span><PhoneOutlined className="topbar-icon" /> (028) 1234 5678</span>
          <span className="hidden-xs"><MailOutlined className="topbar-icon" /> info@shoponline.com</span>
        </div>
        <div className="topbar-right">
          <Link to="/track-order">
            <CustomButton
              type="text"
              className="topbar-btn"
              icon={<CarOutlined />}
            >
              Tra cứu đơn hàng
            </CustomButton>
          </Link>
          <Link to="/wishlist">
            <CustomButton
              type="text"
              className="topbar-btn"
              icon={<HeartOutlined />}
            >
              Yêu thích ({wishlistCount})
            </CustomButton>
          </Link>
        </div>
      </div>
    </div>
  );
});

export default Topbar;