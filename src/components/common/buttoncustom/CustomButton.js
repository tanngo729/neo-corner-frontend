// src/components/common/buttoncustom/CustomButton.js
import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './CustomButton.scss';

/**
 * Component nút tùy chỉnh với các biến thể màu sắc khác nhau
 * @param {string} type - Kiểu nút: primary, secondary, success, warning, danger, info, link, text, outline-primary...
 * @param {string} size - Kích thước nút: small, middle, large
 * @param {boolean} block - Nút chiếm toàn bộ độ rộng của container
 * @param {boolean} disabled - Trạng thái vô hiệu hóa nút
 * @param {boolean} loading - Trạng thái đang tải
 * @param {ReactNode} icon - Icon trước nội dung
 * @param {string} htmlType - Kiểu HTML: button, submit, reset
 * @param {function} onClick - Xử lý sự kiện khi click
 * @param {ReactNode} children - Nội dung bên trong nút
 */
const CustomButton = ({
  type = 'primary',
  size = 'middle',
  block = false,
  disabled = false,
  loading = false,
  icon,
  htmlType = 'button',
  onClick,
  className,
  children,
  ...rest
}) => {
  // Xác định lớp CSS dựa trên props
  const buttonClass = classNames(
    'custom-button',
    `custom-button-${type}`,
    {
      'custom-button-block': block,
    },
    className
  );

  return (
    <Button
      type={type.startsWith('outline-') ? 'default' : 'primary'}
      size={size}
      block={block}
      disabled={disabled}
      loading={loading}
      icon={icon}
      htmlType={htmlType}
      onClick={onClick}
      className={buttonClass}
      {...rest}
    >
      {children}
    </Button>
  );
};

CustomButton.propTypes = {
  type: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
    'outline-primary',
    'outline-secondary',
    'outline-success',
    'outline-warning',
    'outline-danger',
    'outline-info',
    'link',
    'text'
  ]),
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  block: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  htmlType: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node
};

export default CustomButton;