import React, { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';

const AdminConfigProvider = ({ children, isDarkMode = false, locale }) => {
  const [fontSize, setFontSize] = useState(14);

  // Load font size from preferences
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        const { fontSize } = JSON.parse(savedPreferences);
        if (fontSize) {
          switch (fontSize) {
            case 'small':
              setFontSize(13);
              break;
            case 'medium':
              setFontSize(14);
              break;
            case 'large':
              setFontSize(16);
              break;
            default:
              setFontSize(14);
          }
        }
      }
    } catch (error) {
      console.error('Error loading font size:', error);
    }
  }, []);

  // Listen for preference changes
  useEffect(() => {
    const handlePreferenceChange = (event) => {
      const { fontSize } = event.detail;
      if (fontSize) {
        switch (fontSize) {
          case 'small':
            setFontSize(13);
            break;
          case 'medium':
            setFontSize(14);
            break;
          case 'large':
            setFontSize(16);
            break;
          default:
            setFontSize(14);
        }
      }
    };

    window.addEventListener('preferenceChange', handlePreferenceChange);
    return () => window.removeEventListener('preferenceChange', handlePreferenceChange);
  }, []);

  const theme = {
    token: {
      colorPrimary: isDarkMode ? '#2A9D8F' : '#3498DB',
      colorPrimaryHover: isDarkMode ? '#41b1a9' : '#2980B9',
      colorPrimaryActive: isDarkMode ? '#1A7D73' : '#2573a7',
      colorLink: isDarkMode ? '#2A9D8F' : '#3498DB',
      colorLinkHover: isDarkMode ? '#41b1a9' : '#2980B9',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#f5222d',
      colorInfo: '#1890ff',
      // Kích thước và font
      fontSize: fontSize, // Sử dụng fontSize từ state
      borderRadius: 4,
    },
    components: {
      Menu: {
        itemSelectedColor: isDarkMode ? '#41b1a9' : '#3498DB',
        itemSelectedBg: 'transparent',
        itemHoverColor: isDarkMode ? '#41b1a9' : '#2980B9',
        activeBarBorderWidth: 2,
        activeBarWidth: 24,
      },
      Button: {
        colorPrimary: isDarkMode ? '#2A9D8F' : '#3498DB',
        colorPrimaryHover: isDarkMode ? '#41b1a9' : '#2980B9',
        colorPrimaryActive: isDarkMode ? '#1A7D73' : '#2573a7',
      }
    }
  };

  return (
    <ConfigProvider theme={theme} prefixCls="admin" locale={locale}>
      <div className="admin-namespace">
        {children}
      </div>
    </ConfigProvider>
  );
};

export default AdminConfigProvider;