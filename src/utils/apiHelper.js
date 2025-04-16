// src/utils/apiHelper.js
import { message } from 'antd';
import { adminInstance, clientInstance } from '../config/api';

const apiCache = new Map();
const pendingRequests = new Map();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 phút

// Thêm map để theo dõi các thông báo lỗi gần đây
const recentErrors = new Map();
const ERROR_DEBOUNCE_TIME = 2000; // 2 giây - thời gian tối thiểu giữa các thông báo lỗi giống nhau

// Danh sách các URL patterns cần vô hiệu hóa cache sau khi có mutation
const INVALIDATE_CACHE_PATTERNS = [
  '/products', // Vô hiệu cache cho API products
  '/categories', // Vô hiệu cache cho API categories
  '/users', // Vô hiệu cache cho API users
  '/cart', // Vô hiệu cache cho API giỏ hàng
];

// Config mặc định để đảm bảo request không sử dụng cache 
const NO_CACHE_CONFIG = {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  cache: false
};

const errorMessageDuration = 4;

const createCacheKey = (config) => {
  const { url, method, params, data } = config;
  return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

export const invalidateCache = (urlPattern) => {
  let count = 0;
  for (const [key] of apiCache) {
    if (key.includes(urlPattern)) {
      apiCache.delete(key);
      count++;
    }
  }
  if (count > 0) {
    console.log(`Đã vô hiệu hóa ${count} cache entries cho pattern: ${urlPattern}`);
  }
};

export const invalidateCacheByPatterns = (patterns = INVALIDATE_CACHE_PATTERNS) => {
  patterns.forEach(pattern => invalidateCache(pattern));
};

export const handleApiError = (error, isAdmin = false) => {
  // Kiểm tra có bỏ qua thông báo lỗi không
  const skipErrorMessage = error.config?.skipErrorMessage === true;
  // Kiểm tra trang đang tải ban đầu
  const isInitialPageLoad = document.readyState !== 'complete';
  // Kiểm tra xem có phải là API profile không (để tránh xử lý 401 quá nghiêm ngặt)
  const isProfileEndpoint = error.config?.url?.includes('/auth/profile') ||
    error.config?.url?.includes('/auth/me');

  if (error.response) {
    const { status, data } = error.response;
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    const isRegisterEndpoint = error.config?.url?.includes('/auth/register');

    // Tạo key cho lỗi này dựa trên status và message
    const errorKey = `${status}-${data.message || 'unknown'}`;
    const now = Date.now();
    const lastShown = recentErrors.get(errorKey);
    const isDuplicate = lastShown && (now - lastShown < ERROR_DEBOUNCE_TIME);

    if (skipErrorMessage ||
      (isInitialPageLoad && !isLoginEndpoint && !isRegisterEndpoint) ||
      isDuplicate) {
      console.log(`Bỏ qua thông báo lỗi cho ${error.config?.url || 'unknown URL'}`);
      if (error.config) {
        const cacheKey = createCacheKey(error.config);
        pendingRequests.delete(cacheKey);
      }
      return Promise.reject(error);
    }

    recentErrors.set(errorKey, now);
    if (recentErrors.size > 50) {
      const oldestKey = [...recentErrors.keys()][0];
      recentErrors.delete(oldestKey);
    }

    // CẬP NHẬT XỬ LÝ LỖI 401
    switch (status) {
      case 401:
        // Đối với API login, chỉ hiển thị thông báo lỗi không chuyển hướng
        if (isLoginEndpoint) {
          message.error(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng', errorMessageDuration);
        }
        // Đối với API profile hoặc refresh token, không đăng xuất
        else if (isProfileEndpoint || error.config?.url?.includes('/auth/refresh')) {
          console.log('Lỗi API profile/refresh:', data.message || 'Phiên đăng nhập đã hết hạn');
          message.warning('Đang thử kết nối lại...', 2);

          // Xử lý riêng cho admin - không đăng xuất ngay
          if (isAdmin && !isDuplicate) {
            try {
              // Tăng thời gian chờ trước khi đăng xuất nếu là admin
              setTimeout(() => {
                // Kiểm tra lại trước khi đăng xuất
                const currentToken = localStorage.getItem('adminToken');
                if (currentToken) {
                  message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 3);
                  setTimeout(() => {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/admin/login';
                  }, 3000);
                }
              }, 10000); // Đợi 10 giây
            } catch (err) {
              console.error('Lỗi xử lý token admin:', err);
            }
          }
        }
        // Bỏ qua lỗi 401 cho các request liên quan đến socket
        else if (error.config?.url?.includes('socket.io')) {
          console.log('Bỏ qua lỗi 401 cho request socket.io');
          // Không làm gì, bỏ qua lỗi này
        }
        else {
          // Thời gian chờ ngắn hơn cho client
          const waitTime = isAdmin ? 3000 : 2000;
          message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errorMessageDuration);
          setTimeout(() => {
            if (isAdmin) {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminUser');
              window.location.href = '/admin/login';
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          }, waitTime);
        }
        break;

      case 403:
        message.error(data.message || 'Bạn không có quyền thực hiện hành động này', errorMessageDuration);
        break;

      case 404:
        message.error('Không tìm thấy tài nguyên', errorMessageDuration);
        break;

      case 500:
        message.error('Lỗi máy chủ, vui lòng thử lại sau', errorMessageDuration);
        break;

      default:
        if (!isLoginEndpoint && !isRegisterEndpoint) {
          if (data && data.message) {
            message.error(data.message, errorMessageDuration);
          } else {
            message.error('Đã xảy ra lỗi', errorMessageDuration);
          }
        }
    }
  } else if (error.request && !skipErrorMessage && !isInitialPageLoad) {
    message.error('Không thể kết nối đến máy chủ', errorMessageDuration);
  } else if (!skipErrorMessage && !isInitialPageLoad) {
    message.error('Lỗi: ' + error.message, errorMessageDuration);
  }

  if (error.config) {
    const cacheKey = createCacheKey(error.config);
    pendingRequests.delete(cacheKey);
  }

  return Promise.reject(error);
};

export const setupInterceptors = () => {
  console.log('Đang thiết lập interceptors cho API...');

  if (adminInstance.interceptors.request.handlers?.length) {
    console.log('Xóa interceptor request cũ cho admin');
    adminInstance.interceptors.request.handlers = [];
  }
  if (adminInstance.interceptors.response.handlers?.length) {
    console.log('Xóa interceptor response cũ cho admin');
    adminInstance.interceptors.response.handlers = [];
  }
  if (clientInstance.interceptors.request.handlers?.length) {
    console.log('Xóa interceptor request cũ cho client');
    clientInstance.interceptors.request.handlers = [];
  }
  if (clientInstance.interceptors.response.handlers?.length) {
    console.log('Xóa interceptor response cũ cho client');
    clientInstance.interceptors.response.handlers = [];
  }

  // ADMIN INTERCEPTORS
  adminInstance.interceptors.request.use(
    (config) => {
      const adminToken = localStorage.getItem('adminToken');
      if (document.readyState !== 'complete' && !config.skipErrorMessage) {
        config.skipErrorMessage = true;
      }
      if (!config.url.includes('/auth/login')) {
        console.log('Admin API Request:', config.url);
      }
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
      if (config.url.includes('/cart')) {
        config.cache = false;
        config.headers = {
          ...config.headers,
          ...NO_CACHE_CONFIG.headers
        };
      }
      if (config.method?.toLowerCase() === 'get' && config.cache !== false) {
        const cacheKey = createCacheKey(config);
        const cachedResponse = apiCache.get(cacheKey);
        if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_EXPIRATION) {
          config.adapter = () => {
            return Promise.resolve({
              data: cachedResponse.data,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
              request: {}
            });
          };
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  adminInstance.interceptors.response.use(
    (response) => {
      if (response.config.method?.toLowerCase() === 'get' &&
        response.config.cache !== false &&
        !response.config.url.includes('/cart')) {
        const cacheKey = createCacheKey(response.config);
        apiCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        pendingRequests.delete(cacheKey);
      }
      if (response.config.method?.toLowerCase() !== 'get') {
        INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
          if (response.config.url.includes(pattern)) {
            console.log(`Vô hiệu cache cho pattern: ${pattern}`);
            invalidateCache(pattern);
          }
        });
      }
      return response;
    },
    (error) => handleApiError(error, true)
  );

  // CLIENT INTERCEPTORS
  clientInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (document.readyState !== 'complete' && !config.skipErrorMessage) {
        config.skipErrorMessage = true;
      }
      if (!config.url.includes('/auth/login')) {
        console.log('Client API Request:', config.url, 'Token:', token ? 'Có' : 'Không');
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.url.includes('/cart')) {
        config.cache = false;
        config.headers = {
          ...config.headers,
          ...NO_CACHE_CONFIG.headers
        };
        console.log('Áp dụng no-cache cho cart request:', config.url);
      }
      if (config.method?.toLowerCase() === 'get' && config.cache !== false) {
        const cacheKey = createCacheKey(config);
        const cachedResponse = apiCache.get(cacheKey);
        if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_EXPIRATION) {
          config.adapter = () => {
            return Promise.resolve({
              data: cachedResponse.data,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
              request: {}
            });
          };
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  clientInstance.interceptors.response.use(
    (response) => {
      if (response.config.method?.toLowerCase() === 'get' &&
        response.config.cache !== false &&
        !response.config.url.includes('/cart')) {
        const cacheKey = createCacheKey(response.config);
        apiCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        pendingRequests.delete(cacheKey);
      }
      if (response.config.method?.toLowerCase() !== 'get') {
        INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
          if (response.config.url.includes(pattern)) {
            console.log(`Vô hiệu cache cho pattern: ${pattern}`);
            invalidateCache(pattern);
          }
        });
      }
      if (response.config.url.includes('/cart')) {
        console.log('Vô hiệu cache cho tất cả các request liên quan đến giỏ hàng');
        invalidateCache('/cart');
      }
      return response;
    },
    (error) => handleApiError(error, false)
  );

  console.log('Thiết lập interceptors hoàn tất');
};

export const fetchWithCache = async (api, url, config = {}) => {
  if (url.includes('/cart')) {
    config.cache = false;
    config.headers = {
      ...config.headers,
      ...NO_CACHE_CONFIG.headers
    };
  }
  const requestConfig = {
    ...config,
    url,
    method: config.method || 'get',
  };
  const cacheKey = createCacheKey(requestConfig);
  if (!url.includes('/cart') && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  if (!url.includes('/cart') &&
    requestConfig.method.toLowerCase() === 'get' &&
    requestConfig.cache !== false) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      return Promise.resolve({ data: cached.data });
    }
  }
  const requestPromise = api(url, requestConfig);
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export const adminGet = (url, config = {}) => {
  return fetchWithCache((url, config) => adminInstance.get(url, config), url, config);
};

export const adminPost = (url, data, config = {}) => {
  return adminInstance.post(url, data, config).then(response => {
    INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
      if (url.includes(pattern)) {
        invalidateCache(pattern);
      }
    });
    return response;
  });
};

