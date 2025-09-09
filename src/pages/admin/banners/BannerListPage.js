// src/pages/admin/banners/BannerListPage.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Popconfirm, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import bannerService from '../../../services/admin/bannerService';

const BannerListPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await bannerService.getBanners({ page: 1, limit: 50 });
      const items = res?.data?.data || res?.data || [];
      setData(items);
    } catch (e) {
      message.error('Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    try {
      await bannerService.deleteBanner(id);
      message.success('Đã xóa banner');
      fetchData();
    } catch (e) {
      message.error('Xóa banner thất bại');
    }
  };

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Vị trí', dataIndex: 'position', key: 'position', width: 100 },
    { title: 'Hiển thị', dataIndex: 'displayOn', key: 'displayOn', render: (arr=[]) => arr.map(x => <Tag key={x}>{x}</Tag>) },
    { title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', render: v => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>, width: 120 },
    {
      title: 'Thao tác', key: 'action', width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/admin/banners/edit/${record._id}`)}>Sửa</Button>
          <Popconfirm title="Xóa banner?" onConfirm={() => handleDelete(record._id)}>
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Quản lý Banner</h2>
        <Link to="/admin/banners/create"><Button type="primary">Thêm banner</Button></Link>
      </div>
      <Table rowKey="_id" loading={loading} dataSource={data} columns={columns} pagination={false} />
    </div>
  );
};

export default BannerListPage;

