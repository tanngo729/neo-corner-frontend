import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  admin: `${BASE_URL}/admin`,
  client: BASE_URL
};

// Tạo instance axios
const createAxiosInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return instance;
};

export const adminInstance = createAxiosInstance(API_ENDPOINTS.admin);
export const clientInstance = createAxiosInstance(API_ENDPOINTS.client);