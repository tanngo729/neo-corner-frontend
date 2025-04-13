// src/components/admin/ActionButtons.js
import React from 'react';
import { Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import PermissionCheck from '../../components/common/PermissionCheck';

const ActionButtons = ({
  record,
  onEdit,
  onDelete,
  editPermission,
  deletePermission,
  deleteButtonText = "Xóa",
  editButtonText = "Sửa",
  deleteConfirmTitle = "Bạn có chắc chắn muốn xóa mục này?"
}) => {
  const editButton = (
    <Button
      type="primary"
      size="small"
      icon={<EditOutlined />}
      onClick={() => onEdit(record)}
    >
      {editButtonText}
    </Button>
  );

  const deleteButton = (
    <Popconfirm
      title={deleteConfirmTitle}
      onConfirm={() => onDelete(record)}
      okText="Xóa"
      cancelText="Hủy"
      icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
    >
      <Button
        type="primary"
        danger
        size="small"
        icon={<DeleteOutlined />}
      >
        {deleteButtonText}
      </Button>
    </Popconfirm>
  );

  return (
    <Space size="small">
      {editPermission ? (
        <PermissionCheck permission={editPermission}>
          {editButton}
        </PermissionCheck>
      ) : (
        editButton
      )}

      {deletePermission ? (
        <PermissionCheck permission={deletePermission}>
          {deleteButton}
        </PermissionCheck>
      ) : (
        deleteButton
      )}
    </Space>
  );
};

export default ActionButtons;