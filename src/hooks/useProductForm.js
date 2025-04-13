import { useState, useEffect } from 'react';
import { Form, message } from 'antd';
import { getProductById, createProduct, updateProduct } from '../services/admin/productService';

export const useProductForm = (productId, isEdit) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [product, setProduct] = useState(null);
  const [keepImages, setKeepImages] = useState(true);
  const [removedImages, setRemovedImages] = useState([]);

  // Fetch product details if editing
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isEdit || !productId) return;

      try {
        setLoading(true);
        const response = await getProductById(productId);

        if (response.success) {
          const productData = response.data;
          setProduct(productData);

          // Populate form with product data
          form.setFieldsValue({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            originalPrice: productData.originalPrice,
            discountPercentage: productData.discountPercentage,
            category: productData.category?._id,
            stock: productData.stock,
            status: productData.status,
            featured: productData.featured
          });

          // Convert existing images to fileList format
          if (productData.images && productData.images.length > 0) {
            const images = productData.images.map((image, index) => ({
              uid: `-${index}`,
              name: `image-${index}`,
              status: 'done',
              url: image.url,
              publicId: image.publicId, // Store publicId for cloudinary
              originFileObj: null,
              isExisting: true // Mark as existing image
            }));
            setFileList(images);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin sản phẩm:', error);
        message.error('Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [isEdit, productId, form]);

  // Handle image change (upload, remove)
  const handleImageChange = (info) => {
    console.log('useProductForm - handleImageChange:', info);

    // Đảm bảo có fileList và file từ info
    if (!info || (!info.fileList && !info.file)) {
      console.error('Thông tin fileList không hợp lệ:', info);
      return;
    }

    const { fileList: newFileList, file } = info;

    // Kiểm tra xem file có tồn tại và có status không
    if (file && typeof file.status !== 'undefined') {
      console.log('Xử lý thay đổi hình ảnh:', file.status, file);

      // Check if it's a file removal operation
      if (file.status === 'removed') {
        if (file.isExisting && file.publicId) {
          console.log('Thêm ảnh vào danh sách xóa:', file.publicId);
          // Track removed existing images to delete them from server
          setRemovedImages(prev => [...prev, file.publicId]);
        }

        // Chỉ set keepImages = false khi tất cả ảnh đều bị xóa
        const remainingExistingImages = newFileList.filter(f => f && f.isExisting);
        setKeepImages(remainingExistingImages.length > 0);

        console.log('Số ảnh còn lại sau khi xóa:', remainingExistingImages.length);
      }
    }

    setFileList(newFileList);
  };

  // Reset form
  const resetForm = () => {
    form.resetFields();
    setFileList([]);
    setRemovedImages([]);

    // If editing, reset to original product data
    if (isEdit && product) {
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: product.discountPercentage,
        category: product.category?._id,
        stock: product.stock,
        status: product.status,
        featured: product.featured
      });

      if (product.images && product.images.length > 0) {
        const images = product.images.map((image, index) => ({
          uid: `-${index}`,
          name: `image-${index}`,
          status: 'done',
          url: image.url,
          publicId: image.publicId,
          originFileObj: null,
          isExisting: true
        }));
        setFileList(images);
      }

      setKeepImages(true);
    }
  };

  // Submit form
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      console.log('Đang gửi form với fileList:', fileList);
      console.log('Danh sách ảnh đã xóa:', removedImages);

      // Prepare form data
      const formData = new FormData();

      // Add form fields
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });

      // Handle image files
      if (fileList && fileList.length > 0) {
        // Lọc ra các file mới (có originFileObj)
        const newUploadFiles = fileList.filter(file => file && !!file.originFileObj);

        console.log('Danh sách file mới sẽ upload:', newUploadFiles.length);

        newUploadFiles.forEach((file, index) => {
          if (file && file.originFileObj) {
            console.log(`Đang thêm file ${index + 1}:`, file.name);
            formData.append('images', file.originFileObj);
          }
        });

        // Lọc và xử lý các URL
        const urlImages = fileList.filter(file => file && file.isUrl);
        if (urlImages.length > 0) {
          const imageUrls = urlImages.map(file => file.url);
          formData.append('imageUrls', JSON.stringify(imageUrls));
          console.log('Gửi URLs lên server:', imageUrls);
        }

        // For edit mode, determine if we should keep existing images
        if (isEdit) {
          // Nếu còn ảnh cũ và không phải tất cả ảnh đều bị xóa, giữ lại ảnh
          const hasExistingImages = fileList.some(file => file && file.isExisting);
          formData.append('keepImages', hasExistingImages ? 'true' : 'false');
          console.log('Giữ lại ảnh cũ:', hasExistingImages);

          // Add removed image IDs to request
          if (removedImages && removedImages.length > 0) {
            formData.append('removedImages', JSON.stringify(removedImages));
            console.log('Gửi danh sách ảnh cần xóa:', JSON.stringify(removedImages));
          }
        }
      } else {
        // Không có hình ảnh nào
        if (isEdit) {
          formData.append('keepImages', 'false');
          console.log('Không giữ lại ảnh cũ vì không còn ảnh nào');
        }
      }

      // Log form data for debugging
      for (let pair of formData.entries()) {
        if (pair[0] === 'images') {
          console.log(pair[0], 'File object:', pair[1] instanceof File, {
            name: pair[1].name,
            type: pair[1].type,
            size: pair[1].size
          });
        } else {
          console.log('FormData entry:', pair[0], pair[1]);
        }
      }

      // Send request
      let response;
      if (isEdit) {
        response = await updateProduct(productId, formData);
      } else {
        response = await createProduct(formData);
      }

      if (response.success) {
        message.success(isEdit ? 'Sản phẩm đã được cập nhật!' : 'Sản phẩm đã được tạo!');
        return response.data;
      } else {
        message.error(response.message || 'Đã xảy ra lỗi!');
        return null;
      }
    } catch (error) {
      console.error('Lỗi khi lưu sản phẩm:', error);
      message.error('Không thể lưu sản phẩm');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    fileList,
    product,
    keepImages,
    handleSubmit,
    handleImageChange,
    resetForm
  };
};