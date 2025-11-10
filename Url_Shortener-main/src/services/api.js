// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://laghhu.link/api';

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
    urls: '/analytics/dashboard'
  }
};

// HTTP client class
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
  }

  // Set authorization token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  // Get authorization token
  getToken() {
    return this.token || localStorage.getItem('accessToken');
  }

  // Clear tokens
  clearTokens() {
    this.token = null;
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
          // Redirect to login page
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }

        // Throw error with API response message
        throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      // Network or other errors
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
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
    const response = await apiClient.post(endpoints.auth.register, userData);

    // Store tokens if registration is successful
    if (response.success && response.data) {
      const { accessToken, refreshToken } = response.data;
      if (accessToken) {
        apiClient.setToken(accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
    }

    return response;
  },

  login: async (credentials) => {
    const response = await apiClient.post(endpoints.auth.login, credentials);

    // Store tokens if login is successful
    if (response.success && response.data) {
      const { accessToken, refreshToken } = response.data;
      if (accessToken) {
        apiClient.setToken(accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
    }

    return response;
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
  getOverview: (params) => apiClient.get(endpoints.analytics.overview, params),
  getUrlAnalytics: (id, params) => apiClient.get(`${endpoints.analytics.urls}/${id}`, params),
};

// Export the API client instance
export default apiClient;