import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Tải theme từ localStorage khi khởi tạo
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        const { darkMode } = JSON.parse(savedPreferences);
        if (darkMode !== undefined) {
          setIsDarkMode(darkMode);
        }
      }
    } catch (error) {
      console.error('Lỗi khi đọc preferences:', error);
    }
  }, []);

  // Lưu theme vào localStorage khi thay đổi
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      try {
        const savedPreferences = localStorage.getItem('userPreferences');
        const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
        preferences.darkMode = newValue;
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Lỗi khi lưu preferences:', error);
      }
      return newValue;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};