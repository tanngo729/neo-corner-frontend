import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Row, Col, Avatar, Space, Typography, Card } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { useAdminAuth } from '../../../../contexts/AdminAuthContext';
import { profileService } from '../../../../services/admin';
import EnhancedImageUpload from '../../../../components/common/EnhancedImageUpload';

const { Title, Text } = Typography;

const ProfileInfoTab = ({ user: propUser }) => {
  const [form] = Form.useForm();
  const { user: contextUser, updateUser } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Use user from props if available, otherwise use from context
  const user = propUser || contextUser;

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
      });

      // If user has an avatar, display it (unless avatar was removed)
      if (user.avatar?.url && !avatarRemoved) {
        setAvatarUrl(user.avatar.url);

        // Initialize fileList once when component mounts
        if (fileList.length === 0) {
          setFileList([{
            uid: '-1',
            name: 'avatar.jpg',
            status: 'done',
            url: user.avatar.url,
            isUrl: true
          }]);
        }
      }
    }
  }, [user, form, avatarRemoved]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const { fullName, email } = values;

      // Create FormData for submission
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);

      // If user wants to remove avatar
      if (avatarRemoved) {
        formData.append('removeAvatar', 'true');
      }
      // Add new avatar if available
      else if (avatarFile) {
        if (avatarFile instanceof File) {
          formData.append('avatar', avatarFile);
        } else if (typeof avatarFile === 'string') {
          formData.append('avatarUrl', avatarFile);
        }
      }

      const response = await profileService.updateProfile(formData);

      if (response.success) {
        message.success('Cập nhật thông tin cá nhân thành công');
        updateUser(response.data);

        // Update avatar URL if available
        if (response.data.avatar?.url) {
          setAvatarUrl(response.data.avatar.url);
          setAvatarRemoved(false);
          setAvatarFile(null);
          setFileList([{
            uid: '-1',
            name: 'avatar.jpg',
            status: 'done',
            url: response.data.avatar.url,
            isUrl: true
          }]);
        } else {
          setAvatarUrl('');
          setAvatarFile(null);
          setFileList([]);
        }
      } else {
        message.error(response.message || 'Cập nhật thông tin thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      message.error('Cập nhật thông tin thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Sửa hàm xử lý thay đổi avatar
  const handleAvatarChange = (info) => {
    console.log('Avatar change info:', info);

    // Xử lý khi file được xóa
    if (info.file && info.file.status === 'removed') {
      console.log('Avatar removed');
      setAvatarFile(null);
      setAvatarUrl('');
      setAvatarRemoved(true);
      setFileList([]);
      return;
    }

    // Nhận fileList từ event
    let newFileList = [];
    if (info.fileList) {
      newFileList = [...info.fileList];
    } else if (Array.isArray(info)) {
      newFileList = [...info];
    } else {
      console.warn('Định dạng dữ liệu không được hỗ trợ:', info);
      return;
    }

    // Nếu không có file, xử lý như xóa avatar
    if (!newFileList || newFileList.length === 0) {
      setAvatarFile(null);
      setAvatarUrl('');
      setAvatarRemoved(true);
      setFileList([]);
      return;
    }

    // Lấy file cuối cùng (trong trường hợp có nhiều file)
    const file = newFileList[newFileList.length - 1];

    // Đảm bảo file tồn tại
    if (!file) return;

    setAvatarRemoved(false);
    setFileList(newFileList);

    // Xử lý an toàn file object hoặc URL
    if (file.originFileObj) {
      setAvatarFile(file.originFileObj);
      // Tạo URL preview
      const objectUrl = URL.createObjectURL(file.originFileObj);
      setAvatarUrl(objectUrl);
    } else if (file.url) {
      setAvatarFile(file.url);
      setAvatarUrl(file.url);
    }
  };

  return (
    <div className="profile-info-tab">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8} lg={6}>
          <Card bordered={false} className="avatar-card">
            <div className="avatar-container">
              <div className="avatar-wrapper">
                {avatarUrl && !avatarRemoved ? (
                  <Avatar
                    src={avatarUrl}
                    size={150}
                    className="user-avatar"
                  />
                ) : (
                  <Avatar
                    icon={<UserOutlined />}
                    size={150}
                    className="default-avatar"
                  />
                )}
              </div>

              <div className="user-info">
                <Title level={4}>{user?.fullName || 'Tên người dùng'}</Title>
                <Text type="secondary">{user?.email || 'email@example.com'}</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="profile-form"
            encType="multipart/form-data" // Quan trọng cho việc upload file
          >
            <Form.Item
              label="Ảnh đại diện"
              name="avatar"
              tooltip="Hỗ trợ file JPG, PNG có kích thước tối đa 2MB"
              className="avatar-upload-item"
            >
              <EnhancedImageUpload
                fileList={fileList}
                onChange={handleAvatarChange}
                maxCount={1}
                listType="picture"
                initialImage={user?.avatar?.url}
                avatarRemoved={avatarRemoved} // Truyền trạng thái avatar đã bị xóa
              />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[
                { required: true, message: 'Vui lòng nhập họ tên!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập họ tên của bạn"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không đúng định dạng!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Nhập địa chỉ email"
              />
            </Form.Item>

            <Form.Item className="form-actions">
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Cập nhật thông tin
                </Button>
                <Button onClick={() => {
                  form.resetFields();

                  // Reset avatar state
                  setAvatarRemoved(false);
                  setAvatarFile(null);

                  // Reset fileList và avatarUrl về trạng thái ban đầu
                  if (user?.avatar?.url) {
                    setAvatarUrl(user.avatar.url);
                    setFileList([{
                      uid: '-1',
                      name: 'avatar.jpg',
                      status: 'done',
                      url: user.avatar.url,
                      isUrl: true
                    }]);
                  } else {
                    setAvatarUrl('');
                    setFileList([]);
                  }
                }}>
                  Hủy thay đổi
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default ProfileInfoTab;