// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phoneNumber?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  phoneNumber?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// URL Types
export interface ShortUrl {
  id: string;
  shortCode: string;
  originalUrl: string;
  title?: string;
  domain?: string;
  customCode?: string;
  tags?: string[];
  expiresAt?: string;
  isActive?: boolean;
  totalClicks?: number;
  uniqueClicks?: number;
  createdAt?: string;
  updatedAt?: string;
  creator?: string;
  creatorName?: string;
  creatorEmail?: string;
}

export interface CreateUrlData {
  originalUrl: string;
  customCode?: string;
  title?: string;
  domain?: string;
  tags?: string[];
  expiresAt?: string;
}

export interface UpdateUrlData {
  title?: string;
  isActive?: boolean;
  tags?: string[];
  expiresAt?: string;
}

// Domain Types
export interface Domain {
  id: string;
  domain: string;
  isVerified: boolean;
  isDefault?: boolean;
  dnsRecords?: DnsRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  status?: string;
}

export interface CreateDomainData {
  domain: string;
}

// Analytics Types
export interface AnalyticsData {
  totalClicks: number;
  uniqueClicks: number;
  clicksByDate?: ClicksByDate[];
  clicksByCountry?: ClicksByCountry[];
  clicksByDevice?: ClicksByDevice[];
  clicksByBrowser?: ClicksByBrowser[];
  clicksByReferrer?: ClicksByReferrer[];
}

export interface ClicksByDate {
  date: string;
  clicks: number;
}

export interface ClicksByCountry {
  country: string;
  clicks: number;
}

export interface ClicksByDevice {
  device: string;
  clicks: number;
}

export interface ClicksByBrowser {
  browser: string;
  clicks: number;
}

export interface ClicksByReferrer {
  referrer: string;
  clicks: number;
}

// QR Code Types
export interface QRCodeOptions {
  size?: number;
  format?: 'png' | 'svg' | 'jpeg';
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  foregroundColor?: string;
  backgroundColor?: string;
  logo?: string;
}

export interface QRCode {
  id: string;
  urlId: string;
  imageUrl: string;
  options?: QRCodeOptions;
  createdAt?: string;
}

// User Management Types
export interface UserWithRole extends User {
  role: string;
  permissions?: string[];
  urlCount?: number;
  lastLogin?: string;
}

// Admin Types
export interface SystemStats {
  totalUsers: number;
  totalUrls: number;
  totalClicks: number;
  activeUsers: number;
  activeUrls: number;
}

// Country Code Types
export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
