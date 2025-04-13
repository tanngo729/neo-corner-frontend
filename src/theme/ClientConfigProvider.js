import React from 'react';
import { ConfigProvider } from 'antd';

const ClientConfigProvider = ({ children, locale }) => {
  // Tùy chỉnh theme cho phần client - màu sắc Jollibee
  const theme = {
    token: {
      colorPrimary: '#e31836',
      colorPrimaryHover: '#c9112c',
      colorPrimaryActive: '#a50e24',
      colorLink: '#e31836',
      colorLinkHover: '#c9112c',
      colorSuccess: '#28A745',
      colorWarning: '#ffc522',
      colorError: '#DC3545',
      colorInfo: '#17a2b8',
      // Kích thước và font
      fontSize: 14,
      borderRadius: 4,
    },
    components: {
      Menu: {
        itemSelectedColor: '#e31836',
        itemSelectedBg: 'transparent',
        itemHoverColor: '#c9112c',
        activeBarBorderWidth: 2,
        activeBarWidth: 24,
      },
      Button: {
        colorPrimary: '#e31836',
        colorPrimaryHover: '#c9112c',
        colorPrimaryActive: '#a50e24',
      }
    }
  };

  return (
    <ConfigProvider theme={theme} prefixCls="client" locale={locale}>
      <div className="client-namespace">
        {children}
      </div>
    </ConfigProvider>
  );
};

export default ClientConfigProvider;