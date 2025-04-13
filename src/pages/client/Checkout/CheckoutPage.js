// src/pages/client/Checkout/CheckoutPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Steps, Button, Form, Input, Select, Row, Col, Card, Divider, Spin, message } from 'antd';
import { HomeOutlined, CreditCardOutlined, ShoppingCartOutlined, CheckOutlined } from '@ant-design/icons';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import PaymentMethodSelector from '../../../components/client/checkout/PaymentMethodSelector';
import ShippingMethodSelector from '../../../components/client/checkout/ShippingMethodSelector';
import OrderSummary from '../../../components/client/checkout/OrderSummary';
import { paymentService, checkoutService } from '../../../services/client';
import './CheckoutPage.scss';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cart, loading: cartLoading, fetchCart } = useCart();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('COD');
  const [selectedShipping, setSelectedShipping] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [shippingFee, setShippingFee] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Danh sách quận/huyện Kon Tum
  const kontumDistricts = [
    { value: 'tp_kontum', label: 'Thành phố Kon Tum' },
    { value: 'dak_glei', label: 'Huyện Đắk Glei' },
    { value: 'ngoc_hoi', label: 'Huyện Ngọc Hồi' },
    { value: 'dak_to', label: 'Huyện Đắk Tô' },
    { value: 'kon_plong', label: 'Huyện Kon Plông' },
    { value: 'kon_ray', label: 'Huyện Kon Rẫy' },
    { value: 'dak_ha', label: 'Huyện Đắk Hà' },
    { value: 'sa_thay', label: 'Huyện Sa Thầy' },
    { value: 'tu_mo_rong', label: 'Huyện Tu Mơ Rông' },
    { value: 'ia_h_drai', label: 'Huyện Ia H\' Drai' }
  ];

  // Danh sách phường/xã cho từng quận/huyện
  const kontumWards = {
    tp_kontum: [
      { value: 'quang_trung', label: 'Phường Quang Trung' },
      { value: 'thong_nhat', label: 'Phường Thống Nhất' },
      { value: 'duy_tan', label: 'Phường Duy Tân' },
      { value: 'quyet_thang', label: 'Phường Quyết Thắng' },
      { value: 'le_loi', label: 'Phường Lê Lợi' },
      { value: 'nguyen_trai', label: 'Phường Nguyễn Trãi' },
      { value: 'tran_hung_dao', label: 'Phường Trần Hưng Đạo' },
      { value: 'thang_loi', label: 'Phường Thắng Lợi' },
      { value: 'ngok_bay', label: 'Phường Ngô Mây' },
      { value: 'thuy_ba', label: 'Xã Ia Chim' },
      { value: 'dak_cam', label: 'Xã Đắk Cấm' },
      { value: 'dak_blom', label: 'Xã Đắk Blà' },
      { value: 'chu_hrenh', label: 'Xã Chư Hreng' },
      { value: 'doan_ket', label: 'Xã Đoàn Kết' },
      { value: 'nguyen_vien', label: 'Xã Ia Chim' },
      { value: 'vinh_quang', label: 'Xã Vinh Quang' },
      { value: 'dak_roe', label: 'Xã Đắk Rơ Wa' },
      { value: 'hoa_binh', label: 'Xã Hòa Bình' }
    ],
    dak_ha: [
      { value: 'dak_ha', label: 'Thị trấn Đắk Hà' },
      { value: 'dak_pxi', label: 'Xã Đắk PXi' }
    ]
    // Thêm các phường/xã cho các huyện khác nếu cần
  };

  // Khi thay đổi quận/huyện, cập nhật danh sách phường/xã
  const handleDistrictChange = (value) => {
    form.setFieldsValue({ ward: undefined });
    if (kontumWards[value]) {
      setWards(kontumWards[value]);
    } else {
      setWards([]);
    }
  };

  // Fetch cart, payment and shipping methods
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }

    const initCheckout = async () => {
      setLoading(true);
      try {
        // Reload cart
        await fetchCart();

        // Fetch payment methods
        const paymentResponse = await paymentService.getPaymentMethods();
        if (paymentResponse?.data?.success) {
          setPaymentMethods(paymentResponse.data.data);
          // Select COD by default or first available method
          const defaultMethod = paymentResponse.data.data.find(m => m.code === 'COD') || paymentResponse.data.data[0];
          if (defaultMethod) {
            setSelectedPayment(defaultMethod.code);
          }
        }

        // Fetch shipping methods
        const shippingResponse = await checkoutService.getShippingMethods();
        if (shippingResponse?.data?.success) {
          setShippingMethods(shippingResponse.data.data);
          // Select the first shipping method by default
          if (shippingResponse.data.data.length > 0) {
            setSelectedShipping(shippingResponse.data.data[0].code);
          }
        }

        // Pre-fill user data
        if (user) {
          form.setFieldsValue({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            address: {
              street: user.address?.street || '',
              ward: user.address?.ward || '',
              district: user.address?.district || '',
              city: 'Kon Tum'
            }
          });

          // Nếu có district từ thông tin user, cập nhật danh sách wards
          if (user.address?.district) {
            const districtValue = kontumDistricts.find(d => d.label === user.address.district)?.value;
            if (districtValue && kontumWards[districtValue]) {
              setWards(kontumWards[districtValue]);
            }
          }
        }

        // Thiết lập danh sách quận/huyện
        setDistricts(kontumDistricts);
      } catch (error) {
        console.error('Failed to initialize checkout:', error);
        message.error('Không thể tải thông tin thanh toán');
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [isAuthenticated, navigate, fetchCart, user, form]);

  // Calculate shipping fee whenever shipping method or cart changes
  useEffect(() => {
    const calculateShipping = async () => {
      if (!selectedShipping || !cart || !cart.items || cart.items.length === 0) return;

      try {
        const city = form.getFieldValue(['address', 'city']);
        let regionCode = null;

        if (city) {
          // Map city name to region code
          if (city === 'Kon Tum') regionCode = 'KT';
        }

        const response = await checkoutService.calculateShippingFee({
          shippingMethodCode: selectedShipping,
          regionCode,
          orderTotal: cart.subtotal
        });

        if (response?.data?.success) {
          setShippingFee(response.data.data.shippingFee);
        }
      } catch (error) {
        console.error('Error calculating shipping fee:', error);
      }
    };

    calculateShipping();
  }, [selectedShipping, cart, form]);

  // Calculate order total
  useEffect(() => {
    if (cart) {
      const subtotal = cart.subtotal || 0;
      const discount = cart.couponDiscount || 0;
      const total = subtotal + shippingFee - discount;
      setOrderTotal(total);
    }
  }, [cart, shippingFee]);

  // Navigate between steps
  const next = async () => {
    try {
      if (currentStep === 0) {
        // Validate shipping info
        await form.validateFields([
          'fullName', 'email', 'phone',
          ['address', 'street'], ['address', 'ward'],
          ['address', 'district'], ['address', 'city']
        ]);

        // Validate shipping method
        if (!selectedShipping) {
          setErrors({ shipping: 'Vui lòng chọn phương thức vận chuyển' });
          return;
        }

        setErrors({});
        setCurrentStep(1);
      } else if (currentStep === 1) {
        // Validate payment method
        if (!selectedPayment) {
          setErrors({ payment: 'Vui lòng chọn phương thức thanh toán' });
          return;
        }
        setErrors({});
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  // Handle shipping method selection
  const handleShippingMethodChange = (method) => {
    setSelectedShipping(method);
    setErrors({ ...errors, shipping: null });
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setSelectedPayment(method);
    setErrors({ ...errors, payment: null });
  };

  // Place order
  const handlePlaceOrder = async () => {
    try {
      setLoading(true);

      // Lấy dữ liệu form
      const formValues = form.getFieldsValue(true);

      // Lấy nhãn thay vì giá trị của district và ward
      const selectedDistrict = kontumDistricts.find(d => d.value === formValues.address.district)?.label || formValues.address.district;
      const selectedWard = wards.find(w => w.value === formValues.address.ward)?.label || formValues.address.ward;

      // Chuẩn bị dữ liệu đơn hàng
      const orderPayload = {
        shippingAddress: {
          fullName: formValues.fullName,
          email: formValues.email,
          phone: formValues.phone,
          street: formValues.address.street,
          ward: selectedWard,
          district: selectedDistrict,
          city: formValues.address.city
        },
        paymentMethod: selectedPayment,
        shippingMethod: selectedShipping,
        notes: formValues.notes || ''
      };

      console.log('Đang tạo đơn hàng với dữ liệu:', orderPayload);

      // Tạo đơn hàng
      const response = await checkoutService.createOrder(orderPayload);

      if (response?.data?.success) {
        const order = response.data.data.order;
        console.log('Đơn hàng đã được tạo:', order);

        if (selectedPayment === 'COD' || selectedPayment === 'BANK_TRANSFER') {
          // Với COD/BANK_TRANSFER: đơn hàng đã được xử lý xong, chuyển đến trang kết quả
          message.success('Đơn hàng đã được tạo thành công!');
          navigate(`/payment/result?orderCode=${order.orderCode}`);
        } else if (selectedPayment === 'MOMO' || selectedPayment === 'VNPAY') {
          // Với MOMO/VNPAY: cần tạo URL thanh toán
          try {
            console.log(`Đang tạo URL thanh toán ${selectedPayment} cho đơn hàng:`, order.orderCode);

            let paymentRes;
            if (selectedPayment === 'MOMO') {
              paymentRes = await paymentService.createMomoPayment({
                orderCode: order.orderCode
              });
            } else if (selectedPayment === 'VNPAY') {
              paymentRes = await paymentService.createVnpayPayment({
                orderCode: order.orderCode
              });
            }

            if (paymentRes?.data?.success && paymentRes.data.data.paymentUrl) {
              console.log(`URL thanh toán ${selectedPayment} đã được tạo:`, paymentRes.data.data.paymentUrl);
              // Chuyển đến trang thanh toán
              window.location.href = paymentRes.data.data.paymentUrl;
            } else {
              console.error('Không thể tạo URL thanh toán:', paymentRes?.data?.message || 'Không có dữ liệu phản hồi');
              throw new Error('Không thể tạo URL thanh toán');
            }
          } catch (paymentError) {
            console.error('Lỗi tạo URL thanh toán:', paymentError);
            message.error('Không thể tạo URL thanh toán. Vui lòng thử lại sau.');
            // Chuyển hướng đến trang kết quả với thông báo lỗi
            navigate(`/payment/result?orderCode=${order.orderCode}&status=error&message=Không thể tạo URL thanh toán`);
          }
        }
      } else {
        throw new Error(response?.data?.message || 'Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      message.error('Không thể đặt hàng: ' + (error.message || 'Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount).replace('₫', 'đ');
  };

  // Render steps
  const steps = [
    {
      title: 'Thông tin giao hàng',
      icon: <HomeOutlined />,
      content: (
        <div className="shipping-section">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              fullName: '',
              email: '',
              phone: '',
              address: {
                street: '',
                ward: '',
                district: '',
                city: 'Kon Tum'
              }
            }}
          >
            <h3 className="section-title">Thông tin giao hàng</h3>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fullName"
                  label="Họ tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input placeholder="Nhập họ tên người nhận" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' }
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input placeholder="Nhập email" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name={['address', 'district']}
                  label="Quận/Huyện"
                  rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
                >
                  <Select
                    placeholder="Chọn quận/huyện"
                    onChange={handleDistrictChange}
                    options={districts}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name={['address', 'ward']}
                  label="Phường/Xã"
                  rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                >
                  <Select
                    placeholder="Chọn phường/xã"
                    options={wards}
                    disabled={!form.getFieldValue(['address', 'district'])}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name={['address', 'city']}
                  label="Tỉnh/Thành phố"
                  initialValue="Kon Tum"
                  rules={[{ required: true }]}
                >
                  <Input disabled defaultValue="Kon Tum" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name={['address', 'street']}
                  label="Địa chỉ"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                >
                  <Input placeholder="Số nhà, tên đường" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="notes" label="Ghi chú">
                  <TextArea
                    placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng hoặc địa điểm giao hàng chi tiết hơn."
                    rows={4}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Divider style={{ margin: '24px 0' }} />

          <ShippingMethodSelector
            shippingMethods={shippingMethods}
            selectedMethod={selectedShipping}
            onChange={handleShippingMethodChange}
            loading={loading}
            error={errors.shipping}
          />
        </div>
      )
    },
    {
      title: 'Phương thức thanh toán',
      icon: <CreditCardOutlined />,
      content: (
        <PaymentMethodSelector
          paymentMethods={paymentMethods}
          selectedMethod={selectedPayment}
          onChange={handlePaymentMethodChange}
          loading={loading}
          error={errors.payment}
        />
      )
    },
    {
      title: 'Xác nhận đơn hàng',
      icon: <CheckOutlined />,
      content: (
        <div className="order-confirmation">
          <h3 className="section-title">Xác nhận đơn hàng</h3>

          <Card className="confirmation-card">
            <div className="confirmation-section">
              <h4>Thông tin giao hàng</h4>
              <div className="info-item">
                <span className="label">Họ tên:</span>
                <span className="value">{form.getFieldValue('fullName')}</span>
              </div>
              <div className="info-item">
                <span className="label">Số điện thoại:</span>
                <span className="value">{form.getFieldValue('phone')}</span>
              </div>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{form.getFieldValue('email')}</span>
              </div>
              <div className="info-item">
                <span className="label">Địa chỉ:</span>
                <span className="value">
                  {form.getFieldValue(['address', 'street'])}, {' '}
                  {wards.find(w => w.value === form.getFieldValue(['address', 'ward']))?.label || form.getFieldValue(['address', 'ward'])}, {' '}
                  {districts.find(d => d.value === form.getFieldValue(['address', 'district']))?.label || form.getFieldValue(['address', 'district'])}, {' '}
                  {form.getFieldValue(['address', 'city'])}
                </span>
              </div>
              {form.getFieldValue('notes') && (
                <div className="info-item">
                  <span className="label">Ghi chú:</span>
                  <span className="value">{form.getFieldValue('notes')}</span>
                </div>
              )}
            </div>

            <Divider />

            <div className="confirmation-section">
              <h4>Phương thức vận chuyển</h4>
              <div className="shipping-method">
                {shippingMethods.find(m => m.code === selectedShipping)?.name || selectedShipping}
                {shippingFee > 0 && ` - ${formatCurrency(shippingFee)}`}
              </div>
            </div>

            <Divider />

            <div className="confirmation-section">
              <h4>Phương thức thanh toán</h4>
              <div className="payment-method">
                {paymentMethods.find(m => m.code === selectedPayment)?.name || selectedPayment}
              </div>
            </div>

            <Divider />

            <div className="confirmation-section">
              <h4>Thông tin đơn hàng</h4>
              <div className="order-items">
                {cart?.items?.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-quantity">{item.quantity}x</div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="order-totals">
                <div className="total-row">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(cart?.subtotal || 0)}</span>
                </div>

                <div className="total-row">
                  <span>Phí vận chuyển:</span>
                  <span>{formatCurrency(shippingFee)}</span>
                </div>

                {cart?.couponDiscount > 0 && (
                  <div className="total-row discount">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(cart?.couponDiscount || 0)}</span>
                  </div>
                )}

                <div className="total-row grand-total">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

  // Show loading
  if (cartLoading && !cart) {
    return (
      <div className="checkout-loading">
        <Spin size="large" />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  // Show empty cart message
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-page empty-cart">
        <div className="empty-cart-message">
          <ShoppingCartOutlined className="empty-icon" />
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Vui lòng thêm sản phẩm vào giỏ hàng để tiếp tục thanh toán</p>
          <Button type="primary" onClick={() => navigate('/products')}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="page-title">Thanh toán</h1>

        <Steps current={currentStep} className="checkout-steps">
          {steps.map(item => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>

        <div className="checkout-content">
          <Row gutter={24}>
            <Col xs={24} md={24} lg={16} className="checkout-main">
              <div className="steps-content">
                {steps[currentStep].content}
              </div>

              <div className="steps-action">
                {currentStep > 0 && (
                  <Button style={{ margin: '0 8px' }} onClick={prev} disabled={loading}>
                    Quay lại
                  </Button>
                )}

                {currentStep < steps.length - 1 && (
                  <Button type="primary" onClick={next} disabled={loading}>
                    Tiếp tục
                  </Button>
                )}

                {currentStep === steps.length - 1 && (
                  <Button
                    type="primary"
                    onClick={handlePlaceOrder}
                    loading={loading}
                  >
                    Đặt hàng
                  </Button>
                )}
              </div>
            </Col>

            <Col xs={24} md={24} lg={8} className="checkout-sidebar">
              <div className="order-summary-wrapper">
                <OrderSummary
                  cart={cart}
                  shippingFee={shippingFee}
                  orderTotal={orderTotal}
                />
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;