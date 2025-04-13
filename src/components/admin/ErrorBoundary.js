// src/components/admin/ErrorBoundary.js
import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Hiển thị fallback UI
      return (
        <Result
          status="error"
          title="Đã xảy ra lỗi"
          subTitle={this.state.error?.message || 'Đã có lỗi xảy ra khi tải trang.'}
          extra={[
            <Button type="primary" key="refresh" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>,
            <Button key="back" onClick={() => window.history.back()}>
              Quay lại
            </Button>,
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;