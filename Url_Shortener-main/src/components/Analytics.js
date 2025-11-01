import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import "./Analytics.css";

const Analytics = () => {
  const [timeFilter, setTimeFilter] = useState("Last 7 days");

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            {/* Page Header */}
            <div className="page-header">
              <div className="header-info">
                <h1 className="page-title">Link Analytics</h1>
                <p className="page-subtitle">
                  Track performance of your shortened link
                </p>
              </div>
              <button className="export-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.33325 6.66669L7.99992 4.00002L10.6666 6.66669"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 4V10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export Data
              </button>
            </div>

            {/* Link Info Card */}
            <div className="link-info-card">
              <div className="link-info-content">
                <div className="link-icon">
                  <svg
                    width="25"
                    height="20"
                    viewBox="0 0 25 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 6H14M10 6C8.34315 6 7 7.34315 7 9C7 10.6569 8.34315 12 10 12H12M10 6C8.34315 6 7 4.65685 7 3C7 1.34315 8.34315 0 10 0H12M14 6C15.6569 6 17 7.34315 17 9C17 10.6569 15.6569 12 14 12H12M14 6C15.6569 6 17 4.65685 17 3C17 1.34315 15.6569 0 14 0H12M12 0V12"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="link-details">
                  <h3 className="short-link">linksa.co/abc123</h3>
                  <p className="original-link">
                    https://www.example.com/very-long-url-that-was-shortened
                  </p>
                </div>
              </div>
              <div className="link-actions">
                <button className="action-btn copy-btn">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="4"
                      y="4"
                      width="8"
                      height="8"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 2H4C2.89543 2 2 2.89543 2 4V8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button className="action-btn share-btn">
                  <svg
                    width="14"
                    height="16"
                    viewBox="0 0 14 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 6L6 2L2 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 2V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 12V13C14 13.5304 13.7893 14.0391 13.4142 14.4142C13.0391 14.7893 12.5304 15 12 15H2C1.46957 15 0.960859 14.7893 0.585786 14.4142C0.210714 14.0391 0 13.5304 0 13V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button className="action-btn edit-btn">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.33333 2.66669H2.66667C2.31304 2.66669 1.97391 2.80716 1.72386 3.05721C1.47381 3.30726 1.33333 3.64640 1.33333 4.00002V13.3334C1.33333 13.687 1.47381 14.0261 1.72386 14.2762C1.97391 14.5262 2.31304 14.6667 2.66667 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2762C13.1929 14.0261 13.3333 13.687 13.3333 13.3334V8.66669"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12.3333 1.66669C12.5985 1.40148 12.9583 1.25244 13.3333 1.25244C13.7083 1.25244 14.0681 1.40148 14.3333 1.66669C14.5985 1.9319 14.7476 2.29171 14.7476 2.66669C14.7476 3.04167 14.5985 3.40148 14.3333 3.66669L8 10L5.33333 10.6667L6 8.00002L12.3333 1.66669Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stats-card">
                <div className="stats-content">
                  <div className="stats-info">
                    <p className="stats-label">Total Clicks</p>
                    <h3 className="stats-value">2,847</h3>
                    <div className="stats-change positive">
                      <svg
                        width="11"
                        height="14"
                        viewBox="0 0 11 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.5 1L1 5.5H4V13H7V5.5H10L5.5 1Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>+12.5% vs last period</span>
                    </div>
                  </div>
                  <div className="stats-icon blue">
                    <svg
                      width="13"
                      height="20"
                      viewBox="0 0 13 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 7H12M1 7L5 3M1 7L5 11M12 7V15C12 15.5304 11.7893 16.0391 11.4142 16.4142C11.0391 16.7893 10.5304 17 10 17H2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-content">
                  <div className="stats-info">
                    <p className="stats-label">Unique Clicks</p>
                    <h3 className="stats-value">1,924</h3>
                    <div className="stats-change positive">
                      <svg
                        width="11"
                        height="14"
                        viewBox="0 0 11 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.5 1L1 5.5H4V13H7V5.5H10L5.5 1Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>+8.3% vs last period</span>
                    </div>
                  </div>
                  <div className="stats-icon green">
                    <svg
                      width="25"
                      height="20"
                      viewBox="0 0 25 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="9"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M1 21V19C1 16.7909 2.79086 15 5 15H13C15.2091 15 17 16.7909 17 19V21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="20"
                        cy="8"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M23 21V20C22.9993 18.1137 21.765 16.4604 20 15.85"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Click Activity Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Click Activity</h3>
                <div className="chart-controls">
                  <select
                    className="time-filter-select"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                    <option value="Last 90 days">Last 90 days</option>
                  </select>
                </div>
              </div>
              <div className="chart-container">
                <svg
                  width="100%"
                  height="320"
                  viewBox="0 0 1070 320"
                  className="analytics-chart"
                >
                  {/* Chart Grid Lines */}
                  <defs>
                    <linearGradient
                      id="totalClicksGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient
                      id="uniqueClicksGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis grid lines */}
                  <g stroke="#f3f4f6" strokeWidth="1">
                    <line x1="70" y1="50" x2="1020" y2="50" />
                    <line x1="70" y1="100" x2="1020" y2="100" />
                    <line x1="70" y1="150" x2="1020" y2="150" />
                    <line x1="70" y1="200" x2="1020" y2="200" />
                    <line x1="70" y1="250" x2="1020" y2="250" />
                  </g>

                  {/* Total Clicks Line */}
                  <polyline
                    points="100,220 200,200 300,180 400,160 500,140 600,120 700,100 800,90 900,80"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Unique Clicks Line */}
                  <polyline
                    points="100,240 200,235 300,210 400,190 500,170 600,150 700,130 800,120 900,110"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Data points - Total Clicks */}
                  <g fill="#3b82f6">
                    <circle cx="100" cy="220" r="4" />
                    <circle cx="200" cy="200" r="4" />
                    <circle cx="300" cy="180" r="4" />
                    <circle cx="400" cy="160" r="4" />
                    <circle cx="500" cy="140" r="4" />
                    <circle cx="600" cy="120" r="4" />
                    <circle cx="700" cy="100" r="4" />
                    <circle cx="800" cy="90" r="4" />
                    <circle cx="900" cy="80" r="4" />
                  </g>

                  {/* Data points - Unique Clicks */}
                  <g fill="#10b981">
                    <circle cx="100" cy="240" r="4" />
                    <circle cx="200" cy="235" r="4" />
                    <circle cx="300" cy="210" r="4" />
                    <circle cx="400" cy="190" r="4" />
                    <circle cx="500" cy="170" r="4" />
                    <circle cx="600" cy="150" r="4" />
                    <circle cx="700" cy="130" r="4" />
                    <circle cx="800" cy="120" r="4" />
                    <circle cx="900" cy="110" r="4" />
                  </g>

                  {/* X-axis labels */}
                  <g
                    fill="#666666"
                    fontSize="12.8"
                    textAnchor="middle"
                    fontFamily="Inter"
                  >
                    <text x="100" y="285">
                      Mon
                    </text>
                    <text x="200" y="285">
                      Tue
                    </text>
                    <text x="300" y="285">
                      Wed
                    </text>
                    <text x="400" y="285">
                      Thu
                    </text>
                    <text x="500" y="285">
                      Fri
                    </text>
                    <text x="600" y="285">
                      Sat
                    </text>
                    <text x="700" y="285">
                      Sun
                    </text>
                  </g>

                  {/* Y-axis labels */}
                  <g
                    fill="#666666"
                    fontSize="12.8"
                    textAnchor="end"
                    fontFamily="Inter"
                  >
                    <text x="60" y="255">
                      0
                    </text>
                    <text x="60" y="205">
                      100
                    </text>
                    <text x="60" y="155">
                      200
                    </text>
                    <text x="60" y="105">
                      300
                    </text>
                    <text x="60" y="55">
                      400
                    </text>
                    <text x="60" y="35">
                      500
                    </text>
                  </g>

                  {/* Legend */}
                  <g fontSize="12.8" fontFamily="Inter">
                    <circle cx="450" cy="305" r="6" fill="#3b82f6" />
                    <text x="465" y="310" fill="#333333">
                      Total Clicks
                    </text>
                    <circle cx="570" cy="305" r="6" fill="#10b981" />
                    <text x="585" y="310" fill="#333333">
                      Unique Clicks
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Bottom Section - Country and Device Stats */}
            <div className="bottom-section">
              {/* Clicks by Country */}
              <div className="section-card">
                <h3 className="section-title">Clicks by Country</h3>
                <div className="country-stats">
                  <div className="country-item">
                    <div className="country-info">
                      <span className="country-flag">🇸🇦</span>
                      <span className="country-name">Saudi Arabia</span>
                    </div>
                    <div className="country-data">
                      <span className="country-value">1,247</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="country-item">
                    <div className="country-info">
                      <span className="country-flag">🇦🇪</span>
                      <span className="country-name">UAE</span>
                    </div>
                    <div className="country-data">
                      <span className="country-value">421</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: "22%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="country-item">
                    <div className="country-info">
                      <span className="country-flag">🇺🇸</span>
                      <span className="country-name">United States</span>
                    </div>
                    <div className="country-data">
                      <span className="country-value">318</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: "17%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="country-item">
                    <div className="country-info">
                      <span className="country-flag">🇬🇧</span>
                      <span className="country-name">United Kingdom</span>
                    </div>
                    <div className="country-data">
                      <span className="country-value">142</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: "7%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="country-item">
                    <div className="country-info">
                      <span className="country-flag">🇩🇪</span>
                      <span className="country-name">Germany</span>
                    </div>
                    <div className="country-data">
                      <span className="country-value">98</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: "5%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clicks by Device Type */}
              <div className="section-card">
                <h3 className="section-title">Clicks by Device Type</h3>
                <div className="device-chart">
                  <svg width="100%" height="256" viewBox="0 0 256 256">
                    <defs>
                      <linearGradient
                        id="mobileGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                      <linearGradient
                        id="desktopGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient
                        id="tabletGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>

                    {/* Mobile - 59.3% */}
                    <path
                      d="M 128 25 A 103 103 0 1 1 63.2 206.8 L 128 128 Z"
                      fill="url(#mobileGradient)"
                    />

                    {/* Desktop - 31.4% */}
                    <path
                      d="M 63.2 206.8 A 103 103 0 0 1 48.7 49.2 L 128 128 Z"
                      fill="url(#desktopGradient)"
                    />

                    {/* Tablet - 9.4% */}
                    <path
                      d="M 48.7 49.2 A 103 103 0 0 1 128 25 L 128 128 Z"
                      fill="url(#tabletGradient)"
                    />

                    {/* Center circle for donut effect */}
                    <circle cx="128" cy="128" r="60" fill="white" />
                  </svg>
                </div>
                <div className="device-stats">
                  <div className="device-item">
                    <div className="device-indicator mobile"></div>
                    <div className="device-info">
                      <p className="device-label">Mobile</p>
                      <h4 className="device-value">1,687</h4>
                    </div>
                  </div>
                  <div className="device-item">
                    <div className="device-indicator desktop"></div>
                    <div className="device-info">
                      <p className="device-label">Desktop</p>
                      <h4 className="device-value">892</h4>
                    </div>
                  </div>
                  <div className="device-item">
                    <div className="device-indicator tablet"></div>
                    <div className="device-info">
                      <p className="device-label">Tablet</p>
                      <h4 className="device-value">268</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
