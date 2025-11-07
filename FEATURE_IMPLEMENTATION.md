# QR Codes & Content Filter Implementation

## Overview
This document explains the complete implementation of two new features:
1. **QR Code Management** - Generate, customize, and manage QR codes for shortened URLs
2. **Content Filter** - Advanced URL filtering with domain/keyword blocking and whitelisting

Both features are fully integrated with the existing URL shortener backend and frontend.

---

## 1. QR Code Feature

### Database Models

#### QRCode Model (`src/models/QRCode.js`)
Stores QR code generation data and customization options.

**Schema Fields:**
- `url` - Reference to the URL document
- `creator` - User who created the QR code
- `options` - Customization settings (size, format, colors, error correction, margin, logo)
- `qrCodeData` - Generated QR code data (base64 or URL)
- `downloadCount` - Number of downloads
- `scanCount` - Number of scans (from URL redirects)
- `isActive` - Active status

**Key Methods:**
- `incrementDownloadCount()` - Track downloads
- `incrementScanCount()` - Track scans
- `getQRCodeServiceUrl()` - Generate external QR service URL

**Static Methods:**
- `getUserQRCodes(userId, options)` - Get all QR codes for a user
- `getUserStats(userId)` - Get QR code statistics
- `getOrCreate(urlId, userId, options)` - Get existing or create new QR code

### Service Layer

#### QRCodeService (`src/services/qrCodeService.js`)
Handles all QR code business logic.

**Core Methods:**

1. **generateQRCode(urlId, userId, options)**
   - Validates URL ownership
   - Generates QR code using `qrcode` npm package
   - Supports multiple formats: PNG, SVG, JPG, PDF
   - Applies customizations (size, colors, error correction)
   - Returns QR code data and download URL

2. **getQRCodeForDownload(urlId, userId, format)**
   - Retrieves or generates QR code
   - Increments download counter
   - Returns downloadable QR code URL

3. **bulkGenerateQRCodes(urlIds, userId, options)**
   - Generates QR codes for multiple URLs
   - Returns success/failure report for each URL

4. **deleteQRCode(urlId, userId)**
   - Removes QR code from database
   - Validates user ownership

5. **getQRCodeStats(userId)**
   - Returns statistics:
     - Total QR codes
     - Active QR codes
     - Downloads today
     - Total scans

**QR Code Generation:**
- Uses `qrcode` npm package for PNG/JPG/SVG generation
- Falls back to QR Server API for other formats
- Supports customization:
  - Size: 100-2000 pixels
  - Error correction: L (7%), M (15%), Q (25%), H (30%)
  - Foreground/background colors (hex)
  - Margin inclusion
  - Logo overlay (optional)

### Controller Layer

#### QRCodeController (`src/controllers/qrCodeController.js`)
Handles HTTP requests and responses.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qr-codes/generate/:linkId` | Generate QR code for a URL |
| GET | `/api/qr-codes/download/:linkId` | Get QR code download URL |
| POST | `/api/qr-codes/bulk-generate` | Bulk generate QR codes |
| DELETE | `/api/qr-codes/:linkId` | Delete QR code |
| GET | `/api/qr-codes` | Get user's QR codes |
| GET | `/api/qr-codes/stats` | Get QR code statistics |
| GET | `/api/qr-codes/:linkId` | Get QR code details |
| PUT | `/api/qr-codes/:linkId` | Update QR code options |

**Request/Response Examples:**

```javascript
// Generate QR Code
POST /api/qr-codes/generate/:linkId
Body: {
  "size": 300,
  "format": "png",
  "errorCorrection": "M",
  "foregroundColor": "#000000",
  "backgroundColor": "#FFFFFF",
  "includeMargin": true
}
Response: {
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qrCode": { /* QR code document */ },
    "shortUrl": "https://laghhu.link/abc123",
    "downloadUrl": "https://api.qrserver.com/..."
  }
}

