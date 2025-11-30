import React from 'react';
import { usePermissions, CanAccess, HasRole } from '../contexts/PermissionContext';
import './PermissionTest.css';

function PermissionTest() {
  const {
    permissions,
    loading,
    error,
    hasPermission,
    hasRole,
    hasRoleOrAbove,
    isAdmin,
    isSuperAdmin,
    isEditor,
    isViewer
  } = usePermissions();

  if (loading) {
    return <div className="permission-test-loading">Loading permissions...</div>;
  }

  if (error) {
    return (
      <div className="permission-test-error">
        <h2>Error Loading Permissions</h2>
        <p>{error}</p>
      </div>
    );
  }

  const renderPermissionIcon = (hasPermission) => {
    return hasPermission ? '✅' : '❌';
  };

  const renderPermissionStatus = (hasPermission) => {
    return hasPermission ? 'Allowed' : 'Denied';
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

  const resources = [
    {
      name: 'URLs',
      key: 'urls',
      actions: [
        { key: 'create', label: 'Create URLs' },
        { key: 'read', label: 'View URLs' },
        { key: 'update', label: 'Edit URLs' },
        { key: 'delete', label: 'Delete URLs' }
      ]
    },
    {
      name: 'Domains',
      key: 'domains',
      actions: [
        { key: 'create', label: 'Add Domains' },
        { key: 'read', label: 'View Domains' },
        { key: 'update', label: 'Edit Domains' },
        { key: 'delete', label: 'Delete Domains' },
        { key: 'verify', label: 'Verify Domains' }
      ]
    },
    {
      name: 'Analytics',
      key: 'analytics',
      actions: [
        { key: 'view', label: 'View Analytics' },
        { key: 'export', label: 'Export Analytics' }
      ]
    },
    {
      name: 'QR Codes',
      key: 'qrCodes',
      actions: [
        { key: 'create', label: 'Generate QR Codes' },
        { key: 'download', label: 'Download QR Codes' },
        { key: 'customize', label: 'Customize QR Codes' }
      ]
    },
    {
      name: 'Users',
      key: 'users',
      actions: [
        { key: 'create', label: 'Create Users' },
        { key: 'read', label: 'View Users' },
        { key: 'update', label: 'Update Users' },
        { key: 'delete', label: 'Delete Users' }
      ]
    },
    {
      name: 'Settings',
      key: 'settings',
      actions: [
        { key: 'update', label: 'Update Settings' }
      ]
    }
  ];

  return (
    <div className="permission-test">
      <div className="permission-header">
        <h1>🔐 Permission Test Dashboard</h1>
        <p>Test your role-based access control permissions</p>
      </div>

      {/* Current User Info */}
      <div className="user-info-card">
        <h2>Your Account Information</h2>
        <div className="user-info-grid">
          <div className="info-item">
            <label>Current Role:</label>
            <span
              className="role-badge-large"
              style={{ backgroundColor: getRoleColor(permissions?.role) }}
            >
              {permissions?.role?.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="info-item">
            <label>Role Badges:</label>
            <div className="role-badges">
              {isSuperAdmin && <span className="badge badge-super">👑 Super Admin</span>}
              {isAdmin && <span className="badge badge-admin">🔧 Admin</span>}
              {isEditor && <span className="badge badge-editor">✏️ Editor</span>}
              {isViewer && <span className="badge badge-viewer">👁️ Viewer</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Role Hierarchy Check */}
      <div className="role-hierarchy-card">
        <h2>Role Hierarchy Check</h2>
        <div className="hierarchy-checks">
          <div className={`hierarchy-item ${hasRoleOrAbove('user') ? 'allowed' : 'denied'}`}>
            <span>{renderPermissionIcon(hasRoleOrAbove('user'))}</span>
            <span>User Level or Above</span>
          </div>
          <div className={`hierarchy-item ${hasRoleOrAbove('viewer') ? 'allowed' : 'denied'}`}>
            <span>{renderPermissionIcon(hasRoleOrAbove('viewer'))}</span>
            <span>Viewer Level or Above</span>
          </div>
          <div className={`hierarchy-item ${hasRoleOrAbove('editor') ? 'allowed' : 'denied'}`}>
            <span>{renderPermissionIcon(hasRoleOrAbove('editor'))}</span>
            <span>Editor Level or Above</span>
          </div>
          <div className={`hierarchy-item ${hasRoleOrAbove('admin') ? 'allowed' : 'denied'}`}>
            <span>{renderPermissionIcon(hasRoleOrAbove('admin'))}</span>
            <span>Admin Level or Above</span>
          </div>
          <div className={`hierarchy-item ${hasRoleOrAbove('super_admin') ? 'allowed' : 'denied'}`}>
            <span>{renderPermissionIcon(hasRoleOrAbove('super_admin'))}</span>
            <span>Super Admin Level</span>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="permissions-matrix">
        <h2>Detailed Permissions Matrix</h2>
        <div className="permissions-grid">
          {resources.map((resource) => (
            <div key={resource.key} className="resource-card">
              <h3 className="resource-title">{resource.name}</h3>
              <div className="permissions-list">
                {resource.actions.map((action) => {
                  const canAccess = hasPermission(resource.key, action.key);
                  return (
                    <div
                      key={action.key}
                      className={`permission-item ${canAccess ? 'allowed' : 'denied'}`}
                    >
                      <span className="permission-icon">
                        {renderPermissionIcon(canAccess)}
                      </span>
                      <span className="permission-label">{action.label}</span>
                      <span className="permission-status">
                        {renderPermissionStatus(canAccess)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component Testing Section */}
      <div className="component-testing">
        <h2>Component-Based Access Control Testing</h2>

        <div className="test-section">
          <h3>CanAccess Component Test</h3>
          <p className="test-description">These elements only show if you have the required permission:</p>

          <div className="test-results">
            <CanAccess resource="urls" action="create">
              <div className="test-item allowed">✅ You can see this because you can CREATE URLs</div>
            </CanAccess>

            <CanAccess
              resource="urls"
              action="create"
              fallback={<div className="test-item denied">❌ You cannot CREATE URLs</div>}
            >
              <div className="test-item allowed">✅ You can CREATE URLs</div>
            </CanAccess>

            <CanAccess
              resource="domains"
              action="create"
              fallback={<div className="test-item denied">❌ You cannot CREATE domains</div>}
            >
              <div className="test-item allowed">✅ You can CREATE domains</div>
            </CanAccess>

            <CanAccess
              resource="analytics"
              action="export"
              fallback={<div className="test-item denied">❌ You cannot EXPORT analytics</div>}
            >
              <div className="test-item allowed">✅ You can EXPORT analytics</div>
            </CanAccess>

            <CanAccess
              resource="users"
              action="update"
              fallback={<div className="test-item denied">❌ You cannot UPDATE users</div>}
            >
              <div className="test-item allowed">✅ You can UPDATE users</div>
            </CanAccess>
          </div>
        </div>

        <div className="test-section">
          <h3>HasRole Component Test</h3>
          <p className="test-description">These elements show based on role membership:</p>

          <div className="test-results">
            <HasRole
              roles={['admin', 'super_admin']}
              fallback={<div className="test-item denied">❌ You are NOT an Admin</div>}
            >
              <div className="test-item allowed">✅ You ARE an Admin or Super Admin</div>
            </HasRole>

            <HasRole
              roles="editor"
              fallback={<div className="test-item denied">❌ You are NOT an Editor</div>}
            >
              <div className="test-item allowed">✅ You ARE an Editor</div>
            </HasRole>

            <HasRole
              roles="viewer"
              fallback={<div className="test-item denied">❌ You are NOT a Viewer</div>}
            >
              <div className="test-item allowed">✅ You ARE a Viewer</div>
            </HasRole>
          </div>
        </div>
      </div>

      {/* Raw Permissions Data */}
      <div className="raw-permissions">
        <h2>Raw Permissions Data (for debugging)</h2>
        <pre className="permissions-json">
          {JSON.stringify(permissions, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default PermissionTest;
