# Deploying Snip API Documentation to Mintlify

## Prerequisites

- GitHub account
- Mintlify account (sign up at [mintlify.com](https://mintlify.com))
- Git repository with this documentation

## Deployment Steps

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add mintlify-docs/
   git commit -m "Add Mintlify documentation"
   git push origin main
   ```

2. **Connect to Mintlify**
   - Go to [mintlify.com](https://mintlify.com)
   - Click "Sign in with GitHub"
   - Authorize Mintlify to access your repository

3. **Create New Project**
   - Click "New Project"
   - Select your repository
   - Set documentation path to `mintlify-docs`
   - Click "Deploy"

4. **Configure Custom Domain (Optional)**
   - Go to Project Settings
   - Add custom domain (e.g., `docs.snip.sa`)
   - Add CNAME record: `docs.snip.sa` → `cname.mintlify.com`
   - Verify domain

### Method 2: Mintlify CLI

1. **Install Mintlify CLI**
   ```bash
   npm install -g mintlify
   ```

2. **Login to Mintlify**
   ```bash
   mintlify login
   ```

3. **Deploy**
   ```bash
   cd mintlify-docs
   mintlify deploy
   ```

## Local Development

Preview documentation locally before deploying:

```bash
cd mintlify-docs
mintlify dev
```

Open http://localhost:3000 in your browser.

## Continuous Deployment

Mintlify automatically deploys when you push to your main branch.

### GitHub Actions (Optional)

Create `.github/workflows/mintlify.yml`:

```yaml
name: Deploy Mintlify Docs

on:
  push:
    branches: [main]
    paths:
      - 'mintlify-docs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Mintlify
        run: |
          npm install -g mintlify
          cd mintlify-docs
          mintlify deploy
        env:
          MINTLIFY_API_KEY: ${{ secrets.MINTLIFY_API_KEY }}
```

## Custom Domain Setup

1. **Add Domain in Mintlify**
   - Project Settings → Custom Domain
   - Enter your domain (e.g., `docs.snip.sa`)

2. **Configure DNS**
   Add CNAME record:
   ```
   Type: CNAME
   Name: docs
   Value: cname.mintlify.com
   TTL: 3600
   ```

3. **Verify Domain**
   - Wait for DNS propagation (15-30 minutes)
   - Click "Verify" in Mintlify dashboard
   - SSL certificate will be automatically provisioned

## Environment Variables

If using API keys in documentation examples:

1. Create `.env` file (not committed):
   ```
   SNIP_API_KEY=your_api_key_here
   ```

2. Use in examples:
   ```javascript
   const API_KEY = process.env.SNIP_API_KEY;
   ```

## Updating Documentation

1. **Edit Files**
   - Modify `.mdx` files in `mintlify-docs/`
   - Update `mint.json` for navigation changes

2. **Test Locally**
   ```bash
   mintlify dev
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "Update documentation"
   git push origin main
   ```

Mintlify will automatically deploy your changes.

## Troubleshooting

### Build Fails

- Check `mint.json` syntax
- Verify all referenced files exist
- Check for broken internal links

### Images Not Loading

- Place images in `mintlify-docs/images/`
- Reference as `/images/filename.png`
- Supported formats: PNG, JPG, SVG, GIF

### Navigation Not Updating

- Clear browser cache
- Check `mint.json` navigation structure
- Verify file paths are correct

## Support

- Mintlify Documentation: https://mintlify.com/docs
- Mintlify Discord: https://discord.gg/mintlify
- Email: support@nawah.sa

## Post-Deployment Checklist

- [ ] Documentation is accessible at your URL
- [ ] All pages load correctly
- [ ] API playground works
- [ ] Search functionality works
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Team members have access