// Get Statistics
GET /api/qr-codes/stats
Response: {
  "success": true,
  "totalQRCodes": 25,
  "activeQRCodes": 23,
  "downloadsToday": 12,
  "totalScans": 456
}
```

### Routes

#### QRCodes Routes (`src/routes/qrCodes.js`)
- All routes require authentication
- Rate limiting applied to generation endpoints
- RESTful API design

### Frontend Integration

The frontend (`Url_Shortener-main/src/components/QRCodes.js`) is already implemented and expects these APIs.

**Features:**
- Display all user URLs with QR code previews
- Generate QR codes with customization modal
- Download QR codes in multiple formats
- Bulk generation for multiple URLs
- Statistics dashboard
- Search and filter functionality

**API Calls Made by Frontend:**
```javascript
// Get stats
api.get("/qr-codes/stats")

// Get user URLs
api.get("/urls")

// Generate QR code
api.post(`/qr-codes/generate/${linkId}`, options)

// Download QR code
api.get(`/qr-codes/download/${linkId}?format=png`)

// Bulk generate
api.post("/qr-codes/bulk-generate", { linkIds, options })

// Delete QR code
api.delete(`/qr-codes/${linkId}`)
```

---

## 2. Content Filter Feature

### Database Models

#### ContentFilterSettings Model (`src/models/ContentFilterSettings.js`)
Stores user-specific content filtering preferences.

**Schema Fields:**
- `user` - User reference (unique)
- `enableContentFilter` - Master toggle for filtering
- `blockMaliciousUrls` - Block known malware/virus sites
- `blockPhishing` - Block phishing attempts
- `blockAdultContent` - Filter NSFW content
- `blockSpam` - Block spam URLs
- `customKeywordFiltering` - Enable keyword filtering
- `pdplCompliance` - Saudi Arabia PDPL compliance mode
- `enableWhitelist` - Use whitelist bypass
- `totalFiltered` - Count of filtered URLs

**Key Methods:**
- `incrementFilterCount()` - Track filtered URLs
- `isFilteringEnabled()` - Check if filtering is active
- `getActiveFilters()` - Get list of enabled filters

#### FilterList Models (`src/models/FilterList.js`)
Four models for managing filter lists:

1. **BlockedDomain** - User-specific blocked domains
   - `domain` - Normalized domain name
   - `reason` - Why blocked (malicious, phishing, spam, adult, manual)
   - `blockedCount` - Times this domain was blocked

2. **BlockedKeyword** - User-specific blocked keywords
   - `keyword` - Keyword or phrase
   - `caseSensitive` - Case sensitivity flag
   - `blockedCount` - Times this keyword triggered

3. **AllowedDomain** - Whitelisted domains
   - `domain` - Domain to always allow
   - `note` - Optional note

4. **FilterLog** - Activity logging
   - `url` - Filtered URL
   - `reason` - Filter reason (malicious, phishing, spam, adult, keyword, domain)
   - `message` - Log message
   - `filterType` - Type (domain, keyword, automatic, manual)
   - `severity` - Level (low, medium, high, critical)
   - Auto-expires after 90 days (TTL index)

### Service Layer

#### ContentFilterService (`src/services/contentFilterService.js`)
Handles URL validation and filtering logic.

**Core Methods:**

1. **validateUrl(urlString, userId)**
   - Main validation method called before URL creation
   - Returns: `{ allowed: boolean, reason: string, message: string }`

   **Validation Flow:**
   ```
   1. Check if filtering is enabled
   2. Parse and normalize URL
   3. Check whitelist (bypass if whitelisted)
   4. Check blocked domains
   5. Check blocked keywords
   6. Check for malicious patterns
   7. Check for phishing indicators
   8. Check for spam patterns
   9. Check for adult content
   10. Log any blocks
   11. Return validation result
   ```

2. **Filter Detection Methods:**
   - `checkMalicious(url, domain)` - Pattern-based malware detection
   - `checkPhishing(url, domain)` - Phishing detection (suspicious TLDs, patterns)
   - `checkSpam(url)` - Spam keyword detection
   - `checkAdultContent(url, domain)` - NSFW content detection

3. **List Management:**
   - `getBlockedDomains(userId)` - Get user's blocked domains
   - `addBlockedDomain(userId, domain, reason)` - Add to block list
   - `removeBlockedDomain(userId, domain)` - Remove from block list
   - `getBlockedKeywords(userId)` - Get blocked keywords
   - `addBlockedKeyword(userId, keyword, caseSensitive)` - Add keyword
   - `removeBlockedKeyword(userId, keyword)` - Remove keyword
   - `getAllowedDomains(userId)` - Get whitelist
   - `addAllowedDomain(userId, domain, note)` - Add to whitelist
   - `removeAllowedDomain(userId, domain)` - Remove from whitelist

4. **Settings & Stats:**
   - `getSettings(userId)` - Get filter settings
   - `updateSettings(userId, settings)` - Update settings
   - `getFilterLogs(userId, options)` - Get activity logs
   - `getFilterStats(userId)` - Get statistics

**Built-in Filters:**

```javascript
// Malicious patterns
/malware/i, /virus/i, /trojan/i, /ransomware/i, /exploit/i, /backdoor/i

