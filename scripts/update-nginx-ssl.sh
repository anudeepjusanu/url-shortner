#!/bin/bash

# Update Nginx configuration for SPA routing with SSL support
# This script fixes the routing issues when refreshing pages like /dashboard

echo "Updating Nginx configuration for SPA routing with SSL..."

# Backup current configuration
sudo cp /etc/nginx/sites-available/url-shortener /etc/nginx/sites-available/url-shortener.backup.$(date +%Y%m%d_%H%M%S)

# Copy the updated SSL-compatible configuration
sudo cp /var/www/url-shortener/scripts/fix-nginx-ssl.conf /etc/nginx/sites-available/url-shortener

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Reloading..."
    sudo systemctl reload nginx
    echo "✅ Nginx configuration updated successfully!"
    echo "SPA routes like /dashboard should now work when refreshed."
else
    echo "❌ Nginx configuration test failed. Rolling back..."
    # Find the most recent backup
    BACKUP_FILE=$(ls -t /etc/nginx/sites-available/url-shortener.backup.* | head -1)
    sudo cp "$BACKUP_FILE" /etc/nginx/sites-available/url-shortener
    echo "Rolled back to: $BACKUP_FILE"
    exit 1
fi

# Check if Nginx is running
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running properly"
else
    echo "❌ Nginx is not running. Starting..."
    sudo systemctl start nginx
fi

echo "Done! Try refreshing https://laghhu.link/dashboard now."