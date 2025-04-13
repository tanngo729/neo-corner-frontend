// src/hooks/useTheme.js
import { useState, useEffect, useCallback } from 'react';
import { THEME_COLORS, THEME_MODES, FONT_SIZES } from '../constants/themeConstants';

export const useTheme = () => {
  const [theme, setTheme] = useState(THEME_MODES.LIGHT);
  const [fontSize, setFontSize] = useState('medium'); // Lưu trữ tên font size thay vì giá trị

  // Initialize theme from localStorage
  useEffect(() => {
    // Check for system preference first
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Then check localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);

        // If dark mode preference exists in localStorage, use it
        if (preferences.darkMode !== undefined) {
          preferences.darkMode ? applyDarkTheme() : applyLightTheme();
        } else if (prefersDarkMode) {
          // Otherwise use system preference
          applyDarkTheme();
          updateLocalStorage({ darkMode: true });
        }

        // Apply font size if available
        if (preferences.fontSize) {
          changeFontSize(preferences.fontSize);
        }

        // Apply compact menu if available
        if (preferences.compactMenu !== undefined) {
          applyCompactMenu(preferences.compactMenu);
        }
      } catch (error) {
        console.error('Error parsing preferences:', error);
      }
    } else if (prefersDarkMode) {
      // No saved preferences, but system prefers dark
      applyDarkTheme();
      updateLocalStorage({ darkMode: true });
    }

    // Add transition class to body after initialization
    setTimeout(() => {
      document.body.classList.add('theme-transition');
    }, 100);
  }, []);

  // Listen for preference changes from other components
  useEffect(() => {
    const handlePreferenceChange = (event) => {
      const { darkMode, fontSize: newFontSize, compactMenu } = event.detail;

      // Chỉ áp dụng thay đổi nếu giá trị thực sự thay đổi
      if (darkMode !== undefined && ((darkMode && theme !== THEME_MODES.DARK) || (!darkMode && theme !== THEME_MODES.LIGHT))) {
        darkMode ? applyDarkTheme() : applyLightTheme();
      }

      // Sửa lỗi: so sánh newFontSize với fontSize hiện tại
      if (newFontSize && newFontSize !== fontSize) {
        changeFontSize(newFontSize);
      }

      if (compactMenu !== undefined) {
        applyCompactMenu(compactMenu);
      }
    };

    window.addEventListener('preferenceChange', handlePreferenceChange);
    return () => window.removeEventListener('preferenceChange', handlePreferenceChange);
  }, [theme, fontSize]);

  // Apply dark theme
  const applyDarkTheme = useCallback(() => {
    // Add class for CSS selectors
    document.documentElement.classList.add('dark-theme');

    // Apply CSS variables for components that use them directly
    const variables = {
      '--primary-bg': THEME_COLORS.DARK.PRIMARY_BG,
      '--secondary-bg': THEME_COLORS.DARK.SECONDARY_BG,
      '--text-primary': THEME_COLORS.DARK.TEXT_PRIMARY,
      '--text-secondary': THEME_COLORS.DARK.TEXT_SECONDARY,
      '--border-color': THEME_COLORS.DARK.BORDER_COLOR,
      '--accent-primary': THEME_COLORS.DARK.ACCENT_PRIMARY,
      '--accent-secondary': THEME_COLORS.DARK.ACCENT_SECONDARY,
      '--hover-bg': THEME_COLORS.DARK.HOVER_BG,
    };

    // Apply all CSS variables
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // Update state
    setTheme(THEME_MODES.DARK);
  }, []);

  // Apply light theme
  const applyLightTheme = useCallback(() => {
    // Remove class for CSS selectors
    document.documentElement.classList.remove('dark-theme');

    // Apply CSS variables for components that use them directly
    const variables = {
      '--primary-bg': THEME_COLORS.LIGHT.PRIMARY_BG,
      '--secondary-bg': THEME_COLORS.LIGHT.SECONDARY_BG,
      '--text-primary': THEME_COLORS.LIGHT.TEXT_PRIMARY,
      '--text-secondary': THEME_COLORS.LIGHT.TEXT_SECONDARY,
      '--border-color': THEME_COLORS.LIGHT.BORDER_COLOR,
      '--accent-primary': THEME_COLORS.LIGHT.ACCENT_PRIMARY,
      '--accent-secondary': THEME_COLORS.LIGHT.ACCENT_SECONDARY,
      '--hover-bg': THEME_COLORS.LIGHT.HOVER_BG,
    };

    // Apply all CSS variables
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // Update state
    setTheme(THEME_MODES.LIGHT);
  }, []);

  // Áp dụng cỡ chữ - Cải tiến để sử dụng CSS variables
  const changeFontSize = useCallback((size) => {
    // Validate size
    if (!['small', 'medium', 'large'].includes(size)) {
      size = 'medium';
    }

    const sizeKey = size.toUpperCase();

    console.log('Changing font size to:', size, FONT_SIZES[sizeKey]);

    // Xóa tất cả các class cỡ chữ hiện tại
    document.documentElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');

    // Thêm class mới
    document.documentElement.classList.add(`font-size-${size}`);

    try {
      // Cập nhật CSS variables
      document.documentElement.style.setProperty('--font-size-base', FONT_SIZES[sizeKey].BASE);
      document.documentElement.style.setProperty('--font-size-sm', FONT_SIZES[sizeKey].SM);
      document.documentElement.style.setProperty('--font-size-lg', FONT_SIZES[sizeKey].LG);
      document.documentElement.style.setProperty('--font-size-xl', FONT_SIZES[sizeKey].XL);
      document.documentElement.style.setProperty('--font-size-xxl', FONT_SIZES[sizeKey].XXL);

      // Áp dụng cỡ chữ cho body
      document.body.style.fontSize = FONT_SIZES[sizeKey].BASE;

      // Force update cho Typography của Ant Design
      const typography = document.querySelectorAll('.ant-typography');
      typography.forEach(el => {
        el.style.fontSize = FONT_SIZES[sizeKey].BASE;
      });
    } catch (error) {
      console.error('Error setting font size variables:', error);
    }

    // Lưu trạng thái
    setFontSize(size);

    // Cập nhật localStorage
    updateLocalStorage({ fontSize: size });

    console.log(`Applied font size: ${size}`, FONT_SIZES[sizeKey]);
  }, []);

  // Áp dụng menu thu gọn
  const applyCompactMenu = useCallback((isCompact) => {
    const appLayout = document.querySelector('.app-layout');
    if (appLayout) {
      if (isCompact) {
        appLayout.classList.add('compact-menu');
      } else {
        appLayout.classList.remove('compact-menu');
      }
    }
  }, []);

  // Toggle light/dark theme
  const toggleTheme = useCallback(() => {
    if (theme === THEME_MODES.LIGHT) {
      applyDarkTheme();
      updateLocalStorage({ darkMode: true });
    } else {
      applyLightTheme();
      updateLocalStorage({ darkMode: false });
    }
  }, [theme, applyDarkTheme, applyLightTheme]);

  // Toggle menu compact mode
  const toggleCompactMenu = useCallback(() => {
    const appLayout = document.querySelector('.app-layout');
    const isCompact = appLayout?.classList.contains('compact-menu');

    applyCompactMenu(!isCompact);
    updateLocalStorage({ compactMenu: !isCompact });
  }, [applyCompactMenu]);

  // Update localStorage
  const updateLocalStorage = useCallback((updates) => {
    try {
      const currentPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
      const newPreferences = { ...currentPreferences, ...updates };
      localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  }, []);

  return {
    theme,
    fontSize,
    toggleTheme,
    changeFontSize,
    applyDarkTheme,
    applyLightTheme,
    toggleCompactMenu,
    isDarkMode: theme === THEME_MODES.DARK
  };
};