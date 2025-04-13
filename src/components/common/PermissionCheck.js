// src/components/common/PermissionCheck.js
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Component kiểm tra quyền và hiển thị nội dung tương ứng
 * @param {Object} props Component props
 * @param {String|String[]} props.permission Quyền hoặc danh sách quyền cần kiểm tra
 * @param {String} props.type Loại kiểm tra ('all' cần có tất cả, 'any' cần có ít nhất một)
 * @param {React.ReactNode} props.children Nội dung sẽ hiển thị nếu có quyền
 * @param {React.ReactNode} props.fallback Nội dung thay thế nếu không có quyền
 */
const PermissionCheck = ({ permission, type = 'all', children, fallback = null }) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = useAuth(true);

  // Kiểm tra nếu chỉ có một quyền
  if (typeof permission === 'string') {
    if (!hasPermission(permission)) {
      return fallback;
    }
    return children;
  }

  // Kiểm tra nhiều quyền
  if (Array.isArray(permission)) {
    if (type === 'all' && !hasAllPermissions(permission)) {
      return fallback;
    }
    if (type === 'any' && !hasAnyPermission(permission)) {
      return fallback;
    }
    return children;
  }

  // Mặc định không có quyền thì không hiển thị
  return fallback;
};

export default PermissionCheck;