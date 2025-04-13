import React, { useState, useContext } from 'react';
import { Form, Input, InputNumber, Select, Switch, Button, message } from 'antd';
import QuillEditor from '../../common/QuillEditor';
import EnhancedImageUpload from '../../common/EnhancedImageUpload';

const { Option } = Select;
const FormContext = Form.useFormInstance;

const ProductFormFields = ({ fileList, onImageChange, categories = [], setFormFieldValue }) => {
  const [description, setDescription] = useState('');
  const form = useContext(FormContext);

  // Xử lý thay đổi nội dung
  const handleEditorChange = (html) => {
    setDescription(html);
    // Cập nhật form
    if (form) {
      form.setFieldsValue({ description: html });
    }

    // Hoặc sử dụng hàm từ parent component
    if (setFormFieldValue) {
      setFormFieldValue('description', html);
    }
  };

  // Xử lý thay đổi hình ảnh để đảm bảo dữ liệu đúng định dạng
  const handleImageChange = (info) => {
    console.log('ProductFormFields - handleImageChange:', info);

    // Đảm bảo onImageChange nhận được dữ liệu đúng định dạng
    if (onImageChange) {
      onImageChange(info);
    }
  };

  return (
    <>
      <Form.Item
        label="Tên sản phẩm"
        name="name"
        rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
      >
        <Input placeholder="Nhập tên sản phẩm" />
      </Form.Item>

      <Form.Item
        label="Mô tả"
        name="description"
        rules={[{ required: true, message: 'Vui lòng nhập mô tả sản phẩm!' }]}
      >
        <QuillEditor
          value={description}
          onChange={handleEditorChange}
        />
      </Form.Item>

      <Form.Item
        label="Giá (đ)"
        name="price"
        rules={[{ required: true, message: 'Vui lòng nhập giá sản phẩm!' }]}
      >
        <InputNumber
          min={0}
          step={1000}
          style={{ width: '100%' }}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          placeholder="Nhập giá bán"
        />
      </Form.Item>

      <Form.Item
        label="Giá gốc (đ)"
        name="originalPrice"
        tooltip="Giá trước khi giảm giá, để hiển thị giá so sánh"
      >
        <InputNumber
          min={0}
          step={1000}
          style={{ width: '100%' }}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          placeholder="Nhập giá gốc"
        />
      </Form.Item>

      <Form.Item
        label="Giảm giá (%)"
        name="discountPercentage"
        tooltip="Phần trăm giảm giá. Nếu để trống sẽ tính theo giá gốc và giá bán"
      >
        <InputNumber
          min={0}
          max={100}
          style={{ width: '100%' }}
          placeholder="Nhập % giảm giá"
        />
      </Form.Item>

      <Form.Item
        label="Số lượng trong kho"
        name="stock"
        rules={[{ required: true, message: 'Vui lòng nhập số lượng trong kho!' }]}
      >
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          placeholder="Nhập số lượng kho"
        />
      </Form.Item>

      <Form.Item
        label="Danh mục"
        name="category"
      >
        <Select placeholder="Chọn danh mục">
          {categories.map(category => (
            <Option key={category._id} value={category._id}>
              {category.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Trạng thái"
        name="status"
        initialValue="active"
      >
        <Select>
          <Option value="active">Hoạt động</Option>
          <Option value="inactive">Ẩn</Option>
          <Option value="draft">Nháp</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Nổi bật"
        name="featured"
        valuePropName="checked"
        initialValue={false}
      >
        <Switch checkedChildren="Có" unCheckedChildren="Không" />
      </Form.Item>

      <Form.Item
        label="Hình ảnh"
        name="images"
        tooltip="Tối đa 5 hình, mỗi hình không quá 2MB. Hỗ trợ upload file hoặc URL"
      >
        <EnhancedImageUpload
          fileList={fileList}
          onChange={handleImageChange}
          maxCount={5}
          multiple={true}
          listType="picture-card"
          name="images"
        />
      </Form.Item>
    </>
  );
};

export default ProductFormFields;