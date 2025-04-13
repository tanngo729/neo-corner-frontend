// src/components/admin/PageHeader.js
import React from 'react';
import { Row, Col, Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PermissionCheck from '../../components/common/PermissionCheck';

const { Title } = Typography;

const PageHeader = ({ title, addButtonText, addButtonPermission, onAddClick }) => {
  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
      <Col>
        <Title level={3}>{title}</Title>
      </Col>
      <Col>
        {addButtonPermission ? (
          <PermissionCheck permission={addButtonPermission}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddClick}
            >
              {addButtonText}
            </Button>
          </PermissionCheck>
        ) : (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddClick}
          >
            {addButtonText}
          </Button>
        )}
      </Col>
    </Row>
  );
};

export default PageHeader;