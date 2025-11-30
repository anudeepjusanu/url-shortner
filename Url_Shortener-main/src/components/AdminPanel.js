import React, { useState, useEffect } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { rolesAPI } from '../services/api';
import './AdminPanel.css';

function AdminPanel() {
  const { hasRole, permissions } = usePermissions();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // All hooks must be called before any conditional returns
  useEffect(() => {
    // Only load data if user has admin access
    if (hasRole(['admin', 'super_admin'])) {
      loadRoles();
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, roleFilter, searchTerm]);

  // Define all functions after hooks
  const loadRoles = async () => {
    try {
      const response = await rolesAPI.getAllRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Failed to load roles');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };

      if (roleFilter) params.role = roleFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await rolesAPI.getUsersWithRoles(params);

      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await rolesAPI.updateUserRole(userId, newRole);

      if (response.success) {
        setSuccess(`User role updated to ${newRole} successfully!`);
        loadUsers(); // Refresh the list

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

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

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: '👑 Super Admin',
      admin: '🔧 Admin',
      editor: '✏️ Editor',
      viewer: '👁️ Viewer',
      user: '👤 User'
    };
    return badges[role] || role;
  };

  // Check if user has admin access (after all hooks)
  if (!hasRole(['admin', 'super_admin'])) {
    return (
      <div className="admin-panel-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
        <p>Your current role: <strong>{permissions?.role || 'Unknown'}</strong></p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>User Role Management</h1>
        <p className="admin-subtitle">
          Manage user roles and permissions
          <span className="user-role-badge" style={{ backgroundColor: getRoleColor(permissions?.role) }}>
            Your Role: {getRoleBadge(permissions?.role)}
          </span>
        </p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ {success}
          <button onClick={() => setSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      {/* Role Legend */}
      <div className="role-legend">
        <h3>Available Roles:</h3>
        <div className="role-cards">
          {Object.entries(roles).map(([roleKey, roleInfo]) => (
            <div key={roleKey} className="role-card">
              <div className="role-card-header" style={{ backgroundColor: getRoleColor(roleKey) }}>
                <strong>{roleInfo.name}</strong>
                <span className="role-level">Level {roleInfo.level}</span>
              </div>
              <p className="role-description">{roleInfo.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="admin-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="role-filter"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="no-users">
          <p>No users found.</p>
        </div>
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="user-email">{user.email}</td>
                    <td className="user-name">{user.firstName} {user.lastName}</td>
                    <td>
                      <span
                        className="role-badge"
                        style={{ backgroundColor: getRoleColor(user.role) }}
                      >
                        {getRoleBadge(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td className="user-date">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="user-date">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="role-select"
                        disabled={user.role === 'super_admin' && permissions?.role !== 'super_admin'}
                      >
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                        {permissions?.role === 'super_admin' && (
                          <option value="super_admin">Super Admin</option>
                        )}
                      </select>
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
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                ← Previous
              </button>

              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
                ({pagination.total} total users)
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="pagination-button"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPanel;
