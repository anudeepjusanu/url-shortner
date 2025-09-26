export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'user' | 'admin' | 'premium';
  organization: string | null;
  isEmailVerified: boolean;
  lastLogin: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface URL {
  id: string;
  originalUrl: string;
  shortCode: string;
  customCode?: string;
  title?: string;
  description?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  clickCount: number;
  lastClickedAt?: string;
}

export interface URLResponse {
  success: boolean;
  message: string;
  data: {
    url: URL;
  };
}

export interface URLListResponse {
  success: boolean;
  message: string;
  data: {
    urls: URL[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface Analytics {
  totalClicks: number;
  totalUrls: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  topUrls: Array<{
    url: URL;
    clicks: number;
  }>;
  clicksByDate: Array<{
    date: string;
    clicks: number;
  }>;
}