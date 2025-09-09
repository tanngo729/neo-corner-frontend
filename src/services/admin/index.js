// src/services/admin/index.js
import authService from './authService';
import profileService from './profileService';
import userService from './userService';
import bannerService from './bannerService';

export {
  authService,
  profileService,
  userService,
  bannerService
};

export default {
  auth: authService,
  profile: profileService,
  user: userService,
  banner: bannerService
};
