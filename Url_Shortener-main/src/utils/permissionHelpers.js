/**
 * Permission Helper Utilities
 * Use these helpers to enforce permissions across components
 */

/**
 * Check if user can perform an action and show error if they can't
 * @param {Function} hasPermission - The hasPermission function from usePermissions hook
 * @param {string} resource - Resource name (e.g., 'urls', 'domains')
 * @param {string} action - Action name (e.g., 'create', 'update', 'delete')
 * @param {Function} setShowAccessDenied - State setter for access denied modal
 * @returns {boolean} - Whether the user has permission
 */
export const checkAndShowPermission = (hasPermission, resource, action, setShowAccessDenied) => {
  if (!hasPermission(resource, action)) {
    setShowAccessDenied(true);
    return false;
  }
  return true;
};

/**
 * Get user-friendly action names
 */
export const getActionName = (resource, action) => {
  const actions = {
    urls: {
      create: 'create URLs',
      read: 'view URLs',
      update: 'edit URLs',
      delete: 'delete URLs'
    },
    domains: {
      create: 'add custom domains',
      read: 'view domains',
      update: 'edit domains',
      delete: 'delete domains',
      verify: 'verify domains'
    },
    analytics: {
      view: 'view analytics',
      export: 'export analytics'
    },
    qrCodes: {
      create: 'create QR codes',
      download: 'download QR codes',
      customize: 'customize QR codes'
    },
    users: {
      create: 'create users',
      read: 'view users',
      update: 'update users',
      delete: 'delete users'
    },
    settings: {
      update: 'update settings'
    }
  };

  return actions[resource]?.[action] || `${action} ${resource}`;
};

/**
 * Permission check wrapper for async functions
 * Wraps an async function with permission check
 */
export const withPermissionCheck = (hasPermission, resource, action, setShowAccessDenied) => {
  return (asyncFunction) => {
    return async (...args) => {
      if (!hasPermission(resource, action)) {
        setShowAccessDenied(true);
        return;
      }
      return await asyncFunction(...args);
    };
  };
};

/**
 * Get disabled state and title for buttons
 */
export const getButtonState = (hasPermission, resource, action, otherDisabledConditions = false) => {
  const hasPermissionToAct = hasPermission(resource, action);

  return {
    disabled: otherDisabledConditions || !hasPermissionToAct,
    title: !hasPermissionToAct ? `You don't have permission to ${getActionName(resource, action)}` : ''
  };
};

/**
 * Format permission denied message
 */
export const getPermissionDeniedMessage = (resource, action) => {
  return `You don't have permission to ${getActionName(resource, action)}.`;
};
