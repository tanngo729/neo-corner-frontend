// src/services/admin/profileService.js
import { adminInstance } from '../../config/api';

// Lấy thông tin cá nhân
const getProfile = async () => {
  try {
    const response = await adminInstance.get('/profile');
    console.log('Profile API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin cá nhân:', error);
    // Trả về response giả nếu đang trong quá trình phát triển
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock data for profile');
      return {
        success: true,
        data: {
          _id: '1',
          fullName: 'Admin User',
          email: 'admin@example.com',
          avatar: {
            url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            publicId: 'admin-avatar'
          },
          role: {
            _id: '1',
            name: 'Admin',
            permissions: ['users.view', 'users.create', 'users.edit', 'users.delete']
          }
        },
        message: 'Lấy thông tin người dùng thành công'
      };
    }
    throw error;
  }
};

// Cập nhật thông tin cá nhân
const updateProfile = async (profileData) => {
  try {
    // Check if profileData is FormData
    const isFormData = profileData instanceof FormData;
    console.log('Updating profile with', isFormData ? 'FormData' : 'JSON data');

    // Debugs
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

    const response = await adminInstance.patch('/profile/update', profileData, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    });

    console.log('Profile update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin cá nhân:', error);

    // Trả về response giả nếu đang trong quá trình phát triển
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock data for profile update');
      return {
        success: true,
        data: {
          _id: '1',
          fullName: profileData instanceof FormData ? profileData.get('fullName') : profileData.fullName,
          email: profileData instanceof FormData ? profileData.get('email') : profileData.email,
          avatar: {
            url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=updated',
            publicId: 'admin-avatar-updated'
          },
          role: {
            _id: '1',
            name: 'Admin',
            permissions: ['users.view', 'users.create', 'users.edit', 'users.delete']
          }
        },
        message: 'Cập nhật thông tin cá nhân thành công'
      };
    }

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

    // Trả về response giả nếu đang trong quá trình phát triển
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        message: 'Đổi mật khẩu thành công'
      };
    }

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