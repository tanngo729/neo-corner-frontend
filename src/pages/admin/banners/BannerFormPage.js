// src/pages/admin/banners/BannerFormPage.js
import React, { useEffect, useState } from 'react';
import { Form, Input, Switch, InputNumber, Select, Button, message, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import bannerService from '../../../services/admin/bannerService';

const { Option } = Select;

const BannerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await bannerService.getBannerById(id);
        const b = res?.data || res;
        form.setFieldsValue({
          title: b.title,
          description: b.description,
          buttonText: b.buttonText,
          buttonLink: b.buttonLink,
          position: b.position,
          isActive: b.isActive,
          displayOn: b.displayOn || ['home'],
          imageUrl: b.image?.url || '',
        });
      } catch (e) {
        message.error('Không tải được banner');
      }
    };
    load();
  }, [id]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      for (const [k, v] of Object.entries(values)) {
        if (k === 'displayOn' && Array.isArray(v)) {
          v.forEach(item => fd.append('displayOn[]', item));
        } else if (k === 'imageUrl') {
          if (v) fd.append('imageData', JSON.stringify({ url: v }));
        } else if (v !== undefined && v !== null) {
          fd.append(k, v);
        }
      }

      if (id) {
        await bannerService.updateBanner(id, fd);
        message.success('Cập nhật banner thành công');
      } else {
        await bannerService.createBanner(fd);
        message.success('Tạo banner thành công');
      }
      navigate('/admin/banners');
    } catch (e) {
      message.error('Lưu banner thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={id ? 'Sửa Banner' : 'Thêm Banner'}>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ isActive: true, displayOn: ['home'], position: 0 }}>
        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="buttonText" label="Nút - Text">
          <Input />
        </Form.Item>
        <Form.Item name="buttonLink" label="Nút - Link">
          <Input />
        </Form.Item>
        <Form.Item name="imageUrl" label="Ảnh (URL)">
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item name="position" label="Vị trí">
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item name="displayOn" label="Hiển thị ở">
          <Select mode="multiple" allowClear>
            <Option value="home">Home</Option>
            <Option value="all">All</Option>
            <Option value="products">Products</Option>
          </Select>
        </Form.Item>
        <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>{id ? 'Cập nhật' : 'Tạo mới'}</Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/admin/banners')}>Hủy</Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BannerFormPage;

