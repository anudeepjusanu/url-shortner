import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { urlsAPI } from '../services/api';
import './MyLinks.css';

const MyLinks = () => {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await urlsAPI.list({ page: 1, limit: 100 });

      // Handle different response structures
      const linksData = response.data?.urls || response.data?.data?.urls || [];
      setLinks(linksData);
    } catch (err) {
      console.error('Failed to fetch links:', err);
      setError(err.message || 'Failed to fetch links. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (link) => {
    try {
      // Construct the full short URL
      let shortUrl;
      if (link.domain && link.domain !== 'laghhu.link') {
        shortUrl = `http://${link.domain}/${link.shortCode}`;
      } else {
        shortUrl = `https://laghhu.link/${link.shortCode}`;
      }

      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(link.id || link._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(linkId);
      await urlsAPI.delete(linkId);
      setLinks(links.filter(link => (link.id || link._id) !== linkId));
    } catch (err) {
      console.error('Failed to delete link:', err);
      alert('Failed to delete link. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const filteredLinks = links.filter(link => {
    const query = searchQuery.toLowerCase();
    return (
      link.shortCode?.toLowerCase().includes(query) ||
      link.originalUrl?.toLowerCase().includes(query) ||
      link.title?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">My Links</h1>
              <div className="language-toggle">
                <button className="lang-btn active">EN</button>
                <button className="lang-btn">العربية</button>
              </div>
            </div>
            <div className="header-right">
              <div className="search-container">
                <div className="search-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="7" r="6" stroke="#9CA3AF" strokeWidth="2"/>
                    <path d="m13 13 4 4" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="notification-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 16 18" fill="none">
                  <g clipPath="url(#clip0_775_451)">
                    <path d="M7.87495 0C7.25268 0 6.74995 0.502734 6.74995 1.125V1.7543C4.20112 2.15859 2.24995 4.36641 2.24995 7.03125V8.20547C2.24995 9.80156 1.70502 11.352 0.710103 12.5965L0.186274 13.2539C-0.0176318 13.507 -0.0563037 13.8551 0.0843213 14.1469C0.224946 14.4387 0.520259 14.625 0.843696 14.625H14.9062C15.2296 14.625 15.5249 14.4387 15.6656 14.1469C15.8062 13.8551 15.7675 13.507 15.5636 13.2539L15.0398 12.6C14.0449 11.352 13.4999 9.80156 13.4999 8.20547V7.03125C13.4999 4.36641 11.5488 2.15859 8.99995 1.7543V1.125C8.99995 0.502734 8.49721 0 7.87495 0ZM7.87495 3.375H8.1562C10.1742 3.375 11.8124 5.01328 11.8124 7.03125V8.20547C11.8124 9.88945 12.3011 11.5312 13.2081 12.9375H2.54174C3.44877 11.5312 3.93745 9.88945 3.93745 8.20547V7.03125C3.93745 5.01328 5.57573 3.375 7.5937 3.375H7.87495ZM10.1249 15.75H7.87495H5.62495C5.62495 16.3477 5.86049 16.9207 6.28237 17.3426C6.70424 17.7645 7.27729 18 7.87495 18C8.4726 18 9.04565 17.7645 9.46752 17.3426C9.8894 16.9207 10.1249 16.3477 10.1249 15.75Z" fill="#6B7280"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_775_451">
                      <path d="M0 0H15.75V18H0V0Z" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                <div className="notification-dot"></div>
              </div>
              <div className="user-avatar">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format" alt="User" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span className="breadcrumb-item" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L1 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="breadcrumb-item active">My Links</span>
          </div>

          {/* Page Header with Action */}
          <div className="page-header">
            <div>
              <h2 className="section-title">All Your Links</h2>
              <p className="section-description">Manage and track all your shortened links in one place</p>
            </div>
            <button
              className="create-link-btn"
              onClick={() => navigate('/create-short-link')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3.33334V12.6667M3.33334 8H12.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create New Link
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-cards-container">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.1187 8.36562C19.8844 6.6 19.8844 3.74062 18.1187 1.975C16.5562 0.412497 14.0938 0.209372 12.2969 1.49375L12.2469 1.52812C11.7969 1.85 11.6938 2.475 12.0156 2.92187C12.3375 3.36875 12.9625 3.475 13.4094 3.15312L13.4594 3.11875C14.4625 2.40312 15.8344 2.51562 16.7031 3.3875C17.6875 4.37187 17.6875 5.96562 16.7031 6.95L13.1969 10.4625C12.2125 11.4469 10.6187 11.4469 9.63437 10.4625C8.7625 9.59062 8.65 8.21875 9.36563 7.21875L9.4 7.16875C9.72187 6.71875 9.61562 6.09375 9.16875 5.775C8.72188 5.45625 8.09375 5.55937 7.775 6.00625L7.74063 6.05625C6.45313 7.85 6.65625 10.3125 8.21875 11.875C9.98438 13.6406 12.8438 13.6406 14.6094 11.875L18.1187 8.36562ZM1.88125 7.63437C0.115625 9.4 0.115625 12.2594 1.88125 14.025C3.44375 15.5875 5.90625 15.7906 7.70313 14.5062L7.75313 14.4719C8.20313 14.15 8.30625 13.525 7.98438 13.0781C7.6625 12.6312 7.0375 12.525 6.59063 12.8469L6.54063 12.8812C5.5375 13.5969 4.16563 13.4844 3.29688 12.6125C2.3125 11.625 2.3125 10.0312 3.29688 9.04687L6.80313 5.5375C7.7875 4.55312 9.38125 4.55312 10.3656 5.5375C11.2375 6.40937 11.35 7.78125 10.6344 8.78437L10.6 8.83437C10.2781 9.28437 10.3844 9.90937 10.8313 10.2281C11.2781 10.5469 11.9062 10.4437 12.225 9.99687L12.2594 9.94687C13.5469 8.15 13.3438 5.6875 11.7812 4.125C10.0156 2.35937 7.15625 2.35937 5.39063 4.125L1.88125 7.63437Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-details">
                <div className="stat-label">Total Links</div>
                <div className="stat-value">{links.length}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 5V10L13 13M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-details">
                <div className="stat-label">Active Links</div>
                <div className="stat-value">{links.filter(l => l.isActive !== false).length}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2C2 1.44687 1.55313 1 1 1C0.446875 1 0 1.44687 0 2V12.5C0 13.8813 1.11875 15 2.5 15H15C15.5531 15 16 14.5531 16 14C16 13.4469 15.5531 13 15 13H2.5C2.225 13 2 12.775 2 12.5V2ZM14.7063 4.70625C15.0969 4.31563 15.0969 3.68125 14.7063 3.29063C14.3156 2.9 13.6812 2.9 13.2906 3.29063L10 6.58437L8.20625 4.79063C7.81563 4.4 7.18125 4.4 6.79063 4.79063L3.29063 8.29062C2.9 8.68125 2.9 9.31563 3.29063 9.70625C3.68125 10.0969 4.31563 10.0969 4.70625 9.70625L7.5 6.91563L9.29375 8.70938C9.68437 9.1 10.3188 9.1 10.7094 8.70938L14.7094 4.70937L14.7063 4.70625Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-details">
                <div className="stat-label">Total Clicks</div>
                <div className="stat-value">{links.reduce((sum, link) => sum + (link.clickCount || 0), 0)}</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM8 4C8.55312 4 9 4.44687 9 5V8C9 8.55312 8.55312 9 8 9C7.44688 9 7 8.55312 7 8V5C7 4.44687 7.44688 4 8 4ZM8 12C7.44688 12 7 11.5531 7 11C7 10.4469 7.44688 10 8 10C8.55312 10 9 10.4469 9 11C9 11.5531 8.55312 12 8 12Z" fill="#EF4444"/>
              </svg>
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Links List */}
          <div className="links-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your links...</p>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="32" fill="#F3F4F6"/>
                    <path d="M42 26C42 23.7909 40.2091 22 38 22H26C23.7909 22 22 23.7909 22 26V38C22 40.2091 23.7909 42 26 42H38C40.2091 42 42 40.2091 42 38V26Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M32 28V36M28 32H36" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>No links found</h3>
                <p>
                  {searchQuery
                    ? 'No links match your search query. Try a different search term.'
                    : 'You haven\'t created any short links yet. Create your first link to get started!'
                  }
                </p>
                {!searchQuery && (
                  <button
                    className="create-first-link-btn"
                    onClick={() => navigate('/create-short-link')}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3.33334V12.6667M3.33334 8H12.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Create Your First Link
                  </button>
                )}
              </div>
            ) : (
              <div className="links-list">
                {filteredLinks.map((link) => {
                  const linkId = link.id || link._id;
                  return (
                    <div key={linkId} className="link-card">
                      <div className="link-content">
                        <div className="link-header">
                          <div className="link-title-section">
                            <h3 className="link-title">{link.title || 'Untitled Link'}</h3>
                            <div className="link-status">
                              <span className={`status-badge ${link.isActive !== false ? 'active' : 'inactive'}`}>
                                {link.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="link-urls">
                          <div className="url-row">
                            <span className="url-label">Short:</span>
                            <code className="short-url">
                              {link.domain && link.domain !== 'laghhu.link'
                                ? `${link.domain}/${link.shortCode}`
                                : `laghhu.link/${link.shortCode}`}
                            </code>
                          </div>
                          <div className="url-row">
                            <span className="url-label">Original:</span>
                            <a
                              href={link.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="original-url"
                            >
                              {link.originalUrl}
                            </a>
                          </div>
                        </div>

                        <div className="link-meta">
                          <span className="meta-item">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7 1V7L10 10M13 7C13 10.3137 10.3137 13 7 13C3.68629 13 1 10.3137 1 7C1 3.68629 3.68629 1 7 1C10.3137 1 13 3.68629 13 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {formatDate(link.createdAt)}
                          </span>
                          <span className="meta-item">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 7V11.5C1 12.3284 1.67157 13 2.5 13H11.5C12.3284 13 13 12.3284 13 11.5V7M1 7V2.5C1 1.67157 1.67157 1 2.5 1H11.5C12.3284 1 13 1.67157 13 2.5V7M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {link.clickCount || 0} clicks
                          </span>
                        </div>
                      </div>

                      <div className="link-actions">
                        <button
                          className="action-btn copy"
                          onClick={() => handleCopyLink(link)}
                          title="Copy link"
                        >
                          {copiedId === linkId ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Copy
                            </>
                          )}
                        </button>

                        <button
                          className="action-btn analytics"
                          onClick={() => navigate(`/analytics?link=${linkId}`)}
                          title="View analytics"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 7V11.5C1 12.3284 1.67157 13 2.5 13H11.5C12.3284 13 13 12.3284 13 11.5V7M1 7V2.5C1 1.67157 1.67157 1 2.5 1H11.5C12.3284 1 13 1.67157 13 2.5V7M1 7H13M7 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Analytics
                        </button>

                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteLink(linkId)}
                          disabled={deleteLoading === linkId}
                          title="Delete link"
                        >
                          {deleteLoading === linkId ? (
                            <>
                              <div className="spinner-small"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.75 3.5H2.91667H12.25M11.0833 3.5V11.6667C11.0833 12.0203 10.9428 12.3594 10.6927 12.6095C10.4426 12.8595 10.1036 13 9.75 13H4.25C3.89638 13 3.55724 12.8595 3.30719 12.6095C3.05714 12.3594 2.91667 12.0203 2.91667 11.6667V3.5M4.66667 3.5V2.33333C4.66667 1.97971 4.80714 1.64057 5.05719 1.39052C5.30724 1.14048 5.64638 1 6 1H8C8.35362 1 8.69276 1.14048 8.94281 1.39052C9.19286 1.64057 9.33333 1.97971 9.33333 2.33333V3.5M6 6.41667V10.5M8 6.41667V10.5" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyLinks;
