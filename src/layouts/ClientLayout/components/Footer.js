// src/layouts/ClientLayout/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layout,
  Typography,
  Divider,
  Row,
  Col
} from 'antd';
import {
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import CustomButton from '../../../components/common/buttoncustom/CustomButton';
import '../styles/Footer.scss';

const { Footer: AntFooter } = Layout;
const { Text, Title } = Typography;

const Footer = () => {
  return (
    <AntFooter className="app-footer">
      <div className="container">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="footer-title">NEO CORNER</Title>
            <Text className="footer-text">
              Cung cấp các sản phẩm chất lượng với giá cả phải chăng.
              Chúng tôi cam kết mang đến trải nghiệm mua sắm tốt nhất.
            </Text>
            <div className="social-links">
              <CustomButton type="text" className="social-btn" icon={<FacebookOutlined />} />
              <CustomButton type="text" className="social-btn" icon={<InstagramOutlined />} />
              <CustomButton type="text" className="social-btn" icon={<TwitterOutlined />} />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="footer-title">Danh mục</Title>
            <ul className="footer-links">
              <li><Link to="/products?category=1">Món chính</Link></li>
              <li><Link to="/products?category=2">Món ăn vặt</Link></li>
              <li><Link to="/products?category=3">Nước uống</Link></li>
              <li><Link to="/products?category=4">Tráng miệng</Link></li>
            </ul>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="footer-title">Liên kết</Title>
            <ul className="footer-links">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/products">Sản phẩm</Link></li>
              <li><Link to="/about-us">Về chúng tôi</Link></li>
              <li><Link to="/contact">Liên hệ</Link></li>
            </ul>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="footer-title">Thông tin liên hệ</Title>
            <div className="contact-info">
              <p><EnvironmentOutlined className="contact-icon" />123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
              <p><PhoneOutlined className="contact-icon" />(028) 1234 5678</p>
              <p><MailOutlined className="contact-icon" />info@shoponline.com</p>
              <p><ClockCircleOutlined className="contact-icon" />08:00 - 22:00, Thứ Hai - Chủ Nhật</p>
            </div>
          </Col>
        </Row>

        <Divider className="footer-divider" />

        <div className="footer-bottom">
          <div className="copyright">
            <Text>© {new Date().getFullYear()} NEO CORNER. Tất cả các quyền được bảo lưu.</Text>
          </div>
          <div className="payment-methods">
            <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="Visa" />
            <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="MasterCard" />
            <img src="https://cdn-icons-png.flaticon.com/512/196/196539.png" alt="PayPal" />
            <img src="https://cdn-icons-png.flaticon.com/512/6124/6124998.png" alt="Momo" />
          </div>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;