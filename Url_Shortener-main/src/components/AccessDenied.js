import React from 'react';
import './AccessDenied.css';

function AccessDenied({ message, action, onClose }) {
  return (
    <div className="access-denied-overlay" onClick={onClose}>
      <div className="access-denied-modal" onClick={(e) => e.stopPropagation()}>
        <div className="access-denied-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#fee" />
            <path
              d="M32 16C23.163 16 16 23.163 16 32C16 40.837 23.163 48 32 48C40.837 48 48 40.837 48 32C48 23.163 40.837 16 32 16ZM32 44C25.373 44 20 38.627 20 32C20 25.373 25.373 20 32 20C38.627 20 44 25.373 44 32C44 38.627 38.627 44 32 44Z"
              fill="#e74c3c"
            />
            <path
              d="M38 26L26 38M26 26L38 38"
              stroke="#e74c3c"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="access-denied-title">Access Denied</h2>
        <p className="access-denied-message">
          {message || `You don't have permission to ${action || 'perform this action'}.`}
        </p>
        <p className="access-denied-contact">
          Please contact your administrator for more information.
        </p>
        <button className="access-denied-close-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

export default AccessDenied;
