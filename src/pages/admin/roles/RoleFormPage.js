// src/pages/admin/roles/RoleFormPage.js - Sử dụng component bảng phân quyền
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Switch, Space, Typography, Row, Col, message, Divider } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import roleService from '../../../services/admin/roleService';
import PermissionTable from './PermissionTable';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RoleFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [permissionsData, setPermissionsData] = useState({ permissions: [], groupedPermissions: {} });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const isEdit = !!id;

  // Lấy danh sách quyền
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const response = await roleService.getAllPermissions();

        if (response.success) {
          setPermissionsData({
            permissions: response.data.permissions,
            groupedPermissions: response.data.groupedPermissions
          });
        } else {
          message.error('Không thể tải danh sách quyền');
        }
      } catch (error) {
        console.error('Lỗi khi tải quyền:', error);
        message.error('Đã xảy ra lỗi khi tải danh sách quyền');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Lấy thông tin vai trò nếu đang chỉnh sửa
  useEffect(() => {
    if (isEdit) {
      const fetchRoleDetail = async () => {
        try {
          setLoading(true);
          const response = await roleService.getRole(id);

          if (response.success) {
            const roleData = response.data;

            // Set form values
            form.setFieldsValue({
              name: roleData.name,
              description: roleData.description,
              isDefault: roleData.isDefault,
              status: roleData.status === 'active'
            });

            // Set selected permissions
            setSelectedPermissions(roleData.permissions || []);
          } else {
            message.error('Không thể tải thông tin vai trò');
            navigate('/admin/roles');
          }
        } catch (error) {
          console.error('Lỗi khi tải vai trò:', error);
          message.error('Đã xảy ra lỗi khi tải thông tin vai trò');
          navigate('/admin/roles');
        } finally {
          setLoading(false);
        }
      };

      fetchRoleDetail();
    }
  }, [id, isEdit, form, navigate]);

  // Xử lý thay đổi quyền được chọn
  const handlePermissionsChange = (newSelectedPermissions) => {
    setSelectedPermissions(newSelectedPermissions);
  };

  // Xử lý submit form
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Chuẩn bị dữ liệu
      const roleData = {
        name: values.name,
        description: values.description,
        permissions: selectedPermissions,
        isDefault: values.isDefault || false,
        status: values.status ? 'active' : 'inactive'
      };

      let response;
      if (isEdit) {
        response = await roleService.updateRole(id, roleData);
      } else {
        response = await roleService.createRole(roleData);
      }

      if (response.success) {
        message.success(response.message || (isEdit ? 'Cập nhật vai trò thành công' : 'Tạo vai trò thành công'));
        navigate('/admin/roles');
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Lỗi khi lưu vai trò:', error);
      message.error('Đã xảy ra lỗi khi lưu vai trò');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-form-page">
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3}>{isEdit ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}</Title>
          </Col>
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/roles')}
            >
              Quay lại
            </Button>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isDefault: false,
            status: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên vai trò"
                rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
              >
                <Input placeholder="Nhập tên vai trò" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="status"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Hoạt động"
                  unCheckedChildren="Vô hiệu"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Nhập mô tả vai trò" />
          </Form.Item>

          <Form.Item
            name="isDefault"
            valuePropName="checked"
            label="Vai trò mặc định"
            tooltip="Vai trò mặc định sẽ được gán cho người dùng mới khi không chỉ định vai trò"
          >
            <Switch
              checkedChildren="Có"
              unCheckedChildren="Không"
            />
          </Form.Item>

          <Divider orientation="left">Quyền hệ thống</Divider>
          <div className="permissions-section">
            <Text>Chọn các quyền mà vai trò này có thể thực hiện</Text>

            <div style={{ marginTop: 16 }}>
              <PermissionTable
                permissions={permissionsData.permissions}
                groupedPermissions={permissionsData.groupedPermissions}
                selectedPermissions={selectedPermissions}
                onChange={handlePermissionsChange}
              />
            </div>
          </div>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                {isEdit ? 'Cập nhật' : 'Lưu vai trò'}
              </Button>
              <Button onClick={() => navigate('/admin/roles')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RoleFormPage;