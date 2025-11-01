#!/bin/bash

# Update Nginx configuration for SPA routing
# This script fixes the routing issues when refreshing pages like /dashboard

echo "Updating Nginx configuration for SPA routing..."

# Backup current configuration
sudo cp /etc/nginx/sites-available/url-shortener /etc/nginx/sites-available/url-shortener.backup.$(date +%Y%m%d_%H%M%S)

# Copy the updated configuration
sudo cp /home/ubuntu/url-shortener/scripts/nginx-custom-domains.conf /etc/nginx/sites-available/url-shortener

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
    sudo cp /etc/nginx/sites-available/url-shortener.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/url-shortener
    exit 1
fi

# Check if Nginx is running
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running properly"
else
    echo "❌ Nginx is not running. Starting..."
    sudo systemctl start nginx
fi

echo "Done! Try refreshing /dashboard now."