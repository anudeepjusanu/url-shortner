# Azure VM Deployment Guide

This guide will help you deploy your URL Shortener application to an Azure Virtual Machine using GitHub Actions.

## 🏗️ Prerequisites

1. **Azure Account** with an active subscription
2. **GitHub Repository** with your code
3. **Domain name** (optional but recommended)

## 🚀 Step-by-Step Deployment

### 1. Create Azure Virtual Machine

1. **Log into Azure Portal** (portal.azure.com)
2. **Create a new Virtual Machine**:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Standard B2s (2 vCPUs, 4 GB RAM) minimum
   - **Authentication**: SSH public key
   - **Inbound ports**: Allow SSH (22), HTTP (80), HTTPS (443)

3. **Note down**:
   - VM Public IP address
   - Username (usually `azureuser`)
   - Download the private key (.pem file)

### 2. Set Up Azure VM

1. **Connect to your VM**:
   ```bash
   ssh -i your-key.pem azureuser@your-vm-ip
   ```

2. **Run the setup script**:
   ```bash
   curl -sSL https://raw.githubusercontent.com/YOUR-USERNAME/url-shortener/main/scripts/setup-azure-vm.sh | bash
   ```

   Or manually:
   ```bash
   wget https://raw.githubusercontent.com/YOUR-USERNAME/url-shortener/main/scripts/setup-azure-vm.sh
   chmod +x setup-azure-vm.sh
   ./setup-azure-vm.sh
   ```

3. **Complete PM2 setup**:
   ```bash
   # Run the command that PM2 displays (something like):
   sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u azureuser --hp /home/azureuser
   ```

### 3. Configure Environment

1. **Update Nginx configuration** with your domain:
   ```bash
   sudo nano /etc/nginx/sites-available/url-shortener
   # Replace 'your-domain.com' with your actual domain
   ```

2. **Create production environment file**:
   ```bash
   sudo nano /var/www/url-shortener/.env
   ```

   Copy from `.env.production` and update:
   ```env
   NODE_ENV=production
   PORT=3015
   MONGODB_URI=mongodb://localhost:27017/url-shortener-prod
   JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
   REDIS_URL=redis://localhost:6379
   ALLOWED_ORIGINS=https://yourdomain.com
   CNAME_TARGET=cname.yourdomain.com
   ```

### 4. Configure GitHub Secrets

1. **Go to your GitHub repository**
2. **Settings → Secrets and variables → Actions**
3. **Add these secrets**:

   - **AZURE_VM_HOST**: Your VM's public IP address
   - **AZURE_VM_USERNAME**: `azureuser` (or your VM username)
   - **AZURE_VM_SSH_KEY**: Contents of your private key (.pem file)

   ```bash
   # To get the SSH key content:
   cat your-key.pem
   # Copy the entire output including -----BEGIN and -----END lines
   ```

### 5. Set Up SSL Certificate (Optional but Recommended)

```bash
# Install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Configure DNS

1. **Point your domain to Azure VM**:
   - A record: `yourdomain.com` → `your-vm-ip`
   - A record: `www.yourdomain.com` → `your-vm-ip`

2. **For custom domains feature**:
   - CNAME record: `cname.yourdomain.com` → `yourdomain.com`

## 🔄 Deployment Process

1. **Push code to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to Azure"
   git push origin main
   ```

2. **GitHub Actions will**:
   - Run tests
   - Build frontend
   - Deploy to Azure VM
   - Restart the application

3. **Monitor deployment**:
   - Check GitHub Actions tab for deployment status
   - SSH to VM and check logs: `pm2 logs url-shortener`

## 🛠️ Post-Deployment

### Check Services
```bash
# Check application status
pm2 status

# Check logs
pm2 logs url-shortener

# Check system services
sudo systemctl status mongod
sudo systemctl status redis
sudo systemctl status nginx

# Check application health
curl http://localhost:3015/health
```

### Useful Commands
```bash
# Restart application
pm2 restart url-shortener

# View application logs
pm2 logs url-shortener --lines 50

# Monitor application
pm2 monit

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx configuration
sudo nginx -t
```

## 🔧 Troubleshooting

### Common Issues

1. **Deployment fails**:
   - Check GitHub Actions logs
   - Verify SSH connection: `ssh -i your-key.pem azureuser@your-vm-ip`
   - Check disk space: `df -h`

2. **Application won't start**:
   - Check environment variables: `cat /var/www/url-shortener/.env`
   - Check database connection: `mongo --eval "db.stats()"`
   - Check Redis: `redis-cli ping`

3. **Nginx errors**:
   - Check configuration: `sudo nginx -t`
   - Check logs: `sudo tail -f /var/log/nginx/error.log`

4. **Database connection issues**:
   - Ensure MongoDB is running: `sudo systemctl status mongod`
   - Check network configuration
   - Verify connection string in `.env`

### Monitoring
```bash
# Set up monitoring with PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View resource usage
htop
pm2 monit
```

## 🔒 Security Checklist

- ✅ SSH key authentication (no passwords)
- ✅ Firewall configured (UFW)
- ✅ SSL certificate installed
- ✅ Environment variables secured
- ✅ MongoDB access restricted
- ✅ Regular security updates

## 🚀 Production Optimizations

1. **Database optimization**:
   ```bash
   # Configure MongoDB for production
   sudo nano /etc/mongod.conf
   # Add appropriate settings for your use case
   ```

2. **Redis optimization**:
   ```bash
   # Configure Redis memory settings
   sudo nano /etc/redis/redis.conf
   ```

3. **Node.js clustering**:
   ```javascript
   // Update ecosystem.config.js
   instances: 'max', // Use all CPU cores
   exec_mode: 'cluster'
   ```

## 🆘 Support

If you encounter issues:
1. Check the logs with `pm2 logs url-shortener`
2. Verify services are running
3. Check GitHub Actions deployment logs
4. Review this guide for missed steps

Your URL Shortener should now be live at `https://yourdomain.com`! 🎉