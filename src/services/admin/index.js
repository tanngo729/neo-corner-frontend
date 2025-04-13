// src/services/admin/index.js
import authService from './authService';
import profileService from './profileService';
import userService from './userService';

export {
  authService,
  profileService,
  userService
};

export default {
  auth: authService,
  profile: profileService,
  user: userService
};