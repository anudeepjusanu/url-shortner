# 🚀 Startup Guide - QR Codes & Content Filter Features

## ⚠️ Important: Fix 404 Errors

If you're getting **404 errors** when clicking on QR Codes or Content Filter pages, follow these steps:

---

## 📋 Prerequisites

1. **MongoDB** - Must be running on `mongodb://localhost:27017`
2. **Node.js** - Version 14+ installed
3. **Backend & Frontend** - Separate terminal windows for each

---

## 🔧 Step 1: Install Frontend Dependencies

```bash
cd /home/user/url-shortner/Url_Shortener-main
npm install
```

Or if using yarn:
```bash
yarn install
```

---

## 🔧 Step 2: Start Backend Server

### Terminal 1 (Backend):

```bash
cd /home/user/url-shortner

# Make sure dependencies are installed (already done if you see qrcode in package.json)
npm install

# Start the backend server
npm run dev
```

**Expected Output:**
```
🚀 Server running on localhost:3015
⚙️ Environment: development
❤️ Health check: http://localhost:3015/health
```

**Verify Backend is Running:**
Open browser and go to: http://localhost:3015/health

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-11-07T...",
  "uptime": 123.45,
  "environment": "development"
}
```

---

## 🔧 Step 3: Start Frontend Application

### Terminal 2 (Frontend):

```bash
cd /home/user/url-shortner/Url_Shortener-main

# Start the React app
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view url-shortener-ui in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**⚠️ IMPORTANT:** If the React app was already running, **you MUST restart it** to pick up the new `.env` file configuration!

---

## ✅ Step 4: Verify Everything Works

### Test Backend APIs:

1. **QR Codes Stats Endpoint:**
   ```bash
   curl -X GET http://localhost:3015/api/qr-codes/stats \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Content Filter Settings Endpoint:**
   ```bash
   curl -X GET http://localhost:3015/api/content-filter/settings \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Test Frontend:

1. Open browser: http://localhost:3000
2. Login to your account
3. Navigate to **QR Codes** page
4. Navigate to **Content Filter** page

**No more 404 errors!** ✅

---

## 🔍 Configuration Files

### Backend `.env` (Already Configured)
```env
PORT=3015
HOST=localhost
MONGODB_URI=mongodb://localhost:27017/url-shortener
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
BASE_URL=http://localhost:3015
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

### Frontend `.env` (Already Created)
```env
REACT_APP_API_URL=http://localhost:3015/api
```

**Location:** `/home/user/url-shortner/Url_Shortener-main/.env`

---

## 🐛 Troubleshooting

### Issue: Still Getting 404 Errors

**Solution:**
1. Stop the frontend React app (Ctrl + C)
2. Make sure `.env` file exists in `Url_Shortener-main/` folder
3. Restart the React app: `npm start`
4. Clear browser cache or use Incognito mode

### Issue: CORS Errors

**Solution:**
1. Check backend `.env` has `ALLOWED_ORIGINS=http://localhost:3000`
2. Restart backend server
3. Clear browser cache

### Issue: "Network Error" in Frontend

**Solution:**
1. Verify backend is running: http://localhost:3015/health
2. Check backend logs for errors
3. Ensure MongoDB is running: `mongod --version`
4. Check CORS configuration

### Issue: Authentication Required Errors

**Solution:**
1. Make sure you're logged in
2. Check if JWT token is stored in localStorage
3. Token might be expired - login again

### Issue: MongoDB Connection Error

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# If not running, start it:
sudo systemctl start mongod

# Or run MongoDB manually:
mongod --dbpath /data/db
```

---

## 📊 Available API Endpoints

### QR Code Endpoints (8 total)
```
POST   /api/qr-codes/generate/:linkId      - Generate QR code
GET    /api/qr-codes/download/:linkId      - Download QR code
POST   /api/qr-codes/bulk-generate         - Bulk generation
DELETE /api/qr-codes/:linkId               - Delete QR code
GET    /api/qr-codes                       - List all QR codes
GET    /api/qr-codes/stats                 - Get statistics
GET    /api/qr-codes/:linkId               - Get details
PUT    /api/qr-codes/:linkId               - Update options
```

### Content Filter Endpoints (13 total)
```
GET    /api/content-filter/settings        - Get settings
PUT    /api/content-filter/settings        - Update settings
GET    /api/content-filter/blocked-domains - List blocked domains
POST   /api/content-filter/blocked-domains - Add blocked domain
DELETE /api/content-filter/blocked-domains/:domain
GET    /api/content-filter/blocked-keywords - List blocked keywords
POST   /api/content-filter/blocked-keywords - Add blocked keyword
DELETE /api/content-filter/blocked-keywords/:keyword
GET    /api/content-filter/allowed-domains  - List whitelist
POST   /api/content-filter/allowed-domains  - Add to whitelist
DELETE /api/content-filter/allowed-domains/:domain
GET    /api/content-filter/logs             - Activity logs
GET    /api/content-filter/stats            - Statistics
POST   /api/content-filter/validate         - Validate URL
```

---

## 🎯 Quick Test

### Test QR Code Generation:

1. Login to the app
2. Create a short URL first (if you don't have any)
3. Go to **QR Codes** page
4. Click **"Generate QR Code"**
5. Select a URL from the list
6. QR code should be generated successfully!

### Test Content Filter:

1. Login to the app
2. Go to **Content Filter** page
3. Click **"Settings"** tab
4. Toggle some filters on/off
5. Click **"Save Settings"**
6. Go to **"Blocked"** tab
7. Add a test domain: `malicious-site.com`
8. Check **"Logs"** tab to see activity

---

## 📝 Development Workflow

### Starting Development:

```bash
# Terminal 1: Backend
cd /home/user/url-shortner
npm run dev

# Terminal 2: Frontend
cd /home/user/url-shortner/Url_Shortener-main
npm start

# Terminal 3: MongoDB (if not running as service)
mongod
```

### Making Changes:

1. Backend changes: Edit files in `/home/user/url-shortner/src/`
   - Server auto-restarts with nodemon
2. Frontend changes: Edit files in `/home/user/url-shortner/Url_Shortener-main/src/`
   - React auto-reloads in browser

---

## 🔐 Environment Variables Explained

### Backend Environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `3015` |
| `HOST` | Server host | `localhost` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/url-shortener` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your_jwt_secret_key` |
| `BASE_URL` | Base URL for short links | `http://localhost:3015` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000` |

### Frontend Environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:3015/api` |

---

## ✅ Success Checklist

- [ ] MongoDB is running
- [ ] Backend server started on port 3015
- [ ] Backend health check responds: http://localhost:3015/health
- [ ] Frontend dependencies installed
- [ ] Frontend `.env` file exists with correct API URL
- [ ] Frontend app restarted after `.env` creation
- [ ] Frontend running on port 3000
- [ ] Logged in to the application
- [ ] QR Codes page loads without 404 errors
- [ ] Content Filter page loads without 404 errors
- [ ] Can generate QR codes successfully
- [ ] Can update filter settings successfully

---

## 🎉 You're All Set!

Both features should now work perfectly. The 404 errors were caused by:
1. Frontend trying to connect to production URL (`https://laghhu.link/api`)
2. Should connect to local backend (`http://localhost:3015/api`)
3. Fixed by creating `.env` file and restarting React app

**Need more help?** Check `FEATURE_IMPLEMENTATION.md` for detailed API documentation.

---

## 📚 Additional Resources

- **Feature Documentation**: `/home/user/url-shortner/FEATURE_IMPLEMENTATION.md`
- **Backend Source**: `/home/user/url-shortner/src/`
- **Frontend Source**: `/home/user/url-shortner/Url_Shortener-main/src/`
- **API Client**: `/home/user/url-shortner/Url_Shortener-main/src/services/api.js`

---

**Last Updated:** November 7, 2025
**Branch:** `claude/qr-codes-content-filter-011CUtBFsBRiNWy5R6iyB99M`
