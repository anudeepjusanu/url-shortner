import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { adminAPI } from '../services/api';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import './AdminUrlManagement.css';
import './DashboardLayout.css';

function AdminUrlManagement() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { hasRole } = usePermissions();
  
  const [urls, setUrls] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [showUrlDetails, setShowUrlDetails] = useState(false);
  const [stats, setStats] = useState(null);

  const loadUrls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      if (selectedUser) params.creator = selectedUser;

      const response = await adminAPI.getAllUrls(params);

      if (response.success) {
        setUrls(response.data.urls);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (err) {
      console.error('Error loading URLs:', err);
      setError(err.message || 'Failed to load URLs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, selectedUser]);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({ limit: 100 });
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getSystemStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    if (hasRole(['admin', 'super_admin'])) {
      loadUsers();
      loadStats();
    }
  }, [hasRole]);

  useEffect(() => {
    if (hasRole(['admin', 'super_admin'])) {
      const delayDebounceFn = setTimeout(() => {
        loadUrls();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [loadUrls, hasRole]);

  const handleToggleStatus = async (urlId, currentStatus) => {
    try {
      setError(null);
      const response = await adminAPI.updateUrl(urlId, { isActive: !currentStatus });
      if (response.success) {
        setSuccess(!currentStatus ? t('adminUrlManagement.messages.activateSuccess') : t('adminUrlManagement.messages.deactivateSuccess'));
        loadUrls();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || t('adminUrlManagement.messages.updateFailed'));
    }
  };

  const handleDeleteUrl = async (urlId) => {
    if (!window.confirm(t('adminUrlManagement.messages.deleteConfirm'))) {
      return;
    }
    try {
      setError(null);
      const response = await adminAPI.deleteUrl(urlId);
      if (response.success) {
        setSuccess(t('adminUrlManagement.messages.deleteSuccess'));
        loadUrls();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || t('adminUrlManagement.messages.deleteFailed'));
    }
  };

  const handleViewDetails = (url) => {
    setSelectedUrl(url);
    setShowUrlDetails(true);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const truncateUrl = (url, maxLength = 50) => {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  };

  if (!hasRole(['admin', 'super_admin'])) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-main">
          <MainHeader />
      <div className="admin-url-management">
        <div className="access-denied">
          <h2>{t('adminUrlManagement.accessDenied')}</h2>
          <p>{t('adminUrlManagement.noPermission')}</p>
        </div>
      </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-url-management ${isRTL ? 'rtl' : ''}`}>
      <div className="admin-url-header">
        <h2>{t('adminUrlManagement.title')}</h2>
        <p className="subtitle">{t('adminUrlManagement.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔗</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overview?.totalUrls?.toLocaleString() || 0}</div>
              <div className="stat-label">{t('adminUrlManagement.stats.totalUrls')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👆</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overview?.totalClicks?.toLocaleString() || 0}</div>
              <div className="stat-label">{t('adminUrlManagement.stats.totalClicks')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{stats.growth?.newUrlsLast30Days?.toLocaleString() || 0}</div>
              <div className="stat-label">{t('adminUrlManagement.stats.newUrls30d')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overview?.totalUsers?.toLocaleString() || 0}</div>
              <div className="stat-label">{t('adminUrlManagement.stats.totalUsers')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span className="alert-message">{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span className="alert-message">{success}</span>
          <button className="alert-close" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className="url-filters">
        <div className="filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('adminUrlManagement.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('adminUrlManagement.filters.allStatus')}</option>
              <option value="active">{t('adminUrlManagement.filters.active')}</option>
              <option value="inactive">{t('adminUrlManagement.filters.inactive')}</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="filter-select user-select"
            >
              <option value="">{t('adminUrlManagement.filters.allUsers')}</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* URLs Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('adminUrlManagement.loading')}</p>
        </div>
      ) : urls.length === 0 ? (
        <div className="empty-state">
          <p>{t('adminUrlManagement.noUrls')}</p>
        </div>
      ) : (
        <>
          <div className="urls-table-container">
            <table className="urls-table">
              <thead>
                <tr>
                  <th>{t('adminUrlManagement.table.shortCode')}</th>
                  <th>{t('adminUrlManagement.table.originalUrl')}</th>
                  <th>{t('adminUrlManagement.table.creator')}</th>
                  <th>{t('adminUrlManagement.table.clicks')}</th>
                  <th>{t('adminUrlManagement.table.status')}</th>
                  <th>{t('adminUrlManagement.table.created')}</th>
                  <th>{t('adminUrlManagement.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {urls.map(url => (
                  <tr key={url._id}>
                    <td>
                      <a 
                        href={`https://snip.sa/${url.shortCode}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="short-code-link"
                      >
                        {url.shortCode}
                      </a>
                    </td>
                    <td>
                      <span className="original-url" title={url.originalUrl}>
                        {truncateUrl(url.originalUrl)}
                      </span>
                    </td>
                    <td>
                      <div className="creator-info">
                        <span className="creator-name">
                          {url.creator?.firstName} {url.creator?.lastName}
                        </span>
                        <span className="creator-email">{url.creator?.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="click-count">{url.clickCount?.toLocaleString() || 0}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${url.isActive ? 'active' : 'inactive'}`}>
                        {url.isActive ? t('adminUrlManagement.status.active') : t('adminUrlManagement.status.inactive')}
                      </span>
                    </td>
                    <td>{formatDate(url.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-view"
                          onClick={() => handleViewDetails(url)}
                          title={t('adminUrlManagement.actions.view')}
                        >
                          {t('adminUrlManagement.actions.view')}
                        </button>
                        <button 
                          className={`btn-action ${url.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                          onClick={() => handleToggleStatus(url._id, url.isActive)}
                          title={url.isActive ? t('adminUrlManagement.actions.deactivate') : t('adminUrlManagement.actions.activate')}
                        >
                          {url.isActive ? t('adminUrlManagement.actions.deactivate') : t('adminUrlManagement.actions.activate')}
                        </button>
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteUrl(url._id)}
                          title={t('adminUrlManagement.actions.delete')}
                        >
                          {t('adminUrlManagement.actions.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                {t('adminUrlManagement.pagination.previous')}
              </button>
              <span className="pagination-info">
                {t('adminUrlManagement.pagination.pageInfo', { page: pagination.page, pages: pagination.pages, total: pagination.total })}
              </span>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="pagination-btn"
              >
                {t('adminUrlManagement.pagination.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* URL Details Modal */}
      {showUrlDetails && selectedUrl && (
        <div className="modal-overlay" onClick={() => setShowUrlDetails(false)}>
          <div className="modal-content url-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('adminUrlManagement.modal.title')}</h3>
              <button className="modal-close" onClick={() => setShowUrlDetails(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-sections-grid">
                <div className="detail-section full-width">
                  <h4>{t('adminUrlManagement.modal.linkInfo')}</h4>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.shortCode')}</span>
                    <span className="detail-value">{selectedUrl.shortCode}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.originalUrl')}</span>
                    <span className="detail-value url-value">{selectedUrl.originalUrl}</span>
                  </div>
                  {selectedUrl.title && (
                    <div className="detail-row">
                      <span className="detail-label">{t('adminUrlManagement.modal.linkTitle')}</span>
                      <span className="detail-value">{selectedUrl.title}</span>
                    </div>
                  )}
                  {selectedUrl.description && (
                    <div className="detail-row">
                      <span className="detail-label">{t('adminUrlManagement.modal.description')}</span>
                      <span className="detail-value">{selectedUrl.description}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.domain')}</span>
                    <span className="detail-value">{selectedUrl.domain || 'snip.sa'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>{t('adminUrlManagement.modal.creatorInfo')}</h4>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.name')}</span>
                    <span className="detail-value">
                      {selectedUrl.creator?.firstName} {selectedUrl.creator?.lastName}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.email')}</span>
                    <span className="detail-value">{selectedUrl.creator?.email}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>{t('adminUrlManagement.modal.statistics')}</h4>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.totalClicks')}</span>
                    <span className="detail-value">{selectedUrl.clickCount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.uniqueClicks')}</span>
                    <span className="detail-value">{selectedUrl.uniqueClickCount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.status')}</span>
                    <span className={`status-badge ${selectedUrl.isActive ? 'active' : 'inactive'}`}>
                      {selectedUrl.isActive ? t('adminUrlManagement.status.active') : t('adminUrlManagement.status.inactive')}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>{t('adminUrlManagement.modal.dates')}</h4>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.created')}</span>
                    <span className="detail-value">{formatDate(selectedUrl.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t('adminUrlManagement.modal.lastUpdated')}</span>
                    <span className="detail-value">{formatDate(selectedUrl.updatedAt)}</span>
                  </div>
                  {selectedUrl.expiresAt && (
                    <div className="detail-row">
                      <span className="detail-label">{t('adminUrlManagement.modal.expires')}</span>
                      <span className="detail-value">{formatDate(selectedUrl.expiresAt)}</span>
                    </div>
                  )}
                </div>

                {selectedUrl.tags && selectedUrl.tags.length > 0 && (
                  <div className="detail-section full-width">
                    <h4>{t('adminUrlManagement.modal.tags')}</h4>
                    <div className="tags-list">
                      {selectedUrl.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className={`btn ${selectedUrl.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => {
                    handleToggleStatus(selectedUrl._id, selectedUrl.isActive);
                    setShowUrlDetails(false);
                  }}
                >
                  {selectedUrl.isActive ? t('adminUrlManagement.modal.deactivateUrl') : t('adminUrlManagement.modal.activateUrl')}
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    handleDeleteUrl(selectedUrl._id);
                    setShowUrlDetails(false);
                  }}
                >
                  {t('adminUrlManagement.modal.deleteUrl')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUrlManagement;
