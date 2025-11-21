import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import Toast from "./Toast";
import { qrCodeAPI, urlsAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import "./Analytics.css";
import "./DashboardLayout.css";
import "./QRCodes.css";
import "./DashboardLayout.css";

const QRCodes = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLink, setSelectedLink] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // QR Code customization options
  const [qrOptions, setQrOptions] = useState({
    size: 300,
    format: 'png',
    errorCorrection: 'M',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    includeMargin: true,
    logo: null
  });

  // Bulk selection
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, linkId: null, linkUrl: '' });

  // Stats
  const [stats, setStats] = useState({
    totalQRCodes: 0,
    totalScans: 0,
    activeQRCodes: 0,
    downloadsToday: 0
  });

  // Toast notification state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadLinks();
    loadStats();
  }, []);

  useEffect(() => {
    filterLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, links]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const response = await urlsAPI.getUrls();
      if (response && response.success && response.data) {
        const urls = response.data.urls || [];
        setLinks(urls);
        setFilteredLinks(urls);
      }
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await qrCodeAPI.getStats();
      if (response && response.success && response.data) {
        setStats({
          totalQRCodes: response.data.totalQRCodes || 0,
          totalScans: response.data.totalScans || 0,
          activeQRCodes: response.data.activeQRCodes || 0,
          downloadsToday: response.data.downloadsToday || 0
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const filterLinks = () => {
    if (!searchQuery.trim()) {
      setFilteredLinks(links);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = links.filter(link =>
      link.shortCode?.toLowerCase().includes(query) ||
      link.originalUrl?.toLowerCase().includes(query) ||
      link.title?.toLowerCase().includes(query)
    );
    setFilteredLinks(filtered);
  };

  const generateQRCode = async (linkId) => {
    try {
      const response = await qrCodeAPI.generate(linkId, qrOptions);
      if (response && response.success) {
        setShowGenerateModal(false);
        setShowCustomizeModal(false);
        setSelectedLink(null);
        loadLinks();
        loadStats();

        // Show success toast
        setToast({
          type: 'success',
          message: t('qrCodes.generateSuccess') || 'QR Code generated successfully!'
        });
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      const errorMsg = error.message || t('qrCodes.generateFailed') || 'Failed to generate QR code';

      // Show error toast
      setToast({
        type: 'error',
        message: errorMsg
      });
    }
  };

  const downloadQRCode = async (linkId, format = 'png') => {
    try {
      // Create a temporary form to trigger download
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'https://laghhu.link/api'}/qr-codes/download/${linkId}?format=${format}`;
      const token = localStorage.getItem('accessToken');

      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `qrcode-${linkId}.${format}`);

      // Add auth header via fetch and create blob
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Reload to update download stats
        loadLinks();
        loadStats();

        // Show success toast
        setToast({
          type: 'success',
          message: t('qrCodes.downloadSuccess') || 'QR Code downloaded successfully!'
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error("Error downloading QR code:", error);
      const errorMsg = error.message || t('qrCodes.downloadFailed') || 'Failed to download QR code';

      // Show error toast
      setToast({
        type: 'error',
        message: errorMsg
      });
    }
  };

  const bulkGenerateQRCodes = async () => {
    if (selectedLinks.length === 0) {
      alert(t('errors.generic'));
      return;
    }

    if (!window.confirm(t('notifications.success'))) {
      return;
    }

    try {
      const response = await qrCodeAPI.bulkGenerate(selectedLinks, qrOptions);
      if (response && response.success) {
        setSelectedLinks([]);
        setSelectAll(false);
        loadLinks();
        loadStats();

        // Show success toast
        setToast({
          type: 'success',
          message: t('qrCodes.bulkGenerateSuccess', { count: response.data.count }) || `Successfully generated ${response.data.count} QR code(s)!`
        });
      }
    } catch (error) {
      console.error("Error bulk generating QR codes:", error);
      const errorMsg = error.message || t('qrCodes.bulkGenerateFailed') || 'Failed to generate QR codes';

      // Show error toast
      setToast({
        type: 'error',
        message: errorMsg
      });
    }
  };

  const handleDeleteClick = (link) => {
    const linkId = link._id || link.id;
    const shortUrl = getShortUrl(link);

    setDeleteDialog({
      isOpen: true,
      linkId: linkId,
      linkUrl: shortUrl
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await urlsAPI.deleteUrl(deleteDialog.linkId);
      loadLinks();
      loadStats();
      setDeleteDialog({ isOpen: false, linkId: null, linkUrl: '' });
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete: " + error.message);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ isOpen: false, linkId: null, linkUrl: '' });
  };

  const getShortUrl = (link) => {
    if (typeof link === 'string') {
      const foundLink = links.find(l => l._id === link || l.id === link);
      return foundLink ? `${foundLink.domain || 'laghhu.link'}/${foundLink.shortCode}` : '';
    }
    return `${link.domain || 'laghhu.link'}/${link.shortCode}`;
  };

  const handleSelectLink = (linkId) => {
    if (selectedLinks.includes(linkId)) {
      setSelectedLinks(selectedLinks.filter(id => id !== linkId));
    } else {
      setSelectedLinks([...selectedLinks, linkId]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLinks([]);
    } else {
      setSelectedLinks(filteredLinks.map(link => link._id || link.id));
    }
    setSelectAll(!selectAll);
  };

  return (
    <div className="analytics-container">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            {/* Page Header */}
            <div className="page-header" style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '4px',
                  margin: '0 0 4px 0'
                }}>{t('qrCodes.title')}</h1>
                <p style={{
                  color: '#6B7280',
                  fontSize: '14px',
                  margin: 0
                }}>{t('qrCodes.subtitle')}</p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  background: '#3B82F6',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>+</span> {t('qrCodes.generate.title')}
              </button>
            </div>

            {/* Stats Cards */}
            <section style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#3B82F6',
                    marginBottom: '8px'
                  }}>{stats.totalQRCodes}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('qrCodes.stats.totalQRCodes')}</div>
                </div>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#10B981',
                    marginBottom: '8px'
                  }}>{stats.totalScans.toLocaleString()}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('qrCodes.stats.totalScans')}</div>
                </div>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#7C3AED',
                    marginBottom: '8px'
                  }}>{stats.activeQRCodes}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('qrCodes.stats.activeQRCodes')}</div>
                </div>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#F59E0B',
                    marginBottom: '8px'
                  }}>{stats.downloadsToday}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('qrCodes.stats.downloadsToday')}</div>
                </div>
              </div>
            </section>

            {/* Search and Bulk Actions */}
            <section style={{ marginBottom: '24px' }}>
              <div style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px 24px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <input
                      type="text"
                      placeholder={t('myLinks.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={bulkGenerateQRCodes}
                      disabled={selectedLinks.length === 0}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid #E5E7EB',
                        background: selectedLinks.length === 0 ? '#F9FAFB' : '#fff',
                        color: selectedLinks.length === 0 ? '#9CA3AF' : '#374151',
                        cursor: selectedLinks.length === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {t('qrCodes.generate.bulkGenerate')} ({selectedLinks.length})
                    </button>
                    <button
                      onClick={() => setShowCustomizeModal(true)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid #E5E7EB',
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {t('qrCodes.generate.customize')}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* QR Codes List */}
            <section>
              <div style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>{t('qrCodes.title')} ({filteredLinks.length})</h2>
                </div>

                {loading ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center'
                  }}>
                    <div className="spinner" style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #E5E7EB',
                      borderTop: '4px solid #3B82F6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>{t('common.loading')}</p>
                  </div>
                ) : filteredLinks.length === 0 ? (
                  <div style={{
                    padding: '60px 20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '16px'
                    }}>📱</div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '8px'
                    }}>{t('qrCodes.noQRCodes')}</h3>
                    <p style={{
                      color: '#6B7280',
                      fontSize: '14px',
                      marginBottom: '20px'
                    }}>{t('qrCodes.createFirst')}</p>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        background: '#3B82F6',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {t('qrCodes.generate.title')}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '0' }}>
                    {filteredLinks.map((link, index) => (
                      <div
                        key={link._id || link.id || index}
                        style={{
                          padding: '20px 24px',
                          borderBottom: index < filteredLinks.length - 1 ? '1px solid #E5E7EB' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px',
                          transition: 'background 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLinks.includes(link._id || link.id)}
                          onChange={() => handleSelectLink(link._id || link.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer'
                          }}
                        />

                        {/* QR Code Preview */}
                        <div style={{
                          width: '80px',
                          height: '80px',
                          background: '#F3F4F6',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(getShortUrl(link))}`}
                            alt="QR Code"
                            style={{
                              width: '70px',
                              height: '70px'
                            }}
                          />
                        </div>

                        {/* Link Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {link.title || t('myLinks.table.title')}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#3B82F6',
                            marginBottom: '4px'
                          }}>
                            {getShortUrl(link)}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {link.originalUrl}
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{
                          display: 'flex',
                          gap: '24px',
                          flexShrink: 0
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: '#111827'
                            }}>{link.clickCount || 0}</div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6B7280'
                            }}>{t('qrCodes.stats.totalScans')}</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{
                          display: 'flex',
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          gap: '8px',
                          flexShrink: 0
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadQRCode(link._id || link.id, 'png');
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              border: '1px solid #E5E7EB',
                              background: '#fff',
                              color: '#374151',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexDirection: isRTL ? 'row-reverse' : 'row'
                            }}
                            title={t('qrCodes.actions.download')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            {t('qrCodes.actions.download')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLink(link);
                              setShowCustomizeModal(true);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              border: '1px solid #E5E7EB',
                              background: '#fff',
                              color: '#374151',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexDirection: isRTL ? 'row-reverse' : 'row'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            {t('qrCodes.actions.customize')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(link);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              border: '1px solid #FEE2E2',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexDirection: isRTL ? 'row-reverse' : 'row'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            {t('qrCodes.actions.delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Generate Modal */}
            {showGenerateModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '28px',
                  maxWidth: '500px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflow: 'auto'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '16px'
                  }}>{t('qrCodes.generate.selectLink')}</h2>

                  <div style={{
                    maxHeight: '400px',
                    overflow: 'auto',
                    marginBottom: '20px'
                  }}>
                    {links.map((link) => (
                      <div
                        key={link._id || link.id}
                        onClick={() => {
                          generateQRCode(link._id || link.id);
                        }}
                        style={{
                          padding: '12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F9FAFB';
                          e.currentTarget.style.borderColor = '#3B82F6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = '#E5E7EB';
                        }}
                      >
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: '4px'
                        }}>{link.title || t('myLinks.table.title')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#3B82F6'
                        }}>{getShortUrl(link)}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowGenerateModal(false)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* Customize Modal */}
            {showCustomizeModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '28px',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflow: 'auto'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '20px'
                  }}>{t('qrCodes.generate.customize')}</h2>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>{t('qrCodes.generate.size')}</label>
                    <input
                      type="number"
                      value={qrOptions.size}
                      onChange={(e) => setQrOptions({...qrOptions, size: parseInt(e.target.value)})}
                      min="100"
                      max="2000"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>{t('qrCodes.generate.format')}</label>
                    <select
                      value={qrOptions.format}
                      onChange={(e) => setQrOptions({...qrOptions, format: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="png">{t('qrCodes.formats.png')}</option>
                      <option value="svg">{t('qrCodes.formats.svg')}</option>
                      <option value="pdf">{t('qrCodes.formats.pdf')}</option>
                      <option value="jpg">{t('qrCodes.formats.jpg')}</option>
                    </select>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('qrCodes.generate.foregroundColor')}</label>
                      <input
                        type="color"
                        value={qrOptions.foregroundColor}
                        onChange={(e) => setQrOptions({...qrOptions, foregroundColor: e.target.value})}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '4px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('qrCodes.generate.backgroundColor')}</label>
                      <input
                        type="color"
                        value={qrOptions.backgroundColor}
                        onChange={(e) => setQrOptions({...qrOptions, backgroundColor: e.target.value})}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '4px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>{t('qrCodes.generate.errorCorrection')}</label>
                    <select
                      value={qrOptions.errorCorrection}
                      onChange={(e) => setQrOptions({...qrOptions, errorCorrection: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="L">{t('qrCodes.errorLevels.low')}</option>
                      <option value="M">{t('qrCodes.errorLevels.medium')}</option>
                      <option value="Q">{t('qrCodes.errorLevels.quartile')}</option>
                      <option value="H">{t('qrCodes.errorLevels.high')}</option>
                    </select>
                  </div>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '20px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={qrOptions.includeMargin}
                      onChange={(e) => setQrOptions({...qrOptions, includeMargin: e.target.checked})}
                      style={{
                        width: '18px',
                        height: '18px',
                        marginRight: '12px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      fontSize: '14px',
                      color: '#374151'
                    }}>{t('qrCodes.generate.includeMargin')}</span>
                  </label>

                  <div style={{
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => {
                        setShowCustomizeModal(false);
                        setSelectedLink(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid #E5E7EB',
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={() => {
                        if (selectedLink) {
                          generateQRCode(selectedLink._id || selectedLink.id);
                        } else {
                          setShowCustomizeModal(false);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        background: '#3B82F6',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedLink ? t('qrCodes.generate.generateButton') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteDialog.isOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999
                }}
                onClick={handleCancelDelete}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '32px',
                    maxWidth: '450px',
                    width: '90%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>

                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '12px',
                      margin: '0 0 12px 0'
                    }}>
                      {t('common.deleteQRTitle') || 'Delete QR Code?'}
                    </h2>

                    <p style={{
                      fontSize: '14px',
                      color: '#6B7280',
                      marginBottom: '8px',
                      margin: '0 0 8px 0'
                    }}>
                      {t('common.deleteQRMessage') || 'Are you sure you want to delete this QR code and link?'}
                    </p>

                    <p style={{
                      fontSize: '13px',
                      color: '#3B82F6',
                      marginBottom: '24px',
                      margin: '0 0 24px 0',
                      wordBreak: 'break-all'
                    }}>
                      {deleteDialog.linkUrl}
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      width: '100%'
                    }}>
                      <button
                        onClick={handleCancelDelete}
                        style={{
                          flex: 1,
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#ffffff',
                          color: '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                      >
                        {t('common.cancel') || 'Cancel'}
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        style={{
                          flex: 1,
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          backgroundColor: '#DC2626',
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#B91C1C'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#DC2626'}
                      >
                        {t('common.delete') || 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodes;

