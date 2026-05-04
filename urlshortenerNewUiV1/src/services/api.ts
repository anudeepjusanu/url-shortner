// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3015/api';

// API endpoints
const endpoints = {
  auth: {
    register: '/auth/register-simple',
    login: '/auth/login',
    loginWithPhone: '/auth/login-with-phone',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    profile: '/auth/profile',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    sendPasswordResetOTP: '/auth/send-password-reset-otp',
    verifyPasswordResetOTP: '/auth/verify-password-reset-otp',
    resetPasswordWithOTP: '/auth/reset-password-with-otp'
  },
  urls: {
    create: '/urls',
    list: '/urls',
    get: '/urls',
    update: '/urls',
    delete: '/urls',
    stats: '/urls/stats',
    availableDomains: '/urls/domains/available'
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
  },
  countryCodes: {
    list: '/country-codes'
  },
  qrCodes: {
    generate: '/qr-codes/generate',
    download: '/qr-codes/download',
    stats: '/qr-codes/stats',
    bulkGenerate: '/qr-codes/bulk-generate',
    customize: '/qr-codes/customize'
  },
  roles: {
    myPermissions: '/roles/my-permissions',
    allRoles: '/roles',
    usersWithRoles: '/roles/users',
    updateUserRole: '/roles/users',
    updateUserPermissions: '/roles/users'
  },
  users: {
    list: '/users',
    get: '/users',
    updateStatus: '/users',
    delete: '/users',
    stats: '/users/stats'
  },
  admin: {
    urls: '/admin/urls',
    users: '/admin/users',
    stats: '/admin/stats'
  },
  googleAnalytics: {
    status: '/google-analytics/status',
    realtime: '/google-analytics/realtime',
    overview: '/google-analytics/overview',
    trafficOverTime: '/google-analytics/traffic-over-time',
    trafficSources: '/google-analytics/traffic-sources',
    topPages: '/google-analytics/top-pages',
    geographic: '/google-analytics/geographic',
    devices: '/google-analytics/devices',
    browsers: '/google-analytics/browsers',
    dashboard: '/google-analytics/dashboard'
  }
} as const;

