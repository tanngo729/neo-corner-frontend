import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import './ShippingAddressForm.scss';

const { Option } = Select;
const { TextArea } = Input;

const ShippingAddressForm = ({ initialValues = {}, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

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

  // Danh sách phường/xã mẫu cho TP Kon Tum
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
    // Nếu cần các phường/xã của các huyện khác, có thể thêm sau
    dak_ha: [
      { value: 'dak_ha', label: 'Thị trấn Đắk Hà' },
      { value: 'dak_pxi', label: 'Xã Đắk PXi' }
    ]
  };

  useEffect(() => {
    // Thiết lập mặc định thành phố là Kon Tum
    form.setFieldsValue({
      ...initialValues,
      city: 'Kon Tum'
    });

    // Nếu có district được chọn, cập nhật wards tương ứng
    if (initialValues.district) {
      const districtValue = kontumDistricts.find(d => d.label === initialValues.district)?.value;
      if (districtValue && kontumWards[districtValue]) {
        setWards(kontumWards[districtValue]);
      }
    }
    // Cài đặt danh sách districts cố định cho Kon Tum
    setDistricts(kontumDistricts);
  }, [form, initialValues]);

  // Khi thay đổi district, reset ward và cập nhật danh sách wards
  const handleDistrictChange = (value) => {
    form.setFieldsValue({ ward: undefined });
    if (kontumWards[value]) {
      setWards(kontumWards[value]);
    } else {
      setWards([]);
    }
  };

  const handleSubmit = (values) => {
    const formData = {
      ...values,
      city: 'Kon Tum'
    };
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ city: 'Kon Tum', ...initialValues }}
      className="shipping-address-form"
    >
      <div className="form-row">
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          className="form-col"
        >
          <Input placeholder="Nhập họ và tên người nhận" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' }
          ]}
          className="form-col"
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>
      </div>

      <Form.Item
        name="email"
        label="Email"
        rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
      >
        <Input placeholder="Nhập email (không bắt buộc)" />
      </Form.Item>

      <Form.Item
        name="city"
        label={
          <span>
            Tỉnh/Thành phố
            <Tooltip title="Hiện tại chỉ hỗ trợ giao hàng tại Kon Tum">
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          </span>
        }
      >
        <Input disabled defaultValue="Kon Tum" />
      </Form.Item>

      <div className="form-row">
        <Form.Item
          name="district"
          label="Quận/Huyện"
          rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
          className="form-col"
        >
          <Select
            placeholder="Chọn quận/huyện"
            onChange={handleDistrictChange}
            options={districts}
          />
        </Form.Item>

        <Form.Item
          name="ward"
          label="Phường/Xã"
          rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
          className="form-col"
        >
          <Select
            placeholder="Chọn phường/xã"
            options={wards}
            disabled={!form.getFieldValue('district')}
          />
        </Form.Item>
      </div>

      <Form.Item
        name="street"
        label="Địa chỉ cụ thể"
        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể' }]}
      >
        <Input placeholder="Số nhà, tên đường..." />
      </Form.Item>

      <Form.Item name="notes" label="Ghi chú">
        <TextArea
          placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng hoặc địa chỉ chi tiết"
          rows={3}
        />
      </Form.Item>

      {onSubmit && (
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Lưu địa chỉ
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default ShippingAddressForm;
