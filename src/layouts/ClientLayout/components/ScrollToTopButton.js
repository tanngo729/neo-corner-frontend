import React, { useState, useEffect } from 'react';
import { CaretUpOutlined } from '@ant-design/icons';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Hiển thị nút khi cuộn xuống 300px
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Cuộn lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          type="text"
          className="scroll-to-top-btn"
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            border: 'none',
            opacity: 0.6,
            transition: 'opacity 0.3s ease',
            backdropFilter: 'blur(4px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
          }}
        >
          <CaretUpOutlined style={{ fontSize: '20px' }} />
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;