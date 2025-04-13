import React, { useState, useEffect } from 'react';
import { Upload, Button, Input, Modal, Form, Image, message, Space } from 'antd';
import { UploadOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';

/**
 * Enhanced Image Upload component that supports both file uploads and URL inputs
 * @param {Object} props Component props
 * @param {Array} props.fileList Current list of files/images
 * @param {Function} props.onChange Callback when images change
 * @param {Number} props.maxCount Maximum number of images allowed
 * @param {String} props.listType How to display the images (picture-card, picture, text)
 * @param {Boolean} props.multiple Allow multiple file selection
 * @param {String} props.initialImage Initial image URL to display if fileList is empty
 * @param {Boolean} props.avatarRemoved Flag to indicate if avatar was removed
 */
const EnhancedImageUpload = ({
  fileList = [],
  onChange,
  maxCount = 1,
  listType = 'picture-card',
  multiple = false,
  initialImage,
  avatarRemoved = false,
  ...props
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [internalFileList, setInternalFileList] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Đồng bộ file list từ props vào internal state
  useEffect(() => {
    console.log('EnhancedImageUpload fileList từ props:', fileList);
    console.log('Avatar removed status:', avatarRemoved);

    // Nếu avatar đã bị xóa, giữ fileList trống
    if (avatarRemoved) {
      setInternalFileList([]);
      return;
    }

    if (Array.isArray(fileList) && fileList.length > 0) {
      setInternalFileList(fileList);
      setInitialized(true);
    } else if (fileList && !Array.isArray(fileList)) {
      // Nếu fileList không phải là mảng nhưng có giá trị
      setInternalFileList([fileList]);
      setInitialized(true);
    } else if (initialImage && !initialized && !avatarRemoved) {
      // Chỉ sử dụng initialImage nếu:
      // 1. có giá trị initialImage
      // 2. chưa khởi tạo fileList trước đó
      // 3. avatar chưa bị xóa
      setInternalFileList([{
        uid: `-init-${Date.now()}`,
        name: 'initial-image.jpg',
        status: 'done',
        url: initialImage,
        isUrl: true
      }]);
      setInitialized(true);
    }
  }, [fileList, initialImage, avatarRemoved, initialized]);

  // Log internal fileList khi thay đổi để debug
  useEffect(() => {
    console.log('EnhancedImageUpload internalFileList state:', internalFileList);
  }, [internalFileList]);

  // Handle file upload changes
  const handleUploadChange = ({ fileList: newFileList, file }) => {
    console.log('Upload change event:', file, newFileList);

    // Xử lý đặc biệt cho trường hợp file đã bị xóa
    if (file && file.status === 'removed') {
      console.log('File removed in handleUploadChange');
      setInternalFileList([]);
      if (onChange) {
        onChange({
          fileList: [],
          file: { ...file, status: 'removed' }
        });
      }
      return;
    }

    // Validate các file và lọc những file không hợp lệ
    const validFiles = newFileList.filter(file => {
      // Kiểm tra kích thước nếu là file mới (có originFileObj)
      if (file.originFileObj && file.size > 2 * 1024 * 1024) {
        message.error(`File "${file.name}" vượt quá 2MB!`);
        return false;
      }
      return true;
    });

    setInternalFileList(validFiles);

    // Gọi callback onChange để thông báo cho component cha
    if (onChange) {
      // Tạo một đối tượng có cấu trúc giống như event của Ant Design Upload
      onChange({
        fileList: validFiles,
        file: file
      });
    }
  };

  // Handle file upload before actual upload
  const handleBeforeUpload = (file) => {
    console.log('Before upload:', file);

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      message.error('Hình ảnh không được vượt quá 2MB!');
      return Upload.LIST_IGNORE;
    }

    // Check file format
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ chấp nhận file hình ảnh!');
      return Upload.LIST_IGNORE;
    }

    // Return false to stop automatic upload
    return false;
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalVisible(false);
    setImageUrl('');
  };

  // Handle URL submission
  const handleUrlSubmit = () => {
    if (!imageUrl) {
      message.error('Vui lòng nhập URL hình ảnh');
      return;
    }

    // Validate URL format
    let url;
    try {
      url = new URL(imageUrl);
    } catch (error) {
      message.error('URL không hợp lệ');
      return;
    }

    // Create a new file object with URL
    const newFile = {
      uid: `url-${Date.now()}`,
      name: `image-${Date.now()}.jpg`,
      status: 'done',
      url: imageUrl,
      thumbUrl: imageUrl,
      isUrl: true // Flag to indicate this is a URL, not a file
    };

    // Add to file list
    let newFileList;

    if (maxCount === 1 && !multiple) {
      // For single image upload, replace existing
      newFileList = [newFile];
    } else if (internalFileList.length >= maxCount) {
      // For multiple images, remove first if at max
      newFileList = [...internalFileList];
      newFileList.splice(0, 1);
      newFileList.push(newFile);
    } else {
      // Otherwise just add
      newFileList = [...internalFileList, newFile];
    }

    setInternalFileList(newFileList);

    // Call onChange callback
    if (onChange) {
      onChange({
        fileList: newFileList,
        file: newFile
      });
    }

    // Close modal and reset
    setIsModalVisible(false);
    setImageUrl('');
  };

  // Handle preview
  const handlePreview = async (file) => {
    console.log('Preview file:', file);

    if (!file.url && !file.preview) {
      if (file.originFileObj) {
        file.preview = await getBase64(file.originFileObj);
      } else {
        // Trường hợp không có originFileObj cũng không có URL
        message.error('Không thể xem trước hình ảnh này');
        return;
      }
    }

    setPreviewImage(file.url || file.preview);
    setIsPreviewVisible(true);
    setPreviewTitle(
      file.name ||
      (file.url && typeof file.url === 'string' ? file.url.substring(file.url.lastIndexOf('/') + 1) : 'preview.jpg')
    );
  };

  // Convert file to base64 for preview
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Xử lý khi xóa file
  const handleRemove = (file) => {
    console.log('Removing file:', file);
    setInitialized(false); // Reset initialized state để ngăn việc load lại initialImage

    // Gọi callback onChange với fileList rỗng và status = 'removed'
    if (onChange) {
      onChange({
        fileList: [],
        file: { ...file, status: 'removed' }
      });
    }
    return true; // Cho phép xóa file
  };

  // Determine whether to show the add button
  const showAddButton = internalFileList.length < maxCount;

  return (
    <>
      <Upload
        listType={listType}
        fileList={internalFileList}
        onChange={handleUploadChange}
        beforeUpload={handleBeforeUpload}
        onPreview={handlePreview}
        maxCount={maxCount}
        multiple={multiple}
        accept="image/*"
        onRemove={handleRemove}
        {...props}
      >
        {showAddButton && listType === 'picture-card' && (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải lên</div>
          </div>
        )}
        {showAddButton && listType !== 'picture-card' && (
          <Button icon={<UploadOutlined />}>Chọn file</Button>
        )}
      </Upload>

      {showAddButton && (
        <Button
          type="dashed"
          icon={<LinkOutlined />}
          onClick={() => setIsModalVisible(true)}
          style={{ marginTop: 8 }}
        >
          Thêm URL hình ảnh
        </Button>
      )}

      {/* Modal for URL input */}
      <Modal
        title="Thêm hình ảnh từ URL"
        open={isModalVisible}
        onOk={handleUrlSubmit}
        onCancel={handleCancel}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form layout="vertical">
          <Form.Item
            label="URL hình ảnh"
            rules={[{ required: true, message: 'Vui lòng nhập URL hình ảnh' }]}
          >
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onPressEnter={handleUrlSubmit}
            />
          </Form.Item>
          {imageUrl && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <p>Xem trước:</p>
              <Image
                src={imageUrl}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200 }}
                fallback="data:image/png;base64,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"
              />
            </div>
          )}
        </Form>
      </Modal>

      {/* Preview modal */}
      <Modal
        open={isPreviewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setIsPreviewVisible(false)}
      >
        <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default EnhancedImageUpload;