import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Domain {
  id: string;
  domain: string;
  subdomain?: string;
  cnameTarget: string;
  fullDomain: string;
  status: 'pending' | 'active' | 'inactive' | 'ssl_failed' | 'verification_failed';
  verificationStatus: 'pending' | 'verified' | 'failed';
  isDefault: boolean;
  dateAdded: string;
  createdAt: string;
  addedBy: string;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  organization?: {
    name: string;
    slug: string;
  };
  shortUrl?: string;
}

export interface CreateDomainData {
  domain: string;
  subdomain?: string;
  isDefault?: boolean;
}

export interface URL {
  id: string;
  originalUrl: string;
  shortCode: string;
  customCode?: string;
  title?: string;
  description?: string;
  domain?: string;
  tags: string[];
  isActive: boolean;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
  shortUrl: string;
}

export interface CreateURLData {
  originalUrl: string;
  customCode?: string;
  title?: string;
  description?: string;
  domainId?: string;
  tags?: string[];
  expiresAt?: string;
  password?: string;
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post('/auth/register', userData),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile'),
};

// Domains API
export const domainsAPI = {
  // Get all user domains
  getDomains: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    verificationStatus?: string;
  }) => api.get('/domains', { params }),

  // Get single domain
  getDomain: (id: string) => api.get(`/domains/${id}`),

  // Create new domain
  createDomain: (data: CreateDomainData) =>
    api.post('/domains', data),

  // Update domain
  updateDomain: (id: string, data: Partial<CreateDomainData>) =>
    api.put(`/domains/${id}`, data),

  // Delete domain
  deleteDomain: (id: string) => api.delete(`/domains/${id}`),

  // Verify domain DNS
  verifyDomain: (id: string) => api.post(`/domains/${id}/verify`),

  // Set domain as default
  setDefaultDomain: (id: string) => api.post(`/domains/${id}/set-default`),

  // Get domain statistics
  getDomainStats: () => api.get('/domains/stats'),

  // Get domain info (for DNS lookup)
  getDomainInfo: (domain: string) => api.get(`/domains/info/${domain}`),
};

// URLs API
export const urlsAPI = {
  // Get all URLs
  getUrls: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
    sortBy?: string;
    sortOrder?: string;
    isActive?: boolean;
  }) => api.get('/urls', { params }),

  // Get single URL
  getUrl: (id: string) => api.get(`/urls/${id}`),

  // Create new URL
  createUrl: (data: CreateURLData) => api.post('/urls', data),

  // Update URL
  updateUrl: (id: string, data: Partial<CreateURLData>) =>
    api.put(`/urls/${id}`, data),

  // Delete URL
  deleteUrl: (id: string) => api.delete(`/urls/${id}`),

  // Bulk delete URLs
  bulkDeleteUrls: (ids: string[]) => api.post('/urls/bulk-delete', { ids }),

  // Get URL statistics
  getUrlStats: () => api.get('/urls/stats'),

  // Get available domains for URL creation
  getAvailableDomains: () => api.get('/urls/domains/available'),
};

// Analytics API
export const analyticsAPI = {
  // Get global analytics
  getGlobalAnalytics: (params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/analytics/global', { params }),

  // Get URL-specific analytics
  getUrlAnalytics: (urlId: string, params?: {
    period?: string;
    groupBy?: string;
  }) => api.get(`/analytics/url/${urlId}`, { params }),

  // Export analytics data
  exportAnalytics: (params?: {
    format?: 'json' | 'csv';
    period?: string;
  }) => api.get('/analytics/export', { params }),
};

export default api;