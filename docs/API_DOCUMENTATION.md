# URL Shortener API Documentation

## Overview

The URL Shortener API allows you to programmatically create, manage, and track shortened URLs. This API uses REST principles and returns JSON responses.

**Base URL:** `https://your-domain.com/api`

---

## Authentication

The API supports two authentication methods:

### 1. API Key Authentication (Recommended for API access)

Include your API key in the request header:

```
X-API-Key: your_api_key_here
```

### 2. Bearer Token Authentication (JWT)

Include your JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

---

## Getting Your API Key

1. Log in to your account at the web dashboard
2. Navigate to **Profile** → **API Keys** section
3. Click **"Regenerate API Key"** to generate a new key
4. Copy and securely store your API key

**Important Notes:**
- Keep your API key secure and never share it publicly
- Regenerating your API key will invalidate the previous key
- API keys inherit your account permissions and limits

---

## Rate Limits

Rate limits are currently disabled during development but will be enforced in production:

- **Free Plan:** 100 requests per 15 minutes
- **Pro Plan:** 1000 requests per 15 minutes  
- **Enterprise Plan:** 5000 requests per 15 minutes

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when the limit resets

---

## API Endpoints

### 1. Create Shortened URL

Create a new shortened URL with optional customization.

**Endpoint:** `POST /api/urls`

**Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key_here
```

**Request Body:**
```json
{
  "originalUrl": "https://example.com/very-long-url",
  "customCode": "mylink",
  "title": "My Custom Link",
  "description": "Description of the link",
  "tags": ["marketing", "campaign"],
  "expiresAt": "2024-12-31T23:59:59Z",
  "password": "secret123",
  "domainId": "base",
  "utm": {
    "source": "newsletter",
    "medium": "email",
    "campaign": "spring_sale"
  },
  "restrictions": {
    "maxClicks": 1000,
    "allowedCountries": ["US", "CA", "GB"],
    "blockedCountries": [],
    "allowedDevices": ["desktop", "mobile"]
  },
  "redirectType": 302
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `originalUrl` | string | **Yes** | The long URL to shorten (must be valid HTTP/HTTPS URL) |
| `customCode` | string | No | Custom short code (alphanumeric, case-sensitive) |
| `title` | string | No | Title for the shortened URL |
| `description` | string | No | Description of the link |
| `tags` | array | No | Array of tags for organization |
| `expiresAt` | string | No | ISO 8601 date when the link expires |
| `password` | string | No | Password protection for the link |
| `domainId` | string | No | Domain ID to use ("base" for default domain) |
| `utm` | object | No | UTM parameters for tracking |
| `restrictions` | object | No | Access restrictions (max clicks, geo-blocking, device filtering) |
| `redirectType` | number | No | HTTP redirect type (301 or 302, default: 302) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "URL created successfully",
  "data": {
    "url": {
      "_id": "507f1f77bcf86cd799439011",
      "originalUrl": "https://example.com/very-long-url",
      "shortCode": "abc123",
      "customCode": "mylink",
      "title": "My Custom Link",
      "description": "Description of the link",
      "domain": null,
      "tags": ["marketing", "campaign"],
      "clickCount": 0,
      "isActive": true,
      "creator": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "domain": {
      "id": "base",
      "fullDomain": "laghhu.link",
      "shortUrl": "https://laghhu.link",
      "isSystemDomain": true
    }
  }
}
```

**Short URL Format:**
- With base domain: `https://laghhu.link/abc123` or `https://laghhu.link/mylink`
- With custom domain: `https://yourdomain.com/abc123`

**Error Responses:**

```json
// 400 Bad Request - Invalid URL
{
  "success": false,
  "message": "Invalid URL format"
}

// 400 Bad Request - Custom code already exists
{
  "success": false,
  "message": "Custom code already exists"
}

// 403 Forbidden - Usage limit exceeded
{
  "success": false,
  "message": "Monthly URL creation limit exceeded",
  "code": "USAGE_LIMIT_EXCEEDED",
  "data": {
    "limit": 100,
    "current": 100,
    "action": "createUrl"
  }
}

// 401 Unauthorized - Invalid API key
{
  "success": false,
  "message": "Invalid API key"
}
```

---

### 2. Get All URLs

Retrieve a paginated list of your shortened URLs.

**Endpoint:** `GET /api/urls`

**Headers:**
```
X-API-Key: your_api_key_here
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page (max: 100) |
| `search` | string | - | Search in title, URL, or short code |
| `tags` | string | - | Filter by tags (comma-separated) |
| `sortBy` | string | createdAt | Sort field (createdAt, clickCount, title) |
| `sortOrder` | string | desc | Sort order (asc, desc) |
| `isActive` | boolean | - | Filter by active status |

**Example Request:**
```
GET /api/urls?page=1&limit=20&search=campaign&tags=marketing&sortBy=clickCount&sortOrder=desc
```

**Success Response (200 OK):**
```json
{
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
}
```

---

### 3. Get Single URL

Retrieve details of a specific shortened URL.

**Endpoint:** `GET /api/urls/:id`

**Headers:**
```
X-API-Key: your_api_key_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "url": {
      "_id": "507f1f77bcf86cd799439011",
      "originalUrl": "https://example.com/page",
      "shortCode": "abc123",
      "customCode": "mylink",
      "title": "My Link",
      "description": "Link description",
      "domain": null,
      "tags": ["marketing"],
      "clickCount": 150,
      "isActive": true,
      "expiresAt": null,
      "utm": {
        "source": "newsletter",
        "medium": "email"
      },
      "restrictions": {},
      "creator": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "URL not found"
}
```

---

### 4. Update URL

Update properties of an existing shortened URL.

**Endpoint:** `PUT /api/urls/:id`

**Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key_here
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["updated", "tags"],
  "isActive": true,
  "customCode": "newcode",
  "expiresAt": "2024-12-31T23:59:59Z",
  "password": "newpassword",
  "utm": {
    "source": "twitter",
    "medium": "social"
  },
  "restrictions": {
    "maxClicks": 500
  },
  "redirectType": 301
}
```

**Note:** You cannot update the `originalUrl` or `shortCode`. All fields are optional.

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "URL updated successfully",
  "data": {
    "url": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Updated Title",
      "description": "Updated description",
      "tags": ["updated", "tags"],
      "isActive": true,
      "updatedAt": "2024-01-16T14:20:00.000Z"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "This custom code is already in use. Please choose a different one."
}
```

---

### 5. Delete URL

Delete a shortened URL permanently.

**Endpoint:** `DELETE /api/urls/:id`

**Headers:**
```
X-API-Key: your_api_key_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "URL not found"
}
```

---

### 6. Bulk Delete URLs

Delete multiple URLs at once.

**Endpoint:** `POST /api/urls/bulk-delete`

**Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key_here
```

