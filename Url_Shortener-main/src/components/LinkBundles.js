import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import Toast from './Toast';
import { bundlesAPI, urlsAPI } from '../services/api';
import './LinkBundles.css';

const LinkBundles = () => {
  const { t } = useTranslation();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [toast, setToast] = useState(null);
  const [userLinks, setUserLinks] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder',
    tags: [],
    settings: {
      isPublic: false,
      allowExport: true
    }
  });

  useEffect(() => {
    fetchBundles();
    fetchUserLinks();
  }, []);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const response = await bundlesAPI.list();
      if (response.success) {
        setBundles(response.data.bundles);
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLinks = async () => {
    try {
      const response = await urlsAPI.list({ limit: 100 });
      if (response.success) {
        setUserLinks(response.data.urls);
      }
    } catch (error) {
      console.error('Failed to fetch links:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await bundlesAPI.create(formData);
      if (response.success) {
        setBundles([...bundles, response.data.bundle]);
        setShowCreateModal(false);
        resetForm();
        setToast({ type: 'success', message: 'Bundle created successfully!' });
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const handleDelete = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;
    
    try {
      await bundlesAPI.delete(bundleId);
      setBundles(bundles.filter(b => b._id !== bundleId));
      setToast({ type: 'success', message: 'Bundle deleted successfully!' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const handleAddLink = async (bundleId, linkId) => {
    try {
      await bundlesAPI.addLink(bundleId, linkId);
      fetchBundles();
      setToast({ type: 'success', message: 'Link added to bundle!' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const handleExport = async (bundleId, format) => {
    try {
      const response = await bundlesAPI.export(bundleId, format);
      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bundle-${bundleId}.csv`;
        a.click();
      } else {
        // Handle JSON download
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bundle-${bundleId}.json`;
        a.click();
      }
      setToast({ type: 'success', message: 'Bundle exported successfully!' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      icon: 'folder',
      tags: [],
      settings: { isPublic: false, allowExport: true }
    });
  };

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              <div className="page-header">
                <div>
                  <h1>Link Bundles</h1>
                  <p>Organize your links into collections</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                  + Create Bundle
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading bundles...</p>
                </div>
              ) : bundles.length === 0 ? (
                <div className="empty-state">
                  <p>No bundles yet. Create your first bundle to organize your links!</p>
                </div>
              ) : (
                <div className="bundles-grid">
                  {bundles.map((bundle) => (
                    <div key={bundle._id} className="bundle-card" style={{ borderLeftColor: bundle.color }}>
                      <div className="bundle-header">
                        <div className="bundle-icon" style={{ backgroundColor: bundle.color + '20', color: bundle.color }}>
                          📁
                        </div>
                        <div className="bundle-info">
                          <h3>{bundle.name}</h3>
                          <p>{bundle.description}</p>
                        </div>
                      </div>
                      
                      <div className="bundle-stats">
                        <div className="stat">
                          <span className="stat-label">Links</span>
                          <span className="stat-value">{bundle.links.length}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Clicks</span>
                          <span className="stat-value">
                            {bundle.links.reduce((sum, link) => sum + (link.clickCount || 0), 0)}
                          </span>
                        </div>
                      </div>

                      <div className="bundle-actions">
                        <button onClick={() => setSelectedBundle(bundle)} className="btn-secondary btn-sm">
                          Manage Links
                        </button>
                        <button onClick={() => handleExport(bundle._id, 'json')} className="btn-secondary btn-sm">
                          Export
                        </button>
                        <button onClick={() => handleDelete(bundle._id)} className="btn-danger btn-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create Bundle Modal */}
              {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>Create Bundle</h2>
                      <button onClick={() => setShowCreateModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                      <div className="form-section">
                        <label>Bundle Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="My Campaign"
                        />
                      </div>
                      <div className="form-section">
                        <label>Slug *</label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                          placeholder="my-campaign"
                        />
                      </div>
                      <div className="form-section">
                        <label>Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe this bundle..."
                          rows="3"
                        />
                      </div>
                      <div className="form-section">
                        <label>Color</label>
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                        Cancel
                      </button>
                      <button onClick={handleCreate} className="btn-primary">
                        Create Bundle
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Manage Links Modal */}
              {selectedBundle && (
                <div className="modal-overlay" onClick={() => setSelectedBundle(null)}>
                  <div className="modal large" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>Manage Links - {selectedBundle.name}</h2>
                      <button onClick={() => setSelectedBundle(null)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                      <h3>Available Links</h3>
                      <div className="links-list">
                        {userLinks.filter(link => !selectedBundle.links.some(l => l._id === link._id)).map((link) => (
                          <div key={link._id} className="link-item-row">
                            <div>
                              <div className="link-title">{link.title}</div>
                              <div className="link-url">{link.shortCode}</div>
                            </div>
                            <button
                              onClick={() => handleAddLink(selectedBundle._id, link._id)}
                              className="btn-primary btn-sm"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LinkBundles;
