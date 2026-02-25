# URL Shortener API Documentation

Welcome to the URL Shortener API documentation! This guide will help you integrate our URL shortening service into your applications.

## 📚 Documentation Files

### [API Quick Start Guide](./API_QUICKSTART.md)
Get up and running in 5 minutes. Perfect for developers who want to start using the API immediately.

**What's included:**
- How to get your API key
- Your first API request
- Common use cases with examples
- Error handling basics

### [Complete API Documentation](./API_DOCUMENTATION.md)
Comprehensive reference for all API endpoints, parameters, and responses.

**What's included:**
- All API endpoints with detailed descriptions
- Request/response examples
- Authentication methods
- Rate limits and usage quotas
- Code examples in multiple languages (cURL, JavaScript, Python, PHP)
- Error handling and status codes
- Best practices

### [Postman Collection](./URL_Shortener_API.postman_collection.json)
Import this collection into Postman to test all API endpoints interactively.

**How to use:**
1. Download the JSON file
2. Open Postman
3. Click "Import" → "Upload Files"
4. Select the JSON file
5. Update the `API_KEY` variable with your actual API key
6. Start testing!

## 🚀 Quick Links

- **Get Started:** [API Quick Start](./API_QUICKSTART.md)
- **Full Reference:** [API Documentation](./API_DOCUMENTATION.md)
- **Test API:** [Postman Collection](./URL_Shortener_API.postman_collection.json)

## 🔑 Getting Your API Key

1. Log in to your account
2. Navigate to **Profile** → **API Keys**
3. Click **"Regenerate API Key"**
4. Copy and securely store your API key

## 📖 Basic Usage

### Create a Short URL

```bash
curl -X POST https://your-domain.com/api/urls \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"originalUrl": "https://example.com/long-url"}'
```

### Get All URLs

```bash
curl -X GET https://your-domain.com/api/urls \
  -H "X-API-Key: YOUR_API_KEY"
```

## 🎯 Key Features

- ✅ **Simple REST API** - Easy to integrate with any programming language
- ✅ **Custom Short Codes** - Create branded, memorable links
- ✅ **UTM Tracking** - Built-in support for campaign tracking
- ✅ **Password Protection** - Secure your links
- ✅ **Expiration Dates** - Set automatic link expiry
- ✅ **Geo-Restrictions** - Control access by country
- ✅ **Device Filtering** - Target specific devices
- ✅ **Bulk Operations** - Manage multiple URLs at once
- ✅ **Custom Domains** - Use your own domain for short links
- ✅ **Analytics** - Track clicks and performance

## 📊 API Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/urls` | POST | Create a shortened URL |
| `/api/urls` | GET | Get all URLs (paginated) |
| `/api/urls/:id` | GET | Get single URL details |
| `/api/urls/:id` | PUT | Update URL properties |
| `/api/urls/:id` | DELETE | Delete a URL |
| `/api/urls/bulk-delete` | POST | Delete multiple URLs |
| `/api/urls/stats` | GET | Get URL statistics |
| `/api/urls/domains/available` | GET | Get available domains |

## 🔐 Authentication

The API supports two authentication methods:

### API Key (Recommended)
```
X-API-Key: your_api_key_here
```

### Bearer Token (JWT)
```
Authorization: Bearer your_jwt_token
```

## 📈 Rate Limits

| Plan | URLs/Month | API Calls/15min |
|------|------------|-----------------|
| Free | 100 | 100 |
| Pro | 1,000 | 1,000 |
| Enterprise | Unlimited | 5,000 |

## 💡 Code Examples

### JavaScript (Node.js)
```javascript
const axios = require('axios');

const response = await axios.post('https://your-domain.com/api/urls', {
  originalUrl: 'https://example.com/page',
  customCode: 'mylink',
  title: 'My Link'
}, {
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
});

console.log('Short URL:', response.data.data.domain.shortUrl + '/' + response.data.data.url.shortCode);
```

### Python
```python
import requests

response = requests.post(
    'https://your-domain.com/api/urls',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    json={
        'originalUrl': 'https://example.com/page',
        'customCode': 'mylink',
        'title': 'My Link'
    }
)

data = response.json()
short_url = f"{data['data']['domain']['shortUrl']}/{data['data']['url']['shortCode']}"
print(f'Short URL: {short_url}')
```

### PHP
```php
<?php
$ch = curl_init('https://your-domain.com/api/urls');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'originalUrl' => 'https://example.com/page',
    'customCode' => 'mylink',
    'title' => 'My Link'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-Key: YOUR_API_KEY'
]);

$response = curl_exec($ch);
$data = json_decode($response, true);
$shortUrl = $data['data']['domain']['shortUrl'] . '/' . $data['data']['url']['shortCode'];
echo "Short URL: $shortUrl\n";
?>
```

## 🛠️ SDKs and Libraries

Currently, we don't have official SDKs, but the API is simple REST and works with any HTTP client library:

- **JavaScript/Node.js:** axios, fetch, node-fetch
- **Python:** requests, httpx, aiohttp
- **PHP:** cURL, Guzzle
- **Ruby:** HTTParty, Faraday
- **Go:** net/http, resty
- **Java:** OkHttp, Apache HttpClient

## ❓ Common Use Cases

### 1. Marketing Campaigns
Create trackable links with UTM parameters for email, social media, and advertising campaigns.

### 2. Social Media Sharing
Generate short, branded links that are perfect for Twitter, Instagram, and other platforms with character limits.

### 3. QR Codes
Create short URLs that work great in QR codes for print materials, packaging, and events.

### 4. Link Management
Organize and manage all your links in one place with tags, search, and filtering.

### 5. A/B Testing
Create multiple short links to the same destination with different UTM parameters to test campaigns.

### 6. Time-Limited Offers
Set expiration dates on links for flash sales, limited-time promotions, or event registrations.

### 7. Secure Content
Use password protection and geo-restrictions to control who can access your content.

## 🐛 Troubleshooting

### Common Issues

**401 Unauthorized**
- Check that your API key is correct
- Ensure the `X-API-Key` header is included
- Verify your account is active

**403 Forbidden**
- You may have exceeded your usage limits
- Check your plan's monthly URL quota
- Upgrade your plan if needed

**400 Bad Request**
- Validate your URL format (must include http:// or https://)
- Check that custom codes are alphanumeric
- Ensure required fields are provided

**429 Too Many Requests**
- You've hit the rate limit
- Wait before making more requests
- Implement exponential backoff

## 📞 Support

Need help? We're here for you!

- 📧 **Email:** support@your-domain.com
- 📚 **Documentation:** https://your-domain.com/docs
- 💬 **Community:** https://community.your-domain.com
- 🐛 **Bug Reports:** https://github.com/your-repo/issues

## 🔄 API Versioning

Current version: **v1**

We follow semantic versioning and will announce any breaking changes well in advance. The API version is included in the base URL path.

## 📝 Changelog

### v1.0.0 (Current)
- Initial API release
- URL creation, retrieval, update, and deletion
- Custom codes and domains
- UTM tracking
- Password protection
- Geo-restrictions
- Usage statistics

## 🔒 Security

- All API requests must use HTTPS
- API keys should be kept secure and never committed to version control
- Rotate your API keys regularly
- Use environment variables to store sensitive data
- Implement rate limiting in your application

## 📄 License

This API documentation is provided under the same license as the URL Shortener service.

---

**Ready to get started?** Check out the [Quick Start Guide](./API_QUICKSTART.md)!