**Request Body:**
```json
{
  "ids": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "3 URLs deleted successfully"
}
```

**Note:** This feature requires the `bulk_operations` permission (Pro/Enterprise plans).

---

### 7. Get URL Statistics

Get aggregated statistics for your URLs.

**Endpoint:** `GET /api/urls/stats`

**Headers:**
```
X-API-Key: your_api_key_here
```

**Success Response (200 OK):**
```json
{
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
      "topUrls": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "title": "Popular Link",
          "originalUrl": "https://example.com/page",
          "shortCode": "abc123",
          "clickCount": 350,
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  }
}
```

---

### 8. Get Available Domains

Get list of domains available for URL shortening.

**Endpoint:** `GET /api/urls/domains/available`

**Headers:**
```
X-API-Key: your_api_key_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "domains": [
      {
        "id": "base",
        "fullDomain": "laghhu.link",
        "domain": "laghhu.link",
        "subdomain": null,
        "isDefault": true,
        "shortUrl": "https://laghhu.link",
        "status": "active",
        "isSystemDomain": true
      },
      {
        "id": "507f1f77bcf86cd799439015",
        "fullDomain": "yourdomain.com",
        "domain": "yourdomain.com",
        "subdomain": null,
        "isDefault": false,
        "shortUrl": "https://yourdomain.com",
        "status": "active",
        "isSystemDomain": false
      }
    ]
  }
}
```

---

## Code Examples

### cURL

