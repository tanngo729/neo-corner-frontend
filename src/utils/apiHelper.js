// src/utils/apiHelper.js
import { message } from 'antd';
import { adminInstance, clientInstance } from '../config/api';

const apiCache = new Map();
const pendingRequests = new Map();
const CACHE_EXPIRATION = 5 * 60 * 1000;  // 5 phút

// Thêm map để theo dõi các thông báo lỗi gần đây
const recentErrors = new Map();
const ERROR_DEBOUNCE_TIME = 2000; // 2 giây - thời gian tối thiểu giữa các thông báo lỗi giống nhau

// Danh sách các URL patterns cần vô hiệu hóa cache sau khi có mutation
const INVALIDATE_CACHE_PATTERNS = [
  '/products', // Vô hiệu hóa cache cho các API products
  '/categories', // Vô hiệu hóa cache cho các API categories
  '/users', // Vô hiệu hóa cache cho các API users
  '/cart', // Thêm vào để vô hiệu hóa cache cho các API giỏ hàng
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

// Vô hiệu hóa cache cho một pattern URL cụ thể
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

// Vô hiệu hóa toàn bộ cache liên quan đến nhiều pattern
export const invalidateCacheByPatterns = (patterns = INVALIDATE_CACHE_PATTERNS) => {
  patterns.forEach(pattern => invalidateCache(pattern));
};

// Sửa đổi hàm xử lý lỗi để không tự động chuyển hướng cho các API login
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

    // Kiểm tra nếu thông báo này đã hiển thị gần đây
    const isDuplicate = lastShown && (now - lastShown < ERROR_DEBOUNCE_TIME);

    if (skipErrorMessage ||
      (isInitialPageLoad && !isLoginEndpoint && !isRegisterEndpoint) ||
      isDuplicate) {
      console.log(`Bỏ qua thông báo lỗi cho ${error.config?.url || 'unknown URL'}`);

      // Vẫn xử lý việc xóa request khỏi pending
      if (error.config) {
        const cacheKey = createCacheKey(error.config);
        pendingRequests.delete(cacheKey);
      }

      return Promise.reject(error);
    }

    // Lưu thời gian hiển thị thông báo này
    recentErrors.set(errorKey, now);

    // Dọn dẹp recentErrors nếu quá lớn
    if (recentErrors.size > 50) {
      const oldestKey = [...recentErrors.keys()][0];
      recentErrors.delete(oldestKey);
    }

    // Xử lý các loại lỗi khác nhau
    switch (status) {
      case 401:
        // Đối với API login, chỉ hiển thị thông báo lỗi không chuyển hướng
        if (isLoginEndpoint) {
          message.error(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng', errorMessageDuration);
        }
        // ĐỐI với API profile, chỉ hiển thị thông báo, không chuyển hướng - để AuthContext xử lý
        else if (isProfileEndpoint) {
          console.log('Lỗi profile API:', data.message || 'Phiên đăng nhập đã hết hạn');
          message.error('Phiên đăng nhập không hợp lệ, đang sử dụng dữ liệu đã lưu', errorMessageDuration);
          // Không tự động xóa token hoặc chuyển hướng đến trang đăng nhập
        }
        else {
          // Thông báo đăng nhập lại cho các endpoint khác
          message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errorMessageDuration);

          // Delay chuyển hướng để người dùng có thể đọc thông báo
          setTimeout(() => {
            if (isAdmin) {
              localStorage.removeItem('adminToken');
              window.location.href = '/admin/login';
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('user'); // Thêm dòng này để xóa cả user
              window.location.href = '/login';
            }
          }, 2000);
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
        // Không hiển thị lỗi từ endpoint login và register ở đây (đã xử lý trong phương thức login và register)
        if (!isLoginEndpoint && !isRegisterEndpoint) {
          if (data && data.message) {
            message.error(data.message, errorMessageDuration);
          } else {
            message.error('Đã xảy ra lỗi', errorMessageDuration);
          }
        }
    }
  } else if (error.request && !skipErrorMessage && !isInitialPageLoad) {
    // Chỉ hiển thị lỗi kết nối nếu không bỏ qua và không phải đang tải trang
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

  // Xóa interceptor cũ nếu có
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

      // Đánh dấu request tự động khi trang đang tải
      if (document.readyState !== 'complete' && !config.skipErrorMessage) {
        config.skipErrorMessage = true;
      }

      // Chỉ log các request không phải login để tránh log thông tin nhạy cảm
      if (!config.url.includes('/auth/login')) {
        console.log('Admin API Request:', config.url);
      }

      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }

      // Nếu là request liên quan đến cart, luôn đặt không cache
      if (config.url.includes('/cart')) {
        config.cache = false;
        config.headers = {
          ...config.headers,
          ...NO_CACHE_CONFIG.headers
        };
      }

      // Xử lý cache cho GET request
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
      // Cache response cho GET request nếu không phải API cart
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

      // Auto invalidate cache cho các request không phải GET (POST, PUT, DELETE)
      if (response.config.method?.toLowerCase() !== 'get') {
        // Nếu url chứa urlPattern, vô hiệu hóa cache cho pattern đó
        INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
          if (response.config.url.includes(pattern)) {
            console.log(`Vô hiệu hóa cache cho pattern: ${pattern}`);
            invalidateCache(pattern);
          }
        });
      }

      return response;
    },
    (error) => handleApiError(error, true)
  );

  // CLIENT INTERCEPTORS - tương tự như admin
  clientInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');

      // Đánh dấu request tự động khi trang đang tải
      if (document.readyState !== 'complete' && !config.skipErrorMessage) {
        config.skipErrorMessage = true;
      }

      // Chỉ log các request không phải login
      if (!config.url.includes('/auth/login')) {
        console.log('Client API Request:', config.url, 'Token:', token ? 'Có' : 'Không');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Nếu là request liên quan đến cart, luôn đặt không cache
      if (config.url.includes('/cart')) {
        config.cache = false;
        config.headers = {
          ...config.headers,
          ...NO_CACHE_CONFIG.headers
        };
        console.log('Áp dụng no-cache cho cart request:', config.url);
      }

      // Xử lý cache cho GET request nếu không được đánh dấu là không cache
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
      // Cache response cho GET request nếu không phải API cart
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

      // Auto invalidate cache cho các request không phải GET (POST, PUT, DELETE)
      if (response.config.method?.toLowerCase() !== 'get') {
        INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
          if (response.config.url.includes(pattern)) {
            console.log(`Vô hiệu hóa cache cho pattern: ${pattern}`);
            invalidateCache(pattern);
          }
        });
      }

      // Nếu request liên quan đến cart, luôn invalidate cache pattern '/cart'
      if (response.config.url.includes('/cart')) {
        console.log('Vô hiệu hóa tất cả cache liên quan đến giỏ hàng');
        invalidateCache('/cart');
      }

      return response;
    },
    (error) => handleApiError(error, false)
  );

  console.log('Thiết lập interceptors hoàn tất');
};

