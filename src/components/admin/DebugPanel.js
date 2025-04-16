// src/components/admin/DebugPanel.js
import React, { useState, useEffect } from 'react';
import { Card, Button, List, Typography, Tag, Switch, Space, Badge } from 'antd';
import { ReloadOutlined, WifiOutlined, BugOutlined } from '@ant-design/icons';
import { useSocket } from '../../contexts/SocketContext';

const { Text, Title } = Typography;

const DebugPanel = () => {
  const { socket, connected, checkConnection } = useSocket();
  const [events, setEvents] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!socket || !debugMode) return;

    // Lắng nghe tất cả các sự kiện
    const handleAnyEvent = (event, ...args) => {
      setEvents(prev => [{
        event,
        data: args[0],
        time: new Date().toISOString()
      }, ...prev.slice(0, 19)]);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, [socket, debugMode]);

  const sendTestEvent = () => {
    if (socket && connected) {
      setTesting(true);
      socket.emit('check-connection', {
        from: 'debug-panel',
        timestamp: new Date(),
        type: 'manual-test'
      });

      setTimeout(() => {
        setTesting(false);
      }, 2000);
    }
  };

  const sendAdminBroadcastTest = () => {
    if (socket && connected) {
      setTesting(true);
      socket.emit('admin-broadcast-test', {
        message: 'Kiểm tra broadcast từ admin debug panel',
        timestamp: new Date()
      });

      setTimeout(() => {
        setTesting(false);
      }, 2000);
    }
  };

  if (!debugMode) {
    return (
      <div style={{ padding: '10px', textAlign: 'right', position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Button
          type="primary"
          icon={<BugOutlined />}
          shape="circle"
          onClick={() => setDebugMode(true)}
          title="Mở Debug Panel"
        />
      </div>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Socket Debug Panel</span>
          <Space>
            <Badge status={connected ? "success" : "error"} text={connected ? "Đã kết nối" : "Chưa kết nối"} />
            <Switch
              checkedChildren="Debug ON"
              unCheckedChildren="Debug OFF"
              checked={debugMode}
              onChange={setDebugMode}
            />
          </Space>
        </div>
      }
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 400,
        maxHeight: 500,
        overflowY: 'auto',
        zIndex: 1000,
        opacity: 0.9
      }}
      size="small"
    >
      <div style={{ marginBottom: 16 }}>
        <Text>Socket ID: {socket?.id || 'Không có'}</Text>
        <div style={{ marginTop: 8 }}>
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined spin={testing} />}
              onClick={sendTestEvent}
              loading={testing}
            >
              Test Kết Nối
            </Button>
            <Button
              type="default"
              size="small"
              icon={<WifiOutlined />}
              onClick={sendAdminBroadcastTest}
              loading={testing}
            >
              Test Broadcast
            </Button>
          </Space>
        </div>
      </div>

      <Title level={5}>Sự kiện gần đây:</Title>
      <List
        size="small"
        bordered
        dataSource={events}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>{item.event}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>{new Date(item.time).toLocaleTimeString()}</Text>
              </div>
              <div style={{
                fontSize: '12px',
                marginTop: '4px',
                background: '#f5f5f5',
                padding: '4px',
                borderRadius: '4px',
                maxHeight: '80px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(item.data, null, 2)}
                </pre>
              </div>
            </div>
          </List.Item>
        )}
      />

      <Button
        type="link"
        size="small"
        onClick={() => setDebugMode(false)}
        style={{ marginTop: 8, float: 'right' }}
      >
        Đóng
      </Button>
    </Card>
  );
};

export default DebugPanel;