// HTTP client class
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  }

  // Set authorization token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
    }
  }

  // Get authorization token
  getToken(): string | null {
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
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add authorization header if token exists
    if (token) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    // Convert body to JSON if it's an object
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle unsuccessful responses
      if (!response.ok) {
        // Handle 401 - Unauthorized
        if (response.status === 401) {
          // Only clear tokens if a token was actually sent (i.e., it was rejected by the server)
          // This prevents one failing request from killing auth for all other requests
          const hadToken = !!this.getToken();
          if (hadToken) {
            // Token was present but rejected — it is expired or invalid, safe to clear
            this.clearTokens();
          }
          throw new Error(data.message || 'Authentication required. Please login to continue.');
        }

        // Throw error with API response message
        throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      // Network or other errors
      if (error instanceof TypeError || (error as Error).message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and ensure the backend API is running.');
      }
      throw error;
    }
  }

  // GET request
  async get<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    // Add cache-busting parameter for list endpoints
    const listEndpoints = ['/urls', '/analytics', '/admin/urls'];
    if (listEndpoints.some(path => endpoint.startsWith(path))) {
      url.searchParams.append('_t', Date.now().toString());
    }

    return this.request<T>(endpoint + url.search, {
      method: 'GET'
    });
  }

  // POST request
  async post<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  async put<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // DELETE request
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Auth API methods
export const authAPI = {
  register: async (userData: any) => {
    const url = `${apiClient['baseURL']}${endpoints.auth.register}`;
    const token = apiClient.getToken();

    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
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

      // Handle successful registration
      if (res.ok && response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        if (accessToken) {
          apiClient.setToken(accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }
      }

      if (!res.ok) {
        throw new Error(response.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  login: async (credentials: any) => {
    const url = `${apiClient['baseURL']}${endpoints.auth.login}`;
    const token = apiClient.getToken();

    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
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

      // Handle successful login
      if (res.ok && response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        if (accessToken) {
          apiClient.setToken(accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }
      }

      if (!res.ok) {
        throw new Error(response.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  loginWithPhone: async (credentials: { phoneNumber: string; otp?: string }) => {
    const url = `${apiClient['baseURL']}${endpoints.auth.loginWithPhone}`;
    const token = apiClient.getToken();

    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(credentials)
    };

    try {
      const res = await fetch(url, config);
      const response = await res.json();

      if (res.status === 202 && response.data && response.data.otpSent) {
        return { ...response, otpRequired: true, otpData: response.data };
      }

      if (res.ok && response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        if (accessToken) {
          apiClient.setToken(accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }
      }

      if (!res.ok) {
        throw new Error(response.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Phone login API error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post(endpoints.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearTokens();
    }
  },

  getProfile: async () => {
    return apiClient.get(endpoints.auth.profile);
  },

  updateProfile: async (data: any) => {
    return apiClient.put(endpoints.auth.profile, data);
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

  forgotPassword: async (email: string) => {
    return apiClient.post(endpoints.auth.forgotPassword, { email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return apiClient.post(endpoints.auth.resetPassword, { token, newPassword });
  },

  sendPasswordResetOTP: async (email: string) => {
    return apiClient.post(endpoints.auth.sendPasswordResetOTP, { email });
  },

  verifyPasswordResetOTP: async (data: any) => {
    return apiClient.post(endpoints.auth.verifyPasswordResetOTP, data);
  },

  resetPasswordWithOTP: async (data: any) => {
    return apiClient.post(endpoints.auth.resetPasswordWithOTP, data);
  },
};

// URLs API methods
export const urlsAPI = {
  create: (urlData: any) => apiClient.post(endpoints.urls.create, urlData),
  list: (params?: any) => apiClient.get(endpoints.urls.list, params),
  get: (id: string) => apiClient.get(`${endpoints.urls.get}/${id}`),
  update: (id: string, data: any) => apiClient.put(`${endpoints.urls.update}/${id}`, data),
  delete: (id: string) => apiClient.delete(`${endpoints.urls.delete}/${id}`),
  getStats: () => apiClient.get(endpoints.urls.stats),
  getUrls: (params?: any) => apiClient.get(endpoints.urls.list, params),
  deleteUrl: (id: string) => apiClient.delete(`${endpoints.urls.delete}/${id}`),
  createUrl: (urlData: any) => apiClient.post(endpoints.urls.create, urlData),
  updateUrl: (id: string, data: any) => apiClient.put(`${endpoints.urls.update}/${id}`, data),
  getAvailableDomains: () => apiClient.get(endpoints.urls.availableDomains),
};

// Domains API methods
export const domainsAPI = {
  getDomains: (params = {}) => apiClient.get(endpoints.domains.list, params),
  getDomain: (id: string) => apiClient.get(`${endpoints.domains.list}/${id}`),
  createDomain: (domainData: any) => apiClient.post(endpoints.domains.add, domainData),
  updateDomain: (id: string, data: any) => apiClient.put(`${endpoints.domains.list}/${id}`, data),
  deleteDomain: (id: string) => apiClient.delete(`${endpoints.domains.delete}/${id}`),
  verifyDomain: (id: string) => apiClient.post(`${endpoints.domains.verify}/${id}/verify`),
  setDefaultDomain: (id: string) => apiClient.post(`${endpoints.domains.list}/${id}/set-default`),
  getDomainStats: () => apiClient.get(`${endpoints.domains.list}/stats`),
  getDomainInfo: (domain: string) => apiClient.get(`${endpoints.domains.list}/info/${domain}`),
  list: (params?: any) => apiClient.get(endpoints.domains.list, params),
  add: (domainData: any) => apiClient.post(endpoints.domains.add, domainData),
  verify: (id: string) => apiClient.post(`${endpoints.domains.verify}/${id}/verify`),
  delete: (id: string) => apiClient.delete(`${endpoints.domains.delete}/${id}`),
};

// Analytics API methods
export const analyticsAPI = {
  getOverview: (params?: any) => apiClient.get('/analytics/dashboard', params),
  getUrlAnalytics: (id: string, params?: any) => apiClient.get(`/analytics/${id}`, params),
  getDashboard: (params?: any) => apiClient.get('/analytics/dashboard', params),
  exportAnalytics: (id: string, params?: any) => apiClient.get(`/analytics/${id}/export`, params)
};

// Country Codes API methods
export const countryCodesAPI = {
  getAll: () => apiClient.get(endpoints.countryCodes.list)
};

// QR Code API methods
export const qrCodeAPI = {
  generate: (urlId: string, options: any) => apiClient.post(`${endpoints.qrCodes.generate}/${urlId}`, options),
  download: async (urlId: string, format: string) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    const url = `${apiClient['baseURL']}${endpoints.qrCodes.download}/${urlId}?format=${format}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Download failed: ${response.status}`);
    }
    
    return await response.blob();
  },
  getStats: () => apiClient.get(endpoints.qrCodes.stats),
  bulkGenerate: (urlIds: string[], options: any) => apiClient.post(endpoints.qrCodes.bulkGenerate, { urlIds, options }),
  getUrlQRCode: (urlId: string) => apiClient.get(`/qr-codes/${urlId}`),
  updateCustomization: (urlId: string, options: any) => apiClient.put(`${endpoints.qrCodes.customize}/${urlId}`, options)
};

// Roles and User Management API methods
export const rolesAPI = {
  getMyPermissions: () => apiClient.get(endpoints.roles.myPermissions),
  getAllRoles: () => apiClient.get(endpoints.roles.allRoles),
  getUsersWithRoles: (params?: any) => apiClient.get(endpoints.roles.usersWithRoles, params),
  updateUserRole: (userId: string, role: string) => apiClient.put(`${endpoints.roles.updateUserRole}/${userId}/role`, { role }),
  updateUserPermissions: (userId: string, permissions: any) => apiClient.put(`${endpoints.roles.updateUserPermissions}/${userId}/permissions`, { permissions })
};

// User Management API methods
export const userManagementAPI = {
  getAllUsers: (params?: any) => apiClient.get(endpoints.users.list, params),
  getUser: (userId: string) => apiClient.get(`${endpoints.users.get}/${userId}`),
  updateUserStatus: (userId: string, data: any) => apiClient.put(`${endpoints.users.updateStatus}/${userId}/status`, data),
  deleteUser: (userId: string) => apiClient.delete(`${endpoints.users.delete}/${userId}`),
  getUserStats: () => apiClient.get(endpoints.users.stats)
};

// Admin API methods
export const adminAPI = {
  getAllUrls: (params?: any) => apiClient.get(endpoints.admin.urls, params),
  getUserUrls: (userId: string, params?: any) => apiClient.get(endpoints.admin.urls, { ...params, creator: userId }),
  updateUrl: (urlId: string, data: any) => apiClient.put(`${endpoints.admin.urls}/${urlId}`, data),
  deleteUrl: (urlId: string) => apiClient.delete(`${endpoints.admin.urls}/${urlId}`),
  getSystemStats: () => apiClient.get(endpoints.admin.stats),
  getAllUsers: (params?: any) => apiClient.get(endpoints.admin.users, params)
};

// Google Analytics API methods
export const googleAnalyticsAPI = {
  checkStatus: () => apiClient.get(endpoints.googleAnalytics.status),
  getRealtime: () => apiClient.get(endpoints.googleAnalytics.realtime),
  getOverview: (params = {}) => apiClient.get(endpoints.googleAnalytics.overview, params),
  getTrafficOverTime: (params = {}) => apiClient.get(endpoints.googleAnalytics.trafficOverTime, params),
  getTrafficSources: (params = {}) => apiClient.get(endpoints.googleAnalytics.trafficSources, params),
  getTopPages: (params = {}) => apiClient.get(endpoints.googleAnalytics.topPages, params),
  getGeographic: (params = {}) => apiClient.get(endpoints.googleAnalytics.geographic, params),
  getDevices: (params = {}) => apiClient.get(endpoints.googleAnalytics.devices, params),
  getBrowsers: (params = {}) => apiClient.get(endpoints.googleAnalytics.browsers, params),
  getDashboard: (params = {}) => apiClient.get(endpoints.googleAnalytics.dashboard, params)
};

// Bio Pages API methods
export const bioPageAPI = {
  // CRUD (authenticated)
  list: () => apiClient.get('/bio-pages'),
  get: (id: string) => apiClient.get(`/bio-pages/${id}`),
  create: (data: any) => apiClient.post('/bio-pages', data),
  update: (id: string, data: any) => apiClient.put(`/bio-pages/${id}`, data),
  delete: (id: string) => apiClient.delete(`/bio-pages/${id}`),
  getAnalytics: (id: string) => apiClient.get(`/bio-pages/${id}/analytics`),

  // AI background image generation (authenticated)
  generateBgImage: (prompt: string) => apiClient.post('/bio-pages/generate-bg-image', { prompt }),

  // Public (no auth)
  getPublic: (username: string) => apiClient.get(`/bio-pages/public/${username}`),
  trackClick: (username: string, linkId: string) =>
    apiClient.post(`/bio-pages/public/${username}/click/${linkId}`, {}),
  checkUsername: (username: string) => apiClient.get(`/bio-pages/check-username/${username}`),
};

// Dynamic QR Code API methods
export const dynamicQRCodeAPI = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/dynamic-qr', params),
  get: (id: string) => apiClient.get(`/dynamic-qr/${id}`),
  create: (data: {
    name: string;
    destinationUrl: string;
    customization?: Record<string, unknown>;
  }) => apiClient.post('/dynamic-qr', data),
  update: (
    id: string,
    data: { name?: string; isActive?: boolean; customization?: Record<string, unknown> }
  ) => apiClient.put(`/dynamic-qr/${id}`, data),
  updateDestination: (id: string, destinationUrl: string) =>
    apiClient.put(`/dynamic-qr/${id}/destination`, { destinationUrl }),
  remove: (id: string) => apiClient.delete(`/dynamic-qr/${id}`),
  getAnalytics: (id: string) => apiClient.get(`/dynamic-qr/${id}/analytics`),
  download: async (id: string, name: string, format = 'png') => {
    const url = `${apiClient['baseURL']}/dynamic-qr/${id}/download?format=${format}`;
    const token = apiClient.getToken();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dynamic-qr-${safeName}.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
};

export default apiClient;
