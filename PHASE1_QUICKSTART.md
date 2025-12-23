# Phase 1 Features - Quick Start Guide

## 🚀 Installation & Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd url-shortner
npm install
```

### Step 2: Run Setup Script
```bash
node scripts/setup-phase1.js
```

This will:
- Create database indexes
- Verify collections
- Display feature summary

### Step 3: Restart Server
```bash
npm run dev
```

The server will now include:
- `/api/bio-pages` - Bio link pages
- `/api/bundles` - Link bundles
- `/api/health` - Health monitoring
- Health check cron job (runs every 15 minutes)

---

## 🎯 Feature 1: Bio Link Pages (5 minutes)

### Create Your First Bio Page

```bash
curl -X POST http://localhost:4000/api/bio-pages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "johndoe",
    "title": "John Doe",
    "bio": "Welcome to my page! 👋",
    "profileImage": "https://i.pravatar.cc/300",
    "theme": {
      "layout": "modern",
      "backgroundColor": "#ffffff",
      "buttonColor": "#3B82F6",
      "buttonStyle": "fill",
      "fontFamily": "inter"
    },
    "links": [
      {
        "title": "My Website",
        "url": "https://example.com",
        "icon": "link",
        "enabled": true,
        "order": 0
      },
      {
        "title": "YouTube Channel",
        "url": "https://youtube.com/@username",
        "icon": "youtube",
        "enabled": true,
        "order": 1
      }
    ],
    "socialLinks": {
      "twitter": "johndoe",
      "instagram": "johndoe",
      "linkedin": "johndoe"
    },
    "settings": {
      "isPublished": true,
      "showBranding": true,
      "collectEmails": true
    }
  }'
```

### View Your Bio Page

Public URL: `http://localhost:4000/api/bio-pages/public/johndoe`

Or get your own:
```bash
curl http://localhost:4000/api/bio-pages/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Your Bio Page

```bash
curl -X PUT http://localhost:4000/api/bio-pages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "John Doe - Updated",
    "bio": "New bio text",
    "theme": {
      "buttonColor": "#10B981"
    }
  }'
```

---

## 📦 Feature 2: Link Bundles (5 minutes)

### Create a Bundle

```bash
curl -X POST http://localhost:4000/api/bundles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday Campaign",
    "slug": "black-friday-2024",
    "description": "All Black Friday promotional links",
    "color": "#DC2626",
    "icon": "tag",
    "tags": ["campaign", "sale", "2024"],
    "settings": {
      "isPublic": false,
      "allowExport": true
    }
  }'
```

### Add Links to Bundle

First, get your URL IDs:
```bash
curl http://localhost:4000/api/urls \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Then add to bundle:
```bash
curl -X POST http://localhost:4000/api/bundles/BUNDLE_ID/links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "linkId": "URL_ID_HERE"
  }'
```

### View Bundle Analytics

```bash
curl http://localhost:4000/api/bundles/BUNDLE_ID/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Export Bundle

```bash
# JSON format
curl http://localhost:4000/api/bundles/BUNDLE_ID/export \
  -H "Authorization: Bearer YOUR_TOKEN"

# CSV format
curl "http://localhost:4000/api/bundles/BUNDLE_ID/export?format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Feature 3: Enhanced Social Previews (2 minutes)

### Create URL with Social Preview

```bash
curl -X POST http://localhost:4000/api/urls \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com/product",
    "title": "Amazing Product",
    "socialPreview": {
      "enabled": true,
      "title": "Check out this amazing product! 🎉",
      "description": "Limited time offer - 50% off everything!",
      "image": "https://example.com/preview-image.jpg",
      "twitter": {
        "card": "summary_large_image",
        "site": "@mycompany",
        "creator": "@johndoe"
      },
      "facebook": {
        "title": "Special Facebook Title",
        "description": "Facebook-specific description",
        "type": "product"
      }
    }
  }'
```

### Update Existing URL with Social Preview

```bash
curl -X PUT http://localhost:4000/api/urls/URL_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "socialPreview": {
      "enabled": true,
      "title": "New Preview Title",
      "description": "New preview description",
      "image": "https://example.com/new-image.jpg"
    }
  }'
```

---

## 🏥 Feature 4: Link Health Monitoring (5 minutes)

### Enable Health Monitoring

```bash
curl -X POST http://localhost:4000/api/health/URL_ID/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkInterval": 60,
    "notifyOnFailure": true,
    "failureThreshold": 3
  }'
```

### Trigger Manual Health Check

```bash
curl -X POST http://localhost:4000/api/health/URL_ID/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Health Status

```bash
curl http://localhost:4000/api/health/URL_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View All Monitored Links

```bash
# All monitored links
curl http://localhost:4000/api/health/monitored \
  -H "Authorization: Bearer YOUR_TOKEN"

# Only unhealthy links
curl "http://localhost:4000/api/health/monitored?status=unhealthy" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Alerts

```bash
# All alerts
curl http://localhost:4000/api/health/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Unacknowledged alerts only
curl "http://localhost:4000/api/health/alerts?acknowledged=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Acknowledge Alert

