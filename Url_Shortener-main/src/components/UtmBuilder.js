import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import { urlsAPI } from "../services/api";
import "./Analytics.css";
import "./DashboardLayout.css";

const UTMBuilder = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Form state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // Generated URL state
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const generateUtmUrl = () => {
    if (!websiteUrl) {
      alert('Please enter a website URL');
      return;
    }

    if (!utmSource || !utmMedium || !utmCampaign) {
      alert('Please fill in at least Source, Medium, and Campaign fields');
      return;
    }

    try {
      const url = new URL(websiteUrl);
      const params = new URLSearchParams();

      if (utmSource) params.append('utm_source', utmSource);
      if (utmMedium) params.append('utm_medium', utmMedium);
      if (utmCampaign) params.append('utm_campaign', utmCampaign);
      if (utmTerm) params.append('utm_term', utmTerm);
      if (utmContent) params.append('utm_content', utmContent);

      const finalUrl = `${url.origin}${url.pathname}${url.search ? url.search + '&' : '?'}${params.toString()}`;
      setGeneratedUrl(finalUrl);
    } catch (err) {
      alert('Invalid URL format. Please enter a valid URL (e.g., https://example.com)');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy URL');
    }
  };

  const createShortLink = async () => {
    if (!generatedUrl) {
      alert('Please generate a UTM URL first');
      return;
    }

    try {
      setCreating(true);
      const response = await urlsAPI.createUrl({
        originalUrl: generatedUrl,
        title: `UTM: ${utmCampaign}`,
      });

      if (response.success) {
        alert('Short link created successfully!');
        navigate('/my-links');
      }
    } catch (err) {
      console.error('Error creating short link:', err);
      alert(err.message || 'Failed to create short link');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setWebsiteUrl('');
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmTerm('');
    setUtmContent('');
    setGeneratedUrl('');
    setCopied(false);
  };

  // Common UTM presets
  const commonPresets = {
    facebook: { source: 'facebook', medium: 'social' },
    twitter: { source: 'twitter', medium: 'social' },
    instagram: { source: 'instagram', medium: 'social' },
    linkedin: { source: 'linkedin', medium: 'social' },
    email: { source: 'newsletter', medium: 'email' },
    googleAds: { source: 'google', medium: 'cpc' },
  };

  const applyPreset = (preset) => {
    setUtmSource(preset.source);
    setUtmMedium(preset.medium);
  };

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            {/* Page Header */}
            <div className="page-header" style={{
              marginBottom: '24px'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '4px',
                margin: '0 0 4px 0'
              }}>UTM Builder</h1>
              <p style={{
                color: '#6B7280',
                fontSize: '14px',
                margin: 0
              }}>Create trackable URLs with UTM parameters for your marketing campaigns</p>
            </div>

            {/* Info Box */}
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px'
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9V9h2v6zm0-8H9V5h2v2z" fill="#3B82F6"/>
              </svg>
              <div>
                <strong style={{ color: '#1E40AF', display: 'block', marginBottom: '4px' }}>What are UTM parameters?</strong>
                <p style={{ color: '#1E3A8A', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                  UTM parameters are tags added to URLs to track the effectiveness of marketing campaigns.
                  They help you identify which channels bring the most traffic and conversions.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px',
                margin: '0 0 12px 0'
              }}>Quick Presets</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                {Object.entries(commonPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(preset)}
                    style={{
                      padding: '12px 16px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.background = '#EFF6FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.background = '#F9FAFB';
                    }}
                  >
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* UTM Builder Form */}
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '20px',
                margin: '0 0 20px 0'
              }}>Build Your UTM URL</h3>

              {/* Website URL */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Website URL *
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>The full website URL (e.g., https://www.example.com)</p>
              </div>

              {/* UTM Source */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Campaign Source (utm_source) *
                </label>
                <input
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="google, facebook, newsletter"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>Identify the advertiser, site, publication, etc. sending traffic</p>
              </div>

              {/* UTM Medium */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Campaign Medium (utm_medium) *
                </label>
                <input
                  type="text"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  placeholder="cpc, email, social, banner"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>Advertising or marketing medium (e.g., cpc, banner, email)</p>
              </div>

              {/* UTM Campaign */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Campaign Name (utm_campaign) *
                </label>
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="summer_sale, product_launch"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>Product, promo code, or slogan (e.g., spring_sale)</p>
              </div>

              {/* UTM Term */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Campaign Term (utm_term)
                </label>
                <input
                  type="text"
                  value={utmTerm}
                  onChange={(e) => setUtmTerm(e.target.value)}
                  placeholder="running+shoes"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>Identify paid search keywords (optional)</p>
              </div>

              {/* UTM Content */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Campaign Content (utm_content)
                </label>
                <input
                  type="text"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="logolink, textlink"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>Differentiate ads or links that point to the same URL (optional)</p>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={generateUtmUrl}
                  style={{
                    padding: '12px 24px',
                    background: '#3B82F6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
                >
                  Generate UTM URL
                </button>
                <button
                  onClick={resetForm}
                  style={{
                    padding: '12px 24px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Generated URL Result */}
            {generatedUrl && (
              <div style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px',
                  margin: '0 0 16px 0'
                }}>Generated UTM URL</h3>

                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  wordBreak: 'break-all'
                }}>
                  <code style={{
                    fontSize: '14px',
                    color: '#1F2937',
                    lineHeight: '1.6'
                  }}>{generatedUrl}</code>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={copyToClipboard}
                    style={{
                      padding: '10px 20px',
                      background: copied ? '#10B981' : '#3B82F6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy URL
                      </>
                    )}
                  </button>

                  <button
                    onClick={createShortLink}
                    disabled={creating}
                    style={{
                      padding: '10px 20px',
                      background: creating ? '#9CA3AF' : '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: creating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: creating ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    {creating ? 'Creating...' : 'Create Short Link'}
                  </button>
                </div>
              </div>
            )}

            {/* UTM Parameter Reference */}
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>UTM Parameters Reference</h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                {[
                  {
                    name: 'utm_source',
                    desc: 'Identifies which site sent the traffic',
                    examples: 'google, facebook, newsletter'
                  },
                  {
                    name: 'utm_medium',
                    desc: 'Identifies what type of link was used',
                    examples: 'cpc, email, social'
                  },
                  {
                    name: 'utm_campaign',
                    desc: 'Identifies a specific campaign',
                    examples: 'summer_sale, product_launch'
                  },
                  {
                    name: 'utm_term',
                    desc: 'Identifies search terms (for paid ads)',
                    examples: 'running+shoes, blue+sneakers'
                  },
                  {
                    name: 'utm_content',
                    desc: 'Identifies what specifically was clicked',
                    examples: 'logolink, textlink, button'
                  }
                ].map((param, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#3B82F6',
                      marginBottom: '8px',
                      margin: '0 0 8px 0',
                      fontFamily: 'monospace'
                    }}>{param.name}</h4>
                    <p style={{
                      fontSize: '13px',
                      color: '#374151',
                      marginBottom: '8px',
                      margin: '0 0 8px 0'
                    }}>{param.desc}</p>
                    <p style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      margin: 0
                    }}>
                      <strong>Examples:</strong> {param.examples}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UTMBuilder;