// Phishing patterns
/phishing/i, /verify.*account/i, /suspend.*account/i, /confirm.*identity/i

// Spam patterns
/free.*money/i, /win.*prize/i, /click.*here.*now/i, /limited.*time.*offer/i

// Suspicious TLDs
.tk, .ml, .ga, .cf, .gq
```

### Controller Layer

#### ContentFilterController (`src/controllers/contentFilterController.js`)
Handles HTTP requests and responses.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content-filter/settings` | Get filter settings |
| PUT | `/api/content-filter/settings` | Update filter settings |
| GET | `/api/content-filter/blocked-domains` | Get blocked domains |
| POST | `/api/content-filter/blocked-domains` | Add blocked domain |
| DELETE | `/api/content-filter/blocked-domains/:domain` | Remove blocked domain |
| GET | `/api/content-filter/blocked-keywords` | Get blocked keywords |
| POST | `/api/content-filter/blocked-keywords` | Add blocked keyword |
| DELETE | `/api/content-filter/blocked-keywords/:keyword` | Remove blocked keyword |
| GET | `/api/content-filter/allowed-domains` | Get whitelist |
| POST | `/api/content-filter/allowed-domains` | Add to whitelist |
| DELETE | `/api/content-filter/allowed-domains/:domain` | Remove from whitelist |
| GET | `/api/content-filter/logs` | Get filter logs |
| GET | `/api/content-filter/stats` | Get statistics |
| POST | `/api/content-filter/validate` | Validate a URL |

**Request/Response Examples:**

```javascript
// Get Settings
GET /api/content-filter/settings
Response: {
  "enableContentFilter": true,
  "blockMaliciousUrls": true,
  "blockPhishing": true,
  "blockAdultContent": false,
  "blockSpam": true,
  "customKeywordFiltering": true,
  "pdplCompliance": true
}

// Add Blocked Domain
POST /api/content-filter/blocked-domains
Body: { "domain": "malicious-site.com", "reason": "malicious" }
Response: {
  "success": true,
  "message": "Domain added to blocked list",
  "data": { /* domain document */ }
}

// Get Statistics
GET /api/content-filter/stats
Response: {
  "totalFiltered": 45,
  "maliciousBlocked": 12,
  "phishingBlocked": 8,
  "spamBlocked": 20,
  "adultBlocked": 5
}

// Validate URL
POST /api/content-filter/validate
Body: { "url": "https://example.com" }
Response: {
  "allowed": false,
  "reason": "phishing",
  "message": "URL detected as potential phishing attempt"
}
```

### Routes

#### ContentFilter Routes (`src/routes/contentFilter.js`)
- All routes require authentication
- RESTful API design
- URL encoding support for domain/keyword parameters

### Frontend Integration

The frontend (`Url_Shortener-main/src/components/ContentFilter.js`) is already implemented.

**Features:**
- Settings management with toggles
- Blocked domains management (add/remove)
- Blocked keywords management (add/remove)
- Whitelist management
- Activity logs with filtering
- Statistics dashboard
- Four tabs: Settings, Blocked, Whitelist, Logs