```bash
curl -X POST http://localhost:4000/api/health/URL_ID/alerts/ALERT_ID/acknowledge \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Testing Checklist

### Bio Pages
- [ ] Create bio page
- [ ] View public bio page
- [ ] Update bio page
- [ ] Add links
- [ ] Track link clicks
- [ ] Collect email subscribers
- [ ] View analytics

### Link Bundles
- [ ] Create bundle
- [ ] Add links to bundle
- [ ] Remove links from bundle
- [ ] View bundle analytics
- [ ] Export bundle (JSON)
- [ ] Export bundle (CSV)
- [ ] Make bundle public

### Social Previews
- [ ] Create URL with social preview
- [ ] Update social preview
- [ ] Test Twitter preview
- [ ] Test Facebook preview
- [ ] Test LinkedIn preview

### Health Monitoring
- [ ] Enable monitoring
- [ ] Trigger manual check
- [ ] View health status
- [ ] Receive email alert (test with broken URL)
- [ ] View alerts
- [ ] Acknowledge alert
- [ ] Disable monitoring

---

## 📱 Frontend Integration Examples

### React - Bio Page Editor

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BioPageEditor = () => {
  const [bioPage, setBioPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBioPage();
  }, []);

  const fetchBioPage = async () => {
    try {
      const response = await axios.get('/api/bio-pages/me');
      setBioPage(response.data.data.bioPage);
    } catch (error) {
      console.error('Error fetching bio page:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBioPage = async (updates) => {
    try {
      await axios.put('/api/bio-pages', updates);
      fetchBioPage();
    } catch (error) {
      console.error('Error updating bio page:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Edit Bio Page</h1>
      {/* Your editor UI here */}
    </div>
  );
};

export default BioPageEditor;
```

### React - Link Bundle Manager

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LinkBundleManager = () => {
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    const response = await axios.get('/api/bundles');
    setBundles(response.data.data.bundles);
  };

  const createBundle = async (bundleData) => {
    const response = await axios.post('/api/bundles', bundleData);
    setBundles([...bundles, response.data.data.bundle]);
  };

  const addLinkToBundle = async (bundleId, linkId) => {
    await axios.post(`/api/bundles/${bundleId}/links`, { linkId });
    fetchBundles();
  };

  return (
    <div>
      <h1>Link Bundles</h1>
      {/* Your bundle manager UI here */}
    </div>
  );
};

export default LinkBundleManager;
```

### React - Health Monitoring Dashboard

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HealthMonitoringDashboard = () => {
  const [monitoredLinks, setMonitoredLinks] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchMonitoredLinks();
    fetchAlerts();
  }, []);

  const fetchMonitoredLinks = async () => {
    const response = await axios.get('/api/health/monitored');
    setMonitoredLinks(response.data.data.monitoredLinks);
  };

  const fetchAlerts = async () => {
    const response = await axios.get('/api/health/alerts?acknowledged=false');
    setAlerts(response.data.data.alerts);
  };

  const triggerCheck = async (urlId) => {
    await axios.post(`/api/health/${urlId}/check`);
    fetchMonitoredLinks();
  };

  return (
    <div>
      <h1>Health Monitoring</h1>
      <div>
        <h2>Unacknowledged Alerts: {alerts.length}</h2>
        {/* Display alerts */}
      </div>
      <div>
        <h2>Monitored Links</h2>
        {/* Display monitored links */}
      </div>
    </div>
  );
};

export default HealthMonitoringDashboard;
```

---

## 🎨 UI Component Ideas

### Bio Page Themes
- Classic: Traditional vertical list
- Modern: Card-based with shadows
- Minimal: Clean, simple design
- Card: Individual cards per link
- Gradient: Colorful gradient backgrounds

### Link Bundle Colors
- Red: #DC2626 (Campaigns, urgent)
- Blue: #3B82F6 (General, default)
- Green: #10B981 (Success, completed)
- Purple: #7C3AED (Premium, special)
- Orange: #F59E0B (Warning, attention)

### Health Status Indicators
- Healthy: Green checkmark ✓
- Unhealthy: Red X ✗
- Checking: Yellow spinner ⟳
- Unknown: Gray question mark ?

---

## 🐛 Common Issues & Solutions

### Issue: Bio page slug already taken
**Solution**: Check slug availability first:
```bash
curl http://localhost:4000/api/bio-pages/check-slug/username \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: Health checks not running
**Solution**: 
1. Check server logs for cron job initialization
2. Verify `settings.enabled` is `true`
3. Restart server to reinitialize cron jobs

### Issue: Email alerts not sending
**Solution**:
1. Verify SMTP settings in `.env`
2. Check `settings.notifyOnFailure` is `true`
3. Test with a broken URL to trigger alert

### Issue: Bundle export returns empty
**Solution**:
1. Ensure bundle has links added
2. Check `settings.allowExport` is `true`
3. Verify user owns the bundle

---

## 📚 Additional Resources

- **Full Documentation**: See `PHASE1_FEATURES.md`
- **API Reference**: Check each controller file
- **Database Models**: See `src/models/` directory
- **Example Requests**: See curl commands above

---

## 🎉 You're All Set!

Phase 1 features are now ready to use. Start building amazing link management experiences!

**Next Steps:**
1. Build frontend components
2. Test all features thoroughly
3. Customize themes and colors
4. Set up health monitoring for critical links
5. Create your first bio page!

---

**Need Help?**
- Check the full documentation in `PHASE1_FEATURES.md`
- Review the API endpoints
- Test with the provided curl commands
- Check server logs for errors

Happy coding! 🚀
