// JWT Service — token management + QR Code and My Links API endpoints
// Import and use directly in UI pages instead of going through useApi hooks

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3015/api';

// ─── Token Management ────────────────────────────────────────────────────────

export const jwtTokens = {
  getAccessToken: (): string | null =>
    localStorage.getItem('authToken') || localStorage.getItem('accessToken'),

  getRefreshToken: (): string | null =>
    localStorage.getItem('refreshToken'),

  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  clearTokens: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  isAuthenticated: (): boolean =>
    !!(localStorage.getItem('authToken') || localStorage.getItem('accessToken')),
};

// ─── Base Authenticated Request ───────────────────────────────────────────────

async function authRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = jwtTokens.getAccessToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    },
  };

  // Serialize body if it's a plain object (not FormData / Blob)
  if (
    config.body &&
    typeof config.body === 'object' &&
    !(config.body instanceof FormData) &&
    !(config.body instanceof Blob)
  ) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (response.status === 401) {
    // Only clear tokens when a token was actually sent and rejected by the server.
    // If no token was present, there is nothing to clear — and we must NOT wipe
    // tokens that other in-flight requests are still using (cascade prevention).
    if (token) {
      jwtTokens.clearTokens();
    }
    throw new Error('Session expired. Please login again.');
  }

  const contentType = response.headers.get('content-type');
  const data = contentType?.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      (data as any)?.message || (data as any)?.error || `HTTP ${response.status}`
    );
  }

  return data as T;
}

// Raw authenticated fetch (for binary responses like QR image downloads)
async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = jwtTokens.getAccessToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    },
  });

  if (response.status === 401) {
    if (token) {
      jwtTokens.clearTokens();
    }
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as any).message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response;
}

// ─── My Links Service  (GET /urls, POST /urls, …) ────────────────────────────

export interface GetUrlsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tags?: string;
}

export const myLinksService = {
  /** GET /urls — list all user links (paginated, searchable) */
  getAll: (params: GetUrlsParams = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) query.append(key, String(val));
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return authRequest(`/urls${qs}`);
  },

  /** GET /urls/:id — get a single link */
  get: (id: string) => authRequest(`/urls/${id}`),

  /** POST /urls — create a new short link */
  create: (data: {
    originalUrl: string;
    customCode?: string;
    title?: string;
    description?: string;
    tags?: string[];
    expiresAt?: string;
    domain?: string;
    password?: string;
    utmParams?: Record<string, string>;
  }) =>
    authRequest('/urls', { method: 'POST', body: data as any }),

  /** PUT /urls/:id — update an existing link */
  update: (
    id: string,
    data: {
      title?: string;
      originalUrl?: string;
      customCode?: string;
      description?: string;
      tags?: string[];
      expiresAt?: string;
      domain?: string;
    }
  ) => authRequest(`/urls/${id}`, { method: 'PUT', body: data as any }),

  /** DELETE /urls/:id — delete a link */
  delete: (id: string) => authRequest(`/urls/${id}`, { method: 'DELETE' }),

  /** POST /urls/bulk-delete — delete multiple links at once */
  bulkDelete: (ids: string[]) =>
    authRequest('/urls/bulk-delete', { method: 'POST', body: { ids } as any }),

  /** GET /urls/stats — aggregated stats (total clicks, top URLs, etc.) */
  getStats: () => authRequest('/urls/stats'),

  /** GET /urls/domains/available — domains the user can use for short links */
  getAvailableDomains: () => authRequest('/urls/domains/available'),
};

// ─── QR Code Service  (GET /qr-codes/…, POST /qr-codes/…) ──────────────────

export interface QRCodeOptions {
  size?: number;               // 100–2000 px
  format?: 'png' | 'jpeg' | 'gif' | 'webp' | 'svg' | 'pdf';
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  foregroundColor?: string;    // hex e.g. "#000000"
  backgroundColor?: string;    // hex e.g. "#ffffff"
  includeMargin?: boolean;
  logo?: string;               // base64 or URL
}

