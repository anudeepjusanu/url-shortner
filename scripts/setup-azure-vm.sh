#!/bin/bash

# Azure VM Setup Script for URL Shortener
# Run this script on your fresh Ubuntu VM

set -e

echo "🚀 Setting up Azure VM for URL Shortener deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install MongoDB
echo "📦 Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Redis
echo "📦 Installing Redis..."
sudo apt-get install -y redis-server

# Configure Redis
sudo sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
sudo systemctl restart redis.service
sudo systemctl enable redis

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/url-shortener
sudo chown -R $USER:$USER /var/www/url-shortener

# Create logs directory
mkdir -p /var/www/url-shortener/logs

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Setup PM2 startup script
echo "⚡ Setting up PM2 startup..."
pm2 startup
# Note: You'll need to run the command that PM2 outputs

# Create Nginx configuration
echo "🌐 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/url-shortener << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend files
    location / {
        root /var/www/url-shortener/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3015;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3015;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Short URL redirects (catch-all for short codes)
    location ~ ^/[a-zA-Z0-9]+$ {
        proxy_pass http://localhost:3015;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets with long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/url-shortener/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/url-shortener /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "✅ Azure VM setup completed!"
echo ""
echo "🔧 Next steps:"
echo "1. Update the Nginx configuration with your actual domain name"
echo "2. Run the PM2 startup command that was displayed above"
echo "3. Copy your .env.production file to /var/www/url-shortener/.env"
echo "4. Set up SSL with: sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
echo "5. Configure GitHub secrets for deployment"
echo ""
echo "📋 Services status:"
echo "• MongoDB: $(sudo systemctl is-active mongod)"
echo "• Redis: $(sudo systemctl is-active redis)"
echo "• Nginx: $(sudo systemctl is-active nginx)"