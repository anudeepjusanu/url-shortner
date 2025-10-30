import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner-large">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 2V8M16 24V30M30 16H24M8 16H2M25.4558 6.54416L21.2132 10.7868M10.7868 21.2132L6.54416 25.4558M25.4558 25.4558L21.2132 21.2132M10.7868 10.7868L6.54416 6.54416"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
              />
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

  // If authenticated, render the protected component
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