import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasRole, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  // Show loading spinner while checking authentication or permissions
  if (loading || permissionsLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner-large">
            <svg width="40" height="40" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <circle cx="25" cy="25" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none" />
              <g stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" fill="none">
                <path d="M25 5 A20 20 0 0 1 45 25" />
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
              </g>
            </svg>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login with the current location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && !hasRole(requiredRole)) {
    // User doesn't have the required role, redirect to dashboard or show forbidden
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and has required role (if specified), render the protected component
  return children;
};

// Add some basic styles for the loading component
const style = document.createElement('style');
style.textContent = `
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f9fafb;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .loading-spinner-large svg {
    animation: spin 1s linear infinite;
  }

  .loading-content p {
    color: #6b7280;
    font-size: 16px;
    font-weight: 500;
    margin: 0;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(style);

export default ProtectedRoute;