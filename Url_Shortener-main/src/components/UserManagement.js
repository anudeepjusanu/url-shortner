import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { rolesAPI, userManagementAPI } from '../services/api';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import './UserManagement.css';
import './DashboardLayout.css';

function UserManagement() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { permissions, hasRole } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  useEffect(() => {
    if (hasRole(['admin', 'super_admin'])) {
      loadUsers();
      loadStats();
    } else {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    if (hasRole(['admin', 'super_admin'])) {
      const delayDebounceFn = setTimeout(() => {
        loadUsers();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 100
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filter !== 'all') {
        params.role = filter;
      }

      console.log('Loading users with params:', params);
      const response = await rolesAPI.getUsersWithRoles(params);
      console.log('Users response:', response);

      if (response.success) {
        setUsers(response.data.users);
        console.log('Loaded users:', response.data.users.length);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      let errorMessage = 'Failed to load users. Please try again.';
      if (err.message?.includes('network') || err.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message?.includes('unauthorized') || err.message?.includes('Unauthorized')) {
        errorMessage = 'You are not authorized to view users. Please contact an administrator.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('Loading user stats...');
      const response = await userManagementAPI.getUserStats();
      console.log('Stats response:', response);
      if (response.success) {
        setStats(response.data);
        console.log('Loaded stats:', response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      // Don't show error for stats, just log it
    }
  };

  const handleRoleChange = async (userId, newRole, userEmail) => {
    const confirmed = window.confirm(
      `Are you sure you want to change the role of ${userEmail} to ${newRole.toUpperCase()}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await rolesAPI.updateUserRole(userId, newRole);

      if (response.success) {
        setSuccess(`Successfully updated role for ${userEmail} to ${newRole}`);
        loadUsers();
        loadStats();

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating role:', err);
      let errorMessage = `Failed to update role for ${userEmail}. Please try again.`;
      if (err.message?.includes('permission') || err.message?.includes('Permission')) {
        errorMessage = `You do not have permission to change the role of ${userEmail}.`;
      } else if (err.message?.includes('not found') || err.message?.includes('Not found')) {
        errorMessage = `User ${userEmail} was not found. They may have been deleted.`;
      } else if (err.message?.includes('network') || err.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleStatusToggle = async (userId, currentStatus, userEmail) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${userEmail}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await userManagementAPI.updateUserStatus(userId, {
        isActive: !currentStatus
      });

      if (response.success) {
        setSuccess(`Successfully ${action}d ${userEmail}`);
        loadUsers();
        loadStats();

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || `Failed to ${action} user`);
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      setError(null);
      const response = await userManagementAPI.getUser(userId);
      if (response.success) {
        setSelectedUser(response.data);
        setShowUserDetails(true);
      }
    } catch (err) {
      console.error('Error loading user details:', err);
      setError(err.message || 'Failed to load user details');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    const confirmed = window.confirm(
      `Are you sure you want to DELETE ${userEmail}? This action cannot be undone and will delete all their URLs and data.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await userManagementAPI.deleteUser(userId);

      if (response.success) {
        setSuccess(`Successfully deleted ${userEmail}`);
        loadUsers();
        loadStats();

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  // Users are already filtered by the API
  const filteredUsers = users;

  const getRoleColor = (role) => {
    const colors = {
      super_admin: '#e74c3c',
      admin: '#e67e22',
      editor: '#3498db',
      viewer: '#95a5a6',
      user: '#2ecc71'
    };
    return colors[role] || '#95a5a6';
  };

  const getRoleDisplay = (role) => {
    const roleKeys = {
      super_admin: 'superAdmin',
      admin: 'admin',
      editor: 'editor',
      viewer: 'viewer',
      user: 'user'
    };
    return t(`userManagement.roles.${roleKeys[role] || role}`);
  };

  // Only admins and super_admins can access this
  if (!hasRole(['admin', 'super_admin'])) {
    return null; // Don't render anything
  }

  if (loading) {
    return (
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              <div className="loading-state">
                <div className="spinner"></div>
                <p>{t('userManagement.loading')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            {/* Page Header */}
            <div className="page-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
              direction: isRTL ? 'rtl' : 'ltr'
            }}>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '4px',
                  margin: '0 0 4px 0'
                }}>{t('userManagement.title')}</h1>
                <p style={{
                  color: '#6B7280',
                  fontSize: '14px',
                  margin: 0
                }}>{t('userManagement.subtitle')}</p>
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px',
                direction: isRTL ? 'rtl' : 'ltr'
              }}>
                <div className="stat-card" style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div className="stat-icon" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}>👥</div>
                  <div className="stat-content" style={{ textAlign: isRTL ? 'right' : 'left', flex: 1 }}>
                    <div className="stat-value" style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>{stats.totalUsers}</div>
                    <div className="stat-label" style={{
                      fontSize: '14px',
                      color: '#6B7280'
                    }}>{t('userManagement.stats.totalUsers')}</div>
                  </div>
                </div>
                <div className="stat-card" style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div className="stat-icon" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}>✅</div>
                  <div className="stat-content" style={{ textAlign: isRTL ? 'right' : 'left', flex: 1 }}>
                    <div className="stat-value" style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>{stats.activeUsers}</div>
                    <div className="stat-label" style={{
                      fontSize: '14px',
                      color: '#6B7280'
                    }}>{t('userManagement.stats.activeUsers')}</div>
                  </div>
                </div>
                <div className="stat-card" style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div className="stat-icon" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}>❌</div>
                  <div className="stat-content" style={{ textAlign: isRTL ? 'right' : 'left', flex: 1 }}>
                    <div className="stat-value" style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>{stats.inactiveUsers}</div>
                    <div className="stat-label" style={{
                      fontSize: '14px',
                      color: '#6B7280'
                    }}>{t('userManagement.stats.inactiveUsers')}</div>
                  </div>
                </div>
                <div className="stat-card" style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div className="stat-icon" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#EDE9FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}>📈</div>
                  <div className="stat-content" style={{ textAlign: isRTL ? 'right' : 'left', flex: 1 }}>
                    <div className="stat-value" style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>{stats.recentSignups}</div>
                    <div className="stat-label" style={{
                      fontSize: '14px',
                      color: '#6B7280'
                    }}>{t('userManagement.stats.newUsers')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts */}
            {error && (
              <div className="alert alert-error" style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <span className="alert-icon">⚠️</span>
                <span className="alert-message" style={{ flex: 1, color: '#991B1B', textAlign: isRTL ? 'right' : 'left' }}>{error}</span>
                <button className="alert-close" onClick={() => setError(null)} style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#991B1B'
                }}>×</button>
              </div>
            )}

            {success && (
              <div className="alert alert-success" style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <span className="alert-icon">✓</span>
                <span className="alert-message" style={{ flex: 1, color: '#166534', textAlign: isRTL ? 'right' : 'left' }}>{success}</span>
                <button className="alert-close" onClick={() => setSuccess(null)} style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#166534'
                }}>×</button>
              </div>
            )}

            {/* Search and Filter Section */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              direction: isRTL ? 'rtl' : 'ltr'
            }}>
              {/* Search Bar */}
              <div className="search-bar" style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder={t('userManagement.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                />
              </div>

              {/* Role Filter and View Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div className="user-filters" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  flex: 1
                }}>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>{t('userManagement.filterByRole')}</label>
                  <div className="filter-buttons" style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}></div>
                  <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: filter === 'all' ? 'none' : '1px solid #D1D5DB',
                      backgroundColor: filter === 'all' ? '#3B82F6' : 'white',
                      color: filter === 'all' ? 'white' : '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {t('userManagement.roles.all')} ({users.length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'super_admin' ? 'active' : ''}`}
                    onClick={() => setFilter('super_admin')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: filter === 'super_admin' ? 'none' : '1px solid #D1D5DB',
                      backgroundColor: filter === 'super_admin' ? '#3B82F6' : 'white',
                      color: filter === 'super_admin' ? 'white' : '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {t('userManagement.roles.superAdmin')} ({users.filter(u => u.role === 'super_admin').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
                    onClick={() => setFilter('admin')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: filter === 'admin' ? 'none' : '1px solid #D1D5DB',
                      backgroundColor: filter === 'admin' ? '#3B82F6' : 'white',
                      color: filter === 'admin' ? 'white' : '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {t('userManagement.roles.admin')} ({users.filter(u => u.role === 'admin').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'editor' ? 'active' : ''}`}
                    onClick={() => setFilter('editor')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: filter === 'editor' ? 'none' : '1px solid #D1D5DB',
                      backgroundColor: filter === 'editor' ? '#3B82F6' : 'white',
                      color: filter === 'editor' ? 'white' : '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {t('userManagement.roles.editor')} ({users.filter(u => u.role === 'editor').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'viewer' ? 'active' : ''}`}
                    onClick={() => setFilter('viewer')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: filter === 'viewer' ? 'none' : '1px solid #D1D5DB',
                      backgroundColor: filter === 'viewer' ? '#3B82F6' : 'white',
                      color: filter === 'viewer' ? 'white' : '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {t('userManagement.roles.viewer')} ({users.filter(u => u.role === 'viewer').length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'user' ? 'active' : ''}`}
                    onClick={() => setFilter('user')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: filter === 'user' ? 'none' : '1px solid #D1D5DB',
                      backgroundColor: filter === 'user' ? '#3B82F6' : 'white',
                      color: filter === 'user' ? 'white' : '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {t('userManagement.roles.user')} ({users.filter(u => u.role === 'user').length})
                  </button>
                </div>
              </div>

              {/* View Toggle Buttons */}
              <div className="view-toggle" style={{
                display: 'flex',
                gap: '8px',
                backgroundColor: '#F3F4F6',
                padding: '4px',
                borderRadius: '8px'
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                    color: viewMode === 'grid' ? '#3B82F6' : '#6B7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                >
                  <span>⊞</span>
                  <span>{t('userManagement.viewMode.grid') || 'Grid'}</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: 'none',
                    backgroundColor: viewMode === 'table' ? 'white' : 'transparent',
                    color: viewMode === 'table' ? '#3B82F6' : '#6B7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                >
                  <span>☰</span>
                  <span>{t('userManagement.viewMode.table') || 'Table'}</span>
                </button>
              </div>
            </div>
            </div>

            {/* Users List */}
            <div className="users-list">
              {filteredUsers.length === 0 ? (
                <div className="empty-state" style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '48px 24px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>
                    {filter !== 'all' ? t('userManagement.noUsersWithRole', { role: getRoleDisplay(filter) }) : t('userManagement.noUsersFound')}
                  </p>
                </div>
              ) : viewMode === 'table' ? (
                /* Table View */
                <div className="users-table-container" style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  overflowX: 'auto',
                  overflowY: 'visible',
                  maxWidth: '100%',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  <table className="users-table" style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    minWidth: '1000px'
                  }}>
                      <thead>
                        <tr style={{
                          backgroundColor: '#F9FAFB',
                          borderBottom: '2px solid #E5E7EB'
                        }}>
                          <th style={{
                            padding: '16px',
                            textAlign: isRTL ? 'right' : 'left',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.name') || 'Name'}</th>
                          <th style={{
                            padding: '16px',
                            textAlign: isRTL ? 'right' : 'left',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.email') || 'Email'}</th>
                          <th style={{
                            padding: '16px',
                            textAlign: isRTL ? 'right' : 'left',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.phone') || 'Phone'}</th>
                          <th style={{
                            padding: '16px',
                            textAlign: isRTL ? 'right' : 'left',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.role') || 'Role'}</th>
                          <th style={{
                            padding: '16px',
                            textAlign: isRTL ? 'right' : 'left',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.status') || 'Status'}</th>
                          <th style={{
                            padding: '16px',
                            textAlign: isRTL ? 'right' : 'left',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.plan') || 'Plan'}</th>
                          <th style={{
                            padding: '16px',
                            textAlign: isRTL ? 'right' : 'left',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.joined') || 'Joined'}</th>
                          <th style={{
                            padding: '16px',
                            textAlign: isRTL ? 'right' : 'left',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.lastLogin') || 'Last Login'}</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}>{t('userManagement.table.actions') || 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user._id} style={{
                            borderBottom: '1px solid #E5E7EB',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td>
                              <div style={{ 
                                fontWeight: '500',
                                color: '#111827',
                                whiteSpace: 'nowrap'
                              }}>
                                {user.firstName} {user.lastName}
                              </div>
                            </td>
                            <td>
                              <div style={{ 
                                color: '#6B7280',
                                fontSize: '13px'
                              }}>
                                {user.email}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ color: '#6B7280' }}>
                                {user.phone || '-'}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}>
                                <select
                                  className="role-select-table"
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user._id, e.target.value, user.email)}
                                  disabled={
                                    (user.role === 'super_admin' && permissions?.role !== 'super_admin') ||
                                    (user.role === 'admin' && permissions?.role !== 'super_admin')
                                  }
                                  style={{
                                    backgroundColor: getRoleColor(user.role),
                                    color: 'white'
                                  }}
                                >
                                  <option value="user">{t('userManagement.roles.user')}</option>
                                  <option value="viewer">{t('userManagement.roles.viewer')}</option>
                                  <option value="editor">{t('userManagement.roles.editor')}</option>
                                  <option value="admin">{t('userManagement.roles.admin')}</option>
                                  {permissions?.role === 'super_admin' && (
                                    <option value="super_admin">{t('userManagement.roles.superAdmin')}</option>
                                  )}
                                </select>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}>
                                <span style={{
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: user.isActive ? '#D1FAE5' : '#FEE2E2',
                                  color: user.isActive ? '#166534' : '#991B1B',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {user.isActive ? t('userManagement.userCard.active') : t('userManagement.userCard.inactive')}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{
                                color: '#374151',
                                textTransform: 'uppercase',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                {user.plan || 'FREE'}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ 
                                color: '#6B7280',
                                fontSize: '13px',
                                whiteSpace: 'nowrap'
                              }}>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ 
                                color: '#6B7280',
                                fontSize: '13px',
                                whiteSpace: 'nowrap'
                              }}>
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                              </div>
                            </td>
                            <td style={{
                              padding: '16px',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                display: 'flex',
                                gap: '6px',
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                              }}>
                                <button
                                  onClick={() => handleViewDetails(user._id)}
                                  title={t('userManagement.actions.viewDetails')}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    border: '1px solid #D1D5DB',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {t('userManagement.actions.view')}
                                </button>
                                <button
                                  onClick={() => handleStatusToggle(user._id, user.isActive, user.email)}
                                  title={user.isActive ? t('userManagement.actions.deactivateUser') : t('userManagement.actions.activateUser')}
                                  disabled={
                                    (user.role === 'super_admin' && permissions?.role !== 'super_admin') ||
                                    (user.role === 'admin' && permissions?.role !== 'super_admin')
                                  }
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    border: 'none',
                                    backgroundColor: user.isActive ? '#FEF2F2' : '#F0FDF4',
                                    color: user.isActive ? '#991B1B' : '#166534',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {user.isActive ? t('userManagement.actions.deactivate') : t('userManagement.actions.activate')}
                                </button>
                                {permissions?.role === 'super_admin' && (
                                  <button
                                    onClick={() => handleDeleteUser(user._id, user.email)}
                                    title={t('userManagement.actions.deleteUser')}
                                    disabled={user.role === 'super_admin'}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      border: 'none',
                                      backgroundColor: '#FEF2F2',
                                      color: '#991B1B',
                                      cursor: user.role === 'super_admin' ? 'not-allowed' : 'pointer',
                                      opacity: user.role === 'super_admin' ? 0.5 : 1,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {t('userManagement.actions.delete')}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              ) : 
                (
                /* Grid View */
                <div className="users-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '16px'
                }}>
                  {filteredUsers.map(user => (
                    <div key={user._id} className="user-card" style={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.2s ease',
                      direction: isRTL ? 'rtl' : 'ltr'
                    }}>
                      <div className="user-card-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '16px'
                      }}>
                        <div className="user-info" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                          <h3 className="user-name" style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0 0 4px 0',
                            direction: 'ltr',
                            textAlign: isRTL ? 'right' : 'left'
                          }}>{user.firstName} {user.lastName}</h3>
                          <p className="user-email" style={{
                            fontSize: '13px',
                            color: '#6B7280',
                            margin: 0,
                            direction: 'ltr',
                            textAlign: isRTL ? 'right' : 'left'
                          }}>{user.email}</p>
                        </div>
                        <span
                          className="user-role-badge"
                          style={{
                            backgroundColor: getRoleColor(user.role),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            flexShrink: 0
                          }}
                        >
                          {getRoleDisplay(user.role)}
                        </span>
                      </div>

                      <div className="user-card-body" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <div className="user-meta" style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          marginBottom: '16px',
                          padding: '12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '8px'
                        }}>
                          <div className="meta-item" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span className="meta-label" style={{ fontSize: '13px', color: '#6B7280', textAlign: isRTL ? 'right' : 'left' }}>{t('userManagement.userCard.status')}</span>
                            <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`} style={{
                              fontSize: '13px',
                              fontWeight: '500',
                              color: user.isActive ? '#10B981' : '#EF4444',
                              textAlign: isRTL ? 'left' : 'right'
                            }}>
                              {user.isActive ? t('userManagement.userCard.active') : t('userManagement.userCard.inactive')}
                            </span>
                          </div>
                          <div className="meta-item" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span className="meta-label" style={{ fontSize: '13px', color: '#6B7280', textAlign: isRTL ? 'right' : 'left' }}>{t('userManagement.userCard.joined')}</span>
                            <span className="meta-value" style={{ fontSize: '13px', color: '#374151', textAlign: isRTL ? 'left' : 'right', direction: 'ltr' }}>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {user.lastLogin && (
                            <div className="meta-item" style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span className="meta-label" style={{ fontSize: '13px', color: '#6B7280', textAlign: isRTL ? 'right' : 'left' }}>{t('userManagement.userCard.lastLogin')}</span>
                              <span className="meta-value" style={{ fontSize: '13px', color: '#374151', textAlign: isRTL ? 'left' : 'right', direction: 'ltr' }}>
                                {new Date(user.lastLogin).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="user-actions" style={{ marginBottom: '16px' }}>
                          <label className="action-label" style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px',
                            textAlign: isRTL ? 'right' : 'left'
                          }}>{t('userManagement.userCard.changeRole')}</label>
                          <select
                            className="role-select"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value, user.email)}
                            disabled={
                              (user.role === 'super_admin' && permissions?.role !== 'super_admin') ||
                              (user.role === 'admin' && permissions?.role !== 'super_admin')
                            }
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '8px',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              direction: isRTL ? 'rtl' : 'ltr',
                              textAlign: isRTL ? 'right' : 'left'
                            }}
                          >
                            <option value="user">{t('userManagement.roles.user')}</option>
                            <option value="viewer">{t('userManagement.roles.viewer')}</option>
                            <option value="editor">{t('userManagement.roles.editor')}</option>
                            <option value="admin">{t('userManagement.roles.admin')}</option>
                            {permissions?.role === 'super_admin' && (
                              <option value="super_admin">{t('userManagement.roles.superAdmin')}</option>
                            )}
                          </select>
                        </div>

                        <div className="user-action-buttons" style={{
                          display: 'flex',
                          gap: '8px',
                          flexDirection: isRTL ? 'row-reverse' : 'row'
                        }}>
                          <button
                            className="btn-action btn-view"
                            onClick={() => handleViewDetails(user._id)}
                            title={t('userManagement.actions.viewDetails')}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '500',
                              border: '1px solid #D1D5DB',
                              backgroundColor: 'white',
                              color: '#374151',
                              cursor: 'pointer'
                            }}
                          >
                            {t('userManagement.actions.view')}
                          </button>
                          <button
                            className={`btn-action ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                            onClick={() => handleStatusToggle(user._id, user.isActive, user.email)}
                            title={user.isActive ? t('userManagement.actions.deactivateUser') : t('userManagement.actions.activateUser')}
                            disabled={
                              (user.role === 'super_admin' && permissions?.role !== 'super_admin') ||
                              (user.role === 'admin' && permissions?.role !== 'super_admin')
                            }
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '500',
                              border: 'none',
                              backgroundColor: user.isActive ? '#FEF2F2' : '#F0FDF4',
                              color: user.isActive ? '#991B1B' : '#166534',
                              cursor: 'pointer'
                            }}
                          >
                            {user.isActive ? t('userManagement.actions.deactivate') : t('userManagement.actions.activate')}
                          </button>
                          {permissions?.role === 'super_admin' && (
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteUser(user._id, user.email)}
                              title={t('userManagement.actions.deleteUser')}
                              disabled={user.role === 'super_admin'}
                              style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '500',
                                border: 'none',
                                backgroundColor: '#FEF2F2',
                                color: '#991B1B',
                                cursor: user.role === 'super_admin' ? 'not-allowed' : 'pointer',
                                opacity: user.role === 'super_admin' ? 0.5 : 1
                              }}
                            >
                              {t('userManagement.actions.delete')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Details Modal */}
            {showUserDetails && selectedUser && (
              <div className="modal-overlay" onClick={() => setShowUserDetails(false)} style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div className="modal-content user-details-modal" onClick={(e) => e.stopPropagation()} style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  width: '90%',
                  maxWidth: '600px',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}>
                  <div className="modal-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    <div className="modal-header-info" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div className="user-avatar" style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {selectedUser.user.firstName?.charAt(0)}{selectedUser.user.lastName?.charAt(0)}
                      </div>
                      <div className="modal-header-text" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#111827', direction: 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
                          {selectedUser.user.firstName} {selectedUser.user.lastName}
                        </h3>
                        <p className="modal-subtitle" style={{ margin: 0, fontSize: '14px', color: '#6B7280', direction: 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
                          {selectedUser.user.email}
                        </p>
                      </div>
                    </div>
                    <button className="modal-close" onClick={() => setShowUserDetails(false)} style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#6B7280',
                      padding: '4px'
                    }}>×</button>
                  </div>
                  <div className="modal-body" style={{ padding: '24px' }}>
                    {/* Status Badges Row */}
                    <div className="status-badges-row" style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '24px',
                      flexWrap: 'wrap'
                    }}>
                      <span
                        className="user-role-badge"
                        style={{
                          backgroundColor: getRoleColor(selectedUser.user.role),
                          color: 'white',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        {getRoleDisplay(selectedUser.user.role)}
                      </span>
                      <span className={`status-indicator ${selectedUser.user.isActive ? 'active' : 'inactive'}`} style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        backgroundColor: selectedUser.user.isActive ? '#D1FAE5' : '#FEE2E2',
                        color: selectedUser.user.isActive ? '#166534' : '#991B1B'
                      }}>
                        {selectedUser.user.isActive ? t('userManagement.userCard.active') : t('userManagement.userCard.inactive')}
                      </span>
                      <span className="plan-badge" style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8'
                      }}>
                        {selectedUser.user.plan?.toUpperCase() || t('userManagement.modal.freePlan')}
                      </span>
                    </div>

                    {/* Stats Cards Grid */}
                    <div className="user-stats-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      <div className="user-stat-card" style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <span className="user-stat-icon" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🔗</span>
                        <span className="user-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#111827', display: 'block' }}>{selectedUser.stats?.urlCount || 0}</span>
                        <span className="user-stat-label" style={{ fontSize: '13px', color: '#6B7280' }}>{t('userManagement.modal.urls')}</span>
                      </div>
                      <div className="user-stat-card" style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <span className="user-stat-icon" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🌐</span>
                        <span className="user-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#111827', display: 'block' }}>{selectedUser.stats?.domainCount || 0}</span>
                        <span className="user-stat-label" style={{ fontSize: '13px', color: '#6B7280' }}>{t('userManagement.modal.domains')}</span>
                      </div>
                      <div className="user-stat-card" style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <span className="user-stat-icon" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>👆</span>
                        <span className="user-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#111827', display: 'block' }}>{selectedUser.stats?.totalClicks || 0}</span>
                        <span className="user-stat-label" style={{ fontSize: '13px', color: '#6B7280' }}>{t('userManagement.modal.clicks')}</span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="details-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      <div className="detail-card" style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>{t('userManagement.modal.contactInfo')}</h4>
                        <div className="detail-grid-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="detail-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="detail-icon" style={{ fontSize: '16px', flexShrink: 0 }}>📧</span>
                            <div className="detail-text" style={{ flex: 1 }}>
                              <span className="detail-label" style={{ display: 'block', fontSize: '12px', color: '#6B7280' }}>{t('userManagement.modal.email')}</span>
                              <span className="detail-value" style={{ fontSize: '14px', color: '#111827', direction: 'ltr', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>{selectedUser.user.email}</span>
                            </div>
                          </div>
                          <div className="detail-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="detail-icon" style={{ fontSize: '16px', flexShrink: 0 }}>📱</span>
                            <div className="detail-text" style={{ flex: 1 }}>
                              <span className="detail-label" style={{ display: 'block', fontSize: '12px', color: '#6B7280' }}>{t('userManagement.modal.phone')}</span>
                              <span className="detail-value" style={{ fontSize: '14px', color: '#111827', direction: 'ltr', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>{selectedUser.user.phone || t('userManagement.modal.notAvailable')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="detail-card" style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>{t('userManagement.modal.accountActivity')}</h4>
                        <div className="detail-grid-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="detail-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="detail-icon" style={{ fontSize: '16px', flexShrink: 0 }}>📅</span>
                            <div className="detail-text" style={{ flex: 1 }}>
                              <span className="detail-label" style={{ display: 'block', fontSize: '12px', color: '#6B7280' }}>{t('userManagement.modal.joined')}</span>
                              <span className="detail-value" style={{ fontSize: '14px', color: '#111827', direction: 'ltr', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>{new Date(selectedUser.user.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="detail-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="detail-icon" style={{ fontSize: '16px', flexShrink: 0 }}>🕐</span>
                            <div className="detail-text" style={{ flex: 1 }}>
                              <span className="detail-label" style={{ display: 'block', fontSize: '12px', color: '#6B7280' }}>{t('userManagement.modal.lastLogin')}</span>
                              <span className="detail-value" style={{ fontSize: '14px', color: '#111827', direction: 'ltr', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>{selectedUser.user.lastLogin ? new Date(selectedUser.user.lastLogin).toLocaleDateString() : t('userManagement.modal.never')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedUser.user.subscription && (
                      <div className="subscription-section" style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>{t('userManagement.modal.subscription')}</h4>
                        <div className="subscription-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div className="subscription-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="detail-label" style={{ fontSize: '13px', color: '#6B7280' }}>{t('userManagement.modal.subscriptionStatus')}</span>
                            <span className={`subscription-status ${selectedUser.user.subscription.status}`} style={{
                              fontSize: '13px',
                              fontWeight: '500',
                              color: selectedUser.user.subscription.status === 'active' ? '#166534' : '#991B1B'
                            }}>
                              {selectedUser.user.subscription.status?.toUpperCase() || t('userManagement.modal.inactive')}
                            </span>
                          </div>
                          {selectedUser.user.subscription.currentPeriodEnd && (
                            <div className="subscription-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="detail-label" style={{ fontSize: '13px', color: '#6B7280' }}>{t('userManagement.modal.periodEnd')}</span>
                              <span className="detail-value" style={{ fontSize: '13px', color: '#374151', direction: 'ltr' }}>{new Date(selectedUser.user.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default UserManagement;
