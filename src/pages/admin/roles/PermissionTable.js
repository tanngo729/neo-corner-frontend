// src/pages/admin/roles/PermissionTable.js
import React from 'react';
import { Table, Checkbox, Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

const TableWrapper = styled.div`
  .permission-table .ant-table-thead > tr > th {
    background-color: #f0f5ff;
  }

  .permission-table .permission-group {
    background-color: #f5f5f5;
  }

  .permission-table .permission-description {
    color: #888;
    font-size: 12px;
  }
`;

/**
 * Component hiển thị bảng phân quyền dạng checkbox
 */
const PermissionTable = ({ permissions, groupedPermissions, selectedPermissions, onChange }) => {
  // Xử lý khi chọn/bỏ chọn một quyền
  const handlePermissionChange = (permissionId, checked) => {
    let newSelectedPermissions;

    if (checked) {
      // Thêm quyền vào danh sách đã chọn
      newSelectedPermissions = [...selectedPermissions, permissionId];
    } else {
      // Loại bỏ quyền khỏi danh sách đã chọn
      newSelectedPermissions = selectedPermissions.filter(id => id !== permissionId);
    }

    onChange(newSelectedPermissions);
  };

  // Xử lý khi chọn/bỏ chọn tất cả quyền trong một nhóm
  const handleGroupChange = (groupPermissions, checked) => {
    const permissionIds = groupPermissions.map(p => p.id);
    let newSelectedPermissions;

    if (checked) {
      // Thêm tất cả quyền trong nhóm vào danh sách đã chọn (và loại bỏ trùng lặp)
      newSelectedPermissions = [...new Set([...selectedPermissions, ...permissionIds])];
    } else {
      // Loại bỏ tất cả quyền trong nhóm khỏi danh sách đã chọn
      newSelectedPermissions = selectedPermissions.filter(id => !permissionIds.includes(id));
    }

    onChange(newSelectedPermissions);
  };

  // Kiểm tra một nhóm có được chọn hết không
  const isGroupFullySelected = (groupPermissions) => {
    return groupPermissions.every(p => selectedPermissions.includes(p.id));
  };

  // Kiểm tra một nhóm có được chọn một phần không
  const isGroupPartiallySelected = (groupPermissions) => {
    return groupPermissions.some(p => selectedPermissions.includes(p.id)) &&
      !isGroupFullySelected(groupPermissions);
  };

  // Xử lý dữ liệu để hiển thị dạng bảng
  const tableData = [];

  if (groupedPermissions) {
    Object.entries(groupedPermissions).forEach(([groupName, groupPermissions]) => {
      // Thêm hàng tiêu đề nhóm
      tableData.push({
        key: `group-${groupName}`,
        isGroup: true,
        name: groupName,
        permissions: groupPermissions,
        description: getGroupDescription(groupName)
      });

      // Thêm các quyền trong nhóm
      groupPermissions.forEach(permission => {
        tableData.push({
          key: permission.id,
          isGroup: false,
          name: permission.name,
          id: permission.id,
          description: ""
        });
      });
    });
  }

  // Mô tả cho từng nhóm quyền
  function getGroupDescription(groupName) {
    const descriptions = {
      dashboard: "Quyền liên quan đến trang tổng quan",
      products: "Quyền quản lý sản phẩm trên hệ thống",
      categories: "Quyền quản lý danh mục sản phẩm",
      orders: "Quyền quản lý đơn hàng",
      users: "Quyền quản lý người dùng hệ thống",
      roles: "Quyền phân quyền hệ thống",
      settings: "Quyền thay đổi cài đặt hệ thống"
    };

    return descriptions[groupName] || "";
  }

  // Định nghĩa cột
  const columns = [
    {
      title: 'Quyền',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        if (record.isGroup) {
          return (
            <div>
              <Text strong>{text.charAt(0).toUpperCase() + text.slice(1)}</Text>
              {record.description && (
                <div className="permission-description">{record.description}</div>
              )}
            </div>
          );
        }
        return <div style={{ paddingLeft: 20 }}>{text}</div>;
      }
    },
    {
      title: 'Cho phép',
      key: 'allow',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (record.isGroup) {
          return (
            <Checkbox
              indeterminate={isGroupPartiallySelected(record.permissions)}
              checked={isGroupFullySelected(record.permissions)}
              onChange={(e) => handleGroupChange(record.permissions, e.target.checked)}
            />
          );
        }
        return (
          <Checkbox
            checked={selectedPermissions.includes(record.id)}
            onChange={(e) => handlePermissionChange(record.id, e.target.checked)}
          />
        );
      }
    }
  ];

  return (
    <TableWrapper>
      <Table
        className="permission-table"
        columns={columns}
        dataSource={tableData}
        pagination={false}
        rowClassName={(record) => record.isGroup ? 'permission-group' : ''}
        size="small"
      />
    </TableWrapper>
  );
};

export default PermissionTable;