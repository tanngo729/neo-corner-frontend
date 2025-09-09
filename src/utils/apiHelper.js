// src/utils/apiHelper.js
import { message } from 'antd';
import { adminInstance, clientInstance } from '../config/api';

const apiCache = new Map();
const pendingRequests = new Map();
const CACHE_EXPIRATION = 5 * 60 * 1000;

const recentErrors = new Map();
const ERROR_DEBOUNCE_TIME = 2000;

const INVALIDATE_CACHE_PATTERNS = [
  '/products',
  '/categories',
  '/users',
  '/cart',
];


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
        if (isLoginEndpoint) {
          message.error(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng', errorMessageDuration);
        }
        else if (isProfileEndpoint || error.config?.url?.includes('/auth/refresh')) {
          message.warning('Đang thử kết nối lại...', 2);


          if (isAdmin && !isDuplicate) {
            try {
              const currentToken = localStorage.getItem('adminToken');
              if (currentToken) {
                message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 3);
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/admin/login';
              }
            } catch (err) {
              console.error('Error handling token expiration:', err);
            }
          }
        }
        // Bỏ qua lỗi 401 cho các request liên quan đến socket
        else if (error.config?.url?.includes('socket.io')) {

        }
        else {
          message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errorMessageDuration);
          if (isAdmin) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/admin/login';
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
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
  if (adminInstance.interceptors.request.handlers?.length) {
    adminInstance.interceptors.request.handlers = [];
  }
  if (adminInstance.interceptors.response.handlers?.length) {
    adminInstance.interceptors.response.handlers = [];
  }
  if (clientInstance.interceptors.request.handlers?.length) {
    clientInstance.interceptors.request.handlers = [];
  }
  if (clientInstance.interceptors.response.handlers?.length) {
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
            invalidateCache(pattern);
          }
        });
      }
      if (response.config.url.includes('/cart')) {
        invalidateCache('/cart');
      }
      return response;
    },
    (error) => handleApiError(error, false)
  );
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
  apiCache.clear();
};