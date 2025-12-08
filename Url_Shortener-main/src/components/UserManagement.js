import React, { useState, useEffect } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { rolesAPI, userManagementAPI } from '../services/api';
import './UserManagement.css';

function UserManagement() {
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
    const displays = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      editor: 'Editor',
      viewer: 'Viewer',
      user: 'User'
    };
    return displays[role] || role;
  };

  // Only admins and super_admins can access this
  if (!hasRole(['admin', 'super_admin'])) {
    return null; // Don't render anything
  }

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <p className="subtitle">Manage user roles and permissions</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.activeUsers}</div>
              <div className="stat-label">Active Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{stats.inactiveUsers}</div>
              <div className="stat-label">Inactive Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{stats.recentSignups}</div>
              <div className="stat-label">New (30 days)</div>
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

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Role Filter */}
      <div className="user-filters">
        <label>Filter by role:</label>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({users.length})
          </button>
          <button
            className={`filter-btn ${filter === 'super_admin' ? 'active' : ''}`}
            onClick={() => setFilter('super_admin')}
          >
            Super Admin ({users.filter(u => u.role === 'super_admin').length})
          </button>
          <button
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admin ({users.filter(u => u.role === 'admin').length})
          </button>
          <button
            className={`filter-btn ${filter === 'editor' ? 'active' : ''}`}
            onClick={() => setFilter('editor')}
          >
            Editor ({users.filter(u => u.role === 'editor').length})
          </button>
          <button
            className={`filter-btn ${filter === 'viewer' ? 'active' : ''}`}
            onClick={() => setFilter('viewer')}
          >
            Viewer ({users.filter(u => u.role === 'viewer').length})
          </button>
          <button
            className={`filter-btn ${filter === 'user' ? 'active' : ''}`}
            onClick={() => setFilter('user')}
          >
            User ({users.filter(u => u.role === 'user').length})
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="users-list">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>No users found{filter !== 'all' ? ` with role: ${getRoleDisplay(filter)}` : ''}.</p>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map(user => (
              <div key={user._id} className="user-card">
                <div className="user-card-header">
                  <div className="user-info">
                    <h3 className="user-name">{user.firstName} {user.lastName}</h3>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <span
                    className="user-role-badge"
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    {getRoleDisplay(user.role)}
                  </span>
                </div>

                <div className="user-card-body">
                  <div className="user-meta">
                    <div className="meta-item">
                      <span className="meta-label">Status:</span>
                      <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Joined:</span>
                      <span className="meta-value">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {user.lastLogin && (
                      <div className="meta-item">
                        <span className="meta-label">Last Login:</span>
                        <span className="meta-value">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="user-actions">
                    <label className="action-label">Change Role:</label>
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value, user.email)}
                      disabled={
                        (user.role === 'super_admin' && permissions?.role !== 'super_admin') ||
                        (user.role === 'admin' && permissions?.role !== 'super_admin')
                      }
                    >
                      <option value="user">User</option>
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      {permissions?.role === 'super_admin' && (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>
                  </div>

                  <div className="user-action-buttons">
                    <button
                      className="btn-action btn-view"
                      onClick={() => handleViewDetails(user._id)}
                      title="View Details"
                    >
                      👁️ View
                    </button>
                    <button
                      className={`btn-action ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                      onClick={() => handleStatusToggle(user._id, user.isActive, user.email)}
                      title={user.isActive ? 'Deactivate User' : 'Activate User'}
                      disabled={
                        (user.role === 'super_admin' && permissions?.role !== 'super_admin') ||
                        (user.role === 'admin' && permissions?.role !== 'super_admin')
                      }
                    >
                      {user.isActive ? '🚫 Deactivate' : '✅ Activate'}
                    </button>
                    {permissions?.role === 'super_admin' && (
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteUser(user._id, user.email)}
                        title="Delete User"
                        disabled={user.role === 'super_admin'}
                      >
                        🗑️ Delete
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
        <div className="modal-overlay" onClick={() => setShowUserDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="modal-close" onClick={() => setShowUserDetails(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Personal Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedUser.user.firstName} {selectedUser.user.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedUser.user.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedUser.user.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">
                    <span
                      className="user-role-badge"
                      style={{ backgroundColor: getRoleColor(selectedUser.user.role) }}
                    >
                      {getRoleDisplay(selectedUser.user.role)}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plan:</span>
                  <span className="detail-value">{selectedUser.user.plan?.toUpperCase() || 'FREE'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className={`status-indicator ${selectedUser.user.isActive ? 'active' : 'inactive'}`}>
                      {selectedUser.user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Account Statistics</h4>
                <div className="detail-row">
                  <span className="detail-label">URLs Created:</span>
                  <span className="detail-value">{selectedUser.stats?.urlCount || 0}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Custom Domains:</span>
                  <span className="detail-value">{selectedUser.stats?.domainCount || 0}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Clicks:</span>
                  <span className="detail-value">{selectedUser.stats?.totalClicks || 0}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Joined:</span>
                  <span className="detail-value">{new Date(selectedUser.user.createdAt).toLocaleString()}</span>
                </div>
                {selectedUser.user.lastLogin && (
                  <div className="detail-row">
                    <span className="detail-label">Last Login:</span>
                    <span className="detail-value">{new Date(selectedUser.user.lastLogin).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {selectedUser.user.subscription && (
                <div className="detail-section">
                  <h4>Subscription</h4>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{selectedUser.user.subscription.status?.toUpperCase() || 'INACTIVE'}</span>
                  </div>
                  {selectedUser.user.subscription.currentPeriodEnd && (
                    <div className="detail-row">
                      <span className="detail-label">Period End:</span>
                      <span className="detail-value">{new Date(selectedUser.user.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