export const adminPut = (url, data, config = {}) => {
  return adminInstance.put(url, data, config).then(response => {
    INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
      if (url.includes(pattern)) {
        invalidateCache(pattern);
      }
    });
    return response;
  });
};

export const adminDelete = (url, config = {}) => {
  return adminInstance.delete(url, config).then(response => {
    INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
      if (url.includes(pattern)) {
        invalidateCache(pattern);
      }
    });
    return response;
  });
};

export const clientGet = (url, config = {}) => {
  if (url.includes('/cart')) {
    config = {
      ...config,
      ...NO_CACHE_CONFIG
    };
  }
  return fetchWithCache((url, config) => clientInstance.get(url, config), url, config);
};

export const clientPost = (url, data, config = {}) => {
  if (url.includes('/cart')) {
    config = {
      ...config,
      ...NO_CACHE_CONFIG
    };
  }
  return clientInstance.post(url, data, config).then(response => {
    INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
      if (url.includes(pattern)) {
        invalidateCache(pattern);
      }
    });
    if (url.includes('/cart')) {
      invalidateCache('/cart');
    }
    return response;
  });
};

export const clientPut = (url, data, config = {}) => {
  if (url.includes('/cart')) {
    config = {
      ...config,
      ...NO_CACHE_CONFIG
    };
  }
  return clientInstance.put(url, data, config).then(response => {
    INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
      if (url.includes(pattern)) {
        invalidateCache(pattern);
      }
    });
    if (url.includes('/cart')) {
      invalidateCache('/cart');
    }
    return response;
  });
};

export const clientDelete = (url, config = {}) => {
  if (url.includes('/cart')) {
    config = {
      ...config,
      ...NO_CACHE_CONFIG
    };
  }
  return clientInstance.delete(url, config).then(response => {
    INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
      if (url.includes(pattern)) {
        invalidateCache(pattern);
      }
    });
    if (url.includes('/cart')) {
      invalidateCache('/cart');
    }
    return response;
  });
};

export const clearApiCache = () => {
  console.log("Xóa toàn bộ cache API");
  apiCache.clear();
};