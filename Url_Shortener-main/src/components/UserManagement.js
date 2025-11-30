import React, { useState, useEffect } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { rolesAPI } from '../services/api';
import './UserManagement.css';

function UserManagement() {
  const { permissions, hasRole } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (hasRole(['admin', 'super_admin'])) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [hasRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rolesAPI.getUsersWithRoles({
        limit: 100
      });

      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole, userEmail) => {
    // Confirmation dialog
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
        loadUsers(); // Refresh the list

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update user role');
    }
  };

  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

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
                        // Disable if:
                        // 1. User is super_admin and current user is not super_admin
                        (user.role === 'super_admin' && permissions?.role !== 'super_admin') ||
                        // 2. Target is admin and current user is not super_admin
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
