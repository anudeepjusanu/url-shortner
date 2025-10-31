import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [longUrl, setLongUrl] = useState('');
  const [customBackhalf, setCustomBackhalf] = useState('');
  const [campaign, setCampaign] = useState('');
  const [analyticsFilter, setAnalyticsFilter] = useState('All Links');
  const [timeFilter, setTimeFilter] = useState('Last 7 days');

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleShortenUrl = (e) => {
    e.preventDefault();
    console.log('Shortening URL:', { longUrl, customBackhalf, campaign });
    // Handle URL shortening logic here
  };

  const handleAdvancedSettings = () => {
    console.log('Opening advanced settings');
    // Handle advanced settings modal/dropdown
  };

  return (
    <div className="dashboard-container">
      {/* Reusable Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Dashboard</h1>
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
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="welcome-content">
              <h2>Welcome back, Ahmed!</h2>
              <p>Ready to create and track your links today?</p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="action-cards">
            <div className="action-card blue-card">
              <div className="card-header">
                <div className="card-icon blue-icon">
                  <svg width="17.5" height="20" viewBox="0 0 17.5 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10L10 2l8 8M10 2v16" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Create Short Link</h3>
              </div>
              <p>Transform your long URLs into short, trackable links</p>
              <button className="card-btn blue-btn">Get Started</button>
            </div>

            <div className="action-card green-card">
              <div className="card-header">
                <div className="card-icon green-icon">
                  <svg width="17.5" height="20" viewBox="0 0 17.5 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="2"/>
                    <rect x="10.5" y="1" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="2"/>
                    <rect x="1" y="12" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="2"/>
                    <rect x="10.5" y="12" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Generate QR Code</h3>
              </div>
              <p>Create QR codes for offline marketing campaigns</p>
              <button className="card-btn green-btn">Create QR</button>
            </div>

            <div className="action-card purple-card">
              <div className="card-header">
                <div className="card-icon purple-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="8" stroke="#7C3AED" strokeWidth="2"/>
                    <path d="M2 10h16M10 2c2 0 4 3.5 4 8s-2 8-4 8-4-3.5-4-8 2-8 4-8z" stroke="#7C3AED" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Add Custom Domain</h3>
              </div>
              <p>Use your own .sa domain for branded links</p>
              <button className="card-btn purple-btn">Setup Domain</button>
            </div>
          </div>

          {/* URL Shortener Section */}
          <div className="url-shortener-section">
            <h2>Shorten Your URL</h2>
            <form className="shortener-form" onSubmit={handleShortenUrl}>
              <div className="form-group full-width">
                <label htmlFor="longUrl">Long URL</label>
                <input 
                  type="url" 
                  id="longUrl" 
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  placeholder="https://example.com/very-long-url-that-needs-shortening"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customBackhalf">Custom Back-half (Optional)</label>
                  <div className="custom-url-input">
                    <span className="url-prefix">linksa.co/</span>
                    <input 
                      type="text" 
                      id="customBackhalf" 
                      value={customBackhalf}
                      onChange={(e) => setCustomBackhalf(e.target.value)}
                      placeholder="my-campaign"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="campaign">Campaign (Optional)</label>
                  <input 
                    type="text" 
                    id="campaign" 
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    placeholder="summer-sale-2024"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="advanced-settings-btn" onClick={handleAdvancedSettings}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="2" r="1" fill="#3B82F6"/>
                    <circle cx="8" cy="8" r="1" fill="#3B82F6"/>
                    <circle cx="8" cy="14" r="1" fill="#3B82F6"/>
                  </svg>
                  Advanced Settings
                </button>
                <button type="submit" className="shorten-btn">Shorten URL</button>
              </div>
            </form>
          </div>

          {/* Analytics & Stats Section */}
          <div className="analytics-stats-section">
            {/* Analytics Overview */}
            <div className="analytics-overview">
              {/* <div className="analytics-header">
                <h2>Analytics Overview</h2>
                <div className="analytics-filters">
                  <select 
                    value={analyticsFilter} 
                    onChange={(e) => setAnalyticsFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All Links">All Links</option>
                    <option value="Active Links">Active Links</option>
                    <option value="Expired Links">Expired Links</option>
                  </select>
                  <select 
                    value={timeFilter} 
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                    <option value="Last 90 days">Last 90 days</option>
                  </select>
                </div>
              </div> */}
              <div className="chart-container">
                <svg width="100%" height="240" viewBox="0 0 600 240" className="analytics-chart">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1"/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Chart line */}
                  <polyline
                    points="50,180 120,160 190,140 260,120 330,100 400,85 470,70 540,60"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Data points */}
                  <circle cx="50" cy="180" r="4" fill="#3B82F6"/>
                  <circle cx="120" cy="160" r="4" fill="#3B82F6"/>
                  <circle cx="190" cy="140" r="4" fill="#3B82F6"/>
                  <circle cx="260" cy="120" r="4" fill="#3B82F6"/>
                  <circle cx="330" cy="100" r="4" fill="#3B82F6"/>
                  <circle cx="400" cy="85" r="4" fill="#3B82F6"/>
                  <circle cx="470" cy="70" r="4" fill="#3B82F6"/>
                  <circle cx="540" cy="60" r="4" fill="#3B82F6"/>
                  {/* X-axis labels */}
                  <text x="50" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">Mon</text>
                  <text x="120" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">Tue</text>
                  <text x="190" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">Wed</text>
                  <text x="260" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">Thu</text>
                  <text x="330" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">Fri</text>
                  <text x="400" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">Sat</text>
                  <text x="470" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">Sun</text>
                  {/* Y-axis labels */}
                  <text x="30" y="185" fontSize="12" fill="#9CA3AF" textAnchor="end">100</text>
                  <text x="30" y="155" fontSize="12" fill="#9CA3AF" textAnchor="end">125</text>
                  <text x="30" y="125" fontSize="12" fill="#9CA3AF" textAnchor="end">150</text>
                  <text x="30" y="95" fontSize="12" fill="#9CA3AF" textAnchor="end">175</text>
                  <text x="30" y="65" fontSize="12" fill="#9CA3AF" textAnchor="end">200</text>
                  <text x="30" y="35" fontSize="12" fill="#9CA3AF" textAnchor="end">225</text>
                </svg>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-cards">
              <div className="stats-card">
                <div className="stats-content">
                  <div className="stats-label">Total Clicks</div>
                  <div className="stats-number">2,847</div>
                  <div className="stats-change positive">+8% from last week</div>
                </div>
                <div className="stats-icon green">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-content">
                  <div className="stats-label">Unique Visitors</div>
                  <div className="stats-number">1,924</div>
                  <div className="stats-change positive">+12% from last week</div>
                </div>
                <div className="stats-icon blue">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.5 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm8 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" fill="currentColor"/>
                  </svg>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-content">
                  <div className="stats-label">Click Rate</div>
                  <div className="stats-number">67.5%</div>
                  <div className="stats-change negative">-2% from last week</div>
                </div>
                <div className="stats-icon yellow">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Links Section */}
          <div className="recent-links">
            <div className="recent-links-header">
              <h2>Recent Links</h2>
              <button className="view-all-btn" onClick={() => handleNavigation('/my-links')}>View All</button>
            </div>
            <div className="links-list">
              <div className="link-item">
                <div className="link-info">
                  <a href="#" className="short-url">linksa.co/summer-sale</a>
                  <a href="#" className="original-url">https://mystore.com/summer-collection-2024-discount-offer</a>
                  <div className="link-meta">
                    <span>245 clicks</span>
                    <span>Created 2 days ago</span>
                  </div>
                </div>
                <div className="link-actions">
                  <button className="action-btn copy-btn">Copy</button>
                  <button className="action-btn edit-btn">Edit</button>
                  <button className="action-btn delete-btn">Delete</button>
                </div>
              </div>

              <div className="link-item">
                <div className="link-info">
                  <a href="#" className="short-url">linksa.co/product-launch</a>
                  <a href="#" className="original-url">https://company.com/new-product-announcement-2024</a>
                  <div className="link-meta">
                    <span>189 clicks</span>
                    <span>Created 5 days ago</span>
                  </div>
                </div>
                <div className="link-actions">
                  <button className="action-btn copy-btn">Copy</button>
                  <button className="action-btn edit-btn">Edit</button>
                  <button className="action-btn delete-btn">Delete</button>
                </div>
              </div>

              <div className="link-item">
                <div className="link-info">
                  <a href="#" className="short-url">linksa.co/event-2024</a>
                  <a href="#" className="original-url">https://events.com/riyadh-tech-conference-2024</a>
                  <div className="link-meta">
                    <span>567 clicks</span>
                    <span>Created 1 month ago</span>
                  </div>
                </div>
                <div className="link-actions">
                  <button className="action-btn copy-btn">Copy</button>
                  <button className="action-btn edit-btn">Edit</button>
                  <button className="action-btn delete-btn">Delete</button>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Promotion */}
          <div className="upgrade-promotion">
            <div className="promotion-content">
              <h2>Ready to unlock more features?</h2>
              <p>Get advanced analytics, bulk operations, API access, and more with our Pro plan.</p>
              <button className="upgrade-promo-btn" onClick={() => handleNavigation('/subscription')}>
                Upgrade to Pro
              </button>
            </div>
            <div className="promotion-image">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background */}
                <rect width="120" height="120" rx="8" fill="#F4F3FF"/>
                
                {/* Chart bars */}
                <rect x="15" y="85" width="8" height="20" rx="4" fill="#5B21B6"/>
                <rect x="27" y="75" width="8" height="30" rx="4" fill="#5B21B6"/>
                <rect x="39" y="65" width="8" height="40" rx="4" fill="#5B21B6"/>
                <rect x="51" y="55" width="8" height="50" rx="4" fill="#5B21B6"/>
                <rect x="63" y="45" width="8" height="60" rx="4" fill="#5B21B6"/>
                <rect x="75" y="35" width="8" height="70" rx="4" fill="#5B21B6"/>
                <rect x="87" y="25" width="8" height="80" rx="4" fill="#5B21B6"/>
                
                {/* Trend line */}
                <path d="M19 89 L31 79 L43 69 L55 59 L67 49 L79 39 L91 29" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"/>
                
                {/* Trend arrow */}
                <path d="M87 25 L91 29 L95 25" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                
                {/* Plant pot */}
                <ellipse cx="95" cy="95" rx="12" ry="8" fill="#F97316"/>
                <rect x="87" y="87" width="16" height="8" rx="2" fill="white"/>
                
                {/* Plant leaves */}
                <path d="M92 87 Q88 82 92 80 Q96 82 92 87" fill="#22C55E"/>
                <path d="M95 85 Q99 80 103 82 Q99 86 95 85" fill="#22C55E"/>
                <path d="M97 87 Q101 82 105 84 Q101 88 97 87" fill="#16A34A"/>
                
                {/* Plant stem */}
                <rect x="94" y="87" width="2" height="8" fill="#22C55E"/>
              </svg>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;