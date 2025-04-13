// src/pages/admin/settings/SystemSettingsPage.js
import React, { useState } from 'react';
import { Tabs, Card, Typography } from 'antd';
// import GeneralSettings from './tabs/GeneralSettings';
// import DisplaySettings from './tabs/DisplaySettings';
// import PaymentSettings from './tabs/PaymentSettings';
// import EmailSettings from './tabs/EmailSettings';
// import SecuritySettings from './tabs/SecuritySettings';
import ActivityLogTab from './tabs/ActivityLogTab';

const { Title } = Typography;
const { TabPane } = Tabs;

const SystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Card>
      <Title level={3}>Cài đặt hệ thống</Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Cài đặt chung" key="general">
          {/* <GeneralSettings /> */}
        </TabPane>
        <TabPane tab="Hiển thị" key="display">
          {/* <DisplaySettings /> */}
        </TabPane>
        <TabPane tab="Thanh toán & Giao hàng" key="payment">
          {/* <PaymentSettings /> */}
        </TabPane>
        <TabPane tab="Email & Thông báo" key="email">
          {/* <EmailSettings /> */}
        </TabPane>
        <TabPane tab="Bảo mật" key="security">
          {/* <SecuritySettings /> */}
        </TabPane>
        <TabPane tab="Lịch sử hoạt động" key="logs">
          <ActivityLogTab />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default SystemSettingsPage;