**API Calls Made by Frontend:**
```javascript
// Settings
api.get("/content-filter/settings")
api.put("/content-filter/settings", settings)

// Domains
api.get("/content-filter/blocked-domains")
api.post("/content-filter/blocked-domains", { domain })
api.delete(`/content-filter/blocked-domains/${domain}`)

// Keywords
api.get("/content-filter/blocked-keywords")
api.post("/content-filter/blocked-keywords", { keyword })
api.delete(`/content-filter/blocked-keywords/${keyword}`)

// Whitelist
api.get("/content-filter/allowed-domains")
api.post("/content-filter/allowed-domains", { domain })
api.delete(`/content-filter/allowed-domains/${domain}`)

// Logs & Stats
api.get("/content-filter/logs")
api.get("/content-filter/stats")
```

---

## Integration with Existing Backend

### App.js Integration
Both route modules are registered in `src/app.js`:

```javascript
app.use('/api/qr-codes', require('./routes/qrCodes'));
app.use('/api/content-filter', require('./routes/contentFilter'));
```

### Dependencies Added
- `qrcode@^1.5.3` - QR code generation library

### Authentication
- Both features require user authentication via JWT
- Uses existing `authenticate` middleware from `src/middleware/auth.js`

### Rate Limiting
- QR code generation endpoints have rate limiting to prevent abuse
- Uses existing `rateLimiter` middleware

---

## How to Use

### Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```
   The `qrcode` package is now included in package.json

2. **Start Server:**
   ```bash
   npm run dev  # Development with nodemon
   ```

3. **Verify Routes:**
   Check server logs for route registration confirmation

### Testing QR Code Feature

1. **Generate QR Code:**
   ```bash
   curl -X POST http://localhost:3015/api/qr-codes/generate/:linkId \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "size": 300,
       "format": "png",
       "errorCorrection": "M",
       "foregroundColor": "#000000",
       "backgroundColor": "#FFFFFF"
     }'
   ```

2. **Get Statistics:**
   ```bash
   curl -X GET http://localhost:3015/api/qr-codes/stats \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Download QR Code:**
   ```bash
   curl -X GET http://localhost:3015/api/qr-codes/download/:linkId?format=png \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Testing Content Filter Feature

1. **Get Settings:**
   ```bash
   curl -X GET http://localhost:3015/api/content-filter/settings \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Update Settings:**
   ```bash
   curl -X PUT http://localhost:3015/api/content-filter/settings \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "enableContentFilter": true,
       "blockMaliciousUrls": true,
       "blockPhishing": true
     }'
   ```

3. **Add Blocked Domain:**
   ```bash
   curl -X POST http://localhost:3015/api/content-filter/blocked-domains \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{ "domain": "malicious-site.com" }'
   ```

4. **Validate URL:**
   ```bash
   curl -X POST http://localhost:3015/api/content-filter/validate \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{ "url": "https://example.com" }'
   ```

---

## Frontend Usage

### QR Codes Page
1. Navigate to `/qr-codes` in the application
2. View all your URLs with QR code previews
3. Click "Generate QR Code" to create a new one
4. Use "Customize Settings" to adjust QR code appearance
5. Download QR codes in various formats
6. View statistics at the top

### Content Filter Page
1. Navigate to `/content-filter` in the application
2. Use the tabs to switch between:
   - **Settings**: Toggle filters on/off
   - **Blocked**: Manage blocked domains and keywords
   - **Whitelist**: Manage allowed domains
   - **Logs**: View filter activity
3. View statistics at the top
4. Add/remove domains and keywords as needed

---

## Architecture & Design Patterns

### Layered Architecture
```
Frontend (React)
     ↓ HTTP/REST
Routes Layer (Express Router)
     ↓
Controller Layer (Request/Response handling)
     ↓
Service Layer (Business Logic)
     ↓
Model Layer (Mongoose ODM)
     ↓
