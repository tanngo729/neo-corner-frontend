// src/pages/admin/profile/tabs/PreferencesTab.js
import React, { useState, useEffect } from 'react';
import { Form, Switch, Select, Button, message, Card, Row, Col, Divider, Typography, Space, Tooltip } from 'antd';
import { SaveOutlined, ReloadOutlined, EyeOutlined, BulbOutlined, FontSizeOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../hooks/useTheme';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const PreferencesTab = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const { theme, fontSize, changeFontSize, toggleTheme, isDarkMode } = useTheme();

  // Load tùy chọn đã lưu khi component mount
  useEffect(() => {
    const loadSavedPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          form.setFieldsValue({
            darkMode: preferences.darkMode || false,
            compactMenu: preferences.compactMenu || false,
            fontSize: preferences.fontSize || 'medium'
          });
        }
      } catch (error) {
        console.error('Lỗi khi đọc tùy chọn:', error);
      }
    };

    loadSavedPreferences();
  }, [form]);

  // Xem trước thay đổi khi người dùng điều chỉnh tùy chọn
  const handleValuesChange = (changedValues) => {
    if (!previewMode) return;

    // Xử lý thay đổi font size
    if (changedValues.fontSize) {
      console.log('Changing font size to:', changedValues.fontSize);
      changeFontSize(changedValues.fontSize);
    }

    // Xử lý thay đổi dark mode
    if (changedValues.darkMode !== undefined) {
      previewThemeChange(changedValues.darkMode);
    }

    // Xử lý thay đổi compact menu
    if (changedValues.compactMenu !== undefined) {
      previewCompactMenu(changedValues.compactMenu);
    }
  };

  // Xem trước thay đổi chủ đề
  const previewThemeChange = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }

    // Dispatch event for preview
    window.dispatchEvent(new CustomEvent('themePreview', {
      detail: { darkMode: isDark }
    }));
  };

  // Xem trước menu thu gọn
  const previewCompactMenu = (isCompact) => {
    const appLayout = document.querySelector('.app-layout');
    if (appLayout) {
      if (isCompact) {
        appLayout.classList.add('compact-menu');
      } else {
        appLayout.classList.remove('compact-menu');
      }
    }
  };

  // Lưu tùy chọn người dùng
  const handleSubmit = (values) => {
    setLoading(true);

    try {
      // Lưu vào localStorage
      localStorage.setItem('userPreferences', JSON.stringify(values));

      // Thông báo cho các thành phần khác về thay đổi tùy chọn
      window.dispatchEvent(new CustomEvent('preferenceChange', {
        detail: values
      }));

      // Áp dụng thay đổi font size
      if (values.fontSize) {
        changeFontSize(values.fontSize);
      }

      message.success('Đã lưu tùy chọn giao diện thành công');
    } catch (error) {
      console.error('Lỗi khi lưu tùy chọn:', error);
      message.error('Không thể lưu tùy chọn');
    } finally {
      setLoading(false);
    }
  };

  // Bật/tắt chế độ xem trước
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);

    // Nếu tắt xem trước, đặt lại về giá trị đã lưu
    if (previewMode) {
      try {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);

          // Đặt lại dark mode
          if (preferences.darkMode !== undefined) {
            previewThemeChange(preferences.darkMode);
          }

          // Đặt lại font size
          if (preferences.fontSize) {
            changeFontSize(preferences.fontSize);
          }

          // Đặt lại compact menu
          if (preferences.compactMenu !== undefined) {
            previewCompactMenu(preferences.compactMenu);
          }
        }
      } catch (error) {
        console.error('Lỗi khi đặt lại tùy chọn:', error);
      }
    }
  };

  // Đặt lại về tùy chọn mặc định
  const resetToDefaults = () => {
    const defaultPreferences = {
      darkMode: false,
      compactMenu: false,
      fontSize: 'medium'
    };

    form.setFieldsValue(defaultPreferences);

    if (previewMode) {
      // Preview changes
      previewThemeChange(false);
      changeFontSize('medium');
      previewCompactMenu(false);
    }
  };

  return (
    <div className="preferences-tab">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <BulbOutlined />
                <span>Tùy chọn giao diện</span>
              </Space>
            }
            extra={
              <Tooltip title={previewMode ? "Xem trước đang bật - thay đổi hiển thị ngay lập tức" : "Xem trước đang tắt"}>
                <Button
                  icon={<EyeOutlined />}
                  type={previewMode ? "primary" : "default"}
                  onClick={togglePreviewMode}
                >
                  Xem trước trực tiếp
                </Button>
              </Tooltip>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onValuesChange={handleValuesChange}
              initialValues={{
                darkMode: isDarkMode,
                compactMenu: false,
                fontSize: fontSize || 'medium'
              }}
            >
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="darkMode"
                    label={
                      <Space>
                        <BulbOutlined />
                        <span>Chế độ tối</span>
                      </Space>
                    }
                    valuePropName="checked"
                    tooltip="Giao diện tối giúp giảm mỏi mắt khi làm việc trong môi trường thiếu ánh sáng"
                  >
                    <Switch
                      checkedChildren="Bật"
                      unCheckedChildren="Tắt"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="compactMenu"
                    label={
                      <Space>
                        <MenuFoldOutlined />
                        <span>Menu thu gọn</span>
                      </Space>
                    }
                    valuePropName="checked"
                    tooltip="Thu gọn thanh bên để tăng không gian làm việc"
                  >
                    <Switch
                      checkedChildren="Bật"
                      unCheckedChildren="Tắt"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="fontSize"
                label={
                  <Space>
                    <FontSizeOutlined />
                    <span>Cỡ chữ</span>
                  </Space>
                }
                tooltip="Điều chỉnh kích thước chữ cho phù hợp với nhu cầu của bạn"
              >
                <Select>
                  <Option value="small">Nhỏ</Option>
                  <Option value="medium">Vừa</Option>
                  <Option value="large">Lớn</Option>
                </Select>
              </Form.Item>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                  >
                    Lưu tùy chọn
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={resetToDefaults}
                  >
                    Khôi phục mặc định
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                  >
                    Tải lại trang
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Thông tin"
            className="info-card"
          >
            <Paragraph>
              Các tùy chọn giao diện của bạn được lưu trong trình duyệt.
              Chúng sẽ được áp dụng tự động khi bạn đăng nhập vào hệ thống.
            </Paragraph>

            <Divider />

            <Paragraph type="secondary">
              <strong>Chế độ xem trước:</strong> Khi bật, các thay đổi sẽ hiển thị ngay lập tức để bạn có thể xem trước trước khi lưu.
            </Paragraph>

            <Paragraph type="secondary">
              <strong>Lưu ý:</strong> Một số thay đổi sẽ được áp dụng ngay lập tức, nhưng để có trải nghiệm tốt nhất,
              bạn nên tải lại trang sau khi lưu tùy chọn.
            </Paragraph>
          </Card>

          <Card
            title="Xem trước"
            className="preview-card"
            style={{ marginTop: '24px' }}
          >
            <div
              className={`theme-preview ${isDarkMode ? 'dark-preview' : 'light-preview'}`}
              style={{
                padding: '16px',
                backgroundColor: 'var(--secondary-bg)',
                color: 'var(--text-primary)',
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              <Title level={5} style={{ fontSize: 'var(--font-size-lg)' }}>Nội dung mẫu</Title>
              <Paragraph style={{ fontSize: 'var(--font-size-base)' }}>
                Văn bản này minh họa cách nội dung sẽ hiển thị với các cài đặt hiện tại.
                Điều chỉnh tùy chọn để tìm trải nghiệm xem tốt nhất cho bạn.
              </Paragraph>
              <Space>
                <Button type="primary" size="small">Nút chính</Button>
                <Button size="small">Nút mặc định</Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PreferencesTab;