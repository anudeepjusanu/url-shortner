// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3015/api' || 'https://laghhu.link/api';

// API endpoints
const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    profile: '/auth/profile'
  },
  urls: {
    create: '/urls',
    list: '/urls',
    get: '/urls',
    update: '/urls',
    delete: '/urls',
    stats: '/urls/stats'
  },
  domains: {
    list: '/domains',
    add: '/domains',
    verify: '/domains',
    delete: '/domains'
  },
  analytics: {
    overview: '/analytics/dashboard',
    urls: '/analytics'
  }
};

// HTTP client class
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    // Try both token names for compatibility
    this.token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  }

  // Set authorization token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('accessToken', token); // Keep both for compatibility
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
    }
  }

  // Get authorization token
  getToken() {
    return this.token || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  }

  // Clear tokens
  clearTokens() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Convert body to JSON if it's an object
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle unsuccessful responses
      if (!response.ok) {
        // Handle 401 - Unauthorized (token expired)
        if (response.status === 401) {
          this.clearTokens();

          // Check if we're on a page that requires auth
          const currentPath = window.location.pathname;
          const publicPaths = ['/', '/login', '/register', '/landing'];

          // Only redirect if not already on a public page
          if (!publicPaths.includes(currentPath)) {
            console.error('Authentication required. Please login.');
          }

          throw new Error(data.message || 'Authentication required. Please login to continue.');
        }

        // Throw error with API response message
        throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      // Network or other errors
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and ensure the backend API is running.');
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return this.request(endpoint + url.search, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Auth API methods
export const authAPI = {
  register: async (userData) => {
    const url = `${apiClient.baseURL}${endpoints.auth.register}`;
    const token = apiClient.getToken();

    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...( token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(userData)
    };

    try {
      const res = await fetch(url, config);
      const response = await res.json();

      // Handle OTP required (status 202)
      if (res.status === 202 && response.data && response.data.otpSent) {
        return {
          ...response,
          otpRequired: true,
          otpData: response.data
        };
      }

      // Handle successful registration (status 201 or 200)
      if (res.ok && response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        if (accessToken) {
          apiClient.setToken(accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }
      }

      // Handle errors
      if (!res.ok) {
        throw new Error(response.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  login: async (credentials) => {
    const url = `${apiClient.baseURL}${endpoints.auth.login}`;
    const token = apiClient.getToken();

    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...( token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(credentials)
    };

    try {
      const res = await fetch(url, config);
      const response = await res.json();

      // Handle OTP required (status 202)
      if (res.status === 202 && response.data && response.data.otpSent) {
        return {
          ...response,
          otpRequired: true,
          otpData: response.data
        };
      }

      // Handle successful login (status 200)
      if (res.ok && response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        if (accessToken) {
          apiClient.setToken(accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }
      }

      // Handle errors
      if (!res.ok) {
        throw new Error(response.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post(endpoints.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API response
      apiClient.clearTokens();
    }
  },

  getProfile: async () => {
    return apiClient.get(endpoints.auth.profile);
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post(endpoints.auth.refreshToken, { refreshToken });

    if (response.success && response.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      apiClient.setToken(accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    return response;
  },
};

// URLs API methods
export const urlsAPI = {
  create: (urlData) => apiClient.post(endpoints.urls.create, urlData),
  list: (params) => apiClient.get(endpoints.urls.list, params),
  get: (id) => apiClient.get(`${endpoints.urls.get}/${id}`),
  update: (id, data) => apiClient.put(`${endpoints.urls.update}/${id}`, data),
  delete: (id) => apiClient.delete(`${endpoints.urls.delete}/${id}`),
  getStats: () => apiClient.get(endpoints.urls.stats),

  // Alternative method names for compatibility with frontend
  getUrls: (params) => apiClient.get(endpoints.urls.list, params),
  deleteUrl: (id) => apiClient.delete(`${endpoints.urls.delete}/${id}`),
  createUrl: (urlData) => apiClient.post(endpoints.urls.create, urlData),
  updateUrl: (id, data) => apiClient.put(`${endpoints.urls.update}/${id}`, data),

  // Get available domains for creating URLs
  getAvailableDomains: () => apiClient.get('/urls/domains/available'),
};

// Domains API methods
export const domainsAPI = {
  // Get all user domains
  getDomains: (params = {}) => apiClient.get(endpoints.domains.list, params),

  // Get single domain
  getDomain: (id) => apiClient.get(`${endpoints.domains.list}/${id}`),

  // Create new domain
  createDomain: (domainData) => apiClient.post(endpoints.domains.add, domainData),

  // Update domain
  updateDomain: (id, data) => apiClient.put(`${endpoints.domains.list}/${id}`, data),

  // Delete domain
  deleteDomain: (id) => apiClient.delete(`${endpoints.domains.delete}/${id}`),

  // Verify domain DNS
  verifyDomain: (id) => apiClient.post(`${endpoints.domains.verify}/${id}/verify`),

  // Set domain as default
  setDefaultDomain: (id) => apiClient.post(`${endpoints.domains.list}/${id}/set-default`),

  // Get domain statistics
  getDomainStats: () => apiClient.get(`${endpoints.domains.list}/stats`),

  // Get domain info (for DNS lookup)
  getDomainInfo: (domain) => apiClient.get(`${endpoints.domains.list}/info/${domain}`),

  // Legacy method names for backward compatibility
  list: (params) => apiClient.get(endpoints.domains.list, params),
  add: (domainData) => apiClient.post(endpoints.domains.add, domainData),
  verify: (id) => apiClient.post(`${endpoints.domains.verify}/${id}/verify`),
  delete: (id) => apiClient.delete(`${endpoints.domains.delete}/${id}`),
};

// Analytics API methods
export const analyticsAPI = {
  getOverview: (params) => apiClient.get('/analytics/dashboard', params),
  getUrlAnalytics: (id, params) => apiClient.get(`/analytics/${id}`, params),
  getDashboard: (params) => apiClient.get('/analytics/dashboard', params),
  exportAnalytics: (id, params) => apiClient.get(`/analytics/${id}/export`, params)
};

// QR Code API methods
export const qrCodeAPI = {
  generate: (urlId, options) => apiClient.post(`/qr-codes/generate/${urlId}`, options),
  download: (urlId, format) => apiClient.get(`/qr-codes/download/${urlId}`, { format }),
  getStats: () => apiClient.get('/qr-codes/stats'),
  bulkGenerate: (urlIds, options) => apiClient.post('/qr-codes/bulk-generate', { urlIds, options }),
  getUrlQRCode: (urlId) => apiClient.get(`/qr-codes/${urlId}`),
  updateCustomization: (urlId, options) => apiClient.put(`/qr-codes/customize/${urlId}`, options)
};

// Roles and User Management API methods
export const rolesAPI = {
  // Get current user's permissions
  getMyPermissions: () => apiClient.get('/roles/my-permissions'),

  // Get all available roles
  getAllRoles: () => apiClient.get('/roles'),

  // Get all users with their roles (admin/super_admin only)
  getUsersWithRoles: (params) => apiClient.get('/roles/users', params),

  // Update user role (admin/super_admin only)
  updateUserRole: (userId, role) => apiClient.put(`/roles/users/${userId}/role`, { role }),

  // Update user permissions (admin/super_admin only)
  updateUserPermissions: (userId, permissions) => apiClient.put(`/roles/users/${userId}/permissions`, { permissions })
};

// User Management API methods (for super_admin and admin)
export const userManagementAPI = {
  // Get all users with filters
  getAllUsers: (params) => apiClient.get('/users', params),

  // Get single user details
  getUser: (userId) => apiClient.get(`/users/${userId}`),

  // Update user status (activate/deactivate)
  updateUserStatus: (userId, data) => apiClient.put(`/users/${userId}/status`, data),

  // Delete user
  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),

  // Get user statistics
  getUserStats: () => apiClient.get('/users/stats')
};

// Preferences API methods
export const preferencesAPI = {
  // Get all notification preferences
  getNotificationPreferences: () => apiClient.get('/preferences/notifications'),

  // Update all notification preferences
  updateNotificationPreferences: (data) => apiClient.put('/preferences/notifications', data),

  // Toggle single notification setting
  toggleNotification: (category, setting, enabled) => 
    apiClient.request(`/preferences/notifications/${category}/${setting}`, {
      method: 'PATCH',
      body: { enabled }
    }),

  // Toggle entire category
  toggleCategory: (category, enabled) => 
    apiClient.request(`/preferences/notifications/category/${category}`, {
      method: 'PATCH',
      body: { enabled }
    }),

  // Get report preview
  getReportPreview: (type) => apiClient.get(`/preferences/reports/${type}/preview`),

  // Send test notification
  sendTestNotification: (type) => apiClient.post('/preferences/notifications/test', { type })
};

// Export the API client instance
export default apiClient;