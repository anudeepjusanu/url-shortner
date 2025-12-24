import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./ApiDocumentation.css";

const ApiDocumentation = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("introduction");
  const [copiedCode, setCopiedCode] = useState(null);
  const [expandedEndpoints, setExpandedEndpoints] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState("curl");

  // Base URL for API
  const BASE_URL = window.location.origin + "/api";

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleEndpoint = (id) => {
    setExpandedEndpoints(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Navigation sections
  const navSections = [
    { id: "introduction", label: "Introduction", icon: "📖" },
    { id: "authentication", label: "Authentication", icon: "🔐" },
    { id: "rate-limits", label: "Rate Limits", icon: "⏱️" },
    { id: "endpoints", label: "API Endpoints", icon: "🔗" },
    { id: "errors", label: "Error Handling", icon: "⚠️" },
    { id: "examples", label: "Code Examples", icon: "💻" },
  ];

  // API Endpoints data
  const endpoints = [
    {
      id: "create-url",
      method: "POST",
      path: "/urls",
      title: "Create Shortened URL",
      description: "Create a new shortened URL with optional customization options.",
      requestBody: {
        originalUrl: { type: "string", required: true, description: "The long URL to shorten (must be valid HTTP/HTTPS URL)" },
        customCode: { type: "string", required: false, description: "Custom short code (alphanumeric, case-sensitive)" },
        title: { type: "string", required: false, description: "Title for the shortened URL" },
        description: { type: "string", required: false, description: "Description of the link" },
        tags: { type: "array", required: false, description: "Array of tags for organization" },
        expiresAt: { type: "string", required: false, description: "ISO 8601 date when the link expires" },
        password: { type: "string", required: false, description: "Password protection for the link" },
        domainId: { type: "string", required: false, description: 'Domain ID to use ("base" for default domain)' },
        utm: { type: "object", required: false, description: "UTM parameters (source, medium, campaign)" },
        restrictions: { type: "object", required: false, description: "Access restrictions (maxClicks, allowedCountries, etc.)" },
        redirectType: { type: "number", required: false, description: "HTTP redirect type (301 or 302, default: 302)" }
      },
      responses: {
        201: {
          description: "URL created successfully",
          example: `{
  "success": true,
  "message": "URL created successfully",
  "data": {
    "url": {
      "_id": "507f1f77bcf86cd799439011",
      "originalUrl": "https://example.com/very-long-url",
      "shortCode": "abc123",
      "title": "My Custom Link",
      "clickCount": 0,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "domain": {
      "id": "base",
      "fullDomain": "snip.sa",
      "shortUrl": "https://snip.sa",
      "isSystemDomain": true
    }
  }
}`
        },
        400: { description: "Invalid URL format or custom code already exists" },
        401: { description: "Invalid or missing API key" },
        403: { description: "Usage limit exceeded" }
      }
    },
    {
      id: "get-urls",
      method: "GET",
      path: "/urls",
      title: "Get All URLs",
      description: "Retrieve a paginated list of your shortened URLs with optional filtering and sorting.",
      queryParams: {
        page: { type: "number", default: "1", description: "Page number" },
        limit: { type: "number", default: "20", description: "Results per page (max: 100)" },
        search: { type: "string", default: "-", description: "Search in title, URL, or short code" },
        tags: { type: "string", default: "-", description: "Filter by tags (comma-separated)" },
        sortBy: { type: "string", default: "createdAt", description: "Sort field (createdAt, clickCount, title)" },
        sortOrder: { type: "string", default: "desc", description: "Sort order (asc, desc)" },
        isActive: { type: "boolean", default: "-", description: "Filter by active status" }
      },
      responses: {
        200: {
          description: "Success",
          example: `{
  "success": true,
  "data": {
    "urls": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "originalUrl": "https://example.com/page",
        "shortCode": "abc123",
        "title": "Campaign Link",
        "clickCount": 150,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}`
        }
      }
    },
    {
      id: "get-url",
      method: "GET",
      path: "/urls/:id",
      title: "Get Single URL",
      description: "Retrieve details of a specific shortened URL by its ID.",
      pathParams: {
        id: { type: "string", required: true, description: "The URL ID (MongoDB ObjectId)" }
      },
      responses: {
        200: {
          description: "Success",
          example: `{
  "success": true,
  "data": {
    "url": {
      "_id": "507f1f77bcf86cd799439011",
      "originalUrl": "https://example.com/page",
      "shortCode": "abc123",
      "customCode": "mylink",
      "title": "My Link",
      "description": "Link description",
      "tags": ["marketing"],
      "clickCount": 150,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}`
        },
        404: { description: "URL not found" }
      }
    },
    {
      id: "update-url",
      method: "PUT",
      path: "/urls/:id",
      title: "Update URL",
      description: "Update properties of an existing shortened URL. Note: originalUrl and shortCode cannot be changed.",
      pathParams: {
        id: { type: "string", required: true, description: "The URL ID" }
      },
      requestBody: {
        title: { type: "string", required: false, description: "Updated title" },
        description: { type: "string", required: false, description: "Updated description" },
        tags: { type: "array", required: false, description: "Updated tags array" },
        isActive: { type: "boolean", required: false, description: "Enable/disable the link" },
        customCode: { type: "string", required: false, description: "New custom code" },
        expiresAt: { type: "string", required: false, description: "New expiration date" },
        password: { type: "string", required: false, description: "New password" }
      },
      responses: {
        200: { description: "URL updated successfully" },
        400: { description: "Custom code already in use" },
        404: { description: "URL not found" }
      }
    },
    {
      id: "delete-url",
      method: "DELETE",
      path: "/urls/:id",
      title: "Delete URL",
      description: "Permanently delete a shortened URL.",
      pathParams: {
        id: { type: "string", required: true, description: "The URL ID" }
      },
      responses: {
        200: { description: "URL deleted successfully" },
        404: { description: "URL not found" }
      }
    },
    {
      id: "bulk-delete",
      method: "POST",
      path: "/urls/bulk-delete",
      title: "Bulk Delete URLs",
      description: "Delete multiple URLs at once. Requires bulk_operations permission (Pro/Enterprise plans).",
      requestBody: {
        ids: { type: "array", required: true, description: "Array of URL IDs to delete" }
      },
      responses: {
        200: { description: "URLs deleted successfully" },
        403: { description: "Some URLs not found or access denied" }
      }
    },
    {
      id: "get-stats",
      method: "GET",
      path: "/urls/stats",
      title: "Get URL Statistics",
      description: "Get aggregated statistics for all your URLs including total links, clicks, and top performing URLs.",
      responses: {
        200: {
          description: "Success",
          example: `{
  "success": true,
  "totalLinks": 45,
  "totalClicks": 1250,
  "customDomains": 2,
  "accountAge": "3 months",
  "plan": "Professional",
  "data": {
    "stats": {
      "totalUrls": 45,
      "activeUrls": 42,
      "totalClicks": 1250,
      "topUrls": [...]
    }
  }
}`
        }
      }
    },
    {
      id: "get-domains",
      method: "GET",
      path: "/urls/domains/available",
      title: "Get Available Domains",
      description: "Get list of domains available for URL shortening, including the base domain and your custom domains.",
      responses: {
        200: {
          description: "Success",
          example: `{
  "success": true,
  "data": {
    "domains": [
      {
        "id": "base",
        "fullDomain": "snip.sa",
        "isDefault": true,
        "shortUrl": "https://snip.sa",
        "status": "active",
        "isSystemDomain": true
      }
    ]
  }
}`
        }
      }
    }
  ];

  // Code examples for different languages
  const getCodeExample = (endpoint, language) => {
    const examples = {
      "create-url": {
        curl: `curl -X POST ${BASE_URL}/urls \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "originalUrl": "https://example.com/my-long-url",
    "title": "My Link",
    "tags": ["marketing", "campaign"]
  }'`,
        javascript: `const axios = require('axios');

const response = await axios.post('${BASE_URL}/urls', {
  originalUrl: 'https://example.com/my-long-url',
  title: 'My Link',
  tags: ['marketing', 'campaign']
}, {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  }
});

console.log(response.data);`,
        python: `import requests

response = requests.post(
    '${BASE_URL}/urls',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'YOUR_API_KEY'
    },
    json={
        'originalUrl': 'https://example.com/my-long-url',
        'title': 'My Link',
        'tags': ['marketing', 'campaign']
    }
)

print(response.json())`,
        php: `<?php
$ch = curl_init('${BASE_URL}/urls');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'originalUrl' => 'https://example.com/my-long-url',
    'title' => 'My Link',
    'tags' => ['marketing', 'campaign']
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-Key: YOUR_API_KEY'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>`
      },
      "get-urls": {
        curl: `curl -X GET "${BASE_URL}/urls?page=1&limit=20" \\
  -H "X-API-Key: YOUR_API_KEY"`,
        javascript: `const axios = require('axios');

const response = await axios.get('${BASE_URL}/urls', {
  params: { page: 1, limit: 20 },
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
});

console.log(response.data);`,
        python: `import requests

response = requests.get(
    '${BASE_URL}/urls',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    params={'page': 1, 'limit': 20}
)

print(response.json())`,
        php: `<?php
$ch = curl_init('${BASE_URL}/urls?page=1&limit=20');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: YOUR_API_KEY'
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>`
      }
    };

    return examples[endpoint]?.[language] || examples["create-url"][language];
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" },
      POST: { bg: "#E3F2FD", text: "#1565C0", border: "#90CAF9" },
      PUT: { bg: "#FFF3E0", text: "#E65100", border: "#FFCC80" },
      DELETE: { bg: "#FFEBEE", text: "#C62828", border: "#EF9A9A" },
      PATCH: { bg: "#F3E5F5", text: "#7B1FA2", border: "#CE93D8" }
    };
    return colors[method] || colors.GET;
  };

  return (
    <div className="api-docs-container">
      {/* Header */}
      <header className="api-docs-header">
        <div className="api-docs-header-content">
          <div className="api-docs-logo">
            <span className="api-docs-logo-icon">🔗</span>
            <h1>URL Shortener API</h1>
            <span className="api-docs-version">v1.0</span>
          </div>
          <div className="api-docs-header-actions">
            <a href="/login" className="api-docs-btn-secondary">Login</a>
            <a href="/register" className="api-docs-btn-primary">Get API Key</a>
          </div>
        </div>
      </header>

      <div className="api-docs-layout">
        {/* Sidebar Navigation */}
        <nav className="api-docs-sidebar">
          <div className="api-docs-nav-section">
            <h3>Getting Started</h3>
            <ul>
              {navSections.slice(0, 3).map(section => (
                <li key={section.id}>
                  <button
                    className={`api-docs-nav-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <span className="nav-icon">{section.icon}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="api-docs-nav-section">
            <h3>Reference</h3>
            <ul>
              <li>
                <button
                  className={`api-docs-nav-item ${activeSection === 'endpoints' ? 'active' : ''}`}
                  onClick={() => scrollToSection('endpoints')}
                >
                  <span className="nav-icon">🔗</span>
                  API Endpoints
                </button>
                <ul className="api-docs-nav-sub">
                  {endpoints.map(ep => (
                    <li key={ep.id}>
                      <button
                        className="api-docs-nav-subitem"
                        onClick={() => {
                          setExpandedEndpoints(prev => ({ ...prev, [ep.id]: true }));
                          setTimeout(() => {
                            document.getElementById(ep.id)?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                      >
                        <span className={`method-badge method-${ep.method.toLowerCase()}`}>
                          {ep.method}
                        </span>
                        <span className="endpoint-path">{ep.path}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>

          <div className="api-docs-nav-section">
            <h3>Resources</h3>
            <ul>
              {navSections.slice(4).map(section => (
                <li key={section.id}>
                  <button
                    className={`api-docs-nav-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <span className="nav-icon">{section.icon}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="api-docs-main">
          {/* Introduction Section */}
          <section id="introduction" className="api-docs-section">
            <div className="section-header">
              <h2>Introduction</h2>
              <p className="section-subtitle">Welcome to the URL Shortener API documentation</p>
            </div>
            
            <div className="api-docs-card">
              <p>
                The URL Shortener API allows you to programmatically create, manage, and track shortened URLs. 
                This RESTful API returns JSON responses and supports both API key and JWT authentication.
              </p>
              
              <div className="api-docs-info-box">
                <div className="info-box-icon">💡</div>
                <div className="info-box-content">
                  <strong>Base URL</strong>
                  <code className="base-url">{BASE_URL}</code>
                </div>
              </div>

              <h3>Key Features</h3>
              <ul className="feature-list">
                <li><span className="feature-icon">✓</span> Create shortened URLs with custom codes</li>
                <li><span className="feature-icon">✓</span> Track clicks and analytics</li>
                <li><span className="feature-icon">✓</span> Password protection and expiration dates</li>
                <li><span className="feature-icon">✓</span> UTM parameter tracking</li>
                <li><span className="feature-icon">✓</span> Geographic and device restrictions</li>
                <li><span className="feature-icon">✓</span> Custom domain support</li>
              </ul>
            </div>
          </section>

          {/* Authentication Section */}
          <section id="authentication" className="api-docs-section">
            <div className="section-header">
              <h2>Authentication</h2>
              <p className="section-subtitle">Secure your API requests</p>
            </div>

            <div className="api-docs-card">
              <h3>API Key Authentication (Recommended)</h3>
              <p>Include your API key in the request header:</p>
              
              <div className="code-block">
                <div className="code-header">
                  <span>Header</span>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard('X-API-Key: your_api_key_here', 'auth-header')}
                  >
                    {copiedCode === 'auth-header' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <pre><code>X-API-Key: your_api_key_here</code></pre>
              </div>

              <h3>Getting Your API Key</h3>
              <ol className="steps-list">
                <li>Log in to your account at the web dashboard</li>
                <li>Navigate to <strong>Profile</strong> → <strong>API Keys</strong> section</li>
                <li>Click <strong>"Regenerate API Key"</strong> to generate a new key</li>
                <li>Copy and securely store your API key</li>
              </ol>

              <div className="api-docs-warning-box">
                <div className="warning-box-icon">⚠️</div>
                <div className="warning-box-content">
                  <strong>Security Notice</strong>
                  <p>Keep your API key secure and never share it publicly. Regenerating your API key will invalidate the previous key.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Rate Limits Section */}
          <section id="rate-limits" className="api-docs-section">
            <div className="section-header">
              <h2>Rate Limits</h2>
              <p className="section-subtitle">API usage limits by plan</p>
            </div>

            <div className="api-docs-card">
              <table className="api-docs-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>URLs/Month</th>
                    <th>API Calls/15min</th>
                    <th>Custom Domains</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="plan-badge free">Free</span></td>
                    <td>100</td>
                    <td>100</td>
                    <td>0</td>
                  </tr>
                  <tr>
                    <td><span className="plan-badge pro">Pro</span></td>
                    <td>1,000</td>
                    <td>1,000</td>
                    <td>5</td>
                  </tr>
                  <tr>
                    <td><span className="plan-badge enterprise">Enterprise</span></td>
                    <td>Unlimited</td>
                    <td>5,000</td>
                    <td>Unlimited</td>
                  </tr>
                </tbody>
              </table>

              <h3>Rate Limit Headers</h3>
              <p>Rate limit information is included in response headers:</p>
              <ul className="param-list">
                <li><code>X-RateLimit-Limit</code> - Maximum requests allowed</li>
                <li><code>X-RateLimit-Remaining</code> - Remaining requests</li>
                <li><code>X-RateLimit-Reset</code> - Time when the limit resets</li>
              </ul>
            </div>
          </section>

          {/* Endpoints Section */}
          <section id="endpoints" className="api-docs-section">
            <div className="section-header">
              <h2>API Endpoints</h2>
              <p className="section-subtitle">Complete reference for all available endpoints</p>
            </div>

            {endpoints.map(endpoint => {
              const methodColor = getMethodColor(endpoint.method);
              const isExpanded = expandedEndpoints[endpoint.id];
              
              return (
                <div key={endpoint.id} id={endpoint.id} className="endpoint-card">
                  <div 
                    className="endpoint-header"
                    onClick={() => toggleEndpoint(endpoint.id)}
                  >
                    <div className="endpoint-info">
                      <span 
                        className="method-tag"
                        style={{ 
                          backgroundColor: methodColor.bg, 
                          color: methodColor.text,
                          borderColor: methodColor.border 
                        }}
                      >
                        {endpoint.method}
                      </span>
                      <code className="endpoint-path-main">{endpoint.path}</code>
                    </div>
                    <div className="endpoint-title-row">
                      <h3>{endpoint.title}</h3>
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="endpoint-body">
                      <p className="endpoint-description">{endpoint.description}</p>

                      {/* Path Parameters */}
                      {endpoint.pathParams && (
                        <div className="params-section">
                          <h4>Path Parameters</h4>
                          <table className="params-table">
                            <thead>
                              <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(endpoint.pathParams).map(([key, param]) => (
                                <tr key={key}>
                                  <td><code>{key}</code></td>
                                  <td>{param.type}</td>
                                  <td>{param.required ? <span className="required-badge">Yes</span> : 'No'}</td>
                                  <td>{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Query Parameters */}
                      {endpoint.queryParams && (
                        <div className="params-section">
                          <h4>Query Parameters</h4>
                          <table className="params-table">
                            <thead>
                              <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Default</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(endpoint.queryParams).map(([key, param]) => (
                                <tr key={key}>
                                  <td><code>{key}</code></td>
                                  <td>{param.type}</td>
                                  <td><code>{param.default}</code></td>
                                  <td>{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Request Body */}
                      {endpoint.requestBody && (
                        <div className="params-section">
                          <h4>Request Body</h4>
                          <table className="params-table">
                            <thead>
                              <tr>
                                <th>Field</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(endpoint.requestBody).map(([key, param]) => (
                                <tr key={key}>
                                  <td><code>{key}</code></td>
                                  <td>{param.type}</td>
                                  <td>{param.required ? <span className="required-badge">Yes</span> : 'No'}</td>
                                  <td>{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Responses */}
                      <div className="params-section">
                        <h4>Responses</h4>
                        {Object.entries(endpoint.responses).map(([code, response]) => (
                          <div key={code} className="response-block">
                            <div className="response-header">
                              <span className={`status-code status-${code.charAt(0)}xx`}>{code}</span>
                              <span className="response-desc">{response.description}</span>
                            </div>
                            {response.example && (
                              <div className="code-block response-example">
                                <div className="code-header">
                                  <span>Response</span>
                                  <button 
                                    className="copy-btn"
                                    onClick={() => copyToClipboard(response.example, `${endpoint.id}-${code}`)}
                                  >
                                    {copiedCode === `${endpoint.id}-${code}` ? '✓ Copied' : 'Copy'}
                                  </button>
                                </div>
                                <pre><code>{response.example}</code></pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Code Example */}
                      {(endpoint.id === 'create-url' || endpoint.id === 'get-urls') && (
                        <div className="params-section">
                          <h4>Code Example</h4>
                          <div className="language-tabs">
                            {['curl', 'javascript', 'python', 'php'].map(lang => (
                              <button
                                key={lang}
                                className={`lang-tab ${selectedLanguage === lang ? 'active' : ''}`}
                                onClick={() => setSelectedLanguage(lang)}
                              >
                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                              </button>
                            ))}
                          </div>
                          <div className="code-block">
                            <div className="code-header">
                              <span>{selectedLanguage.toUpperCase()}</span>
                              <button 
                                className="copy-btn"
                                onClick={() => copyToClipboard(getCodeExample(endpoint.id, selectedLanguage), `${endpoint.id}-code`)}
                              >
                                {copiedCode === `${endpoint.id}-code` ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre><code>{getCodeExample(endpoint.id, selectedLanguage)}</code></pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Error Handling Section */}
          <section id="errors" className="api-docs-section">
            <div className="section-header">
              <h2>Error Handling</h2>
              <p className="section-subtitle">Understanding API error responses</p>
            </div>

            <div className="api-docs-card">
              <h3>Response Format</h3>
              <p>All API responses follow a consistent format:</p>
              
              <div className="code-block">
                <div className="code-header">
                  <span>Success Response</span>
                </div>
                <pre><code>{`{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}`}</code></pre>
              </div>

              <div className="code-block">
                <div className="code-header">
                  <span>Error Response</span>
                </div>
                <pre><code>{`{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}`}</code></pre>
              </div>

              <h3>HTTP Status Codes</h3>
              <table className="api-docs-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="status-code status-2xx">200</span></td>
                    <td>Success</td>
                  </tr>
                  <tr>
                    <td><span className="status-code status-2xx">201</span></td>
                    <td>Created</td>
                  </tr>
                  <tr>
                    <td><span className="status-code status-4xx">400</span></td>
                    <td>Bad Request - Invalid input</td>
                  </tr>
                  <tr>
                    <td><span className="status-code status-4xx">401</span></td>
                    <td>Unauthorized - Invalid or missing API key</td>
                  </tr>
                  <tr>
                    <td><span className="status-code status-4xx">403</span></td>
                    <td>Forbidden - Insufficient permissions or usage limit exceeded</td>
                  </tr>
                  <tr>
                    <td><span className="status-code status-4xx">404</span></td>
                    <td>Not Found - Resource doesn't exist</td>
                  </tr>
                  <tr>
                    <td><span className="status-code status-4xx">429</span></td>
                    <td>Too Many Requests - Rate limit exceeded</td>
                  </tr>
                  <tr>
                    <td><span className="status-code status-5xx">500</span></td>
                    <td>Internal Server Error</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Code Examples Section */}
          <section id="examples" className="api-docs-section">
            <div className="section-header">
              <h2>Code Examples</h2>
              <p className="section-subtitle">Quick start examples in multiple languages</p>
            </div>

            <div className="api-docs-card">
              <h3>Complete Workflow Example</h3>
              <p>Here's a complete example showing how to create a URL, retrieve it, and check statistics:</p>

              <div className="language-tabs">
                {['curl', 'javascript', 'python', 'php'].map(lang => (
                  <button
                    key={lang}
                    className={`lang-tab ${selectedLanguage === lang ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>

              <div className="code-block">
                <div className="code-header">
                  <span>Create URL - {selectedLanguage.toUpperCase()}</span>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(getCodeExample('create-url', selectedLanguage), 'example-create')}
                  >
                    {copiedCode === 'example-create' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <pre><code>{getCodeExample('create-url', selectedLanguage)}</code></pre>
              </div>

              <h3>Best Practices</h3>
              <ul className="best-practices-list">
                <li>
                  <span className="practice-icon">🔒</span>
                  <div>
                    <strong>Secure Your API Key</strong>
                    <p>Never commit API keys to version control. Use environment variables.</p>
                  </div>
                </li>
                <li>
                  <span className="practice-icon">🔄</span>
                  <div>
                    <strong>Handle Rate Limits</strong>
                    <p>Implement exponential backoff for retries and monitor rate limit headers.</p>
                  </div>
                </li>
                <li>
                  <span className="practice-icon">⚡</span>
                  <div>
                    <strong>Optimize Requests</strong>
                    <p>Use pagination for large datasets and cache responses when appropriate.</p>
                  </div>
                </li>
                <li>
                  <span className="practice-icon">✅</span>
                  <div>
                    <strong>Validate URLs</strong>
                    <p>Always validate URLs before sending to API. Ensure they include protocol (http:// or https://).</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <footer className="api-docs-footer">
            <div className="footer-content">
              <p>Need help? Contact us at <a href="mailto:support@snip.sa">support@snip.sa</a></p>
              <p>© {new Date().getFullYear()} URL Shortener. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default ApiDocumentation;
