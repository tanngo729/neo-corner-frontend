import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Skeleton, message } from 'antd';
import { UserOutlined, LockOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileInfoTab from './tabs/ProfileInfoTab';
import ChangePasswordTab from './tabs/ChangePasswordTab';
import PreferencesTab from './tabs/PreferencesTab';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { profileService } from '../../../services/admin';

const { Title } = Typography;
const { TabPane } = Tabs;

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const { user, updateUser } = useAdminAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await profileService.getProfile();
        if (response && response.success) {
          updateUser(response.data);
        } else {
          message.error('Không thể tải thông tin người dùng');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin cá nhân:', error);
        message.error('Không thể tải thông tin cá nhân');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [updateUser]);

  // Set tab based on URL hash if available
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['info', 'password', 'preferences'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  // Update URL when tab changes
  const handleTabChange = (key) => {
    setActiveTab(key);
    navigate(`/admin/profile#${key}`, { replace: true });
  };

  return (
    <div className="profile-page-container">
      <Card
        className="profile-card"
        title={<Title level={3}>Thông tin cá nhân</Title>}
        loading={loading && !user}
      >
        {loading && !user ? (
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        ) : (
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane
              tab={<span><UserOutlined /> Thông tin cơ bản</span>}
              key="info"
            >
              <ProfileInfoTab user={user} />
            </TabPane>

            <TabPane
              tab={<span><LockOutlined /> Đổi mật khẩu</span>}
              key="password"
            >
              <ChangePasswordTab />
            </TabPane>

            <TabPane
              tab={<span><SettingOutlined /> Tùy chọn giao diện</span>}
              key="preferences"
            >
              <PreferencesTab />
            </TabPane>
          </Tabs>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;