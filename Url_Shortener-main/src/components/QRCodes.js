import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import api from "../services/api";
import "./Analytics.css";
import "./QRCodes.css";

const QRCodes = () => {
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

  // Stats
  const [stats, setStats] = useState({
    totalQRCodes: 0,
    totalScans: 0,
    activeQRCodes: 0,
    downloadsToday: 0
  });

  useEffect(() => {
    loadLinks();
    loadStats();
  }, []);

  useEffect(() => {
    filterLinks();
  }, [searchQuery, links]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const response = await api.get("/urls");
      if (response && Array.isArray(response)) {
        setLinks(response);
        setFilteredLinks(response);
      }
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get("/qr-codes/stats");
      if (response) {
        setStats({
          totalQRCodes: response.totalQRCodes || 0,
          totalScans: response.totalScans || 0,
          activeQRCodes: response.activeQRCodes || 0,
          downloadsToday: response.downloadsToday || 0
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
      const response = await api.post(`/qr-codes/generate/${linkId}`, qrOptions);
      if (response) {
        alert("QR Code generated successfully!");
        loadLinks();
        loadStats();
        setShowGenerateModal(false);
        setShowCustomizeModal(false);
      }
    } catch (error) {
      alert("Failed to generate QR code: " + error.message);
    }
  };

  const downloadQRCode = async (linkId, format = 'png') => {
    try {
      const response = await api.get(`/qr-codes/download/${linkId}?format=${format}`);
      if (response && response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      } else {
        // Fallback: generate download URL
        const link = document.createElement('a');
        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getShortUrl(linkId))}`;
        link.download = `qrcode-${linkId}.${format}`;
        link.click();
      }
    } catch (error) {
      alert("Failed to download QR code: " + error.message);
    }
  };

  const bulkGenerateQRCodes = async () => {
    if (selectedLinks.length === 0) {
      alert("Please select at least one link");
      return;
    }

    if (!window.confirm(`Generate QR codes for ${selectedLinks.length} link(s)?`)) {
      return;
    }

    try {
      await api.post("/qr-codes/bulk-generate", {
        linkIds: selectedLinks,
        options: qrOptions
      });
      alert(`Successfully generated ${selectedLinks.length} QR code(s)!`);
      setSelectedLinks([]);
      setSelectAll(false);
      loadLinks();
      loadStats();
    } catch (error) {
      alert("Failed to generate QR codes: " + error.message);
    }
  };

  const deleteQRCode = async (linkId) => {
    if (!window.confirm("Are you sure you want to delete this QR code?")) {
      return;
    }

    try {
      await api.delete(`/qr-codes/${linkId}`);
      alert("QR code deleted successfully!");
      loadLinks();
      loadStats();
    } catch (error) {
      alert("Failed to delete QR code: " + error.message);
    }
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
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content" style={{
            padding: '24px',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
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
                }}>QR Code Management</h1>
                <p style={{
                  color: '#6B7280',
                  fontSize: '14px',
                  margin: 0
                }}>Generate, customize, and manage QR codes for your links</p>
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
                <span style={{ fontSize: '18px' }}>+</span> Generate QR Code
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
                  }}>Total QR Codes</div>
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
                  }}>Total Scans</div>
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
                  }}>Active QR Codes</div>
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
                  }}>Downloads Today</div>
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
                      placeholder="Search by short code, URL, or title..."
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
                      Bulk Generate ({selectedLinks.length})
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
                      Customize Settings
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
                  }}>Your QR Codes ({filteredLinks.length})</h2>
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
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading QR codes...</p>
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
                    }}>No QR Codes Yet</h3>
                    <p style={{
                      color: '#6B7280',
                      fontSize: '14px',
                      marginBottom: '20px'
                    }}>Generate your first QR code to get started</p>
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
                      Generate QR Code
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
                            {link.title || 'Untitled Link'}
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
                            }}>Scans</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{
                          display: 'flex',
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
                              cursor: 'pointer'
                            }}
                            title="Download PNG"
                          >
                            Download
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
                              cursor: 'pointer'
                            }}
                          >
                            Customize
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQRCode(link._id || link.id);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              border: '1px solid #FEE2E2',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
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
                  }}>Select Link for QR Code</h2>

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
                        }}>{link.title || 'Untitled Link'}</div>
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
                    Cancel
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
                  }}>Customize QR Code</h2>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>Size (pixels)</label>
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
                    }}>Format</label>
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
                      <option value="png">PNG</option>
                      <option value="svg">SVG</option>
                      <option value="pdf">PDF</option>
                      <option value="jpg">JPG</option>
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
                      }}>Foreground Color</label>
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
                      }}>Background Color</label>
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
                    }}>Error Correction Level</label>
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
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
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
                    }}>Include margin around QR code</span>
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
                      Cancel
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
                      {selectedLink ? 'Generate' : 'Save Settings'}
                    </button>
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