Database (MongoDB)
```

### Design Patterns Used

1. **MVC Pattern** - Models, Controllers, Services separation
2. **Service Layer Pattern** - Business logic isolated in services
3. **Repository Pattern** - Model static methods for data access
4. **Factory Pattern** - QR code generation with multiple strategies
5. **Strategy Pattern** - Multiple filter validation strategies

### Error Handling
- All endpoints use try-catch blocks
- Consistent error response format
- Proper HTTP status codes
- User-friendly error messages

### Security
- Authentication required for all endpoints
- Input validation and sanitization
- Domain/keyword normalization
- SQL injection prevention (using Mongoose)
- XSS protection (via helmet)
- Rate limiting on resource-intensive endpoints

---

## Database Indexes

### QRCode Collection
- `{ creator: 1, createdAt: -1 }` - User queries
- `{ url: 1 }` - Unique constraint
- `{ isActive: 1 }` - Status filtering

### ContentFilterSettings Collection
- `{ user: 1 }` - Unique user settings

### BlockedDomain Collection
- `{ user: 1, domain: 1 }` - Unique user-domain pairs

### BlockedKeyword Collection
- `{ user: 1, keyword: 1 }` - Unique user-keyword pairs

### AllowedDomain Collection
- `{ user: 1, domain: 1 }` - Unique user-domain pairs

### FilterLog Collection
- `{ user: 1, timestamp: -1 }` - User activity logs
- `{ reason: 1 }` - Filter by reason
- `{ timestamp: 1 }` - TTL index (90 days auto-expire)

---

## Performance Considerations

### QR Code Feature
- QR codes generated on-demand or pre-generated
- Caching of generated QR codes in database
- External QR service used as fallback
- Download counter updated asynchronously

### Content Filter Feature
- Filter checks are lightweight (pattern matching)
- Whitelist checked first for early exit
- Logs auto-expire after 90 days (TTL index)
- Statistics aggregated via MongoDB aggregation pipeline

---

## Future Enhancements

### QR Code Feature
- [ ] Add QR code templates
- [ ] Support for logo overlay
- [ ] Batch download (ZIP)
- [ ] QR code analytics (scan location, device)
- [ ] Dynamic QR codes (editable destination)
- [ ] QR code expiration
- [ ] Custom frames and styles

### Content Filter Feature
- [ ] Machine learning-based URL classification
- [ ] Integration with Google Safe Browsing API
- [ ] Real-time phishing database updates
- [ ] Category-based filtering (e.g., gambling, violence)
- [ ] Scheduled domain list updates
- [ ] Import/export filter lists
- [ ] Team-shared filter lists
- [ ] Advanced regex pattern support
- [ ] URL reputation scoring

---

## Troubleshooting

### QR Code Issues

**Problem:** QR code generation fails
- Check if `qrcode` npm package is installed
- Verify URL exists and user has access
- Check QR code size is within 100-2000 range
- Ensure color values are valid hex codes

**Problem:** Download URL not working
- Verify external QR service (qrserver.com) is accessible
- Check if short URL is properly formatted
- Ensure user is authenticated

### Content Filter Issues

**Problem:** URLs not being filtered
- Check if content filtering is enabled in settings
- Verify filter rules are properly saved
- Check filter logs to see if validation was triggered
- Ensure domain normalization is working

**Problem:** Too many false positives
- Adjust filter sensitivity in settings
- Add domains to whitelist
- Review and refine keyword list
- Check filter logs for patterns

---

## API Documentation Summary

### QR Code Endpoints
- 8 endpoints total
- All require authentication
- Support for PNG, SVG, PDF, JPG formats
- Bulk operations supported
- Statistics and analytics included

### Content Filter Endpoints
- 13 endpoints total
- All require authentication
- CRUD operations for all filter lists
- Real-time URL validation
- Activity logging with auto-expiration

---

## Conclusion

Both features are fully implemented with:
✅ Complete backend API
✅ Database models with proper indexes
✅ Service layer with business logic
✅ Controllers with error handling
✅ Routes integrated into main app
✅ Authentication and authorization
✅ Rate limiting and security
✅ Frontend already implemented
✅ Comprehensive documentation

The implementation follows best practices for Node.js/Express applications with proper separation of concerns, error handling, and security measures.
