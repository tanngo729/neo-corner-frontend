// src/pages/admin/profile/ChangePasswordTab.js
import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import profileService from '../../../../services/admin/profileService';

const ChangePasswordTab = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const { currentPassword, newPassword } = values;

      const response = await profileService.changePassword({
        currentPassword,
        newPassword
      });

      if (response.success) {
        message.success('Đổi mật khẩu thành công');
        form.resetFields();
      } else {
        message.error(response.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      message.error('Đổi mật khẩu thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-tab">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu hiện tại"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu mới"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Xác nhận mật khẩu mới"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Đổi mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ChangePasswordTab;