// Helper function để fetch với cache và deduplicate requests
export const fetchWithCache = async (api, url, config = {}) => {
  // Nếu là cart API, luôn bỏ qua cache
  if (url.includes('/cart')) {
    config.cache = false;
    // Thêm header để đảm bảo không cache
    config.headers = {
      ...config.headers,
      ...NO_CACHE_CONFIG.headers
    };
  }

  // Ghép url và config để tạo request config hoàn chỉnh
  const requestConfig = {
    ...config,
    url,
    method: config.method || 'get',
  };

  const cacheKey = createCacheKey(requestConfig);

  // Nếu đang có request đang pending và không phải cart API, trả về promise đó
  if (!url.includes('/cart') && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Với GET request, kiểm tra cache trừ khi là cart API hoặc cache:false
  if (!url.includes('/cart') && requestConfig.method.toLowerCase() === 'get' && requestConfig.cache !== false) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      return Promise.resolve({ data: cached.data });
    }
  }

  // Thực hiện request và lưu vào pending
  const requestPromise = api(url, requestConfig);
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
};

// API helpers với caching và deduplicate
export const adminGet = (url, config = {}) => {
  return fetchWithCache((url, config) => adminInstance.get(url, config), url, config);
};

export const adminPost = (url, data, config = {}) => {
  // Sau khi POST thành công, vô hiệu hóa cache tự động
  return adminInstance.post(url, data, config).then(response => {
    // Tự động vô hiệu hóa cache cho các liên quan
    INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
      if (url.includes(pattern)) {
        invalidateCache(pattern);
      }
    });
    return response;
  });
};

export const adminPut = (url, data, config = {}) => {
  // Sau khi PUT thành công, vô hiệu hóa cache tự động
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
  // Sau khi DELETE thành công, vô hiệu hóa cache tự động
  return adminInstance.delete(url, config).then(response => {
    INVALIDATE_CACHE_PATTERNS.forEach(pattern => {
      if (url.includes(pattern)) {
        invalidateCache(pattern);
      }
    });
    return response;
  });
};

// Client helpers - tương tự như admin
export const clientGet = (url, config = {}) => {
  // Với cart API, luôn bỏ qua cache
  if (url.includes('/cart')) {
    config = {
      ...config,
      ...NO_CACHE_CONFIG
    };
  }
  return fetchWithCache((url, config) => clientInstance.get(url, config), url, config);
};

export const clientPost = (url, data, config = {}) => {
  // Đảm bảo không cache cho cart API
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

    // Luôn vô hiệu hóa cache cart nếu đây là cart API
    if (url.includes('/cart')) {
      invalidateCache('/cart');
    }

    return response;
  });
};

export const clientPut = (url, data, config = {}) => {
  // Đảm bảo không cache cho cart API
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

    // Luôn vô hiệu hóa cache cart nếu đây là cart API
    if (url.includes('/cart')) {
      invalidateCache('/cart');
    }

    return response;
  });
};

export const clientDelete = (url, config = {}) => {
  // Đảm bảo không cache cho cart API
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

    // Luôn vô hiệu hóa cache cart nếu đây là cart API
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