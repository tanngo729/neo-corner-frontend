// src/constants/themeConstants.js
export const THEME_COLORS = {
  LIGHT: {
    PRIMARY_BG: '#F5F5F5',
    SECONDARY_BG: '#FFFFFF',
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#666666',
    BORDER_COLOR: '#E0E0E0',
    HOVER_BG: '#ECF0F1',
    ACCENT_PRIMARY: '#3498DB',
    ACCENT_SECONDARY: '#2980B9'
  },
  DARK: {
    PRIMARY_BG: '#181818', // Thay đổi từ #0B0C10 sang một màu xám đen nhẹ
    SECONDARY_BG: '#2C2C2E', // Màu xám đậm hơn nhưng không quá tối
    TEXT_PRIMARY: '#E0E0E0', // Trắng nhạt thay vì trắng tinh khiết
    TEXT_SECONDARY: '#A1A1AA', // Màu xám nhạt cho chữ phụ
    BORDER_COLOR: '#3A3A3C', // Viền xám đậm nhẹ
    HOVER_BG: '#2C3442', // Màu hover nhẹ nhàng hơn
    ACCENT_PRIMARY: '#41b1a9', // Giữ nguyên màu accent teal
    ACCENT_SECONDARY: '#2A9D8F' // Accent teal đậm hơn
  }
};

export const FONT_SIZES = {
  SMALL: {
    BASE: '13px',
    SM: '12px',
    LG: '14px',
    XL: '16px',
    XXL: '18px'
  },
  MEDIUM: {
    BASE: '14px',
    SM: '13px',
    LG: '16px',
    XL: '18px',
    XXL: '20px'
  },
  LARGE: {
    BASE: '16px',
    SM: '14px',
    LG: '18px',
    XL: '20px',
    XXL: '24px'
  }
};

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark'
};