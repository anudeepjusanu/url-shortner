import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import Toast from './Toast';
import { bioPagesAPI } from '../services/api';
import './BioPage.css';

const BioPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bioPage, setBioPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // editor, preview, analytics
  
  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    bio: '',
    profileImage: '',
    coverImage: '',
    theme: {
      layout: 'modern',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#3B82F6',
      buttonTextColor: '#ffffff',
      buttonStyle: 'fill',
      fontFamily: 'inter',
      borderRadius: 8
    },
    links: [],
    socialLinks: {
      twitter: '',
      instagram: '',
      facebook: '',
      linkedin: '',
      youtube: '',
      tiktok: '',
      github: '',
      website: ''
    },
    settings: {
      isPublished: true,
      showBranding: true,
      collectEmails: false
    }
  });

  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchBioPage();
  }, []);

  const fetchBioPage = async () => {
    try {
      setLoading(true);
      const response = await bioPagesAPI.getMyBioPage();
      if (response.success && response.data.bioPage) {
        setBioPage(response.data.bioPage);
        setFormData(response.data.bioPage);
      }
    } catch (error) {
      // Bio page doesn't exist yet - that's okay
      console.log('No bio page found, ready to create one');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await bioPagesAPI.getAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.slug || formData.slug.trim().length < 3) {
        setToast({ type: 'error', message: t('bioPage.errors.usernameRequired') });
        return;
      }
      
      if (!formData.title || formData.title.trim().length === 0) {
        setToast({ type: 'error', message: t('bioPage.errors.titleRequired') });
        return;
      }
      
      // Validate slug format (lowercase letters, numbers, hyphens, underscores)
      const slugRegex = /^[a-z0-9_-]+$/;
      if (!slugRegex.test(formData.slug)) {
        setToast({ type: 'error', message: t('bioPage.errors.usernameInvalid') });
        return;
      }
      
      setSaving(true);
      
      if (bioPage) {
        // Update existing
        const response = await bioPagesAPI.update(formData);
        if (response.success) {
          setBioPage(response.data.bioPage);
          setToast({ type: 'success', message: t('bioPage.success.updated') });
        }
      } else {
        // Create new
        const response = await bioPagesAPI.create(formData);
        if (response.success) {
          setBioPage(response.data.bioPage);
          setToast({ type: 'success', message: t('bioPage.success.created') });
        }
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = () => {
    setFormData({
      ...formData,
      links: [
        ...formData.links,
        {
          title: '',
          url: '',
          icon: 'link',
          enabled: true,
          order: formData.links.length
        }
      ]
    });
  };

  const handleUpdateLink = (index, field, value) => {
    const newLinks = [...formData.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, links: newLinks });
  };

  const handleRemoveLink = (index) => {
    const newLinks = formData.links.filter((_, i) => i !== index);
    setFormData({ ...formData, links: newLinks });
  };

  const handleMoveLink = (index, direction) => {
    const newLinks = [...formData.links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newLinks.length) {
      [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
      setFormData({ ...formData, links: newLinks });
    }
  };

  const getPublicUrl = () => {
    if (!bioPage) return '';
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/@${bioPage.slug}`;
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              <div className="loading-state">
                <div className="spinner"></div>
                <p>{t('common.loading')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              {/* Header */}
              <div className="page-header">
                <div>
                  <h1>{t('bioPage.title')}</h1>
                  <p>{t('bioPage.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {bioPage && (
                    <button
                      onClick={() => window.open(getPublicUrl(), '_blank')}
                      className="btn-secondary"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M12 8.667V12.667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 2H14V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.66667 9.33333L14 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {t('bioPage.preview')}
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? t('common.saving') : bioPage ? t('common.update') : t('bioPage.createNew')}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={activeTab === 'editor' ? 'tab active' : 'tab'}
                  onClick={() => setActiveTab('editor')}
                >
                  {t('bioPage.edit')}
                </button>
                <button
                  className={activeTab === 'theme' ? 'tab active' : 'tab'}
                  onClick={() => setActiveTab('theme')}
                >
                  {t('bioPage.theme.title')}
                </button>
                {bioPage && (
                  <>
                    <button
                      className={activeTab === 'preview' ? 'tab active' : 'tab'}
                      onClick={() => setActiveTab('preview')}
                    >
                      {t('bioPage.preview')}
                    </button>
                    <button
                      className={activeTab === 'analytics' ? 'tab active' : 'tab'}
                      onClick={() => {
                        setActiveTab('analytics');
                        fetchAnalytics();
                      }}
                    >
                      {t('bioPage.analytics.title')}
                    </button>
                  </>
                )}
              </div>

              {/* Editor Tab */}
              {activeTab === 'editor' && (
                <div className="bio-editor">
                  {!bioPage && (
                    <div className="info-banner" style={{
                      padding: '16px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '8px',
                      marginBottom: '24px',
                      color: '#1E40AF'
                    }}>
                      <strong>{t('common.fieldRequired')}:</strong> {t('bioPage.form.usernameHint')}
                    </div>
                  )}
                  
                  <div className="form-section">
                    <label>{t('bioPage.form.username')} *</label>
                    <div className="input-with-prefix">
                      <span className="prefix">@</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                        placeholder={t('bioPage.form.usernamePlaceholder')}
                        disabled={!!bioPage}
                        required
                      />
                    </div>
                    {bioPage && (
                      <p className="help-text">{t('bioPage.form.usernameHint')}: {getPublicUrl()}</p>
                    )}
                    {!bioPage && (
                      <p className="help-text">{t('bioPage.form.usernameHint')}</p>
                    )}
                  </div>

                  <div className="form-section">
                    <label>{t('bioPage.form.title')} *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={t('bioPage.form.titlePlaceholder')}
                      required
                    />
                    <p className="help-text">{t('bioPage.form.titlePlaceholder')}</p>
                  </div>

                  <div className="form-section">
                    <label>{t('bioPage.form.bio')}</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder={t('bioPage.form.bioPlaceholder')}
                      rows="3"
                    />
                  </div>

                  <div className="form-section">
                    <label>{t('bioPage.form.profileImage')}</label>
                    <input
                      type="url"
                      value={formData.profileImage}
                      onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                      placeholder={t('bioPage.form.profileImagePlaceholder')}
                    />
                  </div>

                  {/* Links */}
                  <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <label style={{ margin: 0 }}>{t('bioPage.form.addLink')}</label>
                      <button onClick={handleAddLink} className="btn-secondary btn-sm">
                        + {t('bioPage.form.addLink')}
                      </button>
                    </div>

                    {formData.links.map((link, index) => (
                      <div key={index} className="link-item">
                        <div className="link-controls">
                          <button
                            onClick={() => handleMoveLink(index, 'up')}
                            disabled={index === 0}
                            className="btn-icon"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveLink(index, 'down')}
                            disabled={index === formData.links.length - 1}
                            className="btn-icon"
                          >
                            ↓
                          </button>
                        </div>
                        <div className="link-fields">
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => handleUpdateLink(index, 'title', e.target.value)}
                            placeholder={t('bioPage.form.linkTitle')}
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                            placeholder={t('bioPage.form.linkUrl')}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveLink(index)}
                          className="btn-icon btn-danger"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Social Links */}
                  <div className="form-section">
                    <label>{t('bioPage.form.socialLinks')}</label>
                    <div className="social-links-grid">
                      {Object.keys(formData.socialLinks).map((platform) => (
                        <div key={platform} className="social-input">
                          <label>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
                          <input
                            type="text"
                            value={formData.socialLinks[platform]}
                            onChange={(e) => setFormData({
                              ...formData,
                              socialLinks: { ...formData.socialLinks, [platform]: e.target.value }
                            })}
                            placeholder={`@username`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="form-section">
                    <label>{t('common.settings')}</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.settings.isPublished}
                          onChange={(e) => setFormData({
                            ...formData,
                            settings: { ...formData.settings, isPublished: e.target.checked }
                          })}
                        />
                        <span>{t('bioPage.publish')}</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.settings.collectEmails}
                          onChange={(e) => setFormData({
                            ...formData,
                            settings: { ...formData.settings, collectEmails: e.target.checked }
                          })}
                        />
                        <span>{t('bioPage.form.addSocial')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Theme Tab */}
              {activeTab === 'theme' && (
                <div className="theme-editor">
                  <div className="form-section">
                    <label>{t('bioPage.theme.buttonStyle')}</label>
                    <select
                      value={formData.theme.layout}
                      onChange={(e) => setFormData({
                        ...formData,
                        theme: { ...formData.theme, layout: e.target.value }
                      })}
                    >
                      <option value="classic">Classic</option>
                      <option value="modern">Modern</option>
                      <option value="minimal">Minimal</option>
                      <option value="card">Card</option>
                      <option value="gradient">Gradient</option>
                    </select>
                  </div>

                  <div className="color-grid">
                    <div className="form-section">
                      <label>{t('bioPage.theme.backgroundColor')}</label>
                      <input
                        type="color"
                        value={formData.theme.backgroundColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, backgroundColor: e.target.value }
                        })}
                      />
                    </div>

                    <div className="form-section">
                      <label>{t('bioPage.theme.textColor')}</label>
                      <input
                        type="color"
                        value={formData.theme.textColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, textColor: e.target.value }
                        })}
                      />
                    </div>

                    <div className="form-section">
                      <label>{t('bioPage.theme.buttonColor')}</label>
                      <input
                        type="color"
                        value={formData.theme.buttonColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, buttonColor: e.target.value }
                        })}
                      />
                    </div>

                    <div className="form-section">
                      <label>{t('bioPage.theme.buttonTextColor')}</label>
                      <input
                        type="color"
                        value={formData.theme.buttonTextColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, buttonTextColor: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <label>{t('bioPage.theme.buttonStyle')}</label>
                    <select
                      value={formData.theme.buttonStyle}
                      onChange={(e) => setFormData({
                        ...formData,
                        theme: { ...formData.theme, buttonStyle: e.target.value }
                      })}
                    >
                      <option value="fill">Fill</option>
                      <option value="outline">Outline</option>
                      <option value="shadow">Shadow</option>
                      <option value="rounded">{t('bioPage.theme.rounded')}</option>
                      <option value="square">{t('bioPage.theme.square')}</option>
                    </select>
                  </div>

                  <div className="form-section">
                    <label>{t('bioPage.theme.fontFamily')}</label>
                    <select
                      value={formData.theme.fontFamily}
                      onChange={(e) => setFormData({
                        ...formData,
                        theme: { ...formData.theme, fontFamily: e.target.value }
                      })}
                    >
                      <option value="inter">Inter</option>
                      <option value="roboto">Roboto</option>
                      <option value="poppins">Poppins</option>
                      <option value="montserrat">Montserrat</option>
                      <option value="playfair">Playfair</option>
                      <option value="lato">Lato</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && bioPage && (
                <div className="bio-preview">
                  <div className="preview-header">
                    <h2>{t('bioPage.preview')}</h2>
                    <a 
                      href={getPublicUrl()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      {t('bioPage.preview')} →
                    </a>
                  </div>

                  <div className="preview-card">
                    <div className="preview-section">
                      <h3>{t('bioPage.form.username')}</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">{t('bioPage.form.username')}:</span>
                          <span className="info-value">@{bioPage.slug}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">{t('bioPage.form.title')}:</span>
                          <span className="info-value">{bioPage.title}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">{t('bioPage.form.bio')}:</span>
                          <span className="info-value">{bioPage.bio || t('bioPage.form.bioPlaceholder')}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">{t('bioPage.form.url')}:</span>
                          <a href={getPublicUrl()} target="_blank" rel="noopener noreferrer" className="info-link">
                            {getPublicUrl()}
                          </a>
                        </div>
                        <div className="info-item">
                          <span className="info-label">{t('common.status')}:</span>
                          <span className={`status-badge ${bioPage.settings.isPublished ? 'active' : 'inactive'}`}>
                            {bioPage.settings.isPublished ? t('bioPage.publish') : t('bioPage.unpublish')}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">{t('common.created')}:</span>
                          <span className="info-value">{new Date(bioPage.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {bioPage.profileImage && (
                      <div className="preview-section">
                        <h3>{t('bioPage.form.profileImage')}</h3>
                        <img src={bioPage.profileImage} alt="Profile" className="preview-image" />
                      </div>
                    )}

                    <div className="preview-section">
                      <h3>{t('bioPage.form.addLink')} ({bioPage.links.length})</h3>
                      {bioPage.links.length === 0 ? (
                        <p className="empty-message">{t('bioPage.form.addLink')}</p>
                      ) : (
                        <div className="links-preview">
                          {bioPage.links.map((link, index) => (
                            <div key={index} className="link-preview-item">
                              <div className="link-preview-icon">{link.icon || '🔗'}</div>
                              <div className="link-preview-content">
                                <div className="link-preview-title">{link.title}</div>
                                <div className="link-preview-url">{link.url}</div>
                              </div>
                              <div className="link-preview-stats">
                                <span className={`status-badge ${link.enabled ? 'active' : 'inactive'}`}>
                                  {link.enabled ? t('common.active') : t('common.inactive')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="preview-section">
                      <h3>{t('bioPage.form.socialLinks')}</h3>
                      <div className="social-preview">
                        {Object.entries(bioPage.socialLinks).map(([platform, url]) => (
                          url && (
                            <div key={platform} className="social-preview-item">
                              <span className="social-platform">{platform.charAt(0).toUpperCase() + platform.slice(1)}:</span>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="social-url">
                                {url}
                              </a>
                            </div>
                          )
                        ))}
                        {Object.values(bioPage.socialLinks).every(url => !url) && (
                          <p className="empty-message">{t('bioPage.form.addSocial')}</p>
                        )}
                      </div>
                    </div>

                    <div className="preview-section">
                      <h3>{t('bioPage.theme.title')}</h3>
                      <div className="theme-preview">
                        <div className="theme-color-item">
                          <span>{t('bioPage.theme.backgroundColor')}:</span>
                          <div className="color-preview" style={{ backgroundColor: bioPage.theme.backgroundColor }}></div>
                          <span>{bioPage.theme.backgroundColor}</span>
                        </div>
                        <div className="theme-color-item">
                          <span>{t('bioPage.theme.textColor')}:</span>
                          <div className="color-preview" style={{ backgroundColor: bioPage.theme.textColor }}></div>
                          <span>{bioPage.theme.textColor}</span>
                        </div>
                        <div className="theme-color-item">
                          <span>{t('bioPage.theme.buttonColor')}:</span>
                          <div className="color-preview" style={{ backgroundColor: bioPage.theme.buttonColor }}></div>
                          <span>{bioPage.theme.buttonColor}</span>
                        </div>
                        <div className="theme-info-item">
                          <span>{t('bioPage.theme.buttonStyle')}:</span>
                          <span className="theme-value">{bioPage.theme.buttonStyle}</span>
                        </div>
                        <div className="theme-info-item">
                          <span>{t('bioPage.theme.fontFamily')}:</span>
                          <span className="theme-value">{bioPage.theme.fontFamily}</span>
                        </div>
                      </div>
                    </div>

                    <div className="preview-section">
                      <h3>{t('bioPage.analytics.title')}</h3>
                      <div className="quick-stats">
                        <div className="quick-stat">
                          <div className="quick-stat-value">{bioPage.analytics.totalViews}</div>
                          <div className="quick-stat-label">{t('bioPage.analytics.totalViews')}</div>
                        </div>
                        <div className="quick-stat">
                          <div className="quick-stat-value">{bioPage.analytics.totalClicks}</div>
                          <div className="quick-stat-label">{t('bioPage.analytics.totalClicks')}</div>
                        </div>
                        <div className="quick-stat">
                          <div className="quick-stat-value">{bioPage.emailSubscribers.length}</div>
                          <div className="quick-stat-label">{t('bioPage.form.addSocial')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && analytics && (
                <div className="bio-analytics">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">{t('bioPage.analytics.totalViews')}</div>
                      <div className="stat-value">{analytics.analytics.totalViews}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">{t('bioPage.analytics.totalClicks')}</div>
                      <div className="stat-value">{analytics.analytics.totalClicks}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">{t('bioPage.form.addLink')}</div>
                      <div className="stat-value">{analytics.totalLinks}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">{t('bioPage.form.addSocial')}</div>
                      <div className="stat-value">{analytics.emailSubscribers}</div>
                    </div>
                  </div>

                  <div className="link-performance">
                    <h3>{t('bioPage.analytics.clicksByLink')}</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>{t('bioPage.form.linkTitle')}</th>
                          <th>{t('bioPage.form.url')}</th>
                          <th>{t('bioPage.analytics.totalClicks')}</th>
                          <th>{t('common.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.linkPerformance.map((link) => (
                          <tr key={link.id}>
                            <td>{link.title}</td>
                            <td className="url-cell">{link.url}</td>
                            <td>{link.clicks}</td>
                            <td>
                              <span className={`status-badge ${link.enabled ? 'active' : 'inactive'}`}>
                                {link.enabled ? t('common.active') : t('common.inactive')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default BioPage;
