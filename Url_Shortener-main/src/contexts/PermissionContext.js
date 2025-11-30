import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/roles/my-permissions');

      if (response.success) {
        console.log('✅ Permissions loaded:', response.data);
        console.log('👤 User Role:', response.data.role);
        setPermissions(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Error fetching permissions:', err);
      setError(err.message);
      // Set default permissions for unauthenticated users
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is authenticated (has token)
    const token = apiClient.getToken();
    if (token) {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Check if user has a specific permission
   * @param {string} resource - Resource name (e.g., 'urls', 'domains')
   * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
   * @returns {boolean}
   */
  const hasPermission = (resource, action) => {
    if (!permissions) {
      return false;
    }

    // Check both permissions.role and permissions.data.role for flexibility
    const userRole = permissions.role || permissions.data?.role || permissions.user?.role;

    // Admin and super_admin have all permissions
    if (userRole === 'admin' || userRole === 'super_admin') {
      return true;
    }

    // Check specific permissions for other roles
    const canAccess = permissions.canAccess || permissions.data?.canAccess;
    if (!canAccess) {
      return false;
    }

    return canAccess[resource]?.[action] || false;
  };

  /**
   * Check if user has any of the specified roles
   * @param {string|string[]} roles - Role or array of roles to check
   * @returns {boolean}
   */
  const hasRole = (roles) => {
    if (!permissions) {
      return false;
    }

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(permissions.role);
  };

  /**
   * Check if user has at least the specified role level
   * @param {string} role - Minimum role required
   * @returns {boolean}
   */
  const hasRoleOrAbove = (role) => {
    if (!permissions) {
      return false;
    }

    const roleHierarchy = {
      'super_admin': 5,
      'admin': 4,
      'editor': 3,
      'viewer': 2,
      'user': 1
    };

    const userLevel = roleHierarchy[permissions.role] || 0;
    const requiredLevel = roleHierarchy[role] || 0;

    return userLevel >= requiredLevel;
  };

  /**
   * Refresh permissions from server
   */
  const refreshPermissions = async () => {
    await fetchPermissions();
  };

  const value = {
    permissions,
    loading,
    error,
    hasPermission,
    hasRole,
    hasRoleOrAbove,
    refreshPermissions,
    isAdmin: hasRole(['admin', 'super_admin']),
    isSuperAdmin: hasRole(['super_admin']),
    isEditor: hasRole(['editor']),
    isViewer: hasRole(['viewer'])
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * Higher-order component to protect routes based on permissions
 */
export const withPermission = (Component, resource, action) => {
  return (props) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
      return <div>Loading permissions...</div>;
    }

    if (!hasPermission(resource, action)) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to {action} {resource}.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

/**
 * Higher-order component to protect routes based on role
 */
export const withRole = (Component, roles) => {
  return (props) => {
    const { hasRole, loading } = usePermissions();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasRole(roles)) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have the required role to access this page.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

/**
 * Component to conditionally render content based on permissions
 */
export const CanAccess = ({ resource, action, children, fallback = null }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return fallback;
  }

  return children;
};

/**
 * Component to conditionally render content based on role
 */
export const HasRole = ({ roles, children, fallback = null }) => {
  const { hasRole } = usePermissions();

  if (!hasRole(roles)) {
    return fallback;
  }

  return children;
};

export default PermissionContext;
