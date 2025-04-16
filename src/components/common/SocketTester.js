import React, { useEffect, useState } from 'react';
import { Button, Card, List, Typography } from 'antd';
import { useSocket } from '../../contexts/SocketContext';

const { Title, Text } = Typography;

const SocketTester = () => {
  const { socket, connected, reconnect, emitEvent } = useSocket();
  const [events, setEvents] = useState([]);
  const [testResponse, setTestResponse] = useState(null);
  const isAdmin = window.location.pathname.startsWith('/admin');

  // Lắng nghe mọi sự kiện
  useEffect(() => {
    if (!socket) return;

    const handleEvent = (eventName, ...args) => {
      console.log(`[SocketTester] Nhận sự kiện "${eventName}":`, args);
      setEvents(prev => [{
        id: Date.now(),
        name: eventName,
        data: JSON.stringify(args, null, 2),
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)]);
    };

    socket.onAny(handleEvent);

    // Đăng ký cụ thể với các sự kiện thông báo
    const handleNotification = (data) => {
      setTestResponse(data);
    };

    if (isAdmin) {
      socket.on('new-order', handleNotification);
      socket.on('admin-notification', handleNotification);
    } else {
      socket.on('order-status-update', handleNotification);
      socket.on('order-status-broadcast', handleNotification);
    }

    return () => {
      socket.offAny(handleEvent);
      if (isAdmin) {
        socket.off('new-order', handleNotification);
        socket.off('admin-notification', handleNotification);
      } else {
        socket.off('order-status-update', handleNotification);
        socket.off('order-status-broadcast', handleNotification);
      }
    };
  }, [socket, isAdmin]);

  const testConnection = () => {
    if (!socket) {
      alert('Socket chưa khởi tạo');
      return;
    }

    emitEvent('check-connection', {
      tester: true,
      timestamp: new Date().toISOString()
    });
  };

  const reAuthenticate = () => {
    const storageUserKey = isAdmin ? 'adminUser' : 'user';
    const storageTokenKey = isAdmin ? 'adminToken' : 'token';

    const savedUser = localStorage.getItem(storageUserKey);
    const savedToken = localStorage.getItem(storageTokenKey);

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        const userId = userData._id || userData.id;

        if (userId) {
          const eventName = isAdmin ? 'admin-login' : 'customer-login';
          socket.emit(eventName, userId);
          alert(`Đã gửi xác thực ${eventName} với id ${userId}`);
        }
      } catch (error) {
        alert('Lỗi: ' + error.message);
      }
    } else {
      alert('Chưa đăng nhập');
    }
  };

  return (
    <Card title="Socket Tester" style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 10 }}>
        <Text>Trạng thái: </Text>
        <Text strong type={connected ? 'success' : 'danger'}>
          {connected ? 'Đã kết nối' : 'Ngắt kết nối'}
        </Text>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Button onClick={testConnection} style={{ marginRight: 10 }}>
          Kiểm tra kết nối
        </Button>
        <Button onClick={reconnect} style={{ marginRight: 10 }}>
          Kết nối lại
        </Button>
        <Button onClick={reAuthenticate}>
          Xác thực lại
        </Button>
      </div>

      {testResponse && (
        <div style={{ marginBottom: 20 }}>
          <Title level={5}>Phản hồi thông báo gần nhất:</Title>
          <pre style={{ background: '#f5f5f5', padding: 10, border: '1px solid #d9d9d9' }}>
            {JSON.stringify(testResponse, null, 2)}
          </pre>
        </div>
      )}

      <Title level={5}>Sự kiện gần đây ({events.length})</Title>
      <List
        size="small"
        bordered
        dataSource={events}
        renderItem={event => (
          <List.Item>
            <Text strong>[{event.time}]</Text> {event.name}
          </List.Item>
        )}
      />
    </Card>
  );
};

export default SocketTester;