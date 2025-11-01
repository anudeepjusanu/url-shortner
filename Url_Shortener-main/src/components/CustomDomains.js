import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import { domainsAPI } from '../services/api';
import './CustomDomains.css';

const CustomDomains = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await domainsAPI.getDomains();

      // Handle different response structures
      const domainsData = response.data?.data?.domains || response.data?.domains || response.domains || [];
      setDomains(domainsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching domains:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch domains');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    try {
      setIsAddingDomain(true);
      const domainData = {
        domain: newDomainName.toLowerCase().trim(),
        isDefault: false
      };

      await domainsAPI.createDomain(domainData);
      await fetchDomains();
      setShowAddModal(false);
      setNewDomainName('');
      setError(null);
    } catch (err) {
      console.error('Error adding domain:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add domain');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    try {
      const response = await domainsAPI.verifyDomain(domainId);
      await fetchDomains();
      alert('Domain verification requested. Please check back later.');
    } catch (err) {
      console.error('Domain verification error:', err);
      setError(err.response?.data?.message || err.message || 'DNS verification failed');
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return;

    try {
      await domainsAPI.deleteDomain(domainId);
      await fetchDomains();
    } catch (err) {
      console.error('Error deleting domain:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete domain');
    }
  };

  const renderAddDomainModal = () => (
    <div className="modal-overlay" style={{
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
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Add New Domain</h3>
          <button
            onClick={() => setShowAddModal(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleAddDomain}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Domain Name
            </label>
            <input
              type="text"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              placeholder="example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              required
            />
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Enter your domain name (e.g., example.com, subdomain.example.com)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingDomain || !newDomainName.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isAddingDomain ? 'not-allowed' : 'pointer',
                opacity: isAddingDomain ? 0.6 : 1
              }}
            >
              {isAddingDomain ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );


  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            <div className="page-header">
              <button
                className="create-link-btn"
                onClick={() => setShowAddModal(true)}
                style={{
                  marginLeft: 'auto',
                  minWidth: 180,
                  color: "white",
                  padding: "8px 16px",
                  background: "#3B82F6",
                  border: "none",
                  borderRadius: "5px"
                }}
              >
                Add New Domain
              </button>
              <div className="header-info">
                <h1 className="page-title">Custom Domains</h1>
                <p className="page-subtitle">Manage your branded domains for short links</p>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
                <button onClick={() => setError(null)}>&times;</button>
              </div>
            )}

            <div className="links-container">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading domains...</p>
                </div>
              ) : domains.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3>No domains found</h3>
                  <p>Add your first custom domain to start creating branded short links</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="create-first-link-btn"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Your First Domain
                  </button>
                </div>
              ) : (
                <div className="links-list">
                  {domains.map((domain) => {
                    const domainId = domain.id || domain._id;
                    return (
                      <div key={domainId} className="link-card">
                        <div className="link-content">
                          <div className="link-header">
                            <div className="link-title-section">
                              <h3 className="link-title">{domain.fullDomain || domain.domain}</h3>
                              <div className="link-status">
                                <span className={`status-badge ${domain.status === 'active' ? 'active' : 'inactive'}`}>
                                  {domain.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                                {domain.isDefault && (
                                  <span className="status-badge active">Default</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="link-urls">
                            <div className="url-row">
                              <span className="url-label">Domain:</span>
                              <span className="short-url">{domain.fullDomain || domain.domain}</span>
                            </div>
                            <div className="url-row">
                              <span className="url-label">Status:</span>
                              <span className="original-url">
                                {domain.verified || domain.verificationStatus === 'verified' ? 'DNS Verified' : 'Pending Verification'}
                              </span>
                            </div>
                          </div>
                          <div className="link-meta">
                            <div className="meta-item">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m0 0v13a2 2 0 01-2 2H10a2 2 0 01-2-2V7z" />
                              </svg>
                              <span>Added {new Date(domain.createdAt || domain.dateAdded).toLocaleDateString()}</span>
                            </div>
                            <div className="meta-item">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{domain.owner?.email || domain.addedBy || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="link-actions">
                          {(!domain.verified && domain.verificationStatus !== 'verified') && (
                            <button
                              onClick={() => handleVerifyDomain(domainId)}
                              className="action-btn analytics"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDomain(domainId)}
                            className="action-btn delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {showAddModal && renderAddDomainModal()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDomains;