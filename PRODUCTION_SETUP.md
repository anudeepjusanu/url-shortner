# Production Setup Guide

This guide walks you through deploying the URL Shortener to production with all enterprise features enabled.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Payment Gateway Configuration](#payment-gateway-configuration)
5. [Super Admin Initialization](#super-admin-initialization)
6. [Application Deployment](#application-deployment)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to production, ensure you have:

- **Node.js** v16+ installed
- **MongoDB** v5+ (local or cloud instance like MongoDB Atlas)
- **Redis** v6+ for caching (optional but recommended)
- **Domain** configured with DNS access
- **SSL Certificate** for HTTPS
- **Payment Gateway Accounts**:
  - Stripe account (for international payments)
  - Moyasar account (for Saudi Arabia/GCC payments)

## Environment Configuration

### 1. Create Production Environment File

Copy the template and configure for production:

```bash
cp .env.production.template .env.production
```

### 2. Configure Essential Variables

Edit `.env.production` with your production values:

```env
# Application
NODE_ENV=production
PORT=3015
APP_URL=https://laghhu.link
FRONTEND_URL=https://laghhu.link

# Database
MONGO_URI=mongodb://your-mongo-host:27017/url-shortener
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/url-shortener

# Redis (optional but recommended)
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your-redis-password

# Security
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars
SESSION_SECRET=your-super-secure-session-secret

# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# Moyasar Payment Gateway
MOYASAR_API_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
MOYASAR_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
MOYASAR_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx

# Default Payment Gateway (stripe or moyasar)
DEFAULT_PAYMENT_GATEWAY=moyasar

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/url-shortener

# Email (for invoice sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@laghhu.link

# Backup
BACKUP_DIR=/var/backups/url-shortener
BACKUP_RETENTION=30
S3_BUCKET=your-backup-bucket
AWS_REGION=us-east-1
```

### 3. Secure Environment File

```bash
chmod 600 .env.production
```

## Database Setup

### 1. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended)

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Configure network access (whitelist your server IP)
4. Create a database user
5. Get your connection string and add it to `.env.production`

#### Option B: Self-Hosted MongoDB

1. Install MongoDB on your server
2. Configure MongoDB for production:

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf
```

Enable authentication and configure security settings.

### 2. Initialize Database Indexes

```bash
npm run migrate  # If you have migrations
```

## Payment Gateway Configuration

### 1. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Go to Developers > API keys
3. Copy your Live API keys to `.env.production`
4. Configure webhook endpoint:
   - URL: `https://laghhu.link/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.failed`, `customer.subscription.updated`, etc.
5. Copy webhook signing secret to `.env.production`

### 2. Moyasar Setup

1. Create a Moyasar account at https://moyasar.com
2. Complete KYC verification
3. Go to Settings > API Keys
4. Copy your Live API keys to `.env.production`
5. Configure webhook endpoint:
   - URL: `https://laghhu.link/api/webhooks/moyasar`
6. Test Mada and STC Pay integrations

## Super Admin Initialization

Create the initial super admin account:

```bash
# Interactive mode
node scripts/init-super-admin.js

# Or with environment variables
SUPER_ADMIN_EMAIL=admin@laghhu.link \
SUPER_ADMIN_PASSWORD=YourSecurePassword123! \
SUPER_ADMIN_NAME="Super Admin" \
node scripts/init-super-admin.js
```

**Important**: Save the super admin credentials securely!

## Application Deployment

### 1. Install Dependencies

```bash
npm ci --production
```

### 2. Build Frontend

```bash
cd Url_Shortener-main
npm ci
npm run build:prod
cd ..
```

### 3. Start Application

#### Option A: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### Option B: systemd Service

Create `/etc/systemd/system/url-shortener.service`:

```ini
[Unit]
Description=URL Shortener Application
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/url-shortener
EnvironmentFile=/var/www/url-shortener/.env.production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable url-shortener
sudo systemctl start url-shortener
sudo systemctl status url-shortener
```

### 4. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/laghhu.link`:

```nginx
upstream url_shortener {
    server 127.0.0.1:3015;
}

server {
    listen 80;
    listen [::]:80;
    server_name laghhu.link www.laghhu.link;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name laghhu.link www.laghhu.link;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/laghhu.link/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/laghhu.link/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/laghhu.link-access.log;
    error_log /var/log/nginx/laghhu.link-error.log;

    # Proxy to Node.js application
    location / {
        proxy_pass http://url_shortener;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static {
        alias /var/www/url-shortener/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/laghhu.link /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d laghhu.link -d www.laghhu.link
```

## Monitoring and Logging

### 1. Application Logs

Logs are stored in the directory specified by `LOG_DIR`:

```bash
# View application logs
tail -f /var/log/url-shortener/application-*.log

# View error logs
tail -f /var/log/url-shortener/errors-*.log

# View payment logs
tail -f /var/log/url-shortener/payment-*.log
```

### 2. PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# View specific log
pm2 logs url-shortener --lines 100
```

### 3. Setup Log Rotation

Create `/etc/logrotate.d/url-shortener`:

```
/var/log/url-shortener/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup and Recovery

### 1. Setup Automated Backups

Add to crontab:

```bash
crontab -e
```

Add daily backup at 2 AM:

```cron
0 2 * * * /var/www/url-shortener/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

### 2. Manual Backup

```bash
./scripts/backup-database.sh
```

### 3. Restore from Backup

```bash
./scripts/restore-database.sh backup_url-shortener_20240115_120000.tar.gz
```

### 4. S3 Backup Configuration

Ensure AWS CLI is configured and S3 bucket is created:

```bash
aws configure
aws s3 mb s3://your-backup-bucket
```

## Security Considerations

### 1. Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### 2. MongoDB Security

- Enable authentication
- Use strong passwords
- Limit network access
- Enable encryption at rest (for Atlas)

### 3. Application Security

- Keep dependencies updated: `npm audit fix`
- Use HTTPS only
- Implement rate limiting
- Validate all user inputs
- Sanitize database queries

### 4. Payment Gateway Security

- Use webhook secrets
- Verify webhook signatures
- Store API keys securely
- Use environment variables only
- Never commit secrets to git

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs url-shortener

# Check environment variables
pm2 env 0

# Restart application
pm2 restart url-shortener
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh "your-connection-string"

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Payment Gateway Issues

1. Check API keys are correct
2. Verify webhook endpoints are accessible
3. Check webhook signatures
4. Review payment gateway logs
5. Test with test mode first

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

## Health Checks

Create a monitoring script to check application health:

```bash
#!/bin/bash
curl -f http://localhost:3015/api/health || exit 1
```

## Performance Optimization

1. Enable Redis caching
2. Use CDN for static assets
3. Enable gzip compression
4. Optimize database queries
5. Monitor and optimize slow endpoints

## Support and Maintenance

- Regularly update dependencies
- Monitor error logs
- Review payment transactions
- Backup database regularly
- Monitor disk space and resources
- Keep SSL certificates updated

## Additional Resources

- [Production Features Documentation](PRODUCTION_FEATURES.md)
- [API Documentation](API.md)
- [Stripe Documentation](https://stripe.com/docs)
- [Moyasar Documentation](https://moyasar.com/docs/)

---

For issues or questions, contact: support@laghhu.link