export const qrCodeService = {
  /**
   * POST /qr-codes/generate/:id
   * Generate (or regenerate) a QR code for a URL.
   * Returns JSON with the QR image data URL and metadata.
   */
  generate: (urlId: string, options: QRCodeOptions = {}) =>
    authRequest(`/qr-codes/generate/${urlId}`, { method: 'POST', body: options as any }),

  /**
   * GET /qr-codes/download/:id?format=png
   * Download the QR code as a binary blob.
   * Usage:  const blob = await qrCodeService.download(urlId, 'png');
   */
  download: async (urlId: string, format: QRCodeOptions['format'] = 'png'): Promise<Blob> => {
    const response = await authFetch(`/qr-codes/download/${urlId}?format=${format}`);
    return response.blob();
  },

  /**
   * GET /qr-codes/:id
   * Get the existing QR code record for a URL (includes image data URL).
   */
  get: (urlId: string) => authRequest(`/qr-codes/${urlId}`),

  /**
   * GET /qr-codes/stats
   * Get QR code statistics for the authenticated user.
   */
  getStats: () => authRequest('/qr-codes/stats'),

  /**
   * PUT /qr-codes/customize/:id
   * Update the visual customization of an existing QR code.
   */
  updateCustomization: (urlId: string, options: QRCodeOptions) =>
    authRequest(`/qr-codes/customize/${urlId}`, { method: 'PUT', body: options as any }),

  /**
   * POST /qr-codes/bulk-generate
   * Generate QR codes for multiple URLs in one request.
   * Requires the bulk_operations permission on the user's plan.
   */
  bulkGenerate: (urlIds: string[], options: QRCodeOptions = {}) =>
    authRequest('/qr-codes/bulk-generate', {
      method: 'POST',
      body: { urlIds, options } as any,
    }),
};

// ─── Admin Service  (GET /admin/…, PUT /admin/…, DELETE /admin/…) ────────────

export const adminService = {
  /** GET /admin/stats */
  getStats: () => authRequest('/admin/stats'),

  // ── Users ──
  /** GET /admin/users?limit=&search=&role=&page= */
  getUsers: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v));
    });
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return authRequest(`/admin/users${query}`);
  },

  /** PUT /admin/users/:id — update role / isActive */
  updateUser: (id: string, data: { role?: string; isActive?: boolean }) =>
    authRequest(`/admin/users/${id}`, { method: 'PUT', body: data as any }),

  /** DELETE /admin/users/:id */
  deleteUser: (id: string) =>
    authRequest(`/admin/users/${id}`, { method: 'DELETE' }),

  // ── URLs ──
  /** GET /admin/urls?limit=&search=&creator=&page= */
  getUrls: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v));
    });
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return authRequest(`/admin/urls${query}`);
  },

  /** PUT /admin/urls/:id — update isActive / title */
  updateUrl: (id: string, data: { isActive?: boolean; title?: string }) =>
    authRequest(`/admin/urls/${id}`, { method: 'PUT', body: data as any }),

  /** DELETE /admin/urls/:id */
  deleteUrl: (id: string) =>
    authRequest(`/admin/urls/${id}`, { method: 'DELETE' }),
};

// ─── Profile / Auth Service ───────────────────────────────────────────────────

export const profileService = {
  /** GET /auth/profile — returns { firstName, lastName, email, phone, company, role, plan, … } */
  getProfile: () => authRequest('/auth/profile'),

  /** PUT /auth/profile — update firstName / lastName / phone / preferences */
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; preferences?: Record<string, unknown> }) =>
    authRequest('/auth/profile', { method: 'PUT', body: data as any }),

  /** POST /auth/change-password */
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    authRequest('/auth/change-password', { method: 'POST', body: data as any }),

  /** GET /auth/api-key → { success, apiKey } */
  getApiKey: () => authRequest('/auth/api-key'),

  /** POST /auth/regenerate-api-key → { success, apiKey } */
  regenerateApiKey: () => authRequest('/auth/regenerate-api-key', { method: 'POST' }),

  /** GET /auth/preferences → { emailNotifications, marketingEmails, weeklyReports, language, timezone } */
  getPreferences: () => authRequest('/auth/preferences'),

  /** PUT /auth/preferences */
  updatePreferences: (data: Record<string, unknown>) =>
    authRequest('/auth/preferences', { method: 'PUT', body: data as any }),
};

// ─── Analytics Service ────────────────────────────────────────────────────────

export const analyticsService = {
  /**
   * GET /analytics/:id/export?format=csv&period=...
   * Export analytics for a specific URL as a CSV blob.
   */
  exportCSV: async (urlId: string, params: Record<string, string> = {}): Promise<Blob> => {
    const query = new URLSearchParams({ format: 'csv', ...params });
    const response = await authFetch(`/analytics/${urlId}/export?${query.toString()}`);
    return response.blob();
  },
};
