// src/services/admin/profileService.js
import { adminInstance } from '../../config/api';

// Lấy thông tin cá nhân
const getProfile = async () => {
  try {
    const response = await adminInstance.get('/profile');
    if (process.env.NODE_ENV === 'development') {
      console.log('Profile API response:', response.data);
    }
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin cá nhân:', error);
    throw error;
  }
};

// Cập nhật thông tin cá nhân
const updateProfile = async (profileData) => {
  try {
    // Check if profileData is FormData
    const isFormData = profileData instanceof FormData;
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating profile with', isFormData ? 'FormData' : 'JSON data');
    }

    // Debugs (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      if (isFormData) {
        console.log('FormData contents:');
        for (let pair of profileData.entries()) {
          if (pair[0] === 'avatar') {
            console.log(pair[0], 'File object:', pair[1] instanceof File);
          } else {
            console.log(pair[0], pair[1]);
          }
        }
      } else {
        console.log('JSON data:', profileData);
      }
    }

    const response = await adminInstance.patch('/profile/update', profileData, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Profile update response:', response.data);
    }
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
    throw error;
  }
};

// Đổi mật khẩu
const changePassword = async (passwordData) => {
  try {
    const response = await adminInstance.patch('/profile/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    throw error;
  }
};

// Export default
const profileService = {
  getProfile,
  updateProfile,
  changePassword
};

export default profileService;