```bash
# Create a shortened URL
curl -X POST https://your-domain.com/api/urls \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "originalUrl": "https://example.com/very-long-url",
    "title": "My Link",
    "tags": ["api", "test"]
  }'

# Get all URLs
curl -X GET "https://your-domain.com/api/urls?page=1&limit=20" \
  -H "X-API-Key: your_api_key_here"

# Get single URL
curl -X GET https://your-domain.com/api/urls/507f1f77bcf86cd799439011 \
  -H "X-API-Key: your_api_key_here"

# Update URL
curl -X PUT https://your-domain.com/api/urls/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "title": "Updated Title",
    "isActive": true
  }'

# Delete URL
curl -X DELETE https://your-domain.com/api/urls/507f1f77bcf86cd799439011 \
  -H "X-API-Key: your_api_key_here"
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://your-domain.com/api';

// Create shortened URL
async function createShortUrl(originalUrl, options = {}) {
  try {
    const response = await axios.post(`${BASE_URL}/urls`, {
      originalUrl,
      ...options
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Get all URLs
async function getUrls(params = {}) {
  try {
    const response = await axios.get(`${BASE_URL}/urls`, {
      params,
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage examples
(async () => {
  // Create a short URL
  const result = await createShortUrl('https://example.com/long-url', {
    title: 'My Link',
    customCode: 'mylink',
    tags: ['api', 'test']
  });
  
  console.log('Short URL:', result.data.domain.shortUrl + '/' + result.data.url.shortCode);
  
  // Get all URLs
  const urls = await getUrls({ page: 1, limit: 20 });
  console.log('Total URLs:', urls.data.pagination.total);
})();
```

### Python

```python
import requests
import json

API_KEY = 'your_api_key_here'
BASE_URL = 'https://your-domain.com/api'

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
}

# Create shortened URL
def create_short_url(original_url, **options):
    data = {
        'originalUrl': original_url,
        **options
    }
    
    response = requests.post(
        f'{BASE_URL}/urls',
        headers=headers,
        json=data
    )
    
    return response.json()

# Get all URLs
def get_urls(**params):
    response = requests.get(
        f'{BASE_URL}/urls',
        headers={'X-API-Key': API_KEY},
        params=params
    )
    
    return response.json()

# Usage examples
if __name__ == '__main__':
    # Create a short URL
    result = create_short_url(
        'https://example.com/long-url',
        title='My Link',
        customCode='mylink',
        tags=['api', 'test']
    )
    
    short_url = f"{result['data']['domain']['shortUrl']}/{result['data']['url']['shortCode']}"
    print(f'Short URL: {short_url}')
    
    # Get all URLs
    urls = get_urls(page=1, limit=20)
    print(f"Total URLs: {urls['data']['pagination']['total']}")
```

### PHP

```php
<?php

$apiKey = 'your_api_key_here';
$baseUrl = 'https://your-domain.com/api';

// Create shortened URL
function createShortUrl($originalUrl, $options = []) {
    global $apiKey, $baseUrl;
    
    $data = array_merge(['originalUrl' => $originalUrl], $options);
    
    $ch = curl_init("$baseUrl/urls");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "X-API-Key: $apiKey"
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Get all URLs
function getUrls($params = []) {
    global $apiKey, $baseUrl;
    
    $queryString = http_build_query($params);
    $url = "$baseUrl/urls" . ($queryString ? "?$queryString" : '');
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "X-API-Key: $apiKey"
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Usage examples
$result = createShortUrl('https://example.com/long-url', [
    'title' => 'My Link',
    'customCode' => 'mylink',
    'tags' => ['api', 'test']
]);

$shortUrl = $result['data']['domain']['shortUrl'] . '/' . $result['data']['url']['shortCode'];
echo "Short URL: $shortUrl\n";

$urls = getUrls(['page' => 1, 'limit' => 20]);
echo "Total URLs: " . $urls['data']['pagination']['total'] . "\n";

?>
```

---

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions or usage limit exceeded |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Best Practices

1. **Secure Your API Key**
   - Never commit API keys to version control
   - Use environment variables to store keys
   - Rotate keys regularly

2. **Handle Rate Limits**
   - Implement exponential backoff for retries
   - Monitor rate limit headers
   - Cache responses when appropriate

3. **Error Handling**
   - Always check the `success` field in responses
   - Implement proper error handling for all API calls
   - Log errors for debugging

4. **Optimize Requests**
   - Use pagination for large datasets
   - Filter and search to reduce response size
   - Batch operations when possible (bulk delete)

5. **URL Validation**
   - Validate URLs before sending to API
   - Ensure URLs include protocol (http:// or https://)
   - Handle special characters properly

---

## Support

For API support, please contact:
- Email: support@your-domain.com
- Documentation: https://your-domain.com/docs
- Status Page: https://status.your-domain.com

---

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- URL creation, retrieval, update, and deletion
- API key authentication
- Usage limits and statistics
- Custom domain support
- UTM parameter tracking
- Geo-restrictions and device filtering
